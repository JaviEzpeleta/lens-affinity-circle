/**
 * Route an external avatar URL through our CORS-safe proxy. Keeps PNG export
 * from tainting the canvas and lets us cache avatars at our own edge.
 */
export function proxied(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith("/")) return url // already local
  return `/api/proxy-image?url=${encodeURIComponent(url)}`
}

/** First visible character of a handle, uppercased — used as an avatar fallback. */
export function initial(handle: string): string {
  return (handle.trim()[0] || "?").toUpperCase()
}
