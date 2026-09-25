---
name: Build Vercel de l’API séparée
description: Différences entre le contrôle local TypeScript et la compilation d’une fonction API Vercel dans le monorepo.
---

Pour une API déployée séparément sur Vercel, le script de build du package peut réussir tandis que Vercel refuse ensuite le point d’entrée TypeScript de la fonction : ses imports ESM relatifs sont contrôlés en mode NodeNext, plus strict que le mode bundler du workspace. Un projet API avec une commande de build personnalisée peut aussi exiger un dossier de sortie statique, même si les requêtes utiles sont servies par une fonction.

**Why:** Des builds successifs ont échoué après un contrôle de types local réussi, d’abord sur l’absence de dossier de sortie, puis sur les extensions des imports et une valeur de retour possiblement indéfinie dans le point d’entrée Vercel.

**How to apply:** Lors de changements au point d’entrée ou à la configuration Vercel de l’API, inclure ce point d’entrée dans le contrôle de types local, contrôler ses diagnostics en mode NodeNext et vérifier que le dossier de sortie déclaré existe sans exposer de sources privées.