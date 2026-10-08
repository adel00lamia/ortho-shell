// Shared, deterministic calculation model for the HR Transformation workspace.
// Every view (summary, diagnostic, scenarios, roadmap, printed report) reads from these
// pure functions so that one input change propagates consistently everywhere.

export const HR_DOMAINS = [
  { id: 'pilotage', fr: 'Direction & pilotage', en: 'Leadership & steering' },
  { id: 'paie', fr: 'Paie & administration', en: 'Payroll & administration' },
  { id: 'recrutement', fr: 'Recrutement & onboarding', en: 'Recruiting & onboarding' },
  { id: 'formation', fr: 'Formation & compétences', en: 'Learning & skills' },
  { id: 'performance', fr: 'Développement RH & performance', en: 'HR development & performance' },
  { id: 'relations', fr: 'Relations sociales & expérience collaborateurs', en: 'Employee relations & experience' },
] as const;
export type DomainId = (typeof HR_DOMAINS)[number]['id'];
export const domainLabel = (id: string) => HR_DOMAINS.find((d) => d.id === id)?.fr ?? id;

export type RiskLevel = 'low' | 'medium' | 'high';
export type SensitiveDecision = 'none' | 'payroll_release' | 'hiring' | 'discipline' | 'career';
export const SENSITIVE_LABELS: Record<SensitiveDecision, string> = {
  none: 'Aucune décision sensible',
  payroll_release: 'Validation / mise en paiement de la paie',
  hiring: 'Décision de recrutement / présélection',
  discipline: 'Décision disciplinaire',
  career: 'Décision de carrière / mobilité',
};

export interface CompanyContext { name: string; sector: string; headcount: number | null; sites: string; notes: string }

export interface TeamRole {
  id: string; title: string; fte: number; domains: DomainId[];
  responsibilities: string; availableHoursPerFte: number; loadedHourlyCost: number; competencies: string;
}

export interface ProcessRow {
  id: string; name: string; domain: DomainId; ownerRoleId: string;
  /** 'team' = occurrences for the whole team; 'person' = occurrences per FTE of the owner role. */
  volumeBasis: 'team' | 'person';
  annualOccurrences: number; minutesPerOccurrence: number;
  evidence: string; tools: string; input: string; output: string;
  painPoint: string; bottleneck: string; proposedChange: string;
  risk: RiskLevel; sensitive: SensitiveDecision;
  baselineKpi: string; targetKpi: string; approver: string;
  /** Qualitative assessment flags entered by the user (not inferred). */
  aiAssistPotential: number; // 0-100, share of activity an AI could assist
  standardised: boolean; dataQualityIssue: boolean; trainingGap: boolean;
  reductionPct: number; adoptionPct: number; reviewMinutes: number;
}

export interface MaturityQuestion { id: string; domain: DomainId; text: string }
export type Answers = Record<string, number | null>; // 1..4 or null when unanswered

export interface ScenarioSettings {
  preset: 'conservative' | 'base' | 'ambitious';
  annualToolsCost: number; implementationCost: number; trainingCost: number;
  cashFraction: number; // 0..1, default 0
  weeksPerYear: number;
  allocation: { managerSupport: number; dataAnalysis: number; talentDevelopment: number; employeeExperience: number };
}

export type ActionStatus = 'proposed' | 'approved' | 'in_progress' | 'done' | 'blocked';
export interface RoadmapAction {
  id: string; title: string; category: OpportunityCategory | 'other';
  sourceType: 'process' | 'domain'; sourceId: string; sourceLabel: string; reason: string;
  owner: string; approver: string; dueDate: string; impact: number; effort: number;
  dependsOn: string; risk: string; kpiBaseline: string; kpiTarget: string;
  status: ActionStatus; horizon: 30 | 60 | 90; validation: string; proof: string;
}

export interface WorkspaceModel {
  version: 1; company: CompanyContext; roles: TeamRole[]; processes: ProcessRow[];
  answers: Answers; scenario: ScenarioSettings; roadmap: RoadmapAction[];
}

export const MATURITY_QUESTIONS: MaturityQuestion[] = [
  { id: 'pil1', domain: 'pilotage', text: 'Des indicateurs RH sont produits à fréquence fixe et utilisés en comité.' },
  { id: 'pil2', domain: 'pilotage', text: 'Les responsabilités RH (RACI) sont écrites et connues.' },
  { id: 'pil3', domain: 'pilotage', text: 'Les données RH proviennent d’une source de référence unique.' },
  { id: 'pai1', domain: 'paie', text: 'Les variables de paie sont collectées dans un format standard.' },
  { id: 'pai2', domain: 'paie', text: 'Des contrôles d’écarts sont réalisés avant chaque clôture.' },
  { id: 'pai3', domain: 'paie', text: 'Les demandes administratives sont suivies avec délai cible.' },
  { id: 'rec1', domain: 'recrutement', text: 'Les fiches de poste sont à jour et structurées par compétences.' },
  { id: 'rec2', domain: 'recrutement', text: 'Le délai de recrutement est mesuré par étape.' },
  { id: 'rec3', domain: 'recrutement', text: 'Un parcours d’onboarding standard existe et est suivi.' },
  { id: 'for1', domain: 'formation', text: 'Les besoins de formation sont reliés à des écarts mesurés.' },
  { id: 'for2', domain: 'formation', text: 'Les dossiers de financement sont préparés sans ressaisie.' },
  { id: 'for3', domain: 'formation', text: 'L’efficacité des formations est mesurée après 90 jours.' },
  { id: 'per1', domain: 'performance', text: 'Les entretiens annuels suivent une grille commune.' },
  { id: 'per2', domain: 'performance', text: 'Les plans de succession existent pour les postes critiques.' },
  { id: 'per3', domain: 'performance', text: 'Les données d’évaluation sont exploitables (non dispersées).' },
  { id: 'rel1', domain: 'relations', text: 'Les demandes collaborateurs ont un canal unique et suivi.' },
  { id: 'rel2', domain: 'relations', text: 'Le climat social est mesuré à intervalle régulier.' },
  { id: 'rel3', domain: 'relations', text: 'Les instances représentatives ont un calendrier et des comptes rendus.' },
];
export const ANSWER_LABELS = ['', 'Inexistant', 'Informel', 'Défini', 'Mesuré & piloté'];

// ---------- core calculations ----------
const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function totalOccurrences(p: ProcessRow, roles: TeamRole[]) {
  if (p.volumeBasis === 'person') {
    const owner = roles.find((r) => r.id === p.ownerRoleId);
    return n(p.annualOccurrences) * n(owner?.fte);
  }
  return n(p.annualOccurrences);
}

/** Annual baseline hours = annualOccurrences × minutesPerOccurrence / 60 (team volume). */
export function baselineHours(p: ProcessRow, roles: TeamRole[]) {
  return (totalOccurrences(p, roles) * n(p.minutesPerOccurrence)) / 60;
}

export const PRESETS = {
  conservative: { label: 'Prudent', reductionFactor: 0.6, adoptionFactor: 0.6 },
  base: { label: 'Base', reductionFactor: 1, adoptionFactor: 1 },
  ambitious: { label: 'Ambitieux', reductionFactor: 1.3, adoptionFactor: 1.2 },
} as const;

export interface ProcessScenario {
  processId: string; baselineHours: number; reductionRate: number; adoptionRate: number;
  reviewHours: number; grossReduction: number; releasedHours: number; targetHours: number;
  hourlyCost: number; capacityValue: number; warnings: string[];
}

export function processScenario(p: ProcessRow, roles: TeamRole[], preset: ScenarioSettings['preset']): ProcessScenario {
  const f = PRESETS[preset] ?? PRESETS.base;
  const base = baselineHours(p, roles);
  const reductionRate = clamp((n(p.reductionPct) / 100) * f.reductionFactor, 0, 0.9);
  const adoptionRate = clamp((n(p.adoptionPct) / 100) * f.adoptionFactor, 0, 1);
  const reviewHours = (totalOccurrences(p, roles) * n(p.reviewMinutes)) / 60;
  const grossReduction = base * reductionRate * adoptionRate;
  const releasedHours = Math.max(0, grossReduction - reviewHours);
  const targetHours = Math.max(0, base - releasedHours);
  const owner = roles.find((r) => r.id === p.ownerRoleId);
  const hourlyCost = n(owner?.loadedHourlyCost);
  const warnings: string[] = [];
  if (reviewHours > grossReduction && grossReduction > 0) warnings.push('Le temps de revue humaine dépasse le gain brut : aucun temps libéré.');
  if (!owner) warnings.push('Aucun rôle responsable : valeur horaire non calculable.');
  if (n(p.minutesPerOccurrence) <= 0 || totalOccurrences(p, roles) <= 0) warnings.push('Volume ou durée manquant.');
  return { processId: p.id, baselineHours: base, reductionRate, adoptionRate, reviewHours, grossReduction, releasedHours, targetHours, hourlyCost, capacityValue: releasedHours * hourlyCost, warnings };
}

export interface ScenarioTotals {
  perProcess: ProcessScenario[]; baselineHours: number; releasedHours: number; targetHours: number;
  capacityValue: number; cashSavings: number; recurringCost: number; annualNet: number; firstYearNet: number;
  breakEvenMonths: number | null; allocation: Record<keyof ScenarioSettings['allocation'], number>; warnings: string[];
}

export function computeScenario(m: WorkspaceModel, presetOverride?: ScenarioSettings['preset']): ScenarioTotals {
  const preset = presetOverride ?? m.scenario.preset;
  const perProcess = m.processes.map((p) => processScenario(p, m.roles, preset));
  const sum = (k: keyof ProcessScenario) => perProcess.reduce((s, x) => s + (x[k] as number), 0);
  const capacityValue = sum('capacityValue');
  const cashFraction = clamp(n(m.scenario.cashFraction), 0, 1);
  const cashSavings = capacityValue * cashFraction;
  const recurringCost = n(m.scenario.annualToolsCost);
  const annualNet = cashSavings - recurringCost;
  const firstYearNet = annualNet - n(m.scenario.implementationCost) - n(m.scenario.trainingCost);
  const oneTime = n(m.scenario.implementationCost) + n(m.scenario.trainingCost);
  const breakEvenMonths = annualNet > 0 ? (oneTime / annualNet) * 12 : null;
  const released = sum('releasedHours');
  const a = m.scenario.allocation;
  const totalAlloc = n(a.managerSupport) + n(a.dataAnalysis) + n(a.talentDevelopment) + n(a.employeeExperience);
  const share = (v: number) => (totalAlloc > 0 ? (released * n(v)) / totalAlloc : 0);
  const warnings: string[] = [];
  if (Math.abs(totalAlloc - 100) > 0.5) warnings.push(`La répartition du temps libéré totalise ${totalAlloc} % (attendu : 100 %).`);
  const cap = capacityByRole(m);
  cap.filter((r) => r.utilisation > 1).forEach((r) => warnings.push(`Charge modélisée de « ${r.title} » supérieure à ses heures disponibles (${Math.round(r.utilisation * 100)} %) — vérifier les volumes saisis.`));
  return {
    perProcess, baselineHours: sum('baselineHours'), releasedHours: released, targetHours: sum('targetHours'),
    capacityValue, cashSavings, recurringCost, annualNet, firstYearNet, breakEvenMonths,
    allocation: { managerSupport: share(a.managerSupport), dataAnalysis: share(a.dataAnalysis), talentDevelopment: share(a.talentDevelopment), employeeExperience: share(a.employeeExperience) },
    warnings,
  };
}

export function capacityByRole(m: WorkspaceModel) {
  return m.roles.map((r) => {
    const available = n(r.fte) * n(r.availableHoursPerFte);
    const modelled = m.processes.filter((p) => p.ownerRoleId === r.id).reduce((s, p) => s + baselineHours(p, m.roles), 0);
    return { id: r.id, title: r.title, available, modelled, utilisation: available > 0 ? modelled / available : 0 };
  });
}

// ---------- maturity ----------
export function domainMaturity(answers: Answers) {
  return HR_DOMAINS.map((d) => {
    const qs = MATURITY_QUESTIONS.filter((q) => q.domain === d.id);
    const answered = qs.filter((q) => typeof answers[q.id] === 'number');
    const score = answered.length ? answered.reduce((s, q) => s + (answers[q.id] as number), 0) / answered.length : null;
    return { domain: d.id, label: d.fr, score, coverage: qs.length ? answered.length / qs.length : 0, answered: answered.length, total: qs.length };
  });
}

// ---------- opportunities ----------
export type OpportunityCategory = 'simplification' | 'standardisation' | 'data_quality' | 'training' | 'ai_assistance' | 'supervised_automation';
export const OPPORTUNITY_LABELS: Record<OpportunityCategory, string> = {
  simplification: 'Simplification', standardisation: 'Standardisation', data_quality: 'Qualité des données',
  training: 'Formation', ai_assistance: 'Assistance IA', supervised_automation: 'Automatisation supervisée',
};
export interface Opportunity {
  id: string; category: OpportunityCategory; processId: string; processName: string; domain: DomainId;
  reason: string; evidenced: boolean; humanAuthority: string | null; releasedHours: number;
}

export function buildOpportunities(m: WorkspaceModel): Opportunity[] {
  const out: Opportunity[] = [];
  const scen = computeScenario(m);
  m.processes.forEach((p) => {
    const evidenced = p.evidence.trim().length > 0;
    const base = baselineHours(p, m.roles);
    const released = scen.perProcess.find((s) => s.processId === p.id)?.releasedHours ?? 0;
    const authority = p.sensitive !== 'none' ? `${SENSITIVE_LABELS[p.sensitive]} : décision réservée à un humain habilité (${p.approver || 'approbateur à désigner'}).` : null;
    const push = (category: OpportunityCategory, reason: string) => out.push({ id: `${category}:${p.id}`, category, processId: p.id, processName: p.name, domain: p.domain, reason, evidenced, humanAuthority: authority, releasedHours: released });
    if (p.bottleneck.trim() && base >= 40) push('simplification', `Goulot déclaré (« ${p.bottleneck.trim()} ») sur ${Math.round(base)} h/an modélisées (seuil : 40 h).`);
    if (!p.standardised) push('standardisation', 'Processus déclaré non standardisé : préalable à toute assistance IA.');
    if (p.dataQualityIssue) push('data_quality', 'Problème de qualité des données déclaré : à corriger avant d’automatiser.');
    if (p.trainingGap) push('training', 'Écart de compétences déclaré pour l’équipe responsable.');
    if (p.aiAssistPotential >= 40) push('ai_assistance', `Potentiel d’assistance estimé à ${p.aiAssistPotential} % : l’IA prépare, l’humain vérifie et décide.`);
    // A high AI share never implies autonomy: supervised automation requires low/medium risk,
    // no sensitive decision, standardised work and clean data.
    if (p.aiAssistPotential >= 70 && p.risk !== 'high' && p.sensitive === 'none' && p.standardised && !p.dataQualityIssue)
      push('supervised_automation', `Potentiel ${p.aiAssistPotential} %, risque ${p.risk === 'low' ? 'faible' : 'moyen'}, processus standardisé et données fiables : automatisation sous contrôle humain (${p.approver || 'approbateur à désigner'}).`);
  });
  return out;
}

export function automationBlockReason(p: ProcessRow): string | null {
  if (p.aiAssistPotential < 70) return null;
  const r: string[] = [];
  if (p.sensitive !== 'none') r.push('décision sensible');
  if (p.risk === 'high') r.push('risque élevé');
  if (!p.standardised) r.push('processus non standardisé');
  if (p.dataQualityIssue) r.push('données non fiables');
  return r.length ? `Potentiel élevé mais automatisation exclue : ${r.join(', ')}.` : null;
}

// ---------- completeness & summary ----------
export function dataCompleteness(m: WorkspaceModel) {
  const fields: (keyof ProcessRow)[] = ['evidence', 'tools', 'baselineKpi', 'targetKpi', 'approver', 'ownerRoleId'];
  const procFilled = m.processes.reduce((s, p) => s + fields.filter((f) => String(p[f] ?? '').trim()).length, 0);
  const procTotal = m.processes.length * fields.length;
  const roleOk = m.roles.filter((r) => r.fte > 0 && r.availableHoursPerFte > 0 && r.loadedHourlyCost > 0).length;
  const answered = MATURITY_QUESTIONS.filter((q) => typeof m.answers[q.id] === 'number').length;
  const parts = [
    { label: 'Fiches processus', ratio: procTotal ? procFilled / procTotal : 0 },
    { label: 'Rôles chiffrés', ratio: m.roles.length ? roleOk / m.roles.length : 0 },
    { label: 'Questionnaire maturité', ratio: answered / MATURITY_QUESTIONS.length },
  ];
  return { parts, overall: parts.reduce((s, p) => s + p.ratio, 0) / parts.length };
}

export function actionPriority(a: RoadmapAction) {
  // Documented rule: score = impact × 2 − effort − (1 if it depends on another action).
  return a.impact * 2 - a.effort - (a.dependsOn ? 1 : 0);
}
export function isQuickWin(a: RoadmapAction) { return a.impact >= 3 && a.effort <= 2 && !a.dependsOn; }
export function isPrerequisite(a: RoadmapAction, all: RoadmapAction[]) { return all.some((o) => o.dependsOn === a.id); }
export function sortedRoadmap(all: RoadmapAction[]) {
  return [...all].sort((a, b) => a.horizon - b.horizon || actionPriority(b) - actionPriority(a));
}

export function topPriorities(m: WorkspaceModel) {
  const order: OpportunityCategory[] = ['data_quality', 'standardisation', 'simplification', 'supervised_automation', 'ai_assistance', 'training'];
  return buildOpportunities(m).filter((o) => o.evidenced)
    .sort((a, b) => b.releasedHours - a.releasedHours || order.indexOf(a.category) - order.indexOf(b.category)).slice(0, 3);
}

export function nextAction(m: WorkspaceModel): { label: string; view: string } {
  if (!m.roles.length) return { label: 'Décrire l’équipe RH (rôles, ETP, coût horaire).', view: 'organisation' };
  if (!m.processes.length) return { label: 'Inventorier les premiers processus RH.', view: 'processus' };
  const missingEvidence = m.processes.filter((p) => !p.evidence.trim()).length;
  if (missingEvidence) return { label: `Documenter la preuve de ${missingEvidence} processus (source des volumes).`, view: 'processus' };
  const answered = MATURITY_QUESTIONS.filter((q) => typeof m.answers[q.id] === 'number').length;
  if (answered < MATURITY_QUESTIONS.length) return { label: `Compléter le questionnaire de maturité (${answered}/${MATURITY_QUESTIONS.length}).`, view: 'diagnostic' };
  if (!m.roadmap.length) return { label: 'Transformer une opportunité en action de feuille de route.', view: 'diagnostic' };
  return { label: 'Faire valider la feuille de route par la DRH et générer le rapport.', view: 'feuille-de-route' };
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function emptyProcess(domain: DomainId = 'paie', ownerRoleId = ''): ProcessRow {
  return {
    id: uid(), name: '', domain, ownerRoleId, volumeBasis: 'team', annualOccurrences: 0, minutesPerOccurrence: 0,
    evidence: '', tools: '', input: '', output: '', painPoint: '', bottleneck: '', proposedChange: '',
    risk: 'medium', sensitive: 'none', baselineKpi: '', targetKpi: '', approver: '', aiAssistPotential: 0,
    standardised: false, dataQualityIssue: false, trainingGap: false, reductionPct: 0, adoptionPct: 0, reviewMinutes: 0,
  };
}

export function emptyModel(company?: Partial<CompanyContext>): WorkspaceModel {
  return {
    version: 1,
    company: { name: '', sector: '', headcount: null, sites: '', notes: '', ...company },
    roles: [], processes: [], answers: {},
    scenario: { preset: 'base', annualToolsCost: 0, implementationCost: 0, trainingCost: 0, cashFraction: 0, weeksPerYear: 44, allocation: { managerSupport: 25, dataAnalysis: 25, talentDevelopment: 25, employeeExperience: 25 } },
    roadmap: [],
  };
}

export const fmtH = (v: number) => `${Math.round(v).toLocaleString('fr-FR')} h`;
export const fmtMAD = (v: number) => `${Math.round(v).toLocaleString('fr-FR')} MAD`;
