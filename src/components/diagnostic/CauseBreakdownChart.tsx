import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Minus, Plus, Quote } from 'lucide-react';
import {
  CAUSE_HINTS,
  CAUSE_KEYS,
  CAUSE_LABELS,
  type CauseBreakdown,
  type CauseEvidenceEntry,
  type CauseKey,
} from '@/lib/rootCauseModel';

export { CAUSE_LABELS };

const BAR_TONE: Record<CauseKey, string> = {
  skill: 'bg-primary',
  clarity: 'bg-rose-500',
  process: 'bg-amber-500',
  tools_data: 'bg-violet-500',
  management: 'bg-sky-500',
  incentives: 'bg-fuchsia-500',
  capacity_organization: 'bg-emerald-500',
};

const STRENGTH_LABEL: Record<'fr' | 'en', Record<string, string>> = {
  fr: { weak: 'Preuve faible', moderate: 'Preuve modérée', strong: 'Preuve solide' },
  en: { weak: 'Weak evidence', moderate: 'Moderate evidence', strong: 'Strong evidence' },
};

export function CauseBreakdownChart({
  breakdown,
  causeEvidence = [],
  language = 'fr',
}: {
  breakdown: CauseBreakdown;
  causeEvidence?: CauseEvidenceEntry[];
  language?: 'fr' | 'en';
}) {
  const fr = language === 'fr';
  const [open, setOpen] = useState<CauseKey | null>(null);

  const rows = CAUSE_KEYS.map((key) => ({
    key,
    value: Number(breakdown?.[key] ?? 0),
    evidence: causeEvidence.find((e) => e.cause === key),
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-3">
      {rows.map((row, i) => {
        const expandable = !!row.evidence && (row.evidence.supporting.length > 0 || row.evidence.contradicting.length > 0);
        const isOpen = open === row.key;
        return (
          <div key={row.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium text-foreground">{CAUSE_LABELS[language][row.key]}</span>
                {row.value === 0 && (
                  <span className="hidden text-[11px] text-muted-foreground sm:inline">
                    {CAUSE_HINTS[language][row.key]}
                  </span>
                )}
              </span>
              <span className="tabular-nums text-muted-foreground">≈ {row.value}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className={`h-full rounded-full ${BAR_TONE[row.key]}`}
                initial={{ width: 0 }}
                animate={{ width: `${row.value}%` }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
              />
            </div>

            {expandable && (
              <div>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : row.key)}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  aria-expanded={isOpen}
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  {fr ? 'Pourquoi Qimatak pense cela ?' : 'Why Qimatak thinks this'}
                </button>

                {isOpen && row.evidence && (
                  <div className="mt-2 space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {STRENGTH_LABEL[language][row.evidence.strength]} · {row.evidence.confidence}%
                    </p>
                    {row.evidence.supporting.length > 0 && (
                      <ul className="space-y-1">
                        {row.evidence.supporting.map((s, idx) => (
                          <li key={`s-${idx}`} className="flex gap-1.5 text-foreground">
                            <Plus className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {row.evidence.contradicting.length > 0 && (
                      <ul className="space-y-1">
                        {row.evidence.contradicting.map((s, idx) => (
                          <li key={`c-${idx}`} className="flex gap-1.5 text-muted-foreground">
                            <Minus className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="flex items-start gap-1.5 border-t border-border/60 pt-2 text-[11px] italic text-muted-foreground">
                      <Quote className="mt-0.5 h-3 w-3 shrink-0" />
                      {fr
                        ? 'Basé uniquement sur les éléments fournis dans ce dossier.'
                        : 'Based only on the material supplied in this case.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
