import type { CustomerProfile, CustomerRequest, DriverProfile, Ride } from "./types";

const DRIVERS_KEY = "ride360_drivers";
const CUSTOMERS_KEY = "ride360_customers";
const SESSION_KEY = "ride360_session";
const RIDES_KEY = "ride360_rides";
const REQUESTS_KEY = "ride360_requests";

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Drivers (with password hash-lite for demo purposes — not real security) ──
interface StoredDriver extends DriverProfile { pw?: string }

export const loadDrivers = (): StoredDriver[] => load(DRIVERS_KEY, []);
export const saveDrivers = (d: StoredDriver[]) => save(DRIVERS_KEY, d);

export const loadCustomers = (): CustomerProfile[] => load(CUSTOMERS_KEY, []);
export const saveCustomers = (c: CustomerProfile[]) => save(CUSTOMERS_KEY, c);

export type Session = { type: "driver" | "customer"; id: string } | null;
export const loadSession = (): Session => load(SESSION_KEY, null);
export const saveSession = (s: Session) => save(SESSION_KEY, s);
export const clearSession = () => { if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY); };

export const loadRides = (): Ride[] => load(RIDES_KEY, []);
export const saveRides = (r: Ride[]) => save(RIDES_KEY, r);

export const loadRequests = (): CustomerRequest[] => load(REQUESTS_KEY, []);
export const saveRequests = (r: CustomerRequest[]) => save(REQUESTS_KEY, r);

// ── Auth helpers ─────────────────────────────────────────────────────────────
export function registerDriver(input: Omit<StoredDriver, "id" | "piggyBalance" | "createdAt" | "profileComplete">): StoredDriver | string {
  const drivers = loadDrivers();
  if (input.email && drivers.find(d => d.email === input.email)) return "Email already registered";
  if (input.phone && drivers.find(d => d.phone === input.phone)) return "Phone already registered";
  const driver: StoredDriver = {
    ...input,
    id: `drv_${Date.now()}`,
    piggyBalance: 0,
    createdAt: new Date().toISOString(),
    profileComplete: !!(input.vehicleNumber && input.licenseNumber),
  };
  saveDrivers([...drivers, driver]);
  saveSession({ type: "driver", id: driver.id });
  return driver;
}

export function loginDriver(email: string, pw: string): StoredDriver | string {
  const driver = loadDrivers().find(d => d.email === email);
  if (!driver) return "No account found with that email";
  if (driver.pw && driver.pw !== pw) return "Incorrect password";
  saveSession({ type: "driver", id: driver.id });
  return driver;
}

export function socialLoginDriver(method: "google" | "linkedin", name: string, email: string): StoredDriver {
  const drivers = loadDrivers();
  let driver = drivers.find(d => d.email === email);
  if (!driver) {
    driver = {
      id: `drv_${Date.now()}`, name, email, authMethod: method,
      vehicleType: "auto", vehicleNumber: "", licenseNumber: "", licenseExpiry: "",
      piggyBalance: 0, piggyPct: 10, createdAt: new Date().toISOString(), profileComplete: false,
    };
    saveDrivers([...drivers, driver]);
  }
  saveSession({ type: "driver", id: driver.id });
  return driver;
}

export function loginOrRegisterCustomer(phone: string): CustomerProfile {
  const customers = loadCustomers();
  let customer = customers.find(c => c.phone === phone);
  if (!customer) {
    customer = { id: `cus_${Date.now()}`, phone, createdAt: new Date().toISOString() };
    saveCustomers([...customers, customer]);
  }
  saveSession({ type: "customer", id: customer.id });
  return customer;
}

export function updateDriver(id: string, patch: Partial<StoredDriver>) {
  const drivers = loadDrivers();
  const next = drivers.map(d => (d.id === id ? { ...d, ...patch } : d));
  saveDrivers(next);
  return next.find(d => d.id === id)!;
}
