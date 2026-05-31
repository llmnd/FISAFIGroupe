# Configuration requise pour la production Vercel

## Étapes pour corriger l'erreur 404:

### 1. Définir les variables d'environnement dans Vercel Dashboard:

Go to: **Settings → Environment Variables**

Ajouter:
```
NEXT_PUBLIC_BACKEND_URL = https://your-backend-url.com
```

(Remplacer `https://your-backend-url.com` par votre URL backend réelle)

### 2. Redéployer l'application:

```bash
# Option A: Redéployer via git
git add .
git commit -m "fix: use new articles admin endpoint"
git push

# Option B: Redéployer manuellement dans Vercel Dashboard
# Cliquer sur "Redeploy" dans le Deployments tab
```

### 3. Vérifier que le backend est en running

L'erreur 404 vient du fait que l'endpoint `/api/articles/manage` du backend n'est pas accessible.

Tester que le backend répond:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-backend-url.com/api/articles/manage
```

## Changements apportés:

✅ Créé un nouvel endpoint `/api/fetch-articles-admin` plus robuste
✅ Ajouté fallback automatique à l'ancien endpoint
✅ Ajouté logging pour déboguer les erreurs
✅ Configuration Vercel améliorée
