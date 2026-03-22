/**
 * Normalizes competency_scores from either object format { "skill": score }
 * or array format [{ name, score, category }] into a consistent array format.
 */
export interface NormalizedCompetencyScore {
  name: string;
  score: number;
  category: string;
}

export function normalizeCompetencyScores(
  scores: unknown
): NormalizedCompetencyScore[] {
  if (!scores) return [];

  // Already an array
  if (Array.isArray(scores)) {
    return scores.map((s: any) => ({
      name: s.name || '',
      score: Number(s.score) || 0,
      category: s.category || '',
    }));
  }

  // Object format: { "Skill Name": scoreNumber, ... }
  if (typeof scores === 'object') {
    return Object.entries(scores as Record<string, unknown>).map(
      ([name, score]) => ({
        name,
        score: Number(score) || 0,
        category: '',
      })
    );
  }

  return [];
}
