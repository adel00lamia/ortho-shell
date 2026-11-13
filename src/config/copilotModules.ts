/**
 * AI × HR Copilot — contenu pédagogique des modules recommandés par le diagnostic.
 *
 * Chaque module correspond à un `id` de MODULES (src/config/diagnosticEngine.ts)
 * et contient des leçons courtes, mobile-first, avec un exercice pratiqué avec l'IA.
 * Le contenu est volontairement en français (marché principal) et sans jargon.
 */

export interface CopilotLesson {
  id: string;
  title: string;
  minutes: number;
  /** Idée clé de la leçon, une phrase. */
  keyIdea: string;
  /** 3 à 5 points concrets à retenir. */
  points: string[];
  /** Exercice à réaliser avec l'IA. */
  practice: {
    /** Consigne affichée au participant. */
    brief: string;
    /** Placeholder du champ de saisie. */
    placeholder: string;
    /** Ce que l'IA doit évaluer / produire (envoyé à l'edge function). */
    goal: string;
  };
}

export interface CopilotModuleContent {
  id: string;
  objectives: string[];
  lessons: CopilotLesson[];
  /** Rappels de contrôle humain spécifiques au module. */
  humanControl?: string[];
}

const L = (
  id: string,
  title: string,
  minutes: number,
  keyIdea: string,
  points: string[],
  brief: string,
  placeholder: string,
  goal: string,
): CopilotLesson => ({ id, title, minutes, keyIdea, points, practice: { brief, placeholder, goal } });

export const COPILOT_MODULES: CopilotModuleContent[] = [
  {
    id: 'm_fundamentals',
    objectives: [
      'Distinguer ce que l’IA fait bien, mal, et ce qu’elle ne doit pas faire en RH',
      'Choisir une première tâche RH à outiller sans risque',
      'Poser un cadre de vérification simple et réutilisable',
    ],
    lessons: [
      L('f1', 'Ce que l’IA change réellement en RH', 6,
        'L’IA ne remplace pas une décision RH : elle prépare, reformule et accélère le travail autour de la décision.',
        [
          'Trois usages fiables : rédiger un premier jet, résumer un volume de texte, structurer une information dispersée.',
          'Trois usages risqués : trancher un cas individuel, produire un chiffre non vérifié, citer un texte juridique de mémoire.',
          'La valeur vient du temps gagné sur la préparation, pas de la décision elle-même.',
          'Une tâche est un bon candidat si elle est répétitive, textuelle et vérifiable en moins de 5 minutes.',
        ],
        'Décrivez une tâche RH de votre semaine que vous pensez pouvoir outiller, en 3 ou 4 phrases.',
        'Ex. : chaque lundi je compile les demandes de congés reçues par mail et je relance les managers…',
        'Dire si la tâche est un bon candidat pour l’IA, expliquer pourquoi, et proposer un découpage en 3 étapes dont une seule est confiée à l’IA.'),
      L('f2', 'Le réflexe de vérification', 5,
        'Une production IA n’est utilisable qu’après un contrôle explicite, court et systématique.',
        [
          'Vérifier d’abord les chiffres, les dates, les noms et les références réglementaires.',
          'Demander à l’IA d’indiquer ce dont elle n’est pas sûre.',
          'Ne jamais copier un texte IA dans un document officiel sans relecture métier.',
          'Conserver la trace : prompt utilisé, source, contrôle réalisé.',
        ],
        'Collez un court texte produit par une IA (ou écrivez-en un) et listez ce que vous vérifieriez avant de l’envoyer.',
        'Texte + ma liste de vérifications…',
        'Compléter la liste de vérifications manquantes et signaler les affirmations à risque dans le texte fourni.'),
      L('f3', 'Choisir sa première tâche', 5,
        'Commencer petit, mesurable, et sur une tâche qui vous appartient.',
        [
          'Critère 1 : vous la faites au moins une fois par semaine.',
          'Critère 2 : vous pouvez juger la qualité du résultat vous-même.',
          'Critère 3 : aucune donnée nominative sensible n’est nécessaire.',
          'Chronométrez avant / après : c’est votre premier indicateur.',
        ],
        'Proposez votre première tâche à outiller et l’indicateur que vous suivrez (unité et valeur de départ).',
        'Tâche : … / Indicateur : minutes par semaine, aujourd’hui environ …',
        'Valider ou corriger le choix de tâche, proposer un indicateur mesurable clair avec unité, base de départ et cible réaliste.'),
      L('f4', 'Données : ce qui ne sort pas de l’entreprise', 5,
        'Le tri des données se fait avant d’ouvrir l’outil, pas pendant.',
        [
          'Jamais : santé, origine, opinions, situation familiale, salaire nominatif, dossier disciplinaire nominatif.',
          'Anonymisez : remplacez les noms par « Collaborateur A », supprimez matricules et emails.',
          'Préférez les extraits agrégés aux fichiers complets.',
          'Si vous hésitez, la réponse est non.',
        ],
        'Décrivez les données que votre tâche nécessite et comment vous les rendriez utilisables sans risque.',
        'Données nécessaires : … / Ce que je retire : …',
        'Identifier les données à ne pas transmettre, proposer une version anonymisée exploitable et signaler tout risque restant.'),
    ],
    humanControl: ['Aucune décision individuelle ne peut être fondée sur une sortie IA non relue.'],
  },

  {
    id: 'm_prompting',
    objectives: [
      'Écrire un prompt RH fiable et réutilisable',
      'Obtenir un format de sortie exploitable directement',
      'Constituer sa bibliothèque de prompts',
    ],
    lessons: [
      L('p1', 'La structure d’un bon prompt RH', 6,
        'Un prompt fiable contient rôle, contexte, tâche, contraintes et format attendu.',
        [
          'Rôle : « Tu es responsable RH dans une entreprise industrielle de 300 personnes au Maroc ».',
          'Contexte : ce que l’IA ne peut pas deviner (secteur, effectif, contrainte interne).',
          'Tâche : un seul objectif par prompt.',
          'Format : tableau, liste de 5 points, courrier de 200 mots — soyez explicite.',
        ],
        'Écrivez un prompt complet pour une tâche RH réelle, en respectant les 5 blocs.',
        'Tu es… Contexte… Ta tâche… Contraintes… Format attendu…',
        'Noter le prompt bloc par bloc, réécrire une version améliorée et expliquer en une phrase chaque changement.'),
      L('p2', 'Le contexte fait la qualité', 5,
        'Un prompt générique produit une réponse générique : le contexte est votre vrai avantage.',
        [
          'Ajoutez vos contraintes réelles : budget, convention, calendrier, culture interne.',
          'Donnez un exemple de ce que vous considérez comme « bon ».',
          'Précisez le destinataire : direction, manager, collaborateur, organisme externe.',
          'Indiquez la langue et le niveau de formalité attendus.',
        ],
        'Reprenez un prompt trop vague et enrichissez-le avec votre contexte réel.',
        'Version vague : … / Ma version enrichie : …',
        'Comparer les deux versions, dire ce que le contexte ajouté change concrètement et proposer 2 éléments de contexte encore manquants.'),
      L('p3', 'Itérer au lieu de recommencer', 5,
        'La deuxième demande vaut souvent mieux que le premier prompt parfait.',
        [
          'Demandez une correction ciblée : « raccourcis de moitié », « rends-le plus factuel ».',
          'Faites expliciter les hypothèses avant d’accepter un résultat.',
          'Demandez deux variantes puis choisissez.',
          'Gardez la version finale, pas la conversation.',
        ],
        'Décrivez un résultat IA décevant que vous avez obtenu et ce que vous demanderiez ensuite.',
        'Résultat obtenu : … / Ma relance : …',
        'Proposer 3 relances précises et efficaces, classées par impact attendu, avec la formulation exacte à copier.'),
      L('p4', 'Votre bibliothèque de prompts', 5,
        'Un prompt utile est un prompt retrouvé : nommez, rangez, réutilisez.',
        [
          'Nommez par tâche : « Résumé entretien annuel », « Réponse candidat refus ».',
          'Notez la version qui a marché et la date.',
          'Partagez-la avec l’équipe RH pour homogénéiser les livrables.',
          'Revoyez-la tous les trimestres.',
        ],
        'Listez les 3 prompts que vous voulez industrialiser en premier.',
        '1) … 2) … 3) …',
        'Transformer chaque intitulé en prompt réutilisable complet avec variables entre crochets.'),
    ],
  },

  {
    id: 'm_recruitment',
    objectives: [
      'Accélérer la rédaction d’annonces et de grilles d’entretien',
      'Comparer des candidatures sans perdre l’équité',
      'Fluidifier la communication candidat',
    ],
    lessons: [
      L('r1', 'Fiche de poste et annonce en 10 minutes', 6,
        'Partez des missions réelles, pas d’un modèle générique.',
        [
          'Listez 5 missions et 3 résultats attendus avant d’écrire.',
          'Séparez indispensable et souhaitable : cela réduit les candidatures hors cible.',
          'Faites produire deux tons : interne et attractif externe.',
          'Vérifiez la conformité et l’absence de formulation discriminante.',
        ],
        'Donnez le titre du poste, 5 missions et vos contraintes ; demandez l’annonce.',
        'Poste : … / Missions : … / Contraintes : …',
        'Produire une annonce structurée, signaler toute formulation potentiellement discriminante et proposer 3 critères de sélection mesurables.'),
      L('r2', 'Présélection : une grille avant les CV', 6,
        'Une grille définie avant lecture protège de l’effet de halo.',
        [
          '5 critères maximum, chacun avec 3 niveaux observables.',
          'Pondérez : tous les critères ne valent pas la même chose.',
          'L’IA aide à extraire l’information, pas à classer les personnes.',
          'Gardez la décision finale et la trace du motif.',
        ],
        'Décrivez le poste et proposez votre grille de présélection en 5 critères.',
        'Poste : … / Critères : 1) … 2) …',
        'Critiquer la grille, corriger les critères non observables, proposer une pondération et les 3 questions de vérification associées.'),
      L('r3', 'Préparer l’entretien', 5,
        'Les meilleures questions viennent des risques du poste, pas d’une liste toute faite.',
        [
          'Pour chaque compétence clé, une question de situation vécue.',
          'Prévoyez une relance factuelle : « qu’avez-vous fait concrètement ? ».',
          'Notez pendant, décidez après.',
          'Même trame pour tous les candidats du même poste.',
        ],
        'Indiquez le poste et les 3 compétences que vous devez absolument évaluer.',
        'Poste : … / Compétences : …',
        'Produire 6 questions de situation avec relances et indicateurs de réponse faible / solide pour chacune.'),
      L('r4', 'Communication candidat', 5,
        'Répondre vite et correctement protège votre marque employeur.',
        [
          'Trois modèles suffisent : accusé de réception, refus, proposition d’entretien.',
          'Un refus utile est court, respectueux et sans promesse vague.',
          'Personnalisez une seule phrase : cela change tout.',
          'Ne donnez jamais de motif non documenté.',
        ],
        'Rédigez le message que vous envoyez aujourd’hui à un candidat non retenu.',
        'Mon message actuel : …',
        'Réécrire le message en version courte, respectueuse et conforme, puis expliquer les 3 corrections apportées.'),
      L('r5', 'Suivre le time-to-hire', 5,
        'Un recrutement se pilote par étapes, pas par ressenti.',
        [
          'Mesurez : publication → premières candidatures → entretien → décision → intégration.',
          'Repérez l’étape la plus lente avant d’optimiser le reste.',
          'Une relance planifiée vaut mieux qu’une relance urgente.',
          'Comparez vos délais d’un poste à l’autre, pas au marché.',
        ],
        'Donnez vos délais actuels par étape pour un recrutement récent.',
        'Publication → candidatures : … jours / … ',
        'Identifier le goulot d’étranglement, proposer 2 actions concrètes et un indicateur de suivi avec cible.'),
    ],
    humanControl: ['La décision de retenir ou d’écarter un candidat reste humaine et documentée.'],
  },

  {
    id: 'm_learning',
    objectives: [
      'Traduire un besoin flou en objectifs pédagogiques',
      'Produire un contenu de formation plus vite',
      'Évaluer l’effet réel de la formation',
    ],
    lessons: [
      L('l1', 'Du besoin exprimé au besoin réel', 6,
        'Une demande de formation cache souvent un problème d’organisation ou d’outil.',
        [
          'Demandez toujours : quel comportement doit changer, et comment le verra-t-on ?',
          'Si la cause est un process ou un outil, la formation seule échouera.',
          'Distinguez besoin individuel, collectif et stratégique.',
          'Écrivez l’objectif en verbe d’action observable.',
        ],
        'Décrivez une demande de formation reçue récemment, avec son contexte.',
        'Demande : … / Contexte : … / Ce qui pose problème : …',
        'Reformuler le besoin réel, dire si la formation est la bonne réponse, et proposer 3 objectifs pédagogiques observables.'),
      L('l2', 'Concevoir le déroulé', 6,
        'Un bon déroulé alterne apport court et mise en pratique immédiate.',
        [
          'Règle simple : jamais plus de 15 minutes d’apport sans exercice.',
          'Chaque séquence a un objectif et une preuve d’acquisition.',
          'Prévoyez le cas réel de l’entreprise, pas un cas d’école.',
          'Terminez par un engagement d’application à 30 jours.',
        ],
        'Indiquez le thème, la durée et le public ; demandez un déroulé séquencé.',
        'Thème : … / Durée : … / Public : …',
        'Produire un déroulé séquencé avec durées, objectifs, activités et preuve d’acquisition par séquence.'),
      L('l3', 'Produire les supports et les quiz', 5,
        'L’IA accélère la production, vous garantissez l’exactitude métier.',
        [
          'Faites générer un plan avant les contenus.',
          'Pour les quiz : 1 bonne réponse, 3 distracteurs plausibles, un feedback par option.',
          'Adaptez les exemples au secteur et au contexte marocain.',
          'Relisez toute référence réglementaire.',
        ],
        'Donnez une séquence de votre formation et demandez 5 questions de quiz.',
        'Séquence : … / Niveau du public : …',
        'Produire 5 questions à choix unique avec distracteurs plausibles et feedback par option, puis signaler ce qui doit être validé par un expert métier.'),
      L('l4', 'Évaluer l’effet, pas la satisfaction', 5,
        'Le sourire en fin de session ne prouve rien : mesurez le comportement.',
        [
          'Niveau 1 satisfaction, niveau 2 acquis, niveau 3 transfert, niveau 4 résultat.',
          'Choisissez un seul indicateur de transfert et mesurez-le à 60 jours.',
          'Impliquez le manager dans l’observation.',
          'Comparez à une situation avant formation.',
        ],
        'Indiquez votre formation et l’effet concret attendu sur le terrain.',
        'Formation : … / Effet attendu : …',
        'Proposer un dispositif d’évaluation en 4 niveaux avec un indicateur de transfert mesurable, sa méthode de mesure et sa cible.'),
    ],
  },

  {
    id: 'm_analytics',
    objectives: [
      'Fiabiliser une extraction avant analyse',
      'Automatiser la préparation du reporting',
      'Interpréter une tendance sans surinterpréter',
    ],
    lessons: [
      L('a1', 'Nettoyer avant d’analyser', 6,
        'Une analyse sur données sales produit une décision fausse avec assurance.',
        [
          'Cherchez d’abord doublons, valeurs manquantes, formats de date incohérents.',
          'Vérifiez les effectifs de référence avant tout ratio.',
          'Anonymisez : l’analyse RH n’a presque jamais besoin des noms.',
          'Documentez les corrections apportées.',
        ],
        'Décrivez la structure de votre extraction (colonnes, période, volume).',
        'Colonnes : … / Période : … / Nombre de lignes : …',
        'Lister les contrôles qualité à faire dans l’ordre, les pièges probables sur ce type d’extraction et les colonnes à anonymiser.'),
      L('a2', 'Choisir les bons indicateurs', 6,
        'Cinq indicateurs suivis valent mieux que vingt affichés.',
        [
          'Un indicateur sert une décision : sinon, supprimez-le.',
          'Définissez la formule et la source par écrit.',
          'Fixez la fréquence de mise à jour dès le départ.',
          'Ajoutez une cible, sinon le chiffre ne dit rien.',
        ],
        'Listez les indicateurs de votre tableau de bord actuel.',
        'Indicateurs : …',
        'Garder les 5 indicateurs les plus utiles, expliquer ce que chacun permet de décider, et proposer formule, source et fréquence.'),
      L('a3', 'Interpréter une variation', 5,
        'Une variation n’est pas une cause : cherchez l’explication avant de conclure.',
        [
          'Vérifiez l’effet de volume avant l’effet de fond.',
          'Comparez à la même période de l’an passé, pas seulement au mois précédent.',
          'Faites lister à l’IA les hypothèses alternatives.',
          'Ne communiquez une cause qu’avec une preuve.',
        ],
        'Décrivez une variation observée dans vos chiffres RH.',
        'Indicateur : … / Variation : … / Période : …',
        'Proposer 4 hypothèses explicatives classées par probabilité, la vérification à mener pour chacune et la formulation prudente à utiliser en comité.'),
      L('a4', 'Préparer le message pour la direction', 5,
        'La direction attend une décision à prendre, pas un tableau.',
        [
          'Trois messages clés maximum, chacun en une phrase.',
          'Un chiffre par message, sourcé.',
          'Terminez par la décision demandée.',
          'Anticipez la question qui fait mal.',
        ],
        'Collez les données ou constats que vous devez présenter.',
        'Mes constats : …',
        'Produire 3 messages clés en une phrase chacun, la décision à demander, et les 2 objections probables avec la réponse factuelle.'),
    ],
  },

  {
    id: 'm_payroll',
    objectives: [
      'Sécuriser les contrôles avant validation',
      'Détecter les anomalies plus tôt',
      'Industrialiser les documents et réponses récurrentes',
    ],
    lessons: [
      L('y1', 'La checklist de contrôle paie', 6,
        'Le temps gagné en paie vient de contrôles ordonnés, pas de rapidité.',
        [
          'Contrôlez d’abord ce qui change : entrées, sorties, variables, absences.',
          'Comparez toujours au mois précédent avant de valider.',
          'Un écart inexpliqué se documente, il ne s’arrondit pas.',
          'Ne transmettez jamais un fichier nominatif complet à un outil externe.',
        ],
        'Décrivez votre séquence de contrôle actuelle avant validation de la paie.',
        'Étapes actuelles : …',
        'Compléter la checklist avec les contrôles manquants, l’ordonner par risque et signaler les données à ne pas transmettre à un outil IA.'),
      L('y2', 'Détecter les anomalies', 6,
        'Une anomalie est un écart par rapport à une règle explicite.',
        [
          'Écrivez vos règles : plafond d’heures, écart mensuel acceptable, cohérence absence / rubrique.',
          'Travaillez sur un extrait anonymisé.',
          'Faites expliquer chaque anomalie détectée, sinon elle est inexploitable.',
          'Traitez la cause, pas seulement la ligne.',
        ],
        'Donnez 3 règles de cohérence de votre paie et un exemple d’écart déjà rencontré.',
        'Règles : … / Écart rencontré : …',
        'Formaliser les règles en contrôles automatisables, proposer 3 règles supplémentaires et la démarche de traitement d’un écart.'),
      L('y3', 'Documents et attestations', 5,
        'Un modèle validé une fois évite dix relectures.',
        [
          'Créez des modèles avec variables entre crochets.',
          'Faites valider une fois par la hiérarchie, puis figez.',
          'Datez les versions : la réglementation bouge.',
          'Ne générez jamais un document nominatif sans relecture.',
        ],
        'Indiquez le document RH que vous rédigez le plus souvent et son contenu type.',
        'Document : … / Contenu habituel : …',
        'Produire un modèle réutilisable avec variables entre crochets, signaler les mentions obligatoires à faire valider et proposer une note de version.'),
      L('y4', 'Réponses aux demandes collaborateurs', 5,
        'Les mêmes questions reviennent : préparez les réponses de référence.',
        [
          'Listez vos 10 questions les plus fréquentes.',
          'Une réponse de référence : courte, exacte, datée.',
          'Publiez-les avant de répondre au cas par cas.',
          'Mesurez la baisse du volume de sollicitations.',
        ],
        'Listez les 5 questions que l’on vous pose le plus souvent.',
        '1) … 2) …',
        'Rédiger une réponse de référence courte pour chaque question et signaler celles qui nécessitent une validation juridique.'),
    ],
    humanControl: ['Aucun bulletin ou document individuel n’est envoyé sans relecture humaine.'],
  },

  {
    id: 'm_talent',
    objectives: [
      'Améliorer la qualité du feedback',
      'Préparer des entretiens de performance utiles',
      'Objectiver l’identification des talents',
    ],
    lessons: [
      L('t1', 'Un feedback factuel', 6,
        'Un feedback utile décrit un fait, un effet et une attente.',
        [
          'Fait observable, pas trait de personnalité.',
          'Effet concret sur l’équipe, le client ou le délai.',
          'Attente précise et vérifiable.',
          'Un seul sujet par échange.',
        ],
        'Écrivez un feedback que vous devez donner cette semaine, tel que vous le diriez.',
        'Mon feedback : …',
        'Réécrire le feedback en version factuelle fait / effet / attente, et signaler les jugements de personne à supprimer.'),
      L('t2', 'Préparer l’entretien de performance', 6,
        'La préparation détermine la qualité de l’entretien plus que la grille.',
        [
          'Trois faits marquants documentés avant l’entretien.',
          'Anticipez le désaccord principal et votre réponse.',
          'Séparez évaluation du passé et objectifs à venir.',
          'Terminez par un engagement écrit partagé.',
        ],
        'Décrivez le collaborateur (sans le nommer), le contexte et le point délicat à aborder.',
        'Poste : … / Contexte : … / Point délicat : …',
        'Proposer une trame d’entretien, la formulation exacte du point délicat, et 3 objectifs SMART pour la période suivante.'),
      L('t3', 'Objectiver le potentiel', 5,
        'Le potentiel s’évalue sur des preuves, pas sur une impression.',
        [
          'Distinguez performance actuelle et capacité à évoluer.',
          'Cherchez au moins deux preuves par appréciation.',
          'Croisez les regards : manager, pair, RH.',
          'Traquez les biais : ancienneté, proximité, langue.',
        ],
        'Décrivez comment vous identifiez aujourd’hui vos talents.',
        'Ma méthode actuelle : …',
        'Proposer des critères de potentiel observables, les preuves à collecter et les 3 biais principaux à neutraliser dans cette méthode.'),
      L('t4', 'Cartographier compétences et succession', 5,
        'Une carte de compétences sert à décider des mouvements, pas à archiver.',
        [
          'Commencez par les postes critiques uniquement.',
          'Niveau attendu / niveau observé, écart, action.',
          'Identifiez au moins un successeur possible par poste critique.',
          'Actualisez à chaque mouvement, pas une fois par an.',
        ],
        'Citez un poste critique et l’écart de compétences que vous constatez.',
        'Poste critique : … / Écart : …',
        'Proposer un plan de réduction d’écart en 90 jours, les critères de succession et le risque à surveiller.'),
    ],
    humanControl: ['Une évaluation individuelle ne peut être produite par l’IA : elle est préparée, puis décidée par le manager.'],
  },

  {
    id: 'm_relations',
    objectives: [
      'Structurer un dossier de relations sociales',
      'Préparer un échange difficile',
      'Sécuriser la forme sans jamais remplacer l’avis juridique',
    ],
    lessons: [
      L('e1', 'Structurer les faits', 6,
        'Un dossier solide est une chronologie de faits datés et sourcés.',
        [
          'Un fait = une date, une source, une description neutre.',
          'Séparez faits, ressentis et interprétations.',
          'Numérotez les pièces et référencez-les.',
          'Anonymisez avant tout usage d’un outil IA.',
        ],
        'Décrivez une situation en cours, de façon anonymisée, avec les dates connues.',
        'Collaborateur A, le … / puis le … / pièce : …',
        'Reconstituer une chronologie neutre, distinguer faits et interprétations, et lister les pièces manquantes.'),
      L('e2', 'Préparer l’entretien', 6,
        'La préparation d’un entretien sensible se joue sur la formulation, pas sur l’argumentaire.',
        [
          'Énoncez les faits, pas les intentions supposées.',
          'Prévoyez le déroulé et les temps de parole.',
          'Anticipez trois réactions possibles.',
          'Le compte rendu se rédige immédiatement après.',
        ],
        'Indiquez l’objet de l’entretien et ce que vous devez dire, dans vos mots.',
        'Objet : … / Ce que je veux dire : …',
        'Proposer un déroulé d’entretien, la formulation neutre des faits et les réponses aux 3 réactions probables — sans donner d’avis juridique.'),
      L('e3', 'Comparer une pratique à la règle interne', 5,
        'L’IA compare des textes ; elle ne dit pas le droit.',
        [
          'Fournissez l’extrait de règlement pertinent, pas une question générale.',
          'Demandez les écarts, pas la conclusion.',
          'Toute qualification juridique passe par votre conseil.',
          'Gardez la trace de la version du texte utilisée.',
        ],
        'Collez l’extrait de votre règlement concerné et décrivez la pratique constatée.',
        'Extrait : … / Pratique constatée : …',
        'Lister les écarts entre la pratique et le texte fourni, formuler les questions à poser au conseil juridique, et rappeler qu’il ne s’agit pas d’un avis juridique.'),
      L('e4', 'Compte rendu et suites', 5,
        'Un compte rendu neutre protège les deux parties.',
        [
          'Faits, propos rapportés, décisions, délais.',
          'Aucune appréciation personnelle.',
          'Faites relire avant diffusion.',
          'Fixez la date de revue de la situation.',
        ],
        'Rédigez vos notes brutes d’un échange récent (anonymisées).',
        'Notes : …',
        'Transformer les notes en compte rendu neutre structuré, signaler les formulations à risque et proposer les suites et délais.'),
    ],
    humanControl: [
      'L’IA assiste la mise en forme et la préparation ; elle ne fournit aucun avis juridique.',
      'Toute mesure disciplinaire est validée par la hiérarchie et, si besoin, par un conseil juridique.',
    ],
  },

  {
    id: 'm_copilot',
    objectives: [
      'Constituer une base de connaissances RH fiable',
      'Construire un assistant interne appuyé sur vos procédures',
      'Cadrer son usage et sa mise à jour',
    ],
    lessons: [
      L('c1', 'Choisir le périmètre', 6,
        'Un copilote utile répond à un domaine précis, pas à tout.',
        [
          'Commencez par un domaine à fort volume de questions : congés, notes de frais, procédures.',
          'Listez les 20 questions réelles à couvrir.',
          'Excluez explicitement les sujets individuels et sensibles.',
          'Définissez qui pourra l’utiliser.',
        ],
        'Décrivez le périmètre que vous voulez couvrir en premier et pourquoi.',
        'Périmètre : … / Volume de questions : … / Utilisateurs : …',
        'Valider ou resserrer le périmètre, lister les 10 questions à couvrir en priorité et les sujets à exclure formellement.'),
      L('c2', 'Préparer les sources', 6,
        'La qualité des réponses dépend entièrement de la qualité des sources.',
        [
          'Une source = un document validé, daté, propriétaire identifié.',
          'Supprimez les versions obsolètes avant d’indexer.',
          'Découpez les documents longs par thème.',
          'Prévoyez qui met à jour et à quelle fréquence.',
        ],
        'Listez les documents que vous utiliseriez comme sources.',
        'Documents : … / Dernière mise à jour : …',
        'Trier les sources utilisables, signaler les manques et proposer un plan de mise à jour avec responsable et fréquence.'),
      L('c3', 'Rédiger les réponses de référence', 5,
        'Une réponse de référence est courte, exacte, et renvoie à la source.',
        [
          'Une question, une réponse, une source citée.',
          'Indiquez ce que l’assistant ne doit pas répondre.',
          'Prévoyez la phrase d’escalade vers un humain.',
          'Testez avec de vraies questions posées par des collaborateurs.',
        ],
        'Prenez vos 3 questions les plus fréquentes et proposez vos réponses de référence.',
        'Q1 : … / R1 : …',
        'Améliorer chaque réponse (concision, exactitude, source à citer) et rédiger la phrase d’escalade vers un humain.'),
      L('c4', 'Cadrer l’usage', 5,
        'Un copilote sans règle d’usage devient un risque.',
        [
          'Affichez son périmètre et ses limites aux utilisateurs.',
          'Journalisez les questions pour repérer les manques.',
          'Revoyez les réponses tous les trimestres.',
          'Un humain reste joignable pour tout cas individuel.',
        ],
        'Rédigez les règles d’usage que vous afficheriez à vos utilisateurs.',
        'Mes règles : …',
        'Compléter les règles d’usage manquantes et proposer un court texte affichable aux utilisateurs.'),
    ],
  },

  {
    id: 'm_governance',
    objectives: [
      'Poser un cadre d’usage de l’IA en RH',
      'Protéger les données des collaborateurs',
      'Documenter et informer',
    ],
    lessons: [
      L('g1', 'Le cadre minimum', 6,
        'Trois pages suffisent : usages autorisés, données interdites, contrôle humain.',
        [
          'Listez les usages autorisés par fonction RH.',
          'Listez explicitement les données interdites.',
          'Nommez un référent interne pour les questions.',
          'Faites valider par la direction avant diffusion.',
        ],
        'Décrivez les règles IA existantes dans votre entreprise (ou leur absence).',
        'Aujourd’hui chez nous : …',
        'Proposer la structure d’une charte d’usage courte adaptée à cette situation, avec les 5 règles à écrire en premier.'),
      L('g2', 'Données personnelles', 6,
        'La donnée RH est sensible par nature : le tri se fait en amont.',
        [
          'Minimisez : uniquement ce qui est nécessaire à la tâche.',
          'Anonymisez systématiquement pour toute analyse.',
          'Vérifiez où sont hébergées les données de l’outil utilisé.',
          'Au Maroc, tenez compte des obligations de protection des données personnelles.',
        ],
        'Décrivez les données que votre équipe utiliserait avec l’IA.',
        'Données envisagées : …',
        'Classer les données en autorisées / à anonymiser / interdites, et proposer la règle écrite correspondante.'),
      L('g3', 'Contrôle humain et traçabilité', 5,
        'La traçabilité transforme un usage risqué en usage défendable.',
        [
          'Notez : prompt, source, contrôle effectué, décideur.',
          'Toute décision individuelle est signée par un humain.',
          'Conservez la version validée du livrable.',
          'Prévoyez un point de revue trimestriel.',
        ],
        'Décrivez comment vous tracez aujourd’hui vos usages IA.',
        'Ma pratique actuelle : …',
        'Proposer un modèle de traçabilité simple, réaliste pour une équipe RH, avec les 4 champs à remplir systématiquement.'),
      L('g4', 'Informer les collaborateurs', 5,
        'L’acceptation vient de la transparence, pas de la performance.',
        [
          'Dites ce que l’IA fait et ne fait pas dans les processus RH.',
          'Précisez qui décide, toujours.',
          'Ouvrez un canal de questions.',
          'Communiquez avant le déploiement, pas après.',
        ],
        'Rédigez le message d’information que vous adresseriez aux collaborateurs.',
        'Mon message : …',
        'Réécrire le message en version claire et rassurante, et signaler les 3 informations obligatoires manquantes.'),
    ],
    humanControl: ['Toute décision individuelle reste prise et assumée par un humain identifié.'],
  },
];

export const getCopilotModule = (id: string) => COPILOT_MODULES.find((m) => m.id === id);
