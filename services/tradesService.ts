import { createClient } from '@/lib/supabase/server'
import { TradeFormData } from '@/types'

const TRADE_COLUMNS = `
  id, user_id, date, pair, setup, rr, direction, result,
  profit_usd, profit_pct, tradingview_url, screenshot_url,
  comment, self_grade, trade_score, created_at
`

export async function getTrades(userId: string, filters?: {
  result?: string
  pair?: string
  setup?: string
  direction?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('trades')
    .select(TRADE_COLUMNS)
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (filters?.result)    query = query.eq('result', filters.result)
  if (filters?.pair)      query = query.eq('pair', filters.pair)
  if (filters?.setup)     query = query.eq('setup', filters.setup)
  if (filters?.direction) query = query.eq('direction', filters.direction)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function getTradeById(id: string, userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trades')
    .select(TRADE_COLUMNS)
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createTrade(userId: string, form: TradeFormData) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trades')
    .insert({
      user_id:         userId,
      date:            form.date,
      pair:            form.pair.toUpperCase().trim(),
      setup:           form.setup,
      rr:              form.rr,
      direction:       form.direction,
      result:          form.result,
      profit_usd:      form.profit_usd,
      profit_pct:      form.profit_pct,
      tradingview_url: form.tradingview_url || null,
      comment:         form.comment || null,
      self_grade:      form.self_grade || null,
    })
    .select(TRADE_COLUMNS)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateTrade(id: string, userId: string, form: Partial<TradeFormData>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trades')
    .update({
      date:            form.date,
      pair:            form.pair?.toUpperCase().trim(),
      setup:           form.setup,
      rr:              form.rr,
      direction:       form.direction,
      result:          form.result,
      profit_usd:      form.profit_usd,
      profit_pct:      form.profit_pct,
      tradingview_url: form.tradingview_url || null,
      comment:         form.comment || null,
      self_grade:      form.self_grade || null,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select(TRADE_COLUMNS)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteTrade(id: string, userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('trades')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return { success: true }
}

export async function getUniquePairs(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trades')
    .select('pair')
    .eq('user_id', userId)
    .order('pair')

  if (error) throw new Error(error.message)
  return [...new Set(data.map(t => t.pair))]
}