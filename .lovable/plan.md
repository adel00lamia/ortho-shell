# Cockpit Transformation — WorkGraph et agent d’analyse

## Objectif

Faire de `/transformation` un espace de travail visuel qui guide une entreprise de la stratégie à l’impact : objectifs → capacités → processus → tâches → rôles/compétences → Humain + IA → interventions → résultats.

Direction retenue : palette bleue, titres éditoriaux premium, graphe central, agent strictement en lecture seule.

## Expérience à construire

### 1. Workflow piloté
- Remplacer la simple rangée d’onglets par un parcours en huit étapes, avec progression, complétude, alertes et prochaine action recommandée.
- Conserver les écrans de saisie existants, mais les ouvrir depuis l’étape ou le nœud concerné.
- Mémoriser l’étape et la sélection dans l’URL afin de partager ou reprendre une analyse précise.

### 2. WorkGraph central
- Ajouter une vue réseau interactive au centre du cockpit.
- Représenter les objectifs, capacités, processus, tâches, rôles et compétences avec des formes distinctes et des connexions traçables.
- Afficher les modes Humain/IA, les écarts de maturité, les risques, le temps et les coûts directement sur les nœuds utiles.
- Permettre le filtrage par objectif, capacité, rôle, niveau de risque et mode opératoire.
- Ouvrir un panneau de détail au clic sans quitter le graphe.
- Prévoir trois niveaux de lecture : carte exécutive, chaîne opérationnelle et analyse détaillée.

### 3. Agent de connaissance Transformation
- Ajouter un panneau d’analyse à droite du graphe avec des questions suggérées et une zone de dialogue.
- Construire une fonction IA authentifiée qui détermine l’entreprise depuis la session et ne fait confiance à aucun identifiant envoyé par l’écran.
- Donner à l’agent un contexte strictement limité aux données autorisées de l’entreprise : objectifs, capacités, processus, tâches, compétences, diagnostics et articles internes.
- Produire des constats structurés et sourcés : ruptures dans la chaîne, données manquantes, capacités critiques, tâches candidates à l’IA, risques humains et priorités d’intervention.
- Garder les scores, coûts et priorités chiffrées dans les calculs déterministes existants ; l’IA explique et met en relation, sans inventer les valeurs.
- L’agent ne crée, ne modifie et ne supprime rien dans cette version. Chaque recommandation indique ses sources et son niveau de confiance.

### 4. Visuels décisionnels
- Ajouter une carte de couverture stratégie → exécution, une matrice maturité/criticité, une répartition Humain + IA et un flux capacité libérée → intervention → impact attendu.
- Réorganiser scénarios et risques pour comparer clairement l’état actuel, la cible et les hypothèses.
- Maintenir tous les chiffres fictifs Atlas explicitement marqués comme démonstration.

### 5. Données et continuité
- Construire d’abord le graphe à partir des cinq tables Transformation actuelles.
- Réutiliser les référentiels existants de postes, compétences et personnes au lieu d’en créer de nouveaux.
- Ajouter uniquement les liens manquants entre tâches, rôles et compétences, avec migration sécurisée, droits explicites et isolation par entreprise.
- Préparer les futurs nœuds « intervention » et « impact » à partir des actions de diagnostic et mesures déjà présentes, sans lancer d’exécution automatique.

## Direction visuelle

- Palette bleue profonde et claire avec accents de signal chauds, sans vert dominant.
- Instrument Serif pour les titres de décision, Work Sans pour les données et commandes.
- Graphe sur une toile sobre, lignes nettes, niveaux hiérarchiques visibles, densité adaptée aux usages B2B.
- Aucun effet décoratif gratuit : mouvement réservé au parcours, à la sélection des connexions et à l’apparition des analyses.
- Mobile : vue synthétique et parcours vertical ; ordinateur : graphe central avec workflow à gauche et agent à droite.

## Validation

- Vérifier les états vide, Atlas et données réelles.
- Vérifier les filtres, la navigation par nœud, les liens et la conservation de l’étape dans l’URL.
- Vérifier qu’aucune donnée d’une autre entreprise n’entre dans le contexte de l’agent.
- Vérifier que l’agent répond avec sources, distingue faits et hypothèses, et n’effectue aucune écriture.
- Contrôler lisibilité et absence de chevauchement sur mobile et ordinateur, puis exécuter tests et contrôles de compilation.

## Hors périmètre de cette version

- Modifications automatiques par l’agent.
- Exécution autonome d’un plan de transformation.
- Nouveau marketplace ou nouveau référentiel de compétences.
- Promesses chiffrées ou benchmarks non sourcés.