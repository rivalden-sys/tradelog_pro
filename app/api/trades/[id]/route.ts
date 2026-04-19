import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTradeById, updateTrade, deleteTrade } from '@/services/tradesService'
import { z } from 'zod'

const UpdateSchema = z.object({
  date:            z.string().min(1).optional(),
  pair:            z.string().min(1).optional(),
  setup:           z.string().min(1).optional(),
  rr:              z.number().nullable().optional(),
  direction:       z.enum(['Long', 'Short']).optional(),
  result:          z.enum(['Тейк', 'Стоп', 'БУ']).optional(),
  profit_usd:      z.number().nullable().optional(),
  profit_pct:      z.number().nullable().optional(),
  tradingview_url: z.string().nullable().optional(),
  comment:         z.string().nullable().optional(),
  self_grade:      z.enum(['A', 'B', 'C', 'D']).optional(),
  status:          z.enum(['planned', 'closed']).optional(),
  entry_price:     z.number().nullable().optional(),
  stop_price:      z.number().nullable().optional(),
  take_price:      z.number().nullable().optional(),
  risk_usdt:       z.number().nullable().optional(),
  risk_pct:        z.number().nullable().optional(),
  emotion:         z.enum(['calm', 'fear', 'greed', 'anger', 'euphoria', 'revenge']).nullable().optional(),
  mae_price:       z.number().nullable().optional(),
  mfe_price:       z.number().nullable().optional(),
  screenshot_url:  z.string().nullable().optional(),
})

type Params = Promise<{ id: string }>

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 })

    let trade
    try {
      trade = await getTradeById(id, user.id)
    } catch {
      return NextResponse.json({ success: false, error: 'Trade not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    if (!trade) {
      return NextResponse.json({ success: false, error: 'Trade not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: trade })
  } catch (error) {
    console.error('Trade GET error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error', code: 'FETCH_ERROR' }, { status: 500 })
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
      return NextResponse.json({ success: false, error: 'Invalid request data', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    let trade
    try {
      trade = await updateTrade(id, user.id, parsed.data as any)
    } catch {
      return NextResponse.json({ success: false, error: 'Trade not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: trade })
  } catch (error) {
    console.error('Trade PUT error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error', code: 'UPDATE_ERROR' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 })

    // Отримуємо screenshot_url перед видаленням
    let trade
    try {
      trade = await getTradeById(id, user.id)
    } catch {
      return NextResponse.json({ success: false, error: 'Trade not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    const screenshotUrl = trade?.screenshot_url

    // FIX #15: спочатку видаляємо DB row, потім Storage
    // Якщо deleteTrade fails — Storage файл залишається (не orphan)
    await deleteTrade(id, user.id)

    // Видаляємо Storage тільки після успішного DB delete
    if (screenshotUrl) {
      try {
        const url = new URL(screenshotUrl)
        const pathParts = url.pathname.split('/storage/v1/object/public/trade-screenshots/')
        if (pathParts.length === 2) {
          await supabase.storage.from('trade-screenshots').remove([pathParts[1]])
        }
      } catch {
        // Не блокуємо відповідь якщо Storage cleanup не вдався
      }
    }

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('Trade DELETE error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error', code: 'DELETE_ERROR' }, { status: 500 })
  }
}
