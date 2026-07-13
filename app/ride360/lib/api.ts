import type { AppNotification, CustomerProfile, CustomerRequest, DriverProfile, FuelLog, GeoPoint, Ride } from "./types";

const BASE = "/v1/ride360";
const TOKEN_KEY = "ride360_token";
const ROLE_KEY = "ride360_role";

export const getToken = (): string | null => (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(ROLE_KEY); };
export const getStoredRole = (): "driver" | "customer" | null => (typeof window !== "undefined" ? (localStorage.getItem(ROLE_KEY) as any) : null);
export const setStoredRole = (r: "driver" | "customer") => localStorage.setItem(ROLE_KEY, r);

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(opts.headers as any) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  const json = await res.json().catch(() => ({ success: false, error: "Invalid server response" }));
  if (!res.ok || !json.success) throw new Error(json.error || `Request failed (${res.status})`);
  return json.data as T;
}

export const ride360Api = {
  registerDriver: (name: string, email: string, password: string, vehicleType: string, referredBy?: string) =>
    req<{ token: string; user: DriverProfile }>("/auth/driver/register", { method: "POST", body: JSON.stringify({ name, email, password, vehicleType, referredBy }) }),
  loginDriver: (email: string, password: string) =>
    req<{ token: string; user: DriverProfile }>("/auth/driver/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  socialLoginDriver: (method: string, name: string, email: string, referredBy?: string) =>
    req<{ token: string; user: DriverProfile }>("/auth/driver/social", { method: "POST", body: JSON.stringify({ method, name, email, referredBy }) }),
  loginCustomer: (phone: string, referredBy?: string) =>
    req<{ token: string; user: CustomerProfile }>("/auth/customer/login", { method: "POST", body: JSON.stringify({ phone, referredBy }) }),
  me: () => req<{ role: "driver" | "customer"; user: DriverProfile | CustomerProfile }>("/auth/me"),

  updateDriverProfile: (patch: Partial<{ vehicleNumber: string; licenseNumber: string; licenseExpiry: string; piggyPct: number; vehicleType: string; profileComplete: boolean }>) =>
    req<DriverProfile>("/driver/profile", { method: "PATCH", body: JSON.stringify(patch) }),

  listRides: () => req<Ride[]>("/rides"),
  startRide: (body: { kind: string; provider?: string; source: GeoPoint; destination: GeoPoint; fare?: number; distanceKm: number; matchedRequestId?: string }) =>
    req<Ride>("/rides", { method: "POST", body: JSON.stringify(body) }),
  updateRideLive: (id: string, lat: number, lng: number) =>
    req<Ride>(`/rides/${id}/live`, { method: "PATCH", body: JSON.stringify({ lat, lng }) }),
  endRide: (id: string, body: { durationMin: number; odometerEndKm?: number; piggyContribution?: number; costAnalysis?: any }) =>
    req<{ ride: Ride; driver: DriverProfile }>(`/rides/${id}/end`, { method: "PATCH", body: JSON.stringify(body) }),

  listFuelLogs: () => req<FuelLog[]>("/fuel-logs"),
  addFuelLog: (body: { date: string; liters: number; totalCost: number; odometerKm: number }) =>
    req<FuelLog>("/fuel-logs", { method: "POST", body: JSON.stringify(body) }),

  listMyRequests: () => req<CustomerRequest[]>("/requests/mine"),
  listRequestPool: () => req<CustomerRequest[]>("/requests/pool"),
  listNearbyDrivers: () => req<{ ride: Ride; driver: { id: string; name: string; vehicleType: string; vehicleNumber: string } }[]>("/nearby-drivers"),
  createRequest: (body: { type: string; pickup: GeoPoint; drop: GeoPoint; description: string; offeredAmount: number; targetDriverId?: string; originEmptyRideId?: string }) =>
    req<CustomerRequest>("/requests", { method: "POST", body: JSON.stringify(body) }),
  reachOut: (id: string, originEmptyRideId?: string) =>
    req<CustomerRequest>(`/requests/${id}/reach-out`, { method: "POST", body: JSON.stringify({ originEmptyRideId }) }),
  setRequestStatus: (id: string, status: "confirmed" | "rejected") =>
    req<CustomerRequest>(`/requests/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  sendMessage: (id: string, text?: string, amount?: number) =>
    req<CustomerRequest>(`/requests/${id}/messages`, { method: "POST", body: JSON.stringify({ text, amount }) }),

  listNotifications: () => req<AppNotification[]>("/notifications"),
  markNotificationsRead: () => req<{ updated: boolean }>("/notifications/read-all", { method: "PATCH" }),

  logAIUsage: (feature: string) => req<{ logged: boolean }>("/ai-usage", { method: "POST", body: JSON.stringify({ feature }) }).catch(() => {}),
};
