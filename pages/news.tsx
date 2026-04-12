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
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => {
    // Token check for potential future use
    // const token = localStorage.getItem("token");
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoadingArticles(true);
      try {
        const category = selectedCategory === 'tous' ? '' : selectedCategory;
        const query = category ? `?category=${category}` : '';
        const res = await fetch(`/api/articles${query}`);
        if (res.ok) {
          const data = await res.json();
          setArticles(data.data?.articles || []);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoadingArticles(false);
      }
    };
    fetchArticles();
  }, [selectedCategory]);

  useEffect(() => {
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
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

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
    num: "01",
    name: "Suivez nos actualités",
    desc: "Restez informé de toutes nos innovations, publications et événements",
    img: "/20.jpeg"
  };

  return (
    <>
      <Head>
        <title>Actualités & Publications — FiSAFi Groupe</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#1e40af" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Outfit:wght@200;300;400;500&display=swap"
          rel="stylesheet"
        />
      </Head>

      <Header />

      {/* HERO */}
      <section className="hero" data-observe>
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
      <section className="section" id="actualites-featured">
        <div className="services-grid">
          <div className="service-card reveal">
            <div className="service-card-media">
              <Image
                src={featuredNews.img}
                alt={featuredNews.name}
                width={400}
                height={300}
                data-observe
                style={{ objectFit: "cover", width: "100%", height: "auto" }}
              />
              <div className="service-card-badge">{featuredNews.num}</div>
            </div>
            <div className="service-card-content">
              <h3 className="service-card-title">{featuredNews.name}</h3>
              <div className="service-card-tags">
                <span className="service-tag">Actualités</span>
                <span className="service-tag">Innovations</span>
                <span className="service-tag">Événements</span>
              </div>
              <p className="service-desc-new">{featuredNews.desc}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* NEWS SECTION */}
      <section className="section" id="news-list">
        <div className="section-eyebrow reveal">Nos publications</div>
        <h2 className="section-title reveal reveal-delay-1">
          Actualités<br />& innovations
        </h2>

        {/* Category Filter */}
        <div
          className="news-filters reveal reveal-delay-2"
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginBottom: '2.5rem',
            justifyContent: 'center',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '11px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                border: '0.5px solid ' + (selectedCategory === cat ? 'var(--blue)' : 'var(--line)'),
                background: selectedCategory === cat ? 'var(--blue)' : 'transparent',
                color: selectedCategory === cat ? '#fff' : 'var(--steel)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 400,
              }}
            >
              {cat === 'tous' ? 'Tous' : cat}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        {loadingArticles ? (
          <div className="services-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="service-card" style={{ opacity: 0.6 }}>
                <div className="service-card-media">
                  <div style={{ background: '#e8e8e8', width: '100%', aspectRatio: '16/9', borderRadius: '16px' }} />
                </div>
                <div className="service-card-content">
                  <div style={{ height: '24px', background: '#e8e8e8', width: '80%', marginBottom: '0.8rem' }} />
                  <div style={{ height: '60px', background: '#e8e8e8', width: '100%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="services-grid">
            {articles.map((article, i) => {
              const delayClass = i > 0 ? ` reveal-delay-${Math.min(i, 3)}` : "";
              return (
                <div 
                  key={article.id} 
                  className={`service-card reveal${delayClass}`}
                  onMouseEnter={() => setHoveredId(article.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="service-card-media">
                    {article.image ? (
                      <Image
                        src={article.image}
                        alt={article.title}
                        width={400}
                        height={250}
                        data-observe
                        style={{ objectFit: "cover", width: "100%", height: "auto" }}
                      />
                    ) : (
                      <div style={{ 
                        background: 'linear-gradient(135deg, #f5f5f5, #e8e8e8)', 
                        width: '100%', 
                        aspectRatio: '16/9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999',
                        fontSize: '14px'
                      }}>
                        Illustration
                      </div>
                    )}
                    <div className="service-card-badge">
                      {String(article.id).padStart(2, '0')}
                    </div>
                  </div>
                  <div className="service-card-content">
                    <div className="service-card-tags">
                      <span className="service-tag">{article.category || "Actualité"}</span>
                      <span className="service-tag">{formatDate(article.createdAt)}</span>
                    </div>
                    <h3 className="service-card-title">{article.title}</h3>
                    <p className="service-desc-new">{article.excerpt}</p>
                    {hoveredId === article.id && (
                      <Link 
                        href={`/news/${article.id}`}
                        style={{
                          display: 'inline-block',
                          marginTop: '0.5rem',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: 'var(--blue)',
                          textDecoration: 'none',
                          letterSpacing: '0.05em'
                        }}
                      >
                        Lire la suite →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--steel)' }}>
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