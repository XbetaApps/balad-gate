/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: [],
    unoptimized: true, // لتحسين الأداء على Vercel
  },
  // Server Actions are enabled by default in Next.js 14
  webpack: (config, { isServer }) => {
    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    // Important: return the modified config
    return config;
  },
  // إعدادات خاصة بـ Vercel
  env: {
    // يمكنك إضافة متغيرات البيئة العامة هنا إذا لزم الأمر
  },
};

// Configuration for @next/bundle-analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
