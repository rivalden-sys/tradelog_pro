import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, AI_MODEL, AI_TEMP, AI_MAX_TOKENS } from '@/lib/openai'

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

    const { message, history, locale } = await req.json()
    if (!message) return NextResponse.json({ success: false, error: 'Message is required', code: 'BAD_REQUEST' }, { status: 400 })

    // Get last 30 trades as context
    const { data: trades } = await supabase
      .from('trades')
      .select('date, pair, setup, direction, result, rr, profit_usd, comment, self_grade')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30)

    const wins = (trades || []).filter(t => t.result === 'Тейк').length
    const total = (trades || []).length
    const win_rate = total ? Math.round((wins / total) * 100) : 0
    const total_pnl = (trades || []).reduce((s, t) => s + (t.profit_usd || 0), 0).toFixed(2)

    const lang = locale === 'uk' ? 'Ukrainian' : 'English'

    const systemPrompt = `You are a professional trading coach with access to the trader's journal. Always respond in ${lang}.

Trader's statistics:
- Total trades: ${total}
- Win rate: ${win_rate}%
- Total P&L: ${total_pnl}$

Recent trades:
${(trades || []).map(t => `${t.date} | ${t.pair} | ${t.setup} | ${t.direction} | ${t.result} | RR:${t.rr} | ${t.profit_usd}$ | Grade:${t.self_grade || '-'} | "${t.comment || ''}"`).join('\n')}

Answer questions about the trader's performance, patterns, and provide specific actionable advice based on their actual data.`

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
