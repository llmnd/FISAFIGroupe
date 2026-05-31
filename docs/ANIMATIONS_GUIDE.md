# Guide des Animations FiSAFi Groupe

## 📋 Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Classes CSS d'animation](#classes-css-danimation)
3. [Hooks React](#hooks-react)
4. [Curseur personnalisé](#curseur-personnalisé)
5. [Exemples d'utilisation](#exemples-dutilisation)
6. [Performances](#performances)

---

## Vue d'ensemble

Le système d'animations est basé sur trois piliers :

1. **CSS Animations** - Classes CSS réutilisables pour les animations
2. **React Hooks** - Hooks personnalisés pour gérer les IntersectionObservers
3. **Custom Cursor** - Composant de curseur personnalisé

Toutes les animations respectent :
- ✅ Respect des préférences de mouvement réduit (`prefers-reduced-motion`)
- ✅ Performances optimales (utilisation de `will-change` et `transform`)
- ✅ Mode sombre intégré
- ✅ Accessibilité garantie

---

## Classes CSS d'animation

### 1. Scroll Reveal Animations

#### `fade-in-up`
Apparition progressive vers le haut
```html
<div class="fade-in-up">
  Contenu
</div>
```

#### `fade-in-scale`
Apparition progressive avec zoom subtil
```html
<div class="fade-in-scale">
  Contenu
</div>
```

#### `fade-in-left` / `fade-in-right`
Apparition desde la gauche ou la droite
```html
<div class="fade-in-left">Depuis la gauche</div>
<div class="fade-in-right">Depuis la droite</div>
```

### 2. Délais d'Animation (Stagger)

```html
<div class="fade-in-up visible stagger-1">Premier</div>
<div class="fade-in-up visible stagger-2">Deuxième</div>
<div class="fade-in-up visible stagger-3">Troisième</div>
```

- `stagger-1` à `stagger-5` : délais progressifs de 0.05s

---

## Hooks React

### `useScrollAnimation`

Déclenche une animation au scroll lorsque l'élément devient visible.

```typescript
import { useScrollAnimation } from '@/hooks/useAnimations';

export default function MyComponent() {
  const ref = useScrollAnimation('fade-in-up', 0.1);
  
  return <div ref={ref}>Contenu animé</div>;
}
```

**Paramètres :**
- `animationClass` (string) - Classe CSS d'animation
- `threshold` (number) - Seuil de visibilité (0-1, défaut: 0.1)
- `options` (object) - Options IntersectionObserver

---

### `useStaggerAnimation`

Anime plusieurs enfants avec délais progressifs.

```typescript
import { useStaggerAnimation } from '@/hooks/useAnimations';

export default function CardGrid() {
  const containerRef = useStaggerAnimation('fade-in-up', 4);
  
  return (
    <div ref={containerRef}>
      <div>Card 1</div>
      <div>Card 2</div>
      <div>Card 3</div>
      <div>Card 4</div>
    </div>
  );
}
```

---

### `useParallax`

Crée un effet parallaxe léger au scroll.

```typescript
import { useParallax } from '@/hooks/useAnimations';

export default function ParallaxImage() {
  const ref = useParallax(0.3); // 0.3 = force de parallaxe
  
  return <img ref={ref} src="image.jpg" className="parallax-element" />;
}
```

**Strengths recommandés :**
- `0.2` - Très léger (subtle)
- `0.3` - Léger (défaut)
- `0.5` - Modéré

---

### `useCountAnimation`

Anime le comptage pour les statistiques.

```typescript
import { useCountAnimation } from '@/hooks/useAnimations';

export default function StatCard() {
  const ref = useCountAnimation(1000, 2000); // nombre final, durée en ms
  
  return <div ref={ref}>0</div>;
}
```

---

## Curseur Personnalisé

### Ajouter le composant

```typescript
import CustomCursor from '@/components/CustomCursor';

export default function Page() {
  return (
    <>
      <CustomCursor />
      {/* Contenu */}
    </>
  );
}
```

### Comportement

- Affiche un cursor dot et un outline
- Change de couleur au survol des éléments clicables
- L'outline s'élargit au survol des liens/boutons
- Respecte les mouvements souris en temps réel

### Ciquer les éléments automatiquement détectés

L'outline se transforme au survol des éléments :
- `<a>` (liens)
- `<button>` (boutons)
- `[role="button"]` (éléments avec rôle button)
- `.clickable` (classe personnalisée)

---

## Exemples d'utilisation

### Exemple 1 : Carte de service avec animations hover

```typescript
import { useScrollAnimation } from '@/hooks/useAnimations';

export default function ServiceCard() {
  const ref = useScrollAnimation('fade-in-up');
  
  return (
    <div ref={ref} className="service-card-new hover-scale">
      <div className="service-image-wrapper">
        <img src="service.jpg" alt="Service" />
      </div>
      <div className="service-content">
        <h3>Notre Service</h3>
        <p>Description du service</p>
        <a href="#" className="split-card-arrow underline-hover">
          En savoir plus
        </a>
      </div>
    </div>
  );
}
```

### Exemple 2 : Grille de produits avec stagger

```typescript
export default function ProductGrid() {
  const containerRef = useStaggerAnimation('fade-in-scale', 6);
  
  return (
    <div ref={containerRef} className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <div key={product.id} className="product-card hover-scale">
          {/* Contenu */}
        </div>
      ))}
    </div>
  );
}
```

### Exemple 3 : Section avec parallaxe

```typescript
export default function HeroSection() {
  const bgRef = useParallax(0.2);
  
  return (
    <section className="hero">
      <img ref={bgRef} src="bg.jpg" className="hero-bg parallax-element" />
      <div className="hero-content">
        <h1>Titre</h1>
      </div>
    </section>
  );
}
```

### Exemple 4 : Statistiques avec comptage

```typescript
import { useCountAnimation } from '@/hooks/useAnimations';

export default function StatsSection() {
  const stat1 = useCountAnimation(1000);
  const stat2 = useCountAnimation(5000);
  
  return (
    <div className="stats-grid">
      <div className="stat-item">
        <div ref={stat1} className="stat-value">0</div>
        <p>Projets</p>
      </div>
      <div className="stat-item">
        <div ref={stat2} className="stat-value">0</div>
        <p>Clients</p>
      </div>
    </div>
  );
}
```

---

## Classes CSS utiles

### Transitions Hover

```html
<!-- Bouton avec hover scale -->
<button class="btn-primary">Action</button>

<!-- Carte avec hover scale -->
<div class="hover-scale">Carte</div>

<!-- Lien avec underline hover -->
<a class="underline-hover">Lien</a>
```

### Animations flottantes

```html
<div class="float">Élément flottant</div>
<div class="float float-delay-1">Avec délai</div>
```

### Animations de chargement

```html
<!-- Loading spinner -->
<div class="spinner"></div>

<!-- Loading dots -->
<div class="dots-loader">
  <span></span>
  <span></span>
  <span></span>
</div>

<!-- Skeleton loader -->
<div class="skeleton-loader" style="height: 100px;"></div>
```

---

## Performances

### Bonnes pratiques

1. **Utiliser `will-change` intelligemment**
   ```css
   .fade-in-up {
     animation: fadeInUp 0.7s ease forwards;
     will-change: transform, opacity;
   }
   ```

2. **Limiter les animations simultaneously**
   - Max 3-4 animations majeures visibles simultanément
   - Utiliser les délais pour les étaler

3. **Préférer `transform` et `opacity`**
   ```css
   /* ✅ Bon - utilise transform */
   transform: translateY(0);
   
   /* ❌ Mauvais - utilise top (réflow) */
   top: 0;
   ```

4. **Respecter les préférences utilisateur**
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
     }
   }
   ```

### Optimisations implémentées

✅ Animations utilisant `transform` et `opacity` uniquement
✅ `will-change` sur les éléments animés clés
✅ `passive: true` sur les event listeners scroll
✅ Déconnexion de l'IntersectionObserver après animation
✅ GPU acceleration activée automatiquement

---

## Ressources

- [MDN - CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)
- [MDN - Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Web.dev - Web Performance](https://web.dev/performance/)
- [Guide CSS - Prefers Reduced Motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

---

## Support

Pour des questions sur les animations :
1. Vérifier les classes CSS disponibles dans `styles/modules/animations.css`
2. Consulter les hooks dans `hooks/useAnimations.ts`
3. Examiner les exemples dans les pages (index.tsx, services.tsx, etc.)
