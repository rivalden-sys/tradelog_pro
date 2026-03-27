
// ============================================
// TradeLog Pro — CSV Import Parsers
// Підтримка: Bybit, Binance, OKX, KuCoin,
// Gate.io, MEXC, HTX, BingX, Kraken, Bitget
// Futures + Spot для кожної
// ============================================

export type ParsedTrade = {
  date:        string           // YYYY-MM-DD
  pair:        string           // BTC/USDT
  direction:   'Long' | 'Short'
  result:      'Тейк' | 'Стоп' | 'БУ'
  profit_usd:  number
  profit_pct:  number
  entry_price: number | null
  exit_price:  number | null
  rr:          number
  setup:       string
  status:      'closed'
  trade_type:  'futures' | 'spot'
  comment:     string
}

export type DetectedFormat =
  | 'bybit_futures_old'
  | 'bybit_futures_new'
  | 'bybit_spot'
  | 'binance_futures'
  | 'binance_spot'
  | 'okx_futures'
  | 'okx_spot'
  | 'kucoin_futures'
  | 'kucoin_spot'
  | 'gateio_futures'
  | 'gateio_spot'
  | 'mexc_futures'
  | 'mexc_spot'
  | 'htx_futures'
  | 'htx_spot'
  | 'bingx_futures'
  | 'kraken'
  | 'unknown'

export type ColumnMapping = {
  pair:        string
  side:        string
  pnl:         string
  date:        string
  entry_price: string
  exit_price:  string
  trade_type:  'futures' | 'spot'
}

// ─────────────────────────────────────────────
// ХЕЛПЕРИ
// ─────────────────────────────────────────────

function parseDate(raw: string): string {
  if (!raw) return new Date().toISOString().split('T')[0]
  const cleaned = raw.trim().replace(/\//g, '-')
  const d = new Date(cleaned)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  // Спробуємо DD-MM-YYYY
  const parts = cleaned.split('-')
  if (parts.length === 3 && parts[0].length === 2) {
    const d2 = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
    if (!isNaN(d2.getTime())) return d2.toISOString().split('T')[0]
  }
  return new Date().toISOString().split('T')[0]
}

function normalizePair(raw: string): string {
  if (!raw) return ''
  let s = raw.trim().toUpperCase()
  // Видаляємо суфікси типу -USDT-SWAP, -PERP
  s = s.replace(/[-_](SWAP|PERP|FUTURES|PERPETUAL)$/i, '')
  // Вже є слеш
  if (s.includes('/')) return s
  // BTC-USDT → BTC/USDT
  if (s.includes('-')) {
    const parts = s.split('-')
    if (parts.length === 2) return parts[0] + '/' + parts[1]
  }
  // BTCUSDT → BTC/USDT (розбиваємо по відомих quote)
  for (const quote of ['USDT', 'USDC', 'BUSD', 'BTC', 'ETH', 'BNB', 'USD']) {
    if (s.endsWith(quote) && s.length > quote.length) {
      return s.slice(0, -quote.length) + '/' + quote
    }
  }
  return s
}

function pnlToResult(pnl: number): 'Тейк' | 'Стоп' | 'БУ' {
  if (pnl > 0.001) return 'Тейк'
  if (pnl < -0.001) return 'Стоп'
  return 'БУ'
}

// Гнучке отримання колонки — шукаємо по кількох варіантах назви
function col(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const found = Object.keys(row).find(
      k => k.trim().toLowerCase() === key.trim().toLowerCase()
    )
    if (found !== undefined && row[found] !== undefined) {
      return row[found].trim()
    }
  }
  return ''
}

function num(row: Record<string, string>, ...keys: string[]): number {
  const v = col(row, ...keys)
  const n = parseFloat(v.replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

function isLong(side: string): boolean {
  const s = side.toLowerCase()
  return s.includes('long') || s.includes('buy') || s === 'open_long' || s === 'close_short'
}

// Матчинг Buy→Sell для Spot бірж
function matchSpotBuySell(
  rows: Record<string, string>[],
  pairKey: string,
  sideKey: string,
  priceKey: string,
  totalKey: string,
  dateKey: string,
  exchange: string,
  tradeType: 'spot' = 'spot'
): ParsedTrade[] {
  const trades: ParsedTrade[] = []
  const buyBuffer: Record<string, Array<{ price: number; total: number; date: string }>> = {}

  const sorted = [...rows].sort((a, b) => {
    return new Date(col(a, dateKey)).getTime() - new Date(col(b, dateKey)).getTime()
  })

  for (const row of sorted) {
    const pair    = normalizePair(col(row, pairKey))
    const side    = col(row, sideKey).toLowerCase()
    const price   = num(row, priceKey)
    const total   = Math.abs(num(row, totalKey))
    const dateRaw = col(row, dateKey)

    if (!pair || price <= 0) continue

    if (side.includes('buy')) {
      if (!buyBuffer[pair]) buyBuffer[pair] = []
      buyBuffer[pair].push({ price, total, date: dateRaw })
    } else if (side.includes('sell') && buyBuffer[pair]?.length) {
      const buy = buyBuffer[pair].shift()!
      const qty = total / price
      const pnl = Math.round((price - buy.price) * qty * 100) / 100
      const pct = buy.price > 0 ? Math.round(((price - buy.price) / buy.price) * 10000) / 100 : 0

      trades.push({
        date:        parseDate(dateRaw),
        pair,
        direction:   'Long',
        result:      pnlToResult(pnl),
        profit_usd:  pnl,
        profit_pct:  pct,
        entry_price: buy.price,
        exit_price:  price,
        rr:          0,
        setup:       'Imported',
        status:      'closed',
        trade_type:  tradeType,
        comment:     `Imported from ${exchange} Spot`,
      })
    }
  }

  return trades
}

// ─────────────────────────────────────────────
// АВТО-ДЕТЕКТ ФОРМАТУ
// ─────────────────────────────────────────────

export function detectFormat(headers: string[]): DetectedFormat {
  const h = headers.map(x => x.trim().toLowerCase())
  const has = (...keys: string[]) => keys.every(k => h.some(hh => hh.includes(k.toLowerCase())))

  // Bybit старий: "contracts" + "closing direction"
  if (has('contracts') && has('closing direction')) return 'bybit_futures_old'

  // Bybit новий futures: "symbol" + "avg exit price"
  if (has('symbol') && has('avg exit price')) return 'bybit_futures_new'

  // Bybit spot: "pair" + "avgtrading price"
  if (has('pair') && has('avgtrading price')) return 'bybit_spot'

  // Binance Spot: "date(utc)" + "pair" + "type"
  if ((has('date(utc)') || has('date')) && has('pair') && has('type')) return 'binance_spot'

  // Binance Futures: "symbol" + "side" + ("net p&l" або "closing p&l")
  if (has('symbol') && has('side') && (has('net p&l') || has('closing p&l'))) return 'binance_futures'

  // OKX Futures: "instrument" + "direction" + "p&l"
  if (has('instrument') && has('direction') && has('p&l')) return 'okx_futures'

  // OKX Spot: "instrument" + "trade id" + "side"
  if (has('instrument') && has('trade id') && has('side')) return 'okx_spot'

  // KuCoin Futures: "symbol" + "side" + "realized pnl"
  if (has('symbol') && has('side') && has('realized pnl')) return 'kucoin_futures'

  // KuCoin Spot: "tradecreatedat" або "symbol" + "funds"
  if (has('tradecreatedat') || (has('symbol') && has('funds'))) return 'kucoin_spot'

  // Gate.io Futures: "contract" + "close side" + "profit"
  if (has('contract') && has('close side') && has('profit')) return 'gateio_futures'

  // Gate.io Spot: "no" + "pair" + "side"
  if (has('no') && has('pair') && has('side')) return 'gateio_spot'

  // MEXC Futures: "contract" + "direction" + "realized pnl"
  if (has('contract') && has('direction') && has('realized pnl')) return 'mexc_futures'

  // MEXC Spot: "time" + "pair" + "side" + "quantity"
  if (has('time') && has('pair') && has('side') && has('quantity')) return 'mexc_spot'

  // HTX Futures: "contract code" + "profit"
  if (has('contract code') && has('profit')) return 'htx_futures'

  // HTX Spot: "time" + "pair" + "type" + "fee"
  if (has('time') && has('pair') && has('type') && has('fee') && !has('side')) return 'htx_spot'

  // BingX Futures: "symbol" + "side" + "realized p&l"
  if (has('symbol') && has('side') && has('realized p&l')) return 'bingx_futures'

  // Kraken: "txid" + "ordertxid" + "pair"
  if (has('txid') && has('ordertxid') && has('pair')) return 'kraken'

  return 'unknown'
}

// ─────────────────────────────────────────────
// ПАРСЕРИ — BYBIT
// ─────────────────────────────────────────────

function parseBybitFuturesOld(rows: Record<string, string>[]): ParsedTrade[] {
  return rows.map(row => {
    const pair      = normalizePair(col(row, 'Contracts'))
    const side      = col(row, 'Closing Direction').toLowerCase()
    const entryP    = num(row, 'Entry Price') || null
    const exitP     = num(row, 'Exit Price') || null
    const pnl       = num(row, 'Closed P&L')
    const dateRaw   = col(row, 'Trade Time', 'Trade Time(UTC+0)')
    // Closing Direction = напрям ЗАКРИТТЯ (протилежний до угоди)
    const direction: 'Long' | 'Short' = side.includes('sell') ? 'Long' : 'Short'
    return {
      date: parseDate(dateRaw), pair, direction,
      result: pnlToResult(pnl), profit_usd: Math.round(pnl * 100) / 100, profit_pct: 0,
      entry_price: entryP, exit_price: exitP, rr: 0, setup: 'Imported',
      status: 'closed', trade_type: 'futures',
      comment: `Bybit Futures. Exit: ${col(row, 'Exit Type')}`,
    }
  }).filter(t => t.pair)
}

function parseBybitFuturesNew(rows: Record<string, string>[]): ParsedTrade[] {
  return rows.map(row => {
    const pair    = normalizePair(col(row, 'Symbol'))
    const side    = col(row, 'Side').toLowerCase()
    const entryP  = num(row, 'Entry Price', 'Avg Entry Price') || null
    const exitP   = num(row, 'Avg Exit Price', 'Exit Price') || null
    const pnl     = num(row, 'Closed P&L', 'Realized P&L')
    const dateRaw = col(row, 'Created Time', 'Close Time', 'Time')
    const direction: 'Long' | 'Short' = isLong(side) ? 'Long' : 'Short'
    return {
      date: parseDate(dateRaw), pair, direction,
      result: pnlToResult(pnl), profit_usd: Math.round(pnl * 100) / 100, profit_pct: 0,
      entry_price: entryP, exit_price: exitP, rr: 0, setup: 'Imported',
      status: 'closed', trade_type: 'futures',
      comment: 'Bybit Futures',
    }
  }).filter(t => t.pair)
}

function parseBybitSpot(rows: Record<string, string>[]): ParsedTrade[] {
  return matchSpotBuySell(rows, 'Pair', 'Type', 'AvgTrading Price', 'Total', 'Date(UTC+8)', 'Bybit')
}

// ─────────────────────────────────────────────
// ПАРСЕРИ — BINANCE
// ─────────────────────────────────────────────

function parseBinanceFutures(rows: Record<string, string>[]): ParsedTrade[] {
  return rows.map(row => {
    const pair    = normalizePair(col(row, 'Symbol'))
    const side    = col(row, 'Side').toLowerCase()
    const entryP  = num(row, 'Entry Price', 'Avg Entry Price') || null
    const exitP   = num(row, 'Exit Price', 'Avg Exit Price') || null
    const pnl     = num(row, 'Net P&L', 'Closing P&L', 'Realized P&L')
    const dateRaw = col(row, 'Time', 'Date', 'Close Time')
    const direction: 'Long' | 'Short' = isLong(side) ? 'Long' : 'Short'
    return {
      date: parseDate(dateRaw), pair, direction,
      result: pnlToResult(pnl), profit_usd: Math.round(pnl * 100) / 100, profit_pct: 0,
      entry_price: entryP, exit_price: exitP, rr: 0, setup: 'Imported',
      status: 'closed', trade_type: 'futures',
      comment: 'Binance Futures',
    }
  }).filter(t => t.pair)
}

function parseBinanceSpot(rows: Record<string, string>[]): ParsedTrade[] {
  return matchSpotBuySell(rows, 'Pair', 'Type', 'AvgTrading Price', 'Total', 'Date(UTC)', 'Binance')
}

// ─────────────────────────────────────────────
// ПАРСЕРИ — OKX
// ─────────────────────────────────────────────

function parseOKXFutures(rows: Record<string, string>[]): ParsedTrade[] {
  return rows.map(row => {
    const pair    = normalizePair(col(row, 'Instrument', 'Symbol'))
    const side    = col(row, 'Direction', 'Side').toLowerCase()
    const entryP  = num(row, 'Avg Open Price', 'Entry Price') || null
    const exitP   = num(row, 'Avg Close Price', 'Exit Price') || null
    const pnl     = num(row, 'P&L', 'Realized P&L', 'PNL')
    const dateRaw = col(row, 'Close time', 'Close Time', 'Time', 'Date')
    const direction: 'Long' | 'Short' = isLong(side) ? 'Long' : 'Short'
    return {
      date: parseDate(dateRaw), pair, direction,
      result: pnlToResult(pnl), profit_usd: Math.round(pnl * 100) / 100, profit_pct: 0,
      entry_price: entryP, exit_price: exitP, rr: 0, setup: 'Imported',
      status: 'closed', trade_type: 'futures',
      comment: 'OKX Futures',
    }
  }).filter(t => t.pair)
}

function parseOKXSpot(rows: Record<string, string>[]): ParsedTrade[] {
  return matchSpotBuySell(rows, 'Instrument', 'Side', 'Price', 'Total', 'Date', 'OKX')
}

// ─────────────────────────────────────────────
// ПАРСЕРИ — KUCOIN
// ─────────────────────────────────────────────

function parseKuCoinFutures(rows: Record<string, string>[]): ParsedTrade[] {
  return rows.map(row => {
    const pair    = normalizePair(col(row, 'Symbol', 'Contract'))
    const side    = col(row, 'Side').toLowerCase()
    const entryP  = num(row, 'Avg Entry Price', 'Open Price') || null
    const exitP   = num(row, 'Avg Close Price', 'Close Price') || null
    const pnl     = num(row, 'Realized PNL', 'Realized P&L', 'PNL')
    const dateRaw = col(row, 'Close Time', 'Time', 'Date')
    // KuCoin side для futures: "buy" = Long open, "sell" = Short open
    const direction: 'Long' | 'Short' = isLong(side) ? 'Long' : 'Short'
    return {
      date: parseDate(dateRaw), pair, direction,
      result: pnlToResult(pnl), profit_usd: Math.round(pnl * 100) / 100, profit_pct: 0,
      entry_price: entryP, exit_price: exitP, rr: 0, setup: 'Imported',
      status: 'closed', trade_type: 'futures',
      comment: `KuCoin Futures. Leverage: ${col(row, 'Leverage')}x`,
    }
  }).filter(t => t.pair)
}

function parseKuCoinSpot(rows: Record<string, string>[]): ParsedTrade[] {
  return matchSpotBuySell(rows, 'symbol', 'side', 'price', 'funds', 'tradeCreatedAt', 'KuCoin')
}

// ─────────────────────────────────────────────
// ПАРСЕРИ — GATE.IO
// ─────────────────────────────────────────────

function parseGateIOFutures(rows: Record<string, string>[]): ParsedTrade[] {
  return rows.map(row => {
    const pair    = normalizePair(col(row, 'Contract', 'Symbol'))
    const side    = col(row, 'Close Side', 'Side').toLowerCase()
    const entryP  = num(row, 'Entry Price', 'Open Price') || null
    const exitP   = num(row, 'Settle Price', 'Close Price', 'Exit Price') || null
    const pnl     = num(row, 'Profit', 'Realized P&L', 'PNL')
    const dateRaw = col(row, 'Time', 'Close Time', 'Date')
    // Gate.io Close Side: "long" означає закрили Long = угода була Long
    const direction: 'Long' | 'Short' = side.includes('long') ? 'Long' : 'Short'
    return {
      date: parseDate(dateRaw), pair, direction,
      result: pnlToResult(pnl), profit_usd: Math.round(pnl * 100) / 100, profit_pct: 0,
      entry_price: entryP, exit_price: exitP, rr: 0, setup: 'Imported',
      status: 'closed', trade_type: 'futures',
      comment: 'Gate.io Futures',
    }
  }).filter(t => t.pair)
}

function parseGateIOSpot(rows: Record<string, string>[]): ParsedTrade[] {
  return matchSpotBuySell(rows, 'Pair', 'Side', 'Price', 'Total', 'Time', 'Gate.io')
}

// ─────────────────────────────────────────────
// ПАРСЕРИ — MEXC
// ─────────────────────────────────────────────

function parseMEXCFutures(rows: Record<string, string>[]): ParsedTrade[] {
  return rows.map(row => {
    const pair    = normalizePair(col(row, 'Contract', 'Symbol'))
    const side    = col(row, 'Direction', 'Side').toLowerCase()
    const entryP  = num(row, 'Avg Open Price', 'Entry Price') || null
    const exitP   = num(row, 'Avg Close Price', 'Exit Price') || null
    const pnl     = num(row, 'Realized PNL', 'Realized P&L', 'Profit')
    const dateRaw = col(row, 'Close Time', 'Time', 'Date')
    const direction: 'Long' | 'Short' = isLong(side) ? 'Long' : 'Short'
    return {
      date: parseDate(dateRaw), pair, direction,
      result: pnlToResult(pnl), profit_usd: Math.round(pnl * 100) / 100, profit_pct: 0,
      entry_price: entryP, exit_price: exitP, rr: 0, setup: 'Imported',
      status: 'closed', trade_type: 'futures',
      comment: 'MEXC Futures',
    }
  }).filter(t => t.pair)
}

function parseMEXCSpot(rows: Record<string, string>[]): ParsedTrade[] {
  return matchSpotBuySell(rows, 'Pair', 'Side', 'Price', 'Total', 'Time', 'MEXC')
}

// ─────────────────────────────────────────────
// ПАРСЕРИ — HTX (Huobi)
// ─────────────────────────────────────────────

function parseHTXFutures(rows: Record<string, string>[]): ParsedTrade[] {
  return rows.map(row => {
    const pair    = normalizePair(col(row, 'Contract Code', 'Symbol', 'Contract'))
    const side    = col(row, 'Direction', 'Side').toLowerCase()
    const entryP  = num(row, 'Open Price', 'Entry Price') || null
    const exitP   = num(row, 'Close Price', 'Exit Price') || null
    const pnl     = num(row, 'Profit', 'Realized P&L', 'PNL')
    const dateRaw = col(row, 'Close Time', 'Open Time', 'Time', 'Date')
    const direction: 'Long' | 'Short' = isLong(side) ? 'Long' : 'Short'
    return {
      date: parseDate(dateRaw), pair, direction,
      result: pnlToResult(pnl), profit_usd: Math.round(pnl * 100) / 100, profit_pct: 0,
      entry_price: entryP, exit_price: exitP, rr: 0, setup: 'Imported',
      status: 'closed', trade_type: 'futures',
      comment: 'HTX Futures',
    }
  }).filter(t => t.pair)
}

function parseHTXSpot(rows: Record<string, string>[]): ParsedTrade[] {
  return matchSpotBuySell(rows, 'Pair', 'Type', 'Price', 'Total', 'Time', 'HTX')
}

// ─────────────────────────────────────────────
// ПАРСЕРИ — BINGX
// ─────────────────────────────────────────────

function parseBingXFutures(rows: Record<string, string>[]): ParsedTrade[] {
  return rows.map(row => {
    const pair    = normalizePair(col(row, 'Symbol', 'Contract'))
    const side    = col(row, 'Side', 'Direction').toLowerCase()
    const entryP  = num(row, 'Entry Price', 'Avg Entry Price') || null
    const exitP   = num(row, 'Exit Price', 'Avg Exit Price') || null
    const pnl     = num(row, 'Realized P&L', 'Closed P&L', 'PNL', 'Profit')
    const dateRaw = col(row, 'Close Time', 'Time', 'Date')
    const direction: 'Long' | 'Short' = isLong(side) ? 'Long' : 'Short'
    return {
      date: parseDate(dateRaw), pair, direction,
      result: pnlToResult(pnl), profit_usd: Math.round(pnl * 100) / 100, profit_pct: 0,
      entry_price: entryP, exit_price: exitP, rr: 0, setup: 'Imported',
      status: 'closed', trade_type: 'futures',
      comment: 'BingX Futures',
    }
  }).filter(t => t.pair)
}

// ─────────────────────────────────────────────
// ПАРСЕРИ — KRAKEN
// ─────────────────────────────────────────────

function parseKraken(rows: Record<string, string>[]): ParsedTrade[] {
  // Kraken: txid, ordertxid, pair, time, type, ordertype, price, cost, fee, vol
  // Матчимо buy→sell по ordertxid або по парі
  return matchSpotBuySell(rows, 'pair', 'type', 'price', 'cost', 'time', 'Kraken')
}

// ─────────────────────────────────────────────
// UNIVERSAL MAPPER (для Bitget та невідомих)
// ─────────────────────────────────────────────

export function parseUniversal(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): ParsedTrade[] {
  return rows.map(row => {
    const pair    = normalizePair(row[mapping.pair] || '')
    const side    = (row[mapping.side] || '').toLowerCase()
    const pnl     = parseFloat(row[mapping.pnl]) || 0
    const dateRaw = row[mapping.date] || ''
    const entryP  = parseFloat(row[mapping.entry_price]) || null
    const exitP   = parseFloat(row[mapping.exit_price]) || null
    const direction: 'Long' | 'Short' = isLong(side) ? 'Long' : 'Short'
    return {
      date:        parseDate(dateRaw),
      pair,
      direction,
      result:      pnlToResult(pnl),
      profit_usd:  Math.round(pnl * 100) / 100,
      profit_pct:  0,
      entry_price: entryP,
      exit_price:  exitP,
      rr:          0,
      setup:       'Imported',
      status:      'closed',
      trade_type:  mapping.trade_type,
      comment:     'Imported via custom mapping',
    }
  }).filter(t => t.pair)
}

// ─────────────────────────────────────────────
// ПАРСИНГ CSV ТЕКСТУ
// ─────────────────────────────────────────────

function parseCSVText(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  if (lines.length < 2) return { headers: [], rows: [] }

  // Парсимо з урахуванням полів у лапках
  const parseLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0])
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i])
    if (values.every(v => !v)) continue // пропускаємо порожні рядки
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || ''
    })
    rows.push(obj)
  }

  return { headers, rows }
}

// ─────────────────────────────────────────────
// ГОЛОВНА ФУНКЦІЯ
// ─────────────────────────────────────────────

export function parseCSV(
  csvText: string,
  mapping?: ColumnMapping
): {
  format:  DetectedFormat
  trades:  ParsedTrade[]
  headers: string[]
  total:   number
} {
  const { headers, rows } = parseCSVText(csvText)

  if (headers.length === 0 || rows.length === 0) {
    return { format: 'unknown', trades: [], headers, total: 0 }
  }

  // Якщо є маппінг — universal
  if (mapping) {
    const trades = parseUniversal(rows, mapping)
    return { format: 'unknown', trades, headers, total: trades.length }
  }

  const format = detectFormat(headers)
  let trades: ParsedTrade[] = []

  switch (format) {
    case 'bybit_futures_old': trades = parseBybitFuturesOld(rows);  break
    case 'bybit_futures_new': trades = parseBybitFuturesNew(rows);  break
    case 'bybit_spot':        trades = parseBybitSpot(rows);        break
    case 'binance_futures':   trades = parseBinanceFutures(rows);   break
    case 'binance_spot':      trades = parseBinanceSpot(rows);      break
    case 'okx_futures':       trades = parseOKXFutures(rows);       break
    case 'okx_spot':          trades = parseOKXSpot(rows);          break
    case 'kucoin_futures':    trades = parseKuCoinFutures(rows);    break
    case 'kucoin_spot':       trades = parseKuCoinSpot(rows);       break
    case 'gateio_futures':    trades = parseGateIOFutures(rows);    break
    case 'gateio_spot':       trades = parseGateIOSpot(rows);       break
    case 'mexc_futures':      trades = parseMEXCFutures(rows);      break
    case 'mexc_spot':         trades = parseMEXCSpot(rows);         break
    case 'htx_futures':       trades = parseHTXFutures(rows);       break
    case 'htx_spot':          trades = parseHTXSpot(rows);          break
    case 'bingx_futures':     trades = parseBingXFutures(rows);     break
    case 'kraken':            trades = parseKraken(rows);           break
    default:                  trades = [];                           break
  }

  return { format, trades, headers, total: trades.length }
}

// ─────────────────────────────────────────────
// СПИСОК ПІДТРИМУВАНИХ БІРЖ ДЛЯ UI
// ─────────────────────────────────────────────

export const SUPPORTED_EXCHANGES = [
  { name: 'Bybit',   formats: ['Futures (старий)', 'Futures (новий)', 'Spot'], path: 'Orders → Derivatives → Trade History → Export' },
  { name: 'Binance', formats: ['Futures', 'Spot'], path: 'Orders → Trade History → Export' },
  { name: 'OKX',     formats: ['Futures', 'Spot'], path: 'Assets → Order Center → Export' },
  { name: 'KuCoin',  formats: ['Futures (Realized PNL)', 'Spot'], path: 'Orders → Trade History → Export' },
  { name: 'Gate.io', formats: ['Futures', 'Spot'], path: 'Orders → Trade History → Export' },
  { name: 'MEXC',    formats: ['Futures', 'Spot'], path: 'Orders → Trade History → Export' },
  { name: 'HTX',     formats: ['Futures', 'Spot'], path: 'Orders → Delivery/Perpetual → Export' },
  { name: 'BingX',   formats: ['Futures'], path: 'Orders → Futures Orders → Closed P&L → Export' },
  { name: 'Kraken',  formats: ['Spot'], path: 'History → Trades → Export' },
  { name: 'Bitget',  formats: ['Маппінг вручну'], path: 'Assets → Transaction History → Export (потрібен маппінг)' },
]

export const FORMAT_LABELS: Record<DetectedFormat, string> = {
  bybit_futures_old: 'Bybit Futures (старий формат)',
  bybit_futures_new: 'Bybit Futures (новий формат)',
  bybit_spot:        'Bybit Spot',
  binance_futures:   'Binance Futures',
  binance_spot:      'Binance Spot',
  okx_futures:       'OKX Futures',
  okx_spot:          'OKX Spot',
  kucoin_futures:    'KuCoin Futures',
  kucoin_spot:       'KuCoin Spot',
  gateio_futures:    'Gate.io Futures',
  gateio_spot:       'Gate.io Spot',
  mexc_futures:      'MEXC Futures',
  mexc_spot:         'MEXC Spot',
  htx_futures:       'HTX Futures',
  htx_spot:          'HTX Spot',
  bingx_futures:     'BingX Futures',
  kraken:            'Kraken Spot',
  unknown:           'Невідомий формат',
}
