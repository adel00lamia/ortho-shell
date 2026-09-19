/**
 * Links the training objectives entered in "Company & Objectives" to concrete
 * plan choices: target skills, delivery methods and a measurable indicator.
 *
 * Purely deterministic keyword matching — no invented data, no AI call.
 */

export interface ObjectiveTheme {
  key: string;
  label: { fr: string; en: string };
  keywords: string[];
  skills: string[];
  deliveryMethods: string[];
  measure: { fr: string; en: string };
}

const THEMES: ObjectiveTheme[] = [
  {
    key: 'leadership',
    label: { fr: 'Management & leadership', en: 'Leadership & management' },
    keywords: ['leadership', 'leader', 'management', 'manager', 'encadr', 'équipe', 'equipe', 'team', 'délégu', 'delegat', 'succession'],
    skills: ['Leadership', 'Team Management', 'Delegation', 'Performance Management', 'Coaching & Mentoring'],
    deliveryMethods: ['workshops', 'mentorship'],
    measure: { fr: "Part de managers évalués sur les pratiques d'encadrement", en: 'Share of managers assessed on management practices' },
  },
  {
    key: 'strategy',
    label: { fr: 'Stratégie & changement', en: 'Strategy & change' },
    keywords: ['strateg', 'stratég', 'vision', 'change', 'changement', 'transformation organis', 'restructur'],
    skills: ['Strategic Planning', 'Change Management', 'Decision Making', 'Critical Thinking'],
    deliveryMethods: ['workshops'],
    measure: { fr: 'Avancement des chantiers de transformation prioritaires', en: 'Progress on priority transformation workstreams' },
  },
  {
    key: 'productivity',
    label: { fr: 'Productivité & processus', en: 'Productivity & process' },
    keywords: ['productiv', 'efficien', 'efficac', 'process', 'processus', 'lean', 'qualité', 'qualite', 'quality', 'opération', 'operation', 'délai', 'delai'],
    skills: ['Process Improvement', 'Quality Assurance', 'Operations Management', 'Time Management', 'Problem Solving'],
    deliveryMethods: ['onsite', 'workshops'],
    measure: { fr: 'Indicateur de productivité ou de non-qualité du périmètre visé', en: 'Productivity or defect indicator of the targeted scope' },
  },
  {
    key: 'technical',
    label: { fr: 'Expertise technique', en: 'Technical expertise' },
    keywords: ['technique', 'technical', 'technolog', 'expertise', 'ingénier', 'engineer', 'développ', 'develop', 'code', 'programm', 'maintenance'],
    skills: ['Programming', 'Software Development', 'Data Analysis', 'Database Management', 'DevOps'],
    deliveryMethods: ['hybrid', 'workshops'],
    measure: { fr: 'Taux de réussite aux évaluations techniques post-formation', en: 'Pass rate on post-training technical assessments' },
  },
  {
    key: 'digital',
    label: { fr: 'Digital & données', en: 'Digital & data' },
    keywords: ['digital', 'numérique', 'numerique', 'data', 'donnée', 'donnee', 'cloud', 'automatis', 'ia', 'ai', 'analytics', 'crm', 'e-commerce', 'ecommerce'],
    skills: ['Data Analysis', 'Data Visualization', 'Cloud Computing', 'AI & Machine Learning', 'CRM Systems'],
    deliveryMethods: ['online', 'microlearning'],
    measure: { fr: 'Taux d’usage réel des outils digitaux déployés', en: 'Actual adoption rate of the deployed digital tools' },
  },
  {
    key: 'commercial',
    label: { fr: 'Commercial & négociation', en: 'Sales & negotiation' },
    keywords: ['vente', 'ventes', 'sales', 'commercial', 'négoci', 'negoci', 'chiffre d’affaires', 'chiffre d\'affaires', 'revenue', 'prospection'],
    skills: ['Sales Techniques', 'Negotiation', 'Presentation Skills', 'Stakeholder Management'],
    deliveryMethods: ['workshops', 'mentorship'],
    measure: { fr: 'Taux de conversion ou panier moyen du périmètre visé', en: 'Conversion rate or average deal size of the targeted scope' },
  },
  {
    key: 'customer',
    label: { fr: 'Relation client', en: 'Customer service' },
    keywords: ['client', 'customer', 'service', 'satisfaction', 'réclam', 'reclam', 'fidélis', 'fidelis', 'support'],
    skills: ['Customer Service', 'Active Listening', 'Communication', 'Conflict Resolution'],
    deliveryMethods: ['onsite', 'microlearning'],
    measure: { fr: 'Satisfaction client et volume de réclamations', en: 'Customer satisfaction and complaint volume' },
  },
  {
    key: 'communication',
    label: { fr: 'Communication', en: 'Communication' },
    keywords: ['communicat', 'oral', 'présentation', 'presentation', 'reporting', 'écrit', 'ecrit', 'interculturel', 'cross-cultural'],
    skills: ['Communication', 'Presentation Skills', 'Written Communication', 'Public Speaking'],
    deliveryMethods: ['workshops'],
    measure: { fr: 'Qualité des restitutions évaluée par les managers', en: 'Quality of presentations assessed by managers' },
  },
  {
    key: 'innovation',
    label: { fr: 'Innovation & créativité', en: 'Innovation & creativity' },
    keywords: ['innovat', 'créativ', 'creativ', 'design thinking', 'idéation', 'ideation', 'r&d'],
    skills: ['Creativity', 'Critical Thinking', 'Problem Solving', 'UX/UI Design'],
    deliveryMethods: ['workshops', 'hybrid'],
    measure: { fr: 'Nombre d’initiatives issues des ateliers et mises en œuvre', en: 'Number of workshop initiatives actually implemented' },
  },
  {
    key: 'compliance',
    label: { fr: 'Conformité & risques', en: 'Compliance & risk' },
    keywords: ['conformité', 'conformite', 'complian', 'réglement', 'reglement', 'regulat', 'risque', 'risk', 'audit', 'sécurité', 'securite', 'hse', 'qhse', 'rgpd'],
    skills: ['Risk Management', 'Quality Assurance', 'Cybersecurity', 'Business Analysis'],
    deliveryMethods: ['online', 'onsite'],
    measure: { fr: 'Écarts d’audit levés et taux de personnel habilité', en: 'Closed audit findings and share of certified staff' },
  },
  {
    key: 'project',
    label: { fr: 'Gestion de projet', en: 'Project management' },
    keywords: ['projet', 'project', 'agile', 'scrum', 'planif', 'planning', 'pmo', 'portefeuille'],
    skills: ['Project Management', 'Agile/Scrum', 'Risk Management', 'Stakeholder Management'],
    deliveryMethods: ['hybrid', 'workshops'],
    measure: { fr: 'Part de projets livrés dans les délais et le budget', en: 'Share of projects delivered on time and on budget' },
  },
  {
    key: 'marketing',
    label: { fr: 'Marketing & marque', en: 'Marketing & brand' },
    keywords: ['marketing', 'marque', 'brand', 'seo', 'réseaux sociaux', 'social media', 'contenu', 'content', 'notoriét', 'notoriet'],
    skills: ['Digital Marketing', 'SEO/SEM', 'Social Media Marketing', 'Content Creation'],
    deliveryMethods: ['online', 'workshops'],
    measure: { fr: 'Trafic qualifié et leads générés', en: 'Qualified traffic and generated leads' },
  },
  {
    key: 'engagement',
    label: { fr: 'Engagement & climat social', en: 'Engagement & workplace climate' },
    keywords: ['engagement', 'motivation', 'rétention', 'retention', 'turnover', 'climat', 'bien-être', 'bien etre', 'cohésion', 'cohesion', 'collabor'],
    skills: ['Emotional Intelligence', 'Teamwork', 'Adaptability', 'Conflict Resolution'],
    deliveryMethods: ['workshops', 'mentorship'],
    measure: { fr: 'Turnover et participation aux actions collectives', en: 'Turnover and participation in collective actions' },
  },
];

export interface ObjectiveLink {
  objective: string;
  themeKey: string;
  themeLabel: string;
  skills: string[];
  deliveryMethods: string[];
  measure: string;
  matched: boolean;
}

function normalize(text: string): string {
  return text.toLowerCase();
}

/** Links each objective to its theme, skills, delivery methods and indicator. */
export function linkObjectives(objectives: string[], locale: 'fr' | 'en' = 'fr'): ObjectiveLink[] {
  return objectives.map((objective) => {
    const text = normalize(objective);
    const theme = THEMES.find((t) => t.keywords.some((k) => text.includes(k)));

    if (!theme) {
      return {
        objective,
        themeKey: 'unmatched',
        themeLabel: locale === 'fr' ? 'À préciser' : 'To be clarified',
        skills: [],
        deliveryMethods: [],
        measure: locale === 'fr' ? 'Indicateur à définir avec le métier' : 'Indicator to define with the business',
        matched: false,
      };
    }

    return {
      objective,
      themeKey: theme.key,
      themeLabel: theme.label[locale],
      skills: [...theme.skills],
      deliveryMethods: [...theme.deliveryMethods],
      measure: theme.measure[locale],
      matched: true,
    };
  });
}

/** Skills suggested by the objectives that are not selected yet. */
export function suggestedSkillsFromObjectives(objectives: string[], selectedSkills: string[]): string[] {
  const selected = new Set(selectedSkills.map((s) => s.toLowerCase()));
  const out: string[] = [];
  linkObjectives(objectives).forEach((link) => {
    link.skills.forEach((skill) => {
      if (!selected.has(skill.toLowerCase()) && !out.includes(skill)) out.push(skill);
    });
  });
  return out;
}

/** Delivery methods suggested by the objectives that are not selected yet. */
export function suggestedDeliveryFromObjectives(objectives: string[], selectedMethods: string[]): string[] {
  const out: string[] = [];
  linkObjectives(objectives).forEach((link) => {
    link.deliveryMethods.forEach((m) => {
      if (!selectedMethods.includes(m) && !out.includes(m)) out.push(m);
    });
  });
  return out;
}

/** Coverage of the objectives by the currently selected skills. */
export function objectiveCoverage(objectives: string[], selectedSkills: string[]) {
  const selected = new Set(selectedSkills.map((s) => s.toLowerCase()));
  const links = linkObjectives(objectives);
  const covered = links.filter(
    (l) => l.matched && l.skills.some((s) => selected.has(s.toLowerCase()))
  );
  const uncovered = links.filter((l) => !covered.includes(l));
  return {
    links,
    covered,
    uncovered,
    ratio: links.length === 0 ? 0 : Math.round((covered.length / links.length) * 100),
  };
}
