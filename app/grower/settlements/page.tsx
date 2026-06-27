"use client";

import { useState, useEffect } from "react";
import { Wallet, RefreshCw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/v1";
function gh(): HeadersInit {
  const t = typeof window !== "undefined" ? localStorage.getItem("grower_token") : null;
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}
function gu(p: string) {
  const tid = typeof window !== "undefined" ? localStorage.getItem("grower_tenant") : "";
  return `${API}/tenants/${tid}/tea${p}`;
}

interface Settlement {
  id: string; total_kg: number; gross_amount: number; advance_deduction: number;
  net_payable: number; balance_carried_forward: number; payment_mode: string;
  week_start_date: string; week_end_date: string; paid: boolean; paid_at: string | null;
}

export default function GrowerSettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await fetch(gu("/grower-portal/settlements"), { headers: gh() });
    const d = await r.json();
    if (d.success) setSettlements(d.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const pending = settlements.filter(s => !s.paid);
  const totalDue = pending.reduce((s, r) => s + Number(r.net_payable), 0);
  const totalBalance = pending.reduce((s, r) => s + Number(r.balance_carried_forward || 0), 0);

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500/10 rounded-xl flex items-center justify-center">
            <Wallet size={18} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">My Payments</h1>
            <p className="text-white/40 text-xs">Settlement history from the tea estate</p>
          </div>
        </div>
        <button onClick={load} className="text-white/30 hover:text-white"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
      </div>

      {/* Summary */}
      {settlements.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-[#0d1810] border border-orange-500/20 rounded-xl p-3">
            <p className="text-orange-400 font-bold text-lg">₹{totalDue.toFixed(0)}</p>
            <p className="text-white/40 text-xs">Amount Due Now</p>
          </div>
          {totalBalance > 0 && (
            <div className="bg-[#0d1810] border border-yellow-500/20 rounded-xl p-3">
              <p className="text-yellow-400 font-bold text-lg">₹{totalBalance.toFixed(0)}</p>
              <p className="text-white/40 text-xs">Balance (Advance Mode)</p>
            </div>
          )}
          <div className="bg-[#0d1810] border border-green-500/20 rounded-xl p-3">
            <p className="text-green-400 font-bold text-lg">{settlements.filter(s => s.paid).length}</p>
            <p className="text-white/40 text-xs">Settled Weeks</p>
          </div>
        </div>
      )}

      {/* Settlements table */}
      <div className="bg-[#0d1810] border border-white/8 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              <th className="px-4 py-3 text-left text-white/40 text-xs">Week</th>
              <th className="px-4 py-3 text-left text-white/40 text-xs">KG</th>
              <th className="px-4 py-3 text-left text-white/40 text-xs hidden sm:table-cell">Gross</th>
              <th className="px-4 py-3 text-left text-white/40 text-xs">Net Due</th>
              <th className="px-4 py-3 text-left text-white/40 text-xs hidden md:table-cell">Balance</th>
              <th className="px-4 py-3 text-right text-white/40 text-xs">Status</th>
            </tr>
          </thead>
          <tbody>
            {settlements.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-white/30 text-sm">No settlements yet</td></tr>
            ) : settlements.map(s => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/3">
                <td className="px-4 py-3 text-white/60 text-xs">{fmt(s.week_start_date)} – {fmt(s.week_end_date)}
                  {s.payment_mode === 'advance' && <span className="ml-1.5 text-yellow-400 text-xs">(advance)</span>}
                </td>
                <td className="px-4 py-3 text-white/70 text-sm">{Number(s.total_kg).toFixed(2)}</td>
                <td className="px-4 py-3 text-white/60 text-sm hidden sm:table-cell">₹{Number(s.gross_amount).toFixed(0)}</td>
                <td className="px-4 py-3 text-white font-semibold text-sm">₹{Number(s.net_payable).toFixed(0)}</td>
                <td className="px-4 py-3 text-yellow-400 text-sm hidden md:table-cell">
                  {Number(s.balance_carried_forward || 0) > 0 ? `₹${Number(s.balance_carried_forward).toFixed(0)}` : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.paid ? "bg-green-500/15 text-green-400" : "bg-orange-500/15 text-orange-400"}`}>
                    {s.paid ? `Paid ${s.paid_at ? fmt(s.paid_at) : ""}` : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
