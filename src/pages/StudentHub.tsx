import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  GraduationCap, Briefcase, Sparkles, FileText, Send, Loader2, ExternalLink, Plus, X,
  Bot, User as UserIcon, Download, Copy, Award, CheckCircle2, RotateCcw, Target, BookOpen,
  Video, Newspaper, Book,
} from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import { InterviewVideoCall } from '@/components/student/InterviewVideoCall';

type StudentProfile = {
  id?: string;
  user_id?: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  school?: string | null;
  field_of_study?: string | null;
  graduation_year?: number | null;
  bio?: string | null;
  languages?: string[];
  interests?: string[];
  technical_skills?: string[];
  soft_skills?: string[];
  cv_data?: Record<string, unknown> | null;
  company_id?: string | null;
};

type ChatMsg = { role: 'user' | 'assistant'; content: string };

interface SoftSkillTrack {
  key: string;
  icon: string;
  title: string;
  desc: string;
  color: string;
}

const SOFT_SKILL_TRACKS = (fr: boolean): SoftSkillTrack[] => [
  { key: 'communication', icon: '💬', title: fr ? 'Communication efficace' : 'Effective communication', desc: fr ? 'Écoute active, prise de parole, pitch' : 'Active listening, public speaking, pitching', color: 'from-blue-500/20 to-cyan-500/20' },
  { key: 'teamwork', icon: '🤝', title: fr ? 'Travail en équipe' : 'Teamwork', desc: fr ? 'Collaboration, résolution de conflits' : 'Collaboration, conflict resolution', color: 'from-emerald-500/20 to-teal-500/20' },
  { key: 'leadership', icon: '🚀', title: fr ? 'Leadership' : 'Leadership', desc: fr ? 'Influence, prise de décision, vision' : 'Influence, decision-making, vision', color: 'from-purple-500/20 to-pink-500/20' },
  { key: 'time', icon: '⏱️', title: fr ? 'Gestion du temps' : 'Time management', desc: fr ? 'Priorisation, deep work, anti-procrastination' : 'Prioritization, deep work, anti-procrastination', color: 'from-orange-500/20 to-amber-500/20' },
  { key: 'critical', icon: '🧠', title: fr ? 'Esprit critique' : 'Critical thinking', desc: fr ? 'Analyse, biais cognitifs, problem-solving' : 'Analysis, cognitive biases, problem-solving', color: 'from-indigo-500/20 to-violet-500/20' },
  { key: 'emotional', icon: '❤️', title: fr ? 'Intelligence émotionnelle' : 'Emotional intelligence', desc: fr ? 'Empathie, gestion du stress, conscience de soi' : 'Empathy, stress management, self-awareness', color: 'from-rose-500/20 to-red-500/20' },
  { key: 'adaptability', icon: '🌱', title: fr ? 'Adaptabilité' : 'Adaptability', desc: fr ? 'Flexibilité, apprentissage continu, résilience' : 'Flexibility, continuous learning, resilience', color: 'from-green-500/20 to-lime-500/20' },
  { key: 'negotiation', icon: '⚖️', title: fr ? 'Négociation' : 'Negotiation', desc: fr ? 'Persuasion, win-win, gestion d\'objections' : 'Persuasion, win-win, handling objections', color: 'from-yellow-500/20 to-orange-500/20' },
];

const STORAGE_KEY = 'student-softskills-v1';
type SoftSkillState = Record<string, { level: number; completedLessons: number[] }>;

const StudentHub = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const fr = language === 'fr';
  const qc = useQueryClient();

  /* ------------------------- Profile ------------------------- */
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: async (): Promise<StudentProfile | null> => {
      if (!user) return null;
      const { data } = await (supabase as any)
        .from('student_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const [draft, setDraft] = useState<StudentProfile>({});
  useEffect(() => { if (profile) setDraft(profile); }, [profile]);

  const saveProfile = useMutation({
    mutationFn: async (p: StudentProfile) => {
      if (!user) throw new Error('Not signed in');
      const payload = { ...p, user_id: user.id, email: p.email ?? user.email };
      const { error } = await (supabase as any)
        .from('student_profiles')
        .upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(fr ? 'Profil sauvegardé' : 'Profile saved');
      qc.invalidateQueries({ queryKey: ['student-profile'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /* ------------------------ Internships ----------------------- */
  const { data: internships, isLoading: intLoading } = useQuery({
    queryKey: ['internships'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('job_descriptions')
        .select('id,title,department,description,level,closes_at,is_open,employment_type')
        .eq('employment_type', 'internship')
        .eq('is_open', true)
        .order('created_at', { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  /* ------------------------- Soft skills ---------------------- */
  const [softState, setSoftState] = useState<SoftSkillState>({});

  // Load from DB (fallback to localStorage if offline / unauthenticated)
  useEffect(() => {
    const loadFromCache = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setSoftState(JSON.parse(raw));
      } catch { /* ignore */ }
    };
    if (!user) { loadFromCache(); return; }
    (async () => {
      const { data, error } = await (supabase as any)
        .from('student_soft_skill_progress')
        .select('skill_key, level, completed_lessons')
        .eq('user_id', user.id);
      if (error || !data) { loadFromCache(); return; }
      const next: SoftSkillState = {};
      for (const row of data as Array<{ skill_key: string; level: number; completed_lessons: number[] }>) {
        next[row.skill_key] = { level: row.level, completedLessons: row.completed_lessons ?? [] };
      }
      setSoftState(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    })();
  }, [user]);

  const persistSoft = (next: SoftSkillState, changedKey?: string) => {
    setSoftState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    if (!user || !changedKey) return;
    const row = next[changedKey];
    if (!row) return;
    (supabase as any)
      .from('student_soft_skill_progress')
      .upsert({
        user_id: user.id,
        company_id: profile?.company_id ?? null,
        skill_key: changedKey,
        level: row.level,
        completed_lessons: row.completedLessons,
      }, { onConflict: 'user_id,skill_key' })
      .then(({ error }: { error: { message: string } | null }) => {
        if (error) toast.error(error.message);
      });
  };

  const [activeTrack, setActiveTrack] = useState<SoftSkillTrack | null>(null);
  const [trackContent, setTrackContent] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);

  const openTrack = async (track: SoftSkillTrack) => {
    setActiveTrack(track);
    setTrackContent(null);
    setTrackLoading(true);
    try {
      const level = softState[track.key]?.level ?? 3;
      const { data, error } = await supabase.functions.invoke('student-coach', {
        body: { mode: 'softskill', skillKey: track.key, skillTitle: track.title, level, studentProfile: profile ?? draft, language: fr ? 'fr' : 'en' },
      });
      if (error) throw error;
      setTrackContent((data as { track: unknown }).track);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setTrackLoading(false);
    }
  };

  const setSkillLevel = (key: string, level: number) => {
    const next = { ...softState, [key]: { level, completedLessons: softState[key]?.completedLessons ?? [] } };
    persistSoft(next, key);
  };
  const toggleLesson = (key: string, idx: number) => {
    const cur = softState[key] ?? { level: 3, completedLessons: [] };
    const completed = cur.completedLessons.includes(idx)
      ? cur.completedLessons.filter((i) => i !== idx)
      : [...cur.completedLessons, idx];
    persistSoft({ ...softState, [key]: { ...cur, completedLessons: completed } }, key);
  };

  /* ------------------------- Interview ------------------------ */
  const [position, setPosition] = useState('');
  const [difficulty, setDifficulty] = useState<'warmup' | 'junior' | 'mid' | 'senior'>('warmup');
  const [style, setStyle] = useState<'behavioral' | 'technical' | 'mixed'>('mixed');
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

  const sendInterviewTurn = async (initial = false) => {
    if (!position.trim()) {
      toast.error(fr ? 'Indique un poste cible' : 'Set a target role first');
      return;
    }
    if (!initial && !chatInput.trim()) return;
    const newHistory: ChatMsg[] = initial
      ? []
      : [...chat, { role: 'user' as const, content: chatInput.trim() }];
    if (!initial) setChat(newHistory);
    setChatInput('');
    setChatLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('student-coach', {
        body: { mode: 'interview', position, difficulty, style, studentProfile: profile ?? draft, history: newHistory, language: fr ? 'fr' : 'en' },
      });
      if (error) throw error;
      const reply = (data as { reply?: string }).reply ?? '';
      setChat([...newHistory, { role: 'assistant', content: reply }]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setChatLoading(false);
    }
  };

  const requestFeedback = async () => {
    if (chat.length < 2) {
      toast.error(fr ? 'Réponds à au moins une question' : 'Answer at least one question first');
      return;
    }
    setFeedbackLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('student-coach', {
        body: { mode: 'feedback', position, history: chat, language: fr ? 'fr' : 'en' },
      });
      if (error) throw error;
      setFeedback((data as { feedback: unknown }).feedback);
      toast.success(fr ? 'Évaluation prête' : 'Feedback ready');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const resetInterview = () => { setChat([]); setFeedback(null); };

  // Voice-mode helper: send a spoken answer directly without using chatInput
  const sendInterviewAnswer = async (text: string) => {
    if (!text.trim() || !position.trim()) return;
    const newHistory: ChatMsg[] = [...chat, { role: 'user' as const, content: text.trim() }];
    setChat(newHistory);
    setChatLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('student-coach', {
        body: { mode: 'interview', position, difficulty, style, studentProfile: profile ?? draft, history: newHistory, language: fr ? 'fr' : 'en' },
      });
      if (error) throw error;
      const reply = (data as { reply?: string }).reply ?? '';
      setChat([...newHistory, { role: 'assistant', content: reply }]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setChatLoading(false);
    }
  };

  const [videoCallOpen, setVideoCallOpen] = useState(false);

  /* --------------------------- CV ----------------------------- */
  const [cvTarget, setCvTarget] = useState('');
  const [cvLoading, setCvLoading] = useState(false);
  const [cvResult, setCvResult] = useState<any>(null);

  const generateCv = async () => {
    if (!profile && !Object.keys(draft).length) {
      toast.error(fr ? 'Remplis ton profil d\'abord' : 'Fill your profile first');
      return;
    }
    setCvLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('student-coach', {
        body: { mode: 'cv', studentProfile: profile ?? draft, jobTarget: cvTarget, language: fr ? 'fr' : 'en' },
      });
      if (error) throw error;
      setCvResult((data as { cv: unknown }).cv);
      toast.success(fr ? 'CV généré' : 'CV generated');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCvLoading(false);
    }
  };

  const downloadCvPdf = () => {
    if (!cvResult) return;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = margin;
    const fullName = (profile?.full_name ?? draft.full_name ?? 'Student').toString();
    const email = (profile?.email ?? draft.email ?? user?.email ?? '').toString();
    const phone = (profile?.phone ?? draft.phone ?? '').toString();

    doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
    doc.text(fullName, margin, y); y += 22;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text([email, phone].filter(Boolean).join(' • '), margin, y); y += 18;
    doc.setDrawColor(200); doc.line(margin, y, pageW - margin, y); y += 16;
    doc.setTextColor(30);

    const section = (title: string) => {
      if (y > 760) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
      doc.setTextColor(40, 70, 160);
      doc.text(title, margin, y); y += 14;
      doc.setTextColor(30); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    };
    const para = (text: string) => {
      const lines = doc.splitTextToSize(text, pageW - margin * 2);
      lines.forEach((l: string) => {
        if (y > 780) { doc.addPage(); y = margin; }
        doc.text(l, margin, y); y += 13;
      });
      y += 4;
    };

    if (cvResult.summary) { section(fr ? 'PROFIL' : 'SUMMARY'); para(cvResult.summary); }
    if (cvResult.highlights?.length) {
      section(fr ? 'POINTS FORTS' : 'HIGHLIGHTS');
      cvResult.highlights.forEach((h: string) => para('• ' + h));
    }
    if (cvResult.experiences?.length) {
      section(fr ? 'EXPÉRIENCES' : 'EXPERIENCE');
      cvResult.experiences.forEach((e: any) => {
        doc.setFont('helvetica', 'bold');
        para(`${e.title ?? ''}${e.company ? ' — ' + e.company : ''}`);
        doc.setFont('helvetica', 'normal');
        if (e.period) { doc.setTextColor(120); para(e.period); doc.setTextColor(30); }
        (e.bullets ?? []).forEach((b: string) => para('  • ' + b));
      });
    }
    if (cvResult.skills?.length) { section(fr ? 'COMPÉTENCES' : 'SKILLS'); para(cvResult.skills.join(' • ')); }
    if (cvResult.atsKeywords?.length) {
      section(fr ? 'MOTS-CLÉS ATS' : 'ATS KEYWORDS');
      doc.setTextColor(120); para(cvResult.atsKeywords.join(' · ')); doc.setTextColor(30);
    }
    doc.save(`CV_${fullName.replace(/\s+/g, '_')}.pdf`);
    toast.success(fr ? 'PDF téléchargé' : 'PDF downloaded');
  };

  const copyCvJson = () => {
    if (!cvResult) return;
    navigator.clipboard.writeText(JSON.stringify(cvResult, null, 2));
    toast.success(fr ? 'JSON copié' : 'JSON copied');
  };

  /* ------------------------- Render -------------------------- */
  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{fr ? 'Espace étudiant' : 'Student Hub'}</h1>
          <p className="text-sm text-muted-foreground">
            {fr ? 'Profil, stages, soft skills, entretiens & CV' : 'Profile, internships, soft skills, interviews & CV'}
          </p>
        </div>
      </motion.div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="profile"><GraduationCap className="h-4 w-4 mr-2" />{fr ? 'Profil' : 'Profile'}</TabsTrigger>
          <TabsTrigger value="internships"><Briefcase className="h-4 w-4 mr-2" />{fr ? 'Stages' : 'Internships'}</TabsTrigger>
          <TabsTrigger value="softskills"><Sparkles className="h-4 w-4 mr-2" />{fr ? 'Soft skills' : 'Soft skills'}</TabsTrigger>
          <TabsTrigger value="cv"><FileText className="h-4 w-4 mr-2" />{fr ? 'CV & Entretien' : 'CV & Interview'}</TabsTrigger>
        </TabsList>

        {/* PROFILE */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{fr ? 'Mon profil étudiant' : 'My student profile'}</CardTitle>
              <CardDescription>{fr ? 'Ces informations alimentent le CV et l\'entretien IA.' : 'This data powers your AI CV and interview coach.'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileLoading ? <Skeleton className="h-64 w-full" /> : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label={fr ? 'Nom complet' : 'Full name'} value={draft.full_name ?? ''} onChange={(v) => setDraft({ ...draft, full_name: v })} />
                    <Field label="Email" value={draft.email ?? user?.email ?? ''} onChange={(v) => setDraft({ ...draft, email: v })} />
                    <Field label={fr ? 'Téléphone' : 'Phone'} value={draft.phone ?? ''} onChange={(v) => setDraft({ ...draft, phone: v })} />
                    <Field label={fr ? 'École / Université' : 'School / University'} value={draft.school ?? ''} onChange={(v) => setDraft({ ...draft, school: v })} />
                    <Field label={fr ? 'Filière' : 'Field of study'} value={draft.field_of_study ?? ''} onChange={(v) => setDraft({ ...draft, field_of_study: v })} />
                    <Field label={fr ? 'Année de diplôme' : 'Graduation year'} type="number" value={draft.graduation_year?.toString() ?? ''} onChange={(v) => setDraft({ ...draft, graduation_year: v ? Number(v) : null })} />
                  </div>
                  <div>
                    <Label>{fr ? 'Bio courte' : 'Short bio'}</Label>
                    <Textarea rows={3} value={draft.bio ?? ''} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} />
                  </div>
                  <ChipList label={fr ? 'Compétences techniques' : 'Technical skills'} values={draft.technical_skills ?? []} onChange={(v) => setDraft({ ...draft, technical_skills: v })} placeholder={fr ? 'ex: Python' : 'e.g. Python'} />
                  <ChipList label={fr ? 'Soft skills' : 'Soft skills'} values={draft.soft_skills ?? []} onChange={(v) => setDraft({ ...draft, soft_skills: v })} placeholder={fr ? 'ex: Leadership' : 'e.g. Leadership'} />
                  <ChipList label={fr ? 'Langues' : 'Languages'} values={draft.languages ?? []} onChange={(v) => setDraft({ ...draft, languages: v })} placeholder={fr ? 'ex: Français (C2)' : 'e.g. English (C2)'} />
                  <ChipList label={fr ? 'Centres d\'intérêt' : 'Interests'} values={draft.interests ?? []} onChange={(v) => setDraft({ ...draft, interests: v })} placeholder={fr ? 'ex: Robotique' : 'e.g. Robotics'} />

                  <Button onClick={() => saveProfile.mutate(draft)} disabled={saveProfile.isPending}>
                    {saveProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {fr ? 'Sauvegarder' : 'Save'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* INTERNSHIPS */}
        <TabsContent value="internships">
          <Card>
            <CardHeader>
              <CardTitle>{fr ? 'Stages disponibles' : 'Open internships'}</CardTitle>
              <CardDescription>
                {fr ? 'Les offres marquées "stage" apparaissent ici.' : 'Job descriptions tagged as internships appear here.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {intLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
              ) : !internships?.length ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>{fr ? 'Aucun stage publié pour le moment.' : 'No internships published yet.'}</p>
                  <p className="text-xs mt-1">{fr ? 'Demande à ton entreprise de créer une fiche de poste de type "stage".' : 'Ask your company to create a job description of type "internship".'}</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {internships.map((j: any) => (
                    <Card key={j.id} className="hover:border-primary/40 transition-colors">
                      <CardContent className="p-4 flex justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">{j.title}</h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {j.department && <Badge variant="outline">{j.department}</Badge>}
                            {j.level && <Badge variant="secondary">{j.level}</Badge>}
                            <Badge className="bg-primary/10 text-primary">{fr ? 'Stage' : 'Internship'}</Badge>
                          </div>
                          {j.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{j.description}</p>}
                        </div>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          {fr ? 'Postuler' : 'Apply'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SOFT SKILLS */}
        <TabsContent value="softskills">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {fr ? 'Catalogue soft skills' : 'Soft skills catalog'}
              </CardTitle>
              <CardDescription>
                {fr
                  ? 'Auto-évalue ton niveau, puis ouvre un parcours IA personnalisé : leçons, exercices et mise en situation.'
                  : 'Self-rate your level, then open an AI-personalized track: lessons, exercises and a real-world scenario.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SOFT_SKILL_TRACKS(fr).map((t) => {
                  const state = softState[t.key] ?? { level: 3, completedLessons: [] };
                  const progress = state.completedLessons.length > 0
                    ? Math.min(100, Math.round((state.completedLessons.length / 4) * 100))
                    : 0;
                  return (
                    <motion.div key={t.key} whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
                      <Card className={`overflow-hidden border bg-gradient-to-br ${t.color}`}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="text-3xl">{t.icon}</div>
                            {progress > 0 && (
                              <Badge variant="secondary" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />{progress}%
                              </Badge>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold leading-tight">{t.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.desc}</p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                {fr ? 'Mon niveau' : 'My level'}
                              </span>
                              <span className="text-xs font-medium">{state.level}/5</span>
                            </div>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((lvl) => (
                                <button
                                  key={lvl}
                                  onClick={(e) => { e.stopPropagation(); setSkillLevel(t.key, lvl); }}
                                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                                    lvl <= state.level ? 'bg-primary' : 'bg-muted-foreground/20 hover:bg-muted-foreground/40'
                                  }`}
                                  aria-label={`level ${lvl}`}
                                />
                              ))}
                            </div>
                          </div>

                          {progress > 0 && <Progress value={progress} className="h-1.5" />}

                          <Button size="sm" className="w-full" onClick={() => openTrack(t)}>
                            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                            {fr ? 'Coach IA' : 'AI coach'}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Soft-skill drawer */}
          <Sheet open={!!activeTrack} onOpenChange={(o) => !o && setActiveTrack(null)}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="text-2xl">{activeTrack?.icon}</span> {activeTrack?.title}
                </SheetTitle>
                <SheetDescription>{activeTrack?.desc}</SheetDescription>
              </SheetHeader>

              {trackLoading ? (
                <div className="space-y-3 mt-6">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : trackContent ? (
                <div className="mt-6 space-y-5 text-sm">
                  {trackContent.overview && (
                    <p className="text-muted-foreground italic">{trackContent.overview}</p>
                  )}

                  {trackContent.lessons?.length > 0 && (
                    <section>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />{fr ? 'Leçons' : 'Lessons'}
                      </h4>
                      <div className="space-y-2">
                        {trackContent.lessons.map((l: any, i: number) => {
                          const done = activeTrack && softState[activeTrack.key]?.completedLessons.includes(i);
                          return (
                            <button
                              key={i}
                              onClick={() => activeTrack && toggleLesson(activeTrack.key, i)}
                              className={`w-full text-left p-3 rounded-lg border transition-colors ${done ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/40'}`}
                            >
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${done ? 'text-primary' : 'text-muted-foreground/30'}`} />
                                <div className="flex-1">
                                  <div className="font-medium">{l.title}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">{l.summary}</div>
                                  {l.duration && <Badge variant="outline" className="text-[10px] mt-1">{l.duration}</Badge>}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {trackContent.scenario && (
                    <section className="rounded-lg border-l-4 border-primary bg-primary/5 p-3">
                      <h4 className="font-semibold flex items-center gap-2 mb-1">
                        <Target className="h-4 w-4" />{fr ? 'Mise en situation' : 'Real-world scenario'}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">{trackContent.scenario.context}</p>
                      <p className="text-sm font-medium mb-2">{trackContent.scenario.challenge}</p>
                      {trackContent.scenario.tips?.length > 0 && (
                        <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
                          {trackContent.scenario.tips.map((t: string, i: number) => <li key={i}>{t}</li>)}
                        </ul>
                      )}
                    </section>
                  )}

                  {trackContent.exercises?.length > 0 && (
                    <section>
                      <h4 className="font-semibold mb-2">{fr ? 'Exercices cette semaine' : 'Exercises this week'}</h4>
                      <ul className="space-y-1.5">
                        {trackContent.exercises.map((e: string, i: number) => (
                          <li key={i} className="flex gap-2 text-sm">
                            <span className="text-primary">✓</span>{e}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {trackContent.resources?.length > 0 && (
                    <section>
                      <h4 className="font-semibold mb-2">{fr ? 'Ressources' : 'Resources'}</h4>
                      <div className="space-y-1.5">
                        {trackContent.resources.map((r: any, i: number) => {
                          const Icon = r.type === 'video' ? Video : r.type === 'book' ? Book : Newspaper;
                          return (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span>{r.title}</span>
                              <Badge variant="outline" className="text-[10px] ml-auto">{r.type}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-6">{fr ? 'Aucun contenu.' : 'No content.'}</p>
              )}
            </SheetContent>
          </Sheet>
        </TabsContent>

        {/* CV & INTERVIEW */}
        <TabsContent value="cv" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* INTERVIEW SIM */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />{fr ? 'Simulateur d\'entretien' : 'Interview simulator'}</CardTitle>
                <CardDescription>{fr ? 'Choisis le poste, le niveau et le style — puis pratique.' : 'Pick role, level and style — then practice.'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder={fr ? 'Poste ciblé (ex: Data Analyst)' : 'Target role (e.g. Data Analyst)'} value={position} onChange={(e) => setPosition(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warmup">{fr ? '🌱 Échauffement (intro facile)' : '🌱 Warm-up (easy intro)'}</SelectItem>
                      <SelectItem value="junior">{fr ? 'Junior' : 'Junior'}</SelectItem>
                      <SelectItem value="mid">{fr ? 'Intermédiaire' : 'Mid-level'}</SelectItem>
                      <SelectItem value="senior">{fr ? 'Senior' : 'Senior'}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={style} onValueChange={(v) => setStyle(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="behavioral">{fr ? 'Comportemental' : 'Behavioral'}</SelectItem>
                      <SelectItem value="technical">{fr ? 'Technique' : 'Technical'}</SelectItem>
                      <SelectItem value="mixed">{fr ? 'Mixte' : 'Mixed'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => { resetInterview(); sendInterviewTurn(true); }} disabled={chatLoading || !position.trim()}>
                    {chatLoading && chat.length === 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : (fr ? 'Démarrer' : 'Start')}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { resetInterview(); setVideoCallOpen(true); }} disabled={!position.trim()}>
                    <Video className="h-4 w-4 mr-1" />{fr ? 'Appel vidéo' : 'Video call'}
                  </Button>
                  {chat.length > 0 && (
                    <Button size="sm" variant="outline" onClick={resetInterview}><RotateCcw className="h-4 w-4" /></Button>
                  )}
                </div>

                <ScrollArea className="h-72 rounded-md border p-3">
                  {chat.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-12">
                      {fr ? 'Choisis un poste et clique sur Démarrer.' : 'Pick a role and click Start.'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {chat.map((m, i) => (
                        <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`p-1.5 rounded-full shrink-0 ${m.role === 'user' ? 'bg-primary/10' : 'bg-muted'}`}>
                            {m.role === 'user' ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                          </div>
                          <div className={`text-sm rounded-lg px-3 py-2 max-w-[80%] whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {m.content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && <div className="flex gap-2"><div className="p-1.5 rounded-full bg-muted"><Bot className="h-4 w-4" /></div><Loader2 className="h-4 w-4 animate-spin self-center" /></div>}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    placeholder={fr ? 'Ta réponse...' : 'Your answer...'}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendInterviewTurn(); } }}
                    disabled={chatLoading || chat.length === 0}
                  />
                  <Button size="icon" onClick={() => sendInterviewTurn()} disabled={chatLoading || chat.length === 0 || !chatInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {chat.length >= 2 && (
                  <Button variant="secondary" className="w-full" onClick={requestFeedback} disabled={feedbackLoading}>
                    {feedbackLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Award className="h-4 w-4 mr-2" />}
                    {fr ? 'Évaluer ma performance' : 'Score my performance'}
                  </Button>
                )}

                {feedback && !feedback.error && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border bg-gradient-to-br from-primary/5 to-transparent p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold flex items-center gap-2"><Award className="h-4 w-4 text-primary" />{fr ? 'Évaluation' : 'Evaluation'}</h4>
                      <div className="text-2xl font-bold text-primary">{feedback.overallScore}/100</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { k: 'communication', l: fr ? 'Communication' : 'Communication' },
                        { k: 'technical', l: fr ? 'Technique' : 'Technical' },
                        { k: 'structure', l: fr ? 'Structure' : 'Structure' },
                        { k: 'confidence', l: fr ? 'Confiance' : 'Confidence' },
                      ].map((m) => (
                        <div key={m.k}>
                          <div className="flex justify-between mb-0.5"><span>{m.l}</span><span className="font-medium">{feedback[m.k] ?? '–'}/10</span></div>
                          <Progress value={(feedback[m.k] ?? 0) * 10} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                    {feedback.verdict && <p className="text-sm italic text-muted-foreground">"{feedback.verdict}"</p>}
                    {feedback.strengths?.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-emerald-600 mb-1">✓ {fr ? 'Points forts' : 'Strengths'}</div>
                        <ul className="text-xs space-y-0.5 pl-4 list-disc text-muted-foreground">
                          {feedback.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {feedback.improvements?.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-amber-600 mb-1">⚡ {fr ? 'À améliorer' : 'To improve'}</div>
                        <ul className="text-xs space-y-0.5 pl-4 list-disc text-muted-foreground">
                          {feedback.improvements.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {feedback.suggestedAnswer && (
                      <div className="rounded-md bg-muted/50 p-2 text-xs">
                        <div className="font-semibold mb-1">{fr ? 'Exemple de réponse modèle' : 'Model answer'}</div>
                        <p className="text-muted-foreground whitespace-pre-wrap">{feedback.suggestedAnswer}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* CV BUILDER */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />{fr ? 'Constructeur de CV' : 'CV builder'}</CardTitle>
                <CardDescription>{fr ? 'CV optimisé ATS, téléchargeable en PDF.' : 'ATS-optimized CV, downloadable as PDF.'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder={fr ? 'Poste ciblé (optionnel)' : 'Target role (optional)'} value={cvTarget} onChange={(e) => setCvTarget(e.target.value)} />
                  <Button onClick={generateCv} disabled={cvLoading}>
                    {cvLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span className="ml-2">{fr ? 'Générer' : 'Generate'}</span>
                  </Button>
                </div>

                {!cvResult && !cvTarget && (
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] uppercase text-muted-foreground self-center mr-1">{fr ? 'Suggestions' : 'Try'}:</span>
                    {['Data Analyst', 'Software Engineer', 'Marketing Intern', 'Product Manager'].map((s) => (
                      <button key={s} onClick={() => setCvTarget(s)} className="text-xs px-2 py-1 rounded-full border hover:bg-muted">{s}</button>
                    ))}
                  </div>
                )}

                {cvResult && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" className="flex-1" onClick={downloadCvPdf}>
                      <Download className="h-4 w-4 mr-1.5" />{fr ? 'Télécharger PDF' : 'Download PDF'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={copyCvJson}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <ScrollArea className="h-80 rounded-md border p-3">
                  {!cvResult ? (
                    <p className="text-sm text-muted-foreground text-center py-12">{fr ? 'Le CV apparaîtra ici.' : 'Your CV will appear here.'}</p>
                  ) : (
                    <div className="space-y-3 text-sm">
                      {cvResult.summary && <section><h4 className="font-semibold mb-1">{fr ? 'Résumé' : 'Summary'}</h4><p className="text-muted-foreground">{cvResult.summary}</p></section>}
                      {cvResult.highlights?.length > 0 && <section><h4 className="font-semibold mb-1">{fr ? 'Points forts' : 'Highlights'}</h4><ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">{cvResult.highlights.map((h: string, i: number) => <li key={i}>{h}</li>)}</ul></section>}
                      {cvResult.experiences?.length > 0 && <section><h4 className="font-semibold mb-1">{fr ? 'Expériences' : 'Experience'}</h4>{cvResult.experiences.map((e: any, i: number) => (<div key={i} className="mb-2"><div className="font-medium">{e.title} {e.company && <span className="text-muted-foreground">— {e.company}</span>}</div>{e.period && <div className="text-xs text-muted-foreground">{e.period}</div>}{e.bullets && <ul className="list-disc pl-5 text-muted-foreground">{e.bullets.map((b: string, j: number) => <li key={j}>{b}</li>)}</ul>}</div>))}</section>}
                      {cvResult.skills?.length > 0 && <section><h4 className="font-semibold mb-1">{fr ? 'Compétences' : 'Skills'}</h4><div className="flex flex-wrap gap-1">{cvResult.skills.map((s: string, i: number) => <Badge key={i} variant="secondary">{s}</Badge>)}</div></section>}
                      {cvResult.atsKeywords?.length > 0 && (
                        <section className="rounded-md bg-blue-500/5 border border-blue-500/20 p-2">
                          <h4 className="font-semibold mb-1 text-xs text-blue-700 dark:text-blue-400">🎯 {fr ? 'Mots-clés ATS' : 'ATS keywords'}</h4>
                          <div className="flex flex-wrap gap-1">{cvResult.atsKeywords.map((k: string, i: number) => <Badge key={i} variant="outline" className="text-[10px]">{k}</Badge>)}</div>
                        </section>
                      )}
                      {cvResult.improvements?.length > 0 && <section className="border-t pt-3 mt-3"><h4 className="font-semibold mb-1 text-amber-600">💡 {fr ? 'Conseils' : 'Tips to improve'}</h4><ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">{cvResult.improvements.map((h: string, i: number) => <li key={i}>{h}</li>)}</ul></section>}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <InterviewVideoCall
        open={videoCallOpen}
        onClose={() => setVideoCallOpen(false)}
        chat={chat}
        chatLoading={chatLoading}
        language={fr ? 'fr' : 'en'}
        position={position}
        onStart={() => sendInterviewTurn(true)}
        onUserAnswer={(text) => sendInterviewAnswer(text)}
      />
    </div>
  );
};

/* ----------------------- helpers ----------------------- */
function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ChipList({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');
  const add = () => { const v = input.trim(); if (v && !values.includes(v)) { onChange([...values, v]); setInput(''); } };
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 mb-2">
        <Input placeholder={placeholder} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <Button size="icon" variant="outline" onClick={add} type="button"><Plus className="h-4 w-4" /></Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {values.map((v) => (
          <Badge key={v} variant="secondary" className="gap-1">
            {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default StudentHub;
