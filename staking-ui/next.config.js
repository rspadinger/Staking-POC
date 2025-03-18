/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable eslint during build
  eslint: {
    // Only run ESLint on these directories during production builds
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during build
  typescript: {
    // Skip type checking during build
    ignoreBuildErrors: true,
  },
  // Ensure asset URLs use relative paths instead of absolute paths with ports
  assetPrefix: '',
  // Prevent 404s when accessing directly by URL
  trailingSlash: true,
}

module.exports = nextConfig 