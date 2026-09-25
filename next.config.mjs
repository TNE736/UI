/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The floating dev badge covers the sidebar's live indicator.
  devIndicators: false,
  // The MongoDB driver runs only in API routes; keep it out of the bundler.
  serverExternalPackages: ['mongodb'],
};

export default nextConfig;
