import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.API_BASE_URL || 'http://backend:8000/api/v1'}/:path*`,
      },
    ];
  },
  images: {
    domains: ['channelzap.com'],
  },
  trailingSlash: false,
  output: 'standalone',
};

export default nextConfig;
