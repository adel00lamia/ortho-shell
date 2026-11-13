import { z } from 'zod';
import { emptyModel, HR_DOMAINS, type WorkspaceModel } from './model';

const domainIds = HR_DOMAINS.map((d) => d.id) as [string, ...string[]];
const num = (d = 0) => z.number().finite().catch(d);
const str = z.string().max(4000).catch('');
const bool = z.boolean().catch(false);

const role = z.object({
  id: z.string(), title: str, fte: num(), domains: z.array(z.enum(domainIds)).catch([]),
  responsibilities: str, availableHoursPerFte: num(), loadedHourlyCost: num(), competencies: str,
});
const proc = z.object({
  id: z.string(), name: str, domain: z.enum(domainIds).catch('paie'), ownerRoleId: str,
  volumeBasis: z.enum(['team', 'person']).catch('team'), annualOccurrences: num(), minutesPerOccurrence: num(),
  evidence: str, tools: str, input: str, output: str, painPoint: str, bottleneck: str, proposedChange: str,
  risk: z.enum(['low', 'medium', 'high']).catch('medium'),
  sensitive: z.enum(['none', 'payroll_release', 'hiring', 'discipline', 'career']).catch('none'),
  baselineKpi: str, targetKpi: str, approver: str, aiAssistPotential: num(), standardised: bool,
  dataQualityIssue: bool, trainingGap: bool, reductionPct: num(), adoptionPct: num(), reviewMinutes: num(),
});
const action = z.object({
  id: z.string(), title: str, category: str, sourceType: z.enum(['process', 'domain']).catch('process'),
  sourceId: str, sourceLabel: str, reason: str, owner: str, approver: str, dueDate: str,
  impact: num(3), effort: num(3), dependsOn: str, risk: str, kpiBaseline: str, kpiTarget: str,
  status: z.enum(['proposed', 'approved', 'in_progress', 'done', 'blocked']).catch('proposed'),
  horizon: z.union([z.literal(30), z.literal(60), z.literal(90)]).catch(30), validation: str, proof: str,
});
const schema = z.object({
  version: z.literal(1),
  company: z.object({ name: str, sector: str, headcount: z.number().finite().nullable().catch(null), sites: str, notes: str }),
  roles: z.array(role), processes: z.array(proc),
  answers: z.record(z.number().min(1).max(4).nullable()).catch({}),
  scenario: z.object({
    preset: z.enum(['conservative', 'base', 'ambitious']).catch('base'), annualToolsCost: num(), implementationCost: num(),
    trainingCost: num(), cashFraction: num(0), weeksPerYear: num(44),
    allocation: z.object({ managerSupport: num(25), dataAnalysis: num(25), talentDevelopment: num(25), employeeExperience: num(25) }),
  }),
  roadmap: z.array(action),
});

/** Parse saved JSON safely; returns null on any structural problem so callers fall back. */
export function parseModel(raw: string | null): WorkspaceModel | null {
  if (!raw) return null;
  try {
    const result = schema.safeParse(JSON.parse(raw));
    return result.success ? (result.data as unknown as WorkspaceModel) : null;
  } catch { return null; }
}

export const liveKey = (userId: string, companyId: string) => `qimatak.hr-workspace.v1.${userId}.${companyId}`;
export const DEMO_KEY = 'qimatak.hr-workspace.demo.v1';

export function loadModel(key: string, fallback: () => WorkspaceModel): WorkspaceModel {
  try { return parseModel(localStorage.getItem(key)) ?? fallback(); } catch { return fallback(); }
}
export function saveModel(key: string, m: WorkspaceModel) {
  try { localStorage.setItem(key, JSON.stringify(m)); } catch { /* quota / private mode: keep in memory */ }
}
export { emptyModel };
