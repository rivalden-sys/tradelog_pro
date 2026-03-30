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
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Try again in 1 hour.',
        code: 'RATE_LIMIT_EXCEEDED',
      }, { status: 429 })
    }

    const { locale } = await req.json()

    // Trades з emotion та comment
    const { data: trades } = await supabase
      .from('trades')
      .select('date, pair, direction, result, profit_usd, comment, self_grade, emotion, setup')
      .eq('user_id', user.id)
      .eq('status', 'closed')
      .order('date', { ascending: false })
      .limit(50)

    if (!trades || trades.length === 0) {
      return NextResponse.json({ success: false, error: 'No trades to analyze', code: 'NO_DATA' }, { status: 400 })
    }

    // Emotion статистика
    const emotionStats: Record<string, { total: number; wins: number; pnl: number }> = {}
    trades.forEach(t => {
      if (t.emotion) {
        if (!emotionStats[t.emotion]) emotionStats[t.emotion] = { total: 0, wins: 0, pnl: 0 }
        emotionStats[t.emotion].total++
        if (t.result === 'Тейк') emotionStats[t.emotion].wins++
        emotionStats[t.emotion].pnl += t.profit_usd || 0
      }
    })
    const emotionSummary = Object.entries(emotionStats)
      .map(([e, s]) => `${e}: ${s.total} trades, win rate ${Math.round(s.wins / s.total * 100)}%, P&L ${s.pnl.toFixed(2)}$`)
      .join('\n')

    // Revenge trades — emotion=revenge або послідовні стопи
    const revengeCount = trades.filter(t => t.emotion === 'revenge').length
    let consecutiveLosses = 0
    let maxConsecutive = 0
    trades.slice().reverse().forEach(t => {
      if (t.result === 'Стоп') { consecutiveLosses++; maxConsecutive = Math.max(maxConsecutive, consecutiveLosses) }
      else consecutiveLosses = 0
    })

    // Playbook порушення
    const { data: ruleChecks } = await supabase
      .from('trade_rule_checks')
      .select('followed, trade_id')

    const totalChecks    = ruleChecks?.length || 0
    const violatedChecks = ruleChecks?.filter(r => !r.followed).length || 0
    const playbookViolationRate = totalChecks > 0 ? Math.round((violatedChecks / totalChecks) * 100) : null

    // Daily journal mood trend
    const { data: journalNotes } = await supabase
      .from('daily_notes')
      .select('date, mood, mistakes')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(14)

    const avgMood = journalNotes?.length
      ? (journalNotes.reduce((s, n) => s + (n.mood || 3), 0) / journalNotes.length).toFixed(1)
      : null

    const mistakesList = journalNotes?.filter(n => n.mistakes).map(n => `${n.date}: ${n.mistakes?.slice(0, 80)}`).join('\n') || null

    const lang = locale === 'uk' ? 'Ukrainian' : 'English'
    const openai = getOpenAI()

    const prompt = `You are a professional trading psychologist. Analyze the trader's psychological patterns based on their trading data, emotions, and journal. Write all text values in ${lang}.

Emotional data:
${emotionSummary || 'No emotion data recorded yet'}

Key psychological indicators:
- Revenge trades (emotion=revenge): ${revengeCount}
- Max consecutive losses: ${maxConsecutive}
${playbookViolationRate !== null ? `- Playbook rule violations: ${playbookViolationRate}% of checks` : ''}
${avgMood !== null ? `- Average journal mood (1-5): ${avgMood}/5` : ''}

Trades with comments (last ${trades.length}):
${trades.map(t => `${t.date} | ${t.pair} | ${t.direction} | ${t.result} | ${t.profit_usd}$ | Emotion:${t.emotion || 'none'} | Grade:${t.self_grade || '-'} | "${t.comment || ''}"`).join('\n')}
${mistakesList ? `\nSelf-reported mistakes from journal:\n${mistakesList}` : ''}

Identify psychological patterns. Focus on:
1. Emotional state correlation with win/loss
2. Revenge trading behavior
3. Fear/greed patterns
4. Rule-breaking under stress
5. Mood impact on trading decisions

Respond ONLY with JSON, no markdown:
{
  "patterns": [
    {
      "pattern": "pattern name",
      "severity": "high" or "medium" or "low",
      "evidence": "specific examples from data (1-2 sentences)",
      "action": "what to do to fix it (1-2 sentences)"
    }
  ],
  "summary": "overall psychological profile including emotional tendencies (3-4 sentences)",
  "top_risk": "main psychological risk right now based on emotion and behavior data (1-2 sentences)"
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
      user_id:  user.id,
      type:     'psychology',
      trade_id: null,
      prompt,
      response: content,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, code: 'AI_ERROR' }, { status: 500 })
  }
}
