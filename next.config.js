/** @type {import('next').NextConfig} */
const path = require('path');
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: [],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Add path alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    // Initialize plugins array if it doesn't exist
    if (!config.plugins) {
      config.plugins = [];
    }

    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    // Add Prisma plugin in production
    if (isServer && process.env.NODE_ENV === 'production') {
      const { PrismaPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin');
      config.plugins.push(new PrismaPlugin());
    }

    return config;
  },
};

module.exports = withPWA(nextConfig);