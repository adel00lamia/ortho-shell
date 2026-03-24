import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  computeTFP,
  computeReimbursementCap,
  computeActionReimbursement,
  computeGiacReimbursement,
} from '@/lib/ofpptFinancials';

const db = supabase as any;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IngenierieDossier {
  id: string;
  company_id: string;
  created_by: string | null;
  exercise_year: number;
  status: 'draft' | 'in_progress' | 'finalized' | 'submitted';
  giac_sector: string | null;
  if_number: string | null;
  gross_annual_payroll: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  followed_strategic_diagnostic: boolean;
  swot_data: Record<string, any>;
  needs_individual: any[];
  needs_collective: any[];
  needs_strategic: any[];
  tfp_amount: number | null;
  estimated_reimbursement: number | null;
  csf_attestation_url: string | null;
  giac_attestation_url: string | null;
  linked_training_plan_id: string | null;
  completed_steps: number[];
  current_step: number;
  created_at: string;
  updated_at: string;
}

export interface IngenierieAction {
  id: string;
  dossier_id: string;
  company_id: string;
  sort_order: number;
  title: string;
  target_population: string | null;
  objectives: string[];
  content_outline: string | null;
  duration_days: number | null;
  duration_hours: number | null;
  participant_count: number | null;
  planned_start_date: string | null;
  planned_end_date: string | null;
  provider_name: string | null;
  provider_type: 'internal' | 'external' | 'mixed';
  location: string | null;
  cost_ht: number | null;
  is_planned: boolean;
  reimbursement_rate: number;
  source_need_type: 'individual' | 'collective' | 'strategic';
  created_at: string;
  updated_at: string;
}

// ─── Dossier Hook ─────────────────────────────────────────────────────────────

export function useIngenierieDossier(exerciseYear?: number) {
  const { companyId } = useCompanyId();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const year = exerciseYear ?? new Date().getFullYear();

  const query = useQuery({
    queryKey: ['ingenierie', companyId, year],
    queryFn: async () => {
      const { data, error } = await db
        .from('ingenierie_de_formation')
        .select('*')
        .eq('company_id', companyId!)
        .eq('exercise_year', year)
        .maybeSingle();
      if (error) throw error;
      return data as IngenierieDossier | null;
    },
    enabled: !!companyId,
  });

  const createDossier = useMutation({
    mutationFn: async (partial?: Partial<IngenierieDossier>) => {
      const { data, error } = await db
        .from('ingenierie_de_formation')
        .insert({
          company_id: companyId!,
          created_by: user?.id,
          exercise_year: year,
          ...partial,
        })
        .select()
        .single();
      if (error) throw error;
      return data as IngenierieDossier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingenierie', companyId, year] });
      toast.success('Dossier créé');
    },
    onError: () => toast.error('Erreur lors de la création du dossier'),
  });

  const updateDossier = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<IngenierieDossier> & { id: string }) => {
      const { error } = await db
        .from('ingenierie_de_formation')
        .update(updates)
        .eq('id', id)
        .eq('company_id', companyId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingenierie', companyId, year] });
    },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  });

  const advanceStep = useMutation({
    mutationFn: async ({ id, step, completedSteps }: { id: string; step: number; completedSteps: number[] }) => {
      const { error } = await db
        .from('ingenierie_de_formation')
        .update({
          current_step: step,
          completed_steps: completedSteps,
          status: step > 1 ? 'in_progress' : 'draft',
        })
        .eq('id', id)
        .eq('company_id', companyId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingenierie', companyId, year] });
    },
  });

  return {
    dossier: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    createDossier,
    updateDossier,
    advanceStep,
  };
}

// ─── Actions Hook ─────────────────────────────────────────────────────────────

export function useIngenierieActions(dossierId: string | null) {
  const { companyId } = useCompanyId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['ingenierie-actions', dossierId],
    queryFn: async () => {
      const { data, error } = await db
        .from('ingenierie_actions')
        .select('*')
        .eq('dossier_id', dossierId!)
        .eq('company_id', companyId!)
        .order('sort_order');
      if (error) throw error;
      return (data || []) as IngenierieAction[];
    },
    enabled: !!dossierId && !!companyId,
  });

  const addAction = useMutation({
    mutationFn: async (partial: Partial<IngenierieAction> & { title: string }) => {
      const maxOrder = (query.data?.length ?? 0);
      const { data, error } = await db
        .from('ingenierie_actions')
        .insert({
          company_id: companyId!,
          dossier_id: dossierId!,
          sort_order: maxOrder,
          ...partial,
        })
        .select()
        .single();
      if (error) throw error;
      return data as IngenierieAction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingenierie-actions', dossierId] });
      toast.success('Action ajoutée');
    },
    onError: () => toast.error('Erreur lors de l\'ajout'),
  });

  const updateAction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<IngenierieAction> & { id: string }) => {
      const { error } = await db
        .from('ingenierie_actions')
        .update(updates)
        .eq('id', id)
        .eq('company_id', companyId!);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ingenierie-actions', dossierId] }),
  });

  const deleteAction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from('ingenierie_actions')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingenierie-actions', dossierId] });
      toast.success('Action supprimée');
    },
  });

  return {
    actions: query.data ?? [],
    isLoading: query.isLoading,
    addAction,
    updateAction,
    deleteAction,
  };
}

// ─── Budget Calculations (pure derived state, no DB) ──────────────────────────

export function useBudgetCalculations(
  actions: IngenierieAction[],
  grossAnnualPayroll: number,
  followedStrategicDiagnostic: boolean,
  giacEngineeringCostHt: number = 0
) {
  const tfp = computeTFP(grossAnnualPayroll || 0);
  const cap = computeReimbursementCap(tfp);

  const actionRows = actions.map((a) => {
    const reimbInfo = computeActionReimbursement(
      a.cost_ht ?? 0,
      a.duration_hours ?? 0,
      a.participant_count ?? 0,
      a.is_planned
    );
    return { ...a, ...reimbInfo };
  });

  const totalCostHt = actions.reduce((s, a) => s + (a.cost_ht ?? 0), 0);
  const totalActionsReimbursement = actionRows.reduce((s, a) => s + a.cappedAmount, 0);
  const giacReimbursement = computeGiacReimbursement(giacEngineeringCostHt, followedStrategicDiagnostic);
  const totalReimbursement = Math.min(totalActionsReimbursement + giacReimbursement, cap);

  return {
    tfp,
    cap,
    totalCostHt,
    actionRows,
    totalActionsReimbursement,
    giacReimbursement,
    totalReimbursement,
  };
}
