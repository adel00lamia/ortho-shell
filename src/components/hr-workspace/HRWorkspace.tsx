import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, ClipboardList, Gauge, Network, RotateCcw, Route, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadModel, saveModel } from '@/lib/hrWorkspace/storage';
import type { WorkspaceModel } from '@/lib/hrWorkspace/model';
import type { Setter, ViewId } from './fields';
import { OrganisationView, SummaryView } from './SummaryOrgViews';
import { DiagnosticView, ProcessView } from './ProcessDiagnosticViews';
import { RoadmapView, ScenarioView } from './ScenarioRoadmapViews';

const VIEWS: { id: ViewId; label: string; icon: typeof Gauge }[] = [
  { id: 'synthese', label: 'Synthèse', icon: Gauge },
  { id: 'organisation', label: 'Organisation RH', icon: Network },
  { id: 'processus', label: 'Processus & charge', icon: ClipboardList },
  { id: 'diagnostic', label: 'Diagnostic & opportunités', icon: Sparkles },
  { id: 'scenarios', label: 'Scénarios Humain + IA', icon: BarChart3 },
  { id: 'feuille', label: 'Feuille de route & rapport', icon: Route },
];

export function HRWorkspace({ storageKey, initial, demo, resetTo }: { storageKey: string; initial: () => WorkspaceModel; demo: boolean; resetTo?: () => WorkspaceModel }) {
  const [m, setM] = useState<WorkspaceModel>(() => loadModel(storageKey, initial));
  const [params, setParams] = useSearchParams();
  const view = (VIEWS.find((v) => v.id === params.get('vue'))?.id ?? 'synthese') as ViewId;
  const go = (v: ViewId) => { setParams({ vue: v }, { replace: true }); window.scrollTo({ top: 0 }); };
  useEffect(() => { setM(loadModel(storageKey, initial)); }, [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { saveModel(storageKey, m); }, [storageKey, m]);
  const set: Setter = (fn) => setM((x) => fn(x));
  const reset = () => {
    if (!resetTo || !window.confirm(demo ? 'Réinitialiser la démonstration ? Vos modifications seront perdues.' : 'Effacer le modèle enregistré sur cet appareil ?')) return;
    setM(resetTo());
  };
  const props = { m, set, go, demo };
  const current = VIEWS.find((v) => v.id === view)!;

  return (
    <div className="transformation-shell min-h-screen bg-background text-foreground">
      <header className="hrw-noprint sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to={demo ? '/' : '/dashboard'} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Qimatak</Link>
            <span className="h-4 w-px bg-border" />
            <span className="text-sm font-semibold">Transformation RH</span>
            {demo ? <span className="rounded bg-accent/25 px-2 py-0.5 text-xs font-semibold">Démo · données fictives</span> : <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">Modèle enregistré sur cet appareil</span>}
          </div>
          {resetTo && <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="mr-1 h-4 w-4" />{demo ? 'Réinitialiser la démo' : 'Réinitialiser'}</Button>}
        </div>
        <nav aria-label="Vues de l’espace Transformation RH" className="mx-auto max-w-7xl overflow-x-auto px-2">
          <ul className="flex min-w-max gap-1 pb-2">
            {VIEWS.map((v, i) => (
              <li key={v.id}>
                <button onClick={() => go(v.id)} aria-current={view === v.id ? 'page' : undefined}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors ${view === v.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                  <span className="tabular-nums text-xs opacity-70">{i + 1}</span><v.icon className="h-4 w-4" />{v.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5">
        <div className="hrw-noprint mb-4">
          <h1 className="text-2xl font-bold">{current.label}</h1>
          <p className="text-sm text-muted-foreground">{m.company.name || 'Entreprise'} · {demo ? 'Toutes les données et résultats sont fictifs.' : 'Données saisies par vous, non partagées avec l’équipe.'}</p>
        </div>
        {view === 'synthese' && <SummaryView {...props} />}
        {view === 'organisation' && <OrganisationView {...props} />}
        {view === 'processus' && <ProcessView {...props} />}
        {view === 'diagnostic' && <DiagnosticView {...props} />}
        {view === 'scenarios' && <ScenarioView {...props} />}
        {view === 'feuille' && <RoadmapView {...props} />}
      </main>
    </div>
  );
}
