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
      return NextResponse.json({ success: false, error: 'AI Coach is available on Pro plan only.', code: 'PRO_REQUIRED' }, { status: 403 })
    }

    const rateLimit = await checkRateLimit(user.id, 'coach')
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again in 1 hour.', code: 'RATE_LIMIT_EXCEEDED' }, { status: 429 })
    }

    const { locale } = await req.json()

    const { data: trades } = await supabase
      .from('trades')
      .select('date, pair, setup, direction, result, rr, profit_usd, comment, self_grade, emotion, mae_price, mfe_price, entry_price, stop_price, take_price, risk_pct')
      .eq('user_id', user.id)
      .eq('status', 'closed')
      .order('date', { ascending: false })
      .limit(50)

    if (!trades || trades.length === 0) {
      return NextResponse.json({ success: false, error: 'No trades to analyze', code: 'NO_DATA' }, { status: 400 })
    }

    const wins      = trades.filter(t => t.result === 'Тейк').length
    const losses    = trades.filter(t => t.result === 'Стоп').length
    const be        = trades.filter(t => t.result === 'БУ').length
    const win_rate  = Math.round((wins / trades.length) * 100)
    const total_pnl = trades.reduce((s, t) => s + (t.profit_usd || 0), 0)
    const avg_rr    = (trades.reduce((s, t) => s + (t.rr || 0), 0) / trades.length).toFixed(2)
    const avg_risk  = trades.filter(t => t.risk_pct).length
      ? (trades.filter(t => t.risk_pct).reduce((s, t) => s + (t.risk_pct || 0), 0) / trades.filter(t => t.risk_pct).length).toFixed(2)
      : null

    // Profit factor
    const grossWins   = trades.filter(t => (t.profit_usd || 0) > 0).reduce((s, t) => s + (t.profit_usd || 0), 0)
    const grossLosses = Math.abs(trades.filter(t => (t.profit_usd || 0) < 0).reduce((s, t) => s + (t.profit_usd || 0), 0))
    const profitFactor = grossLosses > 0 ? (grossWins / grossLosses).toFixed(2) : 'N/A'

    // Max drawdown (consecutive losses)
    let maxDD = 0, currentDD = 0
    trades.slice().reverse().forEach(t => {
      if (t.result === 'Стоп') { currentDD += Math.abs(t.profit_usd || 0); maxDD = Math.max(maxDD, currentDD) }
      else currentDD = 0
    })

    // Setup breakdown
    const setupStats: Record<string, { total: number; wins: number; pnl: number; rr: number[] }> = {}
    trades.forEach(t => {
      if (!setupStats[t.setup]) setupStats[t.setup] = { total: 0, wins: 0, pnl: 0, rr: [] }
      setupStats[t.setup].total++
      if (t.result === 'Тейк') setupStats[t.setup].wins++
      setupStats[t.setup].pnl += t.profit_usd || 0
      if (t.rr) setupStats[t.setup].rr.push(t.rr)
    })
    const setupBreakdown = Object.entries(setupStats)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([s, v]) => {
        const avgRR = v.rr.length ? (v.rr.reduce((a, b) => a + b, 0) / v.rr.length).toFixed(1) : '-'
        return `${s}: ${v.total} trades | WR ${Math.round(v.wins / v.total * 100)}% | P&L ${v.pnl.toFixed(2)}$ | Avg RR ${avgRR}`
      }).join('\n')

    // Pair breakdown
    const pairStats: Record<string, { total: number; wins: number; pnl: number }> = {}
    trades.forEach(t => {
      if (!pairStats[t.pair]) pairStats[t.pair] = { total: 0, wins: 0, pnl: 0 }
      pairStats[t.pair].total++
      if (t.result === 'Тейк') pairStats[t.pair].wins++
      pairStats[t.pair].pnl += t.profit_usd || 0
    })
    const pairBreakdown = Object.entries(pairStats)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 8)
      .map(([p, v]) => `${p}: ${v.total} trades | WR ${Math.round(v.wins / v.total * 100)}% | ${v.pnl.toFixed(2)}$`)
      .join('\n')

    // Emotion stats
    const emotionStats: Record<string, { total: number; wins: number; pnl: number }> = {}
    trades.forEach(t => {
      if (t.emotion) {
        if (!emotionStats[t.emotion]) emotionStats[t.emotion] = { total: 0, wins: 0, pnl: 0 }
        emotionStats[t.emotion].total++
        if (t.result === 'Тейк') emotionStats[t.emotion].wins++
        emotionStats[t.emotion].pnl += t.profit_usd || 0
      }
    })
    const emotionBreakdown = Object.entries(emotionStats)
      .map(([e, s]) => `${e}: ${s.total} trades | ${Math.round(s.wins / s.total * 100)}% WR | ${s.pnl.toFixed(2)}$`)
      .join('\n')

    // Direction breakdown
    const longTrades  = trades.filter(t => t.direction === 'Long')
    const shortTrades = trades.filter(t => t.direction === 'Short')
    const longWR  = longTrades.length  ? Math.round(longTrades.filter(t => t.result === 'Тейк').length / longTrades.length * 100) : 0
    const shortWR = shortTrades.length ? Math.round(shortTrades.filter(t => t.result === 'Тейк').length / shortTrades.length * 100) : 0

    // Playbook compliance
    const { data: ruleChecks } = await supabase.from('trade_rule_checks').select('followed')
    const totalChecks    = ruleChecks?.length || 0
    const followedChecks = ruleChecks?.filter((r: any) => r.followed).length || 0
    const playbookCompliance = totalChecks > 0 ? Math.round((followedChecks / totalChecks) * 100) : null

    // Journal
    const { data: journalNotes } = await supabase
      .from('daily_notes')
      .select('date, mood, content, mistakes')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(7)

    const journalSummary = journalNotes?.length
      ? journalNotes.map(n => `${n.date} | mood:${n.mood}/5 | ${n.content?.slice(0, 80) || '-'} | mistakes: ${n.mistakes?.slice(0, 80) || '-'}`).join('\n')
      : null

    const lang = locale === 'uk' ? 'Ukrainian' : 'English'
    const openai = getOpenAI()

    const prompt = `You are a Senior Trading Coach and performance analyst at a top-tier proprietary trading firm. You have analyzed thousands of trading journals and identified the exact patterns that separate consistently profitable traders from those who struggle. Your analysis is data-driven, brutally honest, and immediately actionable.

ANALYSIS FRAMEWORK — follow this exact structure:
1. PERFORMANCE SUMMARY — quantify what's working and what isn't with exact numbers
2. STRENGTHS — identify 1-2 genuine edges this trader has (must be backed by data)
3. CRITICAL WEAKNESSES — the top 2-3 patterns killing profitability right now
4. SETUP ANALYSIS — which setups are edge-positive vs edge-negative and why
5. RISK & DISCIPLINE — is risk management consistent? Where is it breaking down?
6. EMOTIONAL PATTERNS — how emotions are impacting execution and outcomes
7. PRIORITY ACTION PLAN — 4 specific, measurable steps ordered by impact

TRADER STATISTICS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total trades: ${trades.length} | Wins: ${wins} | Losses: ${losses} | BE: ${be}
Win rate: ${win_rate}% | Avg RR: ${avg_rr} | Profit Factor: ${profitFactor}
Total P&L: ${total_pnl.toFixed(2)}$ | Max drawdown sequence: ${maxDD.toFixed(2)}$
${avg_risk ? `Average risk per trade: ${avg_risk}%` : ''}
Long: ${longTrades.length} trades | ${longWR}% WR
Short: ${shortTrades.length} trades | ${shortWR}% WR
${playbookCompliance !== null ? `Playbook compliance: ${playbookCompliance}% (${followedChecks}/${totalChecks} rules followed)` : ''}

SETUP PERFORMANCE:
${setupBreakdown || 'No setup data'}

PAIR PERFORMANCE:
${pairBreakdown || 'No pair data'}

EMOTIONAL PERFORMANCE:
${emotionBreakdown || 'No emotion data'}

ALL TRADES (last ${trades.length}):
${trades.map(t => `${t.date} | ${t.pair} | ${t.setup} | ${t.direction} | ${t.result} | RR:${t.rr} | ${t.profit_usd}$ | Risk:${t.risk_pct || '-'}% | Grade:${t.self_grade || '-'} | Emotion:${t.emotion || '-'} | "${t.comment || ''}"`).join('\n')}
${journalSummary ? `\nJOURNAL (last 7 days):\n${journalSummary}` : ''}

Write all text values in ${lang}. Respond ONLY with JSON, no markdown:
{
  "performance_summary": "quantified summary of current performance period with specific numbers (3-4 sentences)",
  "main_strength": "the trader's most significant proven edge with data to support it (2-3 sentences)",
  "main_error": "the single biggest pattern costing money right now with specific trade examples (3-4 sentences)",
  "best_setup": "best performing setup with exact stats and why it works structurally (2-3 sentences)",
  "worst_setup": "worst performing setup with exact stats and specific reason it fails (2-3 sentences)",
  "risk_management": "detailed risk management assessment — consistency, position sizing, stop discipline (3-4 sentences)",
  "discipline": "discipline grade A/B/C/D with detailed reasoning including playbook compliance if available (2-3 sentences)",
  "emotion_insight": "most impactful emotional pattern found in data with correlation to outcomes (3-4 sentences)",
  "long_vs_short": "performance difference between long and short trades and what it reveals (2 sentences)",
  "action_steps": [
    "Step 1: [specific measurable action] — expected impact: [what metric improves]",
    "Step 2: [specific measurable action] — expected impact: [what metric improves]",
    "Step 3: [specific measurable action] — expected impact: [what metric improves]",
    "Step 4: [specific measurable action] — expected impact: [what metric improves]"
  ]
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
      user_id: user.id, type: 'coach', trade_id: null, prompt, response: content,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, code: 'AI_ERROR' }, { status: 500 })
  }
}
