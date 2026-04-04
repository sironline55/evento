import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Static export for Capacitor mobile builds
  // Switch to 'export' when building for iOS/Android:
  // npm run build:mobile
  output: process.env.BUILD_TARGET === 'mobile' ? 'export' : undefined,

  // Required for static export with Capacitor
  trailingSlash: true,

  // Disable image optimization for static export
  images: {
    unoptimized: process.env.BUILD_TARGET === 'mobile',
  },
};

export default nextConfig;
