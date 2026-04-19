import React from "react";
import { Metadata } from "next";
import Search from "@/pages/search";

export const metadata: Metadata = {
  title: "Recherche | FiSAFi Groupe",
  description: "Recherchez des articles, formations et ressources IT sur le site de FiSAFi Groupe.",
  keywords: ["recherche", "articles", "ressources"],
  robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  openGraph: {
    title: "Recherche | FiSAFi Groupe",
    description: "Moteur de recherche FiSAFi",
    url: "https://fisafigroupe.com/search",
    type: "website",
    locale: "fr_FR",
    siteName: "FiSAFi Groupe",
  },
  alternates: {
    canonical: "https://fisafigroupe.com/search",
  },
};

export default function SearchPage() {
  return <Search />;
}
