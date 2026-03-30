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
      return NextResponse.json({ success: false, error: 'AI Chat is available on Pro plan only.', code: 'PRO_REQUIRED' }, { status: 403 })
    }

    const rateLimit = await checkRateLimit(user.id, 'chat')
    if (!rateLimit.allowed) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Try again in 1 hour.',
        code: 'RATE_LIMIT_EXCEEDED',
      }, { status: 429 })
    }

    const { message, history, locale } = await req.json()
    if (!message) return NextResponse.json({ success: false, error: 'Message is required', code: 'BAD_REQUEST' }, { status: 400 })

    // Trades з emotion
    const { data: trades } = await supabase
      .from('trades')
      .select('date, pair, setup, direction, result, rr, profit_usd, comment, self_grade, emotion')
      .eq('user_id', user.id)
      .eq('status', 'closed')
      .order('date', { ascending: false })
      .limit(30)

    const wins      = (trades || []).filter(t => t.result === 'Тейк').length
    const total     = (trades || []).length
    const win_rate  = total ? Math.round((wins / total) * 100) : 0
    const total_pnl = (trades || []).reduce((s, t) => s + (t.profit_usd || 0), 0).toFixed(2)

    // Emotion статистика
    const emotionStats: Record<string, { total: number; wins: number }> = {}
    ;(trades || []).forEach(t => {
      if (t.emotion) {
        if (!emotionStats[t.emotion]) emotionStats[t.emotion] = { total: 0, wins: 0 }
        emotionStats[t.emotion].total++
        if (t.result === 'Тейк') emotionStats[t.emotion].wins++
      }
    })
    const emotionSummary = Object.entries(emotionStats)
      .map(([e, s]) => `${e}: ${s.total} trades, ${Math.round(s.wins / s.total * 100)}% win rate`)
      .join(' | ')

    // Playbook compliance
    const { data: ruleChecks } = await supabase
      .from('trade_rule_checks')
      .select('followed')
    const totalChecks    = ruleChecks?.length || 0
    const followedChecks = ruleChecks?.filter(r => r.followed).length || 0
    const playbookCompliance = totalChecks > 0 ? Math.round((followedChecks / totalChecks) * 100) : null

    // Daily journal — останні 5 записів
    const { data: journalNotes } = await supabase
      .from('daily_notes')
      .select('date, mood, content, plans, mistakes')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(5)

    const journalContext = journalNotes?.length
      ? journalNotes.map(n => `${n.date} | mood:${n.mood}/5${n.content ? ` | ${n.content.slice(0, 60)}` : ''}${n.mistakes ? ` | mistakes: ${n.mistakes.slice(0, 60)}` : ''}`).join('\n')
      : null

    const lang = locale === 'uk' ? 'Ukrainian' : 'English'

    const systemPrompt = `You are a professional trading coach with full access to the trader's journal. Always respond in ${lang}. Be specific and reference actual data from their journal.

Trader statistics:
- Total trades: ${total}
- Win rate: ${win_rate}%
- Total P&L: ${total_pnl}$
${playbookCompliance !== null ? `- Playbook compliance: ${playbookCompliance}%` : ''}
${emotionSummary ? `- Emotions: ${emotionSummary}` : ''}

Recent trades:
${(trades || []).map(t => `${t.date} | ${t.pair} | ${t.setup} | ${t.direction} | ${t.result} | RR:${t.rr} | ${t.profit_usd}$ | Grade:${t.self_grade || '-'} | Emotion:${t.emotion || 'none'} | "${t.comment || ''}"`).join('\n')}
${journalContext ? `\nRecent journal entries:\n${journalContext}` : ''}

Answer questions about the trader's performance, psychology, and playbook discipline. Provide specific actionable advice based on their actual data.`

    const openai = getOpenAI()
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(history || []).map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
    ]

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      temperature: AI_TEMP,
      max_tokens: AI_MAX_TOKENS,
      messages,
    })

    const answer = response.choices[0]?.message?.content
    if (!answer) throw new Error('Empty AI response')

    await supabase.from('ai_sessions').insert({
      user_id:  user.id,
      type:     'chat',
      trade_id: null,
      prompt:   message,
      response: answer,
    })

    return NextResponse.json({ success: true, data: { answer } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, code: 'AI_ERROR' }, { status: 500 })
  }
}
