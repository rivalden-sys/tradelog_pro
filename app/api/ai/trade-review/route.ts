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
      return NextResponse.json({
        success: false,
        error: 'AI Analysis is available on Pro plan only.',
        code: 'PRO_REQUIRED',
      }, { status: 403 })
    }

    const { trade } = await req.json()
    if (!trade) return NextResponse.json({ success: false, error: 'Trade is required', code: 'BAD_REQUEST' }, { status: 400 })

    const openai = getOpenAI()

    const prompt = `You are a professional trading coach. Analyze this trade and respond strictly in JSON format.

Trade:
- Pair: ${trade.pair}
- Setup: ${trade.setup}
- Direction: ${trade.direction}
- Result: ${trade.result}
- RR: ${trade.rr}
- P&L: ${trade.profit_usd}$
- Trader comment: ${trade.comment || 'no comment'}
- Self grade: ${trade.self_grade || 'not set'}

Respond ONLY with JSON, no markdown:
{
  "entry_quality": "assessment of entry quality — what was done right (2-3 sentences)",
  "errors": "errors and notes — what was ignored or violated (2-3 sentences)",
  "system_compliance": "compliance with the setup — was the trade according to the system (1-2 sentences)",
  "verdict": "was it worth entering this trade and why (2-3 sentences)",
  "ai_grade": "A, B, C or D",
  "recommendation": "specific recommendation for the future (1-2 sentences)"
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
      type:     'trade_review',
      trade_id: trade.id,
      prompt,
      response: content,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, code: 'AI_ERROR' }, { status: 500 })
  }
}
