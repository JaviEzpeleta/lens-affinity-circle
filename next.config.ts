import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Avatars come from many different Lens/Grove/IPFS gateways. We render them
  // through our own /api/proxy-image route (needed for PNG export anyway), so we
  // don't rely on next/image remote patterns here.
  reactStrictMode: true,
}

export default nextConfig
