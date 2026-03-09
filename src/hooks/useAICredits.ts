import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyId } from '@/hooks/useCompanyId';

export type CreditAction = 'plan_generation' | 'ai_matching' | 'content_suggestion' | 'skill_analysis' | 'report_generation' | 'benchmark_analysis';

const CREDIT_COSTS: Record<CreditAction, number> = {
  plan_generation: 5,
  ai_matching: 2,
  content_suggestion: 3,
  skill_analysis: 4,
  report_generation: 5,
  benchmark_analysis: 3,
};

export function useMonthlyUsage() {
  const { user } = useAuth();
  const { companyId } = useCompanyId();

  return useQuery({
    queryKey: ['ai-credit-usage', companyId],
    enabled: !!user && !!companyId,
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('ai_credit_usage')
        .select('action, credits_used')
        .eq('company_id', companyId!)
        .gte('created_at', startOfMonth.toISOString());

      if (error) throw error;

      const byAction: Record<string, number> = {};
      let total = 0;
      for (const row of data || []) {
        byAction[row.action] = (byAction[row.action] || 0) + row.credits_used;
        total += row.credits_used;
      }

      return { total, byAction, data: data || [] };
    },
  });
}

export function useTrackCredit() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { companyId } = useCompanyId();

  return useMutation({
    mutationFn: async (action: CreditAction) => {
      const { error } = await supabase
        .from('ai_credit_usage')
        .insert({
          user_id: user!.id,
          company_id: companyId!,
          action,
          credits_used: CREDIT_COSTS[action],
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-credit-usage'] });
    },
  });
}

export { CREDIT_COSTS };
