"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2, Sparkles } from "lucide-react"
import { sanitizeHandle } from "@/lib/lens"

const EXAMPLES = ["0xjavi", "stani", "lens", "carlosbeltran", "wagmi"]

interface Props {
  /** Prefill the input (used on the circle page's inline search). */
  initial?: string
  autoFocus?: boolean
}

export function HandleSearch({ initial = "", autoFocus = false }: Props) {
  const router = useRouter()
  const [value, setValue] = useState(initial)
  const [pending, startTransition] = useTransition()

  const go = (raw: string) => {
    const handle = sanitizeHandle(raw)
    if (!handle) return
    startTransition(() => router.push(`/circle/${encodeURIComponent(handle)}`))
  }

  return (
    <div className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          go(value)
        }}
        className="group relative flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-abyss)]/80 p-2 shadow-2xl backdrop-blur transition focus-within:border-[var(--color-violet)]"
      >
        <span className="pl-3 text-lg font-medium text-[var(--color-ink-muted)] select-none">
          @
        </span>
        <input
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="lens handle…"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          enterKeyHint="go"
          aria-label="Lens handle"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-lg text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || !sanitizeHandle(value)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--color-violet-deep)] to-[var(--color-violet)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span className="hidden sm:inline">Reveal circle</span>
              <span className="sm:hidden">Go</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-[var(--color-ink-muted)]">
          <Sparkles className="h-3 w-3" /> Try
        </span>
        {EXAMPLES.map((h) => (
          <button
            key={h}
            onClick={() => go(h)}
            disabled={pending}
            className="rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface)]/60 px-3 py-1 text-xs text-[var(--color-ink-soft)] transition hover:border-[var(--color-violet)] hover:text-[var(--color-ink)] disabled:opacity-50"
          >
            @{h}
          </button>
        ))}
      </div>
    </div>
  )
}
