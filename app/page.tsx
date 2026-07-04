import { HandleSearch } from "@/components/HandleSearch"
import { MessageCircle, Repeat2, AtSign, Github } from "lucide-react"

function OrbitMotif() {
  // Purely decorative constellation that hints at the circle to come.
  return (
    <div
      aria-hidden
      className="animate-float-slow pointer-events-none relative mx-auto mb-8 h-28 w-28 sm:h-32 sm:w-32"
    >
      <svg viewBox="0 0 140 140" className="h-full w-full overflow-visible">
        <defs>
          <radialGradient id="hero-center" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#fb7185" />
          </radialGradient>
          <radialGradient id="hero-friend" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="100%" stopColor="#0891b2" />
          </radialGradient>
        </defs>
        <circle cx="70" cy="70" r="44" fill="none" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="2 6" />
        <circle cx="70" cy="70" r="62" fill="none" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="2 6" />
        <line x1="70" y1="70" x2="114" y2="52" stroke="#a78bfa" strokeWidth="1" strokeOpacity="0.3" />
        <line x1="70" y1="70" x2="30" y2="96" stroke="#22d3ee" strokeWidth="1" strokeOpacity="0.3" />
        <line x1="70" y1="70" x2="96" y2="118" stroke="#fb7185" strokeWidth="1" strokeOpacity="0.3" />
        <circle cx="70" cy="70" r="20" fill="url(#hero-center)" />
        <circle cx="114" cy="52" r="11" fill="url(#hero-friend)" />
        <circle cx="30" cy="96" r="9" fill="url(#hero-friend)" />
        <circle cx="96" cy="118" r="7" fill="url(#hero-friend)" />
        <circle cx="26" cy="44" r="6" fill="url(#hero-friend)" />
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

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center px-5 py-14 sm:py-20">
      <section className="animate-rise flex w-full flex-col items-center text-center">
        <OrbitMotif />

        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface)]/50 px-3 py-1 text-xs text-[var(--color-ink-soft)]">
          Powered by the public Lens GraphQL API · no login
        </span>

        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          <span className="text-affinity-gradient">Circle of Affinity</span>
        </h1>

        <p className="mt-4 max-w-xl text-pretty text-base text-[var(--color-ink-soft)] sm:text-lg">
          Type any Lens handle and watch its circle bloom — the accounts it
          <span className="text-[var(--color-ink)]"> mentions, comments on and reposts </span>
          the most over the last 90 days.
        </p>

        <div className="mt-9 w-full max-w-xl">
          <HandleSearch autoFocus />
        </div>
      </section>

      <section className="mt-20 grid w-full gap-4 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="panel rounded-2xl p-5 text-left">
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-violet-deep)]/30 to-[var(--color-cyan)]/20 text-[var(--color-violet)]">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-muted)]">{body}</p>
          </div>
        ))}
      </section>

      <footer className="mt-20 flex flex-col items-center gap-3 text-center text-xs text-[var(--color-ink-muted)]">
        <p>
          Open-sourced from{" "}
          <a
            href="https://lensie.xyz"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--color-ink-soft)] underline decoration-dotted underline-offset-4 hover:text-[var(--color-ink)]"
          >
            Lensie
          </a>
          . No database, no wallet, no credentials.
        </p>
        <a
          href="https://github.com/JaviEzpeleta/lens-affinity-circle"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          <Github className="h-3.5 w-3.5" /> View source
        </a>
      </footer>
    </main>
  )
}
