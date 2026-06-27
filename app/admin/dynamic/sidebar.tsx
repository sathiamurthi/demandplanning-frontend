"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Store, Settings2, Tag, Package,
  ShoppingCart, Shield, ChevronLeft, ChevronRight,
  LogOut, Bell, Menu, X, BookOpen, Sparkles,
  FileBarChart2, Brain, Zap, ReceiptText,
} from "lucide-react";

/* ─────────────────────────── Types ─────────────────────────── */

/* ─────────────────────────── Nav config ─────────────────────── */

type NavItem  = { label: string; href: string; icon: React.ElementType; badge?: number; isPro?: boolean; roles?: string[] };
type NavGroup = { section: string; items: NavItem[]; roles?: string[] };

const ALL_ROLES = ["superadmin","industry_admin","owner","manager","staff","guest"];
const MGMT_ROLES = ["superadmin","industry_admin","owner","manager"];
const OWNER_ROLES = ["superadmin","industry_admin","owner"];

const NAV: NavGroup[] = [
  {
    section: "Overview",
    items: [{ label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Management",
    roles: MGMT_ROLES,
    items: [
      { label: "Users",         href: "/admin/dynamic/users",          icon: Users,     roles: OWNER_ROLES },
      { label: "Stores",        href: "/admin/dynamic/stores",         icon: Store,     roles: OWNER_ROLES },
      { label: "Store configs", href: "/admin/dynamic/store-configs",  icon: Settings2, roles: MGMT_ROLES  },
      { label: "Categories",    href: "/admin/dynamic/categories",     icon: Tag,       roles: MGMT_ROLES  },
      { label: "Items",         href: "/admin/dynamic/items",          icon: Package                       },
      { label: "Quick Add Item",href: "/admin/dynamic/items?quick=1",  icon: Zap,       roles: MGMT_ROLES  },
      { label: "Stock ledger",  href: "/admin/dynamic/ledger",         icon: BookOpen                      },
    ],
  },
  {
    section: "Operations",
    roles: MGMT_ROLES,
    items: [
      { label: "Sales",           href: "/admin/dynamic/sale",            icon: ReceiptText  },
      { label: "Purchase orders", href: "/admin/dynamic/purchase-orders", icon: ShoppingCart },
    ],
  },
  {
    section: "AI Reports",
    items: [
      { label: "Basic Report",    href: "/admin/dynamic/ai-reports/basic",    icon: FileBarChart2 },
      { label: "Advanced Report", href: "/admin/dynamic/ai-reports/advanced", icon: Brain, isPro: true, roles: MGMT_ROLES },
    ],
  },
  {
    section: "Settings",
    roles: OWNER_ROLES,
    items: [
      { label: "AI Settings",   href: "/admin/dynamic/ai-settings",  icon: Sparkles },
      { label: "Permissions",   href: "/admin/dynamic/permissions",   icon: Shield   },
      { label: "Notifications", href: "/notifications",               icon: Bell     },
    ],
  },
];

/* ─────────────────────────── Context ─────────────────────────── */

type SidebarCtx = {
  collapsed: boolean;
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
};

const SidebarContext = createContext<SidebarCtx>({
  collapsed: false, toggle: () => {},
  mobileOpen: false, setMobileOpen: () => {},
});

export function useSidebar() { return useContext(SidebarContext); }

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggle = useCallback(() => setCollapsed((c) => !c), []);
  return (
    <SidebarContext.Provider value={{ collapsed, toggle, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

/* ─────────────────────────── Sidebar ─────────────────────────── */

export function Sidebar({
  role = "staff",
  userEmail = "",
  onSignOut,
}: {
  role?: string;
  userEmail?: string;
  onSignOut?: () => void;
}) {
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();

  const canAccess = (roles?: string[]) => !roles || roles.includes(role);

  const isActive = (href: string) =>
    href === "/admin/dashboard"
      ? pathname === href || pathname === "/dashboard"
      : pathname.includes(href.replace("/admin/dynamic", ""));

  const width = collapsed ? "w-16" : "w-60";

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          theme-sidebar
          fixed inset-y-0 left-0 z-50 flex flex-col
          bg-gray-950
          transition-all duration-200 ease-in-out
          ${width}
          ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
          lg:relative lg:translate-x-0 lg:shadow-none lg:z-auto
        `}
      >
        {/* ── Logo + collapse toggle ── */}
        <div
          className={`flex h-14 shrink-0 items-center border-b px-4
                      theme-sidebar-section
                      ${collapsed ? "justify-center" : "justify-between"}`}
          style={{ borderColor: "var(--sb-border, rgba(255,255,255,0.10))" }}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md
                               bg-gold-400 text-[10px] font-black text-gray-950">
                DP
              </span>
              <span className="text-sm font-semibold tracking-tight"
                    style={{ color: "var(--sb-text-hover, #fff)" }}>
                DemandPlan
              </span>
            </div>
          )}

          {/* Collapse (desktop) */}
          <button
            onClick={toggle}
            className="hidden rounded-lg p-1.5 transition-colors lg:flex
                       hover:bg-black/10"
            style={{ color: "var(--sb-text, rgba(255,255,255,0.4))" }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Close (mobile) */}
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 transition-colors lg:hidden
                       hover:bg-black/10"
            style={{ color: "var(--sb-text, rgba(255,255,255,0.4))" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.filter(g => canAccess(g.roles)).map((group) => {
            const visibleItems = group.items.filter(i => canAccess(i.roles));
            if (visibleItems.length === 0) return null;
            return (
            <div key={group.section} className="mb-1">
              {!collapsed && (
                <p className="theme-sidebar-section mb-1 mt-3 px-4 text-[10px] font-semibold
                              uppercase tracking-widest">
                  {group.section}
                </p>
              )}

              {visibleItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      theme-sidebar-link
                      group relative mx-2 mb-0.5 flex items-center gap-3
                      rounded-lg px-3 py-2 text-sm font-medium transition-colors
                      ${active
                        ? "theme-sidebar-link-active"
                        : ""
                      }
                      ${collapsed ? "justify-center px-0" : ""}
                    `}
                    title={collapsed ? item.label : undefined}
                  >
                    {/* Active pill — uses gold in themed mode */}
                    {active && (
                      <span className="theme-sidebar-pill absolute left-0 top-1/2 h-5 w-0.5
                                       -translate-y-1/2 rounded-r-full bg-white" />
                    )}

                    <Icon className={`shrink-0 ${collapsed ? "h-5 w-5" : "h-4 w-4"}`} />

                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}

                    {/* Pro badge */}
                    {!collapsed && item.isPro && (
                      <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide
                                       bg-gold-400/20 text-gold-400">
                        PRO
                      </span>
                    )}

                    {/* Badge */}
                    {!collapsed && item.badge ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full
                                       bg-gold-400 px-1.5 text-[10px] font-bold text-gray-950">
                        {item.badge}
                      </span>
                    ) : collapsed && item.badge ? (
                      <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center
                                       justify-center rounded-full bg-gold-400 text-[9px]
                                       font-bold text-gray-950">
                        {item.badge}
                      </span>
                    ) : null}

                    {/* Collapsed tooltip */}
                    {collapsed && (
                      <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap
                                       rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0
                                       shadow-lg transition-opacity group-hover:opacity-100 z-50">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
          })}
        </nav>

        {/* ── User strip ── */}
        <div className="shrink-0 border-t p-3"
             style={{ borderColor: "var(--sb-border, rgba(255,255,255,0.10))" }}>
          <div className={`flex items-center gap-3 rounded-lg px-2 py-2
                           ${collapsed ? "justify-center" : ""}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                            text-xs font-semibold"
                 style={{ backgroundColor: "var(--sb-avatar-bg, rgba(212,168,67,0.25))",
                          color: "var(--sb-active-text, #D4A843)" }}>
              {userEmail ? userEmail.slice(0, 2).toUpperCase() : "??"}
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium"
                     style={{ color: "var(--sb-text-hover, #fff)" }}>
                    {userEmail || "User"}
                  </p>
                  <p className="truncate text-[11px] capitalize"
                     style={{ color: "var(--sb-text, rgba(255,255,255,0.4))" }}>{role}</p>
                </div>
                <button
                  onClick={onSignOut}
                  className="rounded p-1 transition-colors hover:opacity-80"
                  style={{ color: "var(--sb-text, rgba(255,255,255,0.3))" }}
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {collapsed && onSignOut && (
              <button
                onClick={onSignOut}
                className="mt-1 rounded p-1 hover:opacity-80"
                style={{ color: "var(--sb-text, rgba(255,255,255,0.3))" }}
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

/* ─────────────────────────── Mobile trigger ─────────────────── */

export function SidebarTrigger() {
  const { setMobileOpen } = useSidebar();
  return (
    <button
      onClick={() => setMobileOpen(true)}
      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700
                 transition-colors lg:hidden"
      aria-label="Open navigation menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
