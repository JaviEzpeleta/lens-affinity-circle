import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  // Avatars come from many different Lens/Grove/IPFS gateways. We render them
  // through our own /api/proxy-image route (needed for PNG export anyway), so we
  // don't rely on next/image remote patterns here.
  reactStrictMode: true,
  // Pin the workspace root so a stray lockfile elsewhere on the machine can't
  // hijack Next's root inference for output-file tracing / turbopack.
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
  },
}

export default nextConfig
