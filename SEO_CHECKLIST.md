# CHECKLIST SEO FISAFI GROUPE — À Faire Avant Déploiement

## 📋 Phase 1 : Configuration (Semaine 1)

### ✅ Fichiers créés
- [x] `app/layout.tsx` — Metadata + JSON-LD schemas
- [x] `app/sitemap.ts` — Sitemap automatique
- [x] `public/robots.txt` — Robots.txt configuré
- [x] `SEO_STRATEGY.md` — Stratégie long-terme

### ⏳ À faire avant déploiement Vercel

#### 1. Vérification techniques
```bash
# Vérifier que le sitemap génère le XML
curl https://fisafigroupe.com/sitemap.xml (après déploiement)

# Vérifier que robots.txt est accessible
curl https://fisafigroupe.com/robots.txt

# Vérifier métadonnées (source de page)
# Doit contenir : <title>, <meta name="description">, Organization schema JSON-LD
```

#### 2. Images & Assets
- [ ] Optimiser toutes les images en WebP (+ JPEG fallback)
- [ ] Compresser images > 50KB avec ImageOptim ou TinyPNG
- [ ] Ajouter `alt` text descriptif à chaque image
- [ ] Placer logo optimisé : `/public/logo.jpeg` (1200x630px recommandé)

#### 3. Codes de vérification Search Engines
- [ ] Récupérer Google Verification Code → Ajouter dans `layout.tsx` :
  ```
  content="YOUR_GOOGLE_VERIFICATION_CODE_HERE"
  ```
- [ ] Récupérer Bing Verification Code → Ajouter dans `layout.tsx` :
  ```
  content="YOUR_BING_VERIFICATION_CODE_HERE"
  ```

#### 4. Redirects & Alias (si migration depuis ancien site)
**Si ancien domaine existe :**
- [ ] Créer redirects 301 (vercel.json) :
  ```json
  {
    "redirects": [
      { "source": "/old-page", "destination": "/new-page", "permanent": true }
    ]
  }
  ```

---

## 🔍 Phase 2 : Google Search Console (Jour 1 après déploiement)

### Actions dans GSC

1. **Vérifier la propriété du domaine**
   - [ ] Ajouter domaine : https://fisafigroupe.com
   - [ ] Télécharger fichier de vérification HTML OU ajouter record DNS TXT
   - [ ] Valider

2. **Soumettre sitemap**
   - [ ] Aller à **Sitemaps** → **Ajouter un sitemap**
   - [ ] URL : `https://fisafigroupe.com/sitemap.xml`
   - [ ] Attendre ~24h pour le crawl initial

3. **Vérifier couverture**
   - [ ] Aller à **Couverture** → Vérifier qu'il y a 0 erreurs
   - [ ] Attendre que toutes les pages soient indexées :
     - ✅ `/` (page d'accueil)
     - ✅ `/services`
     - ✅ `/contact`
     - ✅ `/news`
     - ✅ `/training`
     - ✅ Other pages

4. **Amélioration**
   - [ ] Aller à **Améliorations** → Vérifier qu'il y a pas d'erreurs mobiles
   - [ ] Corriger les erreurs critiques

---

## 📊 Phase 3 : Analytics & Monitoring (Jour 1)

### Configurer Google Analytics 4
- [ ] Créer propriété GA4 pour https://fisafigroupe.com
- [ ] Ajouter script dans `app/layout.tsx` ou `_app.tsx` :
  ```tsx
  {/* Google Analytics 4 */}
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script dangerouslySetInnerHTML={{__html: `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  `}} />
  ```

### Ajouter Google Business Profile (Local SEO)
- [ ] Aller à https://business.google.com
- [ ] Créer fiche : FiSAFi Groupe
- [ ] Ajouter catégories : 
  - Service Informatique
  - Bureau de Conseil en Gestion
- [ ] Ajouter adresse : « Liberté 6 Extension, Dakar, Sénégal »
- [ ] Ajouter phone : +221 78 896 59 39
- [ ] Ajouter website : https://fisafigroupe.com
- [ ] Ajouter horaires d'ouverture
- [ ] Publier photos & logo

---

## 📝 Phase 4 : Contenu & Blog (Semaine 2-4)

### Articles prioritaires

Créer un `/pages/blog/[slug].tsx` ou `/app/blog/[slug]/page.tsx` avec structure dynamique.

#### Article 1 : "Pourquoi sécuriser votre infrastructure réseau en 2024 ?"
- **Mots-clés** : infrastructure sécurisée, cybersécurité, audit réseau
- **Longueur** : 1500+ mots
- **Structure** :
  - Introduction + CTA (50 mots)
  - 4-5 sous-sections (300 mots chaque)
  - Conclusion + Formulaire de contact
- **Meta** :
  - Title : "Sécurité Infrastructure Réseau | Audit Gratuit | FiSAFi"
  - Description : "Guide complet : sécuriser votre réseau IT. Audit gratuit. Dakar, Sénégal."

#### Article 2 : "Guide : Choisir un cabinet IT à Dakar"
- **Mots-clés** : cabinet IT, consulting, Dakar
- Similaire structure

#### Article 3-5 : Voir dans SEO_STRATEGY.md

### Schema.org pour articles de blog
Ajouter à chaque article :
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Article Title",
  "image": "URL image",
  "datePublished": "2026-04-08",
  "author": {
    "@type": "Organization",
    "name": "FiSAFi Groupe"
  },
  "description": "Blog post description"
}
```

---

## 🔗 Phase 5 : Backlinks (Ongoing)

### Actions immédiates
- [ ] Inscrire dans 3 annuaires locaux :
  - [ ] Senegal.page
  - [ ] Dakar.sn
  - [ ] Google My Business (fait en Phase 3)

### Actions mensuelles
- [ ] Publier 1 article guest post dans blog tech sénégalais
- [ ] Demander à partenaires/clients de mentionner FISAFI
- [ ] Suivre classement mots-clés avec Ubersuggest (gratuit)

---

## 📈 Performance Technique (Continu)

### Lighthouse Scores (Target > 90)
```bash
# Après déploiement, vérifier :
# https://pagespeed.web.dev/?url=https://fisafigroupe.com

Performance      : > 90
Accessibility    : > 90
Best Practices   : > 90
SEO              : > 90
```

### Optimisations recommandées
- [ ] WebP images (gain : -30% taille)
- [ ] Minifier CSS/JS
- [ ] Lazy load images
- [ ] Cache headers configurés
- [ ] Core Web Vitals < 100ms (LCP)

---

## 🎯 KPIs Mensuels (Tracker dans spreadsheet)

| Métrique | Mois 1 | Mois 3 | Mois 6 |
|----------|--------|--------|--------|
| Visites organiques | TBD | 200+ | 1000+ |
| Pages indexées | 10 | 25 | 40+ |
| Backlinks | 5 | 15 | 30+ |
| Rank (mots-clés) | Position 20-30 | Position 10-15 | Position 5-8 |
| Core Web Vitals | À mesurer | OK | Excellent |

### Tools pour suivre
- Google Search Console (gratuit) → Rankings
- Google Analytics 4 (gratuit) → Traffic
- Ahrefs Free (gratuit) → Backlinks
- Lighthouse (gratuit, dans Chrome)

---

## ✍️ Contenu À-Faire (Ongoing)

```
Semaine 1 : Article 1 (Cybersécurité)
Semaine 2 : Article 2 (Choisir un cabinet IT)
Semaine 3 : Article 3 (Cloud vs On-Premise)
Semaine 4 : Article 4 + Publier 1 guest post

Mois 2-6 : 2 articles/mois + backlinks qualitatifs
```

---

**Note finale** : Les 6 premiers mois sont critiques. Le blog + technical SEO = 80% du succès.
Investir temps dans la qualité du contenu plutôt que dans les campagnes PPC.

👉 **Prochain pas** ?  Déployer sur Vercel, puis ajouter premier article blog.
