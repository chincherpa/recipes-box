import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build-Ausgabe für deploy-pi.ps1 in separatem Ordner
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
