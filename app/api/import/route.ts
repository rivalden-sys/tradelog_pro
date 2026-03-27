
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { parseCSV, parseUniversal, ColumnMapping } from '@/lib/importParsers'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { csvText, mapping } = body as { csvText: string; mapping?: ColumnMapping }

    if (!csvText) return NextResponse.json({ success: false, error: 'No CSV data' })

    const { format, trades } = parseCSV(csvText, mapping)

    if (trades.length === 0) {
      return NextResponse.json({ success: false, error: 'No trades found. Check file format.' })
    }

    // Перевірка ліміту Free плану
    const { data: profile } = await supabase
      .from('users').select('plan').eq('id', user.id).single()

    const isFree = profile?.plan === 'free'
    if (isFree) {
      const { count } = await supabase
        .from('trades').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      const existing = count ?? 0
      const canAdd = Math.max(0, 20 - existing)
      if (canAdd === 0) {
        return NextResponse.json({ success: false, code: 'FREE_LIMIT_REACHED', error: 'Free plan limit reached' })
      }
      trades.splice(canAdd)
    }

    const inserts = trades.map(t => ({
      user_id:     user.id,
      date:        t.date,
      pair:        t.pair,
      setup:       t.setup,
      direction:   t.direction,
      result:      t.result,
      profit_usd:  t.profit_usd,
      profit_pct:  t.profit_pct,
      entry_price: t.entry_price,
      rr:          t.rr,
      status:      'closed',
      trade_type:  t.trade_type,
      comment:     t.comment,
      self_grade:  null,
    }))

    const { data: inserted, error } = await supabase
      .from('trades')
      .insert(inserts)
      .select('id')

    if (error) {
      console.error('Import DB error:', error)
      return NextResponse.json({ success: false, error: error.message })
    }

    return NextResponse.json({
      success:  true,
      imported: inserted?.length ?? 0,
      format,
      skipped:  trades.length - (inserted?.length ?? 0),
    })

  } catch (err: any) {
    console.error('Import POST error:', err)
    return NextResponse.json({ success: false, error: err.message })
  }
}

// PUT — preview без збереження
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { csvText, mapping } = body as { csvText: string; mapping?: ColumnMapping }

    if (!csvText) return NextResponse.json({ success: false, error: 'No CSV data' })

    const { format, trades, headers, total } = parseCSV(csvText, mapping)

    return NextResponse.json({
      success: true,
      format,
      headers,
      preview: trades.slice(0, 10),
      total,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message })
  }
}
