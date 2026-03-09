-- Full RLS audit: ensure organization_id (company_id) scoping on all tables
-- This migration adds missing RLS policies and tightens existing ones

-- Helper: get current user's company_id
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ===== assessment_reports =====
ALTER TABLE assessment_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Company members see own reports" ON assessment_reports;
CREATE POLICY "Company members see own reports" ON assessment_reports
  FOR SELECT USING (company_id = get_current_user_company_id());
DROP POLICY IF EXISTS "Company members create reports" ON assessment_reports;
CREATE POLICY "Company members create reports" ON assessment_reports
  FOR INSERT WITH CHECK (company_id = get_current_user_company_id());
DROP POLICY IF EXISTS "Company members update own reports" ON assessment_reports;
CREATE POLICY "Company members update own reports" ON assessment_reports
  FOR UPDATE USING (company_id = get_current_user_company_id());

-- ===== companies =====
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Company members see own company" ON companies;
CREATE POLICY "Company members see own company" ON companies
  FOR SELECT USING (id = get_current_user_company_id());
DROP POLICY IF EXISTS "Company admins update own company" ON companies;
CREATE POLICY "Company admins update own company" ON companies
  FOR UPDATE USING (id = get_current_user_company_id() AND is_admin_or_hr(auth.uid()));

-- ===== departments =====
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments') THEN
    ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Company members see own departments" ON departments;
    EXECUTE 'CREATE POLICY "Company members see own departments" ON departments FOR SELECT USING (company_id = get_current_user_company_id())';
    DROP POLICY IF EXISTS "Admin/HR manage departments" ON departments;
    EXECUTE 'CREATE POLICY "Admin/HR manage departments" ON departments FOR ALL USING (company_id = get_current_user_company_id() AND is_admin_or_hr(auth.uid()))';
  END IF;
END $$;

-- ===== job_descriptions =====
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Company members see own JDs" ON job_descriptions;
CREATE POLICY "Company members see own JDs" ON job_descriptions
  FOR SELECT USING (company_id = get_current_user_company_id());
DROP POLICY IF EXISTS "Admin/HR manage JDs" ON job_descriptions;
CREATE POLICY "Admin/HR manage JDs" ON job_descriptions
  FOR ALL USING (company_id = get_current_user_company_id() AND is_admin_or_hr(auth.uid()));

-- ===== performance_evaluations =====
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_evaluations') THEN
    ALTER TABLE performance_evaluations ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Company members see own evals" ON performance_evaluations;
    EXECUTE 'CREATE POLICY "Company members see own evals" ON performance_evaluations FOR SELECT USING (company_id = get_current_user_company_id())';
    DROP POLICY IF EXISTS "Admin/HR manage evals" ON performance_evaluations;
    EXECUTE 'CREATE POLICY "Admin/HR manage evals" ON performance_evaluations FOR ALL USING (company_id = get_current_user_company_id() AND is_admin_or_hr(auth.uid()))';
  END IF;
END $$;

-- ===== training_plans =====
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Company members see own plans" ON training_plans;
CREATE POLICY "Company members see own plans" ON training_plans
  FOR SELECT USING (company_id = get_current_user_company_id());
DROP POLICY IF EXISTS "Admin/HR manage plans" ON training_plans;
CREATE POLICY "Admin/HR manage plans" ON training_plans
  FOR ALL USING (company_id = get_current_user_company_id() AND is_admin_or_hr(auth.uid()));

-- ===== training_modules =====
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Company members see own modules" ON training_modules;
CREATE POLICY "Company members see own modules" ON training_modules
  FOR SELECT USING (
    plan_id IN (SELECT id FROM training_plans WHERE company_id = get_current_user_company_id())
    OR created_by = auth.uid()
  );

-- ===== profiles =====
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own profile" ON profiles;
CREATE POLICY "Users see own profile" ON profiles
  FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS "Company members see colleagues" ON profiles;
CREATE POLICY "Company members see colleagues" ON profiles
  FOR SELECT USING (company_id = get_current_user_company_id() AND company_id IS NOT NULL);
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ===== user_roles =====
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own role" ON user_roles;
CREATE POLICY "Users see own role" ON user_roles
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admin sees company roles" ON user_roles;
CREATE POLICY "Admin sees company roles" ON user_roles
  FOR SELECT USING (
    user_id IN (SELECT id FROM profiles WHERE company_id = get_current_user_company_id())
    AND is_admin_or_hr(auth.uid())
  );

-- ===== subscriptions =====
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users see own subscription" ON subscriptions;
    EXECUTE 'CREATE POLICY "Users see own subscription" ON subscriptions FOR SELECT USING (user_id = auth.uid())';
  END IF;
END $$;

-- ===== skill_categories & skills =====
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'skill_categories') THEN
    ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Company sees own skill categories" ON skill_categories;
    EXECUTE 'CREATE POLICY "Company sees own skill categories" ON skill_categories FOR SELECT USING (company_id = get_current_user_company_id())';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'skills') THEN
    ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Company sees own skills" ON skills;
    EXECUTE 'CREATE POLICY "Company sees own skills" ON skills FOR SELECT USING (category_id IN (SELECT id FROM skill_categories WHERE company_id = get_current_user_company_id()))';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_skills') THEN
    ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Company sees employee skills" ON employee_skills;
    EXECUTE 'CREATE POLICY "Company sees employee skills" ON employee_skills FOR SELECT USING (employee_id IN (SELECT id FROM profiles WHERE company_id = get_current_user_company_id()))';
  END IF;
END $$;

-- ===== OFPPT dossiers =====
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ofppt_reimbursement_dossiers') THEN
    ALTER TABLE ofppt_reimbursement_dossiers ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Company sees own dossiers" ON ofppt_reimbursement_dossiers;
    EXECUTE 'CREATE POLICY "Company sees own dossiers" ON ofppt_reimbursement_dossiers FOR SELECT USING (company_id = get_current_user_company_id())';
  END IF;
END $$;
