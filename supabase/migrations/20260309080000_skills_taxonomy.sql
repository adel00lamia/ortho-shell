-- Skills Taxonomy: structured skill categories with OFPPT sector alignment
-- and employee skill tracking with proficiency levels

-- Skill categories (aligned with OFPPT sectors)
CREATE TABLE IF NOT EXISTS public.skill_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name_fr text NOT NULL,
  name_en text NOT NULL,
  ofppt_sector_code text,
  icon text DEFAULT 'layers',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_skill_categories_company ON public.skill_categories(company_id);
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company skill categories"
  ON public.skill_categories FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "HR/Admin can manage skill categories"
  ON public.skill_categories FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Skills (individual competencies within categories)
CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.skill_categories(id) ON DELETE CASCADE,
  name_fr text NOT NULL,
  name_en text NOT NULL,
  description text,
  max_level integer DEFAULT 5,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_skills_company ON public.skills(company_id);
CREATE INDEX idx_skills_category ON public.skills(category_id);
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company skills"
  ON public.skills FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "HR/Admin can manage skills"
  ON public.skills FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Employee skills (current level vs target level per employee)
CREATE TABLE IF NOT EXISTS public.employee_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_name text NOT NULL,
  employee_email text,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  current_level integer NOT NULL DEFAULT 1 CHECK (current_level >= 0 AND current_level <= 5),
  target_level integer NOT NULL DEFAULT 3 CHECK (target_level >= 0 AND target_level <= 5),
  assessed_at timestamptz DEFAULT now(),
  assessed_by uuid REFERENCES auth.users(id),
  notes text
);

CREATE INDEX idx_employee_skills_company ON public.employee_skills(company_id);
CREATE INDEX idx_employee_skills_skill ON public.employee_skills(skill_id);
CREATE INDEX idx_employee_skills_employee ON public.employee_skills(employee_name);
ALTER TABLE public.employee_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company employee skills"
  ON public.employee_skills FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "HR/Admin can manage employee skills"
  ON public.employee_skills FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
