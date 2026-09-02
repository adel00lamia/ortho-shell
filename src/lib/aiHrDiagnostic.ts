import { supabase } from '@/integrations/supabase/client';
import { MODULES, USE_CASES, type Question } from '@/config/diagnosticEngine';
import { getQuestions, type AnswerMap, type DiagnosticResult } from '@/lib/diagnosticScoring';

/** Turns raw answers into readable question/answer pairs for the model. */
export function humanizeAnswers(questions: Question[], answers: AnswerMap) {
  const pairs: { question: string; answer: string }[] = [];
  for (const q of questions) {
    const raw = answers[q.id];
    if (raw === undefined || raw === null || raw === '') continue;
    let answer: string;
    if (q.type === 'scale') {
      answer = `${raw}/5`;
    } else {
      const values = Array.isArray(raw) ? raw.map(String) : [String(raw)];
      answer = values
        .map((v) => q.options?.find((o) => o.value === v)?.label ?? v)
        .join(' ; ');
    }
    if (answer.trim()) pairs.push({ question: q.label, answer: answer.slice(0, 2000) });
  }
  return pairs;
}

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(Number.isFinite(n) ? n : min)));

/**
 * Calls the Gemini-powered diagnostic engine and merges its output onto the
 * deterministic baseline. Returns null when the AI engine is unavailable so the
 * caller can keep showing the baseline result.
 */
export async function generateAiDiagnostic(opts: {
  roleKey: string;
  answers: AnswerMap;
  baseline: DiagnosticResult;
  profile: Record<string, unknown>;
  locale?: string;
}): Promise<{ result: DiagnosticResult } | { error: string }> {
  const { roleKey, answers, baseline, profile, locale = 'fr' } = opts;
  const questions = getQuestions('hr', roleKey, answers);

  const { data, error } = await supabase.functions.invoke('ai-hr-diagnostic', {
    body: {
      locale,
      profile: {
        first_name: profile.first_name,
        company: profile.company,
        sector: profile.sector,
        company_size: profile.company_size,
        job_title: profile.job_title,
        hr_function: roleKey,
        seniority: profile.seniority,
        team_size: profile.team_size,
      },
      answers: humanizeAnswers(questions, answers),
      baseline: {
        dimensions: baseline.dimensions,
        opportunityScore: baseline.opportunityScore,
        profileLabel: baseline.profileLabel,
        profileLevel: baseline.profileLevel,
      },
      catalog: {
        useCases: USE_CASES.filter((u) => u.roles.includes(roleKey) || u.roles.includes('*')).map((u) => ({
          id: u.id, title: u.title, description: u.description, humanControl: !!u.humanControl,
        })),
        modules: MODULES.map((m) => ({ id: m.id, title: m.title, summary: m.summary })),
      },
    },
  });

  if (error) return { error: error.message || 'AI engine unavailable' };
  if (data?.error) return { error: String(data.error) };
  const ai = data?.result;
  if (!ai) return { error: 'Empty AI response' };

  const merged: DiagnosticResult = {
    ...baseline,
    dimensions: {
      time: clamp(ai.dimensions?.time ?? baseline.dimensions.time, 0, 100),
      data: clamp(ai.dimensions?.data ?? baseline.dimensions.data, 0, 100),
      automation: clamp(ai.dimensions?.automation ?? baseline.dimensions.automation, 0, 100),
      ai: clamp(ai.dimensions?.ai ?? baseline.dimensions.ai, 0, 100),
      governance: clamp(ai.dimensions?.governance ?? baseline.dimensions.governance, 0, 100),
    },
    opportunityScore: clamp(ai.opportunityScore ?? baseline.opportunityScore, 0, 100),
    profileLabel: ai.profileLabel || baseline.profileLabel,
    profileLevel: ai.profileLevel || baseline.profileLevel,
    profileBlurb: ai.profileBlurb || baseline.profileBlurb,
    frictions: Array.isArray(ai.frictions) && ai.frictions.length
      ? ai.frictions.slice(0, 3).map((f: any) => ({
          label: String(f.label ?? '').slice(0, 200),
          count: 1,
          tags: f.why ? [String(f.why).slice(0, 300)] : [],
        }))
      : baseline.frictions,
    useCases: Array.isArray(ai.useCases) && ai.useCases.length
      ? ai.useCases.slice(0, 5).map((u: any, i: number) => ({
          id: String(u.id || `ai_uc_${i}`),
          title: String(u.title ?? ''),
          description: String(u.description ?? ''),
          impact: clamp(u.impact, 1, 5),
          ease: clamp(u.ease, 1, 5),
          priority: 5 - i,
          humanControl: !!u.humanControl,
        }))
      : baseline.useCases,
    timeSaving: ai.timeSaving && Number.isFinite(ai.timeSaving.low) && Number.isFinite(ai.timeSaving.high)
      ? {
          low: Math.max(0, Math.round(Number(ai.timeSaving.low) * 10) / 10),
          high: Math.max(0, Math.round(Number(ai.timeSaving.high) * 10) / 10),
        }
      : baseline.timeSaving,
    quickWins: Array.isArray(ai.quickWins) && ai.quickWins.length
      ? ai.quickWins.slice(0, 3).map(String)
      : baseline.quickWins,
    governance: Array.isArray(ai.governance) && ai.governance.length
      ? ai.governance.slice(0, 5).map(String)
      : baseline.governance,
    modules: Array.isArray(ai.modules) && ai.modules.length
      ? ai.modules.slice(0, 5).map((m: any, i: number) => ({
          id: String(m.id || `ai_mod_${i}`),
          title: String(m.title ?? ''),
          summary: String(m.summary ?? ''),
          level: String(m.level || baseline.profileLevel),
          reason: String(m.reason ?? ''),
        }))
      : baseline.modules,
  };

  return { result: merged };
}
