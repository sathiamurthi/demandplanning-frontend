"use client";
import { useState, useEffect } from "react";
import { Rocket, CheckCircle, XCircle, Loader2, Save, RefreshCw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "https://demandplanning-backend.onrender.com";
const ALL_TRACKS = [
  { id: "dev",      label: "Software Dev",   emoji: "💻" },
  { id: "data",     label: "Data & AI",      emoji: "🤖" },
  { id: "design",   label: "Design & UX",    emoji: "🎨" },
  { id: "qa",       label: "Testing & QA",   emoji: "🧪" },
  { id: "cloud",    label: "Cloud & DevOps", emoji: "☁️" },
  { id: "finance",  label: "Finance",        emoji: "💰" },
  { id: "marketing",label: "Marketing",      emoji: "📣" },
  { id: "product",  label: "Product",        emoji: "🗺️" },
  { id: "content",  label: "Content",        emoji: "✍️" },
  { id: "security", label: "Cybersecurity",  emoji: "🔐" },
];

export default function SuperAdminCollege360() {
  const [enabled, setEnabled] = useState(true);
  const [tracks, setTracks] = useState<string[]>(ALL_TRACKS.map(t => t.id));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle"|"ok"|"err">("idle");

  useEffect(() => {
    fetch(`${API}/v1/superadmin/platform-config`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("nexus_superadmin_token") || ""}` }
    })
      .then(r => r.json())
      .then(d => {
        const cfg = d?.data?.college360;
        if (cfg) {
          setEnabled(cfg.enabled ?? true);
          setTracks(cfg.enabled_tracks ?? ALL_TRACKS.map(t => t.id));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => setTracks(t => t.includes(id) ? t.filter(x=>x!==id) : [...t, id]);

  const save = async () => {
    setSaving(true); setStatus("idle");
    try {
      const r = await fetch(`${API}/v1/superadmin/platform-config`, {
        method: "PUT",
        headers: { "Content-Type":"application/json", Authorization: `Bearer ${localStorage.getItem("nexus_superadmin_token")||""}` },
        body: JSON.stringify({ key:"college360", value:{ enabled, enabled_tracks: tracks, all_tracks: ALL_TRACKS.map(t=>t.id) } })
      });
      setStatus(r.ok ? "ok" : "err");
    } catch { setStatus("err"); }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-violet-400" size={28}/></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center"><Rocket className="text-violet-400" size={20}/></div>
        <div><h1 className="text-xl font-bold text-gray-900 dark:text-white">College360 Control</h1><p className="text-xs text-gray-500">Toggle the platform and which domains are visible to students</p></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div><p className="font-semibold text-gray-900 dark:text-white">College360 Platform</p><p className="text-xs text-gray-500 mt-0.5">Enable/disable the entire /college360 page</p></div>
          <button onClick={()=>setEnabled(e=>!e)} className={`w-12 h-6 rounded-full transition-colors relative ${enabled?"bg-violet-600":"bg-gray-300 dark:bg-gray-600"}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled?"left-7":"left-1"}`}/>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-gray-900 dark:text-white">Visible Domains / Tracks</p>
          <button onClick={()=>setTracks(tracks.length===ALL_TRACKS.length?[]:ALL_TRACKS.map(t=>t.id))} className="text-xs text-violet-600 hover:underline">{tracks.length===ALL_TRACKS.length?"Disable all":"Enable all"}</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ALL_TRACKS.map(t => (
            <button key={t.id} onClick={()=>toggle(t.id)} className={`flex items-center gap-2 p-3 rounded-lg border transition ${tracks.includes(t.id)?"bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-500/40":"bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600"}`}>
              <span className="text-lg">{t.emoji}</span>
              <span className={`text-sm font-medium ${tracks.includes(t.id)?"text-violet-700 dark:text-violet-300":"text-gray-500"}`}>{t.label}</span>
              {tracks.includes(t.id) ? <CheckCircle size={14} className="text-violet-500 ml-auto"/> : <XCircle size={14} className="text-gray-300 ml-auto"/>}
            </button>
          ))}
        </div>
      </div>

      {tracks.length > 0 && (
        <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-500/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-2">Live Preview — students see these domains:</p>
          <div className="flex flex-wrap gap-1">{ALL_TRACKS.filter(t=>tracks.includes(t.id)).map(t=><span key={t.id} className="text-xs bg-violet-100 dark:bg-violet-800/40 text-violet-700 dark:text-violet-300 rounded px-2 py-0.5">{t.emoji} {t.label}</span>)}</div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition">
          {saving ? <Loader2 size={15} className="animate-spin"/> : <Save size={15}/>}Save Changes
        </button>
        {status === "ok" && <span className="text-sm text-emerald-500 flex items-center gap-1"><CheckCircle size={14}/>Saved</span>}
        {status === "err" && <span className="text-sm text-red-400 flex items-center gap-1"><XCircle size={14}/>Save failed</span>}
      </div>
    </div>
  );
}
