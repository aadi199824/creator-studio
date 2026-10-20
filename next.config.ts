import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "msnfanvimalvyjzbvsdl.supabase.co",
      },
    ],
  },
  // The Tradeverse slide renderer reads these at runtime with fs. Listing
  // them here makes sure Vercel bundles them into the serverless function.
  outputFileTracingIncludes: {
    "/api/automation/generate-daily": [
      "./lib/render/fonts/**/*",
      "./public/brand/**/*",
    ],
    "/api/automation/generate-now": [
      "./lib/render/fonts/**/*",
      "./public/brand/**/*",
    ],
  },
  // The phone-notification service worker must never be served stale.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
