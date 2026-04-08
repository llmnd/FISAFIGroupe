import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'FiSAFi Groupe — Cabinet de Conseil en Technologie | Dakar, Sénégal',
  description: 'FiSAFi Groupe est un cabinet de conseil en technologie, ingénierie, formation et import-export basé à Dakar, Sénégal. Expertise en réseaux, télécommunications, cybersécurité et solutions IT.',
  keywords: ['conseil technologie', 'ingénierie réseaux', 'cybersécurité', 'formation IT', 'Dakar', 'Sénégal'],
  authors: [{ name: 'FiSAFi Groupe' }],
  creator: 'FiSAFi Groupe',
  publisher: 'FiSAFi Groupe',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://fisafigroupe.com',
    title: 'FiSAFi Groupe — Cabinet de Conseil en Technologie | Dakar, Sénégal',
    description: 'Cabinet de conseil en technologie, ingénierie, formation et import-export basé à Dakar, Sénégal. Expertise reconnue en réseaux, télécommunications et solutions IT.',
    images: [
      {
        url: 'https://fisafigroupe.com/logo.jpeg',
        width: 1200,
        height: 630,
        alt: 'FiSAFi Groupe Logo',
        type: 'image/jpeg',
      },
    ],
    siteName: 'FiSAFi Groupe',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FiSAFi Groupe — Cabinet de Conseil en Technologie',
    description: 'Expertise en technologie, ingénierie et formation à Dakar, Sénégal',
    images: ['https://fisafigroupe.com/logo.jpeg'],
  },
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover',
  themeColor: '#1e40af',
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FiSAFi Groupe',
    url: 'https://fisafigroupe.com',
    logo: 'https://fisafigroupe.com/logo.jpeg',
    description: 'Cabinet de conseil en technologie, ingénierie, formation et import-export basé à Dakar, Sénégal.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Liberté 6 Extension',
      addressLocality: 'Dakar',
      addressCountry: 'SN',
      postalCode: '',
    },
    sameAs: [
      'https://www.facebook.com/fisafigroupe',
      'https://www.linkedin.com/company/fisafigroupe',
      'https://twitter.com/fisafigroupe',
    ],
  };

  return (
    <html lang="fr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <link rel="canonical" href="https://fisafigroupe.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Outfit:wght@200;300;400;500&family=DM+Sans:wght@200;300;400;500&display=swap"
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
