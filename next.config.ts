/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TypeScript errors ko ignore karke build complete karne ke liye
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint warning/errors ko ignore karne ke liye
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;