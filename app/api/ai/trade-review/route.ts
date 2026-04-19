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
      return NextResponse.json({ success: false, error: 'AI Analysis is available on Pro plan only.', code: 'PRO_REQUIRED' }, { status: 403 })
    }

    const rateLimit = await checkRateLimit(user.id, 'trade_review')
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again in 1 hour.', code: 'RATE_LIMIT_EXCEEDED' }, { status: 429 })
    }

    const { trade, locale } = await req.json()
    if (!trade) return NextResponse.json({ success: false, error: 'Trade is required', code: 'BAD_REQUEST' }, { status: 400 })

    // Historical context for this setup
    const { data: history } = await supabase
      .from('trades')
      .select('date, result, rr, profit_usd, emotion, self_grade, comment')
      .eq('user_id', user.id)
      .eq('setup', trade.setup)
      .eq('status', 'closed')
      .order('date', { ascending: false })
      .limit(20)

    const setupWins    = (history || []).filter(t => t.result === 'Тейк').length
    const setupTotal   = (history || []).length
    const setupWR      = setupTotal ? Math.round(setupWins / setupTotal * 100) : 0
    const setupAvgRR   = setupTotal ? ((history || []).reduce((s, t) => s + (t.rr || 0), 0) / setupTotal).toFixed(2) : '-'
    const setupAvgPnl  = setupTotal ? ((history || []).reduce((s, t) => s + (t.profit_usd || 0), 0) / setupTotal).toFixed(2) : '-'

    // Recent 5 trades context (was trader on a streak?)
    const { data: recent } = await supabase
      .from('trades')
      .select('date, pair, result, profit_usd, emotion')
      .eq('user_id', user.id)
      .eq('status', 'closed')
      .order('date', { ascending: false })
      .limit(5)

    const recentContext = (recent || []).map(t => `${t.date} | ${t.pair} | ${t.result} | ${t.profit_usd}$ | ${t.emotion || '-'}`).join('\n')

    // MAE/MFE analysis if available
    const maeAnalysis = trade.mae_price && trade.entry_price
      ? `MAE price: ${trade.mae_price} (max adverse move from entry)`
      : null
    const mfeAnalysis = trade.mfe_price && trade.entry_price
      ? `MFE price: ${trade.mfe_price} (max favorable move before close)`
      : null

    const lang = locale === 'uk' ? 'Ukrainian' : 'English'
    const openai = getOpenAI()

    const prompt = `You are a Senior Trading Coach reviewing a specific trade in detail. Your role is to provide the most insightful, data-backed trade review possible — one that teaches the trader something they didn't know about their own execution. Be precise, honest, and constructive.

TRADE UNDER REVIEW:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pair: ${trade.pair} | Setup: ${trade.setup} | Direction: ${trade.direction}
Result: ${trade.result} | RR achieved: ${trade.rr} | P&L: ${trade.profit_usd}$
Entry: ${trade.entry_price || 'N/A'} | Stop: ${trade.stop_price || 'N/A'} | Take: ${trade.take_price || 'N/A'}
Risk: ${trade.risk_pct || 'N/A'}% | Emotion during trade: ${trade.emotion || 'not recorded'}
Trader self-grade: ${trade.self_grade || 'not graded'}
Trader comment: "${trade.comment || 'no comment'}"
${maeAnalysis ? maeAnalysis : ''}
${mfeAnalysis ? mfeAnalysis : ''}

SETUP HISTORICAL PERFORMANCE (${trade.setup}):
Total trades with this setup: ${setupTotal}
Win rate: ${setupWR}% | Avg RR: ${setupAvgRR} | Avg P&L per trade: ${setupAvgPnl}$
${setupTotal > 0 ? `Last ${Math.min(setupTotal, 20)} trades with this setup:\n${(history || []).map(t => `${t.date} | ${t.result} | RR:${t.rr} | ${t.profit_usd}$ | Grade:${t.self_grade || '-'} | Emotion:${t.emotion || '-'}`).join('\n')}` : ''}

RECENT TRADING CONTEXT (last 5 trades before this one):
${recentContext || 'No recent trade data'}

Write all text values in ${lang}. Respond ONLY with JSON, no markdown:
{
  "entry_quality": "detailed assessment of entry quality — was the entry precise, early, or late? Was it aligned with the setup rules? (2-3 sentences)",
  "execution_score": number from 0 to 100,
  "setup_context": "how does this trade compare to historical performance of this setup? Is this result typical or an outlier? (2 sentences)",
  "errors": "specific execution errors or missed opportunities in this trade with exact reasoning (2-3 sentences)",
  "emotional_impact": "how did the trader's emotional state (${trade.emotion || 'unrecorded'}) likely impact execution? (1-2 sentences)",
  "risk_assessment": "was the risk/reward setup correctly? Was stop placement logical? (2 sentences)",
  "system_compliance": "did this trade follow the ${trade.setup} setup rules based on the data provided? (1-2 sentences)",
  "verdict": "final assessment — was this a good trade regardless of outcome? What was the true quality of the decision? (2-3 sentences)",
  "ai_grade": "A, B, C or D",
  "grade_vs_self": "comparison between AI grade (your grade) and trader's self-grade ${trade.self_grade || 'N/A'} — do they align? What does the gap reveal? (1-2 sentences)",
  "key_lesson": "the single most important thing this trader should take from this specific trade (1-2 sentences)"
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
      user_id: user.id, type: 'trade_review', trade_id: trade.id, prompt, response: content,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (e) {
    console.error('AI trade-review error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error', code: 'AI_ERROR' }, { status: 500 })
  }
}
