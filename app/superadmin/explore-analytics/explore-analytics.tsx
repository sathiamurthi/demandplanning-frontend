"use client";
import { useState, useEffect, useCallback } from "react";

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
      } else {
        setError(d.error);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const maxVisits = stats ? Math.max(...stats.sessions.map(s => s.visits), 1) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Explore Analytics</h1>
          <p className="text-gray-400 text-sm">DemandGenius explore users and engagement</p>
        </div>
        <div className="flex gap-1 bg-[#1f2430] rounded-xl p-1">
          {(["daily", "weekly", "monthly"] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize
                ${range === r ? "bg-[#6c63ff] text-white" : "text-gray-400 hover:text-white"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-300 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-200 ml-4">âœ•</button>
        </div>
      )}
      {actionMsg && (
        <div className="bg-green-900/30 border border-green-800 rounded-xl p-3 text-green-300 text-sm">{actionMsg}</div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Guests", value: stats?.total_guests ?? "â€”", color: "text-blue-400" },
          { label: `Active (${range})`, value: stats?.active_guests ?? "â€”", color: "text-green-400" },
          { label: "Sessions (chart)", value: stats?.sessions.reduce((a, s) => a + s.visits, 0) ?? "â€”", color: "text-purple-400" },
          { label: "Top Contributors", value: stats?.top_contributors.length ?? "â€”", color: "text-orange-400" },
        ].map(c => (
          <div key={c.label} className="bg-[#161a23] border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">{c.label}</p>
            <p className={`text-3xl font-black ${c.color}`}>{loadingStats ? "â€¦" : c.value}</p>
          </div>
        ))}
      </div>

      {/* Session Chart */}
      {stats && stats.sessions.length > 0 && (
        <div className="bg-[#161a23] border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-bold mb-4">Daily Visits</h2>
          <div className="flex items-end gap-1.5 h-32 overflow-x-auto pb-2">
            {stats.sessions.map(s => (
              <div key={s.date} className="flex flex-col items-center gap-1 min-w-[36px]">
                <span className="text-[10px] text-gray-500">{s.visits}</span>
                <div
                  className="w-7 bg-[#6c63ff] rounded-t-md transition-all"
                  style={{ height: `${Math.max(4, (s.visits / maxVisits) * 96)}px` }}
                />
                <span className="text-[9px] text-gray-600 rotate-[-45deg] origin-top-left translate-y-2 translate-x-1 whitespace-nowrap">
                  {s.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Contributors */}
      {stats && stats.top_contributors.length > 0 && (
        <div className="bg-[#161a23] border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-bold mb-4">Top Contributors</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="text-left pb-2">Guest</th>
                  <th className="text-right pb-2">Listings</th>
                  <th className="text-right pb-2">Sessions</th>
                  <th className="text-right pb-2">Last Seen</th>
                  <th className="text-right pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_contributors.map(g => (
                  <tr key={g.guest_id} className="border-b border-gray-900 hover:bg-gray-800/30">
                    <td className="py-2.5 text-white">
                      <div className="font-semibold">{g.guest_name}</div>
                      <div className="text-[10px] text-gray-600 font-mono">{g.guest_id}</div>
                    </td>
                    <td className="py-2.5 text-right text-orange-400 font-bold">{g.listing_count}</td>
                    <td className="py-2.5 text-right text-gray-300">{g.total_sessions}</td>
                    <td className="py-2.5 text-right text-gray-500 text-xs">{g.last_seen}</td>
                    <td className="py-2.5 text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${g.is_active ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
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

      {/* All Guests Table */}
      <div className="bg-[#161a23] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="text-white font-bold">All Guests <span className="text-gray-500 font-normal text-sm">({guestTotal})</span></h2>
          <input value={search} onChange={e => { setSearch(e.target.value); setGuestPage(1); }}
            placeholder="Search guest ID or nameâ€¦"
            className="bg-[#0d0f14] border border-gray-700 rounded-xl px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#6c63ff] w-64" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                <th className="text-left pb-2">Guest</th>
                <th className="text-right pb-2">First Seen</th>
                <th className="text-right pb-2">Last Seen</th>
                <th className="text-right pb-2">Sessions</th>
                <th className="text-right pb-2">Listings</th>
                <th className="text-right pb-2">Status</th>
                <th className="text-right pb-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingGuests ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-600">Loadingâ€¦</td></tr>
              ) : guests.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-600">No guests found</td></tr>
              ) : guests.map(g => (
                <tr key={g.guest_id} className={`border-b border-gray-900 hover:bg-gray-800/30 ${!g.is_active ? "opacity-50" : ""}`}>
                  <td className="py-2.5">
                    <div className="text-white font-semibold">{g.guest_name}</div>
                    <div className="text-[10px] text-gray-600 font-mono">{g.guest_id}</div>
                  </td>
                  <td className="py-2.5 text-right text-gray-500 text-xs">{g.first_seen}</td>
                  <td className="py-2.5 text-right text-gray-400 text-xs">{g.last_seen}</td>
                  <td className="py-2.5 text-right text-gray-300">{g.total_sessions}</td>
                  <td className="py-2.5 text-right text-orange-400 font-bold">{g.listing_count}</td>
                  <td className="py-2.5 text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${g.is_active ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
                      {g.is_active ? "Active" : "Deactivated"}
                    </span>
                    {g.deactivated_by && <div className="text-[9px] text-gray-600 mt-0.5">by {g.deactivated_by}</div>}
                  </td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => toggleGuest(g.guest_id, g.is_active)}
                      className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors ${g.is_active
                        ? "bg-red-900/50 text-red-400 hover:bg-red-900"
                        : "bg-green-900/50 text-green-400 hover:bg-green-900"
                      }`}>
                      {g.is_active ? "Deactivate" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {guestTotal > 30 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <button onClick={() => setGuestPage(p => Math.max(1, p - 1))} disabled={guestPage === 1}
              className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700">â† Prev</button>
            <span className="text-gray-500">Page {guestPage} Â· {guestTotal} total</span>
            <button onClick={() => setGuestPage(p => p + 1)} disabled={guestPage * 30 >= guestTotal}
              className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700">Next â†’</button>
          </div>
        )}
      </div>
    </div>
  );
}
