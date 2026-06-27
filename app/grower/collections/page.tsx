"use client";

import { useState, useEffect } from "react";
import { BarChart3, RefreshCw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/v1";
function gh(): HeadersInit {
  const t = typeof window !== "undefined" ? localStorage.getItem("grower_token") : null;
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}
function gu(p: string) {
  const tid = typeof window !== "undefined" ? localStorage.getItem("grower_tenant") : "";
  return `${API}/tenants/${tid}/tea${p}`;
}

type GroupBy = "daily" | "weekly" | "monthly";

export default function GrowerCollectionsPage() {
  const [group, setGroup] = useState<GroupBy>("weekly");
  const [rows, setRows]   = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom]   = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    const r = await fetch(gu(`/grower-portal/collections?group=${group}&from=${from}&to=${to}`), { headers: gh() });
    const d = await r.json();
    if (d.success) setRows(d.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [group, from, to]);

  const totalKg = rows.reduce((s, r) => s + Number(r.total_kg), 0);
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <BarChart3 size={18} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">My Collections</h1>
            <p className="text-white/40 text-xs">Daily · weekly · monthly tea kg report</p>
          </div>
        </div>
        <button onClick={load} className="text-white/30 hover:text-white"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <div className="flex gap-1 bg-[#0d1810] border border-white/8 rounded-xl p-1">
          {(["daily", "weekly", "monthly"] as GroupBy[]).map(g => (
            <button key={g} onClick={() => setGroup(g)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all capitalize ${group === g ? "bg-green-600/20 text-green-400" : "text-white/40 hover:text-white"}`}>
              {g}
            </button>
          ))}
        </div>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="bg-[#0d1810] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none" />
        <span className="text-white/30 text-xs">to</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          className="bg-[#0d1810] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none" />
      </div>

      {/* Summary */}
      <div className="bg-[#0d1810] border border-green-500/20 rounded-xl p-3 mb-4 inline-flex items-center gap-3">
        <span className="text-white/40 text-xs">Total KG in period:</span>
        <span className="text-green-400 font-bold">{totalKg.toFixed(2)} kg</span>
        <span className="text-white/20 text-xs">({rows.length} {group} periods)</span>
      </div>

      {/* Table */}
      <div className="bg-[#0d1810] border border-white/8 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              <th className="px-4 py-3 text-left text-white/40 text-xs">Period</th>
              <th className="px-4 py-3 text-left text-white/40 text-xs">Total KG</th>
              <th className="px-4 py-3 text-left text-white/40 text-xs hidden sm:table-cell">Entries</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={3} className="p-8 text-center text-white/30 text-sm">No collection data in this period</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/3">
                <td className="px-4 py-3 text-white/70 text-sm">{fmt(r.period)}</td>
                <td className="px-4 py-3 text-white font-semibold text-sm">{Number(r.total_kg).toFixed(2)} kg</td>
                <td className="px-4 py-3 text-white/40 text-sm hidden sm:table-cell">{r.entries}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
