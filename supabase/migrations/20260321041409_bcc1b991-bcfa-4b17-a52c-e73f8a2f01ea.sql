
-- =============================================
-- STEP 1: Create missing skills taxonomy tables
-- =============================================

-- skill_categories
CREATE TABLE public.skill_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name_fr text NOT NULL,
  name_en text NOT NULL,
  ofppt_sector_code text,
  icon text NOT NULL DEFAULT 'BookOpen',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view skill categories in their company"
  ON public.skill_categories FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "HR/Admin can manage skill categories"
  ON public.skill_categories FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()));

-- skills
CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.skill_categories(id) ON DELETE CASCADE,
  name_fr text NOT NULL,
  name_en text NOT NULL,
  description text,
  max_level integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view skills in their company"
  ON public.skills FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "HR/Admin can manage skills"
  ON public.skills FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()));

-- employee_skills
CREATE TABLE public.employee_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_name text NOT NULL,
  employee_email text,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  current_level integer NOT NULL DEFAULT 1,
  target_level integer NOT NULL DEFAULT 3,
  assessed_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  UNIQUE(company_id, employee_name, skill_id)
);
ALTER TABLE public.employee_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view employee skills in their company"
  ON public.employee_skills FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "HR/Admin can manage employee skills"
  ON public.employee_skills FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()));

-- seed_default_skills RPC
CREATE OR REPLACE FUNCTION public.seed_default_skills(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cat_id uuid;
BEGIN
  -- Technical Skills
  INSERT INTO skill_categories (company_id, name_fr, name_en, icon, sort_order)
  VALUES (p_company_id, 'Compétences Techniques', 'Technical Skills', 'Code', 1)
  RETURNING id INTO cat_id;
  INSERT INTO skills (company_id, category_id, name_fr, name_en) VALUES
    (p_company_id, cat_id, 'Programmation', 'Programming'),
    (p_company_id, cat_id, 'Analyse de données', 'Data Analysis'),
    (p_company_id, cat_id, 'Gestion de projet', 'Project Management'),
    (p_company_id, cat_id, 'Cybersécurité', 'Cybersecurity');

  -- Soft Skills
  INSERT INTO skill_categories (company_id, name_fr, name_en, icon, sort_order)
  VALUES (p_company_id, 'Compétences Comportementales', 'Soft Skills', 'Users', 2)
  RETURNING id INTO cat_id;
  INSERT INTO skills (company_id, category_id, name_fr, name_en) VALUES
    (p_company_id, cat_id, 'Communication', 'Communication'),
    (p_company_id, cat_id, 'Leadership', 'Leadership'),
    (p_company_id, cat_id, 'Travail d''équipe', 'Teamwork'),
    (p_company_id, cat_id, 'Résolution de problèmes', 'Problem Solving');

  -- Management
  INSERT INTO skill_categories (company_id, name_fr, name_en, icon, sort_order)
  VALUES (p_company_id, 'Management', 'Management', 'Briefcase', 3)
  RETURNING id INTO cat_id;
  INSERT INTO skills (company_id, category_id, name_fr, name_en) VALUES
    (p_company_id, cat_id, 'Gestion d''équipe', 'Team Management'),
    (p_company_id, cat_id, 'Planification stratégique', 'Strategic Planning'),
    (p_company_id, cat_id, 'Gestion budgétaire', 'Budget Management');

  -- Digital
  INSERT INTO skill_categories (company_id, name_fr, name_en, icon, sort_order)
  VALUES (p_company_id, 'Compétences Numériques', 'Digital Skills', 'Monitor', 4)
  RETURNING id INTO cat_id;
  INSERT INTO skills (company_id, category_id, name_fr, name_en) VALUES
    (p_company_id, cat_id, 'Suite Office', 'Office Suite'),
    (p_company_id, cat_id, 'Outils collaboratifs', 'Collaboration Tools'),
    (p_company_id, cat_id, 'Marketing digital', 'Digital Marketing');
END;
$$;

-- =============================================
-- STEP 2: Fix job_descriptions INSERT RLS
-- =============================================
DROP POLICY IF EXISTS "Users can create job descriptions" ON public.job_descriptions;
CREATE POLICY "Users can create job descriptions"
  ON public.job_descriptions FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND company_id = get_user_company_id(auth.uid()));

-- Also fix SELECT/UPDATE/DELETE to be company-scoped
DROP POLICY IF EXISTS "Users can view their job descriptions" ON public.job_descriptions;
CREATE POLICY "Users can view job descriptions in their company"
  ON public.job_descriptions FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Users can update their job descriptions" ON public.job_descriptions;
CREATE POLICY "HR/Admin can update job descriptions"
  ON public.job_descriptions FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()));

DROP POLICY IF EXISTS "Users can delete their job descriptions" ON public.job_descriptions;
CREATE POLICY "HR/Admin can delete job descriptions"
  ON public.job_descriptions FOR DELETE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()));

-- =============================================
-- STEP 3: Consolidate role checks to use has_role/is_admin_or_hr
-- =============================================

-- training_plans: fix INSERT and UPDATE
DROP POLICY IF EXISTS "HR managers and admins can create training plans" ON public.training_plans;
CREATE POLICY "HR/Admin can create training plans"
  ON public.training_plans FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()));

DROP POLICY IF EXISTS "HR managers and admins can update training plans in their compa" ON public.training_plans;
CREATE POLICY "HR/Admin can update training plans"
  ON public.training_plans FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()));

DROP POLICY IF EXISTS "Users can view training plans in their company" ON public.training_plans;
CREATE POLICY "Users can view training plans in their company"
  ON public.training_plans FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

-- STEP 7: Add DELETE policy for training_plans
CREATE POLICY "HR/Admin can delete training plans"
  ON public.training_plans FOR DELETE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()));

-- training_diagnostics
DROP POLICY IF EXISTS "HR managers and admins can manage diagnostics" ON public.training_diagnostics;
CREATE POLICY "HR/Admin can manage diagnostics"
  ON public.training_diagnostics FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()));

DROP POLICY IF EXISTS "Users can view diagnostics in their company" ON public.training_diagnostics;
CREATE POLICY "Users can view diagnostics in their company"
  ON public.training_diagnostics FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

-- inferred_skills
DROP POLICY IF EXISTS "managers_read_company_inferred_skills" ON public.inferred_skills;
CREATE POLICY "HR/Admin can view company inferred skills"
  ON public.inferred_skills FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()));

-- job_applications
DROP POLICY IF EXISTS "managers_read_company_applications" ON public.job_applications;
CREATE POLICY "HR/Admin can view company applications"
  ON public.job_applications FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()));

-- learner_module_progress: fix HR/Admin SELECT
DROP POLICY IF EXISTS "HR/Admin can view company progress" ON public.learner_module_progress;
CREATE POLICY "HR/Admin can view company progress"
  ON public.learner_module_progress FOR SELECT TO authenticated
  USING (
    module_id IN (
      SELECT tm.id FROM training_modules tm
      JOIN training_plans tp ON tm.training_plan_id = tp.id
      WHERE tp.company_id = get_user_company_id(auth.uid())
    )
    AND is_admin_or_hr(auth.uid())
  );

-- training_modules: fix role checks
DROP POLICY IF EXISTS "HR managers and admins can manage modules" ON public.training_modules;
CREATE POLICY "HR/Admin can manage modules"
  ON public.training_modules FOR ALL TO authenticated
  USING (
    training_plan_id IN (
      SELECT tp.id FROM training_plans tp
      WHERE tp.company_id = get_user_company_id(auth.uid())
    )
    AND is_admin_or_hr(auth.uid())
  )
  WITH CHECK (
    training_plan_id IN (
      SELECT tp.id FROM training_plans tp
      WHERE tp.company_id = get_user_company_id(auth.uid())
    )
    AND is_admin_or_hr(auth.uid())
  );

DROP POLICY IF EXISTS "Users can view modules in their company training plans" ON public.training_modules;
CREATE POLICY "Users can view modules in their company"
  ON public.training_modules FOR SELECT TO authenticated
  USING (
    training_plan_id IN (
      SELECT tp.id FROM training_plans tp
      WHERE tp.company_id = get_user_company_id(auth.uid())
    )
  );

-- =============================================
-- STEP 6: Restrict public plan templates
-- =============================================
DROP POLICY IF EXISTS "Users can view their own templates" ON public.plan_templates;
CREATE POLICY "Users can view their own templates"
  ON public.plan_templates FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
