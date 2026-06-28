"use client";
import { useEffect, useState, useCallback } from "react";
import { Building2, Store, Users, CheckCircle2, Clock, XCircle, Search, RefreshCw } from "lucide-react";

interface Tenant {
  id: string;
  company_name: string;
  admin_email: string;
  status: string;
  is_active: boolean;
  plan_type: string;
  created_at: string;
  store_count: number;
  user_count: number;
}

function authHeader() {
  if (typeof window === "undefined") return {};
  const tok = localStorage.getItem("token") || "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${tok}` };
}

export default function Tenants() {
  const [tenants, setTenants]   = useState<Tenant[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState("");
  const [filter,  setFilter]    = useState<"all"|"active"|"pending">("all");
  const [actionId, setActionId] = useState<string | null>(null);
  const [msg, setMsg]           = useState("");
  const [err, setErr]           = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/v1/superadmin/tenants", { headers: authHeader() as HeadersInit });
      const d = await r.json();
      const list: Tenant[] = Array.isArray(d) ? d : (d.data || []);
      setTenants(list);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    setActionId(id);
    try {
      const r = await fetch(`/v1/superadmin/tenants/approve/${id}`, { method: "POST", headers: authHeader() as HeadersInit });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || "Failed");
      setMsg("Tenant approved and activated successfully");
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setActionId(null);
      setTimeout(() => setMsg(""), 4000);
    }
  };

  const deactivate = async (id: string) => {
    if (!confirm("Deactivate this tenant? Their users won't be able to login.")) return;
    setActionId(id);
    try {
      const r = await fetch(`/v1/superadmin/tenants/deactivate/${id}`, { method: "POST", headers: authHeader() as HeadersInit });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || "Failed");
      setMsg("Tenant deactivated");
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setActionId(null);
      setTimeout(() => setMsg(""), 4000);
    }
  };

  const filtered = tenants.filter(t => {
    const matchSearch = !search ||
      (t.company_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.admin_email  || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all"     ? true :
      filter === "active"  ? t.is_active :
      /* pending */           !t.is_active;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tenants.length} total · {tenants.filter(t => t.is_active).length} active · {tenants.filter(t => !t.is_active).length} pending</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {msg && <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-green-700 text-sm">{msg}</div>}
      {err && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-600 text-sm flex items-center justify-between">{err}<button onClick={() => setErr("")} className="ml-3 font-bold">×</button></div>}

      {/* Search + filter */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-orange-400"
          />
        </div>
        <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
          {(["all","active","pending"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f ? "bg-white shadow-sm text-orange-600" : "text-gray-500 hover:text-gray-700"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No tenants found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tenant</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stores</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Users</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-black text-xs shrink-0">
                          {(t.company_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{t.company_name || <span className="text-gray-400 italic">Unnamed</span>}</p>
                          <p className="text-xs text-gray-400">{t.admin_email || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="flex items-center justify-center gap-1 text-gray-700 font-semibold">
                        <Store size={12} className="text-orange-400" /> {t.store_count ?? 0}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="flex items-center justify-center gap-1 text-gray-700 font-semibold">
                        <Users size={12} className="text-blue-400" /> {t.user_count ?? 0}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                        {t.plan_type || "free"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {t.is_active ? (
                        <span className="flex items-center justify-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={10} /> Active
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                          <Clock size={10} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-gray-400">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!t.is_active && (
                          <button
                            onClick={() => approve(t.id)}
                            disabled={actionId === t.id}
                            className="text-xs font-bold px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors disabled:opacity-50">
                            {actionId === t.id ? "…" : "Approve"}
                          </button>
                        )}
                        {t.is_active && (
                          <button
                            onClick={() => deactivate(t.id)}
                            disabled={actionId === t.id}
                            className="text-xs font-bold px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-xl transition-colors disabled:opacity-50">
                            {actionId === t.id ? "…" : "Deactivate"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
