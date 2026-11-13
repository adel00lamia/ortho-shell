import { ArrowDown, ArrowUp, Info } from 'lucide-react';
import type { TrainingFitFactor } from '@/lib/rootCauseModel';

export function TrainingFitExplanation({
  factors,
  language = 'fr',
}: {
  factors: TrainingFitFactor[];
  language?: 'fr' | 'en';
}) {
  const fr = language === 'fr';
  if (!factors || factors.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        {fr
          ? 'Détail du calcul indisponible pour ce diagnostic.'
          : 'Score breakdown not available for this diagnostic.'}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-foreground">
        {fr ? 'Ce qui a fait monter ou baisser le score' : 'What raised or lowered the score'}
      </p>
      <ul className="space-y-1.5">
        {factors.map((f) => (
          <li key={f.key} className="flex items-start gap-2 text-xs">
            {f.direction === 'up' ? (
              <ArrowUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            ) : (
              <ArrowDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            )}
            <span className="text-muted-foreground">{fr ? f.fr : f.en}</span>
          </li>
        ))}
      </ul>
      <p className="flex items-start gap-1.5 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        {fr
          ? 'Méthode : Qimatak Training Fit Score — version pilote. Pondérations documentées, calculées côté serveur, non validées scientifiquement.'
          : 'Method: Qimatak Training Fit Score — pilot version. Documented weights, computed server-side, not scientifically validated.'}
      </p>
    </div>
  );
}
