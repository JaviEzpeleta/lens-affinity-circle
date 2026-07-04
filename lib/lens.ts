/**
 * All Lens Protocol logic lives here.
 *
 * It talks to the PUBLIC Lens GraphQL API — no API key, no auth token, no
 * wallet. Everything expensive is wrapped in `unstable_cache` at the route
 * layer (see app/api/circle/route.ts), keyed by handle.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Configuration — the few knobs worth tweaking.
// ─────────────────────────────────────────────────────────────────────────────

/** Public Lens mainnet GraphQL endpoint. Testnet: api.testnet.lens.xyz/graphql */
export const LENS_ENDPOINT = "https://api.lens.xyz/graphql"

/**
 * How far back to look for affinity signals. 90 days keeps the window "recent"
 * while giving the circle enough friends to feel alive — most active accounts
 * yield 15–30 friends at 90d vs. just a handful at 30d. The window is anchored
 * to the account's most recent post (see tallyAffinity), not the wall clock.
 */
export const DAYS_TO_ANALYZE = 90

/** How long a computed circle stays cached (seconds). 24h = heavily cached. */
export const CACHE_TTL_SECONDS = 60 * 60 * 24

/** How many friends to keep (and draw) in the circle. */
export const MAX_FRIENDS = 24

/** Safety cap on how many pages of posts we page through per account. */
const MAX_PAGES = 20

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LensAccountLite {
  address: string
  handle: string
  name: string | null
  avatarUrl: string | null
}

export interface CircleProfile extends LensAccountLite {
  stats: {
    followers: number
    following: number
    posts: number
  }
}

export interface Friend {
  handle: string
  count: number
  address: string | null
  avatarUrl: string | null
  name: string | null
}

export interface CircleData {
  profile: CircleProfile
  friends: Friend[]
  totalMentions: number
  totalPostsAnalyzed: number
  daysAnalyzed: number
}

export class LensNotFoundError extends Error {
  constructor(handle: string) {
    super(`No Lens account found for "@${handle}"`)
    this.name = "LensNotFoundError"
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize whatever the user typed into a bare Lens local name.
 * Accepts: "stani", "@stani", "lens/stani", "@lens/stani", " Stani ".
 * Lens local names are lowercase alphanumeric plus `_`, `.`, `-`.
 */
export function sanitizeHandle(input: string): string {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/^lens\//, "")
    .replace(/[^a-z0-9_.-]/g, "")
    // A handle can't start or end with a separator — strip trailing sentence
    // punctuation like the "." in "@lens/0xjavi." at the end of a sentence.
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 60)
}

/** Turn a lens://, ipfs:// or ar:// URI into an https gateway URL. */
export function normalizeAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return url
    .replace("ipfs://", "https://ipfs.io/ipfs/")
    .replace("lens://", "https://api.grove.storage/")
    .replace("ar://", "https://arweave.net/")
}

/** Pull `@lens/handle` mentions out of post text. */
function extractHandles(content: string | null | undefined): string[] {
  if (!content) return []
  const matches = content.match(/@lens\/([a-z0-9_.-]+)/gi)
  if (!matches) return []
  return matches
    .map((m) =>
      m
        .replace(/@lens\//i, "")
        .toLowerCase()
        // Trailing "." / "-" / "_" is sentence punctuation, not part of the
        // handle — "@lens/0xjavi." must resolve to "0xjavi".
        .replace(/^[._-]+|[._-]+$/g, "")
    )
    .filter(Boolean)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Minimal GraphQL POST helper against the Lens endpoint, with a couple of
 * retries on transient failures (network blips, 429/5xx). Legitimate GraphQL
 * errors and 4xx (other than 429) fail fast — retrying them is pointless.
 */
async function lensQuery<T>(
  query: string,
  variables: Record<string, unknown> = {},
  attempts = 3
): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(LENS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
        // We cache via unstable_cache; don't double-cache at the fetch level.
        cache: "no-store",
      })

      // 429 / 5xx are transient — back off and retry.
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`Lens API responded ${res.status}`)
      }
      if (!res.ok) {
        throw new Error(`Lens API responded ${res.status}`)
      }

      const json = await res.json()
      if (json.errors?.length) {
        throw new Error(`Lens API error: ${json.errors[0]?.message ?? "unknown"}`)
      }
      return json.data as T
    } catch (err) {
      lastErr = err
      if (i < attempts - 1) await sleep(250 * (i + 1))
    }
  }
  throw lastErr
}

// ─────────────────────────────────────────────────────────────────────────────
// Account resolution
// ─────────────────────────────────────────────────────────────────────────────

const ACCOUNT_QUERY = /* GraphQL */ `
  query Account($localName: String!) {
    account(request: { username: { localName: $localName } }) {
      address
      username {
        localName
      }
      metadata {
        name
        picture
      }
    }
    accountStats(request: { username: { localName: $localName } }) {
      graphFollowStats {
        followers
        following
      }
      feedStats {
        posts
      }
    }
  }
`

interface AccountQueryResult {
  account: {
    address: string
    username: { localName: string } | null
    metadata: { name: string | null; picture: string | null } | null
  } | null
  accountStats: {
    graphFollowStats: { followers: number; following: number } | null
    feedStats: { posts: number } | null
  } | null
}

export async function resolveAccount(handle: string): Promise<CircleProfile> {
  const localName = sanitizeHandle(handle)
  if (!localName) throw new LensNotFoundError(handle)

  // The API very occasionally returns a null account under load even though the
  // handle exists (a 200 with no error). Try once more before giving up so a
  // valid handle never gets a spurious "not found".
  let data = await lensQuery<AccountQueryResult>(ACCOUNT_QUERY, { localName })
  if (!data.account) {
    await sleep(300)
    data = await lensQuery<AccountQueryResult>(ACCOUNT_QUERY, { localName })
  }

  const account = data.account
  if (!account || !account.username) {
    throw new LensNotFoundError(localName)
  }

  return {
    address: account.address,
    handle: account.username.localName,
    name: account.metadata?.name ?? null,
    avatarUrl: normalizeAvatarUrl(account.metadata?.picture),
    stats: {
      followers: data.accountStats?.graphFollowStats?.followers ?? 0,
      following: data.accountStats?.graphFollowStats?.following ?? 0,
      posts: data.accountStats?.feedStats?.posts ?? 0,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Affinity extraction — page through posts, tally who they engage with.
// ─────────────────────────────────────────────────────────────────────────────

const POSTS_QUERY = /* GraphQL */ `
  query PostsByAuthor($author: EvmAddress!, $cursor: Cursor) {
    posts(
      request: {
        filter: {
          authors: [$author]
          postTypes: [ROOT, QUOTE, COMMENT, REPOST]
        }
        cursor: $cursor
      }
    ) {
      items {
        ... on Repost {
          id
          timestamp
          repostOf {
            author {
              username {
                localName
              }
            }
          }
        }
        ... on Post {
          id
          timestamp
          metadata {
            ... on TextOnlyMetadata {
              content
            }
            ... on ArticleMetadata {
              content
            }
            ... on ImageMetadata {
              content
            }
            ... on VideoMetadata {
              content
            }
            ... on AudioMetadata {
              content
            }
            ... on LinkMetadata {
              content
            }
            ... on LivestreamMetadata {
              content
            }
            ... on MintMetadata {
              content
            }
            ... on SpaceMetadata {
              content
            }
            ... on StoryMetadata {
              content
            }
            ... on ThreeDMetadata {
              content
            }
            ... on TransactionMetadata {
              content
            }
          }
          commentOn {
            author {
              username {
                localName
              }
            }
          }
          quoteOf {
            author {
              username {
                localName
              }
            }
          }
        }
      }
      pageInfo {
        next
      }
    }
  }
`

interface PostItem {
  id: string
  timestamp: string
  repostOf?: { author?: { username?: { localName?: string } | null } | null } | null
  metadata?: { content?: string | null } | null
  commentOn?: { author?: { username?: { localName?: string } | null } | null } | null
  quoteOf?: { author?: { username?: { localName?: string } | null } | null } | null
}

interface PostsQueryResult {
  posts: {
    items: PostItem[]
    pageInfo: { next: string | null }
  }
}

/**
 * Returns a map of handle -> mention count, plus how many posts were scanned.
 * "Affinity" = comment target + repost target + quote target + @-mentions in text.
 *
 * The window is anchored to the account's MOST RECENT post rather than the wall
 * clock: for an active account that's identical to "the last 30 days", but for a
 * dormant one it surfaces their most recent 30 days of activity instead of an
 * empty circle. Anchor is capped at "now" so future timestamps can't widen it.
 */
async function tallyAffinity(
  address: string,
  selfHandle: string
): Promise<{ counts: Map<string, number>; postsAnalyzed: number }> {
  const counts = new Map<string, number>()

  let cursor: string | null = null
  let page = 0
  let postsAnalyzed = 0
  let cutoff: number | null = null

  const bump = (handle: string | undefined | null) => {
    if (!handle) return
    const h = handle.toLowerCase()
    if (h === selfHandle) return
    counts.set(h, (counts.get(h) ?? 0) + 1)
  }

  while (page < MAX_PAGES) {
    const data: PostsQueryResult = await lensQuery<PostsQueryResult>(POSTS_QUERY, {
      author: address,
      cursor,
    })

    const items = data.posts?.items ?? []
    if (items.length === 0) break

    // Anchor the window to the newest post the first time we see data.
    if (cutoff === null) {
      const newest = Math.min(Date.now(), new Date(items[0].timestamp).getTime())
      cutoff = newest - DAYS_TO_ANALYZE * 24 * 60 * 60 * 1000
    }

    const recent = items.filter((p) => new Date(p.timestamp).getTime() >= cutoff!)

    for (const post of recent) {
      postsAnalyzed++
      bump(post.repostOf?.author?.username?.localName)
      bump(post.commentOn?.author?.username?.localName)
      bump(post.quoteOf?.author?.username?.localName)
      for (const h of extractHandles(post.metadata?.content)) bump(h)
    }

    // Posts come newest-first; once a page contains anything older than the
    // cutoff, everything after it is older too — stop paging.
    if (recent.length < items.length) break

    cursor = data.posts.pageInfo.next
    if (!cursor) break
    page++
  }

  return { counts, postsAnalyzed }
}

// ─────────────────────────────────────────────────────────────────────────────
// Batch avatar resolution for the top friends (one aliased query).
// ─────────────────────────────────────────────────────────────────────────────

interface FriendAccount {
  address: string
  username: { localName: string } | null
  metadata: { name: string | null; picture: string | null } | null
}

// The Lens API rejects any query with more than 10 top-level aliases, so we
// resolve friends in chunks of this size (run concurrently).
const ALIAS_CHUNK = 10

type ResolvedFriend = { address: string; name: string | null; avatarUrl: string | null }

async function resolveFriendChunk(
  chunk: string[]
): Promise<Array<[string, ResolvedFriend]>> {
  const fields = chunk
    .map(
      (h, i) => `
    f${i}: account(request: { username: { localName: "${sanitizeHandle(h)}" } }) {
      address
      username { localName }
      metadata { name picture }
    }`
    )
    .join("\n")

  const query = `query BatchFriends {${fields}\n}`
  const entries: Array<[string, ResolvedFriend]> = []

  try {
    const data = await lensQuery<Record<string, FriendAccount | null>>(query)
    chunk.forEach((h, i) => {
      const acc = data[`f${i}`]
      if (acc?.username) {
        entries.push([
          h.toLowerCase(),
          {
            address: acc.address,
            name: acc.metadata?.name ?? null,
            avatarUrl: normalizeAvatarUrl(acc.metadata?.picture),
          },
        ])
      }
    })
  } catch (err) {
    // A failed chunk just means those friends render with initial fallbacks.
    console.error("⚠️ Friend avatar chunk failed:", err)
  }

  return entries
}

async function resolveFriendAccounts(
  handles: string[]
): Promise<Map<string, ResolvedFriend>> {
  if (handles.length === 0) return new Map()

  const chunks: string[][] = []
  for (let i = 0; i < handles.length; i += ALIAS_CHUNK) {
    chunks.push(handles.slice(i, i + ALIAS_CHUNK))
  }

  // One round-trip per chunk of 10, all in flight at once.
  const results = await Promise.all(chunks.map(resolveFriendChunk))
  return new Map(results.flat())
}

// ─────────────────────────────────────────────────────────────────────────────
// The one entry point the API route calls.
// ─────────────────────────────────────────────────────────────────────────────

export async function computeCircle(rawHandle: string): Promise<CircleData> {
  const handle = sanitizeHandle(rawHandle)
  console.log(`🚀 Computing Circle of Affinity for @${handle}`)

  const profile = await resolveAccount(handle)

  const { counts, postsAnalyzed } = await tallyAffinity(profile.address, profile.handle)

  const sorted = [...counts.entries()]
    .map(([h, count]) => ({ handle: h, count }))
    .sort((a, b) => b.count - a.count)

  const totalMentions = sorted.reduce((sum, m) => sum + m.count, 0)
  const top = sorted.slice(0, MAX_FRIENDS)

  const accounts = await resolveFriendAccounts(top.map((f) => f.handle))

  const friends: Friend[] = top.map((f) => {
    const acc = accounts.get(f.handle)
    return {
      handle: f.handle,
      count: f.count,
      address: acc?.address ?? null,
      avatarUrl: acc?.avatarUrl ?? null,
      name: acc?.name ?? null,
    }
  })

  console.log(
    `✅ @${handle}: ${friends.length} friends from ${postsAnalyzed} posts (${totalMentions} signals)`
  )

  return {
    profile,
    friends,
    totalMentions,
    totalPostsAnalyzed: postsAnalyzed,
    daysAnalyzed: DAYS_TO_ANALYZE,
  }
}
