CREATE TABLE public.student_soft_skill_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid,
  skill_key text NOT NULL,
  level integer NOT NULL DEFAULT 3 CHECK (level BETWEEN 1 AND 5),
  completed_lessons integer[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_key)
);

CREATE INDEX idx_sssp_user ON public.student_soft_skill_progress(user_id);
CREATE INDEX idx_sssp_company ON public.student_soft_skill_progress(company_id);

ALTER TABLE public.student_soft_skill_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own soft-skill progress"
  ON public.student_soft_skill_progress
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "HR/Admin can view company soft-skill progress"
  ON public.student_soft_skill_progress
  FOR SELECT
  TO authenticated
  USING (company_id IS NOT NULL AND company_id = get_user_company_id(auth.uid()) AND is_admin_or_hr(auth.uid()));

CREATE TRIGGER trg_sssp_updated_at
  BEFORE UPDATE ON public.student_soft_skill_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();