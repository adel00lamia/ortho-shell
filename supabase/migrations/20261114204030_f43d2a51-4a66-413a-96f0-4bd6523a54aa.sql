DROP POLICY IF EXISTS "Authenticated can view sessions" ON public.diagnostic_sessions;
CREATE POLICY "Authenticated can view open or own sessions" ON public.diagnostic_sessions
FOR SELECT TO authenticated USING (is_open = true OR owner_id = auth.uid());