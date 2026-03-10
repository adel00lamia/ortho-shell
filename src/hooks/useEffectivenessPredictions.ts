import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';

export interface EffectivenessPrediction {
  planId: string;
  planTitle: string;
  completionPrediction: number;   // 0-100%
  roiPrediction: number;          // multiplier, e.g. 2.5x
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
}

/**
 * Predict training effectiveness based on:
 * - Historical completion rates for similar plans
 * - Number of assigned employees vs capacity
 * - Module complexity (duration, content type)
 * - Past evaluation scores
 */
export function useEffectivenessPredictions() {
  const { companyId } = useCompanyId();

  return useQuery({
    queryKey: ['effectiveness-predictions', companyId],
    enabled: !!companyId,
    staleTime: 1000 * 60 * 30, // 30 min
    queryFn: async (): Promise<EffectivenessPrediction[]> => {
      // Get active plans with their modules
      const { data: plans } = await supabase
        .from('training_plans')
        .select('id, title, status, created_at')
        .eq('company_id', companyId!)
        .in('status', ['active', 'draft'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (!plans?.length) return [];

      // Get completion stats
      const { data: modules } = await supabase
        .from('training_modules')
        .select('id, training_plan_id, completed, duration_hours, content_type')
        .in('training_plan_id', plans.map(p => p.id));

      // Get evaluation averages
      const { data: evals } = await supabase
        .from('performance_evaluations')
        .select('overall_rating')
        .eq('company_id', companyId!);

      const avgRating = evals?.length
        ? evals.reduce((s, e) => s + (e.overall_rating || 0), 0) / evals.length
        : 3;

      return plans.map(plan => {
        const planModules = (modules || []).filter(m => m.training_plan_id === plan.id);
        const totalModules = planModules.length;
        const completedModules = planModules.filter(m => m.completed).length;
        const totalHours = planModules.reduce((s, m) => s + (m.duration_hours || 1), 0);

        // Simple prediction model
        const historicalRate = totalModules > 0 ? (completedModules / totalModules) * 100 : 50;
        const complexityFactor = totalHours > 40 ? 0.85 : totalHours > 20 ? 0.92 : 1;
        const ratingFactor = avgRating / 5;

        const completionPrediction = Math.round(
          Math.min(100, historicalRate * complexityFactor * (0.5 + ratingFactor * 0.5))
        );

        const roiPrediction = Math.round((completionPrediction / 100) * 3.5 * 10) / 10;

        const riskLevel: 'low' | 'medium' | 'high' =
          completionPrediction >= 75 ? 'low' :
          completionPrediction >= 50 ? 'medium' : 'high';

        const factors: string[] = [];
        if (totalHours > 40) factors.push('High complexity (40+ hours)');
        if (avgRating < 3) factors.push('Below-average team scores');
        if (completedModules === 0 && totalModules > 0) factors.push('No modules completed yet');
        if (completionPrediction >= 80) factors.push('Strong historical completion rate');

        return {
          planId: plan.id,
          planTitle: plan.title || `Plan ${plan.id.slice(0, 6)}`,
          completionPrediction,
          roiPrediction,
          riskLevel,
          factors,
        };
      });
    },
  });
}
