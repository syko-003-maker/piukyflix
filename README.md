# PiukyFlix

Plateforme de streaming type Netflix/Disney+ : catalogue de films et séries, lecteur vidéo intégré, favoris, historique de visionnage, notes, commentaires, recherche en temps réel et un dashboard d'administration complet.

🟢 **Démo en ligne** : https://piukyflix.onrender.com (offre gratuite Render — le 1er chargement après inactivité peut prendre ~50 s).

Monorepo **pnpm** · API **Express 5** + **Clerk** · **PostgreSQL** (Drizzle) · Frontend **React 19** + **Vite**. Conçu sur Replit, déployable gratuitement ailleurs (voir [DEPLOY.md](DEPLOY.md)).

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Démarrage en local](#démarrage-en-local)
- [Tests](#tests)
- [Déploiement](#déploiement)
- [Transfert de propriété](#transfert-de-propriété)
- [Variables d'environnement](#variables-denvironnement)
- [Commandes](#commandes)
- [Base de données](#base-de-données)
- [Rôles & permissions](#rôles--permissions)
- [Sécurité](#sécurité)
- [Limitations connues](#limitations-connues)

## Fonctionnalités

- **Catalogue** films & séries avec page d'accueil (hero, tendances), pages détail (backdrop, métadonnées, saisons/épisodes).
- **Lecteur vidéo** HTML5 personnalisé : lecture/pause, volume, plein écran, reprise à la position sauvegardée.
- **Favoris**, **historique** de visionnage avec progression, **« Continuer à regarder »**.
- **Notes** (1-5 étoiles) et **commentaires** par contenu.
- **Recherche** en temps réel (titre + description), débouncée.
- **Pagination** « charger plus » sur le catalogue.
- **Authentification** (Clerk) : email, Google, etc.
- **Dashboard admin** : statistiques, gestion du contenu (films, séries, saisons, épisodes), catégories, utilisateurs (rôles, suppression), et **invitations par e-mail** (Resend).

## Stack technique

- **Monorepo** : pnpm workspaces · Node.js 24 · TypeScript 5.9
- **API** : Express 5 · Clerk (auth) · Drizzle ORM · PostgreSQL · Zod (validation) · Pino (logs)
- **Frontend** : React 19 · Vite 7 · Wouter (routing) · TanStack Query · Tailwind CSS v4 · shadcn/ui · Framer Motion
- **Contrat d'API** : OpenAPI → Orval (génère hooks React Query + schémas Zod)
- **Stockage de fichiers** : Replit Object Storage (GCS), URLs présignées *(dormant : les médias sont des URLs externes)*
- **E-mails** : Resend
- **Build** : esbuild (API, bundle ESM) · Vite (frontend)

## Architecture

Approche **contract-first** : [`lib/api-spec/openapi.yaml`](lib/api-spec/openapi.yaml) est la source de vérité. Orval en génère :
- les **hooks React Query** typés → [`lib/api-client-react`](lib/api-client-react) (consommés par le frontend),
- les **schémas Zod** → [`lib/api-zod`](lib/api-zod) (utilisés par l'API pour valider les requêtes).

Le frontend (`/`) appelle l'API sous `/api/*` (même origine). En production single-service, le serveur Express sert aussi le build du frontend (voir [DEPLOY.md](DEPLOY.md)).

```
artifacts/
  api-server/         API Express
    src/routes/         handlers (content, seasons, userContent, admin, auth, search, categories, storage, health)
    src/middlewares/    auth (requireStaff/requireAdmin/getDbUser), rateLimit, clerkProxy
    src/lib/            utils, objectStorage, logger
  streamflix/         Frontend React
    src/pages/          home, browse, content-detail, watch, search, favorites, history, admin/*
    src/components/     layout (Navbar, AdminSidebar) + ui (shadcn)
  mockup-sandbox/     Aperçu isolé des composants UI
lib/
  db/                 Schéma Drizzle + client (lib/db/src/schema/)
  api-spec/           OpenAPI (source de vérité) + config Orval
  api-client-react/   Hooks React Query générés
  api-zod/            Schémas Zod générés
  object-storage-web/ Helpers d'upload (Uppy)
scripts/              Scripts (seed du catalogue, …)
```

## Démarrage en local

> ⚠️ **Important (Windows / macOS)** : le `pnpm-workspace.yaml` épingle les binaires natifs en **Linux-x64 uniquement** (esbuild, rollup, tailwind oxide, lightningcss). `pnpm install` **échoue donc sous Windows/macOS natif**. Utilise **WSL2** (Linux intégré à Windows) ou **Docker**, ou déploie directement sur Render (Linux). C'est pourquoi le dev/déploiement se fait sous Linux.

```bash
# 1. Installer les dépendances (sous Linux / WSL2)
pnpm install

# 2. Configurer l'environnement
cp .env.example .env   # puis renseigner les valeurs (voir plus bas)

# 3. Créer le schéma de base de données
pnpm --filter @workspace/db run push

# 4. (Optionnel) Remplir le catalogue avec du contenu de démo
pnpm --filter @workspace/scripts run seed

# 5. Lancer (dans deux terminaux)
pnpm --filter @workspace/api-server run dev   # API   → :8080 (proxy /api)
pnpm --filter @workspace/streamflix run dev   # Front → /
```

## Tests

Tests unitaires via le runner intégré de Node (`node:test`, aucune dépendance lourde) sur la logique sensible (échappement HTML, bornage des entrées, rate limiter, parsing du host proxy) :

```bash
pnpm --filter @workspace/api-server run test
```

## Déploiement

Hébergement **gratuit, 24/7, hors Replit** : un seul service **Render** (qui sert l'API + le frontend) + base **Neon** + auth **Clerk**. Tout est décrit pas à pas dans **[DEPLOY.md](DEPLOY.md)** ; la configuration est dans [`render.yaml`](render.yaml).

## Transfert de propriété

Pour faire passer le site sous les comptes d'un autre propriétaire (comptes, facturation, contrôle), suis **[HANDOVER.md](HANDOVER.md)**.

## Variables d'environnement

Liste complète et commentée dans [`.env.example`](.env.example).

| Variable | Rôle | Requis |
|---|---|:---:|
| `DATABASE_URL` | Connexion PostgreSQL | ✅ |
| `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Auth (backend) | ✅ |
| `VITE_CLERK_PUBLISHABLE_KEY` | Auth (frontend, injectée au build) | ✅ |
| `REPLIT_DOMAINS` | Hôtes publics → allowlist CORS + liens e-mails | ✅ (prod) |
| `SERVE_CLIENT` | `true` pour que l'API serve le frontend (déploiement single-service) | prod |
| `ADMIN_EMAILS` | E-mails promus admin à la connexion (séparés par virgules) | — |
| `RESEND_API_KEY` | Envoi des invitations par e-mail | — |
| `PUBLIC_OBJECT_SEARCH_PATHS` / `PRIVATE_OBJECT_DIR` | Buckets Object Storage (fonctionnalité dormante) | — |

## Commandes

| Commande | Effet |
|---|---|
| `pnpm run typecheck` | Typecheck de tous les packages |
| `pnpm run build` | Typecheck + build de tous les packages |
| `pnpm --filter @workspace/api-server run dev` | Lancer l'API en dev |
| `pnpm --filter @workspace/streamflix run dev` | Lancer le frontend en dev |
| `pnpm --filter @workspace/api-server run test` | Tests unitaires de l'API |
| `pnpm --filter @workspace/db run push` | Appliquer le schéma DB |
| `pnpm --filter @workspace/scripts run seed` | Insérer le contenu de démo (idempotent) |
| `pnpm --filter @workspace/api-spec run codegen` | Régénérer hooks + schémas Zod depuis l'OpenAPI |

## Base de données

Schéma Drizzle dans [`lib/db/src/schema/`](lib/db/src/schema). Tables :

| Table | Contenu |
|---|---|
| `users` | utilisateurs synchronisés depuis Clerk (rôle, email, avatar) |
| `categories` | catégories de contenu |
| `content` | films & séries (poster, backdrop, vidéo, note moyenne, vues, à la une) |
| `seasons` / `episodes` | saisons et épisodes des séries |
| `favorites` | favoris par utilisateur |
| `watch_history` | progression de visionnage |
| `ratings` | notes (1-5) |
| `comments` | commentaires |
| `invitations` | invitations envoyées par les admins |

Toutes les relations ont des **clés étrangères avec suppression en cascade** (sauf `content → categories`, joint en code applicatif). `watch_history.episodeId` et `invitations.invitedById` passent à `null` à la suppression du parent.

## Rôles & permissions

- **user** : navigation, lecture, favoris, notes, commentaires.
- **moderator** : + gestion du **contenu** (films, séries, catégories, épisodes) et accès au dashboard.
- **admin** : + gestion des **utilisateurs** (rôles, suppression) et **invitations**.

Le premier admin se crée via `ADMIN_EMAILS` (l'e-mail correspondant est promu admin à la connexion). Ensuite, un admin peut promouvoir d'autres utilisateurs depuis le dashboard.

## Sécurité

- **Validation** des requêtes d'écriture via les schémas Zod générés (`@workspace/api-zod`) ; les clés inconnues sont rejetées (anti mass-assignment).
- **Autorisation** à 3 niveaux (`getDbUser` / `requireStaff` / `requireAdmin`) ; la gestion des utilisateurs est réservée aux admins.
- **CORS** restreint à `REPLIT_DOMAINS` ; **rate limiting** en mémoire (300/min global, 30/min sur `/api/auth`, 10/min sur `/api/admin/invite`).
- **E-mails d'invitation** échappés (anti-injection HTML).
- **Clés étrangères + cascades** au niveau base.
- Upload protégé (admin) et objets privés authentifiés.

## Limitations connues

- **Local Windows/macOS** : impossible nativement (binaires Linux-x64) → WSL2, Docker ou Linux.
- **Offre gratuite Render** : l'instance s'endort après ~15 min d'inactivité (1er accès ~50 s).
- **Object Storage** : code présent mais dormant (les médias sont des URLs externes saisies dans l'admin).
- **Rate limiting** en mémoire (par instance) : non partagé entre plusieurs instances (autoscale).
