import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { AnswerMap, DiagnosticResult } from '@/lib/diagnosticScoring';

// The generated Supabase types do not yet include the diagnostic tables.
const db = supabase as unknown as {
  from: (table: string) => any;
};

export interface DiagnosticSession {
  id: string;
  code: string;
  title: string;
  city: string | null;
  event_date: string | null;
  domain: string;
  is_open: boolean;
  owner_id: string | null;
  created_at: string;
}

export interface ParticipantProfile {
  first_name: string;
  company?: string;
  sector?: string;
  company_size?: string;
  job_title?: string;
  hr_function: string;
  seniority?: string;
  team_size?: string;
  contact_email?: string;
  contact_whatsapp?: string;
  contact_consent?: boolean;
}

export interface ParticipantRow extends Omit<ParticipantProfile, 'first_name'> {
  id: string;
  session_id: string | null;
  domain: string;
  locale: string;
  answers: AnswerMap;
  dimension_scores: Record<string, number>;
  opportunity_score: number;
  profile_label: string | null;
  profile_level: string | null;
  top_frictions: { label: string; count: number; tags: string[] }[];
  top_use_cases: { id: string; title: string }[];
  recommended_modules: { id: string; title: string }[];
  created_at: string;
}

export const makeSessionCode = () =>
  Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

// ─────────────── Sessions ───────────────

export function useDiagnosticSessions() {
  return useQuery({
    queryKey: ['diagnostic-sessions'],
    queryFn: async (): Promise<DiagnosticSession[]> => {
      const { data, error } = await db.from('diagnostic_sessions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as DiagnosticSession[];
    },
  });
}

export function useDiagnosticSession(code?: string) {
  return useQuery({
    queryKey: ['diagnostic-session', code],
    queryFn: async (): Promise<DiagnosticSession | null> => {
      const { data, error } = await db.from('diagnostic_sessions').select('*').eq('code', code).maybeSingle();
      if (error) throw error;
      return (data ?? null) as DiagnosticSession | null;
    },
    enabled: !!code,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { title: string; city?: string; event_date?: string }) => {
      const { data, error } = await db
        .from('diagnostic_sessions')
        .insert({ ...input, code: makeSessionCode(), owner_id: user?.id ?? null, domain: 'hr' })
        .select()
        .single();
      if (error) throw error;
      return data as DiagnosticSession;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diagnostic-sessions'] }),
  });
}

export function useToggleSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_open }: { id: string; is_open: boolean }) => {
      const { error } = await db.from('diagnostic_sessions').update({ is_open }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diagnostic-sessions'] }),
  });
}

// ─────────────── Participants ───────────────

const PUBLIC_COLUMNS =
  'id, session_id, domain, locale, sector, company_size, job_title, hr_function, seniority, team_size, answers, dimension_scores, opportunity_score, profile_label, profile_level, top_frictions, top_use_cases, recommended_modules, created_at';

export function useSessionParticipants(sessionId?: string, refetchMs?: number) {
  return useQuery({
    queryKey: ['diagnostic-participants', sessionId],
    queryFn: async (): Promise<ParticipantRow[]> => {
      const { data, error } = await db
        .from('diagnostic_participants')
        .select(PUBLIC_COLUMNS)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ParticipantRow[];
    },
    enabled: !!sessionId,
    refetchInterval: refetchMs,
    staleTime: 0,
  });
}

export function useSubmitDiagnostic() {
  return useMutation({
    mutationFn: async (input: {
      sessionId: string | null;
      profile: ParticipantProfile;
      answers: AnswerMap;
      result: DiagnosticResult;
      locale?: string;
    }) => {
      const { profile, result } = input;
      const payload = {
        session_id: input.sessionId,
        domain: 'hr',
        locale: input.locale ?? 'fr',
        first_name: profile.first_name || null,
        company: profile.company || null,
        sector: profile.sector || null,
        company_size: profile.company_size || null,
        job_title: profile.job_title || null,
        hr_function: profile.hr_function,
        seniority: profile.seniority || null,
        team_size: profile.team_size || null,
        contact_email: profile.contact_consent ? profile.contact_email || null : null,
        contact_whatsapp: profile.contact_consent ? profile.contact_whatsapp || null : null,
        contact_consent: !!profile.contact_consent,
        answers: input.answers,
        dimension_scores: result.dimensions,
        opportunity_score: result.opportunityScore,
        profile_label: result.profileLabel,
        profile_level: result.profileLevel,
        top_frictions: result.frictions,
        top_use_cases: result.useCases.map((u) => ({ id: u.id, title: u.title })),
        recommended_modules: result.modules.map((m) => ({ id: m.id, title: m.title })),
      };
      const { error } = await db.from('diagnostic_participants').insert(payload);
      if (error) throw error;
    },
  });
}
