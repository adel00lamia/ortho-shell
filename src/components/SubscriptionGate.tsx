import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface SubscriptionGateProps {
  children: React.ReactNode;
  requiredPlan?: 'starter' | 'professional' | 'enterprise';
}

// FREE TRIAL: All features open to explore for all users
const FREE_TRIAL_MODE = true;

const SubscriptionGate = ({ children, requiredPlan = 'starter' }: SubscriptionGateProps) => {
  const { subscription, loading, hasAccess, trialDaysLeft } = useSubscription();

  if (DISCOVERY_MODE) return <>{children}</>;
  if (loading) return null;

  // Show trial ending warning
  if (subscription && trialDaysLeft > 0 && trialDaysLeft <= 3) {
    return (
      <div className="space-y-4">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Your trial ends in {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}.
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
  if (!hasAccess(requiredPlan)) {
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
              : `This feature requires the ${requiredPlan} plan or higher.`}
          </p>
          <Button asChild>
            <a href="/pricing">{!subscription ? 'Start Free Trial' : 'Upgrade Plan'}</a>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGate;
