import { AlertTriangle } from 'lucide-react';
import { FUNDING_DISCLAIMER, REFERENCE_RULES, type FundingRules } from '@/lib/ofpptFinancials';

/**
 * Every funding amount in Qimatak is an estimate built on configurable rule
 * inputs. This banner states that explicitly, and flags when the rules used are
 * unverified reference assumptions rather than a verified rule record.
 */
export function FundingRulesDisclaimer({
  fr,
  rules = REFERENCE_RULES,
  className = '',
}: {
  fr: boolean;
  rules?: FundingRules;
  className?: string;
}) {
  return (
    <div
      role="note"
      className={`flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 ${className}`}
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-semibold">
          {rules.verified
            ? fr ? 'Calcul basé sur des règles configurées' : 'Calculation based on configured rules'
            : fr ? 'Hypothèses de référence — à vérifier' : 'Reference assumptions — to verify'}
        </p>
        <p>{fr ? FUNDING_DISCLAIMER.fr : FUNDING_DISCLAIMER.en}</p>
        <p className="opacity-80">
          {fr ? 'Source des paramètres : ' : 'Parameter source: '}
          {rules.source} · {rules.version}
        </p>
      </div>
    </div>
  );
}
