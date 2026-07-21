"use client";

import { useState, useEffect } from "react";
import { Tractor, Plus, Wallet, ShieldCheck, CalendarCheck } from "lucide-react";
import { teaAuthHeaders, teaUrl } from "@/lib/tea-api";

interface Plot { id: string; name: string; area_hectares: number | null; }
interface Worker { id: string; name: string; phone: string; role: string; employment_type: string; plot_id: string | null; plot_name: string | null; daily_wage: number; is_active: boolean; }
interface WageTotal { worker_id: string; worker_name: string; role: string; days_present: number; days_absent: number; total_wage: number; }
interface PayrollRun { id: string; worker_id: string; worker_name: string; period_start: string; period_end: string; gross_wage: number; epf: number; esi: number; tds: number; net_pay: number; status: string; }
interface Insurance { id: string; worker_id: string; worker_name: string; type: string; provider: string; policy_number: string; expiry_date: string | null; next_checkup_date: string | null; status: string; }

const ROLES = ["plucker", "factory_hand", "supervisor", "other"];
const today = () => new Date().toISOString().slice(0, 10);
const weekAgo = () => new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

export default function EstatePage() {
  const [tab, setTab] = useState<"workers" | "attendance" | "payroll" | "insurance">("workers");
  const [plots, setPlots] = useState<Plot[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [wageTotals, setWageTotals] = useState<WageTotal[]>([]);
  const [payroll, setPayroll] = useState<PayrollRun[]>([]);
  const [insurance, setInsurance] = useState<Insurance[]>([]);

  const [plotForm, setPlotForm] = useState({ name: "", area_hectares: "" });
  const [workerForm, setWorkerForm] = useState({ name: "", phone: "", role: "plucker", employment_type: "permanent", plot_id: "", daily_wage: "" });
  const [attForm, setAttForm] = useState({ worker_id: "", attendance_date: today(), status: "present" });
  const [range, setRange] = useState({ from: weekAgo(), to: today() });
  const [payrollForm, setPayrollForm] = useState({ worker_id: "", period_start: weekAgo(), period_end: today() });
  const [insForm, setInsForm] = useState({ worker_id: "", type: "group_health", provider: "", policy_number: "", expiry_date: "" });

  const load = async () => {
    const [p, w] = await Promise.all([
      fetch(teaUrl("/estate/plots"), { headers: teaAuthHeaders() }).then(r => r.json()),
      fetch(teaUrl("/estate/workers"), { headers: teaAuthHeaders() }).then(r => r.json()),
    ]);
    if (p.success) setPlots(p.data);
    if (w.success) setWorkers(w.data);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (tab === "attendance") fetch(teaUrl(`/estate/wage-totals?from=${range.from}&to=${range.to}`), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setWageTotals(d.data));
    if (tab === "payroll") fetch(teaUrl("/payroll"), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setPayroll(d.data));
    if (tab === "insurance") fetch(teaUrl("/worker-insurance"), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setInsurance(d.data));
  }, [tab, range.from, range.to]);

  const addPlot = async () => {
    if (!plotForm.name) return;
    await fetch(teaUrl("/estate/plots"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(plotForm) });
    setPlotForm({ name: "", area_hectares: "" }); load();
  };
  const addWorker = async () => {
    if (!workerForm.name) return;
    await fetch(teaUrl("/estate/workers"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(workerForm) });
    setWorkerForm({ name: "", phone: "", role: "plucker", employment_type: "permanent", plot_id: "", daily_wage: "" }); load();
  };
  const markAttendance = async () => {
    if (!attForm.worker_id) return;
    await fetch(teaUrl("/estate/attendance"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(attForm) });
    fetch(teaUrl(`/estate/wage-totals?from=${range.from}&to=${range.to}`), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setWageTotals(d.data));
  };
  const generatePayroll = async (worker_id?: string) => {
    const wid = worker_id || payrollForm.worker_id;
    if (!wid) return;
    await fetch(teaUrl("/payroll/generate"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify({ ...payrollForm, worker_id: wid }) });
    fetch(teaUrl("/payroll"), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setPayroll(d.data));
  };
  const markPaid = async (runId: string) => {
    await fetch(teaUrl(`/payroll/${runId}/mark-paid`), { method: "PUT", headers: teaAuthHeaders() });
    fetch(teaUrl("/payroll"), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setPayroll(d.data));
  };
  const addInsurance = async () => {
    if (!insForm.worker_id) return;
    await fetch(teaUrl("/worker-insurance"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(insForm) });
    setInsForm({ worker_id: "", type: "group_health", provider: "", policy_number: "", expiry_date: "" });
    fetch(teaUrl("/worker-insurance"), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setInsurance(d.data));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-lime-500/10 rounded-xl flex items-center justify-center"><Tractor size={18} className="text-lime-400" /></div>
        <div><h1 className="text-lg font-bold text-white">Estate & Payroll</h1><p className="text-white/40 text-xs">Own plots, workforce, attendance, wages, and worker insurance</p></div>
      </div>

      <div className="flex gap-1 mb-4 bg-[#161a23] border border-white/8 rounded-xl p-1 w-fit flex-wrap">
        {([["workers", "Workers & Plots"], ["attendance", "Attendance & Wages"], ["payroll", "Payroll"], ["insurance", "Insurance"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-1.5 rounded-lg text-xs transition-all ${tab === k ? "bg-green-600/20 text-green-400" : "text-white/40 hover:text-white"}`}>{l}</button>
        ))}
      </div>

      {tab === "workers" && (
        <>
          <div className="bg-[#161a23] border border-white/8 rounded-xl p-4 mb-4">
            <p className="text-white/50 text-xs mb-2">Add estate plot</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <input placeholder="Plot name" value={plotForm.name} onChange={e => setPlotForm({ ...plotForm, name: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              <input type="number" placeholder="Area (hectares)" value={plotForm.area_hectares} onChange={e => setPlotForm({ ...plotForm, area_hectares: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              <button onClick={addPlot} className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"><Plus size={14} /> Add Plot</button>
            </div>
            {plots.length > 0 && <div className="flex flex-wrap gap-2 mt-3">{plots.map(p => <span key={p.id} className="text-xs bg-white/5 text-white/60 px-2 py-1 rounded-full">{p.name}{p.area_hectares ? ` — ${p.area_hectares}ha` : ""}</span>)}</div>}
          </div>

          <div className="bg-[#161a23] border border-white/8 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-6 gap-2">
            <input placeholder="Worker name" value={workerForm.name} onChange={e => setWorkerForm({ ...workerForm, name: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <input placeholder="Phone" value={workerForm.phone} onChange={e => setWorkerForm({ ...workerForm, phone: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <select value={workerForm.role} onChange={e => setWorkerForm({ ...workerForm, role: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
            </select>
            <select value={workerForm.plot_id} onChange={e => setWorkerForm({ ...workerForm, plot_id: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              <option value="">Plot...</option>
              {plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="number" placeholder="Daily wage ₹" value={workerForm.daily_wage} onChange={e => setWorkerForm({ ...workerForm, daily_wage: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <button onClick={addWorker} className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"><Plus size={14} /> Add</button>
          </div>
          <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
            {workers.length === 0 ? <div className="p-8 text-center text-white/30 text-sm">No estate workers yet.</div> : (
              <table className="w-full"><tbody>
                {workers.map(w => (
                  <tr key={w.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white text-sm font-medium">{w.name}</td>
                    <td className="px-4 py-3 text-white/50 text-xs capitalize">{w.role.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{w.plot_name || "—"}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">₹{w.daily_wage}/day</td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}

      {tab === "attendance" && (
        <>
          <div className="bg-[#161a23] border border-white/8 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select value={attForm.worker_id} onChange={e => setAttForm({ ...attForm, worker_id: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              <option value="">Worker...</option>
              {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <input type="date" value={attForm.attendance_date} onChange={e => setAttForm({ ...attForm, attendance_date: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <select value={attForm.status} onChange={e => setAttForm({ ...attForm, status: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              <option value="present">Present</option><option value="absent">Absent</option><option value="half_day">Half day</option>
            </select>
            <button onClick={markAttendance} className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"><CalendarCheck size={14} /> Mark</button>
          </div>
          <div className="flex items-center gap-2 mb-3 text-xs text-white/40">
            <span>Period:</span>
            <input type="date" value={range.from} onChange={e => setRange({ ...range, from: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-2 py-1 text-white" />
            <span>to</span>
            <input type="date" value={range.to} onChange={e => setRange({ ...range, to: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-2 py-1 text-white" />
          </div>
          <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
            {wageTotals.length === 0 ? <div className="p-8 text-center text-white/30 text-sm">No attendance in this period.</div> : (
              <table className="w-full"><tbody>
                {wageTotals.map(w => (
                  <tr key={w.worker_id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white text-sm">{w.worker_name}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{w.days_present} present / {w.days_absent} absent</td>
                    <td className="px-4 py-3 text-green-400 text-sm font-medium">₹{w.total_wage}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => generatePayroll(w.worker_id)} className="text-xs bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-lg">Generate Payroll</button>
                    </td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}

      {tab === "payroll" && (
        <>
          <div className="bg-[#161a23] border border-white/8 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select value={payrollForm.worker_id} onChange={e => setPayrollForm({ ...payrollForm, worker_id: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              <option value="">Worker...</option>
              {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <input type="date" value={payrollForm.period_start} onChange={e => setPayrollForm({ ...payrollForm, period_start: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <input type="date" value={payrollForm.period_end} onChange={e => setPayrollForm({ ...payrollForm, period_end: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <button onClick={() => generatePayroll()} className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"><Wallet size={14} /> Generate</button>
          </div>
          <p className="text-white/30 text-xs mb-3">Simplified EPF (12%) / ESI (0.75% under ₹21,000) — review against a compliance professional before real statutory use.</p>
          <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
            {payroll.length === 0 ? <div className="p-8 text-center text-white/30 text-sm">No payroll runs yet.</div> : (
              <table className="w-full"><tbody>
                {payroll.map(p => (
                  <tr key={p.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white text-sm">{p.worker_name}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{p.period_start} → {p.period_end}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">Gross ₹{p.gross_wage} − EPF ₹{p.epf} − ESI ₹{p.esi}</td>
                    <td className="px-4 py-3 text-green-400 text-sm font-medium">₹{p.net_pay}</td>
                    <td className="px-4 py-3 text-right">
                      {p.status === "paid" ? <span className="text-xs text-green-400">Paid</span> : (
                        <button onClick={() => markPaid(p.id)} className="text-xs bg-white/5 hover:bg-white/10 text-white/70 px-3 py-1.5 rounded-lg">Mark Paid</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}

      {tab === "insurance" && (
        <>
          <div className="bg-[#161a23] border border-white/8 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <select value={insForm.worker_id} onChange={e => setInsForm({ ...insForm, worker_id: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              <option value="">Worker...</option>
              {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <select value={insForm.type} onChange={e => setInsForm({ ...insForm, type: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              <option value="group_health">Group Health</option><option value="accident">Accident</option><option value="checkup">Medical Checkup</option>
            </select>
            <input placeholder="Provider" value={insForm.provider} onChange={e => setInsForm({ ...insForm, provider: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <input type="date" placeholder="Expiry" value={insForm.expiry_date} onChange={e => setInsForm({ ...insForm, expiry_date: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <button onClick={addInsurance} className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"><ShieldCheck size={14} /> Add</button>
          </div>
          <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
            {insurance.length === 0 ? <div className="p-8 text-center text-white/30 text-sm">No worker insurance records yet.</div> : (
              <table className="w-full"><tbody>
                {insurance.map(i => (
                  <tr key={i.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white text-sm">{i.worker_name}</td>
                    <td className="px-4 py-3 text-white/50 text-xs capitalize">{i.type.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{i.provider || "—"}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{i.expiry_date || i.next_checkup_date || "—"}</td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
