import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Network, Target, ListChecks, AlertTriangle } from 'lucide-react';

const DEMO = '[Démo Atlas]';
const db = supabase as unknown as { from: (t: string) => any };
const norm = (s?: string | null) => (s ?? '').trim().toLowerCase();

interface RoleRow {
  id: string; title: string; dept: string; holder: string | null; critical: boolean;
  tasks: { name: string; hours: number; process: string }[];
  kpis: string[];
}

async function load(companyId: string) {
  const q = (t: string) => db.from(t).select('*').eq('company_id', companyId);
  const [pos, dep, proc, tasks, objs, links] = await Promise.all(
    ['positions', 'departments', 'business_processes', 'process_tasks', 'strategic_objectives', 'objective_capabilities'].map(q),
  );
  for (const r of [pos, dep, proc, tasks, objs, links]) if (r.error) throw r.error;
  const positions = (pos.data ?? []).filter((p: any) => !String(p.notes ?? '').startsWith(DEMO));
  const deptName = new Map((dep.data ?? []).map((d: any) => [d.id, d.name]));
  const processes = (proc.data ?? []).filter((p: any) => !String(p.name).startsWith(DEMO));
  const procById = new Map(processes.map((p: any) => [p.id, p]));
  const realObjs = (objs.data ?? []).filter((o: any) => !String(o.title).startsWith(DEMO));
  const objById = new Map(realObjs.map((o: any) => [o.id, o]));
  const kpisByCap = new Map<string, Set<string>>();
  for (const l of links.data ?? []) {
    const o: any = objById.get(l.objective_id);
    if (!o) continue;
    const label = o.target_kpi ? `${o.target_kpi} — ${o.title}` : o.title;
    if (!kpisByCap.has(l.capability_id)) kpisByCap.set(l.capability_id, new Set());
    kpisByCap.get(l.capability_id)!.add(label);
  }
  const realTasks = (tasks.data ?? []).filter((t: any) => procById.has(t.process_id));
  const roles: RoleRow[] = positions.map((p: any) => {
    const mine = realTasks.filter((t: any) => norm(t.role_name) === norm(p.title));
    const kpis = new Set<string>();
    mine.forEach((t: any) => {
      const cap = (procById.get(t.process_id) as any)?.capability_id;
      kpisByCap.get(cap)?.forEach((k) => kpis.add(k));
    });
    return {
      id: p.id, title: p.title, dept: (deptName.get(p.department_id) as string) ?? '—',
      holder: p.current_holder_name, critical: !!p.is_critical,
      tasks: mine.map((t: any) => ({ name: t.name, hours: Number(t.hours_per_week) || 0, process: (procById.get(t.process_id) as any)?.name })),
      kpis: [...kpis],
    };
  });
  const titles = new Set(positions.map((p: any) => norm(p.title)));
  const orphanTasks = realTasks.filter((t: any) => !titles.has(norm(t.role_name)));
  return { roles, orphanTasks: orphanTasks.length, objectives: realObjs.length };
}

export function OrgRoleDashboard({ fr }: { fr: boolean }) {
  const { companyId } = useCompanyId();
  const { data, isLoading, error } = useQuery({
    queryKey: ['org-role-dashboard', companyId], enabled: !!companyId, queryFn: () => load(companyId!),
  });

  const linked = data?.roles.filter((r) => r.tasks.length).length ?? 0;
  const withKpi = data?.roles.filter((r) => r.kpis.length).length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Network className="h-5 w-5 text-primary" />
          {fr ? 'Organigramme → tâches → KPI' : 'Org chart → tasks → KPIs'}</CardTitle>
        <CardDescription>{fr ? "Données réelles de votre entreprise (démo Atlas exclue)." : 'Your real company data (Atlas demo excluded).'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /> :
         error ? <p className="text-sm text-destructive">{(error as Error).message}</p> :
         !data || data.roles.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <p className="text-sm text-muted-foreground">{fr ? "Aucun poste réel dans l'organigramme." : 'No real positions in the org chart yet.'}</p>
            <Button asChild size="sm" variant="outline"><Link to="/workflow/assess/workforce">{fr ? "Compléter l'organigramme" : 'Build org chart'}</Link></Button>
          </div>
        ) : (<>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label={fr ? 'Postes' : 'Roles'} value={data.roles.length} />
            <Stat label={fr ? 'Postes avec tâches' : 'Roles with tasks'} value={`${linked}/${data.roles.length}`} />
            <Stat label={fr ? 'Postes reliés à un KPI' : 'Roles linked to a KPI'} value={`${withKpi}/${data.roles.length}`} />
            <Stat label={fr ? 'Tâches sans poste' : 'Unassigned tasks'} value={data.orphanTasks} warn={data.orphanTasks > 0} />
          </div>
          <div className="space-y-2">
            {data.roles.map((r) => (
              <div key={r.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{r.title}</span>
                  <span className="text-xs text-muted-foreground">{r.dept}{r.holder ? ` · ${r.holder}` : ''}</span>
                  {r.critical && <Badge variant="destructive" className="text-xs">{fr ? 'Critique' : 'Critical'}</Badge>}
                </div>
                <div className="grid md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="flex items-center gap-1 font-medium mb-1"><ListChecks className="h-3.5 w-3.5" />{fr ? 'Tâches' : 'Tasks'}</p>
                    {r.tasks.length ? r.tasks.map((t, i) => (
                      <p key={i} className="text-muted-foreground">{t.name} · {t.hours} h/sem <span className="opacity-70">({t.process})</span></p>
                    )) : <p className="flex items-center gap-1 text-muted-foreground"><AlertTriangle className="h-3 w-3" />{fr ? 'Aucune tâche liée (intitulé exact requis)' : 'No task linked (exact title required)'}</p>}
                  </div>
                  <div>
                    <p className="flex items-center gap-1 font-medium mb-1"><Target className="h-3.5 w-3.5" />KPI</p>
                    {r.kpis.length ? r.kpis.map((k) => <p key={k} className="text-muted-foreground">{k}</p>)
                      : <p className="text-muted-foreground">{fr ? 'À relier via objectif → capacité' : 'Link via objective → capability'}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button asChild size="sm" variant="outline"><Link to="/organisation">{fr ? 'Ouvrir le tableau Postes · Tâches · KPI' : 'Open Roles · Tasks · KPIs dashboard'}</Link></Button>
        </>)}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{label}</p>
    <p className={`text-xl font-semibold ${warn ? 'text-destructive' : ''}`}>{value}</p></div>;
}
