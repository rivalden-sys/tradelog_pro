import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type Params = Promise<{ username: string }>

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { username } = await params
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: users } = await supabase
      .from('users')
      .select('id, email, plan, username')
      .eq('username', username)
      .limit(1)

    if (!users?.length) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const user = users[0]

    const { data: trades } = await supabase
      .from('trades')
      .select('result, profit_usd, profit_pct, pair, setup, direction, rr, date')
      .eq('user_id', user.id)
      .eq('status', 'closed')
      .order('date', { ascending: false })

    if (!trades?.length) {
      return NextResponse.json({
        success: true,
        data: { username: user.username || username, plan: user.plan, totalTrades: 0, winRate: 0, totalPnl: 0, avgRR: 0, topPairs: [], topSetups: [], recentTrades: [] }
      })
    }

    const wins     = trades.filter(t => t.result === 'Тейк').length
    const winRate  = Math.round((wins / trades.length) * 100)
    const totalPnl = trades.reduce((sum, t) => sum + (t.profit_usd || 0), 0)
    const avgRR    = trades.reduce((sum, t) => sum + (t.rr || 0), 0) / trades.length

    const pairCount: Record<string, number> = {}
    trades.forEach(t => { pairCount[t.pair] = (pairCount[t.pair] || 0) + 1 })
    const topPairs = Object.entries(pairCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([pair, count]) => ({ pair, count }))

    const setupCount: Record<string, { count: number; wins: number }> = {}
    trades.forEach(t => {
      if (!setupCount[t.setup]) setupCount[t.setup] = { count: 0, wins: 0 }
      setupCount[t.setup].count++
      if (t.result === 'Тейк') setupCount[t.setup].wins++
    })
    const topSetups = Object.entries(setupCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([setup, { count, wins }]) => ({ setup, count, winRate: Math.round(wins / count * 100) }))

    return NextResponse.json({
      success: true,
      data: {
        username: user.username || username,
        plan: user.plan,
        totalTrades: trades.length,
        winRate,
        totalPnl: parseFloat(totalPnl.toFixed(2)),
        avgRR: parseFloat(avgRR.toFixed(2)),
        topPairs,
        topSetups,
        recentTrades: trades.slice(0, 5),
      }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
