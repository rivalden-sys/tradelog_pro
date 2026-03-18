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
      return NextResponse.json({ success: false, error: 'AI Psychology is available on Pro plan only.', code: 'PRO_REQUIRED' }, { status: 403 })
    }

    const { locale } = await req.json()

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

    const lang = locale === 'uk' ? 'Ukrainian' : 'English'
    const openai = getOpenAI()

    const prompt = `You are a professional trading psychologist. Analyze the trader's comments and identify psychological patterns. Write all text values in ${lang}.

Trades with comments:
${trades.map(t => `${t.date} | ${t.pair} | ${t.direction} | ${t.result} | ${t.profit_usd}$ | Grade:${t.self_grade || '-'} | "${t.comment}"`).join('\n')}

Look for patterns: fear, greed, revenge trading, moving stops, system violations, hesitation, impulsiveness.

Respond ONLY with JSON, no markdown:
{
  "patterns": [
    {
      "pattern": "pattern name",
      "severity": "high" or "medium" or "low",
      "evidence": "specific examples from comments (1-2 sentences)",
      "action": "what to do to fix it (1-2 sentences)"
    }
  ],
  "summary": "overall psychological profile of the trader (3-4 sentences)",
  "top_risk": "main psychological risk at the moment (1-2 sentences)"
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
