import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTradeById, updateTrade, deleteTrade } from '@/services/tradesService'
import { z } from 'zod'

const UpdateSchema = z.object({
  date:            z.string().min(1).optional(),
  pair:            z.string().min(1).optional(),
  setup:           z.string().min(1).optional(),
  rr:              z.number().positive().optional(),
  direction:       z.enum(['Long', 'Short']).optional(),
  result:          z.enum(['Тейк', 'Стоп', 'БУ']).optional(),
  profit_usd:      z.number().optional(),
  profit_pct:      z.number().optional(),
  tradingview_url: z.string().optional(),
  comment:         z.string().optional(),
  self_grade:      z.enum(['A', 'B', 'C', 'D']).optional(),
  status:          z.enum(['planned', 'closed']).optional(),
  entry_price:     z.number().optional(),
  stop_price:      z.number().optional(),
  take_price:      z.number().optional(),
  risk_usdt:       z.number().optional(),
  risk_pct:        z.number().optional(),
  emotion:         z.enum(['calm', 'fear', 'greed', 'anger', 'euphoria', 'revenge']).optional().nullable(),
})

type Params = Promise<{ id: string }>

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 })

    const trade = await getTradeById(id, user.id)
    return NextResponse.json({ success: true, data: trade })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error), code: 'FETCH_ERROR' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 })

    const body = await request.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.message, code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const trade = await updateTrade(id, user.id, parsed.data as any)
    return NextResponse.json({ success: true, data: trade })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error), code: 'UPDATE_ERROR' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 })

    await deleteTrade(id, user.id)
    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error), code: 'DELETE_ERROR' }, { status: 500 })
  }
}
