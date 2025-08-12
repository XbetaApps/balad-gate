/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable automatic static optimization for dynamic routes
  trailingSlash: false,
  // Enable React strict mode
  reactStrictMode: true,
  // Image optimization
  images: {
    unoptimized: true,
  },
  // Disable i18n in next.config.js as it's now handled by the app directory
  i18n: undefined,
};

export default nextConfig;
