"use client";
import { useEffect, useState } from "react";
import { Building2, Users, Store, BarChart2, TrendingUp, CheckCircle2, Clock } from "lucide-react";

function authHeader() {
  if (typeof window === "undefined") return {};
  const tok = localStorage.getItem("token") || "";
  return { Authorization: `Bearer ${tok}` };
}

interface DashStats {
  total_tenants: number;
  active_tenants: number;
  pending_tenants: number;
  total_users: number;
  total_stores: number;
  explore_guests: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentTenants, setRecentTenants] = useState<any[]>([]);

  useEffect(() => {
    const headers = authHeader() as HeadersInit;

    Promise.all([
      fetch("/v1/superadmin/tenants", { headers }).then(r => r.json()),
      fetch("/v1/superadmin/users",   { headers }).then(r => r.json()),
      fetch("/v1/superadmin/explore/stats?range=daily", { headers }).then(r => r.json()),
    ]).then(([tenants, users, explore]) => {
      const tenantList: any[] = Array.isArray(tenants) ? tenants : (tenants.data || []);
      const userList: any[]   = users.data || [];
      const exploreData       = explore.data || {};

      const storeCount = tenantList.reduce((acc: number, t: any) => acc + (t.store_count || 0), 0);

      setStats({
        total_tenants:   tenantList.length,
        active_tenants:  tenantList.filter((t: any) => t.is_active).length,
        pending_tenants: tenantList.filter((t: any) => !t.is_active).length,
        total_users:     userList.length,
        total_stores:    storeCount,
        explore_guests:  exploreData.total_guests || 0,
      });

      setRecentTenants(tenantList.slice(0, 5));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: "Total Tenants",   value: stats.total_tenants,   icon: Building2,    color: "text-blue-600",   bg: "bg-blue-50"   },
    { label: "Active Tenants",  value: stats.active_tenants,  icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50"  },
    { label: "Pending Approval",value: stats.pending_tenants, icon: Clock,        color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Platform Users",  value: stats.total_users,     icon: Users,        color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Stores",    value: stats.total_stores,    icon: Store,        color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Explore Guests",  value: stats.explore_guests,  icon: BarChart2,    color: "text-pink-600",   bg: "bg-pink-50"   },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Superadmin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Platform overview — tenants, users, stores and explore activity</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({length: 6}).map((_,i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
              <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
              <div className="h-8 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map(c => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
                  <Icon size={18} className={c.color} />
                </div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{c.label}</p>
                <p className={`text-3xl font-black mt-0.5 ${c.color}`}>{c.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Tenants */}
      {recentTenants.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={16} className="text-orange-500" /> Recent Tenants
            </h2>
            <a href="/superadmin/tenants" className="text-xs text-orange-500 font-semibold hover:underline">View all</a>
          </div>
          <div className="space-y-2">
            {recentTenants.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-black text-xs shrink-0">
                  {(t.company_name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{t.company_name || "—"}</p>
                  <p className="text-xs text-gray-400 truncate">{t.admin_email || "—"}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    t.is_active ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
                  }`}>
                    {t.is_active ? "Active" : "Pending"}
                  </span>
                  <span className="text-[10px] text-gray-400">{t.store_count || 0} stores · {t.user_count || 0} users</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
