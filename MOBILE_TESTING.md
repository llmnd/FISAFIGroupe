# 🧪 Mobile Testing Checklist

Avant de déployer sur Vercel, testez sur ces résolutions de mobile courants.

## 📱 Résolutions à tester

### Téléphones mobiles courants
```
iPhone SE (2020)        → 375 x 667
iPhone 12/13/14         → 390 x 844
iPhone 15 Pro Max       → 430 x 932
Samsung Galaxy A10      → 360 x 800
Samsung Galaxy S21      → 360 x 800
Google Pixel 6          → 412 x 915
OnePlus 9               → 412 x 914
Xiaomi Redmi Note 10    → 393 x 851
```

### Tablettes
```
iPad Mini               → 768 x 1024
iPad Air                → 820 x 1180
iPad Pro 11"            → 834 x 1194
iPad Pro 12.9"          → 1024 x 1366
Samsung Galaxy Tab S7   → 800 x 1280
```

### Desktop
```
Laptop (MacBook)       → 1440 x 900
Desktop standard       → 1920 x 1080
Écran ultra-wide       → 2560 x 1440
```

## 🔍 Checklist de test complet

### 1. Header & Navigation
- [ ] Logo visible et lisible
- [ ] Menu hamburger visible sur mobile
- [ ] Hamburger menu slide smoothly
- [ ] Menu items properly spaced (43px+ gap)
- [ ] Lien cliquable ferme le menu
- [ ] Sur desktop : menu horizontal visible (pas hamburger)
- [ ] Navigation reste fixe au scroll

### 2. Hero Section
- [ ] Titre lisible sans zoom
- [ ] Sous-titre breakdown correctement
- [ ] Description lisible (taille, contrast)
- [ ] 2 boutons stacked verticalement sur mobile (full width)
- [ ] Boutons côte à côte sur desktop
- [ ] Boutons min 48px de hauteur

### 3. Services Section
- [ ] Titre "Nos services" centré & lisible
- [ ] 1 service par ligne sur mobile
- [ ] 2 services par ligne sur tablette
- [ ] 4 services (2x2 grid) sur desktop
- [ ] Border-left visible et bien aligné
- [ ] Checkmarks visibles et aligned correctly
- [ ] Espacement cohérent

### 4. News Section
- [ ] 1 news card par ligne sur mobile
- [ ] 2 cards par ligne sur tablette+
- [ ] Cards full-width on mobile with padding
- [ ] Hover effect (border to dark, shadow)
- [ ] Text readable - pas coupé
- [ ] Emoji (✅) visible

### 5. Training Section
- [ ] Titre lisible
- [ ] Description aérée
- [ ] Button min 48px (cliquable, accessible)
- [ ] Sur mobile : texte d'abord, puis cards en-dessous
- [ ] Sur desktop : côte à côte avec bon ratio
- [ ] 4 feature cards responsive
- [ ] Cards stacked vertically sur mobile

### 6. Contact Section
- [ ] Ordre inversé sur mobile (form top)
- [ ] Infos de contact lisibles (phone, email, address)
- [ ] Form full-width sur mobile
- [ ] Inputs avec border-bottom propre
- [ ] Pas de focus outline pourri (custom border color)
- [ ] Textarea suffisante hauteur (rows=6)
- [ ] Button full-width sur mobile
- [ ] Phone/email cliquable (href tel: & mailto:)
- [ ] Select dropdown fonctionnel
- [ ] Message de succès affiche bien

### 7. Footer
- [ ] Colonne unique sur mobile
- [ ] 2-4 colonnes sur desktop
- [ ] Liens avec hover state
- [ ] Texte petit mais lisible
- [ ] Padding propre
- [ ] Copyright lisible

### 8. Performance Mobile
- [ ] Site load < 3 secondes
- [ ] No layout shift pendant le load
- [ ] Pas de scroll horizontal
- [ ] Smooth scrolling au clic links
- [ ] Pas d'erreurs console (F12)
- [ ] Pas de 404 sur fichiers

### 9. Touch & Interactions
- [ ] Tous les elements cliquables ≥ 44x44px
- [ ] Touch targets spaced correctement
- [ ] Pas d'accidentelles clics double-tap
- [ ] Active state feedback (couleur change)
- [ ] Input focus visible
- [ ] Keyboard navigation works (Tab key)

### 10. Typography
- [ ] Headings: pas d'overflow, breaking nice
- [ ] Paragraphes: line-height comfortable
- [ ] Pas de text trop petit (< 12px)
- [ ] Contrast bon (dark text on light, vice versa)
- [ ] Font weight consistent

### 11. Images (si vous en ajoutez)
- [ ] Load fast même sur 3G
- [ ] Responsive (different sizes)
- [ ] Alt text present
- [ ] Aspect ratio maintenu
- [ ] Pas de 'layout shift' quand l'image charge

### 12. Accessibility (A11y)
- [ ] Navigation au clavier (Tab, Enter)
- [ ] Contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] Form labels présentes
- [ ] Aria-labels sur hamburger menu
- [ ] Focus visible sur éléments interactifs

## 🛠️ Comment tester avec VS Code

### 1. Ouvrir DevTools
```
F12 ou Right-click → Inspect
```

### 2. Toggle device toolbar
```
Ctrl+Shift+M (Windows/Linux)
Cmd+Shift+M (Mac)
ou cliquer icône détecteur 📱
```

### 3. Tester différent viewport
- Dropdown en haut (e.g., "iPhone SE")
- Ou custom width/height en entrant dimensions

### 4. Tester orientation
- Portrait vs Landscape

### 5. Throttling réseau
- DevTools → Network tab
- "Throttling" dropdown → "Slow 3G"
- Vérifier site reste usable

## 🚨 Problèmes courants & solutions

| Problème | Cause | Solution |
|----------|-------|----------|
| Texte trop petit | font-size trop petit sur mobile | Vérifier `text-xs small:text-sm md:text-base` |
| Boutons pas cliquables | < 48px hauteur | Ajouter `min-h-12` ou `py-3 sm:py-4` |
| Scroll horizontal | Padding excessif ou élément trop large | Vérifier `max-w-7xl` et padding avec `px-4` |
| Menu hamburger cassé | z-index issue | Vérifier `z-50` sur header |
| Input zoom iOS | text size < 16px | Ajouter `text-base` ou `text-lg` aux inputs |
| Layout shift | Images sans dimensions | Ajouter width/height ou aspect-ratio |

## ✅ Approuver pour déploiement

Une fois tous les tests passés:
1. [ ] Tester sur iPhone réel (si possible)
2. [ ] Tester sur Android réel (si possible)
3. [ ] Vérifier Performance tab (Chrome Lighthouse)
4. [ ] Vérifier Accessibility score
5. [ ] Vérifier Best Practices
6. [ ] Vérifier SEO score

---

**Prêt ? Déployez sur Vercel ! 🚀**
