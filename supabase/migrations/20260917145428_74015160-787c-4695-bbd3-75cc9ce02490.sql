-- 1. Scope diagnostic_participants access to session owners
DROP POLICY IF EXISTS "Authenticated can read diagnostics" ON public.diagnostic_participants;
CREATE POLICY "Session owners can read participants"
ON public.diagnostic_participants FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.diagnostic_sessions s WHERE s.id = diagnostic_participants.session_id AND s.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated can delete diagnostics" ON public.diagnostic_participants;
CREATE POLICY "Session owners can delete participants"
ON public.diagnostic_participants FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.diagnostic_sessions s WHERE s.id = diagnostic_participants.session_id AND s.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can submit a diagnostic" ON public.diagnostic_participants;
CREATE POLICY "Submit to an open session only"
ON public.diagnostic_participants FOR INSERT TO anon, authenticated
WITH CHECK (
  session_id IS NULL
  OR EXISTS (SELECT 1 FROM public.diagnostic_sessions s WHERE s.id = session_id AND s.is_open)
);

-- 2. Scope participant KPI / module child tables to session owners
DROP POLICY IF EXISTS "Authenticated can read participant modules" ON public.diagnostic_participant_modules;
CREATE POLICY "Session owners can read participant modules"
ON public.diagnostic_participant_modules FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.diagnostic_participants p
  JOIN public.diagnostic_sessions s ON s.id = p.session_id
  WHERE p.id = diagnostic_participant_modules.participant_id AND s.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated can read participant kpis" ON public.diagnostic_participant_kpis;
CREATE POLICY "Session owners can read participant kpis"
ON public.diagnostic_participant_kpis FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.diagnostic_participants p
  JOIN public.diagnostic_sessions s ON s.id = p.session_id
  WHERE p.id = diagnostic_participant_kpis.participant_id AND s.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated can read kpi readings" ON public.diagnostic_kpi_readings;
CREATE POLICY "Session owners can read kpi readings"
ON public.diagnostic_kpi_readings FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.diagnostic_participant_kpis k
  JOIN public.diagnostic_participants p ON p.id = k.participant_id
  JOIN public.diagnostic_sessions s ON s.id = p.session_id
  WHERE k.id = diagnostic_kpi_readings.kpi_id AND s.owner_id = auth.uid()));

-- 3. Diagnostic sessions: no anonymous browsing of all sessions
DROP POLICY IF EXISTS "Anyone can view sessions" ON public.diagnostic_sessions;
CREATE POLICY "Authenticated can view sessions"
ON public.diagnostic_sessions FOR SELECT TO authenticated
USING (true);
REVOKE SELECT ON public.diagnostic_sessions FROM anon;

-- 4. Storage: OFPPT documents restricted to the owning company
DROP POLICY IF EXISTS "Users can view ofppt documents in their company" ON storage.objects;
CREATE POLICY "Company members can view their ofppt documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'ofppt-documents'
  AND (
    EXISTS (
      SELECT 1 FROM public.ofppt_reimbursement_dossiers d
      WHERE d.id::text = (storage.foldername(name))[1]
        AND d.company_id = public.get_user_company_id(auth.uid()))
    OR (
      (storage.foldername(name))[1] = 'ingenierie'
      AND EXISTS (
        SELECT 1 FROM public.ingenierie_de_formation i
        WHERE i.id::text = (storage.foldername(name))[2]
          AND i.company_id = public.get_user_company_id(auth.uid())))
  )
);

-- 5. Remove anonymous read access from all other public tables (GraphQL/PostgREST discovery)
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r','v','m','f')
      AND c.relname <> 'diagnostic_sessions'
  LOOP
    EXECUTE format('REVOKE SELECT ON public.%I FROM anon', t.relname);
  END LOOP;
END $$;

-- Signed-in users cannot discover the raw pulse response table
REVOKE ALL ON public.evidence_pulse_responses FROM anon, authenticated;

-- 6. Fix mutable search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

-- 7. Revoke EXECUTE on SECURITY DEFINER / internal functions not meant to be called directly.
--    Helpers used inside RLS policies (has_role, is_admin_or_hr, get_user_company_id,
--    current_profile_role) keep EXECUTE because policy expressions run as the caller.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.log_performance_evaluation_access() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.seed_default_skills(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.evidence_pulse_submit(text, jsonb, text, text, text) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.evidence_pulse_aggregate(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.qimatak_executive_overview() FROM anon;
REVOKE ALL ON FUNCTION public.current_profile_role(uuid) FROM anon;