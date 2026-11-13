import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Check, CheckCircle2, ChevronDown, ChevronRight, Lightbulb, Loader2,
  ShieldAlert, Sparkles, Target, Wand2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { getCopilotModule, type CopilotLesson } from '@/config/copilotModules';
import {
  useCopilotCoach, useSetLessonDone,
  type CopilotFeedback, type PortalParticipant,
} from '@/hooks/useParticipantPortal';

const VERDICT_STYLE: Record<string, string> = {
  solide: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  'à renforcer': 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  'à revoir': 'bg-rose-500/10 text-rose-600 border-rose-500/30',
};

interface Props {
  code: string;
  participant: PortalParticipant;
  moduleId: string;
  moduleTitle: string;
  completedLessons: string[];
}

export default function CopilotModuleRunner({
  code, participant, moduleId, moduleTitle, completedLessons,
}: Props) {
  const content = getCopilotModule(moduleId);
  const [openLesson, setOpenLesson] = useState<string | null>(null);

  const lessons = content?.lessons ?? [];
  const doneCount = lessons.filter((l) => completedLessons.includes(l.id)).length;

  if (!content) {
    return (
      <p className="text-sm text-muted-foreground">
        Le contenu détaillé de ce module sera publié prochainement. Vous pouvez déjà suivre son avancement ci-dessus.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Target className="h-3.5 w-3.5" /> Ce que vous saurez faire
        </p>
        <ul className="mt-2 space-y-1">
          {content.objectives.map((o) => (
            <li key={o} className="flex gap-2 text-sm">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-3">
        <Progress value={lessons.length ? (doneCount / lessons.length) * 100 : 0} className="h-1.5 flex-1" />
        <span className="text-xs font-medium text-muted-foreground">{doneCount}/{lessons.length} leçons</span>
      </div>

      <div className="space-y-2">
        {lessons.map((lesson, index) => (
          <LessonBlock
            key={lesson.id}
            index={index + 1}
            lesson={lesson}
            open={openLesson === lesson.id}
            onToggle={() => setOpenLesson(openLesson === lesson.id ? null : lesson.id)}
            done={completedLessons.includes(lesson.id)}
            code={code}
            participant={participant}
            moduleId={moduleId}
            moduleTitle={moduleTitle}
            totalLessons={lessons.length}
          />
        ))}
      </div>

      {content.humanControl?.length ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="flex items-center gap-2 text-xs font-medium text-amber-600">
            <ShieldAlert className="h-3.5 w-3.5" /> Contrôle humain
          </p>
          <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
            {content.humanControl.map((h) => <li key={h}>• {h}</li>)}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function LessonBlock({
  index, lesson, open, onToggle, done, code, participant, moduleId, moduleTitle, totalLessons,
}: {
  index: number;
  lesson: CopilotLesson;
  open: boolean;
  onToggle: () => void;
  done: boolean;
  code: string;
  participant: PortalParticipant;
  moduleId: string;
  moduleTitle: string;
  totalLessons: number;
}) {
  const [submission, setSubmission] = useState('');
  const [feedback, setFeedback] = useState<CopilotFeedback | null>(null);
  const coach = useCopilotCoach(code);
  const setLessonDone = useSetLessonDone(code);

  const context = useMemo(() => ({
    hr_function: participant.hr_function,
    job_title: participant.job_title,
    sector: participant.sector,
    company_size: participant.company_size,
    top_frictions: (participant.top_frictions ?? []).map((f) => f.label).filter(Boolean),
  }), [participant]);

  const runCoach = async () => {
    if (submission.trim().length < 15) {
      toast.error('Écrivez quelques phrases pour que le coach puisse vous aider.');
      return;
    }
    try {
      const result = await coach.mutateAsync({
        moduleId,
        moduleTitle,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        goal: lesson.practice.goal,
        keyIdea: lesson.keyIdea,
        points: lesson.points,
        submission: submission.trim(),
        context,
      });
      setFeedback(result);
      if (!done) {
        setLessonDone.mutate({ moduleId, lessonId: lesson.id, done: true, totalLessons });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Le coach IA est indisponible');
    }
  };

  const toggleDone = () => {
    setLessonDone.mutate(
      { moduleId, lessonId: lesson.id, done: !done, totalLessons },
      { onError: () => toast.error('Impossible d’enregistrer votre progression') },
    );
  };

  return (
    <div className={cn('rounded-lg border transition-colors', done ? 'border-primary/40 bg-primary/5' : 'border-border/60')}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-3 text-left"
        aria-expanded={open}
      >
        <span className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
        )}>
          {done ? <Check className="h-3.5 w-3.5" /> : index}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{lesson.title}</span>
          <span className="block text-xs text-muted-foreground">{lesson.minutes} min</span>
        </span>
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden border-t border-border/60"
        >
          <div className="space-y-4 p-3">
            <p className="flex gap-2 rounded-md bg-muted/40 p-2 text-sm">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="font-medium">{lesson.keyIdea}</span>
            </p>

            <ul className="space-y-1.5">
              {lesson.points.map((p) => (
                <li key={p} className="flex gap-2 text-sm text-muted-foreground">
                  <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                <Wand2 className="h-3.5 w-3.5" /> Exercice avec le coach IA
              </p>
              <p className="text-sm">{lesson.practice.brief}</p>
              <Textarea
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
                placeholder={lesson.practice.placeholder}
                rows={4}
                className="bg-background text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                N’indiquez aucune donnée nominative ni information sensible sur un collaborateur.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={runCoach} disabled={coach.isPending} className="gap-2">
                  {coach.isPending
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyse…</>
                    : <><Sparkles className="h-3.5 w-3.5" /> Obtenir un retour</>}
                </Button>
                <Button
                  size="sm"
                  variant={done ? 'secondary' : 'outline'}
                  onClick={toggleDone}
                  disabled={setLessonDone.isPending}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {done ? 'Leçon terminée' : 'Marquer comme terminée'}
                </Button>
              </div>
            </div>

            {feedback && (
              <div className="space-y-3 rounded-lg border border-border/60 p-3">
                <Badge variant="outline" className={cn('text-xs', VERDICT_STYLE[feedback.verdict])}>
                  {feedback.verdict}
                </Badge>

                {feedback.strengths?.length ? (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Ce qui fonctionne</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      {feedback.strengths.map((s) => <li key={s}>• {s}</li>)}
                    </ul>
                  </div>
                ) : null}

                {feedback.improvements?.length ? (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">À améliorer</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      {feedback.improvements.map((s) => <li key={s}>• {s}</li>)}
                    </ul>
                  </div>
                ) : null}

                {feedback.reworked && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Version retravaillée</p>
                    <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/40 p-2 text-sm">{feedback.reworked}</p>
                  </div>
                )}

                {feedback.nextStep && (
                  <p className="flex gap-2 text-sm">
                    <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span><span className="font-medium">Prochaine action : </span>{feedback.nextStep}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export { CopilotModuleRunner };

// Carte compacte réutilisable si besoin ailleurs.
export function CopilotModuleCard(props: Props & { summary?: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="space-y-3 pt-6">
        <p className="font-medium">{props.moduleTitle}</p>
        {props.summary && <p className="text-sm text-muted-foreground">{props.summary}</p>}
        <CopilotModuleRunner {...props} />
      </CardContent>
    </Card>
  );
}
