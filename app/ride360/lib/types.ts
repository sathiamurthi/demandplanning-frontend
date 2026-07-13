export type AuthMethod = "email" | "google" | "linkedin" | "phone";
export type VehicleType = "auto" | "cab" | "transport" | "bike";

export interface DriverProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  authMethod: AuthMethod;
  vehicleType: VehicleType;
  vehicleNumber: string;
  licenseNumber: string;
  licenseExpiry: string;
  piggyBalance: number;
  piggyPct: number; // % of every paid fare auto-saved
  createdAt: string;
  profileComplete: boolean;
}

export interface CustomerProfile {
  id: string;
  phone: string;
  createdAt: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  address: string;
}

export type RideProvider = "self" | "ola" | "uber";
export type RideStatus = "active" | "completed" | "cancelled";

export interface Ride {
  id: string;
  driverId: string;
  kind: "paid" | "empty";
  provider?: RideProvider; // only for paid
  source: GeoPoint;
  destination: GeoPoint;
  status: RideStatus;
  fare?: number; // only for paid
  distanceKm: number;
  durationMin: number;
  piggyContribution: number;
  startedAt: string;
  endedAt?: string;
  costAnalysis?: EmptyRideAnalysis; // only for empty
}

export interface EmptyRideAnalysis {
  fuelCost: number;
  opportunityCost: number;
  totalLoss: number;
  tip: string;
}

export type RequestType = "ride" | "parcel";
export type RequestStatus = "pending" | "confirmed" | "rejected" | "completed";

export interface ThreadMessage {
  from: "driver" | "customer";
  text: string;
  at: string;
}

export interface CustomerRequest {
  id: string;
  customerId: string;
  customerPhone: string;
  type: RequestType;
  pickup: GeoPoint;
  drop: GeoPoint;
  description: string;
  offeredAmount: number;
  status: RequestStatus;
  claimedByDriverId?: string;
  messages: ThreadMessage[];
  createdAt: string;
}
