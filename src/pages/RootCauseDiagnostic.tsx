import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, ArrowRight, Brain, ClipboardList, FileDown, FileSearch, Gauge, Loader2, MessagesSquare,
  Plus, Radio, Sparkles, Target, Trash2, TrendingDown, Users, Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrainingFitScore } from '@/components/diagnostic/TrainingFitScore';
import { TrainingFitExplanation } from '@/components/diagnostic/TrainingFitExplanation';
import { DecisionCard } from '@/components/diagnostic/DecisionCard';
import { EvidencePulsePanel } from '@/components/diagnostic/EvidencePulsePanel';
import { CapabilityCheckPanel } from '@/components/diagnostic/CapabilityCheckPanel';
import { CauseBreakdownChart, CAUSE_LABELS } from '@/components/diagnostic/CauseBreakdownChart';
import { ImpactTracker } from '@/components/diagnostic/ImpactTracker';
import { LEGACY_CAUSE_MAP, CAUSE_KEYS, type CauseKey } from '@/lib/rootCauseModel';
import { downloadDiagnosticReportPDF } from '@/lib/exportDiagnosticReportPDF';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import {
  useDeleteDiagnostic, useDiagnosticDetail, useDiagnostics, useRunDiagnostic,
  useDeleteMeasurement, useUpdateAction, useUpsertMeasurement, type DiagnosticRow,
} from '@/hooks/useRootCauseDiagnostics';

/** Action types reuse cause keys; map legacy/free-form values to a known label. */
function actionCauseKey(actionType: string): CauseKey {
  if (actionType === 'training') return 'skill';
  if ((CAUSE_KEYS as readonly string[]).includes(actionType)) return actionType as CauseKey;
  return (LEGACY_CAUSE_MAP[actionType] ?? 'process') as CauseKey;
}


const SYMPTOM_OPTIONS = [
  { key: 'complaints', fr: 'Réclamations clients', en: 'Customer complaints' },
  { key: 'errors', fr: 'Erreurs / non-qualité', en: 'Errors / poor quality' },
  { key: 'delays', fr: 'Retards, délais non tenus', en: 'Delays, missed deadlines' },
  { key: 'turnover', fr: 'Turnover', en: 'Turnover' },
  { key: 'absenteeism', fr: 'Absentéisme', en: 'Absenteeism' },
  { key: 'ai_adoption', fr: 'Faible adoption des outils / IA', en: 'Low tool / AI adoption' },
  { key: 'supervision', fr: 'Supervision insuffisante', en: 'Weak supervision' },
  { key: 'productivity', fr: 'Baisse de productivité', en: 'Productivity drop' },
];

const EVIDENCE_FIELDS = [
  { key: 'conversations', fr: 'Conversations analysées', en: 'Conversations analysed', icon: MessagesSquare },
  { key: 'documents', fr: 'Documents analysés', en: 'Documents analysed', icon: FileSearch },
  { key: 'interviews', fr: 'Entretiens réalisés', en: 'Interviews conducted', icon: Users },
  { key: 'indicators', fr: 'Indicateurs métiers', en: 'Business indicators', icon: Gauge },
];

const ACTION_TONE: Record<string, string> = {
  training: 'bg-primary/10 text-primary border-primary/30',
  process: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  management: 'bg-sky-500/10 text-sky-600 border-sky-500/30',
  tools: 'bg-violet-500/10 text-violet-600 border-violet-500/30',
  organization: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
};

const ACTION_STATUS = ['proposed', 'accepted', 'in_progress', 'done', 'dismissed'];

const STATUS_LABELS: Record<'fr' | 'en', Record<string, string>> = {
  fr: {
    proposed: 'Proposée',
    accepted: 'Acceptée',
    in_progress: 'En cours',
    done: 'Terminée',
    dismissed: 'Écartée',
  },
  en: {
    proposed: 'Proposed',
    accepted: 'Accepted',
    in_progress: 'In progress',
    done: 'Done',
    dismissed: 'Dismissed',
  },
};

const fmtMad = (n?: number | null) =>
  new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(Number(n ?? 0)) + ' MAD';

export default function RootCauseDiagnostic() {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const lang: 'fr' | 'en' = fr ? 'fr' : 'en';
  const navigate = useNavigate();

  const { data: diagnostics = [], isLoading } = useDiagnostics();
  const runDiagnostic = useRunDiagnostic();
  const deleteDiagnostic = useDeleteDiagnostic();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected: DiagnosticRow | undefined = useMemo(
    () => diagnostics.find((d) => d.id === selectedId),
    [diagnostics, selectedId]
  );
  const { data: detail } = useDiagnosticDetail(selectedId);
  const updateAction = useUpdateAction(selectedId);
  const upsertMeasurement = useUpsertMeasurement(selectedId);
  const deleteMeasurement = useDeleteMeasurement(selectedId);

  /** Cost of the Qimatak plan = sum of the costed recommended actions. */
  const planCost = useMemo(() => {
    const actions = detail?.actions ?? [];
    const costed = actions.filter((a) => Number(a.estimated_cost_mad ?? 0) > 0);
    const training = costed.filter((a) => a.action_type === 'training');
    return {
      total: costed.reduce((sum, a) => sum + Number(a.estimated_cost_mad ?? 0), 0),
      nonTraining: costed
        .filter((a) => a.action_type !== 'training')
        .reduce((sum, a) => sum + Number(a.estimated_cost_mad ?? 0), 0),
      costed: costed.length,
      trainingActions: training.length,
    };
  }, [detail?.actions]);

  /** Share of the diagnosis attributed to a capability/skill gap, 0-100. */
  const capabilityShare = useMemo(() => {
    const b = (selected?.cause_breakdown ?? {}) as Record<string, number>;
    return Number(b.capability ?? b.skill ?? 0);
  }, [selected?.cause_breakdown]);



  // ---- intake form state ----
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [department, setDepartment] = useState('');
  const [population, setPopulation] = useState('');
  const [headcount, setHeadcount] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [kpiName, setKpiName] = useState('');
  const [kpiValue, setKpiValue] = useState('');
  const [kpis, setKpis] = useState<Array<{ name: string; value: string }>>([]);
  const [evidence, setEvidence] = useState<Record<string, number>>({});
  const [costPerPerson, setCostPerPerson] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [tab, setTab] = useState('intake');

  const toggleSymptom = (key: string) =>
    setSymptoms((s) => (s.includes(key) ? s.filter((x) => x !== key) : [...s, key]));

  const submit = async () => {
    if (problem.trim().length < 20) {
      toast.error(fr ? 'Décrivez le problème en au moins 20 caractères.' : 'Describe the problem in at least 20 characters.');
      return;
    }
    const result = await runDiagnostic.mutateAsync({
      title: title.trim() || (fr ? 'Diagnostic sans titre' : 'Untitled diagnostic'),
      problem_description: problem.trim(),
      department: department.trim(),
      affected_population: population.trim(),
      headcount_affected: headcount ? Number(headcount) : undefined,
      symptoms: symptoms.map((k) => {
        const o = SYMPTOM_OPTIONS.find((s) => s.key === k);
        return o ? o[lang] : k;
      }),
      business_kpis: kpis,
      evidence_sources: evidence,
      cost_assumptions: {
        training_cost_per_person_mad: costPerPerson ? Number(costPerPerson) : null,
        total_training_budget_mad: totalBudget ? Number(totalBudget) : null,
      },
      language: lang,
    });
    setSelectedId(result.diagnosticId);
    setTab('result');
    toast.success(fr ? 'Diagnostic généré' : 'Diagnostic generated');
  };

  const trainingActions = (detail?.actions ?? []).filter((a) => a.is_training);

  const handoffToPlan = () => {
    if (!selected) return;
    navigate('/workflow/plan/builder', {
      state: {
        fromDiagnostic: {
          diagnosticId: selected.id,
          title: selected.title,
          problem: selected.problem_description,
          department: selected.department,
          population: selected.affected_population,
          trainingActions: trainingActions.map((a) => ({
            title: a.title,
            target_population: a.target_population,
            headcount: a.headcount,
            expected_impact: a.expected_impact,
          })),
        },
      },
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/40 text-primary">
            <Sparkles className="mr-1 h-3 w-3" /> Qimatak
          </Badge>
          <Badge variant="secondary">AI</Badge>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
          {fr ? 'Diagnostiquer avant de former' : 'Diagnose before training'}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {fr
            ? 'Décrivez un problème métier. L’IA distingue compétence, processus, management, outils et organisation, puis recommande la bonne intervention — pas forcément une formation.'
            : 'Describe a business problem. The AI separates skills, process, management, tools and organisation, then recommends the right intervention — not necessarily training.'}
        </p>
      </motion.div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="intake">{fr ? '1. Problème' : '1. Problem'}</TabsTrigger>
          <TabsTrigger value="result" disabled={!selected}>{fr ? '2. Diagnostic' : '2. Diagnostic'}</TabsTrigger>
          <TabsTrigger value="evidence" disabled={!selected}>{fr ? '3. Preuves' : '3. Evidence'}</TabsTrigger>
          <TabsTrigger value="impact" disabled={!selected}>{fr ? '4. Impact' : '4. Impact'}</TabsTrigger>
          <TabsTrigger value="history">{fr ? 'Historique' : 'History'}</TabsTrigger>
        </TabsList>


        {/* ---------- 1. INTAKE ---------- */}
        <TabsContent value="intake" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-5 w-5 text-primary" />
                {fr ? 'Décrivez ce qui ne fonctionne pas' : 'Describe what is not working'}
              </CardTitle>
              <CardDescription>
                {fr
                  ? 'Plus le contexte est précis, plus la confiance du diagnostic est élevée.'
                  : 'The more context you give, the higher the diagnostic confidence.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="d-title">{fr ? 'Titre du cas' : 'Case title'}</Label>
                  <Input
                    id="d-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={fr ? 'Ex : Qualité du service client' : 'e.g. Customer service quality'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="d-dept">{fr ? 'Service / département' : 'Department'}</Label>
                  <Input
                    id="d-dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder={fr ? 'Ex : Service client' : 'e.g. Customer service'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="d-problem">{fr ? 'Le problème métier' : 'The business problem'}</Label>
                <Textarea
                  id="d-problem"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  rows={6}
                  placeholder={
                    fr
                      ? 'Ex : Les réclamations clients ont augmenté de 30 % en trois mois. Les agents disent manquer de temps, les procédures ont changé sans formation et les superviseurs ne font plus de feedback hebdomadaire.'
                      : 'e.g. Customer complaints rose 30% in three months. Agents say they lack time, procedures changed without training and supervisors stopped weekly feedback.'
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="d-pop">{fr ? 'Population concernée' : 'Affected population'}</Label>
                  <Input
                    id="d-pop"
                    value={population}
                    onChange={(e) => setPopulation(e.target.value)}
                    placeholder={fr ? 'Ex : Agents et superviseurs' : 'e.g. Agents and supervisors'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="d-head">{fr ? 'Nombre de personnes' : 'Headcount'}</Label>
                  <Input id="d-head" type="number" min={0} value={headcount} onChange={(e) => setHeadcount(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
                <Label className="text-sm">
                  {fr ? 'Hypothèses de coût (optionnel)' : 'Cost assumptions (optional)'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {fr
                    ? 'Qimatak n’invente aucun coût. Sans hypothèse saisie ici, les montants restent « à chiffrer ».'
                    : 'Qimatak never invents a cost. Without an assumption here, amounts stay "to be costed".'}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="d-cpp" className="text-xs text-muted-foreground">
                      {fr ? 'Coût de formation par personne (MAD)' : 'Training cost per person (MAD)'}
                    </Label>
                    <Input id="d-cpp" type="number" min={0} value={costPerPerson} onChange={(e) => setCostPerPerson(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="d-tb" className="text-xs text-muted-foreground">
                      {fr ? 'Budget formation total envisagé (MAD)' : 'Total training budget considered (MAD)'}
                    </Label>
                    <Input id="d-tb" type="number" min={0} value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{fr ? 'Symptômes observés' : 'Observed symptoms'}</Label>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOM_OPTIONS.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => toggleSymptom(s.key)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        symptoms.includes(s.key)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {s[lang]}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>{fr ? 'Indicateurs métiers actuels' : 'Current business indicators'}</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={kpiName}
                    onChange={(e) => setKpiName(e.target.value)}
                    placeholder={fr ? 'Indicateur (ex : taux de réclamation)' : 'Indicator (e.g. complaint rate)'}
                  />
                  <Input
                    value={kpiValue}
                    onChange={(e) => setKpiValue(e.target.value)}
                    placeholder={fr ? 'Valeur (ex : 12 %)' : 'Value (e.g. 12%)'}
                    className="sm:max-w-[180px]"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (!kpiName.trim()) return;
                      setKpis((k) => [...k, { name: kpiName.trim(), value: kpiValue.trim() }]);
                      setKpiName('');
                      setKpiValue('');
                    }}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    {fr ? 'Ajouter' : 'Add'}
                  </Button>
                </div>
                {kpis.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {kpis.map((k, i) => (
                      <Badge
                        key={`${k.name}-${i}`}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => setKpis((list) => list.filter((_, idx) => idx !== i))}
                      >
                        {k.name}{k.value ? `: ${k.value}` : ''} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>{fr ? 'Sources de preuve disponibles' : 'Available evidence sources'}</Label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {EVIDENCE_FIELDS.map((f) => (
                    <div key={f.key} className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <f.icon className="h-3.5 w-3.5" />
                        {f[lang]}
                      </div>
                      <Input
                        type="number"
                        min={0}
                        value={evidence[f.key] ?? ''}
                        onChange={(e) =>
                          setEvidence((prev) => ({ ...prev, [f.key]: Number(e.target.value) || 0 }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={submit} disabled={runDiagnostic.isPending} size="lg" className="w-full sm:w-auto">
                {runDiagnostic.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{fr ? 'Analyse des causes racines…' : 'Analysing root causes…'}</>
                ) : (
                  <><Brain className="mr-2 h-4 w-4" />{fr ? 'Lancer le diagnostic' : 'Run the diagnostic'}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- 2. RESULT ---------- */}
        <TabsContent value="result" className="mt-4 space-y-4">
          {!selected ? (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
              {fr ? 'Lancez un diagnostic pour voir le résultat.' : 'Run a diagnostic to see the result.'}
            </CardContent></Card>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-base">Training Fit Score</CardTitle>
                    <CardDescription>
                      {fr
                        ? 'Qimatak Training Fit Score — version pilote. Score d’aide à la décision, à confirmer par les preuves disponibles.'
                        : 'Qimatak Training Fit Score — pilot version. Decision-support score, to be confirmed by the available evidence.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    <TrainingFitScore
                      score={selected.training_fit_score ?? 0}
                      label={
                        (selected.training_fit_score ?? 0) < 40
                          ? fr ? 'La formation n’est pas prioritaire' : 'Training is not the priority'
                          : (selected.training_fit_score ?? 0) < 70
                            ? fr ? 'Formation partiellement pertinente' : 'Training is partly relevant'
                            : fr ? 'La formation est pertinente' : 'Training is relevant'
                      }
                      verdict={selected.ai_verdict ?? undefined}
                    />
                    <div className="w-full rounded-lg border border-border/60 bg-muted/40 p-3">
                      <TrainingFitExplanation factors={selected.training_fit_explanation ?? []} language={lang} />
                    </div>
                    <div className="w-full space-y-2 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{fr ? 'Confiance IA' : 'AI confidence'}</span>
                        <span className="font-semibold">{selected.ai_confidence ?? 0}%</span>
                      </div>
                      {(selected.missing_evidence ?? []).length > 0 && (
                        <div className="space-y-1.5 rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5">
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                            <FileSearch className="h-3.5 w-3.5" />
                            {fr ? 'Preuves manquantes / Ce qui augmenterait la confiance' : 'Missing evidence / What would raise confidence'}
                          </p>
                          <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                            {(selected.missing_evidence ?? []).map((m, i) => (
                              <li key={`${i}-${m}`}>{m}</li>
                            ))}
                          </ul>
                          <Button size="sm" variant="outline" className="w-full" onClick={() => setTab('evidence')}>
                            <Radio className="mr-1.5 h-3.5 w-3.5" />
                            {fr ? 'Collecter les preuves' : 'Collect the evidence'}
                          </Button>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <TrendingDown className="h-3.5 w-3.5" />
                          {fr ? 'Formation évitée' : 'Training avoided'}
                        </span>
                        <span className="font-semibold text-emerald-600">
                          {fmtMad(selected.avoided_training_cost_mad)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{fr ? 'Coût si tout le monde' : 'Cost if everyone'}</span>
                        <span className="font-semibold">{fmtMad(selected.estimated_training_cost_mad)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {fr ? 'Causes racines probables (hypothèses)' : 'Likely root causes (hypotheses)'}
                    </CardTitle>
                    <CardDescription>
                      {selected.title} — {fr
                        ? 'Les pourcentages sont des hypothèses appuyées par les preuves fournies, pas une vérité absolue.'
                        : 'Percentages are hypotheses supported by the evidence provided, not absolute truth.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CauseBreakdownChart
                      breakdown={selected.cause_breakdown}
                      causeEvidence={selected.cause_evidence ?? []}
                      language={lang}
                    />

                    {selected.ai_summary && (
                      <p className="rounded-lg bg-muted/40 p-3 text-sm leading-relaxed text-muted-foreground">
                        {selected.ai_summary}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {EVIDENCE_FIELDS.map((f) => (
                        <span key={f.key} className="flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-1">
                          <f.icon className="h-3.5 w-3.5" />
                          <strong className="text-foreground">{selected.evidence_sources?.[f.key] ?? 0}</strong>
                          {f[lang]}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{fr ? 'Actions recommandées' : 'Recommended actions'}</CardTitle>
                    <CardDescription>
                      {fr ? 'La bonne intervention, pas forcément une formation.' : 'The right intervention, not necessarily training.'}
                    </CardDescription>
                  </div>
                  {trainingActions.length > 0 && (
                    <Button onClick={handoffToPlan} size="sm">
                      {fr ? 'Cibler la formation' : 'Target the training'}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {(detail?.actions ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">{fr ? 'Aucune action.' : 'No action.'}</p>
                  )}
                  {(detail?.actions ?? []).map((a) => (
                    <div key={a.id} className="rounded-lg border border-border/60 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={ACTION_TONE[a.action_type] ?? ''}>
                              {a.action_type === 'training' ? (
                                <Target className="mr-1 h-3 w-3" />
                              ) : (
                                <Wrench className="mr-1 h-3 w-3" />
                              )}
                              {CAUSE_LABELS[lang][actionCauseKey(a.action_type)] ?? a.action_type}
                            </Badge>
                            <span className="text-sm font-semibold text-foreground">{a.title}</span>
                            <Badge variant="secondary" className="text-[10px] uppercase">{a.priority}</Badge>
                          </div>
                          {a.description && <p className="text-sm text-muted-foreground">{a.description}</p>}
                          {a.rationale && <p className="text-xs italic text-muted-foreground">{a.rationale}</p>}
                          <div className="flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
                            {a.target_population && <span><Users className="mr-1 inline h-3 w-3" />{a.target_population}{a.headcount ? ` (${a.headcount})` : ''}</span>}
                            {a.expected_impact && <span><Activity className="mr-1 inline h-3 w-3" />{a.expected_impact}</span>}
                            {a.estimated_cost_mad ? <span>{fmtMad(a.estimated_cost_mad)}</span> : null}
                          </div>
                        </div>
                        <Select
                          value={a.status}
                          onValueChange={(v) => updateAction.mutate({ id: a.id, patch: { status: v } })}
                        >
                          <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ACTION_STATUS.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[lang][s] ?? s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <DecisionCard
                language={lang}
                trainEveryoneCost={selected.estimated_training_cost_mad}
                planCost={planCost.total}
                nonTrainingCost={planCost.nonTraining}
                costedActions={planCost.costed}
                totalActions={(detail?.actions ?? []).length}
                trainingActions={planCost.trainingActions}
                headcount={selected.headcount_affected}
                capabilityShare={capabilityShare}
                verifiedTrainableHeadcount={
                  (selected.capability_verification as { trainable_headcount?: number } | null)?.trainable_headcount ?? null
                }
              />
            </>
          )}
        </TabsContent>

        {/* ---------- 3. EVIDENCE PULSE ---------- */}
        <TabsContent value="evidence" className="mt-4 space-y-4">
          {!selected ? (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
              {fr ? 'Lancez un diagnostic pour collecter des preuves.' : 'Run a diagnostic to collect evidence.'}
            </CardContent></Card>
          ) : (
            <>
              <EvidencePulsePanel
                diagnostic={selected}
                language={lang}
                onReassessed={(id) => { setSelectedId(id); setTab('result'); }}
              />
              {capabilityShare >= 25 && <CapabilityCheckPanel diagnostic={selected} language={lang} />}
            </>
          )}
        </TabsContent>

        {/* ---------- 4. IMPACT ---------- */}

        <TabsContent value="impact" className="mt-4">
          <ImpactTracker
            fr={fr}
            measurements={detail?.measurements ?? []}
            disabled={!selectedId}
            problemTitle={selected?.title ?? null}
            problemDescription={selected?.problem_description ?? null}
            onAddKpi={(row) => upsertMeasurement.mutate(row)}
            onAddReading={(row) => upsertMeasurement.mutate(row)}
            onUpdate={(row) => upsertMeasurement.mutate(row)}
            onDelete={(id) => deleteMeasurement.mutate(id)}
          />


        </TabsContent>

        {/* ---------- HISTORY ---------- */}
        <TabsContent value="history" className="mt-4 space-y-3">
          {isLoading && <Skeleton className="h-24 w-full" />}
          {!isLoading && diagnostics.length === 0 && (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
              {fr ? 'Aucun diagnostic enregistré.' : 'No diagnostic saved yet.'}
            </CardContent></Card>
          )}
          {diagnostics.map((d) => (
            <Card key={d.id} className={selectedId === d.id ? 'border-primary/50' : ''}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{d.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.department || '—'} · {new Date(d.created_at).toLocaleDateString(fr ? 'fr-MA' : 'en-GB')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(d.version ?? 1) > 1 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {fr ? `Réévaluation v${d.version}` : `Reassessment v${d.version}`}
                    </Badge>
                  )}
                  <Badge variant="outline">Fit {d.training_fit_score ?? 0}/100</Badge>

                  <Button size="sm" variant="secondary" onClick={() => { setSelectedId(d.id); setTab('result'); }}>
                    {fr ? 'Ouvrir' : 'Open'}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteDiagnostic.mutate(d.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
