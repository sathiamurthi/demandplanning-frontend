"use client";

import { useState, useEffect, useRef } from "react";
import {
  ClipboardCheck, Plus, Printer, ChevronDown, ChevronUp,
  CheckCircle2, Clock, Leaf, Zap, Users, AlertCircle,
  Save, RefreshCw, Eye, BarChart2,
} from "lucide-react";
import { tfFetch, tfUrl, tfAuthHeaders, fmtDate, fmtDateShort, fmtTime, diffHrsMins, fmtKg, fmtPct } from "@/lib/tf-api";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface DensityReading { time: string; qty: string; }
interface GradeOutput { grade: string; qty_kg: string; }

const DENSITY_EMPTY = (): DensityReading[] => [
  { time: "", qty: "" }, { time: "", qty: "" }, { time: "", qty: "" },
];
const GRADES: { code: string; label: string; color: string }[] = [
  { code: "BOP",   label: "BOP",   color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { code: "BP",    label: "BP",    color: "bg-blue-50 text-blue-800 border-blue-200" },
  { code: "DUST",  label: "DUST",  color: "bg-amber-50 text-amber-800 border-amber-200" },
  { code: "CTC",   label: "CTC",   color: "bg-violet-50 text-violet-800 border-violet-200" },
  { code: "RC",    label: "RC",    color: "bg-orange-50 text-orange-800 border-orange-200" },
  { code: "WASTE", label: "Waste", color: "bg-gray-50 text-gray-600 border-gray-200" },
];

interface ShiftLog {
  id: string;
  shift_date: string;
  shift_number: number;
  green_leaf_opening_kg: number | null;
  heater_start_time: string | null;
  cutting_start_time: string | null;
  dryer_feed_start_time: string | null;
  cutting_stop_time: string | null;
  dryer_stop_time: string | null;
  cutting_hours: string | null;
  dryer_running_hours: string | null;
  manufactured_leaf_kg: number | null;
  dmb_qty: number | null;
  dmb_output_per_hr: number | null;
  graded_qty_kg: number | null;
  grade_pct: number | null;
  rejection_kg: number | null;
  wastage_kg: number | null;
  total_made_tea_kg: number | null;
  outturn_pct: number | null;
  eb_meter_start: number | null;
  eb_meter_end: number | null;
  eb_units: number | null;
  firewood_kg: number | null;
  total_workers: number | null;
  total_ot_hours: number | null;
  shift_incharge: string | null;
  mechanic_name: string | null;
  electrician_name: string | null;
  supervisor_name: string | null;
  remarks: string | null;
  manager_approved: boolean;
  grades?: { grade: string; qty_kg: number }[];
  rc_readings?: { reading_no: number; reading_time: string; qty: number }[];
  dmt_readings?: { reading_no: number; reading_time: string; qty: number }[];
  created_at: string;
}

/* ─── Helper ─────────────────────────────────────────────────────────────── */
function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inp = "w-full h-11 border border-gray-300 rounded-lg px-3 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none bg-white transition-colors";
const numInp = inp + " text-right tabular-nums";
const timeInp = inp;

/* ─── Main Component ────────────────────────────────────────────────────── */
export default function ShiftLogPage() {
  const [tab, setTab] = useState<"log" | "history" | "print">("log");
  const [logs, setLogs] = useState<ShiftLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ShiftLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  /* ── Form state ── */
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [shiftNo, setShiftNo] = useState<1 | 2>(1);
  const [glOpening, setGlOpening] = useState("");
  const [heaterStart, setHeaterStart] = useState("");
  const [cuttingStart, setCuttingStart] = useState("");
  const [dryerFeedStart, setDryerFeedStart] = useState("");
  const [cuttingStop, setCuttingStop] = useState("");
  const [dryerStop, setDryerStop] = useState("");
  const [mfdLeaf, setMfdLeaf] = useState("");
  const [dmbQty, setDmbQty] = useState("");
  const [dmbOutput, setDmbOutput] = useState("");
  const [gradedQty, setGradedQty] = useState("");
  const [rejectionKg, setRejectionKg] = useState("");
  const [wastageKg, setWastageKg] = useState("");
  const [rcReadings, setRcReadings] = useState<DensityReading[]>(DENSITY_EMPTY());
  const [dmtReadings, setDmtReadings] = useState<DensityReading[]>(DENSITY_EMPTY());
  const [gradeOutputs, setGradeOutputs] = useState<GradeOutput[]>(
    GRADES.map(g => ({ grade: g.code, qty_kg: "" }))
  );
  const [ebStart, setEbStart] = useState("");
  const [ebEnd, setEbEnd] = useState("");
  const [firewoodKg, setFirewoodKg] = useState("");
  const [totalWorkers, setTotalWorkers] = useState("");
  const [totalOtHours, setTotalOtHours] = useState("");
  const [shiftIncharge, setShiftIncharge] = useState("");
  const [mechanicName, setMechanicName] = useState("");
  const [electricianName, setElectricianName] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [remarks, setRemarks] = useState("");

  /* ── Derived / auto-calc ── */
  const cuttingHrs = diffHrsMins(cuttingStart, cuttingStop);
  const dryerHrs   = diffHrsMins(dryerFeedStart, dryerStop);
  const ebUnits    = ebStart && ebEnd ? (parseFloat(ebEnd) - parseFloat(ebStart)).toFixed(1) : "—";
  const totalMadeTea = gradeOutputs.reduce((s, g) => s + (parseFloat(g.qty_kg) || 0), 0);
  const gradePct    = mfdLeaf && gradedQty
    ? ((parseFloat(gradedQty) / parseFloat(mfdLeaf)) * 100).toFixed(2)
    : null;
  const outturnPct  = glOpening && totalMadeTea > 0
    ? ((totalMadeTea / parseFloat(glOpening)) * 100).toFixed(2)
    : null;

  /* ── Load history ── */
  const load = async () => {
    setLoading(true);
    const r = await tfFetch<ShiftLog[]>("/shift-logs?limit=60");
    if (r.success) setLogs(r.data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  /* ── Save shift log ── */
  const save = async () => {
    setSaving(true); setMsg(null);
    const payload = {
      shift_date: date,
      shift_number: shiftNo,
      green_leaf_opening_kg:   parseFloat(glOpening)   || null,
      heater_start_time:       heaterStart  || null,
      cutting_start_time:      cuttingStart || null,
      dryer_feed_start_time:   dryerFeedStart || null,
      cutting_stop_time:       cuttingStop  || null,
      dryer_stop_time:         dryerStop    || null,
      cutting_hours:           cuttingHrs !== "—" ? cuttingHrs : null,
      dryer_running_hours:     dryerHrs   !== "—" ? dryerHrs   : null,
      manufactured_leaf_kg:    parseFloat(mfdLeaf)     || null,
      dmb_qty:                 parseFloat(dmbQty)      || null,
      dmb_output_per_hr:       parseFloat(dmbOutput)   || null,
      graded_qty_kg:           parseFloat(gradedQty)   || null,
      grade_pct:               gradePct    ? parseFloat(gradePct)    : null,
      rejection_kg:            parseFloat(rejectionKg) || null,
      wastage_kg:              parseFloat(wastageKg)   || null,
      total_made_tea_kg:       totalMadeTea || null,
      outturn_pct:             outturnPct  ? parseFloat(outturnPct) : null,
      eb_meter_start:          parseFloat(ebStart) || null,
      eb_meter_end:            parseFloat(ebEnd)   || null,
      eb_units:                ebUnits !== "—" ? parseFloat(ebUnits) : null,
      firewood_kg:             parseFloat(firewoodKg) || null,
      total_workers:           parseInt(totalWorkers)  || null,
      total_ot_hours:          parseFloat(totalOtHours) || null,
      shift_incharge:          shiftIncharge  || null,
      mechanic_name:           mechanicName   || null,
      electrician_name:        electricianName || null,
      supervisor_name:         supervisorName || null,
      remarks:                 remarks || null,
      rc_readings:  rcReadings.filter(r => r.time || r.qty).map((r, i) => ({
        reading_no: i + 1, reading_time: r.time, qty: parseFloat(r.qty) || 0,
      })),
      dmt_readings: dmtReadings.filter(r => r.time || r.qty).map((r, i) => ({
        reading_no: i + 1, reading_time: r.time, qty: parseFloat(r.qty) || 0,
      })),
      grades: gradeOutputs.filter(g => g.qty_kg).map(g => ({
        grade: g.grade, qty_kg: parseFloat(g.qty_kg),
      })),
    };

    const r = await tfFetch("/shift-logs", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (r.success) {
      setMsg({ ok: true, text: "Shift log saved successfully." });
      load();
    } else {
      setMsg({ ok: false, text: r.error ?? "Save failed. Please try again." });
    }
  };

  /* ── Print ── */
  const handlePrint = (log: ShiftLog) => {
    setSelectedLog(log);
    setTab("print");
    setTimeout(() => window.print(), 400);
  };

  /* ─── Density row component ──────────────────────────────────────────── */
  function DensityRow({
    readings, onChange, label,
  }: {
    readings: DensityReading[];
    onChange: (i: number, field: "time" | "qty", val: string) => void;
    label: string;
  }) {
    return (
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">{label}</p>
        <div className="space-y-1.5">
          {readings.map((r, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 items-center">
              <span className="text-xs text-gray-500 text-right pr-1">{i + 1}</span>
              <input type="time" value={r.time}
                onChange={e => onChange(i, "time", e.target.value)}
                className={timeInp} />
              <input type="number" placeholder="Qty" value={r.qty}
                onChange={e => onChange(i, "qty", e.target.value)}
                className={numInp} step="0.1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center">
            <ClipboardCheck size={18} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Shift Handing Over Chart</h1>
            <p className="text-gray-500 text-xs">Daily production shift record — Tea Maker entry</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 transition-colors">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        {([["log", "Log Shift", Plus], ["history", "History", Eye], ["print", "Print View", Printer]] as const).map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all ${tab === k ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>
            <Icon size={13} />{l}
          </button>
        ))}
      </div>

      {/* ── TAB: LOG SHIFT ──────────────────────────────────────────────── */}
      {tab === "log" && (
        <div className="space-y-4">
          {msg && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${msg.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
              {msg.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {msg.text}
            </div>
          )}

          {/* ── Section A — Date & Shift ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Section A — Date & Shift</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Date" required>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inp} />
              </Field>
              <Field label="Shift">
                <div className="flex gap-2 h-11">
                  {[1, 2].map(n => (
                    <button key={n} onClick={() => setShiftNo(n as 1 | 2)}
                      className={`flex-1 rounded-lg border text-sm font-semibold transition-all ${shiftNo === n ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-300 hover:border-emerald-400"}`}>
                      Shift {n === 1 ? "I" : "II"}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Green Leaf Opening Balance (kg)" required>
                  <input type="number" value={glOpening} onChange={e => setGlOpening(e.target.value)}
                    placeholder="e.g. 6730" step="0.01" className={numInp} />
                </Field>
              </div>
            </div>
          </div>

          {/* ── Section B — Timing ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Section B — Shift Timing</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              <Field label="Heater Light Time">
                <input type="time" value={heaterStart} onChange={e => setHeaterStart(e.target.value)} className={timeInp} />
              </Field>
              <Field label="Cutting Started">
                <input type="time" value={cuttingStart} onChange={e => setCuttingStart(e.target.value)} className={timeInp} />
              </Field>
              <Field label="Dryer Feeding Started">
                <input type="time" value={dryerFeedStart} onChange={e => setDryerFeedStart(e.target.value)} className={timeInp} />
              </Field>
              <Field label="Cutting Stopped">
                <input type="time" value={cuttingStop} onChange={e => setCuttingStop(e.target.value)} className={timeInp} />
              </Field>
              <Field label="Dryer Stopped">
                <input type="time" value={dryerStop} onChange={e => setDryerStop(e.target.value)} className={timeInp} />
              </Field>
            </div>

            {/* Auto-calc timing summary */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Cutting Hours", value: cuttingHrs, icon: Clock, color: "text-blue-600 bg-blue-50 border-blue-100" },
                { label: "Dryer Running Hours", value: dryerHrs, icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100" },
              ].map(c => (
                <div key={c.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${c.color}`}>
                  <c.icon size={16} />
                  <div>
                    <p className="text-[11px] font-medium opacity-70">{c.label}</p>
                    <p className="text-base font-bold">{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Section C — Production ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Section C — Production</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Manufactured Leaf Qty (kg)">
                <input type="number" value={mfdLeaf} onChange={e => setMfdLeaf(e.target.value)}
                  placeholder="e.g. 6730" step="0.01" className={numInp} />
              </Field>
              <Field label="DMB Qty">
                <input type="number" value={dmbQty} onChange={e => setDmbQty(e.target.value)}
                  placeholder="—" step="0.01" className={numInp} />
              </Field>
              <Field label="DMB Output / Hr">
                <input type="number" value={dmbOutput} onChange={e => setDmbOutput(e.target.value)}
                  placeholder="—" step="0.01" className={numInp} />
              </Field>
              <Field label="Graded Qty (kg)">
                <input type="number" value={gradedQty} onChange={e => setGradedQty(e.target.value)}
                  placeholder="e.g. 2715" step="0.01" className={numInp} />
              </Field>
              <Field label="Rejection (kg)">
                <input type="number" value={rejectionKg} onChange={e => setRejectionKg(e.target.value)}
                  placeholder="0" step="0.01" className={numInp} />
              </Field>
              <Field label="Tea Waste (kg)">
                <input type="number" value={wastageKg} onChange={e => setWastageKg(e.target.value)}
                  placeholder="0" step="0.01" className={numInp} />
              </Field>
            </div>
            {gradePct && (
              <div className="mt-3 inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm px-3 py-1.5 rounded-lg">
                <BarChart2 size={13} /> Grade %: <span className="font-bold">{gradePct}%</span>
              </div>
            )}
          </div>

          {/* ── Section D — Density Readings ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Section D — Density Readings</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <DensityRow label="RC Density (Time / Qty)" readings={rcReadings}
                onChange={(i, f, v) => { const n = [...rcReadings]; n[i] = { ...n[i], [f]: v }; setRcReadings(n); }} />
              <DensityRow label="DMT Density (Time / Qty)" readings={dmtReadings}
                onChange={(i, f, v) => { const n = [...dmtReadings]; n[i] = { ...n[i], [f]: v }; setDmtReadings(n); }} />
            </div>
          </div>

          {/* ── Section E — Made Tea Grade Breakdown ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Section E — Made Tea Grade Breakdown</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {GRADES.map((g, i) => (
                <div key={g.code} className={`rounded-xl border p-3 ${g.color}`}>
                  <p className="text-xs font-bold mb-1.5">{g.label}</p>
                  <input type="number"
                    value={gradeOutputs[i]?.qty_kg ?? ""}
                    onChange={e => {
                      const n = [...gradeOutputs];
                      n[i] = { grade: g.code, qty_kg: e.target.value };
                      setGradeOutputs(n);
                    }}
                    placeholder="kg" step="0.01"
                    className="w-full h-10 rounded-lg border border-current/20 bg-white/70 px-2 text-sm text-right font-semibold focus:outline-none focus:ring-1 focus:ring-current/30 tabular-nums" />
                </div>
              ))}
            </div>

            {/* Outturn summary */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <Leaf size={15} className="text-emerald-600" />
                <div>
                  <p className="text-[11px] text-emerald-700 font-medium">Total Made Tea</p>
                  <p className="text-lg font-bold text-emerald-800">{fmtKg(totalMadeTea)}</p>
                </div>
              </div>
              {outturnPct && (
                <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${parseFloat(outturnPct) >= 24 ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                  <BarChart2 size={15} />
                  <div>
                    <p className="text-[11px] font-medium opacity-70">Outturn %</p>
                    <p className="text-lg font-bold">{fmtPct(parseFloat(outturnPct))}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Section F — Energy ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Section F — Energy & Fuel</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="EB Meter Start (Units)">
                <input type="number" value={ebStart} onChange={e => setEbStart(e.target.value)}
                  placeholder="0" step="0.1" className={numInp} />
              </Field>
              <Field label="EB Meter End (Units)">
                <input type="number" value={ebEnd} onChange={e => setEbEnd(e.target.value)}
                  placeholder="0" step="0.1" className={numInp} />
              </Field>
              <Field label="EB Units Consumed">
                <div className={`h-11 border rounded-lg px-3 flex items-center justify-end text-sm font-bold tabular-nums ${ebUnits !== "—" ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-gray-50 border-gray-200 text-gray-400"}`}>
                  {ebUnits !== "—" ? `${ebUnits} Units` : "—"}
                </div>
              </Field>
              <Field label="Firewood Used (kg)">
                <input type="number" value={firewoodKg} onChange={e => setFirewoodKg(e.target.value)}
                  placeholder="0" step="1" className={numInp} />
              </Field>
            </div>
          </div>

          {/* ── Section G — Mandays ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Section G — Workers & Staff</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <Field label="Total Workers">
                <input type="number" value={totalWorkers} onChange={e => setTotalWorkers(e.target.value)}
                  placeholder="e.g. 52" className={numInp} />
              </Field>
              <Field label="Total OT Hours">
                <input type="number" value={totalOtHours} onChange={e => setTotalOtHours(e.target.value)}
                  placeholder="0" step="0.5" className={numInp} />
              </Field>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Shift Incharge", val: shiftIncharge, set: setShiftIncharge },
                { label: "Mechanic Staff",  val: mechanicName,   set: setMechanicName },
                { label: "Electrician Staff", val: electricianName, set: setElectricianName },
                { label: "Supervisor",     val: supervisorName, set: setSupervisorName },
              ].map(f => (
                <Field key={f.label} label={f.label}>
                  <input type="text" value={f.val} onChange={e => f.set(e.target.value)}
                    placeholder="Name" className={inp} />
                </Field>
              ))}
            </div>
          </div>

          {/* ── Section H — Remarks ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <Field label="Remarks / Remark by Shift Incharge">
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
                placeholder="e.g. Blend and Cleaning OK. Any machine issues, observations…"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none bg-white transition-colors resize-none" />
            </Field>
          </div>

          {/* Save button */}
          <div className="flex justify-end pb-6">
            <button onClick={save} disabled={saving || !date || !glOpening}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-sm font-semibold shadow-sm transition-colors min-h-[44px]">
              <Save size={16} />
              {saving ? "Saving…" : "Save Shift Log"}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: HISTORY ──────────────────────────────────────────────────── */}
      {tab === "history" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading shift logs…</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardCheck size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500 text-sm">No shift logs yet. Start by logging today's shift.</p>
              <button onClick={() => setTab("log")} className="mt-4 bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-medium min-h-[44px]">
                Log Shift
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Shift</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">GL (kg)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Made Tea (kg)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Outturn %</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Workers</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Incharge</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Print</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const ot = log.outturn_pct ?? null;
                  const otColor = ot === null ? "" : ot >= 24 ? "text-emerald-600 font-bold" : "text-red-600 font-bold";
                  return (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-900 font-medium">{fmtDate(log.shift_date)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${log.shift_number === 1 ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                          Shift {log.shift_number === 1 ? "I" : "II"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">{log.green_leaf_opening_kg?.toLocaleString("en-IN") ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-900 font-medium">{log.total_made_tea_kg?.toLocaleString("en-IN") ?? "—"}</td>
                      <td className={`px-4 py-3 text-right tabular-nums ${otColor}`}>{ot !== null ? `${ot.toFixed(2)}%` : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">{log.total_workers ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{log.shift_incharge ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handlePrint(log)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-500 transition-colors ml-auto">
                          <Printer size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB: PRINT VIEW ───────────────────────────────────────────────── */}
      {tab === "print" && selectedLog && (
        <div ref={printRef}>
          {/* Screen header */}
          <div className="flex items-center justify-between mb-4 print:hidden">
            <p className="text-sm text-gray-600">
              Shift {selectedLog.shift_number === 1 ? "I" : "II"} — {fmtDateShort(selectedLog.shift_date)}
            </p>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium min-h-[44px]">
              <Printer size={15} /> Print
            </button>
          </div>

          {/* ── Physical form replica ── */}
          <div className="bg-white border-2 border-gray-800 p-6 font-mono text-xs print:border-black print:text-[10pt] print:p-[15mm]">
            {/* Factory header */}
            <div className="text-center border-b-2 border-gray-800 pb-3 mb-4">
              <p className="text-sm font-bold uppercase tracking-widest">Tea Factory</p>
              <p className="text-base font-black uppercase tracking-wider mt-0.5">
                Shift Handing Over Chart
              </p>
              <div className="flex justify-between mt-2 text-[11px]">
                <span>SHIFT – {selectedLog.shift_number === 1 ? "I" : "II"}</span>
                <span>Date: {fmtDateShort(selectedLog.shift_date)}</span>
              </div>
            </div>

            {/* Two-column layout matching physical form */}
            <div className="grid grid-cols-2 gap-x-8">
              {/* Left column */}
              <div className="space-y-1.5">
                {[
                  ["Date", fmtDate(selectedLog.shift_date)],
                  ["Shift Time", "—"],
                  ["Green Leaf Qty OP Bal", selectedLog.green_leaf_opening_kg ? `${selectedLog.green_leaf_opening_kg.toLocaleString("en-IN")} kg` : "—"],
                  ["Heater Light Time", selectedLog.heater_start_time ? fmtTime(selectedLog.heater_start_time) : "—"],
                  ["Cutting Started Time", selectedLog.cutting_start_time ? fmtTime(selectedLog.cutting_start_time) : "—"],
                  ["Dryer Feeding Started at", selectedLog.dryer_feed_start_time ? fmtTime(selectedLog.dryer_feed_start_time) : "—"],
                  ["Cutting Stopped at", selectedLog.cutting_stop_time ? fmtTime(selectedLog.cutting_stop_time) : "—"],
                  ["Dryer Stopped at", selectedLog.dryer_stop_time ? fmtTime(selectedLog.dryer_stop_time) : "—"],
                  ["Cutting Hours", selectedLog.cutting_hours ?? "—"],
                  ["Mfd. Leaf Qty", selectedLog.manufactured_leaf_kg ? `${selectedLog.manufactured_leaf_kg.toLocaleString("en-IN")} kg` : "—"],
                  ["Drier Running Hours", selectedLog.dryer_running_hours ?? "—"],
                  ["DMB Qty", selectedLog.dmb_qty?.toString() ?? "—"],
                  ["DMB Output / Hrs", selectedLog.dmb_output_per_hr?.toString() ?? "—"],
                  ["Graded Qty", selectedLog.graded_qty_kg ? `${selectedLog.graded_qty_kg} kg` : "—"],
                  ["Grade %", selectedLog.grade_pct ? `${selectedLog.grade_pct.toFixed(2)}%` : "—"],
                  ["Rejection", selectedLog.rejection_kg ? `${selectedLog.rejection_kg} kg` : "—"],
                  ["Tea Waste", selectedLog.wastage_kg ? `${selectedLog.wastage_kg} kg` : "—"],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between border-b border-gray-300 py-0.5 gap-2">
                    <span className="text-gray-700">{label}</span>
                    <span className="font-semibold">{val}</span>
                  </div>
                ))}
              </div>

              {/* Right column — density readings */}
              <div>
                {/* RC Density */}
                <div className="mb-3">
                  <div className="flex border-b border-gray-400 pb-0.5 mb-1">
                    <span className="flex-1 font-bold">RC Density</span>
                    <span className="w-20 text-center font-bold">Time</span>
                    <span className="w-20 text-center font-bold">Qty</span>
                  </div>
                  {[1, 2, 3].map(n => {
                    const r = selectedLog.rc_readings?.find(x => x.reading_no === n);
                    return (
                      <div key={n} className="flex border-b border-gray-200 py-0.5">
                        <span className="flex-1 text-gray-500">{n}</span>
                        <span className="w-20 text-center">{r?.reading_time ? fmtTime(r.reading_time) : "—"}</span>
                        <span className="w-20 text-center">{r?.qty?.toString() ?? "—"}</span>
                      </div>
                    );
                  })}
                </div>

                {/* DMT Density */}
                <div className="mb-3">
                  <div className="flex border-b border-gray-400 pb-0.5 mb-1">
                    <span className="flex-1 font-bold">DMT Density</span>
                    <span className="w-20 text-center font-bold">Time</span>
                    <span className="w-20 text-center font-bold">Qty</span>
                  </div>
                  {[1, 2, 3].map(n => {
                    const r = selectedLog.dmt_readings?.find(x => x.reading_no === n);
                    return (
                      <div key={n} className="flex border-b border-gray-200 py-0.5">
                        <span className="flex-1 text-gray-500">{n}</span>
                        <span className="w-20 text-center">{r?.reading_time ? fmtTime(r.reading_time) : "—"}</span>
                        <span className="w-20 text-center">{r?.qty?.toString() ?? "—"}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Made tea grade breakdown */}
                <div className="mb-3">
                  <p className="font-bold border-b border-gray-400 pb-0.5 mb-1">Made Tea by Grade</p>
                  {GRADES.map(g => {
                    const gr = selectedLog.grades?.find(x => x.grade === g.code);
                    return (
                      <div key={g.code} className="flex justify-between border-b border-gray-200 py-0.5">
                        <span>{g.label}</span>
                        <span className="font-semibold">{gr ? `${gr.qty_kg} kg` : "—"}</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between border-b-2 border-gray-600 py-0.5 mt-1">
                    <span className="font-bold">Total Made Tea</span>
                    <span className="font-bold">{selectedLog.total_made_tea_kg ? `${selectedLog.total_made_tea_kg.toLocaleString("en-IN")} kg` : "—"}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-bold">Outturn %</span>
                    <span className="font-bold">{selectedLog.outturn_pct ? `${selectedLog.outturn_pct.toFixed(2)}%` : "—"}</span>
                  </div>
                </div>

                {/* Energy */}
                <div className="mb-3">
                  <p className="font-bold border-b border-gray-400 pb-0.5 mb-1">Energy</p>
                  {[
                    ["EB Meter Start", selectedLog.eb_meter_start?.toString() ?? "—"],
                    ["EB Meter End", selectedLog.eb_meter_end?.toString() ?? "—"],
                    ["EB Units Consumed", selectedLog.eb_units ? `${selectedLog.eb_units} Units` : "—"],
                    ["Firewood Used", selectedLog.firewood_kg ? `${selectedLog.firewood_kg} kg` : "—"],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between border-b border-gray-200 py-0.5">
                      <span>{l}</span><span className="font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Workers & Staff sign-off */}
            <div className="border-t-2 border-gray-600 mt-4 pt-3 grid grid-cols-2 gap-x-8">
              <div className="space-y-1.5">
                {[
                  ["Total Workers", selectedLog.total_workers?.toString() ?? "—"],
                  ["Total OT Hours", selectedLog.total_ot_hours?.toString() ?? "—"],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between border-b border-gray-200 py-0.5">
                    <span>{l}</span><span className="font-semibold">{v}</span>
                  </div>
                ))}
              </div>
              <div></div>
            </div>

            {/* Signatures */}
            <div className="border-t border-gray-400 mt-4 pt-4 grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                ["Shift Incharge Sign", selectedLog.shift_incharge ?? ""],
                ["Mechanic Staff", selectedLog.mechanic_name ?? ""],
                ["Electrician Staff", selectedLog.electrician_name ?? ""],
                ["Supervisor Sign", selectedLog.supervisor_name ?? ""],
              ].map(([role, name]) => (
                <div key={role} className="border-b border-gray-300 pb-2">
                  <span className="text-gray-600">{role}: </span>
                  <span className="font-semibold">{name}</span>
                </div>
              ))}
            </div>

            {/* Remarks */}
            {selectedLog.remarks && (
              <div className="mt-3 border-t border-gray-300 pt-2">
                <span className="text-gray-600">Remark by Shift Incharge / Mech / Elec: </span>
                <span>{selectedLog.remarks}</span>
              </div>
            )}

            {/* Factory Manager */}
            <div className="mt-6 flex justify-end">
              <div className="text-center w-40">
                <div className="border-b border-gray-600 pb-6 mb-1"></div>
                <p className="text-xs">Factory Manager Sign</p>
              </div>
            </div>
          </div>

          {/* Print CSS */}
          <style jsx global>{`
            @media print {
              body * { visibility: hidden; }
              [data-print], [data-print] * { visibility: visible; }
              nav, aside, header, button, .print\\:hidden { display: none !important; }
              @page { size: A4; margin: 15mm; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
