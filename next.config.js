/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Enable serverless functions for Vercel
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Don't fail build on ESLint errors (warnings won't fail anyway)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Don't fail build on TypeScript errors
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
