import { DIMENSIONS, HR_ROLES, HR_UNIVERSAL, MODULES, USE_CASES } from '@/config/diagnosticEngine';
import type { ParticipantRow } from '@/hooks/useDiagnosticEngine';

const getUniversalConcernLabel = (value: string) =>
  HR_UNIVERSAL.find((q) => q.id === 'u_concern')?.options?.find((o) => o.value === value)?.label ?? value;


export interface CohortFilters {
  role?: string;
  companySize?: string;
  sector?: string;
}

export interface CohortInsights {
  count: number;
  averageScore: number;
  averageDimensions: { key: string; label: string; short: string; value: number }[];
  roles: { key: string; label: string; count: number }[];
  painPoints: { label: string; count: number }[];
  useCases: { label: string; count: number }[];
  maturity: { label: string; count: number }[];
  modules: { label: string; count: number }[];
  concerns: { label: string; count: number }[];
  sectors: { label: string; count: number }[];
  sizes: { label: string; count: number }[];
  openAnswers: string[];
}

const roleLabel = (key: string) => HR_ROLES.find((r) => r.key === key)?.label ?? key;

const top = (tally: Record<string, number>, n: number) =>
  Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({ label, count }));

export function filterParticipants(rows: ParticipantRow[], f: CohortFilters) {
  return rows.filter(
    (r) =>
      (!f.role || r.hr_function === f.role) &&
      (!f.companySize || r.company_size === f.companySize) &&
      (!f.sector || r.sector === f.sector),
  );
}

export function buildCohortInsights(rows: ParticipantRow[]): CohortInsights {
  const count = rows.length;
  const avg = (fn: (r: ParticipantRow) => number) =>
    count ? Math.round(rows.reduce((s, r) => s + (fn(r) || 0), 0) / count) : 0;

  const pains: Record<string, number> = {};
  const cases: Record<string, number> = {};
  const mods: Record<string, number> = {};
  const roles: Record<string, number> = {};
  const maturity: Record<string, number> = { 'Explorateur IA': 0, 'Optimisateur RH': 0, 'Transformateur IA': 0, 'HR AI Leader': 0 };
  const concerns: Record<string, number> = {};
  const sectors: Record<string, number> = {};
  const sizes: Record<string, number> = {};
  const openAnswers: string[] = [];

  for (const r of rows) {
    roles[r.hr_function] = (roles[r.hr_function] ?? 0) + 1;
    if (r.profile_label) maturity[r.profile_label] = (maturity[r.profile_label] ?? 0) + 1;
    if (r.sector) sectors[r.sector] = (sectors[r.sector] ?? 0) + 1;
    if (r.company_size) sizes[r.company_size] = (sizes[r.company_size] ?? 0) + 1;

    for (const f of r.top_frictions ?? []) pains[f.label] = (pains[f.label] ?? 0) + 1;
    for (const u of r.top_use_cases ?? []) {
      const label = USE_CASES.find((x) => x.id === u.id)?.title ?? u.title;
      cases[label] = (cases[label] ?? 0) + 1;
    }
    for (const m of r.recommended_modules ?? []) {
      const label = MODULES.find((x) => x.id === m.id)?.title ?? m.title;
      mods[label] = (mods[label] ?? 0) + 1;
    }
    const concern = r.answers?.u_concern;
    if (typeof concern === 'string') {
      const label = getUniversalConcernLabel(concern);
      concerns[label] = (concerns[label] ?? 0) + 1;
    }
    for (const [key, value] of Object.entries(r.answers ?? {})) {
      if (key.endsWith('_open') && typeof value === 'string' && value.trim().length > 3) openAnswers.push(value.trim());
    }
  }

  return {
    count,
    averageScore: avg((r) => r.opportunity_score),
    averageDimensions: DIMENSIONS.map((d) => ({
      key: d.key,
      label: d.label,
      short: d.short,
      value: avg((r) => Number(r.dimension_scores?.[d.key] ?? 0)),
    })),
    roles: Object.entries(roles)
      .sort((a, b) => b[1] - a[1])
      .map(([key, c]) => ({ key, label: roleLabel(key), count: c })),
    painPoints: top(pains, 10),
    useCases: top(cases, 10),
    maturity: Object.entries(maturity).map(([label, c]) => ({ label, count: c })),
    modules: top(mods, 10),
    concerns: top(concerns, 8),
    sectors: top(sectors, 10),
    sizes: top(sizes, 10),
    openAnswers: openAnswers.slice(0, 30),
  };
}
