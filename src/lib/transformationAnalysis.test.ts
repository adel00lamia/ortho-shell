import { describe, expect, it } from 'vitest';
import { buildTransformationInsights, getOperatingModeCounts, getRoleRisk, type TransformationSnapshot } from './transformationAnalysis';

const snapshot: TransformationSnapshot = {
  objectives: [{ id: 'o1', title: 'Croissance export', category: 'growth', priority: 5, target_kpi: 'CA export' }],
  capabilities: [{ id: 'c1', name: 'Vente export', domain: 'Commercial', current_maturity: 1, target_maturity: 4 }],
  links: [],
  processes: [{ id: 'p1', name: 'Prospection', capability_id: 'c1', owner_role: 'Commercial export' }],
  tasks: [{ id: 't1', process_id: 'p1', name: 'Qualifier les prospects', role_name: 'Commercial export', hours_per_week: 10, criteria: { repetitiveness: 5, data_availability: 5, rules_clarity: 5, complexity: 1, human_interaction: 1, judgment: 1, compliance_risk: 1, strategic_importance: 5, frequency: 5 } }],
};

describe('transformation analysis', () => {
  it('flags broken strategy links and critical maturity gaps', () => {
    const insights = buildTransformationInsights(snapshot, true);
    expect(insights.some((item) => item.id === 'orphan-objectives')).toBe(true);
    expect(insights.some((item) => item.id === 'maturity-gaps')).toBe(true);
  });

  it('keeps deterministic Human + AI mode counts', () => {
    expect(getOperatingModeCounts(snapshot.tasks).automation).toBe(1);
  });

  it('aggregates role exposure from task hours', () => {
    expect(getRoleRisk(snapshot.tasks)[0]).toMatchObject({ role: 'Commercial export', taskCount: 1, exposure: 100 });
  });
});