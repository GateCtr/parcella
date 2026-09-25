---
name: Navigation vers une fiche
description: Précaution contre les erreurs DOM lors du passage de la liste à une fiche.
---

Conserver une navigation complète pour l’action qui ouvre une fiche depuis la liste, plutôt qu’un démontage React de la liste lors du clic, tant que la robustesse avec des outils de traduction et des extensions de navigateur n’a pas été vérifiée. Déclarer l’interface en français et décourager la traduction automatique de son contenu dynamique.

**Why:** Un utilisateur a rencontré une erreur `removeChild` au clic vers une fiche. Le document était déclaré en anglais alors que son contenu était français ; le message de secours anglais apparaissait traduit en français. Une modification du DOM par traduction automatique est une explication plausible, sans preuve que ce soit l’unique cause.

**How to apply:** Si l’action est ramenée à une navigation SPA, vérifier le trajet liste → fiche dans un navigateur avec traduction automatique activée et avec les sélecteurs de filtre ouverts/fermés. Ne pas présumer qu’un contrôle de types ou une capture statique reproduit cette erreur.