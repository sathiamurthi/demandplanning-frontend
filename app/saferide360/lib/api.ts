import type { Organization, Driver, Stop, Passenger, Trip, TripPassenger, GuardianNotification, GuardianTodayEntry } from "./types";

const BASE = "/v1/saferide360";
const TOKEN_KEY = "saferide360_token";
const ROLE_KEY = "saferide360_role";

export const getToken = (): string | null => (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(ROLE_KEY); };
export const getStoredRole = (): "driver" | "guardian" | null => (typeof window !== "undefined" ? (localStorage.getItem(ROLE_KEY) as any) : null);
export const setStoredRole = (r: "driver" | "guardian") => localStorage.setItem(ROLE_KEY, r);

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(opts.headers as any) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  const json = await res.json().catch(() => ({ success: false, error: "Invalid server response" }));
  if (!res.ok || !json.success) throw new Error(json.error || `Request failed (${res.status})`);
  return json.data as T;
}

export const saferide360Api = {
  // ── Driver auth ──────────────────────────────────────────────────────
  registerDriver: (body: { name: string; phone: string; password: string; vehicle_number: string; vehicle_type: string; organization_name: string; org_type?: string }) =>
    req<{ token: string; driver: Driver; organization: Organization }>("/auth/driver/register", { method: "POST", body: JSON.stringify(body) }),
  loginDriver: (phone: string, password: string) =>
    req<{ token: string; driver: Driver; organization: Organization | null }>("/auth/driver/login", { method: "POST", body: JSON.stringify({ phone, password }) }),
  meDriver: () => req<{ driver: Driver; organization: Organization | null }>("/auth/driver/me"),

  // ── Guardian auth (WhatsApp OTP) ─────────────────────────────────────
  sendGuardianOtp: (phone: string) => req<{ sent: boolean; skipped: boolean; hint?: string }>("/auth/guardian/send-otp", { method: "POST", body: JSON.stringify({ phone }) }),
  verifyGuardianOtp: (phone: string, otp: string) => req<{ token: string; phone: string }>("/auth/guardian/verify-otp", { method: "POST", body: JSON.stringify({ phone, otp }) }),

  // ── Driver: stops ────────────────────────────────────────────────────
  listStops: () => req<Stop[]>("/stops"),
  createStop: (name: string, lat: number, lng: number, sequence: number) =>
    req<Stop>("/stops", { method: "POST", body: JSON.stringify({ name, lat, lng, sequence }) }),
  deleteStop: (id: string) => req<{ deleted: true }>(`/stops/${id}`, { method: "DELETE" }),

  // ── Driver: passengers ───────────────────────────────────────────────
  listPassengers: () => req<Passenger[]>("/passengers"),
  createPassenger: (body: { name: string; guardian_name: string; guardian_phone: string; pickup_stop_id?: string; drop_stop_id?: string }) =>
    req<Passenger>("/passengers", { method: "POST", body: JSON.stringify(body) }),
  deletePassenger: (id: string) => req<{ deleted: true }>(`/passengers/${id}`, { method: "DELETE" }),

  // ── Driver: trips ────────────────────────────────────────────────────
  listTrips: () => req<Trip[]>("/trips"),
  createTrip: (body: { name: string; direction: "pickup" | "drop"; scheduled_start_time: string; scheduled_end_time: string }) =>
    req<Trip>("/trips", { method: "POST", body: JSON.stringify(body) }),
  startTrip: (id: string) => req<Trip>(`/trips/${id}/start`, { method: "POST" }),
  updateTripLive: (id: string, lat: number, lng: number) => req<Trip>(`/trips/${id}/live`, { method: "PATCH", body: JSON.stringify({ lat, lng }) }),
  listTripPassengers: (id: string) => req<(TripPassenger & { passengerName: string })[]>(`/trips/${id}/passengers`),
  markTripPassenger: (tripPassengerId: string, status: "picked" | "absent") =>
    req<TripPassenger>(`/trip-passengers/${tripPassengerId}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  completeTrip: (id: string) => req<Trip>(`/trips/${id}/complete`, { method: "POST" }),
  sosTrip: (id: string) => req<{ alerted: number }>(`/trips/${id}/sos`, { method: "POST" }),

  // ── Guardian views ───────────────────────────────────────────────────
  myChildren: () => req<Passenger[]>("/guardian/children"),
  todayStatus: () => req<GuardianTodayEntry[]>("/guardian/today"),
  tripStops: (tripId: string) => req<Stop[]>(`/guardian/trips/${tripId}/stops`),
  notifications: () => req<GuardianNotification[]>("/guardian/notifications"),
  markNotificationsRead: () => req<{ updated: true }>("/guardian/notifications/read-all", { method: "PATCH" }),
};
