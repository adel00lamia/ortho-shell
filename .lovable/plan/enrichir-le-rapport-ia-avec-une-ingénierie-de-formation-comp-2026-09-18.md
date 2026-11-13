# Enrichir le rapport IA avec une ingénierie de formation complète

## Objectif
Faire évoluer le rapport actuel, déjà structuré pour un comité de direction, vers un véritable rapport d’ingénierie de formation inspiré du niveau de détail de l’exemple Averda, sans reprendre ses données, ses dates, ses prestataires ni ses affirmations.

## Évolutions proposées

1. **Renforcer le diagnostic d’entrée**
   - Ajouter le contexte entreprise et la population concernée à partir des informations réellement fournies.
   - Présenter les besoins sous la chaîne : constat/difficulté → compétence à développer → objectif opérationnel → réponse formation ou mesure d’accompagnement.
   - Signaler clairement « À confirmer » lorsque la source manque.

2. **Structurer le plan par axes de formation**
   - Regrouper les actions en axes cohérents (management, outils, sécurité, métier, etc.) générés selon le contexte de l’entreprise.
   - Ajouter pour chaque axe un tableau : thèmes, difficultés constatées, objectifs pédagogiques et mesures d’accompagnement.
   - Conserver la matrice SWOT et le PESTEL comme justification stratégique en annexe.

3. **Créer des fiches-actions plus détaillées**
   - Pour chaque formation : public cible, prérequis, compétences, objectifs pédagogiques, contenu, modalité, durée, évaluation, transfert en situation de travail, responsable, priorité et budget si fourni.
   - Ne jamais inventer le nombre de groupes, de participants, le prestataire, les dates précises ou le coût : afficher « À planifier », « À sélectionner » ou « À chiffrer ».

4. **Ajouter une matrice opérationnelle consolidée**
   - Tableau de programmation : action, axe, type, public, durée, groupes, participants, période, responsable/prestataire et coût.
   - Totaux uniquement lorsque les données nécessaires existent.
   - Distinguer les données fournies, les calculs et les hypothèses à valider.

5. **Compléter le suivi et la conformité**
   - Ajouter le dispositif d’évaluation avant/pendant/après, le transfert en poste et les preuves attendues.
   - Ajouter une checklist documentaire CSF/OFPPT indicative, sans promettre l’éligibilité ni le remboursement.
   - Garder les justificatifs administratifs comme annexes à fournir, jamais comme données générées.

## Détails techniques
- Étendre le format de réponse du moteur IA avec `training_axes`, des champs pédagogiques et de programmation sur chaque module, et une `evidence_register`.
- Normaliser les nouveaux champs côté fonction IA et garder la compatibilité avec les anciens plans.
- Étendre les types partagés et le PDF sans modifier les données historiques sauvegardées.
- Le rapport restera en français, A4, visuellement aligné avec la direction « Executive Analytical Report » sélectionnée.

## Validation
- Générer un rapport de contrôle avec données fictives explicitement identifiées.
- Vérifier visuellement chaque page : tableaux, coupures, lisibilité et totaux.
- Vérifier les types, les tests existants et la compilation.
