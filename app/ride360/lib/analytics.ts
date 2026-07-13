import type { CustomerRequest, FuelLog, Ride } from "./types";

export interface MileageSegment {
  fromKm: number;
  toKm: number;
  kmDriven: number;
  liters: number;
  kmPerLiter: number;
  date: string;
}

/**
 * Real mileage between consecutive fuel fill-ups, using driver-entered odometer
 * readings rather than GPS distance — GPS/haversine is a straight-line estimate
 * and undercounts actual road distance, so it's not a reliable mileage source.
 */
export function computeMileageSegments(fuelLogs: FuelLog[]): MileageSegment[] {
  const sorted = [...fuelLogs].sort((a, b) => a.odometerKm - b.odometerKm);
  const segments: MileageSegment[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    const kmDriven = cur.odometerKm - prev.odometerKm;
    if (kmDriven <= 0 || cur.liters <= 0) continue;
    segments.push({ fromKm: prev.odometerKm, toKm: cur.odometerKm, kmDriven, liters: cur.liters, kmPerLiter: kmDriven / cur.liters, date: cur.date });
  }
  return segments;
}

export interface DriverAnalysis {
  ridesPaidCount: number;
  ridesEmptyCount: number;
  totalDistanceKm: number;
  totalFareEarned: number;
  totalPiggySaved: number;
  totalFuelLiters: number;
  totalFuelCost: number;
  avgMileageKmPerL: number | null;
  mileageSource: "odometer" | "estimated" | "none";
  emptyRidesTotal: number;
  emptyRidesReachedOut: number;
  emptyRidesConverted: number;
  conversionRatePct: number;
  rideConnectEarnings: number;
  suggestions: string[];
}

export function analyzeDriver(rides: Ride[], fuelLogs: FuelLog[], requests: CustomerRequest[]): DriverAnalysis {
  const completed = rides.filter(r => r.status === "completed");
  const paid = completed.filter(r => r.kind === "paid");
  const empty = completed.filter(r => r.kind === "empty");

  const totalDistanceKm = completed.reduce((s, r) => s + r.distanceKm, 0);
  const totalFareEarned = paid.reduce((s, r) => s + (r.fare || 0), 0);
  const totalPiggySaved = paid.reduce((s, r) => s + (r.piggyContribution || 0), 0);
  const totalFuelLiters = fuelLogs.reduce((s, f) => s + f.liters, 0);
  const totalFuelCost = fuelLogs.reduce((s, f) => s + f.totalCost, 0);

  const segments = computeMileageSegments(fuelLogs);
  let avgMileageKmPerL: number | null = null;
  let mileageSource: DriverAnalysis["mileageSource"] = "none";
  if (segments.length > 0) {
    const totalKm = segments.reduce((s, seg) => s + seg.kmDriven, 0);
    const totalL = segments.reduce((s, seg) => s + seg.liters, 0);
    avgMileageKmPerL = totalL > 0 ? totalKm / totalL : null;
    mileageSource = "odometer";
  } else if (totalFuelLiters > 0 && totalDistanceKm > 0) {
    avgMileageKmPerL = totalDistanceKm / totalFuelLiters;
    mileageSource = "estimated";
  }

  const requestsFromEmpty = requests.filter(r => r.originEmptyRideId);
  const emptyIdsReachedOut = new Set(requestsFromEmpty.map(r => r.originEmptyRideId));
  const emptyRidesReachedOut = empty.filter(r => emptyIdsReachedOut.has(r.id)).length;
  const convertedEmptyIds = new Set(requestsFromEmpty.filter(r => r.status === "completed").map(r => r.originEmptyRideId));
  const emptyRidesConverted = empty.filter(r => convertedEmptyIds.has(r.id)).length;
  const conversionRatePct = empty.length > 0 ? Math.round((emptyRidesConverted / empty.length) * 100) : 0;
  const rideConnectEarnings = paid.filter(r => r.provider === "rideconnect360").reduce((s, r) => s + (r.fare || 0), 0);

  const suggestions: string[] = [];
  if (avgMileageKmPerL !== null) {
    if (avgMileageKmPerL < 18) {
      suggestions.push(`Mileage is ${avgMileageKmPerL.toFixed(1)} km/L — below typical average for this vehicle class. Check tyre pressure, servicing due date, and idle time.`);
    } else {
      suggestions.push(`Mileage is healthy at ${avgMileageKmPerL.toFixed(1)} km/L. Keep up the current maintenance routine.`);
    }
  }
  if (mileageSource === "estimated") {
    suggestions.push("Mileage above is estimated from GPS distance. Log fuel fill-ups with your odometer reading (and mark odometer km when closing rides) for the real figure.");
  } else if (mileageSource === "none") {
    suggestions.push("Log at least two fuel fill-ups with odometer readings to unlock real mileage tracking.");
  }
  if (empty.length > 0) {
    if (conversionRatePct < 30) {
      suggestions.push(`Only ${conversionRatePct}% of empty runs turned into a paid RideConnect360 match. Check nearby requests as soon as an empty run starts, not just at the end.`);
    } else {
      suggestions.push(`${conversionRatePct}% of empty runs converted into paid rides — ₹${rideConnectEarnings.toLocaleString("en-IN")} earned via RideConnect360 that would otherwise have been a straight loss.`);
    }
  }
  if (empty.length > paid.length && paid.length + empty.length >= 4) {
    suggestions.push("More empty runs than paid rides recently. Consider positioning near high-demand pickup zones during peak hours to cut deadhead time.");
  }
  if (suggestions.length === 0) suggestions.push("Log a few more rides and fuel fill-ups to unlock personalized insights.");

  return {
    ridesPaidCount: paid.length,
    ridesEmptyCount: empty.length,
    totalDistanceKm,
    totalFareEarned,
    totalPiggySaved,
    totalFuelLiters,
    totalFuelCost,
    avgMileageKmPerL,
    mileageSource,
    emptyRidesTotal: empty.length,
    emptyRidesReachedOut,
    emptyRidesConverted,
    conversionRatePct,
    rideConnectEarnings,
    suggestions,
  };
}
