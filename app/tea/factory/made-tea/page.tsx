"use client";

import { useState, useEffect, useCallback } from "react";
import { Archive, Plus, RefreshCw, TrendingDown, TrendingUp, BarChart2, AlertCircle, X, Save } from "lucide-react";
import { tfFetch, fmtDate, fmtDateShort, fmtKg } from "@/lib/tf-api";

const GRADES = [
  { code: "BOP",   label: "BOP",   color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { code: "BP",    label: "BP",    color: "bg-blue-50 text-blue-800 border-blue-200" },
  { code: "DUST",  label: "DUST",  color: "bg-amber-50 text-amber-800 border-amber-200" },
  { code: "CTC",   label: "CTC",   color: "bg-violet-50 text-violet-800 border-violet-200" },
  { code: "RC",    label: "RC",    color: "bg-orange-50 text-orange-800 border-orange-200" },
  { code: "WASTE", label: "Waste", color: "bg-gray-50 text-gray-600 border-gray-200" },
];

interface StockPosition { grade: string; balance_kg: number; bag_count: number; last_updated: string; }
interface Bag {
  id: string; bag_serial: string; grade_code: string; net_weight_kg: number;
  chest_serial_no: string | null; lot_no: string | null; manufacture_date: string;
  status: "in_stock" | "allocated" | "dispatched";
}
interface LedgerEntry {
  id: string; txn_date: string; txn_type: "IN" | "OUT" | "TALLY";
  grade_code: string; qty_kg: number; bags_count: number; notes: string | null;
}

type Tab = "stock" | "bags" | "ledger";

const inp = "w-full h-11 border border-gray-300 rounded-lg px-3 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none bg-white transition-colors";

export default function MadeTeaStockPage() {
  const [tab, setTab] = useState<Tab>("stock");
  const [stock, setStock] = useState<StockPosition[]>([]);
  const [bags, setBags] = useState<Bag[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [gradeFilter, setGradeFilter] = useState("ALL");

  // Adjustment form
  const [adjDate, setAdjDate] = useState(new Date().toISOString().slice(0, 10));
  const [adjType, setAdjType] = useState<"IN" | "OUT">("IN");
  const [adjGrade, setAdjGrade] = useState("BOP");
  const [adjQty, setAdjQty] = useState("");
  const [adjBags, setAdjBags] = useState("");
  const [adjNotes, setAdjNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [s, b, l] = await Promise.all([
      tfFetch<StockPosition[]>("/made-tea/stock"),
      tfFetch<Bag[]>("/made-tea/bags?status=in_stock&limit=200"),
      tfFetch<LedgerEntry[]>("/made-tea/ledger?limit=100"),
    ]);
    if (s.success) setStock(s.data ?? []);
    if (b.success) setBags(b.data ?? []);
    if (l.success) setLedger(l.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveAdj = async () => {
    setSaving(true); setMsg(null);
    const r = await tfFetch("/made-tea/ledger", {
      method: "POST",
      body: JSON.stringify({
        txn_date: adjDate, txn_type: adjType,
        grade_code: adjGrade,
        qty_kg: parseFloat(adjQty) || 0,
        bags_count: parseInt(adjBags) || 0,
        notes: adjNotes || null,
      }),
    });
    setSaving(false);
    if (r.success) { setShowForm(false); setMsg({ ok: true, text: "Stock entry saved." }); load(); }
    else setMsg({ ok: false, text: r.error ?? "Save failed." });
  };

  const totalBalance = stock.reduce((s, x) => s + x.balance_kg, 0);
  const totalBags    = stock.reduce((s, x) => s + x.bag_count, 0);

  const filteredBags = gradeFilter === "ALL" ? bags : bags.filter(b => b.grade_code === gradeFilter);
  const filteredLedger = gradeFilter === "ALL" ? ledger : ledger.filter(e => e.grade_code === gradeFilter);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-50 border border-violet-100 rounded-xl flex items-center justify-center">
            <Archive size={18} className="text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Made Tea Stock</h1>
            <p className="text-gray-500 text-xs">Bag register · Stock ledger · Grade-wise position</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 transition-colors min-h-[44px]">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-colors min-h-[44px]">
            <Plus size={15} /> Add Entry
          </button>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border mb-4 ${msg.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          <AlertCircle size={14} />{msg.text}
        </div>
      )}

      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 mb-1">Total Stock</p>
          <p className="text-2xl font-bold text-gray-900">{totalBalance.toLocaleString("en-IN")} kg</p>
          <p className="text-xs text-gray-400 mt-0.5">{totalBags} bags</p>
        </div>
        {GRADES.slice(0, 3).map(g => {
          const s = stock.find(x => x.grade === g.code);
          return (
            <div key={g.code} className={`rounded-xl border p-4 ${g.color}`}>
              <p className="text-xs font-bold mb-1">{g.label}</p>
              <p className="text-xl font-bold">{s ? s.balance_kg.toLocaleString("en-IN") : 0} kg</p>
              <p className="text-xs opacity-60 mt-0.5">{s?.bag_count ?? 0} bags</p>
            </div>
          );
        })}
      </div>

      {/* Grade position cards row 2 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {GRADES.slice(3).map(g => {
          const s = stock.find(x => x.grade === g.code);
          return (
            <div key={g.code} className={`rounded-xl border p-3 ${g.color}`}>
              <p className="text-xs font-bold mb-0.5">{g.label}</p>
              <p className="text-lg font-bold">{s ? s.balance_kg.toLocaleString("en-IN") : 0} kg</p>
              <p className="text-xs opacity-60">{s?.bag_count ?? 0} bags</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        {(["stock", "bags", "ledger"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm capitalize transition-all min-h-[44px] ${tab === t ? "bg-violet-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>
            {t === "stock" ? "Grade Summary" : t === "bags" ? "Bag Register" : "Ledger"}
          </button>
        ))}
      </div>

      {/* Grade filter */}
      {(tab === "bags" || tab === "ledger") && (
        <div className="flex flex-wrap gap-2 mb-4">
          {["ALL", ...GRADES.map(g => g.code)].map(g => (
            <button key={g} onClick={() => setGradeFilter(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all min-h-[36px] ${gradeFilter === g ? "bg-violet-600 text-white border-violet-600" : "bg-white border-gray-200 text-gray-600 hover:border-violet-300"}`}>
              {g}
            </button>
          ))}
        </div>
      )}

      {/* ── Stock Summary ── */}
      {tab === "stock" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Grade</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Balance (kg)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Bags</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg Bag (kg)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {GRADES.map(g => {
                const s = stock.find(x => x.grade === g.code);
                const avg = s && s.bag_count > 0 ? (s.balance_kg / s.bag_count).toFixed(1) : "—";
                return (
                  <tr key={g.code} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${g.color}`}>{g.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">
                      {s ? s.balance_kg.toLocaleString("en-IN") : "0"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">{s?.bag_count ?? 0}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">{avg}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s?.last_updated ? fmtDateShort(s.last_updated.slice(0, 10)) : "—"}</td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td className="px-4 py-3 font-bold text-gray-800">TOTAL</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">{totalBalance.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">{totalBags}</td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── Bag Register ── */}
      {tab === "bags" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {filteredBags.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">No bags found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Bag Serial", "Grade", "Net Wt (kg)", "Chest No.", "Lot No.", "Date", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredBags.map(b => {
                  const g = GRADES.find(x => x.code === b.grade_code);
                  return (
                    <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-gray-700 text-xs">{b.bag_serial}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${g?.color}`}>{b.grade_code}</span></td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-900 font-medium">{b.net_weight_kg.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{b.chest_serial_no ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{b.lot_no ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(b.manufacture_date)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          b.status === "in_stock" ? "bg-emerald-50 text-emerald-700" :
                          b.status === "allocated" ? "bg-amber-50 text-amber-700" :
                          "bg-gray-100 text-gray-500"}`}>
                          {b.status === "in_stock" ? "In Stock" : b.status === "allocated" ? "Allocated" : "Dispatched"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Ledger ── */}
      {tab === "ledger" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Date", "Type", "Grade", "Qty (kg)", "Bags", "Notes"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLedger.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">No ledger entries.</td></tr>
              ) : filteredLedger.map(e => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{fmtDate(e.txn_date)}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs font-semibold w-fit px-2 py-0.5 rounded-full ${e.txn_type === "IN" ? "bg-emerald-50 text-emerald-700" : e.txn_type === "OUT" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                      {e.txn_type === "IN" ? <TrendingUp size={11} /> : e.txn_type === "OUT" ? <TrendingDown size={11} /> : null}
                      {e.txn_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${GRADES.find(g => g.code === e.grade_code)?.color}`}>{e.grade_code}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">{e.qty_kg.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">{e.bags_count}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{e.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add Entry Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Stock Entry</h2>
              <button onClick={() => setShowForm(false)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                  <input type="date" value={adjDate} onChange={e => setAdjDate(e.target.value)} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                  <div className="flex gap-2 h-11">
                    {(["IN", "OUT"] as const).map(t => (
                      <button key={t} onClick={() => setAdjType(t)}
                        className={`flex-1 rounded-lg border text-sm font-semibold transition-all ${adjType === t ? (t === "IN" ? "bg-emerald-600 text-white border-emerald-600" : "bg-red-500 text-white border-red-500") : "bg-white text-gray-600 border-gray-300"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Grade</label>
                <div className="flex flex-wrap gap-2">
                  {GRADES.map(g => (
                    <button key={g.code} onClick={() => setAdjGrade(g.code)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all min-h-[36px] ${adjGrade === g.code ? `${g.color} border-current` : "bg-white border-gray-200 text-gray-600"}`}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Qty (kg)</label>
                  <input type="number" value={adjQty} onChange={e => setAdjQty(e.target.value)} placeholder="0.00" step="0.01" className={inp + " text-right tabular-nums"} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">No. of Bags</label>
                  <input type="number" value={adjBags} onChange={e => setAdjBags(e.target.value)} placeholder="0" className={inp + " text-right tabular-nums"} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <input type="text" value={adjNotes} onChange={e => setAdjNotes(e.target.value)} placeholder="Optional" className={inp} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-500 min-h-[44px]">Cancel</button>
              <button onClick={saveAdj} disabled={saving || !adjQty}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 min-h-[44px]">
                <Save size={14} />{saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
