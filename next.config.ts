import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  ...(process.env.BUILD_TARGET === 'mobile' && {
    output: 'export',
    trailingSlash: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  }),
}

export default nextConfig
