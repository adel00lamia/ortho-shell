# Refaire le rapport du plan de formation au niveau cabinet de conseil

## Objectif
Remplacer le PDF actuel par un rapport stratégique en français, structuré pour un comité de direction, avec une identité d'entreprise, une période et des données cohérentes de bout en bout.

## Corrections de fiabilité
- Figer au moment de la génération le nom de l'entreprise, le secteur, le pays, le budget, la durée et la date ; l'export utilisera cette version et non les champs modifiés ensuite.
- Empêcher une recherche d'entreprise ou un modèle enregistré de remplacer silencieusement le nom saisi.
- Ajouter au résultat généré des métadonnées contrôlées par le serveur : entreprise, secteur, pays, date d'émission et période du plan.
- Interdire à l'IA de reprendre comme objectifs actuels les dates, entreprises ou affirmations provenant d'anciens plans.
- Traiter toute donnée non fournie (baseline, ROI, marché, remboursement, objectif chiffré) comme « à confirmer », jamais comme un fait.

## Nouvelle structure du rapport
1. Couverture sobre « Consulting executive cover » : entreprise réelle, titre lisible, période du plan, date d'émission, statut et confidentialité.
2. Synthèse décisionnelle d'une page : contexte, constats établis, décisions attendues, priorités et réserves.
3. Diagnostic des besoins : sources utilisées, écarts de compétences et hypothèses clairement séparées.
4. Portefeuille de formation priorisé : population, compétence cible, niveau visé, modalité, durée, coût et justification.
5. Feuille de route : phases datées à partir de la date réelle de génération, jalons, livrables et responsables.
6. Budget : allocation, total de contrôle et écarts ; aucun coût inventé lorsque le budget est absent.
7. Mesure de performance : baseline, cible, source, fréquence et propriétaire ; valeurs manquantes indiquées « à mesurer ».
8. Gouvernance et risques : comités, responsabilités, dépendances, mesures de mitigation.
9. Cadre CSF/OFPPT : références à vérifier, sans promesse de remboursement automatique.
10. Annexes : SWOT/PESTEL et analyse de marché, uniquement lorsqu'elles reposent sur des entrées ou sources explicites.

## Présentation
- Français homogène, palette bleu profond et gris, typographie sobre, tableaux denses et lisibles.
- Titres longs automatiquement répartis sur plusieurs lignes, marges stables et pieds de page cohérents.
- Badges « Donnée fournie », « Calcul », « Hypothèse à valider » et note méthodologique.
- Sommaire limité aux sections réellement présentes dans le document.

## Détails techniques
- Centraliser les types du plan et les métadonnées du rapport.
- Revoir le prompt et normaliser la réponse côté fonction IA avant retour à l'écran.
- Refaire `PlanPDFExport` autour de composants de page réutilisables et d'une pagination robuste.
- Conserver l'export jsPDF existant et ne faire aucune migration de données.

## Vérification
- Générer un rapport de contrôle « Groupe Safari » avec l'année courante et vérifier l'absence de « Atlas Industries Maroc » et d'objectifs 2025 obsolètes.
- Convertir chaque page du PDF en image et contrôler visuellement titres, tableaux, coupures, accents, marges et pagination.
- Exécuter les vérifications de types, les tests et contrôler l'état du build.
