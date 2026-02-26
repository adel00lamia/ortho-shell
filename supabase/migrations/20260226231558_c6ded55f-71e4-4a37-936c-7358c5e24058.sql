
-- Add training detail columns for automatic reimbursement calculation
ALTER TABLE public.ofppt_reimbursement_dossiers
  ADD COLUMN IF NOT EXISTS total_hours NUMERIC(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_participants INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_per_hour_per_person NUMERIC(8,2) DEFAULT 0;
