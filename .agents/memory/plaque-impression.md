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

Dans Chromium, une marge de page CSS non nulle laisse apparaître l'URL du site dans le pied de page automatique. Une marge de page nulle supprime ce pied de page, à condition de rétablir l'espace voulu autour de la plaque dans sa propre mise en page.

**Why:** L'adresse du site ne doit pas figurer sur une plaque imprimée ; masquer un élément HTML ne peut pas supprimer un pied de page généré par le navigateur.

**How to apply:** Vérifier l'impression avec les réglages de pied de page par défaut (sans option qui le désactive artificiellement), puis contrôler à la fois l'absence d'URL et le maintien d'une seule page.