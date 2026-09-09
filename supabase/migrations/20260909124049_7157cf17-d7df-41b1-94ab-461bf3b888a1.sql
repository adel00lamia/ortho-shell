ALTER TABLE public.root_cause_diagnostics
  ADD COLUMN IF NOT EXISTS missing_evidence jsonb NOT NULL DEFAULT '[]'::jsonb;