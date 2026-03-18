// Training Content Template Library
// 10 specialties × 3 audience levels = 30 curated templates

export type AudienceLevel = 'executive' | 'manager' | 'operational';
export type ContentDepth = 'strategic' | 'advanced' | 'practical';

export interface TrainingSlide {
  title: string;
  content: string;
  type: 'text' | 'video' | 'exercise' | 'resource';
  exerciseInstructions?: string;
}

export interface TrainingQuiz {
  question: string;
  options: string[];
  correct: number;
}

export interface TrainingTemplate {
  id: string;
  specialty: string;
  specialtyIcon: string;
  title: string;
  description: string;
  audienceLevel: AudienceLevel;
  contentDepth: ContentDepth;
  durationHours: number;
  skills: string[];
  targetAudience: string[];
  slides: TrainingSlide[];
  quiz: TrainingQuiz[];
  script: string;
}

export const SPECIALTIES = [
  { id: 'cybersecurity', label: 'Cybersécurité & IT', icon: '🔐' },
  { id: 'digital-marketing', label: 'Marketing Digital', icon: '📱' },
  { id: 'project-management', label: 'Gestion de Projet', icon: '📊' },
  { id: 'leadership', label: 'Leadership & Management', icon: '👔' },
  { id: 'finance', label: 'Finance & Comptabilité', icon: '💰' },
  { id: 'human-resources', label: 'Ressources Humaines', icon: '👥' },
  { id: 'sales', label: 'Vente & Négociation', icon: '🤝' },
  { id: 'quality-lean', label: 'Qualité & Lean', icon: '⚙️' },
  { id: 'hse', label: 'Hygiène, Sécurité & Environnement', icon: '🦺' },
  { id: 'soft-skills', label: 'Communication & Soft Skills', icon: '💬' },
] as const;

export const AUDIENCE_LEVELS: { id: AudienceLevel; label: string; description: string; color: string }[] = [
  { id: 'executive', label: 'Direction', description: 'Contenu stratégique et concis pour les dirigeants', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'manager', label: 'Manager', description: 'Contenu avancé et détaillé pour les responsables', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'operational', label: 'Opérationnel', description: 'Contenu pratique et intermédiaire pour les équipes', color: 'text-green-600 bg-green-50 border-green-200' },
];

const createTemplate = (
  specialty: string,
  specialtyIcon: string,
  level: AudienceLevel,
  depth: ContentDepth,
  data: Omit<TrainingTemplate, 'id' | 'specialty' | 'specialtyIcon' | 'audienceLevel' | 'contentDepth'>
): TrainingTemplate => ({
  id: `${specialty}-${level}`,
  specialty,
  specialtyIcon,
  audienceLevel: level,
  contentDepth: depth,
  ...data,
});

export const TRAINING_TEMPLATES: TrainingTemplate[] = [
  // ═══════════════════════════════════════
  // 1. CYBERSECURITY & IT
  // ═══════════════════════════════════════
  createTemplate('cybersecurity', '🔐', 'executive', 'strategic', {
    title: 'Cybersécurité : Enjeux Stratégiques pour la Direction',
    description: 'Vision stratégique de la cybersécurité : risques business, conformité réglementaire et gouvernance de la sécurité informatique.',
    durationHours: 2,
    skills: ['Gouvernance cyber', 'Gestion des risques', 'Conformité RGPD'],
    targetAudience: ['DG', 'Comité de direction', 'DSI'],
    slides: [
      { title: 'Panorama des menaces 2025', content: 'Les cyberattaques coûtent en moyenne 4,45M$ par incident. Les ransomwares ciblent désormais les PME. 60% des entreprises attaquées ferment dans les 6 mois. La question n\'est plus "si" mais "quand" votre organisation sera ciblée.', type: 'text' },
      { title: 'Impact business des cyberattaques', content: 'Arrêt d\'activité (3 à 21 jours en moyenne), perte de données clients, atteinte à la réputation, sanctions réglementaires RGPD jusqu\'à 4% du CA mondial. Cas concrets : Colonial Pipeline, hôpitaux français.', type: 'text' },
      { title: 'Cadre réglementaire et conformité', content: 'RGPD, NIS2, DORA pour le secteur financier. Obligations de notification sous 72h. Responsabilité personnelle du dirigeant en cas de négligence. Audit de conformité : les 5 points essentiels.', type: 'text' },
      { title: 'Gouvernance de la cybersécurité', content: 'Organisation type : RSSI, SOC, CERT. Budget recommandé : 5-10% du budget IT. KPIs de pilotage : temps de détection, temps de remédiation, couverture des actifs critiques.', type: 'text' },
      { title: 'Plan d\'action stratégique', content: '1) Cartographie des actifs critiques 2) Évaluation des risques 3) Plan de continuité d\'activité 4) Assurance cyber 5) Formation et sensibilisation des équipes. ROI de la cybersécurité : chaque euro investi en prévention évite 7€ de coûts d\'incident.', type: 'text' },
    ],
    quiz: [
      { question: 'Quel est le coût moyen d\'une cyberattaque pour une entreprise ?', options: ['500K$', '1M$', '4,45M$', '10M$'], correct: 2 },
      { question: 'Quel pourcentage du budget IT est recommandé pour la cybersécurité ?', options: ['1-2%', '5-10%', '15-20%', '25-30%'], correct: 1 },
      { question: 'Sous quel délai une violation RGPD doit-elle être notifiée ?', options: ['24h', '48h', '72h', '7 jours'], correct: 2 },
    ],
    script: 'Mesdames et messieurs les membres du comité de direction, la cybersécurité n\'est plus un sujet technique réservé à la DSI. C\'est un enjeu stratégique qui engage la survie de l\'entreprise. Nous allons voir en 2 heures les risques majeurs, vos obligations légales, et les décisions clés à prendre pour protéger l\'organisation.',
  }),

  createTemplate('cybersecurity', '🔐', 'manager', 'advanced', {
    title: 'Cybersécurité Avancée pour Managers IT',
    description: 'Gestion opérationnelle de la sécurité : politiques, réponse aux incidents, gestion d\'équipe SOC et métriques de performance.',
    durationHours: 8,
    skills: ['Gestion d\'incidents', 'SIEM', 'Politique de sécurité', 'ISO 27001', 'SOC Management'],
    targetAudience: ['Responsables IT', 'Managers cybersécurité', 'RSSI adjoints'],
    slides: [
      { title: 'Architecture de sécurité en profondeur', content: 'Modèle de défense en couches : périmétrique (firewall, WAF), réseau (segmentation, IDS/IPS), endpoint (EDR, XDR), applicatif (SAST, DAST), données (chiffrement, DLP). Zero Trust Architecture : "Never trust, always verify".', type: 'text' },
      { title: 'Gestion des vulnérabilités', content: 'Cycle de vie des vulnérabilités : découverte, classification CVSS, priorisation, remédiation, vérification. Outils : Nessus, Qualys, OpenVAS. SLA de remédiation : critique <24h, haute <7j, moyenne <30j, basse <90j.', type: 'text' },
      { title: 'Détection et réponse aux incidents', content: 'Framework NIST : Identification, Protection, Détection, Réponse, Récupération. Playbooks de réponse : ransomware, phishing, fuite de données, compromission de compte. Exercices de simulation : table-top et red team.', type: 'text' },
      { title: 'ISO 27001 et cadres de gouvernance', content: 'Structure du SMSI (Système de Management de la Sécurité de l\'Information). Annexe A : 114 mesures de sécurité réparties en 14 domaines. Cycle PDCA appliqué à la sécurité. Certification : étapes et coûts.', type: 'text' },
      { title: 'Gestion d\'équipe SOC', content: 'Organisation du SOC : niveaux L1/L2/L3, rotation des analystes, prévention du burnout. Métriques clés : MTTD (temps moyen de détection), MTTR (temps moyen de remédiation), taux de faux positifs, couverture des assets.', type: 'text' },
      { title: 'Threat Intelligence et veille', content: 'Sources de threat intelligence : CERT-FR, ANSSI, MITRE ATT&CK. IOC (Indicators of Compromise) et TTP (Tactics, Techniques, Procedures). Intégration dans le SIEM. Partage d\'information : STIX/TAXII.', type: 'text' },
      { title: 'Sécurité Cloud et DevSecOps', content: 'Modèle de responsabilité partagée (IaaS, PaaS, SaaS). CSPM et CWPP. Intégration sécurité dans le pipeline CI/CD. Container security : scan d\'images, runtime protection. Infrastructure as Code security.', type: 'text' },
      { title: 'Exercice pratique : Simulation d\'incident', content: 'Scénario : Détection d\'un ransomware en cours de propagation. Étapes : confinement, éradication, récupération, communication de crise, analyse post-incident.', type: 'exercise', exerciseInstructions: 'En groupes de 4, simulez la réponse à un incident ransomware. Utilisez le playbook fourni. Documentez chaque décision et son justificatif. Temps : 45 minutes + 15 minutes de restitution.' },
      { title: 'Budget et reporting sécurité', content: 'Construction du budget cyber : CAPEX vs OPEX. Justification ROI auprès de la direction. Tableaux de bord : KPIs techniques et business. Reporting au COMEX : fréquence et contenu.', type: 'text' },
      { title: 'Plan d\'amélioration continue', content: 'Maturité cybersécurité : modèle CMMI adapté. Audit interne et externe. Tests de pénétration : fréquence et scope. Retours d\'expérience et lessons learned.', type: 'text' },
    ],
    quiz: [
      { question: 'Quel est le SLA recommandé pour une vulnérabilité critique ?', options: ['1 heure', 'Moins de 24h', 'Moins de 7 jours', 'Moins de 30 jours'], correct: 1 },
      { question: 'Que signifie MTTD ?', options: ['Mean Time To Deploy', 'Mean Time To Detect', 'Maximum Time To Defend', 'Minimum Threat To Database'], correct: 1 },
      { question: 'Combien de mesures de sécurité contient l\'Annexe A de l\'ISO 27001 ?', options: ['50', '93', '114', '200'], correct: 2 },
      { question: 'Quel framework décrit les phases Identification, Protection, Détection, Réponse, Récupération ?', options: ['ISO 27001', 'NIST CSF', 'COBIT', 'ITIL'], correct: 1 },
      { question: 'Que signifie Zero Trust ?', options: ['Aucun accès à Internet', 'Never trust, always verify', 'Zéro budget sécurité', 'Pas de mot de passe'], correct: 1 },
    ],
    script: 'Bienvenue dans cette formation avancée en cybersécurité. Cette journée s\'adresse aux managers qui pilotent la sécurité au quotidien. Nous allons couvrir l\'architecture de défense, la gestion d\'incidents, les frameworks de gouvernance, et la gestion d\'équipe SOC. Prévoyez des exercices pratiques cet après-midi.',
  }),

  createTemplate('cybersecurity', '🔐', 'operational', 'practical', {
    title: 'Bonnes Pratiques Cybersécurité au Quotidien',
    description: 'Sensibilisation pratique : mots de passe, phishing, navigation sécurisée, protection des données et réflexes en cas d\'incident.',
    durationHours: 4,
    skills: ['Hygiène numérique', 'Détection phishing', 'Gestion mots de passe', 'Protection données'],
    targetAudience: ['Tous les collaborateurs', 'Nouveaux arrivants'],
    slides: [
      { title: 'Les menaces qui vous concernent', content: 'Le phishing représente 90% des cyberattaques réussies. Un clic sur un lien malveillant peut compromettre toute l\'entreprise. Exemples concrets de phishing reçus dans notre secteur.', type: 'text' },
      { title: 'Reconnaître un email de phishing', content: 'Les 7 indices : expéditeur suspect, urgence artificielle, fautes d\'orthographe, lien masqué, pièce jointe inattendue, demande d\'informations sensibles, offre trop belle. Exercice : analyser 5 emails suspects.', type: 'exercise', exerciseInstructions: 'Examinez les 5 emails affichés et identifiez lesquels sont des tentatives de phishing. Justifiez votre réponse en citant les indices repérés.' },
      { title: 'Mots de passe robustes', content: 'Règles : minimum 12 caractères, unique par compte, utiliser un gestionnaire de mots de passe. Les pires mots de passe : 123456, password, azerty. Démonstration : temps de cassage selon la complexité.', type: 'text' },
      { title: 'Authentification à deux facteurs (2FA)', content: 'Comment ça marche : quelque chose que vous savez + quelque chose que vous avez. Types : SMS (faible), application (recommandé), clé physique (optimal). Activation sur vos comptes professionnels et personnels.', type: 'text' },
      { title: 'Navigation et téléchargements sécurisés', content: 'Vérifier le HTTPS et le cadenas. Ne jamais télécharger de logiciels depuis des sources non officielles. WiFi public : utiliser le VPN d\'entreprise. Signaler les sites suspects.', type: 'text' },
      { title: 'Protection des données sensibles', content: 'Classification des données : publique, interne, confidentielle, secrète. Règles de partage et de stockage pour chaque niveau. Chiffrement des clés USB et portables. Clean desk policy.', type: 'text' },
      { title: 'Exercice : Que faire en cas d\'incident ?', content: 'Scénarios : vous avez cliqué sur un lien suspect, vous avez reçu un appel demandant votre mot de passe, vous avez perdu votre ordinateur portable, un collègue vous envoie un fichier inhabituel.', type: 'exercise', exerciseInstructions: 'Pour chaque scénario, décrivez les actions à entreprendre immédiatement. Qui contacter ? Quelles informations fournir ?' },
      { title: 'Les bons réflexes au quotidien', content: 'Verrouiller son poste (Win+L ou Ctrl+Cmd+Q). Ne pas brancher de clés USB trouvées. Signaler tout comportement suspect. Mettre à jour ses logiciels. Sauvegarder ses données.', type: 'text' },
    ],
    quiz: [
      { question: 'Quel pourcentage des cyberattaques commence par du phishing ?', options: ['30%', '50%', '70%', '90%'], correct: 3 },
      { question: 'Quelle est la longueur minimale recommandée pour un mot de passe ?', options: ['6 caractères', '8 caractères', '12 caractères', '20 caractères'], correct: 2 },
      { question: 'Quel type de 2FA est le plus sécurisé ?', options: ['SMS', 'Email', 'Application', 'Clé physique'], correct: 3 },
      { question: 'Que devez-vous faire si vous cliquez sur un lien suspect ?', options: ['Rien, c\'est probablement sans danger', 'Éteindre l\'ordinateur', 'Signaler immédiatement à la DSI', 'Changer votre fond d\'écran'], correct: 2 },
    ],
    script: 'Bonjour à tous ! Aujourd\'hui nous allons parler de cybersécurité, mais pas de manière technique. On va voir ensemble les gestes simples qui protègent votre entreprise et vos données personnelles. Pas besoin d\'être un expert : il suffit de connaître les bons réflexes.',
  }),

  // ═══════════════════════════════════════
  // 2. DIGITAL MARKETING
  // ═══════════════════════════════════════
  createTemplate('digital-marketing', '📱', 'executive', 'strategic', {
    title: 'Stratégie Digitale : Vision et ROI pour la Direction',
    description: 'Comprendre les leviers du marketing digital, mesurer le ROI et piloter la transformation digitale de l\'entreprise.',
    durationHours: 2,
    skills: ['Stratégie digitale', 'ROI marketing', 'Transformation digitale'],
    targetAudience: ['DG', 'Directeurs marketing', 'Comité de direction'],
    slides: [
      { title: 'L\'écosystème digital en 2025', content: 'Les consommateurs passent 7h/jour en ligne. 80% des parcours d\'achat B2B commencent par une recherche Google. Les réseaux sociaux influencent 71% des décisions d\'achat. L\'IA générative transforme la création de contenu.', type: 'text' },
      { title: 'Les piliers de la stratégie digitale', content: 'SEO/SEA pour la visibilité, Content Marketing pour l\'autorité, Social Media pour l\'engagement, Email Marketing pour la conversion, Data Analytics pour l\'optimisation. Chaque pilier génère un ROI mesurable.', type: 'text' },
      { title: 'Mesurer le ROI digital', content: 'CAC (Coût d\'Acquisition Client), LTV (Lifetime Value), ROAS (Return On Ad Spend). Benchmark par secteur. Attribution multi-touch. Dashboard de pilotage pour la direction.', type: 'text' },
      { title: 'Budget et allocation des ressources', content: 'Répartition recommandée du budget digital par canal. Internaliser vs externaliser. Compétences clés à recruter. Outils essentiels et leur coût.', type: 'text' },
      { title: 'Feuille de route digitale', content: 'Quick wins à 3 mois, objectifs à 6 mois, vision à 12 mois. KPIs de suivi. Gouvernance du digital : rôles et responsabilités.', type: 'text' },
    ],
    quiz: [
      { question: 'Quel pourcentage des parcours d\'achat B2B commence en ligne ?', options: ['40%', '60%', '80%', '95%'], correct: 2 },
      { question: 'Que mesure le ROAS ?', options: ['La satisfaction client', 'Le retour sur investissement publicitaire', 'Le taux de rebond', 'Le nombre de followers'], correct: 1 },
    ],
    script: 'Dirigeants, le digital n\'est plus optionnel. C\'est le premier canal d\'acquisition et de relation client pour la majorité des secteurs. En 2 heures, je vais vous montrer comment piloter votre stratégie digitale avec des indicateurs concrets et des décisions budgétaires éclairées.',
  }),

  createTemplate('digital-marketing', '📱', 'manager', 'advanced', {
    title: 'Marketing Digital Avancé : Stratégie Multicanale',
    description: 'Maîtriser les leviers avancés : SEO technique, campagnes paid, marketing automation, analytics et optimisation des conversions.',
    durationHours: 12,
    skills: ['SEO avancé', 'Google Ads', 'Meta Ads', 'Marketing Automation', 'CRO', 'Analytics'],
    targetAudience: ['Responsables marketing', 'Chefs de projet digital', 'Growth managers'],
    slides: [
      { title: 'SEO technique et sémantique', content: 'Core Web Vitals, architecture de site, maillage interne, schema markup. Recherche de mots-clés avancée : intention de recherche, clusters thématiques. Suivi de positionnement et audit SEO.', type: 'text' },
      { title: 'Campagnes Google Ads performantes', content: 'Structure de compte optimale. Types de campagnes : Search, Display, Shopping, Performance Max. Quality Score et stratégies d\'enchères. Budget allocation et scaling.', type: 'text' },
      { title: 'Social Ads : Meta, LinkedIn, TikTok', content: 'Targeting avancé et audiences similaires. Creative testing : framework AIDA pour les visuels. Funnel publicitaire : awareness > consideration > conversion. Retargeting et séquences.', type: 'text' },
      { title: 'Marketing Automation', content: 'Workflows d\'automatisation : welcome series, nurturing, réactivation, abandon de panier. Scoring et segmentation. Outils : HubSpot, Mailchimp, ActiveCampaign. Mesurer l\'engagement.', type: 'text' },
      { title: 'Content Marketing stratégique', content: 'Calendrier éditorial. Formats : blog, vidéo, podcast, infographie, livre blanc. Distribution et amplification. Mesure de performance : trafic, engagement, leads générés.', type: 'text' },
      { title: 'Exercice : Audit digital complet', content: 'Réaliser un audit digital d\'une entreprise de votre secteur : SEO, réseaux sociaux, contenu, publicité, email. Identifier les quick wins et les axes d\'amélioration.', type: 'exercise', exerciseInstructions: 'Choisissez un concurrent ou une entreprise référente de votre secteur. Analysez sa présence digitale sur les 5 axes. Préparez un rapport avec recommandations. Temps : 60 minutes.' },
      { title: 'Analytics et Data-Driven Marketing', content: 'GA4 : événements, conversions, segments. Attribution multi-touch. Dashboards personnalisés. A/B testing méthodologique. Data visualization pour le reporting.', type: 'text' },
      { title: 'CRO : Optimisation des Conversions', content: 'Heatmaps et session recordings. Tests A/B : hypothèses, taille d\'échantillon, significativité. Landing pages performantes. UX Writing et micro-copy.', type: 'text' },
      { title: 'IA et Marketing', content: 'ChatGPT pour la création de contenu. IA pour la personnalisation à grande échelle. Outils IA : Jasper, Midjourney, Copy.ai. Limites et bonnes pratiques éthiques.', type: 'text' },
      { title: 'Plan marketing digital annuel', content: 'Méthodologie de planification. Allocation budgétaire par trimestre. Objectifs SMART par canal. Calendrier d\'actions et jalons de review.', type: 'text' },
    ],
    quiz: [
      { question: 'Qu\'est-ce que le Quality Score dans Google Ads ?', options: ['Le score de qualité du site web', 'Une note de pertinence de l\'annonce', 'Le taux de conversion', 'Le budget quotidien'], correct: 1 },
      { question: 'Que signifie CRO ?', options: ['Customer Relationship Optimization', 'Conversion Rate Optimization', 'Content Reach Optimization', 'Campaign Revenue Output'], correct: 1 },
      { question: 'Quel outil Google remplace Universal Analytics ?', options: ['Google Tag Manager', 'GA4', 'Google Search Console', 'Google Data Studio'], correct: 1 },
      { question: 'Quelle est la meilleure pratique pour un test A/B ?', options: ['Tester 10 variantes à la fois', 'Arrêter dès qu\'on voit une différence', 'Attendre la significativité statistique', 'Tester uniquement la couleur du bouton'], correct: 2 },
    ],
    script: 'Cette formation de 2 jours va vous transformer en stratège digital complet. On va aller au-delà des bases : SEO technique, campagnes paid optimisées, automation, et analytics avancés. Chaque module inclut des exercices pratiques sur vos propres données.',
  }),

  createTemplate('digital-marketing', '📱', 'operational', 'practical', {
    title: 'Les Fondamentaux du Marketing Digital',
    description: 'Premiers pas dans le marketing digital : réseaux sociaux, email, SEO basique, création de contenu et outils essentiels.',
    durationHours: 6,
    skills: ['Réseaux sociaux', 'Email marketing', 'SEO basique', 'Création de contenu'],
    targetAudience: ['Équipes marketing junior', 'Assistants communication', 'Community managers'],
    slides: [
      { title: 'Introduction au marketing digital', content: 'Différence entre marketing traditionnel et digital. Les canaux principaux : site web, réseaux sociaux, email, publicité en ligne. Le parcours client digital : de la découverte à la fidélisation.', type: 'text' },
      { title: 'Créer du contenu engageant', content: 'Formats qui marchent : vidéo courte, carrousel, infographie, stories. Outils gratuits : Canva, CapCut, ChatGPT. Calendrier éditorial simple. Storytelling : raconter une histoire, pas vendre un produit.', type: 'text' },
      { title: 'Exercice : Créer un post performant', content: 'Créez un post LinkedIn ou Instagram pour promouvoir un produit/service de votre entreprise en appliquant les techniques vues.', type: 'exercise', exerciseInstructions: 'Utilisez Canva pour créer le visuel. Rédigez un texte avec hook, valeur, et appel à l\'action. Choisissez les hashtags pertinents. Temps : 30 minutes.' },
      { title: 'SEO : Être trouvé sur Google', content: 'Comment Google classe les pages. Mots-clés : comment les trouver et les utiliser. Optimiser une page : titre, méta-description, contenu, images. Google My Business pour le local.', type: 'text' },
      { title: 'Email marketing efficace', content: 'Construire sa liste d\'emails (légalement). Structure d\'un email qui convertit : objet, preview, corps, CTA. Fréquence d\'envoi. Éviter les spams. Outils : Mailchimp, Brevo.', type: 'text' },
      { title: 'Mesurer ses résultats', content: 'Les métriques essentielles : impressions, portée, engagement, clics, conversions. Lire un rapport analytics de base. Optimiser en fonction des résultats.', type: 'text' },
    ],
    quiz: [
      { question: 'Quel format de contenu génère le plus d\'engagement sur les réseaux sociaux ?', options: ['Texte seul', 'Image statique', 'Vidéo courte', 'Lien externe'], correct: 2 },
      { question: 'Que signifie SEO ?', options: ['Social Engagement Optimization', 'Search Engine Optimization', 'Sales Email Outreach', 'Site Efficiency Online'], correct: 1 },
      { question: 'Quel est l\'outil gratuit recommandé pour créer des visuels ?', options: ['Photoshop', 'Canva', 'InDesign', 'Sketch'], correct: 1 },
    ],
    script: 'Bienvenue dans le monde du marketing digital ! Pas besoin d\'être un expert technique. On va voir ensemble les outils et techniques accessibles à tous pour promouvoir votre entreprise en ligne. À la fin de la journée, vous aurez créé vos premiers contenus.',
  }),

  // ═══════════════════════════════════════
  // 3. PROJECT MANAGEMENT
  // ═══════════════════════════════════════
  createTemplate('project-management', '📊', 'executive', 'strategic', {
    title: 'Gouvernance de Projet : Pilotage Stratégique',
    description: 'Supervision du portefeuille de projets, arbitrage budgétaire, gestion des priorités et alignement stratégique.',
    durationHours: 2,
    skills: ['Portfolio management', 'Arbitrage stratégique', 'Gouvernance projet'],
    targetAudience: ['DG', 'Sponsors de projets', 'Directeurs de département'],
    slides: [
      { title: 'Portfolio Management : Vue d\'ensemble', content: 'Pourquoi 70% des projets échouent. L\'importance de la priorisation. Matrice impact/effort pour l\'arbitrage. Alignement projets ↔ stratégie d\'entreprise.', type: 'text' },
      { title: 'Le rôle du sponsor de projet', content: 'Responsabilités clés : lever les obstacles, valider les orientations, arbitrer les conflits de ressources. Les 5 erreurs de sponsoring les plus coûteuses.', type: 'text' },
      { title: 'KPIs de pilotage de portefeuille', content: 'Taux de réussite des projets, respect des délais et budgets, valeur business générée, satisfaction client interne. Dashboard de pilotage trimestriel.', type: 'text' },
      { title: 'Décisions d\'arrêt et réorientation', content: 'Quand tuer un projet : signaux d\'alerte, coût de l\'entêtement (sunk cost fallacy). Processus de gate review. Communication d\'un arrêt de projet.', type: 'text' },
    ],
    quiz: [
      { question: 'Quel pourcentage des projets échouent selon les études ?', options: ['30%', '50%', '70%', '90%'], correct: 2 },
      { question: 'Qu\'est-ce que le sunk cost fallacy ?', options: ['Investir plus car on a déjà beaucoup investi', 'Arrêter un projet trop tôt', 'Sous-estimer les coûts', 'Négliger les risques'], correct: 0 },
    ],
    script: 'Dirigeants, votre rôle dans la réussite des projets est crucial. En tant que sponsors, vos décisions d\'allocation de ressources et d\'arbitrage déterminent directement le taux de succès du portefeuille.',
  }),

  createTemplate('project-management', '📊', 'manager', 'advanced', {
    title: 'Gestion de Projet Avancée : Agile & Hybride',
    description: 'Méthodologies avancées (Scrum, Kanban, SAFe), gestion des risques, pilotage financier et leadership de projet.',
    durationHours: 12,
    skills: ['Scrum', 'Kanban', 'Gestion des risques', 'Pilotage budgétaire', 'Leadership de projet'],
    targetAudience: ['Chefs de projet', 'Scrum Masters', 'Product Owners', 'PMO'],
    slides: [
      { title: 'Agile vs Waterfall vs Hybride', content: 'Critères de choix : complexité, incertitude, taille d\'équipe, culture d\'entreprise. Framework de décision. La réalité du terrain : 80% des projets sont hybrides.', type: 'text' },
      { title: 'Scrum en profondeur', content: 'Rôles (PO, SM, Dev Team), événements (Sprint Planning, Daily, Review, Retro), artefacts (Backlog, Sprint Backlog, Increment). Definition of Done. Vélocité et burndown.', type: 'text' },
      { title: 'Kanban avancé', content: 'WIP limits, classes de service, politiques explicites, boucles de feedback. Métriques : lead time, cycle time, throughput. Kanban pour les équipes de support et maintenance.', type: 'text' },
      { title: 'Gestion des risques projet', content: 'Identification : brainstorming, checklist, SWOT. Analyse : matrice probabilité × impact. Stratégies : éviter, transférer, atténuer, accepter. Registre des risques vivant.', type: 'text' },
      { title: 'Pilotage financier de projet', content: 'Earned Value Management : CPI, SPI, EAC, ETC. Courbe en S. Reporting financier mensuel. Gestion du budget de contingence.', type: 'text' },
      { title: 'Exercice : Planning de sprint', content: 'À partir d\'un backlog fourni, réalisez un sprint planning complet : priorisation, estimation, engagement d\'équipe.', type: 'exercise', exerciseInstructions: 'Backlog de 30 user stories. Capacité de l\'équipe : 40 story points. Estimez chaque story (planning poker), priorisez et sélectionnez le sprint backlog. Temps : 45 minutes.' },
      { title: 'Communication et parties prenantes', content: 'Matrice RACI. Plan de communication adapté par stakeholder. Techniques de gestion des conflits. Reporting : adapter le message à l\'audience.', type: 'text' },
      { title: 'Outils de gestion de projet', content: 'Comparatif : Jira, Asana, Monday, MS Project, Notion. Critères de choix. Intégrations et automatisations. Templates et workflows.', type: 'resource' },
      { title: 'Scaling Agile : SAFe et LeSS', content: 'Quand scaler ? Frameworks disponibles. Program Increment (PI) Planning. Release Train Engineer. Coordination multi-équipes.', type: 'text' },
      { title: 'Rétrospective et amélioration continue', content: 'Formats de rétro : Start/Stop/Continue, 4L, Sailboat. Créer un environnement de confiance. Actions concrètes et suivi. Métriques d\'équipe sur le long terme.', type: 'text' },
    ],
    quiz: [
      { question: 'Que mesure le CPI en Earned Value Management ?', options: ['Cost Performance Index', 'Critical Path Index', 'Customer Priority Index', 'Change Process Indicator'], correct: 0 },
      { question: 'Quel est le rôle principal du Scrum Master ?', options: ['Gérer le backlog', 'Faciliter et supprimer les obstacles', 'Développer les features', 'Approuver le budget'], correct: 1 },
      { question: 'Qu\'est-ce que le WIP limit en Kanban ?', options: ['Work In Progress limit', 'Weekly Inspection Point', 'Workflow Integration Protocol', 'Workload Impact Plan'], correct: 0 },
      { question: 'Combien de user stories maximum dans un sprint backlog (équipe de 5) ?', options: ['5-8', '8-12', '15-20', 'Pas de limite'], correct: 1 },
      { question: 'Que signifie RACI ?', options: ['Responsible Accountable Consulted Informed', 'Review Approve Create Implement', 'Risk Assessment Control Improvement', 'Resource Allocation Cost Index'], correct: 0 },
    ],
    script: 'Bienvenue dans cette formation avancée en gestion de projet. Pendant 2 jours, nous allons approfondir les méthodologies agiles, la gestion des risques et le pilotage financier. L\'accent est mis sur la pratique : vous travaillerez sur des cas réels.',
  }),

  createTemplate('project-management', '📊', 'operational', 'practical', {
    title: 'Initiation à la Gestion de Projet',
    description: 'Les bases de la gestion de projet : planification, suivi, outils collaboratifs et communication d\'équipe.',
    durationHours: 6,
    skills: ['Planification', 'Suivi de tâches', 'Outils collaboratifs', 'Communication projet'],
    targetAudience: ['Membres d\'équipe projet', 'Contributeurs', 'Nouveaux chefs de projet'],
    slides: [
      { title: 'Qu\'est-ce qu\'un projet ?', content: 'Définition : effort temporaire pour créer un résultat unique. Les phases : initiation, planification, exécution, clôture. Les contraintes : scope, temps, coût (triangle d\'or).', type: 'text' },
      { title: 'Définir les objectifs SMART', content: 'Spécifique, Mesurable, Atteignable, Réaliste, Temporel. Exemples de bons et mauvais objectifs. Exercice : reformuler des objectifs flous en objectifs SMART.', type: 'exercise', exerciseInstructions: 'Transformez ces 5 objectifs vagues en objectifs SMART : "Améliorer les ventes", "Réduire les coûts", "Former les équipes", "Lancer le nouveau site", "Améliorer la satisfaction client".' },
      { title: 'Planifier avec un diagramme de Gantt', content: 'Découper en tâches, estimer les durées, identifier les dépendances, identifier le chemin critique. Outils simples : Excel, Trello, Asana.', type: 'text' },
      { title: 'Suivre l\'avancement', content: 'Réunions de suivi : stand-up quotidien de 15 min. Tableau de bord simple : vert/orange/rouge. Signaler les blocages rapidement. Mise à jour du planning.', type: 'text' },
      { title: 'Communiquer dans un projet', content: 'Compte-rendu de réunion efficace. Email de suivi structuré. Escalade : quand et comment remonter un problème. Outils : Teams, Slack, Notion.', type: 'text' },
      { title: 'Clôturer un projet', content: 'Vérifier les livrables, documenter les leçons apprises, célébrer les réussites, transférer au run/support. Template de bilan de projet.', type: 'text' },
    ],
    quiz: [
      { question: 'Quelles sont les 3 contraintes du triangle d\'or ?', options: ['Qualité, Risques, Ressources', 'Scope, Temps, Coût', 'Equipe, Outils, Processus', 'Client, Sponsor, Manager'], correct: 1 },
      { question: 'Que signifie le S de SMART ?', options: ['Simple', 'Spécifique', 'Stratégique', 'Soutenable'], correct: 1 },
      { question: 'Combien de temps devrait durer un stand-up quotidien ?', options: ['5 min', '15 min', '30 min', '1 heure'], correct: 1 },
    ],
    script: 'Bienvenue dans cette introduction à la gestion de projet ! Que vous soyez contributeur ou nouveau chef de projet, vous allez apprendre les fondamentaux pour organiser, suivre et communiquer efficacement dans vos projets.',
  }),

  // ═══════════════════════════════════════
  // 4. LEADERSHIP & MANAGEMENT
  // ═══════════════════════════════════════
  createTemplate('leadership', '👔', 'executive', 'strategic', {
    title: 'Leadership Transformationnel pour Dirigeants',
    description: 'Développer un leadership visionnaire, conduire le changement et créer une culture d\'entreprise performante.',
    durationHours: 3,
    skills: ['Leadership visionnaire', 'Conduite du changement', 'Culture d\'entreprise'],
    targetAudience: ['DG', 'Comité exécutif', 'Directeurs'],
    slides: [
      { title: 'Les 4 styles de leadership', content: 'Directif, participatif, délégatif, transformationnel. Quand utiliser chaque style. Autoévaluation de votre style dominant. L\'agilité situationnelle.', type: 'text' },
      { title: 'Conduire le changement', content: 'Modèle de Kotter en 8 étapes. Gestion des résistances : comprendre avant de convaincre. Communication de la vision. Quick wins pour créer l\'adhésion.', type: 'text' },
      { title: 'Construire une culture performante', content: 'Valeurs incarnées vs affichées. Rituels managériaux. Autonomie et responsabilisation (empowerment). Feedback continu. Droit à l\'erreur et innovation.', type: 'text' },
      { title: 'Intelligence émotionnelle du leader', content: 'Conscience de soi, gestion des émotions, empathie, gestion des relations. Impact sur la performance de l\'équipe. Développer son QE.', type: 'text' },
      { title: 'Vision et alignement stratégique', content: 'Formuler une vision inspirante. Aligner les objectifs individuels sur la stratégie. OKRs pour l\'exécution. Communication stratégique descendante et ascendante.', type: 'text' },
    ],
    quiz: [
      { question: 'Combien d\'étapes comporte le modèle de Kotter ?', options: ['4', '6', '8', '12'], correct: 2 },
      { question: 'Quel style de leadership est le plus adapté en période de crise urgente ?', options: ['Délégatif', 'Participatif', 'Directif', 'Laissez-faire'], correct: 2 },
    ],
    script: 'Ce séminaire de leadership est conçu pour les dirigeants qui veulent passer d\'un management de contrôle à un leadership d\'inspiration. Nous allons travailler sur votre style, votre vision et votre capacité à conduire le changement.',
  }),

  createTemplate('leadership', '👔', 'manager', 'advanced', {
    title: 'Management d\'Équipe : Du Pilotage à l\'Excellence',
    description: 'Techniques avancées de management : coaching d\'équipe, délégation efficace, gestion des performances et des conflits.',
    durationHours: 10,
    skills: ['Coaching', 'Délégation', 'Gestion de performance', 'Gestion de conflits', 'Feedback'],
    targetAudience: ['Managers confirmés', 'Responsables d\'équipe', 'Directeurs de département'],
    slides: [
      { title: 'Manager-coach : posture et outils', content: 'Du manager contrôleur au manager-coach. Le modèle GROW pour le coaching. Questions ouvertes vs directives. Écoute active et reformulation. Pratiquer le coaching en 1-to-1.', type: 'text' },
      { title: 'Délégation efficace', content: 'Les 5 niveaux de délégation. Matrice compétence × motivation. Fixer des objectifs clairs (SMART). Suivi sans micro-management. Donner le droit à l\'erreur encadré.', type: 'text' },
      { title: 'Feedback constructif', content: 'Méthode DESC (Décrire, Exprimer, Spécifier, Conclure). Feedback positif : aussi important que le correctif. Fréquence : régulier et informel > entretien annuel. Créer une culture du feedback.', type: 'text' },
      { title: 'Exercice : Simulation de feedback', content: 'Jeux de rôle en binômes : donner un feedback constructif sur une situation réelle.', type: 'exercise', exerciseInstructions: 'En binômes, préparez et jouez 2 scénarios de feedback : 1) Performance insuffisante d\'un collaborateur engagé 2) Comportement inadapté d\'un expert. Utilisez la méthode DESC. 20 min par scénario + debrief.' },
      { title: 'Gestion des conflits', content: 'Types de conflits : relationnels, liés à la tâche, de processus. Méthode Thomas-Kilmann. Médiation entre collaborateurs. Prévention : signaux faibles. Quand escalader.', type: 'text' },
      { title: 'Animation de réunions performantes', content: 'Les 7 péchés des réunions. Préparer avec un objectif clair. Techniques de facilitation. Timeboxing. Décisions et actions claires. Les alternatives à la réunion.', type: 'text' },
      { title: 'Gestion de la performance', content: 'Fixer les objectifs en début d\'année. Suivi trimestriel. Entretien annuel : préparer et conduire. Plans de développement individuels. Gérer les sous-performances.', type: 'text' },
      { title: 'Management à distance', content: 'Les spécificités du remote management. Rituels pour maintenir le lien. Outils collaboratifs. Confiance et autonomie. Détecter le désengagement à distance.', type: 'text' },
      { title: 'Diversité et inclusion en management', content: 'Biais inconscients dans le management. Management intergénérationnel. Inclusion des profils atypiques. Équité dans les évaluations et promotions.', type: 'text' },
      { title: 'Plan de développement personnel manager', content: 'Autoévaluation de ses forces et axes d\'amélioration. 360° feedback. Objectifs de développement à 6 mois. Communauté de pratique entre managers.', type: 'text' },
    ],
    quiz: [
      { question: 'Que signifie le G de la méthode GROW ?', options: ['Gain', 'Goal', 'Group', 'Growth'], correct: 1 },
      { question: 'Quelle est la première étape de la méthode DESC ?', options: ['Déterminer', 'Décrire', 'Décider', 'Développer'], correct: 1 },
      { question: 'Combien de styles de gestion de conflits identifie Thomas-Kilmann ?', options: ['3', '4', '5', '7'], correct: 2 },
      { question: 'Quelle est la meilleure fréquence pour le feedback ?', options: ['Annuel', 'Trimestriel', 'Régulier et informel', 'Uniquement en cas de problème'], correct: 2 },
    ],
    script: 'Cette formation intensive de management vous donnera les outils pour passer du pilotage opérationnel à l\'excellence managériale. Beaucoup de mises en situation et de partages d\'expérience entre pairs.',
  }),

  createTemplate('leadership', '👔', 'operational', 'practical', {
    title: 'Premiers Pas en Management',
    description: 'Les fondamentaux pour les nouveaux managers : posture, communication, organisation d\'équipe et premiers entretiens.',
    durationHours: 6,
    skills: ['Posture managériale', 'Communication', 'Organisation', 'Entretiens'],
    targetAudience: ['Nouveaux managers', 'Experts promus managers', 'Team leads'],
    slides: [
      { title: 'De collègue à manager', content: 'Les pièges de la transition. Établir sa légitimité sans autoritarisme. Créer une relation de confiance. Les 100 premiers jours.', type: 'text' },
      { title: 'Communiquer comme un manager', content: 'Être clair et direct. Écouter plus que parler. Adapter son message à l\'interlocuteur. Les réunions d\'équipe efficaces.', type: 'text' },
      { title: 'Organiser le travail d\'équipe', content: 'Répartir les tâches selon les compétences. Prioriser avec la matrice Eisenhower. Planifier la semaine. Gérer les urgences vs l\'important.', type: 'text' },
      { title: 'Exercice : Mon premier 1-to-1', content: 'Préparez et simulez un entretien individuel avec un collaborateur.', type: 'exercise', exerciseInstructions: 'Préparez un 1-to-1 de 20 minutes avec un collaborateur fictif. Objectifs : connaître ses attentes, fixer un objectif, donner un feedback. Utilisez le template fourni.' },
      { title: 'Motiver son équipe', content: 'Les leviers de motivation au-delà du salaire : sens, autonomie, reconnaissance, développement. Célébrer les succès. Créer un esprit d\'équipe.', type: 'text' },
      { title: 'Gérer les situations difficiles', content: 'Collaborateur démotivé, conflit entre collègues, deadline impossible, demande de la hiérarchie. Réflexes et outils pour chaque situation.', type: 'text' },
    ],
    quiz: [
      { question: 'Quel est le piège principal de la transition expert → manager ?', options: ['Tout faire soi-même', 'Déléguer trop vite', 'Changer de bureau', 'Augmenter son salaire'], correct: 0 },
      { question: 'La matrice Eisenhower distingue quelles dimensions ?', options: ['Coût et qualité', 'Urgent et important', 'Facile et difficile', 'Court et long terme'], correct: 1 },
    ],
    script: 'Félicitations pour votre promotion ! Devenir manager, c\'est un nouveau métier. Cette formation va vous donner les bases pour bien démarrer : posture, communication, organisation, et gestion des premières situations délicates.',
  }),

  // ═══════════════════════════════════════
  // 5. FINANCE & ACCOUNTING
  // ═══════════════════════════════════════
  createTemplate('finance', '💰', 'executive', 'strategic', {
    title: 'Finance pour Dirigeants Non-Financiers',
    description: 'Lire et interpréter les états financiers, piloter par les chiffres et prendre des décisions d\'investissement éclairées.',
    durationHours: 3,
    skills: ['Lecture financière', 'Pilotage par les KPIs', 'Décisions d\'investissement'],
    targetAudience: ['DG non-financiers', 'Directeurs opérationnels', 'Entrepreneurs'],
    slides: [
      { title: 'Les 3 états financiers essentiels', content: 'Bilan : ce que l\'entreprise possède et doit. Compte de résultat : ce qu\'elle gagne et dépense. Tableau des flux : d\'où vient et où va la trésorerie. Lecture croisée.', type: 'text' },
      { title: 'Les ratios clés à surveiller', content: 'Marge brute, EBITDA, ratio d\'endettement, BFR, ROE, ROI. Benchmarks par secteur. Signaux d\'alerte. Dashboard financier pour le COMEX.', type: 'text' },
      { title: 'Décisions d\'investissement', content: 'VAN, TRI, payback period. Arbitrer entre projets. Financement : autofinancement, dette, equity. Coût du capital.', type: 'text' },
      { title: 'Gestion de la trésorerie', content: 'Cash is king. Prévisions de trésorerie. Optimiser le BFR : délais clients, fournisseurs, stocks. Lignes de crédit.', type: 'text' },
      { title: 'Budget et contrôle de gestion', content: 'Processus budgétaire. Analyse des écarts. Re-forecasting trimestriel. Responsabilisation des managers sur leurs lignes budgétaires.', type: 'text' },
    ],
    quiz: [
      { question: 'Que mesure l\'EBITDA ?', options: ['Le chiffre d\'affaires', 'La rentabilité opérationnelle avant amortissements', 'Le résultat net', 'La trésorerie'], correct: 1 },
      { question: 'Que signifie BFR ?', options: ['Budget de Fonctionnement Réduit', 'Besoin en Fonds de Roulement', 'Bilan Financier Révisé', 'Base Financière de Référence'], correct: 1 },
    ],
    script: 'Pas besoin d\'être comptable pour piloter votre entreprise par les chiffres. En 3 heures, vous allez apprendre à lire vos états financiers, suivre les bons indicateurs et prendre des décisions d\'investissement éclairées.',
  }),

  createTemplate('finance', '💰', 'manager', 'advanced', {
    title: 'Contrôle de Gestion et Pilotage Financier',
    description: 'Maîtriser la construction budgétaire, l\'analyse des écarts, le costing et le reporting financier avancé.',
    durationHours: 10,
    skills: ['Construction budgétaire', 'Analyse des écarts', 'Costing', 'Reporting financier', 'Prévisions'],
    targetAudience: ['Contrôleurs de gestion', 'Responsables financiers', 'Managers avec responsabilité budgétaire'],
    slides: [
      { title: 'Processus budgétaire complet', content: 'Bottom-up vs top-down. Calendrier budgétaire. Budget base zéro. Rolling forecast. Impliquer les opérationnels.', type: 'text' },
      { title: 'Méthodes de costing', content: 'Coûts complets, coûts variables, ABC (Activity-Based Costing). Calcul du coût de revient. Prix de transfert interne. Seuil de rentabilité.', type: 'text' },
      { title: 'Analyse des écarts', content: 'Écarts sur volume, prix, mix, rendement. Analyse par axe : produit, client, région, canal. Actions correctives. Reporting mensuel structuré.', type: 'text' },
      { title: 'Exercice : Construction d\'un budget', content: 'À partir d\'un cas d\'entreprise, construisez le budget annuel d\'un département.', type: 'exercise', exerciseInstructions: 'Cas fourni : département de 15 personnes, CA prévu, hypothèses de croissance. Construisez le budget détaillé par poste, justifiez vos hypothèses, préparez la présentation au CFO. Temps : 60 minutes.' },
      { title: 'Tableaux de bord et reporting', content: 'KPIs financiers et opérationnels. Fréquence : hebdo, mensuel, trimestriel. Automatisation avec Excel/BI. Storytelling avec les chiffres.', type: 'text' },
      { title: 'Prévisions et modélisation', content: 'Techniques de prévision : séries temporelles, régressions, scénarios. Modèles financiers Excel. Analyse de sensibilité. Stress testing.', type: 'text' },
      { title: 'Analyse financière de projet', content: 'Business case structuré. VAN, TRI, payback. Analyse de risque financier. Go/no-go framework.', type: 'text' },
      { title: 'Trésorerie et cash management', content: 'Prévisions de cash flow. Gestion du BFR avancée. Optimisation fiscale. Relations bancaires.', type: 'text' },
    ],
    quiz: [
      { question: 'Que signifie ABC dans le contexte du costing ?', options: ['Always Below Cost', 'Activity-Based Costing', 'Accounting Budget Control', 'Annual Business Calculation'], correct: 1 },
      { question: 'Quel type de budget repart de zéro chaque année ?', options: ['Budget incrémental', 'Budget base zéro', 'Rolling forecast', 'Budget flexible'], correct: 1 },
      { question: 'Que mesure le seuil de rentabilité ?', options: ['Le CA maximum', 'Le point où les revenus couvrent les coûts', 'Le bénéfice net', 'La marge brute'], correct: 1 },
    ],
    script: 'Cette formation approfondie en contrôle de gestion vous outillera pour piloter la performance financière de votre périmètre. Nous travaillerons sur des cas concrets de construction budgétaire et d\'analyse.',
  }),

  createTemplate('finance', '💰', 'operational', 'practical', {
    title: 'Comprendre les Bases de la Finance d\'Entreprise',
    description: 'Introduction aux concepts financiers : budget, facturation, notes de frais, et compréhension des résultats de l\'entreprise.',
    durationHours: 4,
    skills: ['Vocabulaire financier', 'Suivi budgétaire', 'Notes de frais', 'Lecture simplifiée des comptes'],
    targetAudience: ['Tous les collaborateurs', 'Assistants administratifs', 'Responsables opérationnels'],
    slides: [
      { title: 'Pourquoi comprendre la finance ?', content: 'Chaque décision a un impact financier. Comprendre les résultats de l\'entreprise pour mieux contribuer. Parler le même langage que la direction.', type: 'text' },
      { title: 'Le vocabulaire financier essentiel', content: 'CA, marge, charges fixes/variables, amortissement, trésorerie, BFR, résultat net. Définitions simples avec exemples concrets du quotidien.', type: 'text' },
      { title: 'Gérer son budget de département', content: 'Lire un suivi budgétaire. Anticiper les dépenses. Signaler les dépassements. Économies intelligentes vs coupes aveugles.', type: 'text' },
      { title: 'Exercice : Lire un compte de résultat', content: 'Analysez un compte de résultat simplifié et identifiez les points clés.', type: 'exercise', exerciseInstructions: 'Compte de résultat fourni. Répondez aux questions : L\'entreprise est-elle rentable ? Quelle est la marge ? Quels postes ont augmenté ? Temps : 20 minutes.' },
      { title: 'Notes de frais et achats', content: 'Politique de frais de l\'entreprise. Processus d\'achat et validation. Impact des achats sur le budget. Bonnes pratiques.', type: 'text' },
    ],
    quiz: [
      { question: 'Que représente le chiffre d\'affaires ?', options: ['Le bénéfice', 'Le total des ventes', 'La trésorerie', 'Le capital'], correct: 1 },
      { question: 'Quelle est la différence entre charges fixes et variables ?', options: ['Leur montant', 'Les fixes ne changent pas avec l\'activité', 'Les variables sont optionnelles', 'Il n\'y a pas de différence'], correct: 1 },
    ],
    script: 'Pas besoin d\'être comptable ! Cette formation vous donne les clés pour comprendre les chiffres de l\'entreprise et mieux gérer votre budget au quotidien.',
  }),

  // ═══════════════════════════════════════
  // 6. HUMAN RESOURCES
  // ═══════════════════════════════════════
  createTemplate('human-resources', '👥', 'executive', 'strategic', {
    title: 'Stratégie RH et Capital Humain',
    description: 'Aligner la stratégie RH sur la stratégie d\'entreprise : marque employeur, GPEC, engagement et rétention des talents.',
    durationHours: 3,
    skills: ['Stratégie RH', 'GPEC', 'Marque employeur', 'Rétention des talents'],
    targetAudience: ['DRH', 'DG', 'Comité de direction'],
    slides: [
      { title: 'RH stratégique : au-delà de l\'administratif', content: 'Le DRH comme business partner. Impact du capital humain sur la performance. Métriques RH stratégiques : coût du turnover, engagement, productivité par employé.', type: 'text' },
      { title: 'GPEC et workforce planning', content: 'Anticiper les compétences de demain. Cartographie des métiers en évolution. Plans de succession. Reskilling et upskilling à grande échelle.', type: 'text' },
      { title: 'Marque employeur et attraction', content: 'Employee Value Proposition. Présence digitale employeur. Relations écoles. Processus de recrutement comme vitrine. Données : 75% des candidats recherchent l\'entreprise avant de postuler.', type: 'text' },
      { title: 'Engagement et rétention', content: 'Enquêtes d\'engagement : méthodologie et exploitation. Leviers de fidélisation : sens, développement, reconnaissance, équilibre. Coût du turnover : 50% à 200% du salaire annuel.', type: 'text' },
      { title: 'Transformation RH et digitalisation', content: 'SIRH et automatisation. People analytics. IA dans le recrutement. L\'expérience collaborateur digitale.', type: 'text' },
    ],
    quiz: [
      { question: 'Combien coûte le remplacement d\'un collaborateur ?', options: ['10-20% du salaire', '50-200% du salaire', '300% du salaire', 'Rien si on recrute vite'], correct: 1 },
      { question: 'Que signifie GPEC ?', options: ['Gestion Prévisionnelle des Emplois et Compétences', 'Guide Pratique de l\'Employeur Consciencieux', 'Gestion du Personnel et de la Comptabilité', 'Groupe de Pilotage Emploi-Carrière'], correct: 0 },
    ],
    script: 'La stratégie RH est un levier de compétitivité majeur. En 3 heures, nous allons voir comment aligner votre politique RH sur la stratégie d\'entreprise et transformer votre capital humain en avantage concurrentiel.',
  }),

  createTemplate('human-resources', '👥', 'manager', 'advanced', {
    title: 'Management RH pour Responsables d\'Équipe',
    description: 'Recrutement, intégration, entretiens professionnels, gestion des talents et droit du travail essentiel pour managers.',
    durationHours: 8,
    skills: ['Recrutement', 'Onboarding', 'Entretien professionnel', 'Droit du travail', 'Gestion des talents'],
    targetAudience: ['Managers', 'Responsables RH', 'Chefs de service'],
    slides: [
      { title: 'Recruter efficacement', content: 'Définir le profil : compétences vs culture fit. Rédiger une offre attractive. Tri de CV : éviter les biais. Entretien structuré. Vérification des références.', type: 'text' },
      { title: 'Onboarding réussi', content: 'Les 90 premiers jours : clé de la rétention. Checklist d\'intégration. Buddy system. Objectifs de la période d\'essai. Feedback à 30-60-90 jours.', type: 'text' },
      { title: 'Entretien professionnel', content: 'Cadre légal (obligation tous les 2 ans). Préparation collaborateur et manager. Identifier les aspirations. Plan de développement. Suivi des engagements.', type: 'text' },
      { title: 'Exercice : Simulation d\'entretien de recrutement', content: 'Menez un entretien de recrutement structuré avec grille d\'évaluation.', type: 'exercise', exerciseInstructions: 'En trinômes : recruteur, candidat, observateur. Poste : chef de projet digital. Utilisez la grille d\'entretien structuré fournie. 20 min d\'entretien + 10 min de debrief. Rotation des rôles.' },
      { title: 'Droit du travail essentiel pour managers', content: 'Durée du travail et heures supplémentaires. Congés et absences. Sanctions disciplinaires. Harcèlement : obligation de prévention et d\'action. Protection des données RH.', type: 'text' },
      { title: 'Gestion des départs', content: 'Démission : entretien de sortie. Rupture conventionnelle : processus. Licenciement : respect de la procédure. Offboarding bienveillant.', type: 'text' },
      { title: 'Développement des compétences', content: 'Identifier les besoins. Plan de formation individuel. Mentorat et coaching. Mobilité interne. Certifications et formations diplômantes.', type: 'text' },
      { title: 'People analytics pour managers', content: 'Indicateurs clés : absentéisme, turnover, engagement, productivité. Utiliser les données pour anticiper. Dashboard RH opérationnel.', type: 'text' },
    ],
    quiz: [
      { question: 'Quelle est la fréquence obligatoire de l\'entretien professionnel ?', options: ['Annuel', 'Tous les 2 ans', 'Tous les 3 ans', 'Pas d\'obligation'], correct: 1 },
      { question: 'Quand le risque de turnover est-il le plus élevé ?', options: ['Après 5 ans', 'Pendant les 90 premiers jours', 'Après un changement de manager', 'Après une formation'], correct: 1 },
      { question: 'Qu\'est-ce qu\'un entretien structuré ?', options: ['Un entretien formel en salle', 'Les mêmes questions pour tous les candidats', 'Un entretien de plus de 2 heures', 'Un entretien avec le DRH'], correct: 1 },
    ],
    script: 'En tant que manager, vous êtes le premier RH de votre équipe. Cette formation vous donne les compétences pour recruter, intégrer, développer et fidéliser vos collaborateurs tout en respectant le cadre légal.',
  }),

  createTemplate('human-resources', '👥', 'operational', 'practical', {
    title: 'Comprendre ses Droits et le Fonctionnement RH',
    description: 'Guide pratique pour les collaborateurs : contrat de travail, congés, formation professionnelle, entretiens et évolution.',
    durationHours: 3,
    skills: ['Droits du salarié', 'Formation professionnelle', 'Évolution de carrière'],
    targetAudience: ['Tous les collaborateurs', 'Nouveaux arrivants'],
    slides: [
      { title: 'Votre contrat de travail', content: 'Les éléments essentiels de votre contrat. Période d\'essai. Clauses particulières. Vos droits et obligations. Qui contacter en cas de question.', type: 'text' },
      { title: 'Congés et absences', content: 'Congés payés, RTT, congés spéciaux. Procédure de demande. Arrêt maladie : démarches. Congé parental, sabbatique.', type: 'text' },
      { title: 'Formation et développement', content: 'Votre CPF (Compte Personnel de Formation). Plan de développement de l\'entreprise. Demander une formation. VAE et bilan de compétences.', type: 'text' },
      { title: 'Vos entretiens RH', content: 'Entretien annuel vs entretien professionnel. Comment les préparer. Exprimer vos souhaits d\'évolution. Suivi des engagements.', type: 'text' },
      { title: 'Évoluer dans l\'entreprise', content: 'Mobilité interne : comment ça marche. Se positionner sur un poste interne. Développer son réseau. Mentoring.', type: 'text' },
    ],
    quiz: [
      { question: 'Qu\'est-ce que le CPF ?', options: ['Congé Payé Familial', 'Compte Personnel de Formation', 'Contrat Professionnel Fixe', 'Certificat de Performance'], correct: 1 },
      { question: 'À quelle fréquence avez-vous droit à un entretien professionnel ?', options: ['Chaque année', 'Tous les 2 ans', 'Tous les 5 ans', 'Jamais'], correct: 1 },
    ],
    script: 'Cette session est faite pour vous aider à comprendre vos droits et les opportunités qui existent dans l\'entreprise. On va parler congés, formation, entretiens et évolution de carrière de manière simple et concrète.',
  }),

  // ═══════════════════════════════════════
  // 7. SALES & NEGOTIATION
  // ═══════════════════════════════════════
  createTemplate('sales', '🤝', 'executive', 'strategic', {
    title: 'Stratégie Commerciale et Croissance',
    description: 'Définir la stratégie de vente, structurer la force commerciale et piloter la croissance du chiffre d\'affaires.',
    durationHours: 3,
    skills: ['Stratégie commerciale', 'Pricing', 'Go-to-market', 'Pilotage CA'],
    targetAudience: ['DG', 'Directeurs commerciaux', 'VP Sales'],
    slides: [
      { title: 'Stratégie commerciale alignée sur le marché', content: 'Segmentation stratégique. Proposition de valeur différenciante. Positionnement prix. Canaux de distribution. Avantage concurrentiel durable.', type: 'text' },
      { title: 'Organisation de la force de vente', content: 'Modèles : hunters vs farmers, inside vs field, SDR/AE/CSM. Dimensionnement. Territoires. Incentives et rémunération variable.', type: 'text' },
      { title: 'Pilotage de la performance commerciale', content: 'Pipeline management. Métriques : taux de conversion, cycle de vente, panier moyen, win rate. Forecasting. Sales enablement.', type: 'text' },
      { title: 'Croissance et expansion', content: 'Stratégies de croissance : pénétration, développement produit/marché, diversification. Partnerships et alliances. Expansion géographique. M&A commercial.', type: 'text' },
    ],
    quiz: [
      { question: 'Que signifie SDR en organisation commerciale ?', options: ['Sales Development Representative', 'Strategic Decision Review', 'Sales Data Report', 'Senior Director Revenue'], correct: 0 },
      { question: 'Quel indicateur mesure le pourcentage de deals gagnés ?', options: ['Taux de conversion', 'Win rate', 'Pipeline coverage', 'ARR'], correct: 1 },
    ],
    script: 'La stratégie commerciale détermine la croissance de l\'entreprise. Nous allons voir comment structurer votre force de vente, définir votre pricing et piloter la performance avec les bons indicateurs.',
  }),

  createTemplate('sales', '🤝', 'manager', 'advanced', {
    title: 'Techniques de Vente et Négociation Avancées',
    description: 'Méthodes de vente consultative, négociation complexe, gestion des grands comptes et closing avancé.',
    durationHours: 10,
    skills: ['Vente consultative', 'Négociation', 'Closing', 'Account management', 'CRM'],
    targetAudience: ['Commerciaux confirmés', 'Key Account Managers', 'Responsables commerciaux'],
    slides: [
      { title: 'Vente consultative : méthode SPIN', content: 'Situation, Problème, Implication, Need-payoff. Poser les bonnes questions. Écoute active. Reformulation et validation des besoins.', type: 'text' },
      { title: 'Comprendre le parcours d\'achat', content: 'Les 7 étapes du parcours d\'achat B2B. Identifier les décideurs et influenceurs. Cartographie du pouvoir décisionnel. Champion interne.', type: 'text' },
      { title: 'Présentation et argumentation', content: 'Pitch adapté au profil de l\'interlocuteur. Features vs Benefits vs Value. Storytelling commercial. Gestion des objections : méthode CRAC.', type: 'text' },
      { title: 'Exercice : Simulation de vente complexe', content: 'Jeu de rôle complet : de la découverte au closing sur un deal B2B complexe.', type: 'exercise', exerciseInstructions: 'Scénario : vente d\'une solution IT à 500K€. En trinômes (vendeur, acheteur, observateur). Phase 1 : Découverte SPIN (15 min). Phase 2 : Présentation de la solution (10 min). Phase 3 : Négociation et closing (15 min). Debrief avec grille d\'évaluation.' },
      { title: 'Négociation avancée', content: 'Préparer sa BATNA. Zone d\'accord possible. Concessions vs contreparties. Tactiques de négociation. Négocier le prix sans baisser. Win-win vs zero-sum.', type: 'text' },
      { title: 'Closing : techniques avancées', content: 'Détecter les signaux d\'achat. Closing direct, alternatif, assumé. Gérer le "je vais réfléchir". Créer l\'urgence sans manipuler. Formaliser l\'accord.', type: 'text' },
      { title: 'Account management et upsell', content: 'Plan de compte stratégique. Business review trimestrielle. Identifier les opportunités d\'upsell et cross-sell. Fidélisation et NPS.', type: 'text' },
      { title: 'CRM et outils commerciaux', content: 'Utiliser le CRM efficacement (Salesforce, HubSpot). Pipeline management. Automatisation des relances. Reporting et prévisions.', type: 'text' },
      { title: 'Social selling', content: 'LinkedIn comme outil de prospection. Personal branding professionnel. Content selling. InMail et approche directe.', type: 'text' },
      { title: 'Performance commerciale individuelle', content: 'Gestion du temps commercial. Priorisation des opportunités. Résilience face aux refus. Plan de développement commercial personnel.', type: 'text' },
    ],
    quiz: [
      { question: 'Que signifie le I dans la méthode SPIN ?', options: ['Interest', 'Implication', 'Information', 'Intention'], correct: 1 },
      { question: 'Que signifie BATNA ?', options: ['Best Alternative To a Negotiated Agreement', 'Business Analysis and Trade Negotiation', 'Buyer Advantage in Total Negotiation', 'Budget Allocation for Trade and Negotiation'], correct: 0 },
      { question: 'Quel est le meilleur moment pour parler du prix ?', options: ['Au début', 'Après avoir établi la valeur', 'Jamais', 'Par email'], correct: 1 },
      { question: 'Qu\'est-ce que le NPS ?', options: ['Net Profit Score', 'New Pipeline Sales', 'Net Promoter Score', 'National Price Standard'], correct: 2 },
    ],
    script: 'Cette formation intensive va transformer votre approche commerciale. Nous allons passer de la vente transactionnelle à la vente consultative, maîtriser la négociation complexe et perfectionner vos techniques de closing.',
  }),

  createTemplate('sales', '🤝', 'operational', 'practical', {
    title: 'Les Fondamentaux de la Vente',
    description: 'Premiers pas dans la vente : prospection, premier contact, argumentaire, gestion des objections et fidélisation client.',
    durationHours: 6,
    skills: ['Prospection', 'Argumentaire', 'Objections', 'Relation client'],
    targetAudience: ['Nouveaux commerciaux', 'Vendeurs en magasin', 'Service client'],
    slides: [
      { title: 'L\'état d\'esprit du commercial', content: 'Écouter avant de vendre. Le client achète une solution, pas un produit. Empathie et authenticité. Résilience face aux refus : chaque "non" rapproche du "oui".', type: 'text' },
      { title: 'Prospecter efficacement', content: 'Identifier ses cibles. Les canaux : téléphone, email, LinkedIn, salon. Le pitch de 30 secondes. Suivre et relancer sans harceler.', type: 'text' },
      { title: 'Découvrir les besoins du client', content: 'Les questions ouvertes. L\'écoute active. Reformuler pour valider. Ne pas supposer les besoins. Prendre des notes.', type: 'text' },
      { title: 'Exercice : Mon elevator pitch', content: 'Préparez et présentez votre pitch de 30 secondes pour votre produit/service.', type: 'exercise', exerciseInstructions: 'Structurez votre pitch : accroche, problème résolu, bénéfice principal, appel à l\'action. Présentez-le devant le groupe. Feedback collectif. 15 min de préparation, 2 min par personne.' },
      { title: 'Gérer les objections courantes', content: '"C\'est trop cher" → parler valeur. "Je vais réfléchir" → identifier le frein réel. "J\'ai déjà un fournisseur" → comprendre la satisfaction. "Envoyez-moi un email" → qualifier l\'intérêt.', type: 'text' },
      { title: 'Fidéliser ses clients', content: 'Le coût d\'acquisition vs fidélisation. Suivi post-vente. Demander des recommandations. Transformer un client satisfait en ambassadeur.', type: 'text' },
    ],
    quiz: [
      { question: 'Quelle est la première étape d\'un bon entretien de vente ?', options: ['Présenter le produit', 'Découvrir les besoins', 'Annoncer le prix', 'Donner une brochure'], correct: 1 },
      { question: 'Comment répondre à "C\'est trop cher" ?', options: ['Baisser le prix', 'Argumenter sur la valeur', 'Abandonner', 'Critiquer la concurrence'], correct: 1 },
    ],
    script: 'La vente, c\'est avant tout de la relation humaine. Aujourd\'hui on va travailler les fondamentaux : écouter, comprendre, proposer, convaincre. Beaucoup de pratique et de jeux de rôle au programme !',
  }),

  // ═══════════════════════════════════════
  // 8. QUALITY & LEAN
  // ═══════════════════════════════════════
  createTemplate('quality-lean', '⚙️', 'executive', 'strategic', {
    title: 'Excellence Opérationnelle : Vision Stratégique',
    description: 'Comprendre et piloter une démarche d\'excellence opérationnelle : Lean, Six Sigma et amélioration continue au niveau stratégique.',
    durationHours: 2,
    skills: ['Excellence opérationnelle', 'Lean management', 'Pilotage qualité'],
    targetAudience: ['DG', 'Directeurs industriels', 'Directeurs qualité'],
    slides: [
      { title: 'L\'excellence opérationnelle comme avantage concurrentiel', content: 'Toyota, Amazon, Apple : exemples de transformation par l\'excellence. ROI d\'une démarche Lean : réduction des coûts de 15-30%, délais réduits de 50%.', type: 'text' },
      { title: 'Les piliers de l\'excellence opérationnelle', content: 'Lean (éliminer les gaspillages), Six Sigma (réduire la variabilité), Kaizen (amélioration continue). Comment ces approches se complètent.', type: 'text' },
      { title: 'Déploiement stratégique', content: 'Hoshin Kanri : déployer la stratégie en objectifs opérationnels. Priorisation des chantiers. Governance et revues de direction. Budget et ressources dédiées.', type: 'text' },
      { title: 'Culture d\'amélioration continue', content: 'Rôle du leadership dans la transformation. Engagement des équipes. Droit à l\'erreur. Gemba walks. Reconnaissance des initiatives.', type: 'text' },
    ],
    quiz: [
      { question: 'Quel est le gain typique d\'une démarche Lean sur les coûts ?', options: ['5-10%', '15-30%', '40-50%', '60-70%'], correct: 1 },
      { question: 'Que vise Six Sigma ?', options: ['Réduire les effectifs', 'Réduire la variabilité des processus', 'Augmenter la production', 'Digitaliser l\'usine'], correct: 1 },
    ],
    script: 'L\'excellence opérationnelle n\'est pas un programme qualité de plus. C\'est une transformation culturelle qui génère un avantage concurrentiel durable. Voyons comment piloter cette démarche au niveau stratégique.',
  }),

  createTemplate('quality-lean', '⚙️', 'manager', 'advanced', {
    title: 'Lean Six Sigma Green Belt',
    description: 'Formation complète Lean Six Sigma : outils DMAIC, cartographie des processus, analyse statistique et conduite de projets d\'amélioration.',
    durationHours: 16,
    skills: ['DMAIC', 'Value Stream Mapping', 'Analyse statistique', '5S', 'Kaizen'],
    targetAudience: ['Responsables qualité', 'Chefs de projet amélioration', 'Managers de production'],
    slides: [
      { title: 'Le framework DMAIC', content: 'Define, Measure, Analyze, Improve, Control. Quand utiliser DMAIC vs DMADV. Charter de projet. Voice of Customer (VOC).', type: 'text' },
      { title: 'Define : Cadrer le projet', content: 'SIPOC, CTQ (Critical To Quality), scope du projet, équipe, planning. Business case et gains attendus.', type: 'text' },
      { title: 'Measure : Collecter les données', content: 'Plan de collecte de données. MSA (Measurement System Analysis). Capability analysis (Cp, Cpk). Baseline de performance.', type: 'text' },
      { title: 'Value Stream Mapping', content: 'Cartographier le flux de valeur actuel. Identifier les 8 gaspillages (TIMWOODS). Dessiner l\'état futur. Plan de transformation.', type: 'text' },
      { title: 'Analyze : Trouver les causes racines', content: 'Ishikawa (5M), 5 Pourquoi, analyse Pareto, tests d\'hypothèses, régression. Data-driven root cause analysis.', type: 'text' },
      { title: 'Exercice : Analyse de processus', content: 'Réaliser un Value Stream Mapping et une analyse de causes racines sur un processus réel.', type: 'exercise', exerciseInstructions: 'En équipes de 4. Cas fourni : processus de traitement de commande avec 15% de retards. 1) Dessinez le VSM actuel (30 min) 2) Identifiez les gaspillages (15 min) 3) Analyse Ishikawa des causes de retard (20 min) 4) Proposez l\'état futur (15 min).' },
      { title: 'Improve : Solutions et tests', content: 'Brainstorming structuré. Matrice de priorisation effort/impact. Pilote et test. PDCA pour l\'implémentation. Poka-yoke (anti-erreur).', type: 'text' },
      { title: 'Control : Pérenniser les gains', content: 'Plan de contrôle. SPC (Statistical Process Control). Standards de travail. Formation des opérateurs. Audit process.', type: 'text' },
      { title: '5S en pratique', content: 'Seiri (trier), Seiton (ranger), Seiso (nettoyer), Seiketsu (standardiser), Shitsuke (maintenir). Audit 5S. Management visuel.', type: 'text' },
      { title: 'Kaizen et amélioration continue', content: 'Kaizen events : préparation, exécution, suivi. Système de suggestions. Daily management. Gemba walk. A3 problem solving.', type: 'text' },
    ],
    quiz: [
      { question: 'Que signifie le D de DMAIC ?', options: ['Design', 'Define', 'Develop', 'Deliver'], correct: 1 },
      { question: 'Combien de types de gaspillages identifie le Lean (TIMWOODS) ?', options: ['5', '7', '8', '10'], correct: 2 },
      { question: 'Que mesure le Cpk ?', options: ['La capacité d\'un processus', 'Le coût par kilogramme', 'La charge par collaborateur', 'Le cycle par kanban'], correct: 0 },
      { question: 'Que signifie Poka-yoke ?', options: ['Gestion visuelle', 'Anti-erreur', 'Flux tiré', 'Amélioration continue'], correct: 1 },
      { question: 'Quel outil utilise-t-on pour identifier les causes racines d\'un problème ?', options: ['Gantt', 'Ishikawa', 'PERT', 'Kanban'], correct: 1 },
    ],
    script: 'Cette formation Green Belt vous donnera les outils pour mener des projets d\'amélioration structurés et mesurables. Chaque phase DMAIC sera illustrée par des exercices pratiques.',
  }),

  createTemplate('quality-lean', '⚙️', 'operational', 'practical', {
    title: 'Introduction à la Qualité et l\'Amélioration Continue',
    description: 'Comprendre la démarche qualité, participer aux 5S, signaler les problèmes et proposer des améliorations au quotidien.',
    durationHours: 4,
    skills: ['5S', 'Signalement problèmes', 'Suggestions d\'amélioration', 'Standards qualité'],
    targetAudience: ['Opérateurs', 'Techniciens', 'Agents administratifs'],
    slides: [
      { title: 'Pourquoi la qualité nous concerne tous', content: 'Un défaut non détecté coûte 10× plus au client qu\'en production. Exemples concrets de non-qualité et leur impact. Votre rôle dans la chaîne de qualité.', type: 'text' },
      { title: 'Les 5S : organiser son poste de travail', content: 'Trier, ranger, nettoyer, standardiser, maintenir. Avant/après en photos. Audit 5S simple. Les bénéfices au quotidien : gagner du temps, réduire le stress.', type: 'text' },
      { title: 'Exercice : Audit 5S de votre poste', content: 'Réalisez un audit 5S de votre espace de travail avec la grille fournie.', type: 'exercise', exerciseInstructions: 'Utilisez la grille d\'audit 5S. Notez chaque critère de 1 à 5. Identifiez 3 actions d\'amélioration immédiates. Prenez des photos avant/après si possible.' },
      { title: 'Signaler un problème efficacement', content: 'Quoi signaler : défaut, anomalie, risque, gaspillage. Comment : fiche de non-conformité, photo, description factuelle. À qui : responsable qualité, manager.', type: 'text' },
      { title: 'Proposer des améliorations', content: 'Système de suggestions : comment ça marche. Exemples d\'idées simples qui ont fait la différence. Méthode PDCA simplifiée. Récompenses et reconnaissance.', type: 'text' },
    ],
    quiz: [
      { question: 'Que signifie le premier S des 5S ?', options: ['Standardiser', 'Simplifier', 'Seiri (Trier)', 'Sécuriser'], correct: 2 },
      { question: 'Pourquoi signaler les problèmes rapidement ?', options: ['Pour blâmer les collègues', 'Car le coût augmente avec le temps', 'Pour remplir des formulaires', 'Ce n\'est pas nécessaire'], correct: 1 },
    ],
    script: 'La qualité, c\'est l\'affaire de tous. Aujourd\'hui on va voir des outils simples et concrets pour organiser votre poste, repérer les problèmes et proposer des améliorations. Pas de jargon technique, juste du bon sens structuré !',
  }),

  // ═══════════════════════════════════════
  // 9. HSE (Health, Safety & Environment)
  // ═══════════════════════════════════════
  createTemplate('hse', '🦺', 'executive', 'strategic', {
    title: 'HSE : Responsabilités du Dirigeant',
    description: 'Obligations légales, responsabilité pénale, culture sécurité et pilotage stratégique de la prévention des risques.',
    durationHours: 2,
    skills: ['Responsabilité pénale', 'Culture sécurité', 'Pilotage HSE'],
    targetAudience: ['DG', 'Directeurs d\'usine', 'Membres du COMEX'],
    slides: [
      { title: 'Responsabilité pénale du dirigeant', content: 'Le chef d\'entreprise est responsable pénalement de la sécurité de ses salariés. Délégation de pouvoir : conditions de validité. Jurisprudence récente. Sanctions encourues.', type: 'text' },
      { title: 'Coût de la non-sécurité', content: 'Coûts directs (soins, indemnités) et indirects (perte de production, remplacement, image). Ratio 1:4 : pour 1€ de coût direct, 4€ de coûts indirects. ROI de la prévention.', type: 'text' },
      { title: 'Construire une culture sécurité', content: 'Courbe de Bradley : du réactif au proactif. Leadership visible en sécurité. Engagement managérial. Indicateurs avancés vs retardés.', type: 'text' },
      { title: 'Pilotage stratégique HSE', content: 'Politique HSE. Revue de direction. Objectifs et programmes de prévention. Investissements prioritaires. Communication interne.', type: 'text' },
    ],
    quiz: [
      { question: 'Quel est le ratio coûts directs/indirects d\'un accident ?', options: ['1:1', '1:2', '1:4', '1:10'], correct: 2 },
      { question: 'Que mesure la courbe de Bradley ?', options: ['Le taux d\'accidents', 'La maturité culture sécurité', 'Le budget HSE', 'Le nombre de formations'], correct: 1 },
    ],
    script: 'La sécurité n\'est pas un centre de coût, c\'est un investissement. Et en tant que dirigeant, c\'est votre responsabilité personnelle. Nous allons voir les enjeux légaux, financiers et humains.',
  }),

  createTemplate('hse', '🦺', 'manager', 'advanced', {
    title: 'Management de la Sécurité pour Responsables',
    description: 'Évaluation des risques, arbre des causes, audits de sécurité, ISO 45001 et animation de la prévention au quotidien.',
    durationHours: 10,
    skills: ['Évaluation des risques', 'Arbre des causes', 'ISO 45001', 'Audit sécurité', 'Animation sécurité'],
    targetAudience: ['Responsables HSE', 'Managers de production', 'Préventeurs'],
    slides: [
      { title: 'Document Unique d\'Évaluation des Risques', content: 'Obligation légale. Méthodologie d\'évaluation : identification des dangers, cotation risques (gravité × fréquence × exposition). Mise à jour annuelle. Plans d\'action.', type: 'text' },
      { title: 'Analyse des accidents : Arbre des causes', content: 'Méthodologie systématique. Faits vs opinions. Enchaînement causal. Identifier les causes racines (techniques, organisationnelles, humaines). Mesures correctives et préventives.', type: 'text' },
      { title: 'Exercice : Analyse d\'un accident', content: 'À partir d\'un cas réel anonymisé, réalisez un arbre des causes complet.', type: 'exercise', exerciseInstructions: 'Cas fourni : chute d\'un technicien lors d\'une intervention en hauteur. 1) Identifiez tous les faits (15 min) 2) Construisez l\'arbre des causes (20 min) 3) Proposez des mesures correctives et préventives (15 min) 4) Restitution en groupe.' },
      { title: 'ISO 45001 : Système de management SST', content: 'Structure HLS. Leadership et participation des travailleurs. Planification et gestion des risques. Support et maîtrise opérationnelle. Évaluation des performances.', type: 'text' },
      { title: 'Audits de sécurité terrain', content: 'Types d\'audits : comportementaux, de poste, de processus. Grille d\'observation. Feedback positif. Suivi des écarts. Frequency et planification.', type: 'text' },
      { title: 'EPI et protections collectives', content: 'Hiérarchie de prévention : élimination > substitution > protection collective > EPI. Choix des EPI. Formation au port. Vérification et remplacement.', type: 'text' },
      { title: 'Gestion des situations d\'urgence', content: 'Plans d\'urgence et d\'évacuation. Exercices incendie et PPMS. Premiers secours. Communication de crise. Retour d\'expérience post-exercice.', type: 'text' },
      { title: 'Animation sécurité au quotidien', content: 'Causeries sécurité : 5 minutes pour sauver des vies. Affichage et management visuel. Challenges sécurité. Remontées terrain. Réunions sécurité.', type: 'text' },
    ],
    quiz: [
      { question: 'À quelle fréquence le Document Unique doit-il être mis à jour ?', options: ['Tous les 5 ans', 'Tous les 3 ans', 'Au moins annuellement', 'Jamais'], correct: 2 },
      { question: 'Quel est le premier niveau de la hiérarchie de prévention ?', options: ['EPI', 'Protection collective', 'Élimination du danger', 'Formation'], correct: 2 },
      { question: 'Que recherche-t-on avec l\'arbre des causes ?', options: ['Un coupable', 'Les causes racines de l\'accident', 'Le coût de l\'accident', 'Le nombre de témoins'], correct: 1 },
    ],
    script: 'Cette formation approfondie vous outille pour manager la sécurité au quotidien. De l\'évaluation des risques à l\'animation terrain, en passant par l\'analyse d\'accidents et les audits.',
  }),

  createTemplate('hse', '🦺', 'operational', 'practical', {
    title: 'Sécurité au Travail : Les Gestes qui Sauvent',
    description: 'Règles de sécurité essentielles, port des EPI, réflexes en cas d\'urgence et signalement des situations dangereuses.',
    durationHours: 4,
    skills: ['Règles de sécurité', 'Port des EPI', 'Gestes d\'urgence', 'Signalement'],
    targetAudience: ['Tous les collaborateurs', 'Nouveaux arrivants', 'Intérimaires'],
    slides: [
      { title: 'La sécurité : c\'est VOTRE vie', content: 'En France, 2 morts par jour au travail. Les accidents arrivent aux gens expérimentés aussi. Chaque règle de sécurité a été écrite après un accident. Votre droit de retrait.', type: 'text' },
      { title: 'Les risques dans votre environnement', content: 'Risques spécifiques à votre poste : chutes, écrasement, chimique, électrique, routier, TMS. Comment les identifier au quotidien. Signalisation et pictogrammes.', type: 'text' },
      { title: 'Bien porter ses EPI', content: 'Chaque EPI protège une partie du corps. Vérifier l\'état avant utilisation. Rangement et entretien. Signaler un EPI endommagé. Démonstration et essayage.', type: 'text' },
      { title: 'Exercice : Identifier les dangers', content: 'Sur des photos de situations de travail, identifiez les dangers et proposez des mesures de prévention.', type: 'exercise', exerciseInstructions: '10 photos de situations de travail (certaines avec dangers, certaines conformes). Identifiez : le danger, le risque, la mesure de prévention. Travail individuel 10 min, correction collective 15 min.' },
      { title: 'Que faire en cas d\'urgence', content: 'Protéger, Alerter, Secourir (PAS). Numéros d\'urgence. Emplacement des extincteurs et sorties. Points de rassemblement. Premiers gestes : position latérale de sécurité.', type: 'text' },
      { title: 'Signaler pour prévenir', content: 'Signaler une situation dangereuse n\'est pas "cafarder". Comment remonter : formulaire, application, oral au manager. Exemples de situations signalées qui ont évité des accidents.', type: 'text' },
    ],
    quiz: [
      { question: 'Que signifie PAS en secourisme ?', options: ['Procéder Avec Soin', 'Protéger Alerter Secourir', 'Premier Aide au Salarié', 'Plan d\'Action Sécurité'], correct: 1 },
      { question: 'Que faire si votre EPI est endommagé ?', options: ['Le réparer vous-même', 'Continuer à l\'utiliser', 'Le signaler et en demander un neuf', 'Le jeter'], correct: 2 },
      { question: 'Avez-vous le droit de refuser un travail dangereux ?', options: ['Non, jamais', 'Oui, c\'est le droit de retrait', 'Seulement avec l\'accord du manager', 'Seulement les intérimaires'], correct: 1 },
    ],
    script: 'La sécurité n\'est pas une contrainte, c\'est ce qui vous permet de rentrer chez vous chaque soir. Aujourd\'hui on va revoir les règles essentielles, les bons gestes, et comment chacun peut contribuer à un lieu de travail sûr.',
  }),

  // ═══════════════════════════════════════
  // 10. COMMUNICATION & SOFT SKILLS
  // ═══════════════════════════════════════
  createTemplate('soft-skills', '💬', 'executive', 'strategic', {
    title: 'Communication de Direction et Prise de Parole',
    description: 'Maîtriser la communication stratégique, la prise de parole en public et la communication de crise pour dirigeants.',
    durationHours: 3,
    skills: ['Prise de parole', 'Communication stratégique', 'Communication de crise'],
    targetAudience: ['DG', 'Directeurs', 'Porte-paroles'],
    slides: [
      { title: 'L\'impact de la communication du dirigeant', content: 'Le dirigeant incarne le message. Cohérence entre discours et actions. Communication descendante, ascendante et transverse. Le leader comme storyteller.', type: 'text' },
      { title: 'Prise de parole en public', content: 'Structure d\'un discours impactant. Technique du storytelling exécutif. Gestion du trac. Langage corporel. Improvisation maîtrisée. Gérer les questions difficiles.', type: 'text' },
      { title: 'Communication de crise', content: 'Préparation : messages clés pré-rédigés. Les 3 premières heures critiques. Médias et réseaux sociaux. Transparence vs maîtrise du message. Post-crise et reconstruction.', type: 'text' },
      { title: 'Communication interne stratégique', content: 'Town halls et all-hands. Newsletter de direction. Vidéos de CEO. Rituels de communication. Gérer les rumeurs et l\'incertitude.', type: 'text' },
      { title: 'Personal branding du dirigeant', content: 'Présence LinkedIn. Interventions médias. Conférences et événements. Le dirigeant comme visage de la marque employeur.', type: 'text' },
    ],
    quiz: [
      { question: 'Quelle est la règle d\'or de la communication de crise ?', options: ['Ne rien dire', 'Transparence et rapidité', 'Blâmer quelqu\'un', 'Attendre que ça passe'], correct: 1 },
      { question: 'Quel est le meilleur format pour une allocution de direction ?', options: ['Email de 5 pages', 'Storytelling avec message clé', 'Liste de chiffres', 'PowerPoint de 50 slides'], correct: 1 },
    ],
    script: 'La communication est le premier outil du dirigeant. Votre capacité à inspirer, rassurer et mobiliser fait la différence entre une organisation qui subit et une organisation qui avance.',
  }),

  createTemplate('soft-skills', '💬', 'manager', 'advanced', {
    title: 'Communication Managériale et Intelligence Relationnelle',
    description: 'Techniques avancées de communication : assertivité, gestion des personnalités difficiles, présentation et influence.',
    durationHours: 8,
    skills: ['Assertivité', 'Présentation', 'Influence', 'Intelligence relationnelle', 'Communication non-violente'],
    targetAudience: ['Managers', 'Chefs de projet', 'Formateurs'],
    slides: [
      { title: 'Les 4 styles de communication', content: 'Passif, agressif, manipulateur, assertif. Identifier son style dominant. Adapter sa communication au style de l\'interlocuteur. L\'assertivité comme équilibre.', type: 'text' },
      { title: 'Communication Non-Violente (CNV)', content: 'Observation, Sentiment, Besoin, Demande. Distinguer observation et jugement. Exprimer un besoin sans accuser. Formuler une demande négociable.', type: 'text' },
      { title: 'Exercice : Reformulation en CNV', content: 'Transformez des phrases agressives ou passives en communication non-violente.', type: 'exercise', exerciseInstructions: 'Liste de 8 situations : reformulez chaque phrase en utilisant le modèle OSBD (Observation, Sentiment, Besoin, Demande). Travail individuel 15 min, correction en binômes, debrief collectif.' },
      { title: 'Gérer les personnalités difficiles', content: 'Le résistant, le critique permanent, le silencieux, le dominateur. Techniques adaptées à chaque profil. Garder son calme et son professionnalisme.', type: 'text' },
      { title: 'L\'art de la présentation', content: 'Structure : hook, problème, solution, preuve, call-to-action. Design des slides : moins de texte, plus de visuels. Technique de présentation : rythme, pauses, contact visuel.', type: 'text' },
      { title: 'Influence et persuasion', content: 'Les 6 principes de Cialdini : réciprocité, engagement, preuve sociale, autorité, sympathie, rareté. Application éthique au management.', type: 'text' },
      { title: 'Écoute active approfondie', content: 'Les 5 niveaux d\'écoute. Techniques : reformulation, reflet, silence, questions ouvertes. Obstacles à l\'écoute. Écouter pour comprendre, pas pour répondre.', type: 'text' },
      { title: 'Communication écrite professionnelle', content: 'Emails efficaces : 5 lignes max, objet clair, action demandée. Rapports : structure pyramidale inversée. Éviter le jargon. Relecture et clarté.', type: 'text' },
    ],
    quiz: [
      { question: 'Quels sont les 4 éléments de la CNV ?', options: ['Observation Sentiment Besoin Demande', 'Opinion Suggestion Bilan Discussion', 'Objectif Solution Budget Délai', 'Ouverture Synthèse Bilan Décision'], correct: 0 },
      { question: 'Combien de principes de persuasion identifie Cialdini ?', options: ['4', '5', '6', '8'], correct: 2 },
      { question: 'Quel est le style de communication le plus efficace ?', options: ['Agressif', 'Passif', 'Assertif', 'Manipulateur'], correct: 2 },
    ],
    script: 'La communication est la compétence transversale par excellence. En tant que manager, votre capacité à communiquer détermine la performance de votre équipe. Cette formation est très pratique : beaucoup de jeux de rôle et d\'exercices.',
  }),

  createTemplate('soft-skills', '💬', 'operational', 'practical', {
    title: 'Communication Professionnelle au Quotidien',
    description: 'Améliorer sa communication au travail : emails, réunions, relations avec les collègues et gestion du stress relationnel.',
    durationHours: 4,
    skills: ['Emails professionnels', 'Communication en réunion', 'Relations de travail', 'Gestion du stress'],
    targetAudience: ['Tous les collaborateurs', 'Nouveaux arrivants'],
    slides: [
      { title: 'Communiquer clairement', content: 'Être compris du premier coup : message clé en premier, détails ensuite. Éviter le jargon inutile. Confirmer que le message est reçu. Adapter au canal : oral, écrit, visuel.', type: 'text' },
      { title: 'Emails professionnels efficaces', content: 'Objet clair et informatif. Structure : contexte + demande + délai. Formules de politesse adaptées. Quand appeler au lieu d\'écrire. Gérer le "Répondre à tous".', type: 'text' },
      { title: 'Exercice : Réécrire un email', content: 'Réécrivez un email confus pour le rendre clair et professionnel.', type: 'exercise', exerciseInstructions: 'Email fourni (250 mots, confus, pas de structure). Réécrivez-le en moins de 100 mots avec un objet clair, une structure, et une demande précise. Comparaison des résultats en groupe.' },
      { title: 'Participer efficacement en réunion', content: 'Préparer ses points avant. Intervenir de manière concise. Écouter activement. Prendre des notes utiles. Suivre les actions décidées.', type: 'text' },
      { title: 'Relations de travail positives', content: 'Respect et bienveillance. Donner et recevoir du feedback. Gérer les désaccords avec calme. Demander de l\'aide. Dire non diplomatiquement.', type: 'text' },
      { title: 'Gérer le stress relationnel', content: 'Identifier ses déclencheurs. Techniques de respiration rapide. Prendre du recul avant de réagir. Séparer le professionnel du personnel. Quand escalader.', type: 'text' },
    ],
    quiz: [
      { question: 'Quelle est la première chose à écrire dans un email professionnel ?', options: ['Les salutations', 'L\'objet clair', 'Votre signature', 'Une pièce jointe'], correct: 1 },
      { question: 'Comment dire non diplomatiquement ?', options: ['Ignorer la demande', 'Expliquer pourquoi et proposer une alternative', 'Dire oui puis ne pas faire', 'Rediriger vers un collègue sans prévenir'], correct: 1 },
    ],
    script: 'Bien communiquer au travail, ça s\'apprend ! Aujourd\'hui on va travailler sur les situations du quotidien : emails, réunions, relations avec les collègues. Des techniques simples pour être compris, respecté, et efficace.',
  }),
];

// Helper functions
export const getTemplatesBySpecialty = (specialty: string): TrainingTemplate[] =>
  TRAINING_TEMPLATES.filter(t => t.specialty === specialty);

export const getTemplatesByLevel = (level: AudienceLevel): TrainingTemplate[] =>
  TRAINING_TEMPLATES.filter(t => t.audienceLevel === level);

export const getTemplate = (specialty: string, level: AudienceLevel): TrainingTemplate | undefined =>
  TRAINING_TEMPLATES.find(t => t.specialty === specialty && t.audienceLevel === level);

export const getSpecialtyLabel = (id: string): string =>
  SPECIALTIES.find(s => s.id === id)?.label || id;

export const getLevelLabel = (level: AudienceLevel): string =>
  AUDIENCE_LEVELS.find(l => l.id === level)?.label || level;
