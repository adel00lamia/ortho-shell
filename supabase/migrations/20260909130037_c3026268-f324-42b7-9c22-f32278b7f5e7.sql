-- Evidence Pulse: support two kinds of field collection
ALTER TABLE public.evidence_pulses
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'evidence';

-- Practical scenario-based capability verification result, attached to a diagnostic
ALTER TABLE public.root_cause_diagnostics
  ADD COLUMN IF NOT EXISTS capability_verification jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.evidence_pulse_get(_code text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'id', p.id,
    'code', p.code,
    'kind', p.kind,
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
$function$;