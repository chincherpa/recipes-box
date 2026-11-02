import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native Node.js-Module (better-sqlite3) nicht durch Webpack bündeln lassen
  serverExternalPackages: ["better-sqlite3"],
  // Build-Ausgabe für deploy-pi.ps1 in separatem Ordner
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
