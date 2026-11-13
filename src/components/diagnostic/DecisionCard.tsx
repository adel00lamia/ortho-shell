import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitCompareArrows, Info, Sparkles } from 'lucide-react';

const fmtMad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' MAD';

interface Props {
  /** Estimated cost of training the whole affected population (from entered data). */
  trainEveryoneCost?: number | null;
  /** Sum of the estimated costs of all recommended actions. */
  planCost: number;
  /** Sum of the estimated costs of the non-training actions only. */
  nonTrainingCost: number;
  costedActions: number;
  totalActions: number;
  trainingActions: number;
  headcount?: number | null;
  /** Headcount that a capability check confirmed as trainable, when verified. */
  verifiedTrainableHeadcount?: number | null;
  /** Share of the causes that are capability-related, 0-100. */
  capabilityShare?: number;
  language?: 'fr' | 'en';
}

export function DecisionCard({
  trainEveryoneCost,
  planCost,
  nonTrainingCost,
  costedActions,
  totalActions,
  trainingActions,
  headcount,
  verifiedTrainableHeadcount,
  capabilityShare = 0,
  language = 'fr',
}: Props) {
  const fr = language === 'fr';
  const everyone = Number(trainEveryoneCost ?? 0);
  const hasCosts = costedActions > 0;
  const hasEveryone = everyone > 0;

  const targeted = verifiedTrainableHeadcount ?? (headcount ? Math.round((headcount * capabilityShare) / 100) : null);

  const scenarios = [
    {
      key: 'A',
      title: fr ? 'Former toute la population' : 'Train the whole population',
      cost: hasEveryone ? fmtMad(everyone) : null,
      population: headcount ? `${headcount} ${fr ? 'personnes' : 'people'}` : null,
      impact: fr
        ? 'Traite uniquement la part « compétence » du problème ; les causes non-formation restent en place.'
        : 'Only addresses the capability share of the problem; non-training causes stay in place.',
      tone: 'border-border/60',
    },
    {
      key: 'B',
      title: fr ? 'Corriger seulement les causes non-formation' : 'Fix non-training causes only',
      cost: hasCosts && nonTrainingCost > 0 ? fmtMad(nonTrainingCost) : null,
      population: fr ? 'Managers, process, outils' : 'Managers, process, tools',
      impact: fr
        ? 'Rapide et peu coûteux, mais laisse un éventuel manque de savoir-faire non traité.'
        : 'Fast and cheap, but leaves any real know-how gap untreated.',
      tone: 'border-border/60',
    },
    {
      key: 'C',
      title: fr ? 'Intervention mixte recommandée par Qimatak' : 'Qimatak recommended mixed intervention',
      cost: hasCosts ? fmtMad(planCost) : null,
      population: targeted
        ? `${targeted} ${fr ? 'personnes ciblées' : 'targeted people'}${verifiedTrainableHeadcount != null ? fr ? ' (vérifié)' : ' (verified)' : ''}`
        : fr ? 'Population ciblée à préciser' : 'Targeted population to confirm',
      impact: fr
        ? `Agit sur les causes dominantes${trainingActions > 0 ? ' et forme uniquement la population concernée' : ' sans formation de masse'}.`
        : `Acts on the dominant causes${trainingActions > 0 ? ' and trains only the affected population' : ' without mass training'}.`,
      tone: 'border-primary/40 bg-primary/5',
    },
  ];

  const avoided = hasEveryone && hasCosts ? everyone - planCost : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GitCompareArrows className="h-4 w-4 text-primary" />
          {fr ? 'Comparer trois décisions' : 'Compare three decisions'}
        </CardTitle>
        <CardDescription>
          {fr
            ? 'Trois chemins possibles face au même problème. Aucun coût n’est inventé : les montants n’apparaissent que si vous avez saisi une hypothèse de coût, sinon « à chiffrer ».'
            : 'Three possible paths for the same problem. No cost is invented: amounts appear only if you entered a cost assumption, otherwise "to be costed".'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 lg:grid-cols-3">
          {scenarios.map((s) => (
            <div key={s.key} className={`rounded-lg border p-3 ${s.tone}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{s.key}</span>
                {s.key === 'C' && <Sparkles className="h-3.5 w-3.5 text-primary" />}
              </div>
              <p className="mt-1 text-sm font-semibold text-foreground">{s.title}</p>
              <p className="mt-2 text-lg font-extrabold tabular-nums text-foreground">
                {s.cost ?? (fr ? 'À chiffrer' : 'To be costed')}
              </p>
              {s.cost && (
                <Badge variant="secondary" className="mt-1 text-[10px]">{fr ? 'estimation' : 'estimate'}</Badge>
              )}
              {s.population && <p className="mt-2 text-xs text-muted-foreground">{s.population}</p>}
              <p className="mt-2 text-xs text-muted-foreground">{s.impact}</p>
            </div>
          ))}
        </div>

        {avoided !== null && avoided > 0 && (
          <div className="rounded-lg bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">{fr ? 'Dépense potentiellement évitée (A − C) : ' : 'Potentially avoided spend (A − C): '}</span>
            <strong className="text-emerald-600">{fmtMad(avoided)}</strong>
          </div>
        )}

        {!hasCosts && (
          <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
            {fr
              ? 'Aucune action chiffrée pour l’instant : renseignez les coûts des actions et le nombre de personnes concernées pour comparer les scénarios.'
              : 'No costed action yet: add action costs and the affected headcount to compare the scenarios.'}
          </div>
        )}

        <div className="space-y-1 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
          <p className="flex items-start gap-1.5">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            {fr ? 'Hypothèses :' : 'Assumptions:'}
          </p>
          <ul className="list-disc space-y-0.5 pl-6">
            <li>
              {fr
                ? `A = coût de formation estimé pour ${headcount ? `${headcount} personnes` : 'toute la population concernée'}, sur la base des données saisies.`
                : `A = estimated training cost for ${headcount ? `${headcount} people` : 'the whole affected population'}, based on the data you entered.`}
            </li>
            <li>
              {fr
                ? `B = somme des actions non-formation chiffrées. C = somme des ${costedActions}/${totalActions} actions chiffrées du plan.`
                : `B = sum of costed non-training actions. C = sum of the ${costedActions}/${totalActions} costed actions in the plan.`}
            </li>
            <li>
              {fr
                ? verifiedTrainableHeadcount != null
                  ? 'Population ciblée issue d’une vérification pratique des compétences.'
                  : 'Population ciblée estimée à partir du poids de la cause « compétence » — à confirmer par une vérification.'
                : verifiedTrainableHeadcount != null
                  ? 'Targeted population comes from a practical capability check.'
                  : 'Targeted population estimated from the weight of the capability cause — to be confirmed by a check.'}
            </li>
            <li>
              {fr
                ? 'Aucun retour sur investissement n’est promis : l’écart dépend de l’exécution réelle.'
                : 'No return on investment is promised: the gap depends on real execution.'}
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
