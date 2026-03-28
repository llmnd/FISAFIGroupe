"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('tous');
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
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
      <section className="hero">
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

        {/* Loading */}
        {loadingArticles ? (
          <div
            className="reveal reveal-delay-2"
            style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--steel)' }}
          >
            Chargement des articles…
          </div>
        ) : articles.length === 0 ? (
          <div
            className="reveal reveal-delay-2"
            style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--steel)' }}
          >
            Aucun article dans cette catégorie pour le moment
          </div>
        ) : (
          <div
            className="reveal reveal-delay-2"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              border: '0.5px solid var(--line)',
            }}
          >
            {articles.map((article, index) => {
              const isFeatured = index === 0 && !!article.image;
              const isHovered = hoveredId === article.id;

              if (isFeatured) {
                return (
                  <Link
                    key={article.id}
                    href={`/articles/${article.id}`}
                    style={{ textDecoration: 'none', gridColumn: '1 / -1' }}
                  >
                    <div
                      onMouseEnter={() => setHoveredId(article.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        borderBottom: '0.5px solid var(--line)',
                        background: isHovered ? 'rgba(30,64,175,0.015)' : 'transparent',
                        transition: 'background 0.2s',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Image gauche */}
                      <div style={{ overflow: 'hidden', maxHeight: 380 }}>
                        <img
                          src={article.image}
                          alt={article.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            minHeight: 300,
                            objectFit: 'cover',
                            display: 'block',
                            transform: isHovered ? 'scale(1.025)' : 'scale(1)',
                            transition: 'transform 0.5s ease',
                          }}
                        />
                      </div>

                      {/* Corps droit */}
                      <div
                        style={{
                          padding: '3rem 3rem 2.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                        }}
                      >
                        {/* Meta */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 500,
                              letterSpacing: '0.12em',
                              textTransform: 'uppercase',
                              color: 'var(--blue)',
                              background: 'rgba(30,64,175,0.07)',
                              padding: '0.2rem 0.6rem',
                              borderRadius: 2,
                              fontFamily: "'Outfit', sans-serif",
                            }}
                          >
                            {article.category}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--steel)',
                              fontFamily: "'Outfit', sans-serif",
                            }}
                          >
                            {formatDate(article.createdAt)}
                          </span>
                          {article.author && (
                            <>
                              <span
                                style={{
                                  width: 2,
                                  height: 2,
                                  borderRadius: '50%',
                                  background: 'var(--line)',
                                  display: 'inline-block',
                                }}
                              />
                              <span
                                style={{
                                  fontSize: 11,
                                  color: 'var(--steel)',
                                  fontFamily: "'Outfit', sans-serif",
                                }}
                              >
                                {article.author}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Titre */}
                        <h2
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontSize: '2rem',
                            fontWeight: 400,
                            lineHeight: 1.2,
                            color: 'var(--ink)',
                            marginBottom: '1rem',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {article.title}
                        </h2>

                        {/* Excerpt */}
                        <p
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 14,
                            fontWeight: 300,
                            lineHeight: 1.7,
                            color: 'var(--steel)',
                            marginBottom: '1.75rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {article.excerpt}
                        </p>

                        {/* CTA */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: 11,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'var(--blue)',
                            fontFamily: "'Outfit', sans-serif",
                            opacity: isHovered ? 1 : 0,
                            transform: isHovered ? 'translateX(0)' : 'translateX(-6px)',
                            transition: 'opacity 0.2s, transform 0.2s',
                          }}
                        >
                          Lire l'article
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              }

              /* ── Carte normale ── */
              return (
                <Link
                  key={article.id}
                  href={`/articles/${article.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    onMouseEnter={() => setHoveredId(article.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      padding: '2rem 2rem 1.75rem',
                      borderBottom: '0.5px solid var(--line)',
                      borderRight: '0.5px solid var(--line)',
                      background: isHovered ? 'rgba(30,64,175,0.015)' : 'transparent',
                      transition: 'background 0.15s',
                      cursor: 'pointer',
                      height: '100%',
                    }}
                  >
                    {/* Image optionnelle */}
                    {article.image && (
                      <div style={{ overflow: 'hidden', marginBottom: '1.5rem', borderRadius: 2 }}>
                        <img
                          src={article.image}
                          alt={article.title}
                          style={{
                            width: '100%',
                            height: 180,
                            objectFit: 'cover',
                            display: 'block',
                            transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                            transition: 'transform 0.4s ease',
                          }}
                        />
                      </div>
                    )}

                    {/* Meta */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                        marginBottom: '0.85rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: 'var(--blue)',
                          background: 'rgba(30,64,175,0.07)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 2,
                          fontFamily: "'Outfit', sans-serif",
                        }}
                      >
                        {article.category}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--steel)',
                          fontFamily: "'Outfit', sans-serif",
                        }}
                      >
                        {formatDate(article.createdAt)}
                      </span>
                      {article.author && (
                        <>
                          <span
                            style={{
                              width: 2,
                              height: 2,
                              borderRadius: '50%',
                              background: 'var(--line)',
                              display: 'inline-block',
                            }}
                          />
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--steel)',
                              fontFamily: "'Outfit', sans-serif",
                            }}
                          >
                            {article.author}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Titre */}
                    <h3
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: '1.3rem',
                        fontWeight: 400,
                        lineHeight: 1.3,
                        color: 'var(--ink)',
                        marginBottom: '0.65rem',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {article.title}
                    </h3>

                    {/* Excerpt */}
                    <p
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 13,
                        fontWeight: 300,
                        lineHeight: 1.7,
                        color: 'var(--steel)',
                        marginBottom: '1.25rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {article.excerpt}
                    </p>

                    {/* Flèche hover */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: 11,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--blue)',
                        fontFamily: "'Outfit', sans-serif",
                        opacity: isHovered ? 1 : 0,
                        transform: isHovered ? 'translateX(0)' : 'translateX(-5px)',
                        transition: 'opacity 0.2s, transform 0.2s',
                      }}
                    >
                      Lire
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
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