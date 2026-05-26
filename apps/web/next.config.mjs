/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@studyzone/api-client',
    '@studyzone/shared-logic',
    '@studyzone/shared-types',
  ],
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
