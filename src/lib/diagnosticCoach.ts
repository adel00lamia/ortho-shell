import type { Question } from '@/config/diagnosticEngine';
import type { AnswerMap, AnswerValue } from '@/lib/diagnosticScoring';

/** Petites réactions du coach, pour que le parcours ressemble à une conversation. */
const REACTIONS = [
  'Noté, c’est très parlant.',
  'D’accord, je vois le tableau.',
  'Merci, ça affine votre profil.',
  'Intéressant, je garde ça.',
  'Compris, on avance.',
];

export function coachReaction(index: number) {
  return REACTIONS[index % REACTIONS.length];
}

const labelsFor = (question: Question, answer: AnswerValue | undefined): string[] => {
  if (answer === undefined || answer === null || answer === '') return [];
  if (question.type === 'scale') return [`${answer}/5`];
  const values = Array.isArray(answer) ? answer : [String(answer)];
  return values.map((v) => question.options?.find((o) => o.value === v)?.label ?? String(v));
};

/** Lecture RH courte d'un thème, dérivée des tags réellement sélectionnés. */
const TAG_READINGS: Record<string, string> = {
  data: 'Vos données RH sont dispersées : c’est le premier frein à des décisions rapides.',
  documents: 'Beaucoup de temps part en recherche de documents — un assistant de recherche interne change tout.',
  faq: 'Vous répondez souvent aux mêmes questions : un assistant RH en libre-service vous libère des heures.',
  policy: 'Vos procédures existent en plusieurs versions : les fiabiliser est un gain immédiat.',
  payroll: 'La paie et l’administratif concentrent vos irritants : priorité au contrôle, pas à l’automatisation aveugle.',
  recruitment: 'Le recrutement absorbe votre énergie : tri, rédaction et suivi sont largement outillables.',
  learning: 'La formation revient fort : conception de contenus et suivi sont de bons premiers cas d’usage.',
  performance: 'La performance manque de cadre : structurer avant d’automatiser.',
  analytics: 'Vous manquez d’indicateurs fiables : commencez par un tableau de bord simple.',
  reporting: 'Le reporting vous coûte cher en temps : c’est souvent le premier gain visible.',
  workforce: 'Les décisions d’effectifs se prennent au feeling : la donnée vous ferait gagner en sérénité.',
  talent: 'Les sujets talents et mobilité reviennent : un cadre partagé aide plus que l’outil.',
  comp: 'La rémunération demande de la lisibilité avant tout outil.',
  relations: 'Le climat social pèse : l’IA aide sur la préparation, jamais sur la décision.',
  skills: 'Les compétences sont votre nœud : une cartographie claire débloque le reste.',
};

export interface ChapterRecap {
  chapter: string;
  headline: string;
  bullets: string[];
  reading: string;
}

/** Recap affiché à la fin de chaque chapitre : ce que le participant vient de révéler. */
export function chapterRecap(chapter: string, questions: Question[], answers: AnswerMap): ChapterRecap {
  const chapterQuestions = questions.filter((q) => (q.chapter ?? 'Votre diagnostic') === chapter);
  const bullets: string[] = [];
  const tally: Record<string, number> = {};

  for (const q of chapterQuestions) {
    const answer = answers[q.id];
    const labels = labelsFor(q, answer);
    if (labels.length) bullets.push(labels.join(' · '));
    const values = Array.isArray(answer) ? answer : answer !== undefined ? [String(answer)] : [];
    for (const v of values) {
      for (const tag of q.options?.find((o) => o.value === v)?.tags ?? []) {
        tally[tag] = (tally[tag] ?? 0) + 1;
      }
    }
  }

  const topTag = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0];
  return {
    chapter,
    headline: 'Ce que vos réponses révèlent',
    bullets: bullets.slice(0, 4),
    reading:
      (topTag && TAG_READINGS[topTag]) ||
      'Vos réponses situent déjà votre marge de gain : on continue pour préciser les cas d’usage.',
  };
}

/** Découpe le parcours en chapitres, dans l'ordre des questions. */
export function chapterOrder(questions: Question[]): string[] {
  const seen: string[] = [];
  for (const q of questions) {
    const c = q.chapter ?? 'Votre diagnostic';
    if (!seen.includes(c)) seen.push(c);
  }
  return seen;
}
