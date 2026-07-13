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

export type RideProvider = "self" | "ola" | "uber" | "rideconnect360";
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
  odometerStartKm?: number;
  odometerEndKm?: number; // driver-entered actual odometer reading when closing the ride — more accurate than GPS distance
  matchedRequestId?: string; // set when this ride came from a successful empty-run outreach (provider "rideconnect360")
  liveLat?: number;
  liveLng?: number; // periodically-synced live position while an empty ride is active, so other sessions can see approximate distance
  liveUpdatedAt?: string;
}

export interface FuelLog {
  id: string;
  driverId: string;
  date: string; // yyyy-mm-dd
  liters: number;
  totalCost: number;
  odometerKm: number; // odometer reading at the time of this fill-up
  createdAt: string;
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
  amount?: number; // set when this message is a price proposal
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
  currentAmount: number; // tracked/negotiable price — starts at offeredAmount, updates as either side proposes a new figure
  status: RequestStatus;
  claimedByDriverId?: string;
  originEmptyRideId?: string; // the empty ride whose "Reach Out" created this claim, for conversion tracking
  contactInitiatedBy?: "driver" | "customer"; // who reached out first — decides who sees the accept/reject decision
  messages: ThreadMessage[];
  createdAt: string;
}

export type NotificationType = "outreach" | "message" | "status" | "completed";

export interface AppNotification {
  id: string;
  forType: "driver" | "customer";
  forId: string;
  type: NotificationType;
  text: string;
  requestId?: string;
  read: boolean;
  createdAt: string;
}
