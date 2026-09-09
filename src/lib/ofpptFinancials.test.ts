import { describe, it, expect } from 'vitest';
import {
  computeTFP,
  computeReimbursementCap,
  computeActionReimbursement,
  computeGiacReimbursement,
  computeTotalReimbursement,
  computeCostPerHourPerPerson,
  formatDH,
  REFERENCE_RULES,
  FUNDING_DISCLAIMER,
  type FundingRules,
} from './ofpptFinancials';

/** A configured, verified rule record supplied by the user/company. */
const customRules: FundingRules = {
  ...REFERENCE_RULES,
  tfpRate: 0.02,
  plannedRate: 0.5,
  unplannedRate: 0.25,
  hourlyCapPerPerson: null,
  capTiers: { lowerLevyThreshold: 10_000, lowerMultiplier: 5, flatCap: 100_000, upperLevyThreshold: 100_000 },
  engineering: { standardRate: 0.5, withStrategicDiagnosticRate: 0.6, cap: null },
  source: 'company configured rules',
  version: '2026-01',
  verified: true,
};

describe('funding calculator is rules-driven', () => {
  it('never presents the built-in values as a verified rule', () => {
    expect(REFERENCE_RULES.verified).toBe(false);
    expect(FUNDING_DISCLAIMER.fr).toMatch(/vérifier/i);
    expect(FUNDING_DISCLAIMER.en).toMatch(/verified/i);
  });

  it('computes the levy from the supplied rate', () => {
    expect(computeTFP(1_000_000, customRules)).toBe(20_000);
    expect(computeTFP(1_000_000, REFERENCE_RULES)).toBe(16_000);
  });

  it('applies the supplied ceiling tiers', () => {
    expect(computeReimbursementCap(5_000, customRules)).toBe(25_000);
    expect(computeReimbursementCap(50_000, customRules)).toBe(100_000);
    expect(computeReimbursementCap(200_000, customRules)).toBe(200_000);
  });

  it('uses the supplied rate and no hourly ceiling when none is configured', () => {
    const r = computeActionReimbursement(100_000, 14, 10, true, customRules);
    expect(r.rate).toBe(0.5);
    expect(r.ofpptHourlyCapAmount).toBeNull();
    expect(r.cappedAmount).toBe(50_000);
    expect(r.exceedsHourlyCap).toBe(false);
    expect(r.rulesVerified).toBe(true);
  });

  it('applies an hourly ceiling when one is configured', () => {
    const rules: FundingRules = { ...customRules, hourlyCapPerPerson: 30 };
    const r = computeActionReimbursement(100_000, 14, 10, true, rules);
    expect(r.ofpptHourlyCapAmount).toBe(30 * 14 * 10);
    expect(r.cappedAmount).toBe(4_200);
    expect(r.exceedsHourlyCap).toBe(true);
  });

  it('uses the unplanned rate for non-planned actions', () => {
    expect(computeActionReimbursement(10_000, 10, 5, false, customRules).rate).toBe(0.25);
  });

  it('computes engineering reimbursement from the supplied rates and ceiling', () => {
    expect(computeGiacReimbursement(200_000, false, customRules)).toBe(100_000);
    expect(computeGiacReimbursement(200_000, true, customRules)).toBe(120_000);
    expect(computeGiacReimbursement(1_000_000, true, { ...customRules, engineering: { ...customRules.engineering, cap: 50_000 } })).toBe(50_000);
  });

  it('caps the combined total with the global ceiling', () => {
    const actions = [
      { costHt: 300_000, durationHours: 20, participantCount: 20, isPlanned: true },
      { costHt: 300_000, durationHours: 20, participantCount: 20, isPlanned: true },
    ];
    const total = computeTotalReimbursement(actions, 500_000, customRules);
    expect(total.tfp).toBe(10_000);
    expect(total.cap).toBe(100_000);
    expect(total.actionsTotal).toBe(300_000);
    expect(total.finalReimbursement).toBe(100_000);
    expect(total.rulesVerified).toBe(true);
  });

  it('computes cost per hour per person safely', () => {
    expect(computeCostPerHourPerPerson(1_400, 14, 10)).toBe(10);
    expect(computeCostPerHourPerPerson(1_000, 0, 10)).toBe(0);
    expect(computeCostPerHourPerPerson(1_000, 10, 0)).toBe(0);
  });

  it('formats DH amounts', () => {
    expect(formatDH(1234.5)).toContain('DH');
  });
});
