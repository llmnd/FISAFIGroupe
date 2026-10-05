/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
      },
      {
        protocol: 'https',
        hostname: 'fisafigroupe.com',
      },
      {
        protocol: 'https',
        hostname: 'www.fisafigroupe.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'fisafigroupe.com',
          },
        ],
        destination: 'https://www.fisafigroupe.com/:path*',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          has: [{ type: 'host', value: 'market.fisafigroupe.com' }],
          destination: '/market',
        },
        {
          source: '/commande',
          has: [{ type: 'host', value: 'market.fisafigroupe.com' }],
          destination: '/market/commande',
        },
        {
          source: '/livraison',
          has: [{ type: 'host', value: 'market.fisafigroupe.com' }],
          destination: '/market/livraison',
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: '/abdel2.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=2592000',
          },
        ],
      },
      {
        source: '/produits/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=2592000',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
