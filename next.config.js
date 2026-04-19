/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
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
};

module.exports = nextConfig;
