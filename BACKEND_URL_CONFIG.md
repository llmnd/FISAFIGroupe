# Configuration Backend URLs

## Production (Vercel)

### Étape 1: Définir NEXT_PUBLIC_BACKEND_URL dans Vercel Dashboard

1. Allez sur: https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Allez à **Settings → Environment Variables**
4. Ajouter une NEW variable:
   - **Name**: `NEXT_PUBLIC_BACKEND_URL`
   - **Value**: (votre backend URL, exemple: `https://fisafi-backend.onrender.com`)
   - **Environments**: Select all (Production, Preview, Development)
5. Cliquez "Save"
6. Redéployez (Deployments → Redeploy)

### Étape 2: Vérifier que le backend est en running

Testez directement l'endpoint backend:

```bash
# Si vous avez un token (demandez à un admin):
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  https://your-backend-url.com/api/articles/manage
```

Vous devriez obtenir une réponse JSON avec les articles, pas un 404.

## Endpoints de secours

Si la configuration de `/api/articles/manage` échoue, le dashboard essayera automatiquement:

1. `/api/fetch-articles-admin` (nouvel endpoint robuste)
2. `/api/admin/articles` (endpoint de secours)
3. `/api/articles/manage` (ancien endpoint)

## Local Development

```bash
# Backend sur Render/Heroku:
NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com npm run dev

# Backend locale:
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001 npm run dev
```

## Troubleshooting

### Si vous voyez toujours 404:

1. Vérifier que la variable d'environnement est bien définie:
   ```bash
   vercel env ls
   ```

2. Vérifier que le backend est vraiment en running:
   ```bash
   curl https://your-backend-url.com/health
   ```

3. Forcer un redéploiement:
   ```bash
   git add .
   git commit -m "fix: update backend configuration"
   git push  # Vercel se redeploiera automatiquement
   ```

4. Vérifier les logs du déploiement Vercel:
   - Projects → Deployments → Click latest → check "Function Logs"
