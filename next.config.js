const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  webpack: (config) => {
    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    return config;
  },
};

module.exports = nextConfig;
