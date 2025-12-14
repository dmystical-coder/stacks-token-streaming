/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure we are using Webpack, not Turbopack for build (which is default, but let's be safe)
  // Disable any experimental features that might have been inferred
  experimental: {
    // serverActions: true, // enabled by default in 14+
  },
  // Explicitly handle the server external packages
  serverExternalPackages: ["thread-stream", "pino", "pino-pretty"],
  // Avoid issues with certain packages
  transpilePackages: [
    "@stacks/connect",
    "@stacks/network",
    "@stacks/transactions",
  ],
};

module.exports = nextConfig;
