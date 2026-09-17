-- Public participants join by code: allow anonymous read of OPEN sessions only.
GRANT SELECT ON public.diagnostic_sessions TO anon;

DROP POLICY IF EXISTS "Authenticated can view sessions" ON public.diagnostic_sessions;

CREATE POLICY "Anon can view open sessions"
ON public.diagnostic_sessions FOR SELECT TO anon
USING (is_open = true);

CREATE POLICY "Authenticated can view sessions"
ON public.diagnostic_sessions FOR SELECT TO authenticated
USING (true);