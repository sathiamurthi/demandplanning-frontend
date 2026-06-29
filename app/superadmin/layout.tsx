"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Building2, Shield, Bell,
  MessageSquare, CreditCard, BarChart2, Bot, LogOut,
  ChevronRight, Menu, X,
} from "lucide-react";

const NAV = [
  { href: "/superadmin",                  label: "Dashboard",        icon: LayoutDashboard },
  { href: "/superadmin/tenants",          label: "Tenants",          icon: Building2 },
  { href: "/superadmin/users",            label: "Users",            icon: Users },
  { href: "/superadmin/permissions",      label: "Permissions",      icon: Shield },
  { href: "/superadmin/coordinator-leads",label: "Coordinator Leads",icon: Shield },
  { href: "/superadmin/notifications",    label: "Notifications",    icon: Bell },
  { href: "/superadmin/messages",         label: "Messages",         icon: MessageSquare },
  { href: "/superadmin/subscriptions",    label: "Subscriptions",    icon: CreditCard },
  { href: "/superadmin/explore-analytics",label: "Explore Analytics",icon: BarChart2 },
  { href: "/superadmin/ai-usage",         label: "AI & Pipeline",    icon: Bot },
];

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/login");
  };

  const isActive = (href: string) =>
    href === "/superadmin" ? pathname === "/superadmin" : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-100 shadow-sm z-50
          flex flex-col transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>

        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="font-black text-gray-900 text-base leading-none">Nexus OS</p>
            <p className="text-[10px] text-orange-500 font-semibold tracking-widest uppercase mt-0.5">Superadmin</p>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-gray-600" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? "bg-orange-50 text-orange-600 font-semibold"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}>
                <Icon size={16} className={active ? "text-orange-500" : "text-gray-400"} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={12} className="text-orange-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button className="lg:hidden text-gray-500 hover:text-gray-800" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-xs">
            SA
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-5 md:p-6">{children}</main>
      </div>
    </div>
  );
}
