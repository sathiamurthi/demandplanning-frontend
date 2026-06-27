"use client";

import { useState, useEffect } from "react";
import { Leaf, Scale, Wallet, TrendingUp, RefreshCw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/v1";

function growerHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("grower_token") : null;
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}
function growerUrl(path: string) {
  const t = typeof window !== "undefined" ? localStorage.getItem("grower_tenant") : "";
  return `${API}/tenants/${t}/tea${path}`;
}

interface CollectionRow { period: string; total_kg: number; total_amount: number; entries: number; }
interface Settlement    { id: string; total_kg: number; net_payable: number; balance_carried_forward: number; week_start_date: string; week_end_date: string; paid: boolean; }

export default function GrowerDashboard() {
  const [name, setName]               = useState("Grower");
  const [daily, setDaily]             = useState<CollectionRow[]>([]);
  const [weekly, setWeekly]           = useState<CollectionRow[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    setName(localStorage.getItem("grower_name") || "Grower");
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [dr, wr, sr] = await Promise.all([
      fetch(growerUrl("/grower-portal/collections?group=daily"), { headers: growerHeaders() }).then(r => r.json()),
      fetch(growerUrl("/grower-portal/collections?group=weekly"), { headers: growerHeaders() }).then(r => r.json()),
      fetch(growerUrl("/grower-portal/settlements"), { headers: growerHeaders() }).then(r => r.json()),
    ]);
    if (dr.success) setDaily(dr.data);
    if (wr.success) setWeekly(wr.data);
    if (sr.success) setSettlements(sr.data);
    setLoading(false);
  };

  const totalKg30d   = daily.reduce((s, r) => s + Number(r.total_kg), 0);
  const totalKg7d    = daily.slice(0, 7).reduce((s, r) => s + Number(r.total_kg), 0);
  const pendingAmount = settlements.filter(s => !s.paid).reduce((s, r) => s + Number(r.net_payable), 0);
  const balanceTotal  = settlements.filter(s => !s.paid).reduce((s, r) => s + Number(r.balance_carried_forward || 0), 0);

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div className="p-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-white">Welcome, {name}</h1>
          <p className="text-white/40 text-xs">Your tea collection dashboard</p>
        </div>
        <button onClick={loadAll} className="text-white/30 hover:text-white">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#0d1810] border border-green-500/20 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Leaf size={13} className="text-green-400" />
            <span className="text-white/40 text-xs">This Week</span>
          </div>
          <p className="text-white font-bold text-lg">{totalKg7d.toFixed(1)} kg</p>
        </div>
        <div className="bg-[#0d1810] border border-white/8 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Scale size={13} className="text-blue-400" />
            <span className="text-white/40 text-xs">Last 30 Days</span>
          </div>
          <p className="text-white font-bold text-lg">{totalKg30d.toFixed(1)} kg</p>
        </div>
        <div className="bg-[#0d1810] border border-orange-500/20 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Wallet size={13} className="text-orange-400" />
            <span className="text-white/40 text-xs">Due Now</span>
          </div>
          <p className="text-orange-400 font-bold text-lg">₹{pendingAmount.toFixed(0)}</p>
        </div>
        {balanceTotal > 0 && (
          <div className="bg-[#0d1810] border border-yellow-500/20 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={13} className="text-yellow-400" />
              <span className="text-white/40 text-xs">Balance Due Later</span>
            </div>
            <p className="text-yellow-400 font-bold text-lg">₹{balanceTotal.toFixed(0)}</p>
          </div>
        )}
      </div>

      {/* Weekly collections */}
      <div className="bg-[#0d1810] border border-white/8 rounded-xl overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-white/8">
          <h2 className="text-white text-sm font-semibold">Weekly Collection (Last 8 Weeks)</h2>
        </div>
        {weekly.length === 0 ? (
          <p className="p-6 text-white/30 text-sm text-center">No data yet</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-2.5 text-left text-white/40 text-xs">Week</th>
                <th className="px-4 py-2.5 text-left text-white/40 text-xs">Total KG</th>
                <th className="px-4 py-2.5 text-left text-white/40 text-xs hidden sm:table-cell">Entries</th>
              </tr>
            </thead>
            <tbody>
              {weekly.slice(0, 8).map((r, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/3">
                  <td className="px-4 py-2.5 text-white/70 text-sm">{fmt(r.period)}</td>
                  <td className="px-4 py-2.5 text-white font-medium text-sm">{Number(r.total_kg).toFixed(2)} kg</td>
                  <td className="px-4 py-2.5 text-white/40 text-sm hidden sm:table-cell">{r.entries}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent settlements */}
      <div className="bg-[#0d1810] border border-white/8 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/8">
          <h2 className="text-white text-sm font-semibold">Payment Status</h2>
        </div>
        {settlements.length === 0 ? (
          <p className="p-6 text-white/30 text-sm text-center">No settlements yet</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-2.5 text-left text-white/40 text-xs">Week</th>
                <th className="px-4 py-2.5 text-left text-white/40 text-xs">KG</th>
                <th className="px-4 py-2.5 text-left text-white/40 text-xs">Payable</th>
                <th className="px-4 py-2.5 text-left text-white/40 text-xs hidden sm:table-cell">Balance</th>
                <th className="px-4 py-2.5 text-right text-white/40 text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {settlements.slice(0, 10).map(s => (
                <tr key={s.id} className="border-b border-white/5">
                  <td className="px-4 py-2.5 text-white/60 text-xs">{fmt(s.week_start_date)} – {fmt(s.week_end_date)}</td>
                  <td className="px-4 py-2.5 text-white/70 text-sm">{Number(s.total_kg).toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-white text-sm">₹{Number(s.net_payable).toFixed(0)}</td>
                  <td className="px-4 py-2.5 text-yellow-400 text-sm hidden sm:table-cell">
                    {Number(s.balance_carried_forward || 0) > 0 ? `₹${Number(s.balance_carried_forward).toFixed(0)}` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.paid ? "bg-green-500/15 text-green-400" : "bg-orange-500/15 text-orange-400"}`}>
                      {s.paid ? "Paid" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
