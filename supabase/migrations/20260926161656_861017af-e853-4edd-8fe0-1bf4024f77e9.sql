CREATE TABLE public.strategic_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'growth',
  horizon text,
  priority int NOT NULL DEFAULT 3,
  target_kpi text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.business_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  domain text,
  current_maturity int NOT NULL DEFAULT 2 CHECK (current_maturity BETWEEN 1 AND 5),
  target_maturity int NOT NULL DEFAULT 4 CHECK (target_maturity BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.objective_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  objective_id uuid NOT NULL REFERENCES public.strategic_objectives(id) ON DELETE CASCADE,
  capability_id uuid NOT NULL REFERENCES public.business_capabilities(id) ON DELETE CASCADE,
  criticality int NOT NULL DEFAULT 3 CHECK (criticality BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (objective_id, capability_id)
);
CREATE TABLE public.business_processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  capability_id uuid REFERENCES public.business_capabilities(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  owner_role text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.process_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  process_id uuid NOT NULL REFERENCES public.business_processes(id) ON DELETE CASCADE,
  name text NOT NULL,
  role_name text,
  hours_per_week numeric NOT NULL DEFAULT 0,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  operating_mode text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['strategic_objectives','business_capabilities','objective_capabilities','business_processes','process_tasks'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Company members read %1$s" ON public.%1$I FOR SELECT TO authenticated USING (company_id = public.get_user_company_id(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Admin HR insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND public.is_admin_or_hr(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Admin HR update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (company_id = public.get_user_company_id(auth.uid()) AND public.is_admin_or_hr(auth.uid())) WITH CHECK (company_id = public.get_user_company_id(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Admin HR delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (company_id = public.get_user_company_id(auth.uid()) AND public.is_admin_or_hr(auth.uid()))', t);
  END LOOP;
END $$;
CREATE INDEX ON public.strategic_objectives(company_id);
CREATE INDEX ON public.business_capabilities(company_id);
CREATE INDEX ON public.business_processes(company_id);
CREATE INDEX ON public.process_tasks(process_id);