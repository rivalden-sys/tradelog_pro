import { createClient } from '@/lib/supabase/server'
import { TradeFormData } from '@/types'

const TRADE_COLUMNS = `
  id, user_id, date, pair, setup, rr, direction, result,
  initial_balance, risk_type, risk_value, entry_price, stop_price, take_price,
  planned_rr, planned_profit_usd, planned_profit_pct,
  actual_result, actual_profit_usd, actual_profit_pct, post_comment,
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

  if (filters?.result)    query = query.eq('actual_result', filters.result)
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
      rr:              form.rr ?? form.planned_rr ?? null,
      direction:       form.direction,
      result:          form.result ?? form.actual_result ?? null,
      profit_usd:      form.profit_usd ?? form.actual_profit_usd ?? null,
      profit_pct:      form.profit_pct ?? form.actual_profit_pct ?? null,
      initial_balance: form.initial_balance ?? null,
      risk_type:       form.risk_type ?? null,
      risk_value:      form.risk_value ?? null,
      entry_price:     form.entry_price ?? null,
      stop_price:      form.stop_price ?? null,
      take_price:      form.take_price ?? null,
      planned_rr:      form.planned_rr ?? form.rr ?? null,
      planned_profit_usd: form.planned_profit_usd ?? null,
      planned_profit_pct: form.planned_profit_pct ?? null,
      actual_result:      form.actual_result ?? form.result ?? null,
      actual_profit_usd:  form.actual_profit_usd ?? form.profit_usd ?? null,
      actual_profit_pct:  form.actual_profit_pct ?? form.profit_pct ?? null,
      post_comment:       form.post_comment || null,
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
      initial_balance: form.initial_balance,
      risk_type:       form.risk_type,
      risk_value:      form.risk_value,
      entry_price:     form.entry_price,
      stop_price:      form.stop_price,
      take_price:      form.take_price,
      planned_rr:      form.planned_rr,
      planned_profit_usd: form.planned_profit_usd,
      planned_profit_pct: form.planned_profit_pct,
      actual_result:      form.actual_result,
      actual_profit_usd:  form.actual_profit_usd,
      actual_profit_pct:  form.actual_profit_pct,
      post_comment:       form.post_comment,
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
