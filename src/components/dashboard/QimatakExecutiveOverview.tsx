import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity, ArrowRight, ClipboardList, Coins, MessageSquareQuote, Search, Target, TrendingUp, Wallet,
} from 'lucide-react';
import { useQimatakOverview } from '@/hooks/useQimatakOverview';

/**
 * Qimatak outcome dashboard for admin / HR: diagnosis, evidence, actions and
 * measured impact. Every number comes from the company's own records — empty
 * states are shown instead of illustrative figures.
 */
export function QimatakExecutiveOverview({ fr }: { fr: boolean }) {
  const navigate = useNavigate();
  const { data, isLoading } = useQimatakOverview();

  const metrics = [
    {
      label: fr ? 'Diagnostics en cours' : 'Active diagnostics',
      value: data?.diagnostics_active ?? 0,
      icon: Search,
      hint: fr
        ? `${data?.diagnostics_total ?? 0} au total`
        : `${data?.diagnostics_total ?? 0} in total`,
    },
    {
      label: fr ? 'Formation justifiée' : 'Training justified',
      value: data?.training_primary ?? 0,
      icon: Target,
      hint: fr
        ? `${data?.training_not_primary ?? 0} cas où la formation n’est pas la réponse`
        : `${data?.training_not_primary ?? 0} cases where training is not the answer`,
    },
    {
      label: fr ? 'Problèmes à fort impact' : 'High-impact problems',
      value: data?.high_impact_open ?? 0,
      icon: Activity,
      hint: fr ? 'ouverts, 10 personnes ou plus' : 'open, 10 people or more',
    },
    {
      label: fr ? 'Preuves collectées' : 'Evidence collected',
      value: data?.pulse_responses ?? 0,
      icon: MessageSquareQuote,
      hint: fr ? `${data?.pulses ?? 0} collecte(s) lancée(s)` : `${data?.pulses ?? 0} collection(s) launched`,
    },
    {
      label: fr ? 'Actions en cours' : 'Actions in progress',
      value: data?.actions_in_progress ?? 0,
      icon: ClipboardList,
      hint: fr ? `${data?.actions_done ?? 0} terminée(s)` : `${data?.actions_done ?? 0} completed`,
    },
    {
      label: fr ? 'Indicateurs en amélioration' : 'Indicators improving',
      value: data?.kpis_improving ?? 0,
      icon: TrendingUp,
      hint: fr
        ? `${data?.kpis_flat ?? 0} stable(s) · ${data?.kpis_worsening ?? 0} en dégradation`
        : `${data?.kpis_flat ?? 0} stable · ${data?.kpis_worsening ?? 0} worsening`,
    },
  ];

  const actions = [
    { title: fr ? 'Diagnostiquer un problème' : 'Diagnose a problem', icon: Search, path: '/workflow/assess/root-cause' },
    { title: fr ? 'Collecter des preuves' : 'Collect evidence', icon: MessageSquareQuote, path: '/workflow/assess/root-cause' },
    { title: fr ? 'Revoir les plans d’action' : 'Review action plans', icon: ClipboardList, path: '/workflow/plan/plans' },
    { title: fr ? 'Mesurer l’impact' : 'Measure impact', icon: TrendingUp, path: '/workflow/assess/root-cause' },
    { title: fr ? 'Vérifier le financement' : 'Check funding', icon: Wallet, path: '/workflow/track/reimbursement' },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
      </div>
    );
  }

  const nothingYet = (data?.diagnostics_total ?? 0) === 0;

  return (
    <div className="space-y-4">
      {nothingYet && (
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5 p-6">
          <h3 className="font-semibold text-foreground">
            {fr ? 'Commencez par un problème réel' : 'Start from a real problem'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {fr
              ? 'Aucun diagnostic enregistré pour l’instant. Décrivez un problème de performance : Qimatak identifie ce qui bloque avant de proposer une formation.'
              : 'No diagnostic recorded yet. Describe a performance problem: Qimatak identifies what is blocking before proposing training.'}
          </p>
          <Button className="mt-3" onClick={() => navigate('/workflow/assess/root-cause')}>
            {fr ? 'Diagnostiquer un problème' : 'Diagnose a problem'} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{m.label}</p>
                    <p className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans' }}>{m.value}</p>
                    <p className="text-xs text-muted-foreground">{m.hint}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">
            {fr ? 'Dépense de formation évitée' : 'Avoided training spend'}
          </p>
          <Badge variant="outline">{fr ? 'estimation' : 'estimate'}</Badge>
        </div>
        <p className="mt-2 text-2xl font-bold text-foreground">
          {data?.avoided_spend_grounded
            ? `${Math.round(data.avoided_spend_mad).toLocaleString(fr ? 'fr-MA' : 'en-US')} MAD`
            : fr ? 'À chiffrer' : 'To be costed'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {data?.avoided_spend_grounded
            ? fr
              ? 'Calculé uniquement à partir des hypothèses de coût que vous avez saisies dans vos diagnostics.'
              : 'Computed only from the cost assumptions you entered in your diagnostics.'
            : fr
              ? 'Renseignez une hypothèse de coût de formation dans un diagnostic pour obtenir ce montant.'
              : 'Enter a training cost assumption in a diagnostic to get this amount.'}
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Button key={a.title} variant="outline" className="h-auto justify-start gap-2 py-3 text-left" onClick={() => navigate(a.path)}>
              <Icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-xs font-medium leading-tight">{a.title}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
