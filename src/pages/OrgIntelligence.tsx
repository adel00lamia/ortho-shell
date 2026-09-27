import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, PieChart, Pie } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useOrgIntelligence, type OrgRole } from '@/hooks/useOrgIntelligence';
import { MODE_LABELS } from '@/lib/humanAiScoring';
import { toast } from 'sonner';
import { Loader2, Network, Target, Gauge, Sparkles, Users, Clock, AlertTriangle, Bot, ChevronRight, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const MODE_COLOR: Record<string, string> = {
  human_only: 'hsl(var(--muted-foreground))', human_ai: 'hsl(var(--primary) / 0.45)', ai_approval: 'hsl(var(--primary) / 0.7)',
  ai_autonomous: 'hsl(var(--primary))', automation: 'hsl(var(--accent-foreground))',
};

function coverage(r: OrgRole) {
  return (r.tasks.length ? 1 : 0) + (r.objectiveKpis.length ? 1 : 0) + (r.measuredKpis.length ? 1 : 0);
}

export default function OrgIntelligence() {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const { data, isLoading, error } = useOrgIntelligence();
  const [selected, setSelected] = useState<OrgRole | null>(null);
  const [search, setSearch] = useState('');

  const roles = data?.roles ?? [];
  const stats = useMemo(() => {
    const hours = roles.reduce((s, r) => s + r.hours, 0);
    const gain = roles.reduce((s, r) => s + r.capacityGain, 0);
    const measured = roles.flatMap((r) => r.measuredKpis).filter((m) => m.progress != null);
    return {
      roles: roles.length,
      linked: roles.filter((r) => r.tasks.length).length,
      kpiLinked: roles.filter((r) => r.objectiveKpis.length || r.measuredKpis.length).length,
      hours, gain: Math.round(gain * 10) / 10,
      avgProgress: measured.length ? Math.round(measured.reduce((s, m) => s + (m.progress ?? 0), 0) / measured.length) : null,
      critical: roles.filter((r) => r.critical).length,
    };
  }, [roles]);

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <p className="p-8 text-destructive">{(error as Error).message}</p>;

  const filtered = roles.filter((r) => `${r.title} ${r.dept} ${r.holder ?? ''}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">{fr ? 'Intelligence organisationnelle' : 'Organisation intelligence'}</p>
          <h1 className="text-3xl font-bold mt-1">{fr ? 'Postes · Tâches · KPI' : 'Roles · Tasks · KPIs'}</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">{fr ? "Chaque poste de votre organigramme réel, relié au travail qu'il réalise et aux résultats qu'il fait bouger." : 'Every role in your real org chart, linked to the work it does and the results it moves.'}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/workflow/assess/workforce">{fr ? 'Organigramme' : 'Org chart'}</Link></Button>
          <Button asChild size="sm"><Link to="/transformation">{fr ? 'Cockpit Transformation' : 'Transformation cockpit'}</Link></Button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi icon={Users} label={fr ? 'Postes' : 'Roles'} value={stats.roles} sub={`${stats.critical} ${fr ? 'critiques' : 'critical'}`} />
        <Kpi icon={Network} label={fr ? 'Reliés aux tâches' : 'Linked to tasks'} value={`${pct(stats.linked, stats.roles)}%`} sub={`${stats.linked}/${stats.roles}`} />
        <Kpi icon={Target} label={fr ? 'Reliés à un KPI' : 'Linked to a KPI'} value={`${pct(stats.kpiLinked, stats.roles)}%`} sub={`${stats.kpiLinked}/${stats.roles}`} />
        <Kpi icon={Clock} label={fr ? 'Charge cartographiée' : 'Mapped workload'} value={`${stats.hours} h`} sub={fr ? 'par semaine' : 'per week'} />
        <Kpi icon={Bot} label={fr ? 'Capacité libérable' : 'Releasable capacity'} value={`${stats.gain} h`} sub={fr ? 'estimation Humain + IA' : 'Human + AI estimate'} />
        <Kpi icon={Gauge} label={fr ? 'Avancement KPI mesurés' : 'Measured KPI progress'} value={stats.avgProgress == null ? '—' : `${stats.avgProgress}%`} sub={fr ? 'vers la cible' : 'toward target'} />
      </div>

      {roles.length === 0 ? (
        <Card className="p-10 text-center space-y-3">
          <p className="text-muted-foreground">{fr ? "Aucun poste réel trouvé dans l'organigramme." : 'No real positions found in the org chart.'}</p>
          <Button asChild><Link to="/workflow/assess/workforce">{fr ? "Compléter l'organigramme" : 'Build org chart'}</Link></Button>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">{fr ? "Vue d'ensemble" : 'Overview'}</TabsTrigger>
            <TabsTrigger value="tree">{fr ? 'Organigramme' : 'Org chart'}</TabsTrigger>
            <TabsTrigger value="heatmap">{fr ? 'Heatmap' : 'Heatmap'}</TabsTrigger>
            <TabsTrigger value="roles">{fr ? 'Fiches postes' : 'Role cards'}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><Overview roles={roles} fr={fr} orphans={data!.orphanTasks} onSelect={setSelected} /></TabsContent>
          <TabsContent value="tree"><OrgTree roles={roles} fr={fr} onSelect={setSelected} /></TabsContent>
          <TabsContent value="heatmap"><Heatmap roles={roles} fr={fr} onSelect={setSelected} /></TabsContent>
          <TabsContent value="roles" className="space-y-3">
            <div className="relative max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder={fr ? 'Rechercher un poste…' : 'Search a role…'} value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((r, i) => <RoleCard key={r.id} role={r} fr={fr} i={i} onClick={() => setSelected(r)} />)}
            </div>
          </TabsContent>
        </Tabs>
      )}

      <RoleSheet role={selected} fr={fr} onClose={() => setSelected(null)} />
    </div>
  );
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

function Kpi({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4 text-primary" />{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}

function Overview({ roles, fr, orphans, onSelect }: { roles: OrgRole[]; fr: boolean; orphans: { name: string; role: string }[]; onSelect: (r: OrgRole) => void }) {
  const load = [...roles].filter((r) => r.hours).sort((a, b) => b.hours - a.hours).slice(0, 10).map((r) => ({ name: r.title, h: r.hours, gain: r.capacityGain }));
  const modes: Record<string, number> = {};
  roles.forEach((r) => r.tasks.forEach((t) => (modes[t.mode] = (modes[t.mode] ?? 0) + t.hours)));
  const modeData = Object.entries(modes).map(([k, v]) => ({ key: k, name: MODE_LABELS[k as keyof typeof MODE_LABELS]?.[fr ? 'fr' : 'en'] ?? k, value: v }));
  const attention = roles.filter((r) => r.critical && coverage(r) < 2).concat(roles.filter((r) => !r.critical && coverage(r) === 0)).slice(0, 6);

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-base">{fr ? 'Charge par poste (h/sem)' : 'Workload by role (h/week)'}</CardTitle>
          <CardDescription>{fr ? 'Heures cartographiées et capacité libérable par l’IA' : 'Mapped hours and AI-releasable capacity'}</CardDescription></CardHeader>
        <CardContent className="h-72">
          {load.length ? (
            <ResponsiveContainer><BarChart data={load} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis type="category" dataKey="name" width={130} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
              <Bar dataKey="h" name={fr ? 'Heures' : 'Hours'} fill="hsl(var(--primary) / 0.35)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="gain" name={fr ? 'Libérable' : 'Releasable'} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart></ResponsiveContainer>
          ) : <Empty fr={fr} text={fr ? 'Aucune tâche reliée aux postes.' : 'No tasks linked to roles.'} />}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">{fr ? 'Mode opératoire cible' : 'Target operating mode'}</CardTitle>
          <CardDescription>{fr ? 'Répartition des heures' : 'Share of hours'}</CardDescription></CardHeader>
        <CardContent className="h-72">
          {modeData.length ? (
            <ResponsiveContainer><PieChart>
              <Pie data={modeData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {modeData.map((m) => <Cell key={m.key} fill={MODE_COLOR[m.key]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
            </PieChart></ResponsiveContainer>
          ) : <Empty fr={fr} text="—" />}
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />{fr ? 'Postes à relier en priorité' : 'Roles to link first'}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {attention.length ? attention.map((r) => (
            <button key={r.id} onClick={() => onSelect(r)} className="w-full flex items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/50">
              <div><p className="text-sm font-medium">{r.title} {r.critical && <Badge variant="destructive" className="ml-1 text-[10px]">{fr ? 'Critique' : 'Critical'}</Badge>}</p>
                <p className="text-xs text-muted-foreground">{r.dept}</p></div>
              <CoverageDots role={r} fr={fr} />
            </button>
          )) : <p className="text-sm text-muted-foreground">{fr ? 'Tous les postes critiques sont reliés.' : 'All critical roles are linked.'}</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">{fr ? 'Tâches sans poste' : 'Tasks without a role'}</CardTitle>
          <CardDescription>{fr ? "L'intitulé du rôle doit correspondre exactement à un poste" : 'Role name must match a position exactly'}</CardDescription></CardHeader>
        <CardContent className="space-y-1 max-h-64 overflow-auto">
          {orphans.length ? orphans.map((o, i) => <p key={i} className="text-xs"><span className="font-medium">{o.name}</span> <span className="text-muted-foreground">→ {o.role || '—'}</span></p>)
            : <p className="text-sm text-muted-foreground">{fr ? 'Aucune.' : 'None.'}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function CoverageDots({ role, fr }: { role: OrgRole; fr: boolean }) {
  const items = [
    [role.tasks.length, fr ? 'Tâches' : 'Tasks'], [role.objectiveKpis.length, fr ? 'Objectifs' : 'Objectives'], [role.measuredKpis.length, fr ? 'Mesures' : 'Measures'],
  ] as const;
  return <div className="flex gap-1">{items.map(([n, l]) => (
    <span key={l} title={`${l}: ${n}`} className={cn('text-[10px] px-1.5 py-0.5 rounded border', n ? 'bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground')}>{l} {n}</span>
  ))}</div>;
}

function OrgTree({ roles, fr, onSelect }: { roles: OrgRole[]; fr: boolean; onSelect: (r: OrgRole) => void }) {
  const ids = new Set(roles.map((r) => r.id));
  const roots = roles.filter((r) => !r.reportsTo || !ids.has(r.reportsTo));
  const children = (id: string) => roles.filter((r) => r.reportsTo === id);
  const Node = ({ r, depth }: { r: OrgRole; depth: number }) => {
    const [open, setOpen] = useState(depth < 2);
    const kids = children(r.id);
    return (
      <div className={cn(depth > 0 && 'ml-5 border-l pl-4')}>
        <div className="flex items-center gap-2 py-1.5">
          {kids.length ? <button onClick={() => setOpen(!open)} className="text-muted-foreground">{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button> : <span className="w-4" />}
          <button onClick={() => onSelect(r)} className={cn('flex-1 flex flex-wrap items-center gap-3 rounded-lg border bg-card px-3 py-2 text-left hover:border-primary transition-colors', r.critical && 'border-destructive/40')}>
            <div className="min-w-[160px]"><p className="text-sm font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{r.dept}{r.holder ? ` · ${r.holder}` : ''}</p></div>
            <span className="text-xs text-muted-foreground">{r.tasks.length} {fr ? 'tâches' : 'tasks'} · {r.hours} h</span>
            <div className="w-24"><Progress value={r.exposure} className="h-1.5" /><p className="text-[10px] text-muted-foreground mt-0.5">{fr ? 'Exposition IA' : 'AI exposure'} {r.exposure}%</p></div>
            <CoverageDots role={r} fr={fr} />
          </button>
        </div>
        {open && kids.map((k) => <Node key={k.id} r={k} depth={depth + 1} />)}
      </div>
    );
  };
  return <Card><CardContent className="pt-6 overflow-x-auto">{roots.map((r) => <Node key={r.id} r={r} depth={0} />)}</CardContent></Card>;
}

function Heatmap({ roles, fr, onSelect }: { roles: OrgRole[]; fr: boolean; onSelect: (r: OrgRole) => void }) {
  const cols = [
    { key: 'tasks', label: fr ? 'Tâches' : 'Tasks', v: (r: OrgRole) => Math.min(100, r.tasks.length * 25), txt: (r: OrgRole) => r.tasks.length },
    { key: 'obj', label: fr ? 'KPI objectifs' : 'Objective KPIs', v: (r: OrgRole) => Math.min(100, r.objectiveKpis.length * 34), txt: (r: OrgRole) => r.objectiveKpis.length },
    { key: 'meas', label: fr ? 'KPI mesurés' : 'Measured KPIs', v: (r: OrgRole) => { const p = r.measuredKpis.filter((m) => m.progress != null); return p.length ? p.reduce((s, m) => s + (m.progress ?? 0), 0) / p.length : 0; }, txt: (r: OrgRole) => { const p = r.measuredKpis.filter((m) => m.progress != null); return p.length ? `${Math.round(p.reduce((s, m) => s + (m.progress ?? 0), 0) / p.length)}%` : r.measuredKpis.length || '—'; } },
    { key: 'ai', label: fr ? 'Exposition IA' : 'AI exposure', v: (r: OrgRole) => r.exposure, txt: (r: OrgRole) => `${r.exposure}%` },
    { key: 'gap', label: fr ? 'Écarts compétences' : 'Skill gaps', v: (r: OrgRole) => Math.min(100, r.skillGaps * 25), txt: (r: OrgRole) => r.skillGaps, danger: true },
  ];
  const byDept = new Map<string, OrgRole[]>();
  roles.forEach((r) => byDept.set(r.dept, [...(byDept.get(r.dept) ?? []), r]));
  return (
    <Card><CardContent className="pt-6 overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-1">
        <thead><tr><th className="text-left text-xs text-muted-foreground font-medium p-2">{fr ? 'Poste' : 'Role'}</th>
          {cols.map((c) => <th key={c.key} className="text-xs text-muted-foreground font-medium p-2">{c.label}</th>)}</tr></thead>
        <tbody>
          {[...byDept.entries()].map(([dept, rs]) => (<>
            <tr key={dept}><td colSpan={cols.length + 1} className="pt-3 text-xs font-semibold uppercase tracking-wide text-primary">{dept}</td></tr>
            {rs.map((r) => (
              <tr key={r.id} className="cursor-pointer" onClick={() => onSelect(r)}>
                <td className="p-2 font-medium whitespace-nowrap">{r.title}{r.critical && <span className="ml-1 text-destructive">●</span>}</td>
                {cols.map((c) => { const v = c.v(r); return (
                  <td key={c.key} className="p-2 text-center rounded-md text-xs font-medium"
                    style={{ background: c.danger ? `hsl(var(--destructive) / ${0.06 + v / 130})` : `hsl(var(--primary) / ${0.06 + v / 130})` }}>{c.txt(r)}</td>); })}
              </tr>))}
          </>))}
        </tbody>
      </table>
    </CardContent></Card>
  );
}

function RoleCard({ role: r, fr, i, onClick }: { role: OrgRole; fr: boolean; i: number; onClick: () => void }) {
  return (
    <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.4) }}
      onClick={onClick} className="text-left rounded-xl border bg-card p-4 hover:border-primary hover:shadow-md transition-all space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div><p className="font-semibold">{r.title}</p><p className="text-xs text-muted-foreground">{r.dept}{r.holder ? ` · ${r.holder}` : ''}</p></div>
        {r.critical && <Badge variant="destructive" className="text-[10px]">{fr ? 'Critique' : 'Critical'}</Badge>}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Mini label={fr ? 'Tâches' : 'Tasks'} v={r.tasks.length} /><Mini label="h/sem" v={r.hours} /><Mini label={fr ? 'Libérable' : 'Releasable'} v={`${r.capacityGain}h`} />
      </div>
      <div><div className="flex justify-between text-[11px] text-muted-foreground"><span>{fr ? 'Exposition IA' : 'AI exposure'}</span><span>{r.exposure}%</span></div><Progress value={r.exposure} className="h-1.5" /></div>
      <div className="flex flex-wrap gap-1">
        {r.objectiveKpis.slice(0, 2).map((k) => <Badge key={k.objective} variant="secondary" className="text-[10px] font-normal">{k.kpi || k.objective}</Badge>)}
        {r.measuredKpis.slice(0, 2).map((k) => <Badge key={k.id} variant="outline" className="text-[10px] font-normal">{k.name}{k.progress != null ? ` · ${k.progress}%` : ''}</Badge>)}
        {!r.objectiveKpis.length && !r.measuredKpis.length && <span className="text-[11px] text-muted-foreground">{fr ? 'Aucun KPI relié — suggérez-en avec l’IA' : 'No KPI yet — ask AI'}</span>}
      </div>
    </motion.button>
  );
}

const Mini = ({ label, v }: { label: string; v: string | number }) => <div className="rounded-md bg-muted/50 py-1.5"><p className="text-sm font-semibold">{v}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>;
const Empty = ({ text }: { fr: boolean; text: string }) => <div className="h-full flex items-center justify-center text-sm text-muted-foreground">{text}</div>;

interface AiKpi { name: string; formula: string; frequency: string; linked_to: string; why: string }

function RoleSheet({ role, fr, onClose }: { role: OrgRole | null; fr: boolean; onClose: () => void }) {
  const [ai, setAi] = useState<Record<string, AiKpi[]>>({});
  const [loading, setLoading] = useState(false);
  const suggest = async () => {
    if (!role) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('role-kpi-suggest', { body: { positionId: role.id, language: fr ? 'fr' : 'en' } });
    setLoading(false);
    if (error || data?.error) return toast.error(data?.error ?? error?.message ?? 'Erreur');
    setAi((s) => ({ ...s, [role.id]: data.kpis ?? [] }));
  };
  const suggestions = role ? ai[role.id] : undefined;
  return (
    <Sheet open={!!role} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {role && (<>
          <SheetHeader><SheetTitle>{role.title}</SheetTitle><SheetDescription>{role.dept}{role.holder ? ` · ${role.holder}` : ''}</SheetDescription></SheetHeader>
          <div className="space-y-6 mt-6">
            <section>
              <h3 className="text-sm font-semibold mb-2">{fr ? 'Tâches' : 'Tasks'} ({role.tasks.length})</h3>
              {role.tasks.length ? role.tasks.map((t) => (
                <div key={t.id} className="rounded-lg border p-2.5 mb-2 text-xs">
                  <div className="flex justify-between"><span className="font-medium">{t.name}</span><span>{t.hours} h/sem</span></div>
                  <div className="flex justify-between text-muted-foreground mt-1"><span>{t.process}</span><span>{MODE_LABELS[t.mode]?.[fr ? 'fr' : 'en']} · IA {t.aiSuitability}%</span></div>
                </div>)) : <p className="text-xs text-muted-foreground">{fr ? 'Aucune tâche. Dans le cockpit, saisissez ce titre de poste exact comme rôle de la tâche.' : 'No tasks. In the cockpit, use this exact title as the task role.'}</p>}
            </section>
            <section>
              <h3 className="text-sm font-semibold mb-2">{fr ? 'KPI des objectifs' : 'Objective KPIs'}</h3>
              {role.objectiveKpis.length ? role.objectiveKpis.map((k) => (
                <div key={k.objective} className="rounded-lg border p-2.5 mb-2 text-xs"><p className="font-medium">{k.kpi || '—'}</p><p className="text-muted-foreground">{k.objective} · P{k.priority} · {fr ? 'criticité' : 'criticality'} {k.criticality}</p></div>
              )) : <p className="text-xs text-muted-foreground">{fr ? 'Reliez processus → capacité → objectif.' : 'Link process → capability → objective.'}</p>}
            </section>
            <section>
              <h3 className="text-sm font-semibold mb-2">{fr ? 'Impact mesuré' : 'Measured impact'}</h3>
              {role.measuredKpis.length ? role.measuredKpis.map((m) => (
                <div key={m.id} className="rounded-lg border p-2.5 mb-2 text-xs space-y-1">
                  <div className="flex justify-between"><span className="font-medium">{m.name}</span><span>{m.baseline ?? '—'} → {m.actual ?? '—'} / {m.target ?? '—'} {m.unit ?? ''}</span></div>
                  {m.progress != null && <Progress value={Math.min(100, m.progress)} className="h-1.5" />}
                  <p className="text-muted-foreground">{m.diagnostic}</p>
                </div>)) : <p className="text-xs text-muted-foreground">{fr ? 'Aucune mesure liée à ce poste ou son département.' : 'No measurement for this role or department.'}</p>}
            </section>
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">{fr ? 'KPI suggérés par l’IA' : 'AI-suggested KPIs'}</h3>
                <Button size="sm" variant="outline" onClick={suggest} disabled={loading}>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}<span className="ml-1">{fr ? 'Suggérer' : 'Suggest'}</span></Button>
              </div>
              {suggestions?.map((k, i) => (
                <div key={i} className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 mb-2 text-xs space-y-0.5">
                  <p className="font-medium">{k.name}</p><p><span className="text-muted-foreground">{fr ? 'Formule' : 'Formula'}:</span> {k.formula}</p>
                  <p className="text-muted-foreground">{k.frequency} · {k.linked_to}</p><p className="italic text-muted-foreground">{k.why}</p>
                </div>))}
              {suggestions && <p className="text-[10px] text-muted-foreground">{fr ? 'Propositions à valider — aucune valeur de référence inventée.' : 'Proposals to validate — no invented baselines.'}</p>}
            </section>
          </div>
        </>)}
      </SheetContent>
    </Sheet>
  );
}
