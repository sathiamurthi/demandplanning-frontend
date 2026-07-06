"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap, CheckCircle2, Save, Loader2,
  ToggleLeft, ToggleRight, Eye, AlertCircle,
  School, Building2, University, BookOpen, Globe, Wrench,
} from "lucide-react";

const ALL_CATEGORIES = [
  {
    id: "School",
    label: "School (K-12)",
    emoji: "🏫",
    desc: "Primary, middle and senior secondary schools — CBSE, ICSE, State Board, KVS, NVS",
  },
  {
    id: "College",
    label: "College",
    emoji: "🎓",
    desc: "Degree colleges — B.A, B.Com, B.Sc, B.Tech, BBA, BCA and professional UG courses",
  },
  {
    id: "University",
    label: "University",
    emoji: "🏛️",
    desc: "Deemed, central and state universities offering UG, PG, PhD and research programs",
  },
  {
    id: "Coaching",
    label: "Coaching Institute",
    emoji: "📐",
    desc: "JEE, NEET, CAT, UPSC, CLAT, CET and other entrance exam preparation centres",
  },
  {
    id: "Online Course",
    label: "Online Course / EdTech",
    emoji: "💻",
    desc: "Online platforms and EdTech companies offering live, recorded and hybrid courses",
  },
  {
    id: "Vocational",
    label: "Vocational / Skill Training",
    emoji: "🛠️",
    desc: "ITI, polytechnic, NSDC-aligned skill development and certification programs",
  },
];

function authHeader() {
  if (typeof window === "undefined") return {};
  const tok = localStorage.getItem("token") || "";
  return { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" };
}

export default function Edu360SettingsPage() {
  const [enabled, setEnabled] = useState<string[]>(["School","College","University","Coaching","Online Course"]);
  const [boardOn, setBoardOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [err,     setErr]     = useState("");

  useEffect(() => {
    fetch("/v1/superadmin/platform-config", { headers: authHeader() as HeadersInit })
      .then(r => r.json())
      .then(d => {
        const cfg = d.data?.edu360 || {};
        setEnabled(cfg.enabled_categories || ["School","College","University","Coaching","Online Course"]);
        setBoardOn(cfg.enabled !== false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (cat: string) => {
    setEnabled(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    setSaved(false);
  };

  const save = async () => {
    setSaving(true); setErr(""); setSaved(false);
    try {
      const r = await fetch("/v1/superadmin/platform-config", {
        method: "PUT",
        headers: authHeader() as HeadersInit,
        body: JSON.stringify({
          key: "edu360",
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
          <GraduationCap size={22} className="text-orange-500"/> Edu360 Settings
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Control which institution categories appear on the /edu360 public page and in institution listing forms.
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
              <p className="font-bold text-gray-900">Edu360 Platform Status</p>
              <p className="text-xs text-gray-500 mt-0.5">Enable or disable the entire /edu360 page for public visitors</p>
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
                <p className="text-xs text-gray-500 mt-0.5">
                  {enabled.length} of {ALL_CATEGORIES.length} enabled · Only enabled categories appear as filters and in the "List Institution" form
                </p>
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
                        <p className="text-xs text-gray-400 mt-0.5">{cat.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
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
              <Eye size={12}/> Preview — filters shown to students and parents on /edu360
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-700">All Types</span>
              {enabled.map(c => (
                <span key={c} className="bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-700">{c}</span>
              ))}
              {enabled.length === 0 && <span className="text-xs text-orange-600 italic">No categories enabled — institution listings will not be visible</span>}
            </div>
          </div>

          {err && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle size={14}/> {err}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-sm transition">
              {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
              {saving ? "Saving…" : "Save Settings"}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-semibold">
                <CheckCircle2 size={16}/> Saved — Edu360 updated
              </span>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-700">How this works</p>
            <p>• Enabled categories appear in the sidebar filter on <strong>/edu360</strong> and in the "List Institution" dropdown.</p>
            <p>• Disabled categories are hidden from new listings and browsing — existing data is not affected.</p>
            <p>• Changes take effect immediately for new visitors (cached up to 30 seconds).</p>
          </div>
        </>
      )}
    </div>
  );
}
