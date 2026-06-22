# Transfert de PiukyFlix au nouveau propriétaire

Ce guide explique comment faire passer le site sous **les comptes du nouveau propriétaire**, pour qu'il en ait le contrôle et la facturation complets. Tout est en offre **gratuite**.

## Architecture (rappel)

Un seul service **Render** (qui sert l'API + le frontend) + une base **PostgreSQL Neon** + l'authentification **Clerk**. Détails de déploiement : voir [DEPLOY.md](DEPLOY.md).

## Principe

Le site doit tourner sous les comptes du nouveau proprio. On **transfère le code** (GitHub) et on **recrée le reste** (Clerk, Neon, Render) sous ses comptes, puis le dev supprime ses copies.

> ⏱️ **À faire tant que le site est neuf** (contenu de démo, aucun vrai utilisateur). Sinon il faudra migrer les données (voir la section dédiée en bas).

---

## Comptes à créer par le nouveau proprio (gratuits)

- [GitHub](https://github.com) · [Clerk](https://clerk.com) · [Neon](https://neon.tech) · [Render](https://render.com)
- (Optionnel) [Resend](https://resend.com) pour les emails d'invitation

---

## Étape 1 — Le code (GitHub)

**Option A (recommandée) — transfert du dépôt :**
Le dev va sur le repo → **Settings → General → Danger Zone → Transfer ownership** → saisit le pseudo GitHub du nouveau proprio.
→ Avantage : l'historique est conservé, et le proprio pourra le connecter en privé à son Render avec **redéploiement automatique**.

**Option B — le proprio repart de zéro :**
Le proprio crée un repo vide, le dev y pousse le code :
```bash
git remote set-url origin https://github.com/NOUVEAU-PROPRIO/piukyflix.git
git push -u origin main
```

## Étape 2 — Auth (Clerk) — *le proprio*

1. Crée une application Clerk → active **Email** (et Google si voulu).
2. Dans **API keys**, copie la **Publishable key** (`pk_test_…`) et la **Secret key** (`sk_test_…`).

## Étape 3 — Base de données (Neon) — *le proprio*

1. Crée un projet Neon.
2. **Connect** → **Show password** → copie la connection string.
3. Retire `&channel_binding=require` à la fin (garde `?sslmode=require`). Ce sera la `DATABASE_URL`.

## Étape 4 — Hébergement (Render) — *le proprio*

1. Crée un compte Render et **connecte SON compte GitHub** (celui qui possède le repo).
2. **New → Blueprint** → choisis le repo `piukyflix` → Render lit `render.yaml`.
3. Renseigne les variables :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | sa chaîne Neon |
| `CLERK_SECRET_KEY` | sa `sk_test_…` |
| `CLERK_PUBLISHABLE_KEY` | sa `pk_test_…` |
| `VITE_CLERK_PUBLISHABLE_KEY` | sa `pk_test_…` (identique) |
| `REPLIT_DOMAINS` | son hôte Render, ex. `piukyflix.onrender.com` |
| `RESEND_API_KEY` | (vide, ou sa clé Resend) |
| `ADMIN_EMAILS` | l'email avec lequel **il** se connectera (pour être admin) |

4. **Apply / Deploy**. Le build crée les tables + insère le contenu de démo. Le site est en ligne sous **son** compte.

> Comme il connecte son propre GitHub (et non une « URL publique »), le **redéploiement auto à chaque push** fonctionne.

## Étape 5 — (Optionnel) Emails & domaine

- **Resend** : son compte + un domaine vérifié → `RESEND_API_KEY`.
- **Domaine perso** : il achète le domaine, l'ajoute dans **Render → Settings → Custom Domains**, et dans **Clerk → Domains**. Passer ensuite Clerk en instance **production** (clés `pk_live_` / `sk_live_`).

## Étape 6 — Le dev se retire

Une fois le site du proprio en ligne et testé, le dev supprime ses copies pour ne plus rien payer/gérer :
- Render → son service `piukyflix` → Settings → **Delete**
- Neon → son projet → **Delete**
- Clerk → son app → **Delete**

---

## Si le site a déjà des données réelles (migration)

À éviter en faisant le transfert tôt. Sinon :
- **Base** : exporter depuis l'ancienne Neon et réimporter dans la nouvelle :
  ```bash
  pg_dump "ANCIENNE_DATABASE_URL" > backup.sql
  psql "NOUVELLE_DATABASE_URL" < backup.sql
  ```
  (et **ne pas** relancer le seed sur la nouvelle base — retirer la ligne `seed` du `render.yaml` ou vider la table `content` avant).
- **Utilisateurs** : ils sont dans **Clerk**, pas dans la base. Changer d'app Clerk = ils ne suivent pas (réinscription nécessaire, sauf migration Clerk dédiée).

---

## Vie courante du site (pour le nouveau proprio)

- **Ajouter / gérer le contenu** : se connecter avec un email présent dans `ADMIN_EMAILS` → bouton **Admin** dans la barre du haut → dashboard.
- **Publier une mise à jour du code** : `git push` → Render redéploie automatiquement (si son GitHub est connecté), sinon **Manual Deploy** dans Render.
- **Mise en veille (offre gratuite)** : l'instance s'endort après ~15 min d'inactivité → le 1er accès suivant prend ~50 s. Passer à une offre payante Render pour l'éviter.
- **Coût** : 0 € en offre gratuite (Clerk, Neon, Render, Resend). Les montées en gamme sont optionnelles et payées par le proprio.

## Sécurité

- **Régénérer tous les secrets** qui auraient été partagés pendant le développement (clé secrète Clerk, mot de passe Neon).
- Pour la production : utiliser une **instance Clerk de production** (`pk_live_`/`sk_live_`) liée au domaine définitif.
