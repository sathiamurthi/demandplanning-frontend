"use client";

import { useState, useEffect } from "react";
import { BarChart3, RefreshCw, Users } from "lucide-react";
import { teaUrl, teaAuthHeaders } from "@/lib/tea-api";

type ReportTab = "daily" | "weekly" | "ledger" | "yield" | "inventory" | "sales";

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
interface YieldRow {
  id: string; collection_date: string; stage: string;
  green_leaf_kg: number; made_tea_kg: number | null; yield_pct: number | null;
}
interface InventoryRow {
  id: string; name: string; category: string; unit: string;
  current_qty: number; reorder_level: number; needs_reorder: boolean; pending_indents: number;
}
interface SalesByChannel {
  channel: string; transactions: number; total_kg: number; total_revenue: number; avg_price_per_kg: number;
}
interface AuctionPerf {
  lot_number: string; reserve_price: number; sold_price: number; pct_vs_reserve: number | null;
}

export default function ReportsPage() {
  const [tab, setTab]           = useState<ReportTab>("daily");
  const [daily, setDaily]       = useState<DailyReport[]>([]);
  const [weekly, setWeekly]     = useState<WeeklyReport[]>([]);
  const [ledger, setLedger]     = useState<LedgerEntry[]>([]);
  const [yieldRows, setYieldRows] = useState<YieldRow[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [salesByChannel, setSalesByChannel] = useState<SalesByChannel[]>([]);
  const [auctionPerf, setAuctionPerf] = useState<AuctionPerf[]>([]);
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
      } else if (tab === "yield") {
        const r = await fetch(teaUrl(`/reports/production-yield?from=${dateFrom}&to=${dateTo}`), { headers: teaAuthHeaders() });
        const d = await r.json();
        if (d.success && Array.isArray(d.data)) setYieldRows(d.data);
      } else if (tab === "inventory") {
        const r = await fetch(teaUrl(`/reports/inventory`), { headers: teaAuthHeaders() });
        const d = await r.json();
        if (d.success && Array.isArray(d.data)) setInventory(d.data);
      } else if (tab === "sales") {
        const r = await fetch(teaUrl(`/reports/sales?from=${dateFrom}&to=${dateTo}`), { headers: teaAuthHeaders() });
        const d = await r.json();
        if (d.success) {
          setSalesByChannel(Array.isArray(d.data?.by_channel) ? d.data.by_channel : []);
          setAuctionPerf(Array.isArray(d.data?.auction_performance) ? d.data.auction_performance : []);
        }
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
          <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center">
            <BarChart3 size={18} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Reports</h1>
            <p className="text-gray-500 text-xs">Daily, weekly, and grower ledger reports</p>
          </div>
        </div>
        <button onClick={loadReport} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white border border-gray-200 rounded-xl shadow-sm p-1 w-fit flex-wrap">
        {([["daily", "Daily Report"], ["weekly", "Weekly Report"], ["ledger", "Grower Ledger"], ["yield", "Production Yield"], ["inventory", "Inventory"], ["sales", "Sales"]] as [ReportTab, string][]).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs transition-all ${tab === t ? "bg-blue-600/20 text-blue-600" : "text-gray-500 hover:text-gray-900"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Filters */}
      {tab !== "inventory" && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-1.5 text-xs text-gray-900 focus:outline-none" />
          <span className="text-gray-600 text-xs">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-1.5 text-xs text-gray-900 focus:outline-none" />
          {tab === "ledger" && (
            <select value={growerId} onChange={e => setGrowerId(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-1.5 text-xs text-gray-900 focus:outline-none">
              <option value="">Select grower...</option>
              {growers.map(g => <option key={g.id} value={g.id}>{g.name} ({g.grower_code})</option>)}
            </select>
          )}
          <button onClick={tab === "ledger" ? loadLedger : loadReport}
            className="bg-blue-600/80 hover:bg-blue-600 text-white px-4 py-1.5 rounded-xl text-xs font-medium">
            Load
          </button>
        </div>
      )}

      {/* Daily Report */}
      {tab === "daily" && (
        <>
          {daily.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Days", value: daily.length, color: "text-blue-600" },
                { label: "Total KG", value: `${totalDailyKg.toFixed(0)} kg`, color: "text-green-600" },
                { label: "Avg/Day", value: `${(totalDailyKg / daily.length).toFixed(0)} kg`, color: "text-yellow-600" },
              ].map(s => (
                <div key={s.label} className="bg-white border border-gray-200 rounded-xl shadow-sm p-3">
                  <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
                  <p className="text-gray-500 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {loading ? <div className="p-8 text-center text-gray-600 text-sm animate-pulse">Loading...</div>
            : daily.length === 0 ? <div className="p-8 text-center text-gray-600 text-sm">No data in this range.</div>
            : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">Date</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">Growers</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">Total KG</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs hidden sm:table-cell">Grade A</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs hidden sm:table-cell">Grade B</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs hidden md:table-cell">Grade C</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map(d => (
                    <tr key={d.collection_date} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 text-sm">{new Date(d.collection_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" })}</td>
                      <td className="px-4 py-3 text-gray-700 text-sm">{d.total_growers}</td>
                      <td className="px-4 py-3 text-gray-900 font-semibold">{d.total_kg} kg</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-green-600 text-sm">{d.grade_a_kg} kg</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-blue-600 text-sm">{d.grade_b_kg} kg</td>
                      <td className="px-4 py-3 hidden md:table-cell text-yellow-600 text-sm">{d.grade_c_kg} kg</td>
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
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? <div className="p-8 text-center text-gray-600 text-sm animate-pulse">Loading...</div>
          : weekly.length === 0 ? <div className="p-8 text-center text-gray-600 text-sm">No weekly data in this range.</div>
          : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-gray-500 text-xs">Week</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs">Growers</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs">Collected KG</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs hidden sm:table-cell">Dispatched KG</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs">Net Settled</th>
                </tr>
              </thead>
              <tbody>
                {weekly.map((w, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-gray-900 text-sm">{new Date(w.week_start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                      <p className="text-gray-500 text-xs">to {new Date(w.week_end).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{w.total_growers}</td>
                    <td className="px-4 py-3 text-gray-900 font-semibold">{w.total_kg} kg</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-yellow-600 text-sm">{w.total_dispatched} kg</td>
                    <td className="px-4 py-3 text-green-600 font-semibold">₹{Number(w.net_settled).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Grower Ledger */}
      {tab === "ledger" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {!growerId ? (
            <div className="p-10 text-center text-gray-600 text-sm">
              <Users size={32} className="mx-auto mb-3 opacity-20" />
              Select a grower to view their ledger.
            </div>
          ) : loading ? (
            <div className="p-8 text-center text-gray-600 text-sm animate-pulse">Loading...</div>
          ) : ledger.length === 0 ? (
            <div className="p-8 text-center text-gray-600 text-sm">No ledger entries in this range.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-gray-500 text-xs">Date</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs">Type</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs">Description</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs hidden sm:table-cell">KG</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs">Amount</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((l, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 text-sm">{new Date(l.date).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${l.type === "collection" ? "bg-green-100 text-green-700" : l.type === "advance" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                        {l.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{l.description}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-500 text-sm">{l.kg ? `${l.kg} kg` : "—"}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {l.amount !== null
                        ? <span className="text-green-600">+₹{Number(l.amount).toFixed(0)}</span>
                        : <span className="text-gray-600 text-xs">at settlement</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-semibold text-sm">₹{Number(l.balance).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Production Yield */}
      {tab === "yield" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? <div className="p-8 text-center text-gray-600 text-sm animate-pulse">Loading...</div>
          : yieldRows.length === 0 ? <div className="p-8 text-center text-gray-600 text-sm">No production data in this range.</div>
          : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-gray-500 text-xs">Date</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs">Stage</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs">Green Leaf KG</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs">Made Tea KG</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs">Yield %</th>
                </tr>
              </thead>
              <tbody>
                {yieldRows.map(y => (
                  <tr key={y.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 text-sm">{new Date(y.collection_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{y.stage}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-semibold text-sm">{y.green_leaf_kg} kg</td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{y.made_tea_kg !== null ? `${y.made_tea_kg} kg` : "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      {y.yield_pct !== null ? <span className="text-green-600 font-medium">{y.yield_pct}%</span> : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Inventory Report */}
      {tab === "inventory" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? <div className="p-8 text-center text-gray-600 text-sm animate-pulse">Loading...</div>
          : inventory.length === 0 ? <div className="p-8 text-center text-gray-600 text-sm">No stock items found.</div>
          : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-gray-500 text-xs">Item</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs hidden sm:table-cell">Category</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs">Current Qty</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs">Reorder Level</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs hidden sm:table-cell">Pending Indents</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(s => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 text-sm">{s.name}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600 text-sm capitalize">{s.category}</td>
                    <td className="px-4 py-3 text-gray-900 font-semibold text-sm">{s.current_qty} {s.unit}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{s.reorder_level} {s.unit}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600 text-sm">{s.pending_indents}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.needs_reorder ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {s.needs_reorder ? "Reorder" : "OK"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Sales Report */}
      {tab === "sales" && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200 text-gray-700 text-sm font-medium">By Channel</div>
            {loading ? <div className="p-8 text-center text-gray-600 text-sm animate-pulse">Loading...</div>
            : salesByChannel.length === 0 ? <div className="p-8 text-center text-gray-600 text-sm">No sales in this range.</div>
            : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">Channel</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">Transactions</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">Total KG</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs hidden sm:table-cell">Avg Price/KG</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {salesByChannel.map((c, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 text-sm capitalize">{c.channel}</td>
                      <td className="px-4 py-3 text-gray-700 text-sm">{c.transactions}</td>
                      <td className="px-4 py-3 text-gray-900 font-semibold text-sm">{Number(c.total_kg).toFixed(0)} kg</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-600 text-sm">₹{Number(c.avg_price_per_kg).toFixed(2)}</td>
                      <td className="px-4 py-3 text-green-600 font-semibold text-sm">₹{Number(c.total_revenue).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200 text-gray-700 text-sm font-medium">Auction Performance</div>
            {loading ? <div className="p-8 text-center text-gray-600 text-sm animate-pulse">Loading...</div>
            : auctionPerf.length === 0 ? <div className="p-8 text-center text-gray-600 text-sm">No sold auction lots in this range.</div>
            : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">Lot #</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">Reserve Price</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">Sold Price</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">vs Reserve</th>
                  </tr>
                </thead>
                <tbody>
                  {auctionPerf.map((a, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 text-sm">{a.lot_number}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm">₹{Number(a.reserve_price).toFixed(0)}</td>
                      <td className="px-4 py-3 text-gray-900 font-semibold text-sm">₹{Number(a.sold_price).toFixed(0)}</td>
                      <td className="px-4 py-3 text-sm">
                        {a.pct_vs_reserve !== null ? (
                          <span className={a.pct_vs_reserve >= 0 ? "text-green-600" : "text-red-600"}>
                            {a.pct_vs_reserve >= 0 ? "+" : ""}{a.pct_vs_reserve}%
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
