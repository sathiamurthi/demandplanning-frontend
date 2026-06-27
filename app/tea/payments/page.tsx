"use client";

import { useState, useEffect } from "react";
import { Wallet, RefreshCw, CheckCircle, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { teaUrl, teaAuthHeaders } from "@/lib/tea-api";

interface Settlement {
  id: string; grower_name: string; grower_code: string;
  period_start: string; period_end: string;
  total_kg: number; gross_amount: number; advance_deducted: number; net_payable: number;
  balance_carried_forward: number; payment_mode: string;
  status: string;
}

function currentWeekBounds() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun,1=Mon,...
  const diff = day === 0 ? -6 : 1 - day; // days back to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

export default function PaymentsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading]         = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [paying, setPaying]           = useState<string | null>(null);
  const [showAdvance, setShowAdvance] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({ grower_id: "", amount: "", notes: "" });
  const [growers, setGrowers]         = useState<{ id: string; name: string; grower_code: string }[]>([]);
  const [period, setPeriod]           = useState(currentWeekBounds);

  const shiftWeek = (delta: number) => {
    setPeriod(p => {
      const d = new Date(p.start);
      d.setDate(d.getDate() + delta * 7);
      const end = new Date(d);
      end.setDate(d.getDate() + 6);
      return { start: d.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
    });
  };

  const load = async () => {
    setLoading(true);
    const r = await fetch(teaUrl("/settlements/grower"), { headers: teaAuthHeaders() });
    const d = await r.json();
    if (d.success) setSettlements(d.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    fetch(teaUrl("/growers"), { headers: teaAuthHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setGrowers(d.data); });
  }, []);

  const generate = async () => {
    setGenerating(true);
    const r = await fetch(teaUrl("/settlements/grower/generate"), {
      method: "POST", headers: teaAuthHeaders(),
      body: JSON.stringify({ period_start: period.start, period_end: period.end }),
    });
    const d = await r.json();
    if (d.success) load();
    else alert(d.error || "Failed to generate settlements");
    setGenerating(false);
  };

  const pay = async (id: string) => {
    setPaying(id);
    const r = await fetch(teaUrl(`/settlements/grower/${id}/pay`), {
      method: "PUT", headers: teaAuthHeaders(),
    });
    const d = await r.json();
    if (d.success) load();
    setPaying(null);
  };

  const saveAdvance = async () => {
    if (!advanceForm.grower_id || !advanceForm.amount) return;
    const r = await fetch(teaUrl("/advances/grower"), {
      method: "POST", headers: teaAuthHeaders(),
      body: JSON.stringify({ grower_id: advanceForm.grower_id, amount: parseFloat(advanceForm.amount), notes: advanceForm.notes }),
    });
    const d = await r.json();
    if (d.success) { setShowAdvance(false); setAdvanceForm({ grower_id: "", amount: "", notes: "" }); }
  };

  const pending  = settlements.filter(s => s.status !== "paid");
  const paid     = settlements.filter(s => s.status === "paid");
  const totalDue = pending.reduce((s, x) => s + Number(x.net_payable), 0);
  const totalBalance = pending.reduce((s, x) => s + Number(x.balance_carried_forward || 0), 0);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500/10 rounded-xl flex items-center justify-center">
            <Wallet size={18} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Grower Payments</h1>
            <p className="text-white/40 text-xs">Weekly settlement & advance management</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowAdvance(true)}
            className="flex items-center gap-2 border border-white/10 hover:border-orange-500/30 text-white/70 hover:text-white px-3 py-2 rounded-xl text-sm">
            <Plus size={14} /> Advance
          </button>
          <button onClick={load} className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Summary */}
      {settlements.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-[#161a23] border border-white/8 rounded-xl p-3">
            <p className="text-white font-bold text-lg">{pending.length}</p>
            <p className="text-white/40 text-xs">Pending</p>
          </div>
          <div className="bg-[#161a23] border border-orange-500/20 rounded-xl p-3">
            <p className="text-orange-400 font-bold text-lg">₹{(totalDue / 1000).toFixed(1)}K</p>
            <p className="text-white/40 text-xs">Total Due Now</p>
          </div>
          {totalBalance > 0 && (
            <div className="bg-[#161a23] border border-yellow-500/20 rounded-xl p-3">
              <p className="text-yellow-400 font-bold text-lg">₹{(totalBalance / 1000).toFixed(1)}K</p>
              <p className="text-white/40 text-xs">Balance Carried</p>
            </div>
          )}
          <div className="bg-[#161a23] border border-white/8 rounded-xl p-3">
            <p className="text-green-400 font-bold text-lg">{paid.length}</p>
            <p className="text-white/40 text-xs">Paid</p>
          </div>
        </div>
      )}

      {/* Generate settlements */}
      <div className="bg-[#161a23] border border-white/8 rounded-xl p-4 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Week navigation */}
          <button onClick={() => shiftWeek(-1)}
            className="w-8 h-8 flex items-center justify-center border border-white/10 rounded-lg text-white/50 hover:text-white hover:border-white/30">
            <ChevronLeft size={14} />
          </button>
          <div className="flex items-center gap-2">
            <input type="date" value={period.start} onChange={e => setPeriod(p => ({ ...p, start: e.target.value }))}
              className="bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none" />
            <span className="text-white/30 text-xs">to</span>
            <input type="date" value={period.end} onChange={e => setPeriod(p => ({ ...p, end: e.target.value }))}
              className="bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none" />
          </div>
          <button onClick={() => shiftWeek(1)}
            className="w-8 h-8 flex items-center justify-center border border-white/10 rounded-lg text-white/50 hover:text-white hover:border-white/30">
            <ChevronRight size={14} />
          </button>
          <button onClick={() => setPeriod(currentWeekBounds())}
            className="border border-white/10 hover:border-orange-500/30 text-white/50 hover:text-white px-2.5 py-1.5 rounded-lg text-xs">
            This Week
          </button>
          <button onClick={generate} disabled={generating}
            className="ml-auto bg-orange-600/80 hover:bg-orange-600 disabled:opacity-40 text-white px-4 py-1.5 rounded-xl text-sm font-medium flex items-center gap-2">
            <RefreshCw size={13} className={generating ? "animate-spin" : ""} />
            {generating ? "Generating..." : "Generate Settlements"}
          </button>
        </div>
        <p className="text-white/30 text-xs mt-2">
          Week: {fmtDate(period.start)} – {fmtDate(period.end)} &nbsp;·&nbsp; Payment rate is driven from weekly rate setup (full / advance mode)
        </p>
      </div>

      {/* Settlements table */}
      <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
        {settlements.length === 0 ? (
          <div className="p-10 text-center text-white/30 text-sm">
            <Wallet size={32} className="mx-auto mb-3 opacity-20" />
            No settlements yet. Select a week and generate.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-4 py-3 text-left text-white/40 text-xs">Grower</th>
                <th className="px-4 py-3 text-left text-white/40 text-xs hidden md:table-cell">Period</th>
                <th className="px-4 py-3 text-left text-white/40 text-xs">KG</th>
                <th className="px-4 py-3 text-left text-white/40 text-xs hidden sm:table-cell">Gross</th>
                <th className="px-4 py-3 text-left text-white/40 text-xs hidden sm:table-cell">Advance</th>
                <th className="px-4 py-3 text-left text-white/40 text-xs">Net Payable</th>
                <th className="px-4 py-3 text-left text-white/40 text-xs hidden lg:table-cell">Balance Due</th>
                <th className="px-4 py-3 text-right text-white/40 text-xs">Action</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map(s => {
                const isAdvance = s.payment_mode === 'advance';
                const balance = Number(s.balance_carried_forward || 0);
                return (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/3">
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-medium">{s.grower_name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-white/40 text-xs">{s.grower_code}</p>
                        {isAdvance && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400">advance</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-white/50 text-xs">
                      {fmtDate(s.period_start)} – {fmtDate(s.period_end)}
                    </td>
                    <td className="px-4 py-3 text-white/70 text-sm">{Number(s.total_kg).toFixed(2)} kg</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-white/60 text-sm">₹{Number(s.gross_amount).toFixed(0)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-red-400 text-sm">
                      {Number(s.advance_deducted) > 0 ? `-₹${Number(s.advance_deducted).toFixed(0)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-white font-semibold">₹{Number(s.net_payable).toFixed(0)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {balance > 0 ? (
                        <span className="text-yellow-400 text-sm">₹{balance.toFixed(0)}</span>
                      ) : (
                        <span className="text-white/20 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.status === "paid" ? (
                        <span className="text-xs text-green-400 flex items-center gap-1 justify-end">
                          <CheckCircle size={11} /> Paid
                        </span>
                      ) : (
                        <button onClick={() => pay(s.id)} disabled={paying === s.id}
                          className="text-xs bg-orange-600/80 hover:bg-orange-600 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg">
                          {paying === s.id ? "..." : "Mark Paid"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Advance Modal */}
      {showAdvance && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#161a23] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white">Give Advance</h2>
              <button onClick={() => setShowAdvance(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-white/50 text-xs block mb-1">Grower *</label>
                <select value={advanceForm.grower_id} onChange={e => setAdvanceForm(p => ({ ...p, grower_id: e.target.value }))}
                  className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                  <option value="">Select grower...</option>
                  {growers.map(g => <option key={g.id} value={g.id}>{g.name} ({g.grower_code})</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1">Amount (₹) *</label>
                <input type="number" value={advanceForm.amount} onChange={e => setAdvanceForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1">Notes</label>
                <input type="text" value={advanceForm.notes} onChange={e => setAdvanceForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdvance(false)} className="flex-1 border border-white/10 rounded-xl py-2.5 text-sm text-white/50">Cancel</button>
              <button onClick={saveAdvance} disabled={!advanceForm.grower_id || !advanceForm.amount}
                className="flex-1 bg-orange-600/80 hover:bg-orange-600 disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium text-white">
                Give Advance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
