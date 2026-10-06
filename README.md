# FiSAFi Groupe - Ingénierie, Expertise et Formation

Site vitrine et plateforme de gestion pour FiSAFi Groupe.

## 🚀 Quick Start

### Frontend + Backend

```bash
# Installation des dépendances
npm install

# Démarrer frontend + backend ensemble
npm run dev:all
```

`dev:all` génère d'abord le client Prisma et compile le backend avant de démarrer Next.js et le backend ensemble. Cela évite que `prisma generate` remplace le moteur Windows pendant que Next.js le charge. Si `EPERM` persiste, arrêtez proprement les anciens processus du projet, puis relancez cette commande.

**Frontend:** `http://localhost:3000`  
**Backend:** `http://localhost:3001`

### Frontend seul
```bash
npm run dev
```

### Backend seul
```bash
npm run dev:backend
```

## 📁 Structure du Projet

```
FiSAFi Groupe/
├── README.md                 ← Vous êtes ici
├── docs/                     ← Documentation complète
│   ├── BACKEND_SETUP.md
│   ├── DEPLOYMENT.md
│   ├── SEO_STRATEGY.md
│   └── ...
├── app/                      ← Frontend Next.js
│   ├── layout.tsx
│   ├── page.tsx
│   └── ...
├── pages/                    ← Pages Next.js (API routes)
│   ├── api/                  ← API endpoints
│   └── ...
├── backend/                  ← Backend Fastify
│   ├── server.ts
│   ├── services/            ← Logique métier
│   ├── routes/              ← Routes API
│   ├── prisma/              ← Base de données
│   └── README.md
├── components/              ← Composants React
├── styles/                  ← Feuilles de style
├── public/                  ← Assets statiques
└── prisma/                  ← Schéma Prisma
```

## 📚 Documentation

Toute la documentation détaillée se trouve dans le dossier [`docs/`](./docs/):

- **[STRUCTURE_GUIDE.md](./docs/STRUCTURE_GUIDE.md)** - Architecture complète
- **[BACKEND_SETUP.md](./docs/BACKEND_SETUP.md)** - Configuration du backend
- **[SEO_STRATEGY.md](./docs/SEO_STRATEGY.md)** - Stratégie SEO
- **[DEPLOYMENT.md](./docs/OVH_VERCEL_DEPLOYMENT.md)** - Déploiement
- **[MOBILE_OPTIMIZATIONS.md](./docs/MOBILE_OPTIMIZATIONS.md)** - Optimisations mobile
- **[PERFORMANCE_OPTIMIZATIONS.md](./docs/PERFORMANCE_OPTIMIZATIONS.md)** - Performance

## 🛠️ Tech Stack

- **Frontend:** Next.js 16, React 18, TypeScript, Tailwind CSS
- **Backend:** Fastify, Prisma, PostgreSQL
- **Authentification:** JWT
- **Animations:** GSAP, Framer Motion
- **Déploiement:** Vercel (Frontend), Render/OVH (Backend)

## 📋 Commands Disponibles

```bash
# Développement
npm run dev              # Frontend seul
npm run dev:backend      # Backend seul
npm run dev:all          # Frontend + Backend

# Production
npm run build            # Build frontend
npm run build:backend    # Build backend
npm run start            # Start frontend
npm run start:backend    # Start backend

# Base de données
npm run prisma:migrate   # Lancer les migrations
npm run prisma:generate  # Générer les types Prisma
npm run seed             # Seed la base de données

# Admin
npm run create:admin     # Créer un utilisateur admin
npm run admin:list       # Lister les admins
npm run admin:reset      # Réinitialiser les admins
```

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fisafi"

# JWT
JWT_SECRET="your-secret-key"

# Server
NODE_ENV="development"
BACKEND_PORT=3001

# Email (optionnel)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

## Espace employé — point de vente

Les employés autorisés peuvent ouvrir une session, préparer une vente, encaisser et clôturer une caisse depuis `/espace-employe/points-de-vente`. Les écritures passent par les API FiSAFi puis par le fournisseur ERP côté serveur ; le navigateur n'appelle jamais Odoo directement. `ODOO_URL`, `ODOO_API_KEY` et `DATABASE_URL` doivent être configurés côté serveur. La base PostgreSQL FiSAFi fournit aussi un verrou transactionnel pour sérialiser les opérations d'une caisse.

Les ventes sont recalculées côté serveur à partir des articles, du stock de l'emplacement source POS et des données Odoo. Les clés d'opération rendent les reprises après une interruption idempotentes. Les configurations qui ne peuvent pas être calculées sans approximation sont refusées explicitement : règles de liste de prix, position fiscale par défaut, arrondi de caisse, devise avec décimales, taxes autres qu'une taxe simple en pourcentage, articles suivis par lot/série, et moyens de paiement terminaux intégrés. Valider les droits JSON-2 et les paramètres POS sur une base Odoo de test avant toute utilisation en production ; aucune vente de test ne doit être faite sur la base réelle.

## Séparation FiSAFi Market / FiSAFi Groupe

Le tableau de bord administrateur propose un sélecteur général de société Odoo ; son choix est conservé dans le cookie HttpOnly `fisafi_employee_company` et utilisé par les espaces employés, sans sélecteur redondant sur chaque page. Market est utilisé par défaut. Les catalogues et ventes sont filtrés par société, les écritures de devis créent la commande dans la société active, et chaque opération de caisse vérifie que sa configuration POS appartient à cette société. Les produits Odoo partagés peuvent être consultés, mais leur modification est limitée aux produits détenus par la société active.

Dans l'espace utilisateur, la page « Mon compte » affiche les informations, le type de compte et permet d'activer les profils `MARKET_CUSTOMER` et/ou `TRAINING_PARTICIPANT`. Le premier donne accès aux devis, commandes et factures publiées de FiSAFi Market ; le second donne accès aux formations, sessions, inscriptions et factures publiées de FiSAFi Groupe. Les coordonnées enregistrées dans le compte, dont le numéro de téléphone, sont préremplies au checkout Market. Les comptes clients Market ne voient pas les formations. Les factures sont limitées à la société demandée et au partenaire Odoo lié au compte, ou à une adresse email vérifiée lorsqu'aucun partenaire lié et compatible n'est trouvé. Les formations et inscriptions actuelles restent gérées dans la base FiSAFi locale, distinctement des ventes et factures Odoo.

## FiSAFi Market — estimation de livraison

À la commande, un écran carte dédié (`/market/livraison`, et `/livraison` sur le sous-domaine Market) permet au client d'autoriser la géolocalisation, de rechercher une adresse ou un lieu à Dakar (notamment pour une livraison à un tiers), ou de placer le repère à la main. Après un choix sur la carte ou par recherche, un géocodage inversé Nominatim préremplit l'adresse avec la rue, le quartier et la ville lorsqu'ils sont disponibles ; le client peut la corriger et ajouter un repère pour le livreur. Le trajet routier et le barème par zones (jusqu'à 3 km : 1 000 FCFA ; jusqu'à 7 km : 1 500 FCFA ; jusqu'à 12 km : 2 500 FCFA ; jusqu'à 15 km : 3 500 FCFA) sont recalculés côté serveur. Cette estimation est affichée séparément et n'est pas ajoutée au devis Odoo ; le vendeur confirme les frais. La position choisie est transmise au service de routage configuré.

Le point de départ par défaut est l'emplacement exact de FiSAFi Market indiqué sur Google Maps (14.725752, -17.469695, Dakar 00153). `MARKET_ORIGIN_LATITUDE` et `MARKET_ORIGIN_LONGITUDE` permettent de le remplacer par configuration. `OSRM_ROUTING_URL` permet d'utiliser une instance OSRM dédiée. À défaut, l'application utilise le serveur public de démonstration OSRM, qui ne doit pas être considéré comme une infrastructure de production garantie.

## Espace administrateur — ventes Odoo

Les administrateurs FiSAFi disposent du module `/espace-employe/ventes` depuis le dashboard et l'espace employé. Il permet de consulter les devis et commandes, de créer un devis brouillon avec un client et des produits Odoo, de modifier les brouillons et de confirmer un devis. L'API Odoo doit autoriser le compte associé à `ODOO_API_KEY` à lire `sale.order`, `sale.order.line`, `res.partner`, `product.template` et `product.product`, à créer/modifier `sale.order` et à appeler `sale.order.action_confirm`.

La confirmation d'un devis est une action commerciale Odoo et peut déclencher les flux logistiques ; elle ne crée pas de facture ni de paiement. Les devis envoyés et commandes confirmées ne sont pas modifiables depuis FiSAFi. Ce premier module ne donne pas accès aux autres applications Odoo (CRM, achats, comptabilité, inventaire général ou ressources humaines), qui devront être intégrées séparément avec leurs propres permissions. Tester les droits, les règles multi-sociétés et les calculs sur une base Odoo de test avant activation en production.

L'onglet Commerce du tableau de bord administrateur affiche l'historique paginé des commandes et ventes de caisse pour la société sélectionnée. Pour un ticket POS validé, le téléchargement produit un reçu HTML imprimable à partir des lignes, paiements et montants lus en direct dans Odoo. Ce reçu FiSAFi reprend les données du ticket mais n'est pas le rendu natif exact d'Odoo ; il peut être imprimé ou enregistré en PDF depuis le navigateur. Odoo Online n'expose pas la méthode de génération HTML utilisée par l'interface POS, et ne fournit pas de PDF standard pour ce ticket (à distinguer d'une facture PDF).

## Tester l'authentification en local

La base locale `fisafi_local` doit être synchronisée avec les migrations avant le démarrage du backend :

```powershell
npx prisma migrate deploy
npx prisma migrate status
```

`migrate deploy` applique uniquement les migrations en attente ; ne lancez pas `prisma migrate reset` pour corriger une colonne manquante. Pour créer un compte de test, définissez `LOCAL_ADMIN_EMAIL` et `LOCAL_ADMIN_PASSWORD` dans le terminal, puis exécutez `npm run create:admin`. Le script refuse les bases distantes et les bases locales dont le nom n'est pas `fisafi_local`, exige un mot de passe d'au moins 14 caractères, n'affiche pas le mot de passe, et ne modifie pas un compte existant.

Avant de déployer l'activation des espaces du compte et l'enregistrement des numéros de téléphone, appliquez aussi les migrations en attente sur la base de production avec `npm run prisma:deploy`, depuis un environnement dont `DATABASE_URL` pointe vers cette base, puis vérifiez avec `npx prisma migrate status`. Les migrations `20261005100000_user_profiles` et `20261006070000_add_user_phone` ajoutent respectivement les profils et le numéro de téléphone ; sans elles, ces fonctions échouent.

Sous Windows, arrêtez temporairement les serveurs Node du projet avant `npm run build:backend` ou `npm run prisma:generate` si Prisma signale `EPERM` en remplaçant `query_engine-windows.dll.node`. Un backend déjà lancé peut continuer à servir les requêtes après une migration additive, mais arrêtez-le puis reconstruisez-le avant de tester une nouvelle compilation.

## 🤝 Contribution

1. Créer une branche: `git checkout -b feature/ma-feature`
2. Commit vos changements: `git commit -m "feat: description"`
3. Push: `git push origin feature/ma-feature`
4. Ouvrir une PR

## 📝 Licence

Propriétaire - FiSAFi Groupe

---

**Questions?** Consultez la [documentation complète](./docs/) ou créez une issue.