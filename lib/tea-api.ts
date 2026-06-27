import { getTenantId } from "./utils";

const API = process.env.NEXT_PUBLIC_API_URL || "/v1";

export function teaAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

/** Tenant ID from login session — never use a hardcoded demo ID */
export function getTeaTenantId(): string {
  const id = getTenantId();
  if (!id) throw new Error("No tenant ID — please log in again");
  return id;
}

export function teaUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API}/tenants/${getTeaTenantId()}/tea${normalized}`;
}

export async function teaFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  const res = await fetch(teaUrl(path), {
    ...options,
    headers: { ...teaAuthHeaders(), ...(options?.headers as Record<string, string>) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: (body as any).error || `Request failed (${res.status})` };
  }
  return body as { success: boolean; data?: T; error?: string };
}
