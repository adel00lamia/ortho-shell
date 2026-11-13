
CREATE TABLE public.diagnostic_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  city text,
  event_date date,
  domain text NOT NULL DEFAULT 'hr',
  is_open boolean NOT NULL DEFAULT true,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.diagnostic_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.diagnostic_sessions(id) ON DELETE CASCADE,
  domain text NOT NULL DEFAULT 'hr',
  locale text NOT NULL DEFAULT 'fr',
  first_name text,
  company text,
  sector text,
  company_size text,
  job_title text,
  hr_function text NOT NULL,
  seniority text,
  team_size text,
  contact_email text,
  contact_whatsapp text,
  contact_consent boolean NOT NULL DEFAULT false,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  dimension_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  opportunity_score integer NOT NULL DEFAULT 0,
  profile_label text,
  profile_level text,
  top_frictions jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_use_cases jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_diag_participants_session ON public.diagnostic_participants(session_id);
CREATE INDEX idx_diag_participants_function ON public.diagnostic_participants(hr_function);

-- Grants: sessions
GRANT SELECT ON public.diagnostic_sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostic_sessions TO authenticated;
GRANT ALL ON public.diagnostic_sessions TO service_role;

-- Grants: participants. anon may insert its own diagnostic and read only
-- non-identifying columns (contact fields excluded on purpose).
GRANT INSERT ON public.diagnostic_participants TO anon;
GRANT SELECT (id, session_id, domain, locale, sector, company_size, job_title, hr_function,
  seniority, team_size, answers, dimension_scores, opportunity_score, profile_label,
  profile_level, top_frictions, top_use_cases, recommended_modules, created_at)
  ON public.diagnostic_participants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostic_participants TO authenticated;
GRANT ALL ON public.diagnostic_participants TO service_role;

ALTER TABLE public.diagnostic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sessions" ON public.diagnostic_sessions
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owners can create sessions" ON public.diagnostic_sessions
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update their sessions" ON public.diagnostic_sessions
  FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners can delete their sessions" ON public.diagnostic_sessions
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Anyone can submit a diagnostic" ON public.diagnostic_participants
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read diagnostics for aggregation" ON public.diagnostic_participants
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated can delete diagnostics" ON public.diagnostic_participants
  FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_diagnostic_sessions_updated_at
  BEFORE UPDATE ON public.diagnostic_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
