import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  HR_DOMAINS, OPPORTUNITY_LABELS, capacityByRole, computeScenario, dataCompleteness, domainMaturity,
  fmtH, nextAction, topPriorities, uid, type DomainId, type TeamRole,
} from '@/lib/hrWorkspace/model';
import { Metric, NumField, Panel, Tag, TextField, type ViewId, type ViewProps } from './fields';

const pct = (v: number) => `${Math.round(v * 100)} %`;

export function SummaryView({ m, go }: ViewProps) {
  const maturity = domainMaturity(m.answers);
  const scen = computeScenario(m);
  const comp = dataCompleteness(m);
  const top = topPriorities(m);
  const next = nextAction(m);
  const cap = capacityByRole(m);
  const available = cap.reduce((s, r) => s + r.available, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 md:flex md:items-center md:justify-between md:gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Prochaine action</p>
          <p className="mt-1 text-base font-medium text-foreground">{next.label}</p>
        </div>
        <Button className="mt-3 md:mt-0" onClick={() => go(next.view as ViewId)}>Ouvrir <ArrowRight className="ml-1 h-4 w-4" /></Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Charge modélisée" value={fmtH(scen.baselineHours)} tag={<Tag kind="estimate">Calcul</Tag>} hint={`${m.processes.length} processus saisis`} />
        <Metric label="Heures disponibles" value={fmtH(available)} tag={<Tag kind="input">Saisie</Tag>} hint={`${m.roles.reduce((s, r) => s + r.fte, 0)} ETP`} />
        <Metric label="Temps libérable (scénario)" value={fmtH(scen.releasedHours)} tag={<Tag kind="estimate">Simulation</Tag>} hint="Après revue humaine" />
        <Metric label="Complétude des données" value={pct(comp.overall)} tag={comp.overall < 0.6 ? <Tag kind="missing">Incomplet</Tag> : <Tag kind="input">Saisie</Tag>} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="Maturité par domaine RH" subtitle="Score 1–4 calculé uniquement sur les questions répondues." className="lg:col-span-3">
          <ul className="space-y-3">
            {maturity.map((d) => (
              <li key={d.domain}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-foreground">{d.label}</span>
                  <span className="tabular-nums text-muted-foreground">{d.score === null ? 'Non évalué' : `${d.score.toFixed(1)} / 4`} · couverture {d.answered}/{d.total}</span>
                </div>
                <div className="mt-1 h-2 rounded bg-muted" aria-hidden>
                  {d.score !== null && <div className="h-2 rounded bg-primary" style={{ width: `${(d.score / 4) * 100}%`, opacity: 0.4 + d.coverage * 0.6 }} />}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Complétude" subtitle="Ce qui manque avant de décider." className="lg:col-span-2">
          <ul className="space-y-3">
            {comp.parts.map((p) => (
              <li key={p.label} className="text-sm">
                <div className="flex justify-between"><span>{p.label}</span><span className="tabular-nums text-muted-foreground">{pct(p.ratio)}</span></div>
                <div className="mt-1 h-2 rounded bg-muted"><div className="h-2 rounded bg-foreground/70" style={{ width: pct(p.ratio).replace(' ', '') }} /></div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="3 priorités étayées" subtitle="Seuls les processus avec une preuve documentée sont classés." actions={<Button variant="outline" size="sm" onClick={() => go('diagnostic')}>Voir le diagnostic</Button>}>
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune priorité étayée : documentez la source (preuve) de vos processus pour en faire apparaître.</p>
        ) : (
          <ol className="grid gap-3 md:grid-cols-3">
            {top.map((o, i) => (
              <li key={o.id} className="rounded-md border bg-background p-3">
                <div className="flex items-center gap-2"><Tag kind="priority">#{i + 1}</Tag><span className="text-xs font-medium text-muted-foreground">{OPPORTUNITY_LABELS[o.category]}</span></div>
                <p className="mt-2 font-medium text-foreground">{o.processName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{o.reason}</p>
                <p className="mt-2 text-xs tabular-nums text-foreground">≈ {fmtH(o.releasedHours)} libérables / an (simulation)</p>
                {o.humanAuthority && <p className="mt-2 text-xs"><Tag kind="human">Décision humaine</Tag></p>}
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}

export function OrganisationView({ m, set }: ViewProps) {
  const cap = capacityByRole(m);
  const updRole = (id: string, patch: Partial<TeamRole>) => set((x) => ({ ...x, roles: x.roles.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const addRole = () => set((x) => ({ ...x, roles: [...x.roles, { id: uid(), title: 'Nouveau rôle', fte: 1, domains: [], responsibilities: '', availableHoursPerFte: 1600, loadedHourlyCost: 0, competencies: '' }] }));
  const delRole = (id: string) => {
    if (!window.confirm('Supprimer ce rôle ? Les processus associés perdront leur responsable.')) return;
    set((x) => ({ ...x, roles: x.roles.filter((r) => r.id !== id), processes: x.processes.map((p) => (p.ownerRoleId === id ? { ...p, ownerRoleId: '' } : p)) }));
  };
  const toggleDomain = (r: TeamRole, d: DomainId) => updRole(r.id, { domains: r.domains.includes(d) ? r.domains.filter((x) => x !== d) : [...r.domains, d] });

  return (
    <div className="space-y-4">
      <Panel title="Contexte entreprise" subtitle="Saisi par vous. Aucun ratio sectoriel n’est utilisé pour juger l’effectif RH.">
        <div className="grid gap-3 md:grid-cols-4">
          <TextField label="Entreprise" value={m.company.name} onChange={(v) => set((x) => ({ ...x, company: { ...x.company, name: v } }))} />
          <TextField label="Secteur d’activité" value={m.company.sector} onChange={(v) => set((x) => ({ ...x, company: { ...x.company, sector: v } }))} />
          <NumField label="Effectif total" value={m.company.headcount} onChange={(v) => set((x) => ({ ...x, company: { ...x.company, headcount: v } }))} />
          <TextField label="Sites" value={m.company.sites} onChange={(v) => set((x) => ({ ...x, company: { ...x.company, sites: v } }))} />
        </div>
      </Panel>

      <Panel title="Carte des responsabilités" subtitle="Quel rôle couvre quel domaine RH.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2 pr-2 font-medium">Domaine</th>{m.roles.map((r) => <th key={r.id} className="px-2 py-2 font-medium">{r.title}</th>)}</tr></thead>
            <tbody>
              {HR_DOMAINS.map((d) => {
                const covered = m.roles.some((r) => r.domains.includes(d.id));
                return (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-2 pr-2 font-medium">{d.fr} {!covered && <Tag kind="missing">Non couvert</Tag>}</td>
                    {m.roles.map((r) => (
                      <td key={r.id} className="px-2 py-2 text-center">
                        <Checkbox aria-label={`${r.title} couvre ${d.fr}`} checked={r.domains.includes(d.id)} onCheckedChange={() => toggleDomain(r, d.id)} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Équipe RH" subtitle="Charge modélisée = somme des processus dont le rôle est responsable." actions={<Button size="sm" onClick={addRole}><Plus className="mr-1 h-4 w-4" />Ajouter un rôle</Button>}>
        {m.roles.length === 0 && <p className="text-sm text-muted-foreground">Aucun rôle saisi.</p>}
        <div className="space-y-3">
          {m.roles.map((r) => {
            const c = cap.find((x) => x.id === r.id);
            return (
              <div key={r.id} className="rounded-md border bg-background p-3">
                <div className="grid gap-3 md:grid-cols-5">
                  <TextField label="Intitulé" value={r.title} onChange={(v) => updRole(r.id, { title: v })} className="md:col-span-2" />
                  <NumField label="ETP" value={r.fte} step={0.1} onChange={(v) => updRole(r.id, { fte: v })} />
                  <NumField label="Heures dispo / ETP" suffix="h/an" value={r.availableHoursPerFte} max={2500} onChange={(v) => updRole(r.id, { availableHoursPerFte: v })} />
                  <NumField label="Coût horaire chargé" suffix="MAD" value={r.loadedHourlyCost} onChange={(v) => updRole(r.id, { loadedHourlyCost: v })} />
                  <TextField label="Responsabilités" multiline value={r.responsibilities} onChange={(v) => updRole(r.id, { responsibilities: v })} className="md:col-span-3" />
                  <TextField label="Compétences" multiline value={r.competencies} onChange={(v) => updRole(r.id, { competencies: v })} className="md:col-span-2" />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="tabular-nums text-muted-foreground">
                    Modélisé {fmtH(c?.modelled ?? 0)} / disponible {fmtH(c?.available ?? 0)}
                    {c && c.available > 0 && <> · <strong className={c.utilisation > 1 ? 'text-destructive' : 'text-foreground'}>{pct(c.utilisation)}</strong></>}
                    {c && c.utilisation < 1 && c.available > 0 && ' (le reste n’est pas inventorié, pas « inoccupé »)'}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => delRole(r.id)} aria-label={`Supprimer ${r.title}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
