import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTrades, createTrade } from '@/services/tradesService'
import { z } from 'zod'

const FREE_TRADE_LIMIT = 20

const TradeSchema = z.object({
  date:            z.string().min(1),
  pair:            z.string().min(1),
  setup:           z.string().min(1),
  rr:              z.number().min(0),
  direction:       z.enum(['Long', 'Short']),
  result:          z.enum(['Тейк', 'Стоп', 'БУ']).optional().default('Тейк'),
  profit_usd:      z.number().optional().default(0),
  profit_pct:      z.number().optional().default(0),
  tradingview_url: z.string().optional(),
  comment:         z.string().optional(),
  self_grade:      z.enum(['A', 'B', 'C', 'D']).optional(),
  status:          z.enum(['planned', 'closed']).optional().default('closed'),
  trade_type:      z.enum(['futures', 'spot']).optional().default('futures'),
  entry_price:     z.number().optional().nullable(),
  stop_price:      z.number().optional().nullable(),
  take_price:      z.number().optional().nullable(),
  risk_usdt:       z.number().optional().nullable(),
  risk_pct:        z.number().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const filters = {
      result:     searchParams.get('result')     || undefined,
      pair:       searchParams.get('pair')       || undefined,
      setup:      searchParams.get('setup')      || undefined,
      direction:  searchParams.get('direction')  || undefined,
      status:     searchParams.get('status')     || undefined,
      trade_type: searchParams.get('trade_type') || undefined,
    }

    const trades = await getTrades(user.id, filters)
    return NextResponse.json({ success: true, data: trades })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error), code: 'FETCH_ERROR' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .single()
    const plan = profile?.plan ?? 'free'

    if (plan === 'free') {
      const { count } = await supabase
        .from('trades')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      if ((count ?? 0) >= FREE_TRADE_LIMIT) {
        return NextResponse.json({
          success: false,
          error: `Free plan is limited to ${FREE_TRADE_LIMIT} trades. Upgrade to Pro for unlimited trades.`,
          code: 'FREE_LIMIT_REACHED',
        }, { status: 403 })
      }
    }

    const body = await request.json()
    const parsed = TradeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.message, code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const trade = await createTrade(user.id, parsed.data as any)
    return NextResponse.json({ success: true, data: trade }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error), code: 'CREATE_ERROR' }, { status: 500 })
  }
}
