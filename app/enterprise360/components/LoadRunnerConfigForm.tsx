"use client";

import { useState } from "react";
import { LR_TOOLS, LR_PROTOCOLS, LR_PACINGS, LRConfig, LRScenario } from "../lib/agentData";

export function LoadRunnerConfigForm({ initial, onSave, saving }: {
  initial: LRConfig; onSave: (cfg: LRConfig) => void; saving: boolean;
}) {
  const [form, setForm] = useState<LRConfig>(initial);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof LRConfig>(k: K, v: LRConfig[K]) => setForm(f => ({ ...f, [k]: v }));
  const setSla = <K extends keyof LRConfig["sla"]>(k: K, v: number) => setForm(f => ({ ...f, sla: { ...f.sla, [k]: v } }));
  const addScenario = () => setForm(f => ({ ...f, scenarios: [...f.scenarios, { name: "", virtual_users: 10, duration_minutes: 10 }] }));
  const removeScenario = (i: number) => setForm(f => ({ ...f, scenarios: f.scenarios.filter((_, j) => j !== i) }));
  const setScenario = <K extends keyof LRScenario>(i: number, k: K, v: LRScenario[K]) =>
    setForm(f => { const s = [...f.scenarios]; s[i] = { ...s[i], [k]: v }; return { ...f, scenarios: s }; });

  const save = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const labelClass  = "block text-sm font-bold text-gray-600 mb-1";
  const inputClass  = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400";
  const selectClass = `${inputClass} bg-white`;

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-base font-black text-gray-900 mb-4">General</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Tool</label>
            <select className={selectClass} value={form.tool} onChange={e => set("tool", e.target.value)}>
              {LR_TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Protocol</label>
            <select className={selectClass} value={form.protocol} onChange={e => set("protocol", e.target.value)}>
              {LR_PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Target URL</label>
            <input className={inputClass} value={form.target_url} onChange={e => set("target_url", e.target.value)} placeholder="http://your-app:8000" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-base font-black text-gray-900 mb-4">Load Profile</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Virtual Users</label>
            <input type="number" min={1} className={inputClass} value={form.virtual_users} onChange={e => set("virtual_users", Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>Ramp-up (s)</label>
            <input type="number" min={0} className={inputClass} value={form.ramp_up_seconds} onChange={e => set("ramp_up_seconds", Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>Duration (min)</label>
            <input type="number" min={1} className={inputClass} value={form.duration_minutes} onChange={e => set("duration_minutes", Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>Think Time (ms)</label>
            <input type="number" min={0} className={inputClass} value={form.think_time_ms} onChange={e => set("think_time_ms", Number(e.target.value))} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Pacing</label>
            <select className={selectClass} value={form.pacing} onChange={e => set("pacing", e.target.value)}>
              {LR_PACINGS.map(p => <option key={p} value={p}>{p.replace(/_/g, " ")}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-black text-gray-900">Scenarios</h3>
          <button onClick={addScenario} className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-800 font-bold">+ Add Scenario</button>
        </div>
        <div className="space-y-3">
          {form.scenarios.map((s, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-center bg-slate-50 rounded-lg px-4 py-3 border border-gray-200">
              <div className="col-span-5">
                <label className={labelClass}>Name</label>
                <input className={inputClass} value={s.name} onChange={e => setScenario(i, "name", e.target.value)} placeholder="Scenario name" />
              </div>
              <div className="col-span-3">
                <label className={labelClass}>VUs</label>
                <input type="number" min={1} className={inputClass} value={s.virtual_users} onChange={e => setScenario(i, "virtual_users", Number(e.target.value))} />
              </div>
              <div className="col-span-3">
                <label className={labelClass}>Duration (min)</label>
                <input type="number" min={1} className={inputClass} value={s.duration_minutes} onChange={e => setScenario(i, "duration_minutes", Number(e.target.value))} />
              </div>
              <div className="col-span-1 flex items-end pb-1">
                <button onClick={() => removeScenario(i)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors" title="Remove scenario">✕</button>
              </div>
            </div>
          ))}
          {form.scenarios.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No scenarios — click "Add Scenario" to add one.</p>}
        </div>
      </section>

      <section>
        <h3 className="text-base font-black text-gray-900 mb-4">SLA Thresholds</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Response Time P90 (ms)</label>
            <input type="number" min={1} className={inputClass} value={form.sla.response_time_90pct_ms} onChange={e => setSla("response_time_90pct_ms", Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>Error Rate (%)</label>
            <input type="number" min={0} max={100} step={0.1} className={inputClass} value={form.sla.error_rate_pct} onChange={e => setSla("error_rate_pct", Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>Throughput (req/s)</label>
            <input type="number" min={1} className={inputClass} value={form.sla.throughput_rps} onChange={e => setSla("throughput_rps", Number(e.target.value))} />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <div className="text-sm">{saved && <span className="text-green-600 font-bold">✓ Saved</span>}</div>
        <button onClick={save} disabled={saving}
          className="px-5 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 disabled:opacity-50 transition-colors">
          {saving ? "Saving…" : "Save LoadRunner Config"}
        </button>
      </div>
    </div>
  );
}
