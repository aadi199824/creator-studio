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
  },
};

export default nextConfig;
