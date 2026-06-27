"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, LayoutDashboard, Users, BarChart3, Wallet, LogOut, Menu, X } from "lucide-react";

const nav = [
  { href: "/grower",         icon: LayoutDashboard, label: "Dashboard",  exact: true },
  { href: "/grower/workers", icon: Users,           label: "Workers & Wages" },
  { href: "/grower/collections", icon: BarChart3,   label: "Collections" },
  { href: "/grower/settlements", icon: Wallet,      label: "Payments" },
];

export default function GrowerLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed]     = useState(false);
  const [name, setName]         = useState("Grower");
  const [mobileOpen, setMobile] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("grower_token");
    if (!token) {
      const tenant = localStorage.getItem("grower_tenant") || "";
      router.replace(`/grower/login?t=${tenant}`);
    } else {
      setName(localStorage.getItem("grower_name") || "Grower");
      setAuthed(true);
    }
  }, [router]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0a1a0f] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/40">
          <div className="w-5 h-5 border-2 border-green-500/30 border-t-green-400 rounded-full animate-spin" />
          <span className="text-sm">Checking session…</span>
        </div>
      </div>
    );
  }

  const signOut = () => {
    ["grower_token", "grower_id", "grower_name", "grower_tenant"].forEach(k => localStorage.removeItem(k));
    router.push("/grower/login");
  };

  const isActive = (item: typeof nav[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="min-h-screen bg-[#0a1209] text-white flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-52 bg-[#0d1810] border-r border-white/8">
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/8">
          <div className="w-8 h-8 bg-green-600/20 rounded-xl flex items-center justify-center">
            <Leaf size={16} className="text-green-400" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{name}</p>
            <p className="text-white/30 text-xs">Grower Portal</p>
          </div>
        </div>

        <nav className="flex-1 py-3">
          {nav.map(item => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 my-0.5 rounded-xl text-sm transition-all
                  ${active ? "bg-green-600/15 text-green-400" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button onClick={signOut}
          className="flex items-center gap-2 px-4 py-4 border-t border-white/8 text-white/30 hover:text-red-400 text-sm">
          <LogOut size={14} /> Sign out
        </button>
      </aside>

      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0d1810] border-b border-white/8 flex items-center gap-3 px-4 py-3">
        <button onClick={() => setMobile(!mobileOpen)} className="text-white/60">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Leaf size={16} className="text-green-400" />
        <span className="font-semibold text-sm">{name}</span>
        <button onClick={signOut} className="ml-auto text-white/30 hover:text-red-400">
          <LogOut size={16} />
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobile(false)}>
          <nav className="bg-[#0d1810] w-52 h-full py-16 px-2" onClick={e => e.stopPropagation()}>
            {nav.map(item => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobile(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm my-0.5
                    ${active ? "bg-green-600/15 text-green-400" : "text-white/50"}`}>
                  <Icon size={16} /> {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 lg:pt-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
