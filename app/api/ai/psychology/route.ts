import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, AI_MODEL, AI_TEMP, AI_MAX_TOKENS } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })

    // Get trades with comments
    const { data: trades } = await supabase
      .from('trades')
      .select('date, pair, result, profit_usd, comment, self_grade, direction')
      .eq('user_id', user.id)
      .not('comment', 'is', null)
      .order('date', { ascending: false })
      .limit(50)

    if (!trades || trades.length === 0) {
      return NextResponse.json({ success: false, error: 'No comments to analyze', code: 'NO_DATA' }, { status: 400 })
    }

    const openai = getOpenAI()

    const prompt = `Ты профессиональный трейдинг-психолог. Проанализируй комментарии трейдера и выяви психологические паттерны.

Сделки с комментариями:
${trades.map(t => `${t.date} | ${t.pair} | ${t.direction} | ${t.result} | ${t.profit_usd}$ | Оценка:${t.self_grade || '-'} | "${t.comment}"`).join('\n')}

Ищи паттерны: страх, жадность, revenge trading, передвижение стопов, нарушение системы, неуверенность, импульсивность.

Ответь ТОЛЬКО JSON без markdown:
{
  "patterns": [
    {
      "pattern": "название паттерна",
      "severity": "high" или "medium" или "low",
      "evidence": "конкретные примеры из комментариев (1-2 предложения)",
      "action": "что делать чтобы исправить (1-2 предложения)"
    }
  ],
  "summary": "общий психологический портрет трейдера (3-4 предложения)",
  "top_risk": "главный психологический риск на данный момент (1-2 предложения)"
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
