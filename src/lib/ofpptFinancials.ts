/**
 * OFPPT/GIAC Financial Calculation Functions
 * Moroccan TFP (1.6% payroll tax) reimbursement rules
 *
 * Sources:
 * - CSF regulations: 70% for planned training, 40% for unplanned
 * - OFPPT hourly cost cap: 40 DH/h/person
 * - GIAC engineering cost: 70% (80% if strategic diagnostic), capped at 100,000 DH HT
 * - Reimbursement cap tiers based on TFP amount
 */

/** Compute TFP (Taxe de Formation Professionnelle) */
export function computeTFP(grossAnnualPayroll: number): number {
  return grossAnnualPayroll * 0.016;
}

/**
 * Compute maximum reimbursement cap based on TFP amount.
 * Three tiers:
 *   TFP < 20,000 → cap = TFP × 10
 *   20,000 ≤ TFP ≤ 200,000 → cap = 200,000 DH
 *   TFP > 200,000 → cap = TFP
 */
export function computeReimbursementCap(tfp: number): number {
  if (tfp < 20_000) return tfp * 10;
  if (tfp <= 200_000) return 200_000;
  return tfp;
}

/**
 * Compute reimbursement for a single training action.
 * @param costHt - Total cost HT in DH
 * @param durationHours - Total training hours
 * @param participantCount - Number of participants
 * @param isPlanned - true = planned (70%), false = non-planned (40%)
 * @returns { rate, uncappedAmount, cappedAmount, ofpptHourlyCapAmount }
 */
export function computeActionReimbursement(
  costHt: number,
  durationHours: number,
  participantCount: number,
  isPlanned: boolean
): {
  rate: number;
  uncappedAmount: number;
  cappedAmount: number;
  ofpptHourlyCapAmount: number;
  exceedsHourlyCap: boolean;
} {
  const rate = isPlanned ? 0.70 : 0.40;
  const uncappedAmount = costHt * rate;
  // OFPPT cap: 40 DH per hour per person
  const ofpptHourlyCapAmount = 40 * durationHours * participantCount;
  const cappedAmount = Math.min(uncappedAmount, ofpptHourlyCapAmount);
  const exceedsHourlyCap = uncappedAmount > ofpptHourlyCapAmount;
  return { rate, uncappedAmount, cappedAmount, ofpptHourlyCapAmount, exceedsHourlyCap };
}

/**
 * Compute GIAC engineering reimbursement.
 * @param engineeringCostHt - Engineering/consulting cost HT in DH
 * @param followedStrategicDiagnostic - true = 80% rate, false = 70% rate
 * @returns reimbursement amount (capped at 100,000 DH)
 */
export function computeGiacReimbursement(
  engineeringCostHt: number,
  followedStrategicDiagnostic: boolean
): number {
  const rate = followedStrategicDiagnostic ? 0.80 : 0.70;
  return Math.min(engineeringCostHt * rate, 100_000);
}

/**
 * Compute total estimated reimbursement for all actions combined.
 * Applies the reimbursement cap after summing all action reimbursements.
 */
export function computeTotalReimbursement(
  actions: Array<{ costHt: number; durationHours: number; participantCount: number; isPlanned: boolean }>,
  grossAnnualPayroll: number
): {
  tfp: number;
  cap: number;
  actionsTotal: number;
  finalReimbursement: number;
} {
  const tfp = computeTFP(grossAnnualPayroll);
  const cap = computeReimbursementCap(tfp);
  const actionsTotal = actions.reduce((sum, a) => {
    const { cappedAmount } = computeActionReimbursement(a.costHt, a.durationHours, a.participantCount, a.isPlanned);
    return sum + cappedAmount;
  }, 0);
  const finalReimbursement = Math.min(actionsTotal, cap);
  return { tfp, cap, actionsTotal, finalReimbursement };
}

/** Format a number as Moroccan DH currency */
export function formatDH(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' DH';
}

/** Cost per hour per person — used to check against 40 DH cap */
export function computeCostPerHourPerPerson(
  costHt: number,
  durationHours: number,
  participantCount: number
): number {
  if (durationHours <= 0 || participantCount <= 0) return 0;
  return costHt / (durationHours * participantCount);
}
