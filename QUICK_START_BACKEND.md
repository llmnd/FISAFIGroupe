// QUICK_START.md
# 🚀 Démarrage Rapide Backend Node.js/Fastify

## ✅ Environnement configuré!

Votre backend Node.js/Fastify est prêt à être utilisé!

---

## 📦 Étapes d'installation (une seule fois)

```bash
# 1. Installer les dépendances
npm install

# 2. Initialiser la base de données
npm run prisma:migrate

# 3. Générer le client Prisma
npm run prisma:generate
```

---

## ▶️ Lancer le serveur

### Option 1: Backend seul
```bash
npm run dev:backend
```
Serveur accessible à: **http://localhost:3001**

### Option 2: Frontend + Backend (recommandé)
```bash
npm run dev:all
```
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

## 🧪 Tester l'API

```bash
# 1. Créer un compte
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "firstName": "Admin"
  }'

# 2. Se connecter (vous recevrez un JWT token)
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# 3. Utiliser le token pour créer un article
curl -X POST http://localhost:3001/api/v1/articles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mon premier article",
    "category": "technique",
    "excerpt": "Description courte",
    "content": "Contenu complet de l article"
  }'
```

---

## 📂 Structure du backend

```
backend/
├── config/           # Configuration (env, variables)
├── controllers/      # Logique métier (auth, articles, formations)
├── routes/          # Routes API
│   ├── auth.ts
│   ├── articles.ts
│   └── formations.ts
├── types/           # Interfaces TypeScript
├── utils/           # Fonctions utilitaires
├── server.ts        # Point d'entrée Fastify
└── API_DOCUMENTATION.md
```

---

## 🔐 Points d'accès API

```
POST   /api/v1/auth/register     # S'inscrire
POST   /api/v1/auth/login        # Se connecter
GET    /api/v1/auth/me           # Profil utilisateur (protégé)

GET    /api/v1/articles          # Liste des articles
GET    /api/v1/articles/:id      # Un article
POST   /api/v1/articles          # Créer (protégé)
PATCH  /api/v1/articles/:id      # Modifier (protégé)
DELETE /api/v1/articles/:id      # Supprimer (protégé)

GET    /api/v1/formations        # Liste formations
GET    /api/v1/formations/:id    # Une formation
POST   /api/v1/formations        # Créer (protégé)
PATCH  /api/v1/formations/:id    # Modifier (protégé)
```

---

## 🔧 Configuration

### Variables d'environnement (`env.local`)

```env
DATABASE_URL="postgresql://..."  # Déjà configurée
BACKEND_PORT=3001               # Port du serveur
JWT_SECRET="your-secret-key"    # IMPORTANT: Changer en production
FRONTEND_URL="http://localhost:3000"
```

**⚠️ IMPORTANT**: Changer `JWT_SECRET` en production!

---

## 🎯 Intégration Frontend

### 1. Installer axios (si pas fait)
```bash
npm install axios
```

### 2. Créer un client API

```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
});

// Ajouter le token automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 3. Utiliser dans une page Next.js

```typescript
import { useState } from 'react';
import api from '@/lib/api';

export default function Login() {
  const handleLogin = async () => {
    const { data } = await api.post('/auth/login', {
      email: 'admin@example.com',
      password: 'password123',
    });
    
    localStorage.setItem('auth_token', data.data.token);
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

---

## 📚 Documentation complète

- **Démarrage**: [BACKEND_SETUP.md](./BACKEND_SETUP.md)
- **API complète**: [backend/API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md)
- **Structure**: [STRUCTURE_GUIDE.md](./STRUCTURE_GUIDE.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 🐛 Dépannage

| Problème | Solution |
|----------|----------|
| Port 3001 en usage | `BACKEND_PORT=3002 npm run dev:backend` |
| Database error | Vérifier DATABASE_URL et migrations |
| CORS error | Vérifier FRONTEND_URL |
| Token invalide | Vérifier JWT_SECRET |

---

## 📝 Prochaines étapes

- [ ] Tester les endpoints avec curl ou Postman
- [ ] Intégrer le client API au frontend
- [ ] Ajouter la validation des données (Zod/Joi)
- [ ] Implémenter les rôles/permissions
- [ ] Ajouter les tests unitaires
- [ ] Déployer en production

---

## 💡 Commandes utiles

```bash
npm run dev:backend              # Dev mode
npm run dev:all                  # Frontend + Backend
npm run build:backend            # Compiler
npm run start:backend            # Prod

npx prisma migrate dev           # Créer migration
npx prisma studio               # UI graphique BD
npx prisma db seed              # Données test
```

---

## 🌟 Avantages Fastify vs Express

✅ **2x plus rapide** - Performance hautement optimisée
✅ **TypeScript natif** - Support complet
✅ **Plugin system** - Architecture extensible
✅ **Request/Reply hooks** - DX excellent
✅ **Validation intégrée** - JSON Schema support
✅ **Scalabilité** - Prêt pour millions de requêtes

---

**Questions?** Consultez [Fastify Docs](https://www.fastify.io/) ou les fichiers README du projet.

**Bon développement!** 🎉
