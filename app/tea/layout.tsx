"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Leaf, LayoutDashboard, Users, ClipboardList, Truck,
  Factory, Wallet, BarChart3, Settings, ChevronLeft, ChevronRight,
  Menu, X, Package, Tractor, Wrench, Boxes, ShoppingCart, ShieldCheck, Sparkles, MapPin, Bell, LogOut
} from "lucide-react";

const nav = [
  { href: "/tea",            icon: LayoutDashboard, label: "Dashboard",    exact: true },
  { href: "/tea/growers",    icon: Users,           label: "Growers" },
  { href: "/tea/collections",icon: ClipboardList,   label: "Collections" },
  { href: "/tea/dispatch",   icon: Truck,           label: "Dispatch" },
  { href: "/tea/settlements",icon: Factory,         label: "Settlement" },
  { href: "/tea/payments",   icon: Wallet,          label: "Payments" },
  { href: "/tea/suppliers",  icon: Package,         label: "Suppliers & Fuel" },
  { href: "/tea/fleet",      icon: MapPin,          label: "Fleet & Live Map" },
  { href: "/tea/estate",     icon: Tractor,         label: "Estate & Payroll" },
  { href: "/tea/machinery",  icon: Wrench,          label: "Machinery & Vendors" },
  { href: "/tea/inventory",  icon: Boxes,           label: "Inventory" },
  { href: "/tea/sales",      icon: ShoppingCart,    label: "Sales & Auction" },
  { href: "/tea/compliance", icon: ShieldCheck,     label: "Compliance" },
  { href: "/tea/ai",         icon: Sparkles,        label: "AI Assistant" },
  { href: "/tea/notifications", icon: Bell,         label: "Notifications" },
  { href: "/tea/reports",    icon: BarChart3,       label: "Reports" },
  { href: "/tea/settings",   icon: Settings,        label: "Settings" },
];

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

export default function TeaLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authed, setAuthed]         = useState(false);
  const [role, setRole]             = useState<string | null>(null);
  const [email, setEmail]           = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    const storedRole = localStorage.getItem("role");
    setRole(storedRole);
    setEmail(localStorage.getItem("userEmail"));
    if (storedRole === "agent" && !AGENT_ALLOWED_PREFIXES.some(p => p === "/tea" ? pathname === "/tea" : pathname.startsWith(p))) {
      router.replace("/tea");
      return;
    }
    setAuthed(true);
  }, [pathname, router]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("tenantId");
    router.replace(role === "agent" ? "/agent-login" : "/login");
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

  const activeNav = role === "agent" ? agentNav : nav;
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
              <Link
                key={item.href}
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
