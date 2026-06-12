/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@algolens/algo-core",
    "@algolens/viz-engine",
    "@algolens/ui",
    "@algolens/api-contracts",
    "@algolens/complexity",
    "@algolens/content",
    "@algolens/retention",
    "@algolens/worker",
  ],
  // Lint is run as its own Turborepo task; don't fail the build on it here.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
