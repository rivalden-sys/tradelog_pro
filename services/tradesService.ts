import { createClient } from '@/lib/supabase/server'
import { TradeFormData, Trade } from '@/types'

const TRADE_COLUMNS = `
  id, user_id, date, pair, setup, rr, direction, result,
  profit_usd, profit_pct, tradingview_url, screenshot_url,
  comment, self_grade, trade_score, created_at,
  status, entry_price, stop_price, take_price, risk_usdt, risk_pct,
  trade_type, emotion, mae_price, mfe_price
`

export interface TradeFilters {
  result?:     string
  pair?:       string
  setup?:      string
  direction?:  string
  status?:     string
  trade_type?: string
  limit?:      number
  offset?:     number
}

export interface ExtendedTradeFormData extends TradeFormData {
  status?:        'planned' | 'closed'
  trade_type?:    'futures' | 'spot'
  entry_price?:   number | null
  stop_price?:    number | null
  take_price?:    number | null
  risk_usdt?:     number | null
  risk_pct?:      number | null
  emotion?:       'calm' | 'fear' | 'greed' | 'anger' | 'euphoria' | 'revenge' | null
  mae_price?:     number | null
  mfe_price?:     number | null
  screenshot_url?: string | null
}

export async function getTrades(
  userId: string,
  filters?: TradeFilters
): Promise<Trade[]> {
  const supabase = await createClient()
  const limit  = filters?.limit  ?? 200
  const offset = filters?.offset ?? 0

  let query = supabase
    .from('trades')
    .select(TRADE_COLUMNS)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filters?.result)     query = query.eq('result',     filters.result)
  if (filters?.pair)       query = query.eq('pair',       filters.pair)
  if (filters?.setup)      query = query.eq('setup',      filters.setup)
  if (filters?.direction)  query = query.eq('direction',  filters.direction)
  if (filters?.status)     query = query.eq('status',     filters.status)
  if (filters?.trade_type) query = query.eq('trade_type', filters.trade_type)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Trade[]
}

export async function getTradeById(id: string, userId: string): Promise<Trade> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trades')
    .select(TRADE_COLUMNS)
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  if (error) throw new Error(error.message)
  return data as Trade
}

export async function createTrade(userId: string, form: ExtendedTradeFormData): Promise<Trade> {
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
      tradingview_url: form.tradingview_url  || null,
      comment:         form.comment          || null,
      self_grade:      form.self_grade       || null,
      status:          form.status           ?? 'closed',
      trade_type:      form.trade_type       ?? 'futures',
      entry_price:     form.entry_price      ?? null,
      stop_price:      form.stop_price       ?? null,
      take_price:      form.take_price       ?? null,
      risk_usdt:       form.risk_usdt        ?? null,
      risk_pct:        form.risk_pct         ?? null,
      emotion:         form.emotion          ?? null,
      mae_price:       form.mae_price        ?? null,
      mfe_price:       form.mfe_price        ?? null,
      screenshot_url:  form.screenshot_url   ?? null,
    })
    .select(TRADE_COLUMNS)
    .single()
  if (error) throw new Error(error.message)
  return data as Trade
}

export async function updateTrade(
  id: string,
  userId: string,
  form: Partial<ExtendedTradeFormData>
): Promise<Trade> {
  const supabase = await createClient()

  const updates: Partial<ExtendedTradeFormData & { pair: string }> = {}
  if (form.date            !== undefined) updates.date            = form.date
  if (form.pair            !== undefined) updates.pair            = form.pair?.toUpperCase().trim()
  if (form.setup           !== undefined) updates.setup           = form.setup
  if (form.rr              !== undefined) updates.rr              = form.rr
  if (form.direction       !== undefined) updates.direction       = form.direction
  if (form.result          !== undefined) updates.result          = form.result
  if (form.profit_usd      !== undefined) updates.profit_usd      = form.profit_usd
  if (form.profit_pct      !== undefined) updates.profit_pct      = form.profit_pct
  if (form.tradingview_url !== undefined) updates.tradingview_url = form.tradingview_url || null
  if (form.comment         !== undefined) updates.comment         = form.comment         || null
  if (form.self_grade      !== undefined) updates.self_grade      = form.self_grade      || null
  if (form.status          !== undefined) updates.status          = form.status
  if (form.trade_type      !== undefined) updates.trade_type      = form.trade_type
  if (form.entry_price     !== undefined) updates.entry_price     = form.entry_price
  if (form.stop_price      !== undefined) updates.stop_price      = form.stop_price
  if (form.take_price      !== undefined) updates.take_price      = form.take_price
  if (form.risk_usdt       !== undefined) updates.risk_usdt       = form.risk_usdt
  if (form.risk_pct        !== undefined) updates.risk_pct        = form.risk_pct
  if (form.emotion         !== undefined) updates.emotion         = form.emotion         ?? null
  if (form.mae_price       !== undefined) updates.mae_price       = form.mae_price       ?? null
  if (form.mfe_price       !== undefined) updates.mfe_price       = form.mfe_price       ?? null
  if (form.screenshot_url  !== undefined) updates.screenshot_url  = form.screenshot_url  ?? null

  const { data, error } = await supabase
    .from('trades')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select(TRADE_COLUMNS)
    .single()
  if (error) throw new Error(error.message)
  return data as Trade
}

export async function deleteTrade(id: string, userId: string): Promise<{ success: true }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('trades')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function getUniquePairs(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trades')
    .select('pair')
    .eq('user_id', userId)
    .order('pair')
  if (error) throw new Error(error.message)
  return [...new Set((data ?? []).map(t => t.pair))]
}
