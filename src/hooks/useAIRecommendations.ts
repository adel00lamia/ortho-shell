import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CourseRecommendation {
  listing_id: string;
  title: string;
  reason: string;
  match_score: number; // 0-100
  category: string;
  price_cents: number;
}

/**
 * AI course recommendations based on:
 * - User's skill gaps (from evaluations)
 * - Company training plan priorities
 * - Completion history
 */
export function useAIRecommendations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai-recommendations', user?.id],
    queryFn: async (): Promise<CourseRecommendation[]> => {
      if (!user) return [];

      // 1. Get user's skill gaps from evaluations
      const { data: evals } = await supabase
        .from('performance_evaluations')
        .select('areas_for_improvement, training_recommendations')
        .eq('employee_name', user.user_metadata?.full_name || '')
        .order('evaluation_date', { ascending: false })
        .limit(3);

      const gaps = new Set<string>();
      const recommendations = new Set<string>();
      evals?.forEach((e) => {
        (e.areas_for_improvement as string[] || []).forEach((a: string) => gaps.add(a.toLowerCase()));
        (e.training_recommendations as string[] || []).forEach((r: string) => recommendations.add(r.toLowerCase()));
      });

      // 2. Get published marketplace listings
      const { data: listings } = await supabase
        .from('marketplace_listings')
        .select('id, title, description, short_description, category, price_cents')
        .eq('status', 'published')
        .limit(50);

      if (!listings?.length) return [];

      // 3. Simple keyword matching (in production, use embeddings via Edge Function)
      const scored = listings.map((l) => {
        const text = `${l.title} ${l.description} ${l.short_description} ${l.category}`.toLowerCase();
        let score = 0;

        gaps.forEach((gap) => {
          if (text.includes(gap)) score += 30;
        });
        recommendations.forEach((rec) => {
          if (text.includes(rec)) score += 20;
        });

        // Boost if category matches any gap keyword
        gaps.forEach((gap) => {
          if (l.category.toLowerCase().includes(gap)) score += 15;
        });

        return {
          listing_id: l.id,
          title: l.title,
          category: l.category,
          price_cents: l.price_cents,
          match_score: Math.min(100, score),
          reason: score >= 30
            ? 'Matches your skill development areas'
            : score >= 15
              ? 'Related to your training goals'
              : 'Popular in your industry',
        };
      });

      return scored
        .filter((s) => s.match_score > 0)
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, 6);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 15, // 15 min
  });
}
