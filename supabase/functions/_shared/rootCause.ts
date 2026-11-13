// Qimatak root-cause model — single source of truth shared by the edge function
// (Deno) and the web app (Vite). Pure TypeScript, no runtime-specific APIs.

/** The 7 explicit causes. `skill` and `process`/`management` keep their historical
 * DB keys for backward compatibility; `tools_data` and `capacity_organization`
 * supersede the old `tools` / `organization` keys. */
export const CAUSE_KEYS = [
  'skill',
  'clarity',
  'process',
  'tools_data',
  'management',
  'incentives',
  'capacity_organization',
] as const;

export type CauseKey = typeof CAUSE_KEYS[number];
export type CauseBreakdown = Partial<Record<CauseKey, number>>;

/** Old keys → new keys, so historical diagnostics still render. */
export const LEGACY_CAUSE_MAP: Record<string, CauseKey> = {
  skill: 'skill',
  capability: 'skill',
  competence: 'skill',
  clarity: 'clarity',
  process: 'process',
  tools: 'tools_data',
  tools_data: 'tools_data',
  data: 'tools_data',
  management: 'management',
  incentives: 'incentives',
  incentive: 'incentives',
  organization: 'capacity_organization',
  organisation: 'capacity_organization',
  capacity: 'capacity_organization',
  capacity_organization: 'capacity_organization',
};

export const CAUSE_LABELS: Record<'fr' | 'en', Record<CauseKey, string>> = {
  fr: {
    skill: 'Compétence',
    clarity: 'Clarté des attentes',
    process: 'Processus',
    tools_data: 'Outils & données',
    management: 'Management',
    incentives: 'Incitations & KPI',
    capacity_organization: 'Capacité & organisation',
  },
  en: {
    skill: 'Capability',
    clarity: 'Clarity of expectations',
    process: 'Process',
    tools_data: 'Tools & data',
    management: 'Management',
    incentives: 'Incentives & KPIs',
    capacity_organization: 'Capacity & organisation',
  },
};

export const CAUSE_HINTS: Record<'fr' | 'en', Record<CauseKey, string>> = {
  fr: {
    skill: 'Les personnes ne savent pas encore faire.',
    clarity: 'Attentes, rôles ou standards flous.',
    process: 'Le processus lui-même produit l’erreur.',
    tools_data: 'Outils, systèmes ou informations manquants.',
    management: 'Pilotage, feedback ou suivi insuffisants.',
    incentives: 'KPI, reconnaissance ou conséquences mal alignés.',
    capacity_organization: 'Effectifs, charge, temps, structure ou moyens.',
  },
  en: {
    skill: 'People do not know how to do it yet.',
    clarity: 'Expectations, roles or standards are unclear.',
    process: 'The process itself produces the error.',
    tools_data: 'Missing tools, systems or information.',
    management: 'Weak steering, feedback or follow-up.',
    incentives: 'KPIs, recognition or consequences are misaligned.',
    capacity_organization: 'Staffing, workload, time, structure or resources.',
  },
};

/**
 * Maps any historical or partial breakdown onto the 7-cause model and
 * renormalises to 100. Never throws: unknown keys are ignored, an empty or
 * unusable input falls back to an even spread.
 */
export function normalizeCauseBreakdown(raw: unknown): Record<CauseKey, number> {
  const out = Object.fromEntries(CAUSE_KEYS.map((k) => [k, 0])) as Record<CauseKey, number>;
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  let total = 0;
  for (const [key, value] of Object.entries(source)) {
    const target = LEGACY_CAUSE_MAP[String(key).toLowerCase().trim()];
    if (!target) continue;
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) continue;
    out[target] += n;
    total += n;
  }

  if (total <= 0) {
    const even = Math.round(100 / CAUSE_KEYS.length);
    for (const k of CAUSE_KEYS) out[k] = even;
    out.skill = 100 - even * (CAUSE_KEYS.length - 1);
    return out;
  }

  if (Math.abs(total - 100) > 0.5) {
    for (const k of CAUSE_KEYS) out[k] = Math.round((out[k] / total) * 100);
  } else {
    for (const k of CAUSE_KEYS) out[k] = Math.round(out[k]);
  }

  // Absorb rounding drift into the largest cause so the chart always sums to 100.
  const drift = 100 - CAUSE_KEYS.reduce((s, k) => s + out[k], 0);
  if (drift !== 0) {
    const largest = CAUSE_KEYS.reduce((a, b) => (out[b] > out[a] ? b : a), CAUSE_KEYS[0]);
    out[largest] = Math.max(0, out[largest] + drift);
  }
  return out;
}

export type EvidenceStrength = 'weak' | 'moderate' | 'strong';

export interface CauseEvidenceEntry {
  cause: CauseKey;
  supporting: string[];
  contradicting: string[];
  strength: EvidenceStrength;
  confidence: number;
}

/** Keeps only evidence that maps onto a known cause; clamps strings and confidence. */
export function normalizeCauseEvidence(raw: unknown): CauseEvidenceEntry[] {
  if (!Array.isArray(raw)) return [];
  const list: CauseEvidenceEntry[] = [];
  const seen = new Set<CauseKey>();

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const cause = LEGACY_CAUSE_MAP[String(row.cause ?? '').toLowerCase().trim()];
    if (!cause || seen.has(cause)) continue;
    seen.add(cause);

    const strings = (v: unknown) =>
      (Array.isArray(v) ? v : [])
        .map((s) => String(s ?? '').trim())
        .filter((s) => s.length > 0)
        .slice(0, 5)
        .map((s) => s.slice(0, 400));

    const strengthRaw = String(row.strength ?? '').toLowerCase();
    const strength: EvidenceStrength =
      strengthRaw === 'strong' ? 'strong' : strengthRaw === 'weak' ? 'weak' : 'moderate';

    const conf = Number(row.confidence);
    list.push({
      cause,
      supporting: strings(row.supporting ?? row.supporting_evidence),
      contradicting: strings(row.contradicting ?? row.contradictory_evidence),
      strength,
      confidence: Number.isFinite(conf) ? Math.min(100, Math.max(0, Math.round(conf))) : 50,
    });
  }
  return list;
}

// ---------------------------------------------------------------------------
// Training Fit Score — version pilote
// ---------------------------------------------------------------------------

export interface TrainingFitSignals {
  /** Estimated share of the problem attributable to capability (0-100). */
  capability_share: number;
  /** Evidence that a real, demonstrated skill gap exists (0-100). */
  demonstrated_skill_gap?: number | null;
  /** Strongest non-capability barrier (0-100). Derived from the breakdown when absent. */
  barrier_load?: number | null;
  /** Do some people succeed under the same conditions? */
  high_performers_succeed?: boolean | null;
  /** Are standards, tools and resources actually available today? */
  standards_and_tools_available?: boolean | null;
}

export interface TrainingFitFactor {
  key: string;
  direction: 'up' | 'down';
  weight: number;
  fr: string;
  en: string;
}

export interface TrainingFitResult {
  score: number;
  factors: TrainingFitFactor[];
  signals: TrainingFitSignals & { barrier_load: number; demonstrated_skill_gap: number };
}

/** Documented weights — the LLM proposes signals, this code decides the score. */
export const TRAINING_FIT_WEIGHTS = {
  capability_share: 0.5,
  demonstrated_skill_gap: 0.3,
  low_barriers: 0.2,
  high_performers_succeed: 8,
  standards_and_tools_available: 6,
  standards_and_tools_missing: -10,
} as const;

const clamp100 = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

export function computeTrainingFit(
  signals: TrainingFitSignals,
  breakdown?: CauseBreakdown
): TrainingFitResult {
  const cb = normalizeCauseBreakdown(breakdown ?? {});
  const capability = clamp100(Number(signals.capability_share ?? cb.skill) || 0);

  const derivedBarrier = Math.max(
    ...CAUSE_KEYS.filter((k) => k !== 'skill').map((k) => cb[k] ?? 0),
    0
  );
  const barrier = clamp100(
    Number.isFinite(Number(signals.barrier_load)) && signals.barrier_load !== null
      ? Number(signals.barrier_load)
      : derivedBarrier * 2 // a single 35% barrier is already a strong blocker
  );

  const gap = clamp100(
    Number.isFinite(Number(signals.demonstrated_skill_gap)) && signals.demonstrated_skill_gap !== null
      ? Number(signals.demonstrated_skill_gap)
      : capability
  );

  const factors: TrainingFitFactor[] = [];
  let score =
    TRAINING_FIT_WEIGHTS.capability_share * capability +
    TRAINING_FIT_WEIGHTS.demonstrated_skill_gap * gap +
    TRAINING_FIT_WEIGHTS.low_barriers * (100 - barrier);

  factors.push({
    key: 'capability_share',
    direction: capability >= 40 ? 'up' : 'down',
    weight: TRAINING_FIT_WEIGHTS.capability_share,
    fr: `Part estimée de la compétence dans le problème : ${capability}%`,
    en: `Estimated capability share of the problem: ${capability}%`,
  });
  factors.push({
    key: 'demonstrated_skill_gap',
    direction: gap >= 50 ? 'up' : 'down',
    weight: TRAINING_FIT_WEIGHTS.demonstrated_skill_gap,
    fr: `Écart de compétence réellement démontré : ${gap}/100`,
    en: `Demonstrated skill gap: ${gap}/100`,
  });
  factors.push({
    key: 'barrier_load',
    direction: barrier >= 50 ? 'down' : 'up',
    weight: TRAINING_FIT_WEIGHTS.low_barriers,
    fr: `Barrières non liées à la compétence (clarté, processus, outils, management, incitations, capacité) : ${barrier}/100`,
    en: `Non-capability barriers (clarity, process, tools, management, incentives, capacity): ${barrier}/100`,
  });

  if (signals.high_performers_succeed === true) {
    score += TRAINING_FIT_WEIGHTS.high_performers_succeed;
    factors.push({
      key: 'high_performers_succeed',
      direction: 'up',
      weight: TRAINING_FIT_WEIGHTS.high_performers_succeed,
      fr: 'Certaines personnes réussissent dans les mêmes conditions',
      en: 'Some people succeed under the same conditions',
    });
  } else if (signals.high_performers_succeed === false) {
    score -= TRAINING_FIT_WEIGHTS.high_performers_succeed;
    factors.push({
      key: 'high_performers_succeed',
      direction: 'down',
      weight: TRAINING_FIT_WEIGHTS.high_performers_succeed,
      fr: 'Personne ne réussit dans ces conditions : le contexte est en cause',
      en: 'Nobody succeeds under these conditions: the context is at fault',
    });
  }

  if (signals.standards_and_tools_available === true) {
    score += TRAINING_FIT_WEIGHTS.standards_and_tools_available;
    factors.push({
      key: 'standards_and_tools_available',
      direction: 'up',
      weight: TRAINING_FIT_WEIGHTS.standards_and_tools_available,
      fr: 'Standards, outils et moyens sont disponibles',
      en: 'Standards, tools and resources are available',
    });
  } else if (signals.standards_and_tools_available === false) {
    score += TRAINING_FIT_WEIGHTS.standards_and_tools_missing;
    factors.push({
      key: 'standards_and_tools_available',
      direction: 'down',
      weight: Math.abs(TRAINING_FIT_WEIGHTS.standards_and_tools_missing),
      fr: 'Standards, outils ou moyens manquants : former ne suffira pas',
      en: 'Standards, tools or resources are missing: training alone will not fix it',
    });
  }

  return {
    score: clamp100(score),
    factors: factors.slice(0, 5),
    signals: {
      ...signals,
      capability_share: capability,
      barrier_load: barrier,
      demonstrated_skill_gap: gap,
    },
  };
}

// ---------------------------------------------------------------------------
// Evidence completeness → confidence (never the score itself)
// ---------------------------------------------------------------------------

export interface EvidenceInput {
  problem_description?: string;
  symptoms?: string[];
  business_kpis?: unknown[];
  evidence_sources?: Record<string, number>;
  pulse_responses?: number;
}

/** 0-100 measure of how much material the diagnosis could actually rely on. */
export function evidenceCompleteness(input: EvidenceInput): number {
  let score = 0;
  const desc = (input.problem_description ?? '').trim().length;
  score += Math.min(20, Math.round(desc / 25));
  score += Math.min(10, (input.symptoms?.length ?? 0) * 3);
  score += Math.min(15, (input.business_kpis?.length ?? 0) * 7);

  const src = input.evidence_sources ?? {};
  const counted = ['conversations', 'documents', 'interviews', 'indicators'].reduce(
    (sum, key) => sum + (Number(src[key]) > 0 ? 1 : 0),
    0
  );
  score += counted * 8; // up to 32
  score += Math.min(23, Math.round((input.pulse_responses ?? 0) * 2.5));
  return clamp100(score);
}

/** Low evidence caps confidence — it must not silently move the fit score. */
export function computeConfidence(proposed: unknown, completeness: number): number {
  const cap = 45 + Math.round(completeness * 0.5); // 45 → 95
  const p = Number(proposed);
  const base = Number.isFinite(p) ? clamp100(p) : 60;
  return Math.min(base, cap);
}
