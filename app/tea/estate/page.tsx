"use client";

import { useState, useEffect } from "react";
import { Tractor, Plus, Wallet, ShieldCheck, CalendarCheck, Home, Stethoscope, MapPinned, LogOut } from "lucide-react";
import { teaAuthHeaders, teaUrl } from "@/lib/tea-api";

interface Plot { id: string; name: string; area_hectares: number | null; estate_id: string | null; estate_name: string | null; }
interface Estate {
  id: string; name: string; acres: number | null; leaf_type: string | null; location: string | null;
  supervisor_id: string | null; supervisor_name: string | null; manager_id: string | null; manager_name: string | null;
  field_count: number;
}
interface GuestHouse { id: string; name: string; location: string | null; total_rooms: number; occupied_rooms: number; }
interface GuestHouseAssignment { id: string; guest_house_id: string; guest_house_name: string; worker_id: string; worker_name: string; room_number: string | null; check_in_date: string; check_out_date: string | null; is_active: boolean; }
interface MedicalFacility { id: string; name: string; location: string | null; facility_type: string; pharmacist_id: string | null; pharmacist_name: string | null; contact_phone: string | null; }
interface Worker { id: string; name: string; phone: string; role: string; department: string; employment_type: string; plot_id: string | null; plot_name: string | null; reports_to_id: string | null; reports_to_name: string | null; daily_wage: number; is_active: boolean; }
interface WageTotal { worker_id: string; worker_name: string; role: string; days_present: number; days_absent: number; total_wage: number; }
interface PayrollRun { id: string; worker_id: string; worker_name: string; period_start: string; period_end: string; gross_wage: number; epf: number; esi: number; tds: number; net_pay: number; status: string; }
interface Insurance { id: string; worker_id: string; worker_name: string; type: string; provider: string; policy_number: string; expiry_date: string | null; next_checkup_date: string | null; status: string; }
interface RoleOption { value: string; label: string; }

// Fallback used only if /estate/roles-catalog isn't reachable yet (e.g. a
// backend deploy hasn't rolled out this endpoint) — keeps Add Worker
// functional with the previous, smaller role set instead of an empty,
// unusable dropdown.
const FALLBACK_CATALOG = {
  estate: [{ value: "plucker", label: "Tea Plucker / Harvester" }, { value: "supervisor", label: "Field Officer / Supervisor" }, { value: "other", label: "Other" }],
  factory: [{ value: "factory_hand", label: "Factory Hand" }, { value: "supervisor", label: "Production Supervisor" }, { value: "other", label: "Other" }],
  employmentTypes: [{ value: "permanent", label: "Permanent" }, { value: "temporary", label: "Temporary" }, { value: "casual", label: "Casual" }],
};

const today = () => new Date().toISOString().slice(0, 10);
const weekAgo = () => new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

export default function EstatePage() {
  const [tab, setTab] = useState<"workers" | "estates" | "facilities" | "attendance" | "payroll" | "insurance">("workers");
  const [plots, setPlots] = useState<Plot[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [wageTotals, setWageTotals] = useState<WageTotal[]>([]);
  const [payroll, setPayroll] = useState<PayrollRun[]>([]);
  const [insurance, setInsurance] = useState<Insurance[]>([]);
  const [roleCatalog, setRoleCatalog] = useState<{ estate: RoleOption[]; factory: RoleOption[]; employmentTypes: RoleOption[] }>({ estate: [], factory: [], employmentTypes: [] });
  const [estates, setEstates] = useState<Estate[]>([]);
  const [guestHouses, setGuestHouses] = useState<GuestHouse[]>([]);
  const [ghAssignments, setGhAssignments] = useState<GuestHouseAssignment[]>([]);
  const [medicalFacilities, setMedicalFacilities] = useState<MedicalFacility[]>([]);

  const [plotForm, setPlotForm] = useState({ name: "", area_hectares: "", estate_id: "" });
  const [estateForm, setEstateForm] = useState({ name: "", acres: "", leaf_type: "", location: "", supervisor_id: "", manager_id: "" });
  const [ghForm, setGhForm] = useState({ name: "", location: "", total_rooms: "1" });
  const [ghAssignForm, setGhAssignForm] = useState({ guest_house_id: "", worker_id: "", room_number: "" });
  const [medForm, setMedForm] = useState({ name: "", location: "", facility_type: "dispensary", pharmacist_id: "", contact_phone: "" });
  const [workerForm, setWorkerForm] = useState({ name: "", phone: "", department: "estate", role: "", employment_type: "permanent", plot_id: "", reports_to_id: "", daily_wage: "" });
  const [attForm, setAttForm] = useState({ worker_id: "", attendance_date: today(), status: "present" });
  const [range, setRange] = useState({ from: weekAgo(), to: today() });
  const [payrollForm, setPayrollForm] = useState({ worker_id: "", period_start: weekAgo(), period_end: today() });
  const [insForm, setInsForm] = useState({ worker_id: "", type: "group_health", provider: "", policy_number: "", expiry_date: "" });

  const load = async () => {
    const [p, w, rc, e] = await Promise.all([
      fetch(teaUrl("/estate/plots"), { headers: teaAuthHeaders() }).then(r => r.json()),
      fetch(teaUrl("/estate/workers"), { headers: teaAuthHeaders() }).then(r => r.json()),
      fetch(teaUrl("/estate/roles-catalog"), { headers: teaAuthHeaders() }).then(r => r.json()).catch(() => null),
      fetch(teaUrl("/estates"), { headers: teaAuthHeaders() }).then(r => r.json()).catch(() => null),
    ]);
    if (p.success) setPlots(p.data);
    if (w.success) setWorkers(w.data);
    const catalog = rc?.success ? rc.data : FALLBACK_CATALOG;
    setRoleCatalog(catalog);
    setWorkerForm(f => ({ ...f, role: f.role || catalog.estate[0]?.value || "" }));
    if (e?.success) setEstates(e.data);
  };
  useEffect(() => { load(); }, []);

  const loadFacilities = async () => {
    const [e, gh, gha, med] = await Promise.all([
      fetch(teaUrl("/estates"), { headers: teaAuthHeaders() }).then(r => r.json()),
      fetch(teaUrl("/guest-houses"), { headers: teaAuthHeaders() }).then(r => r.json()),
      fetch(teaUrl("/guest-house-assignments?active_only=true"), { headers: teaAuthHeaders() }).then(r => r.json()),
      fetch(teaUrl("/medical-facilities"), { headers: teaAuthHeaders() }).then(r => r.json()),
    ]);
    if (e.success) setEstates(e.data);
    if (gh.success) setGuestHouses(gh.data);
    if (gha.success) setGhAssignments(gha.data);
    if (med.success) setMedicalFacilities(med.data);
  };

  useEffect(() => {
    if (tab === "attendance") fetch(teaUrl(`/estate/wage-totals?from=${range.from}&to=${range.to}`), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setWageTotals(d.data));
    if (tab === "payroll") fetch(teaUrl("/payroll"), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setPayroll(d.data));
    if (tab === "insurance") fetch(teaUrl("/worker-insurance"), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setInsurance(d.data));
    if (tab === "estates" || tab === "facilities") loadFacilities();
  }, [tab, range.from, range.to]);

  const addEstate = async () => {
    if (!estateForm.name) return;
    await fetch(teaUrl("/estates"), {
      method: "POST", headers: teaAuthHeaders(),
      body: JSON.stringify({ ...estateForm, supervisor_id: estateForm.supervisor_id || undefined, manager_id: estateForm.manager_id || undefined }),
    });
    setEstateForm({ name: "", acres: "", leaf_type: "", location: "", supervisor_id: "", manager_id: "" });
    loadFacilities();
  };
  const addFieldToEstate = async (estateId: string) => {
    if (!plotForm.name) return;
    await fetch(teaUrl("/estate/plots"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify({ ...plotForm, estate_id: estateId }) });
    setPlotForm({ name: "", area_hectares: "", estate_id: "" });
    load(); loadFacilities();
  };
  const addGuestHouse = async () => {
    if (!ghForm.name) return;
    await fetch(teaUrl("/guest-houses"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(ghForm) });
    setGhForm({ name: "", location: "", total_rooms: "1" }); loadFacilities();
  };
  const assignGuestHouse = async () => {
    if (!ghAssignForm.guest_house_id || !ghAssignForm.worker_id) return;
    await fetch(teaUrl("/guest-house-assignments"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(ghAssignForm) });
    setGhAssignForm({ guest_house_id: "", worker_id: "", room_number: "" }); loadFacilities();
  };
  const checkoutGuestHouse = async (assignmentId: string) => {
    await fetch(teaUrl(`/guest-house-assignments/${assignmentId}/checkout`), { method: "PUT", headers: teaAuthHeaders() });
    loadFacilities();
  };
  const addMedicalFacility = async () => {
    if (!medForm.name) return;
    await fetch(teaUrl("/medical-facilities"), {
      method: "POST", headers: teaAuthHeaders(),
      body: JSON.stringify({ ...medForm, pharmacist_id: medForm.pharmacist_id || undefined }),
    });
    setMedForm({ name: "", location: "", facility_type: "dispensary", pharmacist_id: "", contact_phone: "" });
    loadFacilities();
  };

  const addPlot = async () => {
    if (!plotForm.name) return;
    await fetch(teaUrl("/estate/plots"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(plotForm) });
    setPlotForm({ name: "", area_hectares: "", estate_id: "" }); load();
  };
  const addWorker = async () => {
    if (!workerForm.name || !workerForm.role) return;
    await fetch(teaUrl("/estate/workers"), {
      method: "POST", headers: teaAuthHeaders(),
      body: JSON.stringify({ ...workerForm, reports_to_id: workerForm.reports_to_id || undefined, plot_id: workerForm.plot_id || undefined }),
    });
    setWorkerForm(f => ({
      name: "", phone: "", department: f.department,
      role: (f.department === "factory" ? roleCatalog.factory : roleCatalog.estate)[0]?.value || "",
      employment_type: "permanent", plot_id: "", reports_to_id: "", daily_wage: "",
    }));
    load();
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
        <div className="w-10 h-10 bg-lime-50 border border-lime-100 rounded-xl flex items-center justify-center"><Tractor size={18} className="text-lime-600" /></div>
        <div><h1 className="text-xl font-bold text-gray-900 tracking-tight">Estate & Factory Workforce</h1><p className="text-gray-500 text-xs">Plots, estate & factory employees, attendance, wages, and insurance</p></div>
      </div>

      <div className="flex gap-1 mb-4 bg-white border border-gray-200 rounded-xl shadow-sm p-1 w-fit flex-wrap">
        {([["workers", "Workers & Plots"], ["estates", "Estates"], ["facilities", "Facilities"], ["attendance", "Attendance & Wages"], ["payroll", "Payroll"], ["insurance", "Insurance"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-1.5 rounded-lg text-xs transition-all ${tab === k ? "bg-white text-emerald-700 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-900"}`}>{l}</button>
        ))}
      </div>

      {tab === "workers" && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4">
            <p className="text-gray-500 text-xs mb-2">Add estate plot / field</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input placeholder="Plot name" value={plotForm.name} onChange={e => setPlotForm({ ...plotForm, name: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
              <input type="number" placeholder="Area (hectares)" value={plotForm.area_hectares} onChange={e => setPlotForm({ ...plotForm, area_hectares: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
              <select value={plotForm.estate_id} onChange={e => setPlotForm({ ...plotForm, estate_id: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
                <option value="">Estate (optional)...</option>
                {estates.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <button onClick={addPlot} className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors text-white rounded-lg text-sm font-medium"><Plus size={14} /> Add Plot</button>
            </div>
            {plots.length > 0 && <div className="flex flex-wrap gap-2 mt-3">{plots.map(p => <span key={p.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{p.name}{p.area_hectares ? ` — ${p.area_hectares}ha` : ""}{p.estate_name ? ` · ${p.estate_name}` : ""}</span>)}</div>}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4">
            <p className="text-gray-500 text-xs mb-2">Add estate or factory employee</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              <input placeholder="Name" value={workerForm.name} onChange={e => setWorkerForm({ ...workerForm, name: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
              <input placeholder="Phone" value={workerForm.phone} onChange={e => setWorkerForm({ ...workerForm, phone: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
              <select value={workerForm.department} onChange={e => {
                const dept = e.target.value;
                const list = dept === "factory" ? roleCatalog.factory : roleCatalog.estate;
                setWorkerForm({ ...workerForm, department: dept, role: list[0]?.value || "" });
              }} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
                <option value="estate">Estate</option>
                <option value="factory">Factory</option>
              </select>
              <select value={workerForm.role} onChange={e => setWorkerForm({ ...workerForm, role: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
                {(workerForm.department === "factory" ? roleCatalog.factory : roleCatalog.estate).map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <select value={workerForm.employment_type} onChange={e => setWorkerForm({ ...workerForm, employment_type: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
                {roleCatalog.employmentTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <select value={workerForm.plot_id} onChange={e => setWorkerForm({ ...workerForm, plot_id: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
                <option value="">Plot...</option>
                {plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={workerForm.reports_to_id} onChange={e => setWorkerForm({ ...workerForm, reports_to_id: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
                <option value="">Reports to...</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <input type="number" placeholder="Daily wage ₹" value={workerForm.daily_wage} onChange={e => setWorkerForm({ ...workerForm, daily_wage: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
              <button onClick={addWorker} className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors text-white rounded-lg text-sm font-medium"><Plus size={14} /> Add</button>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {workers.length === 0 ? <div className="p-8 text-center text-gray-600 text-sm">No estate or factory employees yet.</div> : (
              <table className="w-full"><tbody>
                {workers.map(w => (
                  <tr key={w.id} className="border-b border-gray-100">
                    <td className="px-4 py-3">
                      <p className="text-gray-900 text-sm font-medium">{w.name}</p>
                      <p className="text-gray-400 text-[11px] capitalize">{(w.employment_type || "permanent").replace("_", " ")}{w.reports_to_name ? ` · reports to ${w.reports_to_name}` : ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${w.department === "factory" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>{w.department || "estate"}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs capitalize">{(roleCatalog[(w.department === "factory" ? "factory" : "estate") as "estate" | "factory"].find(r => r.value === w.role)?.label) || w.role.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{w.plot_name || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">₹{w.daily_wage}/day</td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}

      {tab === "estates" && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4">
            <p className="text-gray-500 text-xs mb-2">Add tea estate</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
              <input placeholder="Estate name" value={estateForm.name} onChange={e => setEstateForm({ ...estateForm, name: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
              <input type="number" placeholder="Acres" value={estateForm.acres} onChange={e => setEstateForm({ ...estateForm, acres: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
              <input placeholder="Type of leaf (e.g. Orthodox, CTC)" value={estateForm.leaf_type} onChange={e => setEstateForm({ ...estateForm, leaf_type: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input placeholder="Location" value={estateForm.location} onChange={e => setEstateForm({ ...estateForm, location: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
              <select value={estateForm.supervisor_id} onChange={e => setEstateForm({ ...estateForm, supervisor_id: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
                <option value="">Supervisor...</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <select value={estateForm.manager_id} onChange={e => setEstateForm({ ...estateForm, manager_id: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
                <option value="">Manager...</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <button onClick={addEstate} className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors text-white rounded-lg text-sm font-medium"><Plus size={14} /> Add Estate</button>
            </div>
          </div>

          <div className="space-y-3">
            {estates.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center text-gray-600 text-sm">No tea estates added yet.</div>
            ) : estates.map(e => (
              <div key={e.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPinned size={16} className="text-lime-600" />
                    <p className="text-gray-900 font-semibold text-sm">{e.name}</p>
                    <span className="text-xs bg-lime-50 text-lime-700 px-2 py-0.5 rounded-full">{e.field_count} field{e.field_count === 1 ? "" : "s"}</span>
                  </div>
                  <div className="text-gray-500 text-xs">
                    {e.acres ? `${e.acres} acres` : "—"}{e.leaf_type ? ` · ${e.leaf_type}` : ""}{e.location ? ` · ${e.location}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span>Supervisor: {e.supervisor_name || "—"}</span>
                  <span>Manager: {e.manager_name || "—"}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {plots.filter(p => p.estate_id === e.id).map(p => (
                    <span key={p.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{p.name}{p.area_hectares ? ` — ${p.area_hectares}ha` : ""}</span>
                  ))}
                  {plots.filter(p => p.estate_id === e.id).length === 0 && <span className="text-xs text-gray-400">No fields assigned yet — add one from Workers &amp; Plots, or below.</span>}
                </div>
                <div className="flex gap-2 mt-3">
                  <input placeholder="New field name" value={plotForm.estate_id === e.id ? plotForm.name : ""} onFocus={() => setPlotForm(f => ({ ...f, estate_id: e.id }))}
                    onChange={ev => setPlotForm({ ...plotForm, name: ev.target.value, estate_id: e.id })}
                    className="flex-1 bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-1.5 text-xs text-gray-900" />
                  <input type="number" placeholder="ha" value={plotForm.estate_id === e.id ? plotForm.area_hectares : ""}
                    onChange={ev => setPlotForm({ ...plotForm, area_hectares: ev.target.value, estate_id: e.id })}
                    className="w-20 bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-1.5 text-xs text-gray-900" />
                  <button onClick={() => addFieldToEstate(e.id)} className="text-xs bg-lime-600/20 hover:bg-lime-600/30 text-lime-700 px-3 py-1.5 rounded-lg font-medium">Add Field</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "facilities" && (
        <div className="space-y-6">
          {/* Guest Houses */}
          <div>
            <p className="text-gray-700 text-sm font-semibold mb-2 flex items-center gap-1.5"><Home size={14} className="text-blue-600" /> Guest Houses</p>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input placeholder="Guest house name" value={ghForm.name} onChange={e => setGhForm({ ...ghForm, name: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
              <input placeholder="Location" value={ghForm.location} onChange={e => setGhForm({ ...ghForm, location: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
              <input type="number" placeholder="Total rooms" value={ghForm.total_rooms} onChange={e => setGhForm({ ...ghForm, total_rooms: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
              <button onClick={addGuestHouse} className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors text-white rounded-lg text-sm font-medium"><Plus size={14} /> Add</button>
            </div>
            {guestHouses.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {guestHouses.map(g => <span key={g.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{g.name}: {g.occupied_rooms}/{g.total_rooms} rooms occupied</span>)}
              </div>
            )}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select value={ghAssignForm.guest_house_id} onChange={e => setGhAssignForm({ ...ghAssignForm, guest_house_id: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
                <option value="">Guest house...</option>
                {guestHouses.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <select value={ghAssignForm.worker_id} onChange={e => setGhAssignForm({ ...ghAssignForm, worker_id: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
                <option value="">Worker...</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <input placeholder="Room #" value={ghAssignForm.room_number} onChange={e => setGhAssignForm({ ...ghAssignForm, room_number: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
              <button onClick={assignGuestHouse} className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors text-white rounded-lg text-sm font-medium"><Plus size={14} /> Assign Worker</button>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {ghAssignments.length === 0 ? <div className="p-6 text-center text-gray-600 text-sm">No active guest house assignments.</div> : (
                <table className="w-full"><tbody>
                  {ghAssignments.map(a => (
                    <tr key={a.id} className="border-b border-gray-100">
                      <td className="px-4 py-2.5 text-gray-900 text-sm">{a.worker_name}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{a.guest_house_name}{a.room_number ? ` · Room ${a.room_number}` : ""}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">Since {new Date(a.check_in_date).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => checkoutGuestHouse(a.id)} className="flex items-center gap-1 ml-auto text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg"><LogOut size={11} /> Check Out</button>
                      </td>
                    </tr>
                  ))}
                </tbody></table>
              )}
            </div>
          </div>

          {/* Medical Facilities */}
          <div>
            <p className="text-gray-700 text-sm font-semibold mb-2 flex items-center gap-1.5"><Stethoscope size={14} className="text-red-600" /> Medical Facilities</p>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
              <input placeholder="Facility name" value={medForm.name} onChange={e => setMedForm({ ...medForm, name: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
              <input placeholder="Location" value={medForm.location} onChange={e => setMedForm({ ...medForm, location: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
              <select value={medForm.facility_type} onChange={e => setMedForm({ ...medForm, facility_type: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
                <option value="dispensary">Dispensary</option><option value="clinic">Clinic</option><option value="hospital">Hospital</option>
              </select>
              <select value={medForm.pharmacist_id} onChange={e => setMedForm({ ...medForm, pharmacist_id: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
                <option value="">Pharmacist...</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <button onClick={addMedicalFacility} className="flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 shadow-sm transition-colors text-white rounded-lg text-sm font-medium"><Plus size={14} /> Add</button>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {medicalFacilities.length === 0 ? <div className="p-6 text-center text-gray-600 text-sm">No medical facilities added yet.</div> : (
                <table className="w-full"><tbody>
                  {medicalFacilities.map(m => (
                    <tr key={m.id} className="border-b border-gray-100">
                      <td className="px-4 py-2.5 text-gray-900 text-sm">{m.name}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs capitalize">{m.facility_type}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{m.location || "—"}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">Pharmacist: {m.pharmacist_name || "—"}</td>
                    </tr>
                  ))}
                </tbody></table>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "attendance" && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select value={attForm.worker_id} onChange={e => setAttForm({ ...attForm, worker_id: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
              <option value="">Worker...</option>
              {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <input type="date" value={attForm.attendance_date} onChange={e => setAttForm({ ...attForm, attendance_date: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
            <select value={attForm.status} onChange={e => setAttForm({ ...attForm, status: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
              <option value="present">Present</option><option value="absent">Absent</option><option value="half_day">Half day</option>
            </select>
            <button onClick={markAttendance} className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors text-white rounded-lg text-sm font-medium"><CalendarCheck size={14} /> Mark</button>
          </div>
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
            <span>Period:</span>
            <input type="date" value={range.from} onChange={e => setRange({ ...range, from: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-2 py-1 text-gray-900" />
            <span>to</span>
            <input type="date" value={range.to} onChange={e => setRange({ ...range, to: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-2 py-1 text-gray-900" />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {wageTotals.length === 0 ? <div className="p-8 text-center text-gray-600 text-sm">No attendance in this period.</div> : (
              <table className="w-full"><tbody>
                {wageTotals.map(w => (
                  <tr key={w.worker_id} className="border-b border-gray-100">
                    <td className="px-4 py-3 text-gray-900 text-sm">{w.worker_name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{w.days_present} present / {w.days_absent} absent</td>
                    <td className="px-4 py-3 text-green-600 text-sm font-medium">₹{w.total_wage}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => generatePayroll(w.worker_id)} className="text-xs bg-green-600/20 hover:bg-green-600/30 text-green-600 px-3 py-1.5 rounded-lg">Generate Payroll</button>
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
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select value={payrollForm.worker_id} onChange={e => setPayrollForm({ ...payrollForm, worker_id: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
              <option value="">Worker...</option>
              {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <input type="date" value={payrollForm.period_start} onChange={e => setPayrollForm({ ...payrollForm, period_start: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
            <input type="date" value={payrollForm.period_end} onChange={e => setPayrollForm({ ...payrollForm, period_end: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
            <button onClick={() => generatePayroll()} className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors text-white rounded-lg text-sm font-medium"><Wallet size={14} /> Generate</button>
          </div>
          <p className="text-gray-600 text-xs mb-3">Simplified EPF (12%) / ESI (0.75% under ₹21,000) — review against a compliance professional before real statutory use.</p>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {payroll.length === 0 ? <div className="p-8 text-center text-gray-600 text-sm">No payroll runs yet.</div> : (
              <table className="w-full"><tbody>
                {payroll.map(p => (
                  <tr key={p.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 text-gray-900 text-sm">{p.worker_name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.period_start} → {p.period_end}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">Gross ₹{p.gross_wage} − EPF ₹{p.epf} − ESI ₹{p.esi}</td>
                    <td className="px-4 py-3 text-green-600 text-sm font-medium">₹{p.net_pay}</td>
                    <td className="px-4 py-3 text-right">
                      {p.status === "paid" ? <span className="text-xs text-green-600">Paid</span> : (
                        <button onClick={() => markPaid(p.id)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg">Mark Paid</button>
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
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <select value={insForm.worker_id} onChange={e => setInsForm({ ...insForm, worker_id: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
              <option value="">Worker...</option>
              {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <select value={insForm.type} onChange={e => setInsForm({ ...insForm, type: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900">
              <option value="group_health">Group Health</option><option value="accident">Accident</option><option value="checkup">Medical Checkup</option>
            </select>
            <input placeholder="Provider" value={insForm.provider} onChange={e => setInsForm({ ...insForm, provider: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
            <input type="date" placeholder="Expiry" value={insForm.expiry_date} onChange={e => setInsForm({ ...insForm, expiry_date: e.target.value })} className="bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900" />
            <button onClick={addInsurance} className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors text-white rounded-lg text-sm font-medium"><ShieldCheck size={14} /> Add</button>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {insurance.length === 0 ? <div className="p-8 text-center text-gray-600 text-sm">No worker insurance records yet.</div> : (
              <table className="w-full"><tbody>
                {insurance.map(i => (
                  <tr key={i.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 text-gray-900 text-sm">{i.worker_name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs capitalize">{i.type.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{i.provider || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{i.expiry_date || i.next_checkup_date || "—"}</td>
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
