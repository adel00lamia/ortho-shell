import { supabase } from '@/integrations/supabase/client';
import { analyseTask } from '@/lib/humanAiScoring';

// Fictional demo dataset "Atlas Industries" (industrial manufacturer, ~300 staff). Illustrative only.
const db = supabase as unknown as { from: (t: string) => any };
const DEMO = '[Démo Atlas] ';

type C = [number, number, number, number, number, number, number, number, number];
// order: repetitiveness, data, rules, complexity, human, judgment, compliance, strategic, frequency
const crit = (v: C) => ({
  repetitiveness: v[0], data_availability: v[1], rules_clarity: v[2], complexity: v[3], human_interaction: v[4],
  judgment: v[5], compliance_risk: v[6], strategic_importance: v[7], frequency: v[8],
});

const OBJECTIVES = [
  { key: 'export', title: 'Augmenter le CA export de 25 % en 3 ans', category: 'growth', horizon: '3 ans', priority: 1, target_kpi: 'CA export (MAD)' },
  { key: 'otd', title: 'Atteindre 95 % de livraisons à l’heure', category: 'operations', horizon: '12 mois', priority: 1, target_kpi: 'OTD %' },
  { key: 'cost', title: 'Réduire le coût de non-qualité de 30 %', category: 'efficiency', horizon: '18 mois', priority: 2, target_kpi: 'Coût non-qualité (MAD)' },
  { key: 'digital', title: 'Digitaliser les fonctions support', category: 'digital', horizon: '2 ans', priority: 2, target_kpi: '% processus digitalisés' },
];

const CAPS = [
  { key: 'sales', name: 'Développement commercial export', domain: 'Commercial', current_maturity: 2, target_maturity: 4 },
  { key: 'plan', name: 'Planification & supply chain', domain: 'Opérations', current_maturity: 2, target_maturity: 4 },
  { key: 'quality', name: 'Maîtrise qualité', domain: 'Qualité', current_maturity: 3, target_maturity: 5 },
  { key: 'fin', name: 'Finance & contrôle de gestion', domain: 'Finance', current_maturity: 3, target_maturity: 4 },
  { key: 'hr', name: 'Gestion des talents', domain: 'RH', current_maturity: 2, target_maturity: 4 },
];

const LINKS: [string, string, number][] = [
  ['export', 'sales', 5], ['export', 'plan', 3], ['otd', 'plan', 5], ['otd', 'quality', 3],
  ['cost', 'quality', 5], ['digital', 'fin', 4], ['digital', 'hr', 4],
];

const PROCS = [
  { key: 'lead', cap: 'sales', name: 'Prospection & offres export', owner_role: 'Responsable export' },
  { key: 's&op', cap: 'plan', name: 'Planification production (S&OP)', owner_role: 'Planificateur' },
  { key: 'ctrl', cap: 'quality', name: 'Contrôle qualité & non-conformités', owner_role: 'Technicien qualité' },
  { key: 'close', cap: 'fin', name: 'Clôture mensuelle & reporting', owner_role: 'Comptable' },
  { key: 'recruit', cap: 'hr', name: 'Recrutement & onboarding', owner_role: 'Chargé RH' },
];

const TASKS: { proc: string; name: string; role_name: string; hours_per_week: number; c: C }[] = [
  { proc: 'lead', name: 'Qualification des leads entrants', role_name: 'Commercial export', hours_per_week: 8, c: [4, 4, 3, 2, 3, 3, 2, 4, 5] },
  { proc: 'lead', name: 'Rédaction des offres techniques', role_name: 'Commercial export', hours_per_week: 10, c: [3, 4, 3, 3, 2, 3, 2, 4, 4] },
  { proc: 'lead', name: 'Négociation clients grands comptes', role_name: 'Responsable export', hours_per_week: 6, c: [1, 2, 1, 5, 5, 5, 3, 5, 2] },
  { proc: 's&op', name: 'Prévision de la demande', role_name: 'Planificateur', hours_per_week: 8, c: [4, 5, 4, 3, 1, 3, 1, 5, 4] },
  { proc: 's&op', name: 'Ordonnancement atelier', role_name: 'Planificateur', hours_per_week: 12, c: [4, 4, 4, 3, 2, 2, 2, 4, 5] },
  { proc: 'ctrl', name: 'Saisie des relevés de contrôle', role_name: 'Technicien qualité', hours_per_week: 10, c: [5, 5, 5, 1, 1, 1, 2, 2, 5] },
  { proc: 'ctrl', name: 'Analyse des causes de non-conformité', role_name: 'Ingénieur qualité', hours_per_week: 6, c: [2, 3, 2, 4, 3, 4, 4, 5, 3] },
  { proc: 'close', name: 'Rapprochements bancaires', role_name: 'Comptable', hours_per_week: 6, c: [5, 5, 5, 1, 1, 1, 3, 2, 5] },
  { proc: 'close', name: 'Commentaire des écarts budgétaires', role_name: 'Contrôleur de gestion', hours_per_week: 4, c: [3, 4, 3, 3, 2, 4, 2, 4, 3] },
  { proc: 'recruit', name: 'Tri des candidatures', role_name: 'Chargé RH', hours_per_week: 8, c: [4, 4, 3, 2, 2, 3, 4, 3, 5] },
  { proc: 'recruit', name: 'Entretiens finaux', role_name: 'Chargé RH', hours_per_week: 5, c: [2, 2, 2, 4, 5, 5, 4, 4, 3] },
];

// Organisational chart: departments + positions whose titles match the task roles exactly.
const DEPTS = [
  { key: 'dg', name: 'Direction générale', parent: null, level: 0 },
  { key: 'com', name: 'Commercial', parent: 'dg', level: 1 },
  { key: 'ops', name: 'Opérations', parent: 'dg', level: 1 },
  { key: 'qual', name: 'Qualité', parent: 'ops', level: 2 },
  { key: 'fin', name: 'Finance', parent: 'dg', level: 1 },
  { key: 'rh', name: 'Ressources humaines', parent: 'dg', level: 1 },
];
const POSITIONS: { title: string; dept: string; reports: string | null; critical: boolean; skills: string[] }[] = [
  { title: 'Directeur général', dept: 'dg', reports: null, critical: true, skills: ['Pilotage stratégique'] },
  { title: 'Responsable export', dept: 'com', reports: 'Directeur général', critical: true, skills: ['Négociation', 'Anglais commercial'] },
  { title: 'Commercial export', dept: 'com', reports: 'Responsable export', critical: false, skills: ['Prospection', 'CRM'] },
  { title: 'Directeur des opérations', dept: 'ops', reports: 'Directeur général', critical: true, skills: ['Lean management'] },
  { title: 'Planificateur', dept: 'ops', reports: 'Directeur des opérations', critical: true, skills: ['Prévision', 'ERP'] },
  { title: 'Ingénieur qualité', dept: 'qual', reports: 'Directeur des opérations', critical: true, skills: ['Résolution de problèmes', 'ISO 9001'] },
  { title: 'Technicien qualité', dept: 'qual', reports: 'Ingénieur qualité', critical: false, skills: ['Métrologie'] },
  { title: 'Contrôleur de gestion', dept: 'fin', reports: 'Directeur général', critical: false, skills: ['Analyse financière', 'Excel'] },
  { title: 'Comptable', dept: 'fin', reports: 'Contrôleur de gestion', critical: false, skills: ['Comptabilité générale'] },
  { title: 'Chargé RH', dept: 'rh', reports: 'Directeur général', critical: false, skills: ['Recrutement', 'Droit du travail'] },
];

async function clearAtlasOrg(companyId: string) {
  await db.from('positions').delete().eq('company_id', companyId).like('notes', `${DEMO}%`);
  await db.from('departments').delete().eq('company_id', companyId).like('name', `${DEMO}%`).not('parent_department_id', 'is', null).gt('level', 1);
  await db.from('departments').delete().eq('company_id', companyId).like('name', `${DEMO}%`).gt('level', 0);
  await db.from('departments').delete().eq('company_id', companyId).like('name', `${DEMO}%`);
}

async function seedAtlasOrg(companyId: string) {
  const deptIds: Record<string, string> = {};
  for (const d of DEPTS) {
    const [row] = await ins('departments', [{ name: DEMO + d.name, level: d.level, parent_department_id: d.parent ? deptIds[d.parent] : null }], companyId);
    deptIds[d.key] = row.id;
  }
  const posIds: Record<string, string> = {};
  for (const p of POSITIONS) {
    const [row] = await ins('positions', [{ title: p.title, department_id: deptIds[p.dept], reports_to_position_id: p.reports ? posIds[p.reports] : null, is_critical: p.critical, skills_required: p.skills, status: 'filled', notes: `${DEMO}poste fictif` }], companyId);
    posIds[p.title] = row.id;
  }
  return { departments: DEPTS.length, positions: POSITIONS.length };
}

async function ins(table: string, rows: Record<string, unknown>[], companyId: string) {
  const { data, error } = await db.from(table).insert(rows.map((r) => ({ ...r, company_id: companyId }))).select('*');
  if (error) throw error;
  return data as any[];
}

export async function clearAtlasDemo(companyId: string) {
  await clearAtlasOrg(companyId);
  const { data: objs } = await db.from('strategic_objectives').select('id').eq('company_id', companyId).like('title', `${DEMO}%`);
  const { data: caps } = await db.from('business_capabilities').select('id').eq('company_id', companyId).like('name', `${DEMO}%`);
  const capIds = (caps ?? []).map((c: any) => c.id);
  if (capIds.length) {
    const { data: procs } = await db.from('business_processes').select('id').eq('company_id', companyId).in('capability_id', capIds);
    const pIds = (procs ?? []).map((p: any) => p.id);
    if (pIds.length) {
      await db.from('process_tasks').delete().eq('company_id', companyId).in('process_id', pIds);
      await db.from('business_processes').delete().eq('company_id', companyId).in('id', pIds);
    }
    await db.from('objective_capabilities').delete().eq('company_id', companyId).in('capability_id', capIds);
    await db.from('business_capabilities').delete().eq('company_id', companyId).in('id', capIds);
  }
  const oIds = (objs ?? []).map((o: any) => o.id);
  if (oIds.length) await db.from('strategic_objectives').delete().eq('company_id', companyId).in('id', oIds);
}

export async function seedAtlasDemo(companyId: string) {
  await clearAtlasDemo(companyId);
  const objs = await ins('strategic_objectives', OBJECTIVES.map(({ key, ...o }) => ({ ...o, title: DEMO + o.title })), companyId);
  const caps = await ins('business_capabilities', CAPS.map(({ key, ...c }) => ({ ...c, name: DEMO + c.name })), companyId);
  const oId = (k: string) => objs[OBJECTIVES.findIndex((o) => o.key === k)].id;
  const cId = (k: string) => caps[CAPS.findIndex((c) => c.key === k)].id;
  await ins('objective_capabilities', LINKS.map(([o, c, criticality]) => ({ objective_id: oId(o), capability_id: cId(c), criticality })), companyId);
  const procs = await ins('business_processes', PROCS.map(({ key, cap, ...p }) => ({ ...p, capability_id: cId(cap) })), companyId);
  const pId = (k: string) => procs[PROCS.findIndex((p) => p.key === k)].id;
  // Run the Human + AI analysis and store the recommended operating mode on each task.
  await ins('process_tasks', TASKS.map((t) => {
    const criteria = crit(t.c);
    return { process_id: pId(t.proc), name: t.name, role_name: t.role_name, hours_per_week: t.hours_per_week, criteria, operating_mode: analyseTask(criteria, t.hours_per_week).mode };
  }), companyId);
  const org = await seedAtlasOrg(companyId);
  return { ...org, objectives: objs.length, capabilities: caps.length, processes: procs.length, tasks: TASKS.length };
}
