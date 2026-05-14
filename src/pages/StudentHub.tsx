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
import { toast } from 'sonner';
import {
  GraduationCap, Briefcase, Sparkles, FileText, Send, Loader2, ExternalLink, Plus, X, Bot, User as UserIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';

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
};

type ChatMsg = { role: 'user' | 'assistant'; content: string };

const SOFT_SKILL_TRACKS = (fr: boolean) => [
  { key: 'communication', icon: '💬', title: fr ? 'Communication efficace' : 'Effective communication', desc: fr ? 'Écoute active, prise de parole, pitch' : 'Active listening, public speaking, pitching' },
  { key: 'teamwork', icon: '🤝', title: fr ? 'Travail en équipe' : 'Teamwork', desc: fr ? 'Collaboration, résolution de conflits' : 'Collaboration, conflict resolution' },
  { key: 'leadership', icon: '🚀', title: fr ? 'Leadership' : 'Leadership', desc: fr ? 'Influence, prise de décision, vision' : 'Influence, decision-making, vision' },
  { key: 'time', icon: '⏱️', title: fr ? 'Gestion du temps' : 'Time management', desc: fr ? 'Priorisation, deep work, anti-procrastination' : 'Prioritization, deep work, anti-procrastination' },
  { key: 'critical', icon: '🧠', title: fr ? 'Esprit critique' : 'Critical thinking', desc: fr ? 'Analyse, biais cognitifs, problem-solving' : 'Analysis, cognitive biases, problem-solving' },
  { key: 'emotional', icon: '❤️', title: fr ? 'Intelligence émotionnelle' : 'Emotional intelligence', desc: fr ? 'Empathie, gestion du stress, conscience de soi' : 'Empathy, stress management, self-awareness' },
];

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
  useEffect(() => {
    if (profile) setDraft(profile);
  }, [profile]);

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

  /* ------------------------- Interview ------------------------ */
  const [position, setPosition] = useState('');
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

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
        body: { mode: 'interview', position, studentProfile: profile ?? draft, history: newHistory, language: fr ? 'fr' : 'en' },
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
              {profileLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
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
              <CardTitle>{fr ? 'Catalogue soft skills' : 'Soft skills catalog'}</CardTitle>
              <CardDescription>{fr ? 'Parcours courts pour développer tes compétences comportementales.' : 'Short tracks to develop your behavioural skills.'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SOFT_SKILL_TRACKS(fr).map((t) => (
                  <Card key={t.key} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="text-3xl mb-2">{t.icon}</div>
                      <h3 className="font-semibold">{t.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                      <Button size="sm" variant="ghost" className="mt-3 px-0">
                        {fr ? 'Commencer →' : 'Start →'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CV & INTERVIEW */}
        <TabsContent value="cv" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* INTERVIEW SIM */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />{fr ? 'Simulateur d\'entretien' : 'Interview simulator'}</CardTitle>
                <CardDescription>{fr ? 'Pratique en conditions réelles avec un recruteur IA.' : 'Practice with an AI recruiter in real conditions.'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder={fr ? 'Poste ciblé (ex: Data Analyst)' : 'Target role (e.g. Data Analyst)'} value={position} onChange={(e) => setPosition(e.target.value)} />
                  <Button size="sm" onClick={() => { setChat([]); sendInterviewTurn(true); }} disabled={chatLoading || !position.trim()}>
                    {chatLoading && chat.length === 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : (fr ? 'Démarrer' : 'Start')}
                  </Button>
                </div>
                <ScrollArea className="h-80 rounded-md border p-3">
                  {chat.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-12">
                      {fr ? 'Choisis un poste et clique sur Démarrer.' : 'Pick a role and click Start.'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {chat.map((m, i) => (
                        <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`p-1.5 rounded-full ${m.role === 'user' ? 'bg-primary/10' : 'bg-muted'}`}>
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
              </CardContent>
            </Card>

            {/* CV BUILDER */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />{fr ? 'Constructeur de CV' : 'CV builder'}</CardTitle>
                <CardDescription>{fr ? 'Génère un CV structuré à partir de ton profil.' : 'Generate a structured CV from your profile.'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder={fr ? 'Poste ciblé (optionnel)' : 'Target role (optional)'} value={cvTarget} onChange={(e) => setCvTarget(e.target.value)} />
                  <Button onClick={generateCv} disabled={cvLoading}>
                    {cvLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span className="ml-2">{fr ? 'Générer' : 'Generate'}</span>
                  </Button>
                </div>
                <ScrollArea className="h-80 rounded-md border p-3">
                  {!cvResult ? (
                    <p className="text-sm text-muted-foreground text-center py-12">{fr ? 'Le CV apparaîtra ici.' : 'Your CV will appear here.'}</p>
                  ) : (
                    <div className="space-y-3 text-sm">
                      {cvResult.summary && <section><h4 className="font-semibold mb-1">{fr ? 'Résumé' : 'Summary'}</h4><p className="text-muted-foreground">{cvResult.summary}</p></section>}
                      {cvResult.highlights?.length > 0 && <section><h4 className="font-semibold mb-1">{fr ? 'Points forts' : 'Highlights'}</h4><ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">{cvResult.highlights.map((h: string, i: number) => <li key={i}>{h}</li>)}</ul></section>}
                      {cvResult.experiences?.length > 0 && <section><h4 className="font-semibold mb-1">{fr ? 'Expériences' : 'Experience'}</h4>{cvResult.experiences.map((e: any, i: number) => (<div key={i} className="mb-2"><div className="font-medium">{e.title} {e.company && <span className="text-muted-foreground">— {e.company}</span>}</div>{e.period && <div className="text-xs text-muted-foreground">{e.period}</div>}{e.bullets && <ul className="list-disc pl-5 text-muted-foreground">{e.bullets.map((b: string, j: number) => <li key={j}>{b}</li>)}</ul>}</div>))}</section>}
                      {cvResult.skills?.length > 0 && <section><h4 className="font-semibold mb-1">{fr ? 'Compétences' : 'Skills'}</h4><div className="flex flex-wrap gap-1">{cvResult.skills.map((s: string, i: number) => <Badge key={i} variant="secondary">{s}</Badge>)}</div></section>}
                      {cvResult.improvements?.length > 0 && <section className="border-t pt-3 mt-3"><h4 className="font-semibold mb-1 text-amber-600">{fr ? '💡 Conseils' : '💡 Tips to improve'}</h4><ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">{cvResult.improvements.map((h: string, i: number) => <li key={i}>{h}</li>)}</ul></section>}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
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
