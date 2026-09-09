/**
 * Generic training-funding calculator (Morocco: TFP / CSF / GIAC context).
 *
 * IMPORTANT — this module contains NO official rule.
 * Every rate, ceiling and cap is an INPUT (`FundingRules`). The values in
 * `REFERENCE_RULES` are unverified reference assumptions kept only so existing
 * screens keep working; they are explicitly flagged `verified: false` and must
 * be presented as "à vérifier / to verify", never as the applicable rule.
 *
 * Eligibility, reimbursement rate, ceilings, required documents and deadlines
 * depend on the action type and on the official framework applicable at the
 * date of the dossier. Always check the current official sources.
 */

export interface FundingRules {
  /** Payroll tax rate used to compute the training levy (TFP). */
  tfpRate: number;
  /** Reimbursement rate for a planned action. */
  plannedRate: number;
  /** Reimbursement rate for a non-planned action. */
  unplannedRate: number;
  /** Ceiling per hour per participant, in DH. Set null to disable the ceiling. */
  hourlyCapPerPerson: number | null;
  /** Ceiling tiers applied to the total reimbursement, based on the levy amount. */
  capTiers: {
    lowerLevyThreshold: number;
    lowerMultiplier: number;
    flatCap: number;
    upperLevyThreshold: number;
  };
  /** Engineering (GIAC-type) reimbursement rates and ceiling. */
  engineering: {
    standardRate: number;
    withStrategicDiagnosticRate: number;
    cap: number | null;
  };
  /** Where these values come from, and whether a human verified them. */
  source: string;
  /** Framework version / applicable date the values were taken from. */
  version: string;
  /** false = reference assumption only, must be shown as "to verify". */
  verified: boolean;
}

/**
 * Reference assumptions ONLY — not a verified rule record.
 * Displayed values built on these must carry a "to verify" disclaimer.
 */
export const REFERENCE_RULES: FundingRules = {
  tfpRate: 0.016,
  plannedRate: 0.7,
  unplannedRate: 0.4,
  hourlyCapPerPerson: 40,
  capTiers: {
    lowerLevyThreshold: 20_000,
    lowerMultiplier: 10,
    flatCap: 200_000,
    upperLevyThreshold: 200_000,
  },
  engineering: {
    standardRate: 0.7,
    withStrategicDiagnosticRate: 0.8,
    cap: 100_000,
  },
  source: 'reference assumption (unverified)',
  version: 'legacy example',
  verified: false,
};

/** Backwards-compatible alias used by existing screens. */
export const DEFAULT_FUNDING_RULES = REFERENCE_RULES;

/** Human-readable disclaimer shown next to every computed funding amount. */
export const FUNDING_DISCLAIMER = {
  fr: 'Éligibilité, taux de remboursement, plafonds, pièces et délais dépendent du type d’action et du cadre officiel applicable à la date du dossier. Les montants affichés sont des estimations basées sur des hypothèses paramétrables, à vérifier auprès des sources officielles en vigueur.',
  en: 'Eligibility, reimbursement rate, ceilings, documents and deadlines depend on the action type and on the official framework applicable at the dossier date. Amounts shown are estimates based on configurable assumptions and must be verified against current official sources.',
} as const;

/** Compute the training levy (TFP) from the gross annual payroll. */
export function computeTFP(grossAnnualPayroll: number, rules: FundingRules = REFERENCE_RULES): number {
  return grossAnnualPayroll * rules.tfpRate;
}

/** Compute the reimbursement ceiling from the levy amount, using the supplied tiers. */
export function computeReimbursementCap(tfp: number, rules: FundingRules = REFERENCE_RULES): number {
  const t = rules.capTiers;
  if (tfp < t.lowerLevyThreshold) return tfp * t.lowerMultiplier;
  if (tfp <= t.upperLevyThreshold) return t.flatCap;
  return tfp;
}

export interface ActionReimbursement {
  rate: number;
  uncappedAmount: number;
  cappedAmount: number;
  /** null when no hourly ceiling is configured. */
  ofpptHourlyCapAmount: number | null;
  exceedsHourlyCap: boolean;
  rulesVerified: boolean;
}

/** Estimate the reimbursement of a single training action from the supplied rules. */
export function computeActionReimbursement(
  costHt: number,
  durationHours: number,
  participantCount: number,
  isPlanned: boolean,
  rules: FundingRules = REFERENCE_RULES
): ActionReimbursement {
  const rate = isPlanned ? rules.plannedRate : rules.unplannedRate;
  const uncappedAmount = costHt * rate;
  const hourly = rules.hourlyCapPerPerson;
  const ofpptHourlyCapAmount = hourly == null ? null : hourly * durationHours * participantCount;
  const cappedAmount = ofpptHourlyCapAmount == null ? uncappedAmount : Math.min(uncappedAmount, ofpptHourlyCapAmount);
  return {
    rate,
    uncappedAmount,
    cappedAmount,
    ofpptHourlyCapAmount,
    exceedsHourlyCap: ofpptHourlyCapAmount != null && uncappedAmount > ofpptHourlyCapAmount,
    rulesVerified: rules.verified,
  };
}

/** Estimate an engineering (GIAC-type) reimbursement from the supplied rules. */
export function computeGiacReimbursement(
  engineeringCostHt: number,
  followedStrategicDiagnostic: boolean,
  rules: FundingRules = REFERENCE_RULES
): number {
  const e = rules.engineering;
  const rate = followedStrategicDiagnostic ? e.withStrategicDiagnosticRate : e.standardRate;
  const amount = engineeringCostHt * rate;
  return e.cap == null ? amount : Math.min(amount, e.cap);
}

/** Estimate the combined reimbursement of several actions, then apply the global ceiling. */
export function computeTotalReimbursement(
  actions: Array<{ costHt: number; durationHours: number; participantCount: number; isPlanned: boolean }>,
  grossAnnualPayroll: number,
  rules: FundingRules = REFERENCE_RULES
): { tfp: number; cap: number; actionsTotal: number; finalReimbursement: number; rulesVerified: boolean } {
  const tfp = computeTFP(grossAnnualPayroll, rules);
  const cap = computeReimbursementCap(tfp, rules);
  const actionsTotal = actions.reduce(
    (sum, a) => sum + computeActionReimbursement(a.costHt, a.durationHours, a.participantCount, a.isPlanned, rules).cappedAmount,
    0
  );
  return {
    tfp,
    cap,
    actionsTotal,
    finalReimbursement: Math.min(actionsTotal, cap),
    rulesVerified: rules.verified,
  };
}

/** Format a number as Moroccan DH. */
export function formatDH(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' DH';
}

/** Effective cost per hour per person — compare it to the configured hourly ceiling, if any. */
export function computeCostPerHourPerPerson(
  costHt: number,
  durationHours: number,
  participantCount: number
): number {
  if (durationHours <= 0 || participantCount <= 0) return 0;
  return costHt / (durationHours * participantCount);
}
