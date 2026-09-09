import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'sonner';
import {
  CAUSE_KEYS,
  normalizeCauseBreakdown,
  type CauseBreakdown,
  type CauseEvidenceEntry,
  type CauseKey,
  type TrainingFitFactor,
} from '@/lib/rootCauseModel';

export { CAUSE_KEYS, normalizeCauseBreakdown };
export type { CauseBreakdown, CauseKey, CauseEvidenceEntry, TrainingFitFactor };

export interface DiagnosticRow {
  id: string;
  company_id: string;
  created_by: string;
  title: string;
  problem_description: string;
  department: string | null;
  affected_population: string | null;
  headcount_affected: number | null;
  symptoms: string[];
  source_channel: string;
  business_kpis: Array<{ name?: string; value?: string; unit?: string }>;
  training_fit_score: number | null;
  ai_confidence: number | null;
  cause_breakdown: CauseBreakdown;
  ai_summary: string | null;
  ai_verdict: string | null;
  avoided_training_cost_mad: number | null;
  estimated_training_cost_mad: number | null;
  evidence_sources: Record<string, number>;
  /** What extra proof would raise confidence in this diagnosis. */
  missing_evidence: string[];
  /** Per-cause evidence reasoning behind the hypotheses. */
  cause_evidence: CauseEvidenceEntry[];
  /** Factors that raised or lowered the Training Fit Score. */
  training_fit_explanation: TrainingFitFactor[];
  training_fit_signals: Record<string, unknown>;
  version: number;
  parent_diagnostic_id: string | null;
  status: string;
  linked_training_plan_id: string | null;
  diagnosed_at: string | null;
  created_at: string;
}

export interface ActionRow {
  id: string;
  diagnostic_id: string;
  company_id: string;
  action_type: string;
  title: string;
  description: string | null;
  rationale: string | null;
  target_population: string | null;
  headcount: number | null;
  owner_name: string | null;
  due_date: string | null;
  priority: string;
  effort: string | null;
  expected_impact: string | null;
  estimated_cost_mad: number | null;
  is_training: boolean;
  status: string;
  sort_order: number;
}

export interface MeasurementRow {
  id: string;
  diagnostic_id: string;
  action_id: string | null;
  company_id: string;
  kpi_name: string;
  unit: string | null;
  baseline_value: number | null;
  target_value: number | null;
  actual_value: number | null;
  measured_at: string | null;
  direction: string;
  notes: string | null;
  created_at?: string;
}

export interface AIDiagnosis {
  cause_breakdown: Record<CauseKey, number>;
  cause_evidence: CauseEvidenceEntry[];
  training_fit_score: number;
  training_fit_explanation: TrainingFitFactor[];
  training_fit_signals: Record<string, unknown>;
  evidence_completeness: number;
  ai_confidence: number;
  ai_verdict: string;
  ai_summary: string;
  estimated_training_cost_mad: number;
  avoided_training_cost_mad: number;
  trainable_headcount: number;
  actions: Array<Partial<ActionRow>>;
  kpis: Array<Partial<MeasurementRow>>;
  missing_evidence: string[];
}

export interface DiagnosticInput {
  title: string;
  problem_description: string;
  department?: string;
  affected_population?: string;
  headcount_affected?: number;
  symptoms: string[];
  business_kpis: Array<{ name?: string; value?: string; unit?: string }>;
  evidence_sources: Record<string, number>;
  source_channel?: string;
  language: 'fr' | 'en';
}

export interface PulseAggregate {
  responses: number;
  audience?: string;
  questions?: Array<{ question: string; agreement: number | null; answers: number }>;
  comments?: string[];
}

export function useDiagnostics() {
  const { companyId } = useCompanyId();

  return useQuery({
    queryKey: ['root-cause-diagnostics', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('root_cause_diagnostics')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => {
        const d = row as unknown as DiagnosticRow;
        return {
          ...d,
          cause_breakdown: normalizeCauseBreakdown(d.cause_breakdown),
          cause_evidence: Array.isArray(d.cause_evidence) ? d.cause_evidence : [],
          training_fit_explanation: Array.isArray(d.training_fit_explanation) ? d.training_fit_explanation : [],
          missing_evidence: Array.isArray(d.missing_evidence) ? d.missing_evidence : [],
          version: Number(d.version ?? 1),
        } as DiagnosticRow;
      });
    },
    enabled: !!companyId,
  });
}

export function useDiagnosticDetail(diagnosticId: string | null) {
  return useQuery({
    queryKey: ['root-cause-diagnostic-detail', diagnosticId],
    queryFn: async () => {
      const [actions, measurements] = await Promise.all([
        supabase.from('root_cause_actions').select('*').eq('diagnostic_id', diagnosticId!).order('sort_order'),
        supabase.from('diagnostic_impact_measurements').select('*').eq('diagnostic_id', diagnosticId!).order('created_at'),
      ]);
      if (actions.error) throw actions.error;
      if (measurements.error) throw measurements.error;
      return {
        actions: (actions.data ?? []) as unknown as ActionRow[],
        measurements: (measurements.data ?? []) as unknown as MeasurementRow[],
      };
    },
    enabled: !!diagnosticId,
  });
}

/** Persists a diagnosis returned by the edge function, plus its actions and KPIs. */
async function persistDiagnosis(args: {
  companyId: string;
  userId: string;
  input: DiagnosticInput;
  diagnosis: AIDiagnosis;
  version?: number;
  parentDiagnosticId?: string | null;
}) {
  const { companyId, userId, input, diagnosis } = args;

  const { data: saved, error: saveError } = await supabase
    .from('root_cause_diagnostics')
    .insert({
      company_id: companyId,
      created_by: userId,
      title: input.title,
      problem_description: input.problem_description,
      department: input.department || null,
      affected_population: input.affected_population || null,
      headcount_affected: input.headcount_affected ?? null,
      symptoms: input.symptoms,
      source_channel: input.source_channel ?? 'text',
      business_kpis: input.business_kpis,
      evidence_sources: input.evidence_sources,
      cause_breakdown: diagnosis.cause_breakdown,
      cause_evidence: diagnosis.cause_evidence ?? [],
      training_fit_score: diagnosis.training_fit_score,
      training_fit_explanation: diagnosis.training_fit_explanation ?? [],
      training_fit_signals: diagnosis.training_fit_signals ?? {},
      ai_confidence: diagnosis.ai_confidence,
      ai_summary: diagnosis.ai_summary,
      ai_verdict: diagnosis.ai_verdict,
      estimated_training_cost_mad: diagnosis.estimated_training_cost_mad,
      avoided_training_cost_mad: diagnosis.avoided_training_cost_mad,
      missing_evidence: Array.isArray(diagnosis.missing_evidence) ? diagnosis.missing_evidence : [],
      version: args.version ?? 1,
      parent_diagnostic_id: args.parentDiagnosticId ?? null,
      status: 'diagnosed',
      diagnosed_at: new Date().toISOString(),
    } as never)
    .select('id')
    .single();
  if (saveError) throw saveError;
  const diagnosticId = (saved as { id: string }).id;

  if (diagnosis.actions?.length) {
    await supabase.from('root_cause_actions').insert(
      diagnosis.actions.map((a, i) => ({
        diagnostic_id: diagnosticId,
        company_id: companyId,
        action_type: a.action_type ?? 'process',
        title: a.title ?? 'Action',
        description: a.description ?? null,
        rationale: a.rationale ?? null,
        target_population: a.target_population ?? null,
        headcount: a.headcount ?? null,
        priority: a.priority ?? 'medium',
        effort: a.effort ?? null,
        expected_impact: a.expected_impact ?? null,
        estimated_cost_mad: a.estimated_cost_mad ?? null,
        is_training: a.is_training ?? a.action_type === 'training',
        sort_order: i,
      })) as never
    );
  }

  if (diagnosis.kpis?.length) {
    await supabase.from('diagnostic_impact_measurements').insert(
      diagnosis.kpis.map((k) => ({
        diagnostic_id: diagnosticId,
        company_id: companyId,
        kpi_name: k.kpi_name ?? 'KPI',
        unit: k.unit ?? null,
        baseline_value: k.baseline_value ?? null,
        target_value: k.target_value ?? null,
        direction: k.direction ?? 'decrease',
      })) as never
    );
  }

  return diagnosticId;
}

/** Calls the AI engine, then persists diagnostic + actions + suggested KPIs. */
export function useRunDiagnostic() {
  const { companyId } = useCompanyId();
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: DiagnosticInput) => {
      if (!companyId || !user) throw new Error('NO_COMPANY');

      const { data: company } = await supabase
        .from('companies')
        .select('name, industry, employee_count, city')
        .eq('id', companyId)
        .maybeSingle();

      const { data: ai, error: aiError } = await supabase.functions.invoke('root-cause-diagnostic', {
        body: { ...input, company: company ?? undefined },
      });
      if (aiError) throw aiError;
      if ((ai as { error?: string })?.error) throw new Error((ai as { error: string }).error);
      const diagnosis = ai as AIDiagnosis;

      const diagnosticId = await persistDiagnosis({
        companyId,
        userId: user.id,
        input,
        diagnosis,
      });
      return { diagnosticId, diagnosis };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['root-cause-diagnostics'] });
    },
    onError: (e: Error) => {
      toast.error(e.message === 'NO_COMPANY' ? 'Complétez le profil entreprise avant de lancer un diagnostic.' : e.message);
    },
  });
}

/**
 * Re-runs a diagnostic with the field evidence collected by an Evidence Pulse.
 * The original diagnostic is never modified: a new version is created and linked
 * to the baseline through `parent_diagnostic_id`.
 */
export function useReassessDiagnostic() {
  const { companyId } = useCompanyId();
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      base,
      pulse,
      language,
    }: {
      base: DiagnosticRow;
      pulse: PulseAggregate;
      language: 'fr' | 'en';
    }) => {
      if (!companyId || !user) throw new Error('NO_COMPANY');

      const { data: company } = await supabase
        .from('companies')
        .select('name, industry, employee_count, city')
        .eq('id', companyId)
        .maybeSingle();

      const input: DiagnosticInput = {
        title: base.title,
        problem_description: base.problem_description,
        department: base.department ?? undefined,
        affected_population: base.affected_population ?? undefined,
        headcount_affected: base.headcount_affected ?? undefined,
        symptoms: base.symptoms ?? [],
        business_kpis: base.business_kpis ?? [],
        evidence_sources: base.evidence_sources ?? {},
        source_channel: 'evidence_pulse',
        language,
      };

      const { data: ai, error: aiError } = await supabase.functions.invoke('root-cause-diagnostic', {
        body: {
          ...input,
          company: company ?? undefined,
          evidence_pulse: pulse,
          previous: {
            training_fit_score: base.training_fit_score ?? undefined,
            ai_confidence: base.ai_confidence ?? undefined,
            ai_summary: base.ai_summary ?? undefined,
          },
        },
      });
      if (aiError) throw aiError;
      if ((ai as { error?: string })?.error) throw new Error((ai as { error: string }).error);
      const diagnosis = ai as AIDiagnosis;

      const rootId = base.parent_diagnostic_id ?? base.id;
      const diagnosticId = await persistDiagnosis({
        companyId,
        userId: user.id,
        input,
        diagnosis,
        version: (base.version ?? 1) + 1,
        parentDiagnosticId: rootId,
      });

      return {
        diagnosticId,
        diagnosis,
        before: { confidence: base.ai_confidence ?? 0, fit: base.training_fit_score ?? 0 },
        after: { confidence: diagnosis.ai_confidence, fit: diagnosis.training_fit_score },
      };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['root-cause-diagnostics'] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAction(diagnosticId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ActionRow> }) => {
      const { error } = await supabase.from('root_cause_actions').update(patch as never).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['root-cause-diagnostic-detail', diagnosticId] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpsertMeasurement(diagnosticId: string | null) {
  const { companyId } = useCompanyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<MeasurementRow> & { kpi_name: string }) => {
      if (row.id) {
        const { id, ...patch } = row;
        const { error } = await supabase.from('diagnostic_impact_measurements').update(patch as never).eq('id', id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from('diagnostic_impact_measurements').insert({
        ...row,
        diagnostic_id: diagnosticId,
        company_id: companyId,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['root-cause-diagnostic-detail', diagnosticId] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteMeasurement(diagnosticId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | string[]) => {
      const ids = Array.isArray(id) ? id : [id];
      if (ids.length === 0) return;
      const { error } = await supabase.from('diagnostic_impact_measurements').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['root-cause-diagnostic-detail', diagnosticId] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDiagnostic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('root_cause_diagnostics').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Diagnostic supprimé');
      qc.invalidateQueries({ queryKey: ['root-cause-diagnostics'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
