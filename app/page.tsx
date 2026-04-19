import { Metadata } from "next";
import Home from "@/pages/index";

export const metadata: Metadata = {
  title: "FiSAFi Groupe — Cabinet IT & Réseaux | Dakar, Sénégal",
  description: "Cabinet de conseil en technologie, informatique et ingénierie. Réseaux, cybersécurité, cloud, formations IT à Dakar. 10+ années d'expertise. +221 78 896 59 39",
  keywords: [
    "cabinet IT Dakar",
    "conseil informatique Sénégal",
    "ingénierie réseaux Dakar",
    "cybersécurité Sénégal",
    "infrastructure cloud Dakar",
    "consultant IT Afrique",
    "formation IT Sénégal",
    "services informatiques",
    "support technique 24/7",
    "FiSAFi",
  ],
  robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  authors: [{ name: "FiSAFi Groupe" }],
  creator: "FiSAFi Groupe",
  publisher: "FiSAFi Groupe",
  formatDetection: { telephone: true, email: true, address: true },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://fisafigroupe.com",
    title: "FiSAFi Groupe — Expert IT & Réseaux",
    description: "Cabinet de conseil en IT spécialisé en réseaux, cybersécurité et solutions cloud à Dakar",
    siteName: "FiSAFi Groupe",
    images: [
      {
        url: "https://fisafigroupe.com/logo.jpeg",
        width: 1200,
        height: 630,
        alt: "FiSAFi Groupe - Cabinet IT Dakar",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FiSAFi Groupe Solutions Informatiques Dakar",
    description: "Expertise IT, réseaux, cybersécurité et formations certifiantes à Dakar, Sénégal",
    creator: "@fisafigroupe",
    images: ["https://fisafigroupe.com/logo.jpeg"],
  },
  alternates: {
    canonical: "https://fisafigroupe.com",
    languages: { "fr-FR": "https://fisafigroupe.com" },
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
};

export default function HomePage() {
  return <Home />;
}
