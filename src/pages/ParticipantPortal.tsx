import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, BarChart3, CheckCircle2, GraduationCap, KeyRound, LineChart as LineChartIcon,
  Loader2, Minus, Plus, Target, Trash2, TrendingDown, TrendingUp, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Line, LineChart, ResponsiveContainer, Tooltip as ReTooltip, XAxis, YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DIMENSIONS } from '@/config/diagnosticEngine';
import {
  PORTAL_CODE_KEY, useAddKpi, useAddReading, useDeleteKpi, useDeleteReading,
  usePortalCohort, usePortalParticipant, useSetModuleStatus,
  type PortalKpi, type PortalParticipant,
} from '@/hooks/useParticipantPortal';

const MODULE_STATUS_LABEL: Record<string, string> = {
  todo: 'À démarrer',
  in_progress: 'En cours',
  done: 'Terminé',
};

export default function ParticipantPortal() {
  const { code: routeCode } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [code, setCode] = useState<string | undefined>(routeCode?.toUpperCase());
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (routeCode) {
      setCode(routeCode.toUpperCase());
      localStorage.setItem(PORTAL_CODE_KEY, routeCode.toUpperCase());
    } else {
      const stored = localStorage.getItem(PORTAL_CODE_KEY);
      if (stored) setCode(stored);
    }
  }, [routeCode]);

  const { data: participant, isLoading, isError } = usePortalParticipant(code);
  const notFound = !!code && !isLoading && !participant;

  const openCode = (value: string) => {
    const clean = value.trim().toUpperCase();
    if (clean.length < 4) {
      toast.error('Entrez votre code d’accès personnel.');
      return;
    }
    localStorage.setItem(PORTAL_CODE_KEY, clean);
    navigate(`/portail/${clean}`);
  };

  if (!code || notFound || isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/60">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Mon espace AI × HR</CardTitle>
            <p className="text-sm text-muted-foreground">
              Entrez le code personnel affiché à la fin de votre diagnostic pour retrouver vos résultats,
              suivre vos indicateurs et vos modules.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {notFound && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Ce code ne correspond à aucun diagnostic.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="portal-code">Code d’accès</Label>
              <Input
                id="portal-code"
                value={draft}
                autoCapitalize="characters"
                placeholder="EX. K7M2QP4A"
                className="text-center text-lg tracking-[0.3em] uppercase"
                onChange={(e) => setDraft(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && openCode(draft)}
              />
            </div>
            <Button className="w-full gap-2" onClick={() => openCode(draft)}>
              Accéder à mon espace <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Pas encore de diagnostic ?{' '}
              <Link to="/diagnostic" className="text-primary underline underline-offset-4">
                Le faire en 5 minutes
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !participant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <PortalContent code={code} participant={participant} />;
}

function PortalContent({ code, participant }: { code: string; participant: PortalParticipant }) {
  const cohort = usePortalCohort(code, !!participant.session_id);

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 py-8 space-y-6">
        <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <Badge variant="secondary" className="tracking-wide">QimataQ × AI × HR</Badge>
          <h1 className="text-2xl font-bold sm:text-3xl">Mon espace AI × HR</h1>
          <p className="text-sm text-muted-foreground">
            {participant.session_title
              ? `Atelier : ${participant.session_title}`
              : 'Diagnostic individuel'}
            {' · '}Code <span className="font-mono font-semibold text-foreground">{code}</span>
          </p>
        </motion.header>

        <Tabs defaultValue="diagnostic">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="diagnostic" className="text-xs sm:text-sm">Diagnostic</TabsTrigger>
            <TabsTrigger value="kpis" className="text-xs sm:text-sm">Indicateurs</TabsTrigger>
            <TabsTrigger value="modules" className="text-xs sm:text-sm">Modules</TabsTrigger>
            <TabsTrigger value="cohort" className="text-xs sm:text-sm">Le groupe</TabsTrigger>
          </TabsList>

          <TabsContent value="diagnostic" className="space-y-4 pt-4">
            <DiagnosticTab participant={participant} />
          </TabsContent>
          <TabsContent value="kpis" className="space-y-4 pt-4">
            <KpisTab code={code} participant={participant} />
          </TabsContent>
          <TabsContent value="modules" className="space-y-4 pt-4">
            <ModulesTab code={code} participant={participant} />
          </TabsContent>
          <TabsContent value="cohort" className="space-y-4 pt-4">
            <CohortTab participant={participant} stats={cohort.data} loading={cohort.isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ─────────────── Diagnostic ─────────────── */

function DiagnosticTab({ participant }: { participant: PortalParticipant }) {
  return (
    <>
      <Card className="border-border/60">
        <CardContent className="pt-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">Score d’opportunité AI × HR</p>
          <p className="text-5xl font-bold text-primary">{participant.opportunity_score}<span className="text-2xl text-muted-foreground">/100</span></p>
          {participant.profile_label && (
            <Badge className="text-sm">{participant.profile_label}</Badge>
          )}
          {participant.profile_level && (
            <p className="text-xs text-muted-foreground">Niveau recommandé : {participant.profile_level}</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Vos 5 dimensions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {DIMENSIONS.map((d) => {
            const value = participant.dimension_scores?.[d.key] ?? 0;
            return (
              <div key={d.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{d.label}</span>
                  <span className="font-semibold">{Math.round(value)}</span>
                </div>
                <Progress value={value} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Vos zones de friction</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(participant.top_frictions ?? []).map((f, i) => (
            <div key={i} className="rounded-lg border border-border/60 p-3 text-sm">
              <p className="font-medium">{f.label}</p>
              {f.tags?.[0] && <p className="mt-1 text-xs text-muted-foreground">{f.tags[0]}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Vos cas d’usage prioritaires</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(participant.top_use_cases ?? []).map((u, i) => (
            <div key={u.id ?? i} className="flex items-start gap-3 rounded-lg border border-border/60 p-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span>{u.title}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

/* ─────────────── KPIs ─────────────── */

const trendOf = (kpi: PortalKpi) => {
  const readings = kpi.readings ?? [];
  if (!readings.length) return null;
  const last = Number(readings[readings.length - 1].value);
  const start = readings.length > 1 ? Number(readings[0].value) : Number(kpi.baseline_value ?? last);
  if (!Number.isFinite(start)) return { last, delta: 0, state: 'stable' as const };
  const delta = last - start;
  const improving = kpi.direction === 'up' ? delta > 0 : delta < 0;
  const regressing = kpi.direction === 'up' ? delta < 0 : delta > 0;
  const reached = kpi.target_value != null
    && (kpi.direction === 'up' ? last >= Number(kpi.target_value) : last <= Number(kpi.target_value));
  return {
    last,
    delta,
    state: reached ? ('reached' as const) : improving ? ('improving' as const) : regressing ? ('regressing' as const) : ('stable' as const),
  };
};

function KpisTab({ code, participant }: { code: string; participant: PortalParticipant }) {
  const addKpi = useAddKpi(code);
  const deleteKpi = useDeleteKpi(code);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [baseline, setBaseline] = useState('');
  const [target, setTarget] = useState('');
  const [direction, setDirection] = useState<'up' | 'down'>('down');

  const existing = new Set((participant.kpis ?? []).map((k) => k.name.toLowerCase()));
  const suggestions = useMemo(
    () => (participant.top_use_cases ?? [])
      .map((u) => `Temps passé — ${u.title}`)
      .filter((s) => !existing.has(s.toLowerCase()))
      .slice(0, 4),
    [participant.top_use_cases, participant.kpis], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const submit = async () => {
    if (!name.trim()) return toast.error('Donnez un nom à votre indicateur.');
    try {
      await addKpi.mutateAsync({
        name,
        unit: unit || undefined,
        baseline: baseline ? Number(baseline) : null,
        target: target ? Number(target) : null,
        direction,
      });
      setName(''); setUnit(''); setBaseline(''); setTarget('');
      toast.success('Indicateur ajouté.');
    } catch {
      toast.error('Impossible d’ajouter cet indicateur.');
    }
  };

  return (
    <>
      {suggestions.length > 0 && (
        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-base">Suggestions issues de votre diagnostic</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Button
                key={s}
                size="sm"
                variant="outline"
                className="h-auto max-w-full items-start gap-1 whitespace-normal py-2 text-left text-xs"
                disabled={addKpi.isPending}
                onClick={() =>
                  addKpi.mutateAsync({ name: s, unit: 'h/semaine', direction: 'down', source: 'use_case' })
                    .then(() => toast.success('Indicateur ajouté.'))
                    .catch(() => toast.error('Ajout impossible.'))
                }
              >
                <Plus className="h-3 w-3" /> {s}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Nouvel indicateur</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="kpi-name">Nom</Label>
            <Input id="kpi-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Temps de tri des CV" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="kpi-unit">Unité</Label>
              <Input id="kpi-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="h/semaine" />
            </div>
            <div className="space-y-1.5">
              <Label>Objectif</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as 'up' | 'down')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="down">Faire baisser</SelectItem>
                  <SelectItem value="up">Faire monter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kpi-base">Valeur de départ</Label>
              <Input id="kpi-base" type="number" value={baseline} onChange={(e) => setBaseline(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kpi-target">Cible</Label>
              <Input id="kpi-target" type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
          </div>
          <Button className="w-full gap-2" onClick={submit} disabled={addKpi.isPending}>
            {addKpi.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Ajouter l’indicateur
          </Button>
        </CardContent>
      </Card>

      {(participant.kpis ?? []).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            <Target className="mx-auto mb-2 h-6 w-6 opacity-50" />
            Aucun indicateur pour l’instant. Commencez par une suggestion ci-dessus.
          </CardContent>
        </Card>
      ) : (
        participant.kpis.map((kpi) => (
          <KpiCard key={kpi.id} code={code} kpi={kpi} onDelete={() => deleteKpi.mutate(kpi.id)} />
        ))
      )}
    </>
  );
}

function KpiCard({ code, kpi, onDelete }: { code: string; kpi: PortalKpi; onDelete: () => void }) {
  const addReading = useAddReading(code);
  const deleteReading = useDeleteReading(code);
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const trend = trendOf(kpi);

  const chartData = (kpi.readings ?? []).map((r) => ({ date: r.measured_at.slice(5), value: Number(r.value) }));

  const badge = trend && {
    reached: { label: 'Cible atteinte', icon: CheckCircle2, className: 'bg-primary/15 text-primary' },
    improving: { label: 'En progrès', icon: TrendingUp, className: 'bg-emerald-500/15 text-emerald-600' },
    regressing: { label: 'En recul', icon: TrendingDown, className: 'bg-destructive/15 text-destructive' },
    stable: { label: 'Stable', icon: Minus, className: 'bg-muted text-muted-foreground' },
  }[trend.state];

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{kpi.name}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {kpi.baseline_value != null && `Départ ${kpi.baseline_value}${kpi.unit ? ` ${kpi.unit}` : ''}`}
            {kpi.target_value != null && ` · Cible ${kpi.target_value}${kpi.unit ? ` ${kpi.unit}` : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}>
              <badge.icon className="h-3 w-3" /> {badge.label}
            </span>
          )}
          <Button size="icon" variant="ghost" aria-label="Supprimer l’indicateur" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {chartData.length > 1 && (
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={32} />
                <ReTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="number"
            placeholder={`Nouveau relevé${kpi.unit ? ` (${kpi.unit})` : ''}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="sm:w-40"
          />
          <Input placeholder="Note (facultatif)" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button
            className="gap-1"
            disabled={addReading.isPending || value === ''}
            onClick={() =>
              addReading.mutateAsync({ kpiId: kpi.id, value: Number(value), note: note || undefined })
                .then(() => { setValue(''); setNote(''); })
                .catch(() => toast.error('Relevé non enregistré.'))
            }
          >
            <LineChartIcon className="h-4 w-4" /> Enregistrer
          </Button>
        </div>

        {(kpi.readings ?? []).length > 0 && (
          <ul className="space-y-1 text-sm">
            {kpi.readings.slice().reverse().map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5">
                <span>
                  <span className="font-medium">{r.value}{kpi.unit ? ` ${kpi.unit}` : ''}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{r.measured_at}</span>
                  {r.note && <span className="ml-2 text-xs text-muted-foreground">— {r.note}</span>}
                </span>
                <Button size="icon" variant="ghost" aria-label="Supprimer le relevé" onClick={() => deleteReading.mutate(r.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* ─────────────── Modules ─────────────── */

function ModulesTab({ code, participant }: { code: string; participant: PortalParticipant }) {
  const setStatus = useSetModuleStatus(code);
  const progressMap = new Map((participant.modules ?? []).map((m) => [m.module_id, m]));
  const modules = participant.recommended_modules ?? [];
  const done = modules.filter((m) => progressMap.get(m.id)?.status === 'done').length;


  return (
    <>
      <Card className="border-border/60">
        <CardContent className="pt-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Parcours recommandé</span>
            <span className="font-semibold">{done}/{modules.length}</span>
          </div>
          <Progress value={modules.length ? (done / modules.length) * 100 : 0} className="h-2" />
        </CardContent>
      </Card>

      {modules.map((m) => {
        const progress = progressMap.get(m.id);
        const status = progress?.status ?? 'todo';
        return (
          <Card key={m.id} className="border-border/60">
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{m.title}</p>
                  {m.summary && <p className="mt-1 text-sm text-muted-foreground">{m.summary}</p>}
                  {m.reason && <p className="mt-1 text-xs text-muted-foreground italic">{m.reason}</p>}
                </div>
                {m.level && <Badge variant="secondary" className="shrink-0">{m.level}</Badge>}
              </div>
              <div className="flex flex-wrap gap-2">
                {(['todo', 'in_progress', 'done'] as const).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={status === s ? 'default' : 'outline'}
                    disabled={setStatus.isPending}
                    onClick={() => setStatus.mutate({ moduleId: m.id, status: s })}
                  >
                    {MODULE_STATUS_LABEL[s]}
                  </Button>
                ))}
              </div>

              <CopilotModuleRunner
                code={code}
                participant={participant}
                moduleId={m.id}
                moduleTitle={m.title}
                completedLessons={progress?.completed_lessons ?? []}
              />
            </CardContent>
          </Card>
        );
      })}


      <Button asChild size="lg" className="w-full gap-2">
        <Link to="/pricing">Construire mon parcours AI × HR <ArrowRight className="h-4 w-4" /></Link>
      </Button>
    </>
  );
}

/* ─────────────── Cohort ─────────────── */

function CohortTab({
  participant, stats, loading,
}: { participant: PortalParticipant; stats?: import('@/hooks/useParticipantPortal').CohortStats | null; loading: boolean }) {
  if (!participant.session_id) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          <Users className="mx-auto mb-2 h-6 w-6 opacity-50" />
          Votre diagnostic n’est rattaché à aucun atelier : pas de comparaison de groupe.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  if (!stats?.ready) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          <Users className="mx-auto mb-2 h-6 w-6 opacity-50" />
          Les résultats du groupe s’afficheront dès que 3 participants auront répondu
          {typeof stats?.participants === 'number' && ` (${stats.participants} pour l’instant)`}.
        </CardContent>
      </Card>
    );
  }

  const avg = Number(stats.avg_score ?? 0);
  const delta = participant.opportunity_score - avg;

  return (
    <>
      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Vous et le groupe</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {stats.participants} participants · résultats agrégés et anonymes
          </p>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-primary/10 p-4">
              <p className="text-xs text-muted-foreground">Votre score</p>
              <p className="text-3xl font-bold text-primary">{participant.opportunity_score}</p>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <p className="text-xs text-muted-foreground">Moyenne du groupe</p>
              <p className="text-3xl font-bold">{avg}</p>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {delta > 0
              ? `Votre potentiel d’impact IA est ${Math.abs(delta)} points au-dessus du groupe.`
              : delta < 0
                ? `Votre potentiel d’impact IA est ${Math.abs(delta)} points en dessous du groupe.`
                : 'Vous êtes exactement dans la moyenne du groupe.'}
          </p>
        </CardContent>
      </Card>

      {stats.avg_dimensions && (
        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-base">Dimensions : vous vs. le groupe</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {DIMENSIONS.map((d) => {
              const mine = Math.round(participant.dimension_scores?.[d.key] ?? 0);
              const group = Math.round(Number(stats.avg_dimensions?.[d.key] ?? 0));
              return (
                <div key={d.key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{d.label}</span>
                    <span className="text-muted-foreground">Vous {mine} · Groupe {group}</span>
                  </div>
                  <Progress value={mine} className="h-2" />
                  <Progress value={group} className="h-1 opacity-50" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <CohortList title="Frictions les plus citées" items={(stats.top_frictions ?? []).map((f) => ({ label: f.label, count: f.count }))} />
      <CohortList title="Cas d’usage les plus demandés" items={(stats.top_use_cases ?? []).map((u) => ({ label: u.title, count: u.count }))} />
      <CohortList title="Modules les plus recommandés" items={(stats.top_modules ?? []).map((m) => ({ label: m.title, count: m.count }))} />
    </>
  );
}

function CohortList({ title, items }: { title: string; items: { label: string; count: number }[] }) {
  if (!items.length) return null;
  const max = Math.max(...items.map((i) => i.count));
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-primary" /> {title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((i) => (
          <div key={i.label} className="space-y-1">
            <div className="flex justify-between text-sm"><span>{i.label}</span><span className="text-muted-foreground">{i.count}</span></div>
            <Progress value={(i.count / max) * 100} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
