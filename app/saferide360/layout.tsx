import type { Metadata, Viewport } from "next";

// Own manifest (not the /explore one) so SafeRide360 installs as its own
// distinct app — own name, icon set, start_url, scope — not lumped under a
// different product's PWA identity.
export const metadata: Metadata = {
  title: "SafeRide360 — Where is my child?",
  description: "Live pickup/drop tracking, notifications, and driver tools for safe school (and future) transport.",
  manifest: "/saferide360-manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
};

export default function SafeRide360Layout({ children }: { children: React.ReactNode }) {
  return children;
}
