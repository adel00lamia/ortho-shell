import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, BookOpen, BriefcaseBusiness, ChevronRight, GitBranch, Layers3, Target, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { analyseTask, MODE_LABELS } from '@/lib/humanAiScoring';
import type { TransformationSnapshot } from '@/lib/transformationAnalysis';
import { cn } from '@/lib/utils';

type Level = 'executive' | 'operational' | 'detail';
type NodeKind = 'objective' | 'capability' | 'process' | 'task' | 'role' | 'skill' | 'org';
type GraphNode = { id: string; kind: NodeKind; label: string; meta: string; parentIds: string[]; risk?: number; mode?: string; hours?: number };

const ICONS = { objective: Target, capability: Layers3, process: GitBranch, task: Wrench, role: BriefcaseBusiness, skill: BookOpen, org: Building2 };

export function WorkGraph({ snapshot, fr, positions = [], skillNames = [], departments = [] }: { snapshot: TransformationSnapshot; fr: boolean; positions?: { id?: string; title: string; skills_required: unknown; department_id?: string | null; reports_to_position_id?: string | null }[]; skillNames?: string[]; departments?: { id: string; name: string; parent_department_id: string | null; level: number }[] }) {
  const [level, setLevel] = useState<Level>('operational');
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [params, setParams] = useSearchParams();
  const [modeFilter, setModeFilter] = useState('all');
  const [riskOnly, setRiskOnly] = useState(false);

  const columns = useMemo(() => {
    const objectiveNodes: GraphNode[] = snapshot.objectives.map((item) => ({ id: item.id, kind: 'objective', label: item.title, meta: item.target_kpi || item.category, parentIds: [] }));
    const capabilityNodes: GraphNode[] = snapshot.capabilities.map((item) => ({ id: item.id, kind: 'capability', label: item.name, meta: `${fr ? 'Maturité' : 'Maturity'} ${item.current_maturity} → ${item.target_maturity}`, risk: item.target_maturity - item.current_maturity, parentIds: snapshot.links.filter((link) => link.capability_id === item.id).map((link) => link.objective_id) }));
    const processNodes: GraphNode[] = snapshot.processes.map((item) => ({ id: item.id, kind: 'process', label: item.name, meta: item.owner_role || (fr ? 'Rôle à définir' : 'Role to define'), parentIds: item.capability_id ? [item.capability_id] : [] }));
    const taskNodes: GraphNode[] = snapshot.tasks.map((item) => { const analysis = analyseTask(item.criteria, Number(item.hours_per_week)); return { id: item.id, kind: 'task', label: item.name, meta: `${analysis.aiSuitability}% IA · ${item.hours_per_week} h/sem`, parentIds: [item.process_id], mode: analysis.mode, hours: analysis.capacityGain, risk: analysis.priority }; });
    const roles = [...new Set([...positions.map((position) => position.title), ...snapshot.processes.map((item) => item.owner_role), ...snapshot.tasks.map((item) => item.role_name)].filter(Boolean) as string[])];
    const clean = (v: string) => v.replace(/^\[Démo Atlas\]\s*/, '');
    const roleNodes: GraphNode[] = roles.map((role) => {
      const taskIds = snapshot.tasks.filter((task) => task.role_name?.toLocaleLowerCase() === role.toLocaleLowerCase()).map((task) => task.id);
      const pos = positions.find((p) => p.title.toLocaleLowerCase() === role.toLocaleLowerCase());
      const manager = pos?.reports_to_position_id ? positions.find((p) => p.id === pos.reports_to_position_id)?.title : undefined;
      const dept = pos?.department_id ? departments.find((d) => d.id === pos.department_id)?.name : undefined;
      const orgMeta = pos ? `${dept ? clean(dept) : ''}${manager ? ` · ${fr ? 'N+1' : 'Reports to'} ${manager}` : ''}` : (fr ? 'Hors organigramme · à rattacher' : 'Not in org chart · to attach');
      const taskMeta = taskIds.length ? `${taskIds.length} ${fr ? 'tâche(s)' : 'task(s)'}` : (fr ? 'aucune tâche reliée' : 'no linked task');
      return { id: `role:${role}`, kind: 'role', label: role, meta: `${taskMeta} · ${orgMeta}`, parentIds: taskIds, risk: pos ? 0 : 1 };
    });
    const orgNodes: GraphNode[] = departments.map((d) => {
      const roleIds = positions.filter((p) => p.department_id === d.id).map((p) => `role:${p.title}`);
      const parent = departments.find((x) => x.id === d.parent_department_id);
      return { id: `org:${d.id}`, kind: 'org', label: clean(d.name), meta: `${roleIds.length} ${fr ? 'poste(s)' : 'position(s)'}${parent ? ` · ${fr ? 'rattaché à' : 'under'} ${clean(parent.name)}` : ''}`, parentIds: roleIds };
    });
    const skillNodes: GraphNode[] = skillNames.map((skill) => { const roleIds = positions.filter((position) => JSON.stringify(position.skills_required ?? '').toLocaleLowerCase().includes(skill.toLocaleLowerCase())).map((position) => `role:${position.title}`); return { id: `skill:${skill}`, kind: 'skill', label: skill, meta: roleIds.length ? `${roleIds.length} ${fr ? 'rôle(s) exigeant cette compétence' : 'role(s) requiring this skill'}` : (fr ? 'Référentiel existant · lien à confirmer' : 'Existing catalogue · link to confirm'), parentIds: roleIds }; });
    const filteredTasks = taskNodes.filter((node) => (modeFilter === 'all' || node.mode === modeFilter) && (!riskOnly || Number(node.risk) >= 60));
    if (level === 'executive') return [objectiveNodes, capabilityNodes];
    if (level === 'operational') return [objectiveNodes, capabilityNodes, processNodes, filteredTasks];
    return [objectiveNodes, capabilityNodes, processNodes, filteredTasks, roleNodes, orgNodes, skillNodes];
  }, [snapshot, fr, level, modeFilter, riskOnly, positions, skillNames, departments]);

  useEffect(() => {
    const nodeId = params.get('node');
    if (!nodeId) return;
    const match = columns.flat().find((node) => node.id === nodeId);
    if (match) setSelected(match);
  }, [columns, params]);

  const selectNode = (node: GraphNode) => {
    setSelected(node);
    const next = new URLSearchParams(params);
    next.set('node', node.id);
    setParams(next, { replace: true });
  };

  const closeNode = () => {
    setSelected(null);
    const next = new URLSearchParams(params);
    next.delete('node');
    setParams(next, { replace: true });
  };

  const labels = fr ? ['Stratégie', 'Capacités', 'Processus', 'Tâches', 'Rôles', 'Organigramme', 'Compétences'] : ['Strategy', 'Capabilities', 'Processes', 'Tasks', 'Roles', 'Org chart', 'Skills'];
  return (
    <section className="transformation-canvas min-w-0 overflow-hidden border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
        <div className="flex items-center gap-1">
          {(['executive', 'operational', 'detail'] as Level[]).map((item) => <Button key={item} size="sm" variant={level === item ? 'default' : 'ghost'} onClick={() => setLevel(item)}>{item === 'executive' ? (fr ? 'Exécutif' : 'Executive') : item === 'operational' ? (fr ? 'Opérationnel' : 'Operational') : (fr ? 'Détaillé' : 'Detailed')}</Button>)}
        </div>
        <div className="flex items-center gap-2">
          <select aria-label={fr ? 'Filtrer par mode' : 'Filter by mode'} className="h-8 rounded-md border border-input bg-background px-2 text-xs" value={modeFilter} onChange={(event) => setModeFilter(event.target.value)}>
            <option value="all">{fr ? 'Tous les modes' : 'All modes'}</option>
            {Object.entries(MODE_LABELS).map(([key, label]) => <option key={key} value={key}>{label[fr ? 'fr' : 'en']}</option>)}
          </select>
          <Button size="sm" variant={riskOnly ? 'secondary' : 'outline'} onClick={() => setRiskOnly((value) => !value)}>{fr ? 'Risques élevés' : 'High risk'}</Button>
        </div>
      </div>
      <ScrollArea className="h-[560px] w-full">
        <div className="min-w-[900px] p-5">
          <div className="mb-3 grid gap-6" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(170px, 1fr))` }}>
            {columns.map((_, index) => <p key={labels[index]} className="text-xs font-semibold uppercase text-muted-foreground">{labels[index]}</p>)}
          </div>
          <div className="grid items-start gap-6" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(170px, 1fr))` }}>
            {columns.map((nodes, columnIndex) => (
              <div key={labels[columnIndex]} className="relative space-y-3">
                {nodes.map((node) => { const Icon = ICONS[node.kind]; return (
                  <div key={node.id} className="relative">
                    {columnIndex > 0 && <ChevronRight className="absolute -left-5 top-7 h-4 w-4 text-muted-foreground/60" />}
                    <Button variant="outline" onClick={() => selectNode(node)} className={cn('h-auto min-h-[76px] w-full justify-start whitespace-normal border-l-4 bg-background p-3 text-left', node.kind === 'objective' && 'border-l-primary', node.kind === 'capability' && 'border-l-accent', node.kind === 'process' && 'border-l-muted-foreground', node.kind === 'task' && Number(node.risk) >= 60 && 'border-l-destructive', node.kind === 'role' && 'border-l-secondary-foreground', node.kind === 'skill' && 'border-l-primary/60', node.kind === 'org' && 'border-l-accent')}>
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" /><span className="min-w-0"><span className="block text-sm font-semibold leading-snug">{node.label}</span><span className="mt-1 block text-[11px] font-normal text-muted-foreground">{node.meta}</span></span>
                    </Button>
                  </div>
                ); })}
                {!nodes.length && <div className="border border-dashed border-border p-4 text-center text-xs text-muted-foreground">{fr ? 'Aucune donnée reliée' : 'No linked data'}</div>}
              </div>
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <Sheet open={Boolean(selected)} onOpenChange={(open) => { if (!open) closeNode(); }}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader><SheetTitle className="text-2xl font-bold">{selected?.label}</SheetTitle><SheetDescription>{selected?.meta}</SheetDescription></SheetHeader>
          {selected && <div className="mt-6 space-y-4"><Badge variant="outline">{labels[['objective', 'capability', 'process', 'task', 'role', 'org', 'skill'].indexOf(selected.kind)]}</Badge><div className="border-y border-border py-4 text-sm"><p className="text-muted-foreground">{fr ? 'Relations directes' : 'Direct relationships'}</p><p className="mt-1 font-semibold">{selected.parentIds.length}</p></div>{selected.mode && <p className="text-sm"><span className="text-muted-foreground">{fr ? 'Mode recommandé' : 'Recommended mode'} · </span>{MODE_LABELS[selected.mode as keyof typeof MODE_LABELS][fr ? 'fr' : 'en']}</p>}{selected.hours !== undefined && <p className="text-sm"><span className="text-muted-foreground">{fr ? 'Capacité estimée' : 'Estimated capacity'} · </span>{selected.hours} h/sem</p>}<p className="text-xs text-muted-foreground">{fr ? 'Les estimations proviennent du moteur déterministe Humain + IA et doivent être validées avant décision.' : 'Estimates come from the deterministic Human + AI engine and must be validated before decisions.'}</p></div>}
        </SheetContent>
      </Sheet>
    </section>
  );
}