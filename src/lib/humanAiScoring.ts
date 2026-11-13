// Deterministic Human + AI task analysis. Each criterion is rated 1–5.
export type Criteria = {
  repetitiveness: number; data_availability: number; rules_clarity: number; complexity: number;
  human_interaction: number; judgment: number; compliance_risk: number; strategic_importance: number;
  frequency: number;
};
export const CRITERIA_KEYS: (keyof Criteria)[] = [
  'repetitiveness', 'data_availability', 'rules_clarity', 'complexity', 'human_interaction',
  'judgment', 'compliance_risk', 'strategic_importance', 'frequency',
];
export const CRITERIA_LABELS: Record<keyof Criteria, { fr: string; en: string }> = {
  repetitiveness: { fr: 'Répétitivité', en: 'Repetitiveness' },
  data_availability: { fr: 'Données disponibles', en: 'Data availability' },
  rules_clarity: { fr: 'Clarté des règles', en: 'Rules clarity' },
  complexity: { fr: 'Complexité', en: 'Complexity' },
  human_interaction: { fr: 'Interaction humaine', en: 'Human interaction' },
  judgment: { fr: 'Jugement requis', en: 'Judgment required' },
  compliance_risk: { fr: 'Risque conformité', en: 'Compliance risk' },
  strategic_importance: { fr: 'Importance stratégique', en: 'Strategic importance' },
  frequency: { fr: 'Fréquence', en: 'Frequency' },
};
export const DEFAULT_CRITERIA: Criteria = Object.fromEntries(CRITERIA_KEYS.map((k) => [k, 3])) as Criteria;

export type OperatingMode = 'human_only' | 'human_ai' | 'ai_approval' | 'ai_autonomous' | 'automation';
export const MODE_LABELS: Record<OperatingMode, { fr: string; en: string }> = {
  human_only: { fr: 'Humain seul', en: 'Human only' },
  human_ai: { fr: 'Humain + IA', en: 'Human + AI' },
  ai_approval: { fr: 'IA + validation humaine', en: 'AI + human approval' },
  ai_autonomous: { fr: 'IA autonome', en: 'AI autonomous' },
  automation: { fr: 'Automatisation du processus', en: 'Process automation' },
};

const n = (v: unknown) => Math.min(5, Math.max(1, Number(v) || 3));
export function normalizeCriteria(raw: unknown): Criteria {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return Object.fromEntries(CRITERIA_KEYS.map((k) => [k, n(o[k])])) as Criteria;
}

export function analyseTask(raw: unknown, hoursPerWeek = 0) {
  const c = normalizeCriteria(raw);
  const s = (v: number) => (v - 1) / 4; // 0..1
  const pro = 0.3 * s(c.repetitiveness) + 0.25 * s(c.data_availability) + 0.25 * s(c.rules_clarity) + 0.2 * s(c.frequency);
  const con = 0.3 * s(c.judgment) + 0.25 * s(c.human_interaction) + 0.25 * s(c.compliance_risk) + 0.2 * s(c.complexity);
  const aiSuitability = Math.round(Math.min(100, Math.max(0, (pro * 0.7 + (1 - con) * 0.3) * 100)));
  const humanJudgment = s(c.judgment) * 0.6 + s(c.compliance_risk) * 0.4;
  let mode: OperatingMode;
  if (aiSuitability >= 80 && s(c.rules_clarity) >= 0.75 && humanJudgment < 0.3) mode = 'automation';
  else if (aiSuitability >= 70 && humanJudgment < 0.4) mode = 'ai_autonomous';
  else if (aiSuitability >= 55) mode = 'ai_approval';
  else if (aiSuitability >= 35) mode = 'human_ai';
  else mode = 'human_only';
  const gainShare: Record<OperatingMode, number> = { human_only: 0, human_ai: 0.2, ai_approval: 0.4, ai_autonomous: 0.6, automation: 0.75 };
  const capacityGain = Math.round(hoursPerWeek * gainShare[mode] * 10) / 10;
  const value = c.strategic_importance;
  return {
    aiSuitability, mode, capacityGain,
    judgmentLevel: humanJudgment >= 0.66 ? 'high' : humanJudgment >= 0.33 ? 'medium' : 'low',
    businessValue: value >= 4 ? 'high' : value >= 3 ? 'medium' : 'low',
    // Opportunity map priority: suitability × strategic value
    priority: Math.round(aiSuitability * (value / 5)),
  } as const;
}
