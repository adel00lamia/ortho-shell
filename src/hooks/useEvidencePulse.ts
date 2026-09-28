 
// The evidence_pulses tables are newer than the generated Supabase types,
// so queries are cast until types.ts is regenerated.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'sonner';
import {
  makePulseCode,
  type PulseQuestion,
  type PulseSummary,
} from '@/lib/evidencePulse';

const db = supabase as any;

export type PulseKind = 'evidence' | 'capability';

/** Only present when the pulse explicitly allows identity. */
export interface PulseIdentifiedRespondent {
  name: string | null;
  role: string | null;
  created_at: string | null;
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
  /** Aggregated server-side; respondent-level answer rows are never fetched. */
  summary: PulseSummary;
  identified: PulseIdentifiedRespondent[];
}

export const PULSE_AUDIENCES = [
  { value: 'employees', fr: 'Collaborateurs', en: 'Employees' },
  { value: 'managers', fr: 'Managers', en: 'Managers' },
  { value: 'supervisors', fr: 'Superviseurs', en: 'Supervisors' },
] as const;

/**
 * Pulses attached to one diagnostic, with their responses aggregated by the
 * database. Individual respondent answers are never exposed to the client:
 * for anonymous pulses only totals, averages and sanitized comments come back.
 */
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

      const aggregates = await Promise.all(
        pulses.map(async (p) => {
          const { data: agg, error: aErr } = await db.rpc('evidence_pulse_aggregate', { _pulse_id: p.id });
          if (aErr) throw aErr;
          return (agg ?? null) as {
            responses?: number;
            questions?: PulseSummary['questions'];
            comments?: string[];
            identified?: PulseIdentifiedRespondent[];
          } | null;
        })
      );

      return pulses.map((p, i) => {
        const agg = aggregates[i];
        const questions = Array.isArray(p.questions) ? p.questions : [];
        return {
          ...p,
          kind: (p.kind ?? 'evidence') as PulseKind,
          questions,
          summary: {
            responses: agg?.responses ?? 0,
            questions: (agg?.questions ?? []).map((q) => ({ ...q, texts: q.texts ?? [] })),
            comments: agg?.comments ?? [],
          },
          identified: agg?.identified ?? [],
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
  /** Headcount the check was sent to, when known. */
  invited?: number;
  /** Share of respondents with a confirmed know-how gap. */
  gap_confirmed_pct?: number;
  /** Pilot methodology marker — not a validated psychometric test. */
  method?: string;
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

/**
 * Company-wide list of pulses (evidence + capability) for the Evidence hub.
 * Aggregates are fetched per pulse; respondent rows are never selected.
 */
export function useCompanyEvidencePulses() {
  const { companyId } = useCompanyId();

  return useQuery({
    queryKey: ['company-evidence-pulses', companyId],
    queryFn: async (): Promise<Array<EvidencePulseRow & { responses: number }>> => {
      const { data, error } = await db
        .from('evidence_pulses')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const pulses = (data ?? []) as EvidencePulseRow[];
      const counts = await Promise.all(
        pulses.map(async (p) => {
          const { data: agg } = await db.rpc('evidence_pulse_aggregate', { _pulse_id: p.id });
          return Number((agg as { responses?: number } | null)?.responses ?? 0);
        })
      );
      return pulses.map((p, i) => ({ ...p, responses: counts[i] }));
    },
    enabled: !!companyId,
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
      token?: string;
    }) => {
      const { data, error } = await db.rpc('evidence_pulse_submit', {
        _code: input.code,
        _answers: input.answers,
        _free_text: input.free_text ?? null,
        _name: input.name ?? null,
        _role: input.role ?? null,
        _token: input.token ?? null,
      });
      if (error) throw error;
      return data as string;
    },
  });
}


// Reassessment lives with the diagnostic hooks; re-exported here so the
// Evidence Pulse panel has a single import surface.
export { useReassessDiagnostic as useReassessFromPulse } from '@/hooks/useRootCauseDiagnostics';
