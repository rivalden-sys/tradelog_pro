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
      return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again in 1 hour.', code: 'RATE_LIMIT_EXCEEDED' }, { status: 429 })
    }

    const { trade, locale } = await req.json()
    if (!trade) return NextResponse.json({ success: false, error: 'Trade is required', code: 'BAD_REQUEST' }, { status: 400 })

    // Historical data for this setup + direction (capped to prevent large payloads)
    const { data: history } = await supabase
      .from('trades')
      .select('setup, direction, result, rr, profit_usd, pair, emotion, date')
      .eq('user_id', user.id)
      .eq('setup', trade.setup)
      .eq('direction', trade.direction)
      .eq('status', 'closed')
      .order('date', { ascending: false })
      .limit(500)

    // All trades for overall context
    const { data: allTrades } = await supabase
      .from('trades')
      .select('result, profit_usd, emotion, date')
      .eq('user_id', user.id)
      .eq('status', 'closed')
      .order('date', { ascending: false })
      .limit(50)

    const similar   = history || []
    const wins      = similar.filter(t => t.result === 'Тейк').length
    const win_rate  = similar.length ? Math.round((wins / similar.length) * 100) : 0
    const avgRR     = similar.length ? (similar.reduce((s, t) => s + (t.rr || 0), 0) / similar.length).toFixed(2) : '0'
    const avgPnl    = similar.length ? (similar.reduce((s, t) => s + (t.profit_usd || 0), 0) / similar.length).toFixed(2) : '0'
    const last5     = similar.slice(0, 5).map(t => t.result)
    const recentWR  = last5.length ? Math.round(last5.filter(r => r === 'Тейк').length / last5.length * 100) : null

    // Overall trader context
    const totalTrades    = (allTrades || []).length
    const overallWR      = totalTrades ? Math.round((allTrades || []).filter(t => t.result === 'Тейк').length / totalTrades * 100) : 0
    const currentEmotion = trade.emotion || null

    // Emotion performance for this emotion state
    const emotionTrades = (allTrades || []).filter(t => t.emotion === currentEmotion && currentEmotion)
    const emotionWR     = emotionTrades.length ? Math.round(emotionTrades.filter(t => t.result === 'Тейк').length / emotionTrades.length * 100) : null

    // Consecutive losses (is trader on tilt?)
    let consecutiveLosses = 0
    for (const t of (allTrades || [])) {
      if (t.result === 'Стоп') consecutiveLosses++
      else break
    }

    const lang = locale === 'uk' ? 'Ukrainian' : 'English'
    const openai = getOpenAI()

    const prompt = `You are a quantitative trading analyst and risk manager. Your job is to calculate the probability of success for a planned trade based on the trader's personal historical performance data. This is not generic advice — it's a data-driven probability assessment specific to this trader's actual track record.

PLANNED TRADE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pair: ${trade.pair} | Setup: ${trade.setup} | Direction: ${trade.direction}
RR target: ${trade.rr} | Entry: ${trade.entry_price || 'N/A'} | Stop: ${trade.stop_price || 'N/A'} | Take: ${trade.take_price || 'N/A'}
Current emotional state: ${currentEmotion || 'not recorded'}

HISTORICAL PERFORMANCE — ${trade.setup} ${trade.direction}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total similar trades: ${similar.length}
Win rate: ${win_rate}% | Avg RR achieved: ${avgRR} | Avg P&L per trade: ${avgPnl}$
Last 5 results: ${last5.join(', ') || 'no history'}
${recentWR !== null ? `Recent trend (last 5): ${recentWR}% WR` : ''}

TRADER CONTEXT:
Overall win rate: ${overallWR}% across ${totalTrades} trades
${consecutiveLosses > 0 ? `⚠️ Currently on ${consecutiveLosses} consecutive loss(es) — tilt risk elevated` : ''}
${emotionWR !== null ? `Historical WR when feeling "${currentEmotion}": ${emotionWR}% (${emotionTrades.length} trades)` : ''}

${similar.length > 0 ? `ALL SIMILAR TRADES HISTORY:\n${similar.map(t => `${t.date} | ${t.pair} | ${t.result} | RR:${t.rr} | ${t.profit_usd}$`).join('\n')}` : ''}

Based strictly on this trader's personal data, assess the probability of success for this specific trade. Be honest — if the data shows this setup underperforms or the trader is in a bad emotional state, say so clearly.

Write all text values in ${lang}. Respond ONLY with JSON, no markdown:
{
  "score": number from 0 to 100 (probability of success based on personal data),
  "confidence": "high" or "medium" or "low" (confidence in the score based on sample size),
  "similar_trades": ${similar.length},
  "win_rate": ${win_rate},
  "avg_rr_achieved": ${avgRR},
  "explanation": "data-driven explanation of the score — what factors pushed it up or down (3-4 sentences with specific numbers)",
  "risk_factors": ["specific risk factor 1 from their data", "specific risk factor 2 from their data"],
  "favorable_factors": ["specific favorable factor 1 from their data", "specific favorable factor 2 from their data"],
  "recommendation": "enter" or "skip" or "reduce_risk",
  "recommendation_reason": "specific reason for recommendation based on their data (1-2 sentences)"
}`

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      temperature: AI_TEMP,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('Empty AI response')
    const result = JSON.parse(content)

    await supabase.from('ai_sessions').insert({
      user_id: user.id, type: 'trade_score', trade_id: trade.id || null, prompt, response: content,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (e) {
    console.error('AI trade-score error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error', code: 'AI_ERROR' }, { status: 500 })
  }
}
