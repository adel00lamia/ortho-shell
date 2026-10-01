import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Coins,
  Database,
  FileCheck2,
  Gauge,
  Play,
  UserRound,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type Mode = 'humain' | 'assisté' | 'automatisable';
type Approval = 'DRH' | 'Manager RH' | 'Expert métier';
interface Task { name: string; hours: number; ai: number; tool: string }
interface Role { title: string; count: number; hourly: number; tasks: Task[] }
interface Team { name: string; roles: Role[] }
interface TaskContext extends Task { team: string; role: string; count: number; hourly: number; key: string }

const TEMPLATE: Team[] = [
  { name: 'Direction RH', roles: [{ title: 'DRH', count: 1, hourly: 450, tasks: [
    { name: 'Reporting RH mensuel au comité', hours: 4, ai: 60, tool: 'Tableau de bord + synthèse IA' },
    { name: 'Pilotage stratégie RH & dialogue social', hours: 10, ai: 10, tool: 'Analyse de scénarios' },
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
    { name: 'Accompagnement des managers', hours: 10, ai: 10, tool: 'Bibliothèque de recommandations' },
    { name: 'Analyse turnover et absentéisme', hours: 3, ai: 65, tool: 'Analyse automatique des données' },
  ] }] },
];

const TEAM_DETAILS: Record<string, { mission: string; input: string; output: string; approver: Approval; risk: string; kpi: string }> = {
  'Direction RH': { mission: 'Transformer les données RH en décisions alignées à la stratégie.', input: 'Objectifs, effectifs, budget, climat social, indicateurs', output: 'Scénario RH, arbitrage et note au comité', approver: 'DRH', risk: 'Décision stratégique ou sociale', kpi: 'Décisions exécutées et impacts mesurés' },
  Recrutement: { mission: 'Réduire le délai de recrutement sans déléguer la sélection à l’IA.', input: 'Fiche de poste, CV, critères validés, disponibilités', output: 'Shortlist justifiée et dossier d’entretien', approver: 'Manager RH', risk: 'Biais, discrimination, décision sur une personne', kpi: 'Délai, qualité à 90 jours, diversité de la shortlist' },
  'Paie & administration': { mission: 'Fiabiliser les opérations répétitives et traiter les exceptions.', input: 'Variables, règles, justificatifs, calendrier légal', output: 'Dossier contrôlé, anomalies et documents prêts', approver: 'Expert métier', risk: 'Erreur financière, légale ou donnée sensible', kpi: 'Taux d’erreur, délai et exceptions résolues' },
  'Formation & compétences': { mission: 'Relier les écarts réels aux actions et à leur impact.', input: 'Objectifs, postes, compétences, évaluations, budget', output: 'Plan priorisé, dossier OFPPT et indicateurs', approver: 'DRH', risk: 'Budget sans besoin prouvé ou conformité incomplète', kpi: 'Écart réduit, application terrain et impact métier' },
  'Développement RH': { mission: 'Aider les managers à développer et redéployer les talents.', input: 'Évaluations, aspirations, rôles, mobilité et performance', output: 'Options de développement et plan manager', approver: 'Manager RH', risk: 'Interprétation sensible ou décision de carrière', kpi: 'Mobilité, progression et rétention' },
};

const KEY = 'qimatak-hr-transformation-v1';
const WEEKS = 45;
const mode = (ai: number): Mode => (ai >= 65 ? 'automatisable' : ai >= 35 ? 'assisté' : 'humain');
const freedShare = (ai: number) => (ai >= 65 ? 0.6 : ai >= 35 ? 0.3 : 0.05);
const mad = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} MAD`;
const modeLabels: Record<Mode, string> = { humain: 'Humain', assisté: 'IA assistée', automatisable: 'Automatisé sous contrôle' };
const modeStyle: Record<Mode, string> = {
  humain: 'border-border bg-muted text-muted-foreground',
  assisté: 'border-primary/25 bg-primary/10 text-primary',
  automatisable: 'border-accent/50 bg-accent/15 text-accent-foreground',
};

function flattenTeams(teams: Team[]): TaskContext[] {
  return teams.flatMap((team) => team.roles.flatMap((role) => role.tasks.map((task, index) => ({
    ...task,
    team: team.name,
    role: role.title,
    count: role.count,
    hourly: role.hourly,
    key: `${team.name}-${role.title}-${index}`,
  }))));
}

export default function HRTransformation() {
  const [teams, setTeams] = useState<Team[]>(() => {
    try { const saved = localStorage.getItem(KEY); if (saved) return JSON.parse(saved) as Team[]; } catch { /* use template */ }
    return TEMPLATE;
  });
  const [toolCost, setToolCost] = useState(60000);
  const [selectedTeam, setSelectedTeam] = useState('Formation & compétences');
  const [selectedTaskKey, setSelectedTaskKey] = useState('Formation & compétences-Responsable formation-1');
  const [teamFilter, setTeamFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(teams)); }, [teams]);

  const tasks = useMemo(() => flattenTeams(teams), [teams]);
  const selectedTask = tasks.find((task) => task.key === selectedTaskKey) ?? tasks[0];
  const detail = TEAM_DETAILS[selectedTask?.team ?? selectedTeam] ?? TEAM_DETAILS['Direction RH'];
  const filteredTasks = tasks.filter((task) =>
    (teamFilter === 'all' || task.team === teamFilter)
    && (modeFilter === 'all' || mode(task.ai) === modeFilter)
    && `${task.name} ${task.role} ${task.tool}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );

  const edit = (teamIndex: number, roleIndex: number, change: (role: Role) => Role) =>
    setTeams((current) => current.map((team, index) => index !== teamIndex ? team : {
      ...team,
      roles: team.roles.map((role, childIndex) => childIndex !== roleIndex ? role : change(role)),
    }));

  const stats = useMemo(() => {
    let hours = 0; let freed = 0; let value = 0; let people = 0;
    const byTeam = teams.map((team) => {
      let teamHours = 0; let teamFreed = 0; let teamValue = 0;
      team.roles.forEach((role) => {
        people += role.count;
        role.tasks.forEach((task) => {
          const annualHours = task.hours * role.count * WEEKS;
          const released = annualHours * freedShare(task.ai);
          teamHours += annualHours; teamFreed += released; teamValue += released * role.hourly;
        });
      });
      hours += teamHours; freed += teamFreed; value += teamValue;
      return { name: team.name, hours: teamHours, freed: teamFreed, value: teamValue };
    });
    return { hours, freed, value, people, byTeam, net: value - toolCost, fte: freed / (40 * WEEKS) };
  }, [teams, toolCost]);

  const top = useMemo(() => tasks.map((task) => ({
    ...task,
    value: task.hours * task.count * WEEKS * freedShare(task.ai) * task.hourly,
  })).sort((a, b) => b.value - a.value).slice(0, 5), [tasks]);

  const chooseTeam = (name: string) => {
    const firstTask = tasks.find((task) => task.team === name);
    setSelectedTeam(name);
    if (firstTask) setSelectedTaskKey(firstTask.key);
  };

  return (
    <div className="transformation-shell min-h-full space-y-6 bg-background p-4 md:p-6">
      <header className="border-b border-border pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-3">Blueprint opérationnel · hypothèses à valider</Badge>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">Transformation RH · carte Humain + IA</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Visualisez toute la chaîne RH, le travail confié à l’IA, le contrôle humain obligatoire,
              l’approbation finale et la preuve qui permet de mesurer le résultat.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setTeams(TEMPLATE)}>
            <RotateCcw className="mr-2 h-4 w-4" />Réinitialiser les hypothèses
          </Button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi icon={Users} label="Équipe RH modélisée" value={`${stats.people} personnes`} sub={`${teams.length} pôles · ${tasks.length} activités`} />
          <Kpi icon={Clock} label="Capacité potentielle" value={`${Math.round(stats.freed).toLocaleString('fr-FR')} h/an`} sub={`≈ ${stats.fte.toFixed(1)} ETP à redéployer`} />
          <Kpi icon={Coins} label="Valeur du temps libéré" value={mad(stats.value)} sub="Hypothèse annuelle modifiable" />
          <Kpi icon={ShieldCheck} label="Décision sensible" value="100 % humaine" sub="IA = analyse et proposition" />
        </div>
      </header>

      <Tabs defaultValue="map" className="space-y-5">
        <TabsList className="grid h-auto w-full grid-cols-3 lg:w-fit">
          <TabsTrigger value="map">Carte organisationnelle</TabsTrigger>
          <TabsTrigger value="workflow">Workflow détaillé</TabsTrigger>
          <TabsTrigger value="case">Coûts & capacité</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="transformation-canvas overflow-hidden border border-border bg-card p-4 md:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-foreground">Organisation cible et empreinte IA</h2>
                  <p className="text-xs text-muted-foreground">Sélectionnez un pôle pour examiner ses activités et ses contrôles.</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {(Object.keys(modeLabels) as Mode[]).map((item) => <Badge key={item} variant="outline" className={modeStyle[item]}>{modeLabels[item]}</Badge>)}
                </div>
              </div>

              <div className="mx-auto max-w-6xl">
                <Button variant={selectedTeam === 'Direction RH' ? 'default' : 'outline'} onClick={() => chooseTeam('Direction RH')} className="mx-auto flex h-auto min-h-24 w-full max-w-sm flex-col whitespace-normal p-4 text-center">
                  <span className="flex items-center gap-2 text-base font-semibold"><Building2 className="h-5 w-5" />Direction RH</span>
                  <span className={cn('mt-1 text-xs font-normal', selectedTeam === 'Direction RH' ? 'text-primary-foreground/75' : 'text-muted-foreground')}>Gouvernance · arbitrage · dialogue social</span>
                </Button>
                <div className="flex h-12 justify-center"><div className="h-full w-px bg-border" /></div>
                <div className="hidden h-px bg-border md:block" />
                <div className="grid gap-3 md:grid-cols-4">
                  {teams.filter((team) => team.name !== 'Direction RH').map((team) => {
                    const teamTasks = tasks.filter((task) => task.team === team.name);
                    const assisted = teamTasks.filter((task) => mode(task.ai) !== 'humain').length;
                    const isActive = selectedTeam === team.name;
                    return (
                      <div key={team.name} className="relative pt-4">
                        <div className="absolute left-1/2 top-0 hidden h-4 w-px bg-border md:block" />
                        <Button variant={isActive ? 'default' : 'outline'} onClick={() => chooseTeam(team.name)} className="h-full min-h-40 w-full flex-col items-start justify-start whitespace-normal p-4 text-left">
                          <span className="flex w-full items-center justify-between gap-2">
                            <span className="font-semibold leading-snug">{team.name}</span>
                            <ChevronRight className="h-4 w-4 shrink-0" />
                          </span>
                          <span className={cn('mt-2 text-xs font-normal', isActive ? 'text-primary-foreground/75' : 'text-muted-foreground')}>{team.roles.map((role) => role.title).join(', ')}</span>
                          <span className="mt-auto pt-4 text-xs font-medium">{assisted}/{teamTasks.length} activités augmentées par l’IA</span>
                          <Progress value={(assisted / Math.max(teamTasks.length, 1)) * 100} className="mt-2 h-1.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 border-t border-border pt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div><p className="font-semibold text-foreground">Activités · {selectedTeam}</p><p className="text-xs text-muted-foreground">Cliquez sur une activité pour ouvrir sa chaîne de décision.</p></div>
                  <Badge variant="secondary">{tasks.filter((task) => task.team === selectedTeam).length} activités</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {tasks.filter((task) => task.team === selectedTeam).map((task) => (
                    <Button key={task.key} variant={selectedTaskKey === task.key ? 'secondary' : 'outline'} onClick={() => setSelectedTaskKey(task.key)} className="h-auto min-h-24 justify-start whitespace-normal p-3 text-left">
                      {mode(task.ai) === 'humain' ? <UserRound className="h-4 w-4 shrink-0" /> : <Bot className="h-4 w-4 shrink-0 text-primary" />}
                      <span className="min-w-0"><span className="block font-medium">{task.name}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{modeLabels[mode(task.ai)]} · {task.ai}% potentiel · {task.hours} h/sem</span></span>
                    </Button>
                  ))}
                </div>
              </div>
            </section>

            {selectedTask && <TaskDecisionPanel task={selectedTask} detail={detail} />}
          </div>

          <section className="border border-border bg-card p-4 md:p-5">
            <div className="grid gap-4 md:grid-cols-4">
              <Principle icon={Database} number="01" title="Données autorisées" text="L’IA reçoit uniquement les données utiles, avec accès limité et traçable." />
              <Principle icon={Sparkles} number="02" title="IA prépare" text="Elle classe, rapproche, synthétise, détecte et produit une proposition." />
              <Principle icon={ClipboardCheck} number="03" title="Humain contrôle" text="Le professionnel vérifie les faits, les biais, les règles et les exceptions." />
              <Principle icon={ShieldCheck} number="04" title="Responsable approuve" text="La décision à impact humain, légal ou financier reste explicitement signée." />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3"><CardTitle className="text-base">Choisir une activité</CardTitle><CardDescription>{filteredTasks.length} activités correspondent aux filtres.</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une activité" className="pl-9" /></div>
                <Select value={teamFilter} onValueChange={setTeamFilter}><SelectTrigger><SelectValue placeholder="Toutes les équipes" /></SelectTrigger><SelectContent><SelectItem value="all">Toutes les équipes</SelectItem>{teams.map((team) => <SelectItem key={team.name} value={team.name}>{team.name}</SelectItem>)}</SelectContent></Select>
                <Select value={modeFilter} onValueChange={setModeFilter}><SelectTrigger><SelectValue placeholder="Tous les modes" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les modes</SelectItem>{(Object.keys(modeLabels) as Mode[]).map((item) => <SelectItem key={item} value={item}>{modeLabels[item]}</SelectItem>)}</SelectContent></Select>
                <ScrollArea className="h-[520px] pr-3">
                  <div className="space-y-2">
                    {filteredTasks.map((task) => <Button key={task.key} variant={task.key === selectedTaskKey ? 'secondary' : 'ghost'} onClick={() => setSelectedTaskKey(task.key)} className="h-auto w-full justify-start whitespace-normal px-2 py-3 text-left"><span className="min-w-0"><span className="block text-sm font-medium">{task.name}</span><span className="block text-[11px] font-normal text-muted-foreground">{task.team} · {modeLabels[mode(task.ai)]}</span></span></Button>)}
                    {!filteredTasks.length && <p className="py-8 text-center text-sm text-muted-foreground">Aucune activité trouvée.</p>}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {selectedTask && <WorkflowMap task={selectedTask} detail={detail} />}
          </div>
        </TabsContent>

        <TabsContent value="case" className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <Card>
              <CardHeader><CardTitle>Hypothèses par rôle et activité</CardTitle><CardDescription>Adaptez les effectifs, coûts, temps et potentiel IA à la réalité de votre entreprise.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {teams.map((team, teamIndex) => (
                  <div key={team.name} className="border border-border p-3">
                    <p className="mb-3 font-semibold text-foreground">{team.name}</p>
                    {team.roles.map((role, roleIndex) => (
                      <div key={role.title} className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="font-medium">{role.title}</span>
                          <label className="flex items-center gap-1 text-muted-foreground">Effectif<Input type="number" min={0} className="h-8 w-16" value={role.count} onChange={(event) => edit(teamIndex, roleIndex, (current) => ({ ...current, count: Math.max(0, +event.target.value) }))} /></label>
                          <label className="flex items-center gap-1 text-muted-foreground">MAD/h<Input type="number" min={0} className="h-8 w-20" value={role.hourly} onChange={(event) => edit(teamIndex, roleIndex, (current) => ({ ...current, hourly: Math.max(0, +event.target.value) }))} /></label>
                        </div>
                        {role.tasks.map((task, taskIndex) => {
                          const taskMode = mode(task.ai);
                          return (
                            <div key={task.name} className="grid grid-cols-12 items-center gap-2 bg-muted/40 p-2 text-sm">
                              <div className="col-span-12 md:col-span-5"><p className="text-foreground">{task.name}</p><p className="text-xs text-muted-foreground">{task.tool}</p></div>
                              <label className="col-span-4 flex items-center gap-1 text-xs text-muted-foreground md:col-span-2"><Input type="number" min={0} className="h-8 w-14" value={task.hours} onChange={(event) => edit(teamIndex, roleIndex, (current) => ({ ...current, tasks: current.tasks.map((item, index) => index === taskIndex ? { ...item, hours: Math.max(0, +event.target.value) } : item) }))} />h/sem</label>
                              <div className="col-span-5 md:col-span-3"><Slider value={[task.ai]} max={100} step={5} onValueChange={([value]) => edit(teamIndex, roleIndex, (current) => ({ ...current, tasks: current.tasks.map((item, index) => index === taskIndex ? { ...item, ai: value } : item) }))} /><p className="mt-1 text-[11px] text-muted-foreground">Potentiel IA {task.ai}%</p></div>
                              <Badge variant="outline" className={cn('col-span-3 justify-self-end text-[10px] md:col-span-2', modeStyle[taskMode])}>{modeLabels[taskMode]}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card><CardHeader><CardTitle className="text-base">Priorités d’adoption</CardTitle><CardDescription>Valeur potentielle la plus élevée selon vos hypothèses.</CardDescription></CardHeader><CardContent className="space-y-3">{top.map((task, index) => <button type="button" key={task.key} onClick={() => setSelectedTaskKey(task.key)} className="w-full border-b border-border pb-3 text-left text-sm last:border-0"><p className="font-medium text-foreground">{index + 1}. {task.name}</p><p className="text-xs text-muted-foreground">{task.team} · {task.tool}</p><p className="text-xs font-medium text-primary">{mad(task.value)} / an</p></button>)}</CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Gains par équipe</CardTitle></CardHeader><CardContent className="space-y-3">{stats.byTeam.map((team) => <div key={team.name} className="text-sm"><div className="flex justify-between gap-2"><span>{team.name}</span><span className="text-muted-foreground">{mad(team.value)}</span></div><Progress value={team.hours ? (team.freed / team.hours) * 100 : 0} className="mt-1 h-2" /><p className="text-[11px] text-muted-foreground">{Math.round(team.freed)} h libérées sur {Math.round(team.hours)} h</p></div>)}</CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Investissement IA · année 1</CardTitle></CardHeader><CardContent className="space-y-3"><Input type="number" min={0} value={toolCost} onChange={(event) => setToolCost(Math.max(0, +event.target.value))} /><div className="flex items-end justify-between border-t border-border pt-3"><span className="text-sm text-muted-foreground">Gain net estimé</span><span className={cn('text-lg font-semibold', stats.net < 0 ? 'text-destructive' : 'text-foreground')}>{mad(stats.net)}</span></div><p className="text-xs text-muted-foreground">Licences, paramétrage et formation. Montant à chiffrer avec les fournisseurs.</p></CardContent></Card>
              <Card><CardContent className="space-y-1 pt-6 text-xs text-muted-foreground"><p><Badge variant="outline" className="mr-1">Méthode</Badge> h/an = h/sem × effectif × {WEEKS} semaines.</p><p>Temps libéré : 60 % automatisé sous contrôle, 30 % assisté, 5 % humain.</p><p>La capacité est redéployée vers des missions à valeur ajoutée, pas convertie automatiquement en suppression de poste.</p></CardContent></Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TaskDecisionPanel({ task, detail }: { task: TaskContext; detail: typeof TEAM_DETAILS[string] }) {
  const taskMode = mode(task.ai);
  return (
    <aside className="border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-muted-foreground">Activité sélectionnée</p><h2 className="mt-1 text-lg font-semibold text-foreground">{task.name}</h2></div>{taskMode === 'humain' ? <UserRound className="h-5 w-5 text-muted-foreground" /> : <Bot className="h-5 w-5 text-primary" />}</div>
      <Badge variant="outline" className={cn('mt-3', modeStyle[taskMode])}>{modeLabels[taskMode]}</Badge>
      <div className="mt-5 space-y-4 text-sm">
        <Info label="Responsable" value={task.role} />
        <Info label="Rôle de l’IA" value={taskMode === 'humain' ? 'Apporte uniquement des informations ou scénarios.' : task.tool} />
        <Info label="Contrôle humain" value="Vérifie les données, le contexte, les exceptions et les biais." />
        <Info label="Approbation" value={detail.approver} />
        <Info label="Livrable" value={detail.output} />
        <Info label="Preuve / KPI" value={detail.kpi} />
      </div>
      <div className="mt-5 border-l-2 border-accent bg-accent/10 p-3 text-xs text-foreground"><strong>Point non délégable :</strong> {detail.risk}. L’IA ne valide ni ne signe cette décision.</div>
    </aside>
  );
}

function WorkflowMap({ task, detail }: { task: TaskContext; detail: typeof TEAM_DETAILS[string] }) {
  const taskMode = mode(task.ai);
  const [activeStage, setActiveStage] = useState(0);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [decision, setDecision] = useState<'pending' | 'approved' | 'revision'>('pending');
  const stages = [
    { icon: Database, eyebrow: 'Entrée', title: 'Données et demande', actor: task.role, text: detail.input, status: 'À qualifier', output: 'Brief qualifié et sources autorisées', control: 'Complétude, finalité et droit d’accès' },
    { icon: Bot, eyebrow: 'Travail IA', title: taskMode === 'humain' ? 'Appui documentaire' : task.tool, actor: 'Moteur IA Qimatak', text: taskMode === 'humain' ? 'Prépare des éléments sans prendre en charge le raisonnement métier.' : 'Classe, rapproche, détecte les écarts et produit une proposition traçable.', status: `${task.ai}% potentiel`, output: 'Proposition sourcée et niveau de confiance', control: 'Sources citées, aucune décision automatique' },
    { icon: ClipboardCheck, eyebrow: 'Human in the loop', title: 'Contrôle métier', actor: task.role, text: 'Contrôle les sources, corrige le contexte, traite les exceptions et documente les ajustements.', status: 'Obligatoire', output: 'Version corrigée et commentaires métier', control: 'Exactitude, biais, exceptions et règles internes' },
    { icon: ShieldCheck, eyebrow: 'Approbation', title: 'Go / corriger / rejeter', actor: detail.approver, text: `Décide en tenant compte du risque : ${detail.risk.toLocaleLowerCase()}.`, status: 'Signature humaine', output: 'Décision horodatée avec motif', control: 'Responsabilité humaine non délégable' },
    { icon: CheckCircle2, eyebrow: 'Exécution', title: detail.output, actor: task.role, text: 'Exécute la décision approuvée et notifie les parties concernées.', status: 'Après accord', output: detail.output, control: 'Exécution conforme à la version approuvée' },
    { icon: Gauge, eyebrow: 'Mesure', title: 'Preuve et amélioration', actor: 'DRH + propriétaire KPI', text: detail.kpi, status: 'Boucle de suivi', output: 'Mesure, écart et action corrective', control: 'Baseline, cible, résultat et preuve' },
  ];

  useEffect(() => {
    setActiveStage(0);
    setCompletedStages([]);
    setDecision('pending');
  }, [task.key]);

  const current = stages[activeStage];
  const CurrentIcon = current.icon;
  const canAdvance = activeStage !== 3 || decision === 'approved';
  const advance = () => {
    if (!canAdvance) return;
    setCompletedStages((items) => items.includes(activeStage) ? items : [...items, activeStage]);
    setActiveStage((value) => Math.min(stages.length - 1, value + 1));
  };
  const resetSimulation = () => {
    setActiveStage(0);
    setCompletedStages([]);
    setDecision('pending');
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><Badge variant="outline">{task.team}</Badge><Badge variant="outline" className={modeStyle[taskMode]}>{modeLabels[taskMode]}</Badge></div><CardTitle className="mt-2 text-xl">{task.name}</CardTitle><CardDescription className="mt-1">{detail.mission}</CardDescription></div><Button size="sm" variant="outline" onClick={resetSimulation}><RotateCcw className="mr-2 h-4 w-4" />Rejouer</Button></div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="mb-5 grid gap-3 sm:grid-cols-4">
          <MiniMetric label="Propriétaire" value={task.role} />
          <MiniMetric label="Charge actuelle" value={`${task.hours} h/semaine`} />
          <MiniMetric label="Potentiel IA" value={`${task.ai}%`} />
          <MiniMetric label="Approbateur" value={detail.approver} />
        </div>

        <div className="mb-5 flex items-center gap-3 border-y border-border py-3">
          <div className="min-w-0 flex-1"><div className="mb-1.5 flex justify-between text-[11px] font-medium text-muted-foreground"><span>Simulation du processus</span><span>{completedStages.length}/{stages.length} étapes</span></div><Progress value={(completedStages.length / stages.length) * 100} className="h-2" /></div>
          <Button size="sm" onClick={advance} disabled={!canAdvance || completedStages.length === stages.length}><Play className="mr-2 h-4 w-4" />{activeStage === stages.length - 1 ? 'Terminer' : 'Étape suivante'}</Button>
        </div>

        <div className="relative grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="absolute left-[8%] right-[8%] top-7 hidden h-px bg-border xl:block" />
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isAi = index === 1;
            const isHumanGate = index === 2 || index === 3;
            const isActive = activeStage === index;
            const isComplete = completedStages.includes(index);
            return (
              <button type="button" key={stage.eyebrow} onClick={() => setActiveStage(index)} className={cn('relative z-10 min-h-40 border bg-card p-3 text-left transition-all duration-200', isAi && 'border-primary/30', isHumanGate && 'border-accent/60', isActive && 'border-primary bg-primary/5 shadow-md', isComplete && !isActive && 'bg-muted/50 hover:bg-muted')}>
                <div className="flex items-start justify-between gap-2">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-full border bg-card', isAi ? 'border-primary/40 text-primary' : isHumanGate ? 'border-accent text-accent-foreground' : 'border-border text-foreground', isComplete && 'border-primary bg-primary text-primary-foreground')}>
                    {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">0{index + 1}</span>
                </div>
                <p className={cn('mt-3 text-[10px] font-bold uppercase', isActive ? 'text-primary' : 'text-muted-foreground')}>{stage.eyebrow}</p>
                <h3 className="mt-1 text-sm font-semibold leading-snug text-foreground">{stage.title}</h3>
                <p className="mt-2 text-[11px] text-muted-foreground">{stage.actor}</p>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-2"><Badge variant="outline" className="text-[9px]">{isComplete ? 'Validée' : isActive ? 'En cours' : 'À venir'}</Badge>{isActive && <ArrowDown className="h-3.5 w-3.5 text-primary" />}</div>
              </button>
            );
          })}
        </div>

        <div key={`${task.key}-${activeStage}`} className="mt-4 animate-fade-in border border-primary/25 bg-primary/5 p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary text-primary-foreground"><CurrentIcon className="h-5 w-5" /></div><div><p className="text-[10px] font-bold uppercase text-primary">Étape {activeStage + 1} · {current.eyebrow}</p><h3 className="text-base font-semibold text-foreground">{current.title}</h3><p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{current.text}</p></div></div>
            <Badge variant="outline">{current.status}</Badge>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <MiniMetric label="Qui agit" value={current.actor} />
            <MiniMetric label="Sortie attendue" value={current.output} />
            <MiniMetric label="Contrôle requis" value={current.control} />
          </div>

          {activeStage === 3 && (
            <div className="mt-4 border-t border-primary/20 pt-4">
              <p className="mb-2 text-xs font-semibold text-foreground">Décision de simulation</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={decision === 'approved' ? 'default' : 'outline'} onClick={() => setDecision('approved')}><CheckCircle2 className="mr-2 h-4 w-4" />Approuver</Button>
                <Button size="sm" variant={decision === 'revision' ? 'secondary' : 'outline'} onClick={() => setDecision('revision')}><RotateCcw className="mr-2 h-4 w-4" />Demander une correction</Button>
              </div>
              {decision === 'revision' && <p className="mt-2 text-xs text-accent-foreground">Le flux reste bloqué ici et retourne au contrôle métier.</p>}
              {decision === 'pending' && <p className="mt-2 text-xs text-muted-foreground">Une validation humaine est nécessaire pour poursuivre vers l’exécution.</p>}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-primary/20 pt-4">
            <Button size="sm" variant="ghost" disabled={activeStage === 0} onClick={() => setActiveStage((value) => Math.max(0, value - 1))}>Étape précédente</Button>
            <Button size="sm" onClick={advance} disabled={!canAdvance || completedStages.length === stages.length}>{activeStage === stages.length - 1 ? 'Clôturer la simulation' : 'Valider et continuer'}<ChevronRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <ControlBlock icon={AlertTriangle} label="Risque à maîtriser" text={detail.risk} />
          <ControlBlock icon={FileCheck2} label="Livrable produit" text={detail.output} />
          <ControlBlock icon={Target} label="Mesure de succès" text={detail.kpi} />
        </div>

        <div className="mt-5 border border-primary/25 bg-primary/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-primary" />Règle de gouvernance</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">L’IA produit une recommandation explicable. Le contrôle métier est obligatoire avant toute approbation. Toute décision concernant une personne, une paie, une obligation légale, un budget ou le dialogue social reste humaine et traçable.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Principle({ icon: Icon, number, title, text }: { icon: typeof Bot; number: string; title: string; text: string }) {
  return <div className="border-l-2 border-primary pl-4"><div className="flex items-center gap-2 text-xs font-bold text-primary"><Icon className="h-4 w-4" />{number}</div><p className="mt-2 text-sm font-semibold text-foreground">{title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p></div>;
}

function ControlBlock({ icon: Icon, label, text }: { icon: typeof Bot; label: string; text: string }) {
  return <div className="border border-border p-3"><p className="flex items-center gap-2 text-xs font-semibold text-foreground"><Icon className="h-4 w-4 text-primary" />{label}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{text}</p></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-border pb-3 last:border-0"><p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1 leading-relaxed text-foreground">{value}</p></div>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="border border-border bg-muted/30 p-3"><p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold text-foreground">{value}</p></div>;
}

function Kpi({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string; sub?: string }) {
  return <Card><CardContent className="pt-5"><p className="flex items-center gap-1 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</p><p className="mt-1 text-lg font-semibold text-foreground md:text-xl">{value}</p>{sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}</CardContent></Card>;
}