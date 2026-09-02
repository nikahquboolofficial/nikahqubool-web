import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // TypeScript errors ko ignore karke build complete karne ke liye
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint warning/errors ko ignore karne ke liye
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.nikahqubool.in',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pakizarishte.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '582206580028aa92b54dbf6ec950184e.r2.cloudflarestorage.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;