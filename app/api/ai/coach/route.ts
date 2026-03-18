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
      return NextResponse.json({ success: false, error: 'AI Coach is available on Pro plan only.', code: 'PRO_REQUIRED' }, { status: 403 })
    }

    const { locale } = await req.json()

    const { data: trades } = await supabase
      .from('trades')
      .select('date, pair, setup, direction, result, rr, profit_usd, comment, self_grade')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(50)

    if (!trades || trades.length === 0) {
      return NextResponse.json({ success: false, error: 'No trades to analyze', code: 'NO_DATA' }, { status: 400 })
    }

    const wins = trades.filter(t => t.result === 'Тейк').length
    const win_rate = Math.round((wins / trades.length) * 100)
    const total_pnl = trades.reduce((s, t) => s + (t.profit_usd || 0), 0).toFixed(2)

    const lang = locale === 'uk' ? 'Ukrainian' : 'English'
    const openai = getOpenAI()

    const prompt = `You are a professional trading coach. Analyze the trader's journal and give a detailed breakdown. Write all text values in ${lang}.

Statistics:
- Total trades: ${trades.length}
- Win rate: ${win_rate}%
- Total P&L: ${total_pnl}$

Trades (last ${trades.length}):
${trades.map(t => `${t.date} | ${t.pair} | ${t.setup} | ${t.direction} | ${t.result} | RR:${t.rr} | ${t.profit_usd}$ | Grade:${t.self_grade || '-'} | "${t.comment || ''}"`).join('\n')}

Respond ONLY with JSON, no markdown:
{
  "main_error": "main mistake of this period (3-4 sentences)",
  "best_setup": "best setup and why it works (2-3 sentences)",
  "worst_setup": "worst setup and why it doesn't work (2-3 sentences)",
  "discipline": "discipline assessment A/B/C/D with reasoning (2-3 sentences)",
  "risk_management": "risk management analysis and recommendations (2-3 sentences)",
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
