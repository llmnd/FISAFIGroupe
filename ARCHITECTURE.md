# Architecture du Projet FiSAFi

## Vue d'ensemble

Le projet est structuré selon le pattern **Backend-Frontend Séparé** avec Next.js. Le backend contient la logique métier via les services, et le frontend est une application Next.js standard.

## Structure des dossiers

```
FiSAFi Groupe/
│
├── 📄 Configuration
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── 📁 Frontend (Interface utilisateur)
│   ├── pages/                 ← Routes Next.js
│   │   ├── index.tsx
│   │   ├── training.tsx
│   │   └── api/               ← Routes API (importent le backend)
│   │       ├── articles.ts
│   │       ├── formations.ts
│   │       ├── sessions.ts
│   │       └── ...
│   │
│   ├── components/            ← Composants React réutilisables
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── News.tsx
│   │   └── ...
│   │
│   ├── context/               ← Contextes React (état global)
│   │   └── ThemeContext.tsx
│   │
│   ├── styles/                ← Feuilles CSS globales
│   │   └── globals.css
│   │
│   └── public/                ← Fichiers statiques (images, fonts)
│       └── [assets]
│
├── 📁 Backend (Logique métier)
│   ├── services/              ← Services métier (couche métier)
│   │   ├── articleService.ts      ✓ Gestion articles
│   │   ├── formationService.ts    ✓ Gestion formations
│   │   ├── sessionService.ts      ✓ Gestion sessions
│   │   ├── inscriptionFormationService.ts ✓ Gestion inscriptions
│   │   ├── brochureService.ts     ✓ Gestion brochures
│   │   └── index.ts               ✓ Exports centralisés
│   │
│   ├── lib/                   ← Utilitaires et connexion BD
│   │   └── db.ts              ← Instance Prisma
│   │
│   ├── types/                 ← Types TypeScript partagés
│   │   └── index.ts           ← Interfaces pour toutes les entités
│   │
│   └── prisma/                ← Configuration Prisma
│       └── schema.prisma      ← Schéma base de données
│
└── 📄 Documentation
    ├── README.md
    ├── ARCHITECTURE.md        ← CE FICHIER
    ├── GETTING_STARTED.md
    └── ...

```

## Flux de données

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│ Pages (pages/*.tsx)                                           │
│   ↓ (fetch)                                                   │
│ API Routes (pages/api/*.ts)     ← Couche d'interface        │
│   ↓ (import)                                                  │
│ Services (backend/services/)    ← Logique métier             │
│   ↓ (require)                                                 │
│ DB (backend/lib/db.ts)          ← Persistan ce               │
│   ↓ (Prisma)                                                  │
│ PostgreSQL                      ← Base de données            │
└─────────────────────────────────────────────────────────────┘
```

## Responsabilités par couche

### 1. **Pages (`pages/*.tsx`)**
- Affichage des données
- Rendu React côté serveur
- Composition de composants
- Logique d'interaction utilisateur (événements clics, etc.)

**Exemple :** `pages/index.tsx`, `pages/training.tsx`

### 2. **API Routes (`pages/api/*.ts`)**
- Endpoints HTTP publics
- Validation des requêtes entrantes
- **NE CONTIENT PAS** la logique métier
- Importent et utilisent les services backend

**Pattern :**
```typescript
// pages/api/articles.ts
import { ArticleService } from '@/backend/services';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { articles, total } = await ArticleService.getAll(
        req.query.category as string,
        parseInt(req.query.limit as string) || 10
      );
      res.status(200).json({ success: true, data: { articles, total } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
```

### 3. **Services (`backend/services/*.ts`)**
- **Logique métier pure**
- Classe statique avec méthodes métier
- Utilisent Prisma pour accéder aux données
- Valident et transforment les données
- Gèrent les erreurs métier

**Classes principales :**
- `ArticleService`
- `FormationService`
- `SessionService`
- `InscriptionFormationService`
- `BrochureService`

**Pattern :**
```typescript
export class FormationService {
  static async getAll(filters?: any) {
    // Logique métier
    return await prisma.formation.findMany({
      where: filters,
      include: { sessions: true }
    });
  }
  
  static async create(data: ICreateFormationInput) {
    // Validation métier + création
    return await prisma.formation.create({ data });
  }
}
```

### 4. **Types (`backend/types/index.ts`)**
- Interfaces TypeScript centralisées
- Typage fort pour toutes les entités
- Réutilisables dans services ET frontend

**Exemples :**
```typescript
interface IFormation {
  id: number;
  name: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  // ...
}

interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### 5. **Base de données (`backend/lib/db.ts`, `prisma/schema.prisma`)**
- Instance Prisma unique
- Schéma de base de données
- Relations entre modèles

## Conventions de nommage

| Type | Convention | Exemple |
|------|-----------|---------|
| Services | `[Entity]Service` | `ArticleService`, `FormationService` |
| Types/Interfaces | `I[EntityName]` | `IArticle`, `IFormation` |
| API Routes | kebab-case | `/api/articles`, `/api/formations` |
| Composants React | PascalCase | `Header`, `ArticleCard` |
| Fichiers services | camelCase + Service | `articleService.ts` |

## Import guidlines

✅ **BON :** Importer directement depuis le service
```typescript
import { ArticleService } from '@/backend/services';
// ou
import { ArticleService } from '@/backend/services/articleService';
```

❌ **MAUVAIS :** Importer Prisma directement dans les routes API
```typescript
import { prisma } from '@/backend/lib/db';
// ❌ Logique métier dans la route API
```

## Ajouter une nouvelle entité

1. **Ajouter le modèle dans `prisma/schema.prisma`**
   ```prisma
   model NewEntity {
     id Int @id @default(autoincrement())
     // champs...
   }
   ```

2. **Mettre à jour Prisma**
   ```bash
   npx prisma migrate dev --name add_new_entity
   ```

3. **Ajouter les types dans `backend/types/index.ts`**
   ```typescript
   export interface INewEntity { /* ... */ }
   ```

4. **Créer le service dans `backend/services/newEntityService.ts`**
   ```typescript
   import { INewEntity } from '@/backend/types';
   export class NewEntityService {
     static async getAll() { /* ... */ }
   }
   ```

5. **Ajouter l'export dans `backend/services/index.ts`**
   ```typescript
   export { NewEntityService } from './newEntityService';
   ```

6. **Créer la route API dans `pages/api/newentities.ts`**
   ```typescript
   import { NewEntityService } from '@/backend/services';
   export default async function handler(req, res) {
     // ...
   }
   ```

## Points clés de la séparation

| Responsabilité | Où | Pourquoi |
|---|---|---|
| Validation métier | `backend/services` | Logique réutilisable |
| Validation réseau | `pages/api` | Contrôle de l'API |
| Rendu UI | `pages`, `components` | Couche présentation |
| Accès BD | `backend/services` | Isolation données |
| Types | `backend/types` | Source unique de vérité |

## Tests et développement

```bash
# Développement
npm run dev                    # Démarre sur :3000

# Build production
npm run build                  # Génère l'export statique/SSR
npm start                      # Démarre production

# Prisma
npx prisma studio            # Interface de gestion BD
npx prisma migrate dev        # Crée/exécute migrations
```

---

**Dernier update :** Mars 2026
**Mainteneur :** Équipe FiSAFi
