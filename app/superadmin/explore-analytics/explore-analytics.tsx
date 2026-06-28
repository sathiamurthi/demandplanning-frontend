"use client";
import { useState, useEffect, useCallback } from "react";
import { BarChart2, Users, Activity, Star, Search, RefreshCw } from "lucide-react";

interface Stats {
  total_guests: number;
  active_guests: number;
  sessions: { date: string; visits: number }[];
  top_contributors: { guest_id: string; guest_name: string; listing_count: number; total_sessions: number; last_seen: string; is_active: boolean }[];
}

interface Guest {
  guest_id: string;
  guest_name: string;
  first_seen: string;
  last_seen: string;
  total_sessions: number;
  listing_count: number;
  is_active: boolean;
  deactivated_at: string | null;
  deactivated_by: string | null;
}

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

function authHeader() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

export default function ExploreAnalytics() {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("daily");
  const [stats, setStats] = useState<Stats | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestTotal, setGuestTotal] = useState(0);
  const [guestPage, setGuestPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  const loadStats = useCallback(() => {
    setLoadingStats(true);
    fetch(`/v1/superadmin/explore/stats?range=${range}`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); else setError(d.error); })
      .catch(e => setError(e.message))
      .finally(() => setLoadingStats(false));
  }, [range]);

  const loadGuests = useCallback(() => {
    setLoadingGuests(true);
    const p = new URLSearchParams({ page: String(guestPage), limit: "30", ...(search && { search }) });
    fetch(`/v1/superadmin/explore/guests?${p}`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => { if (d.success) { setGuests(d.data); setGuestTotal(d.meta?.total || 0); } else setError(d.error); })
      .catch(e => setError(e.message))
      .finally(() => setLoadingGuests(false));
  }, [guestPage, search]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadGuests(); }, [loadGuests]);

  const toggleGuest = async (guestId: string, isActive: boolean) => {
    const action = isActive ? "deactivate" : "reactivate";
    try {
      const r = await fetch(`/v1/superadmin/explore/guests/${guestId}/${action}`, { method: "POST", headers: authHeader() });
      const d = await r.json();
      if (d.success) {
        setActionMsg(`Guest ${action}d successfully`);
        loadGuests();
        setTimeout(() => setActionMsg(""), 3000);
      } else setError(d.error);
    } catch (e: any) { setError(e.message); }
  };

  const maxVisits = stats ? Math.max(...stats.sessions.map(s => s.visits), 1) : 1;

  const statCards = [
    { label: "Total Guests",     value: stats?.total_guests ?? "—",                                     icon: Users,    color: "text-blue-600",   bg: "bg-blue-50"   },
    { label: `Active (${range})`,value: stats?.active_guests ?? "—",                                    icon: Activity, color: "text-green-600",  bg: "bg-green-50"  },
    { label: "Total Sessions",   value: stats?.sessions.reduce((a, s) => a + s.visits, 0) ?? "—",      icon: BarChart2,color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Top Contributors", value: stats?.top_contributors.length ?? "—",                          icon: Star,     color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Explore Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Guest users and engagement on /explore</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
            {(["daily", "weekly", "monthly"] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all
                  ${range === r ? "bg-white shadow-sm text-orange-600" : "text-gray-500 hover:text-gray-700"}`}>
                {r}
              </button>
            ))}
          </div>
          <button onClick={() => { loadStats(); loadGuests(); }} className="text-gray-400 hover:text-orange-500 transition-colors">
            <RefreshCw size={15} className={loadingStats ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 ml-4 font-bold">×</button>
        </div>
      )}
      {actionMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm">{actionMsg}</div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
                <Icon size={15} className={c.color} />
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{c.label}</p>
              <p className={`text-3xl font-black mt-0.5 ${c.color}`}>{loadingStats ? "…" : c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Session Chart */}
      {stats && stats.sessions.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="font-bold text-gray-900 mb-4">Visits Over Time</h2>
          <div className="flex items-end gap-1.5 h-32 overflow-x-auto pb-2">
            {stats.sessions.map(s => (
              <div key={s.date} className="flex flex-col items-center gap-1 min-w-[36px]">
                <span className="text-[10px] text-gray-400">{s.visits}</span>
                <div
                  className="w-7 bg-orange-400 rounded-t-md transition-all hover:bg-orange-500"
                  style={{ height: `${Math.max(4, (s.visits / maxVisits) * 96)}px` }}
                />
                <span className="text-[9px] text-gray-400 rotate-[-45deg] origin-top-left translate-y-2 translate-x-1 whitespace-nowrap">
                  {s.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Contributors */}
      {stats && stats.top_contributors.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="font-bold text-gray-900 mb-4">Top Contributors</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Guest</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Listings</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sessions</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Seen</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_contributors.map(g => (
                  <tr key={g.guest_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-gray-900">{g.guest_name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{g.guest_id}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right text-orange-600 font-bold">{g.listing_count}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{g.total_sessions}</td>
                    <td className="px-3 py-2.5 text-right text-gray-400 text-xs">{g.last_seen}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${g.is_active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                        {g.is_active ? "Active" : "Off"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Guests */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="font-bold text-gray-900">All Guests <span className="text-gray-400 font-normal text-sm">({guestTotal})</span></h2>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input value={search} onChange={e => { setSearch(e.target.value); setGuestPage(1); }}
              placeholder="Search guest ID or name…"
              className="border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-orange-400 w-56" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Guest</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">First Seen</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Seen</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sessions</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Listings</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingGuests ? (
                <tr><td colSpan={7} className="py-10 text-center text-gray-400 text-sm">Loading…</td></tr>
              ) : guests.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-gray-400 text-sm">No guests found</td></tr>
              ) : guests.map(g => (
                <tr key={g.guest_id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${!g.is_active ? "opacity-50" : ""}`}>
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-gray-900">{g.guest_name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{g.guest_id}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-400 text-xs">{g.first_seen}</td>
                  <td className="px-3 py-2.5 text-right text-gray-500 text-xs">{g.last_seen}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{g.total_sessions}</td>
                  <td className="px-3 py-2.5 text-right text-orange-600 font-bold">{g.listing_count}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${g.is_active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                      {g.is_active ? "Active" : "Off"}
                    </span>
                    {g.deactivated_by && <div className="text-[9px] text-gray-400 mt-0.5">by {g.deactivated_by}</div>}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => toggleGuest(g.guest_id, g.is_active)}
                      className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors ${g.is_active
                        ? "bg-red-50 text-red-500 hover:bg-red-100"
                        : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                      {g.is_active ? "Deactivate" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {guestTotal > 30 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <button onClick={() => setGuestPage(p => Math.max(1, p - 1))} disabled={guestPage === 1}
              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-200">← Prev</button>
            <span className="text-gray-400 text-xs">Page {guestPage} · {guestTotal} total</span>
            <button onClick={() => setGuestPage(p => p + 1)} disabled={guestPage * 30 >= guestTotal}
              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-200">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
