import { describe, it, expect } from 'vitest';
import {
  computeTFP,
  computeReimbursementCap,
  computeActionReimbursement,
  computeGiacReimbursement,
  computeTotalReimbursement,
  computeCostPerHourPerPerson,
} from './ofpptFinancials';

describe('computeTFP', () => {
  it('calculates 1.6% of payroll', () => {
    expect(computeTFP(1_000_000)).toBe(16_000);
    expect(computeTFP(500_000)).toBe(8_000);
    expect(computeTFP(0)).toBe(0);
  });
});

describe('computeReimbursementCap', () => {
  it('returns TFP × 10 when TFP < 20,000', () => {
    expect(computeReimbursementCap(10_000)).toBe(100_000);
    expect(computeReimbursementCap(5_000)).toBe(50_000);
    expect(computeReimbursementCap(19_999)).toBeCloseTo(199_990);
  });

  it('returns 200,000 when 20,000 ≤ TFP ≤ 200,000', () => {
    expect(computeReimbursementCap(20_000)).toBe(200_000);
    expect(computeReimbursementCap(100_000)).toBe(200_000);
    expect(computeReimbursementCap(200_000)).toBe(200_000);
  });

  it('returns TFP when TFP > 200,000', () => {
    expect(computeReimbursementCap(300_000)).toBe(300_000);
    expect(computeReimbursementCap(1_000_000)).toBe(1_000_000);
  });
});

describe('computeActionReimbursement', () => {
  it('applies 70% rate for planned training', () => {
    const result = computeActionReimbursement(100_000, 10, 20, true);
    expect(result.rate).toBe(0.70);
    expect(result.uncappedAmount).toBe(70_000);
  });

  it('applies 40% rate for non-planned training', () => {
    const result = computeActionReimbursement(100_000, 10, 20, false);
    expect(result.rate).toBe(0.40);
    expect(result.uncappedAmount).toBe(40_000);
  });

  it('caps at 40 DH/h/person', () => {
    // 100,000 DH cost, 10h, 5 people → OFPPT cap = 40×10×5 = 2000
    const result = computeActionReimbursement(100_000, 10, 5, true);
    expect(result.ofpptHourlyCapAmount).toBe(2_000);
    expect(result.cappedAmount).toBe(2_000);
    expect(result.exceedsHourlyCap).toBe(true);
  });

  it('does not cap when within 40 DH/h/person limit', () => {
    // 1,000 DH cost, 10h, 10 people → OFPPT cap = 40×10×10 = 4000, 70% of 1000 = 700
    const result = computeActionReimbursement(1_000, 10, 10, true);
    expect(result.cappedAmount).toBe(700);
    expect(result.exceedsHourlyCap).toBe(false);
  });
});

describe('computeGiacReimbursement', () => {
  it('applies 70% for standard engineering', () => {
    expect(computeGiacReimbursement(50_000, false)).toBe(35_000);
  });

  it('applies 80% for strategic diagnostic', () => {
    expect(computeGiacReimbursement(50_000, true)).toBe(40_000);
  });

  it('caps at 100,000 DH', () => {
    expect(computeGiacReimbursement(200_000, false)).toBe(100_000);
    expect(computeGiacReimbursement(200_000, true)).toBe(100_000);
  });
});

describe('computeTotalReimbursement', () => {
  it('sums action reimbursements up to the cap', () => {
    const actions = [
      { costHt: 50_000, durationHours: 20, participantCount: 10, isPlanned: true },
      { costHt: 30_000, durationHours: 15, participantCount: 8, isPlanned: true },
    ];
    const result = computeTotalReimbursement(actions, 2_000_000);
    expect(result.tfp).toBe(32_000);
    expect(result.cap).toBe(200_000);
    expect(result.finalReimbursement).toBeLessThanOrEqual(result.cap);
  });
});

describe('computeCostPerHourPerPerson', () => {
  it('computes correctly', () => {
    expect(computeCostPerHourPerPerson(10_000, 10, 25)).toBe(40);
    expect(computeCostPerHourPerPerson(5_000, 10, 25)).toBe(20);
  });

  it('returns 0 for invalid inputs', () => {
    expect(computeCostPerHourPerPerson(10_000, 0, 25)).toBe(0);
    expect(computeCostPerHourPerPerson(10_000, 10, 0)).toBe(0);
  });
});
