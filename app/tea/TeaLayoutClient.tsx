"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Leaf, LayoutDashboard, Users, ClipboardList, Truck,
  Factory, Wallet, BarChart3, Settings, ChevronLeft, ChevronRight,
  Menu, X, Package, Tractor, Wrench, Boxes, ShoppingCart, ShieldCheck,
  Sparkles, MapPin, Bell, LogOut, Rocket, UserCog,
  ClipboardCheck, Zap, HardHat, FileText, BarChart2, Archive,
} from "lucide-react";
import { teaFetch } from "@/lib/tea-api";

// moduleKey matches the backend's TEA_MODULES permission grid
// (tea-roles.service.ts) — undefined means "always visible, not
// delegable" (dashboard, setup, notifications, settings, team).
// nav separator marker — items with divider:true render a thin rule above them
const nav = [
  { href: "/tea",            icon: LayoutDashboard, label: "Dashboard",       exact: true },
  { href: "/tea/onboarding", icon: Rocket,          label: "Setup" },

  // ── Collection & Trade ───────────────────────────────────────────────
  { href: "/tea/growers",    icon: Users,           label: "Growers",          moduleKey: "growers",     divider: true },
  { href: "/tea/collections",icon: ClipboardList,   label: "Collections",      moduleKey: "collections" },
  { href: "/tea/dispatch",   icon: Truck,           label: "Dispatch",         moduleKey: "dispatch" },
  { href: "/tea/settlements",icon: Factory,         label: "Settlement",       moduleKey: "settlements" },
  { href: "/tea/payments",   icon: Wallet,          label: "Payments",         moduleKey: "settlements" },

  // ── Factory Management (new tf_* module) ─────────────────────────────
  { href: "/tea/factory/shift",    icon: ClipboardCheck, label: "Shift Log",      moduleKey: "factory_shift",    divider: true },
  { href: "/tea/factory/made-tea", icon: Archive,        label: "Made Tea Stock", moduleKey: "factory_stock" },
  { href: "/tea/factory/energy",   icon: Zap,            label: "Energy & Fuel",  moduleKey: "factory_energy" },
  { href: "/tea/factory/mandays",  icon: HardHat,        label: "Mandays",        moduleKey: "factory_labour" },
  { href: "/tea/factory/gate-pass",icon: FileText,       label: "Gate Pass",      moduleKey: "factory_dispatch" },
  { href: "/tea/factory/tally",    icon: BarChart2,      label: "Monthly Tally",  moduleKey: "factory_tally" },

  // ── Operations ────────────────────────────────────────────────────────
  { href: "/tea/suppliers",  icon: Package,         label: "Suppliers & Fuel", moduleKey: "suppliers",    divider: true },
  { href: "/tea/fleet",      icon: MapPin,          label: "Fleet & Live Map", moduleKey: "fleet" },
  { href: "/tea/estate",     icon: Tractor,         label: "Estate & Payroll", moduleKey: "estate" },
  { href: "/tea/machinery",  icon: Wrench,          label: "Machinery",        moduleKey: "machinery" },
  { href: "/tea/inventory",  icon: Boxes,           label: "Inventory",        moduleKey: "inventory" },
  { href: "/tea/sales",      icon: ShoppingCart,    label: "Sales & Auction",  moduleKey: "sales" },
  { href: "/tea/compliance", icon: ShieldCheck,     label: "Compliance",       moduleKey: "compliance" },

  // ── Platform ──────────────────────────────────────────────────────────
  { href: "/tea/ai",            icon: Sparkles,  label: "AI Assistant",  moduleKey: "ai",      divider: true },
  { href: "/tea/notifications", icon: Bell,      label: "Notifications" },
  { href: "/tea/reports",       icon: BarChart3, label: "Reports",       moduleKey: "reports" },
  { href: "/tea/team",          icon: UserCog,   label: "Team & Roles" },
  { href: "/tea/settings",      icon: Settings,  label: "Settings" },
];
// Items with no moduleKey are only ever shown to owner/manager/superadmin
// (never part of a delegated custom role's grant) — Setup, Team, Settings.
const OWNER_ONLY_HREFS = new Set(["/tea/onboarding", "/tea/team", "/tea/settings"]);

// Field agent gets a deliberately small slice of the full ERP nav — only
// what a collection agent actually does in the field, per the owner's
// explicit scope: growers, collection, dispatch, payments, vehicles, a
// few AI features, notifications. Everything else (estate/payroll,
// machinery, inventory, sales/auction, compliance, reports, settings)
// stays owner/manager-only.
const agentNav = [
  { href: "/tea",             icon: LayoutDashboard, label: "Dashboard",    exact: true },
  { href: "/tea/growers",     icon: Users,           label: "Growers" },
  { href: "/tea/collections", icon: ClipboardList,   label: "Collections" },
  { href: "/tea/dispatch",    icon: Truck,           label: "Dispatch" },
  { href: "/tea/payments",    icon: Wallet,          label: "Payments" },
  { href: "/tea/fleet",       icon: MapPin,          label: "Vehicles" },
  { href: "/tea/ai",          icon: Sparkles,        label: "AI Assistant" },
  { href: "/tea/notifications", icon: Bell,          label: "Notifications" },
];
const AGENT_ALLOWED_PREFIXES = agentNav.map(i => i.href);

export default function TeaLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authed, setAuthed]         = useState(false);
  const [role, setRole]             = useState<string | null>(null);
  const [email, setEmail]           = useState<string | null>(null);
  // null = not yet resolved; an object = this user has a custom tea role
  // and these are its granted module keys; explicit "none" = legacy
  // agent/staff with no custom role, fall back to the old agentNav.
  const [customPerms, setCustomPerms] = useState<Record<string, boolean> | "none" | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      const staleRole = localStorage.getItem("role");
      const target = staleRole === "agent" ? "/agent-login" : "/tea-login";
      router.replace(`${target}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    const storedRole = localStorage.getItem("role");
    setRole(storedRole);
    setEmail(localStorage.getItem("userEmail"));

    const ownerLike = storedRole === "owner" || storedRole === "manager" || storedRole === "superadmin";
    if (ownerLike) {
      setAuthed(true);
      return;
    }

    // Not owner-like — resolve whether this user has a custom role (new,
    // flexible path) or is a legacy agent (old hardcoded path).
    teaFetch<{ fullAccess: boolean; permissions: Record<string, boolean> | null }>("/roles/my-permissions")
      .then(r => {
        const perms = r.success ? r.data?.permissions : null;
        const allowedHrefs = perms
          ? nav.filter(n => !OWNER_ONLY_HREFS.has(n.href) && (!n.moduleKey || perms[n.moduleKey])).map(n => n.href)
          : AGENT_ALLOWED_PREFIXES;
        setCustomPerms(perms || "none");
        if (!allowedHrefs.some(p => p === "/tea" ? pathname === "/tea" : pathname.startsWith(p))) {
          router.replace("/tea");
          return;
        }
        setAuthed(true);
      })
      .catch(() => { setCustomPerms("none"); setAuthed(true); });
  }, [pathname, router]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("tenantId");
    router.replace(role === "agent" ? "/agent-login" : "/tea-login");
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <span className="text-sm">Checking session…</span>
        </div>
      </div>
    );
  }

  const ownerLike = role === "owner" || role === "manager" || role === "superadmin";
  const activeNav = ownerLike
    ? nav
    : customPerms && customPerms !== "none"
      ? nav.filter(n => !n.moduleKey || customPerms[n.moduleKey]).filter(n => !OWNER_ONLY_HREFS.has(n.href))
      : agentNav;
  const isActive = (item: typeof nav[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const initial = (email || "T")[0].toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      {/* Sidebar */}
      <aside className={`
        hidden lg:flex flex-col bg-white border-r border-gray-200
        transition-all duration-300
        ${collapsed ? "w-16" : "w-60"}
      `}>
        {/* Logo */}
        <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-gray-200 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl flex items-center justify-center shrink-0 shadow-md">
            <Leaf size={17} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight tracking-tight">TeaFactory360</p>
              <p className="text-gray-400 text-[11px]">{role === "agent" ? "Field Agent" : "ABC Tea Agency"}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {activeNav.map(item => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <div key={item.href}>
                {(item as any).divider && !collapsed && (
                  <div className="mx-4 my-1.5 border-t border-gray-100" />
                )}
                <Link
                  href={item.href}
                  className={`
                    relative flex items-center gap-3 px-4 py-2.5 mx-2 my-0.5 rounded-lg text-sm transition-colors
                    ${active
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}
                    ${collapsed ? "justify-center px-2" : ""}
                  `}
                  title={collapsed ? item.label : undefined}
                >
                  {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-emerald-500" />}
                  <Icon size={16} className={active ? "text-emerald-600" : "text-gray-400"} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Account footer */}
        <div className="border-t border-gray-200 p-2">
          {!collapsed && email && (
            <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-700 truncate">{email}</p>
                <p className="text-[10px] text-gray-400 capitalize">{role || "user"}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors text-xs"
            >
              {collapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} /> Collapse</>}
            </button>
            {!collapsed && (
              <button
                onClick={logout}
                title="Sign out"
                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 flex items-center gap-3 px-4 py-3">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-600">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-700 rounded-lg flex items-center justify-center shrink-0">
            <Leaf size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-gray-900">TeaFactory360</span>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)}>
          <nav className="bg-white w-60 h-full py-16 px-2 shadow-xl" onClick={e => e.stopPropagation()}>
            {activeNav.map(item => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm my-0.5 ${
                    active ? "bg-emerald-50 text-emerald-700 font-medium" : "text-gray-600"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
            <button onClick={logout} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm my-0.5 text-red-500">
              <LogOut size={16} /> Sign out
            </button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
