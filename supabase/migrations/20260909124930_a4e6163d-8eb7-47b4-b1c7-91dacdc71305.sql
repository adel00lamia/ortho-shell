-- 1. Richer root-cause model + versioned reassessment on existing diagnostics
ALTER TABLE public.root_cause_diagnostics
  ADD COLUMN IF NOT EXISTS cause_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS training_fit_explanation jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS training_fit_signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_diagnostic_id uuid REFERENCES public.root_cause_diagnostics(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rcd_parent ON public.root_cause_diagnostics(parent_diagnostic_id);

-- 2. Evidence Pulse: short public evidence collection tied to a diagnostic
CREATE TABLE IF NOT EXISTS public.evidence_pulses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id uuid NOT NULL REFERENCES public.root_cause_diagnostics(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  code text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT 'Evidence Pulse',
  audience text NOT NULL DEFAULT 'employees',
  locale text NOT NULL DEFAULT 'fr',
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  allow_identity boolean NOT NULL DEFAULT false,
  is_open boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence_pulses TO authenticated;
GRANT ALL ON public.evidence_pulses TO service_role;
ALTER TABLE public.evidence_pulses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members read their evidence pulses"
  ON public.evidence_pulses FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Company members create evidence pulses"
  ON public.evidence_pulses FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Company members update their evidence pulses"
  ON public.evidence_pulses FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Admin or HR delete evidence pulses"
  ON public.evidence_pulses FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND public.is_admin_or_hr(auth.uid()));

CREATE TABLE IF NOT EXISTS public.evidence_pulse_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pulse_id uuid NOT NULL REFERENCES public.evidence_pulses(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  free_text text,
  respondent_name text,
  respondent_role text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_epr_pulse ON public.evidence_pulse_responses(pulse_id);

GRANT SELECT ON public.evidence_pulse_responses TO authenticated;
GRANT ALL ON public.evidence_pulse_responses TO service_role;
ALTER TABLE public.evidence_pulse_responses ENABLE ROW LEVEL SECURITY;

-- Responses are written only through the security-definer RPC below (anonymous participants).
CREATE POLICY "Company members read pulse responses"
  ON public.evidence_pulse_responses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.evidence_pulses p
    WHERE p.id = pulse_id AND p.company_id = public.get_user_company_id(auth.uid())
  ));

CREATE TRIGGER trg_evidence_pulses_updated_at
  BEFORE UPDATE ON public.evidence_pulses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Public (anonymous) access to a pulse: neutral fields only, never the case details
CREATE OR REPLACE FUNCTION public.evidence_pulse_get(_code text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', p.id,
    'code', p.code,
    'title', p.title,
    'audience', p.audience,
    'locale', p.locale,
    'questions', p.questions,
    'allow_identity', p.allow_identity,
    'is_open', p.is_open
  )
  FROM public.evidence_pulses p
  WHERE upper(p.code) = upper(trim(_code))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.evidence_pulse_submit(
  _code text,
  _answers jsonb,
  _free_text text DEFAULT NULL,
  _name text DEFAULT NULL,
  _role text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _pid uuid; _open boolean; _identity boolean; _id uuid; _count int;
BEGIN
  SELECT id, is_open, allow_identity INTO _pid, _open, _identity
  FROM public.evidence_pulses WHERE upper(code) = upper(trim(_code)) LIMIT 1;

  IF _pid IS NULL THEN RAISE EXCEPTION 'invalid code'; END IF;
  IF NOT _open THEN RAISE EXCEPTION 'pulse closed'; END IF;

  SELECT count(*) INTO _count FROM public.evidence_pulse_responses WHERE pulse_id = _pid;
  IF _count >= 2000 THEN RAISE EXCEPTION 'too many responses'; END IF;

  IF _answers IS NULL OR jsonb_typeof(_answers) <> 'object' THEN
    RAISE EXCEPTION 'answers required';
  END IF;

  INSERT INTO public.evidence_pulse_responses(pulse_id, answers, free_text, respondent_name, respondent_role)
  VALUES (
    _pid,
    _answers,
    left(_free_text, 1000),
    CASE WHEN _identity THEN left(_name, 120) ELSE NULL END,
    CASE WHEN _identity THEN left(_role, 120) ELSE NULL END
  )
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.evidence_pulse_get(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.evidence_pulse_submit(text, jsonb, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.evidence_pulse_get(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.evidence_pulse_submit(text, jsonb, text, text, text) TO anon, authenticated;