"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  useSidebar,
} from "./sidebar";
import { apiGet } from "@/lib/api";
import { ApiResponse } from "@/lib/types";
import { getTenantId } from "@/lib/utils";

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
  "/dashboard": "Dashboard",
  "/users": "Users",
  "/stores": "Stores",
  "/store-configs": "Store configs",
  "/categories": "Categories",
  "/items": "Items",
  "/purchase-orders": "Purchase orders",
  "/permissions": "Permissions",
  "/notifications": "Notifications",
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

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-white px-4">
      <SidebarTrigger />
      <span className="text-sm font-semibold">{getTitle(pathname)}</span>
    </header>
  );
}

/* ───────────────── INNER SHELL ───────────────── */

function ShellInner({ children }: { children: React.ReactNode }) {
  useSidebar();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />

        {/* ❌ NO DROPDOWN HERE */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

/* ───────────────── MAIN APP SHELL ───────────────── */

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreIdState] = useState("");
  const [loading, setLoading] = useState(false);

  const tenantId = getTenantId();

  useEffect(() => {
    async function loadStores() {
      if (!tenantId) return;

      setLoading(true);
      try {
        const res = await apiGet<ApiResponse<Store[]>>(
          `/tenants/${tenantId}/stores`
        );

        const data = res.data || [];
        setStores(data);

        const saved = localStorage.getItem("storeId");

        if (saved) {
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
  }, [tenantId]);

  const setStoreId = (id: string) => {
    setStoreIdState(id);
    localStorage.setItem("storeId", id);
  };

 return (
  <StoreContext.Provider value={{ stores,  storeId, setStoreId, loading }}>
    <SidebarProvider>
      <ShellInner>{children}</ShellInner>
    </SidebarProvider>
  </StoreContext.Provider>
);
}