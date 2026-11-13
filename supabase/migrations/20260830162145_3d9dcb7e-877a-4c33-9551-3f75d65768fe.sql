-- 1. Diagnostics
CREATE TABLE public.root_cause_diagnostics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  problem_description text NOT NULL DEFAULT '',
  department text,
  affected_population text,
  headcount_affected integer,
  symptoms text[] NOT NULL DEFAULT '{}',
  source_channel text NOT NULL DEFAULT 'text',
  business_kpis jsonb NOT NULL DEFAULT '[]'::jsonb,
  training_fit_score integer,
  ai_confidence numeric,
  cause_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_summary text,
  ai_verdict text,
  avoided_training_cost_mad numeric,
  estimated_training_cost_mad numeric,
  evidence_sources jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  linked_training_plan_id uuid REFERENCES public.training_plans(id) ON DELETE SET NULL,
  diagnosed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.root_cause_diagnostics TO authenticated;
GRANT ALL ON public.root_cause_diagnostics TO service_role;
ALTER TABLE public.root_cause_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view diagnostics"
  ON public.root_cause_diagnostics FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Company members can create diagnostics"
  ON public.root_cause_diagnostics FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Owner or admin/hr can update diagnostics"
  ON public.root_cause_diagnostics FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid())
         AND (created_by = auth.uid() OR public.is_admin_or_hr(auth.uid())))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Owner or admin/hr can delete diagnostics"
  ON public.root_cause_diagnostics FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid())
         AND (created_by = auth.uid() OR public.is_admin_or_hr(auth.uid())));

CREATE TRIGGER update_root_cause_diagnostics_updated_at
  BEFORE UPDATE ON public.root_cause_diagnostics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_rcd_company ON public.root_cause_diagnostics(company_id);

-- 2. Recommended actions
CREATE TABLE public.root_cause_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagnostic_id uuid NOT NULL REFERENCES public.root_cause_diagnostics(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  action_type text NOT NULL DEFAULT 'process',
  title text NOT NULL,
  description text,
  rationale text,
  target_population text,
  headcount integer,
  owner_name text,
  due_date date,
  priority text NOT NULL DEFAULT 'medium',
  effort text,
  expected_impact text,
  estimated_cost_mad numeric,
  is_training boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'proposed',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.root_cause_actions TO authenticated;
GRANT ALL ON public.root_cause_actions TO service_role;
ALTER TABLE public.root_cause_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view actions"
  ON public.root_cause_actions FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Company members can create actions"
  ON public.root_cause_actions FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid())
              AND EXISTS (SELECT 1 FROM public.root_cause_diagnostics d
                          WHERE d.id = diagnostic_id
                            AND d.company_id = public.get_user_company_id(auth.uid())));

CREATE POLICY "Owner or admin/hr can update actions"
  ON public.root_cause_actions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.root_cause_diagnostics d
                 WHERE d.id = diagnostic_id
                   AND d.company_id = public.get_user_company_id(auth.uid())
                   AND (d.created_by = auth.uid() OR public.is_admin_or_hr(auth.uid()))))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Owner or admin/hr can delete actions"
  ON public.root_cause_actions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.root_cause_diagnostics d
                 WHERE d.id = diagnostic_id
                   AND d.company_id = public.get_user_company_id(auth.uid())
                   AND (d.created_by = auth.uid() OR public.is_admin_or_hr(auth.uid()))));

CREATE TRIGGER update_root_cause_actions_updated_at
  BEFORE UPDATE ON public.root_cause_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_rca_diagnostic ON public.root_cause_actions(diagnostic_id);

-- 3. Impact measurement loop
CREATE TABLE public.diagnostic_impact_measurements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagnostic_id uuid NOT NULL REFERENCES public.root_cause_diagnostics(id) ON DELETE CASCADE,
  action_id uuid REFERENCES public.root_cause_actions(id) ON DELETE SET NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  kpi_name text NOT NULL,
  unit text,
  baseline_value numeric,
  target_value numeric,
  actual_value numeric,
  measured_at date,
  direction text NOT NULL DEFAULT 'decrease',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostic_impact_measurements TO authenticated;
GRANT ALL ON public.diagnostic_impact_measurements TO service_role;
ALTER TABLE public.diagnostic_impact_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view measurements"
  ON public.diagnostic_impact_measurements FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Company members can create measurements"
  ON public.diagnostic_impact_measurements FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid())
              AND EXISTS (SELECT 1 FROM public.root_cause_diagnostics d
                          WHERE d.id = diagnostic_id
                            AND d.company_id = public.get_user_company_id(auth.uid())));

CREATE POLICY "Owner or admin/hr can update measurements"
  ON public.diagnostic_impact_measurements FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.root_cause_diagnostics d
                 WHERE d.id = diagnostic_id
                   AND d.company_id = public.get_user_company_id(auth.uid())
                   AND (d.created_by = auth.uid() OR public.is_admin_or_hr(auth.uid()))))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Owner or admin/hr can delete measurements"
  ON public.diagnostic_impact_measurements FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.root_cause_diagnostics d
                 WHERE d.id = diagnostic_id
                   AND d.company_id = public.get_user_company_id(auth.uid())
                   AND (d.created_by = auth.uid() OR public.is_admin_or_hr(auth.uid()))));

CREATE TRIGGER update_dim_updated_at
  BEFORE UPDATE ON public.diagnostic_impact_measurements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_dim_diagnostic ON public.diagnostic_impact_measurements(diagnostic_id);