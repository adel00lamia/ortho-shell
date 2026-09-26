import { useEffect, useMemo, useState } from 'react';
import { analyseTask, MODE_LABELS, normalizeCriteria, type OperatingMode } from '@/lib/humanAiScoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Task = { id: string; name: string; role_name: string | null; hours_per_week: number; criteria: unknown };
const SHARE: Record<OperatingMode, number> = { human_only: 0, human_ai: 0.2, ai_approval: 0.4, ai_autonomous: 0.6, automation: 0.75 };
const MODES = Object.keys(SHARE) as OperatingMode[];
const WEEKS = 46; // working weeks per year (assumption)
const sel = 'h-8 rounded-md border border-input bg-background px-2 text-xs';

export function ScenarioPlanner({ tasks, companyId, lang }: { tasks: Task[]; companyId?: string | null; lang: string }) {
  const L = (fr: string, en: string) => (lang === 'fr' ? fr : en);
  const key = `qimatak-scenario-${companyId ?? 'local'}`;
  const [cost, setCost] = useState<Record<string, number>>({});
  const [overrides, setOverrides] = useState<Record<string, OperatingMode>>({});
  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(key) || '{}'); setCost(s.cost || {}); setOverrides(s.overrides || {}); } catch { /* ignore */ }
  }, [key]);
  useEffect(() => { localStorage.setItem(key, JSON.stringify({ cost, overrides })); }, [key, cost, overrides]);

  const roles = useMemo(() => [...new Set(tasks.map((t) => t.role_name || L('Non affecté', 'Unassigned')))], [tasks, lang]);
  const rows = useMemo(() => tasks.map((t) => {
    const role = t.role_name || L('Non affecté', 'Unassigned');
    const a = analyseTask(t.criteria, Number(t.hours_per_week));
    const c = normalizeCriteria(t.criteria);
    const target = overrides[t.id] ?? a.mode;
    const h = Number(t.hours_per_week) || 0;
    const rate = cost[role] || 0;
    const annualH = h * WEEKS;
    const freedH = annualH * SHARE[target];
    return { t, role, a, c, target, annualH, freedH, annualCost: annualH * rate, freedCost: freedH * rate, rate };
  }), [tasks, overrides, cost, lang]);

  const tot = rows.reduce((s, r) => ({ h: s.h + r.annualH, fh: s.fh + r.freedH, c: s.c + r.annualCost, fc: s.fc + r.freedCost }), { h: 0, fh: 0, c: 0, fc: 0 });
  const fmt = (v: number) => Math.round(v).toLocaleString('fr-FR');
  const anyRate = roles.some((r) => cost[r]);

  const risk = roles.map((role) => {
    const rs = rows.filter((r) => r.role === role);
    const hrs = rs.reduce((s, r) => s + r.annualH, 0) || 1;
    const exposure = Math.round(rs.reduce((s, r) => s + r.a.aiSuitability * r.annualH, 0) / hrs);
    // Obsolescence: exposed, repetitive work with little judgment/interaction
    const obs = Math.round(rs.reduce((s, r) => s + r.annualH * ((r.c.repetitiveness - 1) / 4 * 0.5 + (5 - r.c.judgment) / 4 * 0.3 + (5 - r.c.human_interaction) / 4 * 0.2), 0) / hrs * 100);
    const lvl = (v: number) => v >= 65 ? 'high' : v >= 40 ? 'medium' : 'low';
    return { role, exposure, obs, lvl: lvl(Math.max(exposure, obs)), freed: rs.reduce((s, r) => s + r.freedH, 0) };
  }).sort((a, b) => b.exposure - a.exposure);

  if (!tasks.length) return <p className="text-sm text-muted-foreground">{L('Ajoutez des tâches dans « Processus & tâches » pour modéliser des scénarios.', 'Add tasks in "Processes & tasks" to model scenarios.')}</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        {[
          [L('Heures actuelles / an', 'Current hours / year'), fmt(tot.h) + ' h'],
          [L('Heures libérées (scénario)', 'Hours freed (scenario)'), fmt(tot.fh) + ' h'],
          [L('Coût actuel / an', 'Current cost / year'), anyRate ? fmt(tot.c) + ' MAD' : L('À chiffrer', 'To be costed')],
          [L('Capacité valorisée', 'Capacity value'), anyRate ? fmt(tot.fc) + ' MAD' : L('À chiffrer', 'To be costed')],
        ].map(([l, v]) => <Card key={l}><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{l}</p><p className="text-2xl font-semibold">{v}</p></CardContent></Card>)}
      </div>
      <p className="text-xs text-muted-foreground">{L(`Estimations indicatives (${WEEKS} semaines/an, taux de gain par mode). À valider avec vos données réelles avant toute décision.`, `Indicative estimates (${WEEKS} weeks/year, gain rate per mode). Validate with real data before deciding.`)}</p>

      <Card><CardHeader><CardTitle className="text-base">{L('Coût horaire chargé par rôle (MAD/h)', 'Loaded hourly cost per role (MAD/h)')}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{roles.map((r) => (
          <label key={r} className="text-sm flex items-center justify-between gap-2"><span className="truncate">{r}</span>
            <Input className="w-28 h-8" type="number" min={0} placeholder={L('À saisir', 'Enter')} value={cost[r] || ''} onChange={(e) => setCost({ ...cost, [r]: Math.max(0, +e.target.value) })} /></label>))}
        </CardContent></Card>

      <Card><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">{L('Scénario what-if : actuel → futur', 'What-if scenario: current → future')}</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setOverrides({})}>{L('Revenir aux recommandations', 'Reset to recommendations')}</Button></CardHeader>
        <CardContent className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2">{L('Tâche', 'Task')}</th><th>{L('Rôle', 'Role')}</th><th>h/an</th><th>{L('Mode futur', 'Future mode')}</th><th>{L('h libérées', 'h freed')}</th><th>MAD</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.t.id} className="border-b border-border">
            <td className="py-2">{r.t.name}</td><td className="text-muted-foreground">{r.role}</td><td>{fmt(r.annualH)}</td>
            <td><select className={sel} value={r.target} onChange={(e) => setOverrides({ ...overrides, [r.t.id]: e.target.value as OperatingMode })}>
              {MODES.map((m) => <option key={m} value={m}>{MODE_LABELS[m][lang === 'fr' ? 'fr' : 'en']}{m === r.a.mode ? ' ★' : ''}</option>)}</select></td>
            <td className="font-medium">{fmt(r.freedH)}</td><td>{r.rate ? fmt(r.freedCost) : '—'}</td></tr>)}</tbody>
        </table><p className="text-xs text-muted-foreground mt-2">★ {L('mode recommandé par l’analyse', 'mode recommended by analysis')}</p></CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">{L('Risque par rôle', 'Risk per role')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">{risk.map((r) => (
          <div key={r.role} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 text-sm">
            <span className="font-medium">{r.role}</span>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-muted-foreground">{L('Exposition IA', 'AI exposure')} {r.exposure}%</span>
              <span className="text-muted-foreground">{L('Obsolescence', 'Obsolescence')} {r.obs}%</span>
              <span className="text-muted-foreground">{fmt(r.freed)} h {L('libérées', 'freed')}</span>
              <Badge variant={r.lvl === 'high' ? 'destructive' : r.lvl === 'medium' ? 'secondary' : 'outline'}>
                {r.lvl === 'high' ? L('Reskilling prioritaire', 'Priority reskilling') : r.lvl === 'medium' ? L('Upskilling IA', 'AI upskilling') : L('Stable', 'Stable')}</Badge>
            </div></div>))}
        </CardContent></Card>
    </div>
  );
}
