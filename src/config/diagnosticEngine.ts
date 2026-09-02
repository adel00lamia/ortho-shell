/**
 * Qimatak Diagnostic Engine — configuration.
 *
 * Extensible by design: a "domain" (hr, finance, procurement, sales, operations)
 * owns a list of roles, a universal question set and role-specific branches.
 * Scoring rules live here (never in UI components) so they can be tuned later.
 */

// ─────────────────────────── Types ───────────────────────────

export type DimensionKey = 'time' | 'data' | 'automation' | 'ai' | 'governance';

export interface DimensionDef {
  key: DimensionKey;
  label: string;
  short: string;
  /** true = a high score means "more friction / more opportunity" */
  frictionOriented: boolean;
  description: string;
}

export type QuestionType = 'multi' | 'single' | 'scale' | 'text';

export interface QuestionScore {
  dim: DimensionKey;
  /** relative weight of this question inside its dimension */
  weight: number;
  /** invert the normalized 0..1 value before aggregation */
  invert?: boolean;
  /** for `single` questions: normalized value per option */
  map?: Record<string, number>;
}

export interface QuestionOption {
  value: string;
  label: string;
  /** tags used to boost matching AI use cases */
  tags?: string[];
}

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  /** short eyebrow shown above the question, gives a sense of chapters */
  chapter?: string;
  hint?: string;
  /** for multi: recommended number of selections (used for normalization) */
  pick?: number;
  options?: QuestionOption[];
  scores?: QuestionScore[];
  notice?: string;
}

export interface RoleDef {
  key: string;
  label: string;
  /** groups used by the recommendation engine */
  families: string[];
}

export interface DomainDef {
  key: string;
  label: string;
  roles: RoleDef[];
  universal: Question[];
  branches: Record<string, Question[]>;
}

export interface UseCaseDef {
  id: string;
  title: string;
  description: string;
  /** 1..5 */
  impact: number;
  /** 1..5 (5 = very easy) */
  ease: number;
  roles: string[];
  tags: string[];
  humanControl?: boolean;
}

export interface ModuleDef {
  id: string;
  title: string;
  summary: string;
  roles: string[];
  tags: string[];
}

// ─────────────────────── Dimensions ───────────────────────

export const DIMENSIONS: DimensionDef[] = [
  {
    key: 'time',
    label: 'Inefficacité temps & processus',
    short: 'Temps & processus',
    frictionOriented: true,
    description: 'Charge de travail absorbée par des tâches manuelles, répétitives ou refaites.',
  },
  {
    key: 'data',
    label: 'Données & aide à la décision',
    short: 'Données & décision',
    frictionOriented: false,
    description: 'Disponibilité et fiabilité des données pour décider rapidement.',
  },
  {
    key: 'automation',
    label: "Potentiel d'automatisation",
    short: 'Automatisation',
    frictionOriented: true,
    description: 'Part des activités que l’IA ou l’automatisation peuvent réellement soulager.',
  },
  {
    key: 'ai',
    label: 'Maturité IA',
    short: 'Maturité IA',
    frictionOriented: false,
    description: 'Aisance, usages et pratiques IA déjà en place.',
  },
  {
    key: 'governance',
    label: 'Gouvernance & maîtrise des risques',
    short: 'Gouvernance',
    frictionOriented: false,
    description: 'Règles, confidentialité et contrôle humain autour des usages IA.',
  },
];

/** Weights of the composite "AI × HR Opportunity Score". Edit freely. */
export const OPPORTUNITY_WEIGHTS: Record<DimensionKey, number> = {
  time: 0.35,
  automation: 0.35,
  data: 0.15,
  ai: 0.1,
  governance: 0.05,
};

export const PROFILE_BANDS = [
  { max: 30, label: 'Explorateur IA', level: 'Foundation' as const, blurb: 'Premiers pas : sécuriser les bases et créer des réflexes simples.' },
  { max: 55, label: 'Optimisateur RH', level: 'Foundation' as const, blurb: 'Des usages ponctuels existent : structurer et industrialiser.' },
  { max: 75, label: 'Transformateur IA', level: 'Practitioner' as const, blurb: 'Usages réguliers : passer du bricolage aux processus outillés.' },
  { max: 101, label: 'HR AI Leader', level: 'Advanced' as const, blurb: 'Maturité avancée : gouvernance, mesure d’impact et copilots métier.' },
];

/** Indicative hours saved per week, derived from the opportunity score. */
export const TIME_SAVING_MODEL = { hoursPerPoint: 0.075, spread: 0.6, min: 1 };

// ─────────────────────── HR roles ───────────────────────

export const HR_ROLES: RoleDef[] = [
  { key: 'drh', label: 'DRH / Directeur·rice RH', families: ['strategy', 'reporting'] },
  { key: 'hr_manager', label: 'Responsable RH', families: ['strategy', 'admin', 'reporting'] },
  { key: 'hrbp', label: 'HR Business Partner', families: ['hrbp', 'talent'] },
  { key: 'talent', label: 'Talent / Performance Manager', families: ['talent'] },
  { key: 'recruitment', label: 'Recrutement / Talent Acquisition', families: ['recruitment'] },
  { key: 'learning', label: 'Formation / Learning & Development', families: ['learning'] },
  { key: 'payroll', label: 'Paie & Administration du personnel', families: ['admin'] },
  { key: 'relations', label: 'Relations sociales / Juridique RH', families: ['legal'] },
  { key: 'comp', label: 'Rémunération & Avantages (C&B)', families: ['comp', 'reporting'] },
  { key: 'analytics', label: 'People Analytics / SIRH', families: ['analytics', 'reporting'] },
  { key: 'gm', label: 'Direction générale / Business Leader', families: ['manager', 'strategy'] },
  { key: 'manager', label: 'Manager d’équipe / opérationnel', families: ['manager'] },
  { key: 'other', label: 'Autre fonction RH', families: ['strategy'] },
];

export const SECTORS = [
  'Industrie', 'Automobile', 'Aéronautique', 'Textile', 'Agroalimentaire', 'Banque & Assurance',
  'Télécoms', 'IT & Digital', 'Offshoring / BPO', 'Distribution & Retail', 'BTP & Immobilier',
  'Santé', 'Éducation & Formation', 'Transport & Logistique', 'Énergie', 'Tourisme & Hôtellerie',
  'Conseil & Services', 'Secteur public', 'ONG / Association', 'Autre',
];

export const COMPANY_SIZES = ['<50', '50-249', '250-999', '1000+'];
export const SENIORITIES = ['< 1 an', '1-3 ans', '3-5 ans', '5-10 ans', '> 10 ans'];
export const HR_TEAM_SIZES = ['1 (seul·e)', '2-5', '6-15', '16-50', '> 50'];

// ─────────────────────── Helpers ───────────────────────

const opts = (list: [string, string, string[]?][]): QuestionOption[] =>
  list.map(([value, label, tags]) => ({ value, label, tags }));

// ─────────────────────── Universal questions ───────────────────────

const TASK_OPTIONS = opts([
  ['reporting', 'Préparer des chiffres, tableaux, présentations', ['reporting']],
  ['admin_docs', 'Rédiger des courriers, attestations, notes', ['documents']],
  ['data_entry', 'Ressaisir ou recoller des données entre fichiers', ['data']],
  ['emails', 'Répondre aux e-mails et aux mêmes questions', ['faq']],
  ['meetings', 'Réunions, préparation et comptes rendus', ['meetings']],
  ['recruit', 'Lire des CV, mener et suivre des entretiens', ['recruitment']],
  ['payroll', 'Vérifier la paie, le pointage, les absences', ['payroll']],
  ['training', 'Organiser et suivre les formations', ['learning']],
  ['cases', 'Gérer des situations individuelles', ['cases']],
  ['policies', 'Chercher ce que dit la procédure ou la loi', ['policy']],
]);

/** Very concrete micro-gestures — makes the "repetitive" question feel different. */
const REPEAT_OPTIONS = opts([
  ['copy_paste', 'Copier-coller d’un fichier vers un autre', ['data']],
  ['same_answer', 'Réécrire la même réponse à des questions identiques', ['faq']],
  ['template_docs', 'Repartir d’un ancien document et changer les noms', ['documents']],
  ['chase', 'Relancer des personnes pour obtenir une information', ['meetings']],
  ['monthly_report', 'Refaire le même tableau chaque mois', ['reporting']],
  ['check_lines', 'Vérifier ligne à ligne pour éviter une erreur', ['payroll']],
  ['sort_cv', 'Parcourir des candidatures très similaires', ['screening']],
  ['schedule', 'Caler des créneaux et replanifier', ['scheduling']],
]);

/** Where the mess shows up — error / rework framing. */
const ERROR_OPTIONS = opts([
  ['numbers', 'Les chiffres transmis à la direction', ['reporting']],
  ['payroll_var', 'Les éléments variables de paie', ['payroll']],
  ['files', 'Les dossiers du personnel incomplets', ['documents']],
  ['double_entry', 'Les données saisies deux fois différemment', ['data']],
  ['deadlines', 'Les échéances oubliées ou découvertes tard', ['reporting']],
  ['contracts', 'Les contrats, avenants et attestations', ['documents']],
  ['perf_data', 'Les évaluations et données de performance', ['performance']],
  ['leave', 'Les compteurs de congés et d’absences', ['payroll']],
]);

/** Where information physically lives — replaces the repeated task list. */
const SOURCE_OPTIONS = opts([
  ['excel', 'Plusieurs fichiers Excel, pas toujours à jour', ['data']],
  ['mailbox', 'Ma boîte e-mail et mes conversations', ['faq']],
  ['sirh', 'Le SIRH, mais l’extraction est pénible', ['data']],
  ['drive', 'Des dossiers partagés mal rangés', ['documents']],
  ['paper', 'Des documents papier ou scannés', ['documents']],
  ['colleagues', 'La mémoire de mes collègues', ['policy']],
  ['procedures', 'Des procédures dispersées en plusieurs versions', ['policy']],
]);

export const HR_UNIVERSAL: Question[] = [
  {
    id: 'u_time',
    type: 'multi',
    pick: 3,
    chapter: 'Votre semaine',
    label: 'Sur une semaine typique, où part réellement votre temps ?',
    hint: 'Pensez à la semaine dernière plutôt qu’à une semaine idéale. 3 choix maximum.',
    options: TASK_OPTIONS,
    scores: [{ dim: 'time', weight: 2 }],
  },
  {
    id: 'u_repetitive',
    type: 'multi',
    pick: 3,
    chapter: 'Votre semaine',
    label: 'Quels gestes faites-vous presque les yeux fermés, tellement ils reviennent ?',
    hint: 'Ce sont souvent les meilleurs candidats à l’automatisation.',
    options: REPEAT_OPTIONS,
    scores: [{ dim: 'automation', weight: 2 }],
  },
  {
    id: 'u_errors',
    type: 'multi',
    pick: 3,
    chapter: 'Ce qui coince',
    label: 'Sur quoi devez-vous le plus souvent corriger, reprendre ou vous justifier ?',
    hint: 'Là où une erreur coûte cher, l’IA sert surtout de filet de contrôle.',
    options: ERROR_OPTIONS,
    scores: [{ dim: 'time', weight: 1.5 }, { dim: 'data', weight: 1, invert: true }],
  },
  {
    id: 'u_search',
    type: 'multi',
    pick: 3,
    chapter: 'Ce qui coince',
    label: 'Quand il vous manque une information RH, où faut-il aller fouiller ?',
    options: SOURCE_OPTIONS,
    scores: [{ dim: 'automation', weight: 1.5 }, { dim: 'data', weight: 1.5, invert: true }],
  },
  {
    id: 'u_decisions',
    type: 'multi',
    pick: 2,
    chapter: 'Décider',
    label: 'Quelle décision prenez-vous aujourd’hui plus au feeling qu’avec des données ?',
    options: opts([
      ['workforce', 'Combien de personnes recruter et où', ['workforce']],
      ['salary', 'Qui augmenter et de combien', ['comp']],
      ['skills', 'Quelles compétences développer en priorité', ['skills']],
      ['perf', 'Comment évaluer réellement la performance', ['performance']],
      ['turnover', 'Qui risque de partir dans les prochains mois', ['analytics']],
      ['budget', 'Où couper ou investir dans le budget RH', ['reporting']],
    ]),
    scores: [{ dim: 'data', weight: 2, invert: true }],
  },
  {
    id: 'u_faq',
    type: 'multi',
    pick: 2,
    chapter: 'Décider',
    label: 'Sur quels sujets pourriez-vous réciter votre réponse par cœur ?',
    hint: 'Les questions que collaborateurs et managers vous reposent sans arrêt.',
    options: opts([
      ['leave', 'Congés, absences, jours restants', ['faq']],
      ['payslip', 'Bulletins et éléments de paie', ['payroll', 'faq']],
      ['contracts', 'Contrats et attestations', ['documents', 'faq']],
      ['process', 'Procédures RH internes', ['policy', 'faq']],
      ['training_offer', 'Formations disponibles', ['learning', 'faq']],
      ['career', 'Évolution, mobilité, promotion', ['talent', 'faq']],
    ]),
    scores: [{ dim: 'automation', weight: 1.5 }],
  },
  {
    id: 'u_priority',
    type: 'single',
    chapter: 'Votre priorité',
    label: 'Si vous ne pouviez réussir qu’un seul chantier RH d’ici 3 mois, lequel ?',
    options: opts([
      ['recruitment', 'Recruter mieux et plus vite'],
      ['learning', 'Faire monter les compétences'],
      ['payroll', 'Sécuriser la paie et l’administration'],
      ['performance', 'Structurer performance et talents'],
      ['reporting', 'Piloter avec des chiffres fiables'],
      ['relations', 'Apaiser le climat social'],
      ['comp', 'Clarifier la rémunération'],
      ['other', 'Autre chantier'],
    ]),
  },
  {
    id: 'u_comfort',
    type: 'scale',
    chapter: 'Votre rapport à l’IA',
    label: 'Où vous situez-vous aujourd’hui avec l’IA générative ?',
    hint: '1 = je n’ai jamais essayé · 3 = j’essaie de temps en temps · 5 = je l’utilise chaque jour',
    scores: [{ dim: 'ai', weight: 3 }],
  },
  {
    id: 'u_tools',
    type: 'multi',
    pick: 2,
    chapter: 'Votre rapport à l’IA',
    label: 'Qu’avez-vous déjà ouvert au moins une fois ?',
    options: opts([
      ['chatgpt', 'ChatGPT'],
      ['copilot', 'Microsoft Copilot'],
      ['gemini', 'Google Gemini'],
      ['other', 'Un autre assistant'],
      ['none', 'Aucun pour l’instant'],
    ]),
    scores: [{ dim: 'ai', weight: 1.5 }],
  },
  {
    id: 'u_rules',
    type: 'single',
    chapter: 'Cadre & confiance',
    label: 'Si vous utilisiez l’IA sur un dossier RH demain, sauriez-vous ce qui est autorisé ?',
    options: opts([
      ['yes', 'Oui, des règles écrites existent'],
      ['partly', 'En partie, c’est en construction'],
      ['no', 'Non, rien n’est cadré'],
      ['unsure', 'Je ne sais pas'],
    ]),
    scores: [{ dim: 'governance', weight: 3, map: { yes: 1, partly: 0.55, no: 0.1, unsure: 0.2 } }],
  },
  {
    id: 'u_concern',
    type: 'single',
    chapter: 'Cadre & confiance',
    label: 'Qu’est-ce qui vous retient le plus d’aller plus loin avec l’IA ?',
    options: opts([
      ['confidentiality', 'La confidentialité des données'],
      ['reliability', 'Le risque de résultats faux'],
      ['jobs', 'L’impact sur les emplois'],
      ['skills', 'Le sentiment de ne pas savoir m’en servir'],
      ['compliance', 'Le cadre légal et la conformité'],
      ['integration', 'L’intégration à nos outils actuels'],
      ['other', 'Autre chose'],
    ]),
    scores: [{ dim: 'governance', weight: 1, map: { confidentiality: 0.4, reliability: 0.5, jobs: 0.4, skills: 0.3, compliance: 0.4, integration: 0.6, other: 0.5 } }],
  },
];

// ─────────────────────── Role branches ───────────────────────


const openQ = (id: string): Question => ({
  id,
  type: 'text',
  chapter: 'Projection',
  label: 'Imaginez votre semaine idéale : quelle tâche RH aimeriez-vous ne plus faire manuellement ?',
  hint: 'Décrivez la situation concrète. Une ou deux phrases suffisent.',
});

const painQ = (id: string, label: string, options: QuestionOption[], pick = 3, scores?: QuestionScore[]): Question => ({
  id, type: 'multi', chapter: 'Votre réalité métier', pick, label, options, scores: scores ?? [{ dim: 'automation', weight: 1.5 }],
});

const scaleQ = (id: string, label: string, dim: DimensionKey, weight = 1.5, invert = false, hint?: string): Question => ({
  id, type: 'scale', chapter: 'Votre réalité métier', label, hint, scores: [{ dim, weight, invert }],
});

export const HR_BRANCHES: Record<string, Question[]> = {
  drh: [
    painQ('drh_pains', 'Quels sujets de pilotage vous coûtent le plus d’énergie ?', opts([
      ['workforce', 'Planification des effectifs', ['workforce']],
      ['reporting', 'Reporting de direction', ['reporting']],
      ['strategy', 'Formalisation de la stratégie RH', ['strategy']],
      ['budget', 'Construction et suivi du budget', ['reporting']],
      ['risks', 'Identification des risques talents', ['talent']],
      ['engagement', 'Engagement et climat social', ['engagement']],
      ['policy_comm', 'Communication des politiques RH', ['policy']],
      ['mgr_support', 'Accompagnement des managers', ['manager']],
      ['transformation', 'Conduite de la transformation', ['strategy']],
      ['compliance', 'Conformité réglementaire', ['policy']],
    ])),
    scaleQ('drh_data', 'À quel point vos indicateurs RH sont-ils disponibles au moment où vous décidez ?', 'data', 2, false, '1 = jamais · 5 = toujours'),
    scaleQ('drh_reporting_time', 'Le reporting de direction vous demande-t-il beaucoup de retraitement manuel ?', 'time', 2, false, '1 = très peu · 5 = énormément'),
    {
      id: 'drh_horizon', type: 'single', label: 'Sur quel horizon vos décisions d’effectifs sont-elles les plus fragiles ?',
      options: opts([['month', 'Le mois'], ['quarter', 'Le trimestre'], ['year', 'L’année'], ['3y', 'Au-delà d’un an']]),
      scores: [{ dim: 'data', weight: 1, invert: true, map: { month: 1, quarter: 0.7, year: 0.4, '3y': 0.2 } }],
    },
    painQ('drh_board', 'Quelles informations vous manquent le plus en comité de direction ?', opts([
      ['cost', 'Coût réel de la masse salariale', ['reporting']],
      ['skills', 'Cartographie des compétences', ['skills']],
      ['turnover', 'Prévision des départs', ['analytics']],
      ['productivity', 'Indicateurs de productivité', ['reporting']],
      ['bench', 'Comparaisons de marché', ['comp']],
    ]), 2, [{ dim: 'data', weight: 1.5, invert: true }]),
    openQ('drh_open'),
  ],
  recruitment: [
    painQ('rec_pains', 'Où perdez-vous le plus de temps dans le processus de recrutement ?', opts([
      ['jd', 'Rédaction des fiches de poste', ['jd']],
      ['sourcing', 'Sourcing des candidats', ['sourcing']],
      ['screening', 'Tri des CV', ['screening']],
      ['prep', 'Préparation des entretiens', ['interview']],
      ['compare', 'Comparaison des candidats', ['screening']],
      ['scheduling', 'Planification des entretiens', ['scheduling']],
      ['comm', 'Communication candidats', ['candidate_comm']],
      ['assessment', 'Évaluation et tests', ['interview']],
      ['onboarding', 'Onboarding', ['onboarding']],
      ['reporting', 'Reporting recrutement', ['reporting']],
    ])),
    scaleQ('rec_volume', 'Votre volume de candidatures est-il difficile à traiter dans les délais ?', 'time', 2, false, '1 = maîtrisé · 5 = ingérable'),
    scaleQ('rec_tth', 'Votre time-to-hire est-il un point de tension avec les managers ?', 'time', 1.5),
    {
      id: 'rec_ats', type: 'single', label: 'Disposez-vous d’un ATS ou d’un outil de suivi structuré ?',
      options: opts([['yes', 'Oui, utilisé au quotidien'], ['partly', 'Oui mais peu utilisé'], ['no', 'Non, fichiers et e-mails']]),
      scores: [{ dim: 'data', weight: 2, map: { yes: 1, partly: 0.5, no: 0.1 } }],
    },
    painQ('rec_quality', 'Quelles étapes manquent le plus d’objectivité aujourd’hui ?', opts([
      ['screening', 'Le tri initial', ['screening']],
      ['interview', 'La conduite des entretiens', ['interview']],
      ['scorecard', 'La grille d’évaluation', ['interview']],
      ['decision', 'La décision finale', ['screening']],
    ]), 2, [{ dim: 'data', weight: 1.5, invert: true }]),
    openQ('rec_open'),
  ],
  learning: [
    painQ('ld_pains', 'Quelles étapes du cycle formation vous prennent le plus de temps ?', opts([
      ['gaps', 'Identification des écarts de compétences', ['skills']],
      ['needs', 'Analyse des besoins', ['needs']],
      ['design', 'Ingénierie pédagogique', ['design']],
      ['content', 'Création de contenus', ['content']],
      ['paths', 'Parcours personnalisés', ['paths']],
      ['quiz', 'Création de quiz et évaluations', ['quiz']],
      ['attendance', 'Suivi des présences', ['admin_l']],
      ['evaluation', 'Évaluation à chaud / à froid', ['evaluation']],
      ['roi', 'Mesure du ROI', ['roi']],
      ['followup', 'Suivi post-formation', ['evaluation']],
    ])),
    scaleQ('ld_content', 'Créez-vous beaucoup de supports à partir d’une page blanche ?', 'automation', 2, false, '1 = rarement · 5 = systématiquement'),
    scaleQ('ld_measure', 'Mesurez-vous facilement l’effet des formations sur le terrain ?', 'data', 2, false, '1 = pas du tout · 5 = très facilement'),
    {
      id: 'ld_catalog', type: 'single', label: 'Vos besoins de formation sont-ils formalisés dans un plan structuré ?',
      options: opts([['yes', 'Oui, plan annuel outillé'], ['partly', 'Partiellement'], ['no', 'Non, au fil de l’eau']]),
      scores: [{ dim: 'data', weight: 1.5, map: { yes: 1, partly: 0.5, no: 0.15 } }],
    },
    painQ('ld_audience', 'Pour quels publics la personnalisation est-elle la plus difficile ?', opts([
      ['managers', 'Managers'], ['experts', 'Experts métiers'], ['ops', 'Opérateurs / terrain'], ['newcomers', 'Nouveaux arrivants'],
    ]), 2),
    openQ('ld_open'),
  ],
  hrbp: [
    painQ('bp_pains', 'Quelles sollicitations consomment le plus votre semaine ?', opts([
      ['mgr_support', 'Accompagnement des managers', ['manager']],
      ['cases', 'Cas individuels', ['cases']],
      ['performance', 'Sujets de performance', ['performance']],
      ['workforce', 'Analyse des effectifs', ['workforce']],
      ['succession', 'Succession et relève', ['talent']],
      ['relations', 'Relations sociales', ['legal']],
      ['reporting', 'Reporting pour le business', ['reporting']],
      ['meetings', 'Préparation de réunions', ['meetings']],
      ['policy', 'Interprétation des politiques RH', ['policy']],
    ])),
    scaleQ('bp_mgr', 'Les managers vous demandent-ils souvent la même aide de base ?', 'automation', 2),
    scaleQ('bp_data', 'Avez-vous les données terrain nécessaires pour challenger le business ?', 'data', 2, false, '1 = jamais · 5 = toujours'),
    painQ('bp_prep', 'Quelles préparations aimeriez-vous accélérer ?', opts([
      ['review', 'Revues de performance'], ['comite', 'Comités talents'], ['difficult', 'Entretiens difficiles'], ['orga', 'Réorganisations'],
    ]), 2),
    openQ('bp_open'),
  ],
  payroll: [
    painQ('pay_pains', 'Quelles activités administratives vous pèsent le plus ?', opts([
      ['consolidation', 'Consolidation des données', ['data']],
      ['attendance', 'Pointage et absences', ['payroll']],
      ['controls', 'Contrôles de paie', ['payroll']],
      ['anomalies', 'Détection d’anomalies', ['anomaly']],
      ['requests', 'Demandes des collaborateurs', ['faq']],
      ['certificates', 'Attestations', ['documents']],
      ['letters', 'Courriers et avenants', ['documents']],
      ['leave', 'Gestion des congés', ['payroll']],
      ['reconciliation', 'Rapprochements et écarts', ['reconciliation']],
      ['reporting', 'Reporting social', ['reporting']],
    ])),
    scaleQ('pay_manual', 'Quelle part de vos contrôles reste manuelle (Excel, vérification ligne à ligne) ?', 'automation', 2.5, false, '1 = très faible · 5 = quasi totale'),
    scaleQ('pay_errors', 'Les erreurs détectées tardivement génèrent-elles des reprises ?', 'time', 2),
    {
      id: 'pay_tool', type: 'single', label: 'Vos données de paie et de temps sont-elles dans un système unique ?',
      options: opts([['yes', 'Oui, intégré'], ['partly', 'Plusieurs systèmes reliés'], ['no', 'Non, fichiers séparés']]),
      scores: [{ dim: 'data', weight: 2, map: { yes: 1, partly: 0.5, no: 0.1 } }],
    },
    openQ('pay_open'),
  ],
  talent: [
    painQ('tal_pains', 'Quels processus talents sont les plus lourds à animer ?', opts([
      ['goals', 'Fixation des objectifs', ['performance']],
      ['reviews', 'Entretiens d’évaluation', ['performance']],
      ['calibration', 'Calibrage des évaluations', ['performance']],
      ['identification', 'Identification des talents', ['talent']],
      ['succession', 'Plans de succession', ['talent']],
      ['skills', 'Cartographie des compétences', ['skills']],
      ['careers', 'Parcours de carrière', ['talent']],
      ['feedback', 'Qualité du feedback', ['performance']],
    ])),
    scaleQ('tal_quality', 'La qualité des feedbacks écrits par les managers est-elle homogène ?', 'data', 1.5, true, '1 = très hétérogène · 5 = homogène'),
    scaleQ('tal_admin', 'La logistique des campagnes vous prend-elle plus de temps que l’analyse ?', 'time', 2),
    painQ('tal_missing', 'Quelles informations manquent pour décider des mobilités ?', opts([
      ['skills', 'Compétences réelles'], ['potential', 'Potentiel'], ['aspirations', 'Souhaits des collaborateurs'], ['perf_history', 'Historique de performance'],
    ]), 2, [{ dim: 'data', weight: 1.5, invert: true }]),
    openQ('tal_open'),
  ],
  relations: [
    {
      ...painQ('rel_pains', 'Quelles tâches liées aux dossiers sociaux sont les plus consommatrices ?', opts([
        ['documentation', 'Documentation des dossiers', ['cases']],
        ['chronology', 'Reconstitution de chronologies', ['cases']],
        ['review', 'Relecture de documents', ['documents']],
        ['letters', 'Rédaction de courriers disciplinaires', ['documents']],
        ['policy_compare', 'Comparaison de politiques internes', ['policy']],
        ['legal_prep', 'Préparation des recherches juridiques', ['policy']],
        ['minutes', 'Comptes rendus de réunions', ['meetings']],
        ['evidence', 'Organisation des preuves', ['cases']],
        ['risk', 'Analyse de risque', ['cases']],
      ])),
      notice: 'L’IA apporte une aide à la préparation et à la structuration. Elle ne remplace pas un avis juridique.',
    },
    scaleQ('rel_volume', 'Le volume de dossiers à documenter est-il difficile à absorber ?', 'time', 2),
    scaleQ('rel_traceability', 'Vos dossiers sont-ils traçables et faciles à retrouver ?', 'data', 2, false, '1 = difficilement · 5 = très facilement'),
    {
      id: 'rel_sensitive', type: 'single', label: 'Des règles encadrent-elles l’usage d’outils externes sur des données sensibles ?',
      options: opts([['yes', 'Oui, clairement'], ['partly', 'Partiellement'], ['no', 'Non']]),
      scores: [{ dim: 'governance', weight: 3, map: { yes: 1, partly: 0.5, no: 0.05 } }],
    },
    openQ('rel_open'),
  ],
  comp: [
    painQ('comp_pains', 'Quels travaux de rémunération vous prennent le plus de temps ?', opts([
      ['benchmark', 'Benchmark salarial', ['comp']],
      ['scenarios', 'Scénarios de révision salariale', ['comp']],
      ['budget', 'Modélisation budgétaire', ['reporting']],
      ['equity', 'Équité interne', ['comp']],
      ['variable', 'Analyse du variable', ['comp']],
      ['comm', 'Communication des avantages', ['faq']],
    ])),
    scaleQ('comp_excel', 'Vos simulations reposent-elles majoritairement sur Excel ?', 'automation', 2),
    scaleQ('comp_equity', 'Pouvez-vous démontrer facilement l’équité interne ?', 'data', 2, false, '1 = très difficilement · 5 = immédiatement'),
    openQ('comp_open'),
  ],
  analytics: [
    painQ('an_pains', 'Où se concentre votre charge sur la donnée RH ?', opts([
      ['cleaning', 'Nettoyage des données', ['data']],
      ['dashboards', 'Préparation des tableaux de bord', ['reporting']],
      ['kpi', 'Analyse des KPI', ['reporting']],
      ['interpretation', 'Interprétation des résultats', ['analytics']],
      ['forecast', 'Prévisions', ['analytics']],
      ['queries', 'Requêtes et extractions', ['data']],
      ['adoption', 'Adoption du SIRH', ['adoption']],
    ])),
    scaleQ('an_quality', 'La qualité des données sources est-elle fiable ?', 'data', 2.5, false, '1 = très faible · 5 = excellente'),
    scaleQ('an_manual', 'Vos extractions et rapports sont-ils reproduits manuellement chaque mois ?', 'automation', 2.5),
    openQ('an_open'),
  ],
  manager: [
    painQ('mgr_pains', 'Quelles activités RH de votre rôle managérial vous coûtent le plus ?', opts([
      ['requests', 'Demandes de recrutement', ['recruitment']],
      ['onboarding', 'Intégration des nouveaux', ['onboarding']],
      ['goals', 'Fixation des objectifs', ['performance']],
      ['feedback', 'Feedback régulier', ['performance']],
      ['perf_talks', 'Entretiens de performance', ['performance']],
      ['planning', 'Planification de l’équipe', ['workforce']],
      ['questions', 'Questions RH de l’équipe', ['faq']],
      ['meetings', 'Préparation de réunions', ['meetings']],
      ['comm', 'Communication interne', ['documents']],
    ])),
    scaleQ('mgr_time', 'Ces tâches empiètent-elles sur votre activité opérationnelle ?', 'time', 2),
    scaleQ('mgr_support', 'Trouvez-vous facilement l’information RH dont vous avez besoin ?', 'data', 1.5, false, '1 = jamais · 5 = toujours'),
    openQ('mgr_open'),
  ],
};

// aliases sharing a branch
HR_BRANCHES.hr_manager = HR_BRANCHES.drh;
HR_BRANCHES.gm = HR_BRANCHES.manager;
HR_BRANCHES.other = HR_BRANCHES.drh;

export const HR_DOMAIN: DomainDef = {
  key: 'hr',
  label: 'AI × HR',
  roles: HR_ROLES,
  universal: HR_UNIVERSAL,
  branches: HR_BRANCHES,
};

/** Registry — future domains (finance, procurement…) plug in here. */
export const DOMAINS: Record<string, DomainDef> = { hr: HR_DOMAIN };

// ─────────────────────── AI use-case library ───────────────────────

export const USE_CASES: UseCaseDef[] = [
  { id: 'jd_copilot', title: 'Copilote de fiches de poste', description: 'Générer et harmoniser les fiches de poste à partir de quelques informations clés.', impact: 4, ease: 5, roles: ['recruitment', 'drh', 'hr_manager', 'hrbp'], tags: ['jd', 'documents'] },
  { id: 'cv_framework', title: 'Grille de comparaison de candidatures', description: 'Structurer une comparaison objective des candidats selon des critères définis.', impact: 5, ease: 4, roles: ['recruitment'], tags: ['screening'], humanControl: true },
  { id: 'interview_guide', title: 'Génération de guides d’entretien', description: 'Produire questions et grilles d’évaluation adaptées au poste.', impact: 4, ease: 5, roles: ['recruitment', 'manager', 'hrbp'], tags: ['interview'] },
  { id: 'candidate_comm', title: 'Communication candidats assistée', description: 'Modèles de réponses personnalisées et suivi des relances.', impact: 3, ease: 5, roles: ['recruitment'], tags: ['candidate_comm', 'scheduling'] },
  { id: 'rec_analytics', title: 'Analytique recrutement', description: 'Lire et commenter automatiquement vos indicateurs de recrutement.', impact: 4, ease: 3, roles: ['recruitment', 'analytics'], tags: ['reporting'] },
  { id: 'anomaly_detect', title: 'Détection d’anomalies de paie', description: 'Repérer les écarts inhabituels avant validation de la paie.', impact: 5, ease: 3, roles: ['payroll', 'analytics'], tags: ['anomaly', 'payroll'], humanControl: true },
  { id: 'reconciliation', title: 'Assistance au rapprochement', description: 'Comparer deux sources de données et expliquer les écarts.', impact: 4, ease: 3, roles: ['payroll', 'comp', 'analytics'], tags: ['reconciliation', 'data'] },
  { id: 'hr_faq', title: 'FAQ RH pour collaborateurs', description: 'Assistant interne répondant aux questions récurrentes à partir de vos procédures.', impact: 5, ease: 4, roles: ['payroll', 'drh', 'hr_manager', 'hrbp', 'manager'], tags: ['faq', 'policy'] },
  { id: 'doc_generation', title: 'Génération de documents RH', description: 'Attestations, courriers et avenants produits à partir de modèles maîtrisés.', impact: 4, ease: 5, roles: ['payroll', 'relations', 'hr_manager'], tags: ['documents'] },
  { id: 'report_automation', title: 'Automatisation du reporting', description: 'Transformer des extractions brutes en rapport commenté et prêt à diffuser.', impact: 5, ease: 3, roles: ['drh', 'hr_manager', 'analytics', 'comp', 'payroll'], tags: ['reporting', 'data'] },
  { id: 'exec_reporting', title: 'Reporting RH pour la direction', description: 'Synthèses exécutives et messages clés à partir de vos indicateurs.', impact: 5, ease: 4, roles: ['drh', 'hr_manager', 'gm'], tags: ['reporting', 'strategy'] },
  { id: 'workforce_scenarios', title: 'Scénarios d’effectifs', description: 'Simuler plusieurs hypothèses d’évolution des effectifs et de coûts.', impact: 4, ease: 2, roles: ['drh', 'hr_manager', 'analytics', 'gm'], tags: ['workforce'], humanControl: true },
  { id: 'skill_intelligence', title: 'Cartographie intelligente des compétences', description: 'Structurer et enrichir votre référentiel de compétences.', impact: 5, ease: 3, roles: ['drh', 'learning', 'talent', 'hrbp'], tags: ['skills'] },
  { id: 'policy_copilot', title: 'Copilote de politiques RH', description: 'Interroger et comparer vos procédures internes en langage naturel.', impact: 4, ease: 4, roles: ['drh', 'hr_manager', 'relations', 'hrbp'], tags: ['policy'], humanControl: true },
  { id: 'decision_support', title: 'Aide à la décision RH', description: 'Préparer des options argumentées pour vos arbitrages.', impact: 4, ease: 3, roles: ['drh', 'gm', 'hrbp'], tags: ['strategy', 'reporting'], humanControl: true },
  { id: 'needs_diagnosis', title: 'Diagnostic des besoins de formation', description: 'Passer des demandes exprimées aux besoins réels et priorisés.', impact: 5, ease: 4, roles: ['learning', 'drh'], tags: ['needs', 'skills'] },
  { id: 'content_gen', title: 'Génération de contenus pédagogiques', description: 'Produire supports, cas pratiques et scripts à partir de vos objectifs.', impact: 5, ease: 5, roles: ['learning'], tags: ['content', 'design'] },
  { id: 'adaptive_paths', title: 'Parcours d’apprentissage personnalisés', description: 'Adapter les parcours au niveau et au métier de chaque collaborateur.', impact: 4, ease: 3, roles: ['learning', 'talent'], tags: ['paths'] },
  { id: 'quiz_gen', title: 'Génération de quiz et évaluations', description: 'Créer rapidement des évaluations alignées sur les objectifs.', impact: 3, ease: 5, roles: ['learning'], tags: ['quiz'] },
  { id: 'training_impact', title: 'Analyse de l’impact formation', description: 'Croiser évaluations, KPI métiers et retours terrain.', impact: 4, ease: 2, roles: ['learning', 'analytics'], tags: ['roi', 'evaluation'] },
  { id: 'case_chronology', title: 'Chronologie de dossier assistée', description: 'Reconstituer les faits et pièces d’un dossier de manière structurée.', impact: 4, ease: 3, roles: ['relations', 'hrbp'], tags: ['cases'], humanControl: true },
  { id: 'meeting_minutes', title: 'Comptes rendus de réunion', description: 'Notes structurées et décisions à partir de vos échanges.', impact: 4, ease: 5, roles: ['relations', 'hrbp', 'manager', 'drh'], tags: ['meetings'] },
  { id: 'salary_bench', title: 'Préparation de benchmark salarial', description: 'Structurer et interpréter vos comparaisons de rémunération.', impact: 4, ease: 3, roles: ['comp', 'drh'], tags: ['comp'], humanControl: true },
  { id: 'comp_scenarios', title: 'Scénarios de révision salariale', description: 'Modéliser plusieurs enveloppes et en expliquer les effets.', impact: 4, ease: 3, roles: ['comp', 'drh'], tags: ['comp'], humanControl: true },
  { id: 'data_cleaning', title: 'Nettoyage de données RH', description: 'Détecter doublons, incohérences et valeurs manquantes.', impact: 4, ease: 4, roles: ['analytics', 'payroll'], tags: ['data'] },
  { id: 'kpi_interpretation', title: 'Interprétation des KPI', description: 'Faire expliciter tendances et hypothèses derrière vos chiffres.', impact: 4, ease: 4, roles: ['analytics', 'drh'], tags: ['analytics', 'reporting'] },
  { id: 'perf_feedback', title: 'Aide à la rédaction de feedback', description: 'Reformuler un feedback factuel, clair et respectueux.', impact: 4, ease: 5, roles: ['talent', 'manager', 'hrbp'], tags: ['performance'], humanControl: true },
  { id: 'review_prep', title: 'Préparation des entretiens de performance', description: 'Structurer les points clés et anticiper les objections.', impact: 4, ease: 5, roles: ['talent', 'manager', 'hrbp'], tags: ['performance', 'meetings'] },
  { id: 'succession_map', title: 'Aide aux plans de succession', description: 'Croiser compétences, potentiel et risques de départ.', impact: 4, ease: 2, roles: ['talent', 'drh', 'hrbp'], tags: ['talent'], humanControl: true },
  { id: 'onboarding_kit', title: 'Kit d’onboarding généré', description: 'Programme d’intégration adapté au poste et à l’équipe.', impact: 3, ease: 5, roles: ['manager', 'recruitment', 'hr_manager'], tags: ['onboarding'] },
  { id: 'team_planning', title: 'Aide à la planification d’équipe', description: 'Construire des scénarios de planning et de charge.', impact: 3, ease: 3, roles: ['manager', 'gm'], tags: ['workforce'] },
];

// ─────────────────────── Training modules ───────────────────────

export const MODULES: ModuleDef[] = [
  { id: 'm_fundamentals', title: 'IA pour RH : fondamentaux & bonnes pratiques', summary: 'Comprendre ce que l’IA change réellement dans les processus RH.', roles: ['*'], tags: ['*'] },
  { id: 'm_prompting', title: 'Prompting RH professionnel', summary: 'Construire des prompts fiables et réutilisables pour vos livrables RH.', roles: ['*'], tags: ['documents', 'faq', 'content'] },
  { id: 'm_recruitment', title: 'IA & Recrutement', summary: 'Du sourcing à la décision : outiller le recrutement sans perdre l’équité.', roles: ['recruitment'], tags: ['jd', 'screening', 'interview', 'candidate_comm'] },
  { id: 'm_learning', title: 'IA & Learning / Formation', summary: 'Concevoir, produire et évaluer plus vite avec l’IA.', roles: ['learning'], tags: ['content', 'design', 'quiz', 'paths', 'needs'] },
  { id: 'm_analytics', title: 'IA & People Analytics', summary: 'Fiabiliser la donnée, automatiser les rapports, interpréter les tendances.', roles: ['analytics'], tags: ['reporting', 'data', 'analytics'] },
  { id: 'm_payroll', title: 'IA & Administration / Paie', summary: 'Contrôles, anomalies et documents : gagner du temps en sécurité.', roles: ['payroll'], tags: ['payroll', 'anomaly', 'reconciliation', 'documents'] },
  { id: 'm_talent', title: 'IA & Talent / Performance', summary: 'Feedback, évaluation et mobilité assistés par l’IA.', roles: ['talent', 'hrbp'], tags: ['performance', 'talent', 'skills'] },
  { id: 'm_relations', title: 'IA & Relations sociales / juridique RH', summary: 'Structurer les dossiers et préparer les échanges, sous contrôle humain.', roles: ['relations'], tags: ['cases', 'policy'] },
  { id: 'm_copilot', title: 'Construire son HR Copilot', summary: 'Assembler un assistant interne appuyé sur vos procédures et vos données.', roles: ['*'], tags: ['faq', 'policy', 'reporting'] },
  { id: 'm_governance', title: 'Gouvernance, confidentialité et Responsible AI', summary: 'Cadre d’usage, données personnelles et contrôle humain.', roles: ['*'], tags: ['*'] },
];

export const GOVERNANCE_REMINDERS = [
  'Toute décision individuelle (recrutement, sanction, rémunération) reste validée par un humain.',
  'Ne saisissez jamais de données nominatives sensibles dans un outil non validé par votre entreprise.',
  'Vérifiez systématiquement les chiffres, dates et références juridiques produits par l’IA.',
  'Documentez vos usages : prompt, source utilisée, contrôle réalisé.',
  'Informez les collaborateurs concernés lorsque l’IA intervient dans un processus RH.',
];

export const QUICK_WIN_LIBRARY: Record<string, string[]> = {
  reporting: ['Faites reformuler votre dernier reporting en 5 messages clés pour la direction.'],
  documents: ['Créez un modèle de courrier RH réutilisable et testez-le sur deux cas réels.'],
  faq: ['Listez vos 10 questions les plus fréquentes et rédigez les réponses de référence.'],
  screening: ['Définissez une grille de 5 critères et testez-la sur 3 CV déjà traités.'],
  payroll: ['Faites contrôler un extrait de paie anonymisé à la recherche d’incohérences.'],
  content: ['Générez le plan détaillé de votre prochaine formation en 10 minutes.'],
  meetings: ['Faites structurer le compte rendu de votre prochaine réunion RH.'],
  data: ['Faites détecter doublons et valeurs manquantes sur une extraction anonymisée.'],
  performance: ['Reformulez un feedback difficile de façon factuelle et respectueuse.'],
  default: [
    'Choisissez une tâche répétitive et chronométrez-la avant / après usage de l’IA.',
    'Constituez un dossier de 3 prompts réutilisables pour votre fonction.',
    'Identifiez une donnée que vous cherchez chaque semaine et centralisez-la.',
  ],
};
