"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Leaf, LayoutDashboard, Users, ClipboardList, Truck,
  Factory, Wallet, BarChart3, Settings, ChevronLeft, ChevronRight,
  Menu, X
} from "lucide-react";

const nav = [
  { href: "/tea",            icon: LayoutDashboard, label: "Dashboard",    exact: true },
  { href: "/tea/growers",    icon: Users,           label: "Growers" },
  { href: "/tea/collections",icon: ClipboardList,   label: "Collections" },
  { href: "/tea/dispatch",   icon: Truck,           label: "Dispatch" },
  { href: "/tea/settlements",icon: Factory,         label: "Settlement" },
  { href: "/tea/payments",   icon: Wallet,          label: "Payments" },
  { href: "/tea/reports",    icon: BarChart3,       label: "Reports" },
  { href: "/tea/settings",   icon: Settings,        label: "Settings" },
];

export default function TeaLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authed, setAuthed]         = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else {
      setAuthed(true);
    }
  }, [pathname, router]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/40">
          <div className="w-5 h-5 border-2 border-green-500/40 border-t-green-400 rounded-full animate-spin" />
          <span className="text-sm">Checking session…</span>
        </div>
      </div>
    );
  }

  const isActive = (item: typeof nav[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white flex">
      {/* Sidebar */}
      <aside className={`
        hidden lg:flex flex-col bg-[#0f1218] border-r border-white/8
        transition-all duration-300
        ${collapsed ? "w-16" : "w-56"}
      `}>
        {/* Logo */}
        <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-white/8 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 bg-green-600/20 rounded-xl flex items-center justify-center shrink-0">
            <Leaf size={16} className="text-green-400" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-semibold text-white text-sm leading-tight">ABC Tea Agency</p>
              <p className="text-white/30 text-xs">Tea Procurement</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {nav.map(item => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-2.5 mx-2 my-0.5 rounded-xl text-sm transition-all
                  ${active ? "bg-green-600/15 text-green-400" : "text-white/50 hover:text-white hover:bg-white/5"}
                  ${collapsed ? "justify-center px-2" : ""}
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={16} className={active ? "text-green-400" : ""} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center p-3 border-t border-white/8 text-white/30 hover:text-white"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Mobile nav */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0f1218] border-b border-white/8 flex items-center gap-3 px-4 py-3">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white/60">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex items-center gap-2">
          <Leaf size={16} className="text-green-400" />
          <span className="font-semibold text-sm">ABC Tea Agency</span>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)}>
          <nav className="bg-[#0f1218] w-56 h-full py-16 px-2" onClick={e => e.stopPropagation()}>
            {nav.map(item => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm my-0.5 ${
                    active ? "bg-green-600/15 text-green-400" : "text-white/50"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
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
