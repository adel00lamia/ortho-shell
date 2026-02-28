import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ModuleProgress {
  id?: string;
  completedSlides: number[];
  quizAnswers: Record<string, number>;
  quizScore: number | null;
  startedAt: string;
  lastActivityAt: string;
  completedAt: string | null;
}

export function useModuleProgress(moduleId: string | undefined, totalSlides: number, totalQuestions: number) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ModuleProgress>({
    completedSlides: [],
    quizAnswers: {},
    quizScore: null,
    startedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    completedAt: null,
  });
  const [loading, setLoading] = useState(true);

  // Fetch existing progress
  useEffect(() => {
    if (!moduleId || !user) { setLoading(false); return; }

    const fetch = async () => {
      const { data, error } = await supabase
        .from("learner_module_progress")
        .select("*")
        .eq("module_id", moduleId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (data && !error) {
        setProgress({
          id: data.id,
          completedSlides: data.completed_slides || [],
          quizAnswers: (data.quiz_answers as Record<string, number>) || {},
          quizScore: data.quiz_score,
          startedAt: data.started_at,
          lastActivityAt: data.last_activity_at,
          completedAt: data.completed_at,
        });
      }
      setLoading(false);
    };
    fetch();
  }, [moduleId, user]);

  // Save progress to DB (debounced via caller)
  const saveProgress = useCallback(async (updated: Partial<ModuleProgress>) => {
    if (!moduleId || !user) return;

    const merged = { ...progress, ...updated };
    setProgress(merged);

    const dbData = {
      user_id: user.id,
      module_id: moduleId,
      completed_slides: merged.completedSlides,
      quiz_answers: merged.quizAnswers,
      quiz_score: merged.quizScore,
      last_activity_at: new Date().toISOString(),
      completed_at: merged.completedAt,
    };

    if (progress.id) {
      await supabase.from("learner_module_progress").update(dbData).eq("id", progress.id);
    } else {
      const { data } = await supabase.from("learner_module_progress").insert([dbData]).select().single();
      if (data) setProgress(prev => ({ ...prev, id: data.id }));
    }
  }, [moduleId, user, progress]);

  const markSlideCompleted = useCallback((slideIndex: number) => {
    if (progress.completedSlides.includes(slideIndex)) return;
    const newSlides = [...progress.completedSlides, slideIndex];
    const isComplete = newSlides.length >= totalSlides && Object.keys(progress.quizAnswers).length >= totalQuestions;
    saveProgress({
      completedSlides: newSlides,
      completedAt: isComplete ? new Date().toISOString() : null,
    });
  }, [progress, totalSlides, totalQuestions, saveProgress]);

  const submitQuizAnswer = useCallback((questionIndex: number, answerIndex: number) => {
    const newAnswers = { ...progress.quizAnswers, [questionIndex.toString()]: answerIndex };
    const answeredAll = Object.keys(newAnswers).length >= totalQuestions;
    const isComplete = answeredAll && progress.completedSlides.length >= totalSlides;
    saveProgress({
      quizAnswers: newAnswers,
      completedAt: isComplete ? new Date().toISOString() : null,
    });
  }, [progress, totalSlides, totalQuestions, saveProgress]);

  const calculateQuizScore = useCallback((correctAnswers: number[]) => {
    let correct = 0;
    Object.entries(progress.quizAnswers).forEach(([qIdx, answer]) => {
      if (correctAnswers[parseInt(qIdx)] === answer) correct++;
    });
    const score = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;
    saveProgress({ quizScore: score });
    return score;
  }, [progress.quizAnswers, totalQuestions, saveProgress]);

  const slideCompletionPercent = totalSlides > 0
    ? Math.round((progress.completedSlides.length / totalSlides) * 100)
    : 0;

  const quizCompletionPercent = totalQuestions > 0
    ? Math.round((Object.keys(progress.quizAnswers).length / totalQuestions) * 100)
    : 0;

  return {
    progress,
    loading,
    markSlideCompleted,
    submitQuizAnswer,
    calculateQuizScore,
    slideCompletionPercent,
    quizCompletionPercent,
    isComplete: !!progress.completedAt,
  };
}
