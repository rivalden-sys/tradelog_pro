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
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Try again in 1 hour.',
        code: 'RATE_LIMIT_EXCEEDED',
      }, { status: 429 })
    }

    const { locale } = await req.json()

    // Trades з emotion
    const { data: trades } = await supabase
      .from('trades')
      .select('date, pair, setup, direction, result, rr, profit_usd, comment, self_grade, emotion')
      .eq('user_id', user.id)
      .eq('status', 'closed')
      .order('date', { ascending: false })
      .limit(50)

    if (!trades || trades.length === 0) {
      return NextResponse.json({ success: false, error: 'No trades to analyze', code: 'NO_DATA' }, { status: 400 })
    }

    // Playbook compliance статистика
    const { data: ruleChecks } = await supabase
      .from('trade_rule_checks')
      .select('followed, trade_id')
      .in('trade_id', trades.map(t => t.trade_id).filter(Boolean))

    const totalChecks   = ruleChecks?.length || 0
    const followedChecks = ruleChecks?.filter(r => r.followed).length || 0
    const playbookCompliance = totalChecks > 0 ? Math.round((followedChecks / totalChecks) * 100) : null

    // Playbook wins vs violations
    const { data: tradeRuleData } = await supabase
      .from('trade_rule_checks')
      .select('trade_id, followed')

    const tradeCompliance: Record<string, boolean> = {}
    if (tradeRuleData?.length) {
      const grouped: Record<string, boolean[]> = {}
      tradeRuleData.forEach(r => {
        if (!grouped[r.trade_id]) grouped[r.trade_id] = []
        grouped[r.trade_id].push(r.followed)
      })
      Object.entries(grouped).forEach(([tid, checks]) => {
        tradeCompliance[tid] = checks.every(c => c)
      })
    }

    // Emotion статистика
    const emotionStats: Record<string, { total: number; wins: number }> = {}
    trades.forEach(t => {
      if (t.emotion) {
        if (!emotionStats[t.emotion]) emotionStats[t.emotion] = { total: 0, wins: 0 }
        emotionStats[t.emotion].total++
        if (t.result === 'Тейк') emotionStats[t.emotion].wins++
      }
    })
    const emotionSummary = Object.entries(emotionStats)
      .map(([e, s]) => `${e}: ${s.total} trades, win rate ${Math.round(s.wins / s.total * 100)}%`)
      .join(' | ')

    // Daily journal — останні 7 записів
    const { data: journalNotes } = await supabase
      .from('daily_notes')
      .select('date, mood, content, mistakes')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(7)

    const journalSummary = journalNotes?.length
      ? journalNotes.map(n => `${n.date} | mood:${n.mood}/5 | ${n.content ? n.content.slice(0, 80) : '-'} | mistakes: ${n.mistakes ? n.mistakes.slice(0, 60) : '-'}`).join('\n')
      : null

    const wins      = trades.filter(t => t.result === 'Тейк').length
    const win_rate  = Math.round((wins / trades.length) * 100)
    const total_pnl = trades.reduce((s, t) => s + (t.profit_usd || 0), 0).toFixed(2)
    const lang      = locale === 'uk' ? 'Ukrainian' : 'English'

    const openai = getOpenAI()

    const prompt = `You are a professional trading coach. Analyze the trader's journal and give a detailed breakdown. Write all text values in ${lang}.

Statistics:
- Total trades: ${trades.length}
- Win rate: ${win_rate}%
- Total P&L: ${total_pnl}$
${playbookCompliance !== null ? `- Playbook compliance: ${playbookCompliance}% (followed rules in ${followedChecks} of ${totalChecks} rule checks)` : ''}
${emotionSummary ? `- Emotion breakdown: ${emotionSummary}` : ''}

Trades (last ${trades.length}):
${trades.map(t => `${t.date} | ${t.pair} | ${t.setup} | ${t.direction} | ${t.result} | RR:${t.rr} | ${t.profit_usd}$ | Grade:${t.self_grade || '-'} | Emotion:${t.emotion || 'none'} | "${t.comment || ''}"`).join('\n')}
${journalSummary ? `\nDaily Journal (last 7 entries):\n${journalSummary}` : ''}

Analyze:
1. Trading performance and main mistakes
2. Emotional patterns — which emotions correlate with wins/losses
3. Playbook discipline — are rules being followed${playbookCompliance !== null ? ` (compliance: ${playbookCompliance}%)` : ''}
4. Journal mood trends if available

Respond ONLY with JSON, no markdown:
{
  "main_error": "main mistake of this period (3-4 sentences)",
  "best_setup": "best setup and why it works (2-3 sentences)",
  "worst_setup": "worst setup and why it doesn't work (2-3 sentences)",
  "discipline": "discipline assessment A/B/C/D with reasoning, include playbook compliance if available (2-3 sentences)",
  "risk_management": "risk management analysis and recommendations (2-3 sentences)",
  "emotion_insight": "key insight about emotional patterns and their impact on results (2-3 sentences)",
  "action_steps": ["specific step 1", "specific step 2", "specific step 3", "specific step 4"]
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
      type:     'coach',
      trade_id: null,
      prompt,
      response: content,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, code: 'AI_ERROR' }, { status: 500 })
  }
}
