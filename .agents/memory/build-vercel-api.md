---
name: Build Vercel de l’API séparée
description: Différences entre le contrôle local TypeScript et la compilation d’une fonction API Vercel dans le monorepo.
---

Pour une API déployée séparément sur Vercel, le script de build du package peut réussir tandis que Vercel refuse ensuite le point d’entrée TypeScript de la fonction : il contrôle progressivement **tout le graphe TypeScript importé** en mode NodeNext, plus strict que le mode bundler du workspace. Préférer une fonction d’entrée JavaScript qui importe un bundle produit pendant le build, plutôt que convertir tous les imports des sources à NodeNext. Un projet API avec une commande de build personnalisée peut aussi exiger un dossier de sortie statique, même si les requêtes utiles sont servies par une fonction.

**Why:** Des builds successifs ont échoué après un contrôle de types local réussi, d’abord sur l’absence de dossier de sortie, puis sur les extensions des imports et une valeur de retour possiblement indéfinie dans le point d’entrée Vercel. Même un contrôle NodeNext local limité au point d’entrée n’a pas reproduit un diagnostic Vercel ultérieur sur le type appelable d’Express.

**How to apply:** Lors de changements au point d’entrée ou à la configuration Vercel de l’API, maintenir le bundle serveur sans le démarrage du port et en vérifier l’import comme fonction en mode production. Inclure la source du gestionnaire dans le contrôle de types local, sans considérer ce contrôle comme identique au compilateur Vercel. Vérifier que le dossier statique déclaré existe sans exposer de sources privées ; seul le prochain build Vercel confirme son propre packaging.