---
name: Plaque et impression
description: Choix de données pour le modèle de plaque et comportement observé à l'impression dans Chromium
---

La ligne « LO/ » du modèle photographié ne doit pas être remplie en recopiant le quartier ou la commune si la localité n'est pas renseignée distinctement.

**Why:** Le modèle distingue localité, quartier et commune ; substituer un autre champ attribuerait une fausse adresse à une plaque.

**How to apply:** Ajouter un champ de localité explicite si cette ligne doit figurer sur toutes les plaques, avec une valeur facultative pour les anciennes fiches.

Dans Chromium, l'attribution d'une page CSS nommée à un élément interne de la plaque a produit une seconde page blanche, même quand l'image tenait sur une feuille.

**Why:** Le changement de type de page entre l'élément et ses ancêtres peut déclencher une rupture de pagination.

**How to apply:** Pour cette impression dédiée, appliquer la taille paysage à la page entière uniquement lorsque la vue plaque est montée, et vérifier le nombre de pages du PDF après toute modification de l'impression.