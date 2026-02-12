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

    // Externalize problematic Solana/Anchor packages on server
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@solana/web3.js': 'commonjs @solana/web3.js',
        '@coral-xyz/anchor': 'commonjs @coral-xyz/anchor',
      });
    }

    return config;
  },
}

module.exports = nextConfig
