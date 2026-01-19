import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      fs: { browser: './src/lib/empty.js' },
      path: { browser: './src/lib/empty.js' },
      crypto: { browser: './src/lib/empty.js' },
    },
  },
};

export default nextConfig;
