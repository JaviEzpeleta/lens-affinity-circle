"use client"

import { use, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { toPng } from "html-to-image"
import {
  ArrowLeft,
  Download,
  Loader2,
  Users,
  Sparkles,
  FileText,
  CalendarRange,
} from "lucide-react"
import type { CircleData } from "@/lib/lens"
import { proxied, initial } from "@/lib/image"
import { AffinityCircleGraph } from "@/components/AffinityCircleGraph"
import { HandleSearch } from "@/components/HandleSearch"

type Status = "loading" | "ok" | "empty" | "notfound" | "error"

export default function CirclePage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle: rawHandle } = use(params)
  const handle = decodeURIComponent(rawHandle)

  const [status, setStatus] = useState<Status>("loading")
  const [data, setData] = useState<CircleData | null>(null)
  const [message, setMessage] = useState("")

  // Responsive square size for the graph, driven by its container width.
  const graphWrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(520)

  // Ref around the shareable card, for PNG export.
  const captureRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setStatus("loading")
    setData(null)

    fetch("/api/circle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle }),
    })
      .then(async (res) => {
        const json = await res.json()
        if (cancelled) return
        if (res.ok && json.data) {
          const d = json.data as CircleData
          setData(d)
          setStatus(d.friends.length === 0 ? "empty" : "ok")
        } else if (res.status === 404) {
          setStatus("notfound")
          setMessage(json.error || `No Lens account found for @${handle}`)
        } else {
          setStatus("error")
          setMessage(json.error || "Something went wrong.")
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error")
          setMessage("Network error. Please try again.")
        }
      })

    return () => {
      cancelled = true
    }
  }, [handle])

  useEffect(() => {
    const el = graphWrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width
      setSize(Math.max(300, Math.min(660, Math.floor(w))))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [status])

  const handleDownload = async () => {
    if (!captureRef.current) return
    try {
      setExporting(true)
      // Give avatar <image> elements a beat to finish loading before capture.
      await new Promise((r) => setTimeout(r, 600))
      const dataUrl = await toPng(captureRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
        backgroundColor: "#07060d",
      })
      const link = document.createElement("a")
      link.download = `${handle}-circle-of-affinity.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error("❌ PNG export failed:", err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:py-10">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-display font-medium text-[var(--color-ink)]">Circle of Affinity</span>
        </Link>

        {status === "ok" && (
          <button
            onClick={handleDownload}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-3.5 py-2 text-sm font-medium text-[var(--color-ink-soft)] transition hover:border-[var(--color-violet)] hover:text-[var(--color-ink)] disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Download PNG</span>
          </button>
        )}
      </div>

      {status === "loading" && <LoadingState handle={handle} />}

      {(status === "notfound" || status === "error") && (
        <ErrorState handle={handle} message={message} />
      )}

      {status === "empty" && data && <EmptyState data={data} />}

      {status === "ok" && data && (
        <div className="space-y-6">
          {/* Shareable card: header + graph */}
          {/* `dark` pins this card to the dark palette regardless of page theme
              — the graph is a dark "stage" and the exported PNG stays consistent. */}
          <div
            ref={captureRef}
            className="dark overflow-hidden rounded-3xl border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-abyss)] to-[var(--color-void)] p-5 sm:p-7"
          >
            <ProfileHeader data={data} />
            <div ref={graphWrapRef} className="mt-4 flex justify-center">
              <AffinityCircleGraph data={data} size={size} />
            </div>
            <p className="mt-2 text-center text-[11px] text-[var(--color-ink-muted)]/70">
              circle-of-affinity · lens
            </p>
          </div>

          <StatsRow data={data} />
          <TopFriends data={data} />

          {/* Explore another */}
          <div className="panel rounded-2xl p-5">
            <p className="mb-3 text-sm font-medium text-[var(--color-ink-soft)]">
              Explore another circle
            </p>
            <HandleSearch />
          </div>
        </div>
      )}
    </main>
  )
}

/* ─────────────────────────── sub-components ─────────────────────────── */

function ProfileHeader({ data }: { data: CircleData }) {
  const { profile } = data
  const src = proxied(profile.avatarUrl)
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-amber)] to-[var(--color-rose)] sm:h-16 sm:w-16">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={profile.handle} className="h-full w-full object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[var(--color-void)]">
            {initial(profile.handle)}
          </div>
        )}
      </div>
      <div className="min-w-0">
        {profile.name && (
          <h2 className="truncate text-lg font-semibold text-[var(--color-ink)] sm:text-xl">
            {profile.name}
          </h2>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--color-violet)]">
            @{profile.handle}
          </span>
          {/* View this profile on the two main Lens clients — the Lensie pattern. */}
          <a
            href={`https://palus.app/u/${profile.handle}`}
            target="_blank"
            rel="noreferrer"
            title="View on Palus"
            aria-label="View on Palus"
            className="grayscale transition hover:scale-110 hover:grayscale-0 active:scale-95"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/palus.svg" alt="Palus" draggable={false} className="h-4 w-4" />
          </a>
          <a
            href={`https://orb.club/@${profile.handle}`}
            target="_blank"
            rel="noreferrer"
            title="View on Orb"
            aria-label="View on Orb"
            className="grayscale transition hover:scale-110 hover:grayscale-0 active:scale-95"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/orb-logo.jpg"
              alt="Orb"
              draggable={false}
              className="h-4 w-4 rounded-[3px]"
            />
          </a>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--color-ink-muted)]">
          <span>
            <b className="text-[var(--color-ink-soft)]">{formatNum(profile.stats.followers)}</b> followers
          </span>
          <span>
            <b className="text-[var(--color-ink-soft)]">{formatNum(profile.stats.following)}</b> following
          </span>
          <span>
            <b className="text-[var(--color-ink-soft)]">{formatNum(profile.stats.posts)}</b> posts
          </span>
        </div>
      </div>
    </div>
  )
}

function StatsRow({ data }: { data: CircleData }) {
  const stats = [
    { icon: Users, label: "Friends", value: data.friends.length },
    { icon: Sparkles, label: "Affinity signals", value: data.totalMentions },
    { icon: FileText, label: "Posts analyzed", value: data.totalPostsAnalyzed },
    { icon: CalendarRange, label: "Window", value: `${data.daysAnalyzed}d` },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ icon: Icon, label, value }) => (
        <div key={label} className="panel rounded-2xl p-4">
          <Icon className="mb-2 h-4 w-4 text-[var(--color-violet)]" />
          <div className="text-2xl font-bold text-[var(--color-ink)]">{value}</div>
          <div className="text-xs text-[var(--color-ink-muted)]">{label}</div>
        </div>
      ))}
    </div>
  )
}

function TopFriends({ data }: { data: CircleData }) {
  const max = Math.max(...data.friends.map((f) => f.count), 1)
  return (
    <div className="panel rounded-2xl p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
        <Sparkles className="h-4 w-4 text-[var(--color-violet)]" />
        Closest connections
      </h3>
      <ol className="space-y-1.5">
        {data.friends.map((f, i) => {
          const src = proxied(f.avatarUrl)
          return (
            <li key={f.handle}>
              <Link
                href={`/circle/${encodeURIComponent(f.handle)}`}
                className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-[var(--color-surface)]/70"
              >
                <span className="w-5 shrink-0 text-center text-xs font-bold text-[var(--color-ink-muted)]">
                  {i + 1}
                </span>
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[var(--color-violet)] to-[var(--color-cyan)]">
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={f.handle} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[var(--color-void)]">
                      {initial(f.handle)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)]">
                    @{f.handle}
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-violet)] to-[var(--color-cyan)]"
                      style={{ width: `${(f.count / max) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-xs text-[var(--color-ink-muted)]">
                  {f.count}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function LoadingState({ handle }: { handle: string }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-6 text-center">
      <div className="relative h-32 w-32">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-dashed border-[var(--color-border)]" style={{ animationDuration: "8s" }} />
        <div className="absolute inset-4 animate-spin rounded-full border-2 border-dashed border-[var(--color-border)]" style={{ animationDuration: "5s", animationDirection: "reverse" }} />
        <div className="absolute inset-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-gradient-to-br from-[var(--color-amber)] to-[var(--color-rose)]" />
      </div>
      <div>
        <p className="text-lg font-medium text-[var(--color-ink)]">
          Mapping <span className="text-[var(--color-violet)]">@{handle}</span>&apos;s circle…
        </p>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Reading recent posts, reposts & mentions from Lens
        </p>
      </div>
    </div>
  )
}

function ErrorState({ handle, message }: { handle: string; message: string }) {
  return (
    <div className="flex min-h-[55dvh] flex-col items-center justify-center gap-5 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-3xl">
        🫥
      </div>
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-ink)]">
          No circle for @{handle}
        </h2>
        <p className="mt-1 max-w-sm text-sm text-[var(--color-ink-muted)]">{message}</p>
      </div>
      <div className="w-full max-w-md">
        <HandleSearch autoFocus />
      </div>
    </div>
  )
}

function EmptyState({ data }: { data: CircleData }) {
  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-5 text-center">
      <ProfileHeader data={data} />
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-3xl">
        🌱
      </div>
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-ink)]">
          No circle yet
        </h2>
        <p className="mt-1 max-w-sm text-sm text-[var(--color-ink-muted)]">
          @{data.profile.handle} hasn&apos;t mentioned, reposted or replied to
          anyone in their recent activity.
        </p>
      </div>
      <div className="w-full max-w-md">
        <HandleSearch />
      </div>
    </div>
  )
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  return String(n)
}
