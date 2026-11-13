-- 1. Company-scoped aggregate access to pulse responses (no respondent-level rows)
CREATE OR REPLACE FUNCTION public.evidence_pulse_aggregate(_pulse_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _p public.evidence_pulses; _res jsonb;
BEGIN
  SELECT * INTO _p FROM public.evidence_pulses WHERE id = _pulse_id;
  IF _p.id IS NULL THEN RETURN NULL; END IF;
  IF _p.company_id IS DISTINCT FROM public.get_user_company_id(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_build_object(
    'pulse_id', _p.id,
    'allow_identity', _p.allow_identity,
    'responses', (SELECT count(*) FROM public.evidence_pulse_responses r WHERE r.pulse_id = _p.id),
    'questions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', t.q->>'id',
        'question', t.q->>'text',
        'type', COALESCE(t.q->>'type', 'agreement'),
        'agreement', agg.avg_score,
        'answers', agg.answered,
        'unknown', agg.unknowns,
        'texts', agg.texts
      ) ORDER BY t.q_idx)
      FROM jsonb_array_elements(_p.questions) WITH ORDINALITY AS t(q, q_idx),
      LATERAL (
        SELECT
          round(avg(s.score)) AS avg_score,
          count(*) FILTER (WHERE COALESCE(s.raw, '') <> '') AS answered,
          count(*) FILTER (WHERE s.raw = 'unknown') AS unknowns,
          COALESCE(
            jsonb_agg(left(s.raw, 500)) FILTER (
              WHERE COALESCE(t.q->>'type', 'agreement') = 'text' AND COALESCE(s.raw, '') <> ''
            ), '[]'::jsonb) AS texts
        FROM (
          SELECT
            r.answers->>(t.q->>'id') AS raw,
            CASE r.answers->>(t.q->>'id')
              WHEN 'yes' THEN 100 WHEN 'rather_yes' THEN 75
              WHEN 'rather_no' THEN 25 WHEN 'no' THEN 0 ELSE NULL END AS score
          FROM public.evidence_pulse_responses r WHERE r.pulse_id = _p.id
        ) s
      ) agg
    ), '[]'::jsonb),
    'comments', COALESCE((
      SELECT jsonb_agg(left(c.free_text, 500))
      FROM (
        SELECT free_text FROM public.evidence_pulse_responses
        WHERE pulse_id = _p.id AND COALESCE(free_text, '') <> ''
        ORDER BY created_at DESC LIMIT 30
      ) c), '[]'::jsonb),
    'identified', CASE WHEN _p.allow_identity THEN COALESCE((
        SELECT jsonb_agg(jsonb_build_object('name', r.respondent_name, 'role', r.respondent_role, 'created_at', r.created_at))
        FROM public.evidence_pulse_responses r
        WHERE r.pulse_id = _p.id AND COALESCE(r.respondent_name, '') <> ''
      ), '[]'::jsonb) ELSE '[]'::jsonb END
  ) INTO _res;

  RETURN _res;
END;
$$;

REVOKE ALL ON FUNCTION public.evidence_pulse_aggregate(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.evidence_pulse_aggregate(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.evidence_pulse_aggregate(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.evidence_pulse_aggregate(uuid) TO service_role;

-- 2. Privacy by design: no respondent-level reads for normal authenticated users
DROP POLICY IF EXISTS "Company members read pulse responses" ON public.evidence_pulse_responses;
REVOKE SELECT ON public.evidence_pulse_responses FROM authenticated;
REVOKE SELECT ON public.evidence_pulse_responses FROM anon;
GRANT ALL ON public.evidence_pulse_responses TO service_role;

-- 3. Anti-abuse hardening of the public submission RPC
CREATE OR REPLACE FUNCTION public.evidence_pulse_submit(_code text, _answers jsonb, _free_text text DEFAULT NULL::text, _name text DEFAULT NULL::text, _role text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pid uuid; _open boolean; _identity boolean; _questions jsonb;
  _id uuid; _count int; _recent int; _key text; _val text; _allowed text[];
BEGIN
  SELECT id, is_open, allow_identity, questions
    INTO _pid, _open, _identity, _questions
  FROM public.evidence_pulses WHERE upper(code) = upper(trim(_code)) LIMIT 1;

  IF _pid IS NULL THEN RAISE EXCEPTION 'invalid code'; END IF;
  IF NOT _open THEN RAISE EXCEPTION 'pulse closed'; END IF;

  IF _answers IS NULL OR jsonb_typeof(_answers) <> 'object' THEN
    RAISE EXCEPTION 'answers required';
  END IF;

  -- payload size guards
  IF length(_answers::text) > 8000 THEN RAISE EXCEPTION 'payload too large'; END IF;
  IF (SELECT count(*) FROM jsonb_object_keys(_answers)) > 10 THEN
    RAISE EXCEPTION 'too many answers';
  END IF;

  -- keys must match the configured questions
  SELECT array_agg(q->>'id') INTO _allowed FROM jsonb_array_elements(_questions) q;
  FOR _key, _val IN SELECT k, _answers->>k FROM jsonb_object_keys(_answers) k LOOP
    IF _allowed IS NULL OR NOT (_key = ANY (_allowed)) THEN
      RAISE EXCEPTION 'unknown question';
    END IF;
    IF _val IS NOT NULL AND length(_val) > 1000 THEN
      RAISE EXCEPTION 'answer too long';
    END IF;
  END LOOP;

  -- volume + rate protection
  SELECT count(*) INTO _count FROM public.evidence_pulse_responses WHERE pulse_id = _pid;
  IF _count >= 2000 THEN RAISE EXCEPTION 'too many responses'; END IF;

  SELECT count(*) INTO _recent FROM public.evidence_pulse_responses
  WHERE pulse_id = _pid AND created_at > now() - interval '1 minute';
  IF _recent >= 15 THEN RAISE EXCEPTION 'rate limit, please retry shortly'; END IF;

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

-- 4. Stop sign-up self-escalation to privileged roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _requested_role text;
  _role app_role;
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());

  _requested_role := lower(COALESCE(NEW.raw_user_meta_data->>'requested_role', 'employee'));

  -- Only non-privileged roles may be self-requested at sign-up.
  -- 'admin' and 'hr_manager' must be granted by an existing administrator.
  IF _requested_role NOT IN ('employee', 'trainer') THEN
    _requested_role := 'employee';
  END IF;

  BEGIN
    _role := _requested_role::app_role;
  EXCEPTION WHEN OTHERS THEN
    _role := 'employee';
  END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;

-- 5. Profile self-update cannot change the legacy role column
CREATE OR REPLACE FUNCTION public.current_profile_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_profile_role(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_profile_role(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.current_profile_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_role(uuid) TO service_role;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role IS NOT DISTINCT FROM public.current_profile_role(auth.uid())
);