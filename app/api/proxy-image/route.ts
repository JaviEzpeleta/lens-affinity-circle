import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/proxy-image?url=...
 *
 * Streams an external avatar through our own origin with permissive CORS + long
 * cache headers. Two reasons this exists:
 *  1. Avatars come from many gateways (imagekit, grove, ipfs, arweave...) and
 *     some send CORS headers that taint an SVG <image>, which breaks PNG export.
 *  2. Routing every avatar through one cached endpoint keeps the graph fast.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }

  // Only proxy https (block SSRF into internal http hosts).
  if (parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Only https urls allowed" }, { status: 400 })
  }

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AffinityCircle/1.0)" },
      next: { revalidate: 60 * 60 * 24 }, // cache the fetch for a day
    })

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream responded ${upstream.status}` },
        { status: upstream.status }
      )
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg"
    const buffer = await upstream.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("❌ proxy-image failed:", error)
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 })
  }
}
