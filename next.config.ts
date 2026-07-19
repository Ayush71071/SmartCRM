import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.ufs.sh" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
  typescript: {
    // Type errors are caught by `npm run typecheck` in CI; keep the build
    // fast during local iteration.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
