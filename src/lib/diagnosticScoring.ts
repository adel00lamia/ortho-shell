import {
  DIMENSIONS,
  DOMAINS,
  GOVERNANCE_REMINDERS,
  MODULES,
  OPPORTUNITY_WEIGHTS,
  PROFILE_BANDS,
  QUICK_WIN_LIBRARY,
  TIME_SAVING_MODEL,
  USE_CASES,
  getAdaptiveFollowUp,
  type DimensionKey,
  type Question,
} from '@/config/diagnosticEngine';

export type AnswerValue = string | string[] | number;
export type AnswerMap = Record<string, AnswerValue>;

export interface DiagnosticResult {
  dimensions: Record<DimensionKey, number>;
  opportunityScore: number;
  profileLabel: string;
  profileLevel: 'Foundation' | 'Practitioner' | 'Advanced';
  profileBlurb: string;
  frictions: { label: string; count: number; tags: string[] }[];
  useCases: { id: string; title: string; description: string; impact: number; ease: number; priority: number; humanControl?: boolean }[];
  timeSaving: { low: number; high: number };
  quickWins: string[];
  governance: string[];
  modules: { id: string; title: string; summary: string; level: string; reason: string }[];
  tags: string[];
}

/** Returns an intentionally varied, role-first question path for a role. */
export function getQuestions(domainKey: string, roleKey: string, answers: AnswerMap = {}): Question[] {
  const domain = DOMAINS[domainKey] ?? DOMAINS.hr;
  const universal = domain.universal;
  const branch = domain.branches[roleKey] ?? [];
  const byId = (id: string) => universal.find((question) => question.id === id);
  const firstUniversal = ['u_time', 'u_priority']
    .map(byId)
    .filter((question): question is Question => !!question);
  const adaptive = answers.u_time !== undefined ? getAdaptiveFollowUp(answers.u_time) : null;
  const firstQuestion = byId('u_time');
  const priorityQuestion = byId('u_priority');
  const openingUniversal = [firstQuestion, ...(adaptive ? [adaptive] : []), priorityQuestion]
    .filter((question): question is Question => !!question);
  const laterUniversal = universal.filter((question) => !openingUniversal.includes(question) && !firstUniversal.includes(question));
  const openingBranch = branch.slice(0, 2);
  const remainingBranch = branch.slice(2);

  // Ask the contextual follow-up immediately after the participant's first answer.
  return [...openingUniversal, ...openingBranch, ...laterUniversal.slice(0, 2), ...remainingBranch, ...laterUniversal.slice(2)];
}

function normalize(q: Question, raw: AnswerValue | undefined, score: { map?: Record<string, number> }): number | null {
  if (raw === undefined || raw === null || raw === '') {
    // A scale left untouched keeps its displayed default (3/5).
    return q.type === 'scale' ? 0.5 : null;
  }
  if (q.type === 'scale') {
    const v = Number(raw);
    if (!Number.isFinite(v)) return null;
    return Math.min(1, Math.max(0, (v - 1) / 4));
  }
  if (q.type === 'multi') {
    const arr = Array.isArray(raw) ? raw : [raw as string];
    const pick = q.pick ?? 3;
    return Math.min(1, arr.length / pick);
  }
  if (q.type === 'single') {
    const key = String(raw);
    if (score.map) return score.map[key] ?? 0.5;
    return 0.5;
  }
  return null;
}

/** Collects every tag selected by the participant, with counts. */
export function collectTags(questions: Question[], answers: AnswerMap): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const q of questions) {
    const raw = answers[q.id];
    if (raw === undefined) continue;
    const values = Array.isArray(raw) ? raw : [String(raw)];
    for (const v of values) {
      const opt = q.options?.find((o) => o.value === v);
      for (const tag of opt?.tags ?? []) tally[tag] = (tally[tag] ?? 0) + 1;
    }
  }
  return tally;
}

export function scoreDiagnostic(
  domainKey: string,
  roleKey: string,
  answers: AnswerMap,
): DiagnosticResult {
  const questions = getQuestions(domainKey, roleKey);

  // ── dimensions ──
  const acc: Record<string, { sum: number; weight: number }> = {};
  for (const d of DIMENSIONS) acc[d.key] = { sum: 0, weight: 0 };

  for (const q of questions) {
    for (const s of q.scores ?? []) {
      const norm = normalize(q, answers[q.id], s);
      if (norm === null) continue;
      const value = s.invert ? 1 - norm : norm;
      acc[s.dim].sum += value * s.weight;
      acc[s.dim].weight += s.weight;
    }
  }

  const dimensions = DIMENSIONS.reduce((out, d) => {
    const a = acc[d.key];
    out[d.key] = a.weight > 0 ? Math.round((a.sum / a.weight) * 100) : 0;
    return out;
  }, {} as Record<DimensionKey, number>);

  // ── composite opportunity score: friction dims direct, maturity dims inverted ──
  let opp = 0;
  for (const d of DIMENSIONS) {
    const raw = d.frictionOriented ? dimensions[d.key] : 100 - dimensions[d.key];
    opp += raw * OPPORTUNITY_WEIGHTS[d.key];
  }
  const opportunityScore = Math.max(0, Math.min(100, Math.round(opp)));

  const band = PROFILE_BANDS.find((b) => dimensions.ai < b.max) ?? PROFILE_BANDS[PROFILE_BANDS.length - 1];

  // ── frictions ──
  const tally = collectTags(questions, answers);
  const labelByTag: Record<string, string> = {};
  for (const q of questions) {
    for (const o of q.options ?? []) {
      for (const t of o.tags ?? []) if (!labelByTag[t]) labelByTag[t] = o.label;
    }
  }
  const frictions = Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag, count]) => ({ label: labelByTag[tag] ?? tag, count, tags: [tag] }));

  // ── use cases ──
  const useCases = USE_CASES
    .filter((u) => u.roles.includes(roleKey) || u.roles.includes('*'))
    .map((u) => {
      const match = u.tags.reduce((n, t) => n + (tally[t] ?? 0), 0);
      const priority = u.impact * 2 + u.ease + match * 1.5;
      return { id: u.id, title: u.title, description: u.description, impact: u.impact, ease: u.ease, priority: Math.round(priority * 10) / 10, humanControl: u.humanControl };
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);

  // ── indicative time saving ──
  const base = Math.max(TIME_SAVING_MODEL.min, opportunityScore * TIME_SAVING_MODEL.hoursPerPoint);
  const timeSaving = {
    low: Math.round(base * (1 - TIME_SAVING_MODEL.spread / 2) * 10) / 10,
    high: Math.round(base * (1 + TIME_SAVING_MODEL.spread / 2) * 10) / 10,
  };

  // ── quick wins ──
  const topTags = Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  const quickWins: string[] = [];
  for (const tag of topTags) {
    for (const w of QUICK_WIN_LIBRARY[tag] ?? []) if (quickWins.length < 3 && !quickWins.includes(w)) quickWins.push(w);
  }
  for (const w of QUICK_WIN_LIBRARY.default) if (quickWins.length < 3) quickWins.push(w);

  // ── modules ──
  const modules = MODULES
    .map((m) => {
      const roleMatch = m.roles.includes(roleKey) ? 3 : m.roles.includes('*') ? 1 : 0;
      const tagMatch = m.tags.includes('*') ? 1 : m.tags.reduce((n, t) => n + (tally[t] ?? 0), 0);
      const govBoost = m.id === 'm_governance' && dimensions.governance < 50 ? 4 : 0;
      const foundationBoost = m.id === 'm_fundamentals' && dimensions.ai < 40 ? 3 : 0;
      return { m, score: roleMatch * 2 + tagMatch + govBoost + foundationBoost };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ m }) => ({
      id: m.id,
      title: m.title,
      summary: m.summary,
      level: band.level,
      reason: m.roles.includes(roleKey) ? 'Aligné sur votre fonction' : 'Socle recommandé pour votre profil',
    }));

  const governance = [...GOVERNANCE_REMINDERS];
  if (useCases.some((u) => u.humanControl)) {
    governance.unshift('Certains cas d’usage prioritaires exigent une relecture humaine systématique.');
  }

  return {
    dimensions,
    opportunityScore,
    profileLabel: band.label,
    profileLevel: band.level,
    profileBlurb: band.blurb,
    frictions,
    useCases,
    timeSaving,
    quickWins,
    governance: governance.slice(0, 5),
    modules,
    tags: topTags,
  };
}
