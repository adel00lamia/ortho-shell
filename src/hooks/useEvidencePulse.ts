/* eslint-disable @typescript-eslint/no-explicit-any */
// The evidence_pulses tables are newer than the generated Supabase types,
// so queries are cast until types.ts is regenerated.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'sonner';
import {
  aggregatePulse,
  makePulseCode,
  type PulseQuestion,
  type PulseSummary,
} from '@/lib/evidencePulse';

const db = supabase as any;

export type PulseKind = 'evidence' | 'capability';

export interface PulseRawResponse {
  answers: Record<string, string>;
  free_text: string | null;
  respondent_name?: string | null;
  respondent_role?: string | null;
  created_at?: string;
}

export interface EvidencePulseRow {
  id: string;
  diagnostic_id: string;
  company_id: string;
  code: string;
  kind: PulseKind;
  title: string;
  audience: string;
  locale: string;
  questions: PulseQuestion[];
  allow_identity: boolean;
  is_open: boolean;
  created_at: string;
}

export interface EvidencePulseWithSummary extends EvidencePulseRow {
  summary: PulseSummary;
  responsesRaw: PulseRawResponse[];
}

export const PULSE_AUDIENCES = [
  { value: 'employees', fr: 'Collaborateurs', en: 'Employees' },
  { value: 'managers', fr: 'Managers', en: 'Managers' },
  { value: 'supervisors', fr: 'Superviseurs', en: 'Supervisors' },
] as const;

/** Pulses attached to one diagnostic, with their aggregated responses. */
export function useEvidencePulses(diagnosticId: string | null, kind?: PulseKind) {
  return useQuery({
    queryKey: ['evidence-pulses', diagnosticId, kind ?? 'all'],
    queryFn: async (): Promise<EvidencePulseWithSummary[]> => {
      let query = db
        .from('evidence_pulses')
        .select('*')
        .eq('diagnostic_id', diagnosticId)
        .order('created_at', { ascending: false });
      if (kind) query = query.eq('kind', kind);

      const { data, error } = await query;
      if (error) throw error;

      const pulses = (data ?? []) as EvidencePulseRow[];
      if (pulses.length === 0) return [];

      const { data: responses, error: rErr } = await db
        .from('evidence_pulse_responses')
        .select('pulse_id, answers, free_text, respondent_name, respondent_role, created_at')
        .in('pulse_id', pulses.map((p) => p.id));
      if (rErr) throw rErr;

      const all = (responses ?? []) as Array<PulseRawResponse & { pulse_id: string }>;

      return pulses.map((p) => {
        const mine = all.filter((r) => r.pulse_id === p.id);
        const questions = Array.isArray(p.questions) ? p.questions : [];
        return {
          ...p,
          kind: (p.kind ?? 'evidence') as PulseKind,
          questions,
          summary: aggregatePulse(questions, mine),
          responsesRaw: mine,
        };
      });
    },
    enabled: !!diagnosticId,
  });
}

export function useCreateEvidencePulse(diagnosticId: string | null) {
  const { companyId } = useCompanyId();
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      audience: string;
      locale: 'fr' | 'en';
      questions: PulseQuestion[];
      allow_identity: boolean;
      kind?: PulseKind;
    }) => {
      if (!companyId || !user || !diagnosticId) throw new Error('NO_COMPANY');
      if (input.questions.length === 0 || input.questions.length > 5) {
        throw new Error('Sélectionnez 1 à 5 questions.');
      }

      const { data, error } = await db
        .from('evidence_pulses')
        .insert({
          diagnostic_id: diagnosticId,
          company_id: companyId,
          created_by: user.id,
          code: makePulseCode(6),
          kind: input.kind ?? 'evidence',
          title: input.title.slice(0, 160),
          audience: input.audience,
          locale: input.locale,
          questions: input.questions,
          allow_identity: input.allow_identity,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as EvidencePulseRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evidence-pulses', diagnosticId] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useTogglePulseOpen(diagnosticId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_open }: { id: string; is_open: boolean }) => {
      const { error } = await db.from('evidence_pulses').update({ is_open }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evidence-pulses', diagnosticId] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface CapabilityVerification {
  verified_at: string;
  respondents: number;
  gap_confirmed: number;
  trainable_headcount: number;
  note?: string;
  pulse_code?: string;
}

/**
 * Stores a practical, scenario-based capability check result on the diagnostic.
 * This is a field observation, not a validated psychometric assessment.
 */
export function useSaveCapabilityVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ diagnosticId, result }: { diagnosticId: string; result: CapabilityVerification }) => {
      const { error } = await db
        .from('root_cause_diagnostics')
        .update({ capability_verification: result })
        .eq('id', diagnosticId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Vérification enregistrée');
      qc.invalidateQueries({ queryKey: ['root-cause-diagnostics'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---------------------------------------------------------------------------
// Public (no login) side
// ---------------------------------------------------------------------------

export interface PublicPulse {
  id: string;
  code: string;
  kind: PulseKind;
  title: string;
  audience: string;
  locale: 'fr' | 'en';
  questions: PulseQuestion[];
  allow_identity: boolean;
  is_open: boolean;
}

export function usePublicPulse(code: string | undefined) {
  return useQuery({
    queryKey: ['public-evidence-pulse', code],
    queryFn: async (): Promise<PublicPulse | null> => {
      const { data, error } = await db.rpc('evidence_pulse_get', { _code: code });
      if (error) throw error;
      if (!data) return null;
      const p = data as PublicPulse;
      return {
        ...p,
        kind: (p.kind ?? 'evidence') as PulseKind,
        questions: Array.isArray(p.questions) ? p.questions : [],
      };
    },
    enabled: !!code && code.trim().length > 0,
    retry: false,
  });
}

export function useSubmitPulse() {
  return useMutation({
    mutationFn: async (input: {
      code: string;
      answers: Record<string, string>;
      free_text?: string;
      name?: string;
      role?: string;
    }) => {
      const { data, error } = await db.rpc('evidence_pulse_submit', {
        _code: input.code,
        _answers: input.answers,
        _free_text: input.free_text ?? null,
        _name: input.name ?? null,
        _role: input.role ?? null,
      });
      if (error) throw error;
      return data as string;
    },
  });
}

// Reassessment lives with the diagnostic hooks; re-exported here so the
// Evidence Pulse panel has a single import surface.
export { useReassessDiagnostic as useReassessFromPulse } from '@/hooks/useRootCauseDiagnostics';
