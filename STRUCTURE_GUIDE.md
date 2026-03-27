# 📁 Guide de la Structure du Projet

## ✅ Structure finale proposée

```
FiSAFi Groupe/
│
├── 📄 FILES DE CONFIG
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── 📄 DOCUMENTATION
│   ├── ARCHITECTURE.md          ← Plan détaillé des rôles
│   ├── GETTING_STARTED.md
│   ├── README.md
│   └── API_DOCUMENTATION.md
│
├── 🎨 FRONTEND (Interface utilisateur)
│   │
│   ├── pages/                   ← Routes Next.js EN RACINE
│   │   ├── index.tsx            (Home)
│   │   ├── training.tsx         (Page formations)
│   │   │
│   │   └── api/                 ← Endpoints HTTP
│   │       ├── articles.ts
│   │       ├── formations.ts
│   │       ├── sessions.ts
│   │       ├── inscriptions-formation.ts
│   │       ├── brochures.ts
│   │       ├── signup.ts
│   │       │
│   │       ├── articles/
│   │       │   └── [id].ts       (Route dynamique)
│   │       ├── formations/
│   │       │   └── [id].ts
│   │       ├── brochures/
│   │       │   └── [id].ts
│   │       └── ...
│   │
│   ├── components/              ← Composants React EN RACINE
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── Button.tsx
│   │   ├── Contact.tsx
│   │   ├── News.tsx
│   │   ├── Services.tsx
│   │   ├── Training.tsx
│   │   │
│   │   └── articles/            (OPTIONNEL: par domaine)
│   │       └── ArticleCard.tsx
│   │
│   ├── context/                 ← État global React EN RACINE
│   │   └── ThemeContext.tsx
│   │
│   ├── styles/                  ← CSS GLOBALE EN RACINE
│   │   └── globals.css
│   │
│   └── public/                  ← Assets statiques EN RACINE
│       └── [images, icons, fonts...]
│
├── ⚙️ BACKEND (Logique métier)
│   │
│   ├── services/                ← CŒUR MÉTIER
│   │   ├── articleService.ts    (Logique articles)
│   │   ├── formationService.ts  (Logique formations)
│   │   ├── sessionService.ts    (Logique sessions)
│   │   ├── inscriptionFormationService.ts
│   │   ├── brochureService.ts
│   │   └── index.ts             (Exports centralisés)
│   │
│   ├── types/                   ← Types TypeScript
│   │   └── index.ts             (Interfaces partagées)
│   │
│   ├── lib/                     ← Utilitaires
│   │   └── db.ts                (Instance Prisma unique)
│   │
│   └── prisma/                  ← Base de données
│       └── schema.prisma        (Schéma)
│
├── prisma/                      ← LIEN SYMLINK: backend/prisma
│   └── schema.prisma            (Double pour compat Next.js)
│
└── 🚫 DOSSIERS À SUPPRIMER
    └── frontend/                (VIDE - redondant)
        ├── components/          ← Les vrais sont en racine
        ├── context/
        ├── pages/
        ├── public/
        └── styles/
```

## 🎯 Règles d'organisation

| Dossier | Contient | Importé par | Notes |
|---------|----------|-------------|-------|
| `pages/` | Routes Next.js | Navigateur | **EN RACINE** (requis par Next.js) |
| `pages/api/` | Endpoints HTTP | Client/Services | Utilisent le backend |
| `components/` | Composants React | pages, autres composants | **EN RACINE** |
| `context/` | État React global | components, pages | **EN RACINE** |
| `backend/services/` | Logique métier | pages/api, autres services | Pas accès direct du frontend |
| `backend/types/` | Types TypeScript | Partout | Source unique de vérité |
| `backend/lib/` | Utilitaires | Services uniquement | DB, helpers |
| `public/` | Assets statiques | HTML direct | **EN RACINE** |
| `styles/` | CSS global | dans pages/_app | **EN RACINE** |

## ❌ Structure ACTUELLE (à NETTOYER)

```
❌ frontend/              ← DOUBLET VIDE à supprimer
   ├── components/       ← Vrai: components/ (racine)
   ├── context/          ← Vrai: context/ (racine)
   ├── pages/            ← Vrai: pages/ (racine)
   ├── public/           ← Vrai: public/ (racine)
   └── styles/           ← Vrai: styles/ (racine)

❌ backend/api/          ← Routes API au mauvais endroit
   ├── articles.ts       ← Doit être: pages/api/articles.ts
   └── ...               ← Doit importer: backend/services

⚠️ pages/ (root)         ← BON - garder
⚠️ components/ (root)    ← BON - garder
⚠️ context/ (root)       ← BON - garder
⚠️ public/ (root)        ← BON - garder
⚠️ styles/ (root)        ← BON - garder
```

## ✅ Étapes de nettoyage

### 1. Supprimer frontend/ (dupliqué et vide)
```bash
rm -r frontend
```

### 2. Vérifier backend/api/ et le supprimer (routes API redondantes)
```bash
rm -r backend/api
```
> Les vraies routes doivent être dans `pages/api/` avec imports du backend

### 3. Vérifier que pages/api/ utilise les services backend
Exemple correct:
```typescript
// ✅ pages/api/articles.ts
import { ArticleService } from '@/backend/services';

export default async function handler(req, res) {
  const articles = await ArticleService.getAll();
  res.json({ success: true, data: articles });
}
```

### 4. Vérifier les imports dans pages/api/
```typescript
// ❌ MAUVAIS
import { prisma } from '@/backend/lib/db';
const articles = await prisma.article.findMany();

// ✅ BON
import { ArticleService } from '@/backend/services';
const { articles } = await ArticleService.getAll();
```

## 📋 Checklist finale

- [ ] Fichiers dans `pages/` : `index.tsx`, `training.tsx`
- [ ] Routes API dans `pages/api/` : `articles.ts`, `formations.ts`, etc.
- [ ] Routes API importent `backend/services`
- [ ] Composants dans `components/` (racine)
- [ ] Context dans `context/` (racine)
- [ ] Dossier `frontend/` supprimé
- [ ] Dossier `backend/api/` supprimé ou vidé
- [ ] Backend services en place (`backend/services/*.ts`)
- [ ] Types centralisés (`backend/types/index.ts`)

## 🔗 Imports correctes par fichier

### Dans une page (`pages/training.tsx`)
```typescript
import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';

export default function Training() { /* ... */ }
```

### Dans une route API (`pages/api/formations.ts`)
```typescript
import { FormationService } from '@/backend/services';

export default async function handler(req, res) {
  const formations = await FormationService.getAll();
  res.json({ success: true, data: formations });
}
```

### Dans un composant (`components/Training.tsx`)
```typescript
import { useState, useEffect } from 'react';

export function Training() {
  const [formations, setFormations] = useState([]);
  
  useEffect(() => {
    fetch('/api/formations')
      .then(r => r.json())
      .then(d => setFormations(d.data));
  }, []);
}
```

---

**Prochaine action :** Exécuter le nettoyage des doublons
