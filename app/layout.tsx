import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Bebas_Neue, DM_Sans, JetBrains_Mono } from "next/font/google"

// ─── FONTS ────────────────────────────────────────────────────────────────────
// Display — cinematic titles, headlines, stats
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
  display: "swap",
})

// Body — descriptors, paragraphs, UI text
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  variable: "--font-sans",
  display: "swap",
})

// Mono — labels, badges, nav items, buttons, captions
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-mono",
  display: "swap",
})

// ─── SITE ─────────────────────────────────────────────────────────────────────
const SITE_URL = "https://seyon.ai"

// ─── METADATA ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Seyon Art Director",
    template: "%s — Seyon",
  },

  description: "AI-powered creative studio. Generate production-ready visuals with expert personas.",
  applicationName: "Seyon Art Director",

  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },

  referrer: "origin-when-cross-origin",

  icons: {
    icon: [{ url: "/favicon.ico" }],
    apple: [{ url: "/logo.png", sizes: "180x180" }],
  },

  openGraph: {
    type: "website",
    siteName: "Seyon Art Director",
    title: "Seyon Art Director",
    description: "AI-powered creative studio. Generate production-ready visuals with expert personas.",
    url: SITE_URL,
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Seyon Art Director",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Seyon Art Director — Beta v0.89",
    description: "AI-powered creative studio. Generate production-ready visuals with expert personas.",
    images: ["/logo.png"],
  },

  appleWebApp: {
    capable: true,
    title: "Seyon",
    statusBarStyle: "black-translucent",
  },
}

// ─── VIEWPORT ─────────────────────────────────────────────────────────────────
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#06060E",
  colorScheme: "dark",
}

// ─── ROOT LAYOUT ──────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={[
          bebasNeue.variable,
          dmSans.variable,
          jetbrainsMono.variable,
          "min-h-screen antialiased",
        ].join(" ")}
        style={{
          background: "#06060E",
          color: "#EDE9DF",
          // Apply font variables as defaults so components can use them via CSS var
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  )
}