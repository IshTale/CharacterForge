import type { NextConfig } from "next";
import { loadVercelDevelopmentEnv } from "./lib/env/load-vercel-env";

loadVercelDevelopmentEnv();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.perfectcorp.com" },
      { protocol: "https", hostname: "**.makeupar.com" },
      { protocol: "https", hostname: "picsum.photos" }
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb"
    }
  }
};

export default nextConfig;
