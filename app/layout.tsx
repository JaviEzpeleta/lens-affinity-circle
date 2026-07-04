import type { Metadata, Viewport } from "next"
import { Fraunces, Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"

// Editorial display serif for the wordmark + headlines.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
})

// Clean grotesque for all UI / body copy.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const title = "Circle of Affinity — Lens"
const description =
  "Type a Lens handle and watch its Circle of Affinity bloom — the accounts they mention, comment on and repost the most, over the last 30 days. No login, no wallet, no database."

export const metadata: Metadata = {
  title,
  description,
  applicationName: "Circle of Affinity",
  authors: [{ name: "Javier Ezpeleta" }],
  keywords: ["Lens", "Lens Protocol", "social graph", "affinity", "web3"],
  openGraph: {
    title,
    description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  icons: {
    icon: [
      {
        url:
          "data:image/svg+xml," +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="4.5" fill="none" stroke="#17161a" stroke-width="1.6"/><circle cx="16" cy="5" r="2.2" fill="#3b4de0"/><circle cx="25.5" cy="10.5" r="2.2" fill="#17161a"/><circle cx="25.5" cy="21.5" r="2.2" fill="#3b4de0"/><circle cx="16" cy="27" r="2.2" fill="#17161a"/><circle cx="6.5" cy="21.5" r="2.2" fill="#3b4de0"/><circle cx="6.5" cy="10.5" r="2.2" fill="#17161a"/></svg>`
          ),
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e10" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
