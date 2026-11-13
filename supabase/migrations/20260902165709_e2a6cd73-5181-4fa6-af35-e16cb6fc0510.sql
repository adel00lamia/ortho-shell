DROP POLICY IF EXISTS "Anyone can read diagnostics for aggregation" ON public.diagnostic_participants;

CREATE POLICY "Authenticated can read diagnostics"
ON public.diagnostic_participants
FOR SELECT
TO authenticated
USING (true);

REVOKE SELECT ON public.diagnostic_participants FROM anon;
GRANT INSERT ON public.diagnostic_participants TO anon;
GRANT SELECT, INSERT, DELETE ON public.diagnostic_participants TO authenticated;
GRANT ALL ON public.diagnostic_participants TO service_role;