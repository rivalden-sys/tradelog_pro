import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, AI_MODEL, AI_TEMP, AI_MAX_TOKENS } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .single()
    if (profile?.plan !== 'pro') {
      return NextResponse.json({ success: false, error: 'AI Psychology is available on Pro plan only.', code: 'PRO_REQUIRED' }, { status: 403 })
    }

    const rateLimit = await checkRateLimit(user.id, 'psychology')
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again in 1 hour.', code: 'RATE_LIMIT_EXCEEDED' }, { status: 429 })
    }

    const { locale } = await req.json()

    const { data: trades } = await supabase
      .from('trades')
      .select('date, pair, direction, result, profit_usd, rr, comment, self_grade, emotion, setup, risk_pct')
      .eq('user_id', user.id)
      .eq('status', 'closed')
      .order('date', { ascending: false })
      .limit(50)

    if (!trades || trades.length === 0) {
      return NextResponse.json({ success: false, error: 'No trades to analyze', code: 'NO_DATA' }, { status: 400 })
    }

    // Emotion stats with P&L
    const emotionStats: Record<string, { total: number; wins: number; pnl: number; avgRR: number[] }> = {}
    trades.forEach(t => {
      if (t.emotion) {
        if (!emotionStats[t.emotion]) emotionStats[t.emotion] = { total: 0, wins: 0, pnl: 0, avgRR: [] }
        emotionStats[t.emotion].total++
        if (t.result === 'Тейк') emotionStats[t.emotion].wins++
        emotionStats[t.emotion].pnl += t.profit_usd || 0
        if (t.rr) emotionStats[t.emotion].avgRR.push(t.rr)
      }
    })
    const emotionBreakdown = Object.entries(emotionStats)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([e, s]) => {
        const avgRR = s.avgRR.length ? (s.avgRR.reduce((a, b) => a + b, 0) / s.avgRR.length).toFixed(1) : '-'
        return `${e}: ${s.total} trades | ${Math.round(s.wins / s.total * 100)}% WR | P&L ${s.pnl.toFixed(2)}$ | Avg RR ${avgRR}`
      }).join('\n')

    // Revenge trades
    const revengeCount = trades.filter(t => t.emotion === 'revenge').length
    const revengePnl   = trades.filter(t => t.emotion === 'revenge').reduce((s, t) => s + (t.profit_usd || 0), 0)

    // Consecutive losses analysis
    let maxConsecutiveLosses = 0, currentLoss = 0
    let maxConsecutiveWins = 0, currentWin = 0
    trades.slice().reverse().forEach(t => {
      if (t.result === 'Стоп') { currentLoss++; maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLoss); currentWin = 0 }
      else if (t.result === 'Тейк') { currentWin++; maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWin); currentLoss = 0 }
      else { currentLoss = 0; currentWin = 0 }
    })

    // Grade self-assessment accuracy
    const gradedTrades = trades.filter(t => t.self_grade)
    const gradeAccuracy = gradedTrades.length > 0 ? {
      A: gradedTrades.filter(t => t.self_grade === 'A').length,
      B: gradedTrades.filter(t => t.self_grade === 'B').length,
      C: gradedTrades.filter(t => t.self_grade === 'C').length,
      D: gradedTrades.filter(t => t.self_grade === 'D').length,
      AwinRate: gradedTrades.filter(t => t.self_grade === 'A').length
        ? Math.round(gradedTrades.filter(t => t.self_grade === 'A' && t.result === 'Тейк').length / gradedTrades.filter(t => t.self_grade === 'A').length * 100) : 0,
      DwinRate: gradedTrades.filter(t => t.self_grade === 'D').length
        ? Math.round(gradedTrades.filter(t => t.self_grade === 'D' && t.result === 'Тейк').length / gradedTrades.filter(t => t.self_grade === 'D').length * 100) : 0,
    } : null

    // After-loss behavior (next trade after a loss)
    const tradeList = trades.slice().reverse()
    let afterLossWins = 0, afterLossTotal = 0
    for (let i = 0; i < tradeList.length - 1; i++) {
      if (tradeList[i].result === 'Стоп') {
        afterLossTotal++
        if (tradeList[i + 1].result === 'Тейк') afterLossWins++
      }
    }
    const afterLossWR = afterLossTotal > 0 ? Math.round(afterLossWins / afterLossTotal * 100) : null

    // Playbook violations — filtered by user_id
    const { data: ruleChecks } = await supabase
      .from('trade_rule_checks')
      .select('followed')
      .eq('user_id', user.id)
    const totalChecks    = ruleChecks?.length || 0
    const violatedChecks = ruleChecks?.filter(r => !r.followed).length || 0
    const playbookViolationRate = totalChecks > 0 ? Math.round((violatedChecks / totalChecks) * 100) : null

    // Journal mood analysis
    const { data: journalNotes } = await supabase
      .from('daily_notes')
      .select('date, mood, mistakes')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(14)

    const avgMood      = journalNotes?.length ? (journalNotes.reduce((s, n) => s + (n.mood || 3), 0) / journalNotes.length).toFixed(1) : null
    const lowMoodDays  = journalNotes?.filter(n => n.mood <= 2).length || 0
    const mistakesList = journalNotes?.filter(n => n.mistakes).map(n => `${n.date}: ${n.mistakes?.slice(0, 100)}`).join('\n') || null

    const lang = locale === 'uk' ? 'Ukrainian' : 'English'
    const openai = getOpenAI()

    const prompt = `You are a professional trading psychologist with expertise in behavioral finance and cognitive biases. You combine data-driven analysis with deep psychological insight to identify the exact mental patterns sabotaging a trader's performance. Your approach is clinical, precise, and compassionate — you name problems clearly but always provide the path forward.

PSYCHOLOGICAL ASSESSMENT FRAMEWORK:
- Analyze emotional state correlation with actual trading outcomes
- Identify cognitive biases (loss aversion, overconfidence, FOMO, revenge trading)
- Assess self-awareness accuracy (do their grades match reality?)
- Evaluate behavioral patterns after wins and losses
- Identify stress indicators and their trading impact

TRADER PSYCHOLOGICAL DATA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total trades: ${trades.length}
Revenge trades: ${revengeCount} (${trades.length > 0 ? Math.round(revengeCount / trades.length * 100) : 0}% of all trades) | Revenge P&L: ${revengePnl.toFixed(2)}$
Max consecutive losses: ${maxConsecutiveLosses} | Max consecutive wins: ${maxConsecutiveWins}
Win rate after a loss: ${afterLossWR !== null ? `${afterLossWR}% (${afterLossTotal} instances)` : 'N/A'}
${playbookViolationRate !== null ? `Rule violation rate: ${playbookViolationRate}% (${violatedChecks}/${totalChecks} checks)` : ''}
${avgMood !== null ? `Average mood: ${avgMood}/5 | Low mood days (≤2): ${lowMoodDays}` : ''}
${gradeAccuracy ? `Self-grading: A(${gradeAccuracy.A} trades, ${gradeAccuracy.AwinRate}% WR) | B(${gradeAccuracy.B}) | C(${gradeAccuracy.C}) | D(${gradeAccuracy.D} trades, ${gradeAccuracy.DwinRate}% WR)` : ''}

EMOTIONAL STATE vs PERFORMANCE:
${emotionBreakdown || 'No emotion data recorded'}

ALL TRADES WITH CONTEXT:
${trades.map(t => `${t.date} | ${t.pair} | ${t.direction} | ${t.result} | RR:${t.rr} | ${t.profit_usd}$ | Emotion:${t.emotion || '-'} | Grade:${t.self_grade || '-'} | "${t.comment || ''}"`).join('\n')}
${mistakesList ? `\nSELF-REPORTED MISTAKES:\n${mistakesList}` : ''}

Write all text values in ${lang}. Respond ONLY with JSON, no markdown:
{
  "psychological_profile": "comprehensive psychological profile of this trader — their dominant mental tendencies, self-awareness level, and emotional regulation ability (4-5 sentences)",
  "top_risk": "the single most dangerous psychological pattern right now and its measurable cost in P&L (2-3 sentences)",
  "patterns": [
    {
      "pattern": "pattern name (e.g. Revenge Trading, Loss Aversion, Overconfidence after wins)",
      "severity": "critical" or "high" or "medium" or "low",
      "evidence": "specific data points proving this pattern exists (2-3 sentences with numbers)",
      "cognitive_bias": "the underlying cognitive bias driving this behavior",
      "technique": "specific evidence-based technique to address this (2-3 actionable sentences)"
    }
  ],
  "self_awareness_score": "assessment of how accurately the trader judges their own trades — do their grades align with results? (2 sentences)",
  "after_loss_behavior": "analysis of how this trader behaves after losses — do they recover well or spiral? (2 sentences)",
  "strengths": "genuine psychological strengths this trader demonstrates in the data (2 sentences)",
  "weekly_practice": ["specific daily/weekly mental practice 1", "specific daily/weekly mental practice 2", "specific daily/weekly mental practice 3"]
}`

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      temperature: AI_TEMP,
      max_tokens: AI_MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('Empty AI response')
    const result = JSON.parse(content)

    await supabase.from('ai_sessions').insert({
      user_id: user.id, type: 'psychology', trade_id: null, prompt, response: content,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (e) {
    console.error('AI psychology error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error', code: 'AI_ERROR' }, { status: 500 })
  }
}
