import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'sonner';

export type TTable = 'strategic_objectives' | 'business_capabilities' | 'objective_capabilities' | 'business_processes' | 'process_tasks';
// Tables are new; cast until generated types refresh.
const db = supabase as unknown as { from: (t: string) => any };

export function useTransformationTable<T = any>(table: TTable) {
  const { companyId } = useCompanyId();
  const qc = useQueryClient();
  const key = ['transformation', table, companyId];

  const query = useQuery({
    queryKey: key,
    enabled: !!companyId,
    queryFn: async (): Promise<T[]> => {
      const { data, error } = await db.from(table).select('*').eq('company_id', companyId).order('created_at');
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });

  const onError = (e: any) => toast.error(e?.message ?? 'Erreur');
  const invalidate = () => qc.invalidateQueries({ queryKey: ['transformation', table] });

  const create = useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      if (!companyId) throw new Error('Aucune entreprise associée à votre compte.');
      const { error } = await db.from(table).insert({ ...row, company_id: companyId });
      if (error) throw error;
    },
    onSuccess: invalidate, onError,
  });
  const update = useMutation({
    mutationFn: async ({ id, ...row }: Record<string, unknown> & { id: string }) => {
      const { error } = await db.from(table).update(row).eq('id', id).eq('company_id', companyId);
      if (error) throw error;
    },
    onSuccess: invalidate, onError,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from(table).delete().eq('id', id).eq('company_id', companyId);
      if (error) throw error;
    },
    onSuccess: invalidate, onError,
  });

  return { ...query, rows: query.data ?? [], create, update, remove, companyId };
}
