"use client";
import { useEffect, useState } from "react";
import { Loader2, Ban, CheckCircle, Send, RefreshCw } from "lucide-react";

export interface AccountRow {
  id: string; name?: string | null; email?: string | null; phone?: string | null;
  is_active: boolean; created_at: string; [key: string]: any;
}
export interface AccountColumn { key: string; label: string; render?: (row: AccountRow) => React.ReactNode }

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") || "" : ""; }
function auth() { return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }; }

/**
 * Reusable across every app's superadmin page: list accounts, suspend/
 * reactivate login access, and send a payment reminder (WhatsApp/email,
 * whichever the backend finds on file) — same three actions regardless of
 * which app's account table is behind `listUrl`/`actionBase`.
 *
 * `actionBase` can be a function of the row when a single list mixes
 * multiple account kinds with different action routes (e.g. Ride360's
 * drivers + customers in one table).
 */
export default function AccountTable({
  listUrl, actionBase, columns, emptyLabel, planActionBase,
}: {
  listUrl: string;
  actionBase: string | ((row: AccountRow) => string);
  columns: AccountColumn[];
  emptyLabel: string;
  planActionBase?: string;
}) {
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    fetch(listUrl, { headers: auth() })
      .then(r => r.json())
      .then(d => { if (d.success) setRows(d.data); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [listUrl]);

  const act = async (row: AccountRow, action: "suspend" | "reactivate" | "send-reminder") => {
    const base = typeof actionBase === "function" ? actionBase(row) : actionBase;
    setBusyId(row.id); setMsg("");
    try {
      const r = await fetch(`${base}/${row.id}/${action}`, { method: "POST", headers: auth(), body: action === "send-reminder" ? JSON.stringify({}) : undefined });
      const d = await r.json();
      if (action === "send-reminder") {
        setMsg(d.success ? `Reminder sent via ${d.data.channel} to ${row.name || row.phone || row.email}.` : d.error);
      } else if (d.success) {
        load();
      } else {
        setMsg(d.error || "Action failed");
      }
    } finally { setBusyId(null); }
  };

  const setPlan = async (row: AccountRow, premium: boolean) => {
    setBusyId(row.id); setMsg("");
    try {
      const r = await fetch(`${planActionBase}/${row.id}/plan`, { method: "POST", headers: auth(), body: JSON.stringify({ premium }) });
      const d = await r.json();
      if (d.success) load(); else setMsg(d.error || "Plan update failed");
    } finally { setBusyId(null); }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{rows.length} account{rows.length !== 1 ? "s" : ""}</p>
        <button onClick={load} className="text-gray-400 hover:text-gray-600" title="Refresh"><RefreshCw size={13} /></button>
      </div>
      {msg && <div className="px-4 py-2 bg-teal-50 border-b border-teal-100 text-xs text-teal-700">{msg}</div>}
      {loading ? (
        <div className="p-8 text-center"><Loader2 className="animate-spin text-gray-300 mx-auto" size={20} /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                {columns.map(c => <th key={c.key} className="text-left px-4 py-3">{c.label}</th>)}
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="border-t border-gray-100">
                  {columns.map(c => <td key={c.key} className="px-4 py-2.5 text-gray-700">{c.render ? c.render(row) : (row[c.key] ?? "—")}</td>)}
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.is_active !== false ? "bg-teal-50 text-teal-700" : "bg-red-50 text-red-700"}`}>
                      {row.is_active !== false ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {row.is_active !== false ? (
                        <button onClick={() => act(row, "suspend")} disabled={busyId === row.id} className="flex items-center gap-1 text-[11px] font-bold text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 px-2 py-1 rounded-lg transition">
                          {busyId === row.id ? <Loader2 size={11} className="animate-spin" /> : <Ban size={11} />} Suspend
                        </button>
                      ) : (
                        <button onClick={() => act(row, "reactivate")} disabled={busyId === row.id} className="flex items-center gap-1 text-[11px] font-bold text-teal-600 border border-teal-200 hover:bg-teal-50 disabled:opacity-50 px-2 py-1 rounded-lg transition">
                          {busyId === row.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />} Reactivate
                        </button>
                      )}
                      <button onClick={() => act(row, "send-reminder")} disabled={busyId === row.id} className="flex items-center gap-1 text-[11px] font-bold text-gray-500 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 px-2 py-1 rounded-lg transition">
                        <Send size={11} /> Reminder
                      </button>
                      {planActionBase && <button onClick={() => setPlan(row, !row.premium)} disabled={busyId === row.id} className="text-[11px] font-bold text-amber-700 border border-amber-200 hover:bg-amber-50 disabled:opacity-50 px-2 py-1 rounded-lg transition">
                        {row.premium ? "Make Trial" : "Make Paid"}
                      </button>}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={columns.length + 2} className="px-4 py-8 text-center text-gray-400">{emptyLabel}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
