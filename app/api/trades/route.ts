import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTrades, createTrade } from '@/services/tradesService'
import { z } from 'zod'

const TradeSchema = z.object({
  date:            z.string().min(1),
  pair:            z.string().min(1),
  setup:           z.string().min(1),
  rr:              z.number().positive(),
  direction:       z.enum(['Long', 'Short']),
  result:          z.enum(['Тейк', 'Стоп', 'БУ']),
  profit_usd:      z.number(),
  profit_pct:      z.number(),
  tradingview_url: z.string().optional(),
  comment:         z.string().optional(),
  self_grade:      z.enum(['A', 'B', 'C', 'D']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const filters = {
      result:    searchParams.get('result')    || undefined,
      pair:      searchParams.get('pair')      || undefined,
      setup:     searchParams.get('setup')     || undefined,
      direction: searchParams.get('direction') || undefined,
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