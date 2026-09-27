# Fiabiliser le Plan Builder et le relier à l’ingénierie OFPPT

## Objectif
Faire du Plan Builder le parcours central de Qimatak : partir des objectifs de l’entreprise, produire rapidement un plan exploitable, puis préparer les actions du dossier d’ingénierie/OFPPT sans ressaisie.

## Changements prévus
1. **Réparer la génération principale**
   - Réduire la demande IA au livrable essentiel : synthèse, axes, actions, budget, calendrier, KPI, preuves et recommandations.
   - Limiter explicitement le nombre d’axes et d’actions pour terminer avant la limite du service.
   - Conserver le budget saisi comme total unique et les règles « à confirmer / à chiffrer ».
   - Retourner un plan exploitable même si le flux IA est interrompu après avoir produit du contenu partiel valide.

2. **Renforcer l’alignement avec l’entreprise**
   - Donner la priorité aux objectifs saisis, écarts de compétences et postes critiques issus des données réelles de l’entreprise.
   - Afficher dans le résultat la chaîne traçable : objectif d’entreprise → compétence → action → indicateur.
   - Éviter que les données de démonstration Atlas contaminent le plan d’une autre entreprise.

3. **Créer un passage clair vers l’ingénierie OFPPT**
   - Après sauvegarde, proposer « Préparer le dossier OFPPT ».
   - Réutiliser le plan sauvegardé pour préremplir les actions, objectifs, budget, durées et modalités dans l’ingénierie de formation.
   - Présenter CSF/OFPPT comme cadre de référence à vérifier, sans promettre de remboursement.

4. **Validation**
   - Déployer la fonction corrigée.
   - Lancer une génération réelle avec les données actuelles et vérifier le rapport obtenu.
   - Vérifier la sauvegarde et l’ouverture du parcours OFPPT, puis contrôler compilation et tests ciblés.

## Limites
- Aucun montant de remboursement OFPPT ne sera garanti ou inventé.
- Les tendances sectorielles sans source datée resteront signalées comme analyses à valider.
- La génération enrichie (SWOT/PESTEL détaillés) restera secondaire afin de ne plus bloquer le plan principal.
