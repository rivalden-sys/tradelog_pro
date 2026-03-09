-- ============================================================
-- TradeLog Pro — Database Schema v1.0
-- Run in Supabase SQL Editor
-- ============================================================

-- ─── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS (profiles) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  currency    TEXT NOT NULL DEFAULT 'USD',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users: select own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users: update own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── SETUPS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.setups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.setups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "setups: select own" ON public.setups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "setups: insert own" ON public.setups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "setups: delete own" ON public.setups
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS setups_user_id_idx ON public.setups(user_id);

-- ─── TRADES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trades (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  pair             TEXT NOT NULL,
  setup            TEXT NOT NULL,
  rr               NUMERIC(6, 2) NOT NULL,
  direction        TEXT NOT NULL CHECK (direction IN ('Long', 'Short')),
  result           TEXT NOT NULL CHECK (result IN ('Тейк', 'Стоп', 'БУ')),
  profit_usd       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  profit_pct       NUMERIC(8, 4)  NOT NULL DEFAULT 0,
  tradingview_url  TEXT,
  screenshot_url   TEXT,
  comment          TEXT,
  self_grade       TEXT CHECK (self_grade IN ('A', 'B', 'C', 'D')),
  trade_score      INTEGER CHECK (trade_score >= 0 AND trade_score <= 100),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trades: select own" ON public.trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "trades: insert own" ON public.trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trades: update own" ON public.trades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "trades: delete own" ON public.trades
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes (per architecture rules)
CREATE INDEX IF NOT EXISTS trades_user_id_idx   ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS trades_setup_idx     ON public.trades(setup);
CREATE INDEX IF NOT EXISTS trades_pair_idx      ON public.trades(pair);
CREATE INDEX IF NOT EXISTS trades_date_idx      ON public.trades(date DESC);
CREATE INDEX IF NOT EXISTS trades_direction_idx ON public.trades(direction);
CREATE INDEX IF NOT EXISTS trades_result_idx    ON public.trades(result);
CREATE INDEX IF NOT EXISTS trades_user_date_idx ON public.trades(user_id, date DESC);

-- ─── PSYCHOLOGY ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.psychology (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id         UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emotion          TEXT NOT NULL,
  confidence_level INTEGER NOT NULL CHECK (confidence_level >= 1 AND confidence_level <= 10),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.psychology ENABLE ROW LEVEL SECURITY;

CREATE POLICY "psychology: select own" ON public.psychology
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "psychology: insert own" ON public.psychology
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS psychology_user_id_idx ON public.psychology(user_id);
CREATE INDEX IF NOT EXISTS psychology_trade_id_idx ON public.psychology(trade_id);

-- ─── AI SESSIONS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('trade_review', 'trade_score', 'coach', 'psychology', 'screenshot', 'chat')),
  trade_id   UUID REFERENCES public.trades(id) ON DELETE SET NULL,
  prompt     TEXT NOT NULL,
  response   TEXT NOT NULL,  -- JSON string
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_sessions: select own" ON public.ai_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_sessions: insert own" ON public.ai_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS ai_sessions_user_id_idx  ON public.ai_sessions(user_id);
CREATE INDEX IF NOT EXISTS ai_sessions_trade_id_idx ON public.ai_sessions(trade_id);
CREATE INDEX IF NOT EXISTS ai_sessions_type_idx     ON public.ai_sessions(type);

-- ─── DASHBOARD STATS VIEW (aggregated, per arch rules) ────────
CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT
  user_id,
  COUNT(*)                                                    AS total_trades,
  ROUND(
    COUNT(*) FILTER (WHERE result = 'Тейк')::NUMERIC
    / NULLIF(COUNT(*), 0) * 100, 1
  )                                                           AS win_rate,
  COALESCE(SUM(profit_usd), 0)                               AS total_pnl,
  COALESCE(ROUND(AVG(rr)::NUMERIC, 2), 0)                   AS avg_rr,
  COUNT(*) FILTER (WHERE result = 'Тейк')                    AS wins,
  COUNT(*) FILTER (WHERE result = 'Стоп')                    AS losses,
  COUNT(*) FILTER (WHERE result = 'БУ')                      AS breakevens
FROM public.trades
GROUP BY user_id;

-- ─── SUPABASE STORAGE BUCKET ──────────────────────────────────
-- Run manually in Supabase Dashboard → Storage → New bucket:
-- Name: trade-screenshots
-- Public: false
-- Allowed MIME types: image/jpeg, image/webp
-- Max file size: 1572864 (1.5MB)

-- ─── STORAGE POLICY (run after creating bucket) ───────────────
-- INSERT INTO storage.buckets (id, name, public) VALUES ('trade-screenshots', 'trade-screenshots', false);

-- CREATE POLICY "screenshots: select own" ON storage.objects
--   FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "screenshots: insert own" ON storage.objects
--   FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "screenshots: delete own" ON storage.objects
--   FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
