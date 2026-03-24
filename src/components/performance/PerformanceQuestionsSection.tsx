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

function generateQuestions(
  jobTitle: string,
  responsibilities: string[],
  competencies: { name: string; category?: string }[],
  fr: boolean
): PerformanceQuestion[] {
  const questions: PerformanceQuestion[] = [];
  let idx = 0;

  // KPI-based from responsibilities
  const kpiResps = responsibilities.slice(0, 3);
  if (kpiResps.length > 0) {
    for (const resp of kpiResps) {
      questions.push({
        id: `kpi-${idx++}`,
        type: 'kpi',
        question: fr
          ? `Quels résultats mesurables avez-vous atteints concernant : "${resp}" ?`
          : `What measurable results did you achieve regarding: "${resp}"?`,
        answer: '',
      });
    }
  } else {
    questions.push({
      id: `kpi-${idx++}`,
      type: 'kpi',
      question: fr
        ? `Quels sont les principaux objectifs quantifiables atteints dans votre rôle de ${jobTitle} ?`
        : `What are the key quantifiable objectives achieved in your role as ${jobTitle}?`,
      answer: '',
    });
  }

  // Competency-based from job competencies
  const compSlice = competencies.slice(0, 3);
  if (compSlice.length > 0) {
    for (const comp of compSlice) {
      questions.push({
        id: `comp-${idx++}`,
        type: 'competency',
        question: fr
          ? `Comment évaluez-vous votre maîtrise de "${comp.name}" ? Donnez un exemple concret.`
          : `How do you assess your proficiency in "${comp.name}"? Give a concrete example.`,
        answer: '',
        rating: undefined,
      });
    }
  } else {
    questions.push({
      id: `comp-${idx++}`,
      type: 'competency',
      question: fr
        ? `Quelles compétences techniques avez-vous le plus développées cette année ?`
        : `Which technical skills did you develop the most this year?`,
      answer: '',
    });
  }

  // Behavioral / situational
  const behavioralTemplates = fr
    ? [
        `Décrivez une situation difficile que vous avez gérée dans votre rôle de ${jobTitle}. Comment l'avez-vous résolue ?`,
        `Donnez un exemple où vous avez fait preuve de leadership ou d'initiative au-delà de vos responsabilités.`,
      ]
    : [
        `Describe a challenging situation you handled in your role as ${jobTitle}. How did you resolve it?`,
        `Give an example where you demonstrated leadership or initiative beyond your responsibilities.`,
      ];
  for (const q of behavioralTemplates) {
    questions.push({ id: `beh-${idx++}`, type: 'behavioral', question: q, answer: '' });
  }

  // Goal achievement
  const goalTemplates = fr
    ? [
        `Quels objectifs de la période précédente avez-vous atteints, partiellement atteints ou non atteints ?`,
        `Quels objectifs vous fixez-vous pour la prochaine période d'évaluation ?`,
      ]
    : [
        `Which goals from the previous period did you fully achieve, partially achieve, or miss?`,
        `What goals are you setting for the next evaluation period?`,
      ];
  for (const q of goalTemplates) {
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
