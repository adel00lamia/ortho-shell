import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Subscription {
  plan: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled';
  current_period_end: string;
}

interface SubscriptionGateProps {
  children: React.ReactNode;
  requiredPlan?: 'starter' | 'professional' | 'enterprise';
}

// DISCOVERY MODE: Temporarily bypass all plan restrictions
const DISCOVERY_MODE = true;

const SubscriptionGate = ({ children, requiredPlan = 'starter' }: SubscriptionGateProps) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan, status, current_period_end')
        .eq('user_id', user.id)
        .in('status', ['trialing', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        return;
      }

      setSubscription(data as Subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanLevel = (plan: string) => {
    const levels = { starter: 1, professional: 2, enterprise: 3 };
    return levels[plan as keyof typeof levels] || 0;
  };

  const hasAccess = () => {
    if (!subscription) return false;
    if (subscription.status === 'canceled') return false;
    
    const userPlanLevel = getPlanLevel(subscription.plan);
    const requiredPlanLevel = getPlanLevel(requiredPlan);
    
    return userPlanLevel >= requiredPlanLevel;
  };

  const isTrialEndingSoon = () => {
    if (!subscription || subscription.status !== 'trialing') return false;
    
    const endDate = new Date(subscription.current_period_end);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysLeft <= 3 && daysLeft > 0;
  };

  const getTrialDaysLeft = () => {
    if (!subscription || subscription.status !== 'trialing') return 0;
    
    const endDate = new Date(subscription.current_period_end);
    const now = new Date();
    return Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  // DISCOVERY MODE: skip all checks, render children directly
  if (DISCOVERY_MODE) {
    return <>{children}</>;
  }

  // Show trial ending warning
  if (subscription && isTrialEndingSoon()) {
    return (
      <div className="space-y-4">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Your trial ends in {getTrialDaysLeft()} day{getTrialDaysLeft() !== 1 ? 's' : ''}. 
            <Button asChild variant="link" className="p-0 h-auto ml-1 text-orange-800">
              <a href="/billing">Add payment method</a>
            </Button>
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  // Block access if no subscription or insufficient plan
  if (!hasAccess()) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold mb-2">
            {!subscription ? 'Subscription Required' : 'Upgrade Required'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {!subscription 
              ? 'You need an active subscription to access this feature.' 
              : `This feature requires the ${requiredPlan} plan or higher.`
            }
          </p>
          <Button asChild>
            <a href="/pricing">
              {!subscription ? 'Start Free Trial' : 'Upgrade Plan'}
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGate;