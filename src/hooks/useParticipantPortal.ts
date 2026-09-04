import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// The generated Supabase types do not yet include the portal RPCs.
const rpc = (name: string, args: Record<string, unknown>) =>
  (supabase as unknown as { rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: any; error: any }> }).rpc(
    name,
    args,
  );

export const PORTAL_CODE_KEY = 'qimataq_portal_code';

export interface PortalReading {
  id: string;
  value: number;
  measured_at: string;
  note: string | null;
}

export interface PortalKpi {
  id: string;
  name: string;
  unit: string | null;
  baseline_value: number | null;
  target_value: number | null;
  direction: 'up' | 'down';
  source: 'custom' | 'use_case';
  created_at: string;
  readings: PortalReading[];
}

export interface PortalModuleStatus {
  module_id: string;
  status: 'todo' | 'in_progress' | 'done';
  completed_lessons?: string[] | null;
  updated_at: string;
}

export interface CopilotFeedback {
  verdict: 'solide' | 'à renforcer' | 'à revoir';
  strengths: string[];
  improvements: string[];
  reworked: string;
  nextStep: string;
}

export interface PortalParticipant {
  id: string;
  session_id: string | null;
  locale: string;
  hr_function: string;
  job_title: string | null;
  sector: string | null;
  company_size: string | null;
  created_at: string;
  dimension_scores: Record<string, number>;
  opportunity_score: number;
  profile_label: string | null;
  profile_level: string | null;
  top_frictions: { label: string; count: number; tags: string[] }[];
  top_use_cases: { id: string; title: string }[];
  recommended_modules: { id: string; title: string; summary?: string; level?: string; reason?: string }[];
  session_title: string | null;
  session_open: boolean | null;
  modules: PortalModuleStatus[];
  kpis: PortalKpi[];
}

export interface CohortStats {
  ready: boolean;
  participants: number;
  avg_score?: number;
  avg_dimensions?: Record<string, number>;
  top_frictions?: { label: string; count: number }[];
  top_use_cases?: { title: string; count: number }[];
  top_modules?: { title: string; count: number }[];
  roles?: { role: string; count: number }[];
}

const normalizeCode = (code: string) => code.trim().toUpperCase();

export function usePortalParticipant(code?: string) {
  return useQuery({
    queryKey: ['portal-participant', code],
    queryFn: async (): Promise<PortalParticipant | null> => {
      const { data, error } = await rpc('portal_get_participant', { _code: normalizeCode(code!) });
      if (error) throw error;
      return (data ?? null) as PortalParticipant | null;
    },
    enabled: !!code,
    staleTime: 30_000,
  });
}

export function usePortalCohort(code?: string, enabled = true) {
  return useQuery({
    queryKey: ['portal-cohort', code],
    queryFn: async (): Promise<CohortStats | null> => {
      const { data, error } = await rpc('portal_cohort_stats', { _code: normalizeCode(code!) });
      if (error) throw error;
      return (data ?? null) as CohortStats | null;
    },
    enabled: !!code && enabled,
    refetchInterval: 30_000,
  });
}

function usePortalMutation<T>(fn: (code: string, input: T) => Promise<void>, code?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: T) => {
      if (!code) throw new Error('Code manquant');
      await fn(normalizeCode(code), input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal-participant', code] }),
  });
}

export function useAddKpi(code?: string) {
  return usePortalMutation<{
    name: string;
    unit?: string;
    baseline?: number | null;
    target?: number | null;
    direction?: 'up' | 'down';
    source?: 'custom' | 'use_case';
  }>(async (c, input) => {
    const { error } = await rpc('portal_add_kpi', {
      _code: c,
      _name: input.name,
      _unit: input.unit ?? null,
      _baseline: input.baseline ?? null,
      _target: input.target ?? null,
      _direction: input.direction ?? 'down',
      _source: input.source ?? 'custom',
    });
    if (error) throw error;
  }, code);
}

export function useDeleteKpi(code?: string) {
  return usePortalMutation<string>(async (c, kpiId) => {
    const { error } = await rpc('portal_delete_kpi', { _code: c, _kpi_id: kpiId });
    if (error) throw error;
  }, code);
}

export function useAddReading(code?: string) {
  return usePortalMutation<{ kpiId: string; value: number; measuredAt?: string; note?: string }>(async (c, input) => {
    const { error } = await rpc('portal_add_reading', {
      _code: c,
      _kpi_id: input.kpiId,
      _value: input.value,
      _measured_at: input.measuredAt ?? new Date().toISOString().slice(0, 10),
      _note: input.note ?? null,
    });
    if (error) throw error;
  }, code);
}

export function useDeleteReading(code?: string) {
  return usePortalMutation<string>(async (c, readingId) => {
    const { error } = await rpc('portal_delete_reading', { _code: c, _reading_id: readingId });
    if (error) throw error;
  }, code);
}

export function useSetModuleStatus(code?: string) {
  return usePortalMutation<{ moduleId: string; status: 'todo' | 'in_progress' | 'done' }>(async (c, input) => {
    const { error } = await rpc('portal_set_module_status', {
      _code: c,
      _module_id: input.moduleId,
      _status: input.status,
    });
    if (error) throw error;
  }, code);
}

/** Marque une leçon de module Copilot comme faite / non faite (progression persistée par code). */
export function useSetLessonDone(code?: string) {
  return usePortalMutation<{ moduleId: string; lessonId: string; done: boolean; totalLessons?: number }>(
    async (c, input) => {
      const { error } = await rpc('portal_set_lesson_done', {
        _code: c,
        _module_id: input.moduleId,
        _lesson_id: input.lessonId,
        _done: input.done,
        _total_lessons: input.totalLessons ?? null,
      });
      if (error) throw error;
    },
    code,
  );
}

export interface CopilotCoachInput {
  moduleId: string;
  moduleTitle: string;
  lessonId: string;
  lessonTitle: string;
  goal: string;
  keyIdea?: string;
  points?: string[];
  submission: string;
  context?: {
    hr_function?: string;
    job_title?: string | null;
    sector?: string | null;
    company_size?: string | null;
    top_frictions?: string[];
  };
}

/** Appelle le coach IA pour évaluer un exercice de module (accès par code participant). */
export function useCopilotCoach(code?: string) {
  return useMutation({
    mutationFn: async (input: CopilotCoachInput): Promise<CopilotFeedback> => {
      if (!code) throw new Error('Code manquant');
      const { data, error } = await supabase.functions.invoke('ai-hr-copilot-coach', {
        body: { ...input, code: normalizeCode(code), locale: 'fr' },
      });
      if (error) {
        let details = error.message;
        const ctx = (error as { context?: { text?: () => Promise<string> } }).context;
        if (ctx?.text) {
          try {
            const body = await ctx.text();
            const parsedBody = JSON.parse(body) as { error?: string };
            details = parsedBody.error ?? body;
          } catch {
            /* garder le message d'origine */
          }
        }
        throw new Error(details);
      }
      const feedback = (data as { feedback?: CopilotFeedback } | null)?.feedback;
      if (!feedback) throw new Error('Réponse du coach IA vide');
      return feedback;
    },
  });
}
