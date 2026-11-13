import { Plus, Printer, Trash2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import {
  HR_DOMAINS, MATURITY_QUESTIONS, OPPORTUNITY_LABELS, PRESETS, SENSITIVE_LABELS, actionPriority, computeScenario,
  dataCompleteness, domainLabel, domainMaturity, fmtH, fmtMAD, isPrerequisite, isQuickWin, sortedRoadmap, uid,
  type ActionStatus, type ProcessRow, type RoadmapAction, type ScenarioSettings,
} from '@/lib/hrWorkspace/model';
import { Metric, NumField, Panel, SelectField, Tag, TextField, type ViewProps } from './fields';

const ALLOC_LABELS: Record<keyof ScenarioSettings['allocation'], string> = {
  managerSupport: 'Accompagnement des managers', dataAnalysis: 'Analyse de données RH',
  talentDevelopment: 'Développement des talents', employeeExperience: 'Expérience collaborateur',
};

export function ScenarioView({ m, set }: ViewProps) {
  const s = computeScenario(m);
  const presets = (Object.keys(PRESETS) as ScenarioSettings['preset'][]).map((k) => ({ k, t: computeScenario(m, k) }));
  const setSc = (patch: Partial<ScenarioSettings>) => set((x) => ({ ...x, scenario: { ...x.scenario, ...patch } }));
  const updP = (id: string, patch: Partial<ProcessRow>) => set((x) => ({ ...x, processes: x.processes.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  const byDomain = HR_DOMAINS.map((d) => {
    const rows = s.perProcess.filter((r) => m.processes.find((p) => p.id === r.processId)?.domain === d.id);
    return { name: d.fr.split(' ')[0], Actuel: Math.round(rows.reduce((a, r) => a + r.baselineHours, 0)), Cible: Math.round(rows.reduce((a, r) => a + r.targetHours, 0)) };
  });

  return (
    <div className="space-y-4">
      <p className="rounded-md border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">Simulation calculée à partir de vos hypothèses. Le temps libéré est une capacité redéployable — aucune réduction d’effectif n’est recommandée.</p>
      <div className="grid gap-3 md:grid-cols-3">
        {presets.map(({ k, t }) => (
          <button key={k} onClick={() => setSc({ preset: k })} className={`rounded-lg border p-3 text-left ${m.scenario.preset === k ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-card hover:bg-muted'}`} aria-pressed={m.scenario.preset === k}>
            <p className="text-sm font-semibold">{PRESETS[k].label} <span className="font-normal text-muted-foreground">· réduction ×{PRESETS[k].reductionFactor}, adoption ×{PRESETS[k].adoptionFactor}</span></p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{fmtH(t.releasedHours)} libérées</p>
            <p className="text-xs tabular-nums text-muted-foreground">Valeur de capacité {fmtMAD(t.capacityValue)}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Heures actuelles" value={fmtH(s.baselineHours)} />
        <Metric label="Heures cibles" value={fmtH(s.targetHours)} />
        <Metric label="Valeur de capacité" value={fmtMAD(s.capacityValue)} hint="Non équivalente à des économies" />
        <Metric label="Impact cash net annuel" value={fmtMAD(s.annualNet)} tag={<Tag kind="estimate">Simulation</Tag>} hint={s.breakEvenMonths === null ? 'Point mort : Non atteint' : `Point mort : ${s.breakEvenMonths.toFixed(1)} mois`} />
      </div>

      {s.warnings.length > 0 && <ul className="space-y-1 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{s.warnings.map((w) => <li key={w}>{w}</li>)}</ul>}

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="Organisation actuelle vs cible" subtitle="Heures annuelles par domaine." className="lg:col-span-3">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDomain}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Legend />
                <Bar dataKey="Actuel" fill="hsl(var(--muted-foreground))" radius={[3, 3, 0, 0]} /><Bar dataKey="Cible" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Coûts & hypothèses" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Outils annuels" suffix="MAD" value={m.scenario.annualToolsCost} onChange={(v) => setSc({ annualToolsCost: v })} />
            <NumField label="Mise en œuvre (unique)" suffix="MAD" value={m.scenario.implementationCost} onChange={(v) => setSc({ implementationCost: v })} />
            <NumField label="Formation (unique)" suffix="MAD" value={m.scenario.trainingCost} onChange={(v) => setSc({ trainingCost: v })} />
            <NumField label="Part réalisable en cash" suffix="0–1" step={0.05} max={1} value={m.scenario.cashFraction} onChange={(v) => setSc({ cashFraction: v })} />
            <NumField label="Semaines travaillées / an" value={m.scenario.weeksPerYear} max={52} onChange={(v) => setSc({ weeksPerYear: v })} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Économies cash {fmtMAD(s.cashSavings)} · coût récurrent {fmtMAD(s.recurringCost)} · 1re année {fmtMAD(s.firstYearNet)} · ≈ {(s.releasedHours / Math.max(1, m.scenario.weeksPerYear)).toFixed(1)} h libérées / semaine</p>
        </Panel>
      </div>

      <Panel title="Hypothèses par processus" subtitle="Réduction et adoption de base (avant facteur du préréglage), revue humaine par occurrence.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2 font-medium">Processus</th><th className="font-medium">Réduction %</th><th className="font-medium">Adoption %</th><th className="font-medium">Revue (min)</th><th className="text-right font-medium">Actuel</th><th className="text-right font-medium">Libéré</th><th className="text-right font-medium">Cible</th></tr></thead>
            <tbody>
              {m.processes.map((p) => {
                const r = s.perProcess.find((x) => x.processId === p.id)!;
                const cell = (k: 'reductionPct' | 'adoptionPct' | 'reviewMinutes', max: number) => (
                  <input aria-label={`${k} ${p.name}`} type="number" min={0} max={max} value={p[k]} onChange={(e) => updP(p.id, { [k]: Math.min(max, Math.max(0, Number(e.target.value) || 0)) })} className="h-8 w-20 rounded border border-input bg-background px-2 tabular-nums" />
                );
                return (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 pr-2"><span className="font-medium">{p.name}</span>{r.warnings.length > 0 && <span className="block text-xs text-destructive">{r.warnings[0]}</span>}</td>
                    <td>{cell('reductionPct', 90)}</td><td>{cell('adoptionPct', 100)}</td><td>{cell('reviewMinutes', 600)}</td>
                    <td className="text-right tabular-nums">{fmtH(r.baselineHours)}</td><td className="text-right tabular-nums text-primary">{fmtH(r.releasedHours)}</td><td className="text-right tabular-nums">{fmtH(r.targetHours)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Réaffectation du temps libéré" subtitle="Répartition en % (total attendu : 100 %).">
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(ALLOC_LABELS) as (keyof ScenarioSettings['allocation'])[]).map((k) => (
              <div key={k}>
                <NumField label={ALLOC_LABELS[k]} suffix="%" max={100} value={m.scenario.allocation[k]} onChange={(v) => setSc({ allocation: { ...m.scenario.allocation, [k]: v } })} />
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">{fmtH(s.allocation[k])}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Formules">
          <ul className="space-y-1.5 font-mono text-xs text-foreground">
            <li>Heures de base = occurrences × minutes ÷ 60</li>
            <li>Heures libérées = max(0, base × réduction × adoption − occurrences × revue ÷ 60)</li>
            <li>Heures cibles = max(0, base − libérées)</li>
            <li>Valeur de capacité = libérées × coût horaire chargé</li>
            <li>Économies cash = valeur de capacité × part réalisable</li>
            <li>Net annuel = économies cash − outils annuels</li>
            <li>Net 1re année = net annuel − mise en œuvre − formation</li>
            <li>Point mort = coûts uniques ÷ net annuel × 12 (si net annuel &gt; 0)</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}

const STATUS: { value: ActionStatus; label: string }[] = [
  { value: 'proposed', label: 'Proposée' }, { value: 'approved', label: 'Approuvée' }, { value: 'in_progress', label: 'En cours' }, { value: 'done', label: 'Terminée' }, { value: 'blocked', label: 'Bloquée' },
];

export function RoadmapView({ m, set, demo }: ViewProps) {
  const list = sortedRoadmap(m.roadmap);
  const upd = (id: string, patch: Partial<RoadmapAction>) => set((x) => ({ ...x, roadmap: x.roadmap.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  const del = (id: string) => window.confirm('Supprimer cette action ?') && set((x) => ({ ...x, roadmap: x.roadmap.filter((a) => a.id !== id).map((a) => (a.dependsOn === id ? { ...a, dependsOn: '' } : a)) }));
  const addManual = () => set((x) => ({ ...x, roadmap: [...x.roadmap, { id: uid(), title: 'Nouvelle action', category: 'other', sourceType: 'domain', sourceId: 'pilotage', sourceLabel: domainLabel('pilotage'), reason: 'Action ajoutée manuellement', owner: '', approver: '', dueDate: '', impact: 3, effort: 3, dependsOn: '', risk: '', kpiBaseline: '', kpiTarget: '', status: 'proposed', horizon: 30, validation: '', proof: '' }] }));

  return (
    <div className="space-y-4">
      <div className="hrw-noprint space-y-4">
        <Panel title="Feuille de route 30 / 60 / 90 jours" subtitle="Priorité = impact × 2 − effort − 1 si dépendance. Tri par horizon puis priorité. Distincte du plan de formation."
          actions={<div className="flex gap-2"><Button size="sm" variant="outline" onClick={addManual}><Plus className="mr-1 h-4 w-4" />Action manuelle</Button><Button size="sm" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" />Imprimer / PDF</Button></div>}>
          {list.length === 0 && <p className="text-sm text-muted-foreground">Aucune action. Créez-en depuis « Diagnostic & opportunités ».</p>}
          <div className="grid gap-4 lg:grid-cols-3">
            {([30, 60, 90] as const).map((h) => (
              <div key={h}>
                <h3 className="mb-2 text-sm font-semibold">{h} jours</h3>
                <div className="space-y-3">
                  {list.filter((a) => a.horizon === h).map((a) => (
                    <details key={a.id} className="rounded-md border bg-background p-3">
                      <summary className="cursor-pointer list-none">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Tag kind="estimate">P {actionPriority(a)}</Tag>
                          {isQuickWin(a) && <Tag kind="priority">Gain rapide</Tag>}
                          {isPrerequisite(a, m.roadmap) && <Tag kind="input">Prérequis</Tag>}
                          <span className="text-xs text-muted-foreground">{STATUS.find((s) => s.value === a.status)?.label}</span>
                        </div>
                        <p className="mt-1 font-medium text-foreground">{a.title}</p>
                        <p className="text-xs text-muted-foreground">Source : {a.sourceLabel}</p>
                      </summary>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <TextField label="Titre" value={a.title} onChange={(v) => upd(a.id, { title: v })} className="sm:col-span-2" />
                        <TextField label="Responsable" value={a.owner} onChange={(v) => upd(a.id, { owner: v })} />
                        <TextField label="Approbateur" value={a.approver} onChange={(v) => upd(a.id, { approver: v })} />
                        <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground" htmlFor={`d-${a.id}`}>Échéance</label><input id={`d-${a.id}`} type="date" value={a.dueDate} onChange={(e) => upd(a.id, { dueDate: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" /></div>
                        <SelectField label="Horizon" value={String(a.horizon) as '30' | '60' | '90'} onChange={(v) => upd(a.id, { horizon: Number(v) as 30 | 60 | 90 })} options={[{ value: '30', label: '30 jours' }, { value: '60', label: '60 jours' }, { value: '90', label: '90 jours' }]} />
                        <NumField label="Impact" suffix="1–5" min={1} max={5} value={a.impact} onChange={(v) => upd(a.id, { impact: v })} />
                        <NumField label="Effort" suffix="1–5" min={1} max={5} value={a.effort} onChange={(v) => upd(a.id, { effort: v })} />
                        <SelectField label="Dépend de" value={a.dependsOn} onChange={(v) => upd(a.id, { dependsOn: v })} options={[{ value: '', label: 'Aucune' }, ...m.roadmap.filter((o) => o.id !== a.id).map((o) => ({ value: o.id, label: o.title }))]} />
                        <SelectField label="Statut" value={a.status} onChange={(v) => upd(a.id, { status: v })} options={STATUS} />
                        <TextField label="Risque" value={a.risk} onChange={(v) => upd(a.id, { risk: v })} />
                        <TextField label="KPI de départ" value={a.kpiBaseline} onChange={(v) => upd(a.id, { kpiBaseline: v })} />
                        <TextField label="KPI cible" value={a.kpiTarget} onChange={(v) => upd(a.id, { kpiTarget: v })} />
                        <TextField label="Validation humaine" multiline value={a.validation} onChange={(v) => upd(a.id, { validation: v })} className="sm:col-span-2" />
                        <TextField label="Preuve attendue" multiline value={a.proof} onChange={(v) => upd(a.id, { proof: v })} className="sm:col-span-2" />
                      </div>
                      <div className="mt-2 flex justify-end"><Button variant="ghost" size="sm" onClick={() => del(a.id)}><Trash2 className="mr-1 h-4 w-4" />Supprimer</Button></div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Report m={m} demo={demo} />
    </div>
  );
}

function Report({ m, demo }: { m: ViewProps['m']; demo: boolean }) {
  const s = computeScenario(m);
  const mat = domainMaturity(m.answers);
  const comp = dataCompleteness(m);
  const answered = MATURITY_QUESTIONS.filter((q) => typeof m.answers[q.id] === 'number').length;
  const sensitive = m.processes.filter((p) => p.sensitive !== 'none');
  const th = 'border-b py-1 pr-2 text-left font-medium';
  const td = 'border-b py-1 pr-2 align-top';
  return (
    <section id="hrw-report" className="hrw-report rounded-lg border bg-card p-5 text-sm">
      <p className="hrw-noprint mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aperçu du rapport imprimable</p>
      <header className="border-b pb-3">
        <h2 className="text-xl font-semibold">Rapport de transformation RH — {m.company.name || 'Entreprise non nommée'}</h2>
        <p className="text-muted-foreground">{m.company.sector || 'Secteur non précisé'} · effectif {m.company.headcount ?? 'non précisé'} · {new Date().toLocaleDateString('fr-FR')}</p>
        {demo && <p className="mt-1 font-semibold text-accent-foreground">DONNÉES FICTIVES — démonstration, aucun chiffre réel.</p>}
      </header>
      <h3 className="mt-4 font-semibold">Méthodologie</h3>
      <p>Analyse déterministe des données saisies : charge = occurrences × durée ; maturité calculée sur les seules questions répondues ; opportunités par règles explicites ; scénario « {PRESETS[m.scenario.preset].label} ». Aucune décision n’est prise par l’IA.</p>
      <h3 className="mt-4 font-semibold">Couverture du diagnostic</h3>
      <p>Questionnaire : {answered}/{MATURITY_QUESTIONS.length} réponses · complétude globale {Math.round(comp.overall * 100)} %.</p>
      <table className="mt-2 w-full"><thead><tr><th className={th}>Domaine</th><th className={th}>Score</th><th className={th}>Couverture</th></tr></thead>
        <tbody>{mat.map((d) => <tr key={d.domain}><td className={td}>{d.label}</td><td className={td}>{d.score === null ? 'Non évalué' : `${d.score.toFixed(1)}/4`}</td><td className={td}>{d.answered}/{d.total}</td></tr>)}</tbody></table>
      <h3 className="mt-4 font-semibold">Équipe et preuves saisies</h3>
      <table className="mt-2 w-full"><thead><tr><th className={th}>Processus</th><th className={th}>Domaine</th><th className={th}>Preuve</th><th className={th}>Actuel</th><th className={th}>Simulé</th></tr></thead>
        <tbody>{m.processes.map((p) => { const r = s.perProcess.find((x) => x.processId === p.id)!; return <tr key={p.id}><td className={td}>{p.name}</td><td className={td}>{domainLabel(p.domain)}</td><td className={td}>{p.evidence || 'Aucune (hypothèse)'}</td><td className={td}>{fmtH(r.baselineHours)}</td><td className={td}>{fmtH(r.targetHours)}</td></tr>; })}</tbody></table>
      <h3 className="mt-4 font-semibold">Scénario et hypothèses</h3>
      <p>Heures : {fmtH(s.baselineHours)} → {fmtH(s.targetHours)} ({fmtH(s.releasedHours)} libérées). Valeur de capacité {fmtMAD(s.capacityValue)} ; part cash {m.scenario.cashFraction} → économies {fmtMAD(s.cashSavings)} ; outils {fmtMAD(s.recurringCost)}/an ; net annuel {fmtMAD(s.annualNet)} ; net 1re année {fmtMAD(s.firstYearNet)} ; point mort {s.breakEvenMonths === null ? 'Non atteint' : `${s.breakEvenMonths.toFixed(1)} mois`}.</p>
      <h3 className="mt-4 font-semibold">Approbations humaines</h3>
      {sensitive.length === 0 ? <p>Aucune décision sensible déclarée.</p> : <ul className="list-disc pl-5">{sensitive.map((p) => <li key={p.id}>{p.name} — {SENSITIVE_LABELS[p.sensitive]} — approbateur : {p.approver || 'à désigner'}</li>)}</ul>}
      <h3 className="mt-4 font-semibold">Feuille de route</h3>
      <table className="mt-2 w-full"><thead><tr><th className={th}>Horizon</th><th className={th}>Action</th><th className={th}>Source</th><th className={th}>Responsable / approbateur</th><th className={th}>KPI</th><th className={th}>Statut</th></tr></thead>
        <tbody>{sortedRoadmap(m.roadmap).map((a) => <tr key={a.id}><td className={td}>{a.horizon} j</td><td className={td}>{a.title}{a.category !== 'other' ? ` (${OPPORTUNITY_LABELS[a.category]})` : ''}</td><td className={td}>{a.sourceLabel}</td><td className={td}>{a.owner || '—'} / {a.approver || '—'}</td><td className={td}>{a.kpiBaseline || '?'} → {a.kpiTarget || '?'}</td><td className={td}>{STATUS.find((x) => x.value === a.status)?.label}</td></tr>)}</tbody></table>
    </section>
  );
}
