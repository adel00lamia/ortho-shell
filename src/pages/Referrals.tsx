import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Users, TrendingUp, CheckCircle2, Clock, Share2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useMyReferrals, useGenerateReferralCode } from '@/hooks/useReferrals';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.04 },
  }),
};

export default function Referrals() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { data: referrals, isLoading } = useMyReferrals();
  const generateCode = useGenerateReferralCode();
  const [copiedField, setCopiedField] = useState<'code' | 'link' | null>(null);

  const fr = language === 'fr';

  if (isLoading) return <DashboardSkeleton />;

  const referralList = referrals ?? [];
  const activeCode = referralList.find((r) => r.status === 'pending')?.referral_code;
  const referralLink = activeCode
    ? `${window.location.origin}/auth?ref=${activeCode}`
    : '';

  const totalReferrals = referralList.length;
  const converted = referralList.filter((r) => r.status === 'converted').length;
  const pending = referralList.filter((r) => r.status === 'pending').length;
  const rewardsEarned = referralList
    .filter((r) => r.status === 'converted' && r.reward_value)
    .reduce((sum, r) => sum + (r.reward_value ?? 0), 0);

  const stats = [
    {
      label: fr ? 'Total parrainages' : 'Total Referrals',
      value: totalReferrals,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: fr ? 'Convertis' : 'Converted',
      value: converted,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: fr ? 'En attente' : 'Pending',
      value: pending,
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: fr ? 'Récompenses gagnées' : 'Rewards Earned',
      value: `${rewardsEarned.toLocaleString()} MAD`,
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
    },
  ];

  const handleGenerateCode = () => {
    generateCode.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: fr ? 'Code généré' : 'Code Generated',
          description: fr
            ? 'Votre nouveau code de parrainage est prêt.'
            : 'Your new referral code is ready.',
        });
      },
      onError: () => {
        toast({
          title: fr ? 'Erreur' : 'Error',
          description: fr
            ? 'Impossible de générer le code.'
            : 'Could not generate the code.',
          variant: 'destructive',
        });
      },
    });
  };

  const copyToClipboard = (text: string, field: 'code' | 'link') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast({
        title: fr ? 'Copié !' : 'Copied!',
        description: fr ? 'Copié dans le presse-papiers.' : 'Copied to clipboard.',
      });
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'converted':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-0">
            {fr ? 'Converti' : 'Converted'}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0">
            {fr ? 'En attente' : 'Pending'}
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-0">
            {fr ? 'Expiré' : 'Expired'}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        custom={0}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <Gift className="inline-block mr-2 h-6 w-6 text-primary" />
            {fr ? 'Programme de parrainage' : 'Referral Program'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {fr
              ? 'Invitez des entreprises et gagnez des récompenses.'
              : 'Invite companies and earn rewards.'}
          </p>
        </div>
        <Button onClick={handleGenerateCode} disabled={generateCode.isPending}>
          {generateCode.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Gift className="mr-2 h-4 w-4" />
          )}
          {fr ? 'Générer un code' : 'Generate Code'}
        </Button>
      </motion.div>

      {/* Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} variants={fadeIn} initial="hidden" animate="visible" custom={i + 1}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`rounded-lg p-2.5 ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p
                    className="text-xl font-bold"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Referral Code & Share */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Code Display */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={5}>
          <Card>
            <CardHeader>
              <CardTitle
                className="text-lg"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {fr ? 'Votre code de parrainage' : 'Your Referral Code'}
              </CardTitle>
              <CardDescription>
                {fr
                  ? 'Partagez ce code avec vos contacts.'
                  : 'Share this code with your contacts.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeCode ? (
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={activeCode}
                    className="font-mono text-lg tracking-wider"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(activeCode, 'code')}
                  >
                    {copiedField === 'code' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {fr
                    ? 'Aucun code actif. Cliquez sur "Générer un code" pour en créer un.'
                    : 'No active code. Click "Generate Code" to create one.'}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Share Section */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={6}>
          <Card>
            <CardHeader>
              <CardTitle
                className="text-lg"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Share2 className="inline-block mr-2 h-5 w-5" />
                {fr ? 'Partager' : 'Share'}
              </CardTitle>
              <CardDescription>
                {fr
                  ? 'Envoyez ce lien pour inviter de nouveaux utilisateurs.'
                  : 'Send this link to invite new users.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referralLink ? (
                <div className="flex items-center gap-2">
                  <Input readOnly value={referralLink} className="text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(referralLink, 'link')}
                  >
                    {copiedField === 'link' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {fr
                    ? 'Générez un code pour obtenir votre lien de parrainage.'
                    : 'Generate a code to get your referral link.'}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Referral History Table */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={7}>
        <Card>
          <CardHeader>
            <CardTitle
              className="text-lg"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {fr ? 'Historique des parrainages' : 'Referral History'}
            </CardTitle>
            <CardDescription>
              {fr
                ? 'Suivez tous vos parrainages et récompenses.'
                : 'Track all your referrals and rewards.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referralList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground">
                  {fr
                    ? 'Aucun parrainage pour le moment.'
                    : 'No referrals yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Code</th>
                      <th className="pb-3 pr-4 font-medium">
                        {fr ? 'Statut' : 'Status'}
                      </th>
                      <th className="pb-3 pr-4 font-medium">
                        {fr ? 'Utilisateur référé' : 'Referred User'}
                      </th>
                      <th className="pb-3 pr-4 font-medium">
                        {fr ? 'Récompense' : 'Reward'}
                      </th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralList.map((referral) => (
                      <tr
                        key={referral.id}
                        className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 pr-4 font-mono text-xs">
                          {referral.referral_code}
                        </td>
                        <td className="py-3 pr-4">{statusBadge(referral.status)}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {referral.referred_user_id
                            ? referral.referred_user_id.slice(0, 8) + '...'
                            : '—'}
                        </td>
                        <td className="py-3 pr-4">
                          {referral.reward_value
                            ? `${referral.reward_value.toLocaleString()} MAD`
                            : '—'}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {new Date(referral.created_at).toLocaleDateString(
                            fr ? 'fr-FR' : 'en-US',
                            { year: 'numeric', month: 'short', day: 'numeric' }
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
