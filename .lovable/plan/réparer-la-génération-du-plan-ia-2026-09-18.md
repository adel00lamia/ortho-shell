# Réparer la génération du plan IA

## Ce qui a été vérifié

J'ai appelé le service de génération directement avec un jeu de données simple : il a répondu correctement, en français, un plan complet (budget, phases, KPI). Le service n'est donc pas en panne — c'est la demande envoyée depuis l'écran qui est refusée dans certains cas.

Deux causes confirmées par lecture du code et de la liste des modèles disponibles :

1. **Choix du modèle** — l'écran propose 4 modèles, dont deux ne sont plus servis aujourd'hui (« GPT-5 Mini », « Gemini 2.5 Pro ») et un troisième est en fin de vie (« Gemini 2.5 Flash »). Si l'utilisateur en choisit un, la demande est rejetée et l'écran affiche seulement « Generation Failed ».
2. **Champs durée / budget vides** — si le champ « durée » est vidé, la valeur envoyée est 0, ce que le service refuse (minimum 1 mois). Même message d'erreur générique.

À cela s'ajoute un problème de diagnostic : en cas d'échec, l'écran affiche toujours le même message et n'indique jamais la raison réelle (modèle indisponible, champ invalide, crédits, limite de débit).

## Ce que je vais faire

1. **Nettoyer la liste des modèles** : ne garder que des modèles réellement servis (rapide / équilibré / avancé), avec le modèle rapide par défaut, et aligner la liste autorisée côté serveur sur la même liste.
2. **Empêcher une demande invalide** : durée et budget ramenés à des valeurs valides (durée 1–60 mois, budget ≥ 0), et bouton « Générer » désactivé tant qu'un champ obligatoire est vide, avec un message clair sous le champ.
3. **Afficher la vraie raison de l'échec** : remonter le message du serveur dans l'alerte (champ invalide, modèle indisponible, crédits insuffisants, trop de demandes — réessayez dans un instant) au lieu du texte générique.
4. **Vérifier ensuite** en générant un plan de bout en bout sur l'écran, et en relisant les journaux du service.

## Détails techniques

- `src/data/diagnosticConstants.ts` → `AI_MODELS` : remplacer par des ids non dépréciés issus du listing (`google/gemini-3-flash-preview`, `google/gemini-3.8-flash`, `google/gemini-3.1-pro-preview`).
- `supabase/functions/ai-advanced-planner/index.ts` : `allowedModels` synchronisé sur cette liste, fallback inchangé.
- `src/pages/AIPlanBuilder.tsx` : `generatePlan()` — extraire `error.message` / `data.error` de la réponse Supabase (la fonction renvoie déjà `{ error }` avec statuts 400/402/429) et l'afficher dans le toast ; clamp de `duration`/`budget` aux lignes ~1551/1561 ; garde sur le bouton de génération.
- Vérification : `tsgo`, `vitest run`, `vite build`, puis appel réel de la fonction et lecture des logs.
