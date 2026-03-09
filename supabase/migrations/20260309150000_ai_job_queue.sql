-- Async AI job queue for long-running operations
-- (plan generation, report generation, skill analysis, etc.)

CREATE TABLE IF NOT EXISTS ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_type text NOT NULL CHECK (job_type IN (
    'plan_generation', 'skill_analysis', 'report_generation',
    'content_suggestion', 'benchmark_analysis'
  )),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'cancelled'
  )),
  input_data jsonb NOT NULL DEFAULT '{}',
  output_data jsonb,
  error_message text,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_user ON ai_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_company ON ai_jobs(company_id);

ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own jobs" ON ai_jobs
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users create jobs" ON ai_jobs
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users cancel own jobs" ON ai_jobs
  FOR UPDATE USING (user_id = auth.uid() AND status = 'pending');

-- Notify on new job (for edge function or webhook processing)
CREATE OR REPLACE FUNCTION notify_new_ai_job()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_notify('new_ai_job', json_build_object(
    'id', NEW.id,
    'job_type', NEW.job_type,
    'user_id', NEW.user_id
  )::text);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_ai_job ON ai_jobs;
CREATE TRIGGER trg_notify_ai_job
  AFTER INSERT ON ai_jobs
  FOR EACH ROW EXECUTE FUNCTION notify_new_ai_job();
