"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  Settings2,
  Tag,
  Package,
  ShoppingCart,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Menu,
  X,
} from "lucide-react";

import { apiGet } from "@/lib/api";
import { ApiResponse } from "@/lib/types";
import { getTenantId } from "@/lib/utils";

/* ───────── STORE TYPE ───────── */

type StoreType = {
  id: string;
  name: string;
};

/* ───────── SIDEBAR CONTEXT ───────── */

const SidebarContext = createContext<any>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("SidebarProvider missing");
  return ctx;
}

/* ───────── PROVIDER ───────── */

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        toggle: () => setCollapsed((c) => !c),
        mobileOpen,
        setMobileOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

/* ───────── SIDEBAR ───────── */

export default function Sidebar() {
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();

  /* 🔥 STORE STATE */
  const [stores, setStores] = useState<StoreType[]>([]);
  const [storeId, setStoreId] = useState("");
  const tenantId = getTenantId();

  /* ───── LOAD STORES ───── */
  useEffect(() => {
    async function loadStores() {
      if (!tenantId) return;

      const res = await apiGet<ApiResponse<StoreType[]>>(
        `/tenants/${tenantId}/stores?includeInactive=false`
      );

      const data = res.data || [];
      setStores(data);

      const saved = localStorage.getItem("storeId");

      if (saved && data.some((s) => s.id === saved)) {
        setStoreId(saved);
      } else if (data.length > 0) {
        setStoreId(data[0].id);
        localStorage.setItem("storeId", data[0].id);
      }
    }

    loadStores();
  }, [tenantId]);

  /* ───── HANDLE STORE CHANGE ───── */
  const handleStoreChange = (id: string) => {
    setStoreId(id);
    localStorage.setItem("storeId", id);
    router.push(`/admin/${id}/dynamic?page=dashboard`);
  };

  /* ───── NAV BUILDER ───── */
  const NAV = [
    {
      section: "Overview",
      items: [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          href: `/admin/${storeId}/dashboard`,
        },
      ],
    },
    {
      section: "Management",
      items: [
        { label: "Users", icon: Users, href: `/admin/${storeId}/dynamic?page=users` },
        { label: "Stores", icon: Store, href: `/admin/${storeId}/dynamic?page=stores` },
        { label: "Categories", icon: Tag, href: `/admin/${storeId}/dynamic?page=categories` },
        { label: "Items", icon: Package, href: `/admin/${storeId}/dynamic?page=items` },
        { label: "Store Config", icon: Settings2, href: `/admin/${storeId}/dynamic?page=store_config` },
      ],
    },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  const width = collapsed ? "w-16" : "w-60";

  return (
    <>
      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full bg-gray-950 text-white transition ${width}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* HEADER */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-white/10">
          {!collapsed && <span>Admin</span>}

          <button onClick={toggle}>
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        </div>

        {/* 🔥 STORE DROPDOWN */}
        {!collapsed && (
          <div className="p-3 border-b border-white/10">
            <select
              value={storeId}
              onChange={(e) => handleStoreChange(e.target.value)}
              className="w-full bg-gray-800 text-white text-sm p-1 rounded"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* NAV */}
        <nav className="p-2">
          {NAV.map((group) => (
            <div key={group.section}>
              {!collapsed && (
                <div className="text-xs text-gray-400 px-2 py-2">
                  {group.section}
                </div>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={storeId ? item.href : "#"}
                    className={`flex items-center gap-2 px-2 py-2 rounded text-sm
                      ${isActive(item.href) ? "bg-white/10" : "hover:bg-white/5"}
                    `}
                  >
                    <Icon size={16} />
                    {!collapsed && item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

/* ───────── TRIGGER ───────── */

export function SidebarTrigger() {
  const { setMobileOpen } = useSidebar();

  return (
    <button onClick={() => setMobileOpen(true)}>
      <Menu />
    </button>
  );
}