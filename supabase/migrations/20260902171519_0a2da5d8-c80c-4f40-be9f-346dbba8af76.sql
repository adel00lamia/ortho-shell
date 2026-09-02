-- 1. Access code on participants
ALTER TABLE public.diagnostic_participants ADD COLUMN IF NOT EXISTS access_code text;
CREATE UNIQUE INDEX IF NOT EXISTS diagnostic_participants_access_code_key
  ON public.diagnostic_participants(access_code) WHERE access_code IS NOT NULL;

-- 2. KPIs
CREATE TABLE public.diagnostic_participant_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.diagnostic_participants(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit text,
  baseline_value numeric,
  target_value numeric,
  direction text NOT NULL DEFAULT 'down',
  source text NOT NULL DEFAULT 'custom',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.diagnostic_participant_kpis TO authenticated;
GRANT ALL ON public.diagnostic_participant_kpis TO service_role;
ALTER TABLE public.diagnostic_participant_kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read participant kpis"
  ON public.diagnostic_participant_kpis FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_dpk_updated_at BEFORE UPDATE ON public.diagnostic_participant_kpis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Readings
CREATE TABLE public.diagnostic_kpi_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id uuid NOT NULL REFERENCES public.diagnostic_participant_kpis(id) ON DELETE CASCADE,
  value numeric NOT NULL,
  measured_at date NOT NULL DEFAULT current_date,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.diagnostic_kpi_readings TO authenticated;
GRANT ALL ON public.diagnostic_kpi_readings TO service_role;
ALTER TABLE public.diagnostic_kpi_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read kpi readings"
  ON public.diagnostic_kpi_readings FOR SELECT TO authenticated USING (true);

-- 4. Module tracking
CREATE TABLE public.diagnostic_participant_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.diagnostic_participants(id) ON DELETE CASCADE,
  module_id text NOT NULL,
  status text NOT NULL DEFAULT 'todo',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participant_id, module_id)
);
GRANT SELECT ON public.diagnostic_participant_modules TO authenticated;
GRANT ALL ON public.diagnostic_participant_modules TO service_role;
ALTER TABLE public.diagnostic_participant_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read participant modules"
  ON public.diagnostic_participant_modules FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_dpm_updated_at BEFORE UPDATE ON public.diagnostic_participant_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Portal functions (code-scoped, no PII returned)
CREATE OR REPLACE FUNCTION public.portal_participant_id(_code text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.diagnostic_participants
  WHERE access_code IS NOT NULL AND upper(access_code) = upper(trim(_code)) LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.portal_participant_id(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.portal_get_participant(_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _pid uuid; _res jsonb;
BEGIN
  _pid := public.portal_participant_id(_code);
  IF _pid IS NULL THEN RETURN NULL; END IF;

  SELECT jsonb_build_object(
    'id', p.id,
    'session_id', p.session_id,
    'locale', p.locale,
    'hr_function', p.hr_function,
    'job_title', p.job_title,
    'sector', p.sector,
    'company_size', p.company_size,
    'created_at', p.created_at,
    'dimension_scores', p.dimension_scores,
    'opportunity_score', p.opportunity_score,
    'profile_label', p.profile_label,
    'profile_level', p.profile_level,
    'top_frictions', p.top_frictions,
    'top_use_cases', p.top_use_cases,
    'recommended_modules', p.recommended_modules,
    'session_title', s.title,
    'session_open', s.is_open,
    'modules', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('module_id', m.module_id, 'status', m.status, 'updated_at', m.updated_at))
      FROM public.diagnostic_participant_modules m WHERE m.participant_id = p.id), '[]'::jsonb),
    'kpis', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', k.id, 'name', k.name, 'unit', k.unit, 'baseline_value', k.baseline_value,
        'target_value', k.target_value, 'direction', k.direction, 'source', k.source,
        'created_at', k.created_at,
        'readings', COALESCE((
          SELECT jsonb_agg(jsonb_build_object('id', r.id, 'value', r.value, 'measured_at', r.measured_at, 'note', r.note)
                 ORDER BY r.measured_at)
          FROM public.diagnostic_kpi_readings r WHERE r.kpi_id = k.id), '[]'::jsonb)
      ) ORDER BY k.created_at)
      FROM public.diagnostic_participant_kpis k WHERE k.participant_id = p.id), '[]'::jsonb)
  ) INTO _res
  FROM public.diagnostic_participants p
  LEFT JOIN public.diagnostic_sessions s ON s.id = p.session_id
  WHERE p.id = _pid;

  RETURN _res;
END;
$$;

CREATE OR REPLACE FUNCTION public.portal_add_kpi(
  _code text, _name text, _unit text DEFAULT NULL, _baseline numeric DEFAULT NULL,
  _target numeric DEFAULT NULL, _direction text DEFAULT 'down', _source text DEFAULT 'custom')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pid uuid; _id uuid;
BEGIN
  _pid := public.portal_participant_id(_code);
  IF _pid IS NULL THEN RAISE EXCEPTION 'invalid code'; END IF;
  IF coalesce(trim(_name), '') = '' THEN RAISE EXCEPTION 'name required'; END IF;
  IF (SELECT count(*) FROM public.diagnostic_participant_kpis WHERE participant_id = _pid) >= 30 THEN
    RAISE EXCEPTION 'too many indicators';
  END IF;
  INSERT INTO public.diagnostic_participant_kpis(participant_id, name, unit, baseline_value, target_value, direction, source)
  VALUES (_pid, left(trim(_name), 160), left(_unit, 40),
          _baseline, _target,
          CASE WHEN _direction = 'up' THEN 'up' ELSE 'down' END,
          CASE WHEN _source = 'use_case' THEN 'use_case' ELSE 'custom' END)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.portal_delete_kpi(_code text, _kpi_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pid uuid;
BEGIN
  _pid := public.portal_participant_id(_code);
  IF _pid IS NULL THEN RAISE EXCEPTION 'invalid code'; END IF;
  DELETE FROM public.diagnostic_participant_kpis WHERE id = _kpi_id AND participant_id = _pid;
END;
$$;

CREATE OR REPLACE FUNCTION public.portal_add_reading(
  _code text, _kpi_id uuid, _value numeric, _measured_at date DEFAULT current_date, _note text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pid uuid; _id uuid;
BEGIN
  _pid := public.portal_participant_id(_code);
  IF _pid IS NULL THEN RAISE EXCEPTION 'invalid code'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.diagnostic_participant_kpis WHERE id = _kpi_id AND participant_id = _pid) THEN
    RAISE EXCEPTION 'unknown indicator';
  END IF;
  INSERT INTO public.diagnostic_kpi_readings(kpi_id, value, measured_at, note)
  VALUES (_kpi_id, _value, coalesce(_measured_at, current_date), left(_note, 500))
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.portal_delete_reading(_code text, _reading_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pid uuid;
BEGIN
  _pid := public.portal_participant_id(_code);
  IF _pid IS NULL THEN RAISE EXCEPTION 'invalid code'; END IF;
  DELETE FROM public.diagnostic_kpi_readings r
  USING public.diagnostic_participant_kpis k
  WHERE r.id = _reading_id AND r.kpi_id = k.id AND k.participant_id = _pid;
END;
$$;

CREATE OR REPLACE FUNCTION public.portal_set_module_status(_code text, _module_id text, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pid uuid;
BEGIN
  _pid := public.portal_participant_id(_code);
  IF _pid IS NULL THEN RAISE EXCEPTION 'invalid code'; END IF;
  IF _status NOT IN ('todo', 'in_progress', 'done') THEN RAISE EXCEPTION 'invalid status'; END IF;
  INSERT INTO public.diagnostic_participant_modules(participant_id, module_id, status)
  VALUES (_pid, left(_module_id, 80), _status)
  ON CONFLICT (participant_id, module_id) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
END;
$$;

-- Anonymous cohort comparison for the participant's session
CREATE OR REPLACE FUNCTION public.portal_cohort_stats(_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _pid uuid; _sid uuid; _count int; _res jsonb;
BEGIN
  _pid := public.portal_participant_id(_code);
  IF _pid IS NULL THEN RETURN NULL; END IF;
  SELECT session_id INTO _sid FROM public.diagnostic_participants WHERE id = _pid;
  IF _sid IS NULL THEN RETURN NULL; END IF;
  SELECT count(*) INTO _count FROM public.diagnostic_participants WHERE session_id = _sid;
  IF _count < 3 THEN
    RETURN jsonb_build_object('participants', _count, 'ready', false);
  END IF;

  SELECT jsonb_build_object(
    'ready', true,
    'participants', _count,
    'avg_score', (SELECT round(avg(opportunity_score)) FROM public.diagnostic_participants WHERE session_id = _sid),
    'avg_dimensions', (
      SELECT jsonb_object_agg(d.key, round(avg((d.value)::numeric)))
      FROM public.diagnostic_participants p, jsonb_each(p.dimension_scores) d
      WHERE p.session_id = _sid),
    'top_frictions', COALESCE((
      SELECT jsonb_agg(x) FROM (
        SELECT jsonb_build_object('label', f->>'label', 'count', count(*)) AS x
        FROM public.diagnostic_participants p, jsonb_array_elements(p.top_frictions) f
        WHERE p.session_id = _sid AND f->>'label' IS NOT NULL
        GROUP BY f->>'label' ORDER BY count(*) DESC LIMIT 5) t), '[]'::jsonb),
    'top_use_cases', COALESCE((
      SELECT jsonb_agg(x) FROM (
        SELECT jsonb_build_object('title', u->>'title', 'count', count(*)) AS x
        FROM public.diagnostic_participants p, jsonb_array_elements(p.top_use_cases) u
        WHERE p.session_id = _sid AND u->>'title' IS NOT NULL
        GROUP BY u->>'title' ORDER BY count(*) DESC LIMIT 5) t), '[]'::jsonb),
    'top_modules', COALESCE((
      SELECT jsonb_agg(x) FROM (
        SELECT jsonb_build_object('title', m->>'title', 'count', count(*)) AS x
        FROM public.diagnostic_participants p, jsonb_array_elements(p.recommended_modules) m
        WHERE p.session_id = _sid AND m->>'title' IS NOT NULL
        GROUP BY m->>'title' ORDER BY count(*) DESC LIMIT 5) t), '[]'::jsonb),
    'roles', COALESCE((
      SELECT jsonb_agg(x) FROM (
        SELECT jsonb_build_object('role', hr_function, 'count', count(*)) AS x
        FROM public.diagnostic_participants WHERE session_id = _sid
        GROUP BY hr_function ORDER BY count(*) DESC LIMIT 8) t), '[]'::jsonb)
  ) INTO _res;
  RETURN _res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.portal_get_participant(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_cohort_stats(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_add_kpi(text, text, text, numeric, numeric, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_delete_kpi(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_add_reading(text, uuid, numeric, date, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_delete_reading(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_set_module_status(text, text, text) TO anon, authenticated;