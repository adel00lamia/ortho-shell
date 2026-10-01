import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Users, Bot, Clock, Coins, RotateCcw, Building2 } from 'lucide-react';

type Mode = 'humain' | 'assisté' | 'automatisable';
interface Task { name: string; hours: number; ai: number; tool: string }
interface Role { title: string; count: number; hourly: number; tasks: Task[] }
interface Team { name: string; roles: Role[] }

// Typical HR department of a 50–500 employee Moroccan company. Every figure is an editable assumption.
const TEMPLATE: Team[] = [
  { name: 'Direction RH', roles: [{ title: 'DRH', count: 1, hourly: 450, tasks: [
    { name: 'Reporting RH mensuel au comité', hours: 4, ai: 60, tool: 'Tableau de bord + synthèse IA' },
    { name: 'Pilotage stratégie RH & dialogue social', hours: 10, ai: 10, tool: '—' },
  ] }] },
  { name: 'Recrutement', roles: [{ title: 'Chargé(e) de recrutement', count: 2, hourly: 180, tasks: [
    { name: 'Tri des CV et présélection', hours: 10, ai: 70, tool: 'Matching CV ↔ fiche de poste' },
    { name: 'Rédaction des annonces', hours: 3, ai: 80, tool: 'Génération d’annonces' },
    { name: 'Planification des entretiens', hours: 4, ai: 75, tool: 'Agenda automatisé' },
    { name: 'Entretiens et décision', hours: 12, ai: 15, tool: 'Grille d’entretien assistée' },
  ] }] },
  { name: 'Paie & administration', roles: [{ title: 'Gestionnaire paie', count: 2, hourly: 160, tasks: [
    { name: 'Saisie variables de paie & contrôles', hours: 12, ai: 65, tool: 'Contrôles automatiques d’anomalies' },
    { name: 'Déclarations CNSS / AMO / IR', hours: 4, ai: 50, tool: 'Pré-remplissage et vérification' },
    { name: 'Attestations et courriers administratifs', hours: 6, ai: 85, tool: 'Modèles + génération automatique' },
    { name: 'Réponses aux questions des salariés', hours: 6, ai: 70, tool: 'Assistant RH (base de connaissances)' },
  ] }] },
  { name: 'Formation & compétences', roles: [{ title: 'Responsable formation', count: 1, hourly: 220, tasks: [
    { name: 'Recueil et analyse des besoins', hours: 6, ai: 55, tool: 'Diagnostic + analyse des écarts' },
    { name: 'Construction du plan de formation', hours: 5, ai: 60, tool: 'Plan IA Qimatak' },
    { name: 'Dossiers CSF / OFPPT', hours: 6, ai: 55, tool: 'Pré-remplissage des modèles' },
    { name: 'Suivi logistique des sessions', hours: 5, ai: 60, tool: 'Convocations et émargement automatisés' },
  ] }] },
  { name: 'Développement RH', roles: [{ title: 'HR Business Partner', count: 1, hourly: 250, tasks: [
    { name: 'Préparation des entretiens annuels', hours: 5, ai: 50, tool: 'Synthèse des évaluations' },
    { name: 'Accompagnement des managers', hours: 10, ai: 10, tool: '—' },
    { name: 'Analyse turnover et absentéisme', hours: 3, ai: 65, tool: 'Analyse automatique des données' },
  ] }] },
];

const KEY = 'qimatak-hr-transformation-v1';
const WEEKS = 45;
const mode = (ai: number): Mode => (ai >= 65 ? 'automatisable' : ai >= 35 ? 'assisté' : 'humain');
// Share of time actually freed — deliberately conservative, to validate.
const freedShare = (ai: number) => (ai >= 65 ? 0.6 : ai >= 35 ? 0.3 : 0.05);
const mad = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} MAD`;
const modeStyle: Record<Mode, string> = {
  humain: 'bg-muted text-muted-foreground',
  assisté: 'bg-secondary text-secondary-foreground',
  automatisable: 'bg-primary text-primary-foreground',
};

export default function HRTransformation() {
  const [teams, setTeams] = useState<Team[]>(() => {
    try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch { /* ignore */ }
    return TEMPLATE;
  });
  const [toolCost, setToolCost] = useState(60000);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(teams)); }, [teams]);

  const edit = (ti: number, ri: number, fn: (r: Role) => Role) =>
    setTeams(ts => ts.map((t, i) => i !== ti ? t : { ...t, roles: t.roles.map((r, j) => j !== ri ? r : fn(r)) }));

  const stats = useMemo(() => {
    let hours = 0, freed = 0, value = 0, people = 0;
    const byTeam = teams.map(t => {
      let th = 0, tf = 0, tv = 0;
      t.roles.forEach(r => {
        people += r.count;
        r.tasks.forEach(k => {
          const h = k.hours * r.count * WEEKS, f = h * freedShare(k.ai);
          th += h; tf += f; tv += f * r.hourly;
        });
      });
      hours += th; freed += tf; value += tv;
      return { name: t.name, hours: th, freed: tf, value: tv };
    });
    return { hours, freed, value, people, byTeam, net: value - toolCost, fte: freed / (40 * WEEKS) };
  }, [teams, toolCost]);

  const top = useMemo(() => teams.flatMap(t => t.roles.flatMap(r => r.tasks.map(k => ({
    ...k, team: t.name, role: r.title, value: k.hours * r.count * WEEKS * freedShare(k.ai) * r.hourly,
  })))).sort((a, b) => b.value - a.value).slice(0, 5), [teams]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transformation RH · IA · Coûts</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Structure type d’un département RH, tâches où l’IA peut aider et temps / coûts libérés.
            Tous les chiffres sont des hypothèses modifiables, à valider avec vos données réelles.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setTeams(TEMPLATE)}><RotateCcw className="h-4 w-4 mr-1" />Réinitialiser le modèle</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={Users} label="Effectif RH" value={`${stats.people} personnes`} />
        <Kpi icon={Clock} label="Heures libérées / an" value={`${Math.round(stats.freed).toLocaleString('fr-FR')} h`} sub={`≈ ${stats.fte.toFixed(1)} ETP sur ${Math.round(stats.hours).toLocaleString('fr-FR')} h`} />
        <Kpi icon={Coins} label="Valeur du temps libéré" value={mad(stats.value)} sub="par an, au coût horaire saisi" />
        <Kpi icon={Bot} label="Gain net année 1" value={mad(stats.net)} sub={`après ${mad(toolCost)} d’outils IA`} warn={stats.net < 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Structure du département RH</CardTitle>
            <CardDescription>Modifiez effectifs, coût horaire (MAD chargé), heures par semaine et potentiel IA de chaque tâche.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teams.map((t, ti) => (
              <div key={t.name} className="rounded-lg border p-3 space-y-3">
                <p className="font-semibold text-foreground">{t.name}</p>
                {t.roles.map((r, ri) => (
                  <div key={r.title} className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="font-medium">{r.title}</span>
                      <label className="flex items-center gap-1 text-muted-foreground">Effectif
                        <Input type="number" min={0} className="h-8 w-16" value={r.count} onChange={e => edit(ti, ri, x => ({ ...x, count: Math.max(0, +e.target.value) }))} /></label>
                      <label className="flex items-center gap-1 text-muted-foreground">MAD/h
                        <Input type="number" min={0} className="h-8 w-20" value={r.hourly} onChange={e => edit(ti, ri, x => ({ ...x, hourly: Math.max(0, +e.target.value) }))} /></label>
                    </div>
                    {r.tasks.map((k, ki) => {
                      const m = mode(k.ai);
                      return (
                        <div key={k.name} className="grid grid-cols-12 items-center gap-2 rounded-md bg-muted/40 p-2 text-sm">
                          <div className="col-span-12 md:col-span-5">
                            <p className="text-foreground">{k.name}</p>
                            <p className="text-xs text-muted-foreground">{k.tool}</p>
                          </div>
                          <label className="col-span-4 md:col-span-2 flex items-center gap-1 text-xs text-muted-foreground">
                            <Input type="number" min={0} className="h-8 w-14" value={k.hours} onChange={e => edit(ti, ri, x => ({ ...x, tasks: x.tasks.map((y, i) => i === ki ? { ...y, hours: Math.max(0, +e.target.value) } : y) }))} />h/sem
                          </label>
                          <div className="col-span-5 md:col-span-3">
                            <Slider value={[k.ai]} max={100} step={5} onValueChange={([v]) => edit(ti, ri, x => ({ ...x, tasks: x.tasks.map((y, i) => i === ki ? { ...y, ai: v } : y) }))} />
                            <p className="text-[11px] text-muted-foreground mt-1">Potentiel IA {k.ai}%</p>
                          </div>
                          <span className={`col-span-3 md:col-span-2 justify-self-end rounded px-2 py-0.5 text-[11px] ${modeStyle[m]}`}>{m}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Où appliquer l’IA en premier</CardTitle>
              <CardDescription>Les 5 tâches qui libèrent le plus de valeur.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {top.map((k, i) => (
                <div key={k.name} className="text-sm">
                  <p className="font-medium text-foreground">{i + 1}. {k.name}</p>
                  <p className="text-xs text-muted-foreground">{k.team} · {k.role} · {k.tool}</p>
                  <p className="text-xs text-primary">{mad(k.value)} / an</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Gains par équipe</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {stats.byTeam.map(t => (
                <div key={t.name} className="text-sm">
                  <div className="flex justify-between"><span>{t.name}</span><span className="text-muted-foreground">{mad(t.value)}</span></div>
                  <div className="h-2 rounded bg-muted mt-1"><div className="h-2 rounded bg-primary" style={{ width: `${t.hours ? (t.freed / t.hours) * 100 : 0}%` }} /></div>
                  <p className="text-[11px] text-muted-foreground">{Math.round(t.freed)} h libérées sur {Math.round(t.hours)} h</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Coût des outils IA (an 1)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input type="number" min={0} value={toolCost} onChange={e => setToolCost(Math.max(0, +e.target.value))} />
              <p className="text-xs text-muted-foreground">Licences, paramétrage et formation des équipes RH. Montant à chiffrer avec vos fournisseurs.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-1 text-xs text-muted-foreground">
              <p><Badge variant="outline" className="mr-1">Méthode</Badge>Heures/an = h/sem × effectif × {WEEKS} semaines.</p>
              <p>Temps libéré : 60 % si automatisable (≥ 65 %), 30 % si assisté (35–64 %), 5 % sinon.</p>
              <p>Le temps libéré est réaffecté à des missions à valeur ajoutée ; ce n’est pas une suppression de poste.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, warn }: { icon: typeof Users; label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <Card><CardContent className="pt-5">
      <p className="flex items-center gap-1 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</p>
      <p className={`text-xl font-semibold ${warn ? 'text-destructive' : 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </CardContent></Card>
  );
}
