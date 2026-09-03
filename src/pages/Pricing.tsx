import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CheckIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Seo } from '@/components/seo/Seo';

const plans = [
  {
    name: 'Starter',
    id: 'starter',
    monthlyPrice: 2500,
    annualPrice: 2075, // 17% discount
    description: 'Perfect for small teams getting started',
    features: [
      'Up to 5 team members',
      'Basic training modules',
      'Email support',
      'Basic analytics',
      'Standard templates'
    ],
    popular: false
  },
  {
    name: 'Professional',
    id: 'professional',
    monthlyPrice: 7500,
    annualPrice: 6225, // 17% discount
    description: 'Advanced features for growing companies',
    features: [
      'Up to 50 team members',
      'Advanced training modules',
      'Priority support',
      'Advanced analytics',
      'Custom templates',
      'API access',
      'GIAC certification support'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    monthlyPrice: 15000,
    annualPrice: 12450, // 17% discount
    description: 'Complete solution for large organizations',
    features: [
      'Unlimited team members',
      'Custom training modules',
      '24/7 dedicated support',
      'Enterprise analytics',
      'White-label solution',
      'Full API access',
      'OFPPT compliance',
      'Custom integrations'
    ],
    popular: false
  },
  {
    name: 'Custom',
    id: 'custom',
    monthlyPrice: null,
    annualPrice: null,
    description: 'Tailored solution for your specific needs',
    features: [
      'Everything in Enterprise',
      'Custom development',
      'Dedicated account manager',
      'Custom compliance requirements',
      'On-premise deployment options'
    ],
    popular: false
  }
];

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handlePlanSelect = async (planId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to select a plan.",
        variant: "destructive"
      });
      return;
    }

    if (planId === 'custom') {
      toast({
        title: "Contact us",
        description: "Please contact our sales team for a custom solution.",
      });
      return;
    }

    setLoading(planId);
    
    try {
      const { data: { session } } = await (await import('@/integrations/supabase/client')).supabase.auth.getSession();
      const response = await fetch(
        `${(await import('@/config/env')).env.VITE_SUPABASE_URL}/functions/v1/billing-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': (await import('@/config/env')).env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            planId,
            interval: isAnnual ? 'annual' : 'monthly'
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return 'Contact us';
    return new Intl.NumberFormat('en-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <Seo
        path="/pricing"
        title="Tarifs QimataQ | Logiciel RH et diagnostic IA"
        description="Comparez les formules QimataQ : diagnostic RH, plan de formation IA, suivi d'impact et conformité OFPPT. Tarifs mensuels ou annuels en MAD."
      />
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Start your 14-day free trial. No credit card required.
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${!isAnnual ? 'font-semibold' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <span className={`text-sm ${isAnnual ? 'font-semibold' : 'text-muted-foreground'}`}>
              Annual
            </span>
            {isAnnual && (
              <Badge variant="secondary" className="ml-2">
                Save 17%
              </Badge>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <div className="text-3xl font-bold">
                    {formatPrice(isAnnual ? plan.annualPrice : plan.monthlyPrice)}
                  </div>
                  {plan.monthlyPrice && (
                    <div className="text-sm text-muted-foreground">
                      per month{isAnnual ? ', billed annually' : ''}
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckIcon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={loading === plan.id}
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {loading === plan.id ? 'Loading...' : 
                   plan.id === 'custom' ? 'Contact Sales' : 
                   'Start Free Trial'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            All plans include a 14-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;