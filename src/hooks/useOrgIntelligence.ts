import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { analyseTask, type OperatingMode } from '@/lib/humanAiScoring';

const DEMO = '[Démo Atlas]';
const db = supabase as unknown as { from: (t: string) => any };
export const norm = (s?: string | null) => (s ?? '').replace(DEMO, '').trim().toLowerCase();

export interface RoleTask { id: string; name: string; hours: number; process: string; mode: OperatingMode; aiSuitability: number; capacityGain: number }
export interface ObjectiveKpi { objective: string; kpi: string | null; priority: number; criticality: number }
export interface MeasuredKpi { id: string; name: string; unit: string | null; baseline: number | null; target: number | null; actual: number | null; direction: string; progress: number | null; diagnostic: string }
export interface OrgRole {
  id: string; title: string; deptId: string | null; dept: string; holder: string | null; critical: boolean;
  reportsTo: string | null; matchScore: number | null;
  tasks: RoleTask[]; objectiveKpis: ObjectiveKpi[]; measuredKpis: MeasuredKpi[];
  hours: number; capacityGain: number; exposure: number; skillGaps: number;
}

function progressOf(m: any): number | null {
  const b = m.baseline_value, t = m.target_value, a = m.actual_value;
  if (b == null || t == null || a == null || Number(t) === Number(b)) return null;
  return Math.round(Math.max(0, Math.min(150, ((a - b) / (t - b)) * 100)));
}

async function load(companyId: string) {
  const q = (t: string) => db.from(t).select('*').eq('company_id', companyId);
  const res = await Promise.all(['positions', 'departments', 'business_processes', 'process_tasks', 'strategic_objectives', 'objective_capabilities', 'root_cause_diagnostics', 'diagnostic_impact_measurements'].map(q));
  const err = res.find((r) => r.error); if (err) throw err.error;
  const [pos, dep, proc, tasks, objs, links, diags, meas] = res.map((r) => r.data ?? []);

  const positions = pos.filter((p: any) => !String(p.notes ?? '').startsWith(DEMO));
  const departments = dep.filter((d: any) => !String(d.name).startsWith(DEMO));
  const deptName = new Map(departments.map((d: any) => [d.id, d.name]));
  const processes = proc.filter((p: any) => !String(p.name).startsWith(DEMO));
  const procById = new Map<string, any>(processes.map((p: any) => [p.id, p]));
  const objById = new Map<string, any>(objs.filter((o: any) => !String(o.title).startsWith(DEMO)).map((o: any) => [o.id, o]));
  const kpisByCap = new Map<string, ObjectiveKpi[]>();
  for (const l of links) {
    const o = objById.get(l.objective_id); if (!o) continue;
    const arr = kpisByCap.get(l.capability_id) ?? [];
    arr.push({ objective: o.title, kpi: o.target_kpi, priority: o.priority, criticality: l.criticality });
    kpisByCap.set(l.capability_id, arr);
  }
  const diagById = new Map<string, any>(diags.map((d: any) => [d.id, d]));
  const realTasks = tasks.filter((t: any) => procById.has(t.process_id));

  const roles: OrgRole[] = positions.map((p: any) => {
    const dept = (deptName.get(p.department_id) as string) ?? '—';
    const mine: RoleTask[] = realTasks.filter((t: any) => norm(t.role_name) === norm(p.title)).map((t: any) => {
      const a = analyseTask(t.criteria, Number(t.hours_per_week) || 0);
      return { id: t.id, name: t.name, hours: Number(t.hours_per_week) || 0, process: procById.get(t.process_id)?.name, mode: (t.operating_mode as OperatingMode) || a.mode, aiSuitability: a.aiSuitability, capacityGain: a.capacityGain };
    });
    const okMap = new Map<string, ObjectiveKpi>();
    mine.forEach((t) => {
      const cap = realTasks.find((x: any) => x.id === t.id) && procById.get(realTasks.find((x: any) => x.id === t.id).process_id)?.capability_id;
      (kpisByCap.get(cap) ?? []).forEach((k) => okMap.set(k.objective, k));
    });
    const measured: MeasuredKpi[] = meas.filter((m: any) => {
      const d = diagById.get(m.diagnostic_id); if (!d) return false;
      return (d.department && norm(d.department) === norm(dept)) || norm(d.affected_population).includes(norm(p.title));
    }).map((m: any) => ({ id: m.id, name: m.kpi_name, unit: m.unit, baseline: m.baseline_value, target: m.target_value, actual: m.actual_value, direction: m.direction, progress: progressOf(m), diagnostic: diagById.get(m.diagnostic_id)?.title }));
    const hours = mine.reduce((s, t) => s + t.hours, 0);
    const exposure = hours ? Math.round(mine.reduce((s, t) => s + t.aiSuitability * t.hours, 0) / hours) : 0;
    const req = Array.isArray(p.skills_required) ? p.skills_required : [];
    const cur = Array.isArray(p.skills_current) ? p.skills_current : [];
    const curNames = new Set(cur.map((s: any) => norm(typeof s === 'string' ? s : s?.name)));
    const skillGaps = req.filter((s: any) => !curNames.has(norm(typeof s === 'string' ? s : s?.name))).length;
    return {
      id: p.id, title: p.title, deptId: p.department_id, dept, holder: p.current_holder_name, critical: !!p.is_critical,
      reportsTo: p.reports_to_position_id, matchScore: p.match_score, tasks: mine, objectiveKpis: [...okMap.values()], measuredKpis: measured,
      hours, capacityGain: Math.round(mine.reduce((s, t) => s + t.capacityGain, 0) * 10) / 10, exposure, skillGaps,
    };
  });
  const titles = new Set(positions.map((p: any) => norm(p.title)));
  const orphanTasks = realTasks.filter((t: any) => !titles.has(norm(t.role_name))).map((t: any) => ({ name: t.name, role: t.role_name }));
  return { roles, orphanTasks, departments: departments.map((d: any) => ({ id: d.id, name: d.name })) };
}

export function useOrgIntelligence() {
  const { companyId } = useCompanyId();
  return useQuery({ queryKey: ['org-intelligence', companyId], enabled: !!companyId, queryFn: () => load(companyId!) });
}
