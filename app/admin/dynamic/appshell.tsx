"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider, Sidebar, SidebarTrigger, useSidebar } from "./sidebar";
import { apiGet } from "@/lib/api";
import { ApiResponse } from "@/lib/types";
import { getTenantId } from "@/lib/utils";
import { ThemeProvider, ThemeSwitcher } from "@/lib/theme";

/* ───────────────── STORE CONTEXT ───────────────── */

type Store = {
  id: string;
  name: string;
};

type StoreContextType = {
  stores: Store[];
  storeId: string;
  setStoreId: (id: string) => void;
  loading: boolean;
};

const StoreContext = createContext<StoreContextType | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside AppShell");
  return ctx;
}

/* ───────────────── ROUTE TITLE ───────────────── */

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard":          "Dashboard",
  "/users":              "Users",
  "/stores":             "Stores",
  "/store-configs":      "Store configs",
  "/categories":         "Categories",
  "/items":              "Items",
  "/sale":               "Sales",
  "/purchase-orders":    "Purchase orders",
  "/permissions":        "Permissions",
  "/notifications":      "Notifications",
  "/ledger":             "Stock ledger",
  "/ai-settings":        "AI Settings",
  "/ai-reports/basic":   "Basic AI Report",
  "/ai-reports/advanced":"Advanced AI Report",
};

function getTitle(pathname: string): string {
  const match = Object.keys(ROUTE_TITLES)
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname.includes(k));
  return match ? ROUTE_TITLES[match] : "Admin panel";
}

/* ───────────────── TOP BAR ───────────────── */

function TopBar() {
  const pathname = usePathname();
  const { stores, storeId, setStoreId, loading } = useStore();

  return (
    <header className="theme-topbar flex h-14 shrink-0 items-center gap-3 border-b px-4
                       bg-white border-gray-100 transition-colors">
      {/* Mobile hamburger */}
      <SidebarTrigger />

      {/* Page title */}
      <span className="text-sm font-semibold truncate">{getTitle(pathname)}</span>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Store selector */}
        <div className="flex items-center gap-1.5">
          <span className="hidden sm:inline text-xs text-gray-500">Store:</span>
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs sm:text-sm
                       focus:outline-none focus:ring-2 focus:ring-gold-400 max-w-[140px] sm:max-w-none"
          >
            {loading ? (
              <option>Loading…</option>
            ) : stores.length === 0 ? (
              <option>No stores</option>
            ) : (
              stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))
            )}
          </select>
        </div>

        {/* Theme switcher */}
        <ThemeSwitcher />
      </div>
    </header>
  );
}

/* ───────────────── INNER SHELL ───────────────── */

function ShellInner({ children, role, userEmail, onSignOut }: {
  children: React.ReactNode;
  role: string;
  userEmail: string;
  onSignOut: () => void;
}) {
  const { mobileOpen } = useSidebar();

  return (
    <div className={`flex h-screen overflow-hidden theme-content bg-gray-50 transition-colors
                     ${mobileOpen ? "sidebar-overlay-active" : ""}`}>
      <Sidebar role={role} userEmail={userEmail} onSignOut={onSignOut} />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

/* ───────────────── MAIN SHELL ───────────────── */

export function AppShell({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreIdState] = useState("");
  const [loading, setLoading] = useState(true);
  const [role,    setRole]    = useState<string>("staff");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    // Auth guard: redirect to login if no token
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }

    // Read role + email from localStorage (set on login)
    setRole(localStorage.getItem("role") ?? "staff");
    setUserEmail(localStorage.getItem("userEmail") ?? "");

    const tenantId = getTenantId();

    async function loadStores() {
      if (!tenantId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await apiGet<ApiResponse<Store[]>>(`/tenants/${tenantId}/stores`);
        const data = res.data || [];
        setStores(data);
        const saved = localStorage.getItem("storeId");
        if (saved && data.some((s: Store) => s.id === saved)) {
          setStoreIdState(saved);
        } else if (data.length > 0) {
          setStoreIdState(data[0].id);
        }
      } catch (err) {
        console.error("Store fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStores();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setStoreId = (id: string) => {
    setStoreIdState(id);
    localStorage.setItem("storeId", id);
  };

  const handleSignOut = () => {
    ["token","role","tenantId","userId","userEmail","storeId","refreshToken"].forEach(k => localStorage.removeItem(k));
    router.push("/login");
  };

  return (
    <ThemeProvider>
      <SidebarProvider>
        <StoreContext.Provider value={{ stores, storeId, setStoreId, loading }}>
          <ShellInner role={role} userEmail={userEmail} onSignOut={handleSignOut}>{children}</ShellInner>
        </StoreContext.Provider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
