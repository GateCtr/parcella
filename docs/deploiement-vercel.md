# Préparer le registre parcellaire pour Vercel

Ce dépôt déploie **un seul projet Vercel** : le frontend Vite est servi comme fichiers statiques, et l'API Express tourne dans la fonction `api/index.ts`. La configuration est dans `vercel.json`. Les chemins `/api/*` sont envoyés à la fonction ; les autres chemins de l'application React sont réécrits vers `index.html` pour permettre les liens directs.

## Avant le premier déploiement

1. Importer le dépôt dans Vercel en gardant **la racine du dépôt** comme *Root Directory*. Le build `pnpm run build:vercel` est défini dans `vercel.json` ; Vercel détecte `pnpm-lock.yaml`. Ne pas choisir `artifacts/registre-parcellaire` comme racine : la fonction et les bibliothèques partagées se trouvent ailleurs dans le dépôt.
2. Prévoir une **base PostgreSQL externe accessible depuis Vercel**, distincte de la base de développement Replit. La configuration ne crée pas de base et ne transfère aucune donnée. Pour une base externe **neuve et vide**, fournir son URL à `EXTERNAL_DATABASE_URL` dans un environnement d'administration sécurisé puis exécuter **une seule fois**, avant la mise en ligne :

   ```sh
   pnpm --filter @workspace/db run migration:apply
   ```

   Cette commande applique les migrations versionnées de `lib/db/drizzle/`. Elle ne lit pas `DATABASE_URL` et n'est appelée ni pendant le build ni au démarrage. **Ne pas l'exécuter sur la base Replit ou une base déjà peuplée** : une reprise des données existantes nécessite une sauvegarde, une importation et un plan d'adoption du schéma distincts. La publication Replit continue à gérer son propre schéma indépendamment.
3. Dans les paramètres **Environment Variables** du projet Vercel, configurer pour l'environnement concerné :

   | Variable | Rôle |
   | --- | --- |
   | `DATABASE_URL` | Connexion à la même base PostgreSQL externe déjà préparée ; utiliser la connexion/pool recommandée par le fournisseur. |
   | `SESSION_SECRET` | Secret stable utilisé pour chiffrer les données personnelles. Si des fiches chiffrées sont transférées, **conserver la même valeur** que dans l'environnement source, faute de quoi elles ne pourront plus être déchiffrées. |
   | `ADMIN_BOOTSTRAP_EMAIL` | Adresse de l'admin principal à créer si la base ne contient encore aucun admin. |
   | `ADMIN_BOOTSTRAP_CODE` | Code initial robuste de l'admin principal, requis uniquement pour une base sans admin ; la valeur ne doit jamais être inscrite dans le dépôt. |

   Les variables de Replit ne sont **pas automatiquement copiées** vers Vercel. Ne pas préfixer ces secrets par `VITE_` : ce préfixe les exposerait au navigateur. `EXTERNAL_DATABASE_URL` ne sert qu'à la commande d'administration de migration, pas à l'application déployée. `TRUST_PROXY_HOPS` est optionnel et ne doit être activé qu'après vérification de la chaîne de proxy ; le limiteur par adresse e-mail fonctionne même sans lui.
4. Pour les *Preview Deployments*, prévoir une base et des variables séparées de la production ; ne pas connecter une prévisualisation à la base de production par inadvertance.

La fonction initialise l'admin au **premier appel API** lorsqu'une base neuve a été migrée. Cette initialisation est idempotente. Les autres comptes sont ensuite créés par l'admin, qui remet leurs codes manuellement. Si la base contient déjà un admin actif, son compte est conservé et le code de bootstrap ne le réinitialise pas.

## Vérifier après le déploiement

- Ouvrir `/api/healthz` et vérifier la réponse de l'API ; une erreur `503` peut indiquer une base ou des variables de bootstrap manquantes. Ne pas afficher les secrets dans les journaux.
- Ouvrir directement `/sign-in` puis `/dashboard` dans un navigateur neuf : la seconde adresse doit rediriger vers la connexion sans session.
- Se connecter, vérifier `/api/auth/me`, la gestion des utilisateurs, la création/rotation des codes et la déconnexion. Tester les appels POST depuis le domaine Vercel réel : l'API vérifie l'origine des mutations.
- Vérifier un lien profond vers une fiche et le domaine encodé dans une plaque générée. Les URL de développement Replit ne doivent pas être utilisées en production.

**Aucun déploiement Vercel ni transfert de données n'est effectué par cette préparation.** Pour conserver les fiches et les traces d'audit actuelles lors d'un changement d'hébergeur, organiser une migration explicite vers la base externe avant de basculer les utilisateurs.

Documentation Vercel : [Express](https://vercel.com/docs/frameworks/backend/express), [Vite et routes SPA](https://vercel.com/docs/frameworks/frontend/vite), [configuration `vercel.json`](https://vercel.com/docs/project-configuration/vercel-json) et [réécritures](https://vercel.com/docs/routing/rewrites).