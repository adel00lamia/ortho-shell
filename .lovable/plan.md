# Refonte du rapport de plan de formation

## Objectif
Produire un rapport de niveau cabinet de conseil qui utilise réellement le budget saisi, évite les données organisationnelles non fiables et aide la direction à choisir les formations les plus importantes pour son secteur.

## Changements prévus

### 1. Budget fiable et entièrement rapproché
- Faire du budget saisi dans le formulaire la seule référence budgétaire du rapport généré.
- Empêcher un ancien plan, une recherche d’entreprise ou une donnée secondaire de remplacer ce montant.
- Après la réponse IA, recalculer la ventilation pour que son total soit exactement égal au budget fourni, par exemple 200 000 MAD.
- Rapprocher également les coûts des actions avec cette ventilation ; le rapport affichera budget disponible, budget affecté et écart, avec un écart final de 0 MAD.
- Si aucun budget n’est fourni, conserver « À chiffrer » sans inventer de montant.

### 2. Retirer les données non fiables
- Supprimer du rapport les effectifs, la répartition par département et les nombres de titulaires par poste.
- Ne plus injecter ces informations dans les consignes données à l’IA.
- Retirer le texte automatique qui ajoute actuellement un nombre de salariés et de départements au contexte.
- Conserver uniquement les données utiles et suffisamment fiables : entreprise, secteur, objectifs, compétences évaluées, contraintes, budget et contexte fourni.

### 3. Analyse sectorielle utile
- Ajouter une section visible « Tendances sectorielles et implications compétences ».
- Pour chaque tendance : expliquer le changement, les compétences touchées, l’urgence et la réponse de formation recommandée.
- Interdire les statistiques non sourcées ; les tendances seront présentées comme analyse à valider lorsqu’aucune source datée n’est disponible.

### 4. Top formations et arbitrage exécutif
- Ajouter un classement des formations prioritaires avec : rang, formation, raison stratégique, tendance liée, compétence ciblée, priorité, horizon, budget alloué et résultat attendu.
- Donner davantage de poids budgétaire aux actions prioritaires plutôt qu’une série de petits montants génériques.
- Ajouter une page de recommandations concrètes : « lancer maintenant », « préparer ensuite », « ne pas financer avant validation ».

### 5. Présentation du rapport
- Recentrer la synthèse sur les décisions : budget, priorités, calendrier, risques et résultats attendus.
- Mettre les tendances et le portefeuille priorisé avant les annexes SWOT/PESTEL.
- Garder SWOT et PESTEL comme justification analytique, sans gonfler le rapport avec des informations administratives inutiles.

## Détails techniques
- Étendre le format du plan avec des tendances structurées et des recommandations exécutives classées.
- Renforcer les règles du générateur IA et ajouter une normalisation déterministe côté service pour les totaux budgétaires.
- Mettre à jour le PDF et l’aperçu du plan afin qu’ils utilisent les mêmes montants normalisés.
- Les plans déjà enregistrés resteront lisibles ; les nouveaux champs seront optionnels.

## Validation
- Tester explicitement un budget de 200 000 MAD et vérifier : ventilation = 200 000 MAD, somme des actions = 200 000 MAD, écart = 0 MAD.
- Vérifier qu’aucun effectif ni département n’apparaît dans le nouveau rapport.
- Contrôler visuellement le PDF page par page.
- Exécuter les vérifications de types, tests existants et compilation, sans publication.
