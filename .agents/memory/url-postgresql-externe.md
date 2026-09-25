---
name: Format des URL PostgreSQL externes
description: Précaution pour valider les secrets de connexion aux bases externes sans divulguer leur valeur.
---

Avant de connecter une base externe avec un secret fourni par l’utilisateur, vérifier de manière non révélatrice que la valeur est une URL PostgreSQL seule, et non une affectation de variable ou une commande contenant cette URL.

**Why:** Une valeur contenant une URL valide mais précédée d’un autre texte a produit une erreur DNS trompeuse (`ENOTFOUND`). L’extraction en mémoire a permis de comparer et migrer les données, mais les outils qui utilisent directement ce secret attendent une URL pure.

**How to apply:** Contrôler uniquement des indicateurs de forme (protocole présent, URL analysable) sans journaliser la chaîne ni le nom d’hôte. Si le secret doit être réutilisé directement par l’application ou un outil, demander sa correction via le formulaire sécurisé, jamais par chat.