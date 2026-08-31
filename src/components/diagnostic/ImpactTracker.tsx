import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus, Plus, Trash2 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MeasurementRow } from '@/hooks/useRootCauseDiagnostics';

export interface KpiDefinition {
  kpi_name: string;
  unit: string | null;
  baseline_value: number | null;
  target_value: number | null;
  direction: string;
}

interface ImpactTrackerProps {
  fr: boolean;
  measurements: MeasurementRow[];
  disabled?: boolean;
  onAddKpi: (row: KpiDefinition) => void;
  onAddReading: (row: KpiDefinition & { actual_value: number; measured_at: string; notes: string | null }) => void;
  onUpdate: (row: Partial<MeasurementRow> & { id: string; kpi_name: string }) => void;
  onDelete: (id: string) => void;
}

interface KpiGroup {
  key: string;
  definition: MeasurementRow;
  readings: MeasurementRow[];
}

function sortKey(m: MeasurementRow) {
  return m.measured_at ?? m.created_at ?? '';
}

/** Groups flat measurement rows into one KPI per name: the oldest row carries the definition. */
function groupByKpi(measurements: MeasurementRow[]): KpiGroup[] {
  const map = new Map<string, MeasurementRow[]>();
  for (const m of measurements) {
    const list = map.get(m.kpi_name) ?? [];
    list.push(m);
    map.set(m.kpi_name, list);
  }
  return [...map.entries()].map(([key, rows]) => {
    const ordered = [...rows].sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));
    const definition = ordered[0];
    const readings = rows
      .filter((r) => r.actual_value != null)
      .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    return { key, definition, readings };
  });
}

function progressToTarget(baseline: number | null, target: number | null, actual: number | null) {
  if (baseline == null || target == null || actual == null || target === baseline) return null;
  const pct = ((actual - baseline) / (target - baseline)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function ImpactTracker({
  fr, measurements, disabled, onAddKpi, onAddReading, onUpdate, onDelete,
}: ImpactTrackerProps) {
  const groups = useMemo(() => groupByKpi(measurements), [measurements]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{fr ? 'Mesure d’impact' : 'Impact measurement'}</CardTitle>
          <CardDescription>
            {fr
              ? 'Saisissez vos indicateurs réels, relevez-les dans le temps et vérifiez si la performance progresse.'
              : 'Enter your real KPIs, record readings over time and verify whether performance improves.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {groups.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {fr ? 'Aucun indicateur suivi. Ajoutez-en un ci-dessous.' : 'No indicator tracked yet. Add one below.'}
            </p>
          )}
          {groups.map((g) => (
            <KpiCard key={g.key} fr={fr} group={g} onAddReading={onAddReading} onUpdate={onUpdate} onDelete={onDelete} />
          ))}

          <Separator />
          <NewKpiRow fr={fr} disabled={disabled} onAdd={onAddKpi} />
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  fr, group, onAddReading, onUpdate, onDelete,
}: {
  fr: boolean;
  group: KpiGroup;
  onAddReading: ImpactTrackerProps['onAddReading'];
  onUpdate: ImpactTrackerProps['onUpdate'];
  onDelete: ImpactTrackerProps['onDelete'];
}) {
  const { definition: def, readings } = group;
  const [value, setValue] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const latest = readings[readings.length - 1] ?? null;
  const previous = readings[readings.length - 2] ?? null;
  const increaseIsGood = def.direction === 'increase';

  const vsBaseline =
    latest?.actual_value != null && def.baseline_value != null ? latest.actual_value - def.baseline_value : null;
  const vsPrevious =
    latest?.actual_value != null && previous?.actual_value != null ? latest.actual_value - previous.actual_value : null;

  const improving = vsBaseline == null ? null : increaseIsGood ? vsBaseline > 0 : vsBaseline < 0;
  const flat = vsBaseline === 0;
  const pct = progressToTarget(def.baseline_value, def.target_value, latest?.actual_value ?? null);
  const targetReached =
    latest?.actual_value != null && def.target_value != null &&
    (increaseIsGood ? latest.actual_value >= def.target_value : latest.actual_value <= def.target_value);

  const fmt = (n: number) => `${Math.round(n * 100) / 100}${def.unit ? ` ${def.unit}` : ''}`;

  const chartData = readings.map((r) => ({
    date: r.measured_at ? new Date(r.measured_at).toLocaleDateString(fr ? 'fr-MA' : 'en-GB', { day: '2-digit', month: 'short' }) : '—',
    value: r.actual_value as number,
  }));

  return (
    <div className="rounded-lg border border-border/60 p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{def.kpi_name}</p>
          <p className="text-xs text-muted-foreground">
            {fr ? 'Référence' : 'Baseline'}: {def.baseline_value ?? '—'}{def.unit ? ` ${def.unit}` : ''} ·{' '}
            {fr ? 'Objectif' : 'Target'}: {def.target_value ?? '—'}{def.unit ? ` ${def.unit}` : ''} ·{' '}
            {increaseIsGood ? (fr ? 'à augmenter' : 'should increase') : (fr ? 'à baisser' : 'should decrease')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {latest?.actual_value != null && (
            <Badge variant="secondary" className="font-mono text-xs">
              {fr ? 'Actuel' : 'Current'} {fmt(latest.actual_value)}
            </Badge>
          )}
          {improving != null && !flat && (
            <Badge
              variant="outline"
              className={improving ? 'border-emerald-500/40 text-emerald-600' : 'border-destructive/40 text-destructive'}
            >
              {improving ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
              {improving ? (fr ? 'Amélioration' : 'Improving') : (fr ? 'Régression' : 'Regressing')}
              {vsBaseline != null && ` ${vsBaseline > 0 ? '+' : ''}${fmt(vsBaseline)}`}
            </Badge>
          )}
          {flat && (
            <Badge variant="outline" className="text-muted-foreground">
              <Minus className="mr-1 h-3 w-3" />{fr ? 'Stable' : 'Flat'}
            </Badge>
          )}
          {vsPrevious != null && vsPrevious !== 0 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              <ArrowRight className="mr-1 h-3 w-3" />
              {fr ? 'vs relevé précédent' : 'vs previous'} {vsPrevious > 0 ? '+' : ''}{fmt(vsPrevious)}
            </Badge>
          )}
          {targetReached && (
            <Badge className="bg-emerald-500 text-emerald-50">{fr ? 'Objectif atteint' : 'Target reached'}</Badge>
          )}
          <Button
            size="icon"
            variant="ghost"
            aria-label={fr ? 'Supprimer l’indicateur' : 'Delete indicator'}
            onClick={() => onDelete(def.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {pct != null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{fr ? 'Progression vers l’objectif' : 'Progress toward target'}</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} />
        </div>
      )}

      {chartData.length > 1 && (
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {readings.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{fr ? 'Relevés' : 'Readings'}</p>
          {readings.map((r) => (
            <div key={r.id} className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1 text-xs">
              <Input
                type="date"
                className="h-7 w-[140px] text-xs"
                defaultValue={r.measured_at ?? ''}
                onBlur={(e) => onUpdate({ id: r.id, kpi_name: r.kpi_name, measured_at: e.target.value || null })}
              />
              <Input
                type="number"
                className="h-7 w-[110px] text-xs"
                defaultValue={r.actual_value ?? ''}
                onBlur={(e) =>
                  onUpdate({
                    id: r.id,
                    kpi_name: r.kpi_name,
                    actual_value: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
              />
              <span className="text-muted-foreground">{def.unit}</span>
              <span className="flex-1 truncate text-muted-foreground">{r.notes ?? ''}</span>
              {r.id !== def.id && (
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(r.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-4 md:items-end">
        <div className="space-y-1">
          <Label className="text-xs">{fr ? 'Nouveau relevé' : 'New reading'}</Label>
          <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={def.unit ?? ''} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{fr ? 'Date' : 'Date'}</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1 md:col-span-1">
          <Label className="text-xs">{fr ? 'Note' : 'Note'}</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={fr ? 'Contexte…' : 'Context…'} />
        </div>
        <Button
          disabled={value === ''}
          onClick={() => {
            if (def.actual_value == null) {
              onUpdate({
                id: def.id,
                kpi_name: def.kpi_name,
                actual_value: Number(value),
                measured_at: date || null,
                notes: notes.trim() || null,
              });
            } else {
              onAddReading({
                kpi_name: def.kpi_name,
                unit: def.unit,
                baseline_value: def.baseline_value,
                target_value: def.target_value,
                direction: def.direction,
                actual_value: Number(value),
                measured_at: date,
                notes: notes.trim() || null,
              });
            }
            setValue(''); setNotes('');
          }}
        >
          <Plus className="mr-1 h-4 w-4" />{fr ? 'Enregistrer' : 'Record'}
        </Button>
      </div>
    </div>
  );
}

function NewKpiRow({ fr, onAdd, disabled }: { fr: boolean; onAdd: (row: KpiDefinition) => void; disabled?: boolean }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [baseline, setBaseline] = useState('');
  const [target, setTarget] = useState('');
  const [direction, setDirection] = useState('decrease');

  return (
    <div className="grid gap-2 md:grid-cols-6 md:items-end">
      <div className="md:col-span-2 space-y-1">
        <Label className="text-xs">{fr ? 'Nouvel indicateur' : 'New indicator'}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={fr ? 'Taux de réclamation' : 'Complaint rate'} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{fr ? 'Unité' : 'Unit'}</Label>
        <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="%" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{fr ? 'Référence' : 'Baseline'}</Label>
        <Input type="number" value={baseline} onChange={(e) => setBaseline(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{fr ? 'Objectif' : 'Target'}</Label>
        <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Select value={direction} onValueChange={setDirection}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="decrease">{fr ? 'Baisser' : 'Decrease'}</SelectItem>
            <SelectItem value="increase">{fr ? 'Augmenter' : 'Increase'}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          disabled={disabled || !name.trim()}
          onClick={() => {
            onAdd({
              kpi_name: name.trim(),
              unit: unit.trim() || null,
              baseline_value: baseline === '' ? null : Number(baseline),
              target_value: target === '' ? null : Number(target),
              direction,
            });
            setName(''); setUnit(''); setBaseline(''); setTarget('');
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
