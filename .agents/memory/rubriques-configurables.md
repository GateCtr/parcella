---
name: Rubriques configurables
description: Contrainte métier pour la visibilité des rubriques et les données historiques des fiches.
---

Les rubriques facultatives peuvent être masquées sans rendre la création d’une fiche impossible. Toute donnée indispensable à chaque fiche doit rester saisissable dans une rubrique permanente ; les valeurs déjà enregistrées ne doivent pas être effacées quand une rubrique devient invisible.

**Why:** Une rubrique de conclusion peut être désactivée alors qu’elle contenait auparavant une date nécessaire à toutes les fiches. Masquer seulement l’interface aurait bloqué la validation ; effacer les champs masqués aurait détruit les anciennes observations.

**How to apply:** Pour tout nouveau champ obligatoire, vérifier qu’il reste accessible et valide quand les huit rubriques facultatives sont coupées. Appliquer les réglages à l’affichage et à la saisie sans réécrire les fiches existantes.