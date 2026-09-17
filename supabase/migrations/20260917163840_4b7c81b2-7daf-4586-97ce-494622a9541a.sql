CREATE TABLE public.development_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_name text NOT NULL,
  employee_email text,
  department text,
  position_title text,
  skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
  skill_name text NOT NULL,
  source_type text NOT NULL DEFAULT 'manual',
  source_id uuid,
  current_level integer,
  target_level integer,
  lever text NOT NULL DEFAULT 'upskilling',
  training_plan_id uuid REFERENCES public.training_plans(id) ON DELETE SET NULL,
  training_module_id uuid REFERENCES public.training_modules(id) ON DELETE SET NULL,
  action_id uuid REFERENCES public.root_cause_actions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'detected',
  achieved_level integer,
  completed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX development_items_company_idx ON public.development_items (company_id);
CREATE INDEX development_items_status_idx ON public.development_items (company_id, status);
CREATE INDEX development_items_employee_idx ON public.development_items (company_id, employee_name);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.development_items TO authenticated;
GRANT ALL ON public.development_items TO service_role;

ALTER TABLE public.development_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view development items"
  ON public.development_items FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Admin or HR can create development items"
  ON public.development_items FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_admin_or_hr(auth.uid())
  );

CREATE POLICY "Admin or HR can update development items"
  ON public.development_items FOR UPDATE TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_admin_or_hr(auth.uid())
  )
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_admin_or_hr(auth.uid())
  );

CREATE POLICY "Admin or HR can delete development items"
  ON public.development_items FOR DELETE TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_admin_or_hr(auth.uid())
  );

CREATE TRIGGER development_items_set_updated_at
  BEFORE UPDATE ON public.development_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();