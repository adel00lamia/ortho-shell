ALTER TABLE public.diagnostic_participants REPLICA IDENTITY FULL;
ALTER TABLE public.diagnostic_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.diagnostic_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.diagnostic_sessions;