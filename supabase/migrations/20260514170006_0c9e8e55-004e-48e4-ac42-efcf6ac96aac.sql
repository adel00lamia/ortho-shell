-- 1. Extend job_descriptions with employment_type
ALTER TABLE public.job_descriptions
  ADD COLUMN IF NOT EXISTS employment_type text NOT NULL DEFAULT 'full_time'
  CHECK (employment_type IN ('full_time','part_time','contract','internship'));

CREATE INDEX IF NOT EXISTS idx_job_descriptions_employment_type
  ON public.job_descriptions(employment_type);

-- 2. Student profiles
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  company_id uuid,
  full_name text,
  email text,
  phone text,
  school text,
  field_of_study text,
  graduation_year integer,
  bio text,
  languages jsonb NOT NULL DEFAULT '[]'::jsonb,
  interests text[] NOT NULL DEFAULT '{}',
  education jsonb NOT NULL DEFAULT '[]'::jsonb,
  experiences jsonb NOT NULL DEFAULT '[]'::jsonb,
  technical_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  soft_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  cv_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  cv_url text,
  interview_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own student profile"
  ON public.student_profiles FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "HR/Admin can view company student profiles"
  ON public.student_profiles FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL
    AND company_id = public.get_user_company_id(auth.uid())
    AND public.is_admin_or_hr(auth.uid())
  );

CREATE TRIGGER trg_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON public.student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_company_id ON public.student_profiles(company_id);