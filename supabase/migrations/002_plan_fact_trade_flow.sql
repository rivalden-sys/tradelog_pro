-- ============================================================
-- TradeLog Pro — Plan/Fact trade flow
-- ============================================================

-- 1) User-level starting balance for planning
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS initial_balance NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- 2) Allow trades to be created as "plan" before outcome is known
ALTER TABLE public.trades
  ALTER COLUMN rr DROP NOT NULL,
  ALTER COLUMN result DROP NOT NULL,
  ALTER COLUMN profit_usd DROP NOT NULL,
  ALTER COLUMN profit_pct DROP NOT NULL;

-- 3) Plan/fact fields
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS initial_balance    NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS risk_type          TEXT CHECK (risk_type IN ('percent', 'usdt')),
  ADD COLUMN IF NOT EXISTS risk_value         NUMERIC(12, 4),
  ADD COLUMN IF NOT EXISTS entry_price        NUMERIC(18, 8),
  ADD COLUMN IF NOT EXISTS stop_price         NUMERIC(18, 8),
  ADD COLUMN IF NOT EXISTS take_price         NUMERIC(18, 8),
  ADD COLUMN IF NOT EXISTS planned_rr         NUMERIC(8, 4),
  ADD COLUMN IF NOT EXISTS planned_profit_usd NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS planned_profit_pct NUMERIC(8, 4),
  ADD COLUMN IF NOT EXISTS actual_result      TEXT CHECK (actual_result IN ('Тейк', 'Стоп', 'БУ')),
  ADD COLUMN IF NOT EXISTS actual_profit_usd  NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS actual_profit_pct  NUMERIC(8, 4),
  ADD COLUMN IF NOT EXISTS post_comment       TEXT;

-- 4) Backfill existing trades as completed facts
UPDATE public.trades
SET
  actual_result = COALESCE(actual_result, result),
  actual_profit_usd = COALESCE(actual_profit_usd, profit_usd),
  actual_profit_pct = COALESCE(actual_profit_pct, profit_pct),
  planned_rr = COALESCE(planned_rr, rr)
WHERE actual_result IS NULL
   OR actual_profit_usd IS NULL
   OR actual_profit_pct IS NULL
   OR planned_rr IS NULL;
