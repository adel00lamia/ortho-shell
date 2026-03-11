
CREATE TABLE public.company_employees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  full_name text NOT NULL,
  email text,
  department text,
  position text,
  matricule text,
  phone text,
  hire_date date,
  contract_type text DEFAULT 'CDI',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view employees in their company"
  ON public.company_employees FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "HR/Admin can manage employees"
  ON public.company_employees FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()));

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.company_employees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
