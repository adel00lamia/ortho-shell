import { describe, expect, it } from 'vitest';
import {
  CAUSE_KEYS,
  computeConfidence,
  computeTrainingFit,
  evidenceCompleteness,
  normalizeCauseBreakdown,
  normalizeCauseEvidence,
} from '@/lib/rootCauseModel';

const sum = (b: Record<string, number>) => Object.values(b).reduce((a, x) => a + x, 0);

describe('normalizeCauseBreakdown', () => {
  it('maps the historical 5-cause breakdown onto the 7-cause model', () => {
    const legacy = { skill: 20, process: 25, management: 15, tools: 25, organization: 15 };
    const out = normalizeCauseBreakdown(legacy);
    expect(out.skill).toBe(20);
    expect(out.process).toBe(25);
    expect(out.tools_data).toBe(25);
    expect(out.capacity_organization).toBe(15);
    expect(out.clarity).toBe(0);
    expect(out.incentives).toBe(0);
    expect(sum(out)).toBe(100);
  });

  it('renormalises breakdowns that do not sum to 100', () => {
    const out = normalizeCauseBreakdown({ skill: 10, process: 10 });
    expect(sum(out)).toBe(100);
    expect(out.skill).toBe(50);
    expect(out.process).toBe(50);
  });

  it('accepts the new keys and aliases', () => {
    const out = normalizeCauseBreakdown({
      capability: 30,
      clarity: 20,
      tools_data: 20,
      incentives: 15,
      capacity_organization: 15,
    });
    expect(out.skill).toBe(30);
    expect(out.clarity).toBe(20);
    expect(sum(out)).toBe(100);
  });

  it('falls back to an even spread for empty or unusable input', () => {
    for (const input of [null, undefined, {}, { nonsense: 5 }, 'oops']) {
      const out = normalizeCauseBreakdown(input);
      expect(sum(out)).toBe(100);
      expect(Object.keys(out).sort()).toEqual([...CAUSE_KEYS].sort());
    }
  });
});

describe('normalizeCauseEvidence', () => {
  it('keeps known causes, maps legacy keys and clamps confidence', () => {
    const out = normalizeCauseEvidence([
      { cause: 'tools', supporting: ['Le CRM tombe en panne'], contradicting: [], strength: 'strong', confidence: 140 },
      { cause: 'unknown', supporting: ['x'] },
      { cause: 'tools', supporting: ['duplicate'] },
      { cause: 'clarity', supporting: [''], strength: 'nonsense', confidence: 'abc' },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].cause).toBe('tools_data');
    expect(out[0].confidence).toBe(100);
    expect(out[1].strength).toBe('moderate');
    expect(out[1].confidence).toBe(50);
    expect(out[1].supporting).toEqual([]);
  });

  it('returns an empty list for non-arrays', () => {
    expect(normalizeCauseEvidence(null)).toEqual([]);
    expect(normalizeCauseEvidence({ cause: 'skill' })).toEqual([]);
  });
});

describe('computeTrainingFit', () => {
  it('stays low when capability is a small share and barriers are high', () => {
    const { score, factors } = computeTrainingFit(
      { capability_share: 15, demonstrated_skill_gap: 20, high_performers_succeed: false, standards_and_tools_available: false },
      { skill: 15, process: 30, tools_data: 30, management: 25 }
    );
    expect(score).toBeLessThan(40);
    expect(factors.length).toBeGreaterThanOrEqual(3);
    expect(factors.length).toBeLessThanOrEqual(5);
  });

  it('rises when a real skill gap exists and the context is sound', () => {
    const low = computeTrainingFit({ capability_share: 70, demonstrated_skill_gap: 80 }, { skill: 70, process: 30 }).score;
    const high = computeTrainingFit(
      { capability_share: 70, demonstrated_skill_gap: 80, high_performers_succeed: true, standards_and_tools_available: true },
      { skill: 70, process: 30 }
    ).score;
    expect(high).toBeGreaterThan(low);
  });

  it('clamps the score into 0-100 whatever the signals', () => {
    const max = computeTrainingFit(
      { capability_share: 999, demonstrated_skill_gap: 999, barrier_load: -50, high_performers_succeed: true, standards_and_tools_available: true },
      { skill: 100 }
    );
    const min = computeTrainingFit(
      { capability_share: -999, demonstrated_skill_gap: -999, barrier_load: 999, high_performers_succeed: false, standards_and_tools_available: false },
      { process: 100 }
    );
    expect(max.score).toBe(100);
    expect(min.score).toBe(0);
  });

  it('derives missing signals from the breakdown instead of failing', () => {
    const { signals } = computeTrainingFit({ capability_share: 40 }, { skill: 40, tools_data: 60 });
    expect(signals.demonstrated_skill_gap).toBe(40);
    expect(signals.barrier_load).toBe(100);
  });
});

describe('evidence completeness and confidence', () => {
  it('grows with the amount of material supplied', () => {
    const thin = evidenceCompleteness({ problem_description: 'Trop de retards.' });
    const rich = evidenceCompleteness({
      problem_description: 'x'.repeat(600),
      symptoms: ['a', 'b', 'c', 'd'],
      business_kpis: [{}, {}],
      evidence_sources: { conversations: 12, documents: 4, interviews: 6, indicators: 3 },
      pulse_responses: 12,
    });
    expect(thin).toBeLessThan(rich);
    expect(rich).toBeLessThanOrEqual(100);
  });

  it('caps confidence when evidence is thin, without touching the score', () => {
    expect(computeConfidence(95, 0)).toBe(45);
    expect(computeConfidence(95, 100)).toBe(95);
    expect(computeConfidence(50, 100)).toBe(50);
    expect(computeConfidence('nonsense', 100)).toBe(60);
  });
});
