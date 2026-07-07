import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/static/:path*",
        destination: `${API_URL}/static/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/blogs",
        destination: "/our-blogs",
        permanent: true,
      },
      {
        source: "/blogs/:slug",
        destination: "/our-blogs/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
