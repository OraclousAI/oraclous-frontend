/** @type {import('next').NextConfig} */
const nextConfig = {
  // Served at oraclous.com/eurail.
  basePath: '/eurail',
  reactStrictMode: true,
  // The codebase uses `.js` import specifiers that point at `.ts`/`.tsx` files
  // (the console convention). Teach Webpack to resolve them so we don't have to
  // rewrite every import during the migration.
  webpack(config) {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    };
    return config;
  },
};

export default nextConfig;
