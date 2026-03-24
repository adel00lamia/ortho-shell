-- ============================================================
-- Ingénierie de Formation Migration
-- Date: 2026-03-25
-- Creates tables for GIAC/OFPPT training engineering dossiers
-- Rollback: see ROLLBACK section at bottom
-- ============================================================

-- Table: ingenierie_de_formation (one per company per year)
CREATE TABLE IF NOT EXISTS ingenierie_de_formation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  exercise_year int NOT NULL DEFAULT EXTRACT(year FROM now())::int,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_progress','finalized','submitted')),
  giac_sector text,
  if_number text,
  gross_annual_payroll numeric(15,2),
  contact_name text,
  contact_phone text,
  contact_email text,
  followed_strategic_diagnostic boolean NOT NULL DEFAULT false,
  swot_data jsonb DEFAULT '{}',
  needs_individual jsonb DEFAULT '[]',
  needs_collective jsonb DEFAULT '[]',
  needs_strategic jsonb DEFAULT '[]',
  tfp_amount numeric(15,2) GENERATED ALWAYS AS (COALESCE(gross_annual_payroll, 0) * 0.016) STORED,
  estimated_reimbursement numeric(15,2),
  csf_attestation_url text,
  giac_attestation_url text,
  linked_training_plan_id uuid,
  completed_steps int[] DEFAULT '{}',
  current_step int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, exercise_year)
);

-- Table: ingenierie_actions (training actions / fiches techniques)
CREATE TABLE IF NOT EXISTS ingenierie_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id uuid NOT NULL REFERENCES ingenierie_de_formation(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  title text NOT NULL,
  target_population text,
  objectives text[] DEFAULT '{}',
  content_outline text,
  duration_days int,
  duration_hours numeric(8,2),
  participant_count int,
  planned_start_date date,
  planned_end_date date,
  provider_name text,
  provider_type text DEFAULT 'external' CHECK (provider_type IN ('internal','external','mixed')),
  location text,
  cost_ht numeric(15,2),
  is_planned boolean NOT NULL DEFAULT true,
  reimbursement_rate numeric(4,3) DEFAULT 0.70,
  source_need_type text DEFAULT 'collective' CHECK (source_need_type IN ('individual','collective','strategic')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE ingenierie_de_formation ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingenierie_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ingenierie_de_formation
CREATE POLICY "Company members can view their ingenierie dossiers"
  ON ingenierie_de_formation FOR SELECT
  USING (company_id = get_current_user_company_id());

CREATE POLICY "Admin/HR can insert ingenierie dossiers"
  ON ingenierie_de_formation FOR INSERT
  WITH CHECK (
    company_id = get_current_user_company_id()
    AND is_admin_or_hr()
  );

CREATE POLICY "Admin/HR can update ingenierie dossiers"
  ON ingenierie_de_formation FOR UPDATE
  USING (
    company_id = get_current_user_company_id()
    AND is_admin_or_hr()
  );

CREATE POLICY "Admin/HR can delete ingenierie dossiers"
  ON ingenierie_de_formation FOR DELETE
  USING (
    company_id = get_current_user_company_id()
    AND is_admin_or_hr()
  );

-- RLS Policies for ingenierie_actions
CREATE POLICY "Company members can view their ingenierie actions"
  ON ingenierie_actions FOR SELECT
  USING (company_id = get_current_user_company_id());

CREATE POLICY "Admin/HR can insert ingenierie actions"
  ON ingenierie_actions FOR INSERT
  WITH CHECK (
    company_id = get_current_user_company_id()
    AND is_admin_or_hr()
  );

CREATE POLICY "Admin/HR can update ingenierie actions"
  ON ingenierie_actions FOR UPDATE
  USING (
    company_id = get_current_user_company_id()
    AND is_admin_or_hr()
  );

CREATE POLICY "Admin/HR can delete ingenierie actions"
  ON ingenierie_actions FOR DELETE
  USING (
    company_id = get_current_user_company_id()
    AND is_admin_or_hr()
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ingenierie_de_formation_updated_at
  BEFORE UPDATE ON ingenierie_de_formation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER ingenierie_actions_updated_at
  BEFORE UPDATE ON ingenierie_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ROLLBACK:
-- DROP TABLE IF EXISTS ingenierie_actions;
-- DROP TABLE IF EXISTS ingenierie_de_formation;
