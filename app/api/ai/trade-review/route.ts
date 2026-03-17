import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, AI_MODEL, AI_TEMP, AI_MAX_TOKENS } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })

    // Check Pro plan
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
    const prompt = `Ты профессиональный трейдинг-коуч. Проанализируй эту сделку и дай структурированный ответ строго в JSON формате.
Сделка:
- Пара: ${trade.pair}
- Сетап: ${trade.setup}
- Направление: ${trade.direction}
- Результат: ${trade.result}
- RR: ${trade.rr}
- P&L: ${trade.profit_usd}$
- Комментарий трейдера: ${trade.comment || 'нет комментария'}
- Самооценка трейдера: ${trade.self_grade || 'не указана'}
Ответь ТОЛЬКО JSON без markdown:
{
  "entry_quality": "оценка качества входа — что сделано правильно (2-3 предложения)",
  "errors": "ошибки и замечания — что проигнорировано или нарушено (2-3 предложения)",
  "system_compliance": "соответствие сетапу — была ли сделка по системе (1-2 предложения)",
  "verdict": "стоило ли входить в эту сделку и почему (2-3 предложения)",
  "ai_grade": "A, B, C или D",
  "recommendation": "конкретная рекомендация на будущее (1-2 предложения)"
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
