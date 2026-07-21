"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Plus, Zap, Sparkles, AlertOctagon } from "lucide-react";
import { teaAuthHeaders, teaUrl } from "@/lib/tea-api";

interface Facility { id: string; name: string; type: string; authority: string | null; renewal_date: string | null; status: string; }
interface Utility { id: string; type: string; usage_date: string; units_consumed: number | null; cost: number | null; }
interface CalendarItem { source: string; type: string; date: string; label: string; status: string; }

export default function CompliancePage() {
  const [tab, setTab] = useState<"facilities" | "utilities" | "calendar">("calendar");
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [calendar, setCalendar] = useState<CalendarItem[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const [facForm, setFacForm] = useState({ name: "", type: "pollution_control", authority: "", renewal_date: "" });
  const [utilForm, setUtilForm] = useState({ type: "electricity", usage_date: new Date().toISOString().slice(0, 10), units_consumed: "", cost: "" });

  const loadFacilities = () => fetch(teaUrl("/facilities"), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setFacilities(d.data));
  const loadUtilities = () => fetch(teaUrl("/facility-utilities"), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setUtilities(d.data));
  const loadCalendar = () => fetch(teaUrl("/compliance/calendar"), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setCalendar(d.data));

  useEffect(() => { loadFacilities(); loadUtilities(); loadCalendar(); }, []);

  const addFacility = async () => {
    if (!facForm.name) return;
    await fetch(teaUrl("/facilities"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(facForm) });
    setFacForm({ name: "", type: "pollution_control", authority: "", renewal_date: "" });
    loadFacilities(); loadCalendar();
  };
  const addUtility = async () => {
    if (!utilForm.units_consumed) return;
    await fetch(teaUrl("/facility-utilities"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(utilForm) });
    setUtilForm({ type: "electricity", usage_date: new Date().toISOString().slice(0, 10), units_consumed: "", cost: "" });
    loadUtilities();
  };
  const getAiSummary = async () => {
    setLoadingAi(true);
    const r = await fetch(teaUrl("/ai/compliance-alerts"), { headers: teaAuthHeaders() }).then(r => r.json());
    if (r.success) setAiSummary(r.data.summary);
    else setAiSummary(r.error || "Could not load AI summary.");
    setLoadingAi(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center"><ShieldCheck size={18} className="text-blue-400" /></div>
        <div><h1 className="text-lg font-bold text-white">Compliance & Facility</h1><p className="text-white/40 text-xs">Licenses, renewals, and utility usage — one calendar across vehicles, machines, workers, facility</p></div>
      </div>

      <div className="flex gap-1 mb-4 bg-[#161a23] border border-white/8 rounded-xl p-1 w-fit">
        {([["calendar", "Renewal Calendar"], ["facilities", "Facilities & Licenses"], ["utilities", "Utilities"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-1.5 rounded-lg text-xs transition-all ${tab === k ? "bg-green-600/20 text-green-400" : "text-white/40 hover:text-white"}`}>{l}</button>
        ))}
      </div>

      {tab === "calendar" && (
        <>
          <button onClick={getAiSummary} disabled={loadingAi} className="mb-4 flex items-center gap-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg text-sm font-medium px-4 py-2 disabled:opacity-50">
            <Sparkles size={14} /> {loadingAi ? "Summarizing…" : "AI Summary"}
          </button>
          {aiSummary && <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-4 text-sm text-purple-200">{aiSummary}</div>}
          <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
            {calendar.length === 0 ? <div className="p-8 text-center text-white/30 text-sm">Nothing due for renewal in the next 30 days.</div> : (
              <table className="w-full"><tbody>
                {calendar.map((c, idx) => (
                  <tr key={idx} className="border-b border-white/5">
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full uppercase ${c.status === "overdue" ? "bg-red-500/15 text-red-400" : "bg-yellow-500/15 text-yellow-400"}`}>{c.status.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3 text-white text-sm">{c.label}</td>
                    <td className="px-4 py-3 text-white/50 text-xs capitalize">{c.type?.replace("_", " ")} ({c.source})</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{c.date ? new Date(c.date).toLocaleDateString("en-IN") : "—"}</td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}

      {tab === "facilities" && (
        <>
          <div className="bg-[#161a23] border border-white/8 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <input placeholder="Name" value={facForm.name} onChange={e => setFacForm({ ...facForm, name: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <select value={facForm.type} onChange={e => setFacForm({ ...facForm, type: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              {["pollution_control", "fssai", "factory_license", "fire_safety", "other"].map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
            <input placeholder="Authority" value={facForm.authority} onChange={e => setFacForm({ ...facForm, authority: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <input type="date" value={facForm.renewal_date} onChange={e => setFacForm({ ...facForm, renewal_date: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <button onClick={addFacility} className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"><Plus size={14} /> Add</button>
          </div>
          <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
            {facilities.length === 0 ? <div className="p-8 text-center text-white/30 text-sm"><AlertOctagon size={28} className="mx-auto mb-2 opacity-20" />No facility licenses on record yet.</div> : (
              <table className="w-full"><tbody>
                {facilities.map(f => (
                  <tr key={f.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white text-sm font-medium">{f.name}</td>
                    <td className="px-4 py-3 text-white/50 text-xs capitalize">{f.type.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{f.authority || "—"}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{f.renewal_date ? new Date(f.renewal_date).toLocaleDateString("en-IN") : "—"}</td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}

      {tab === "utilities" && (
        <>
          <div className="bg-[#161a23] border border-white/8 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <select value={utilForm.type} onChange={e => setUtilForm({ ...utilForm, type: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              {["electricity", "water", "diesel_generator"].map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
            <input type="date" value={utilForm.usage_date} onChange={e => setUtilForm({ ...utilForm, usage_date: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <input type="number" placeholder="Units consumed" value={utilForm.units_consumed} onChange={e => setUtilForm({ ...utilForm, units_consumed: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <input type="number" placeholder="Cost ₹" value={utilForm.cost} onChange={e => setUtilForm({ ...utilForm, cost: e.target.value })} className="bg-[#0f1218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <button onClick={addUtility} className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"><Zap size={14} /> Log</button>
          </div>
          <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
            {utilities.length === 0 ? <div className="p-8 text-center text-white/30 text-sm">No utility usage logged yet.</div> : (
              <table className="w-full"><tbody>
                {utilities.map(u => (
                  <tr key={u.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white/50 text-xs">{new Date(u.usage_date).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3 text-white text-sm capitalize">{u.type.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{u.units_consumed ?? "—"} units</td>
                    <td className="px-4 py-3 text-white/50 text-xs">₹{u.cost ?? "—"}</td>
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
