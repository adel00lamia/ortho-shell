-- Departments table for org chart
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  parent_department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  head_employee_name text,
  head_employee_email text,
  level integer NOT NULL DEFAULT 0,
  employee_count integer NOT NULL DEFAULT 0,
  budget numeric,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Positions table for detailed position tracking
CREATE TABLE public.positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  job_description_id uuid REFERENCES public.job_descriptions(id) ON DELETE SET NULL,
  title text NOT NULL,
  level text DEFAULT 'mid',
  status text NOT NULL DEFAULT 'filled',
  current_holder_name text,
  current_holder_email text,
  reports_to_position_id uuid REFERENCES public.positions(id) ON DELETE SET NULL,
  is_critical boolean DEFAULT false,
  skills_required jsonb DEFAULT '[]'::jsonb,
  skills_current jsonb DEFAULT '[]'::jsonb,
  match_score numeric,
  upskill_potential boolean DEFAULT false,
  reskill_candidate boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Skills catalog for standardized skills tracking
CREATE TABLE public.skills_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'technical',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Assessment reports table
CREATE TABLE public.assessment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  title text NOT NULL,
  report_type text NOT NULL DEFAULT 'full',
  report_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_generated boolean DEFAULT true,
  maturity_score numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for departments
CREATE POLICY "Users can view departments in their company" ON public.departments
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "HR/Admin can manage departments" ON public.departments
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()));

-- RLS policies for positions
CREATE POLICY "Users can view positions in their company" ON public.positions
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "HR/Admin can manage positions" ON public.positions
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()));

-- RLS policies for skills_catalog
CREATE POLICY "Users can view skills in their company" ON public.skills_catalog
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "HR/Admin can manage skills catalog" ON public.skills_catalog
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()));

-- RLS policies for assessment_reports
CREATE POLICY "Users can view reports in their company" ON public.assessment_reports
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "HR/Admin can manage reports" ON public.assessment_reports
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_assessment_reports_updated_at BEFORE UPDATE ON public.assessment_reports
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();