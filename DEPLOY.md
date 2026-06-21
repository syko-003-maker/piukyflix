# Déploiement gratuit — Render + Neon

Héberge PiukyFlix **en ligne, 24/7, pour 0 €** : un seul service Render (qui sert l'API **et** le frontend) + une base PostgreSQL Neon. Tout est piloté par [`render.yaml`](render.yaml).

> Pourquoi ça marche hors Replit : Render build sur **Linux-x64**, donc les binaires épinglés du workspace fonctionnent (c'est ce qui bloque sous Windows). L'Object Storage Replit est dormant (les médias sont des URLs externes) → aucun impact.

## Comptes à créer (tous gratuits)

- [Neon](https://neon.tech) — base PostgreSQL
- [Clerk](https://clerk.com) — authentification ⚠️ (voir l'étape 2 : le Clerk « géré par Replit » ne suit pas)
- [Render](https://render.com) — hébergement
- [Resend](https://resend.com) — emails d'invitation (optionnel)
- Un dépôt **GitHub** avec ce code

---

## Étape 1 — Base de données (Neon)

1. Crée un projet sur Neon.
2. Copie la **connection string** (format `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require`).
3. Garde-la de côté → ce sera `DATABASE_URL`.

## Étape 2 — Authentification (Clerk) ⚠️ important

Ton Clerk actuel est **géré par Replit** et ne fonctionnera pas ailleurs. Crée le tien :

1. Sur Clerk, crée une **application**.
2. Active les méthodes de connexion voulues (Email, Google…).
3. Dans **API Keys**, copie :
   - la **Publishable key** (`pk_test_…`) → `CLERK_PUBLISHABLE_KEY` **et** `VITE_CLERK_PUBLISHABLE_KEY` (même valeur)
   - la **Secret key** (`sk_test_…`) → `CLERK_SECRET_KEY`
4. Commence avec les clés **`pk_test`/`sk_test`** (instance de dev : elles fonctionnent sur n'importe quel domaine, dont `*.onrender.com`). Tu passeras en `pk_live` plus tard avec ton domaine.
5. Ne définis **pas** `VITE_CLERK_PROXY_URL` (le proxy Replit n'est plus nécessaire).

## Étape 3 — Emails (Resend, optionnel)

Seulement si tu veux les invitations. Crée une clé API → `RESEND_API_KEY`, et **vérifie un domaine** dans Resend (sinon les envois sont limités à ta propre adresse). Sans ça, l'app marche, seules les invitations sont désactivées.

## Étape 4 — Pousser le code sur GitHub

Depuis le dossier du projet (celui qui contient `render.yaml`) :

```bash
git add -A
git commit -m "Préparation déploiement Render"
git push
```

## Étape 5 — Déployer sur Render

1. Render → **New** → **Blueprint**.
2. Connecte ton dépôt GitHub. Render détecte automatiquement [`render.yaml`](render.yaml).
3. Render demande les variables marquées `sync: false` → renseigne-les (voir tableau ci-dessous).
4. **Apply** / **Create**. Render lance le build (`install → build front → build API → push DB → seed`) puis démarre.

### Variables à renseigner

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | la connection string Neon |
| `CLERK_SECRET_KEY` | `sk_test_…` |
| `CLERK_PUBLISHABLE_KEY` | `pk_test_…` |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_…` (identique) |
| `REPLIT_DOMAINS` | ton hôte Render, ex. `piukyflix.onrender.com` (sans `https://`) |
| `RESEND_API_KEY` | optionnel |
| `ADMIN_EMAILS` | optionnel, ton email pour être admin |

> `REPLIT_DOMAINS` : tu connaîtras l'URL exacte après la 1re création. Mets une valeur provisoire, puis corrige-la et relance un déploiement.

## Étape 6 — Après le déploiement

- Le **schéma DB est créé** et le **catalogue de démo est inséré** automatiquement (via le build).
- Ouvre `https://<ton-app>.onrender.com`, connecte-toi : si ton email est dans `ADMIN_EMAILS`, tu es **admin** (accès au dashboard).
- Ajoute ton vrai contenu via le dashboard admin.

---

## Notes & dépannage

- **Mise en veille (free tier)** : le service Render gratuit s'endort après ~15 min d'inactivité ; le 1er accès suivant prend ~30-60 s (cold start). Neon se réveille aussi tout seul. Pour éviter ça : passer Render en payant, ou pinger l'URL régulièrement.
- **Lockfile** : j'ai ajouté des dépendances après le `pnpm-lock.yaml`, d'où `--no-frozen-lockfile` dans le build. Pour des builds reproductibles, régénère le lockfile une fois (`pnpm install` sur Replit ou WSL) et commit-le ; tu pourras alors repasser en `--frozen-lockfile`.
- **Le seed au build** est idempotent (ne réinsère rien si le catalogue existe). Tu peux retirer la ligne `... run seed` de `render.yaml` après le 1er déploiement.
- **Clerk** : l'initialisation utilise directement `VITE_CLERK_PUBLISHABLE_KEY` (frontend) et `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` (backend, lus depuis l'env) — compatible hors Replit, rien à modifier. Si tu passes en clés `pk_live`, pense à ajouter ton domaine Render dans le dashboard Clerk (Domains).
- **Migration de schéma plus tard** : `pnpm --filter @workspace/db run push` est relancé à chaque build. Si tu fais un changement destructif, il vaut mieux le gérer à la main (ou utiliser `push-force`).
