// web-ui/next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* config options here */
};

module.exports = {
  ...nextConfig,
  eslint: {
    dirs: ['app', 'components', 'lib', 'styles', 'types', 'utils'],
    ignoreDuringBuilds: true,
  },
}