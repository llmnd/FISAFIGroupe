import React from "react";
import { Metadata } from "next";
import Training from "@/pages/training";

export const metadata: Metadata = {
  title: "Formations IT Certifiantes | Dakar, Sénégal | FiSAFi Groupe",
  description: "Formations IT professionnelles : réseaux, cybersécurité, cloud et administration système. Certifications reconnues à Dakar.",
  keywords: ["formations IT", "certification", "réseaux", "cybersécurité", "cloud", "Dakar"],
  robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  openGraph: {
    title: "Formations IT Certifiantes | FiSAFi Groupe",
    description: "Formations professionnelles en IT, réseaux et cybersécurité",
    url: "https://fisafigroupe.com/training",
    type: "website",
    locale: "fr_FR",
    siteName: "FiSAFi Groupe",
    images: [
      {
        url: "https://fisafigroupe.com/logo.jpeg",
        width: 1200,
        height: 630,
        alt: "FiSAFi Groupe - Formations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Formations IT | FiSAFi Groupe",
    description: "Formations certifiantes en IT et cybersécurité",
    images: ["https://fisafigroupe.com/logo.jpeg"],
  },
  alternates: {
    canonical: "https://fisafigroupe.com/training",
  },
};

export default function TrainingPage() {
  return <Training />;
}
