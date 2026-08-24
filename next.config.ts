import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [
    "@supabase/supabase-js",
    "bcryptjs",
    "jose",
  ],
};

export default nextConfig;
