"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FlaskConical, CheckCircle2, ChevronRight, ChevronLeft,
  Zap, Flame, HardHat, BarChart2, ClipboardCheck, Save,
  AlertCircle, RefreshCw, Plus, X, Search, Users,
} from "lucide-react";
import { tfFetch, fmtINR, fmtKg, fmtPct, diffHrsMins } from "@/lib/tf-api";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface OutturnMaster { grade: string; target_pct: number; }
interface Worker { id: string; name: string; role: string; wage_per_day: number; }
interface StaffMember { id: string; name: string; role: string; }
interface IntakeLot { id: string; lot_no: string; net_after_moisture_kg: number; grower_name: string; status: string; }

const GRADES = [
  { code: "BOP",   label: "BOP",   color: "bg-emerald-100 border-emerald-300 text-emerald-900" },
  { code: "BP",    label: "BP",    color: "bg-blue-100 border-blue-300 text-blue-900" },
  { code: "DUST",  label: "DUST",  color: "bg-amber-100 border-amber-300 text-amber-900" },
  { code: "CTC",   label: "CTC",   color: "bg-violet-100 border-violet-300 text-violet-900" },
  { code: "RC",    label: "RC",    color: "bg-orange-100 border-orange-300 text-orange-900" },
  { code: "WASTE", label: "Waste", color: "bg-gray-100 border-gray-300 text-gray-700" },
];

const SHIFT_PATTERNS = [
  { code: "S1", label: "Shift I — 08:00 AM to 04:00 PM",  start: "08:00", end: "16:00" },
  { code: "S2", label: "Shift II — 04:00 PM to 12:00 AM", start: "16:00", end: "00:00" },
  { code: "S3", label: "Full Day — 08:00 AM to 08:00 PM", start: "08:00", end: "20:00" },
  { code: "NS", label: "Night — 10:00 PM to 06:00 AM",   start: "22:00", end: "06:00" },
];

const STEPS = [
  { id: 1, label: "Batch details",  icon: FlaskConical },
  { id: 2, label: "Fuel & energy",  icon: Zap },
  { id: 3, label: "Workers & shift",icon: HardHat },
  { id: 4, label: "Grading",        icon: BarChart2 },
  { id: 5, label: "Register",       icon: ClipboardCheck },
];

const inp = "w-full h-11 border border-gray-300 rounded-lg px-3 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none bg-white transition-colors";
const numInp = inp + " text-right tabular-nums";

export default function BatchProductionPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [step, setStep]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [msg, setMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  /* ── Master data ── */
  const [outturnMaster, setOutturnMaster] = useState<OutturnMaster[]>([]);
  const [staffList, setStaffList]         = useState<StaffMember[]>([]);
  const [workerList, setWorkerList]       = useState<Worker[]>([]);
  const [intakeLots, setIntakeLots]       = useState<IntakeLot[]>([]);

  /* ── Step 1: Batch Details ── */
  const [batchDate,   setBatchDate]   = useState(today);
  const [batchNo,     setBatchNo]     = useState(() => `BATCH/${today.replace(/-/g,"")}/001`);
  const [selectedLots,setSelectedLots]= useState<string[]>([]);
  const [glKg,        setGlKg]        = useState("");
  const [outturnTarget, setOutturnTarget] = useState("25");

  /* ── Step 2: Fuel & Energy ── */
  const [ebStart,     setEbStart]     = useState("");
  const [ebEnd,       setEbEnd]       = useState("");
  const [ebRate,      setEbRate]      = useState("8.50");
  const [firewoodKg,  setFirewoodKg]  = useState("");
  const [charcoalKg,  setCharcoalKg]  = useState("");
  const [briquettesKg,setBriquettesKg]= useState("");
  const [dieselLtr,   setDieselLtr]   = useState("");

  /* ── Step 3: Workers ── */
  const [shiftPattern, setShiftPattern] = useState("S1");
  const [shiftInchargeId, setShiftInchargeId] = useState("");
  const [inchargeSearch,  setInchargeSearch]  = useState("");
  const [workerSearch,    setWorkerSearch]     = useState("");
  const [selectedWorkers, setSelectedWorkers] = useState<{ id: string; ot_hours: string }[]>([]);

  /* ── Step 4: Grading ── */
  const [gradeKgs, setGradeKgs] = useState<Record<string, string>>({
    BOP: "", BP: "", DUST: "", CTC: "", RC: "", WASTE: "",
  });

  /* ── Derived ── */
  const ebUnits    = ebStart && ebEnd ? Math.max(0, parseFloat(ebEnd) - parseFloat(ebStart)) : 0;
  const ebCost     = ebUnits * (parseFloat(ebRate) || 0);
  const totalMadeTea = Object.values(gradeKgs).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const glTotal    = parseFloat(glKg) || 0;
  const outturnPct = glTotal > 0 && totalMadeTea > 0 ? (totalMadeTea / glTotal) * 100 : null;
  const selectedShift = SHIFT_PATTERNS.find(s => s.code === shiftPattern);
  const shiftHours = selectedShift ? diffHrsMins(selectedShift.start, selectedShift.end) : "—";
  const selectedIncharge = staffList.find(s => s.id === shiftInchargeId);
  const totalWorkers = selectedWorkers.length;
  const totalOTHours = selectedWorkers.reduce((s, w) => s + (parseFloat(w.ot_hours) || 0), 0);
  const totalLaborCost = selectedWorkers.reduce((s, w) => {
    const worker = workerList.find(x => x.id === w.id);
    return s + (worker?.wage_per_day ?? 0);
  }, 0);

  /* ── Load master data ── */
  const load = useCallback(async () => {
    const [om, sl, wl, il] = await Promise.all([
      tfFetch<OutturnMaster[]>("/master/outturn"),
      tfFetch<StaffMember[]>("/staff"),
      tfFetch<Worker[]>("/workers?active=true"),
      tfFetch<IntakeLot[]>("/intake?status=pending&limit=50"),
    ]);
    if (om.success) setOutturnMaster(om.data ?? []);
    if (sl.success) setStaffList(sl.data ?? []);
    if (wl.success) setWorkerList(wl.data ?? []);
    if (il.success) setIntakeLots(il.data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Auto-fill GL from selected lots ── */
  useEffect(() => {
    if (selectedLots.length > 0) {
      const total = intakeLots.filter(l => selectedLots.includes(l.id))
        .reduce((s, l) => s + l.net_after_moisture_kg, 0);
      setGlKg(total.toFixed(2));
    }
  }, [selectedLots, intakeLots]);

  /* ── Toggle worker ── */
  const toggleWorker = (id: string) => {
    setSelectedWorkers(prev =>
      prev.find(w => w.id === id)
        ? prev.filter(w => w.id !== id)
        : [...prev, { id, ot_hours: "0" }]
    );
  };
  const setWorkerOT = (id: string, val: string) => {
    setSelectedWorkers(prev => prev.map(w => w.id === id ? { ...w, ot_hours: val } : w));
  };

  /* ── Save batch ── */
  const saveBatch = async () => {
    setSaving(true); setMsg(null);
    const r = await tfFetch("/batches", {
      method: "POST",
      body: JSON.stringify({
        batch_date: batchDate, batch_no: batchNo,
        intake_lot_ids: selectedLots,
        green_leaf_kg: parseFloat(glKg) || 0,
        outturn_target_pct: parseFloat(outturnTarget) || 25,
        shift_pattern: shiftPattern,
        shift_incharge_id: shiftInchargeId || null,
        eb_meter_start: parseFloat(ebStart) || null,
        eb_meter_end: parseFloat(ebEnd) || null,
        eb_units: ebUnits || null,
        eb_unit_rate: parseFloat(ebRate) || null,
        eb_cost: ebCost || null,
        firewood_kg: parseFloat(firewoodKg) || null,
        charcoal_kg: parseFloat(charcoalKg) || null,
        briquettes_kg: parseFloat(briquettesKg) || null,
        diesel_ltr: parseFloat(dieselLtr) || null,
        total_made_tea_kg: totalMadeTea,
        outturn_pct: outturnPct,
        workers: selectedWorkers.map(w => ({
          worker_id: w.id, ot_hours: parseFloat(w.ot_hours) || 0,
          wage: workerList.find(x => x.id === w.id)?.wage_per_day ?? 0,
        })),
        grades: GRADES.map(g => ({
          grade: g.code, qty_kg: parseFloat(gradeKgs[g.code]) || 0,
        })).filter(g => g.qty_kg > 0),
      }),
    });
    setSaving(false);
    if (r.success) { setSaved(true); setMsg({ ok: true, text: `Batch ${batchNo} registered successfully.` }); }
    else setMsg({ ok: false, text: r.error ?? "Save failed." });
  };

  const canGoNext: Record<number, boolean> = {
    1: !!glKg && parseFloat(glKg) > 0,
    2: true, // fuel optional
    3: !!shiftInchargeId,
    4: totalMadeTea > 0,
    5: true,
  };

  /* ─── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-violet-50 border border-violet-100 rounded-xl flex items-center justify-center">
          <FlaskConical size={18} className="text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Production Batch Register</h1>
          <p className="text-gray-500 text-xs">Batch details · Fuel · Workers · Grading · Submit</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-6 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex items-center shrink-0">
              <button onClick={() => { if (done || (active)) {} else if (s.id < step || canGoNext[step]) setStep(s.id); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${active ? "bg-violet-600 text-white shadow-sm" : done ? "bg-emerald-50 text-emerald-700" : "text-gray-400"}`}>
                {done ? <CheckCircle2 size={13} /> : <Icon size={13} />}
                {s.id}. {s.label}
              </button>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="mx-1 text-gray-300 shrink-0" />}
            </div>
          );
        })}
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border mb-4 ${msg.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {msg.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}{msg.text}
        </div>
      )}

      {/* ── STEP 1: BATCH DETAILS ── */}
      {step === 1 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Batch Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
              <input type="date" value={batchDate} onChange={e => setBatchDate(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Batch No.</label>
              <input value={batchNo} onChange={e => setBatchNo(e.target.value)} className={inp + " font-mono text-xs"} />
            </div>
          </div>

          {/* Link pending intake lots */}
          {intakeLots.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Link Green Leaf Lots (auto-fill GL kg)</label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {intakeLots.map(lot => (
                  <label key={lot.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-all ${selectedLots.includes(lot.id) ? "bg-emerald-50 border-emerald-300" : "bg-gray-50 border-gray-200 hover:border-gray-300"}`}>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedLots.includes(lot.id)} onChange={() => setSelectedLots(p => p.includes(lot.id) ? p.filter(x => x !== lot.id) : [...p, lot.id])} className="accent-emerald-600" />
                      <span className="text-xs font-mono text-gray-600">{lot.lot_no}</span>
                      <span className="text-xs text-gray-700">{lot.grower_name}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700">{lot.net_after_moisture_kg.toFixed(1)} kg</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Green Leaf (kg) <span className="text-red-500">*</span></label>
              <input type="number" value={glKg} onChange={e => setGlKg(e.target.value)} placeholder="e.g. 6730" step="0.1" className={numInp} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Outturn Target (%)</label>
              <div className="flex gap-2">
                {["23", "24", "25", "26"].map(pct => (
                  <button key={pct} onClick={() => setOutturnTarget(pct)}
                    className={`flex-1 h-11 rounded-lg border text-sm font-bold transition-all ${outturnTarget === pct ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-600 border-gray-300"}`}>
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: FUEL & ENERGY ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              <Zap size={11} className="inline mr-1" />Electricity (EB Meter)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Meter Start</label><input type="number" value={ebStart} onChange={e => setEbStart(e.target.value)} placeholder="0" className={numInp} /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Meter End</label><input type="number" value={ebEnd} onChange={e => setEbEnd(e.target.value)} placeholder="0" className={numInp} /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Rate (₹/unit)</label><input type="number" value={ebRate} onChange={e => setEbRate(e.target.value)} step="0.01" className={numInp} /></div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Units / Cost</label>
                <div className="h-11 bg-amber-50 border border-amber-200 rounded-lg px-3 flex flex-col justify-center">
                  <span className="text-xs font-bold text-amber-800">{ebUnits.toFixed(1)} units</span>
                  <span className="text-[10px] text-amber-600">{fmtINR(ebCost)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              <Flame size={11} className="inline mr-1" />Solid Fuels
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Firewood (kg)",   val: firewoodKg,   set: setFirewoodKg },
                { label: "Charcoal (kg)",   val: charcoalKg,   set: setCharcoalKg },
                { label: "Briquettes (kg)", val: briquettesKg, set: setBriquettesKg },
                { label: "Diesel (L)",      val: dieselLtr,    set: setDieselLtr },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
                  <input type="number" value={f.val} onChange={e => f.set(e.target.value)} placeholder="0" step="0.5" className={numInp} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: WORKERS & SHIFT ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Shift pattern</p>
            <select value={shiftPattern} onChange={e => setShiftPattern(e.target.value)} className={inp + " mb-4"}>
              {SHIFT_PATTERNS.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
            </select>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Shift incharge</p>
            {selectedIncharge ? (
              <div className="h-11 border border-emerald-300 bg-emerald-50 rounded-lg px-3 flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-emerald-800">{selectedIncharge.name} <span className="text-xs text-emerald-600 font-normal">— {selectedIncharge.role}</span></span>
                <button onClick={() => { setShiftInchargeId(""); setInchargeSearch(""); }} className="text-emerald-400 hover:text-red-400"><X size={14} /></button>
              </div>
            ) : (
              <div className="relative mb-4">
                <Search size={13} className="absolute left-3 top-3.5 text-gray-400" />
                <input value={inchargeSearch} onChange={e => setInchargeSearch(e.target.value)} placeholder="Search shift incharge…" className={inp + " pl-8"} />
                {inchargeSearch && staffList.filter(s => s.name.toLowerCase().includes(inchargeSearch.toLowerCase())).slice(0, 4).map(s => (
                  <button key={s.id} onClick={() => { setShiftInchargeId(s.id); setInchargeSearch(""); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-white hover:bg-gray-50 border-x border-b border-gray-200 text-sm">
                    <span className="font-medium text-gray-900">{s.name}</span>
                    <span className="text-xs text-gray-400">{s.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Assign workers — from master list</p>
            <div className="relative mb-3">
              <Search size={13} className="absolute left-3 top-3.5 text-gray-400" />
              <input value={workerSearch} onChange={e => setWorkerSearch(e.target.value)} placeholder="Search workers by name or role" className={inp + " pl-8"} />
            </div>

            {/* Worker list */}
            <div className="space-y-1 max-h-52 overflow-y-auto">
              {workerList
                .filter(w => !workerSearch || w.name.toLowerCase().includes(workerSearch.toLowerCase()) || w.role.toLowerCase().includes(workerSearch.toLowerCase()))
                .slice(0, 20)
                .map(worker => {
                  const sel = selectedWorkers.find(w => w.id === worker.id);
                  return (
                    <div key={worker.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${sel ? "bg-emerald-50 border-emerald-200" : "border-transparent hover:bg-gray-50"}`}>
                      <button onClick={() => toggleWorker(worker.id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${sel ? "bg-emerald-600 border-emerald-600" : "border-gray-300"}`}>
                        {sel && <CheckCircle2 size={11} className="text-white" />}
                      </button>
                      <span className="flex-1 text-sm font-medium text-gray-900">{worker.name}</span>
                      <span className="text-xs text-gray-500 w-24">{worker.role}</span>
                      <span className="text-xs text-gray-600 w-20 text-right">₹{worker.wage_per_day}/day</span>
                      {sel && (
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] text-gray-500">OT hrs</label>
                          <input type="number" value={sel.ot_hours} onChange={e => setWorkerOT(worker.id, e.target.value)}
                            className="w-14 h-7 border border-gray-300 rounded text-xs text-right px-1 focus:border-emerald-500 focus:outline-none" step="0.5" min="0" />
                          <span className="text-[10px] text-gray-400">— auto</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              {workerList.length > 20 && !workerSearch && (
                <button className="w-full text-xs text-gray-500 py-2 hover:text-gray-700">
                  + Add general workers ({workerList.length - 20} more)
                </button>
              )}
            </div>

            {/* Worker totals */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
              {[
                { label: "Total workers", val: totalWorkers.toString() },
                { label: "Total OT hours", val: totalOTHours > 0 ? totalOTHours.toString() : "— auto" },
                { label: "Total labor cost", val: totalLaborCost > 0 ? fmtINR(totalLaborCost) : "— auto" },
              ].map(c => (
                <div key={c.label}>
                  <p className="text-[10px] text-gray-500 mb-0.5">{c.label}</p>
                  <p className="text-lg font-bold text-gray-900">{c.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4: GRADING ── */}
      {step === 4 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Grade-wise Made Tea (kg)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {GRADES.map(g => (
              <div key={g.code} className={`rounded-xl border p-3.5 ${g.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">{g.label}</span>
                  {outturnMaster.find(o => o.grade === g.code) && (
                    <span className="text-[10px] opacity-60">target: {outturnMaster.find(o => o.grade === g.code)?.target_pct}%</span>
                  )}
                </div>
                <input type="number" value={gradeKgs[g.code]} onChange={e => setGradeKgs(p => ({ ...p, [g.code]: e.target.value }))}
                  placeholder="0.00 kg" step="0.01"
                  className="w-full h-10 rounded-lg border border-current/20 bg-white/60 px-2 text-right text-sm font-bold focus:outline-none focus:ring-1 focus:ring-current/30 tabular-nums" />
              </div>
            ))}
          </div>

          {totalMadeTea > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-emerald-600 font-medium">Total Made Tea</p>
                <p className="text-2xl font-black text-emerald-900">{totalMadeTea.toFixed(1)} <span className="text-sm font-normal">kg</span></p>
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Green Leaf Used</p>
                <p className="text-2xl font-black text-blue-900">{glTotal.toFixed(1)} <span className="text-sm font-normal">kg</span></p>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: outturnPct && outturnPct >= parseFloat(outturnTarget) ? "#15803d" : "#dc2626" }}>
                  Outturn %
                </p>
                <p className="text-2xl font-black" style={{ color: outturnPct && outturnPct >= parseFloat(outturnTarget) ? "#15803d" : "#dc2626" }}>
                  {outturnPct ? `${outturnPct.toFixed(2)}%` : "—"}
                </p>
                <p className="text-[10px] text-gray-500">target {outturnTarget}%</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 5: REGISTER / REVIEW ── */}
      {step === 5 && (
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Review & Register</p>
            <div className="space-y-2 text-sm">
              {[
                ["Batch No.", batchNo],
                ["Date", batchDate],
                ["Green Leaf (kg)", `${glTotal.toFixed(2)} kg`],
                ["Shift", SHIFT_PATTERNS.find(s => s.code === shiftPattern)?.label ?? "—"],
                ["Shift Incharge", staffList.find(s => s.id === shiftInchargeId)?.name ?? "—"],
                ["EB Units", ebUnits > 0 ? `${ebUnits.toFixed(1)} units — ${fmtINR(ebCost)}` : "—"],
                ["Firewood", firewoodKg ? `${firewoodKg} kg` : "—"],
                ["Workers", `${totalWorkers} workers · ${totalOTHours} OT hrs`],
                ["Total Made Tea", `${totalMadeTea.toFixed(2)} kg`],
                ["Outturn %", outturnPct ? `${outturnPct.toFixed(2)}% (target ${outturnTarget}%)` : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">{k}</span>
                  <span className={`font-semibold text-gray-900 ${k === "Outturn %" && outturnPct !== null && outturnPct < parseFloat(outturnTarget) ? "text-red-600" : ""}`}>{v}</span>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Grade Breakdown</p>
              <div className="flex flex-wrap gap-2">
                {GRADES.filter(g => parseFloat(gradeKgs[g.code]) > 0).map(g => (
                  <span key={g.code} className={`px-3 py-1 rounded-full text-xs font-bold border ${g.color}`}>
                    {g.label}: {parseFloat(gradeKgs[g.code]).toFixed(2)} kg
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button onClick={saveBatch} disabled={saving || saved || totalMadeTea === 0}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white py-4 rounded-xl text-base font-bold shadow-md transition-colors min-h-[56px]">
            {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
            {saving ? "Registering batch…" : saved ? "Batch Registered ✓" : "Save workers & shift, continue"}
          </button>
        </div>
      )}

      {/* ── Navigation ── */}
      <div className="flex justify-between mt-5 pt-4">
        <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
          className="flex items-center gap-1.5 px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 min-h-[44px]">
          <ChevronLeft size={15} /> Back
        </button>
        {step < 5 && (
          <button onClick={() => setStep(s => Math.min(5, s + 1))} disabled={!canGoNext[step]}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold min-h-[44px]">
            Continue <ChevronRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
