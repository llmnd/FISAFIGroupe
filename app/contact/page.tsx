import React from "react";
import { Metadata } from "next";
import Contact from "@/pages/contact";

export const metadata: Metadata = {
  title: "Contact FiSAFi Groupe | Consultant IT Dakar | Réponse 24h",
  description: "Contactez FiSAFi pour une consultation gratuite. Tél : +221 78 896 59 39 — Dakar, Sénégal. Réponse garantie sous 24h.",
  keywords: ["contact IT", "consultant Dakar", "support technique", "devis IT", "Sénégal"],
  robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  openGraph: {
    title: "Nous Contacter | FiSAFi Groupe",
    description: "Prenez contact pour une audit IT gratuit. +221 78 896 59 39",
    url: "https://fisafigroupe.com/contact",
    type: "website",
    locale: "fr_FR",
    siteName: "FiSAFi Groupe",
    images: [
      {
        url: "https://fisafigroupe.com/logo.jpeg",
        width: 1200,
        height: 630,
        alt: "FiSAFi Groupe - Contact",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact | FiSAFi Groupe",
    description: "Contactez FiSAFi pour une consultation. +221 78 896 59 39",
    images: ["https://fisafigroupe.com/logo.jpeg"],
  },
  alternates: {
    canonical: "https://fisafigroupe.com/contact",
  },
};

export default function ContactPage() {
  return <Contact />;
}
