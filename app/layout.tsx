import type { Metadata } from "next";
import { ReactNode } from "react";
import { Cormorant_Garamond, Outfit, DM_Sans } from 'next/font/google'
import { ThemeProvider } from "@/context/ThemeContext";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import ScrollManager from "@/components/ScrollManager";
import { ZoomOptimizer } from "@/components/ZoomOptimizer";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "FiSAFi Groupe — Cabinet IT & Télécoms | Dakar, Sénégal",
  description:
    "Partenaire stratégique pour l'avenir numérique de l'Afrique. Expertise IT, Réseaux, Télécoms, Fibre Optique, Cybersécurité, Cloud & Formations. WDM, Déploiement Aérien/Souterrain. 10+ années à Dakar. +221 78 781 22 97",
  keywords: [
    "cabinet IT Dakar",
    "télécoms Sénégal",
    "fibre optique Dakar",
    "expert réseau WDM",
    "déploiement fibre optique",
    "ingénierie réseaux Dakar",
    "cybersécurité Sénégal",
    "infrastructure cloud Dakar",
    "consultant IT Afrique",
    "formation IT Sénégal",
    "services informatiques",
    "support technique 24/7",
    "solutions télécommunications",
  ],
  authors: [{ name: "FiSAFi Groupe" }],
  creator: "FiSAFi Groupe",
  publisher: "FiSAFi Groupe",
  robots:
    "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://fisafigroupe.com",
    title: "FiSAFi Groupe — Cabinet IT & Télécoms | Dakar, Sénégal",
    description:
      "Partenaire stratégique pour l'avenir numérique de l'Afrique. Expertise IT, Réseaux, Télécoms, Fibre Optique, Cybersécurité. 10+ années d'expertise en Afrique de l'Ouest.",
    images: [
      {
        url: "https://fisafigroupe.com/favicon/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "FiSAFi Groupe - Cabinet IT Dakar",
        type: "image/png",
      },
    ],
    siteName: "FiSAFi Groupe",
  },
  twitter: {
    card: "summary_large_image",
    title: "FiSAFi Groupe — Cabinet IT & Télécoms | Dakar, Sénégal",
    description:
      "Expertise IT, Réseaux, Télécoms, Fibre Optique, Cybersécurité et formations certifiantes à Dakar, Sénégal",
    images: ["https://fisafigroupe.com/favicon/web-app-manifest-512x512.png"],
    creator: "@fisafigroupe",
  },
  /* viewport et themeColor se gèrent via l'export viewport/themeColor dans Next 13+ */
  formatDetection: { telephone: true, email: true, address: true },
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

/* Next 13+ — viewport exporté séparément évite l'avertissement */
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,  /* Désactiver complètement le zoom sur mobile pour éviter les bugs */
  minimumScale: 1,
  userScalable: false,  /* Désactiver pinch-to-zoom et double-tap zoom */
  viewportFit: "cover",
  themeColor: "#1e40af",
};

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300','400'],
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300','400','500'],
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400','500'],
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://fisafigroupe.com/#organization",
    name: "FiSAFi Groupe",
    url: "https://fisafigroupe.com",
    logo: {
      "@type": "ImageObject",
      url: "https://fisafigroupe.com/favicon/web-app-manifest-512x512.png",
      width: 512,
      height: 512,
    },
    description:
      "Cabinet de conseil en technologie, ingénierie, formation et import-export basé à Dakar, Sénégal.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Liberté 6 Extension",
      addressLocality: "Dakar",
      addressCountry: "SN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      telephone: "+221787812297",
      email: "contact@fisafigroupe.com",
      areaServed: ["SN", "TD", "AF"],
      availableLanguage: ["fr", "en"],
    },
    sameAs: [
      "https://www.facebook.com/fisafigroupe",
      "https://www.linkedin.com/company/fisafigroupe",
      "https://twitter.com/fisafigroupe",
    ],
    foundingDate: "2020",
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: "https://fisafigroupe.com",
    name: "FiSAFi Groupe",
    description: "Cabinet de conseil en technologie et ingénierie IT",
    publisher: { "@type": "Organization", name: "FiSAFi Groupe" },
  };

  // Safe serializer to avoid closing </script> sequences in JSON-LD
  const safeSerialize = (obj: any) => JSON.stringify(obj).replace(/</g, '\\u003c');

  return (
    <html lang="fr" className={`${cormorant.className} ${outfit.className} ${dmSans.className}`}>
      <head>
        {/* ── Schemas ───────────────────────────────────────────── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeSerialize(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeSerialize(webSiteSchema) }}
        />

        <link rel="canonical" href="https://fisafigroupe.com" />

        {/* Fonts loaded via next/font/google for optimized delivery */}

        {/* ── PWA / Icons ────────────────────────────────────────── */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        {/* ── Verifications ─────────────────────────────────────── */}
        <meta
          name="google-site-verification"
          content="YOUR_GOOGLE_VERIFICATION_CODE_HERE"
        />
        <meta
          name="msvalidate.01"
          content="YOUR_BING_VERIFICATION_CODE_HERE"
        />

        {/* ── Anti-FOUC theme ───────────────────────────────────── */}
        {/*
          PERF : ce script est inline et bloquant PAR CHOIX —
          c'est le seul script qui doit l'être pour éviter le flash
          de thème clair avant que le dark mode soit appliqué.
          Il est volontairement minimal.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})();`,
          }}
        />

        {/* ── Block Pinch-to-Zoom (Mobile) ───────────────────────── */}
        {/*
          Ce script bloque le pinch-to-zoom sur mobile IMMÉDIATEMENT
          avant que React charge, pour éviter les bugs au zoom
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var lastTouchEnd=0;document.addEventListener('touchmove',function(e){if(e.touches.length>1)e.preventDefault()},{passive:false});document.addEventListener('touchend',function(e){var now=Date.now();if(now-lastTouchEnd<=300)e.preventDefault();lastTouchEnd=now},{passive:false});document.addEventListener('wheel',function(e){if(e.ctrlKey||e.metaKey)e.preventDefault()},{passive:false})})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <ScrollManager />
          <ZoomOptimizer />
          <SmoothScrollProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}