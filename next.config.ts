import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence the workspace root inference warning by explicitly setting the tracing root
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
