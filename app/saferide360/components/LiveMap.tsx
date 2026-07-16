"use client";

import dynamic from "next/dynamic";
import { activeMapProvider, type LiveMapProps } from "../lib/mapProvider";

// Leaflet touches `window` at import time, so it must be a client-only
// dynamic import (no SSR) regardless of which provider ends up active.
const LeafletLiveMap = dynamic(() => import("./LeafletLiveMap"), { ssr: false });

// Swap point for a paid provider after MVP: add `const GoogleLiveMap =
// dynamic(() => import("./GoogleLiveMap"), { ssr: false });` and a case
// below — every caller of <LiveMap .../> is unaffected.
export default function LiveMap(props: LiveMapProps) {
  const provider = activeMapProvider();
  if (provider === "google") {
    // Not implemented yet — falls back to Leaflet rather than rendering
    // nothing, so flipping the env var early doesn't silently break the map.
    return <LeafletLiveMap {...props} />;
  }
  return <LeafletLiveMap {...props} />;
}
