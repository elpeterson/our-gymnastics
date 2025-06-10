import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Disables ESLint during builds.
   * This is recommended for CI/CD environments as linting can be a separate step.
   */
  eslint: {
    ignoreDuringBuilds: true,
  },

  /**
   * Enables standalone output mode.
   * This is required by the Dockerfile to create a minimal production image
   * by copying only the necessary files and node_modules.
   */
  output: 'standalone',
};

export default nextConfig;
