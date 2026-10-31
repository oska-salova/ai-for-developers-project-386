import type { NextConfig } from "next";

// `cacheComponents` rejects `new Date()` while prerendering, so the year in the
// footer is pinned when the config is loaded (build time) instead of at render.
const buildYear = new Date().getFullYear();

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  env: {
    NEXT_PUBLIC_BUILD_YEAR: String(buildYear),
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
