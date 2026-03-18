import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, AI_MODEL, AI_TEMP } from '@/lib/openai'
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
      return NextResponse.json({ success: false, error: 'Trade Score is available on Pro plan only.', code: 'PRO_REQUIRED' }, { status: 403 })
    }

    const rateLimit = await checkRateLimit(user.id, 'trade_score')
    if (!rateLimit.allowed) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Try again in 1 hour.',
        code: 'RATE_LIMIT_EXCEEDED',
      }, { status: 429 })
    }

    const { trade, locale } = await req.json()
    if (!trade) return NextResponse.json({ success: false, error: 'Trade is required', code: 'BAD_REQUEST' }, { status: 400 })

    const { data: history } = await supabase
      .from('trades')
      .select('setup, direction, result, rr, profit_usd, pair')
      .eq('user_id', user.id)
      .eq('setup', trade.setup)
      .eq('direction', trade.direction)

    const similar = history || []
    const wins = similar.filter(t => t.result === 'Тейк').length
    const win_rate = similar.length ? Math.round((wins / similar.length) * 100) : 0

    const lang = locale === 'uk' ? 'Ukrainian' : 'English'
    const openai = getOpenAI()

    const prompt = `You are a professional trading coach. Estimate the probability of success for this trade. Write all text values in ${lang}.

Planned trade:
- Pair: ${trade.pair}
- Setup: ${trade.setup}
- Direction: ${trade.direction}
- RR: ${trade.rr}

Historical data for similar trades (${trade.setup} + ${trade.direction}):
- Total similar trades: ${similar.length}
- Win rate: ${win_rate}%
- Last results: ${similar.slice(-5).map(t => t.result).join(', ') || 'no data'}

Respond ONLY with JSON, no markdown:
{
  "score": number from 0 to 100,
  "similar_trades": ${similar.length},
  "win_rate": ${win_rate},
  "explanation": "explanation of the score (2-3 sentences)",
  "recommendation": "enter" or "skip" or "reduce_risk"
}`

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      temperature: AI_TEMP,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('Empty AI response')
    const result = JSON.parse(content)

    await supabase.from('ai_sessions').insert({
      user_id:  user.id,
      type:     'trade_score',
      trade_id: trade.id || null,
      prompt,
      response: content,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, code: 'AI_ERROR' }, { status: 500 })
  }
}
