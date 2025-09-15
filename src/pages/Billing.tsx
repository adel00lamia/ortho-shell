import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, CreditCard, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Subscription {
  id: string;
  plan: string;
  interval: 'monthly' | 'annual';
  status: 'trialing' | 'active' | 'past_due' | 'canceled';
  current_period_end: string;
  seats: number;
  stripe_subscription_id: string;
  created_at: string;
}

const Billing = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'trialing')
        .or('status.eq.active,status.eq.past_due')
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

  const handleManageSubscription = async () => {
    // This would integrate with Stripe Customer Portal
    toast({
      title: "Coming soon",
      description: "Subscription management portal will be available soon.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trialing':
        return 'bg-blue-500';
      case 'active':
        return 'bg-green-500';
      case 'past_due':
        return 'bg-orange-500';
      case 'canceled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const isTrialEndingSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3 && daysLeft > 0;
  };

  const getPlanPrice = (plan: string, interval: string) => {
    const prices = {
      starter: { monthly: 2500, annual: 2075 },
      professional: { monthly: 7500, annual: 6225 },
      enterprise: { monthly: 15000, annual: 12450 }
    };
    
    return prices[plan as keyof typeof prices]?.[interval as 'monthly' | 'annual'] || 0;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Billing</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>No Active Subscription</CardTitle>
              <CardDescription>
                You don't have an active subscription. Start your free trial today!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/pricing">View Plans</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Billing</h1>

        {subscription.status === 'trialing' && isTrialEndingSoon(subscription.current_period_end) && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your trial ends on {formatDate(subscription.current_period_end)}. 
              Add a payment method to continue using TrainPro Academy.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-lg">
                    {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Billed {subscription.interval}
                  </div>
                </div>
                <Badge className={getStatusColor(subscription.status)}>
                  {subscription.status === 'trialing' ? 'Trial' : 
                   subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </Badge>
              </div>

              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('en-MA', {
                  style: 'currency',
                  currency: 'MAD',
                  minimumFractionDigits: 0
                }).format(getPlanPrice(subscription.plan, subscription.interval))}
                <span className="text-sm font-normal text-muted-foreground">
                  /{subscription.interval === 'annual' ? 'year' : 'month'}
                </span>
              </div>

              <Button onClick={handleManageSubscription} className="w-full">
                Manage Subscription
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Billing Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  {subscription.status === 'trialing' ? 'Trial ends' : 'Next billing date'}
                </div>
                <div className="font-semibold">
                  {formatDate(subscription.current_period_end)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {subscription.seats} seat{subscription.seats !== 1 ? 's' : ''}
                </span>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Subscription ID</div>
                <div className="font-mono text-xs break-all">
                  {subscription.stripe_subscription_id}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              Contact our support team if you have any questions about your subscription.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline">
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Billing;