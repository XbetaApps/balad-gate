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
    return config;
  },
};

module.exports = nextConfig;
