import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitCompareArrows, Info } from 'lucide-react';

const fmtMad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' MAD';

interface Props {
  /** Estimated cost of training the whole affected population. */
  trainEveryoneCost?: number | null;
  /** Sum of the estimated costs of the recommended Qimatak actions. */
  qimatakPlanCost?: number | null;
  /** How many recommended actions carry a cost estimate. */
  costedActions: number;
  totalActions: number;
  headcount?: number | null;
  language?: 'fr' | 'en';
}

export function DecisionCard({
  trainEveryoneCost,
  qimatakPlanCost,
  costedActions,
  totalActions,
  headcount,
  language = 'fr',
}: Props) {
  const fr = language === 'fr';
  const everyone = Number(trainEveryoneCost ?? 0);
  const plan = Number(qimatakPlanCost ?? 0);
  const computable = everyone > 0 && costedActions > 0;
  const diff = everyone - plan;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GitCompareArrows className="h-4 w-4 text-primary" />
          {fr ? 'Comparer les deux décisions' : 'Compare the two decisions'}
        </CardTitle>
        <CardDescription>
          {fr
            ? 'Deux chemins possibles face au même problème. Montants estimés, jamais garantis.'
            : 'Two possible paths for the same problem. Estimated amounts, never guaranteed.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!computable ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              {fr ? 'Estimation indisponible — données manquantes' : 'Estimate unavailable — missing data'}
            </p>
            <p className="mt-1 text-xs">
              {fr
                ? 'Renseignez le nombre de personnes concernées et les coûts des actions pour comparer les deux scénarios.'
                : 'Add the affected headcount and the action costs to compare both scenarios.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">A</p>
                <p className="text-sm font-semibold text-foreground">
                  {fr ? 'Former toute la population' : 'Train the whole population'}
                </p>
                <p className="mt-1 text-lg font-extrabold tabular-nums text-foreground">{fmtMad(everyone)}</p>
                <Badge variant="secondary" className="mt-1 text-[10px]">{fr ? 'estimation' : 'estimate'}</Badge>
              </div>
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                <p className="text-xs uppercase tracking-wide text-primary">B</p>
                <p className="text-sm font-semibold text-foreground">{fr ? 'Plan Qimatak' : 'Qimatak plan'}</p>
                <p className="mt-1 text-lg font-extrabold tabular-nums text-foreground">{fmtMad(plan)}</p>
                <Badge variant="secondary" className="mt-1 text-[10px]">{fr ? 'estimation' : 'estimate'}</Badge>
              </div>
            </div>

            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              <span className="text-muted-foreground">
                {fr ? 'Écart estimé (A − B) : ' : 'Estimated difference (A − B): '}
              </span>
              <strong className={diff >= 0 ? 'text-emerald-600' : 'text-amber-600'}>
                {fmtMad(Math.abs(diff))}
              </strong>
              <span className="text-muted-foreground">
                {diff >= 0
                  ? fr ? ' de dépense potentiellement évitée' : ' of potentially avoided spend'
                  : fr ? ' de dépense supplémentaire' : ' of additional spend'}
              </span>
            </div>
          </>
        )}

        <div className="space-y-1 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
          <p className="flex items-start gap-1.5">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            {fr ? 'Hypothèses de calcul :' : 'Calculation assumptions:'}
          </p>
          <ul className="list-disc space-y-0.5 pl-6">
            <li>
              {fr
                ? `A = coût de formation estimé pour ${headcount ? `${headcount} personnes` : 'toute la population concernée'} (référence ~40 MAD/heure/personne, ~14 h).`
                : `A = estimated training cost for ${headcount ? `${headcount} people` : 'the whole affected population'} (~40 MAD/hour/person, ~14 h).`}
            </li>
            <li>
              {fr
                ? `B = somme des coûts estimés des actions recommandées (${costedActions}/${totalActions} actions chiffrées).`
                : `B = sum of the estimated costs of the recommended actions (${costedActions}/${totalActions} actions costed).`}
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
