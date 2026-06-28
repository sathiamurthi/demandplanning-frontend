"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { apiGet } from "@/lib/api";
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
  BookOpen,
} from "lucide-react";

import { useStore } from "./appshell"; // ✅ IMPORTANT

/* ───────────────── TYPES ───────────────── */

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
};

type NavGroup = {
  section: string;
  items: NavItem[];
};

/* ───────────────── NAV CONFIG (CLEAN URLS) ───────────────── */

const NAV: NavGroup[] = [
  {
    section: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Management",
    items: [
      { label: "Users", href: "/dynamic?page=users", icon: Users },
      { label: "Stores", href: "/dynamic?page=stores", icon: Store },
      { label: "Store configs", href: "/dynamic?page=store-configs", icon: Settings2 },
      { label: "Categories", href: "/dynamic?page=categories", icon: Tag },
      { label: "Items", href: "/dynamic?page=items", icon: Package },
      { label: "Stock ledger", href: "/dynamic?page=ledger", icon: BookOpen },
    ],
  },
  {
    section: "Operations",
    items: [
      {
        label: "Purchase orders",
        href: "/dynamic?page=purchase-orders",
        icon: ShoppingCart,
        badge: 3,
      },
    ],
  },
  {
    section: "Settings",
    items: [
      { label: "Permissions", href: "/dynamic?page=permissions", icon: Shield },
      { label: "Notifications", href: "/dynamic?page=notifications", icon: Bell },
    ],
  },
];

/* ───────────────── CONTEXT ───────────────── */

type SidebarCtx = {
  collapsed: boolean;
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
};

const SidebarContext = createContext<SidebarCtx>({
  collapsed: false,
  toggle: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  return (
    <SidebarContext.Provider
      value={{ collapsed, toggle, mobileOpen, setMobileOpen }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

/* ───────────────── SIDEBAR ───────────────── */

export function Sidebar() {
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();

  const { stores, storeId, setStoreId, loading } = useStore();

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiGet<any>(`/auth/me`);
        if (res?.success && res?.data) {
          setProfileData(res.data);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const firstName = profileData?.first_name || "";
  const lastName = profileData?.last_name || "";
  const fullName = (firstName + " " + lastName).trim() || profileData?.email || "User Profile";
  const initials = (firstName?.[0] || "") + (lastName?.[0] || "") || (profileData?.email?.[0]?.toUpperCase() || "U");
  const userRole = profileData?.role || "staff";

  const width = collapsed ? "w-16" : "w-60";

  /* ───── ACTIVE CHECK ───── */
  const isActive = (href: string) =>
    pathname.includes(href);

  /* ───── STORE CHANGE ───── */
  const handleStoreChange = (id: string) => {
    setStoreId(id);

    let newPath = pathname;

    if (pathname.startsWith("/admin/")) {
      newPath = pathname.replace(/\/admin\/[^/]+/, `/admin/${id}`);
    } else {
      newPath = `/admin/${id}/dynamic?page=dashboard`;
    }

    router.push(newPath);
  };

  /* ───── BUILD FULL URL ───── */
  const buildHref = (href: string) => {
    if (!storeId) return "#";
    return `/admin/${storeId}${href}`;
  };

  return (
    <>
      {/* MOBILE BACKDROP */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col bg-gray-950 text-white
          transition-all duration-200
          ${width}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0
        `}
      >
        {/* HEADER */}
        <div
          className={`flex h-14 items-center border-b border-white/10 px-4 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!collapsed && (
            <span className="text-sm font-semibold">Admin panel</span>
          )}

          <button onClick={toggle} className="hidden lg:flex">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* 🔥 STORE DROPDOWN */}
        <div className="border-b border-white/10 p-3">
          {!collapsed && (
            <p className="mb-1 text-[10px] uppercase text-white/40">
              Store
            </p>
          )}

          <select
            value={storeId}
            onChange={(e) => handleStoreChange(e.target.value)}
            className="w-full rounded bg-white/10 px-2 py-1 text-sm text-white"
          >
            {loading ? (
              <option className="text-gray-900 bg-white">Loading...</option>
            ) : stores.length === 0 ? (
              <option className="text-gray-900 bg-white">No stores</option>
            ) : (
              stores.map((s) => (
                <option key={s.id} value={s.id} className="text-gray-900 bg-white">
                  {s.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* NAV */}
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.map((group) => (
            <div key={group.section}>
              {!collapsed && (
                <p className="px-4 text-xs text-white/30 uppercase">
                  {group.section}
                </p>
              )}

              {group.items.map((item) => {
                const fullHref = buildHref(item.href);
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={fullHref}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      mx-2 flex items-center gap-3 rounded px-3 py-2 text-sm
                      ${active ? "bg-white/10" : "text-white/50 hover:text-white"}
                      ${collapsed ? "justify-center" : ""}
                    `}
                  >
                    <Icon size={18} />

                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* FOOTER */}
        <div className="border-t border-white/10 p-3">
          <div 
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded transition"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center text-xs font-bold text-white">
              {initials}
            </div>

            {!collapsed && (
              <>
                <div className="text-xs flex-1 min-w-0">
                  <div className="truncate font-semibold">{fullName}</div>
                  <div className="text-white/40 truncate capitalize">{userRole}</div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    localStorage.clear();
                    router.push("/login");
                  }}
                  className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white"
                  title="Logout"
                >
                  <LogOut size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* PROFILE DETAILS MODAL */}
      {profileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-gray-900 text-white p-6 shadow-2xl transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <Users className="text-yellow-400" size={20} />
                User Profile Details
              </h3>
              <button
                onClick={() => setProfileOpen(false)}
                className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {/* Profile Avatar / Initials */}
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center text-xl font-bold shadow-lg text-white">
                  {initials}
                </div>
                <div>
                  <h4 className="text-lg font-semibold">{fullName}</h4>
                  <span className="inline-flex items-center gap-1 rounded bg-yellow-500/20 px-2 py-0.5 text-xs font-semibold text-yellow-400 capitalize">
                    {userRole}
                  </span>
                </div>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-1 gap-3 bg-white/5 p-4 rounded-xl border border-white/5 text-sm">
                <div>
                  <label className="block text-xs text-white/40 uppercase font-medium">Phone Number</label>
                  <p className="mt-0.5 text-white font-mono">{profileData?.phone || "N/A"}</p>
                </div>
                <hr className="border-white/5" />
                <div>
                  <label className="block text-xs text-white/40 uppercase font-medium">Email Address</label>
                  <p className="mt-0.5 text-white break-all">{profileData?.email || "N/A"}</p>
                </div>
                <hr className="border-white/5" />
                <div>
                  <label className="block text-xs text-white/40 uppercase font-medium">Tenant / Company</label>
                  <p className="mt-0.5 text-white">{profileData?.tenant_name || "N/A"}</p>
                </div>
                <hr className="border-white/5" />
                <div>
                  <label className="block text-xs text-white/40 uppercase font-medium">Active Store</label>
                  <p className="mt-0.5 text-white">{profileData?.store_name || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Footer / Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setProfileOpen(false)}
                className="rounded bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-semibold transition text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

/* ───────────────── MOBILE TRIGGER ───────────────── */

export function SidebarTrigger() {
  const { setMobileOpen } = useSidebar();

  return (
    <button onClick={() => setMobileOpen(true)} className="lg:hidden">
      <Menu size={18} />
    </button>
  );
}