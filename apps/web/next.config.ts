import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Transpile our monorepo workspace packages
  transpilePackages: [
    "@skoporama/core",
    "@skoporama/ui",
    "@skoporama/gaze",
    "@skoporama/speech",
    "@skoporama/lang",
  ],
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
};

export default nextConfig;
