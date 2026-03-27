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

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  // Load articles from API
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
        <h2 className="section-title reveal reveal-delay-1">Actualités<br />& innovations</h2>

        {/* Category Filter */}
        <div className="news-filters reveal reveal-delay-2" style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginBottom: '2rem',
          justifyContent: 'center'
        }}>
          {categories.map(cat => (
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
                fontWeight: 400
              }}
            >
              {cat === 'tous' ? 'Tous' : cat}
            </button>
          ))}
        </div>

        {loadingArticles ? (
          <div className="reveal reveal-delay-2" style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            color: 'var(--steel)'
          }}>
            Chargement des articles...
          </div>
        ) : articles.length === 0 ? (
          <div className="reveal reveal-delay-2" style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            color: 'var(--steel)'
          }}>
            Aucun article dans cette catégorie pour le moment
          </div>
        ) : (
          <div className="news-grid reveal reveal-delay-2">
            {articles.map((article) => (
              <div key={article.id} className="news-card">
                {article.image && (
                  <img
                    src={article.image}
                    alt={article.title}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      marginBottom: '1rem',
                      borderRadius: '3px'
                    }}
                  />
                )}
                <div className="news-category">{article.category}</div>
                <h3 style={{
                  fontSize: '1.1rem',
                  color: 'var(--ink)',
                  marginBottom: '0.5rem',
                  marginTop: '0.5rem'
                }}>
                  {article.title}
                </h3>
                <p className="news-description">{article.excerpt}</p>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--steel)',
                  marginBottom: '1rem',
                  marginTop: '0.75rem'
                }}>
                  {new Date(article.createdAt).toLocaleDateString('fr-FR')}
                  {article.author && ` • ${article.author}`}
                </div>
                <div className="news-arrow">→</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="divider" />

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">Fi<span>SAFI</span></div>
          <div className="footer-links">
            <Link href="/#services">Services</Link>
            <Link href="/#competences">Expertises</Link>
            <a href="/#vision">Vision</a>
            <Link href="/training">Formation</Link>
            <Link href="/contact">Contact</Link>
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
