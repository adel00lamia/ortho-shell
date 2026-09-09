ALTER TABLE public.evidence_pulse_responses
  ADD COLUMN IF NOT EXISTS submission_token text;

CREATE UNIQUE INDEX IF NOT EXISTS evidence_pulse_responses_token_uniq
  ON public.evidence_pulse_responses (pulse_id, submission_token)
  WHERE submission_token IS NOT NULL;

CREATE OR REPLACE FUNCTION public.evidence_pulse_submit(
  _code text,
  _answers jsonb,
  _free_text text DEFAULT NULL,
  _name text DEFAULT NULL,
  _role text DEFAULT NULL,
  _token text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _pid uuid; _open boolean; _identity boolean; _questions jsonb;
  _id uuid; _count int; _recent int; _key text; _val text; _allowed text[];
  _tok text;
BEGIN
  SELECT id, is_open, allow_identity, questions
    INTO _pid, _open, _identity, _questions
  FROM public.evidence_pulses WHERE upper(code) = upper(trim(_code)) LIMIT 1;

  IF _pid IS NULL THEN RAISE EXCEPTION 'invalid code'; END IF;
  IF NOT _open THEN RAISE EXCEPTION 'pulse closed'; END IF;

  IF _answers IS NULL OR jsonb_typeof(_answers) <> 'object' THEN
    RAISE EXCEPTION 'answers required';
  END IF;

  -- payload guards
  IF length(_answers::text) > 6000 THEN RAISE EXCEPTION 'payload too large'; END IF;
  IF (SELECT count(*) FROM jsonb_object_keys(_answers)) > 5 THEN
    RAISE EXCEPTION 'too many answers';
  END IF;

  -- keys must match the configured questions; text answers capped at 800 chars
  SELECT array_agg(q->>'id') INTO _allowed FROM jsonb_array_elements(_questions) q;
  FOR _key, _val IN SELECT k, _answers->>k FROM jsonb_object_keys(_answers) k LOOP
    IF _allowed IS NULL OR NOT (_key = ANY (_allowed)) THEN
      RAISE EXCEPTION 'unknown question';
    END IF;
    IF _val IS NOT NULL AND length(_val) > 800 THEN
      RAISE EXCEPTION 'answer too long';
    END IF;
  END LOOP;

  -- volume + rate protection
  SELECT count(*) INTO _count FROM public.evidence_pulse_responses WHERE pulse_id = _pid;
  IF _count >= 2000 THEN RAISE EXCEPTION 'too many responses'; END IF;

  SELECT count(*) INTO _recent FROM public.evidence_pulse_responses
  WHERE pulse_id = _pid AND created_at > now() - interval '1 minute';
  IF _recent >= 15 THEN RAISE EXCEPTION 'rate limit, please retry shortly'; END IF;

  _tok := left(nullif(trim(coalesce(_token, '')), ''), 64);
  IF _tok IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.evidence_pulse_responses
    WHERE pulse_id = _pid AND submission_token = _tok
  ) THEN
    RAISE EXCEPTION 'already submitted';
  END IF;

  INSERT INTO public.evidence_pulse_responses(
    pulse_id, answers, free_text, respondent_name, respondent_role, submission_token)
  VALUES (
    _pid,
    _answers,
    left(_free_text, 1000),
    CASE WHEN _identity THEN left(_name, 120) ELSE NULL END,
    CASE WHEN _identity THEN left(_role, 120) ELSE NULL END,
    _tok
  )
  RETURNING id INTO _id;

  RETURN _id;
END;
$function$;

-- Least-privilege execution grants.
REVOKE ALL ON FUNCTION public.evidence_pulse_submit(text, jsonb, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.evidence_pulse_submit(text, jsonb, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.evidence_pulse_submit(text, jsonb, text, text, text, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.evidence_pulse_get(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.evidence_pulse_get(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.evidence_pulse_aggregate(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.evidence_pulse_aggregate(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.qimatak_executive_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.qimatak_executive_overview() TO authenticated;