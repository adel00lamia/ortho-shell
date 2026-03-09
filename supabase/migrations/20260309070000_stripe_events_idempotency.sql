-- Stripe webhook idempotency table
-- Prevents duplicate processing of the same webhook event
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by stripe_event_id
CREATE INDEX IF NOT EXISTS idx_stripe_events_stripe_event_id ON public.stripe_events(stripe_event_id);

-- Auto-cleanup events older than 30 days (optional, keeps table small)
-- Can be run via pg_cron if available

-- RLS: only service role should access this table
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
