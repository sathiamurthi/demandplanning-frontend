"use client";
import { useState, useEffect } from "react";
import {
  Rocket, CheckCircle, XCircle, Loader2, Save, Sparkles,
  Users, Shield,
} from "lucide-react";
import AccountTable from "../components/AccountTable";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "https://demandplanning-backend.onrender.com";

const ALL_TRACKS = [
  { id: "dev",       label: "Software Dev",   emoji: "💻" },
  { id: "data",      label: "Data & AI",      emoji: "🤖" },
  { id: "design",    label: "Design & UX",    emoji: "🎨" },
  { id: "qa",        label: "Testing & QA",   emoji: "🧪" },
  { id: "cloud",     label: "Cloud & DevOps", emoji: "☁️" },
  { id: "finance",   label: "Finance",        emoji: "💰" },
  { id: "marketing", label: "Marketing",      emoji: "📣" },
  { id: "product",   label: "Product",        emoji: "🗺️" },
  { id: "content",   label: "Content",        emoji: "✍️" },
  { id: "security",  label: "Cybersecurity",  emoji: "🔐" },
];

function roleColor(role: string) {
  if (role === "student")   return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300";
  if (role === "recruiter") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  if (role === "mentor")    return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300";
  return "bg-gray-100 text-gray-600";
}

function fmt(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
  } catch { return iso; }
}

// ── Config Tab ─────────────────────────────────────────────────────────────────
function ConfigTab() {
  const [enabled, setEnabled] = useState(true);
  const [freeAI, setFreeAI]   = useState(false);
  const [tracks, setTracks]   = useState<string[]>(ALL_TRACKS.map(t => t.id));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [status, setStatus]   = useState<"idle"|"ok"|"err">("idle");

  useEffect(() => {
    fetch(`${API}/v1/superadmin/platform-config`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("nexus_superadmin_token") || ""}` }
    })
      .then(r => r.json())
      .then(d => {
        const cfg = d?.data?.college360;
        if (cfg) {
          setEnabled(cfg.enabled ?? true);
          setFreeAI(cfg.free_ai_enabled ?? false);
          setTracks(cfg.enabled_tracks ?? ALL_TRACKS.map(t => t.id));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => setTracks(t => t.includes(id) ? t.filter(x => x !== id) : [...t, id]);

  const save = async () => {
    setSaving(true); setStatus("idle");
    try {
      const r = await fetch(`${API}/v1/superadmin/platform-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("nexus_superadmin_token") || ""}` },
        body: JSON.stringify({ key: "college360", value: { enabled, free_ai_enabled: freeAI, enabled_tracks: tracks, all_tracks: ALL_TRACKS.map(t => t.id) } })
      });
      setStatus(r.ok ? "ok" : "err");
    } catch { setStatus("err"); }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-violet-400" size={28}/></div>;

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between">
          <div><p className="font-semibold text-gray-900 dark:text-white">College360 Platform</p><p className="text-xs text-gray-500 mt-0.5">Enable/disable the entire /college360 page</p></div>
          <button onClick={() => setEnabled(e => !e)} className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? "bg-violet-600" : "bg-gray-300 dark:bg-gray-600"}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? "left-7" : "left-1"}`}/>
          </button>
        </div>
      </div>

      <div className={`rounded-xl border p-5 ${freeAI ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-500/40" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Sparkles size={16} className="text-yellow-500"/>Free AI Access — MVP Mode</p>
            <p className="text-xs text-gray-500 mt-0.5">Removes the premium gate for AI Profile Builder — every user can use AI features</p>
            {freeAI && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 font-semibold">Active — all students can use AI now. Disable before paid launch.</p>}
          </div>
          <button onClick={() => setFreeAI(f => !f)} className={`shrink-0 w-12 h-6 rounded-full transition-colors relative ${freeAI ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${freeAI ? "left-7" : "left-1"}`}/>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-gray-900 dark:text-white">Visible Domains / Tracks</p>
          <button onClick={() => setTracks(tracks.length === ALL_TRACKS.length ? [] : ALL_TRACKS.map(t => t.id))} className="text-xs text-violet-600 hover:underline">
            {tracks.length === ALL_TRACKS.length ? "Disable all" : "Enable all"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ALL_TRACKS.map(t => (
            <button key={t.id} onClick={() => toggle(t.id)} className={`flex items-center gap-2 p-3 rounded-lg border transition ${tracks.includes(t.id) ? "bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-500/40" : "bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600"}`}>
              <span className="text-lg">{t.emoji}</span>
              <span className={`text-sm font-medium ${tracks.includes(t.id) ? "text-violet-700 dark:text-violet-300" : "text-gray-500"}`}>{t.label}</span>
              {tracks.includes(t.id) ? <CheckCircle size={14} className="text-violet-500 ml-auto"/> : <XCircle size={14} className="text-gray-300 ml-auto"/>}
            </button>
          ))}
        </div>
      </div>

      {tracks.length > 0 && (
        <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-500/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-2">Students see these domains:</p>
          <div className="flex flex-wrap gap-1">{ALL_TRACKS.filter(t => tracks.includes(t.id)).map(t => <span key={t.id} className="text-xs bg-violet-100 dark:bg-violet-800/40 text-violet-700 dark:text-violet-300 rounded px-2 py-0.5">{t.emoji} {t.label}</span>)}</div>
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

// ── Users Tab ──────────────────────────────────────────────────────────────────
// Was previously reading localStorage.getItem("college360_users") — a
// leftover from before College360 had a real backend, so it only ever
// showed whatever was in the SUPERADMIN'S OWN browser, never actual
// registered users. College360 has had a real c360_users table (bcrypt +
// JWT auth) for a while now; this pulls from there instead.
function UsersTab() {
  return (
    <AccountTable
      listUrl="/v1/superadmin/college360/users"
      actionBase="/v1/superadmin/college360/users"
      emptyLabel="No College360 users yet."
      columns={[
        { key: "name", label: "Name", render: r => <>{r.name}<p className="text-xs text-gray-400">{r.email}</p></> },
        { key: "role", label: "Role", render: r => <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${roleColor(r.role)}`}>{r.role}</span> },
        { key: "college", label: "College" },
        { key: "phone", label: "Phone" },
        { key: "premium", label: "Plan", render: r => r.premium ? <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Premium</span> : <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Free</span> },
        { key: "created_at", label: "Registered", render: r => fmt(r.created_at) },
      ]}
    />
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function SuperAdminCollege360() {
  const [tab, setTab] = useState<"users"|"config">("users");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center">
          <Rocket className="text-violet-400" size={20}/>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">College360</h1>
          <p className="text-xs text-gray-500">User registrations and platform configuration</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 w-fit">
        {([
          { id:"users",  label:"Users",         icon:<Users size={13}/> },
          { id:"config", label:"Configuration", icon:<Shield size={13}/> },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${tab === t.id ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === "users"  && <UsersTab/>}
      {tab === "config" && <ConfigTab/>}
    </div>
  );
}
