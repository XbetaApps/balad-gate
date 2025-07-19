/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic optimizations
  reactStrictMode: true,
  compress: true,
  
  // Image optimization
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 يوم
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Package optimizations
  experimental: {
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      'framer-motion',
    ],
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Static files optimization
  output: 'standalone',
  
  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    // Add any Turbopack specific configurations here
  }
};

// Development-only configurations
if (process.env.NODE_ENV !== 'production') {
  // SVG handling with SVGR
  nextConfig.webpack = (config) => {
    // Only process SVGs with SVGR in development
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });
    return config;
  };
}

// إعداد معالجة SVG فقط في بيئة التطوير
if (process.env.NODE_ENV !== 'production') {
  nextConfig.webpack = (config) => {
    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });
    return config;
  };
}

module.exports = nextConfig;
