import { HandleSearch } from "@/components/HandleSearch"
import {
  MessageCircle,
  Repeat2,
  AtSign,
  Code2,
  Lock,
  Github,
  Plus,
} from "lucide-react"

/* Six-node ring mark used in the nav + favicon. */
function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle
        cx="16"
        cy="16"
        r="4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="16" cy="4.5" r="2.1" className="fill-[var(--color-node)]" />
      <circle cx="25.9" cy="10.2" r="2.1" fill="currentColor" />
      <circle cx="25.9" cy="21.8" r="2.1" className="fill-[var(--color-node)]" />
      <circle cx="16" cy="27.5" r="2.1" fill="currentColor" />
      <circle cx="6.1" cy="21.8" r="2.1" className="fill-[var(--color-node)]" />
      <circle cx="6.1" cy="10.2" r="2.1" fill="currentColor" />
    </svg>
  )
}

/* Official Lens glyph — used in the "Built on Lens" badge. */
function LensGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 13" className={className} fill="none" aria-hidden>
      <path
        d="M16.22 2.56C15.28 2.56 14.43 2.93 13.79 3.52L13.72 3.49C13.58 1.54 11.99 0 10 0C8.01 0 6.42 1.54 6.28 3.49L6.21 3.52C5.57 2.93 4.72 2.56 3.78 2.56C1.69 2.56 0 4.25 0 6.35C0 8.15 1.79 9.7 2.24 10.06C4.33 11.73 7.06 12.7 10 12.7C12.94 12.7 15.67 11.73 17.76 10.06C18.21 9.7 20 8.16 20 6.35C20 4.25 18.31 2.56 16.22 2.56H16.22Z"
        fill="currentColor"
      />
    </svg>
  )
}

/* Line-art orbit — the quiet promise of the circle to come. */
function OrbitMotif() {
  return (
    <div
      aria-hidden
      className="animate-float-slow pointer-events-none relative mx-auto mb-2 w-full max-w-[340px]"
    >
      <svg viewBox="0 0 300 170" className="h-auto w-full overflow-visible">
        {/* Wide orbital ellipse */}
        <ellipse
          cx="150"
          cy="85"
          rx="135"
          ry="58"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1"
        />
        {/* Dashed inner ring */}
        <circle
          cx="150"
          cy="85"
          r="54"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1"
          strokeDasharray="2 6"
        />
        {/* Hollow centre */}
        <circle
          cx="150"
          cy="85"
          r="24"
          fill="var(--color-surface)"
          stroke="var(--color-ink)"
          strokeWidth="1.4"
        />

        {/* Static accent nodes sitting on the wide ellipse */}
        <circle cx="20" cy="100" r="5" className="fill-[var(--color-node)]" />
        <circle cx="278" cy="103" r="5" className="fill-[var(--color-node)]" />

        {/* Nodes that slowly orbit the centre */}
        <g
          className="animate-orbit"
          style={{ transformBox: "view-box", transformOrigin: "150px 85px" }}
        >
          <circle cx="99" cy="66" r="6" className="fill-[var(--color-node)]" />
          <circle cx="191" cy="50" r="5.5" className="fill-[var(--color-node)]" />
          <circle cx="159" cy="138" r="5" className="fill-[var(--color-node)]" />
        </g>
      </svg>
    </div>
  )
}

const STEPS = [
  {
    icon: MessageCircle,
    title: "Comments & replies",
    body: "Every account they reply to earns a point of affinity.",
  },
  {
    icon: Repeat2,
    title: "Reposts & quotes",
    body: "Amplifying someone counts too — the strongest of signals.",
  },
  {
    icon: AtSign,
    title: "@lens mentions",
    body: "Name-drops in post text are tallied from their writing.",
  },
]

const FAQS = [
  {
    q: "What counts as affinity?",
    a: "Every reply, repost, quote and @mention over the last 90 days earns the mentioned account a point. The more someone engages with you, the closer they orbit your centre.",
  },
  {
    q: "Do I need a wallet or a login?",
    a: "No. Circle of Affinity reads the public Lens GraphQL API directly in your browser. Nothing is signed, nothing is connected.",
  },
  {
    q: "Is any of this stored?",
    a: "There's no database. Each circle is computed live from public posts and forgotten the moment you leave.",
  },
  {
    q: "Whose circle can I look up?",
    a: "Any Lens handle. Type it in, hit reveal, and follow the graph — clicking any node dives into that account's own circle.",
  },
]

function Nav() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
      <a href="/" className="flex items-center gap-2.5">
        <LogoMark className="h-7 w-7 text-[var(--color-ink)]" />
        <span className="font-display text-lg font-medium tracking-tight text-[var(--color-ink)]">
          Circle of Affinity
        </span>
      </a>

      <nav className="hidden items-center gap-8 text-sm text-[var(--color-ink-soft)] md:flex">
        <a href="#how-it-works" className="transition hover:text-[var(--color-ink)]">
          How it works
        </a>
        <a
          href="https://lens.xyz"
          target="_blank"
          rel="noreferrer"
          className="transition hover:text-[var(--color-ink)]"
        >
          About Lens
        </a>
        <a href="#faq" className="transition hover:text-[var(--color-ink)]">
          FAQ
        </a>
      </nav>

      <a
        href="https://lens.xyz"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-ink-muted)]"
      >
        <LensGlyph className="w-[18px] text-emerald-600 dark:text-emerald-400" />
        <span>Built on Lens</span>
      </a>
    </header>
  )
}

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />

      <main className="animate-rise flex w-full flex-1 flex-col items-center px-6 pb-16">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="flex w-full max-w-2xl flex-col items-center pt-6 text-center sm:pt-10">
          <OrbitMotif />

          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs text-[var(--color-ink-soft)]">
            <Code2 className="h-3.5 w-3.5 text-[var(--color-accent)]" />
            Powered by the public Lens GraphQL API · no login needed
          </span>

          <h1 className="font-display mt-6 text-balance text-5xl font-medium leading-[0.98] tracking-tight text-[var(--color-ink)] sm:text-7xl">
            Circle of Affinity
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-[var(--color-ink-soft)] sm:text-lg">
            Type any Lens handle and watch its circle bloom — the accounts it
            <span className="text-[var(--color-ink)]">
              {" "}
              mentions, comments on and reposts{" "}
            </span>
            the most over the last 90 days.
          </p>

          <div className="mt-9 w-full max-w-xl">
            <HandleSearch autoFocus />
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────── */}
        <section
          id="how-it-works"
          className="mt-24 w-full max-w-5xl scroll-mt-8"
        >
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-medium tracking-tight text-[var(--color-ink)] sm:text-3xl">
              How affinity is measured
            </h2>
            <span className="hidden text-sm text-[var(--color-ink-muted)] sm:block">
              Three signals, one circle
            </span>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-[var(--color-surface)] p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-accent)]">
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section id="faq" className="mt-24 w-full max-w-2xl scroll-mt-8">
          <h2 className="font-display mb-6 text-2xl font-medium tracking-tight text-[var(--color-ink)] sm:text-3xl">
            Questions
          </h2>
          <div className="border-t border-[var(--color-border)]">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group border-b border-[var(--color-border)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-[var(--color-ink)] transition hover:text-[var(--color-accent)]">
                  {q}
                  <Plus className="h-4 w-4 shrink-0 text-[var(--color-ink-muted)] transition-transform duration-200 group-open:rotate-45" />
                </summary>
                <p className="pb-4 pr-8 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--color-border)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-6 py-8 text-center">
          <p className="inline-flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
            <Lock className="h-3.5 w-3.5" />
            No sign up. No wallet. Just insights from the Lens social graph.
          </p>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Open-sourced from{" "}
            <a
              href="https://lensie.xyz"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-dotted underline-offset-4 hover:text-[var(--color-ink)]"
            >
              Lensie
            </a>
            {" · "}
            <a
              href="https://github.com/JaviEzpeleta/lens-affinity-circle"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-4 hover:text-[var(--color-ink)]"
            >
              <Github className="h-3 w-3" /> View source
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
