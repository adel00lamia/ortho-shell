/** Speaking-style profile: how the candidate actually talks, used to rewrite model answers. */
export type SpeakingStyle = {
  /** Free sample of the user's own words (typed or dictated). */
  sample: string;
  register: 'natural' | 'formal';
  length: 'short' | 'detailed';
  address: 'tu' | 'vous';
};

export const EMPTY_SPEAKING_STYLE: SpeakingStyle = {
  sample: '',
  register: 'natural',
  length: 'short',
  address: 'vous',
};

/**
 * Builds the instruction block sent to the coach. Returns '' when nothing is set,
 * so the backend keeps its default phrasing instead of guessing a style.
 */
export function buildStyleBrief(style: SpeakingStyle, fr: boolean): string {
  const sample = style.sample.trim().slice(0, 4000);
  const hasChoices =
    style.register !== EMPTY_SPEAKING_STYLE.register
    || style.length !== EMPTY_SPEAKING_STYLE.length
    || style.address !== EMPTY_SPEAKING_STYLE.address;
  if (!sample && !hasChoices) return '';

  const traits = fr
    ? [
      style.register === 'natural' ? 'registre parlé et naturel, pas de jargon RH' : 'registre soutenu et professionnel',
      style.length === 'short' ? 'phrases courtes, faciles à dire à voix haute' : 'réponses plus développées, mais toujours orales',
      style.address === 'tu' ? 'tutoiement' : 'vouvoiement',
    ]
    : [
      style.register === 'natural' ? 'spoken, natural register, no HR jargon' : 'formal, professional register',
      style.length === 'short' ? 'short sentences, easy to say out loud' : 'more developed answers, still spoken',
      style.address === 'tu' ? 'informal address' : 'formal address',
    ];

  const head = fr
    ? `PRÉFÉRENCES DE STYLE ORAL : ${traits.join(' ; ')}.`
    : `SPOKEN STYLE PREFERENCES: ${traits.join('; ')}.`;

  const sampleBlock = sample
    ? (fr
      ? `\nÉCHANTILLON DE MA FAÇON DE PARLER (mes propres mots) :\n<<<${sample}>>>\n- Réécris les réponses modèles avec MON vocabulaire, MA longueur de phrase et MES tournures, telles qu'on les entend dans cet échantillon.\n- Réutilise mes mots réels plutôt que des formules de manuel.\n- Ne change PAS les faits : les faits viennent du CV, seul le style vient de l'échantillon.`
      : `\nSAMPLE OF HOW I SPEAK (my own words):\n<<<${sample}>>>\n- Rewrite model answers with MY vocabulary, MY sentence length and MY turns of phrase as heard in this sample.\n- Reuse my real words instead of textbook formulas.\n- Do NOT change facts: facts come from the resume, only the style comes from the sample.`)
    : '';

  const mirror = fr
    ? `\n- Si j'ai déjà répondu pendant l'entretien, calque aussi ton style sur mes réponses précédentes.\n- Une réponse modèle doit pouvoir être dite telle quelle par moi, sans mot que je n'emploie pas.`
    : `\n- If I already answered during the interview, also mirror my previous answers.\n- A model answer must be sayable by me as-is, with no word I would not use.`;

  return `\n\n${head}${sampleBlock}${mirror}`;
}
