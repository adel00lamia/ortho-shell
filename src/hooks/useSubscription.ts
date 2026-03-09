import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface Subscription {
  id: string;
  plan: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled';
  current_period_end: string;
  interval: string;
  seats: number;
  stripe_subscription_id: string | null;
}

export function useSubscription() {
  const { user } = useAuth();

  const { data: subscription = null, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .in('status', ['trialing', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        return null;
      }
      return data as Subscription | null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const getPlanLevel = (plan: string) => {
    const levels: Record<string, number> = { starter: 1, professional: 2, enterprise: 3 };
    return levels[plan] || 0;
  };

  const hasAccess = (requiredPlan: string) => {
    if (!subscription) return false;
    if (subscription.status === 'canceled') return false;
    return getPlanLevel(subscription.plan) >= getPlanLevel(requiredPlan);
  };

  const trialDaysLeft = (() => {
    if (!subscription || subscription.status !== 'trialing') return 0;
    const end = new Date(subscription.current_period_end);
    return Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  })();

  return { subscription, loading: isLoading, hasAccess, trialDaysLeft };
}
