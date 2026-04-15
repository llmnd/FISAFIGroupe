"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
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

export default function ArticleDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchArticle = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/articles/${id}`);
        if (res.ok) {
          const data = await res.json();
          setArticle(data.data?.article || data.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const categoryStyles: Record<string, { bg: string; icon: string; color: string; image?: string }> = {
    'Articles techniques': { bg: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', icon: '⚙️', color: '#fff', image: 'https://i.pinimg.com/1200x/c4/f5/45/c4f545af2a8090cfa1fc68a58c7831dd.jpg' },
    'Innovations': { bg: 'linear-gradient(135deg, #9333ea 0%, #d946ef 100%)', icon: '💡', color: '#fff', image: 'https://i.pinimg.com/736x/1d/29/71/1d2971755908f5a340f4b4b3f63a6efd.jpg' },
    'Événements': { bg: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)', icon: '📅', color: '#fff', image: 'https://i.pinimg.com/1200x/37/a7/f0/37a7f0f2f1afe68709caeca3864a54ca.jpg' },
    'Veille sectorielle': { bg: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', icon: '📊', color: '#fff', image: 'https://i.pinimg.com/1200x/94/3d/2f/943d2ff5420ae964310707f12d04bb2d.jpg' },
  };

  const getCategoryStyle = (category: string) => {
    return categoryStyles[category] || {
      bg: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
      icon: '📰',
      color: '#fff'
    };
  };

  if (error) {
    return (
      <>
        <Head>
          <title>Article non trouvé — FiSAFi Groupe</title>
        </Head>
        <Header />
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <h1>Article non trouvé</h1>
          <Link href="/news" style={{ color: 'var(--blue)', textDecoration: 'none' }}>
            ← Retour aux actualités
          </Link>
        </div>
      </>
    );
  }

  if (loading || !article) {
    return (
      <>
        <Head>
          <title>Chargement... — FiSAFi Groupe</title>
        </Head>
        <Header />
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <p>Chargement...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{article.title} — FiSAFi Groupe</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="description" content={article.excerpt} />
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
          <div className="hero-eyebrow">{article.category || 'Actualité'}</div>
          <h1 className="hero-title">
            {article.title}
          </h1>
          <p className="hero-sub">
            {article.excerpt}
          </p>
        </div>
      </section>

      <div className="divider" />

      {/* ARTICLE CONTENT */}
      <section className="section" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Featured Image */}
        <div style={{ marginBottom: '2rem', overflow: 'hidden' }}>
          {article.image ? (
            <Image
              src={article.image}
              alt={article.title}
              width={600}
              height={300}
              style={{ objectFit: "cover", width: "100%", height: "auto" }}
            />
          ) : getCategoryStyle(article.category || '').image ? (
            <Image
              src={getCategoryStyle(article.category || '').image!}
              alt={article.category || 'Article'}
              width={600}
              height={300}
              style={{ objectFit: "cover", width: "100%", height: "auto" }}
            />
          ) : (
            <div style={{ 
              background: getCategoryStyle(article.category || '').bg,
              width: '100%', 
              aspectRatio: '4/3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: getCategoryStyle(article.category || '').color,
              fontSize: '4rem',
            }}>
              {getCategoryStyle(article.category || '').icon}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div style={{ 
          display: 'flex', 
          gap: '1.5rem', 
          marginBottom: '2rem', 
          fontSize: '0.875rem',
          color: 'var(--steel)',
          flexWrap: 'wrap'
        }}>
          <span>{article.category || 'Actualité'}</span>
          <span>•</span>
          <span>{formatDate(article.createdAt)}</span>
          {article.author && (
            <>
              <span>•</span>
              <span>Par {article.author}</span>
            </>
          )}
        </div>

        {/* Content */}
        <article style={{ 
          fontSize: '1rem', 
          lineHeight: '1.8',
          color: 'var(--ink)',
          marginBottom: '3rem'
        }}>
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </article>

        {/* Back Link */}
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--line)' }}>
          <Link href="/news" style={{ 
            color: 'var(--blue)', 
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: '500',
            letterSpacing: '0.05em'
          }}>
            ← Retour aux actualités
          </Link>
        </div>
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
