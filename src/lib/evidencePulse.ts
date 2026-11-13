/** Evidence Pulse: a very short, anonymous field check tied to one diagnostic. */

export interface PulseQuestion {
  id: string;
  text: string;
  /** 'agreement' = fixed 5-option scale (default), 'text' = short written answer. */
  type?: 'agreement' | 'text';
}

export const PULSE_ANSWER_OPTIONS = [
  { value: 'yes', score: 100, fr: 'Oui', en: 'Yes' },
  { value: 'rather_yes', score: 75, fr: 'Plutôt oui', en: 'Rather yes' },
  { value: 'rather_no', score: 25, fr: 'Plutôt non', en: 'Rather no' },
  { value: 'no', score: 0, fr: 'Non', en: 'No' },
  { value: 'unknown', score: null, fr: 'Je ne sais pas', en: "I don't know" },
] as const;

export type PulseAnswerValue = typeof PULSE_ANSWER_OPTIONS[number]['value'];

const SCORES: Record<string, number | null> = Object.fromEntries(
  PULSE_ANSWER_OPTIONS.map((o) => [o.value, o.score])
);

export interface PulseResponseRow {
  answers: Record<string, string>;
  free_text?: string | null;
}

export interface PulseQuestionAggregate {
  id: string;
  question: string;
  /** 'agreement' or 'text'. */
  type?: 'agreement' | 'text';
  /** Anonymous written answers, only for 'text' questions. */
  texts?: string[];
  /** Mean agreement 0-100, or null when nobody gave a scorable answer. */
  agreement: number | null;
  answers: number;
  unknown: number;
}

export interface PulseSummary {
  responses: number;
  questions: PulseQuestionAggregate[];
  comments: string[];
}

/** Averages answers per question; "I don't know" is counted but never scored. */
export function aggregatePulse(
  questions: PulseQuestion[],
  responses: PulseResponseRow[]
): PulseSummary {
  const list = Array.isArray(questions) ? questions : [];
  const rows = Array.isArray(responses) ? responses : [];

  const aggregates: PulseQuestionAggregate[] = list.map((q) => {
    let total = 0;
    let scored = 0;
    let unknown = 0;

    for (const r of rows) {
      const raw = r?.answers?.[q.id];
      if (raw === undefined || raw === null || raw === '') continue;
      const score = SCORES[String(raw)];
      if (score === null || score === undefined) {
        unknown += 1;
        continue;
      }
      total += score;
      scored += 1;
    }

    return {
      id: q.id,
      question: q.text,
      type: q.type ?? 'agreement',
      texts: [],
      agreement: scored > 0 ? Math.round(total / scored) : null,
      answers: scored + unknown,
      unknown,
    };
  });

  const comments = rows
    .map((r) => (r?.free_text ?? '').trim())
    .filter((t) => t.length > 0)
    .slice(0, 30);

  return { responses: rows.length, questions: aggregates, comments };
}

/** Short, human-readable, unambiguous code (no O/0/I/1). */
export function makePulseCode(length = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i += 1) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

/** Turns a missing-evidence line into a question a field respondent can answer. */
export function toPulseQuestion(text: string, index: number): PulseQuestion {
  return { id: `q${index + 1}`, text: String(text ?? '').trim().slice(0, 300), type: 'agreement' };
}

/**
 * Practical, job-realistic scenarios used to check whether the gap is really
 * a capability gap. Short written answers, no scoring, no scientific claim.
 */
export function buildCapabilityScenarios(
  ctx: { problem: string; population?: string | null; department?: string | null },
  fr: boolean
): PulseQuestion[] {
  const who = ctx.population || ctx.department || (fr ? 'votre poste' : 'your role');
  const problem = (ctx.problem ?? '').trim().slice(0, 180) || (fr ? 'la situation décrite' : 'the described situation');

  const fields = fr
    ? [
        `Décrivez, étape par étape, comment vous traitez aujourd'hui une situation liée à : ${problem}`,
        `Un cas difficile arrive dans ${who} : que faites-vous en premier, et pourquoi ?`,
        `Qu'est-ce qui vous empêche de bien faire cette tâche : le savoir-faire, l'outil, le temps, ou les consignes ?`,
        'Donnez un exemple récent où le résultat n’a pas été celui attendu. Qu’auriez-vous besoin pour réussir ?',
      ]
    : [
        `Describe, step by step, how you handle a situation related to: ${problem}`,
        `A difficult case arrives in ${who}: what do you do first, and why?`,
        'What stops you doing this task well: know-how, tools, time, or unclear instructions?',
        'Give a recent example where the outcome was not the expected one. What would you need to succeed?',
      ];

  return fields.map((text, i) => ({ id: `s${i + 1}`, text, type: 'text' as const }));
}
