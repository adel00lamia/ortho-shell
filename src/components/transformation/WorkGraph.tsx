import { useMemo, useState } from 'react';
import { Bot, BriefcaseBusiness, ChevronRight, GitBranch, Layers3, Target, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { analyseTask, MODE_LABELS } from '@/lib/humanAiScoring';
import type { TransformationSnapshot } from '@/lib/transformationAnalysis';
import { cn } from '@/lib/utils';

type Level = 'executive' | 'operational' | 'detail';
type NodeKind = 'objective' | 'capability' | 'process' | 'task' | 'role';
type GraphNode = { id: string; kind: NodeKind; label: string; meta: string; parentIds: string[]; risk?: number; mode?: string; hours?: number };

const ICONS = { objective: Target, capability: Layers3, process: GitBranch, task: Wrench, role: BriefcaseBusiness };

export function WorkGraph({ snapshot, fr }: { snapshot: TransformationSnapshot; fr: boolean }) {
  const [level, setLevel] = useState<Level>('operational');
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [modeFilter, setModeFilter] = useState('all');
  const [riskOnly, setRiskOnly] = useState(false);

  const columns = useMemo(() => {
    const objectiveNodes: GraphNode[] = snapshot.objectives.map((item) => ({ id: item.id, kind: 'objective', label: item.title, meta: item.target_kpi || item.category, parentIds: [] }));
    const capabilityNodes: GraphNode[] = snapshot.capabilities.map((item) => ({ id: item.id, kind: 'capability', label: item.name, meta: `${fr ? 'Maturité' : 'Maturity'} ${item.current_maturity} → ${item.target_maturity}`, risk: item.target_maturity - item.current_maturity, parentIds: snapshot.links.filter((link) => link.capability_id === item.id).map((link) => link.objective_id) }));
    const processNodes: GraphNode[] = snapshot.processes.map((item) => ({ id: item.id, kind: 'process', label: item.name, meta: item.owner_role || (fr ? 'Rôle à définir' : 'Role to define'), parentIds: item.capability_id ? [item.capability_id] : [] }));
    const taskNodes: GraphNode[] = snapshot.tasks.map((item) => { const analysis = analyseTask(item.criteria, Number(item.hours_per_week)); return { id: item.id, kind: 'task', label: item.name, meta: `${analysis.aiSuitability}% IA · ${item.hours_per_week} h/sem`, parentIds: [item.process_id], mode: analysis.mode, hours: analysis.capacityGain, risk: analysis.priority }; });
    const roles = [...new Set([...snapshot.processes.map((item) => item.owner_role), ...snapshot.tasks.map((item) => item.role_name)].filter(Boolean) as string[])];
    const roleNodes: GraphNode[] = roles.map((role) => ({ id: `role:${role}`, kind: 'role', label: role, meta: `${snapshot.tasks.filter((task) => task.role_name === role).length} ${fr ? 'tâche(s)' : 'task(s)'}`, parentIds: snapshot.tasks.filter((task) => task.role_name === role).map((task) => task.id) }));
    const filteredTasks = taskNodes.filter((node) => (modeFilter === 'all' || node.mode === modeFilter) && (!riskOnly || Number(node.risk) >= 60));
    if (level === 'executive') return [objectiveNodes, capabilityNodes];
    if (level === 'operational') return [objectiveNodes, capabilityNodes, processNodes, filteredTasks];
    return [objectiveNodes, capabilityNodes, processNodes, filteredTasks, roleNodes.filter((role) => filteredTasks.some((task) => role.parentIds.includes(task.id)))];
  }, [snapshot, fr, level, modeFilter, riskOnly]);

  const labels = fr ? ['Stratégie', 'Capacités', 'Processus', 'Tâches', 'Rôles'] : ['Strategy', 'Capabilities', 'Processes', 'Tasks', 'Roles'];
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
                    <Button variant="outline" onClick={() => setSelected(node)} className={cn('h-auto min-h-[76px] w-full justify-start whitespace-normal border-l-4 bg-background p-3 text-left', node.kind === 'objective' && 'border-l-primary', node.kind === 'capability' && 'border-l-accent', node.kind === 'process' && 'border-l-muted-foreground', node.kind === 'task' && Number(node.risk) >= 60 && 'border-l-destructive', node.kind === 'role' && 'border-l-secondary-foreground')}>
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
      <Sheet open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader><SheetTitle className="font-serif text-2xl">{selected?.label}</SheetTitle><SheetDescription>{selected?.meta}</SheetDescription></SheetHeader>
          {selected && <div className="mt-6 space-y-4"><Badge variant="outline">{labels[['objective', 'capability', 'process', 'task', 'role'].indexOf(selected.kind)]}</Badge><div className="border-y border-border py-4 text-sm"><p className="text-muted-foreground">{fr ? 'Relations directes' : 'Direct relationships'}</p><p className="mt-1 font-semibold">{selected.parentIds.length}</p></div>{selected.mode && <p className="text-sm"><span className="text-muted-foreground">{fr ? 'Mode recommandé' : 'Recommended mode'} · </span>{MODE_LABELS[selected.mode as keyof typeof MODE_LABELS][fr ? 'fr' : 'en']}</p>}{selected.hours !== undefined && <p className="text-sm"><span className="text-muted-foreground">{fr ? 'Capacité estimée' : 'Estimated capacity'} · </span>{selected.hours} h/sem</p>}<p className="text-xs text-muted-foreground">{fr ? 'Les estimations proviennent du moteur déterministe Humain + IA et doivent être validées avant décision.' : 'Estimates come from the deterministic Human + AI engine and must be validated before decisions.'}</p></div>}
        </SheetContent>
      </Sheet>
    </section>
  );
}