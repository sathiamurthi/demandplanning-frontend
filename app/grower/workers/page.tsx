"use client";

import { useState, useEffect } from "react";
import { Users, Plus, X, Check, RefreshCw, Edit2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/v1";
function gh(): HeadersInit {
  const t = typeof window !== "undefined" ? localStorage.getItem("grower_token") : null;
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}
function gu(p: string) {
  const tid = typeof window !== "undefined" ? localStorage.getItem("grower_tenant") : "";
  return `${API}/tenants/${tid}/tea${p}`;
}

interface Worker {
  id: string; name: string; phone: string | null;
  wage_type: string; daily_wage: number; per_kg_wage: number; is_active: boolean;
}
interface PluckEntry { id: string; worker_id: string; pluck_date: string; kg_plucked: number; wage_amount: number; is_paid: boolean; }

const blank = { name: "", phone: "", wage_type: "daily", daily_wage: "", per_kg_wage: "" };
const blankPluck = { kg_plucked: "", pluck_date: new Date().toISOString().slice(0, 10), notes: "" };

export default function WorkersPage() {
  const [workers, setWorkers]           = useState<Worker[]>([]);
  const [selected, setSelected]         = useState<Worker | null>(null);
  const [pluck, setPluck]               = useState<PluckEntry[]>([]);
  const [showAdd, setShowAdd]           = useState(false);
  const [showPluck, setShowPluck]       = useState(false);
  const [form, setForm]                 = useState({ ...blank });
  const [pluckForm, setPluckForm]       = useState({ ...blankPluck });
  const [editing, setEditing]           = useState<Worker | null>(null);
  const [saving, setSaving]             = useState(false);
  const [wageSummary, setWageSummary]   = useState<any[]>([]);

  const loadWorkers = async () => {
    const r = await fetch(gu("/grower-portal/workers"), { headers: gh() });
    const d = await r.json();
    if (d.success) setWorkers(d.data);
  };

  const loadWages = async () => {
    const r = await fetch(gu("/grower-portal/wages-summary"), { headers: gh() });
    const d = await r.json();
    if (d.success) setWageSummary(d.data);
  };

  const loadPluck = async (w: Worker) => {
    setSelected(w);
    const r = await fetch(gu(`/grower-portal/workers/${w.id}/pluck`), { headers: gh() });
    const d = await r.json();
    if (d.success) setPluck(d.data);
  };

  useEffect(() => { loadWorkers(); loadWages(); }, []);

  const saveWorker = async () => {
    if (!form.name) return;
    setSaving(true);
    const body = {
      name: form.name, phone: form.phone || null,
      wage_type: form.wage_type,
      daily_wage: parseFloat(form.daily_wage) || 0,
      per_kg_wage: parseFloat(form.per_kg_wage) || 0,
    };
    const method = editing ? "PUT" : "POST";
    const url = editing ? gu(`/grower-portal/workers/${editing.id}`) : gu("/grower-portal/workers");
    const r = await fetch(url, { method, headers: gh(), body: JSON.stringify(body) });
    const d = await r.json();
    if (d.success) { setShowAdd(false); setEditing(null); setForm({ ...blank }); loadWorkers(); loadWages(); }
    setSaving(false);
  };

  const logPluck = async () => {
    if (!selected || !pluckForm.kg_plucked) return;
    setSaving(true);
    const r = await fetch(gu(`/grower-portal/workers/${selected.id}/pluck`), {
      method: "POST", headers: gh(),
      body: JSON.stringify({ pluck_date: pluckForm.pluck_date, kg_plucked: parseFloat(pluckForm.kg_plucked), notes: pluckForm.notes }),
    });
    const d = await r.json();
    if (d.success) { setShowPluck(false); setPluckForm({ ...blankPluck }); loadPluck(selected); loadWages(); }
    setSaving(false);
  };

  const markPaid = async (workerId: string) => {
    await fetch(gu(`/grower-portal/workers/${workerId}/mark-paid`), { method: "PUT", headers: gh(), body: JSON.stringify({}) });
    loadWages();
    if (selected?.id === workerId) loadPluck(selected);
  };

  const openEdit = (w: Worker) => {
    setEditing(w);
    setForm({ name: w.name, phone: w.phone || "", wage_type: w.wage_type,
              daily_wage: String(w.daily_wage), per_kg_wage: String(w.per_kg_wage) });
    setShowAdd(true);
  };

  return (
    <div className="p-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-500/10 rounded-xl flex items-center justify-center">
            <Users size={18} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Workers & Wages</h1>
            <p className="text-white/40 text-xs">Manage pluckers, log daily kg, track wages</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { loadWorkers(); loadWages(); }} className="text-white/30 hover:text-white"><RefreshCw size={14} /></button>
          <button onClick={() => { setShowAdd(true); setEditing(null); setForm({ ...blank }); }}
            className="flex items-center gap-2 bg-green-600/80 hover:bg-green-600 text-white px-3 py-2 rounded-xl text-sm">
            <Plus size={14} /> Add Worker
          </button>
        </div>
      </div>

      {/* Wage summary table */}
      <div className="bg-[#0d1810] border border-white/8 rounded-xl overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
          <h2 className="text-white text-sm font-semibold">This Month's Summary</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-2.5 text-left text-white/40 text-xs">Worker</th>
              <th className="px-4 py-2.5 text-left text-white/40 text-xs">Wage</th>
              <th className="px-4 py-2.5 text-left text-white/40 text-xs">Total KG</th>
              <th className="px-4 py-2.5 text-left text-white/40 text-xs">Total Wages</th>
              <th className="px-4 py-2.5 text-left text-white/40 text-xs">Due</th>
              <th className="px-4 py-2.5 text-right text-white/40 text-xs">Action</th>
            </tr>
          </thead>
          <tbody>
            {wageSummary.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-white/30 text-sm">No workers yet</td></tr>
            ) : wageSummary.map(w => {
              const worker = workers.find(x => x.id === w.worker_id);
              return (
                <tr key={w.worker_id} className="border-b border-white/5 hover:bg-white/3">
                  <td className="px-4 py-3">
                    <p className="text-white text-sm font-medium">{w.worker_name}</p>
                    <button onClick={() => { const wk = workers.find(x => x.id === w.worker_id); if (wk) loadPluck(wk); }}
                      className="text-green-400 text-xs hover:underline">View log</button>
                  </td>
                  <td className="px-4 py-3 text-white/50 text-xs">{w.wage_type === 'per_kg' ? '₹/kg' : '₹/day'}</td>
                  <td className="px-4 py-3 text-white/70 text-sm">{Number(w.total_kg).toFixed(2)} kg</td>
                  <td className="px-4 py-3 text-white text-sm">₹{Number(w.total_wages).toFixed(0)}</td>
                  <td className="px-4 py-3">
                    {Number(w.due_wages) > 0 ? (
                      <span className="text-orange-400 text-sm">₹{Number(w.due_wages).toFixed(0)}</span>
                    ) : <span className="text-green-400 text-xs">Settled</span>}
                  </td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-1.5">
                    <button onClick={() => { if (worker) openEdit(worker); }} className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10">
                      <Edit2 size={11} />
                    </button>
                    <button onClick={() => { setSelected(workers.find(x => x.id === w.worker_id) || null); setShowPluck(true); }}
                      className="w-7 h-7 bg-green-600/20 rounded-lg flex items-center justify-center hover:bg-green-600/40 text-green-400">
                      <Plus size={11} />
                    </button>
                    {Number(w.due_wages) > 0 && (
                      <button onClick={() => markPaid(w.worker_id)}
                        className="w-7 h-7 bg-orange-600/20 rounded-lg flex items-center justify-center hover:bg-orange-600/40 text-orange-400">
                        <Check size={11} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pluck log for selected worker */}
      {selected && (
        <div className="bg-[#0d1810] border border-white/8 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
            <h2 className="text-white text-sm font-semibold">Pluck Log — {selected.name}</h2>
            <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white"><X size={14} /></button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-2 text-left text-white/40 text-xs">Date</th>
                <th className="px-4 py-2 text-left text-white/40 text-xs">KG</th>
                <th className="px-4 py-2 text-left text-white/40 text-xs">Wage</th>
                <th className="px-4 py-2 text-right text-white/40 text-xs">Paid?</th>
              </tr>
            </thead>
            <tbody>
              {pluck.length === 0 ? (
                <tr><td colSpan={4} className="p-5 text-center text-white/30 text-sm">No entries</td></tr>
              ) : pluck.map(p => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-4 py-2 text-white/60 text-sm">{new Date(p.pluck_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                  <td className="px-4 py-2 text-white text-sm">{Number(p.kg_plucked).toFixed(2)} kg</td>
                  <td className="px-4 py-2 text-white/70 text-sm">₹{Number(p.wage_amount).toFixed(0)}</td>
                  <td className="px-4 py-2 text-right">
                    <span className={`text-xs ${p.is_paid ? "text-green-400" : "text-white/30"}`}>{p.is_paid ? "Yes" : "No"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Worker Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1810] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white">{editing ? "Edit Worker" : "Add Worker"}</h2>
              <button onClick={() => { setShowAdd(false); setEditing(null); }} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-white/50 text-xs block mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-[#0a1209] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full bg-[#0a1209] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1">Wage Type</label>
                <div className="flex gap-2">
                  {["daily", "per_kg"].map(t => (
                    <button key={t} onClick={() => setForm(p => ({ ...p, wage_type: t }))}
                      className={`flex-1 py-2 rounded-xl text-xs border transition-all ${form.wage_type === t ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-white/10 text-white/40"}`}>
                      {t === "daily" ? "Per Day" : "Per KG"}
                    </button>
                  ))}
                </div>
              </div>
              {form.wage_type === "daily" ? (
                <div>
                  <label className="text-white/50 text-xs block mb-1">Daily Wage (₹)</label>
                  <input type="number" value={form.daily_wage} onChange={e => setForm(p => ({ ...p, daily_wage: e.target.value }))}
                    className="w-full bg-[#0a1209] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
              ) : (
                <div>
                  <label className="text-white/50 text-xs block mb-1">Per KG Wage (₹)</label>
                  <input type="number" value={form.per_kg_wage} onChange={e => setForm(p => ({ ...p, per_kg_wage: e.target.value }))}
                    className="w-full bg-[#0a1209] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowAdd(false); setEditing(null); }} className="flex-1 border border-white/10 rounded-xl py-2.5 text-sm text-white/50">Cancel</button>
              <button onClick={saveWorker} disabled={saving || !form.name}
                className="flex-1 bg-green-600/80 hover:bg-green-600 disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium text-white">
                {saving ? "Saving…" : editing ? "Update" : "Add Worker"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Pluck Modal */}
      {showPluck && selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1810] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white">Log Pluck — {selected.name}</h2>
              <button onClick={() => setShowPluck(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-white/50 text-xs block mb-1">Date</label>
                <input type="date" value={pluckForm.pluck_date} onChange={e => setPluckForm(p => ({ ...p, pluck_date: e.target.value }))}
                  className="w-full bg-[#0a1209] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1">KG Plucked *</label>
                <input type="number" step="0.1" value={pluckForm.kg_plucked} onChange={e => setPluckForm(p => ({ ...p, kg_plucked: e.target.value }))}
                  className="w-full bg-[#0a1209] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1">Notes</label>
                <input value={pluckForm.notes} onChange={e => setPluckForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full bg-[#0a1209] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
              <p className="text-white/30 text-xs">
                Wage: {selected.wage_type === 'per_kg'
                  ? `₹${selected.per_kg_wage}/kg × ${pluckForm.kg_plucked || 0} = ₹${(Number(pluckForm.kg_plucked) * Number(selected.per_kg_wage)).toFixed(0)}`
                  : `₹${selected.daily_wage}/day`}
              </p>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowPluck(false)} className="flex-1 border border-white/10 rounded-xl py-2.5 text-sm text-white/50">Cancel</button>
              <button onClick={logPluck} disabled={saving || !pluckForm.kg_plucked}
                className="flex-1 bg-green-600/80 hover:bg-green-600 disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium text-white">
                {saving ? "Saving…" : "Log Pluck"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
