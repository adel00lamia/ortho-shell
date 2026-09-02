import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Check, Loader2, ShieldCheck, Sparkles, Clock, Target,
  Lightbulb, AlertTriangle, GraduationCap, Send,
} from 'lucide-react';
import {
  COMPANY_SIZES, DIMENSIONS, HR_ROLES, HR_TEAM_SIZES, SECTORS, SENIORITIES,
} from '@/config/diagnosticEngine';
import { getQuestions, scoreDiagnostic, type AnswerMap, type DiagnosticResult } from '@/lib/diagnosticScoring';
import { generateAiDiagnostic } from '@/lib/aiHrDiagnostic';
import { useDiagnosticSession, useSubmitDiagnostic, type ParticipantProfile } from '@/hooks/useDiagnosticEngine';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis,
} from 'recharts';

type Step = 'landing' | 'privacy' | 'profile' | 'questions' | 'result';

const emptyProfile: ParticipantProfile = {
  first_name: '', company: '', sector: '', company_size: '', job_title: '',
  hr_function: '', seniority: '', team_size: '', contact_email: '', contact_whatsapp: '',
  contact_consent: false,
};

export default function AiHrDiagnostic() {
  const { code } = useParams<{ code?: string }>();
  const { data: session } = useDiagnosticSession(code);
  const submit = useSubmitDiagnostic();

  const [step, setStep] = useState<Step>('landing');
  const [profile, setProfile] = useState<ParticipantProfile>(emptyProfile);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [qIndex, setQIndex] = useState(0);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  const questions = useMemo(
    () => (profile.hr_function ? getQuestions('hr', profile.hr_function) : []),
    [profile.hr_function],
  );
  const current = questions[qIndex];
  const progress = questions.length ? Math.round(((qIndex + 1) / questions.length) * 100) : 0;

  const setAnswer = (id: string, value: AnswerMap[string]) => setAnswers((a) => ({ ...a, [id]: value }));

  const toggleMulti = (id: string, value: string, pick: number) => {
    const arr = Array.isArray(answers[id]) ? [...(answers[id] as string[])] : [];
    const i = arr.indexOf(value);
    if (i >= 0) arr.splice(i, 1);
    else {
      if (arr.length >= pick) arr.shift();
      arr.push(value);
    }
    setAnswer(id, arr);
  };

  const profileValid = profile.first_name.trim().length > 1 && !!profile.hr_function;
  const sessionClosed = !!session && !session.is_open;

  const finish = async () => {
    const computed = scoreDiagnostic('hr', profile.hr_function, answers);
    setResult(computed);
    setStep('result');
    window.scrollTo({ top: 0 });
    if (sessionClosed) {
      toast.error('Cette session est clôturée : votre résultat n’a pas été enregistré.');
      return;
    }
    try {
      await submit.mutateAsync({
        sessionId: session?.id ?? null,
        profile,
        answers,
        result: computed,
      });
    } catch {
      toast.error('Résultat affiché, mais l’enregistrement a échoué.');
    }
  };


  const next = () => {
    if (qIndex + 1 < questions.length) {
      setQIndex((i) => i + 1);
      window.scrollTo({ top: 0 });
    } else {
      finish();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-2xl px-4 pb-16 pt-8">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-extrabold tracking-tight text-primary">
              QimataQ
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              AI × HR
            </span>
          </div>
          {session && (
            <Badge variant="secondary" className="max-w-[45%] truncate text-xs">
              {session.title}
            </Badge>
          )}
        </header>

        {sessionClosed && step !== 'result' ? (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">Session clôturée</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Le diagnostic de la session « {session?.title} » n’accepte plus de nouvelles réponses.
              </p>
              <p>Contactez l’animateur si vous souhaitez participer.</p>
            </CardContent>
          </Card>
        ) : (
        <AnimatePresence mode="wait">

          {/* ─────────── Landing ─────────── */}
          {step === 'landing' && (
            <motion.section
              key="landing"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <Badge variant="outline" className="gap-1.5 border-primary/30 text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> Diagnostic AI × HR
                </Badge>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                  Où l’IA peut-elle réellement vous faire gagner du temps en RH ?
                </h1>
                <p className="text-base leading-relaxed text-muted-foreground">
                  En 5 minutes, identifiez vos principaux irritants RH, votre maturité IA et les cas d’usage
                  à plus fort impact pour votre fonction.
                </p>
              </div>

              <Button size="lg" className="w-full gap-2 text-base" onClick={() => setStep('privacy')}>
                Commencer mon diagnostic <ArrowRight className="h-4 w-4" />
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                5 minutes • Résultat personnalisé • Aucun prérequis technique
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Target, t: 'Diagnostiquer', d: 'Vos irritants réels, pas un questionnaire générique.' },
                  { icon: Lightbulb, t: 'Prioriser', d: 'Les cas d’usage IA à plus fort impact.' },
                  { icon: GraduationCap, t: 'Apprendre', d: 'Un parcours de formation adapté à votre fonction.' },
                ].map(({ icon: Icon, t, d }) => (
                  <Card key={t} className="border-border/60 bg-card/60">
                    <CardContent className="space-y-1.5 p-4">
                      <Icon className="h-4 w-4 text-primary" />
                      <p className="text-sm font-bold text-foreground">{t}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{d}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.section>
          )}

          {/* ─────────── Privacy ─────────── */}
          {step === 'privacy' && (
            <motion.section key="privacy" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="h-5 w-5 text-primary" /> Confidentialité
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                  <ul className="space-y-2.5">
                    {[
                      'Vos réponses servent à générer votre diagnostic et des statistiques agrégées pour la formation.',
                      'N’indiquez aucune donnée sensible concernant vos collaborateurs.',
                      'Vos coordonnées sont facultatives : vous décidez de les partager ou non.',
                      'Les analyses de groupe sont anonymes et ne révèlent pas les réponses individuelles.',
                    ].map((l) => (
                      <li key={l} className="flex gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{l}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep('landing')}>
                      Retour
                    </Button>
                    <Button className="flex-1 gap-2" onClick={() => setStep('profile')}>
                      J’ai compris <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          )}

          {/* ─────────── Profile ─────────── */}
          {step === 'profile' && (
            <motion.section key="profile" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Votre profil</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Ces informations personnalisent vos questions et vos recommandations.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Prénom *</Label>
                    <Input
                      value={profile.first_name}
                      onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                      placeholder="Salma"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Entreprise (facultatif)</Label>
                    <Input
                      value={profile.company}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField label="Secteur" value={profile.sector} options={SECTORS} onChange={(v) => setProfile({ ...profile, sector: v })} />
                    <SelectField label="Effectif de l’entreprise" value={profile.company_size} options={COMPANY_SIZES} onChange={(v) => setProfile({ ...profile, company_size: v })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Intitulé de poste</Label>
                    <Input
                      value={profile.job_title}
                      onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                      placeholder="Responsable recrutement"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fonction RH principale *</Label>
                    <Select value={profile.hr_function} onValueChange={(v) => setProfile({ ...profile, hr_function: v })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        {HR_ROLES.map((r) => (
                          <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField label="Ancienneté dans le poste" value={profile.seniority} options={SENIORITIES} onChange={(v) => setProfile({ ...profile, seniority: v })} />
                    <SelectField label="Taille de l’équipe RH" value={profile.team_size} options={HR_TEAM_SIZES} onChange={(v) => setProfile({ ...profile, team_size: v })} />
                  </div>

                  <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-sm font-semibold text-foreground">Recevoir mon diagnostic (facultatif)</p>
                    <Input
                      value={profile.contact_email}
                      onChange={(e) => setProfile({ ...profile, contact_email: e.target.value })}
                      placeholder="E-mail"
                      type="email"
                    />
                    <Input
                      value={profile.contact_whatsapp}
                      onChange={(e) => setProfile({ ...profile, contact_whatsapp: e.target.value })}
                      placeholder="WhatsApp"
                    />
                    <label className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                      <Checkbox
                        checked={!!profile.contact_consent}
                        onCheckedChange={(c) => setProfile({ ...profile, contact_consent: !!c })}
                        className="mt-0.5"
                      />
                      <span>
                        J’accepte que QimataQ utilise mes coordonnées pour m’envoyer mon diagnostic et des
                        informations sur les parcours AI × HR.
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setStep('privacy')}>Retour</Button>
                    <Button
                      className="flex-1 gap-2"
                      disabled={!profileValid}
                      onClick={() => { setStep('questions'); setQIndex(0); }}
                    >
                      Continuer <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          )}

          {/* ─────────── Questions ─────────── */}
          {step === 'questions' && current && (
            <motion.section key={current.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Question {qIndex + 1} / {questions.length}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold leading-snug text-foreground sm:text-2xl">{current.label}</h2>
                {current.hint && <p className="text-sm text-muted-foreground">{current.hint}</p>}
                {current.notice && (
                  <p className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {current.notice}
                  </p>
                )}
              </div>

              {current.type === 'multi' && (
                <div className="space-y-2">
                  {current.options?.map((o) => {
                    const selected = Array.isArray(answers[current.id]) && (answers[current.id] as string[]).includes(o.value);
                    return (
                      <button
                        key={o.value}
                        onClick={() => toggleMulti(current.id, o.value, current.pick ?? 3)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-all active:scale-[0.99]',
                          selected
                            ? 'border-primary bg-primary/10 font-semibold text-foreground'
                            : 'border-border/60 bg-card/50 text-muted-foreground hover:border-primary/40',
                        )}
                      >
                        <span className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                        )}>
                          {selected && <Check className="h-3.5 w-3.5" />}
                        </span>
                        {o.label}
                      </button>
                    );
                  })}
                  <p className="text-xs text-muted-foreground">
                    Choisissez jusqu’à {current.pick ?? 3} réponses.
                  </p>
                </div>
              )}

              {current.type === 'single' && (
                <div className="space-y-2">
                  {current.options?.map((o) => {
                    const selected = answers[current.id] === o.value;
                    return (
                      <button
                        key={o.value}
                        onClick={() => setAnswer(current.id, o.value)}
                        className={cn(
                          'w-full rounded-xl border p-3.5 text-left text-sm transition-all active:scale-[0.99]',
                          selected
                            ? 'border-primary bg-primary/10 font-semibold text-foreground'
                            : 'border-border/60 bg-card/50 text-muted-foreground hover:border-primary/40',
                        )}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {current.type === 'scale' && (
                <div className="space-y-6 rounded-xl border border-border/60 bg-card/50 p-6">
                  <div className="text-center">
                    <span className="text-5xl font-extrabold text-primary">
                      {Number(answers[current.id] ?? 3)}
                    </span>
                    <span className="text-lg text-muted-foreground">/5</span>
                  </div>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[Number(answers[current.id] ?? 3)]}
                    onValueChange={([v]) => setAnswer(current.id, v)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Pas du tout</span><span>Très à l’aise</span>
                  </div>
                </div>
              )}

              {current.type === 'text' && (
                <Textarea
                  rows={5}
                  value={String(answers[current.id] ?? '')}
                  onChange={(e) => setAnswer(current.id, e.target.value)}
                  placeholder="Votre réponse…"
                />
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => (qIndex === 0 ? setStep('profile') : setQIndex((i) => i - 1))}
                >
                  <ArrowLeft className="h-4 w-4" /> Retour
                </Button>
                <Button className="flex-1 gap-2" onClick={next}>
                  {qIndex + 1 === questions.length ? 'Voir mon résultat' : 'Suivant'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.section>
          )}

          {/* ─────────── Result ─────────── */}
          {step === 'result' && result && (
            <motion.section key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultView result={result} firstName={profile.first_name} saving={submit.isPending} />
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="flex-1 gap-2">
                  <Link to="/pricing">Construire mon parcours AI × HR <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => window.print()}
                >
                  <Send className="h-4 w-4" /> Recevoir mon diagnostic
                </Button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
        )}

      </div>
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value?: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ResultView({ result, firstName, saving }: { result: DiagnosticResult; firstName?: string; saving?: boolean }) {
  const radar = DIMENSIONS.map((d) => ({ dim: d.short, value: result.dimensions[d.key] }));

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="space-y-5 p-6 text-center">
          {firstName && <p className="text-sm text-muted-foreground">Diagnostic de {firstName}</p>}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              AI × HR Opportunity Score
            </p>
            <p className="text-6xl font-extrabold tracking-tight text-primary">
              {result.opportunityScore}
              <span className="text-2xl text-muted-foreground">/100</span>
            </p>
          </div>
          <div className="space-y-1">
            <Badge className="text-sm">{result.profileLabel}</Badge>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">{result.profileBlurb}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Un score élevé signale un fort potentiel de gain grâce à l’IA — pas un niveau de maturité élevé.
          </p>
          {saving && (
            <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Enregistrement…
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Vos 5 dimensions</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="72%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="dim" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {DIMENSIONS.map((d) => (
              <div key={d.key} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">{d.short}</span>
                <span className="font-bold text-foreground">{result.dimensions[d.key]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Vos 3 principales zones de friction</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {result.frictions.length === 0 && <p className="text-sm text-muted-foreground">Aucune friction majeure identifiée.</p>}
          {result.frictions.map((f, i) => (
            <div key={f.label} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-foreground">{f.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Vos 5 cas d’usage IA prioritaires</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {result.useCases.map((u, i) => (
            <div key={u.id} className="space-y-2 rounded-xl border border-border/60 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold text-foreground">{i + 1}. {u.title}</p>
                {u.humanControl && <Badge variant="outline" className="shrink-0 text-[10px]">Contrôle humain</Badge>}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{u.description}</p>
              <div className="flex gap-4 text-[11px] font-semibold text-muted-foreground">
                <span>Impact {u.impact}/5</span>
                <span>Facilité {u.ease}/5</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardContent className="flex items-center gap-4 p-5">
          <Clock className="h-8 w-8 shrink-0 text-primary" />
          <div>
            <p className="text-lg font-extrabold text-foreground">
              {result.timeSaving.low} – {result.timeSaving.high} h / semaine
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Gain de temps indicatif, à titre d’estimation — non garanti.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Quick wins — à tester cette semaine</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {result.quickWins.map((w) => (
            <div key={w} className="flex gap-2.5 text-sm text-muted-foreground">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{w}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> À ne pas automatiser sans contrôle humain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {result.governance.map((g) => (
            <p key={g} className="text-sm leading-relaxed text-muted-foreground">• {g}</p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4 text-primary" /> Vos modules AI × HR recommandés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {result.modules.map((m) => (
            <div key={m.id} className="space-y-1 rounded-xl border border-border/60 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold text-foreground">{m.title}</p>
                <Badge variant="secondary" className="shrink-0 text-[10px]">{m.level}</Badge>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{m.summary}</p>
              <p className="text-[11px] font-semibold text-primary">{m.reason}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
