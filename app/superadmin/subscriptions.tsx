"use client";
import { useState, useEffect, useCallback } from "react";
import { CreditCard, RefreshCw, Search, Loader2, CheckCircle, AlertCircle, Clock, Building2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "https://demandplanning-backend.onrender.com";
function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("nexus_superadmin_token") || "";
}
function authH(): HeadersInit {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}
function fmt(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

interface Sub {
  id: string; tenant_id: string; tenant_name: string;
  plan: string; status: string;
  valid_from: string | null; valid_to: string | null;
  created_at: string;
}

const PLAN_COLOR: Record<string, string> = {
  free:       "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  basic:      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  pro:        "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  enterprise: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};
const STATUS_COLOR: Record<string, string> = {
  active:   "text-green-600 dark:text-green-400",
  expired:  "text-red-500",
  cancelled:"text-gray-400",
  trial:    "text-blue-500",
};

export default function Subscriptions() {
  const [subs, setSubs]       = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [error, setError]     = useState("");

  // Plan update state
  const [editing, setEditing]   = useState<string | null>(null);
  const [newPlan, setNewPlan]   = useState("");
  const [saving, setSaving]     = useState(false);
  const [saveOk, setSaveOk]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API}/v1/superadmin/subscriptions`, { headers: authH() });
      const d = await r.json();
      if (d.success) setSubs(d.data || []);
      else throw new Error(d.error || "Failed to load");
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updatePlan = async (tenantId: string) => {
    if (!newPlan) return;
    setSaving(true);
    try {
      const r = await fetch(`${API}/v1/superadmin/subscriptions`, {
        method: "POST",
        headers: authH(),
        body: JSON.stringify({ tenantId, plan: newPlan }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || "Update failed");
      setSaveOk(tenantId);
      setEditing(null); setNewPlan("");
      setTimeout(() => setSaveOk(null), 3000);
      load();
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  const filtered = subs.filter(s =>
    !search || s.tenant_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.plan?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
          <CreditCard size={18} className="text-green-500"/>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
          <p className="text-xs text-gray-500">View and manage tenant billing plans</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex-1 max-w-xs">
          <Search size={13} className="text-gray-400 shrink-0"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenant or plan…"
            className="text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none w-full"/>
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <RefreshCw size={14} className="text-gray-500"/>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg px-4 py-3">
          <AlertCircle size={14}/>{error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-300"/></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard size={28} className="text-gray-300 mx-auto mb-2"/>
            <p className="text-sm text-gray-400">{subs.length === 0 ? "No subscriptions found" : "No results match your search"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  {["Tenant","Plan","Status","Valid From","Valid To",""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={13} className="text-gray-400 shrink-0"/>
                        <span className="font-medium text-gray-900 dark:text-white">{s.tenant_name || s.tenant_id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${PLAN_COLOR[s.plan?.toLowerCase()] || PLAN_COLOR.free}`}>
                        {s.plan || "free"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold capitalize ${STATUS_COLOR[s.status?.toLowerCase()] || "text-gray-400"}`}>
                        {s.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10}/>{fmt(s.valid_from)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${s.valid_to && new Date(s.valid_to) < new Date() ? "text-red-500" : "text-gray-500"}`}>{fmt(s.valid_to)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {editing === s.tenant_id ? (
                        <div className="flex items-center gap-2">
                          <select value={newPlan} onChange={e => setNewPlan(e.target.value)}
                            className="border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option value="">Pick plan…</option>
                            {["free","basic","pro","enterprise"].map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <button onClick={() => updatePlan(s.tenant_id)} disabled={saving || !newPlan}
                            className="px-2.5 py-1 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition">
                            {saving ? <Loader2 size={11} className="animate-spin"/> : "Save"}
                          </button>
                          <button onClick={() => { setEditing(null); setNewPlan(""); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setEditing(s.tenant_id); setNewPlan(s.plan || ""); }}
                            className="px-2.5 py-1 border border-gray-200 dark:border-gray-600 hover:border-violet-300 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 transition">
                            Change Plan
                          </button>
                          {saveOk === s.tenant_id && <CheckCircle size={13} className="text-green-500"/>}
                        </div>
                      )}
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
