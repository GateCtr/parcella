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
   | `PUBLIC_VERIFICATION_ORIGIN` | Origine HTTPS permanente des QR (par exemple `https://registre.exemple.org`, sans chemin). L'adresse doit déjà servir le frontend et l'API publiquement. |
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

## QR des plaques avant toute impression

Les dix SVG actuellement enregistrés utilisent le domaine temporaire de développement. **Ils ne sont pas prêts à imprimer.** La destination d'un QR physique ne change pas quand on modifie une variable ou une base de données : il faut choisir une adresse HTTPS permanente, contrôlée durablement. Une redirection vers un autre hébergeur peut ensuite être changée sur cette adresse permanente.

1. Choisir cette adresse, publier le registre sur celle-ci et définir `PUBLIC_VERIFICATION_ORIGIN` dans l'environnement qui lit et écrit **la même base que les plaques**. Ne pas utiliser un domaine `.replit.dev`. La page `/verification` et l'API `/api/healthz` doivent répondre publiquement sans connexion. Pour Vercel, transférer d'abord les données existantes et conserver `SESSION_SECRET` ; une base neuve ne contient aucune des dix plaques.
2. Depuis un environnement d'administration relié à cette base, avec `PUBLIC_VERIFICATION_ORIGIN` et le même `SESSION_SECRET`, lancer la simulation :

   ```sh
   pnpm --filter @workspace/api-server run qr:migrate
   ```

   La commande contrôle la disponibilité publique de la page et de l'API, l'intégrité des codes présents et la forme des SVG ; elle affiche seulement le nombre de plaques à modifier, dont celles sans code. Elle s'arrête si une plaque déjà imprimée doit changer, si un code ne peut pas être déchiffré ou si un SVG est inconnu. Elle ne change rien en simulation.
3. Après vérification de l'adresse et de la base visée, lancer `pnpm --filter @workspace/api-server run qr:migrate --apply`. La mise à jour transactionnelle change **uniquement le chemin QR dans chaque SVG** et attribue un code aux plaques anciennes qui n'en ont pas, sans créer de nouvelle version ni remplacer la fiche, le numéro ou l'historique. Les codes existants sont conservés. Elle ajoute une entrée d'audit par SVG modifié ; une nouvelle simulation doit annoncer zéro modification.
4. Sur un téléphone non connecté au compte du registre, scanner **le SVG final** de chaque plaque avant impression/pose : l'URL doit ouvrir `/verification#code=…` sur l'adresse permanente, afficher la bonne plaque et ne demander aucune connexion. Confirmer ensuite l'impression dans l'application. Cette confirmation est refusée tant que l'origine permanente n'est pas configurée ou que le QR enregistré ne correspond pas à cette origine.

Pour les liens déjà imprimés sur l'ancienne adresse `.replit.dev`, modifier les SVG en base ne change pas le support physique : il faut que l'ancien domaine reste accessible et redirige `/verification` en conservant le fragment `#code=…` (une redirection vers le même chemin le conserve normalement), ou remplacer ces supports. Les URL temporaires Replit ne sont pas une stratégie de redirection garantie. Aucune redirection ne peut être installée avant de connaître et de contrôler l'ancienne adresse et la nouvelle. Ne pas installer une redirection ouverte vers une destination fournie par un visiteur.

**Aucun déploiement Vercel ni transfert de données n'est effectué par cette préparation.** Pour conserver les fiches et les traces d'audit actuelles lors d'un changement d'hébergeur, organiser une migration explicite vers la base externe avant de basculer les utilisateurs.

Documentation Vercel : [Express](https://vercel.com/docs/frameworks/backend/express), [Vite et routes SPA](https://vercel.com/docs/frameworks/frontend/vite), [configuration `vercel.json`](https://vercel.com/docs/project-configuration/vercel-json) et [réécritures](https://vercel.com/docs/routing/rewrites).