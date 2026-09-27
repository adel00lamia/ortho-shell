import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTransformationTable } from '@/hooks/useTransformation';
import { analyseTask, CRITERIA_KEYS, CRITERIA_LABELS, DEFAULT_CRITERIA, MODE_LABELS, normalizeCriteria, type OperatingMode } from '@/lib/humanAiScoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScenarioPlanner } from '@/components/transformation/ScenarioPlanner';
import { TransformationWorkflow } from '@/components/transformation/TransformationWorkflow';
import { WorkGraph } from '@/components/transformation/WorkGraph';
import { TransformationVisuals } from '@/components/transformation/TransformationVisuals';
import { TransformationAgent } from '@/components/transformation/TransformationAgent';
import { useTransformationContext } from '@/hooks/useTransformationContext';
import type { TransformationSnapshot } from '@/lib/transformationAnalysis';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Target, Layers, GitBranch, Bot, Trash2, Plus, Network, Database, ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { seedAtlasDemo, clearAtlasDemo } from '@/lib/atlasDemo';

type Obj = { id: string; title: string; category: string; priority: number; target_kpi: string | null };
type Cap = { id: string; name: string; domain: string | null; current_maturity: number; target_maturity: number };
type Link = { id: string; objective_id: string; capability_id: string; criticality: number };
type Proc = { id: string; name: string; capability_id: string | null; owner_role: string | null };
type Task = { id: string; process_id: string; name: string; role_name: string | null; hours_per_week: number; criteria: unknown };

const sel = 'h-9 rounded-md border border-input bg-background px-2 text-sm';

export default function TransformationCockpit() {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const L = (a: string, b: string) => (fr ? a : b);

  const objectives = useTransformationTable<Obj>('strategic_objectives');
  const caps = useTransformationTable<Cap>('business_capabilities');
  const links = useTransformationTable<Link>('objective_capabilities');
  const procs = useTransformationTable<Proc>('business_processes');
  const tasks = useTransformationTable<Task>('process_tasks');
  const { companyId } = useCompanyId();
  const context = useTransformationContext();
  const [params, setParams] = useSearchParams();
  const validViews = ['cockpit', 'objectives', 'capabilities', 'work', 'ai', 'scenarios'];
  const requestedView = params.get('view') ?? 'cockpit';
  const activeView = validViews.includes(requestedView) ? requestedView : 'cockpit';

  const analysed = useMemo(() => tasks.rows.map((t) => ({ t, a: analyseTask(t.criteria, Number(t.hours_per_week)) })), [tasks.rows]);
  const capGaps = caps.rows.filter((c) => c.target_maturity - c.current_maturity >= 2).length;
  const totalGain = analysed.reduce((s, x) => s + x.a.capacityGain, 0);
  const orphanObjectives = objectives.rows.filter((o) => !links.rows.some((l) => l.objective_id === o.id)).length;
  const snapshot: TransformationSnapshot = { objectives: objectives.rows, capabilities: caps.rows, links: links.rows, processes: procs.rows, tasks: tasks.rows };

  // local form state
  const [obj, setObj] = useState({ title: '', category: 'growth', target_kpi: '' });
  const [cap, setCap] = useState({ name: '', domain: '', current_maturity: 2, target_maturity: 4 });
  const [lnk, setLnk] = useState({ objective_id: '', capability_id: '', criticality: 3 });
  const [proc, setProc] = useState({ name: '', capability_id: '', owner_role: '' });
  const [task, setTask] = useState({ name: '', process_id: '', role_name: '', hours_per_week: 4 });
  const [editing, setEditing] = useState<string | null>(null);
  const [demoBusy, setDemoBusy] = useState(false);
  const qc = useQueryClient();

  if (!objectives.companyId && !objectives.isLoading) {
    return <div className="p-8 text-muted-foreground">{L('Associez d’abord votre compte à une entreprise (Profil entreprise).', 'Link your account to a company first (Company profile).')}</div>;
  }

  const workflow = [
    { id: 'objectives', label: L('Objectifs stratégiques', 'Strategic objectives'), count: objectives.rows.length, complete: objectives.rows.length > 0 },
    { id: 'capabilities', label: L('Capacités critiques', 'Critical capabilities'), count: caps.rows.length, complete: caps.rows.length > 0, warning: capGaps > 0 },
    { id: 'work', label: L('Processus', 'Processes'), count: procs.rows.length, complete: procs.rows.length > 0 },
    { id: 'work', label: L('Tâches', 'Tasks'), count: tasks.rows.length, complete: tasks.rows.length > 0 },
    { id: 'ai', label: L('Rôles & compétences', 'Roles & skills'), count: (context.data?.positions.length ?? 0) + (context.data?.skillNames.length ?? 0), complete: Boolean(context.data?.positions.length && context.data?.skillNames.length) },
    { id: 'ai', label: L('Humain + IA', 'Human + AI'), count: analysed.length, complete: analysed.length > 0 },
    { id: 'scenarios', label: L('Interventions', 'Interventions'), count: analysed.filter((item) => item.a.mode !== 'human_only').length, complete: analysed.length > 0 },
    { id: 'scenarios', label: L('Impact', 'Impact'), count: 0, complete: false },
  ];
  const setView = (view: string) => { const next = new URLSearchParams(params); next.set('view', view); setParams(next, { replace: true }); };

  return (
    <div className="transformation-shell min-h-screen bg-background p-3 text-foreground md:p-6">
      <div className="mx-auto max-w-[1800px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">{L('De la stratégie à l’exécution Humain + IA', 'From strategy to Human + AI execution')}</p>
          <h1 className="font-serif text-4xl font-normal text-foreground md:text-5xl">{L('Cockpit de transformation', 'Transformation cockpit')}</h1>
          <div className="mt-2 flex flex-wrap gap-2"><Badge variant="outline" className="gap-1"><Database className="h-3 w-3" />{objectives.rows.length + caps.rows.length + procs.rows.length + tasks.rows.length} {L('objets reliés', 'connected objects')}</Badge><Badge variant="outline" className="gap-1"><ShieldCheck className="h-3 w-3" />{L('Données de votre entreprise uniquement', 'Your company data only')}</Badge></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={demoBusy} onClick={async () => {
            if (!objectives.companyId) return;
            setDemoBusy(true);
            try {
              const r = await seedAtlasDemo(objectives.companyId);
              await qc.invalidateQueries({ queryKey: ['transformation'] }); await qc.invalidateQueries({ queryKey: ['transformation-context'] });
              toast.success(L(`Démo Atlas Industries chargée : ${r.objectives} objectifs, ${r.capabilities} capacités, ${r.processes} processus, ${r.tasks} tâches analysées.`, `Atlas Industries demo loaded.`));
            } catch (e: any) { toast.error(e?.message ?? 'Erreur'); } finally { setDemoBusy(false); }
          }}>{L('Charger la démo Atlas Industries', 'Load Atlas Industries demo')}</Button>
          <Button variant="ghost" size="sm" disabled={demoBusy} onClick={async () => {
            if (!objectives.companyId) return;
            setDemoBusy(true);
            try { await clearAtlasDemo(objectives.companyId); await qc.invalidateQueries({ queryKey: ['transformation'] }); await qc.invalidateQueries({ queryKey: ['transformation-context'] }); toast.success(L('Démo supprimée', 'Demo removed')); }
            catch (e: any) { toast.error(e?.message ?? 'Erreur'); } finally { setDemoBusy(false); }
          }}>{L('Retirer la démo', 'Remove demo')}</Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setView}>
        <TabsList className="h-auto w-full flex-wrap justify-start border border-border bg-card p-1">
          <TabsTrigger value="cockpit">Cockpit</TabsTrigger>
          <TabsTrigger value="objectives">{L('Objectifs', 'Objectives')}</TabsTrigger>
          <TabsTrigger value="capabilities">{L('Capacités', 'Capabilities')}</TabsTrigger>
          <TabsTrigger value="work">{L('Processus & tâches', 'Processes & tasks')}</TabsTrigger>
          <TabsTrigger value="ai">{L('Humain + IA', 'Human + AI')}</TabsTrigger>
          <TabsTrigger value="scenarios">{L('Scénarios & risques', 'Scenarios & risk')}</TabsTrigger>
        </TabsList>

        <TabsContent value="cockpit" className="space-y-6">
          <div className="grid items-start gap-4 lg:grid-cols-[210px_minmax(0,1fr)_340px]">
            <TransformationWorkflow steps={workflow} active={activeView} onChange={setView} fr={fr} />
            <div className="min-w-0 space-y-4"><WorkGraph snapshot={snapshot} fr={fr} positions={context.data?.positions ?? []} skillNames={context.data?.skillNames ?? []} departments={context.data?.departments ?? []} /><TransformationVisuals snapshot={snapshot} fr={fr} /></div>
            <TransformationAgent snapshot={snapshot} fr={fr} />
          </div>
          {objectives.rows.length === 0 && (
            <div className="transformation-panel flex flex-col items-start gap-3 p-6 text-muted-foreground"><Network className="h-6 w-6 text-primary"/><p>{L('Commencez par saisir vos objectifs stratégiques, puis les capacités nécessaires pour les atteindre.', 'Start by entering your strategic objectives, then the capabilities required to reach them.')}</p><Button onClick={() => setView('objectives')}>{L('Créer le premier objectif', 'Create first objective')}</Button></div>
          )}
        </TabsContent>

        <TabsContent value="objectives" className="space-y-4">
          <Card><CardContent className="p-4 flex flex-wrap gap-2">
            <Input className="flex-1 min-w-[220px]" placeholder={L('Ex. : Entrer sur 2 marchés africains', 'E.g. Enter 2 African markets')} value={obj.title} onChange={(e) => setObj({ ...obj, title: e.target.value })} />
            <select className={sel} value={obj.category} onChange={(e) => setObj({ ...obj, category: e.target.value })}>
              {[['growth', L('Croissance', 'Growth')], ['cost', L('Coûts', 'Cost')], ['digital', L('Digital', 'Digital')], ['ai', 'IA'], ['quality', L('Qualité', 'Quality')], ['talent', 'Talent']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <Input className="w-56" placeholder={L('KPI cible', 'Target KPI')} value={obj.target_kpi} onChange={(e) => setObj({ ...obj, target_kpi: e.target.value })} />
            <Button disabled={!obj.title.trim()} onClick={() => objectives.create.mutate(obj, { onSuccess: () => setObj({ title: '', category: 'growth', target_kpi: '' }) })}><Plus className="h-4 w-4 mr-1" />{L('Ajouter', 'Add')}</Button>
          </CardContent></Card>
          {objectives.rows.map((o) => (
            <Card key={o.id}><CardContent className="p-4 flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" />
              <div className="flex-1"><div className="font-semibold">{o.title}</div><div className="text-xs text-muted-foreground">{o.category}{o.target_kpi ? ` · KPI : ${o.target_kpi}` : ''}</div>
                <div className="flex flex-wrap gap-1 mt-2">{links.rows.filter((l) => l.objective_id === o.id).map((l) => <Badge key={l.id} variant="secondary">{caps.rows.find((c) => c.id === l.capability_id)?.name} · {l.criticality}/5</Badge>)}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => objectives.remove.mutate(o.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="capabilities" className="space-y-4">
          <Card><CardContent className="p-4 flex flex-wrap gap-2 items-center">
            <Input className="flex-1 min-w-[200px]" placeholder={L('Ex. : Vente internationale', 'E.g. International sales')} value={cap.name} onChange={(e) => setCap({ ...cap, name: e.target.value })} />
            <Input className="w-40" placeholder={L('Domaine', 'Domain')} value={cap.domain} onChange={(e) => setCap({ ...cap, domain: e.target.value })} />
            <label className="text-xs text-muted-foreground">{L('Maturité actuelle', 'Current')}<select className={sel + ' ml-1'} value={cap.current_maturity} onChange={(e) => setCap({ ...cap, current_maturity: +e.target.value })}>{[1, 2, 3, 4, 5].map((v) => <option key={v}>{v}</option>)}</select></label>
            <label className="text-xs text-muted-foreground">{L('Cible', 'Target')}<select className={sel + ' ml-1'} value={cap.target_maturity} onChange={(e) => setCap({ ...cap, target_maturity: +e.target.value })}>{[1, 2, 3, 4, 5].map((v) => <option key={v}>{v}</option>)}</select></label>
            <Button disabled={!cap.name.trim()} onClick={() => caps.create.mutate(cap, { onSuccess: () => setCap({ name: '', domain: '', current_maturity: 2, target_maturity: 4 }) })}><Plus className="h-4 w-4 mr-1" />{L('Ajouter', 'Add')}</Button>
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">{L('Relier un objectif à une capacité', 'Link objective → capability')}</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">
            <select className={sel} value={lnk.objective_id} onChange={(e) => setLnk({ ...lnk, objective_id: e.target.value })}><option value="">{L('Objectif…', 'Objective…')}</option>{objectives.rows.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</select>
            <select className={sel} value={lnk.capability_id} onChange={(e) => setLnk({ ...lnk, capability_id: e.target.value })}><option value="">{L('Capacité…', 'Capability…')}</option>{caps.rows.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <select className={sel} value={lnk.criticality} onChange={(e) => setLnk({ ...lnk, criticality: +e.target.value })}>{[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{L('Criticité', 'Criticality')} {v}</option>)}</select>
            <Button variant="secondary" disabled={!lnk.objective_id || !lnk.capability_id} onClick={() => links.create.mutate(lnk)}>{L('Relier', 'Link')}</Button>
          </CardContent></Card>
          {caps.rows.map((c) => (
            <Card key={c.id}><CardContent className="p-4 flex items-center gap-3">
              <Layers className="h-5 w-5 text-primary" />
              <div className="flex-1"><div className="font-semibold">{c.name}</div><div className="text-xs text-muted-foreground">{c.domain} · {L('maturité', 'maturity')} {c.current_maturity} → {c.target_maturity}</div></div>
              {c.target_maturity - c.current_maturity >= 2 && <Badge variant="destructive">{L('Écart critique', 'Critical gap')}</Badge>}
              <Button variant="ghost" size="icon" onClick={() => caps.remove.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="work" className="space-y-4">
          <Card><CardHeader><CardTitle className="text-sm">{L('Nouveau processus', 'New process')}</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">
            <Input className="flex-1 min-w-[200px]" placeholder={L('Ex. : Développement de marché', 'E.g. Market development')} value={proc.name} onChange={(e) => setProc({ ...proc, name: e.target.value })} />
            <select className={sel} value={proc.capability_id} onChange={(e) => setProc({ ...proc, capability_id: e.target.value })}><option value="">{L('Capacité…', 'Capability…')}</option>{caps.rows.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <Input className="w-44" placeholder={L('Rôle responsable', 'Owner role')} value={proc.owner_role} onChange={(e) => setProc({ ...proc, owner_role: e.target.value })} />
            <Button disabled={!proc.name.trim()} onClick={() => procs.create.mutate({ ...proc, capability_id: proc.capability_id || null }, { onSuccess: () => setProc({ name: '', capability_id: '', owner_role: '' }) })}><Plus className="h-4 w-4 mr-1" />{L('Ajouter', 'Add')}</Button>
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">{L('Nouvelle tâche', 'New task')}</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">
            <Input className="flex-1 min-w-[200px]" placeholder={L('Ex. : Veille concurrentielle', 'E.g. Competitive monitoring')} value={task.name} onChange={(e) => setTask({ ...task, name: e.target.value })} />
            <select className={sel} value={task.process_id} onChange={(e) => setTask({ ...task, process_id: e.target.value })}><option value="">{L('Processus…', 'Process…')}</option>{procs.rows.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <Input className="w-40" placeholder={L('Rôle', 'Role')} value={task.role_name} onChange={(e) => setTask({ ...task, role_name: e.target.value })} />
            <Input className="w-28" type="number" min={0} value={task.hours_per_week} onChange={(e) => setTask({ ...task, hours_per_week: +e.target.value })} title={L('Heures / semaine', 'Hours / week')} />
            <Button disabled={!task.name.trim() || !task.process_id} onClick={() => tasks.create.mutate({ ...task, criteria: DEFAULT_CRITERIA }, { onSuccess: () => setTask({ name: '', process_id: task.process_id, role_name: '', hours_per_week: 4 }) })}><Plus className="h-4 w-4 mr-1" />{L('Ajouter', 'Add')}</Button>
          </CardContent></Card>
          {procs.rows.map((p) => (
            <Card key={p.id}><CardHeader className="flex-row items-center gap-2 space-y-0"><GitBranch className="h-4 w-4 text-primary" /><CardTitle className="text-base flex-1">{p.name} <span className="text-xs font-normal text-muted-foreground">{caps.rows.find((c) => c.id === p.capability_id)?.name ?? ''}</span></CardTitle><Button variant="ghost" size="icon" onClick={() => procs.remove.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button></CardHeader>
              <CardContent className="space-y-1">{tasks.rows.filter((t) => t.process_id === p.id).map((t) => <div key={t.id} className="text-sm flex justify-between border-b border-border py-1"><span>{t.name} <span className="text-muted-foreground">· {t.role_name} · {t.hours_per_week} h/sem</span></span><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => tasks.remove.mutate(t.id)}><Trash2 className="h-3 w-3" /></Button></div>)}</CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <p className="text-sm text-muted-foreground">{L('Carte des opportunités IA — triée par priorité (adéquation IA × valeur stratégique). Évaluez chaque critère de 1 à 5 ; les gains sont des estimations à valider.', 'AI opportunity map — sorted by priority (AI suitability × strategic value). Rate each criterion 1–5; gains are estimates to validate.')}</p>
          {[...analysed].sort((a, b) => b.a.priority - a.a.priority).map(({ t, a }) => {
            const c = normalizeCriteria(t.criteria);
            return (
              <Card key={t.id}><CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Bot className="h-5 w-5 text-primary" />
                  <div className="flex-1 font-semibold">{t.name}<span className="text-xs text-muted-foreground font-normal"> · {procs.rows.find((p) => p.id === t.process_id)?.name}</span></div>
                  <Badge>{L('Adéquation IA', 'AI suitability')} {a.aiSuitability}%</Badge>
                  <Badge variant="secondary">{MODE_LABELS[a.mode as OperatingMode][fr ? 'fr' : 'en']}</Badge>
                  <Badge variant="outline">{L('Jugement', 'Judgment')} : {a.judgmentLevel}</Badge>
                  <Badge variant="outline">+{a.capacityGain} h/sem</Badge>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(editing === t.id ? null : t.id)}>{editing === t.id ? L('Fermer', 'Close') : L('Évaluer', 'Rate')}</Button>
                </div>
                {editing === t.id && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {CRITERIA_KEYS.map((k) => (
                      <div key={k}><div className="text-xs mb-1 flex justify-between"><span>{CRITERIA_LABELS[k][fr ? 'fr' : 'en']}</span><span>{c[k]}</span></div>
                        <Slider min={1} max={5} step={1} value={[c[k]]} onValueChange={([v]) => tasks.update.mutate({ id: t.id, criteria: { ...c, [k]: v }, operating_mode: analyseTask({ ...c, [k]: v }).mode })} /></div>
                    ))}
                  </div>
                )}
              </CardContent></Card>
            );
          })}
          {analysed.length === 0 && <Card><CardContent className="p-6 text-muted-foreground">{L('Ajoutez des tâches dans « Processus & tâches » pour lancer l’analyse.', 'Add tasks in “Processes & tasks” to start the analysis.')}</CardContent></Card>}
        </TabsContent>
        <TabsContent value="scenarios"><ScenarioPlanner tasks={tasks.rows} companyId={companyId} lang={language} /></TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
