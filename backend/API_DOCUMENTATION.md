# Backend API - FiSAFi

## Architecture

Ce backend utilise **Fastify** avec **Prisma** pour une API RESTful robuste et performante. L'architecture sépare le frontend Next.js du backend Node.js/Fastify.

### Structure

```
backend/
├── config/          # Configuration (env, variables)
├── controllers/     # Logique métier
├── routes/          # Définition des routes API
├── services/        # Services réutilisables
├── types/           # Types TypeScript
├── utils/           # Utilitaires (auth, helpers)
├── middleware/      # Middleware (authentification, validation)
├── prisma/          # Schéma Prisma (base de données)
└── server.ts        # Point d'entrée du serveur
```

## Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer l'environnement

Modifiez `.env.local` avec vos paramètres:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="votre-secret-jwt"
BACKEND_PORT=3001
FRONTEND_URL="http://localhost:3000"
```

### 3. Initialiser la base de données

```bash
# Créer/mettre à jour les tables
npm run prisma:migrate

# Générer le client Prisma
npm run prisma:generate
```

## 🚀 Démarrage

### Mode développement

```bash
# Serveur Fastify seul
npm run dev:backend

# Frontend + Backend en parallèle
npm run dev:all
```

### Production

```bash
# Compiler le TypeScript
npm run build:backend

# Lancer le serveur
npm run start:backend
```

## 📚 API Endpoints

### 🔐 Authentification

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password"
}
```

#### Get Current User (Protected)
```http
GET /api/v1/auth/me
Authorization: Bearer <jwt-token>
```

---

### 📰 Articles

#### Get All Articles
```http
GET /api/v1/articles?page=1&limit=10&category=technique
```

#### Get Single Article
```http
GET /api/v1/articles/{id-or-slug}
```

#### Create Article (Protected)
```http
POST /api/v1/articles
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Article Title",
  "category": "technique",
  "excerpt": "Short description",
  "content": "Full content...",
  "image": "url-to-image",
  "author": "Author Name"
}
```

#### Update Article (Protected)
```http
PATCH /api/v1/articles/{id}
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Updated Title",
  "published": true,
  "publishedAt": "2024-01-15T10:00:00Z"
}
```

#### Delete Article (Protected)
```http
DELETE /api/v1/articles/{id}
Authorization: Bearer <jwt-token>
```

---

### 🎓 Formations

#### Get All Formations
```http
GET /api/v1/formations?page=1&limit=10
```

#### Get Single Formation
```http
GET /api/v1/formations/{id-or-slug}
```

#### Create Formation (Protected)
```http
POST /api/v1/formations
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Formation Title",
  "duration": "2 jours",
  "level": "Débutant",
  "description": "Description...",
  "price": 500,
  "maxParticipants": 20
}
```

#### Update Formation (Protected)
```http
PATCH /api/v1/formations/{id}
Authorization: Bearer <jwt-token>
```

---

## 🔑 Authentification & JWT

Tous les endpoints protégés nécessitent un token JWT dans l'en-tête:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Durée de vie du token**: 7 jours (configurable via `JWT_EXPIRATION`)

---

## 📊 Base de Données

### User
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String?
  lastName  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Voir [prisma/schema.prisma](./prisma/schema.prisma) pour tous les modèles.

---

## 🛡️ Sécurité

- **CORS**: Configuré pour accepter les requêtes du frontend uniquement
- **Helmet**: Headers de sécurité activés
- **JWT**: Tokens signés et vérifiés
- **Bcrypt**: Mots de passe hashés avec salt
- **Validation**: Entrées validées côté serveur

---

## 📦 Déploiement

### Vercel

1. Créez un projet Vercel
2. Connectez votre repo GitHub
3. Ajoutez les variables d'environnement dans Settings
4. Déployez le frontend en tant que Next.js app

### Backend Fastify (séparé)

Pour déployer le backend sur un serveur différent (Railway, Heroku, etc.):

```bash
# Compiler
npm run build:backend

# Copier le fichier dist/ sur le serveur
# Installer npm install --production
# Lancer: npm start:backend
```

---

## 🔄 Migration de Next.js API vers Fastify

Les endpoints Next.js existants dans `pages/api/` peuvent être progressivement migrés vers Fastify:

**Before (Next.js)**:
```typescript
// pages/api/articles.ts
export default function handler(req, res) {
  // ...
}
```

**After (Fastify)**:
```typescript
// backend/routes/articles.ts
export async function articleRoutes(app) {
  app.get('/articles', async (request, reply) => {
    // ...
  });
}
```

---

## 📝 Notes

- Le backend s'exécute sur le port **3001** en développement
- L'API est servie sous le préfixe **/api/v1**
- Les routes protégées recquièrent `Authorization` header avec JWT
- Todas les réponses suivent le format standard:
  ```json
  {
    "success": boolean,
    "data": { ... },
    "message": "...",
    "error": "..."
  }
  ```

---

## 🤝 Contribution

Pour ajouter une nouvelle route:

1. Créez un contrôleur dans `backend/controllers/`
2. Définissez les routes dans `backend/routes/`
3. Enregistrez les routes dans `backend/server.ts`
4. Testez avec Postman ou curl

---

## 🐛 Debugging

```bash
# Logs détaillés
NODE_ENV=development npm run dev:backend

# Réinitialiser BD
npx prisma migrate reset

# Studio Prisma (interface graphique)
npx prisma studio
```

---

## 📚 Ressources

- [Fastify Documentation](https://www.fastify.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
