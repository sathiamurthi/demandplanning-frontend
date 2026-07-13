import type { EmptyRideAnalysis, GeoPoint } from "./types";

/** Great-circle distance between two points, in kilometers. */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

/** Free, keyless address search via OpenStreetMap Nominatim. */
export async function searchAddress(query: string): Promise<GeoPoint[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data as any[]).map(d => ({ lat: parseFloat(d.lat), lng: parseFloat(d.lon), address: d.display_name as string }));
}

/** Free, keyless reverse geocoding via OpenStreetMap Nominatim. */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

// ── Cost model constants (reasonable India-average defaults) ────────────────
const FUEL_PRICE_PER_L = 96; // ₹/L petrol
const MILEAGE_KM_PER_L = 22; // auto/small-cab average
const AVG_FARE_PER_KM = 14; // ₹/km typical short-hop fare, used for opportunity cost

export function analyzeEmptyRide(distanceKm: number): EmptyRideAnalysis {
  const fuelCost = (distanceKm / MILEAGE_KM_PER_L) * FUEL_PRICE_PER_L;
  const opportunityCost = distanceKm * AVG_FARE_PER_KM;
  const totalLoss = fuelCost + opportunityCost;
  const tip =
    totalLoss > 150
      ? `This empty run is costing ~₹${Math.round(totalLoss)} in fuel and lost fare potential. Check nearby requests below before you drive further empty.`
      : `Empty run costing ~₹${Math.round(totalLoss)} so far. Still within a reasonable range, but nearby requests could offset it entirely.`;
  return { fuelCost: Math.round(fuelCost), opportunityCost: Math.round(opportunityCost), totalLoss: Math.round(totalLoss), tip };
}

export function estimateFare(distanceKm: number): number {
  return Math.round(distanceKm * AVG_FARE_PER_KM + 20); // + base fare
}

export function piggyContribution(fare: number, pct: number): number {
  return Math.round((fare * pct) / 100);
}
