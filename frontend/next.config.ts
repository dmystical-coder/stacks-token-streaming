import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // For server-side rendering, exclude node-only modules
  serverExternalPackages: ['thread-stream'],
};

export default nextConfig;
