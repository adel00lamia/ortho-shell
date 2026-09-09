import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface QimatakOverview {
  company_id: string;
  diagnostics_total: number;
  diagnostics_active: number;
  training_primary: number;
  training_not_primary: number;
  high_impact_open: number;
  pulses: number;
  pulse_responses: number;
  actions_total: number;
  actions_in_progress: number;
  actions_done: number;
  kpis_improving: number;
  kpis_flat: number;
  kpis_worsening: number;
  avoided_spend_mad: number;
  avoided_spend_grounded: boolean;
}

/**
 * Company-scoped Qimatak outcome metrics, aggregated by the database.
 * Returns null when the signed-in user has no company yet.
 */
export function useQimatakOverview(enabled = true) {
  return useQuery({
    queryKey: ['qimatak-executive-overview'],
    queryFn: async (): Promise<QimatakOverview | null> => {
      const { data, error } = await (supabase as unknown as {
        rpc: (fn: string) => Promise<{ data: unknown; error: unknown }>;
      }).rpc('qimatak_executive_overview');
      if (error) throw error;
      return (data ?? null) as QimatakOverview | null;
    },
    enabled,
    staleTime: 60_000,
  });
}
