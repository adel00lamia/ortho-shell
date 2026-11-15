import { useEffect, useState } from 'react';
import { Download, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { env } from '@/config/env';
import { readPlanResponse } from '@/lib/planResponse';
import { hrTrainingRequest } from '@/lib/hrWorkspace/trainingRequest';
import type { WorkspaceModel } from '@/lib/hrWorkspace/model';
import type { GeneratedPlan } from '@/types/trainingPlan';

type Saved = { source: string; plan: GeneratedPlan };

export function HRTrainingPlan({ m, storageKey }: { m: WorkspaceModel; storageKey: string }) {
  const key = `${storageKey}.training-plan`;
  const source = JSON.stringify(m);
  const [saved, setSaved] = useState<Saved | null>(() => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value?.source && Array.isArray(value?.plan?.modules) && value.plan.title ? value : null;
    } catch { return null; }
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [stored, setStored] = useState(true);
  useEffect(() => {
    if (saved) {
      try { localStorage.setItem(key, JSON.stringify(saved)); setStored(true); }
      catch { setStored(false); }
    }
  }, [key, saved]);
  const generate = async () => {
    setBusy(true); setError('');
    try {
      const body = hrTrainingRequest(m);
      const { data, error: authError } = await supabase.auth.getSession();
      if (authError || !data.session) throw new Error('Connectez-vous pour générer le plan RH avec Claude.');
      const response = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/ai-advanced-planner`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify(body),
      });
      const plan = await readPlanResponse(response);
      setSaved({ source, plan });
    } catch (e) { setError(e instanceof Error ? e.message : 'La génération a échoué.'); }
    finally { setBusy(false); }
  };
  const download = () => {
    if (!saved) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify({ plan: saved.plan }, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'qimatak-plan-formation-rh.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="space-y-3 border-t pt-5">
    <div className="hrw-noprint flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-semibold">Plan de formation RH · Claude</h2>
        <p className="text-sm text-muted-foreground">Budget saisi : {m.scenario.trainingCost > 0 ? `${m.scenario.trainingCost.toLocaleString('fr-FR')} MAD` : 'À chiffrer'} · proposition à valider par la DRH.</p></div>
      <div className="flex flex-wrap gap-2">
        {saved && <Button variant="outline" onClick={download}><Download className="mr-2 h-4 w-4" />JSON complet</Button>}
        <Button disabled={busy} onClick={() => void generate()}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{busy ? 'Génération du plan complet…' : saved ? 'Régénérer le plan RH' : 'Générer le plan RH'}</Button>
      </div>
    </div>
    <p className="hrw-noprint text-xs text-muted-foreground">La génération transmet à Claude les rôles, processus, preuves et hypothèses saisis dans ce modèle. Aucune donnée individuelle de salarié n’est recherchée.</p>
    {error && <p role="alert" className="hrw-noprint text-sm text-destructive">{error}</p>}
    {saved && source !== saved.source && <p role="status" className="hrw-noprint text-sm text-destructive">Le modèle a changé depuis ce plan. Régénérez-le pour intégrer les nouvelles données.</p>}
    {!stored && <p role="alert" className="hrw-noprint text-sm text-destructive">Plan non enregistré sur cet appareil : téléchargez le JSON complet.</p>}
    {saved && <div className="space-y-4 break-words">
      <h3 className="text-xl font-semibold">{saved.plan.title}</h3>
      <p className="whitespace-pre-line">{saved.plan.executive_summary || saved.plan.description}</p>
      <p className="text-sm text-muted-foreground">{saved.plan.timeline} · proposition générée le {saved.plan.report_meta?.generated_at?.slice(0, 10) || '—'} · enregistrée sur cet appareil uniquement.</p>
      <div className="grid gap-4 md:grid-cols-2">{saved.plan.modules.map((module, i) => <article key={`${i}-${module.title}`} className="rounded-md border bg-card p-4">
        <h4 className="font-semibold">{i + 1}. {module.title}</h4>
        <p className="mt-1 text-sm text-muted-foreground">{module.duration} · {module.accountable_owner} · {module.estimated_cost ? `${module.estimated_cost.toLocaleString('fr-FR')} MAD` : 'À chiffrer'}</p>
        <p className="mt-2 text-sm">{module.observed_difficulty || module.description}</p>
        {([['Objectifs observables', module.learning_objectives], ['Programme', module.content_outline], ['Évaluation', module.assessment_methods], ['Transfert au poste', module.workplace_transfer]] as const).map(([title, items]) => <div key={title} className="mt-3 text-sm"><h5 className="font-semibold">{title}</h5><ul className="list-disc pl-4">{items?.map((item, j) => <li key={j}>{item}</li>)}</ul></div>)}
      </article>)}</div>
      <h4 className="font-semibold">Recommandations & indicateurs</h4>
      <ul className="list-disc pl-5 text-sm">{saved.plan.recommendations.map((r, i) => <li key={i}>{typeof r === 'string' ? r : `${r.recommendation} — ${r.rationale}`}</li>)}</ul>
      <ul className="list-disc pl-5 text-sm">{saved.plan.kpis.map((k, i) => <li key={i}>{k.name} : {k.baseline || 'À mesurer'} → {k.target || 'À valider'} · {k.owner}</li>)}</ul>
    </div>}
  </section>;
}