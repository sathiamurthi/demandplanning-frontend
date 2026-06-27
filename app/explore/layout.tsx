import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f97316",
};

export const metadata: Metadata = {
  title: "DemandGenius — AI Life Dashboard",
  description: "Nearby Search · Expenses · Services · Trip Planner · Store Management — all in one free app.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DemandGenius",
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
    "apple-mobile-web-app-title": "DemandGenius",
    "msapplication-TileColor": "#f97316",
    "msapplication-tap-highlight": "no",
  },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
