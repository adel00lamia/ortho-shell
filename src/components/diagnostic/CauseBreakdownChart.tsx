import { motion } from 'framer-motion';
import { CAUSE_KEYS, type CauseBreakdown, type CauseKey } from '@/hooks/useRootCauseDiagnostics';

export const CAUSE_LABELS: Record<'fr' | 'en', Record<CauseKey, string>> = {
  fr: {
    skill: 'Compétence',
    process: 'Processus',
    management: 'Management',
    tools: 'Outils',
    organization: 'Organisation',
  },
  en: {
    skill: 'Skills',
    process: 'Process',
    management: 'Management',
    tools: 'Tools',
    organization: 'Organisation',
  },
};

const BAR_TONE: Record<CauseKey, string> = {
  skill: 'bg-primary',
  process: 'bg-amber-500',
  management: 'bg-sky-500',
  tools: 'bg-violet-500',
  organization: 'bg-emerald-500',
};

export function CauseBreakdownChart({
  breakdown,
  language = 'fr',
}: {
  breakdown: CauseBreakdown;
  language?: 'fr' | 'en';
}) {
  const rows = CAUSE_KEYS.map((key) => ({ key, value: Number(breakdown?.[key] ?? 0) })).sort(
    (a, b) => b.value - a.value
  );

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={row.key} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{CAUSE_LABELS[language][row.key]}</span>
            <span className="tabular-nums text-muted-foreground">{row.value}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className={`h-full rounded-full ${BAR_TONE[row.key]}`}
              initial={{ width: 0 }}
              animate={{ width: `${row.value}%` }}
              transition={{ duration: 0.6, delay: i * 0.07, ease: 'easeOut' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
