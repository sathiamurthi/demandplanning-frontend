// Map provider abstraction — every screen renders <LiveMap ...LiveMapProps />
// and never imports Leaflet (or, later, Google Maps) directly. Swapping the
// underlying provider after MVP is a one-line change here, not a rewrite of
// every screen that shows a map.
//
// Leaflet/OpenStreetMap is the default: free, already proven elsewhere in
// this codebase (Ride360's RideMap component). Google Maps is the natural
// upgrade if/when better India traffic/ETA data matters more than cost —
// implement GoogleLiveMap behind the exact same LiveMapProps and flip
// NEXT_PUBLIC_MAP_PROVIDER, no call-site changes required.
export type MapProviderName = "leaflet" | "google";

export function activeMapProvider(): MapProviderName {
  const v = (process.env.NEXT_PUBLIC_MAP_PROVIDER || "leaflet").toLowerCase();
  return v === "google" ? "google" : "leaflet";
}

export interface LiveStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** done = every passenger at this stop already picked/dropped; upcoming = still pending. */
  state: "done" | "upcoming";
}

export interface LiveMapProps {
  /** Current vehicle position — the map re-centers/follows this as it updates, it does not just place a static marker. */
  driverPosition: { lat: number; lng: number } | null;
  driverLabel?: string;
  stops: LiveStop[];
  height?: string;
  /** Turn off auto-follow if the viewer has manually panned/zoomed and shouldn't be yanked back. */
  autoFollow?: boolean;
}
