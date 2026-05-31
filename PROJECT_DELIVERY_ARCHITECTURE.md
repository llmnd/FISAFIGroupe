# 📋 FiSAFi Groupe - Documentation Architecture Complète
**Version de livraison client**  
Date: Mai 2026

---

## 🎯 Vue d'ensemble du Projet

**FiSAFi Groupe** est une plateforme web vitrine et de gestion de formations pour une entreprise d'ingénierie, d'expertise et de formation.

### Objectifs Principaux
- 🌐 Site vitrine professionnel
- 📚 Gestion et catalogue de formations
- 📅 Système de sessions et inscriptions
- 📰 Blog/actualités technique
- 💼 Tableau de bord administrateur
- 📧 Gestion des contacts et inscriptions

### Type de Projet
- **Monorepo**: Frontend Next.js + Backend Fastify
- **Architecture**: Backend-Frontend Séparé
- **Déploiement**: Frontend sur Vercel, Backend sur Render/OVH

---

## 🛠️ Stack Technologique

### Frontend
| Technologie | Version | Usage |
|-------------|---------|-------|
| **Next.js** | 16.2.3 | Framework React, SSR, routing |
| **React** | 18.2.0 | UI components |
| **TypeScript** | 5.0.0 | Type safety |
| **Tailwind CSS** | 3.3.0 | Styling |
| **Framer Motion** | 12.38.0 | Animations |
| **GSAP** | 3.14.2 | Advanced animations |
| **Leaflet** | 1.9.4 | Cartes géographiques |
| **React Context** | 18.2.0 | State management (simple) |

### Backend
| Technologie | Version | Usage |
|-------------|---------|-------|
| **Fastify** | 5.8.4 | HTTP server, API |
| **Prisma** | 5.22.0 | ORM + migrations BD |
| **PostgreSQL** | Latest | Base de données |
| **Node.js** | 18+ | Runtime |
| **TypeScript** | 5.0.0 | Type safety |
| **bcrypt** | 5.1.1 | Password hashing |
| **Nodemailer** | 8.0.4 | Emails |
| **JWT** | 10.0.0 | Authentication |

### Déploiement
- **Frontend**: Vercel
- **Backend**: Render / OVH VPS
- **Base de données**: Neon (PostgreSQL)

---

## 📁 Structure Complète du Projet

```
FiSAFi Groupe/
│
├── 📄 Configuration Files
│   ├── package.json              # Scripts, dépendances
│   ├── tsconfig.json             # Config TypeScript Frontend
│   ├── tsconfig.backend.json     # Config TypeScript Backend
│   ├── next.config.js            # Config Next.js
│   ├── tailwind.config.js        # Config Tailwind CSS
│   ├── postcss.config.js         # Config PostCSS
│   ├── vercel.json               # Config Vercel
│   ├── render.yaml               # Config Render
│   └── .env.example              # Variables d'environnement (template)
│
├── 📁 app/ (App Router - New Next.js)
│   ├── layout.tsx                # Layout racine
│   ├── sitemap.ts                # SEO Sitemap
│   ├── articles/                 # Routes articles
│   ├── contact/                  # Routes contact
│   ├── news/                     # Routes actualités
│   ├── privacy/                  # Conditions de confidentialité
│   ├── search/                   # Recherche
│   ├── services/                 # Services page
│   ├── sessions/                 # Sessions de formation
│   ├── terms/                    # Conditions d'utilisation
│   └── training/                 # Formations page
│
├── 📁 pages/ (Pages Router - Old Next.js)
│   ├── _app.tsx                  # Initialisation app
│   ├── _document.tsx             # Customisation HTML
│   ├── index.tsx                 # Page d'accueil
│   ├── training.tsx              # Formations (page)
│   ├── services.tsx              # Services (page)
│   ├── news.tsx                  # Actualités (page)
│   ├── sessions.tsx              # Sessions (page)
│   ├── contact.tsx               # Contact (page)
│   ├── search.tsx                # Recherche (page)
│   ├── login.tsx                 # Connexion admin
│   ├── admin-dashboard.tsx       # Tableau de bord admin
│   ├── dashboard.tsx             # Dashboard principal
│   ├── privacy.tsx               # Confidentialité
│   ├── terms.tsx                 # Conditions d'utilisation
│   ├── articles/[slug].tsx       # Article détail (route dynamique)
│   ├── news/[slug].tsx           # Actualité détail (route dynamique)
│   └── api/                      # API Routes Next.js
│       ├── articles.ts           # GET/POST articles
│       ├── formations.ts         # GET/POST formations
│       ├── sessions.ts           # GET/POST sessions
│       ├── inscriptions.ts       # Gestion inscriptions
│       └── ...
│
├── 📁 components/ (Composants React Réutilisables)
│   ├── Header.tsx                # En-tête avec nav
│   ├── Footer.tsx                # Pied de page
│   ├── HeroSection.tsx           # Section héros
│   ├── HeroText.tsx              # Texte héros
│   ├── heroSlideshow.tsx         # Diaporama héros
│   ├── Services.tsx              # Grille services
│   ├── servicesgrid.tsx          # Services grid component
│   ├── News.tsx                  # Actualités list
│   ├── CardCarousel.tsx          # Carousel de cartes
│   ├── AboutStripSlideshow.tsx   # Diaporama "À propos"
│   ├── CeoGreeting.tsx           # Message CEO
│   ├── Contact.tsx               # Formulaire contact
│   ├── MapComponent.tsx          # Carte Leaflet
│   ├── Modal.tsx                 # Modal réutilisable
│   ├── Button.tsx                # Bouton réutilisable
│   ├── CustomCursor.tsx          # Curseur personnalisé
│   ├── FloatingQuickMenu.tsx     # Menu flottant
│   ├── ScrollManager.tsx         # Gestion scroll
│   ├── ScrollParallax.tsx        # Effet parallax
│   ├── SmoothScrollProvider.tsx  # Provider smooth scroll
│   ├── StatCounter.tsx           # Compteurs stats
│   └── ZoomOptimizer.tsx         # Optimisation zoom mobile
│
├── 📁 context/ (Contexte React - État Global)
│   ├── ThemeContext.tsx          # Thème clair/sombre
│   └── LanguageContext.tsx       # Multilingue (i18n)
│
├── 📁 hooks/ (Hooks React Personnalisés)
│   └── useScrollAnimation.ts     # Hook animations au scroll
│
├── 📁 i18n/ (Internationalisation)
│   ├── translations.ts           # Dictionnaire traductions
│   └── useTranslation.ts         # Hook utiliser traductions
│
├── 📁 styles/ (Feuilles CSS)
│   ├── globals.css               # Styles globaux
│   ├── header.css                # Styles header
│   ├── footer-enhanced.css       # Styles footer
│   ├── carousel.css              # Styles carousel
│   ├── heroSlideshow.css         # Styles diaporama héros
│   ├── scroll-3d.css             # Styles scroll 3D
│   ├── floating-logo.css         # Styles logo flottant
│   ├── search.module.css         # Styles recherche (CSS Module)
│   └── modules/                  # CSS Modules additionnels
│
├── 📁 public/ (Fichiers Statiques)
│   ├── favicon/                  # Favicons
│   ├── robots.txt                # SEO robots
│   └── [assets]/                 # Images, fonts, etc.
│
├── 📁 backend/ (Logique Métier - Node.js/Fastify)
│   │
│   ├── server.ts                 # Point d'entrée serveur
│   ├── config/                   # Configuration serveur
│   │   ├── index.ts              # Env variables parsing
│   │   └── database.ts           # Config base de données
│   │
│   ├── services/                 # Couche Métier (Business Logic)
│   │   ├── index.ts              # Exports centralisés
│   │   ├── articleService.ts     # Gestion articles
│   │   ├── formationService.ts   # Gestion formations
│   │   ├── sessionService.ts     # Gestion sessions
│   │   ├── inscriptionFormationService.ts # Inscriptions
│   │   ├── brochureService.ts    # Gestion brochures
│   │   ├── emailService.ts       # Envoi emails
│   │   └── cloudinaryService.ts  # Upload images
│   │
│   ├── routes/                   # Routes API Fastify
│   │   ├── articles.ts           # Routes /api/articles
│   │   ├── formations.ts         # Routes /api/formations
│   │   ├── sessions.ts           # Routes /api/sessions
│   │   ├── inscriptions.ts       # Routes /api/inscriptions
│   │   ├── brochures.ts          # Routes /api/brochures
│   │   ├── auth.ts               # Routes /api/auth
│   │   ├── users.ts              # Routes /api/users
│   │   └── seed.ts               # Routes seed (dev)
│   │
│   ├── controllers/              # Controllers (logique requêtes)
│   │   ├── articleController.ts
│   │   ├── formationController.ts
│   │   ├── sessionController.ts
│   │   └── ...
│   │
│   ├── middleware/               # Middleware Fastify
│   │   ├── auth.ts               # Authentification JWT
│   │   ├── validation.ts         # Validation requêtes
│   │   └── errorHandler.ts       # Gestion erreurs
│   │
│   ├── types/                    # Types TypeScript
│   │   └── index.ts              # Interfaces (IArticle, etc.)
│   │
│   ├── utils/                    # Utilitaires
│   │   ├── validators.ts         # Validateurs
│   │   ├── helpers.ts            # Fonctions utiles
│   │   └── jwt.ts                # JWT utils
│   │
│   ├── lib/                      # Librairies internes
│   │   ├── db.ts                 # PrismaClient (instance unique)
│   │   └── logger.ts             # Logger
│   │
│   ├── prisma/                   # ORM & Base de données
│   │   ├── schema.prisma         # Schéma BD
│   │   └── migrations/           # Historique migrations
│   │
│   ├── createAdmin.ts            # Script création admin
│   ├── manageAdmin.ts            # Gestion admins
│   ├── seed.ts                   # Seed données de test
│   ├── setup.sh                  # Script setup initial
│   │
│   ├── ADMIN_MANAGEMENT.md       # Doc gestion admins
│   ├── API_DOCUMENTATION.md      # Doc API complète
│   └── README.md                 # Doc backend
│
├── 📁 prisma/ (Configuration Prisma)
│   ├── schema.prisma             # Schéma base de données
│   └── migrations/               # Historique migrations
│
├── 📁 scripts/ (Scripts utilitaires)
│   ├── prisma-migrate.js         # Migration script
│   ├── scroll-optimizations.js   # Optimisations scroll
│   └── zoom-detection.js         # Détection zoom mobile
│
├── 📄 Documentation
│   ├── README.md                 # Vue d'ensemble
│   ├── GETTING_STARTED.md        # Guide démarrage
│   ├── ARCHITECTURE.md           # Architecture (ancien)
│   ├── STRUCTURE_GUIDE.md        # Guide structure
│   ├── BACKEND_SETUP.md          # Setup backend
│   ├── QUICK_START_BACKEND.md    # Quick start backend
│   ├── EMAIL_CONFIGURATION.md    # Config emails
│   ├── BACKEND_URL_CONFIG.md     # Config URLs backend
│   ├── VERCEL_FIX_GUIDE.md       # Fixes Vercel
│   ├── OVH_VERCEL_DEPLOYMENT.md  # Déploiement OVH/Vercel
│   ├── RENDER_DEPLOYMENT.md      # Déploiement Render
│   ├── SEO_STRATEGY.md           # Stratégie SEO
│   ├── SEO_CHECKLIST.md          # Checklist SEO
│   ├── SEO_PAGE_METADATA.md      # Métadonnées SEO
│   ├── ANIMATIONS_GUIDE.md       # Guide animations
│   ├── IMAGES_GUIDE.md           # Guide images
│   ├── MOBILE_OPTIMIZATIONS.md   # Optimisations mobile
│   ├── MOBILE_TESTING.md         # Tests mobile
│   ├── PERFORMANCE_OPTIMIZATIONS.md # Optimisations perf
│   ├── ADMIN_DASHBOARD_CHANGES.md # Changements dashboard
│   ├── ZOOM_FIX.md               # Fix zoom mobile
│   └── PROJECT_DELIVERY_ARCHITECTURE.md # Cette doc
│
├── .env.example                  # Template variables env
├── .gitignore                    # Git ignore
├── next-env.d.ts                 # Types Next.js
└── styles.d.ts                   # Types CSS modules
```

---

## 📄 Pages & Routing (Frontend)

### Page d'Accueil
- **Route**: `/` (pages/index.tsx)
- **Composants**: HeroSection, Services, News, AboutStrip, StatCounter
- **Contenu**: Présentation, services principaux, actualités, stats

### Formations
- **Route**: `/training` (pages/training.tsx)
- **Fonction**: Catalogue de formations, filtres
- **Données**: Récupère depuis `/api/formations`

### Sessions
- **Route**: `/sessions` (pages/sessions.tsx)
- **Fonction**: Calendrier des sessions disponibles
- **Données**: Récupère depuis `/api/sessions`

### Services
- **Route**: `/services` (pages/services.tsx)
- **Fonction**: Détail des services proposés
- **Composants**: ServiceGrid avec cartes

### Actualités/Blog
- **Route**: `/news` (pages/news.tsx)
- **Fonction**: Liste des actualités techniques
- **Route Détail**: `/news/[slug]` (pages/news/[slug].tsx)
- **Données**: Récupère depuis `/api/articles`

### Articles Techniques
- **Route**: `/articles` (app/articles/)
- **Route Détail**: `/articles/[slug]`
- **Données**: Récupère depuis `/api/articles`

### Recherche
- **Route**: `/search` (pages/search.tsx)
- **Fonction**: Recherche articles, formations, sessions
- **Recherche**: Full-text ou filtering

### Contact
- **Route**: `/contact` (pages/contact.tsx)
- **Fonction**: Formulaire contact
- **Envoi**: Via emailService backend

### Pages Légales
- **Confidentialité**: `/privacy` (pages/privacy.tsx)
- **Conditions**: `/terms` (pages/terms.tsx)

### Admin
- **Connexion**: `/login` (pages/login.tsx)
- **Dashboard**: `/admin-dashboard` (pages/admin-dashboard.tsx)
- **Fonction**: Gestion articles, formations, sessions, inscriptions
- **Authentification**: JWT Token

---

## 🎨 Composants React (Frontend)

### Composants Layout
| Composant | Usage | Props |
|-----------|-------|-------|
| **Header.tsx** | Navigation et logo | `fixed`, `transparent` |
| **Footer.tsx** | Pied de page | `company`, `links` |

### Composants Hero/Landing
| Composant | Usage | Props |
|-----------|-------|-------|
| **HeroSection.tsx** | Section héros principale | `title`, `subtitle`, `bgImage` |
| **HeroText.tsx** | Texte animé héros | `text`, `delay` |
| **heroSlideshow.tsx** | Diaporama images héros | `images`, `interval` |

### Composants Contenu
| Composant | Usage | Props |
|-----------|-------|-------|
| **Services.tsx** | Affiche liste services | `services` |
| **servicesgrid.tsx** | Grille services avec icônes | `items` |
| **News.tsx** | Liste actualités | `articles`, `limit` |
| **CardCarousel.tsx** | Carousel de cartes | `items`, `autoplay` |

### Composants Interactifs
| Composant | Usage | Props |
|-----------|-------|-------|
| **Contact.tsx** | Formulaire contact | `onSubmit`, `loading` |
| **Modal.tsx** | Fenêtre modale | `isOpen`, `onClose`, `children` |
| **Button.tsx** | Bouton réutilisable | `variant`, `size`, `onClick` |
| **MapComponent.tsx** | Carte Leaflet | `lat`, `lng`, `zoom` |

### Composants Spécialisés
| Composant | Usage | Props |
|-----------|-------|-------|
| **CustomCursor.tsx** | Curseur personnalisé | `color` |
| **FloatingQuickMenu.tsx** | Menu flottant fixe | `items` |
| **ScrollParallax.tsx** | Effet parallax au scroll | `speed`, `children` |
| **StatCounter.tsx** | Compteurs animés | `stats` |
| **ZoomOptimizer.tsx** | Prévention zoom mobile | — |
| **AboutStripSlideshow.tsx** | Diaporama "À propos" | `images` |
| **CeoGreeting.tsx** | Message CEO | `name`, `message` |

### Composants Providers/Utility
| Composant | Usage |
|-----------|-------|
| **SmoothScrollProvider.tsx** | Provider scroll lisse |
| **ScrollManager.tsx** | Gestion du scroll |

---

## 🗄️ Base de Données (Prisma Schema)

### Modèles Principaux

#### 1. **User** (Authentification Admin)
```typescript
model User {
  id          String      // ID unique
  email       String      // Email unique
  password    String      // Hash bcrypt
  firstName   String?
  lastName    String?
  role        String      // "user", "admin", "moderator"
  active      Boolean     // Compte actif
  createdAt   DateTime
  updatedAt   DateTime
}
```

#### 2. **Article** (Blog/Actualités)
```typescript
model Article {
  id          Int         // ID auto-increment
  title       String      // Titre article
  slug        String      // URL-friendly slug
  category    String      // "technique", "innovation", "evenement", "veille"
  excerpt     String      // Résumé court
  content     String      // Contenu complet
  image       String?     // URL image
  author      String?     // Auteur
  published   Boolean     // Publié ou brouillon
  createdAt   DateTime
  updatedAt   DateTime
  publishedAt DateTime?   // Date publication
}
```

#### 3. **Formation** (Formations)
```typescript
model Formation {
  id              Int     // ID auto-increment
  name            String  // Nom formation
  slug            String  // URL slug
  duration        String  // "5 jours", "40 heures"
  level           String  // "Débutant", "Intermédiaire", "Avancé"
  description     String  // Description courte
  content         String? // Contenu détaillé
  objectives      String? // Objectifs pédagogiques
  price           Float?  // Prix (optionnel)
  maxParticipants Int     // Places max
  published       Boolean // Visible ou masquée
  createdAt       DateTime
  updatedAt       DateTime
  
  sessions        SessionFormation[]        // Relations
  inscriptions    InscriptionFormation[]
}
```

#### 4. **SessionFormation** (Calendrier Sessions)
```typescript
model SessionFormation {
  id          Int         // ID auto-increment
  formationId Int         // FK vers Formation
  startDate   DateTime    // Date début
  endDate     DateTime    // Date fin
  location    String      // Lieu
  capacity    Int         // Places totales
  available   Int         // Places disponibles
  status      String      // "ouverte", "complète", "annulée", "terminée", "en_attente"
  createdAt   DateTime
  updatedAt   DateTime
  
  formation   Formation
  inscriptions InscriptionFormation[]
}
```

#### 5. **InscriptionFormation** (Inscriptions Formations)
```typescript
model InscriptionFormation {
  id          Int         // ID auto-increment
  sessionId   Int         // FK vers SessionFormation
  formationId Int         // FK vers Formation
  firstName   String      // Prénom
  lastName    String      // Nom
  email       String      // Email
  phone       String      // Téléphone
  company     String?     // Entreprise
  status      String      // "confirme", "liste_attente", "annule", "demande_en_attente"
  createdAt   DateTime
  updatedAt   DateTime
  
  session     SessionFormation
  formation   Formation
}
```

#### 6. **Inscription** (Contact/Formulaire)
```typescript
model Inscription {
  id        Int         // ID auto-increment
  name      String      // Nom
  email     String      // Email
  phone     String?     // Téléphone
  subject   String      // Sujet
  message   String      // Message
  status    String      // "pending", "read", "replied"
  createdAt DateTime
}
```

#### 7. **Brochure** (Fichiers Téléchargeables)
```typescript
model Brochure {
  id          Int         // ID auto-increment
  name        String      // Nom brochure
  description String?     // Description
  fileUrl     String      // URL fichier (S3/Cloudinary)
  fileSize    String?     // Taille "2.4 MB"
  type        String      // "PDF", "DOC", etc.
  published   Boolean     // Visible ou masquée
  createdAt   DateTime
  updatedAt   DateTime
}
```

---

## 🔌 Architecture Backend (Fastify)

### Flux d'une Requête API

```
Client (Frontend)
    ↓ HTTP Request
    ↓
Fastify Server (server.ts)
    ↓
Routes (routes/articles.ts, etc.)
    ↓
Controllers (controllers/articleController.ts)
    ↓
Services (services/articleService.ts) ← Logique métier
    ↓
Prisma ORM
    ↓
PostgreSQL Database
```

### Services (Couche Métier)

Chaque service encapsule la logique métier pour une entité:

#### **ArticleService**
- `getAll(category?, published?)` - Liste articles
- `getById(id)` - Article par ID
- `getBySlug(slug)` - Article par URL slug
- `create(data)` - Créer article
- `update(id, data)` - Modifier article
- `delete(id)` - Supprimer article
- `publish(id)` - Publier article
- `search(query)` - Recherche full-text

#### **FormationService**
- `getAll(published?)` - Liste formations
- `getById(id)` - Formation par ID
- `getBySlug(slug)` - Formation par URL slug
- `create(data)` - Créer formation
- `update(id, data)` - Modifier formation
- `delete(id)` - Supprimer formation
- `getWithSessions(id)` - Formation + sessions

#### **SessionService**
- `getAll(formationId?, status?)` - Sessions
- `getById(id)` - Session par ID
- `create(data)` - Créer session
- `update(id, data)` - Modifier session
- `getAvailable()` - Sessions disponibles
- `checkCapacity(sessionId)` - Vérifier places

#### **InscriptionFormationService**
- `create(data)` - Créer inscription
- `getBySession(sessionId)` - Inscriptions session
- `getByEmail(email)` - Inscriptions utilisateur
- `updateStatus(id, status)` - Changer statut
- `sendConfirmation(email)` - Email confirmation

#### **BrochureService**
- `getAll(published?)` - Liste brochures
- `create(data)` - Uploader brochure
- `delete(id)` - Supprimer brochure

#### **EmailService**
- `sendContactForm(to, data)` - Email contact
- `sendInscriptionConfirmation(email)` - Confirmation inscription
- `sendSessionReminder(sessionId)` - Rappel session

#### **CloudinaryService**
- `uploadImage(file)` - Upload image
- `deleteImage(publicId)` - Supprimer image
- `getUrl(publicId)` - Récupérer URL

### Routes API (Fastify)

#### Articles
```
GET    /api/v1/articles                    # Liste
GET    /api/v1/articles/:id                # Détail par ID
GET    /api/v1/articles/slug/:slug         # Détail par slug
POST   /api/v1/articles        [AUTH]      # Créer
PUT    /api/v1/articles/:id    [AUTH]      # Modifier
DELETE /api/v1/articles/:id    [AUTH]      # Supprimer
```

#### Formations
```
GET    /api/v1/formations                  # Liste
GET    /api/v1/formations/:id              # Détail
POST   /api/v1/formations      [AUTH]      # Créer
PUT    /api/v1/formations/:id  [AUTH]      # Modifier
DELETE /api/v1/formations/:id  [AUTH]      # Supprimer
```

#### Sessions
```
GET    /api/v1/sessions                    # Liste
GET    /api/v1/sessions/:id                # Détail
POST   /api/v1/sessions        [AUTH]      # Créer
PUT    /api/v1/sessions/:id    [AUTH]      # Modifier
DELETE /api/v1/sessions/:id    [AUTH]      # Supprimer
```

#### Inscriptions Formations
```
GET    /api/v1/inscriptions                # Liste [AUTH]
POST   /api/v1/inscriptions                # S'inscrire
GET    /api/v1/inscriptions/:id [AUTH]     # Détail
PUT    /api/v1/inscriptions/:id [AUTH]     # Modifier
DELETE /api/v1/inscriptions/:id [AUTH]     # Annuler
```

#### Authentification
```
POST   /api/v1/auth/register               # Créer compte
POST   /api/v1/auth/login                  # Connexion
POST   /api/v1/auth/logout      [AUTH]     # Déconnexion
POST   /api/v1/auth/refresh     [AUTH]     # Renouveler token
```

#### Admin
```
GET    /api/v1/users            [AUTH]     # Liste utilisateurs
POST   /api/v1/users            [AUTH]     # Créer admin
DELETE /api/v1/users/:id        [AUTH]     # Supprimer admin
```

---

## 🚀 Scripts & Commandes

### Développement Frontend
```bash
npm run dev          # Démarrer dev server Next.js (port 3000)
npm run lint         # Lint code
```

### Développement Backend
```bash
npm run dev:backend  # Démarrer serveur Fastify (port 3001)
npm run dev:all      # Frontend + Backend en parallèle
```

### Base de Données
```bash
npm run prisma:migrate   # Créer/exécuter migrations
npm run prisma:generate  # Générer client Prisma
npm run prisma:reset     # Réinitialiser BD (danger!)
npm run seed             # Charger données test
```

### Gestion Admins
```bash
npm run create:admin       # Créer premier admin
npm run admin:list         # Lister admins
npm run admin:create       # Créer nouvel admin
npm run admin:delete       # Supprimer admin
npm run admin:reset        # Réinitialiser tous admins
```

### Production
```bash
npm run build              # Build frontend + Prisma
npm run build:backend      # Compiler backend TypeScript
npm run start              # Démarrer Next.js production
npm run start:backend      # Démarrer serveur Fastify
```

---

## 🌐 Déploiement

### Frontend (Vercel)
1. Push code sur GitHub
2. Vercel détecte et déploie automatiquement
3. URL: `https://fisafi.vercel.app`

### Backend (Render.com)
1. Créer service Render
2. Configurer env variables
3. Déployer depuis GitHub
4. URL: `https://fisafi-backend.onrender.com`

### Base de Données (Neon.tech)
1. Créer projet Neon PostgreSQL
2. Copier `DATABASE_URL`
3. Ajouter à env variables

---

## 🔐 Authentification & Sécurité

### JWT Authentication
- **Secret**: Stocké dans `JWT_SECRET` env variable
- **Durée**: 24h par défaut
- **Refresh**: Token refresh endpoint
- **Stockage Frontend**: localStorage ou cookies

### Middleware Auth
```typescript
// Routes protégées nécessitent:
app.post('/api/v1/articles', {
  onRequest: app.authenticate  // Middleware JWT
}, handler);
```

### Password Security
- Hachage: **bcrypt** avec salt rounds 10
- Validation: Min 8 caractères, complexité

### CORS Configuration
Domaines autorisés:
- `http://localhost:3000`
- `https://fisafi.vercel.app`
- `https://fisafigroupe.com`
- `https://fisafi-backend.onrender.com`

---

## 📧 Configuration Email

### Nodemailer Service
- **Fournisseur**: Configurable (SMTP)
- **Utilisation**: Inscriptions, contact, rappels
- **Templates**: HTML personnalisés

### Variables Nécessaires
```env
EMAIL_SERVICE=gmail|outlook|custom
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=app-password-or-token
EMAIL_FROM=contact@fisafigroupe.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
```

---

## 🖼️ Gestion Images (Cloudinary)

### Uploader Images
```typescript
import { cloudinaryService } from '@/backend/services';

const url = await cloudinaryService.uploadImage(file);
```

### Variables Nécessaires
```env
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-secret (backend only!)
```

---

## 🎯 Features Clés du Site

### 1. **Site Vitrine Responsive**
- Design mobile-first avec Tailwind CSS
- Animations fluides (GSAP, Framer Motion)
- Performance optimisée (Next.js image optimization)

### 2. **Gestion Formations**
- Catalogue complet avec filtres
- Calendrier sessions avec disponibilités
- Système d'inscription (waitlist si complet)

### 3. **Blog Technique**
- Articles avec catégories et tags
- Search full-text
- SEO-optimisé (metadata, sitemap)

### 4. **Tableau de Bord Admin**
- Gestion articles (CRUD)
- Gestion formations (CRUD)
- Gestion sessions et inscriptions
- Statistics et métriques

### 5. **Formulaire Contact**
- Validation et sécurité CSRF
- Envoi email automatique
- Stockage en BD

### 6. **Optimisations Mobile**
- Prévention zoom/pinch
- Touch-friendly UI
- Fast load times

### 7. **SEO Complet**
- Sitemap XML auto-généré
- Robots.txt configuré
- Meta tags dynamiques par page
- Open Graph pour réseaux sociaux

---

## 📦 Installation & Setup

### 1. **Cloner le projet**
```bash
git clone <repository>
cd FiSAFi\ Groupe
npm install
```

### 2. **Configurer .env.local**
```bash
cp .env.example .env.local
# Éditer .env.local avec vos valeurs réelles
```

### 3. **Setup Base de Données**
```bash
npm run prisma:migrate
npm run prisma:generate
npm run db:setup  # Crée BD + migrations + admin
```

### 4. **Développement**
```bash
npm run dev:all    # Lance frontend + backend
```

Accès:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

---

## ✅ Checklist Livraison Client

- [x] Documentation architecture complète
- [x] .env.example avec tous les paramètres
- [x] Scripts deployment prêts
- [x] Admin panel fonctionnel
- [x] Base de données migrée
- [x] SEO optimisé
- [x] Mobile responsive
- [x] Sécurité authentification
- [x] Email service configuré
- [x] Images Cloudinary intégrées
- [x] Testing & QA complété

---

## 📞 Support & Documentation

Pour questions spécifiques, consulter:
- `BACKEND_SETUP.md` - Setup backend détaillé
- `OVH_VERCEL_DEPLOYMENT.md` - Déploiement production
- `EMAIL_CONFIGURATION.md` - Configuration emails
- `SEO_STRATEGY.md` - Stratégie SEO complète
- `MOBILE_OPTIMIZATIONS.md` - Optimisations mobile
- `backend/API_DOCUMENTATION.md` - API endpoints détaillés

---

**End of Architecture Documentation**
