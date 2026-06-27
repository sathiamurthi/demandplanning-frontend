"use client";

import { useState, useEffect, useMemo } from "react";
import { Factory, Plus, X, ChevronLeft, ChevronRight, History, Calendar, Filter } from "lucide-react";
import { teaUrl, teaAuthHeaders } from "@/lib/tea-api";

interface Settlement {
  id: string; settlement_date: string; factory_name: string;
  total_kg: number; rejected_kg: number;
  grade_a_kg: number; grade_b_kg: number; grade_c_kg: number;
  rate_per_kg_a: number | null; rate_per_kg_b: number | null; rate_per_kg_c: number | null;
  gross_amount: number; deductions: number; net_amount: number; payment_status: string;
  notes: string | null;
}
interface FactoryItem { id: string; name: string; }

const EMPTY = {
  factory_id: "",
  settlement_date: new Date().toISOString().slice(0, 10),
  grade_a_kg: "", grade_b_kg: "", grade_c_kg: "",
  rate_per_kg_a: "", rate_per_kg_b: "", rate_per_kg_c: "",
  rejected_kg: "", deductions: "0", notes: "",
};

// ISO week: Monday = start
function getWeekBounds(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
  const mon = new Date(d); mon.setDate(d.getDate() + diff); mon.setHours(0,0,0,0);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999);
  return { mon, sun };
}

function weekLabel(mon: Date, sun: Date) {
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${fmt(mon)} – ${fmt(sun)}, ${sun.getFullYear()}`;
}

// Use LOCAL date parts to avoid UTC shift (critical for IST +05:30)
function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthBounds(year: number, month: number) {
  const from = new Date(year, month, 1);
  const to   = new Date(year, month + 1, 0);
  return { from, to };
}

type PageTab    = "week" | "history";
type HistFilter = "weekly" | "monthly" | "range";
type StatusFilter = "all" | "paid" | "pending";

export default function SettlementsPage() {
  const [all, setAll]           = useState<Settlement[]>([]);
  const [factories, setFactories] = useState<FactoryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [tab, setTab]           = useState<PageTab>("week");

  // Week tab state
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const { mon, sun } = useMemo(() => getWeekBounds(weekAnchor), [weekAnchor]);

  // History filter state — default: last 90 days range so existing data is visible immediately
  const [histFilter, setHistFilter]   = useState<HistFilter>("range");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [histMonth, setHistMonth]     = useState(() => {
    const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });
  const [histWeekAnchor, setHistWeekAnchor] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return d;
  });
  const { mon: hwMon, sun: hwSun } = useMemo(() => getWeekBounds(histWeekAnchor), [histWeekAnchor]);
  const [histFrom, setHistFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3); return isoDate(d);
  });
  const [histTo, setHistTo]   = useState(isoDate(new Date()));

  const f = (k: keyof typeof EMPTY) => parseFloat(form[k] as string) || 0;
  const grossAmount = f("grade_a_kg") * f("rate_per_kg_a")
                    + f("grade_b_kg") * f("rate_per_kg_b")
                    + f("grade_c_kg") * f("rate_per_kg_c");
  const netAmount   = grossAmount - f("deductions");
  const totalKg     = f("grade_a_kg") + f("grade_b_kg") + f("grade_c_kg");

  const load = async () => {
    const [sr, fr] = await Promise.all([
      fetch(teaUrl("/settlements/factory"), { headers: teaAuthHeaders() }),
      fetch(teaUrl("/factories"), { headers: teaAuthHeaders() }),
    ]);
    const [s, fj] = await Promise.all([sr.json(), fr.json()]);
    if (s.success && Array.isArray(s.data)) setAll(s.data);
    if (fj.success) setFactories(fj.data);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.factory_id || !totalKg) return;
    setSaving(true);
    const r = await fetch(teaUrl("/settlements/factory"), {
      method: "POST", headers: teaAuthHeaders(),
      body: JSON.stringify({
        factory_id:    form.factory_id,
        settlement_date: form.settlement_date,
        grade_a_kg:    f("grade_a_kg"),
        grade_b_kg:    f("grade_b_kg"),
        grade_c_kg:    f("grade_c_kg"),
        rate_per_kg_a: f("rate_per_kg_a") || undefined,
        rate_per_kg_b: f("rate_per_kg_b") || undefined,
        rate_per_kg_c: f("rate_per_kg_c") || undefined,
        rejected_kg:   f("rejected_kg"),
        deductions:    f("deductions"),
        notes:         form.notes || undefined,
      }),
    });
    const d = await r.json();
    if (d.success) { setShowForm(false); setForm(EMPTY); load(); }
    else alert(d.error || "Failed to save");
    setSaving(false);
  };

  // Current week settlements
  const weekSettlements = useMemo(() =>
    all.filter(s => {
      const d = s.settlement_date.slice(0, 10);
      return d >= isoDate(mon) && d <= isoDate(sun);
    }),
    [all, mon, sun]
  );

  // History settlements (everything NOT in current week, filtered)
  const historySettlements = useMemo(() => {
    let base = all.filter(s => {
      const d = s.settlement_date.slice(0, 10);
      return !(d >= isoDate(mon) && d <= isoDate(sun));
    });
    // date filter
    if (histFilter === "weekly") {
      const hFrom = isoDate(hwMon); const hTo = isoDate(hwSun);
      base = base.filter(s => s.settlement_date.slice(0,10) >= hFrom && s.settlement_date.slice(0,10) <= hTo);
    } else if (histFilter === "monthly") {
      const [yr, mo] = histMonth.split("-").map(Number);
      const { from, to } = monthBounds(yr, mo - 1);
      base = base.filter(s => s.settlement_date.slice(0,10) >= isoDate(from) && s.settlement_date.slice(0,10) <= isoDate(to));
    } else {
      base = base.filter(s => s.settlement_date.slice(0,10) >= histFrom && s.settlement_date.slice(0,10) <= histTo);
    }
    // status filter
    if (statusFilter !== "all") base = base.filter(s => s.payment_status === statusFilter);
    return base;
  }, [all, mon, sun, histFilter, histMonth, hwMon, hwSun, histFrom, histTo, statusFilter]);

  const summaryCards = (list: Settlement[]) => [
    { label: "Settlements", value: list.length, color: "text-white" },
    { label: "Total KG", value: `${list.reduce((s, x) => s + Number(x.total_kg), 0).toFixed(0)} kg`, color: "text-green-400" },
    { label: "Gross", value: `₹${(list.reduce((s, x) => s + Number(x.gross_amount), 0) / 1000).toFixed(1)}K`, color: "text-yellow-400" },
    { label: "Net Received", value: `₹${(list.reduce((s, x) => s + Number(x.net_amount), 0) / 1000).toFixed(1)}K`, color: "text-purple-400", highlight: true },
  ];

  const SettlementTable = ({ list }: { list: Settlement[] }) => (
    <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
      {list.length === 0 ? (
        <div className="p-10 text-center text-white/30 text-sm">
          <Factory size={28} className="mx-auto mb-3 opacity-20" />
          No settlements in this period.
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              <th className="px-4 py-3 text-left text-white/40 text-xs">Date</th>
              <th className="px-4 py-3 text-left text-white/40 text-xs">Factory</th>
              <th className="px-4 py-3 text-left text-white/40 text-xs">Total KG</th>
              <th className="px-4 py-3 text-left text-white/40 text-xs hidden sm:table-cell">Gross</th>
              <th className="px-4 py-3 text-left text-white/40 text-xs hidden sm:table-cell">Deductions</th>
              <th className="px-4 py-3 text-left text-white/40 text-xs">Net Amount</th>
              <th className="px-4 py-3 text-left text-white/40 text-xs">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map(s => (
              <>
                <tr key={s.id}
                  className="border-b border-white/5 hover:bg-white/3 cursor-pointer"
                  onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}>
                  <td className="px-4 py-3 text-white/70 text-sm">
                    {new Date(s.settlement_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-white text-sm font-medium">{s.factory_name}</td>
                  <td className="px-4 py-3 text-white/70 text-sm">{Number(s.total_kg).toFixed(1)} kg</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-white/60 text-sm">₹{Number(s.gross_amount).toFixed(0)}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-red-400 text-sm">
                    {Number(s.deductions) > 0 ? `-₹${Number(s.deductions).toFixed(0)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-purple-400 font-semibold text-sm">₹{Number(s.net_amount).toFixed(0)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${s.payment_status === "paid" ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                      {s.payment_status}
                    </span>
                  </td>
                </tr>
                {expandedRow === s.id && (
                  <tr key={`${s.id}-exp`} className="border-b border-white/5 bg-white/2">
                    <td colSpan={7} className="px-6 py-3">
                      <div className="flex gap-6 flex-wrap text-xs">
                        {[
                          { grade: "A", kg: s.grade_a_kg, rate: s.rate_per_kg_a },
                          { grade: "B", kg: s.grade_b_kg, rate: s.rate_per_kg_b },
                          { grade: "C", kg: s.grade_c_kg, rate: s.rate_per_kg_c },
                        ].filter(g => Number(g.kg) > 0).map(g => (
                          <div key={g.grade} className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-xs ${g.grade==="A"?"bg-green-500/15 text-green-400":g.grade==="B"?"bg-blue-500/15 text-blue-400":"bg-yellow-500/15 text-yellow-400"}`}>
                              Grade {g.grade}
                            </span>
                            <span className="text-white/60">{Number(g.kg).toFixed(2)} kg</span>
                            {g.rate && <span className="text-white/40">@ ₹{g.rate}/kg</span>}
                            {g.rate && <span className="text-white/70 font-medium">= ₹{(Number(g.kg)*Number(g.rate)).toFixed(0)}</span>}
                          </div>
                        ))}
                        {s.notes && <span className="text-white/30 italic">{s.notes}</span>}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-500/10 rounded-xl flex items-center justify-center">
            <Factory size={18} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Factory Settlement</h1>
            <p className="text-white/40 text-xs">Record payments received from factories</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-purple-600/80 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={15} /> New Settlement
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#161a23] border border-white/8 rounded-xl p-1 w-fit">
        <button onClick={() => setTab("week")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs transition-all ${tab==="week" ? "bg-purple-600/20 text-purple-400" : "text-white/40 hover:text-white"}`}>
          <Calendar size={12} /> This Week
        </button>
        <button onClick={() => setTab("history")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs transition-all ${tab==="history" ? "bg-purple-600/20 text-purple-400" : "text-white/40 hover:text-white"}`}>
          <History size={12} /> History
        </button>
      </div>

      {/* ─── THIS WEEK TAB ─── */}
      {tab === "week" && (
        <>
          {/* Week navigator */}
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => { const d = new Date(weekAnchor); d.setDate(d.getDate()-7); setWeekAnchor(d); }}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white">
              <ChevronLeft size={14} />
            </button>
            <span className="text-white/70 text-sm font-medium">{weekLabel(mon, sun)}</span>
            <button onClick={() => { const d = new Date(weekAnchor); d.setDate(d.getDate()+7); setWeekAnchor(d); }}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white">
              <ChevronRight size={14} />
            </button>
            <button onClick={() => setWeekAnchor(new Date())}
              className="text-xs text-white/30 hover:text-white/70 ml-1">
              Today
            </button>
          </div>

          {/* Summary */}
          {weekSettlements.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {summaryCards(weekSettlements).map(s => (
                <div key={s.label} className={`border rounded-xl p-3 ${s.highlight ? "bg-purple-500/10 border-purple-500/20" : "bg-[#161a23] border-white/8"}`}>
                  <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
                  <p className="text-white/40 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <SettlementTable list={weekSettlements} />
        </>
      )}

      {/* ─── HISTORY TAB ─── */}
      {tab === "history" && (
        <>
          {/* Filter bar */}
          <div className="bg-[#161a23] border border-white/8 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Filter size={13} className="text-white/30" />
              <span className="text-white/40 text-xs font-medium">Period:</span>
              <div className="flex gap-1 bg-[#0d0f14] rounded-lg p-0.5 border border-white/8">
                {(["weekly", "monthly", "range"] as HistFilter[]).map(f => (
                  <button key={f} onClick={() => setHistFilter(f)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-all capitalize ${histFilter===f ? "bg-purple-600/30 text-purple-400" : "text-white/30 hover:text-white"}`}>
                    {f === "range" ? "Date Range" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <span className="text-white/40 text-xs font-medium ml-3">Status:</span>
              <div className="flex gap-1 bg-[#0d0f14] rounded-lg p-0.5 border border-white/8">
                {(["all", "paid", "pending"] as StatusFilter[]).map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-all capitalize ${statusFilter===s ? "bg-purple-600/30 text-purple-400" : "text-white/30 hover:text-white"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Period inputs */}
            {histFilter === "weekly" && (
              <div className="flex items-center gap-2">
                <button onClick={() => { const d = new Date(histWeekAnchor); d.setDate(d.getDate()-7); setHistWeekAnchor(d); }}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40">
                  <ChevronLeft size={12} />
                </button>
                <span className="text-white/60 text-xs">{weekLabel(hwMon, hwSun)}</span>
                <button onClick={() => { const d = new Date(histWeekAnchor); d.setDate(d.getDate()+7); setHistWeekAnchor(d); }}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40">
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
            {histFilter === "monthly" && (
              <input type="month" value={histMonth} onChange={e => setHistMonth(e.target.value)}
                className="bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none" />
            )}
            {histFilter === "range" && (
              <div className="flex items-center gap-2">
                <input type="date" value={histFrom} onChange={e => setHistFrom(e.target.value)}
                  className="bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none" />
                <span className="text-white/30 text-xs">to</span>
                <input type="date" value={histTo} onChange={e => setHistTo(e.target.value)}
                  className="bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none" />
              </div>
            )}
          </div>

          {/* Summary */}
          {historySettlements.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {summaryCards(historySettlements).map(s => (
                <div key={s.label} className={`border rounded-xl p-3 ${s.highlight ? "bg-purple-500/10 border-purple-500/20" : "bg-[#161a23] border-white/8"}`}>
                  <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
                  <p className="text-white/40 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <SettlementTable list={historySettlements} />
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#161a23] border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white">Record Factory Settlement</h2>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/50 text-xs block mb-1">Factory *</label>
                <select value={form.factory_id} onChange={e => setForm(p => ({ ...p, factory_id: e.target.value }))}
                  className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                  <option value="">Select factory...</option>
                  {factories.map(fc => <option key={fc.id} value={fc.id}>{fc.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1">Settlement Date</label>
                <input type="date" value={form.settlement_date} onChange={e => setForm(p => ({ ...p, settlement_date: e.target.value }))}
                  className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
              <div className="space-y-2">
                <p className="text-white/50 text-xs font-medium">Grade-wise KG & Rate</p>
                {[
                  { grade: "A", kgKey: "grade_a_kg" as const, rateKey: "rate_per_kg_a" as const, color: "text-green-400" },
                  { grade: "B", kgKey: "grade_b_kg" as const, rateKey: "rate_per_kg_b" as const, color: "text-blue-400" },
                  { grade: "C", kgKey: "grade_c_kg" as const, rateKey: "rate_per_kg_c" as const, color: "text-yellow-400" },
                ].map(({ grade, kgKey, rateKey, color }) => (
                  <div key={grade} className="grid grid-cols-3 gap-2 items-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg bg-white/5 ${color} text-center`}>Grade {grade}</span>
                    <input type="number" step="0.1" min="0" placeholder="KG"
                      value={form[kgKey]} onChange={e => setForm(p => ({ ...p, [kgKey]: e.target.value }))}
                      className="bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                    <input type="number" step="0.01" min="0" placeholder="₹/kg"
                      value={form[rateKey]} onChange={e => setForm(p => ({ ...p, [rateKey]: e.target.value }))}
                      className="bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs block mb-1">Rejected KG</label>
                  <input type="number" step="0.1" min="0" placeholder="0" value={form.rejected_kg}
                    onChange={e => setForm(p => ({ ...p, rejected_kg: e.target.value }))}
                    className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
                <div>
                  <label className="text-white/50 text-xs block mb-1">Deductions (₹)</label>
                  <input type="number" step="0.01" min="0" value={form.deductions}
                    onChange={e => setForm(p => ({ ...p, deductions: e.target.value }))}
                    className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
              </div>
              {totalKg > 0 && (
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-3 text-sm space-y-1">
                  <div className="flex justify-between text-white/50"><span>Total KG:</span><span className="text-white">{totalKg.toFixed(2)} kg</span></div>
                  <div className="flex justify-between text-white/50"><span>Gross:</span><span className="text-white">₹{grossAmount.toFixed(2)}</span></div>
                  {f("deductions") > 0 && (
                    <div className="flex justify-between text-white/50"><span>Deductions:</span><span className="text-red-400">-₹{f("deductions").toFixed(2)}</span></div>
                  )}
                  <div className="flex justify-between font-semibold pt-1 border-t border-white/10">
                    <span className="text-white/80">Net Amount:</span>
                    <span className="text-purple-400 text-base">₹{netAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
              <div>
                <label className="text-white/50 text-xs block mb-1">Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-white/10 rounded-xl py-2.5 text-sm text-white/50">Cancel</button>
              <button onClick={save} disabled={saving || !form.factory_id || totalKg === 0}
                className="flex-1 bg-purple-600/80 hover:bg-purple-600 disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium text-white">
                {saving ? "Saving..." : "Record Settlement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
