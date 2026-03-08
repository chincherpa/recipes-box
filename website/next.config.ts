import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native Node.js-Module (better-sqlite3) nicht durch Webpack bündeln lassen
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
