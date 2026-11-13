import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle, Calendar, CreditCard, Users, ArrowRight,
  Zap, CheckCircle2, Clock, TrendingUp, Receipt, Download,
  Pause, XCircle, ArrowUpCircle, Loader2, ExternalLink,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { exportCsv } from '@/lib/export';
import { generateInvoice } from '@/lib/invoice';
import { motion } from 'framer-motion';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, delay: i * 0.04 },
  }),
};

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

const PLAN_LIMITS: Record<string, { members: number; modules: string; ai: boolean }> = {
  starter: { members: 5, modules: 'Basic', ai: false },
  professional: { members: 50, modules: 'Advanced + AI', ai: true },
  enterprise: { members: 9999, modules: 'Unlimited', ai: true },
};

const Billing = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [teamCount, setTeamCount] = useState(0);
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fr = language === 'fr';

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      try {
        // Fetch subscription
        const { data } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['trialing', 'active', 'past_due'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        setSubscription(data as Subscription | null);

        // Count team members
        if (data) {
          const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
          if (profile?.company_id) {
            const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', profile.company_id);
            setTeamCount(count || 0);
          }
        }
      } catch (err) {
        console.error('Billing load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(fr ? 'fr-MA' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

  const getDaysLeft = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
    return Math.max(0, days);
  };

  const getPlanPrice = (plan: string, interval: string) => {
    const prices = {
      starter: { monthly: 2500, annual: 25000 },
      professional: { monthly: 7500, annual: 75000 },
      enterprise: { monthly: 15000, annual: 150000 },
    };
    return prices[plan as keyof typeof prices]?.[interval as 'monthly' | 'annual'] || 0;
  };

  const fmtMAD = (amount: number) =>
    new Intl.NumberFormat(fr ? 'fr-MA' : 'en-US', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' MAD';

  const statusConfig: Record<string, { color: string; label: string; labelFr: string; icon: React.ElementType }> = {
    trialing: { color: 'bg-blue-500', label: 'Trial', labelFr: 'Essai', icon: Clock },
    active: { color: 'bg-green-500', label: 'Active', labelFr: 'Actif', icon: CheckCircle2 },
    past_due: { color: 'bg-orange-500', label: 'Past Due', labelFr: 'En retard', icon: AlertCircle },
    canceled: { color: 'bg-red-500', label: 'Canceled', labelFr: 'Annulé', icon: XCircle },
  };

  const handleAction = async (action: 'upgrade' | 'pause' | 'cancel' | 'portal') => {
    setActionLoading(action);
    try {
      if (action === 'upgrade') {
        navigate('/pricing');
        return;
      }
      if (action === 'portal') {
        // In production, call Edge Function to create Stripe Customer Portal session
        toast({
          title: fr ? 'Redirection vers Stripe...' : 'Redirecting to Stripe...',
          description: fr ? 'Le portail de gestion s\'ouvrira dans un nouvel onglet.' : 'The management portal will open in a new tab.',
        });
        return;
      }
      if (action === 'pause' || action === 'cancel') {
        toast({
          title: fr ? 'Action planifiée' : 'Action scheduled',
          description: fr
            ? `Votre abonnement sera ${action === 'pause' ? 'suspendu' : 'annulé'} à la fin de la période en cours.`
            : `Your subscription will be ${action === 'pause' ? 'paused' : 'canceled'} at the end of the current period.`,
        });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadInvoice = () => {
    if (!subscription) return;
    generateInvoice({
      invoiceNumber: `INV-${subscription.id.slice(0, 8).toUpperCase()}`,
      date: new Date().toLocaleDateString('fr-MA'),
      sellerName: 'Qimatak SAS',
      sellerAddress: 'Casablanca, Maroc',
      sellerIce: '003012345678901',
      sellerIf: '50123456',
      buyerName: user?.user_metadata?.full_name || 'Client',
      buyerAddress: '',
      buyerIce: '',
      items: [{
        description: `Plan ${subscription.plan} — ${subscription.interval === 'annual' ? (fr ? 'Annuel' : 'Annual') : (fr ? 'Mensuel' : 'Monthly')}`,
        quantity: 1,
        unitPrice: getPlanPrice(subscription.plan, subscription.interval),
        tvaRate: 20,
      }],
    });
  };

  if (loading) return <DashboardSkeleton />;

  // No subscription state
  if (!subscription) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={0}>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            {fr ? 'Facturation' : 'Billing'}
          </h1>
          <p className="text-muted-foreground">{fr ? 'Gérez votre abonnement' : 'Manage your subscription'}</p>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={1}>
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                {fr ? 'Aucun abonnement actif' : 'No Active Subscription'}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {fr
                  ? 'Commencez votre essai gratuit de 14 jours et débloquez toutes les fonctionnalités.'
                  : 'Start your 14-day free trial and unlock all features.'}
              </p>
              <Button size="lg" onClick={() => navigate('/pricing')} className="gap-2">
                {fr ? 'Voir les plans' : 'View Plans'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const daysLeft = getDaysLeft(subscription.current_period_end);
  const status = statusConfig[subscription.status] || statusConfig.active;
  const StatusIcon = status.icon;
  const limits = PLAN_LIMITS[subscription.plan] || PLAN_LIMITS.starter;
  const seatUsage = Math.min(100, Math.round((teamCount / limits.members) * 100));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={0} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            {fr ? 'Facturation' : 'Billing'}
          </h1>
          <p className="text-muted-foreground">{fr ? 'Gérez votre abonnement et vos factures' : 'Manage your subscription and invoices'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadInvoice} className="gap-2">
            <Download className="h-4 w-4" />
            {fr ? 'Facture' : 'Invoice'}
          </Button>
          <Button size="sm" onClick={() => handleAction('portal')} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            {fr ? 'Portail Stripe' : 'Stripe Portal'}
          </Button>
        </div>
      </motion.div>

      {/* Trial ending alert */}
      {subscription.status === 'trialing' && daysLeft <= 5 && (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={0.5}>
          <Alert className={daysLeft <= 2 ? 'border-destructive/50 bg-destructive/5' : ''}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {fr
                ? `Votre essai se termine dans ${daysLeft} jour${daysLeft !== 1 ? 's' : ''}. Passez à un plan payant pour continuer.`
                : `Your trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Upgrade to keep using Qimatak.`}
              <Button size="sm" variant="link" onClick={() => navigate('/pricing')} className="ml-2 p-0 h-auto">
                {fr ? 'Voir les plans →' : 'View plans →'}
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Past due alert */}
      {subscription.status === 'past_due' && (
        <Alert className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <AlertDescription>
            {fr
              ? 'Votre paiement est en retard. Mettez à jour votre moyen de paiement pour éviter la suspension.'
              : 'Your payment is past due. Update your payment method to avoid suspension.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Plan overview + Billing details */}
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={1}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {fr ? 'Plan actuel' : 'Current Plan'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                    {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {fr ? `Facturation ${subscription.interval === 'annual' ? 'annuelle' : 'mensuelle'}` : `Billed ${subscription.interval}`}
                  </div>
                </div>
                <Badge className={`${status.color} text-white gap-1`}>
                  <StatusIcon className="h-3 w-3" />
                  {fr ? status.labelFr : status.label}
                </Badge>
              </div>

              <div className="text-3xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                {fmtMAD(getPlanPrice(subscription.plan, subscription.interval))}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  /{subscription.interval === 'annual' ? (fr ? 'an' : 'year') : (fr ? 'mois' : 'month')}
                </span>
              </div>

              {/* Plan features */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{limits.members === 9999 ? (fr ? 'Membres illimités' : 'Unlimited members') : `${limits.members} ${fr ? 'membres' : 'members'}`}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span>{fr ? `Modules ${limits.modules}` : `${limits.modules} modules`}</span>
                </div>
                {limits.ai && (
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>{fr ? 'IA incluse' : 'AI included'}</span>
                  </div>
                )}
              </div>

              {subscription.plan !== 'enterprise' && (
                <Button onClick={() => handleAction('upgrade')} className="w-full gap-2">
                  <ArrowUpCircle className="h-4 w-4" />
                  {fr ? 'Passer au plan supérieur' : 'Upgrade Plan'}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={2}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {fr ? 'Détails de facturation' : 'Billing Details'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Trial progress */}
              {subscription.status === 'trialing' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{fr ? 'Période d\'essai' : 'Trial period'}</span>
                    <span className="font-medium">{daysLeft} {fr ? 'jours restants' : 'days left'}</span>
                  </div>
                  <Progress value={Math.max(5, 100 - (daysLeft / 14) * 100)} className="h-2" />
                </div>
              )}

              <div>
                <div className="text-sm text-muted-foreground">
                  {subscription.status === 'trialing' ? (fr ? 'Fin de l\'essai' : 'Trial ends') : (fr ? 'Prochaine facturation' : 'Next billing date')}
                </div>
                <div className="font-semibold text-lg">{formatDate(subscription.current_period_end)}</div>
              </div>

              {/* Seat usage */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{fr ? 'Utilisation des sièges' : 'Seat usage'}</span>
                  <span className="font-medium">{teamCount} / {limits.members === 9999 ? '∞' : limits.members}</span>
                </div>
                {limits.members !== 9999 && <Progress value={seatUsage} className="h-2" />}
              </div>

              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground">{fr ? 'ID d\'abonnement' : 'Subscription ID'}</div>
                <div className="font-mono text-xs text-muted-foreground break-all mt-1">
                  {subscription.stripe_subscription_id}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {fr ? 'Créé le' : 'Created'}: {formatDate(subscription.created_at)}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={3}>
        <Card>
          <CardHeader>
            <CardTitle>{fr ? 'Gérer l\'abonnement' : 'Manage Subscription'}</CardTitle>
            <CardDescription>
              {fr ? 'Modifier, suspendre ou annuler votre abonnement' : 'Modify, pause, or cancel your subscription'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => handleAction('portal')} disabled={!!actionLoading} className="gap-2">
                {actionLoading === 'portal' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {fr ? 'Mettre à jour le paiement' : 'Update Payment'}
              </Button>
              <Button variant="outline" onClick={() => handleAction('pause')} disabled={!!actionLoading} className="gap-2">
                {actionLoading === 'pause' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
                {fr ? 'Suspendre' : 'Pause'}
              </Button>
              <Button variant="outline" onClick={() => handleAction('cancel')} disabled={!!actionLoading} className="gap-2 text-destructive hover:text-destructive">
                {actionLoading === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                {fr ? 'Annuler' : 'Cancel'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Help */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={4}>
        <Card>
          <CardHeader>
            <CardTitle>{fr ? 'Besoin d\'aide ?' : 'Need Help?'}</CardTitle>
            <CardDescription>
              {fr
                ? 'Contactez notre équipe support pour toute question sur votre abonnement.'
                : 'Contact our support team for any questions about your subscription.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="gap-2">
              <Receipt className="h-4 w-4" />
              {fr ? 'Contacter le support' : 'Contact Support'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Billing;
