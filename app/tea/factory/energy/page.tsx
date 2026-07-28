"use client";

import { useState, useEffect, useCallback } from "react";
import { Zap, Flame, Droplets, Plus, RefreshCw, TrendingUp, TrendingDown, AlertCircle, X, Save } from "lucide-react";
import { tfFetch, fmtDate, fmtINR } from "@/lib/tf-api";

type EnergyTab = "eb" | "firewood" | "fuel" | "summary";

interface EBLog { id: string; log_date: string; shift_id: string | null; meter_start: number; meter_end: number; units: number; unit_rate: number; total_cost: number; notes: string | null; }
interface FirewoodLog { id: string; txn_date: string; txn_type: "IN" | "OUT"; qty_kg: number; unit_cost: number | null; total_cost: number | null; supplier_name: string | null; notes: string | null; }
interface FuelLog { id: string; log_date: string; fuel_type: string; qty: number; unit: string; unit_cost: number | null; total_cost: number | null; notes: string | null; }
interface Summary { today_eb_units: number; mtd_eb_units: number; mtd_eb_cost: number; firewood_stock_kg: number; mtd_firewood_kg: number; mtd_firewood_cost: number; mtd_total_energy_cost: number; eb_per_kg_made_tea: number | null; }

const FUEL_TYPES = [
  { code: "charcoal",  label: "Charcoal",       unit: "kg" },
  { code: "briquettes",label: "Briquettes",     unit: "kg" },
  { code: "diesel",    label: "Diesel",         unit: "L" },
  { code: "heater",    label: "Elec. Heater",   unit: "kWh" },
];

const inp = "w-full h-11 border border-gray-300 rounded-lg px-3 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none bg-white transition-colors";

export default function EnergyFuelPage() {
  const [tab, setTab] = useState<EnergyTab>("summary");
  const [ebLogs, setEbLogs] = useState<EBLog[]>([]);
  const [firewoodLogs, setFirewoodLogs] = useState<FirewoodLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // EB form
  const [ebDate, setEbDate] = useState(new Date().toISOString().slice(0, 10));
  const [ebStart, setEbStart] = useState("");
  const [ebEnd, setEbEnd] = useState("");
  const [ebRate, setEbRate] = useState("8.50");
  const [ebNotes, setEbNotes] = useState("");

  // Firewood form
  const [fwDate, setFwDate] = useState(new Date().toISOString().slice(0, 10));
  const [fwType, setFwType] = useState<"IN" | "OUT">("IN");
  const [fwQty, setFwQty] = useState("");
  const [fwCost, setFwCost] = useState("");
  const [fwSupplier, setFwSupplier] = useState("");

  // Fuel form
  const [flDate, setFlDate] = useState(new Date().toISOString().slice(0, 10));
  const [flType, setFlType] = useState("charcoal");
  const [flQty, setFlQty] = useState("");
  const [flCost, setFlCost] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [s, eb, fw, fl] = await Promise.all([
      tfFetch<Summary>("/energy/summary"),
      tfFetch<EBLog[]>("/energy/eb?limit=60"),
      tfFetch<FirewoodLog[]>("/energy/firewood?limit=60"),
      tfFetch<FuelLog[]>("/energy/fuel?limit=60"),
    ]);
    if (s.success)  setSummary(s.data ?? null);
    if (eb.success) setEbLogs(eb.data ?? []);
    if (fw.success) setFirewoodLogs(fw.data ?? []);
    if (fl.success) setFuelLogs(fl.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const ebUnits = ebStart && ebEnd ? Math.max(0, parseFloat(ebEnd) - parseFloat(ebStart)) : 0;
  const ebTotal = ebUnits * (parseFloat(ebRate) || 0);

  const saveEB = async () => {
    setSaving(true);
    const r = await tfFetch("/energy/eb", { method: "POST", body: JSON.stringify({ log_date: ebDate, meter_start: parseFloat(ebStart), meter_end: parseFloat(ebEnd), unit_rate: parseFloat(ebRate), notes: ebNotes || null }) });
    setSaving(false);
    if (r.success) { setShowForm(false); setMsg({ ok: true, text: "EB log saved." }); load(); }
    else setMsg({ ok: false, text: r.error ?? "Save failed." });
  };

  const saveFirewood = async () => {
    setSaving(true);
    const r = await tfFetch("/energy/firewood", { method: "POST", body: JSON.stringify({ txn_date: fwDate, txn_type: fwType, qty_kg: parseFloat(fwQty), unit_cost: fwCost ? parseFloat(fwCost) : null, supplier_name: fwSupplier || null }) });
    setSaving(false);
    if (r.success) { setShowForm(false); setMsg({ ok: true, text: "Firewood log saved." }); load(); }
    else setMsg({ ok: false, text: r.error ?? "Save failed." });
  };

  const saveFuel = async () => {
    setSaving(true);
    const ft = FUEL_TYPES.find(f => f.code === flType)!;
    const r = await tfFetch("/energy/fuel", { method: "POST", body: JSON.stringify({ log_date: flDate, fuel_type: flType, qty: parseFloat(flQty), unit: ft.unit, unit_cost: flCost ? parseFloat(flCost) : null }) });
    setSaving(false);
    if (r.success) { setShowForm(false); setMsg({ ok: true, text: "Fuel log saved." }); load(); }
    else setMsg({ ok: false, text: r.error ?? "Save failed." });
  };

  const tabIcon = { eb: Zap, firewood: Flame, fuel: Droplets, summary: TrendingUp } as const;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Energy & Fuel</h1>
            <p className="text-gray-500 text-xs">EB readings · Firewood stock · Fuel consumption</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 min-h-[44px]">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          {tab !== "summary" && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-colors min-h-[44px]">
              <Plus size={15} /> Add Entry
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border mb-4 ${msg.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          <AlertCircle size={14} />{msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit flex-wrap">
        {(["summary", "eb", "firewood", "fuel"] as EnergyTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm transition-all min-h-[44px] capitalize ${tab === t ? "bg-amber-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>
            {t === "eb" ? "EB / Electricity" : t === "firewood" ? "Firewood" : t === "fuel" ? "Other Fuels" : "Summary"}
          </button>
        ))}
      </div>

      {/* ── SUMMARY ── */}
      {tab === "summary" && summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Today EB Units", val: `${summary.today_eb_units} Units`, sub: "", icon: Zap, color: "bg-amber-50 border-amber-200 text-amber-800" },
              { label: "MTD EB Cost", val: fmtINR(summary.mtd_eb_cost), sub: `${summary.mtd_eb_units.toLocaleString("en-IN")} units`, icon: Zap, color: "bg-amber-50 border-amber-200 text-amber-800" },
              { label: "Firewood Stock", val: `${summary.firewood_stock_kg.toLocaleString("en-IN")} kg`, sub: "Current balance", icon: Flame, color: "bg-orange-50 border-orange-200 text-orange-800" },
              { label: "Total Energy MTD", val: fmtINR(summary.mtd_total_energy_cost), sub: "EB + Firewood + Fuel", icon: TrendingUp, color: "bg-blue-50 border-blue-200 text-blue-800" },
            ].map(c => (
              <div key={c.label} className={`rounded-xl border p-4 ${c.color}`}>
                <div className="flex items-center gap-2 mb-2"><c.icon size={14} /><p className="text-xs font-semibold opacity-70">{c.label}</p></div>
                <p className="text-xl font-bold">{c.val}</p>
                {c.sub && <p className="text-xs opacity-60 mt-0.5">{c.sub}</p>}
              </div>
            ))}
          </div>
          {summary.eb_per_kg_made_tea !== null && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm font-semibold text-gray-700 mb-1">Efficiency</p>
              <p className="text-3xl font-black text-gray-900">{summary.eb_per_kg_made_tea.toFixed(4)} <span className="text-base font-normal text-gray-500">EB units / kg made tea</span></p>
              <p className="text-xs text-gray-400 mt-1">Lower is better — target ≤ 0.018 units/kg</p>
            </div>
          )}
        </div>
      )}

      {/* ── EB TABLE ── */}
      {tab === "eb" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              {["Date", "Meter Start", "Meter End", "Units", "Rate (₹)", "Cost (₹)", "Notes"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {ebLogs.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">No EB logs yet.</td></tr>
              : ebLogs.map(e => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{fmtDate(e.log_date)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600">{e.meter_start.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600">{e.meter_end.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-amber-700">{e.units.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600">{e.unit_rate.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">{fmtINR(e.total_cost)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{e.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── FIREWOOD TABLE ── */}
      {tab === "firewood" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              {["Date", "Type", "Qty (kg)", "Unit Cost (₹)", "Total Cost (₹)", "Supplier", "Notes"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {firewoodLogs.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">No firewood logs yet.</td></tr>
              : firewoodLogs.map(e => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{fmtDate(e.txn_date)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold flex items-center gap-1 w-fit px-2 py-0.5 rounded-full ${e.txn_type === "IN" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {e.txn_type === "IN" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{e.txn_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-orange-700">{e.qty_kg.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600">{e.unit_cost ? `₹${e.unit_cost.toFixed(2)}` : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-900">{e.total_cost ? fmtINR(e.total_cost) : "—"}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{e.supplier_name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{e.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── OTHER FUELS TABLE ── */}
      {tab === "fuel" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              {["Date", "Fuel Type", "Qty", "Unit", "Unit Cost (₹)", "Total Cost (₹)", "Notes"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {fuelLogs.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">No fuel logs yet.</td></tr>
              : fuelLogs.map(e => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{fmtDate(e.log_date)}</td>
                  <td className="px-4 py-3 capitalize font-medium text-gray-800">{FUEL_TYPES.find(f => f.code === e.fuel_type)?.label ?? e.fuel_type}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-blue-700">{e.qty.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-gray-500">{e.unit}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600">{e.unit_cost ? `₹${e.unit_cost.toFixed(2)}` : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-900">{e.total_cost ? fmtINR(e.total_cost) : "—"}</td>
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
              <h2 className="font-bold text-gray-900">
                {tab === "eb" ? "EB Reading Entry" : tab === "firewood" ? "Firewood Entry" : "Fuel Entry"}
              </h2>
              <button onClick={() => setShowForm(false)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"><X size={16} /></button>
            </div>

            {/* EB Form */}
            {tab === "eb" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                  <input type="date" value={ebDate} onChange={e => setEbDate(e.target.value)} className={inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Meter Start (Units)</label><input type="number" value={ebStart} onChange={e => setEbStart(e.target.value)} placeholder="0" className={inp + " text-right"} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Meter End (Units)</label><input type="number" value={ebEnd} onChange={e => setEbEnd(e.target.value)} placeholder="0" className={inp + " text-right"} /></div>
                </div>
                {ebUnits > 0 && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex justify-between"><span className="text-amber-700 text-sm">Units Consumed</span><span className="font-bold text-amber-800">{ebUnits.toFixed(1)} Units → {fmtINR(ebTotal)}</span></div>}
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Rate per Unit (₹)</label><input type="number" value={ebRate} onChange={e => setEbRate(e.target.value)} step="0.01" className={inp + " text-right"} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label><input type="text" value={ebNotes} onChange={e => setEbNotes(e.target.value)} placeholder="Optional" className={inp} /></div>
                <div className="flex gap-3 mt-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-500 min-h-[44px]">Cancel</button>
                  <button onClick={saveEB} disabled={saving || !ebStart || !ebEnd} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 min-h-[44px]"><Save size={14} />{saving ? "Saving…" : "Save"}</button>
                </div>
              </div>
            )}

            {/* Firewood Form */}
            {tab === "firewood" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Date</label><input type="date" value={fwDate} onChange={e => setFwDate(e.target.value)} className={inp} /></div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                    <div className="flex gap-2 h-11">
                      {(["IN", "OUT"] as const).map(t => <button key={t} onClick={() => setFwType(t)} className={`flex-1 rounded-lg border text-sm font-semibold ${fwType === t ? (t === "IN" ? "bg-emerald-600 text-white border-emerald-600" : "bg-red-500 text-white border-red-500") : "bg-white text-gray-600 border-gray-300"}`}>{t}</button>)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Qty (kg)</label><input type="number" value={fwQty} onChange={e => setFwQty(e.target.value)} placeholder="0" className={inp + " text-right"} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Unit Cost (₹/kg)</label><input type="number" value={fwCost} onChange={e => setFwCost(e.target.value)} placeholder="optional" step="0.01" className={inp + " text-right"} /></div>
                </div>
                {fwType === "IN" && <div><label className="block text-xs font-semibold text-gray-600 mb-1">Supplier</label><input type="text" value={fwSupplier} onChange={e => setFwSupplier(e.target.value)} placeholder="Supplier name" className={inp} /></div>}
                <div className="flex gap-3">
                  <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-500 min-h-[44px]">Cancel</button>
                  <button onClick={saveFirewood} disabled={saving || !fwQty} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 min-h-[44px]"><Save size={14} />{saving ? "Saving…" : "Save"}</button>
                </div>
              </div>
            )}

            {/* Other Fuel Form */}
            {tab === "fuel" && (
              <div className="space-y-4">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Date</label><input type="date" value={flDate} onChange={e => setFlDate(e.target.value)} className={inp} /></div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Fuel Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FUEL_TYPES.map(f => <button key={f.code} onClick={() => setFlType(f.code)} className={`py-2.5 rounded-lg border text-sm font-medium transition-all min-h-[44px] ${flType === f.code ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200"}`}>{f.label}</button>)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Qty ({FUEL_TYPES.find(f => f.code === flType)?.unit})</label><input type="number" value={flQty} onChange={e => setFlQty(e.target.value)} placeholder="0" className={inp + " text-right"} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Unit Cost (₹)</label><input type="number" value={flCost} onChange={e => setFlCost(e.target.value)} placeholder="optional" step="0.01" className={inp + " text-right"} /></div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-500 min-h-[44px]">Cancel</button>
                  <button onClick={saveFuel} disabled={saving || !flQty} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 min-h-[44px]"><Save size={14} />{saving ? "Saving…" : "Save"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
