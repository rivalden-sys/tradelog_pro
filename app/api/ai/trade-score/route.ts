import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, AI_MODEL, AI_TEMP, AI_MAX_TOKENS } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })

    const { trade } = await req.json()
    if (!trade) return NextResponse.json({ success: false, error: 'Trade is required', code: 'BAD_REQUEST' }, { status: 400 })

    // Get historical trades with same setup/direction
    const { data: history } = await supabase
      .from('trades')
      .select('setup, direction, result, rr, profit_usd, pair')
      .eq('user_id', user.id)
      .eq('setup', trade.setup)
      .eq('direction', trade.direction)

    const similar = history || []
    const wins = similar.filter(t => t.result === 'Тейк').length
    const win_rate = similar.length ? Math.round((wins / similar.length) * 100) : 0

    const openai = getOpenAI()

    const prompt = `Ты профессиональный трейдинг-коуч. Оцени вероятность успеха этой сделки на основе исторических данных трейдера.

Планируемая сделка:
- Пара: ${trade.pair}
- Сетап: ${trade.setup}
- Направление: ${trade.direction}
- RR: ${trade.rr}

Исторические данные трейдера по похожим сделкам (${trade.setup} + ${trade.direction}):
- Всего похожих сделок: ${similar.length}
- Win rate: ${win_rate}%
- Последние результаты: ${similar.slice(-5).map(t => t.result).join(', ') || 'нет данных'}

Ответь ТОЛЬКО JSON без markdown:
{
  "score": число от 0 до 100 (вероятность успеха),
  "similar_trades": ${similar.length},
  "win_rate": ${win_rate},
  "explanation": "объяснение оценки (2-3 предложения)",
  "recommendation": "enter" или "skip" или "reduce_risk"
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
