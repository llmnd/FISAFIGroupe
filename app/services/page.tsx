import React from "react";
import { Metadata } from "next";
import Services from "@/pages/services";

export const metadata: Metadata = {
  title: "Services IT & Réseaux | Cybersécurité, Cloud, Infrastructure | FiSAFi",
  description: "Services complets IT : réseaux, cybersécurité, cloud computing, infrastructure IT et formations. Solutions adaptées à votre contexte au Sénégal.",
  keywords: ["services IT", "réseaux", "cybersécurité", "cloud", "infrastructure IT", "Dakar", "Sénégal"],
  robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  openGraph: {
    title: "Services Informatiques Complets | FiSAFi Groupe",
    description: "Réseaux • Cybersécurité • Cloud • Infrastructure IT • Support technique 24/7",
    url: "https://fisafigroupe.com/services",
    type: "website",
    locale: "fr_FR",
    siteName: "FiSAFi Groupe",
    images: [
      {
        url: "https://fisafigroupe.com/logo.jpeg",
        width: 1200,
        height: 630,
        alt: "FiSAFi Groupe - Services IT",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Services IT & Réseaux | FiSAFi Groupe",
    description: "Services IT : réseaux, cybersécurité, cloud, infrastructure à Dakar",
    images: ["https://fisafigroupe.com/logo.jpeg"],
  },
  alternates: {
    canonical: "https://fisafigroupe.com/services",
  },
};

export default function ServicesPage() {
  return <Services />;
}
