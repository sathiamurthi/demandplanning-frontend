/**
 * useCrud — Generic CRUD hook with optimistic updates + rollback
 *
 * Works across: stores, store_configs, categories, items,
 *               purchase_orders, or any module with a REST API.
 *
 * Usage:
 *   const { items, loading, saving, fetch, create, update, remove } =
 *     useCrud<Item>({ module: "items", optimistic: true, onError: (e) => toast(e) });
 */

import { getStoreId } from "@/lib/utils";
import { useState, useCallback, useRef, useEffect } from "react";

/* ─────────────────────────── Types ─────────────────────────── */

export type CrudRecord = { id: string };

export type CrudOptions<T extends CrudRecord> = {
  /** API module path segment, e.g. "items", "categories", "purchase_orders" */
  module: string;
  tenantId: string;
  /** true (default) = /tenants/{id}/stores/{storeId}/{module}; false = /tenants/{id}/{module} */
  storeLevel?: boolean;
  /** Seed data shown while the first fetch is in-flight */
  initialData?: T[];
  /** Apply UI changes before the server responds, roll back on error */
  optimistic?: boolean;
  /** Called on any API error — good place to show a toast */
  onError?: (err: unknown, action: CrudAction) => void;
  /** Called after a successful mutation */
  onSuccess?: (action: CrudAction, item?: Partial<T>) => void;
  /** Extra query params forwarded to every GET */
  defaultParams?: Record<string, string>;
};

export type CrudAction = "fetch" | "create" | "update" | "delete";

export type UseCrudReturn<T extends CrudRecord> = {
  items: T[];
  loading: boolean;
  saving: boolean;
  error: unknown;
  fetch: (params?: Record<string, string>) => Promise<void>;
  create: (data: Partial<T>) => Promise<T | null>;
  update: (id: string, data: Partial<T>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
  /** Directly patch local state without an API call — useful for UI-only filters */
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  /** Manually clear the error */
  clearError: () => void;
};

/* ─────────────────────────── API helpers ─────────────────────────── */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/v1";

// auth.ts
export function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

const TOKEN_STRATEGY = (process.env.NEXT_PUBLIC_TOKEN_STRATEGY || "localStorage") as
  | "cookie"
  | "localStorage";

export async function req<R>(
  method: string,
  url: string,
  body?: unknown
): Promise<R> {
  const res = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    credentials: TOKEN_STRATEGY === "cookie" ? "include" : "same-origin",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(`[${res.status}] ${message}`);
  }

  return res.json() as Promise<R>;
}


function buildUrl(tenantId: string, module: string, storeLevel: boolean, id?: string): string {
  const base = storeLevel
    ? `${BASE}/tenants/${tenantId}/stores/${getStoreId()}/${module}`
    : `${BASE}/tenants/${tenantId}/${module}`;
  return id ? `${base}/${id}` : base;
}

/* ─────────────────────────── Hook ─────────────────────────── */

export function useCrud<T extends CrudRecord>(
  opts: CrudOptions<T>
): UseCrudReturn<T> {
  const { module, tenantId, storeLevel = true, initialData, optimistic, onError, onSuccess, defaultParams } = opts;

  const [items, setItems] = useState<T[]>(initialData ?? []);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  /** Snapshot used for optimistic rollback */
  const snapshot = useRef<T[]>([]);

  const clearError = useCallback(() => setError(null), []);

  /* ── Fetch ── */
  const fetch = useCallback(
    async (params?: Record<string, string>) => {
      if (!tenantId) return;
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ ...defaultParams, ...params }).toString();
        const url = buildUrl(tenantId, module, storeLevel) + (qs ? `?${qs}` : "");
        const res = await req<{ data: T[] }>("GET", url);
        setItems(res.data ?? []);
        onSuccess?.("fetch");
      } catch (err) {
        setError(err);
        onError?.(err, "fetch");
      } finally {
        setLoading(false);
      }
    },
    [tenantId, module, defaultParams, onError, onSuccess]
  );

  /* ── Create ── */
  const create = useCallback(
    async (data: Partial<T>): Promise<T | null> => {
      snapshot.current = items;
      let tempId: string | undefined;

      if (optimistic) {
        tempId = `__temp_${Date.now()}`;
        const tempItem = { ...data, id: tempId, _pending: true } as unknown as T;
        setItems((prev) => [...prev, tempItem]);
      }

      setSaving(true);
      try {
        const res = await req<{ data: T }>("POST", buildUrl(tenantId, module, storeLevel), data);
        const created = res.data;
        setItems((prev) =>
          tempId
            ? prev.map((i) => (i.id === tempId ? created : i))
            : [...prev, created]
        );
        onSuccess?.("create", created);
        return created;
      } catch (err) {
        setItems(snapshot.current);
        setError(err);
        onError?.(err, "create");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [items, optimistic, tenantId, module, onError, onSuccess]
  );

  /* ── Update ── */
  const update = useCallback(
    async (id: string, data: Partial<T>): Promise<T | null> => {
      snapshot.current = items;

      if (optimistic) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...data, _pending: true } : i))
        );
      }

      setSaving(true);
      try {
        const res = await req<{ data: T }>("PUT", buildUrl(tenantId, module, storeLevel, id), data);
        const updated = res.data;
        setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
        onSuccess?.("update", updated);
        return updated;
      } catch (err) {
        setItems(snapshot.current);
        setError(err);
        onError?.(err, "update");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [items, optimistic, tenantId, module, onError, onSuccess]
  );

  /* ── Remove ── */
  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      snapshot.current = items;

      if (optimistic) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }

      setSaving(true);
      try {
        await req("DELETE", buildUrl(tenantId, module, storeLevel, id));
        if (!optimistic) setItems((prev) => prev.filter((i) => i.id !== id));
        onSuccess?.("delete");
        return true;
      } catch (err) {
        setItems(snapshot.current);
        setError(err);
        onError?.(err, "delete");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [items, optimistic, tenantId, module, onError, onSuccess]
  );

  /* Auto-fetch on mount when tenantId is available */
  useEffect(() => {
    if (tenantId) fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  return { items, loading, saving, error, fetch, create, update, remove, setItems, clearError };
}