/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // تعطيل webpack واستخدام Turbopack
  webpack: null,
  // حزم خارجية لمكونات الخادم
  serverExternalPackages: ['@prisma/client'],
  // إعدادات تجريبية
  experimental: {},
};

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
