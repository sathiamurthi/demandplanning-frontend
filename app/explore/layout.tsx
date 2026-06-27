import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f97316",
};

export const metadata: Metadata = {
  title: "Nexus OS — AI Daily Companion",
  description: "Expenses · Nearby Search · Services · Trip Planner · Fashion · Education — all in one free app.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nexus OS",
  },
  icons: {
    icon: [
      { url: "/nexus-icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/nexus-icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/nexus-icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Nexus OS",
    "msapplication-TileColor": "#f97316",
    "msapplication-tap-highlight": "no",
  },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
