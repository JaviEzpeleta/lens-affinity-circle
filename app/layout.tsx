import type { Metadata, Viewport } from "next"
import "./globals.css"

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
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbbf24"/><stop offset="0.5" stop-color="#a78bfa"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs><circle cx="16" cy="16" r="7" fill="url(#g)"/><circle cx="26" cy="9" r="3" fill="#a78bfa"/><circle cx="7" cy="24" r="3" fill="#22d3ee"/><circle cx="25" cy="24" r="2.4" fill="#fb7185"/></svg>`
          ),
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: "#07060d",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
