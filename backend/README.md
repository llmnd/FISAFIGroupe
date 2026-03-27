# Backend - Logique Métier FiSAFi

Ce dossier contient **la logique métier** (business logic) complètement séparée de la présentation.

## 📁 Structure

```
backend/
├── services/           ← Cœur métier (ArticleService, FormationService, etc.)
│   ├── articleService.ts
│   ├── formationService.ts
│   ├── sessionService.ts
│   ├── inscriptionFormationService.ts
│   ├── brochureService.ts
│   └── index.ts        ← Exports centralisés
│
├── lib/                ← Utilitaires
│   └── db.ts           ← Instance PrismaClient UNIQUE
│
├── types/              ← Types TypeScript partagés
│   └── index.ts        ← Interfaces pour toutes les entités
│
└── prisma/             ← Schéma de base de données
    └── schema.prisma   ← Modèles Prisma
```

## 🎯 Responsabilités

### `services/` - Logique métier
Chaque service encapsule la logique pour une entité :
- **ArticleService** : Récupération, création, mise à jour d'articles
- **FormationService** : Gestion des formations
- **SessionService** : Gestion des sessions
- **InscriptionFormationService** : Gestion des inscriptions
- **BrochureService** : Gestion des brochures

Les services :
- ✅ Contiennent la **logique métier**
- ✅ Utilisent `prisma` de `db.ts`
- ✅ Exposent des méthodes statiques (`getAll()`, `getById()`, `create()`, etc.)
- ✅ Gèrent les erreurs de manière cohérente
- ❌ Ne savent rien sur HTTP/requêtes/réponses

### `lib/db.ts` - Connexion unique
```typescript
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();  // Instance UNIQUE
```

Avantage : Une seule connexion BD au lieu d'une par requête HTTP.

### `types/index.ts` - Types centralisés
```typescript
export interface IArticle {
  id: number;
  title: string;
  // ...
}
```

Ces types sont utilisés dans les services ET le frontend.

## ✅ Bonnes pratiques

### ✅ Bon Pattern - Service contient la logique
```typescript
// backend/services/articleService.ts
import { prisma } from '@/backend/lib/db';
import { IArticle } from '@/backend/types';

export class ArticleService {
  static async getAll(category?: string): Promise<IArticle[]> {
    return prisma.article.findMany({
      where: category ? { category, published: true } : { published: true },
      orderBy: { publishedAt: 'desc' }
    });
  }
  
  static async getById(id: number): Promise<IArticle | null> {
    return prisma.article.findUnique({ where: { id } });
  }
}
```

### ✅ Bon Pattern - Route API reste simple
```typescript
// pages/api/articles.ts
import { ArticleService } from '@/backend/services';

export default async function handler(req, res) {
  try {
    const articles = await ArticleService.getAll(req.query.category as string);
    res.status(200).json({ success: true, data: articles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

### ❌ À ÉVITER - PrismaClient multiple
```typescript
// ❌ MAUVAIS
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();  // Nouvelle connexion à chaque requête!

export default async function handler(req, res) {
  const articles = await prisma.article.findMany();
  res.json(articles);
}
```

### ❌ À ÉVITER - Logique métier dans les routes API
```typescript
// ❌ MAUVAIS
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { title } = req.body;
    const slug = title.toLowerCase().replace(/\s+/g, '-');
    const article = await prisma.article.create({
      data: { title, slug }
    });
    res.json(article);
  }
}

// ✅ BON: Mettre le slug-generation dans ArticleService
```

## 📍 Important : API Routes

⚠️ **Les routes API DOIVENT être dans `pages/api/`**, pas dans `backend/api/`.

Pourquoi ? Parce que Next.js scanne uniquement `pages/api/` pour créer les endpoints HTTP.

**Structure correcte :**
```
pages/api/                ← Les vraies routes API
  ├── articles.ts        ← Importe ArticleService
  ├── formations.ts      ← Importe FormationService
  └── ...

backend/api/             ← À SUPPRIMER (doublet inutile)
```

## 🔄 Flux de données

```
Client (navigateur)
    ↓
    Fetch /api/articles
    ↓
Route API (pages/api/articles.ts)
    ↓
    Importe services
    ↓
Service (ArticleService)
    ↓
    Utilise Prisma (db.ts)
    ↓
Prisma
    ↓
PostgreSQL
    ↓
Retourne JSON au client
```

##  📚 Exemple d'ajout d'une entité

### 1. Ajouter au schéma
```prisma
// prisma/schema.prisma
model Comment {
  id Int @id @default(autoincrement())
  content String
  articleId Int
  article Article @relation(fields: [articleId], references: [id])
}
```

### 2. Créer la migration
```bash
npx prisma migrate dev --name add_comments
```

### 3. Ajouter les types
```typescript
// backend/types/index.ts
export interface IComment {
  id: number;
  content: string;
  articleId: number;
}
```

### 4. Créer le service
```typescript
// backend/services/commentService.ts
import { prisma } from '@/backend/lib/db';
import { IComment } from '@/backend/types';

export class CommentService {
  static async getByArticle(articleId: number): Promise<IComment[]> {
    return prisma.comment.findMany({ where: { articleId } });
  }
}
```

### 5. Exporter dans index.ts
```typescript
// backend/services/index.ts
export { CommentService } from './commentService';
```

### 6. Créer la route API
```typescript
// pages/api/comments.ts
import { CommentService } from '@/backend/services';

export default async function handler(req, res) {
  const comments = await CommentService.getByArticle(req.query.articleId);
  res.json({ success: true, data: comments });
}
```

---

**Voir aussi :** 
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Vue d'ensemble du projet
- [STRUCTURE_GUIDE.md](../STRUCTURE_GUIDE.md) - Guide de la structure des dossiers
import { ArticleService } from '@/backend/services/articleService';

export default async function handler(req, res) {
  const articles = await ArticleService.getAll();
  res.json(articles);
}
```

## Files

- See `API_DOCUMENTATION.md` for complete API reference
- See `BACKEND_SETUP.md` for installation and deployment

