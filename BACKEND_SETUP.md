# Guide de Démarrage Rapide - Backend Node.js/Fastify

## ⚡ Démarrage en 5 minutes

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration de l'environnement
Le fichier `.env.local` contient déjà une DATABASE_URL. Complétez-le avec:

```env
# Trouvez et modifiez ces lignes:
BACKEND_PORT=3001
JWT_SECRET="votre-secret-jwt-super-secu"
FRONTEND_URL="http://localhost:3000"
```

### 3. Initialiser la base de données
```bash
# Créer les tables et migrations
npm run prisma:migrate

# Vérifier que Prisma est à jour
npm run prisma:generate
```

### 4. Lancer le serveur
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend (optionnel)
npm run dev

# OU les deux en parallèle:
npm run dev:all
```

Ouvrez http://localhost:3001/health pour vérifier que le serveur fonctionne.

---

## 📍 Architecture

```
┌─────────────────────────────────────┐
│        Frontend Next.js              │
│    (http://localhost:3000)           │
└────────────┬────────────────────────┘
             │
      HTTP Requests (axios/fetch)
             │
┌────────────▼────────────────────────┐
│     Backend Fastify API              │
│   (http://localhost:3001/api/v1)     │
├─────────────────────────────────────┤
│  • Authentication (JWT)              │
│  • Articles Management               │
│  • Formations Management             │
│  • User Management                   │
└────────────┬────────────────────────┘
             │
      SQL Queries
             │
┌────────────▼────────────────────────┐
│   PostgreSQL Database                │
│   (via Prisma ORM)                   │
└─────────────────────────────────────┘
```

---

## 🔑 Points clés

### Variables d'environnement

| Variable | Valeur par défaut | Description |
|----------|-------------------|-------------|
| `BACKEND_PORT` | 3001 | Port du serveur Fastify |
| `JWT_SECRET` | N/A | Clé secrète JWT (générez une longue chaîne aléatoire) |
| `JWT_EXPIRATION` | 7d | Durée de vie des tokens |
| `FRONTEND_URL` | http://localhost:3000 | URL du frontend (pour CORS) |
| `DATABASE_URL` | Neon PostgreSQL | Connexion à la base de données |

### Structure des dossiers

```
backend/
├── config/              # Configuration centralisée
├── controllers/         # Logique métier
├── routes/             # Endpoints API
├── types/              # Interfaces TypeScript
├── utils/              # Fonctions utilitaires
├── services/           # Services réutilisables
├── prisma/             # Schéma BD
├── server.ts           # Point d'entrée
└── API_DOCUMENTATION.md # Documentation API complète
```

---

## 🧪 Tester l'API

### Avec curl

```bash
# Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test"
  }'

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get protected endpoint
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/v1/auth/me
```

### Avec Postman

1. Importez la collection depuis [postman-collection.json](./postman-collection.json)
2. Configurez l'importation JWT automatique
3. Testez chaque endpoint

---

## 🔗 Intégration Frontend

### Configurer Axios

```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  withCredentials: true,
});

// Auto-ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Utiliser dans une composante

```typescript
// components/LoginForm.tsx
import { useState } from 'react';
import api from '@/lib/api';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('auth_token', data.data.token);
      // Rediriger vers dashboard
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  return (
    // Form JSX
  );
}
```

---

## 🚀 Déploiement

### Frontend sur Vercel (Next.js)
```bash
vercel build
vercel deploy --prod
```

### Backend sur Railway, Heroku, ou VPS

```bash
# 1. Compiler
npm run build:backend

# 2. Créer .env.production
cp .env.production.example .env.production
# Remplisseur les valeurs

# 3. Sur le serveur
npm install --production
npm run start:backend
```

---

## 🐛 Troubleshooting

### Erreur: "Database closed"
- Vérifiez `DATABASE_URL` dans `.env.local`
- Assurez-vous que PostgreSQL est accessible
- Créez une migration: `npm run prisma:migrate`

### Erreur: "CORS error"
- Vérifiez `FRONTEND_URL` correspond à votre frontend
- Assurez-vous il ne y a pas de port supprimer (http://localhost:3000, pas http://localhost:3000/)

### Erreur: "JWT verify failed"
- Vérifiez que `JWT_SECRET` est défini dans `.env.local`
- Le secret doit être le même entre les appels

### Port 3001 déjà en utilisation
```bash
# Changer le port
BACKEND_PORT=3002 npm run dev:backend
```

---

## 📚 Documentation complète

- [API Documentation](./backend/API_DOCUMENTATION.md)
- [Structure Guide](./STRUCTURE_GUIDE.md)
- [Architecture Guide](./ARCHITECTURE.md)

---

## 🎯 Prochaines étapes

1. ✅ Configurer l'authentification
2. ✅ Tester les endpoints
3. ⬜ Ajouter la validation des données
4. ⬜ Implémenter les rôles et permissions
5. ⬜ Ajouter les tests unitaires
6. ⬜ Configurer le logging
7. ⬜ Déployer en production

---

## 💡 Commandes utiles

```bash
# Dev
npm run dev:backend          # Fastify seul
npm run dev:all             # Frontend + Backend

# Build
npm run build:backend       # Compiler TypeScript

# Database
npm run prisma:migrate      # Créer migrations
npm run prisma:generate     # Générer client
npx prisma studio          # Interface graphique

# Production
npm run build:backend && npm run start:backend
```

---

## 📞 Support

Besoin d'aide? Consultez:
- [Fastify Docs](https://www.fastify.io/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [JWT.io](https://jwt.io/)

Happy coding! 🎉

## 3. Database Schema

The schema includes these models:

### Core Models:
- **Inscription** - Contact form submissions
- **Article** - News articles (technique, innovation, evenement, veille)
- **Formation** - Training catalog
- **SessionFormation** - Training sessions/calendar
- **InscriptionFormation** - Training registrations
- **Brochure** - Downloadable documents

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for full schema details.

## 4. Running the Application

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start
```

The API will be available at `http://localhost:3000/api`

## 5. Testing APIs

### Using cURL

```bash
# Get all articles
curl http://localhost:3000/api/articles

# Get articles by category
curl "http://localhost:3000/api/articles?category=technique&limit=5"

# Create an article (requires authentication - future feature)
curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Article Title",
    "category": "technique",
    "excerpt": "Short description",
    "content": "Full content",
    "author": "Author Name"
  }'
```

### Using Postman

1. Import the following collection into Postman
2. Set `{{base_url}}` to `http://localhost:3000/api`

#### Articles
- `GET /articles` - List all published articles
- `POST /articles` - Create article
- `GET /articles/{id}` - Get article detail
- `PUT /articles/{id}` - Update article
- `DELETE /articles/{id}` - Delete article

#### Formations
- `GET /formations` - List all formations
- `POST /formations` - Create formation
- `GET /formations/{id}` - Get formation detail
- `PUT /formations/{id}` - Update formation
- `DELETE /formations/{id}` - Delete formation

#### Sessions
- `GET /sessions` - List all sessions
- `POST /sessions` - Create session
- `GET /sessions?formationId=1` - Filter by formation

#### Registrations
- `GET /inscriptions-formation` - List all registrations
- `POST /inscriptions-formation` - Create registration
- `GET /inscriptions-formation?sessionId=1` - Filter by session

#### Brochures
- `GET /brochures` - List brochures
- `POST /brochures` - Create brochure
- `GET /brochures/{id}` - Get brochure detail
- `PUT /brochures/{id}` - Update brochure
- `DELETE /brochures/{id}` - Delete brochure

## 6. Frontend Integration Examples

### Fetch Articles

```typescript
// In a React component
import { useEffect, useState } from 'react';

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/articles?category=innovation&limit=10')
      .then(res => res.json())
      .then(data => {
        setArticles(data.data.articles);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {articles.map(article => (
        <div key={article.id}>
          <h2>{article.title}</h2>
          <p>{article.excerpt}</p>
        </div>
      ))}
    </div>
  );
}
```

### Register for Training

```typescript
async function registerFormation(data) {
  const response = await fetch('/api/inscriptions-formation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: data.sessionId,
      formationId: data.formationId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      company: data.company,
    }),
  });

  const result = await response.json();
  
  if (result.success) {
    alert(result.message);
  } else {
    alert('Error: ' + result.error);
  }
}
```

## 7. Useful Prisma Commands

```bash
# View database in Prisma Studio
npx prisma studio

# Format schema
npx prisma format

# Validate schema
npx prisma validate

# Generate Prisma client after schema changes
npx prisma generate

# Create migration without running it
npx prisma migrate dev --create-only --name migration_name

# Reset database (CAUTION: deletes all data)
npx prisma migrate reset
```

## 8. Database Backup & Restore

### Backup
```bash
pg_dump fisafi_db > backup.sql
```

### Restore
```bash
psql fisafi_db < backup.sql
```

## 9. Production Deployment

### Deploy to Vercel

```bash
# Push code to GitHub
git push origin main

# Vercel will auto-deploy on push
# Add DATABASE_URL in Vercel environment variables

# Generate Prisma client in production
npx prisma generate
```

### Environment Variables for Production
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_API_URL` - Your production domain

## 10. Security Considerations

⚠️ **Important**: Before going to production:

1. **Add Authentication** - Implement JWT or session auth for admin endpoints
2. **Input Validation** - Validate all inputs server-side
3. **Rate Limiting** - Implement rate limiting to prevent abuse
4. **CORS** - Configure CORS properly
5. **HTTPS** - Ensure HTTPS in production
6. **API Keys** - Generate API keys for external integrations

Example authentication middleware:

```typescript
// pages/api/middleware/auth.ts
import { NextApiRequest, NextApiResponse } from 'next';

export function withAuth(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token || token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    return handler(req, res);
  };
}
```

## 11. Troubleshooting

### Migration failing
```bash
# Reset database and retry
npx prisma migrate reset

# Or check migration status
npx prisma migrate status
```

### Connection refused
- Verify PostgreSQL is running: `psql -l`
- Check DATABASE_URL in .env.local
- Test connection: `psql $DATABASE_URL`

### Prisma Client not generating
```bash
npx prisma generate
```

## Support & Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

