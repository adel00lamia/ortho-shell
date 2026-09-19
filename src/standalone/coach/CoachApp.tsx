/**
 * Standalone interview-coach application.
 *
 * Fully self-contained: no account, no company data, no shared layout.
 * Everything it stores lives in the browser (localStorage), and its only
 * backend contact point is ./api.ts.
 */
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Mic, Video, FileText, Loader2, Sparkles, Copy, Download, ChevronDown, Upload, Award, RotateCcw,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { InterviewCall } from './InterviewCall';
import { interviewMethods, type InterviewMethod } from './methods';
import { extractResumeText, RESUME_FILE_ACCEPT } from '@/lib/extractResumeText';
import {
  streamInterviewTurn, prepareFromResume, generateCv, requestFeedback,
  type CoachMsg, type ResumePrep, type GeneratedCv, type InterviewFeedback,
} from './api';

const KEYS = {
  resume: 'coach-resume-v1',
  identity: 'coach-identity-v1',
  setup: 'coach-setup-v1',
  lang: 'coach-lang-v1',
};

type Difficulty = 'warmup' | 'junior' | 'mid' | 'senior';
type Style = 'behavioral' | 'technical' | 'mixed';
type Lang = 'fr' | 'en' | 'ar';

const read = (key: string, fallback = '') => {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
};
const readJson = <T,>(key: string, fallback: T): T => {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
};
const write = (key: string, value: unknown) => {
  try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); } catch { /* ignore */ }
};

const CoachApp = () => {
  /* ------------------------------ Language ------------------------------ */
  const [lang, setLang] = useState<Lang>(() => (read(KEYS.lang, 'fr') as Lang) || 'fr');
  useEffect(() => { write(KEYS.lang, lang); }, [lang]);
  const fr = lang !== 'en';
  const apiLang: 'fr' | 'en' = lang === 'en' ? 'en' : 'fr';

  /* ------------------------------ Identity ------------------------------ */
  const [identity, setIdentity] = useState(() => readJson(KEYS.identity, { fullName: '', email: '', phone: '' }));
  useEffect(() => { write(KEYS.identity, identity); }, [identity]);

  /* ------------------------------- Resume ------------------------------- */
  const [resumeText, setResumeText] = useState(() => read(KEYS.resume));
  useEffect(() => { write(KEYS.resume, resumeText); }, [resumeText]);

  const importResume = async (file: File | null) => {
    if (!file) return;
    try {
      setResumeText(await extractResumeText(file));
      toast.success(fr ? 'CV importé et lu' : 'Resume imported and read');
    } catch (e) {
      const code = (e as Error).message;
      toast.error(
        code === 'DOC_LEGACY'
          ? (fr ? 'Format .doc trop ancien : enregistre en PDF ou .docx.' : 'Legacy .doc: save as PDF or .docx.')
          : code === 'EMPTY'
            ? (fr ? 'Aucun texte lisible (CV scanné ?) : colle le texte à la main.' : 'No readable text (scanned CV?): paste the text manually.')
            : (fr ? 'Fichier non lisible : utilise un PDF, un .docx ou du texte.' : 'Unreadable file: use a PDF, .docx or text file.'),
      );
    }
  };

  /* -------------------------- Interview setup --------------------------- */
  const [setup, setSetup] = useState(() => readJson(KEYS.setup, {
    position: '',
    difficulty: 'warmup' as Difficulty,
    style: 'mixed' as Style,
  }));
  useEffect(() => { write(KEYS.setup, setup); }, [setup]);

  const [chat, setChat] = useState<CoachMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [method, setMethod] = useState<string>('');
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const methods = useMemo(() => interviewMethods(fr), [fr]);

  const runTurn = async (history: CoachMsg[]) => {
    setChatLoading(true);
    setStreaming(true);
    setChat([...history, { role: 'assistant', content: '' }]);
    try {
      await streamInterviewTurn({
        position: setup.position,
        difficulty: setup.difficulty,
        style: setup.style,
        history,
        resumeText: resumeText.trim() || undefined,
        language: apiLang,
        onText: (acc) => setChat([...history, { role: 'assistant', content: acc }]),
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setStreaming(false);
      setChatLoading(false);
    }
  };

  const ensurePosition = () => {
    if (setup.position.trim()) return true;
    toast.error(fr ? 'Indique d’abord le poste visé' : 'Set a target role first');
    return false;
  };

  const startCall = () => {
    if (!ensurePosition()) return;
    setMethod('');
    setChat([]);
    setFeedback(null);
    setCallOpen(true);
  };

  const practiceMethod = (m: InterviewMethod) => {
    if (!setup.position.trim()) setSetup((s) => ({ ...s, position: fr ? 'Poste visé' : 'Target role' }));
    setMethod(m.title);
    setChat([{ role: 'assistant', content: m.question }]);
    setFeedback(null);
    setCallOpen(true);
  };

  const practiceQuestion = (question: string) => {
    if (!setup.position.trim()) setSetup((s) => ({ ...s, position: cvTarget || (fr ? 'Poste visé' : 'Target role') }));
    setMethod('');
    setChat([{ role: 'assistant', content: question }]);
    setFeedback(null);
    setCallOpen(true);
  };

  const sendAnswer = (text: string) => {
    if (!text.trim()) return;
    void runTurn([...chat, { role: 'user', content: text.trim() }]);
  };

  const askModelAnswer = () => {
    const activeMethod = method || (fr ? 'la méthode la plus adaptée' : 'the most suitable method');
    void runTurn([...chat, {
      role: 'user',
      content: fr
        ? `Donne-moi une réponse modèle complète et prête à dire pour ta dernière question, en utilisant ${activeMethod} (Situation, Tâche, Action, Résultat chiffré). Termine par une ligne « À adapter : … », puis repose la question.`
        : `Give me a complete, ready-to-say model answer to your last question using ${activeMethod} (Situation, Task, Action, quantified Result). End with one line “Adapt this: …”, then ask the question again.`,
    }]);
  };

  const askTips = () => {
    const activeMethod = method || (fr ? 'la méthode la plus adaptée' : 'the most suitable method');
    void runTurn([...chat, {
      role: 'user',
      content: fr
        ? `Avant que je réponde, donne-moi : 1) ce que le recruteur évalue vraiment, 2) la structure en 3 étapes selon ${activeMethod}, 3) deux phrases d’accroche à dire mot pour mot, 4) l’erreur à éviter. Ne repose pas la question, attends ma réponse.`
        : `Before I answer, give me: 1) what the recruiter really assesses, 2) the 3-step structure using ${activeMethod}, 3) two opening sentences to say word for word, 4) the mistake to avoid. Do not repeat the question, wait for my answer.`,
    }]);
  };

  const getFeedback = async () => {
    if (chat.length < 2) {
      toast.error(fr ? 'Réponds à au moins une question' : 'Answer at least one question first');
      return;
    }
    setFeedbackLoading(true);
    try {
      setFeedback(await requestFeedback(setup.position, chat, apiLang));
      toast.success(fr ? 'Bilan prêt' : 'Feedback ready');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setFeedbackLoading(false);
    }
  };

  /* ------------------------ Resume → questions -------------------------- */
  const [prep, setPrep] = useState<ResumePrep | null>(null);
  const [prepLoading, setPrepLoading] = useState(false);
  const [openPrep, setOpenPrep] = useState<number | null>(null);

  const analyzeResume = async () => {
    if (resumeText.trim().length < 80) {
      toast.error(fr ? 'Colle au moins quelques lignes de ton CV' : 'Paste at least a few lines of your resume');
      return;
    }
    setPrepLoading(true);
    try {
      setPrep(await prepareFromResume(resumeText.trim(), setup.position || cvTarget, apiLang));
      toast.success(fr ? 'Questions préparées' : 'Questions ready');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPrepLoading(false);
    }
  };

  /* ------------------------------ CV ciblé ------------------------------ */
  const [cvTarget, setCvTarget] = useState('');
  const [cvLoading, setCvLoading] = useState(false);
  const [cv, setCv] = useState<GeneratedCv | null>(null);

  const buildCv = async () => {
    if (resumeText.trim().length < 80 && !identity.fullName.trim()) {
      toast.error(fr ? 'Colle ton CV ou renseigne au moins ton nom' : 'Paste your resume or enter at least your name');
      return;
    }
    setCvLoading(true);
    try {
      setCv(await generateCv({ ...identity, resumeText: resumeText.trim(), jobTarget: cvTarget, language: apiLang }));
      toast.success(fr ? 'CV généré' : 'CV generated');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCvLoading(false);
    }
  };

  const downloadCvPdf = () => {
    if (!cv) return;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = margin;
    const name = identity.fullName || (fr ? 'Candidat' : 'Candidate');

    doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
    doc.text(name, margin, y); y += 22;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(100);
    doc.text([identity.email, identity.phone].filter(Boolean).join(' • '), margin, y); y += 18;
    doc.setDrawColor(200); doc.line(margin, y, pageW - margin, y); y += 16;
    doc.setTextColor(30);

    const section = (title: string) => {
      if (y > 760) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(40, 70, 160);
      doc.text(title, margin, y); y += 14;
      doc.setTextColor(30); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    };
    const para = (text: string) => {
      doc.splitTextToSize(text, pageW - margin * 2).forEach((l: string) => {
        if (y > 780) { doc.addPage(); y = margin; }
        doc.text(l, margin, y); y += 13;
      });
      y += 4;
    };

    if (cv.summary) { section(fr ? 'PROFIL' : 'SUMMARY'); para(cv.summary); }
    if (cv.highlights?.length) { section(fr ? 'POINTS FORTS' : 'HIGHLIGHTS'); cv.highlights.forEach((h) => para('• ' + h)); }
    if (cv.experiences?.length) {
      section(fr ? 'EXPÉRIENCES' : 'EXPERIENCE');
      cv.experiences.forEach((e) => {
        doc.setFont('helvetica', 'bold');
        para(`${e.title ?? ''}${e.company ? ' — ' + e.company : ''}`);
        doc.setFont('helvetica', 'normal');
        if (e.period) { doc.setTextColor(120); para(e.period); doc.setTextColor(30); }
        (e.bullets ?? []).forEach((b) => para('  • ' + b));
      });
    }
    if (cv.skills?.length) { section(fr ? 'COMPÉTENCES' : 'SKILLS'); para(cv.skills.join(' • ')); }
    if (cv.atsKeywords?.length) {
      section(fr ? 'MOTS-CLÉS ATS' : 'ATS KEYWORDS');
      doc.setTextColor(120); para(cv.atsKeywords.join(' · ')); doc.setTextColor(30);
    }
    doc.save(`CV_${name.replace(/\s+/g, '_')}.pdf`);
  };

  /* ------------------------------- Render ------------------------------- */
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/60 backdrop-blur sticky top-0 z-20">
        <div className="container max-w-5xl py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0"><Mic className="h-5 w-5" /></div>
            <div className="min-w-0">
              <p className="font-bold leading-tight truncate">Prep'Entretien</p>
              <p className="text-xs text-muted-foreground truncate">
                {fr ? 'Entraîne-toi à voix haute, avec les bonnes réponses' : 'Practice out loud, with the right answers'}
              </p>
            </div>
          </div>
          <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
            <SelectTrigger className="w-[112px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ar">العربية</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="container max-w-5xl py-6 space-y-6">
        <Tabs defaultValue="interview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="interview" className="text-xs sm:text-sm">
              <Video className="h-4 w-4 mr-1.5" />{fr ? 'Entretien' : 'Interview'}
            </TabsTrigger>
            <TabsTrigger value="prep" className="text-xs sm:text-sm">
              <Sparkles className="h-4 w-4 mr-1.5" />{fr ? 'Mes questions' : 'My questions'}
            </TabsTrigger>
            <TabsTrigger value="cv" className="text-xs sm:text-sm">
              <FileText className="h-4 w-4 mr-1.5" />{fr ? 'Mon CV' : 'My CV'}
            </TabsTrigger>
          </TabsList>

          {/* ------------------------- INTERVIEW ------------------------- */}
          <TabsContent value="interview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{fr ? 'Lancer une simulation' : 'Start a simulation'}</CardTitle>
                <CardDescription>
                  {fr
                    ? 'Sarah, recruteuse virtuelle, te parle à voix haute et écoute tes réponses au micro.'
                    : 'Sarah, a virtual recruiter, speaks out loud and listens to your answers.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-3">
                    <Label>{fr ? 'Poste visé' : 'Target role'}</Label>
                    <Input
                      value={setup.position}
                      onChange={(e) => setSetup({ ...setup, position: e.target.value })}
                      placeholder={fr ? 'ex : Chargé(e) de recrutement' : 'e.g. Recruitment Officer'}
                    />
                  </div>
                  <div>
                    <Label>{fr ? 'Niveau' : 'Level'}</Label>
                    <Select value={setup.difficulty} onValueChange={(v) => setSetup({ ...setup, difficulty: v as Difficulty })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warmup">{fr ? 'Échauffement' : 'Warm-up'}</SelectItem>
                        <SelectItem value="junior">{fr ? 'Junior' : 'Junior'}</SelectItem>
                        <SelectItem value="mid">{fr ? 'Intermédiaire' : 'Mid-level'}</SelectItem>
                        <SelectItem value="senior">{fr ? 'Senior' : 'Senior'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{fr ? 'Style' : 'Style'}</Label>
                    <Select value={setup.style} onValueChange={(v) => setSetup({ ...setup, style: v as Style })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="behavioral">{fr ? 'Comportemental' : 'Behavioral'}</SelectItem>
                        <SelectItem value="technical">{fr ? 'Technique' : 'Technical'}</SelectItem>
                        <SelectItem value="mixed">{fr ? 'Mixte' : 'Mixed'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full" onClick={startCall}>
                      <Video className="h-4 w-4 mr-2" />{fr ? 'Démarrer' : 'Start'}
                    </Button>
                  </div>
                </div>
                {resumeText.trim().length > 80 && (
                  <p className="text-xs text-muted-foreground">
                    {fr ? 'Ton CV est pris en compte pendant la simulation.' : 'Your resume is used during the simulation.'}
                  </p>
                )}
                {chat.length > 1 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => setCallOpen(true)}>
                      <Video className="h-4 w-4 mr-1.5" />{fr ? 'Reprendre l’appel' : 'Resume call'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={getFeedback} disabled={feedbackLoading}>
                      {feedbackLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Award className="h-4 w-4 mr-1.5" />}
                      {fr ? 'Mon bilan' : 'My feedback'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setChat([]); setFeedback(null); }}>
                      <RotateCcw className="h-4 w-4 mr-1.5" />{fr ? 'Réinitialiser' : 'Reset'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {feedback && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    {fr ? 'Bilan de la séance' : 'Session feedback'}
                    {typeof feedback.score === 'number' && <Badge>{feedback.score}/100</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {!!feedback.strengths?.length && (
                    <div>
                      <p className="font-semibold mb-1">{fr ? 'Points forts' : 'Strengths'}</p>
                      <ul className="list-disc pl-5 space-y-1">{feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  )}
                  {!!feedback.improvements?.length && (
                    <div>
                      <p className="font-semibold mb-1">{fr ? 'À travailler' : 'To improve'}</p>
                      <ul className="list-disc pl-5 space-y-1">{feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  )}
                  {feedback.modelAnswer && (
                    <div>
                      <p className="font-semibold mb-1">{fr ? 'Réponse modèle' : 'Model answer'}</p>
                      <p className="text-muted-foreground">{feedback.modelAnswer}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>{fr ? '4 techniques pour réussir' : '4 techniques that work'}</CardTitle>
                <CardDescription>
                  {fr ? 'Choisis une méthode et entraîne-toi dessus avec Sarah.' : 'Pick a method and practise it with Sarah.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {methods.map((m) => (
                  <div key={m.key} className="rounded-xl border p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold leading-tight">{m.title}</p>
                      <Badge variant="outline">{m.time}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{m.use}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.steps.map((s, i) => <Badge key={i} variant="secondary" className="text-[11px]">{i + 1}. {s}</Badge>)}
                    </div>
                    <p className="text-xs italic text-muted-foreground">{m.opener}</p>
                    <p className="text-xs bg-muted/50 rounded-lg p-2.5">{m.example}</p>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => practiceMethod(m)}>
                      <Mic className="h-3.5 w-3.5 mr-1.5" />{fr ? 'S’entraîner avec Sarah' : 'Practise with Sarah'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --------------------------- PREP --------------------------- */}
          <TabsContent value="prep" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{fr ? 'Mon CV → mes questions d’entretien' : 'My CV → my interview questions'}</CardTitle>
                <CardDescription>
                  {fr
                    ? 'Importe ton CV (PDF, Word .docx) ou colle le texte. La lecture se fait dans ton navigateur : rien n’est stocké sur un serveur.'
                    : 'Upload your CV (PDF, Word .docx) or paste the text. It is read in your browser: nothing is stored on a server.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  rows={8}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder={fr ? 'Colle ici ton CV (expériences, formations, compétences)…' : 'Paste your CV here (experience, education, skills)…'}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-1.5" />
                      {fr ? 'Importer mon CV (PDF, Word, texte)' : 'Upload my CV (PDF, Word, text)'}
                      <input
                        type="file"
                        accept={RESUME_FILE_ACCEPT}
                        className="hidden"
                        onChange={(e) => importResume(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </Button>
                  <Button onClick={analyzeResume} disabled={prepLoading}>
                    {prepLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
                    {fr ? 'Préparer mes questions' : 'Prepare my questions'}
                  </Button>
                  {!!resumeText && (
                    <Button variant="ghost" size="sm" onClick={() => { setResumeText(''); setPrep(null); }}>
                      {fr ? 'Effacer' : 'Clear'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {prep && (
              <Card>
                <CardHeader>
                  <CardTitle>{fr ? 'Ce qui va tomber' : 'What you will be asked'}</CardTitle>
                  {prep.summary && <CardDescription>{prep.summary}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-3">
                  {(!!prep.strengths?.length || !!prep.risks?.length) && (
                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      {!!prep.strengths?.length && (
                        <div className="rounded-lg border p-3">
                          <p className="font-semibold mb-1">{fr ? 'Tes atouts' : 'Your strengths'}</p>
                          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                            {prep.strengths.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                      {!!prep.risks?.length && (
                        <div className="rounded-lg border p-3">
                          <p className="font-semibold mb-1">{fr ? 'Points à sécuriser' : 'Points to secure'}</p>
                          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                            {prep.risks.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    {(prep.questions ?? []).map((q, i) => {
                      const open = openPrep === i;
                      return (
                        <div key={i} className="rounded-xl border overflow-hidden">
                          <button
                            type="button"
                            className="w-full text-left p-3 flex items-start justify-between gap-3 hover:bg-muted/50"
                            onClick={() => setOpenPrep(open ? null : i)}
                          >
                            <span className="text-sm font-medium">{i + 1}. {q.question}</span>
                            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                          </button>
                          {open && (
                            <div className="px-3 pb-3 space-y-2.5 text-sm">
                              {q.why && <p className="text-muted-foreground"><span className="font-semibold text-foreground">{fr ? 'Ce qui est évalué : ' : 'What is assessed: '}</span>{q.why}</p>}
                              {!!q.keyPoints?.length && (
                                <div>
                                  <p className="font-semibold">{fr ? 'À placer absolument' : 'Must-say points'}</p>
                                  <ul className="list-disc pl-5 text-muted-foreground">{q.keyPoints.map((k, j) => <li key={j}>{k}</li>)}</ul>
                                </div>
                              )}
                              {q.modelAnswer && (
                                <div className="rounded-lg bg-muted/50 p-3">
                                  <p className="font-semibold mb-1">{fr ? 'Réponse modèle' : 'Model answer'}</p>
                                  <p className="text-muted-foreground whitespace-pre-line">{q.modelAnswer}</p>
                                </div>
                              )}
                              {q.personalize && <p className="text-xs text-muted-foreground italic">{q.personalize}</p>}
                              <div className="flex flex-wrap gap-2 pt-1">
                                <Button size="sm" onClick={() => practiceQuestion(q.question)}>
                                  <Mic className="h-3.5 w-3.5 mr-1.5" />{fr ? 'Répéter avec Sarah' : 'Rehearse with Sarah'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${q.question}\n\n${q.modelAnswer ?? ''}`);
                                    toast.success(fr ? 'Copié' : 'Copied');
                                  }}
                                >
                                  <Copy className="h-3.5 w-3.5 mr-1.5" />{fr ? 'Copier' : 'Copy'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ---------------------------- CV ---------------------------- */}
          <TabsContent value="cv" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{fr ? 'CV ciblé pour un poste' : 'CV targeted at a role'}</CardTitle>
                <CardDescription>
                  {fr
                    ? 'À partir de ton CV et du poste visé, obtiens un CV reformulé, avec mots-clés ATS, téléchargeable en PDF.'
                    : 'From your CV and the target role, get a rewritten CV with ATS keywords, downloadable as PDF.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label>{fr ? 'Nom complet' : 'Full name'}</Label>
                    <Input value={identity.fullName} onChange={(e) => setIdentity({ ...identity, fullName: e.target.value })} />
                  </div>
                  <div>
                    <Label>{fr ? 'E-mail' : 'Email'}</Label>
                    <Input value={identity.email} onChange={(e) => setIdentity({ ...identity, email: e.target.value })} />
                  </div>
                  <div>
                    <Label>{fr ? 'Téléphone' : 'Phone'}</Label>
                    <Input value={identity.phone} onChange={(e) => setIdentity({ ...identity, phone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>{fr ? 'Poste visé' : 'Target role'}</Label>
                  <Input
                    value={cvTarget}
                    onChange={(e) => setCvTarget(e.target.value)}
                    placeholder={fr ? 'ex : Data Analyst junior' : 'e.g. Junior Data Analyst'}
                  />
                </div>
                {resumeText.trim().length < 80 && (
                  <p className="text-xs text-muted-foreground">
                    {fr
                      ? 'Astuce : colle ton CV dans l’onglet « Mes questions » pour un résultat beaucoup plus précis.'
                      : 'Tip: paste your CV in the “My questions” tab for a far more accurate result.'}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={buildCv} disabled={cvLoading}>
                    {cvLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
                    {fr ? 'Générer mon CV' : 'Generate my CV'}
                  </Button>
                  {cv && (
                    <Button variant="outline" onClick={downloadCvPdf}>
                      <Download className="h-4 w-4 mr-1.5" />{fr ? 'Télécharger en PDF' : 'Download as PDF'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {cv && (
              <Card>
                <CardHeader><CardTitle>{fr ? 'Aperçu' : 'Preview'}</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {cv.summary && <p>{cv.summary}</p>}
                  {!!cv.highlights?.length && (
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      {cv.highlights.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  )}
                  {cv.experiences?.map((e, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <p className="font-semibold">{e.title}{e.company ? ` — ${e.company}` : ''}</p>
                      {e.period && <p className="text-xs text-muted-foreground">{e.period}</p>}
                      {!!e.bullets?.length && (
                        <ul className="list-disc pl-5 mt-1 text-muted-foreground">
                          {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                  {!!cv.skills?.length && (
                    <div className="flex flex-wrap gap-1.5">
                      {cv.skills.map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>)}
                    </div>
                  )}
                  {!!cv.atsKeywords?.length && (
                    <p className="text-xs text-muted-foreground">{cv.atsKeywords.join(' · ')}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground pb-4">
          {fr
            ? 'Aucun compte requis. Ton CV et ta progression restent dans ce navigateur.'
            : 'No account required. Your CV and progress stay in this browser.'}
        </p>
      </main>

      <InterviewCall
        open={callOpen}
        onClose={() => setCallOpen(false)}
        chat={chat}
        chatLoading={chatLoading}
        streamingAssistant={streaming}
        language={lang}
        position={setup.position}
        coachingMethod={method || undefined}
        onStart={() => { if (!chat.length) void runTurn([]); }}
        onUserAnswer={sendAnswer}
        onAskHelp={askModelAnswer}
        onAskTips={askTips}
      />
    </div>
  );
};

export default CoachApp;
