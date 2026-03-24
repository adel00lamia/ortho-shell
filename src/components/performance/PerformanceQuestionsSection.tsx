import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Target, Brain, MessageSquare, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface PerformanceQuestion {
  id: string;
  type: 'kpi' | 'competency' | 'behavioral' | 'goal';
  question: string;
  answer: string;
  rating?: number;
}

interface PerformanceQuestionsSectionProps {
  questions: PerformanceQuestion[];
  onQuestionsChange: (questions: PerformanceQuestion[]) => void;
  jobTitle: string;
  responsibilities: string[];
  competencies: { name: string; category?: string }[];
}

const TYPE_CONFIG = {
  kpi: { icon: Target, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
  competency: { icon: Brain, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  behavioral: { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800' },
  goal: { icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
};

const KPI_TEMPLATES_EN = [
  (resp: string) => `What specific metrics or KPIs did you use to measure your success in "${resp}"? Share the numbers.`,
  (resp: string) => `Describe the gap between your target and actual performance for "${resp}". What drove the variance?`,
  (resp: string) => `How did your work on "${resp}" directly impact revenue, cost savings, or operational efficiency? Quantify.`,
  (resp: string) => `What was the most significant bottleneck you encountered while delivering on "${resp}", and how did you overcome it?`,
  (resp: string) => `If you had to re-prioritize "${resp}" against competing deadlines, how did you decide what to defer?`,
];
const KPI_TEMPLATES_FR = [
  (resp: string) => `Quels indicateurs précis avez-vous utilisés pour mesurer votre réussite sur "${resp}" ? Chiffrez.`,
  (resp: string) => `Décrivez l'écart entre votre objectif et votre résultat réel pour "${resp}". Qu'est-ce qui explique cet écart ?`,
  (resp: string) => `Comment votre travail sur "${resp}" a-t-il impacté le chiffre d'affaires, les coûts ou l'efficacité opérationnelle ? Quantifiez.`,
  (resp: string) => `Quel a été le plus gros frein rencontré dans la réalisation de "${resp}", et comment l'avez-vous surmonté ?`,
  (resp: string) => `Si vous avez dû arbitrer "${resp}" face à d'autres priorités, comment avez-vous décidé quoi reporter ?`,
];

const COMP_TEMPLATES_EN = [
  (comp: string) => `Describe a project where "${comp}" was the decisive factor between success and failure. What did you do differently?`,
  (comp: string) => `How have you pushed beyond your comfort zone to grow "${comp}" this period? Give a concrete before/after.`,
  (comp: string) => `When "${comp}" conflicted with a tight deadline, how did you balance quality and speed?`,
  (comp: string) => `Who did you mentor or coach on "${comp}"? What was the outcome for them?`,
  (comp: string) => `Rate your "${comp}" honestly — where are you still weak, and what's your plan to close that gap?`,
];
const COMP_TEMPLATES_FR = [
  (comp: string) => `Décrivez un projet où "${comp}" a été le facteur décisif entre succès et échec. Qu'avez-vous fait différemment ?`,
  (comp: string) => `Comment avez-vous repoussé vos limites pour progresser en "${comp}" cette période ? Donnez un avant/après concret.`,
  (comp: string) => `Quand "${comp}" entrait en conflit avec un délai serré, comment avez-vous arbitré entre qualité et rapidité ?`,
  (comp: string) => `Qui avez-vous accompagné ou coaché sur "${comp}" ? Quel a été le résultat pour cette personne ?`,
  (comp: string) => `Évaluez honnêtement votre "${comp}" — où êtes-vous encore faible, et quel est votre plan pour progresser ?`,
];

const BEHAVIORAL_TEMPLATES_EN = (jt: string) => [
  `Tell us about a time you failed in your role as ${jt}. What did you learn and what would you do differently?`,
  `Describe a decision you made as ${jt} that was unpopular but turned out to be right. How did you handle pushback?`,
  `Give an example where you had to influence stakeholders without formal authority in your ${jt} role.`,
  `When was the last time you changed your mind on an important work topic? What triggered the shift?`,
  `Describe a cross-functional conflict you navigated as ${jt}. What was the root cause and how did you resolve it?`,
];
const BEHAVIORAL_TEMPLATES_FR = (jt: string) => [
  `Racontez un échec dans votre rôle de ${jt}. Qu'avez-vous appris et que feriez-vous différemment ?`,
  `Décrivez une décision impopulaire que vous avez prise en tant que ${jt} mais qui s'est avérée juste. Comment avez-vous géré la résistance ?`,
  `Donnez un exemple où vous avez dû influencer des parties prenantes sans autorité hiérarchique dans votre rôle de ${jt}.`,
  `Quand avez-vous changé d'avis sur un sujet professionnel important pour la dernière fois ? Qu'est-ce qui a provoqué ce changement ?`,
  `Décrivez un conflit transversal que vous avez géré en tant que ${jt}. Quelle en était la cause et comment l'avez-vous résolu ?`,
];

const GOAL_TEMPLATES_EN = [
  `What is the single most ambitious goal you're setting for next period, and what makes it a stretch?`,
  `Which of last period's goals did you miss, and what systemic change will prevent that from recurring?`,
  `How do your personal development goals align with the team's strategic priorities for next quarter?`,
  `What skill or capability gap, if closed, would have the biggest impact on your performance next period?`,
];
const GOAL_TEMPLATES_FR = [
  `Quel est l'objectif le plus ambitieux que vous vous fixez pour la prochaine période, et pourquoi est-il un défi ?`,
  `Quels objectifs de la période passée n'avez-vous pas atteints, et quel changement systémique empêchera que cela se reproduise ?`,
  `Comment vos objectifs de développement personnel s'alignent-ils avec les priorités stratégiques de l'équipe ?`,
  `Quel écart de compétence, s'il était comblé, aurait le plus grand impact sur votre performance ?`,
];

function pickUnique<T>(arr: T[], count: number, seed: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  let s = seed;
  for (let i = 0; i < Math.min(count, copy.length); i++) {
    s = (s * 31 + 7) & 0x7fffffff;
    const idx = s % copy.length;
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function generateQuestions(
  jobTitle: string,
  responsibilities: string[],
  competencies: { name: string; category?: string }[],
  fr: boolean
): PerformanceQuestion[] {
  const questions: PerformanceQuestion[] = [];
  let idx = 0;
  const seed = jobTitle.length * 17 + responsibilities.length * 13 + competencies.length * 7;

  // KPI questions — pick varied templates per responsibility
  const kpiTemplates = fr ? KPI_TEMPLATES_FR : KPI_TEMPLATES_EN;
  const kpiResps = responsibilities.slice(0, 3);
  if (kpiResps.length > 0) {
    const picked = pickUnique(kpiTemplates, kpiResps.length, seed);
    kpiResps.forEach((resp, i) => {
      questions.push({ id: `kpi-${idx++}`, type: 'kpi', question: picked[i % picked.length](resp), answer: '' });
    });
  } else {
    questions.push({
      id: `kpi-${idx++}`, type: 'kpi',
      question: fr
        ? `Quels résultats quantifiables avez-vous produits dans votre rôle de ${jobTitle} cette période ? Détaillez les chiffres.`
        : `What quantifiable results did you produce as ${jobTitle} this period? Detail the numbers.`,
      answer: '',
    });
  }

  // Competency questions — varied per competency
  const compTemplates = fr ? COMP_TEMPLATES_FR : COMP_TEMPLATES_EN;
  const compSlice = competencies.slice(0, 3);
  if (compSlice.length > 0) {
    const picked = pickUnique(compTemplates, compSlice.length, seed + 3);
    compSlice.forEach((comp, i) => {
      questions.push({
        id: `comp-${idx++}`, type: 'competency',
        question: picked[i % picked.length](comp.name),
        answer: '', rating: undefined,
      });
    });
  } else {
    questions.push({
      id: `comp-${idx++}`, type: 'competency',
      question: fr
        ? `Quelle compétence technique avez-vous le plus progressé cette période, et comment le prouvez-vous ?`
        : `Which technical skill did you grow the most this period, and how can you prove it?`,
      answer: '',
    });
  }

  // Behavioral — pick 2 unique from pool
  const behPool = fr ? BEHAVIORAL_TEMPLATES_FR(jobTitle) : BEHAVIORAL_TEMPLATES_EN(jobTitle);
  const behPicked = pickUnique(behPool, 2, seed + 5);
  for (const q of behPicked) {
    questions.push({ id: `beh-${idx++}`, type: 'behavioral', question: q, answer: '' });
  }

  // Goals — pick 2 unique
  const goalPool = fr ? GOAL_TEMPLATES_FR : GOAL_TEMPLATES_EN;
  const goalPicked = pickUnique(goalPool, 2, seed + 9);
  for (const q of goalPicked) {
    questions.push({ id: `goal-${idx++}`, type: 'goal', question: q, answer: '' });
  }

  return questions;
}

export default function PerformanceQuestionsSection({
  questions,
  onQuestionsChange,
  jobTitle,
  responsibilities,
  competencies,
}: PerformanceQuestionsSectionProps) {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const [generated, setGenerated] = useState(false);

  // Auto-generate questions when job info changes and no existing answers
  useEffect(() => {
    if (!jobTitle || generated) return;
    const hasAnswers = questions.some(q => q.answer.trim().length > 0);
    if (hasAnswers) return;

    const newQuestions = generateQuestions(jobTitle, responsibilities, competencies, fr);
    onQuestionsChange(newQuestions);
    setGenerated(true);
  }, [jobTitle, responsibilities.length, competencies.length]);

  const updateAnswer = (id: string, answer: string) => {
    onQuestionsChange(questions.map(q => q.id === id ? { ...q, answer } : q));
  };

  const updateRating = (id: string, rating: number) => {
    onQuestionsChange(questions.map(q => q.id === id ? { ...q, rating } : q));
  };

  const typeLabels = {
    kpi: fr ? 'Objectifs & KPIs' : 'Objectives & KPIs',
    competency: fr ? 'Compétences' : 'Competencies',
    behavioral: fr ? 'Comportemental' : 'Behavioral',
    goal: fr ? 'Objectifs futurs' : 'Goal Setting',
  };

  const grouped = questions.reduce((acc, q) => {
    if (!acc[q.type]) acc[q.type] = [];
    acc[q.type].push(q);
    return acc;
  }, {} as Record<string, PerformanceQuestion[]>);

  if (questions.length === 0 && !jobTitle) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          {fr
            ? 'Sélectionnez un employé et une fiche de poste pour générer les questions d\'évaluation.'
            : 'Select an employee and job description to generate evaluation questions.'}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold block">
        {fr ? 'Questions d\'évaluation liées au poste' : 'Position-Specific Evaluation Questions'}
      </Label>

      {(['kpi', 'competency', 'behavioral', 'goal'] as const).map(type => {
        const items = grouped[type];
        if (!items?.length) return null;
        const config = TYPE_CONFIG[type];
        const Icon = config.icon;

        return (
          <Card key={type} className={`${config.border} border`}>
            <CardHeader className={`${config.bg} rounded-t-lg py-3 px-4`}>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Icon className={`w-4 h-4 ${config.color}`} />
                <span>{typeLabels[type]}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {items.length} {fr ? 'question(s)' : 'question(s)'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {items.map((q, i) => (
                <div key={q.id} className="space-y-2">
                  <Label className="text-sm font-medium leading-snug">
                    {i + 1}. {q.question}
                  </Label>
                  {q.type === 'competency' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {fr ? 'Auto-évaluation :' : 'Self-rating:'}
                      </span>
                      <Select
                        value={q.rating?.toString() || ""}
                        onValueChange={(v) => updateRating(q.id, parseInt(v))}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue placeholder={fr ? 'Niveau' : 'Level'} />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map(r => (
                            <SelectItem key={r} value={r.toString()}>{r}/5</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Textarea
                    value={q.answer}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                    placeholder={fr ? 'Votre réponse...' : 'Your answer...'}
                    rows={3}
                    className="text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
