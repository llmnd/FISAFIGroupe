import React from "react";
import { Metadata } from "next";
import News from "@/pages/news";

export const metadata: Metadata = {
  title: "Actualités IT, Télécoms & Tech | FiSAFi Groupe | Dakar",
  description: "Suivez les dernières actualités technologiques, tendances IT et conseils pratiques pour votre infrastructure. Actualisé régulièrement.",
  keywords: ["actualités", "IT", "télécoms", "tech", "tendances", "innovation", "Dakar"],
  robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  openGraph: {
    title: "Actualités & Tendances Tech | FiSAFi Groupe",
    description: "Articles techniques, tendances IT et innovations technologiques",
    url: "https://fisafigroupe.com/news",
    type: "website",
    locale: "fr_FR",
    siteName: "FiSAFi Groupe",
    images: [
      {
        url: "https://fisafigroupe.com/logo.jpeg",
        width: 1200,
        height: 630,
        alt: "FiSAFi Groupe - Actualités",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Actualités Tech | FiSAFi Groupe",
    description: "Suivez les tendances IT et actualités technologiques",
    images: ["https://fisafigroupe.com/logo.jpeg"],
  },
  alternates: {
    canonical: "https://fisafigroupe.com/news",
  },
};

export default function NewsPage() {
  return <News />;
}
