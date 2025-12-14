import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use empty turbopack config to acknowledge we're using Turbopack
  turbopack: {},
  
  // For server-side rendering, exclude node-only modules
  serverExternalPackages: ['thread-stream'],
};

export default nextConfig;
