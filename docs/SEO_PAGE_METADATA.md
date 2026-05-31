# Page-by-Page SEO Metadata — FISAFI GROUPE

## Structure recomandée pour métadonnées par page

Pour Next.js 14 avec App Router, chaque page doit avoir sa propre metadata. Voici un modèle.

---

## / — PAGE D'ACCUEIL

**Mot-clé principal** : `cabinet conseil IT Dakar`

```typescript
// app/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FiSAFi Groupe — Cabinet IT & Réseaux | Dakar, Sénégal',
  description: 'Cabinet de conseil en technologie, réseaux et ingénierie IT. 10+ années d\'expertise. Services : cybersécurité, cloud, infrastructures. Dakar, Sénégal.',
  openGraph: {
    title: 'FiSAFi Groupe — Expert IT & Réseaux',
    description: 'Cabinet de conseil IT spécialisé en réseaux, cybersécurité et solutions cloud à Dakar',
    url: 'https://fisafigroupe.com',
  },
};

export default function Home() {
  // ... rest of component
}
```

---

## /services — SERVICES

**Mot-clé principal** : `services informatiques Sénégal`

```typescript
// app/services/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services IT & Réseaux | Cybersécurité, Cloud, Infrastructure | FiSAFi',
  description: 'Services complets IT : réseaux, cybersécurité, cloud computing, infrastructure IT et formations. Solutions adaptées à votre contexte au Sénégal.',
  keywords: ['services IT', 'réseaux', 'cybersécurité', 'cloud', 'infrastructure IT', 'Dakar'],
  openGraph: {
    title: 'Services Informatiques Complets | FiSAFi Groupe',
    description: 'Réseaux • Cybersécurité • Cloud • Infrastructure IT • Support technique 24/7',
    url: 'https://fisafigroupe.com/services',
    type: 'website',
  },
};

export default function Services() {
  // ... rest of component
}
```

---

## /contact — CONTACT

**Mot-clé principal** : `contact consultant IT Dakar`

```typescript
// app/contact/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact FiSAFi Groupe | Consultant IT Dakar | Réponse 24h',
  description: 'Contactez FiSAFi pour une consultation gratuite. Tél : +221 78 781 22 97 — Dakar, Sénégal. Réponse garantie sous 24h.',
  keywords: ['contact IT', 'consultant Dakar', 'support technique', 'devis IT'],
  openGraph: {
    title: 'Nous Contacter | FiSAFi Groupe',
    description: 'Prenez contact pour une audit IT gratuit. +221 78 781 22 97',
    url: 'https://fisafigroupe.com/contact',
  },
};

export default function Contact() {
  // ... rest of component
}
```

---

## /news — ACTUALITÉS

**Mot-clé principal** : `actualités IT Sénégal`

```typescript
// app/news/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Actualités IT, Télécoms & Tech | FiSAFi Groupe | Dakar',
  description: 'Suivez les dernières actualités technologiques, tendances IT et conseils pratiques pour votre infrastructure. Actualisé régulièrement.',
  keywords: ['actualités', 'IT', 'télécoms', 'tech', 'tendances'],
  openGraph: {
    title: 'Actualités & Tendances Tech | FiSAFi Groupe',
    description: 'Dernières actualités informatiques et télécommunications',
    url: 'https://fisafigroupe.com/news',
  },
};

export default function News() {
  // ... rest of component
}
```

---

## /training — FORMATIONS

**Mot-clé principal** : `formation IT Sénégal`

```typescript
// app/training/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Formations IT Certifiantes | Réseaux, Sécurité, Cloud | Dakar',
  description: 'Formations professionnelles certifiantes : réseaux, cybersécurité, cloud computing, administration système. À Dakar, Sénégal.',
  keywords: ['formation IT', 'cours réseaux', 'certification', 'Dakar'],
  openGraph: {
    title: 'Formations IT Professionnelles | FiSAFi Groupe',
    description: 'Réseaux • Cybersécurité • Cloud • Administration système',
    url: 'https://fisafigroupe.com/training',
  },
};

export default function Training() {
  // ... rest of component
}
```

---

## /articles — ARTICLES

**Mot-clé principal** : `articles blog IT Sénégal`

```typescript
// app/articles/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Articles Blog | Conseils IT, Réseaux & Sécurité | FiSAFi',
  description: 'Blog technique : conseils IT, best practices réseaux, cybersécurité, cloud. Articles rédigés par nos experts.',
  keywords: ['blog IT', 'conseils', 'tutoriels', 'sécurité'],
  openGraph: {
    title: 'Blog Technique | FiSAFi Groupe',
    description: 'Articles sur IT, réseaux, cybersécurité et tendances tech',
    url: 'https://fisafigroupe.com/articles',
  },
};

export default function Articles() {
  // ... rest of component
}
```

---

## /articles/[slug] — ARTICLE INDIVIDUEL (BLOG POST)

**Mot-clé variable** : Dépend de l'article

### Exemple : Article sur cybersécurité

```typescript
// app/articles/[slug]/page.tsx
import { Metadata } from 'next';

interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  content: string;
  image: string;
  author: string;
  date: string;
  keywords: string[];
}

const articles: Record<string, BlogArticle> = {
  'pourquoi-securiser-reseau': {
    slug: 'pourquoi-securiser-reseau',
    title: 'Pourquoi Sécuriser Votre Réseau informatique en 2024 ?',
    description: 'Guide complet : cybersécurité infrastructure réseau, audit gratuit Dakar',
    keywords: ['cybersécurité', 'infrastructure réseau', 'sécurité IT', 'audit'],
    image: '/blog-security.jpeg',
    author: 'FiSAFi Groupe',
    date: '2026-04-08',
    content: '...'
  },
};

export async function generateMetadata({ params }): Promise<Metadata> {
  const article = articles[params.slug];
  
  return {
    title: `${article.title} | FiSAFi Blog`,
    description: article.description,
    keywords: article.keywords,
    openGraph: {
      title: article.title,
      description: article.description,
      url: `https://fisafigroupe.com/articles/${article.slug}`,
      type: 'article',
      publishedTime: article.date,
      authors: ['FiSAFi Groupe'],
      tags: article.keywords,
      images: [{
        url: article.image,
        width: 1200,
        height: 630,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      images: [article.image],
    },
  };
}

export default function Article({ params }) {
  const article = articles[params.slug];
  
  // JSON-LD BlogPosting Schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    image: article.image,
    datePublished: article.date,
    author: {
      '@type': 'Organization',
      name: 'FiSAFi Groupe',
      url: 'https://fisafigroupe.com'
    },
    publisher: {
      '@type': 'Organization',
      name: 'FiSAFi Groupe',
      logo: {
        '@type': 'ImageObject',
        url: 'https://fisafigroupe.com/logo.jpeg'
      }
    }
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
      </Head>
      
      <article>
        <h1>{article.title}</h1>
        <img src={article.image} alt={article.title} />
        <div>{article.content}</div>
      </article>
    </>
  );
}
```

---

## /privacy — POLITIQUE DE CONFIDENTIALITÉ

**Mot-clé** : `politique confidentialité`

```typescript
// app/privacy/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité | FiSAFi Groupe',
  description: 'Politique de confidentialité et protection des données de FiSAFi Groupe.',
  robots: 'index, follow',
  openGraph: {
    title: 'Politique de Confidentialité',
    url: 'https://fisafigroupe.com/privacy',
  },
};
```

---

## /terms — CONDITIONS D'UTILISATION

**Mot-clé** : `conditions utilisation`

```typescript
// app/terms/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions d\'Utilisation | FiSAFi Groupe',
  description: 'Conditions générales d\'utilisation du site FiSAFi Groupe.',
  robots: 'index, follow',
  openGraph: {
    title: 'Conditions d\'Utilisation',
    url: 'https://fisafigroupe.com/terms',
  },
};
```

---

## Schema JSON-LD globaux à ajouter dans `layout.tsx`

```typescript
// Déjà présent dans app/layout.tsx :
// • Organization schema
// • WebSite schema

// À ajouter pour pages dynamiques :
// • BlogPosting schema (pour articles)
// • LocalBusiness schema (pour Google Maps)
// · BreadcrumbList schema (pour navigation)
```

---

## Mots-clés préconisés par page

| Page | Mot-clé Principal | Secondaires |
|------|------------------|------------|
| `/` | `cabinet IT Dakar` | réseaux, consulting, informatique |
| `/services` | `services informatiques Sénégal` | cybersécurité, cloud, IT |
| `/contact` | `contact IT Dakar` | consultant, devis, support |
| `/news` | `actualités IT Sénégal` | tendances, télécoms |
| `/training` | `formations IT Sénégal` | certification, cours |
| `/articles` | `articles blog IT` | conseils, tutoriels |
| `/privacy` | `politique confidentialité` | RGPD, données |
| `/terms` | `conditions utilisation` | légal |

---

**Note** : Chaque titre et description doit inclure le mot-clé principal + être unique par rapport aux autres pages.
Utiliser des variantes pour éviter la duplication (ex : "Cabinet IT Dakar" vs "Consultant IT à Dakar").
