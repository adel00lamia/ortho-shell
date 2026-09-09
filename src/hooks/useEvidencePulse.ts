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

export interface EvidencePulseRow {
  id: string;
  diagnostic_id: string;
  company_id: string;
  code: string;
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
}

export const PULSE_AUDIENCES = [
  { value: 'employees', fr: 'Collaborateurs', en: 'Employees' },
  { value: 'managers', fr: 'Managers', en: 'Managers' },
  { value: 'supervisors', fr: 'Superviseurs', en: 'Supervisors' },
] as const;

/** Pulses attached to one diagnostic, with their aggregated responses. */
export function useEvidencePulses(diagnosticId: string | null) {
  return useQuery({
    queryKey: ['evidence-pulses', diagnosticId],
    queryFn: async (): Promise<EvidencePulseWithSummary[]> => {
      const { data, error } = await db
        .from('evidence_pulses')
        .select('*')
        .eq('diagnostic_id', diagnosticId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const pulses = (data ?? []) as EvidencePulseRow[];
      if (pulses.length === 0) return [];

      const { data: responses, error: rErr } = await db
        .from('evidence_pulse_responses')
        .select('pulse_id, answers, free_text')
        .in('pulse_id', pulses.map((p) => p.id));
      if (rErr) throw rErr;

      return pulses.map((p) => ({
        ...p,
        questions: Array.isArray(p.questions) ? p.questions : [],
        summary: aggregatePulse(
          Array.isArray(p.questions) ? p.questions : [],
          ((responses ?? []) as Array<{ pulse_id: string; answers: Record<string, string>; free_text: string | null }>)
            .filter((r) => r.pulse_id === p.id)
        ),
      }));
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

// ---------------------------------------------------------------------------
// Public (no login) side
// ---------------------------------------------------------------------------

export interface PublicPulse {
  id: string;
  code: string;
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
      return { ...p, questions: Array.isArray(p.questions) ? p.questions : [] };
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
