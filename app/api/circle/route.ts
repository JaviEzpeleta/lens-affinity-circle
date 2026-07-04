import { NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import {
  computeCircle,
  sanitizeHandle,
  LensNotFoundError,
  CACHE_TTL_SECONDS,
  type CircleData,
} from "@/lib/lens"

/**
 * POST /api/circle  { handle: string }  ->  CircleData
 *
 * The whole computation (account lookup + post paging + affinity tally + friend
 * avatar batch) is wrapped in `unstable_cache`, keyed by handle. The first call
 * for a handle does the heavy lifting; every call for the next 24h is served
 * from Next's data cache — no Lens traffic at all.
 */

// A tiny per-handle cache-function factory. Each handle gets its own memoized
// unstable_cache instance whose key includes the handle, so entries never
// collide and stay independently revalidated.
const cacheByHandle = new Map<string, () => Promise<CircleData>>()

function getCachedCircle(handle: string): Promise<CircleData> {
  if (!cacheByHandle.has(handle)) {
    cacheByHandle.set(
      handle,
      unstable_cache(() => computeCircle(handle), ["affinity-circle", handle], {
        revalidate: CACHE_TTL_SECONDS,
        tags: ["affinity-circle", `circle:${handle}`],
      })
    )
  }
  return cacheByHandle.get(handle)!()
}

export async function POST(request: Request) {
  try {
    let body: { handle?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const handle = sanitizeHandle(body.handle ?? "")
    if (!handle) {
      return NextResponse.json(
        { error: "A Lens handle is required" },
        { status: 400 }
      )
    }

    console.log(`🚀 POST /api/circle — @${handle}`)
    const data = await getCachedCircle(handle)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof LensNotFoundError) {
      console.log(`🔍 Not found: ${error.message}`)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error("❌ Error in /api/circle:", error)
    return NextResponse.json(
      { error: "Failed to build the circle. Please try again." },
      { status: 500 }
    )
  }
}
