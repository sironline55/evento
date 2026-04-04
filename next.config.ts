import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // trailingSlash only for mobile static export
  ...(process.env.BUILD_TARGET === 'mobile' && {
    output: 'export',
    trailingSlash: true,
  }),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
