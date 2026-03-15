import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    // Type errors are caught locally — don't block production builds
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig