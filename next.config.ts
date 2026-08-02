import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // `next dev` takes an exclusive lock on the build directory, so an E2E run
  // and a developer's dev server cannot share one. Separating ports is not
  // enough — the second process dies on the lock, not on the port.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
