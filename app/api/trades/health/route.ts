import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 })

    const { error } = await supabase
      .from('trades')
      .select('actual_result,actual_profit_usd,actual_profit_pct,planned_rr')
      .eq('user_id', user.id)
      .limit(1)

    if (!error) {
      return NextResponse.json({ success: true, data: { plan_fact_ready: true } })
    }

    const message = String(error.message || '').toLowerCase()
    const compatibility = message.includes('column') || message.includes('schema cache')
    return NextResponse.json({
      success: true,
      data: {
        plan_fact_ready: !compatibility,
        compatibility_mode: compatibility,
        reason: error.message,
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error), code: 'HEALTH_CHECK_ERROR' }, { status: 500 })
  }
}
