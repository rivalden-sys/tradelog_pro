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
      return NextResponse.json({ success: false, error: 'AI Chat is available on Pro plan only.', code: 'PRO_REQUIRED' }, { status: 403 })
    }

    const rateLimit = await checkRateLimit(user.id, 'chat')
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again in 1 hour.', code: 'RATE_LIMIT_EXCEEDED' }, { status: 429 })
    }

    const { message, history, locale } = await req.json()
    if (!message) return NextResponse.json({ success: false, error: 'Message is required', code: 'BAD_REQUEST' }, { status: 400 })

    const { data: trades } = await supabase
      .from('trades')
      .select('date, pair, setup, direction, result, rr, profit_usd, comment, self_grade, emotion, mae_price, mfe_price, entry_price, stop_price, take_price')
      .eq('user_id', user.id)
      .eq('status', 'closed')
      .order('date', { ascending: false })
      .limit(50)

    const wins        = (trades || []).filter(t => t.result === 'Тейк').length
    const losses      = (trades || []).filter(t => t.result === 'Стоп').length
    const total       = (trades || []).length
    const win_rate    = total ? Math.round((wins / total) * 100) : 0
    const total_pnl   = (trades || []).reduce((s, t) => s + (t.profit_usd || 0), 0).toFixed(2)
    const avg_rr      = total ? ((trades || []).reduce((s, t) => s + (t.rr || 0), 0) / total).toFixed(2) : '0'
    const best_trade  = (trades || []).reduce((best, t) => (t.profit_usd || 0) > (best?.profit_usd || 0) ? t : best, null as any)
    const worst_trade = (trades || []).reduce((worst, t) => (t.profit_usd || 0) < (worst?.profit_usd || 0) ? t : worst, null as any)

    // Streak
    let currentStreak = 0
    let streakType = ''
    for (const t of (trades || [])) {
      if (currentStreak === 0) { streakType = t.result; currentStreak = 1 }
      else if (t.result === streakType) currentStreak++
      else break
    }

    // Emotion stats
    const emotionStats: Record<string, { total: number; wins: number; pnl: number }> = {}
    ;(trades || []).forEach(t => {
      if (t.emotion) {
        if (!emotionStats[t.emotion]) emotionStats[t.emotion] = { total: 0, wins: 0, pnl: 0 }
        emotionStats[t.emotion].total++
        if (t.result === 'Тейк') emotionStats[t.emotion].wins++
        emotionStats[t.emotion].pnl += t.profit_usd || 0
      }
    })
    const emotionSummary = Object.entries(emotionStats)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([e, s]) => `${e}: ${s.total} trades | ${Math.round(s.wins / s.total * 100)}% WR | P&L ${s.pnl.toFixed(2)}$`)
      .join('\n')

    // Setup performance
    const setupStats: Record<string, { total: number; wins: number; pnl: number }> = {}
    ;(trades || []).forEach(t => {
      if (!setupStats[t.setup]) setupStats[t.setup] = { total: 0, wins: 0, pnl: 0 }
      setupStats[t.setup].total++
      if (t.result === 'Тейк') setupStats[t.setup].wins++
      setupStats[t.setup].pnl += t.profit_usd || 0
    })
    const setupSummary = Object.entries(setupStats)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([s, v]) => `${s}: ${v.total} trades | ${Math.round(v.wins / v.total * 100)}% WR | ${v.pnl.toFixed(2)}$`)
      .join('\n')

    // Playbook compliance
    const { data: ruleChecks } = await supabase.from('trade_rule_checks').select('followed')
    const totalChecks    = ruleChecks?.length || 0
    const followedChecks = ruleChecks?.filter(r => r.followed).length || 0
    const playbookCompliance = totalChecks > 0 ? Math.round((followedChecks / totalChecks) * 100) : null

    // Daily journal
    const { data: journalNotes } = await supabase
      .from('daily_notes')
      .select('date, mood, content, plans, mistakes')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(7)

    const journalContext = journalNotes?.length
      ? journalNotes.map(n => `${n.date} | mood:${n.mood}/5${n.content ? ` | ${n.content.slice(0, 80)}` : ''}${n.mistakes ? ` | mistakes: ${n.mistakes.slice(0, 80)}` : ''}`).join('\n')
      : null

    const lang = locale === 'uk' ? 'Ukrainian' : 'English'

    const systemPrompt = `You are Alex — a Senior Trading Coach with 15+ years of experience training professional traders at hedge funds and proprietary trading firms. You have deep expertise in technical analysis, risk management, trading psychology, and behavioral finance.

CORE PRINCIPLES:
- You speak directly and honestly, like Ray Dalio — no sugarcoating, but always constructive
- Every insight MUST reference specific data from the trader's journal — never give generic advice
- You identify patterns the trader cannot see themselves
- You balance acknowledgment of strengths with clear identification of weaknesses
- Your goal is long-term profitability improvement, not short-term validation

COMMUNICATION STYLE:
- Concise but deep — every sentence adds value
- Use specific numbers and percentages from their data
- When you see a problem, name it clearly and provide the exact fix
- Respond in ${lang}

TRADER PROFILE & STATISTICS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total trades analyzed: ${total}
Win rate: ${win_rate}% | Losses: ${losses} | Wins: ${wins}
Total P&L: ${total_pnl}$ | Avg RR: ${avg_rr}
Current streak: ${currentStreak} consecutive ${streakType === 'Тейк' ? 'wins' : streakType === 'Стоп' ? 'losses' : 'trades'}
Best trade: ${best_trade ? `${best_trade.pair} +${best_trade.profit_usd}$` : 'N/A'}
Worst trade: ${worst_trade ? `${worst_trade.pair} ${worst_trade.profit_usd}$` : 'N/A'}
${playbookCompliance !== null ? `Playbook compliance: ${playbookCompliance}%` : ''}

SETUP PERFORMANCE BREAKDOWN:
${setupSummary || 'No setup data'}

EMOTIONAL PERFORMANCE BREAKDOWN:
${emotionSummary || 'No emotion data recorded'}

RECENT TRADES (last ${Math.min(total, 50)}):
${(trades || []).map(t => `${t.date} | ${t.pair} | ${t.setup} | ${t.direction} | ${t.result} | RR:${t.rr} | ${t.profit_usd}$ | Grade:${t.self_grade || '-'} | Emotion:${t.emotion || '-'} | "${t.comment || ''}"`).join('\n')}
${journalContext ? `\nJOURNAL ENTRIES (last 7 days):\n${journalContext}` : ''}

INSTRUCTION: When answering, always cite specific trades, dates, or statistics from the data above. Never give advice that isn't backed by the trader's actual journal data.`

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
      user_id: user.id, type: 'chat', trade_id: null, prompt: message, response: answer,
    })

    return NextResponse.json({ success: true, data: { answer } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, code: 'AI_ERROR' }, { status: 500 })
  }
}
