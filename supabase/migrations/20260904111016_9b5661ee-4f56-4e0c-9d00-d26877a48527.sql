ALTER TABLE public.diagnostic_participant_modules
  ADD COLUMN IF NOT EXISTS completed_lessons text[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.portal_set_lesson_done(
  _code text,
  _module_id text,
  _lesson_id text,
  _done boolean,
  _total_lessons integer DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _pid uuid; _lessons text[]; _status text;
BEGIN
  _pid := public.portal_participant_id(_code);
  IF _pid IS NULL THEN RAISE EXCEPTION 'invalid code'; END IF;
  IF coalesce(trim(_module_id), '') = '' OR coalesce(trim(_lesson_id), '') = '' THEN
    RAISE EXCEPTION 'module and lesson required';
  END IF;

  INSERT INTO public.diagnostic_participant_modules(participant_id, module_id, status)
  VALUES (_pid, left(trim(_module_id), 80), 'in_progress')
  ON CONFLICT (participant_id, module_id) DO NOTHING;

  SELECT completed_lessons INTO _lessons
  FROM public.diagnostic_participant_modules
  WHERE participant_id = _pid AND module_id = left(trim(_module_id), 80);

  _lessons := coalesce(_lessons, '{}'::text[]);

  IF _done THEN
    IF NOT (left(trim(_lesson_id), 80) = ANY (_lessons)) THEN
      _lessons := array_append(_lessons, left(trim(_lesson_id), 80));
    END IF;
  ELSE
    _lessons := array_remove(_lessons, left(trim(_lesson_id), 80));
  END IF;

  IF array_length(_lessons, 1) IS NULL THEN
    _status := 'todo';
  ELSIF _total_lessons IS NOT NULL AND array_length(_lessons, 1) >= _total_lessons THEN
    _status := 'done';
  ELSE
    _status := 'in_progress';
  END IF;

  UPDATE public.diagnostic_participant_modules
  SET completed_lessons = _lessons, status = _status, updated_at = now()
  WHERE participant_id = _pid AND module_id = left(trim(_module_id), 80);

  RETURN _status;
END;
$function$;

CREATE OR REPLACE FUNCTION public.portal_get_participant(_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      SELECT jsonb_agg(jsonb_build_object(
        'module_id', m.module_id,
        'status', m.status,
        'completed_lessons', to_jsonb(coalesce(m.completed_lessons, '{}'::text[])),
        'updated_at', m.updated_at))
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
$function$;

GRANT EXECUTE ON FUNCTION public.portal_set_lesson_done(text, text, text, boolean, integer) TO anon, authenticated;