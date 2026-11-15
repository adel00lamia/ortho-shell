import { describe, it, expect } from 'vitest';
import { baselineHours, buildOpportunities, computeScenario, domainMaturity, emptyModel, emptyProcess, processScenario, actionPriority, type TeamRole } from './model';
import { buildDemoModel } from './demoData';
import { parseModel } from './storage';

const role: TeamRole = { id: 'r', title: 'Gestionnaire', fte: 3, domains: ['paie'], responsibilities: '', availableHoursPerFte: 1600, loadedHourlyCost: 200, competencies: '' };

describe('HR workspace model', () => {
  it('baseline hours = occurrences × minutes / 60 and does not multiply team volume by FTE', () => {
    const p = { ...emptyProcess('paie', 'r'), annualOccurrences: 120, minutesPerOccurrence: 30 };
    expect(baselineHours(p, [role])).toBe(60);
    expect(baselineHours({ ...p, volumeBasis: 'person' }, [role])).toBe(180);
  });

  it('released hours subtract human review and never go negative', () => {
    const p = { ...emptyProcess('paie', 'r'), annualOccurrences: 120, minutesPerOccurrence: 30, reductionPct: 50, adoptionPct: 100, reviewMinutes: 5 };
    const s = processScenario(p, [role], 'base');
    expect(s.releasedHours).toBeCloseTo(60 * 0.5 - 10);
    const heavy = processScenario({ ...p, reviewMinutes: 60 }, [role], 'base');
    expect(heavy.releasedHours).toBe(0);
    expect(heavy.targetHours).toBe(60);
  });

  it('cash savings default to 0 and break-even is not reached without positive annual net', () => {
    const m = emptyModel();
    m.roles = [role];
    m.processes = [{ ...emptyProcess('paie', 'r'), annualOccurrences: 120, minutesPerOccurrence: 30, reductionPct: 50, adoptionPct: 100 }];
    m.scenario.annualToolsCost = 1000; m.scenario.implementationCost = 500;
    const t = computeScenario(m);
    expect(t.capacityValue).toBe(30 * 200);
    expect(t.cashSavings).toBe(0);
    expect(t.annualNet).toBe(-1000);
    expect(t.firstYearNet).toBe(-1500);
    expect(t.breakEvenMonths).toBeNull();
    m.scenario.cashFraction = 0.5;
    expect(computeScenario(m).breakEvenMonths).toBeCloseTo((500 / 2000) * 12);
  });

  it('maturity uses answered questions only; missing answers lower coverage', () => {
    const r = domainMaturity({ pai1: 4, pai2: 2 }).find((d) => d.domain === 'paie')!;
    expect(r.score).toBe(3);
    expect(r.coverage).toBeCloseTo(2 / 3);
  });

  it('sensitive or high-risk processes never become supervised automation', () => {
    const m = buildDemoModel();
    const auto = buildOpportunities(m).filter((o) => o.category === 'supervised_automation').map((o) => o.processId);
    expect(auto).not.toContain('p2'); // payroll release, 75 %
    expect(auto).not.toContain('p5'); // hiring
    expect(auto).toContain('p3');
  });

  it('priority = impact×2 − effort − dependency', () => {
    expect(actionPriority({ impact: 4, effort: 3, dependsOn: 'a1' } as never)).toBe(4);
  });

  it('rejects invalid saved data', () => {
    expect(parseModel('{oops')).toBeNull();
    expect(parseModel(JSON.stringify({ version: 2 }))).toBeNull();
    expect(parseModel(JSON.stringify(buildDemoModel()))?.processes).toHaveLength(12);
  });
});
