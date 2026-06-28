"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, Users, Globe } from "lucide-react";

interface DomainUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  is_email_verified: boolean;
  tenant_id: string;
}

interface ExploreGuest {
  guest_id: string;
  guest_name: string;
  first_seen: string;
  last_seen: string;
  total_sessions: number;
  listing_count: number;
  is_active: boolean;
  deactivated_by: string | null;
}

function authHeader() {
  if (typeof window === "undefined") return {};
  const tok = localStorage.getItem("token") || "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${tok}` };
}

export default function UsersPage() {
  const [tab, setTab] = useState<"domain" | "explore">("domain");

  // Domain users state
  const [domainUsers, setDomainUsers] = useState<DomainUser[]>([]);
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainSearch, setDomainSearch] = useState("");

  // Explore guests state
  const [guests, setGuests] = useState<ExploreGuest[]>([]);
  const [guestTotal, setGuestTotal] = useState(0);
  const [guestPage, setGuestPage] = useState(1);
  const [guestSearch, setGuestSearch] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadDomainUsers = useCallback(async () => {
    setDomainLoading(true);
    try {
      const r = await fetch("/v1/superadmin/users", { headers: authHeader() as HeadersInit });
      const d = await r.json();
      setDomainUsers(d.data || []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setDomainLoading(false);
    }
  }, []);

  const loadGuests = useCallback(async () => {
    setGuestLoading(true);
    try {
      const p = new URLSearchParams({ page: String(guestPage), limit: "30", ...(guestSearch && { search: guestSearch }) });
      const r = await fetch(`/v1/superadmin/explore/guests?${p}`, { headers: authHeader() as HeadersInit });
      const d = await r.json();
      if (d.success) {
        setGuests(d.data || []);
        setGuestTotal(d.meta?.total || 0);
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setGuestLoading(false);
    }
  }, [guestPage, guestSearch]);

  useEffect(() => { loadDomainUsers(); }, [loadDomainUsers]);
  useEffect(() => { if (tab === "explore") loadGuests(); }, [tab, loadGuests]);

  const toggleGuest = async (guestId: string, isActive: boolean) => {
    const action = isActive ? "deactivate" : "reactivate";
    try {
      const r = await fetch(`/v1/superadmin/explore/guests/${guestId}/${action}`, { method: "POST", headers: authHeader() as HeadersInit });
      const d = await r.json();
      if (!d.success) throw new Error(d.error);
      setMsg(`Guest ${action}d`);
      loadGuests();
      setTimeout(() => setMsg(""), 3000);
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const filteredDomain = domainUsers.filter(u => {
    const q = domainSearch.toLowerCase();
    return !q || (u.email || "").toLowerCase().includes(q) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform users and explore guests</p>
      </div>

      {msg && <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-green-700 text-sm">{msg}</div>}
      {err && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-600 text-sm flex items-center justify-between">{err}<button onClick={() => setErr("")} className="ml-3 font-bold">×</button></div>}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab("domain")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
            ${tab === "domain" ? "bg-white shadow-sm text-orange-600" : "text-gray-500 hover:text-gray-700"}`}>
          <Users size={14} /> Domain Users
        </button>
        <button onClick={() => setTab("explore")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
            ${tab === "explore" ? "bg-white shadow-sm text-orange-600" : "text-gray-500 hover:text-gray-700"}`}>
          <Globe size={14} /> Explore Guests
        </button>
      </div>

      {/* Domain Users */}
      {tab === "domain" && (
        <div className="space-y-3">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input value={domainSearch} onChange={e => setDomainSearch(e.target.value)}
                placeholder="Search name, email, role…"
                className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <button onClick={loadDomainUsers} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-500 transition-colors">
              <RefreshCw size={13} className={domainLoading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {domainLoading ? (
              <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
            ) : filteredDomain.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Verified</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tenant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDomain.map(u => (
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-[10px] shrink-0">
                              {(u.first_name || u.email || "?").charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">{`${u.first_name || ""} ${u.last_name || ""}`.trim() || "—"}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-gray-600 text-xs">{u.email || "—"}</td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">{u.role}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.is_active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-[10px] ${u.is_email_verified ? "text-green-500" : "text-gray-400"}`}>
                            {u.is_email_verified ? "✓" : "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-400 font-mono">{u.tenant_id?.slice(0, 8) || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400">{filteredDomain.length} platform users (owners, managers, staff)</p>
        </div>
      )}

      {/* Explore Guests */}
      {tab === "explore" && (
        <div className="space-y-3">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input value={guestSearch} onChange={e => { setGuestSearch(e.target.value); setGuestPage(1); }}
                placeholder="Search guest ID or name…"
                className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <button onClick={loadGuests} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-500 transition-colors">
              <RefreshCw size={13} className={guestLoading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {guestLoading ? (
              <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
            ) : guests.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">No explore guests found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Guest</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sessions</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Listings</th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Seen</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guests.map(g => (
                      <tr key={g.guest_id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${!g.is_active ? "opacity-50" : ""}`}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{g.guest_name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{g.guest_id}</p>
                        </td>
                        <td className="px-3 py-3 text-center text-gray-700 font-semibold">{g.total_sessions}</td>
                        <td className="px-3 py-3 text-center text-orange-600 font-bold">{g.listing_count}</td>
                        <td className="px-3 py-3 text-right text-xs text-gray-400">{g.last_seen ? new Date(g.last_seen).toLocaleDateString("en-IN") : "—"}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${g.is_active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                            {g.is_active ? "Active" : "Deactivated"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => toggleGuest(g.guest_id, g.is_active)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${g.is_active
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
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{guestTotal} explore guests (anonymous/guest users of /explore)</span>
            {guestTotal > 30 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setGuestPage(p => Math.max(1, p - 1))} disabled={guestPage === 1}
                  className="px-3 py-1 bg-gray-100 rounded-lg disabled:opacity-40 hover:bg-gray-200 text-gray-600">← Prev</button>
                <span>Page {guestPage}</span>
                <button onClick={() => setGuestPage(p => p + 1)} disabled={guestPage * 30 >= guestTotal}
                  className="px-3 py-1 bg-gray-100 rounded-lg disabled:opacity-40 hover:bg-gray-200 text-gray-600">Next →</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
