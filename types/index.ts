// ─── ENUMS ───────────────────────────────────────────────────────────────────

export type Direction  = 'Long' | 'Short'
export type Result     = 'Тейк' | 'Стоп' | 'БУ'
export type SelfGrade  = 'A' | 'B' | 'C' | 'D'
export type Plan       = 'free' | 'pro'
export type AISessionType =
  | 'trade_review'
  | 'trade_score'
  | 'coach'
  | 'psychology'
  | 'screenshot'
  | 'chat'

// ─── DATABASE MODELS ─────────────────────────────────────────────────────────

export interface Trade {
  id:               string
  user_id:          string
  date:             string          // ISO date: "2026-03-01"
  pair:             string
  setup:            string
  rr:               number
  direction:        Direction
  result:           Result
  profit_usd:       number
  profit_pct:       number
  tradingview_url:  string | null
  screenshot_url:   string | null
  comment:          string | null
  self_grade:       SelfGrade | null
  created_at:       string
}

export interface Setup {
  id:          string
  user_id:     string
  name:        string
  description: string | null
  created_at:  string
}

export interface Psychology {
  id:               string
  trade_id:         string
  user_id:          string
  emotion:          string
  confidence_level: number          // 1–10
  notes:            string | null
  created_at:       string
}

export interface AISession {
  id:         string
  user_id:    string
  type:       AISessionType
  trade_id:   string | null
  prompt:     string
  response:   string              // JSON string
  created_at: string
}

export interface UserProfile {
  id:         string
  email:      string
  plan:       Plan
  currency:   string              // 'USD' default
  created_at: string
}

// ─── FORM TYPES ──────────────────────────────────────────────────────────────

export interface TradeFormData {
  date:            string
  pair:            string
  setup:           string
  rr:              number
  direction:       Direction
  result:          Result
  profit_usd:      number
  profit_pct:      number
  tradingview_url: string
  comment:         string
  self_grade:      SelfGrade
}

// ─── API RESPONSE TYPES ───────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
  code: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─── AI RESPONSE SCHEMAS ──────────────────────────────────────────────────────

export interface TradeReviewResponse {
  entry_quality:     string        // что сделано правильно
  errors:            string        // ошибки и замечания
  system_compliance: string        // соответствие сетапу
  verdict:           string        // стоило ли входить
  ai_grade:          SelfGrade
  recommendation:    string
}

export interface TradeScoreResponse {
  score:          number           // 0–100
  similar_trades: number          // кол-во похожих сделок
  win_rate:       number          // win rate по похожим сделкам
  explanation:    string
  recommendation: 'enter' | 'skip' | 'reduce_risk'
}

export interface CoachResponse {
  main_error:      string
  best_setup:      string
  worst_setup:     string
  discipline:      string
  risk_management: string
  action_steps:    string[]
}

export interface PsychologyPattern {
  pattern:  string
  severity: 'high' | 'medium' | 'low'
  evidence: string
  action:   string
}

export interface PsychologyResponse {
  patterns:    PsychologyPattern[]
  summary:     string
  top_risk:    string
}

export interface ChatResponse {
  answer:   string
  sources:  string[]            // какие данные журнала использованы
}

// ─── DASHBOARD / ANALYTICS ───────────────────────────────────────────────────

export interface DashboardStats {
  total_trades:   number
  win_rate:       number
  total_pnl:      number
  avg_rr:         number
  best_setup:     string
  win_streak:     number
  loss_streak:    number
}

export interface BalancePoint {
  date: string
  pnl:  number
}

export interface SetupStat {
  setup:    string
  trades:   number
  wins:     number
  win_rate: number
  avg_rr:   number
  total_pnl: number
}

export interface PairStat {
  pair:      string
  trades:    number
  total_pnl: number
  win_rate:  number
}

// ─── FILTERS ─────────────────────────────────────────────────────────────────

export type Period = 'week' | 'month' | 'all'

export interface TradeFilters {
  period:    Period
  pair:      string | null
  setup:     string | null
  direction: Direction | null
  result:    Result | null
  grade:     SelfGrade | null
}
