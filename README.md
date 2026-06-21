# PiukyFlix

Plateforme de streaming type Netflix/Disney+ : catalogue de films et séries, lecteur vidéo intégré, favoris, historique de visionnage, notes, commentaires, recherche, et un dashboard d'administration. Monorepo pnpm, déployé sur Replit.

> Détails spécifiques à Replit (workflows, déploiement, Auth pane) : voir [replit.md](replit.md).

## Stack

- **Monorepo** pnpm workspaces · Node.js 24 · TypeScript 5.9
- **API** : Express 5 + Clerk (auth) · Drizzle ORM + PostgreSQL
- **Frontend** : React 19 + Vite · Wouter · TanStack Query · Tailwind v4 · shadcn/ui
- **Contrat d'API** : OpenAPI → Orval (hooks React Query + schémas Zod)
- **Stockage de fichiers** : Replit Object Storage (GCS), URLs présignées
- **E-mails** : Resend (invitations)

## Prérequis

- Node.js 24+
- pnpm 9+ (`corepack enable`)
- Une base PostgreSQL

## Démarrage

```bash
# 1. Installer les dépendances
pnpm install

# 2. Configurer l'environnement
cp .env.example .env   # puis renseigner les valeurs

# 3. Créer le schéma de base de données
pnpm --filter @workspace/db run push

# 4. (Optionnel) Remplir le catalogue avec du contenu de démo
pnpm --filter @workspace/scripts run seed

# 5. Lancer (dans deux terminaux)
pnpm --filter @workspace/api-server run dev   # API   → :8080 (proxy /api)
pnpm --filter @workspace/streamflix run dev   # Front → /
```

## Déploiement (en ligne, gratuit)

Pour héberger l'app 24/7 sans Replit (un seul service Render + base Neon, 0 €), suis [DEPLOY.md](DEPLOY.md). La config est dans [render.yaml](render.yaml).

## Variables d'environnement

Liste complète et commentée dans [.env.example](.env.example). Essentielles :

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL |
| `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Auth (backend) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Auth (frontend) |
| `RESEND_API_KEY` | Envoi des invitations |
| `PUBLIC_OBJECT_SEARCH_PATHS` / `PRIVATE_OBJECT_DIR` | Buckets de stockage |
| `REPLIT_DOMAINS` | Hôtes publics → allowlist CORS |
| `ADMIN_EMAILS` | E-mails promus admin à la connexion (optionnel) |

> ⚠️ Sur Replit, ces variables sont gérées par la plateforme. Le proxy Clerk (actif en production uniquement) et l'Object Storage dépendent de l'environnement Replit ; en local, l'auth et l'upload de fichiers peuvent être limités.

## Commandes utiles

| Commande | Effet |
|---|---|
| `pnpm run typecheck` | Typecheck de tous les packages |
| `pnpm run build` | Typecheck + build |
| `pnpm --filter @workspace/db run push` | Applique le schéma DB |
| `pnpm --filter @workspace/scripts run seed` | Insère le contenu de démo |
| `pnpm --filter @workspace/api-spec run codegen` | Régénère hooks + schémas Zod depuis l'OpenAPI |

## Rôles & permissions

- **user** : navigation, lecture, favoris, notes, commentaires.
- **moderator** : + gestion du contenu (films, séries, catégories, épisodes) et dashboard.
- **admin** : + gestion des utilisateurs (rôles, suppression) et invitations.

Le premier admin se crée via `ADMIN_EMAILS` (l'e-mail correspondant est promu admin à la connexion). Ensuite, un admin peut promouvoir d'autres utilisateurs depuis le dashboard.

## Structure

```
artifacts/
  api-server/        API Express (routes, middlewares, lib)
  streamflix/        Frontend React (pages, components)
  mockup-sandbox/    Aperçu de composants UI
lib/
  db/                Schéma Drizzle + client
  api-spec/          OpenAPI (source de vérité) + config Orval
  api-client-react/  Hooks React Query générés
  api-zod/           Schémas Zod générés
  object-storage-web/ Helpers d'upload
scripts/             Scripts utilitaires (seed, …)
```

## Sécurité

- Routes d'écriture validées par les schémas Zod générés (`@workspace/api-zod`).
- Autorisation à 3 niveaux : `user` / `moderator` (contenu) / `admin` (utilisateurs).
- CORS restreint via `REPLIT_DOMAINS` ; rate limiting en mémoire sur l'API.
- Clés étrangères + suppressions en cascade au niveau base de données.
