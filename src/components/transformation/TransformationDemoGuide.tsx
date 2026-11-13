import { ArrowLeft, ArrowRight, BarChart3, Bot, GitBranch, Layers3, Play, Target, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type DemoStep = {
  title: string;
  view: string;
  icon: typeof Target;
  input: string;
  analysis: string;
  output: string;
};

const STEPS_FR: DemoStep[] = [
  { title: 'Objectifs stratégiques', view: 'objectives', icon: Target, input: 'Priorités, KPI et résultats attendus', analysis: 'Qimatak clarifie les résultats à atteindre', output: 'Carte des objectifs Atlas Industries' },
  { title: 'Capacités critiques', view: 'capabilities', icon: Layers3, input: 'Maturité actuelle, cible et criticité', analysis: 'Les écarts de capacité sont hiérarchisés', output: 'Matrice objectif → capacité' },
  { title: 'Travail & organisation', view: 'work', icon: GitBranch, input: 'Processus, tâches, temps, rôles et rattachements', analysis: 'Le WorkGraph relie stratégie, travail et organigramme', output: 'Chaîne de valeur opérationnelle' },
  { title: 'Analyse Humain + IA', view: 'ai', icon: Bot, input: 'Répétitivité, jugement, données et risque', analysis: 'Chaque tâche reçoit un mode opératoire recommandé', output: 'Carte des opportunités Humain + IA' },
  { title: 'Scénarios & risques', view: 'scenarios', icon: Wrench, input: 'Coûts, temps et hypothèses de transformation', analysis: 'Suppression et redéploiement sont comparés', output: 'Économie nette, risques et capacité libérée' },
  { title: 'Décision & impact', view: 'scenarios', icon: BarChart3, input: 'Interventions, responsables et indicateurs', analysis: 'Les actions sont reliées aux effets attendus', output: 'Feuille de route de transformation' },
];

const STEPS_EN: DemoStep[] = [
  { title: 'Strategic objectives', view: 'objectives', icon: Target, input: 'Priorities, KPIs and expected outcomes', analysis: 'Qimatak clarifies the outcomes to achieve', output: 'Atlas Industries objective map' },
  { title: 'Critical capabilities', view: 'capabilities', icon: Layers3, input: 'Current maturity, target and criticality', analysis: 'Capability gaps are prioritised', output: 'Objective → capability matrix' },
  { title: 'Work & organisation', view: 'work', icon: GitBranch, input: 'Processes, tasks, time, roles and reporting lines', analysis: 'The WorkGraph links strategy, work and the org chart', output: 'Operational value chain' },
  { title: 'Human + AI analysis', view: 'ai', icon: Bot, input: 'Repetition, judgement, data and risk', analysis: 'Each task receives a recommended operating mode', output: 'Human + AI opportunity map' },
  { title: 'Scenarios & risk', view: 'scenarios', icon: Wrench, input: 'Costs, time and transformation assumptions', analysis: 'Removal and redeployment are compared', output: 'Net savings, risks and released capacity' },
  { title: 'Decision & impact', view: 'scenarios', icon: BarChart3, input: 'Interventions, owners and indicators', analysis: 'Actions are linked to expected effects', output: 'Transformation roadmap' },
];

export function TransformationDemoGuide({ fr, currentStep, onStepChange, onLoadDemo, loading, hasDemoData }: {
  fr: boolean;
  currentStep: number;
  onStepChange: (step: number, view: string) => void;
  onLoadDemo: () => void;
  loading: boolean;
  hasDemoData: boolean;
}) {
  const steps = fr ? STEPS_FR : STEPS_EN;
  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <section className="border border-border bg-card" aria-label={fr ? 'Démonstration guidée Atlas Industries' : 'Atlas Industries guided demo'}>
      <div className="flex flex-col gap-4 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{fr ? 'DÉMO GUIDÉE' : 'GUIDED DEMO'}</Badge>
            <span className="text-xs font-semibold text-muted-foreground">{currentStep + 1}/{steps.length}</span>
          </div>
          <h2 className="mt-2 text-xl font-bold md:text-2xl">{fr ? 'Comprendre la transformation avec Atlas Industries' : 'Understand transformation with Atlas Industries'}</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{fr ? 'Suivez la chaîne complète : données d’entreprise, analyse Qimatak, décision puis impact.' : 'Follow the complete chain: company data, Qimatak analysis, decision and impact.'}</p>
        </div>
        {!hasDemoData && <Button onClick={onLoadDemo} disabled={loading} className="shrink-0"><Play className="mr-2 h-4 w-4" />{loading ? (fr ? 'Chargement…' : 'Loading…') : (fr ? 'Charger Atlas et commencer' : 'Load Atlas and start')}</Button>}
      </div>

      <div className="grid gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="border-b border-border p-3 lg:border-b-0 lg:border-r">
          <Progress value={((currentStep + 1) / steps.length) * 100} className="mb-3 h-1.5" />
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
            {steps.map((item, index) => {
              const StepIcon = item.icon;
              return <Button key={`${item.view}-${index}`} variant={index === currentStep ? 'secondary' : 'ghost'} className="h-auto min-h-12 justify-start whitespace-normal px-2 py-2 text-left" onClick={() => onStepChange(index, item.view)}><span className={cn('mr-2 flex h-7 w-7 shrink-0 items-center justify-center border border-border text-xs font-bold', index === currentStep && 'border-primary bg-primary text-primary-foreground')}><StepIcon className="h-3.5 w-3.5" /></span><span className="text-xs font-semibold leading-tight">{item.title}</span></Button>;
            })}
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary text-primary-foreground"><Icon className="h-5 w-5" /></div>
            <div><p className="text-xs font-bold uppercase text-primary">{fr ? `Étape ${currentStep + 1}` : `Step ${currentStep + 1}`}</p><h3 className="text-xl font-bold">{step.title}</h3></div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="border-l-2 border-muted-foreground/40 pl-3"><p className="text-[11px] font-bold uppercase text-muted-foreground">{fr ? 'Données nécessaires' : 'Required data'}</p><p className="mt-1 text-sm font-medium">{step.input}</p></div>
            <div className="border-l-2 border-primary pl-3"><p className="text-[11px] font-bold uppercase text-primary">{fr ? 'Ce que Qimatak analyse' : 'What Qimatak analyses'}</p><p className="mt-1 text-sm font-medium">{step.analysis}</p></div>
            <div className="border-l-2 border-accent pl-3"><p className="text-[11px] font-bold uppercase text-muted-foreground">{fr ? 'Livrable' : 'Deliverable'}</p><p className="mt-1 text-sm font-medium">{step.output}</p></div>
          </div>
          <div className="mt-6 flex items-center justify-between gap-2">
            <Button variant="outline" disabled={currentStep === 0} onClick={() => onStepChange(currentStep - 1, steps[currentStep - 1]?.view ?? 'cockpit')}><ArrowLeft className="mr-2 h-4 w-4" />{fr ? 'Précédent' : 'Previous'}</Button>
            <Button onClick={() => currentStep === steps.length - 1 ? onStepChange(0, 'cockpit') : onStepChange(currentStep + 1, steps[currentStep + 1]?.view ?? 'cockpit')}>{currentStep === steps.length - 1 ? (fr ? 'Revenir au cockpit' : 'Back to cockpit') : (fr ? 'Voir cette étape' : 'View this step')}<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </section>
  );
}