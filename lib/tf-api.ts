import { getTenantId } from "./utils";

const API = process.env.NEXT_PUBLIC_API_URL || "/v1";

/** Auth headers — same JWT as the rest of the platform */
export function tfAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

/** Tenant ID from active session */
export function getTfTenantId(): string {
  const id = getTenantId();
  if (!id) throw new Error("No tenant ID — please log in again");
  return id;
}

/** Build a full URL for the tea-factory namespace
 *  /v1/tenants/:tenantId/tea-factory/<path>
 */
export function tfUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API}/tenants/${getTfTenantId()}/tea-factory${normalized}`;
}

/** Typed fetch wrapper — mirrors teaFetch */
export async function tfFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  const res = await fetch(tfUrl(path), {
    ...options,
    headers: {
      ...tfAuthHeaders(),
      ...(options?.headers as Record<string, string>),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      success: false,
      error: (body as any).error || `Request failed (${res.status})`,
    };
  }
  return body as { success: boolean; data?: T; error?: string };
}

/* ─── Indian number / currency formatters ──────────────────────────────── */

/** Full INR with Indian grouping — ₹1,25,430.50 */
export function fmtINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Compact INR for KPI cards — ₹1.25L / ₹3.5Cr */
export function fmtINRCompact(amount: number): string {
  if (amount >= 1_00_00_000)
    return `₹${(amount / 1_00_00_000).toFixed(2)}Cr`;
  if (amount >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(2)}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

/** Weight with Indian grouping — 6,730 kg */
export function fmtKg(kg: number): string {
  return `${new Intl.NumberFormat("en-IN").format(kg)} kg`;
}

/** Date DD/MM/YYYY from YYYY-MM-DD */
export function fmtDate(dateStr: string): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

/** Short date — 27 Jul 2026 */
export function fmtDateShort(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** HH:MM → "8:20 AM" */
export function fmtTime(timeStr: string): string {
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/** Compute hours difference between two HH:MM strings → "4 hrs 10 mins" */
export function diffHrsMins(start: string, end: string): string {
  if (!start || !end) return "—";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60; // overnight
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} mins`;
  if (m === 0) return `${h} hrs`;
  return `${h} hrs ${m} mins`;
}

/** Outturn % — always 2 decimal places */
export function fmtPct(value: number): string {
  return `${value.toFixed(2)}%`;
}
