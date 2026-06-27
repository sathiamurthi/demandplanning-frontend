"use client";

import { useState, useEffect } from "react";
import { Settings, Plus, X, Edit, Factory, Truck, Fuel, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { teaUrl, teaAuthHeaders } from "@/lib/tea-api";

type SettingsTab = "rates" | "factories" | "vehicles";

interface Rate {
  id: string;
  week_number: number;
  week_year: number;
  week_start_date: string;
  grade_a_rate: number;
  grade_b_rate: number;
  grade_c_rate: number;
  payment_mode: string;
  advance_rate_a: number | null;
  advance_rate_b: number | null;
  advance_rate_c: number | null;
}
interface FactoryItem {
  id: string; name: string; location: string; contact_name: string;
  contact_phone: string; is_active: boolean;
}
interface Vehicle {
  id: string; vehicle_number: string; driver_name: string; driver_phone: string;
  is_active: boolean;
}
interface FuelLog {
  id: string; vehicle_id: string; log_date: string; fuel_type: string;
  liters: number; rate_per_liter: number; total_cost: number; odometer_km: number | null;
}

export default function SettingsPage() {
  const [tab, setTab]             = useState<SettingsTab>("rates");
  const [rates, setRates]         = useState<Rate[]>([]);
  const [factories, setFactories] = useState<FactoryItem[]>([]);
  const [vehicles, setVehicles]   = useState<Vehicle[]>([]);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);

  const [rateForm, setRateForm] = useState({
    grade_a_rate: "", grade_b_rate: "", grade_c_rate: "",
    effective_date: new Date().toISOString().slice(0, 10),
    payment_mode: "full",
    advance_rate_a: "", advance_rate_b: "", advance_rate_c: "",
  });
  const [factoryForm, setFactoryForm] = useState({ name: "", location: "", contact_name: "", contact_phone: "" });
  const [editFactory, setEditFactory] = useState<FactoryItem | null>(null);
  const [vehicleForm, setVehicleForm] = useState({ vehicle_number: "", driver_name: "", driver_phone: "" });
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [fuelLogs, setFuelLogs]       = useState<FuelLog[]>([]);
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [fuelVehicleId, setFuelVehicleId] = useState<string>("");
  const [fuelForm, setFuelForm] = useState({
    log_date: new Date().toISOString().slice(0, 10),
    fuel_type: "diesel", liters: "", rate_per_liter: "", total_cost: "", odometer_km: "",
  });
  const [fuelSaving, setFuelSaving] = useState(false);

  const load = async () => {
    const [rr, fr, vr] = await Promise.all([
      fetch(teaUrl("/rates"), { headers: teaAuthHeaders() }),
      fetch(teaUrl("/factories"), { headers: teaAuthHeaders() }),
      fetch(teaUrl("/vehicles"), { headers: teaAuthHeaders() }),
    ]);
    const [r, f, v] = await Promise.all([rr.json(), fr.json(), vr.json()]);
    if (r.success) setRates(r.data);
    if (f.success) setFactories(f.data);
    if (v.success) setVehicles(v.data);
  };

  useEffect(() => { load(); }, []);

  const saveRate = async () => {
    if (!rateForm.grade_a_rate) return;
    setSaving(true);
    const body: Record<string, any> = {
      grade_a_rate: parseFloat(rateForm.grade_a_rate),
      grade_b_rate: parseFloat(rateForm.grade_b_rate),
      grade_c_rate: parseFloat(rateForm.grade_c_rate),
      effective_date: rateForm.effective_date,
      payment_mode: rateForm.payment_mode,
    };
    if (rateForm.payment_mode === "advance") {
      if (rateForm.advance_rate_a) body.advance_rate_a = parseFloat(rateForm.advance_rate_a);
      if (rateForm.advance_rate_b) body.advance_rate_b = parseFloat(rateForm.advance_rate_b);
      if (rateForm.advance_rate_c) body.advance_rate_c = parseFloat(rateForm.advance_rate_c);
    }
    const r = await fetch(teaUrl("/rates"), {
      method: "POST", headers: teaAuthHeaders(),
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (d.success) {
      setShowForm(false);
      setRateForm({ grade_a_rate: "", grade_b_rate: "", grade_c_rate: "",
                    effective_date: new Date().toISOString().slice(0, 10),
                    payment_mode: "full", advance_rate_a: "", advance_rate_b: "", advance_rate_c: "" });
      load();
    }
    setSaving(false);
  };

  const saveFactory = async () => {
    if (!factoryForm.name) return;
    setSaving(true);
    const method = editFactory ? "PUT" : "POST";
    const url = editFactory ? teaUrl(`/factories/${editFactory.id}`) : teaUrl("/factories");
    const r = await fetch(url, { method, headers: teaAuthHeaders(), body: JSON.stringify(factoryForm) });
    const d = await r.json();
    if (d.success) { setShowForm(false); setEditFactory(null); setFactoryForm({ name: "", location: "", contact_name: "", contact_phone: "" }); load(); }
    setSaving(false);
  };

  const saveVehicle = async () => {
    if (!vehicleForm.vehicle_number) return;
    setSaving(true);
    const method = editVehicle ? "PUT" : "POST";
    const url = editVehicle ? teaUrl(`/vehicles/${editVehicle.id}`) : teaUrl("/vehicles");
    const r = await fetch(url, { method, headers: teaAuthHeaders(), body: JSON.stringify(vehicleForm) });
    const d = await r.json();
    if (d.success) { setShowForm(false); setEditVehicle(null); setVehicleForm({ vehicle_number: "", driver_name: "", driver_phone: "" }); load(); }
    setSaving(false);
  };

  const openFactoryEdit = (f: FactoryItem) => {
    setFactoryForm({ name: f.name, location: f.location, contact_name: f.contact_name, contact_phone: f.contact_phone });
    setEditFactory(f); setShowForm(true);
  };
  const openVehicleEdit = (v: Vehicle) => {
    setVehicleForm({ vehicle_number: v.vehicle_number, driver_name: v.driver_name, driver_phone: v.driver_phone });
    setEditVehicle(v); setShowForm(true);
  };

  const loadFuelLogs = async (vehicleId: string) => {
    try {
      const r = await fetch(teaUrl(`/vehicles/${vehicleId}/fuel`), { headers: teaAuthHeaders() });
      const d = await r.json();
      if (d.success) setFuelLogs(d.data);
    } catch {}
  };

  const toggleFuelExpand = (vehicleId: string) => {
    if (expandedVehicle === vehicleId) {
      setExpandedVehicle(null);
    } else {
      setExpandedVehicle(vehicleId);
      loadFuelLogs(vehicleId);
    }
  };

  const saveFuelLog = async () => {
    if (!fuelForm.liters || !fuelForm.rate_per_liter) return;
    setFuelSaving(true);
    try {
      const liters = parseFloat(fuelForm.liters);
      const rate = parseFloat(fuelForm.rate_per_liter);
      const total = fuelForm.total_cost ? parseFloat(fuelForm.total_cost) : liters * rate;
      const body: Record<string, any> = {
        log_date: fuelForm.log_date,
        fuel_type: fuelForm.fuel_type,
        liters,
        rate_per_liter: rate,
        total_cost: total,
      };
      if (fuelForm.odometer_km) body.odometer_km = parseFloat(fuelForm.odometer_km);
      const r = await fetch(teaUrl(`/vehicles/${fuelVehicleId}/fuel`), {
        method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.success) {
        setShowFuelForm(false);
        setFuelForm({ log_date: new Date().toISOString().slice(0, 10), fuel_type: "diesel", liters: "", rate_per_liter: "", total_cost: "", odometer_km: "" });
        loadFuelLogs(fuelVehicleId);
      } else alert(d.error || "Failed to save fuel log");
    } catch { alert("Error saving fuel log"); }
    setFuelSaving(false);
  };

  const deleteFuelLog = async (vehicleId: string, logId: string) => {
    if (!confirm("Delete this fuel log?")) return;
    try {
      await fetch(teaUrl(`/vehicles/${vehicleId}/fuel/${logId}`), { method: "DELETE", headers: teaAuthHeaders() });
      loadFuelLogs(vehicleId);
    } catch {}
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center">
            <Settings size={18} className="text-white/60" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Settings</h1>
            <p className="text-white/40 text-xs">Rates, factories, and vehicles</p>
          </div>
        </div>
        <button onClick={() => { setEditFactory(null); setEditVehicle(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-[#6c63ff]/80 hover:bg-[#6c63ff] text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={15} /> Add New
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#161a23] border border-white/8 rounded-xl p-1 w-fit">
        {([["rates", "📊 Rates"], ["factories", "🏭 Factories"], ["vehicles", "🚛 Vehicles"]] as [SettingsTab, string][]).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs transition-all ${tab === t ? "bg-[#6c63ff]/20 text-[#6c63ff]" : "text-white/40 hover:text-white"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Rates */}
      {tab === "rates" && (
        <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-4 py-3 text-left text-white/40 text-xs">Week (Mon)</th>
                <th className="px-4 py-3 text-left text-white/40 text-xs">Mode</th>
                <th className="px-4 py-3 text-left text-white/40 text-xs">Grade A</th>
                <th className="px-4 py-3 text-left text-white/40 text-xs hidden sm:table-cell">Grade B</th>
                <th className="px-4 py-3 text-left text-white/40 text-xs hidden sm:table-cell">Grade C</th>
              </tr>
            </thead>
            <tbody>
              {rates.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-white/30 text-sm">No rates set yet.</td></tr>
              ) : rates.map((r, i) => (
                <tr key={r.id} className={`border-b border-white/5 ${i === 0 ? "bg-green-500/5" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="text-white text-sm">
                      {r.week_start_date
                        ? new Date(r.week_start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })
                        : `Wk ${r.week_number}/${r.week_year}`}
                    </p>
                    {i === 0 && <span className="text-xs text-green-400">Current</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.payment_mode === 'advance' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-green-500/15 text-green-400'
                    }`}>
                      {r.payment_mode === 'advance' ? 'Advance' : 'Full'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-green-400 font-semibold text-sm">₹{r.grade_a_rate}</p>
                    {r.payment_mode === 'advance' && r.advance_rate_a && (
                      <p className="text-yellow-400 text-xs">adv ₹{r.advance_rate_a}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-blue-400 font-semibold text-sm">₹{r.grade_b_rate}</p>
                    {r.payment_mode === 'advance' && r.advance_rate_b && (
                      <p className="text-yellow-400 text-xs">adv ₹{r.advance_rate_b}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-yellow-400 font-semibold text-sm">₹{r.grade_c_rate}</p>
                    {r.payment_mode === 'advance' && r.advance_rate_c && (
                      <p className="text-yellow-400 text-xs">adv ₹{r.advance_rate_c}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Factories */}
      {tab === "factories" && (
        <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-4 py-3 text-left text-white/40 text-xs">Factory Name</th>
                <th className="px-4 py-3 text-left text-white/40 text-xs hidden sm:table-cell">Location</th>
                <th className="px-4 py-3 text-left text-white/40 text-xs hidden md:table-cell">Contact</th>
                <th className="px-4 py-3 text-left text-white/40 text-xs">Status</th>
                <th className="px-4 py-3 text-right text-white/40 text-xs">Edit</th>
              </tr>
            </thead>
            <tbody>
              {factories.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-white/30 text-sm">No factories added.</td></tr>
              ) : factories.map(f => (
                <tr key={f.id} className="border-b border-white/5 hover:bg-white/3">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <Factory size={12} className="text-purple-400" />
                      </div>
                      <span className="text-white text-sm font-medium">{f.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-white/50 text-sm">{f.location || "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-white/50 text-sm">{f.contact_name || "—"}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${f.is_active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>{f.is_active ? "Active" : "Inactive"}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openFactoryEdit(f)} className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center ml-auto hover:bg-white/10">
                      <Edit size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vehicles */}
      {tab === "vehicles" && (
        <div className="space-y-2">
          {vehicles.length === 0 ? (
            <div className="bg-[#161a23] border border-white/8 rounded-xl p-8 text-center text-white/30 text-sm">No vehicles added.</div>
          ) : vehicles.map(v => (
            <div key={v.id} className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
              {/* Vehicle row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 bg-yellow-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <Truck size={14} className="text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-mono font-semibold text-sm">{v.vehicle_number}</p>
                  <p className="text-white/40 text-xs">{v.driver_name || "No driver"}{v.driver_phone ? ` · ${v.driver_phone}` : ""}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full hidden sm:inline-flex ${v.is_active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                  {v.is_active ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => { setFuelVehicleId(v.id); setShowFuelForm(true); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-500/10 text-orange-400 rounded-lg text-xs hover:bg-orange-500/20">
                  <Fuel size={11} /> Log Fuel
                </button>
                <button onClick={() => openVehicleEdit(v)} className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10">
                  <Edit size={12} />
                </button>
                <button onClick={() => toggleFuelExpand(v.id)} className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10">
                  {expandedVehicle === v.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>

              {/* Fuel logs expand */}
              {expandedVehicle === v.id && (
                <div className="border-t border-white/8">
                  <div className="px-4 py-2 flex items-center justify-between">
                    <span className="text-white/40 text-xs font-medium">Fuel Logs</span>
                    {fuelLogs.length > 0 && (
                      <span className="text-orange-400 text-xs">
                        Total: ₹{fuelLogs.reduce((s, l) => s + Number(l.total_cost), 0).toFixed(0)}
                        {" · "}{fuelLogs.reduce((s, l) => s + Number(l.liters), 0).toFixed(1)}L
                      </span>
                    )}
                  </div>
                  {fuelLogs.length === 0 ? (
                    <p className="px-4 pb-4 text-white/30 text-xs">No fuel logs yet. Click "Log Fuel" to add.</p>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="px-4 py-2 text-left text-white/30 text-xs">Date</th>
                          <th className="px-4 py-2 text-left text-white/30 text-xs">Type</th>
                          <th className="px-4 py-2 text-left text-white/30 text-xs">Litres</th>
                          <th className="px-4 py-2 text-left text-white/30 text-xs hidden sm:table-cell">Rate</th>
                          <th className="px-4 py-2 text-left text-white/30 text-xs">Cost</th>
                          <th className="px-4 py-2 text-left text-white/30 text-xs hidden md:table-cell">Odometer</th>
                          <th className="px-4 py-2 text-right text-white/30 text-xs"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {fuelLogs.map(log => (
                          <tr key={log.id} className="border-b border-white/5 hover:bg-white/3">
                            <td className="px-4 py-2 text-white/60 text-xs">
                              {new Date(log.log_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </td>
                            <td className="px-4 py-2">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${log.fuel_type === "diesel" ? "bg-yellow-500/15 text-yellow-400" : "bg-blue-500/15 text-blue-400"}`}>
                                {log.fuel_type}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-white/70 text-xs">{Number(log.liters).toFixed(1)}L</td>
                            <td className="px-4 py-2 text-white/50 text-xs hidden sm:table-cell">₹{Number(log.rate_per_liter).toFixed(2)}/L</td>
                            <td className="px-4 py-2 text-orange-400 text-xs font-semibold">₹{Number(log.total_cost).toFixed(0)}</td>
                            <td className="px-4 py-2 text-white/40 text-xs hidden md:table-cell">
                              {log.odometer_km ? `${log.odometer_km} km` : "—"}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button onClick={() => deleteFuelLog(v.id, log.id)} className="text-white/20 hover:text-red-400">
                                <Trash2 size={11} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#161a23] border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white">
                {tab === "rates" ? "Set Weekly Rate" : tab === "factories" ? (editFactory ? "Edit Factory" : "Add Factory") : (editVehicle ? "Edit Vehicle" : "Add Vehicle")}
              </h2>
              <button onClick={() => { setShowForm(false); setEditFactory(null); setEditVehicle(null); }} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>

            {tab === "rates" && (
              <div className="space-y-3">
                <div>
                  <label className="text-white/50 text-xs block mb-1">Week Starting (any day in the week)</label>
                  <input type="date" value={rateForm.effective_date} onChange={e => setRateForm(p => ({ ...p, effective_date: e.target.value }))}
                    className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                </div>

                <div>
                  <label className="text-white/50 text-xs block mb-1">Payment Mode</label>
                  <div className="flex gap-2">
                    {["full", "advance"].map(mode => (
                      <button key={mode} type="button"
                        onClick={() => setRateForm(p => ({ ...p, payment_mode: mode }))}
                        className={`flex-1 py-2 rounded-xl text-sm border transition-all ${
                          rateForm.payment_mode === mode
                            ? mode === "advance"
                              ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                              : "border-green-500/50 bg-green-500/10 text-green-400"
                            : "border-white/10 text-white/40 hover:text-white"
                        }`}>
                        {mode === "full" ? "Full Rate" : "Advance"}
                      </button>
                    ))}
                  </div>
                  {rateForm.payment_mode === "advance" && (
                    <p className="text-yellow-400/70 text-xs mt-1.5">
                      Advance: growers are paid the advance rate now; balance (full − advance) carries forward.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[["grade_a_rate", "Grade A (₹/kg)"], ["grade_b_rate", "Grade B (₹/kg)"], ["grade_c_rate", "Grade C (₹/kg)"]].map(([k, l]) => (
                    <div key={k}>
                      <label className="text-white/50 text-xs block mb-1">{l}</label>
                      <input type="number" value={(rateForm as any)[k]} onChange={e => setRateForm(p => ({ ...p, [k]: e.target.value }))} step="0.01"
                        className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                    </div>
                  ))}
                </div>

                {rateForm.payment_mode === "advance" && (
                  <>
                    <p className="text-white/30 text-xs pt-1">Advance rates paid now (leave blank to use full rate):</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[["advance_rate_a", "Adv A"], ["advance_rate_b", "Adv B"], ["advance_rate_c", "Adv C"]].map(([k, l]) => (
                        <div key={k}>
                          <label className="text-white/50 text-xs block mb-1">{l} (₹/kg)</label>
                          <input type="number" value={(rateForm as any)[k]} onChange={e => setRateForm(p => ({ ...p, [k]: e.target.value }))} step="0.01"
                            placeholder={(rateForm as any)[k.replace('advance_rate_', 'grade_') + '_rate'] || ""}
                            className="w-full bg-[#0d0f14] border border-yellow-500/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowForm(false)} className="flex-1 border border-white/10 rounded-xl py-2.5 text-sm text-white/50">Cancel</button>
                  <button onClick={saveRate} disabled={saving || !rateForm.grade_a_rate} className="flex-1 bg-[#6c63ff]/80 hover:bg-[#6c63ff] disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium text-white">
                    {saving ? "Saving..." : "Set Rate"}
                  </button>
                </div>
              </div>
            )}

            {tab === "factories" && (
              <div className="space-y-3">
                {[["name", "Factory Name *"], ["location", "Location"], ["contact_name", "Contact Person"], ["contact_phone", "Contact Phone"]].map(([k, l]) => (
                  <div key={k}>
                    <label className="text-white/50 text-xs block mb-1">{l}</label>
                    <input type="text" value={(factoryForm as any)[k]} onChange={e => setFactoryForm(p => ({ ...p, [k]: e.target.value }))}
                      className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                  </div>
                ))}
                <div className="flex gap-3 mt-5">
                  <button onClick={() => { setShowForm(false); setEditFactory(null); }} className="flex-1 border border-white/10 rounded-xl py-2.5 text-sm text-white/50">Cancel</button>
                  <button onClick={saveFactory} disabled={saving || !factoryForm.name} className="flex-1 bg-[#6c63ff]/80 hover:bg-[#6c63ff] disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium text-white">
                    {saving ? "Saving..." : editFactory ? "Update" : "Add Factory"}
                  </button>
                </div>
              </div>
            )}

            {tab === "vehicles" && (
              <div className="space-y-3">
                {[["vehicle_number", "Vehicle / Reg Number *"], ["driver_name", "Driver Name"], ["driver_phone", "Driver Phone"]].map(([k, l]) => (
                  <div key={k}>
                    <label className="text-white/50 text-xs block mb-1">{l}</label>
                    <input type="text" value={(vehicleForm as any)[k]} onChange={e => setVehicleForm(p => ({ ...p, [k]: e.target.value }))}
                      className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                  </div>
                ))}
                <div className="flex gap-3 mt-5">
                  <button onClick={() => { setShowForm(false); setEditVehicle(null); }} className="flex-1 border border-white/10 rounded-xl py-2.5 text-sm text-white/50">Cancel</button>
                  <button onClick={saveVehicle} disabled={saving || !vehicleForm.vehicle_number} className="flex-1 bg-[#6c63ff]/80 hover:bg-[#6c63ff] disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium text-white">
                    {saving ? "Saving..." : editVehicle ? "Update" : "Add Vehicle"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fuel Log Modal */}
      {showFuelForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#161a23] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Fuel size={16} className="text-orange-400" />
                <h2 className="font-bold text-white">Log Fuel Fill-up</h2>
              </div>
              <button onClick={() => setShowFuelForm(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-white/50 text-xs block mb-1">Date</label>
                <input type="date" value={fuelForm.log_date}
                  onChange={e => setFuelForm(p => ({ ...p, log_date: e.target.value }))}
                  className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
              </div>

              <div>
                <label className="text-white/50 text-xs block mb-1">Fuel Type</label>
                <div className="flex gap-2">
                  {["diesel", "petrol"].map(ft => (
                    <button key={ft} type="button"
                      onClick={() => setFuelForm(p => ({ ...p, fuel_type: ft }))}
                      className={`flex-1 py-2 rounded-xl text-sm border transition-all capitalize ${
                        fuelForm.fuel_type === ft
                          ? ft === "diesel"
                            ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                            : "border-blue-500/50 bg-blue-500/10 text-blue-400"
                          : "border-white/10 text-white/40 hover:text-white"
                      }`}>
                      {ft}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-white/50 text-xs block mb-1">Litres *</label>
                  <input type="number" step="0.1" placeholder="e.g. 40" value={fuelForm.liters}
                    onChange={e => {
                      const l = e.target.value;
                      const t = l && fuelForm.rate_per_liter ? (parseFloat(l) * parseFloat(fuelForm.rate_per_liter)).toFixed(2) : fuelForm.total_cost;
                      setFuelForm(p => ({ ...p, liters: l, total_cost: t }));
                    }}
                    className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
                <div>
                  <label className="text-white/50 text-xs block mb-1">Rate (₹/L) *</label>
                  <input type="number" step="0.01" placeholder="e.g. 95.50" value={fuelForm.rate_per_liter}
                    onChange={e => {
                      const r = e.target.value;
                      const t = r && fuelForm.liters ? (parseFloat(r) * parseFloat(fuelForm.liters)).toFixed(2) : fuelForm.total_cost;
                      setFuelForm(p => ({ ...p, rate_per_liter: r, total_cost: t }));
                    }}
                    className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-white/50 text-xs block mb-1">Total Cost (₹)</label>
                  <input type="number" step="0.01" value={fuelForm.total_cost}
                    onChange={e => setFuelForm(p => ({ ...p, total_cost: e.target.value }))}
                    className="w-full bg-[#0d0f14] border border-orange-500/20 rounded-xl px-3 py-2 text-sm text-orange-300 focus:outline-none" />
                </div>
                <div>
                  <label className="text-white/50 text-xs block mb-1">Odometer (km)</label>
                  <input type="number" placeholder="optional" value={fuelForm.odometer_km}
                    onChange={e => setFuelForm(p => ({ ...p, odometer_km: e.target.value }))}
                    className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowFuelForm(false)} className="flex-1 border border-white/10 rounded-xl py-2.5 text-sm text-white/50">Cancel</button>
              <button onClick={saveFuelLog} disabled={fuelSaving || !fuelForm.liters || !fuelForm.rate_per_liter}
                className="flex-1 bg-orange-600/80 hover:bg-orange-600 disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium text-white">
                {fuelSaving ? "Saving..." : "Save Log"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
