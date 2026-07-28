"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart2, Plus, RefreshCw, CheckCircle2, AlertCircle, Printer, X, Save } from "lucide-react";
import { tfFetch, fmtDate } from "@/lib/tf-api";

const GRADES = [
  { code: "BOP",   label: "BOP",   color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { code: "BP",    label: "BP",    color: "bg-blue-50 text-blue-800 border-blue-200" },
  { code: "DUST",  label: "DUST",  color: "bg-amber-50 text-amber-800 border-amber-200" },
  { code: "CTC",   label: "CTC",   color: "bg-violet-50 text-violet-800 border-violet-200" },
  { code: "RC",    label: "RC",    color: "bg-orange-50 text-orange-800 border-orange-200" },
  { code: "WASTE", label: "Waste", color: "bg-gray-50 text-gray-600 border-gray-200" },
];

interface TallyRow {
  grade_code: string;
  opening_stock_kg: number;
  produced_kg: number;
  dispatched_kg: number;
  closing_stock_kg: number;
  physical_count_kg: number | null;
  variance_kg: number | null;
  notes: string;
}
interface Tally {
  id: string;
  tally_month: string;
  rows: TallyRow[];
  tallied_by: string | null;
  tallied_at: string | null;
  status: "draft" | "finalised";
}

const inp = "w-full h-11 border border-gray-300 rounded-lg px-3 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none bg-white transition-colors";
const numCell = "w-full h-9 border border-gray-200 rounded-md px-2 text-sm text-right tabular-nums focus:border-emerald-500 focus:outline-none bg-white";

export default function TallyPage() {
  const [tallies, setTallies] = useState<Tally[]>([]);
  const [activeTally, setActiveTally] = useState<Tally | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const today = new Date();
  const [newMonth, setNewMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);
  const [tallyRows, setTallyRows] = useState<TallyRow[]>(
    GRADES.map(g => ({ grade_code: g.code, opening_stock_kg: 0, produced_kg: 0, dispatched_kg: 0, closing_stock_kg: 0, physical_count_kg: null, variance_kg: null, notes: "" }))
  );

  const load = useCallback(async () => {
    setLoading(true);
    const r = await tfFetch<Tally[]>("/tally?limit=24");
    if (r.success) { setTallies(r.data ?? []); if (r.data?.length) setActiveTally(r.data[0]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateRow = (grade: string, field: keyof TallyRow, val: string) => {
    setTallyRows(prev => prev.map(r => {
      if (r.grade_code !== grade) return r;
      const numVal = val === "" ? null : parseFloat(val);
      const updated = { ...r, [field]: numVal };
      // Auto-calc: closing = opening + produced - dispatched
      if (["opening_stock_kg", "produced_kg", "dispatched_kg"].includes(field)) {
        updated.closing_stock_kg = (updated.opening_stock_kg || 0) + (updated.produced_kg || 0) - (updated.dispatched_kg || 0);
      }
      // Auto-calc variance
      if (updated.physical_count_kg !== null) {
        updated.variance_kg = (updated.physical_count_kg || 0) - updated.closing_stock_kg;
      }
      return updated;
    }));
  };

  const save = async (finalise = false) => {
    setSaving(true); setMsg(null);
    const r = await tfFetch<Tally>("/tally", {
      method: "POST",
      body: JSON.stringify({ tally_month: newMonth, rows: tallyRows, status: finalise ? "finalised" : "draft" }),
    });
    setSaving(false);
    if (r.success) { setShowNew(false); setMsg({ ok: true, text: `Tally ${finalise ? "finalised" : "saved as draft"}.` }); load(); }
    else setMsg({ ok: false, text: r.error ?? "Save failed." });
  };

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(m) - 1]} ${y}`;
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
            <BarChart2 size={18} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Monthly Stock Tally</h1>
            <p className="text-gray-500 text-xs">Grade-wise closing stock vs physical count · Variance tracking</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2 min-h-[44px]">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm min-h-[44px]">
            <Plus size={15} /> New Tally
          </button>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border mb-4 ${msg.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          <AlertCircle size={14} />{msg.text}
        </div>
      )}

      {/* Month selector */}
      {tallies.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {tallies.map(t => (
            <button key={t.id} onClick={() => setActiveTally(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all min-h-[44px] ${activeTally?.id === t.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"}`}>
              {monthLabel(t.tally_month)}
              {t.status === "finalised" && <CheckCircle2 size={11} className="inline ml-1.5 text-emerald-400" />}
            </button>
          ))}
        </div>
      )}

      {/* Tally table */}
      {activeTally ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-800">{monthLabel(activeTally.tally_month)}</p>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${activeTally.status === "finalised" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {activeTally.status === "finalised" ? "Finalised" : "Draft"}
              </span>
              <button onClick={() => window.print()} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg min-h-[36px]">
                <Printer size={12} /> Print
              </button>
            </div>
          </div>
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-20">Grade</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Opening (kg)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Produced (kg)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Dispatched (kg)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Book Closing (kg)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Physical Count (kg)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Variance (kg)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Notes</th>
              </tr>
            </thead>
            <tbody>
              {(activeTally.rows ?? []).map(row => {
                const g = GRADES.find(x => x.code === row.grade_code);
                const varOk = row.variance_kg === null ? null : Math.abs(row.variance_kg) < 5;
                return (
                  <tr key={row.grade_code} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3"><span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${g?.color}`}>{g?.label}</span></td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">{row.opening_stock_kg.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700 font-medium">{row.produced_kg.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-red-600 font-medium">{row.dispatched_kg.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">{row.closing_stock_kg.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">{row.physical_count_kg !== null ? row.physical_count_kg.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.variance_kg !== null ? (
                        <span className={`font-semibold ${varOk ? "text-emerald-600" : "text-red-600"}`}>
                          {row.variance_kg > 0 ? "+" : ""}{row.variance_kg.toFixed(2)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{row.notes || "—"}</td>
                  </tr>
                );
              })}
              {/* Totals */}
              <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold">
                <td className="px-4 py-3 text-gray-800">TOTAL</td>
                {["opening_stock_kg", "produced_kg", "dispatched_kg", "closing_stock_kg"].map(field => (
                  <td key={field} className="px-4 py-3 text-right tabular-nums text-gray-900">
                    {(activeTally.rows ?? []).reduce((s, r) => s + (r[field as keyof TallyRow] as number || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                ))}
                <td colSpan={3} />
              </tr>
            </tbody>
          </table>
          {activeTally.tallied_by && (
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
              Tallied by <strong>{activeTally.tallied_by}</strong> on {fmtDate(activeTally.tallied_at?.slice(0, 10) ?? "")}
            </div>
          )}
        </div>
      ) : !loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <BarChart2 size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 text-sm mb-4">No tallies yet. Create your first monthly stock tally.</p>
          <button onClick={() => setShowNew(true)} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium min-h-[44px]">New Tally</button>
        </div>
      )}

      {/* ── New Tally Modal ── */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">New Monthly Stock Tally</h2>
              <button onClick={() => setShowNew(false)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"><X size={16} /></button>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tally Month</label>
              <input type="month" value={newMonth} onChange={e => setNewMonth(e.target.value)} className={inp + " max-w-[200px]"} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 w-16">Grade</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-gray-500">Opening (kg)</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-gray-500">Produced (kg)</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-gray-500">Dispatched (kg)</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-gray-500">Closing (kg)</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-gray-500">Physical Count (kg)</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-gray-500">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {tallyRows.map(row => {
                    const g = GRADES.find(x => x.code === row.grade_code)!;
                    const variance = row.physical_count_kg !== null ? row.physical_count_kg - row.closing_stock_kg : null;
                    return (
                      <tr key={row.grade_code} className="border-b border-gray-100">
                        <td className="px-3 py-2"><span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${g.color}`}>{g.label}</span></td>
                        <td className="px-2 py-2"><input type="number" step="0.01" placeholder="0" value={row.opening_stock_kg || ""} onChange={e => updateRow(row.grade_code, "opening_stock_kg", e.target.value)} className={numCell} /></td>
                        <td className="px-2 py-2"><input type="number" step="0.01" placeholder="0" value={row.produced_kg || ""} onChange={e => updateRow(row.grade_code, "produced_kg", e.target.value)} className={numCell} /></td>
                        <td className="px-2 py-2"><input type="number" step="0.01" placeholder="0" value={row.dispatched_kg || ""} onChange={e => updateRow(row.grade_code, "dispatched_kg", e.target.value)} className={numCell} /></td>
                        <td className="px-2 py-2 text-right">
                          <div className="w-full h-9 bg-gray-100 rounded-md px-2 flex items-center justify-end tabular-nums font-semibold text-gray-800">
                            {row.closing_stock_kg.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-2 py-2"><input type="number" step="0.01" placeholder="Physical count" value={row.physical_count_kg ?? ""} onChange={e => updateRow(row.grade_code, "physical_count_kg", e.target.value)} className={numCell} /></td>
                        <td className="px-2 py-2 text-right">
                          <div className={`w-full h-9 rounded-md px-2 flex items-center justify-end tabular-nums font-bold ${variance === null ? "bg-gray-50 text-gray-400" : Math.abs(variance) < 5 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                            {variance !== null ? `${variance > 0 ? "+" : ""}${variance.toFixed(2)}` : "—"}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNew(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-500 min-h-[44px]">Cancel</button>
              <button onClick={() => save(false)} disabled={saving} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 min-h-[44px]">
                <Save size={14} />Save Draft
              </button>
              <button onClick={() => save(true)} disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 min-h-[44px]">
                <CheckCircle2 size={14} />Finalise
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
