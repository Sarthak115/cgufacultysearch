/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript and ESLint errors now fail the build (they were switched off in v1).
  images: {
    unoptimized: true,
  },
}

export default nextConfig
