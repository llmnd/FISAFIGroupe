# 🖼️ Guide Images Responsive

Comment ajouter des images optimisées pour le mobile-first.

## 📦 Créer un dossier images

```bash
mkdir public/images
# Placez vos PNG/JPG ici
```

## 🎯 Optimisation Images Mobile-First

### 1. **Tailles recommandées**

```typescript
// Hero image (si vous en ajoutez une)
- Mobile: 375px width
- Tablet: 768px width
- Desktop: 1440px width
→ Utiliser Next.js Image component

// Service icons/images
- Mobile: 300px max
- Desktop: 400px

// Background images
- Mobile: 600px width max
- Desktop: Full viewport width
```

### 2. **Formats optimaux**

| Format | Cas d'usage | Compression |
|--------|------------|------------|
| **WebP** | Photos, gradients (support modern) | -30% vs JPEG |
| **JPEG** | Photos avec fallback | Standard 80-85% quality |
| **PNG** | Logos, transparence | Sans perte |
| **SVG** | Icons, logos vectoriels | Meilleur pour les scalables |

### 3. **Exemple : Ajouter un hero image**

#### Étape 1 : Placer l'image
```
public/images/hero-bg.jpg  (1440x600px)
```

#### Étape 2 : Importer dans Hero.tsx

```typescript
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="pt-24 sm:pt-32 md:pt-40 pb-16 sm:pb-20 md:pb-32 px-4 sm:px-6 bg-neutral-50 relative overflow-hidden">
      {/* Image de fond */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/hero-bg.jpg"
          alt="Background"
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* Contenu + overlay semi-transparent */}
      <div className="absolute inset-0 bg-white/80 -z-10"></div>

      {/* Reste du contenu */}
      <div className="max-w-7xl mx-auto">
        {/* ... */}
      </div>
    </section>
  );
}
```

### 4. **Responsive Image Pattern**

Pour une image qui doit avoir différentes dimensions sur mobile vs desktop:

```typescript
import Image from 'next/image';

export default function TestimonialsSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="relative">
        {/* Mobile: 375px, Tablet: 400px, Desktop: 600px */}
        <Image
          src="/images/team.jpg"
          alt="Notre équipe"
          width={600}
          height={400}
          className="w-full h-auto rounded-lg"
          sizes="(max-width: 640px) 375px,
                 (max-width: 1024px) 400px,
                 600px"
        />
      </div>
      <div>
        {/* Texte */}
      </div>
    </div>
  );
}
```

### 5. **CSS background image mobile-first**

Si vous voulez un fond sans NEXT Image:

```css
/* Mobile first */
.hero {
  background-image: url('/images/hero-mobile.jpg');
  background-size: cover;
  background-position: center;
}

/* Tablet/Desktop */
@media (min-width: 768px) {
  .hero {
    background-image: url('/images/hero-desktop.jpg');
  }
}
```

### 6. **Optimisation de la performance**

#### Lazy loading
```typescript
// Automatique avec Next.js Image pour images below fold
// Ajouter explicit si besoin :
<Image
  src="/images/section-item.jpg"
  alt="..."
  loading="lazy"
/>
```

#### Compression suggestions

**Avant d'uploader:**
```bash
# macOS/Linux - installer ImageMagick
brew install imagemagick

# Compresser JPEG (80% quality, bon compromis)
convert original.jpg -quality 80 optimized.jpg

# Redimensionner pour mobile
convert original.jpg -resize 375x375 -quality 80 mobile.jpg
convert original.jpg -resize 1440x960 -quality 85 desktop.jpg

# Convertir en WebP
convert original.jpg -quality 80 optimized.webp
```

**Ou utiliser TinyPNG/Squoosh:**
- https://tinypng.com (PNG/JPEG)
- https://squoosh.app (WebP conversion)

### 7. **Exemple complet : Service cards avec images**

```typescript
// components/ServiceCard.tsx
import Image from 'next/image';

interface ServiceCardProps {
  title: string;
  image: string;
  description: string;
}

export default function ServiceCard({ title, image, description }: ServiceCardProps) {
  return (
    <div className="border border-neutral-200 hover:border-neutral-900 transition overflow-hidden">
      {/* Image container - responsive */}
      <div className="relative h-48 sm:h-56 md:h-64 w-full bg-neutral-100">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw,
                 (max-width: 1024px) 50vw,
                 33vw"
        />
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6">
        <h3 className="text-lg sm:text-xl font-light mb-3">{title}</h3>
        <p className="text-sm sm:text-base text-neutral-600 font-light">{description}</p>
      </div>
    </div>
  );
}
```

### 8. **Tips de qualité mobile**

#### ✅ À faire
- Images max 2MB compressées
- Utiliser Next.js Image pour auto-optimization
- WebP avec fallback JPEG
- Alt text descriptif (SEO + accessibility)
- Lazy loading pour images below fold
- Aspect ratio consistent (no layout shift)

#### ❌ À éviter
- Images > 3MB (ralentit le site, 3G struggles)
- Résolution desktop sur mobile
- Images PNG sans compression
- Zéro alt text (bad SEO + accessibility)
- Différent aspect ratio par viewport (shift.layout)

### 9. **Bannières / Hero entière**

```typescript
// Full-width hero image mobile-friendly
export default function HeroWithImage() {
  return (
    <section className="relative pt-24 md:pt-32 h-screen max-h-screen overflow-hidden">
      {/* Image */}
      <Image
        src="/images/hero.jpg"
        alt="Hero background"
        fill
        priority
        className="object-cover object-center"
        quality={85}
        sizes="100vw"
      />

      {/* Overlay semi-transparent */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Content centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col text-center text-white px-4 sm:px-6">
          <h1 className="text-3xl sm:text-5xl font-light mb-4">
            Titre accrocheur
          </h1>
          <p className="text-base sm:text-lg font-light max-w-xl mx-auto">
            Description sous titre
          </p>
        </div>
      </div>
    </section>
  );
}
```

## 📊 Checklist images

- [ ] Images redimensionnées pour mobile first
- [ ] Max 2MB compressées
- [ ] WebP + JPEG fallback
- [ ] Alt text présent
- [ ] Lazy loading si below fold
- [ ] Aspect ratio constant
- [ ] Pas de image load shift
- [ ] Tester sur Lighthouse

---

**Besoin d'aide ?** Consultez [MOBILE_OPTIMIZATIONS.md](MOBILE_OPTIMIZATIONS.md)
