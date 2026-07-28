"use client";

import { useState, useEffect, useCallback } from "react";
import { HardHat, Plus, RefreshCw, AlertCircle, X, Save, Users } from "lucide-react";
import { tfFetch, fmtDate, fmtINR } from "@/lib/tf-api";

const TASKS = [
  { code: "green_leaf_intake", label: "Green Leaf Intake (Weighbridge)" },
  { code: "withering_rolling",  label: "Withering / Rolling" },
  { code: "ctc_cutting",        label: "CTC / Cutting" },
  { code: "dryer_operation",    label: "Dryer Operation" },
  { code: "grading_sorting",    label: "Grading / Sorting" },
  { code: "packing_bagging",    label: "Packing / Bagging" },
  { code: "loading_dispatch",   label: "Loading / Dispatch" },
  { code: "cleaning_maintenance",label: "Cleaning / Maintenance" },
  { code: "general",            label: "General / Other" },
];

interface MandayLog {
  id: string; log_date: string; task_code: string; task_label: string;
  worker_count: number; hours_worked: number; ot_hours: number | null;
  wage_per_day: number; total_wage: number; notes: string | null;
}
interface Summary { today_workers: number; mtd_workers: number; mtd_total_wage: number; mtd_ot_hours: number; wage_per_kg: number | null; }

const inp = "w-full h-11 border border-gray-300 rounded-lg px-3 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none bg-white transition-colors";

export default function MandaysPage() {
  const [logs, setLogs] = useState<MandayLog[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [taskFilter, setTaskFilter] = useState("ALL");

  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [taskCode, setTaskCode] = useState("general");
  const [workers, setWorkers] = useState("");
  const [hours, setHours] = useState("8");
  const [otHours, setOtHours] = useState("");
  const [wagePerDay, setWagePerDay] = useState("450");
  const [notes, setNotes] = useState("");

  const totalWage = (parseInt(workers) || 0) * (parseFloat(wagePerDay) || 0);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, l] = await Promise.all([
      tfFetch<Summary>("/mandays/summary"),
      tfFetch<MandayLog[]>("/mandays?limit=100"),
    ]);
    if (s.success) setSummary(s.data ?? null);
    if (l.success) setLogs(l.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const r = await tfFetch("/mandays", {
      method: "POST",
      body: JSON.stringify({
        log_date: logDate, task_code: taskCode,
        worker_count: parseInt(workers) || 0,
        hours_worked: parseFloat(hours) || 8,
        ot_hours: otHours ? parseFloat(otHours) : null,
        wage_per_day: parseFloat(wagePerDay) || 0,
        notes: notes || null,
      }),
    });
    setSaving(false);
    if (r.success) { setShowForm(false); setMsg({ ok: true, text: "Manday log saved." }); load(); }
    else setMsg({ ok: false, text: r.error ?? "Save failed." });
  };

  const filtered = taskFilter === "ALL" ? logs : logs.filter(l => l.task_code === taskFilter);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
            <HardHat size={18} className="text-rose-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Mandays</h1>
            <p className="text-gray-500 text-xs">Task-wise labour tracking · Wage calculation</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 min-h-[44px]">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-colors min-h-[44px]">
            <Plus size={15} /> Add Entry
          </button>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border mb-4 ${msg.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          <AlertCircle size={14} />{msg.text}
        </div>
      )}

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Workers Today", val: summary.today_workers.toString(), sub: "All tasks combined", color: "text-rose-700 bg-rose-50 border-rose-200" },
            { label: "Workers MTD", val: summary.mtd_workers.toLocaleString("en-IN"), sub: "Total mandays", color: "text-gray-800 bg-gray-50 border-gray-200" },
            { label: "Wage Cost MTD", val: fmtINR(summary.mtd_total_wage), sub: `${summary.mtd_ot_hours} OT hrs`, color: "text-blue-700 bg-blue-50 border-blue-200" },
            { label: "Wage / kg Made Tea", val: summary.wage_per_kg !== null ? `₹${summary.wage_per_kg.toFixed(2)}` : "—", sub: "Cost efficiency", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
          ].map(c => (
            <div key={c.label} className={`rounded-xl border p-4 ${c.color}`}>
              <p className="text-xs font-semibold opacity-70 mb-1">{c.label}</p>
              <p className="text-2xl font-bold">{c.val}</p>
              <p className="text-xs opacity-60 mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Task filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["ALL", ...TASKS.map(t => t.code)].map(c => (
          <button key={c} onClick={() => setTaskFilter(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all min-h-[36px] ${taskFilter === c ? "bg-rose-600 text-white border-rose-600" : "bg-white border-gray-200 text-gray-600 hover:border-rose-300"}`}>
            {c === "ALL" ? "All Tasks" : TASKS.find(t => t.code === c)?.label?.split(" ")[0] ?? c}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100">
            {["Date", "Task", "Workers", "Hours", "OT Hrs", "Wage/Day (₹)", "Total Wage (₹)", "Notes"].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center">
                <Users size={32} className="mx-auto mb-2 text-gray-200" />
                <p className="text-gray-400 text-sm">No manday entries yet.</p>
              </td></tr>
            ) : filtered.map(log => (
              <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{fmtDate(log.log_date)}</td>
                <td className="px-4 py-3 text-gray-800 font-medium text-xs">{log.task_label}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-rose-700">{log.worker_count}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-600">{log.hours_worked}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-500">{log.ot_hours ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">{log.wage_per_day.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">{fmtINR(log.total_wage)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{log.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Add Manday Entry</h2>
              <button onClick={() => setShowForm(false)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Task</label>
                <select value={taskCode} onChange={e => setTaskCode(e.target.value)} className={inp}>
                  {TASKS.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">No. of Workers</label><input type="number" value={workers} onChange={e => setWorkers(e.target.value)} placeholder="0" className={inp + " text-right tabular-nums"} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Hours Worked</label><input type="number" value={hours} onChange={e => setHours(e.target.value)} placeholder="8" step="0.5" className={inp + " text-right tabular-nums"} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">OT Hours</label><input type="number" value={otHours} onChange={e => setOtHours(e.target.value)} placeholder="0" step="0.5" className={inp + " text-right tabular-nums"} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Wage / Day (₹)</label><input type="number" value={wagePerDay} onChange={e => setWagePerDay(e.target.value)} placeholder="450" step="10" className={inp + " text-right tabular-nums"} /></div>
              </div>
              {workers && wagePerDay && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex justify-between">
                  <span className="text-rose-700 text-sm">Total Wage</span>
                  <span className="font-bold text-rose-800">{fmtINR(totalWage)}</span>
                </div>
              )}
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label><input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" className={inp} /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-500 min-h-[44px]">Cancel</button>
              <button onClick={save} disabled={saving || !workers}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 min-h-[44px]">
                <Save size={14} />{saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
