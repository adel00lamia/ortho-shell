import { useState } from 'react';
import { ArrowDown, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  ANSWER_LABELS, HR_DOMAINS, MATURITY_QUESTIONS, OPPORTUNITY_LABELS, SENSITIVE_LABELS, automationBlockReason,
  baselineHours, buildOpportunities, capacityByRole, domainLabel, domainMaturity, emptyProcess, fmtH, uid,
  type DomainId, type Opportunity, type ProcessRow, type RiskLevel, type SensitiveDecision,
} from '@/lib/hrWorkspace/model';
import { NumField, Panel, SelectField, Tag, TextField, type ViewProps } from './fields';

const RISK: { value: RiskLevel; label: string }[] = [{ value: 'low', label: 'Faible' }, { value: 'medium', label: 'Moyen' }, { value: 'high', label: 'Élevé' }];

export function ProcessView({ m, set }: ViewProps) {
  const [selected, setSelected] = useState<string | null>(m.processes[0]?.id ?? null);
  const [filter, setFilter] = useState<DomainId | 'all'>('all');
  const p = m.processes.find((x) => x.id === selected) ?? null;
  const upd = (patch: Partial<ProcessRow>) => p && set((x) => ({ ...x, processes: x.processes.map((r) => (r.id === p.id ? { ...r, ...patch } : r)) }));
  const add = () => {
    const row = { ...emptyProcess(filter === 'all' ? 'paie' : filter, m.roles[0]?.id ?? ''), name: 'Nouveau processus' };
    set((x) => ({ ...x, processes: [...x.processes, row] }));
    setSelected(row.id);
  };
  const del = () => {
    if (!p || !window.confirm(`Supprimer « ${p.name} » ?`)) return;
    set((x) => ({ ...x, processes: x.processes.filter((r) => r.id !== p.id) }));
    setSelected(null);
  };
  const rows = m.processes.filter((x) => filter === 'all' || x.domain === filter);
  const roleOpts = [{ value: '', label: '— à désigner —' }, ...m.roles.map((r) => ({ value: r.id, label: r.title }))];

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Panel title="Inventaire" subtitle="Saisie manuelle, enregistrée localement." className="lg:col-span-2"
        actions={<Button size="sm" onClick={add}><Plus className="mr-1 h-4 w-4" />Ajouter</Button>}>
        <SelectField label="Filtrer par domaine" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'Tous les domaines' }, ...HR_DOMAINS.map((d) => ({ value: d.id, label: d.fr }))]} />
        <ul className="mt-3 max-h-[60vh] space-y-1 overflow-y-auto">
          {rows.map((r) => (
            <li key={r.id}>
              <button onClick={() => setSelected(r.id)} className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${r.id === selected ? 'border-primary bg-primary/5' : 'bg-background hover:bg-muted'}`}>
                <span className="block font-medium text-foreground">{r.name || 'Sans nom'}</span>
                <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  {domainLabel(r.domain)} · <span className="tabular-nums">{fmtH(baselineHours(r, m.roles))}/an</span>
                  {!r.evidence.trim() && <Tag kind="missing">Sans preuve</Tag>}
                  {r.sensitive !== 'none' && <Tag kind="human">Sensible</Tag>}
                </span>
              </button>
            </li>
          ))}
          {rows.length === 0 && <li className="text-sm text-muted-foreground">Aucun processus.</li>}
        </ul>
      </Panel>

      <div className="space-y-4 lg:col-span-3">
        {!p ? <Panel title="Sélectionnez un processus"><p className="text-sm text-muted-foreground">Choisissez un processus à gauche ou ajoutez-en un.</p></Panel> : (
          <>
            <Panel title="Chaîne du processus" subtitle="De l’entrée à la preuve d’impact.">
              <ol className="space-y-1.5 text-sm">
                {[
                  ['Entrée', p.input], ['Activité actuelle', `${p.name} — ${p.tools || 'outils non précisés'}`], ['Sortie', p.output],
                  ['Goulot', p.bottleneck || p.painPoint], ['Changement proposé', p.proposedChange],
                  ['Revue humaine', p.reviewMinutes ? `${p.reviewMinutes} min par occurrence` : ''], ['Approbation', p.approver],
                  ['KPI / preuve', p.baselineKpi || p.targetKpi ? `${p.baselineKpi || '?'} → ${p.targetKpi || '?'}` : ''],
                ].map(([k, v], i, arr) => (
                  <li key={k}>
                    <div className={`flex gap-3 rounded-md border px-3 py-2 ${k === 'Revue humaine' || k === 'Approbation' ? 'border-foreground/40 bg-foreground/5' : 'bg-background'}`}>
                      <span className="w-32 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{k}</span>
                      <span className={v ? 'text-foreground' : 'italic text-muted-foreground'}>{v || 'À renseigner'}</span>
                    </div>
                    {i < arr.length - 1 && <ArrowDown className="mx-auto my-0.5 h-3 w-3 text-muted-foreground" aria-hidden />}
                  </li>
                ))}
              </ol>
            </Panel>

            <Panel title="Fiche processus" actions={<Button variant="ghost" size="sm" onClick={del}><Trash2 className="mr-1 h-4 w-4" />Supprimer</Button>}>
              <div className="grid gap-3 md:grid-cols-2">
                <TextField label="Nom du processus" value={p.name} onChange={(v) => upd({ name: v })} />
                <SelectField label="Domaine RH" value={p.domain} onChange={(v) => upd({ domain: v })} options={HR_DOMAINS.map((d) => ({ value: d.id, label: d.fr }))} />
                <SelectField label="Rôle responsable" value={p.ownerRoleId} onChange={(v) => upd({ ownerRoleId: v })} options={roleOpts} />
                <SelectField label="Base du volume" value={p.volumeBasis} onChange={(v) => upd({ volumeBasis: v })} options={[{ value: 'team', label: 'Pour toute l’équipe' }, { value: 'person', label: 'Par ETP du rôle responsable' }]} />
                <NumField label="Occurrences annuelles" value={p.annualOccurrences} onChange={(v) => upd({ annualOccurrences: v })} />
                <NumField label="Minutes par occurrence" value={p.minutesPerOccurrence} max={6000} onChange={(v) => upd({ minutesPerOccurrence: v })} />
                <p className="text-xs text-muted-foreground md:col-span-2">Charge annuelle = occurrences{p.volumeBasis === 'person' ? ' × ETP' : ''} × minutes ÷ 60 = <strong className="tabular-nums text-foreground">{fmtH(baselineHours(p, m.roles))}</strong></p>
                <TextField label="Preuve / source du volume" multiline value={p.evidence} placeholder="ex. export SIRH mars, registre des demandes…" onChange={(v) => upd({ evidence: v })} className="md:col-span-2" />
                <TextField label="Outils actuels" value={p.tools} onChange={(v) => upd({ tools: v })} />
                <TextField label="Point de douleur" value={p.painPoint} onChange={(v) => upd({ painPoint: v })} />
                <TextField label="Entrée" value={p.input} onChange={(v) => upd({ input: v })} />
                <TextField label="Sortie" value={p.output} onChange={(v) => upd({ output: v })} />
                <TextField label="Goulot d’étranglement" value={p.bottleneck} onChange={(v) => upd({ bottleneck: v })} />
                <TextField label="Changement proposé" value={p.proposedChange} onChange={(v) => upd({ proposedChange: v })} />
                <SelectField label="Risque" value={p.risk} onChange={(v) => upd({ risk: v })} options={RISK} />
                <SelectField label="Décision sensible" value={p.sensitive} onChange={(v) => upd({ sensitive: v as SensitiveDecision })} options={Object.entries(SENSITIVE_LABELS).map(([value, label]) => ({ value: value as SensitiveDecision, label }))} />
                <TextField label="KPI actuel" value={p.baselineKpi} onChange={(v) => upd({ baselineKpi: v })} />
                <TextField label="KPI cible" value={p.targetKpi} onChange={(v) => upd({ targetKpi: v })} />
                <TextField label="Approbateur humain responsable" value={p.approver} onChange={(v) => upd({ approver: v })} />
                <NumField label="Potentiel d’assistance IA estimé" suffix="%" max={100} value={p.aiAssistPotential} onChange={(v) => upd({ aiAssistPotential: v })} />
                <div className="flex flex-wrap gap-4 md:col-span-2">
                  {([['standardised', 'Processus standardisé'], ['dataQualityIssue', 'Problème de qualité des données'], ['trainingGap', 'Écart de compétences']] as const).map(([k, l]) => (
                    <div key={k} className="flex items-center gap-2"><Checkbox id={`${p.id}-${k}`} checked={p[k]} onCheckedChange={(c) => upd({ [k]: c === true } as Partial<ProcessRow>)} /><Label htmlFor={`${p.id}-${k}`} className="text-sm">{l}</Label></div>
                  ))}
                </div>
              </div>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

export function DiagnosticView({ m, set }: ViewProps) {
  const maturity = domainMaturity(m.answers);
  const opps = buildOpportunities(m);
  const cap = capacityByRole(m);
  const [cat, setCat] = useState<keyof typeof OPPORTUNITY_LABELS | 'all'>('all');
  const shown = opps.filter((o) => cat === 'all' || o.category === cat);
  const inRoadmap = (o: Opportunity) => m.roadmap.some((a) => a.sourceId === o.processId && a.category === o.category);
  const toRoadmap = (o: Opportunity) => {
    const p = m.processes.find((x) => x.id === o.processId);
    set((x) => ({ ...x, roadmap: [...x.roadmap, {
      id: uid(), title: `${OPPORTUNITY_LABELS[o.category]} — ${o.processName}`, category: o.category, sourceType: 'process', sourceId: o.processId,
      sourceLabel: o.processName, reason: o.reason, owner: m.roles.find((r) => r.id === p?.ownerRoleId)?.title ?? '', approver: p?.approver ?? '',
      dueDate: '', impact: o.releasedHours > 100 ? 4 : 3, effort: o.category === 'supervised_automation' ? 4 : 2, dependsOn: '', risk: p?.risk === 'high' ? 'Risque élevé déclaré' : '',
      kpiBaseline: p?.baselineKpi ?? '', kpiTarget: p?.targetKpi ?? '', status: 'proposed', horizon: o.category === 'data_quality' || o.category === 'standardisation' ? 30 : 60,
      validation: o.humanAuthority ?? '', proof: '',
    }] }));
    toast.success('Action proposée ajoutée à la feuille de route');
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Questionnaire de maturité" subtitle="Une question sans réponse réduit la couverture, jamais le score.">
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            {HR_DOMAINS.map((d) => {
              const s = maturity.find((x) => x.domain === d.id)!;
              return (
                <fieldset key={d.id}>
                  <legend className="mb-2 flex w-full justify-between text-sm font-semibold"><span>{d.fr}</span><span className="tabular-nums font-normal text-muted-foreground">{s.score === null ? '—' : `${s.score.toFixed(1)}/4`} · {s.answered}/{s.total}</span></legend>
                  {MATURITY_QUESTIONS.filter((q) => q.domain === d.id).map((q) => (
                    <div key={q.id} className="mb-2">
                      <p className="text-sm text-foreground">{q.text}</p>
                      <div className="mt-1 flex flex-wrap gap-1" role="radiogroup" aria-label={q.text}>
                        {[1, 2, 3, 4].map((v) => (
                          <button key={v} role="radio" aria-checked={m.answers[q.id] === v}
                            onClick={() => set((x) => ({ ...x, answers: { ...x.answers, [q.id]: x.answers[q.id] === v ? null : v } }))}
                            className={`rounded border px-2 py-1 text-xs ${m.answers[q.id] === v ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>
                            {v} · {ANSWER_LABELS[v]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </fieldset>
              );
            })}
          </div>
        </Panel>

        <Panel title="Charge vs capacité" subtitle="Charge = processus inventoriés ; capacité = ETP × heures disponibles.">
          <ul className="space-y-3">
            {cap.map((r) => (
              <li key={r.id} className="text-sm">
                <div className="flex justify-between gap-2"><span className="font-medium">{r.title}</span><span className="tabular-nums text-muted-foreground">{fmtH(r.modelled)} / {fmtH(r.available)}</span></div>
                <div className="mt-1 h-2 rounded bg-muted"><div className={`h-2 rounded ${r.utilisation > 1 ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${Math.min(100, r.utilisation * 100)}%` }} /></div>
                {r.utilisation > 1 && <p className="mt-1 text-xs text-destructive">Charge saisie supérieure à la capacité : volumes à vérifier avant toute conclusion.</p>}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">Aucune conclusion de sur- ou sous-effectif n’est tirée : seul l’écart entre vos propres saisies est montré.</p>
        </Panel>
      </div>

      <Panel title={`Opportunités (${opps.length})`} subtitle="Règles déterministes appliquées à vos saisies. Ce sont des propositions modifiables, pas des changements exécutés."
        actions={<SelectField label="Catégorie" value={cat} onChange={setCat} options={[{ value: 'all', label: 'Toutes' }, ...Object.entries(OPPORTUNITY_LABELS).map(([value, label]) => ({ value: value as keyof typeof OPPORTUNITY_LABELS, label }))]} className="w-56" />}>
        <div className="grid gap-3 md:grid-cols-2">
          {shown.map((o) => {
            const p = m.processes.find((x) => x.id === o.processId);
            const block = p ? automationBlockReason(p) : null;
            return (
              <article key={o.id} className="rounded-md border bg-background p-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag kind="estimate">{OPPORTUNITY_LABELS[o.category]}</Tag>
                  {o.evidenced ? <Tag kind="input">Étayé</Tag> : <Tag kind="missing">Hypothèse à valider</Tag>}
                </div>
                <p className="mt-2 font-medium text-foreground">{o.processName}</p>
                <p className="text-xs text-muted-foreground">Source : processus « {o.processName} » · {domainLabel(o.domain)}{p?.evidence ? ` · preuve : ${p.evidence}` : ''}</p>
                <p className="mt-2 text-sm text-foreground">{o.reason}</p>
                {o.category === 'ai_assistance' && block && <p className="mt-1 text-xs text-muted-foreground">{block}</p>}
                {o.humanAuthority && <p className="mt-2 flex gap-1.5 text-xs text-foreground"><ShieldCheck className="h-4 w-4 shrink-0" />{o.humanAuthority}</p>}
                <div className="mt-3 flex justify-end">
                  <Button size="sm" variant={inRoadmap(o) ? 'secondary' : 'default'} disabled={inRoadmap(o)} onClick={() => toRoadmap(o)}>{inRoadmap(o) ? 'Dans la feuille de route' : 'Créer une action'}</Button>
                </div>
              </article>
            );
          })}
          {shown.length === 0 && <p className="text-sm text-muted-foreground">Aucune opportunité détectée avec les données actuelles.</p>}
        </div>
      </Panel>
    </div>
  );
}
