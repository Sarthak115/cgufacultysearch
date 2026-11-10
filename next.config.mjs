/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript and ESLint errors now fail the build (they were switched off in v1).
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    // The webpack bundled with Next 15.2.8 crashes on *cached* production rebuilds
    // ("Cannot read properties of undefined (reading 'length')" in WasmHash, while re-hashing
    // folders from .next/cache). Vercel restores that cache between deploys, so turn webpack's
    // persistent cache off for production builds. The site is small: a clean build is quick.
    if (!dev) config.cache = false
    return config
  },
}

export default nextConfig
