import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import SmoothScrollProvider from '@/components/SmoothScrollProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'FiSAFi Groupe — Cabinet IT & Réseaux | Dakar, Sénégal',
  description: 'Cabinet de conseil en technologie, informatique et ingénierie. Réseaux, cybersécurité, cloud, formations IT à Dakar. 10+ années d\'expertise. +221 78 896 59 39',
  keywords: [
    'cabinet IT Dakar',
    'conseil informatique Sénégal',
    'ingénierie réseaux Dakar',
    'cybersécurité Sénégal',
    'infrastructure cloud Dakar',
    'consultant IT Afrique',
    'formation IT Sénégal',
    'services informatiques',
    'support technique 24/7',
  ],
  authors: [{ name: 'FiSAFi Groupe' }],
  creator: 'FiSAFi Groupe',
  publisher: 'FiSAFi Groupe',
  robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://fisafigroupe.com',
    title: 'FiSAFi Groupe — Cabinet IT & Réseaux | Dakar',
    description: 'Cabinet de conseil en IT, réseaux, cybersécurité et formations. Expertise reconnue en infrastructure cloud, télécoms et solutions sécurisées au Sénégal.',
    images: [
      {
        url: 'https://fisafigroupe.com/logo.jpeg',
        width: 1200,
        height: 630,
        alt: 'FiSAFi Groupe - Cabinet IT Dakar',
        type: 'image/jpeg',
      },
      {
        url: 'https://fisafigroupe.com/logo.jpeg',
        width: 800,
        height: 420,
        alt: 'FiSAFi Groupe Logo',
        type: 'image/jpeg',
      },
    ],
    siteName: 'FiSAFi Groupe',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FiSAFi Groupe — Cabinet IT & Réseaux',
    description: 'Expertise IT, réseaux, cybersécurité et formations certifiantes à Dakar, Sénégal',
    images: ['https://fisafigroupe.com/logo.jpeg'],
    creator: '@fisafigroupe',
  },
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover',
  themeColor: '#1e40af',
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  alternates: {
    canonical: 'https://fisafigroupe.com',
    languages: {
      'fr-FR': 'https://fisafigroupe.com',
    },
  },
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://fisafigroupe.com/#organization',
    name: 'FiSAFi Groupe',
    url: 'https://fisafigroupe.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://fisafigroupe.com/logo.jpeg',
      width: 1200,
      height: 630,
    },
    description: 'Cabinet de conseil en technologie, ingénierie, formation et import-export basé à Dakar, Sénégal.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Liberté 6 Extension',
      addressLocality: 'Dakar',
      addressCountry: 'SN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      telephone: '+221788965939',
      email: 'contact@fisafigroupe.com',
      areaServed: ['SN', 'TD', 'AF'],
      availableLanguage: ['fr', 'en'],
    },
    sameAs: [
      'https://www.facebook.com/fisafigroupe',
      'https://www.linkedin.com/company/fisafigroupe',
      'https://twitter.com/fisafigroupe',
    ],
    foundingDate: '2020',
  };

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: 'https://fisafigroupe.com',
    name: 'FiSAFi Groupe',
    description: 'Cabinet de conseil en technologie et ingénierie IT',
    publisher: {
      '@type': 'Organization',
      name: 'FiSAFi Groupe',
    },
  };

  return (
    <html lang="fr">
      <head>
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* WebSite Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />

        {/* Canonical URL */}
        <link rel="canonical" href="https://fisafigroupe.com" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Outfit:wght@200;300;400;500&family=DM+Sans:wght@200;300;400;500&display=swap"
        />

        {/* Meta Tags */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Search Engines Verification */}
        <meta name="google-site-verification" content="YOUR_GOOGLE_VERIFICATION_CODE_HERE" />
        <meta name="msvalidate.01" content="YOUR_BING_VERIFICATION_CODE_HERE" />

        {/* Theme Initialization Script - Prevent FOUC (Flash of Unstyled Content) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'light';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  // localStorage might not be available in some contexts
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <SmoothScrollProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
