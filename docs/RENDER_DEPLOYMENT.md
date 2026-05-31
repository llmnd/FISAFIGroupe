# Déploiement du Backend sur Render

## Guide complet de déploiement

### Étape 1: Préparer le repo GitHub

1. S'assurer que le repo GitHub est à jour avec tous les changements
2. Le render.yaml est déjà configuré à la racine du projet

```bash
git add .
git commit -m "Deploy setup for Render"
git push origin main
```

### Étape 2: Créer un compte Render

1. Aller sur https://render.com
2. S'inscrire avec GitHub (recommandé)
3. Autoriser Render à accéder à vos repos

### Étape 3: Créer la base de données PostgreSQL

1. Dans le dashboard Render, cliquer sur **"+ New"**
2. Sélectionner **"PostgreSQL"**
3. Configurer:
   - **Name**: `fisafi-db`
   - **Region**: `Oregon` (ou votre région)
   - **PostgreSQL Version**: `15`
   - **Plan**: `Free`
4. Cliquer **"Create Database"**
5. Copier la **External Database URL** - vous en aurez besoin

### Étape 4: Créer le Web Service (Backend)

1. Dans le dashboard Render, cliquer sur **"+ New"**
2. Sélectionner **"Web Service"**
3. Connecter votre repo GitHub `FiSAFi Groupe`
4. Configurer:
   - **Name**: `fisafi-backend`
   - **Region**: `Oregon` (même que la DB)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm run build:backend && npm run prisma:generate`
   - **Start Command**: `npm run start:backend`
   - **Plan**: `Free`

### Étape 5: Ajouter les variables d'environnement

Dans la section "Environment", ajouter:

```
NODE_ENV=production
BACKEND_PORT=3001
BACKEND_HOST=0.0.0.0
DATABASE_URL=postgresql://... (copiée de la DB)
JWT_SECRET=une-clé-très-secrète-et-longue-ici
FRONTEND_URL=https://votre-domain.com
```

**Important**: 
- `DATABASE_URL` doit être l'URL de la base de données Render
- `JWT_SECRET` doit être une clé forte et unique (minimum 32 caractères)
- `FRONTEND_URL` est l'URL de votre frontend (localhost:3000 en dev, votre domaine en prod)

### Étape 6: Déployer

1. Cliquer **"Create Web Service"**
2. Render va:
   - Clone le repo
   - Installe les dépendances
   - Compile le TypeScript
   - Runne les migrations Prisma
   - Démarre le serveur

Attendez 5-10 minutes pour le déploiement initial.

### Étape 7: Vérifier le déploiement

**Health Check URL**:
```
https://your-backend-url.onrender.com/health
```

Devrait retourner:
```json
{
  "status": "ok",
  "timestamp": "2024-03-27T..."
}
```

**API Endpoint**:
```
https://your-backend-url.onrender.com/api/v1
```

### Étape 8: Configurer le frontend

Mettre à jour le `BACKEND_URL` dans votre frontend `.env.production`:

```
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.onrender.com
```

Puis redéployer le frontend.

## Troubleshooting

### ❌ Erreur: "DATABASE_URL is missing"
- Vérifier que `DATABASE_URL` est bien défini dans Environment
- La valeur doit commencer par `postgresql://`
- Redéployer après le changement

### ❌ Erreur: "Post-deploy script failed"
- Vérifier les logs: Dashboard → Web Service → Logs
- Vérifier que `DATABASE_URL` est correct
- Vérifier que les migrations Prisma fonctionnent en local: `npm run prisma:migrate`

### ❌ Le backend démarre mais les requêtes échouent
- Vérifier que `CORS_ORIGIN` permet le frontend: `NODE_ENV` doit être `production`
- Vérifier que `frontend_url` est correct dans les variables env

### ❌ "Cannot find dist" pendant le build
- Les logs doivent montrer le build du TypeScript
- Vérifier que `package.json` a le script `build:backend`
- Vérifier que `tsconfig.backend.json` existe

## Après le déploiement

### Créer un admin

Une fois déployé, créer un compte admin pour l'interface d'administration:

```bash
npm run create:admin
```

(À exécuter sur Render via Shell Access si nécessaire)

### Vérifier les routes de l'API

```
GET /api/v1 → Info de l'API
GET /health → Health check
POST /api/v1/auth/login → Connexion
GET /api/v1/articles → Lister les articles
```

### Logs en temps réel

Dashboard → Web Service → Logs (voir tous les logs en direct)

## Variables de production

**Production URL Render**: `https://[SERVICE_NAME].onrender.com`

Exemple:
- Backend: `https://fisafi-backend.onrender.com`
- Frontend: `https://fisafi-frontend.onrender.com` (si déployé sur Render aussi)

## Coûts

- **Database PostgreSQL**: Gratuit (avec limitations)
- **Web Service**: Gratuit (s'endort après 15 min d'inactivité)
- **Domains**: $3.99/mois (optionnel pour custom domain)

## Prochaines étapes

1. Configurer SSL/TLS (automatique sur Render)
2. Ajouter un custom domain (optionnel)
3. Configurer les backups de database
4. Monitorer les logs en continu
5. Déployer aussi le frontend sur Render

## Support

Documentation Render: https://render.com/docs
