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

const TRADE_COLUMNS_LEGACY = `
  id, user_id, date, pair, setup, rr, direction, result,
  profit_usd, profit_pct, tradingview_url, screenshot_url,
  comment, self_grade, trade_score, created_at
`

function isMissingColumnError(error: unknown) {
  const message = String((error as any)?.message || error || '').toLowerCase()
  return message.includes('column') && (message.includes('does not exist') || message.includes('schema cache'))
}

function normalizeTradeRow<T extends Record<string, any>>(row: T) {
  return {
    ...row,
    initial_balance: row.initial_balance ?? null,
    risk_type: row.risk_type ?? null,
    risk_value: row.risk_value ?? null,
    entry_price: row.entry_price ?? null,
    stop_price: row.stop_price ?? null,
    take_price: row.take_price ?? null,
    planned_rr: row.planned_rr ?? row.rr ?? null,
    planned_profit_usd: row.planned_profit_usd ?? null,
    planned_profit_pct: row.planned_profit_pct ?? null,
    actual_result: row.actual_result ?? row.result ?? null,
    actual_profit_usd: row.actual_profit_usd ?? row.profit_usd ?? null,
    actual_profit_pct: row.actual_profit_pct ?? row.profit_pct ?? null,
    post_comment: row.post_comment ?? row.comment ?? null,
  }
}

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
  if (!error) return (data || []).map(normalizeTradeRow)
  if (!isMissingColumnError(error)) throw new Error(error.message)

  let legacyQuery = supabase
    .from('trades')
    .select(TRADE_COLUMNS_LEGACY)
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (filters?.result)    legacyQuery = legacyQuery.eq('result', filters.result)
  if (filters?.pair)      legacyQuery = legacyQuery.eq('pair', filters.pair)
  if (filters?.setup)     legacyQuery = legacyQuery.eq('setup', filters.setup)
  if (filters?.direction) legacyQuery = legacyQuery.eq('direction', filters.direction)

  const legacyRes = await legacyQuery
  if (legacyRes.error) throw new Error(legacyRes.error.message)
  return (legacyRes.data || []).map(normalizeTradeRow)
}

export async function getTradeById(id: string, userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trades')
    .select(TRADE_COLUMNS)
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!error) return normalizeTradeRow(data)
  if (!isMissingColumnError(error)) throw new Error(error.message)

  const legacy = await supabase
    .from('trades')
    .select(TRADE_COLUMNS_LEGACY)
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (legacy.error) throw new Error(legacy.error.message)
  return normalizeTradeRow(legacy.data)
}

export async function createTrade(userId: string, form: TradeFormData) {
  const supabase = await createClient()

  const payload = {
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
  }

  const { data, error } = await supabase
    .from('trades')
    .insert(payload)
    .select(TRADE_COLUMNS)
    .single()

  if (!error) return normalizeTradeRow(data)
  if (!isMissingColumnError(error)) throw new Error(error.message)

  const legacyPayload = {
    user_id: payload.user_id,
    date: payload.date,
    pair: payload.pair,
    setup: payload.setup,
    rr: payload.rr,
    direction: payload.direction,
    result: payload.result,
    profit_usd: payload.profit_usd,
    profit_pct: payload.profit_pct,
    tradingview_url: payload.tradingview_url,
    comment: payload.post_comment || payload.comment,
    self_grade: payload.self_grade,
  }

  const legacy = await supabase
    .from('trades')
    .insert(legacyPayload)
    .select(TRADE_COLUMNS_LEGACY)
    .single()
  if (legacy.error) throw new Error(legacy.error.message)
  return normalizeTradeRow(legacy.data)
}

export async function updateTrade(id: string, userId: string, form: Partial<TradeFormData>) {
  const supabase = await createClient()

  const payload = {
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
  }

  const { data, error } = await supabase
    .from('trades')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId)
    .select(TRADE_COLUMNS)
    .single()

  if (!error) return normalizeTradeRow(data)
  if (!isMissingColumnError(error)) throw new Error(error.message)

  const legacyPayload = {
    date: payload.date,
    pair: payload.pair,
    setup: payload.setup,
    rr: payload.rr,
    direction: payload.direction,
    result: payload.actual_result ?? payload.result,
    profit_usd: payload.actual_profit_usd ?? payload.profit_usd,
    profit_pct: payload.actual_profit_pct ?? payload.profit_pct,
    tradingview_url: payload.tradingview_url,
    comment: payload.post_comment || payload.comment,
    self_grade: payload.self_grade,
  }

  const legacy = await supabase
    .from('trades')
    .update(legacyPayload)
    .eq('id', id)
    .eq('user_id', userId)
    .select(TRADE_COLUMNS_LEGACY)
    .single()

  if (legacy.error) throw new Error(legacy.error.message)
  return normalizeTradeRow(legacy.data)
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
