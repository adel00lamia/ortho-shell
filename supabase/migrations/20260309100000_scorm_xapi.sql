-- SCORM/xAPI support: add SCORM fields to modules + xAPI event logging

-- Add SCORM fields to training_modules
ALTER TABLE public.training_modules
  ADD COLUMN IF NOT EXISTS scorm_url text,
  ADD COLUMN IF NOT EXISTS scorm_version text CHECK (scorm_version IN ('1.2', '2004', null)),
  ADD COLUMN IF NOT EXISTS scorm_entry_point text DEFAULT 'index.html';

-- xAPI learning events table
CREATE TABLE IF NOT EXISTS public.xapi_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.training_modules(id) ON DELETE SET NULL,
  verb text NOT NULL,              -- 'launched', 'completed', 'passed', 'failed', 'progressed', 'answered', 'suspended', 'resumed'
  object_type text NOT NULL,       -- 'module', 'slide', 'quiz', 'scorm_package'
  object_id text,                  -- slide index, quiz question id, etc.
  result_score numeric,            -- 0-100
  result_success boolean,
  result_duration interval,        -- time spent
  result_response text,            -- learner's answer
  context_data jsonb DEFAULT '{}', -- extra metadata (attempt, bookmark, etc.)
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_xapi_events_company ON public.xapi_events(company_id);
CREATE INDEX idx_xapi_events_user ON public.xapi_events(user_id);
CREATE INDEX idx_xapi_events_module ON public.xapi_events(module_id);
CREATE INDEX idx_xapi_events_verb ON public.xapi_events(verb);
CREATE INDEX idx_xapi_events_created ON public.xapi_events(created_at DESC);

ALTER TABLE public.xapi_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own xAPI events"
  ON public.xapi_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own xAPI events"
  ON public.xapi_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "HR/Admin can view all company xAPI events"
  ON public.xapi_events FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
