import React from "react";
import { Metadata } from "next";

// Fallback component since Articles page path may vary
export const metadata: Metadata = {
  title: "Articles Techniques & Guides IT | FiSAFi Groupe",
  description: "Consultez nos articles techniques, guides pratiques et ressources IT. Conseils d'experts pour optimiser votre infrastructure.",
  keywords: ["articles", "guides IT", "ressources", "tutoriels", "bonnes pratiques IT"],
  robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  openGraph: {
    title: "Articles & Guides Techniques | FiSAFi Groupe",
    description: "Ressources IT professionnelles et guides pratiques",
    url: "https://fisafigroupe.com/articles",
    type: "website",
    locale: "fr_FR",
    siteName: "FiSAFi Groupe",
    images: [
      {
        url: "https://fisafigroupe.com/logo.jpeg",
        width: 1200,
        height: 630,
        alt: "FiSAFi Groupe - Articles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Articles & Ressources | FiSAFi Groupe",
    description: "Articles techniques et guides IT professionnels",
    images: ["https://fisafigroupe.com/logo.jpeg"],
  },
  alternates: {
    canonical: "https://fisafigroupe.com/articles",
  },
};

export default function ArticlesPage() {
  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>Articles</h1>
      <p>Redirecting to articles section...</p>
    </div>
  );
}
