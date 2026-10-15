# Roadmap

## Vision
SaaS B2B couvrant toute la chaîne de valeur formation : détection du besoin → assessment → plan de formation IA → exécution (formation interne d'abord) → carrière / upskilling-reskilling → mesure d'impact. Le diagnostic est le portillon de la chaîne, pas le produit entier.

## Done
- [x] Carte complète de Transformation RH : organigramme, activités Humain + IA, workflow, contrôles, approbations, preuves et business case
- [x] Démonstration guidée Atlas Industries en 6 étapes dans le cockpit Transformation, avec données, analyse et livrable attendus
- [x] Refonte premium de la page d’accueil autour du cockpit Transformation, du WorkGraph et des livrables décisionnels
- [x] Parcours d'entretien guidé : Pitch en 3 étapes, STAR, Passé/Présent/Futur et Pitch impactant, avec entraînement Sarah
- [x] Rapport IA recentré sur le budget saisi, les tendances sectorielles, les formations prioritaires et les recommandations exécutives
- [x] Sécurisation des données participants (Pulse, portail, documents CSF)
- [x] Pulse terrain public + ateliers + portail participant
- [x] Diagnostic cause racine (7 causes, Training Fit Score, carte de décision)
- [x] Rapport de diagnostic PDF FR/EN
- [x] Page tarifs FR « sur devis » + estimateur du plafond récupérable
- [x] Rapport d'architecture / technique / cahier des charges
- [x] Colonne vertébrale de la chaîne : table `development_items` + page « Chaîne de valeur » (/workflow/chain) reliant écart → levier → plan → formation interne → niveau mis à jour sur la personne
- [x] Formation interne remise en navigation (Studio de modules, Certificats)
- [x] Rapport du plan de formation niveau comité de direction : identité et période figées, synthèse, portefeuille, calendrier, budget contrôlé, KPI, gouvernance, risques et cadre CSF/OFPPT
- [x] Enrichissement visuel du rapport : indicateurs de synthèse, chronologie, graphe budgétaire, matrice SWOT et tableau/empreinte PESTEL
- [x] Ingénierie détaillée du rapport : axes, chaîne constat-compétence-objectif, fiches-actions, programmation et registre de preuves inspirés du rapport de référence
- [x] Plan Builder fiabilisé avec génération compacte, traçabilité objectif → action et transfert du plan sauvegardé vers l’ingénierie OFPPT

## Next
- [x] Corriger les trois signalements : plafond Claude et détection des réponses partielles, secteur RH, polices locales (95 tests réussis ; génération authentifiée non vérifiable ici)
- [x] Transformer le cockpit `/transformation` en workflow piloté par un WorkGraph central et un agent de connaissance en lecture seule
- [x] Relier le WorkGraph aux rôles, compétences, personnes, interventions et mesures d’impact existants sans dupliquer les référentiels
- [ ] Alimenter la chaîne depuis le diagnostic de cause racine (créer les lignes de développement à partir des actions formation)
- [ ] Relier une ligne de développement à un module interne précis (et non seulement au plan)
- [ ] Vue carrière / succession alimentée par les niveaux réellement acquis
- [ ] Dossier CSF/OFPPT complet
- [ ] Annuaire de prestataires rattaché aux actions du plan (marketplace seulement après demande prouvée)
- [ ] 3 études de cas chiffrées dans un même secteur
- [ ] Espace partenaire marque blanche

## Bloqué (action utilisateur)
- [ ] Activer la protection contre les mots de passe compromis (tableau de bord Supabase)
- [ ] Fournir un contact réel (email / téléphone) pour les boutons « Demander un devis »
