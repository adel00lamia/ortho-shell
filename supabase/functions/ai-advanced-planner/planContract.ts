// Each bounded section is generated independently; only a complete merge is published.
export const PLAN_SECTIONS = [
  ['title', 'description', 'executive_summary', 'timeline', 'training_axes', 'modules', 'budget_breakdown'],
  ['kpis', 'recommendations', 'evidence_register', 'implementation_roadmap', 'success_metrics'],
  ['market_research', 'risk_assessment', 'regulatory_framework'],
] as const;

const arrayKeys = new Set(['training_axes', 'modules', 'kpis', 'recommendations', 'evidence_register', 'success_metrics']);
const stringKeys = new Set(['title', 'description', 'executive_summary', 'timeline']);

export function sectionSchema(keys: readonly string[]) {
  return {
    type: 'object', additionalProperties: false, required: ['plan'],
    properties: { plan: {
      type: 'object', additionalProperties: false, required: [...keys],
      properties: Object.fromEntries(keys.map(key => [key,
        stringKeys.has(key) ? { type: 'string', minLength: 1 }
          : arrayKeys.has(key) ? { type: 'array', minItems: 1, items: key === 'success_metrics' ? { type: 'string' } : { type: 'object' } }
            : { type: 'object' },
      ])),
    } },
  };
}

export function parsePlanSection(text: string, keys: readonly string[]): Record<string, unknown> {
  // Do not repair incomplete JSON or extract a fragment and call it a full plan.
  const clean = text.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  const parsed = JSON.parse(clean);
  const plan = parsed?.plan;
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) throw new Error('Missing plan object');
  for (const key of keys) {
    const value = plan[key];
    if (stringKeys.has(key) ? typeof value !== 'string' || !value.trim()
      : arrayKeys.has(key) ? !Array.isArray(value) || !value.length
        : !value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`Incomplete plan section: ${key}`);
    }
  }
  if (keys.includes('modules')) {
    if (plan.modules.length < 4 || plan.modules.length > 6) throw new Error('The plan must contain 4 to 6 complete modules');
    for (const module of plan.modules) {
      for (const key of ['title', 'description', 'duration', 'observed_difficulty', 'accountable_owner']) {
        if (typeof module[key] !== 'string' || !module[key].trim()) throw new Error(`Incomplete module: ${key}`);
      }
      for (const key of ['learning_objectives', 'content_outline', 'assessment_methods', 'workplace_transfer', 'skills_covered']) {
        if (!Array.isArray(module[key]) || !module[key].length) throw new Error(`Incomplete module: ${key}`);
      }
    }
  }
  return Object.fromEntries(keys.map(key => [key, plan[key]]));
}