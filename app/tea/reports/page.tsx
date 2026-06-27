"use client";

import { useState, useEffect } from "react";
import { BarChart3, RefreshCw, Users } from "lucide-react";
import { teaUrl, teaAuthHeaders } from "@/lib/tea-api";

type ReportTab = "daily" | "weekly" | "ledger";

interface DailyReport {
  collection_date: string; total_kg: number; total_growers: number;
  grade_a_kg: number; grade_b_kg: number; grade_c_kg: number;
}
interface WeeklyReport {
  week_start: string; week_end: string;
  total_kg: number; total_growers: number; total_dispatched: number; net_settled: number;
}
interface LedgerEntry {
  date: string; type: string; description: string; kg: number; amount: number | null; balance: number;
}

export default function ReportsPage() {
  const [tab, setTab]           = useState<ReportTab>("daily");
  const [daily, setDaily]       = useState<DailyReport[]>([]);
  const [weekly, setWeekly]     = useState<WeeklyReport[]>([]);
  const [ledger, setLedger]     = useState<LedgerEntry[]>([]);
  const [growers, setGrowers]   = useState<{ id: string; name: string; grower_code: string }[]>([]);
  const [growerId, setGrowerId] = useState("");
  const [loading, setLoading]   = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 90);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetch(teaUrl("/growers"), { headers: teaAuthHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setGrowers(d.data); });
  }, []);

  useEffect(() => { loadReport(); }, [tab, dateFrom, dateTo]);

  const loadReport = async () => {
    setLoading(true);
    try {
      if (tab === "daily") {
        const r = await fetch(teaUrl(`/reports/daily?from=${dateFrom}&to=${dateTo}`), { headers: teaAuthHeaders() });
        const d = await r.json();
        if (d.success && Array.isArray(d.data)) setDaily(d.data);
      } else if (tab === "weekly") {
        const r = await fetch(teaUrl(`/reports/weekly?from=${dateFrom}&to=${dateTo}`), { headers: teaAuthHeaders() });
        const d = await r.json();
        if (d.success && Array.isArray(d.data)) setWeekly(d.data);
      }
    } catch {}
    setLoading(false);
  };

  const loadLedger = async () => {
    if (!growerId) return;
    setLoading(true);
    try {
      const r = await fetch(teaUrl(`/reports/grower-ledger/${growerId}?from=${dateFrom}&to=${dateTo}`), { headers: teaAuthHeaders() });
      const d = await r.json();
      if (d.success) setLedger(Array.isArray(d.data) ? d.data : []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (tab === "ledger" && growerId) loadLedger(); }, [growerId, tab]);

  const totalDailyKg = daily.reduce((s, d) => s + Number(d.total_kg), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <BarChart3 size={18} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Reports</h1>
            <p className="text-white/40 text-xs">Daily, weekly, and grower ledger reports</p>
          </div>
        </div>
        <button onClick={loadReport} className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[#161a23] border border-white/8 rounded-xl p-1 w-fit">
        {([["daily", "Daily Report"], ["weekly", "Weekly Report"], ["ledger", "Grower Ledger"]] as [ReportTab, string][]).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs transition-all ${tab === t ? "bg-blue-600/20 text-blue-400" : "text-white/40 hover:text-white"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="bg-[#161a23] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none" />
        <span className="text-white/30 text-xs">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="bg-[#161a23] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none" />
        {tab === "ledger" && (
          <select value={growerId} onChange={e => setGrowerId(e.target.value)}
            className="bg-[#161a23] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none">
            <option value="">Select grower...</option>
            {growers.map(g => <option key={g.id} value={g.id}>{g.name} ({g.grower_code})</option>)}
          </select>
        )}
        <button onClick={tab === "ledger" ? loadLedger : loadReport}
          className="bg-blue-600/80 hover:bg-blue-600 text-white px-4 py-1.5 rounded-xl text-xs font-medium">
          Load
        </button>
      </div>

      {/* Daily Report */}
      {tab === "daily" && (
        <>
          {daily.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Days", value: daily.length, color: "text-blue-400" },
                { label: "Total KG", value: `${totalDailyKg.toFixed(0)} kg`, color: "text-green-400" },
                { label: "Avg/Day", value: `${(totalDailyKg / daily.length).toFixed(0)} kg`, color: "text-yellow-400" },
              ].map(s => (
                <div key={s.label} className="bg-[#161a23] border border-white/8 rounded-xl p-3">
                  <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
                  <p className="text-white/40 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
            {loading ? <div className="p-8 text-center text-white/30 text-sm animate-pulse">Loading...</div>
            : daily.length === 0 ? <div className="p-8 text-center text-white/30 text-sm">No data in this range.</div>
            : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="px-4 py-3 text-left text-white/40 text-xs">Date</th>
                    <th className="px-4 py-3 text-left text-white/40 text-xs">Growers</th>
                    <th className="px-4 py-3 text-left text-white/40 text-xs">Total KG</th>
                    <th className="px-4 py-3 text-left text-white/40 text-xs hidden sm:table-cell">Grade A</th>
                    <th className="px-4 py-3 text-left text-white/40 text-xs hidden sm:table-cell">Grade B</th>
                    <th className="px-4 py-3 text-left text-white/40 text-xs hidden md:table-cell">Grade C</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map(d => (
                    <tr key={d.collection_date} className="border-b border-white/5 hover:bg-white/3">
                      <td className="px-4 py-3 text-white text-sm">{new Date(d.collection_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" })}</td>
                      <td className="px-4 py-3 text-white/70 text-sm">{d.total_growers}</td>
                      <td className="px-4 py-3 text-white font-semibold">{d.total_kg} kg</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-green-400 text-sm">{d.grade_a_kg} kg</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-blue-400 text-sm">{d.grade_b_kg} kg</td>
                      <td className="px-4 py-3 hidden md:table-cell text-yellow-400 text-sm">{d.grade_c_kg} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Weekly Report */}
      {tab === "weekly" && (
        <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
          {loading ? <div className="p-8 text-center text-white/30 text-sm animate-pulse">Loading...</div>
          : weekly.length === 0 ? <div className="p-8 text-center text-white/30 text-sm">No weekly data in this range.</div>
          : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="px-4 py-3 text-left text-white/40 text-xs">Week</th>
                  <th className="px-4 py-3 text-left text-white/40 text-xs">Growers</th>
                  <th className="px-4 py-3 text-left text-white/40 text-xs">Collected KG</th>
                  <th className="px-4 py-3 text-left text-white/40 text-xs hidden sm:table-cell">Dispatched KG</th>
                  <th className="px-4 py-3 text-left text-white/40 text-xs">Net Settled</th>
                </tr>
              </thead>
              <tbody>
                {weekly.map((w, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/3">
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{new Date(w.week_start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                      <p className="text-white/40 text-xs">to {new Date(w.week_end).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                    </td>
                    <td className="px-4 py-3 text-white/70 text-sm">{w.total_growers}</td>
                    <td className="px-4 py-3 text-white font-semibold">{w.total_kg} kg</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-yellow-400 text-sm">{w.total_dispatched} kg</td>
                    <td className="px-4 py-3 text-green-400 font-semibold">₹{Number(w.net_settled).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Grower Ledger */}
      {tab === "ledger" && (
        <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
          {!growerId ? (
            <div className="p-10 text-center text-white/30 text-sm">
              <Users size={32} className="mx-auto mb-3 opacity-20" />
              Select a grower to view their ledger.
            </div>
          ) : loading ? (
            <div className="p-8 text-center text-white/30 text-sm animate-pulse">Loading...</div>
          ) : ledger.length === 0 ? (
            <div className="p-8 text-center text-white/30 text-sm">No ledger entries in this range.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="px-4 py-3 text-left text-white/40 text-xs">Date</th>
                  <th className="px-4 py-3 text-left text-white/40 text-xs">Type</th>
                  <th className="px-4 py-3 text-left text-white/40 text-xs">Description</th>
                  <th className="px-4 py-3 text-left text-white/40 text-xs hidden sm:table-cell">KG</th>
                  <th className="px-4 py-3 text-left text-white/40 text-xs">Amount</th>
                  <th className="px-4 py-3 text-left text-white/40 text-xs">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((l, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/3">
                    <td className="px-4 py-3 text-white/60 text-sm">{new Date(l.date).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${l.type === "collection" ? "bg-green-500/15 text-green-400" : l.type === "advance" ? "bg-red-500/15 text-red-400" : "bg-blue-500/15 text-blue-400"}`}>
                        {l.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/60 text-sm">{l.description}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-white/50 text-sm">{l.kg ? `${l.kg} kg` : "—"}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {l.amount !== null
                        ? <span className="text-green-400">+₹{Number(l.amount).toFixed(0)}</span>
                        : <span className="text-white/30 text-xs">at settlement</span>}
                    </td>
                    <td className="px-4 py-3 text-white font-semibold text-sm">₹{Number(l.balance).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
