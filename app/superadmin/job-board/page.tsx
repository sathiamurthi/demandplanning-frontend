"use client";

import { useEffect, useState } from "react";
import {
  Briefcase, CheckCircle2, XCircle, Save, Loader2,
  ToggleLeft, ToggleRight, Eye, AlertCircle, RefreshCw,
} from "lucide-react";

const ALL_CATEGORIES = [
  { id: "Education",    label: "Education",    emoji: "🎓", desc: "Teachers, lecturers, trainers, EdTech roles" },
  { id: "IT",           label: "IT / Software",emoji: "💻", desc: "Developers, designers, QA, DevOps, data roles" },
  { id: "EdTech",       label: "EdTech",       emoji: "📱", desc: "Online teaching, content creation, instructional design" },
  { id: "Finance",      label: "Finance",      emoji: "💰", desc: "CA, accountants, finance managers, bankers" },
  { id: "Healthcare",   label: "Healthcare",   emoji: "🏥", desc: "Doctors, nurses, healthcare administrators" },
  { id: "Marketing",    label: "Marketing",    emoji: "📣", desc: "Digital marketing, sales, brand management" },
  { id: "Engineering",  label: "Engineering",  emoji: "⚙️", desc: "Mechanical, civil, electrical engineering roles" },
];

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "https://demandplanning-backend.onrender.com";
function authHeader() {
  if (typeof window === "undefined") return {};
  const tok = localStorage.getItem("nexus_superadmin_token") || "";
  return { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" };
}

export default function JobBoardSettingsPage() {
  const [enabled,   setEnabled]   = useState<string[]>(["Education"]);
  const [boardOn,   setBoardOn]   = useState(true);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [err,       setErr]       = useState("");

  useEffect(() => {
    fetch(`${API}/v1/superadmin/platform-config`, { headers: authHeader() as HeadersInit })
      .then(r => r.json())
      .then(d => {
        const cfg = d.data?.job_board || {};
        setEnabled(cfg.enabled_categories || ["Education"]);
        setBoardOn(cfg.enabled !== false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (cat: string) => {
    setEnabled(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
    setSaved(false);
  };

  const save = async () => {
    setSaving(true); setErr(""); setSaved(false);
    try {
      const r = await fetch(`${API}/v1/superadmin/platform-config`, {
        method: "PUT",
        headers: authHeader() as HeadersInit,
        body: JSON.stringify({
          key: "job_board",
          value: {
            enabled: boardOn,
            enabled_categories: enabled,
            all_categories: ALL_CATEGORIES.map(c => c.id),
          },
        }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setErr(e.message);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Briefcase size={22} className="text-orange-500"/> Job Board Settings
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Control which job categories are visible to seekers and employers on the Nexus Talent board.
        </p>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
          <Loader2 size={24} className="animate-spin text-gray-300 mx-auto"/>
        </div>
      ) : (
        <>
          {/* Master toggle */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900">Job Board Status</p>
              <p className="text-xs text-gray-500 mt-0.5">Enable or disable the entire /jobs page for the public</p>
            </div>
            <button onClick={() => { setBoardOn(p => !p); setSaved(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition ${boardOn ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}>
              {boardOn ? <><ToggleRight size={18}/> Enabled</> : <><ToggleLeft size={18}/> Disabled</>}
            </button>
          </div>

          {/* Category toggles */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">Active Categories</p>
                <p className="text-xs text-gray-500 mt-0.5">{enabled.length} of {ALL_CATEGORIES.length} enabled · Only enabled categories appear in the job board filter and Post Job form</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEnabled(ALL_CATEGORIES.map(c => c.id)); setSaved(false); }}
                  className="text-xs text-orange-500 font-bold hover:underline">Enable All</button>
                <span className="text-gray-300">·</span>
                <button onClick={() => { setEnabled([]); setSaved(false); }}
                  className="text-xs text-gray-400 font-bold hover:underline">Disable All</button>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {ALL_CATEGORIES.map(cat => {
                const on = enabled.includes(cat.id);
                return (
                  <div key={cat.id} className={`flex items-center justify-between px-5 py-4 transition ${on ? "" : "opacity-60"}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cat.emoji}</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{cat.label}</p>
                        <p className="text-xs text-gray-400">{cat.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {on
                        ? <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full uppercase tracking-wide">Active</span>
                        : <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wide">Off</span>}
                      <button onClick={() => toggle(cat.id)}
                        className={`w-10 h-6 rounded-full transition-all relative ${on ? "bg-green-500" : "bg-gray-300"}`}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${on ? "left-5" : "left-1"}`}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-orange-700 uppercase tracking-wide mb-3">
              <Eye size={12}/> Preview — what job seekers will see
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-teal-700">All</span>
              {enabled.map(c => (
                <span key={c} className="bg-white border border-teal-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-teal-700">{c}</span>
              ))}
              {enabled.length === 0 && <span className="text-xs text-orange-600 italic">No categories enabled — job board will show no filter options</span>}
            </div>
          </div>

          {/* Errors */}
          {err && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle size={14}/> {err}
            </div>
          )}

          {/* Save */}
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-sm transition">
              {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
              {saving ? "Saving…" : "Save Settings"}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-semibold">
                <CheckCircle2 size={16}/> Saved — job board updated
              </span>
            )}
          </div>

          {/* Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-700">How this works</p>
            <p>• Enabled categories appear in the sidebar filter on <strong>/jobs</strong> and in the "Post Job" form dropdown.</p>
            <p>• Disabled categories are hidden from new job posting and browsing — existing listings are not deleted.</p>
            <p>• Changes take effect immediately for new visitors (cached up to 30 seconds).</p>
          </div>
        </>
      )}
    </div>
  );
}
