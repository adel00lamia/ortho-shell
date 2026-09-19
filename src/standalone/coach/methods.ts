/** The four interview techniques used for guided practice. */
export type InterviewMethod = {
  key: string;
  time: string;
  title: string;
  use: string;
  steps: string[];
  opener: string;
  example: string;
  question: string;
};

export const interviewMethods = (fr: boolean): InterviewMethod[] => [
  {
    key: 'pitch-3',
    time: '01:47',
    title: fr ? 'Le pitch en 3 étapes' : 'The 3-step pitch',
    use: fr ? 'Pour répondre simplement à « Présentez-vous ».' : 'To answer “Tell me about yourself” simply.',
    steps: fr
      ? ['Qui es-tu ?', 'Que recherches-tu ?', 'Pourquoi ce poste ?']
      : ['Who are you?', 'What are you looking for?', 'Why this role?'],
    opener: fr ? '« Je suis…, avec… d’expérience. Je souhaite… Ce poste… »' : '“I am…, with… experience. I want to… This role…”',
    example: fr
      ? 'Je suis Thomas, avec 6 ans d’expérience en Business Intelligence. Je souhaite évoluer comme chef de projet. Ce poste correspond à mon envie de piloter des projets utiles et des équipes.'
      : 'I am Thomas, with six years of Business Intelligence experience. I want to grow into project management. This role matches my goal of leading useful projects and teams.',
    question: fr ? 'Présentez-vous en une minute.' : 'Tell me about yourself in one minute.',
  },
  {
    key: 'star',
    time: '02:17',
    title: fr ? 'La méthode STAR' : 'The STAR method',
    use: fr ? 'Pour raconter une expérience concrète sans se disperser.' : 'To explain a real experience without losing focus.',
    steps: fr ? ['Situation', 'Tâche', 'Action', 'Résultat'] : ['Situation', 'Task', 'Action', 'Result'],
    opener: fr ? '« Pour vous donner un exemple concret… Mon rôle était… J’ai… Résultat… »' : '“Let me give you a concrete example… My role was… I… As a result…”',
    example: fr
      ? 'Lors d’un projet en retard, je devais sécuriser la livraison. J’ai repriorisé les tâches et instauré un point quotidien. Nous avons livré à la date prévue et réduit les erreurs.'
      : 'When a project fell behind, I had to secure delivery. I reprioritized tasks and introduced a daily check-in. We delivered on time and reduced errors.',
    question: fr ? 'Parlez-moi d’une situation difficile que vous avez bien gérée.' : 'Tell me about a difficult situation you handled well.',
  },
  {
    key: 'past-present-future',
    time: '03:25',
    title: fr ? 'Passé / Présent / Futur' : 'Past / Present / Future',
    use: fr ? 'Pour donner un fil logique à ton parcours et à ton projet.' : 'To connect your background, current role, and next goal.',
    steps: fr
      ? ['Passé : d’où tu viens', 'Présent : ce que tu fais', 'Futur : où tu veux aller']
      : ['Past: where you come from', 'Present: what you do', 'Future: where you want to go'],
    opener: fr ? '« J’ai commencé par… Aujourd’hui… Je souhaite maintenant… »' : '“I started with… Today… I now want to…”',
    example: fr
      ? 'J’ai commencé en analyse de données. Aujourd’hui, je transforme les besoins métiers en tableaux de bord. Je souhaite maintenant piloter des projets BI de bout en bout.'
      : 'I started in data analysis. Today, I turn business needs into dashboards. I now want to lead BI projects end to end.',
    question: fr ? 'Pouvez-vous me résumer votre parcours et votre projet professionnel ?' : 'Can you summarize your background and career goal?',
  },
  {
    key: 'impact',
    time: '04:08',
    title: fr ? 'Le pitch impactant' : 'The impactful pitch',
    use: fr ? 'Pour retenir l’attention avec une preuve et une valeur claire.' : 'To earn attention with proof and clear value.',
    steps: fr
      ? ['Une accroche claire', 'Une preuve concrète', 'La valeur pour le poste']
      : ['A clear hook', 'Concrete proof', 'Value for the role'],
    opener: fr ? '« Ma force, c’est… Je l’ai démontré en… Je veux l’apporter à… »' : '“My strength is… I proved it by… I want to bring it to…”',
    example: fr
      ? 'Ma force est de rendre les données utiles aux décisions. J’ai simplifié un reporting complexe pour accélérer les arbitrages. Je veux apporter cette clarté à vos projets.'
      : 'My strength is making data useful for decisions. I simplified complex reporting to speed up decisions. I want to bring that clarity to your projects.',
    question: fr ? 'En une minute, qu’est-ce qui vous distingue pour ce poste ?' : 'In one minute, what sets you apart for this role?',
  },
];
