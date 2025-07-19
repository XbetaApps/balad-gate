/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: [],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

// Add Prisma build script
const { PrismaPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin');

module.exports = (phase, { defaultConfig }) => {
  // Add Prisma plugin
  if (process.env.NODE_ENV === 'production') {
    const withPrisma = {
      webpack: (config, { isServer }) => {
        if (isServer) {
          config.plugins = [...config.plugins, new PrismaPlugin()];
        }
        return config;
      },
    };
    return withPrisma.webpack(defaultConfig, { isServer: true });
  }
  return nextConfig;
};
