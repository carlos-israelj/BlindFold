/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@hot-labs/kit',
    '@hot-labs/omni-sdk',
  ],
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Add rule to handle ES modules from @hot-labs/kit
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules\/@hot-labs/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
}

module.exports = nextConfig
