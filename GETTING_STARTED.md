# Guide de démarrage - FISAFI Vitrine

## � Site Mobile-First ✅

Ce site est **entièrement optimisé pour mobile en priorité** :
- Design pensé d'abord pour petit écran
- Textes responsives et lisibles
- Boutons de 48px min (recommandation Apple/Google)
- Navigation mobile fluide
- Formulaire optimisé tactile
- Zéro scroll horizontal

[Voir guide complet → MOBILE_OPTIMIZATIONS.md](MOBILE_OPTIMIZATIONS.md)

## �🚀 Démarrage rapide

### 1. Ouvrir le dossier dans VS Code
- Ouvrir VS Code
- File → Open Folder
- Sélectionner `c:\Users\bmd-tech\Desktop\FiSAFi Groupe`

### 2. Terminal : Installer les dépendances
```bash
npm install
```

### 3. Terminal : Lancer le serveur de développement
```bash
npm run dev
```

### 4. Acceder au site
Ouvrir `http://localhost:3000` dans votre navigateur

## 📝 Fichiers à modifier en priorité

1. **[components/Contact.tsx](components/Contact.tsx)** 
   - Ajouter votre numéro de téléphone
   - Ajouter votre email
   - Ajouter votre adresse

2. **[components/Footer.tsx](components/Footer.tsx)**
   - Remplacer les liens des réseaux sociaux
   - Mettre à jour l'année de création de l'entreprise

3. **[pages/index.tsx](pages/index.tsx)**
   - Titre personnalisé
   - Description meta

## 🎨 Personnalisation du design

### Couleurs
Éditer [tailwind.config.js](tailwind.config.js) dans la section `theme.extend.colors`

### Fonts
Changer la police dans [styles/globals.css](styles/globals.css)

## 📸 Ajouter des images

1. Créer un dossier `public/images`
2. Ajouter vos images PNG/JPG
3. Importer dans les composants :
```typescript
import Image from 'next/image';

<Image src="/images/monimage.jpg" alt="description" width={400} height={300} />
```

## 🔗 Ajouter des pages supplémentaires

1. Créer un nouveau fichier dans `pages/about.tsx`
2. Exporter le composant par défaut
3. Accessible automatiquement via `/about`

Exemple :
```typescript
// pages/about.tsx
export default function About() {
  return <div>À propos de FISAFI</div>;
}
```

## 🚀 Déployement sur Vercel

### Option 1 : Depuis VS Code (terminal)
```bash
npm install -g vercel
vercel
```

### Option 2 : Depuis Vercel.com
1. Aller sur https://vercel.com
2. Cliquer "New Project"
3. Importer ce repository GitHub
4. Configuration automatique
5. Déployer

## ⚡ Astuces performance

- Les images heavy ralentissent le site → Optimiser avant d'ajouter
- Tailwind compile le CSS automatiquement
- Next.js optimise les bundles JavaScript
- Le site devrait charger en < 1 seconde

## ✅ Checklist avant déploiement

- [ ] Coordonnées de contact à jour
- [ ] Liens réseaux sociaux correctes
- [ ] Logo/images optimisées
- [ ] Titre et meta description pertinents
- [ ] Formulaire de contact fonctionnel
- [ ] Pas d'erreurs console (F12)
- [ ] Test responsive complet (voir [MOBILE_TESTING.md](MOBILE_TESTING.md))
  - [ ] Mobile (375px et 425px)
  - [ ] Tablette (768px)
  - [ ] Desktop (1440px+)
- [ ] Navigation menu fonctionne sur mobile
- [ ] Tous les boutons cliquables (48px min)
- [ ] Pas de scroll horizontal nulle part

---

Ha des questions? Consulter le [README.md](README.md) pour plus de détails.
