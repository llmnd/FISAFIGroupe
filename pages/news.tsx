"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";

interface Article {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  published: boolean;
  createdAt: string;
  image?: string;
  author?: string;
}

export default function News() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('tous');
  const [articleLoadError, setArticleLoadError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isClient, setIsClient] = useState(false);

  // Metadata for Head
  const pageTitle = "Actualités IT, Télécoms & Tech | FiSAFi Groupe | Dakar";
  const pageDescription = "Suivez les dernières actualités technologiques, tendances IT et conseils pratiques pour votre infrastructure. Actualisé régulièrement.";

  // Couleurs et icônes par catégorie
  const categoryStyles: Record<string, { bg: string; icon: string; color: string; image?: string }> = {
    'Articles techniques': { bg: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', icon: '⚙️', color: '#fff', image: '/hero/FiSAFi – infrastructure.gif' },
    'Innovations': { bg: 'linear-gradient(135deg, #9333ea 0%, #d946ef 100%)', icon: '💡', color: '#fff', image: '/hero/FiSAFi – transformation.gif' },
    'Événements': { bg: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)', icon: '📅', color: '#fff', image: '/hero/FiSAFi – services managés.jpg' },
    'Veille sectorielle': { bg: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', icon: '📊', color: '#fff', image: '/hero/Cybersécurité.gif' },
  };

  const getCategoryStyle = (category: string) => {
    return categoryStyles[category] || {
      bg: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
      icon: '📰',
      color: '#fff'
    };
  };

  useEffect(() => {
    // Token check for potential future use
    // const token = localStorage.getItem("token");
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoadingArticles(true);
      setArticleLoadError(false);
      try {
        const category = selectedCategory === 'tous' ? '' : selectedCategory;
        const query = category ? `?category=${category}` : '';
        const res = await fetch(`/api/articles${query}`);
        if (res.ok) {
          const data = await res.json();
          setArticles(data.data?.articles || []);
        } else {
          setArticleLoadError(true);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
        setArticleLoadError(true);
      } finally {
        setLoadingArticles(false);
      }
    };
    fetchArticles();
  }, [selectedCategory, refreshKey]);

  useEffect(() => {
    if (!isClient) return;
    
    // Ajouter la classe visible aux éléments immédiatement si en viewport
    const revealElements = document.querySelectorAll(".reveal");
    revealElements.forEach((el) => {
      el.classList.add("visible");
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    
    revealElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isClient]);

  const categories = [
    'tous',
    'Articles techniques',
    'Innovations',
    'Événements',
    'Veille sectorielle',
  ];

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  // Featured news item
  const featuredNews = {
    name: "Suivez nos actualités",
    desc: "Restez informé de toutes nos innovations, publications et événements",
    img: "/hero/FiSAFi – transformation.gif"
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="actualités, IT, télécoms, tech, tendances, innovation, Dakar" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <link rel="canonical" href="https://fisafigroupe.com/news" />
        <meta property="og:title" content="Actualités & Tendances Tech | FiSAFi Groupe" />
        <meta property="og:description" content="Articles techniques, tendances IT et innovations technologiques" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://fisafigroupe.com/news" />
        <meta property="og:image" content="https://fisafigroupe.com/favicon/web-app-manifest-512x512.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="FiSAFi Groupe" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Actualités Tech | FiSAFi Groupe" />
        <meta name="twitter:description" content="Suivez les tendances IT et actualités technologiques" />
        <meta name="twitter:image" content="https://fisafigroupe.com/favicon/web-app-manifest-512x512.png" />
      </Head>

      <Header />

      {/* HERO */}
      <section className="hero news-hero" data-observe>
        <div className="hero-bg" />
        <div className="hero-lines">
          <div className="hero-line" />
          <div className="hero-line" />
          <div className="hero-line" />
        </div>
        <div className="hero-orbs">
          <div className="hero-orb" />
          <div className="hero-orb" />
        </div>
        <div className="hero-overlay" />

        <div className="hero-content">
          <div className="hero-eyebrow">Restez à jour</div>
          <h1 className="hero-title">
            Actualités &<br />
            <em>publications</em>
          </h1>
          <p className="hero-sub">
            Découvrez nos articles techniques, innovations et actualités du secteur.
          </p>
        </div>
      </section>

      <div className="divider" />

      {/* ACTUALITES FEATURED IMAGE */}
      <section className="section news-featured" id="actualites-featured">
        <div className="news-featured-card reveal">
          <div className="news-featured-media">
              <Image
                src={featuredNews.img}
                alt={featuredNews.name}
                width={960}
                height={640}
                data-observe
                priority
              />
          </div>
          <div className="news-featured-content">
            <span className="news-featured-eyebrow">Le journal FiSAFi</span>
            <h2>{featuredNews.name}</h2>
            <p>{featuredNews.desc}</p>
            <Link href="#news-list" className="news-featured-link">
              Explorer les publications <span aria-hidden="true">→</span>
            </Link>
            <div className="news-featured-tags" aria-label="Rubriques">
              <span>Actualités</span>
              <span>Innovations</span>
              <span>Événements</span>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* NEWS SECTION */}
      <section className="section news-list" id="news-list">
        <div className="section-eyebrow reveal">Nos publications</div>
        <h2 className="section-title reveal reveal-delay-1">
          Actualités<br />& innovations
        </h2>

        {/* Category Filter */}
        <div className="news-filters reveal reveal-delay-2" aria-label="Filtrer les publications">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`news-filter${selectedCategory === cat ? ' is-active' : ''}`}
              aria-pressed={selectedCategory === cat}
            >
              {cat === 'tous' ? 'Tous' : cat}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        {loadingArticles ? (
          <div className="news-card-grid" aria-label="Chargement des publications" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div key={i} className="news-card news-card-skeleton">
                <div className="news-card-image news-skeleton-block" />
                <div className="news-card-body">
                  <div className="news-skeleton-block news-skeleton-meta" />
                  <div className="news-skeleton-block news-skeleton-title" />
                  <div className="news-skeleton-block news-skeleton-text" />
                </div>
              </div>
            ))}
          </div>
        ) : articleLoadError ? (
          <div className="news-empty-state" role="alert">
            <h3>Les actualités ne sont pas disponibles pour le moment.</h3>
            <p>Une erreur est survenue lors du chargement. Veuillez réessayer.</p>
            <button className="news-retry-button" onClick={() => setRefreshKey((key) => key + 1)}>
              Réessayer
            </button>
          </div>
        ) : articles.length > 0 ? (
          <div className="news-card-grid">
            {articles.map((article) => (
              <article key={article.id} className="news-card reveal">
                  <div className="news-card-image">
                    {article.image ? (
                      <Image
                        src={article.image}
                        alt={article.title}
                        width={720}
                        height={480}
                        data-observe
                      />
                    ) : getCategoryStyle(article.category || '').image ? (
                      <Image
                        src={getCategoryStyle(article.category || '').image!}
                        alt={article.category || 'Article'}
                        width={720}
                        height={480}
                        data-observe
                      />
                    ) : (
                      <div
                        className="news-card-placeholder"
                        style={{
                          background: getCategoryStyle(article.category || '').bg,
                          color: getCategoryStyle(article.category || '').color,
                        }}
                      >
                        {getCategoryStyle(article.category || '').icon}
                      </div>
                    )}
                  </div>
                  <div className="news-card-body">
                    <div className="news-card-meta">
                      <span className="news-card-category">{article.category || "Actualité"}</span>
                      <time dateTime={article.createdAt}>{formatDate(article.createdAt)}</time>
                    </div>
                    <h3><Link href={`/news/${article.id}`}>{article.title}</Link></h3>
                    <p>{article.excerpt}</p>
                    <Link href={`/news/${article.id}`} className="news-read-more">
                      Lire l’article <span aria-hidden="true">→</span>
                    </Link>
                  </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="news-empty-state">
            Aucun article trouvé dans cette catégorie.
          </div>
        )}
      </section>

      <div className="divider" />

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            Fi<span>SAFI</span>
          </div>
          <div className="footer-links">
            <Link href="/#services" style={{ textDecoration: 'none' }}>Services</Link>
            <Link href="/#competences" style={{ textDecoration: 'none' }}>Expertises</Link>
            <a href="/#vision" style={{ textDecoration: 'none' }}>Vision</a>
            <Link href="/training" style={{ textDecoration: 'none' }}>Formation</Link>
            <Link href="/contact" style={{ textDecoration: 'none' }}>Contact</Link>
          </div>
          <div className="footer-cta">
            <Link href="/contact" className="btn-small">Nous contacter</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 FISAFI Groupe. Tous droits réservés.</p>
        </div>
      </footer>
    </>
  );
}