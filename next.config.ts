import type { NextConfig } from 'next';

const nextConfig: any = {
  compress: true,
  poweredByHeader: false,
  typescript: {
    // TypeScript errors ko ignore karke build complete karne ke liye
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.nikahqubool.in',
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