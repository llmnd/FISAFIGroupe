"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "@/components/Header";

interface Article {
  id: number;
  title: string;
  slug: string;
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

  useEffect(() => {
    if (!id) return;

    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/articles/${id}`);
        if (res.ok) {
          const data = await res.json();
          setArticle(data.data);
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <div style={{ padding: "4rem 2rem", textAlign: "center", minHeight: "60vh" }}>
          Chargement de l'article...
        </div>
      </>
    );
  }

  if (!article) {
    return (
      <>
        <Header />
        <div style={{ padding: "4rem 2rem", textAlign: "center", minHeight: "60vh" }}>
          <h2>Article non trouvé</h2>
          <Link href="/news" style={{ color: "var(--blue)", textDecoration: "none" }}>
            ← Retour aux actualités
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{article.title} — FiSAFi Groupe</title>
        <meta name="description" content={article.excerpt} />
      </Head>

      <Header />

      <article style={{ maxWidth: "800px", margin: "0 auto", padding: "4rem 2rem" }}>
        <Link href="/news" style={{ color: "var(--blue)", textDecoration: "none" }}>
          ← Retour aux actualités
        </Link>

        <div style={{ marginBottom: "3rem", marginTop: "2rem" }}>
          <div style={{
            display: "inline-block",
            padding: "0.5rem 1rem",
            background: "var(--blue)",
            color: "#fff",
            fontSize: "11px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "1rem",
            borderRadius: "3px"
          }}>
            {article.category}
          </div>

          <h1 style={{
            fontSize: "2.5rem",
            color: "var(--ink)",
            marginBottom: "1rem",
            lineHeight: 1.2,
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 400
          }}>
            {article.title}
          </h1>

          <div style={{
            display: "flex",
            gap: "2rem",
            fontSize: "14px",
            color: "var(--steel)",
            marginBottom: "2rem",
            paddingBottom: "2rem",
            borderBottom: "1px solid var(--line)"
          }}>
            <span>{new Date(article.createdAt).toLocaleDateString('fr-FR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
            {article.author && <span>Par {article.author}</span>}
          </div>
        </div>

        {article.image && (
          <img
            src={article.image}
            alt={article.title}
            data-observe
            style={{
              width: "100%",
              maxHeight: "400px",
              objectFit: "cover",
              borderRadius: "3px",
              marginBottom: "3rem"
            }}
          />
        )}

        <div style={{
          fontSize: "16px",
          lineHeight: 1.8,
          color: "var(--ink)",
          marginBottom: "3rem"
        }}>
          {article.content.split('\n\n').map((paragraph, i) => (
            <p key={i} style={{ marginBottom: "1.5rem" }}>
              {paragraph}
            </p>
          ))}
        </div>

        <div style={{
          paddingTop: "2rem",
          borderTop: "1px solid var(--line)"
        }}>
          <Link 
            href="/news" 
            style={{
              color: "var(--blue)",
              textDecoration: "none",
              fontSize: "14px",
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--ink)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--blue)";
            }}
          >
            ← Toutes les actualités
          </Link>
        </div>
      </article>

      <div style={{
        marginTop: "4rem",
        padding: "3rem 2rem",
        background: "var(--light)",
        textAlign: "center",
        color: "var(--steel)",
        fontSize: "14px"
      }}>
        <p>&copy; 2026 FISAFI Groupe. Tous droits réservés.</p>
      </div>
    </>
  );
}
