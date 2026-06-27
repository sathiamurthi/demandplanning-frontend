"use client";

import { useState, useEffect, useRef } from "react";
import { Truck, Plus, X, Trash2, ChevronDown, ChevronUp, Package, Scale } from "lucide-react";
import { teaUrl, teaAuthHeaders } from "@/lib/tea-api";

interface Factory  { id: string; name: string; }
interface Vehicle  { id: string; vehicle_number: string; driver_name: string; }
interface Bag {
  id: string; bag_number: number; weight_kg: number; grade: string;
  factory_weight_kg: number | null; notes: string | null;
}
interface Dispatch {
  id: string; dispatch_date: string; factory_name: string; vehicle_number: string;
  total_kg: number; factory_total_kg: number | null; factory_bag_total_kg: number | null;
  status: string; driver_name: string; driver_phone: string;
  bag_count: number; grade_a_kg: number; grade_b_kg: number; grade_c_kg: number;
  notes: string | null;
}

const GC: Record<string, string> = {
  A: "bg-green-500/15 text-green-400 border-green-500/30",
  B: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  C: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};

export default function DispatchPage() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [factories, setFactories]   = useState<Factory[]>([]);
  const [vehicles, setVehicles]     = useState<Vehicle[]>([]);
  const [showForm, setShowForm]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [form, setForm] = useState({
    factory_id: "", vehicle_id: "",
    dispatch_date: new Date().toISOString().slice(0, 10),
    driver_name: "", driver_phone: "", notes: "",
  });

  // Expanded dispatch state
  const [expandedId, setExpandedId]         = useState<string | null>(null);
  const [bags, setBags]                     = useState<Bag[]>([]);
  const [bagGrade, setBagGrade]             = useState("A");
  const [bagWeight, setBagWeight]           = useState("");
  const [bagNotes, setBagNotes]             = useState("");
  const [addingBag, setAddingBag]           = useState(false);
  // Factory weight mode for the expanded dispatch
  const [fwMode, setFwMode]                 = useState<"per-bag" | "consolidated">("per-bag");
  const [consolidatedFw, setConsolidatedFw] = useState("");
  const [savingFw, setSavingFw]             = useState(false);
  // Per-bag factory weight editing
  const [editingFwBagId, setEditingFwBagId] = useState<string | null>(null);
  const [editingFwVal, setEditingFwVal]     = useState("");

  const weightRef = useRef<HTMLInputElement>(null);
  const fwRef     = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [dr, fr, vr] = await Promise.all([
      fetch(teaUrl("/dispatches"), { headers: teaAuthHeaders() }),
      fetch(teaUrl("/factories"), { headers: teaAuthHeaders() }),
      fetch(teaUrl("/vehicles"),  { headers: teaAuthHeaders() }),
    ]);
    const [d, f, v] = await Promise.all([dr.json(), fr.json(), vr.json()]);
    if (d.success && Array.isArray(d.data)) {
      // Exclude settlement-ghost dispatches: auto-created (status=settled) with no real dispatch activity
      setDispatches(d.data.filter((dp: Dispatch) =>
        !(dp.status === "settled" && Number(dp.bag_count ?? 0) === 0 && Number(dp.total_kg) === 0)
      ));
    }
    if (f.success && Array.isArray(f.data)) setFactories(f.data);
    if (v.success && Array.isArray(v.data)) setVehicles(v.data);
  };

  useEffect(() => { load(); }, []);

  const loadBags = async (dispatchId: string) => {
    const r = await fetch(teaUrl(`/dispatches/${dispatchId}/bags`), { headers: teaAuthHeaders() });
    const d = await r.json();
    if (d.success) setBags(d.data);
  };

  const toggleExpand = (dispatch: Dispatch) => {
    if (expandedId === dispatch.id) {
      setExpandedId(null); setBags([]); setConsolidatedFw("");
    } else {
      setExpandedId(dispatch.id);
      loadBags(dispatch.id);
      setConsolidatedFw(dispatch.factory_total_kg != null ? String(dispatch.factory_total_kg) : "");
      setTimeout(() => weightRef.current?.focus(), 100);
    }
  };

  const createDispatch = async () => {
    if (!form.factory_id) return;
    setSaving(true);
    const r = await fetch(teaUrl("/dispatches"), {
      method: "POST", headers: teaAuthHeaders(),
      body: JSON.stringify(form),
    });
    const d = await r.json();
    if (d.success) {
      setShowForm(false);
      setForm({ factory_id: "", vehicle_id: "", dispatch_date: new Date().toISOString().slice(0, 10), driver_name: "", driver_phone: "", notes: "" });
      await load();
      setExpandedId(d.data.id);
      loadBags(d.data.id);
    }
    setSaving(false);
  };

  const addBag = async () => {
    if (!expandedId || !bagWeight) return;
    setAddingBag(true);
    const r = await fetch(teaUrl(`/dispatches/${expandedId}/bags`), {
      method: "POST", headers: teaAuthHeaders(),
      body: JSON.stringify({ weight_kg: parseFloat(bagWeight), grade: bagGrade, notes: bagNotes || undefined }),
    });
    const d = await r.json();
    if (d.success) {
      setBags(prev => [...prev, d.data]);
      setBagWeight(""); setBagNotes("");
      setDispatches(prev => prev.map(dp =>
        dp.id === expandedId
          ? { ...dp, bag_count: dp.bag_count + 1, total_kg: Number(dp.total_kg) + parseFloat(bagWeight) }
          : dp
      ));
      weightRef.current?.focus();
    }
    setAddingBag(false);
  };

  const deleteBag = async (bagId: string) => {
    if (!expandedId) return;
    await fetch(teaUrl(`/dispatches/${expandedId}/bags/${bagId}`), { method: "DELETE", headers: teaAuthHeaders() });
    const removed = bags.find(b => b.id === bagId);
    setBags(prev => prev.filter(b => b.id !== bagId).map((b, i) => ({ ...b, bag_number: i + 1 })));
    if (removed) {
      setDispatches(prev => prev.map(dp =>
        dp.id === expandedId
          ? { ...dp, bag_count: Math.max(0, dp.bag_count - 1), total_kg: Math.max(0, Number(dp.total_kg) - Number(removed.weight_kg)) }
          : dp
      ));
    }
  };

  const saveBagFactoryWeight = async (bagId: string, val: string) => {
    await fetch(teaUrl(`/dispatches/${expandedId}/bags/${bagId}`), {
      method: "PATCH", headers: teaAuthHeaders(),
      body: JSON.stringify({ factory_weight_kg: val === "" ? null : parseFloat(val) }),
    });
    const fw = val === "" ? null : parseFloat(val);
    setBags(prev => prev.map(b => b.id === bagId ? { ...b, factory_weight_kg: fw } : b));
    setEditingFwBagId(null); setEditingFwVal("");
  };

  const saveConsolidatedFw = async () => {
    if (!expandedId) return;
    setSavingFw(true);
    const val = consolidatedFw === "" ? null : parseFloat(consolidatedFw);
    await fetch(teaUrl(`/dispatches/${expandedId}`), {
      method: "PATCH", headers: teaAuthHeaders(),
      body: JSON.stringify({ factory_total_kg: val }),
    });
    setDispatches(prev => prev.map(dp => dp.id === expandedId ? { ...dp, factory_total_kg: val } : dp));
    setSavingFw(false);
  };

  const dispatchTotal = (d: Dispatch) => Number(d.total_kg);
  const factoryTotal = (d: Dispatch): number | null => {
    if (d.factory_total_kg != null) return Number(d.factory_total_kg);
    if (d.factory_bag_total_kg != null) return Number(d.factory_bag_total_kg);
    return null;
  };
  const variance = (d: Dispatch) => {
    const ft = factoryTotal(d);
    if (ft == null) return null;
    return ft - dispatchTotal(d);
  };

  const statusColor = (s: string) =>
    s === "settled" ? "bg-purple-500/15 text-purple-400"
    : s === "in_transit" ? "bg-yellow-500/15 text-yellow-400"
    : "bg-blue-500/15 text-blue-400";

  // Totals for bag-level factory weight
  const bagDispatchTotal = bags.reduce((s, b) => s + Number(b.weight_kg), 0);
  const bagFactoryTotal  = bags.filter(b => b.factory_weight_kg != null).reduce((s, b) => s + Number(b.factory_weight_kg), 0);
  const bagVariance      = bags.some(b => b.factory_weight_kg != null) ? bagFactoryTotal - bagDispatchTotal : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-yellow-500/10 rounded-xl flex items-center justify-center">
            <Truck size={18} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Factory Dispatch</h1>
            <p className="text-white/40 text-xs">Click a dispatch to add bags and record factory weights</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-yellow-600/80 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={15} /> New Dispatch
        </button>
      </div>

      <div className="space-y-2">
        {dispatches.length === 0 ? (
          <div className="bg-[#161a23] border border-white/8 rounded-xl p-10 text-center text-white/30 text-sm">
            <Truck size={32} className="mx-auto mb-3 opacity-20" />
            No dispatches yet.
          </div>
        ) : dispatches.map(d => {
          const vari = variance(d);
          const ft   = factoryTotal(d);
          return (
            <div key={d.id} className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/2" onClick={() => toggleExpand(d)}>
                <div className="w-8 h-8 bg-yellow-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <Truck size={14} className="text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium text-sm">{d.factory_name}</span>
                    {d.vehicle_number && <span className="text-white/40 text-xs font-mono">{d.vehicle_number}</span>}
                    <span className="text-white/30 text-xs">{new Date(d.dispatch_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-white/60 text-xs">
                      <span className="text-white font-semibold">{Number(d.total_kg).toFixed(2)} kg</span>
                      {d.bag_count > 0 && <span className="text-white/30"> · {d.bag_count} bags</span>}
                    </span>
                    {Number(d.grade_a_kg) > 0 && <span className="text-green-400 text-xs">A: {Number(d.grade_a_kg).toFixed(1)} kg</span>}
                    {Number(d.grade_b_kg) > 0 && <span className="text-blue-400 text-xs">B: {Number(d.grade_b_kg).toFixed(1)} kg</span>}
                    {Number(d.grade_c_kg) > 0 && <span className="text-yellow-400 text-xs">C: {Number(d.grade_c_kg).toFixed(1)} kg</span>}
                    {/* Factory weight summary */}
                    {ft != null && (
                      <span className="flex items-center gap-1 text-xs">
                        <Scale size={10} className="text-purple-400" />
                        <span className="text-purple-400">Fac: {ft.toFixed(2)} kg</span>
                        {vari != null && (
                          <span className={`${vari < 0 ? "text-red-400" : vari > 0 ? "text-green-400" : "text-white/30"}`}>
                            ({vari >= 0 ? "+" : ""}{vari.toFixed(2)})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize hidden sm:inline-flex ${statusColor(d.status)}`}>
                  {d.status.replace("_", " ")}
                </span>
                {expandedId === d.id ? <ChevronUp size={14} className="text-white/40" /> : <ChevronDown size={14} className="text-white/40" />}
              </div>

              {/* Expanded */}
              {expandedId === d.id && (
                <div className="border-t border-white/8">
                  {/* Add Bag form */}
                  <div className="px-4 py-3 bg-white/2 border-b border-white/5">
                    <p className="text-white/40 text-xs mb-2 font-medium">Add Bag</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex gap-1">
                        {["A", "B", "C"].map(g => (
                          <button key={g} onClick={() => setBagGrade(g)}
                            className={`w-9 h-9 rounded-xl text-sm font-bold border transition-all ${bagGrade === g ? GC[g] : "bg-white/5 text-white/30 border-white/8 hover:text-white"}`}>
                            {g}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2">
                        <Package size={12} className="text-white/30" />
                        <input ref={weightRef} type="number" step="0.1" min="0" placeholder="Dispatch wt (kg)"
                          value={bagWeight} onChange={e => setBagWeight(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addBag()}
                          className="bg-transparent text-white text-sm w-32 focus:outline-none" />
                        <span className="text-white/30 text-xs">kg</span>
                      </div>
                      <input type="text" placeholder="Notes" value={bagNotes} onChange={e => setBagNotes(e.target.value)}
                        className="bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none w-32" />
                      <button onClick={addBag} disabled={addingBag || !bagWeight}
                        className="flex items-center gap-1.5 bg-green-600/80 hover:bg-green-600 disabled:opacity-40 text-white px-3 py-2 rounded-xl text-sm font-medium">
                        <Plus size={14} /> {addingBag ? "Adding…" : "Add"}
                      </button>
                      <span className="text-white/20 text-xs hidden sm:inline">↵ Enter</span>
                    </div>
                  </div>

                  {/* Bag list */}
                  {bags.length > 0 && (
                    <>
                      {/* Factory weight mode toggle */}
                      <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-3">
                        <Scale size={13} className="text-purple-400" />
                        <span className="text-white/40 text-xs font-medium">Factory Weight:</span>
                        <div className="flex gap-1 bg-[#0d0f14] rounded-lg p-0.5 border border-white/8">
                          {(["per-bag", "consolidated"] as const).map(m => (
                            <button key={m} onClick={() => setFwMode(m)}
                              className={`px-2.5 py-1 rounded-md text-xs transition-all capitalize ${fwMode === m ? "bg-purple-600/30 text-purple-400" : "text-white/30 hover:text-white"}`}>
                              {m === "per-bag" ? "Per Bag" : "Consolidated"}
                            </button>
                          ))}
                        </div>
                        {fwMode === "consolidated" && (
                          <div className="flex items-center gap-2 ml-2">
                            <input ref={fwRef} type="number" step="0.1" placeholder="Total factory kg"
                              value={consolidatedFw} onChange={e => setConsolidatedFw(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && saveConsolidatedFw()}
                              className="bg-[#0d0f14] border border-purple-500/30 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none w-36" />
                            <button onClick={saveConsolidatedFw} disabled={savingFw}
                              className="text-xs px-2.5 py-1.5 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30">
                              {savingFw ? "Saving…" : "Save"}
                            </button>
                            {d.factory_total_kg != null && (
                              <span className="text-white/30 text-xs">saved: {Number(d.factory_total_kg).toFixed(2)} kg</span>
                            )}
                          </div>
                        )}
                      </div>

                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="px-4 py-2 text-left text-white/30 text-xs">Bag #</th>
                            <th className="px-4 py-2 text-left text-white/30 text-xs">Grade</th>
                            <th className="px-4 py-2 text-left text-white/30 text-xs">Dispatch (kg)</th>
                            {fwMode === "per-bag" && (
                              <th className="px-4 py-2 text-left text-white/30 text-xs">
                                <span className="flex items-center gap-1"><Scale size={10} className="text-purple-400" /> Factory (kg)</span>
                              </th>
                            )}
                            {fwMode === "per-bag" && (
                              <th className="px-4 py-2 text-left text-white/30 text-xs hidden sm:table-cell">Variance</th>
                            )}
                            <th className="px-4 py-2 text-left text-white/30 text-xs hidden md:table-cell">Notes</th>
                            <th className="px-4 py-2 text-right text-white/30 text-xs"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {bags.map(b => {
                            const bv = b.factory_weight_kg != null ? Number(b.factory_weight_kg) - Number(b.weight_kg) : null;
                            return (
                              <tr key={b.id} className="border-b border-white/5 hover:bg-white/2">
                                <td className="px-4 py-2 text-white/40 text-xs font-mono">#{b.bag_number}</td>
                                <td className="px-4 py-2">
                                  <span className={`text-xs px-1.5 py-0.5 rounded border ${GC[b.grade] || "bg-white/10 text-white/50"}`}>{b.grade}</span>
                                </td>
                                <td className="px-4 py-2 text-white font-semibold text-sm">{Number(b.weight_kg).toFixed(2)}</td>
                                {fwMode === "per-bag" && (
                                  <td className="px-4 py-2">
                                    {editingFwBagId === b.id ? (
                                      <div className="flex items-center gap-1">
                                        <input type="number" step="0.01" autoFocus value={editingFwVal}
                                          onChange={e => setEditingFwVal(e.target.value)}
                                          onKeyDown={e => { if (e.key === "Enter") saveBagFactoryWeight(b.id, editingFwVal); if (e.key === "Escape") setEditingFwBagId(null); }}
                                          onBlur={() => saveBagFactoryWeight(b.id, editingFwVal)}
                                          className="bg-[#0d0f14] border border-purple-500/30 rounded-lg px-2 py-1 text-sm text-white focus:outline-none w-20" />
                                        <span className="text-white/30 text-xs">kg</span>
                                      </div>
                                    ) : (
                                      <button onClick={() => { setEditingFwBagId(b.id); setEditingFwVal(b.factory_weight_kg != null ? String(b.factory_weight_kg) : ""); }}
                                        className={`text-sm px-2 py-0.5 rounded-lg border border-dashed transition-all min-w-[60px] text-left ${b.factory_weight_kg != null ? "text-purple-400 border-purple-500/20 hover:border-purple-500/50" : "text-white/20 border-white/10 hover:text-white/50"}`}>
                                        {b.factory_weight_kg != null ? `${Number(b.factory_weight_kg).toFixed(2)}` : "— click"}
                                      </button>
                                    )}
                                  </td>
                                )}
                                {fwMode === "per-bag" && (
                                  <td className="px-4 py-2 hidden sm:table-cell">
                                    {bv != null ? (
                                      <span className={`text-xs ${bv < 0 ? "text-red-400" : bv > 0 ? "text-green-400" : "text-white/30"}`}>
                                        {bv >= 0 ? "+" : ""}{bv.toFixed(2)}
                                      </span>
                                    ) : <span className="text-white/20 text-xs">—</span>}
                                  </td>
                                )}
                                <td className="px-4 py-2 text-white/40 text-xs hidden md:table-cell">{b.notes || "—"}</td>
                                <td className="px-4 py-2 text-right">
                                  <button onClick={() => deleteBag(b.id)} className="text-white/20 hover:text-red-400">
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-white/10 bg-white/1">
                            <td colSpan={2} className="px-4 py-2 text-white/30 text-xs">{bags.length} bags</td>
                            <td className="px-4 py-2 text-white font-bold text-sm">{bagDispatchTotal.toFixed(2)}</td>
                            {fwMode === "per-bag" && (
                              <td className="px-4 py-2">
                                {bags.some(b => b.factory_weight_kg != null) ? (
                                  <span className="text-purple-400 font-bold text-sm">{bagFactoryTotal.toFixed(2)}</span>
                                ) : <span className="text-white/20 text-xs">not entered</span>}
                              </td>
                            )}
                            {fwMode === "per-bag" && (
                              <td className="px-4 py-2 hidden sm:table-cell">
                                {bagVariance != null ? (
                                  <span className={`text-sm font-semibold ${bagVariance < 0 ? "text-red-400" : bagVariance > 0 ? "text-green-400" : "text-white/30"}`}>
                                    {bagVariance >= 0 ? "+" : ""}{bagVariance.toFixed(2)} kg
                                  </span>
                                ) : null}
                              </td>
                            )}
                            {fwMode === "consolidated" && (
                              <td colSpan={2} className="px-4 py-2">
                                {d.factory_total_kg != null && (
                                  <span className={`text-sm font-semibold ${Number(d.factory_total_kg) - bagDispatchTotal < 0 ? "text-red-400" : "text-green-400"}`}>
                                    Factory total: {Number(d.factory_total_kg).toFixed(2)} kg
                                    {" ("}
                                    {Number(d.factory_total_kg) - bagDispatchTotal >= 0 ? "+" : ""}
                                    {(Number(d.factory_total_kg) - bagDispatchTotal).toFixed(2)}
                                    {")"}
                                  </span>
                                )}
                              </td>
                            )}
                            <td colSpan={fwMode === "per-bag" ? 2 : 1} className="px-4 py-2 text-right">
                              <div className="flex items-center justify-end gap-2 text-xs">
                                {["A", "B", "C"].map(g => {
                                  const kg = bags.filter(b => b.grade === g).reduce((s, b) => s + Number(b.weight_kg), 0);
                                  return kg > 0 ? (
                                    <span key={g} className={`px-1.5 py-0.5 rounded border ${GC[g]}`}>{g}: {kg.toFixed(1)}</span>
                                  ) : null;
                                })}
                              </div>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </>
                  )}
                  {bags.length === 0 && (
                    <div className="px-4 py-4">
                      {Number(dispatches.find(dp => dp.id === expandedId)?.total_kg ?? 0) > 0 ? (
                        <p className="text-yellow-400/60 text-xs">
                          This dispatch has <span className="font-semibold text-yellow-400">{Number(dispatches.find(dp => dp.id === expandedId)?.total_kg).toFixed(2)} kg</span> recorded as a total.
                          Use the form above to add individual bag entries.
                        </p>
                      ) : (
                        <p className="text-white/30 text-xs">No bags added yet. Use the form above to add bags.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Dispatch Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#161a23] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white">New Dispatch</h2>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-white/50 text-xs block mb-1">Factory *</label>
                <select value={form.factory_id} onChange={e => setForm(p => ({ ...p, factory_id: e.target.value }))}
                  className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                  <option value="">Select factory...</option>
                  {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs block mb-1">Vehicle</label>
                  <select value={form.vehicle_id} onChange={e => {
                    const v = vehicles.find(v => v.id === e.target.value);
                    setForm(p => ({ ...p, vehicle_id: e.target.value, driver_name: v?.driver_name || p.driver_name }));
                  }}
                    className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                    <option value="">None</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/50 text-xs block mb-1">Dispatch Date</label>
                  <input type="date" value={form.dispatch_date} onChange={e => setForm(p => ({ ...p, dispatch_date: e.target.value }))}
                    className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs block mb-1">Driver Name</label>
                  <input type="text" value={form.driver_name} onChange={e => setForm(p => ({ ...p, driver_name: e.target.value }))}
                    className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
                <div>
                  <label className="text-white/50 text-xs block mb-1">Driver Phone</label>
                  <input type="text" value={form.driver_phone} onChange={e => setForm(p => ({ ...p, driver_phone: e.target.value }))}
                    className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1">Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
              <p className="text-white/25 text-xs">After creating, click the dispatch row to add bags one by one.</p>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-white/10 rounded-xl py-2.5 text-sm text-white/50">Cancel</button>
              <button onClick={createDispatch} disabled={saving || !form.factory_id}
                className="flex-1 bg-yellow-600/80 hover:bg-yellow-600 disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium text-white">
                {saving ? "Creating..." : "Create Dispatch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
