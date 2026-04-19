-- ============================================================
-- AurumTrade — Database Schema v2.0
-- Синхронізовано з production: 19.04.2026
-- Run in Supabase SQL Editor (fresh deploy only)
-- ============================================================

-- ─── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS (profiles) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id                     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                  TEXT NOT NULL,
  plan                   TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  currency               TEXT NOT NULL DEFAULT 'USD',
  username               TEXT UNIQUE,
  max_risk               NUMERIC(6,2),
  min_rr                 NUMERIC(6,2),
  daily_loss_limit       NUMERIC(12,2),
  balance                NUMERIC(12,2),
  subscription_status    TEXT,
  current_period_end     TIMESTAMPTZ,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users: select own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users: update own" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Тригер: захист billing полів від зміни клієнтом
CREATE OR REPLACE FUNCTION public.protect_billing_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' != 'service_role' THEN
    NEW.plan                   := OLD.plan;
    NEW.stripe_customer_id     := OLD.stripe_customer_id;
    NEW.stripe_subscription_id := OLD.stripe_subscription_id;
    NEW.subscription_status    := OLD.subscription_status;
    NEW.current_period_end     := OLD.current_period_end;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_billing_fields ON public.users;
CREATE TRIGGER protect_billing_fields
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.protect_billing_fields();

-- Тригер: auto-create profile on signup
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

-- ─── TRADES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trades (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  pair             TEXT NOT NULL,
  setup            TEXT NOT NULL,
  rr               NUMERIC(6,2) NOT NULL,
  direction        TEXT NOT NULL CHECK (direction IN ('Long', 'Short')),
  result           TEXT NOT NULL CHECK (result IN ('Тейк', 'Стоп', 'БУ')),
  profit_usd       NUMERIC(12,2) NOT NULL DEFAULT 0,
  profit_pct       NUMERIC(8,4)  NOT NULL DEFAULT 0,
  tradingview_url  TEXT,
  screenshot_url   TEXT,
  comment          TEXT,
  self_grade       TEXT CHECK (self_grade IN ('A', 'B', 'C', 'D')),
  trade_score      INTEGER CHECK (trade_score >= 0 AND trade_score <= 100),
  status           TEXT NOT NULL DEFAULT 'closed' CHECK (status IN ('planned', 'closed')),
  trade_type       TEXT NOT NULL DEFAULT 'futures' CHECK (trade_type IN ('futures', 'spot')),
  entry_price      NUMERIC(18,8),
  stop_price       NUMERIC(18,8),
  take_price       NUMERIC(18,8),
  risk_usdt        NUMERIC(12,2),
  risk_pct         NUMERIC(8,4),
  emotion          TEXT CHECK (emotion IN ('calm','fear','greed','anger','euphoria','revenge')),
  mae_price        NUMERIC(18,8),
  mfe_price        NUMERIC(18,8),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trades: select own" ON public.trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "trades: insert own" ON public.trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trades: update own" ON public.trades
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trades: delete own" ON public.trades
  FOR DELETE USING (auth.uid() = user_id);

-- Тригер: enforce 20-trade cap для free plan
CREATE OR REPLACE FUNCTION public.enforce_free_trade_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_plan   TEXT;
  trade_count INTEGER;
BEGIN
  SELECT plan INTO user_plan FROM public.users WHERE id = NEW.user_id;
  IF user_plan = 'free' THEN
    SELECT COUNT(*) INTO trade_count FROM public.trades WHERE user_id = NEW.user_id;
    IF trade_count >= 20 THEN
      RAISE EXCEPTION 'Free plan limit reached: maximum 20 trades allowed'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_free_trade_limit ON public.trades;
CREATE TRIGGER enforce_free_trade_limit
  BEFORE INSERT ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_trade_limit();

CREATE INDEX IF NOT EXISTS trades_user_id_idx   ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS trades_setup_idx     ON public.trades(setup);
CREATE INDEX IF NOT EXISTS trades_pair_idx      ON public.trades(pair);
CREATE INDEX IF NOT EXISTS trades_date_idx      ON public.trades(date DESC);
CREATE INDEX IF NOT EXISTS trades_direction_idx ON public.trades(direction);
CREATE INDEX IF NOT EXISTS trades_result_idx    ON public.trades(result);
CREATE INDEX IF NOT EXISTS trades_user_date_idx ON public.trades(user_id, date DESC);

-- ─── AI SESSIONS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('trade_review','trade_score','coach','psychology','screenshot','chat')),
  trade_id   UUID REFERENCES public.trades(id) ON DELETE SET NULL,
  prompt     TEXT NOT NULL,
  response   TEXT NOT NULL,
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

-- ─── RATE LIMITS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  count      INTEGER NOT NULL DEFAULT 0,
  window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_limits: select own" ON public.rate_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "rate_limits: insert own" ON public.rate_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rate_limits: update own" ON public.rate_limits
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS rate_limits_user_endpoint_idx ON public.rate_limits(user_id, endpoint);

-- ─── PLAYBOOKS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.playbooks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  setup_name TEXT NOT NULL,
  rules      JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "playbooks: select own" ON public.playbooks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "playbooks: insert own" ON public.playbooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "playbooks: update own" ON public.playbooks
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "playbooks: delete own" ON public.playbooks
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS playbooks_user_id_idx ON public.playbooks(user_id);

-- ─── TRADE RULE CHECKS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trade_rule_checks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id    UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playbook_id UUID REFERENCES public.playbooks(id) ON DELETE SET NULL,
  rule_id     TEXT NOT NULL,
  followed    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_rule_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trade_rule_checks: select own" ON public.trade_rule_checks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "trade_rule_checks: insert own" ON public.trade_rule_checks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trade_rule_checks: update own" ON public.trade_rule_checks
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trade_rule_checks: delete own" ON public.trade_rule_checks
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS trade_rule_checks_trade_id_idx    ON public.trade_rule_checks(trade_id);
CREATE INDEX IF NOT EXISTS trade_rule_checks_user_id_idx     ON public.trade_rule_checks(user_id);
CREATE INDEX IF NOT EXISTS trade_rule_checks_playbook_id_idx ON public.trade_rule_checks(playbook_id);

-- ─── DAILY NOTES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  mood       INTEGER CHECK (mood >= 1 AND mood <= 5),
  content    TEXT,
  market     TEXT,
  plans      TEXT,
  mistakes   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_notes: select own" ON public.daily_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "daily_notes: insert own" ON public.daily_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_notes: update own" ON public.daily_notes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_notes: delete own" ON public.daily_notes
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS daily_notes_user_id_idx   ON public.daily_notes(user_id);
CREATE INDEX IF NOT EXISTS daily_notes_user_date_idx ON public.daily_notes(user_id, date DESC);

-- ─── GOALS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.goals (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('win_rate','trade_count','total_pnl','max_losses')),
  period     TEXT NOT NULL CHECK (period IN ('weekly','monthly')),
  target     NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals: select own" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "goals: insert own" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals: update own" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals: delete own" ON public.goals
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS goals_user_id_idx ON public.goals(user_id);

-- ─── STORAGE BUCKET ──────────────────────────────────────────
-- Створити вручну: Supabase → Storage → New bucket
-- Name: trade-screenshots | Public: true | Max size: 2MB

-- Storage policies (виконати після створення bucket):
-- CREATE POLICY "screenshots: select own" ON storage.objects
--   FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "screenshots: insert own" ON storage.objects
--   FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "screenshots: update own" ON storage.objects
--   FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "screenshots: delete own" ON storage.objects
--   FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
