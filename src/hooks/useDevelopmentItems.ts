import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'sonner';

/**
 * Development items are the spine of the training value chain: one row links a
 * detected skill gap to the decided lever, to the plan, to the internal training
 * that closes it, and finally back to the person's achieved level.
 */

export type DevelopmentStatus = 'detected' | 'decided' | 'planned' | 'in_training' | 'completed' | 'cancelled';
export type DevelopmentLever = 'upskilling' | 'reskilling' | 'no_training';
export type DevelopmentSource = 'diagnostic' | 'assessment' | 'performance' | 'manual';

/** Ordered stages of the chain, used by the funnel view. */
export const DEVELOPMENT_STAGES: DevelopmentStatus[] = [
  'detected',
  'decided',
  'planned',
  'in_training',
  'completed',
];

export const NEXT_STATUS: Partial<Record<DevelopmentStatus, DevelopmentStatus>> = {
  detected: 'decided',
  decided: 'planned',
  planned: 'in_training',
  in_training: 'completed',
};

export interface DevelopmentItemRow {
  id: string;
  company_id: string;
  employee_name: string;
  employee_email: string | null;
  department: string | null;
  position_title: string | null;
  skill_id: string | null;
  skill_name: string;
  source_type: DevelopmentSource;
  source_id: string | null;
  current_level: number | null;
  target_level: number | null;
  lever: DevelopmentLever;
  training_plan_id: string | null;
  training_module_id: string | null;
  action_id: string | null;
  status: DevelopmentStatus;
  achieved_level: number | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DetectedGap {
  key: string;
  employee_name: string;
  employee_email: string | null;
  skill_id: string;
  skill_name: string;
  current_level: number;
  target_level: number;
  /** target - current: 2 or more is a critical gap. */
  delta: number;
}

export interface ChainStats {
  detected: number;
  decided: number;
  planned: number;
  inTraining: number;
  completed: number;
  upskilling: number;
  reskilling: number;
  noTraining: number;
  peopleCovered: number;
  levelsGained: number;
  untrackedGaps: number;
}

export function useDevelopmentItems() {
  const { user } = useAuth();
  const { companyId } = useCompanyId();
  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ['development-items', companyId],
    queryFn: async (): Promise<DevelopmentItemRow[]> => {
      const { data, error } = await (supabase as any)
        .from('development_items')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as DevelopmentItemRow[];
    },
    enabled: !!companyId,
  });

  /** Skill gaps recorded on employees that are not yet tracked in the chain. */
  const gapsQuery = useQuery({
    queryKey: ['development-gaps', companyId],
    queryFn: async (): Promise<DetectedGap[]> => {
      const { data, error } = await (supabase as any)
        .from('employee_skills')
        .select('employee_name, employee_email, current_level, target_level, skill_id, skills(name_fr, name_en)')
        .eq('company_id', companyId);
      if (error) throw error;

      return ((data ?? []) as any[])
        .filter((row) => Number(row.target_level) > Number(row.current_level))
        .map((row) => ({
          key: `${row.employee_name}::${row.skill_id}`,
          employee_name: row.employee_name,
          employee_email: row.employee_email ?? null,
          skill_id: row.skill_id,
          skill_name: row.skills?.name_fr || row.skills?.name_en || '—',
          current_level: Number(row.current_level ?? 0),
          target_level: Number(row.target_level ?? 0),
          delta: Number(row.target_level ?? 0) - Number(row.current_level ?? 0),
        }))
        .sort((a, b) => b.delta - a.delta);
    },
    enabled: !!companyId,
  });

  const items = itemsQuery.data ?? [];
  const trackedKeys = new Set(items.map((i) => `${i.employee_name}::${i.skill_id}`));
  const untrackedGaps = (gapsQuery.data ?? []).filter((g) => !trackedKeys.has(g.key));

  const stats: ChainStats = {
    detected: items.filter((i) => i.status === 'detected').length,
    decided: items.filter((i) => i.status === 'decided').length,
    planned: items.filter((i) => i.status === 'planned').length,
    inTraining: items.filter((i) => i.status === 'in_training').length,
    completed: items.filter((i) => i.status === 'completed').length,
    upskilling: items.filter((i) => i.lever === 'upskilling').length,
    reskilling: items.filter((i) => i.lever === 'reskilling').length,
    noTraining: items.filter((i) => i.lever === 'no_training').length,
    peopleCovered: new Set(items.map((i) => i.employee_name)).size,
    levelsGained: items.reduce(
      (sum, i) =>
        i.achieved_level != null && i.current_level != null
          ? sum + Math.max(0, i.achieved_level - i.current_level)
          : sum,
      0
    ),
    untrackedGaps: untrackedGaps.length,
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['development-items', companyId] });
    queryClient.invalidateQueries({ queryKey: ['development-gaps', companyId] });
  };

  const addItem = useMutation({
    mutationFn: async (input: Partial<DevelopmentItemRow> & { employee_name: string; skill_name: string }) => {
      if (!companyId) throw new Error('missing company');
      const { data, error } = await (supabase as any)
        .from('development_items')
        .insert({
          company_id: companyId,
          created_by: user?.id ?? null,
          source_type: 'assessment',
          lever: 'upskilling',
          status: 'detected',
          ...input,
        })
        .select()
        .single();
      if (error) throw error;
      return data as DevelopmentItemRow;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e?.message ?? 'Erreur'),
  });

  const addGaps = useMutation({
    mutationFn: async (gaps: DetectedGap[]) => {
      if (!companyId) throw new Error('missing company');
      const rows = gaps.map((g) => ({
        company_id: companyId,
        created_by: user?.id ?? null,
        employee_name: g.employee_name,
        employee_email: g.employee_email,
        skill_id: g.skill_id,
        skill_name: g.skill_name,
        source_type: 'assessment',
        current_level: g.current_level,
        target_level: g.target_level,
        lever: 'upskilling',
        status: 'detected',
      }));
      const { error } = await (supabase as any).from('development_items').insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (count) => {
      invalidate();
      toast.success(`${count} écart(s) ajouté(s) au plan de développement`);
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erreur'),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<DevelopmentItemRow> }) => {
      const { error } = await (supabase as any)
        .from('development_items')
        .update(patch)
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e?.message ?? 'Erreur'),
  });

  /**
   * Closing the loop: the achieved level is written back onto the person's skill
   * record, so the assessment, the career view and the next diagnostic all see it.
   */
  const completeItem = useMutation({
    mutationFn: async ({ item, achievedLevel }: { item: DevelopmentItemRow; achievedLevel: number }) => {
      const { error } = await (supabase as any)
        .from('development_items')
        .update({
          status: 'completed',
          achieved_level: achievedLevel,
          completed_at: new Date().toISOString(),
        })
        .eq('id', item.id)
        .eq('company_id', companyId);
      if (error) throw error;

      if (item.skill_id) {
        await (supabase as any)
          .from('employee_skills')
          .update({ current_level: achievedLevel, assessed_at: new Date().toISOString() })
          .eq('company_id', companyId)
          .eq('employee_name', item.employee_name)
          .eq('skill_id', item.skill_id);
      }
    },
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['employee-skills'] });
      toast.success('Niveau mis à jour sur la fiche de la personne');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erreur'),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('development_items')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e?.message ?? 'Erreur'),
  });

  return {
    items,
    untrackedGaps,
    stats,
    loading: itemsQuery.isLoading || gapsQuery.isLoading,
    error: itemsQuery.error,
    addItem,
    addGaps,
    updateItem,
    completeItem,
    deleteItem,
  };
}
