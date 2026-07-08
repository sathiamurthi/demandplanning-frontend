"use client";
import { useState, useEffect } from "react";
import {
  Rocket, CheckCircle, XCircle, Loader2, Save, Sparkles,
  Users, GraduationCap, Briefcase, Star, Search, Download,
  Shield, Clock, Brain, RefreshCw, Filter,
} from "lucide-react";

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

interface C360User {
  id: string; name: string; email: string; phone?: string;
  role: "student" | "recruiter" | "mentor";
  college?: string; year?: string;
  premium: boolean; createdAt: string;
}

function clrClass(name: string) {
  const colors = ["bg-violet-500","bg-teal-500","bg-blue-500","bg-rose-500","bg-amber-500","bg-indigo-500","bg-emerald-500","bg-pink-500"];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

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

function getActivity(userId: string): number {
  try {
    const month = new Date().toISOString().slice(0, 7);
    const raw = localStorage.getItem(`c360_iq_${userId}_${month}`);
    return raw ? JSON.parse(raw) : 0;
  } catch { return 0; }
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
function UsersTab() {
  const [users, setUsers]       = useState<C360User[]>([]);
  const [search, setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState<"all"|"student"|"recruiter"|"mentor">("all");
  const [premFilter, setPremFilter] = useState<"all"|"premium"|"free">("all");
  const [session, setSession]   = useState<C360User | null>(null);

  const load = () => {
    try {
      const raw = localStorage.getItem("college360_users");
      const arr: C360User[] = raw ? JSON.parse(raw) : [];
      arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setUsers(arr);
    } catch { setUsers([]); }
    try {
      const sess = localStorage.getItem("college360_session");
      setSession(sess ? JSON.parse(sess) : null);
    } catch { setSession(null); }
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (premFilter === "premium" && !u.premium) return false;
    if (premFilter === "free" && u.premium) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.college || "").toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total:     users.length,
    students:  users.filter(u => u.role === "student").length,
    recruiters:users.filter(u => u.role === "recruiter").length,
    mentors:   users.filter(u => u.role === "mentor").length,
    premium:   users.filter(u => u.premium).length,
  };

  const exportCSV = () => {
    const rows = [
      ["Name","Email","Role","Premium","College","Year","Phone","Registered"],
      ...filtered.map(u => [u.name, u.email, u.role, u.premium?"Yes":"No", u.college||"", u.year||"", u.phone||"", u.createdAt]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `college360_users_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label:"Total Users",  value:stats.total,      icon:<Users size={16}/>,          color:"text-violet-500" },
          { label:"Students",     value:stats.students,   icon:<GraduationCap size={16}/>,  color:"text-teal-500" },
          { label:"Recruiters",   value:stats.recruiters, icon:<Briefcase size={16}/>,      color:"text-blue-500" },
          { label:"Mentors",      value:stats.mentors,    icon:<Brain size={16}/>,           color:"text-indigo-500" },
          { label:"Premium",      value:stats.premium,    icon:<Star size={16}/>,            color:"text-amber-500" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col gap-1">
            <span className={s.color}>{s.icon}</span>
            <span className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Active session banner */}
      {session && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"/>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            <span className="font-bold">{session.name}</span> ({session.email}) is currently logged in as <span className="font-semibold capitalize">{session.role}</span>
            {session.premium && <span className="ml-1.5 bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold">PREMIUM</span>}
          </p>
        </div>
      )}

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex-1 min-w-[180px]">
          <Search size={13} className="text-gray-400 shrink-0"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, college…" className="text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none w-full"/>
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={12} className="text-gray-400"/>
          {(["all","student","recruiter","mentor"] as const).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition capitalize ${roleFilter === r ? "bg-violet-600 text-white border-violet-600" : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-violet-300"}`}>
              {r === "all" ? "All roles" : r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {(["all","premium","free"] as const).map(p => (
            <button key={p} onClick={() => setPremFilter(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition capitalize ${premFilter === p ? "bg-amber-500 text-white border-amber-500" : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-amber-300"}`}>
              {p === "all" ? "All tiers" : p}
            </button>
          ))}
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition" title="Refresh">
          <RefreshCw size={14} className="text-gray-500"/>
        </button>
        {filtered.length > 0 && (
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 rounded-lg text-xs font-semibold text-white transition">
            <Download size={13}/>Export CSV
          </button>
        )}
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <Users size={32} className="text-gray-300 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-gray-500">No College360 users yet</p>
          <p className="text-xs text-gray-400 mt-1">Users appear here when they register on /college360 in this browser</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center">
          <p className="text-sm text-gray-500">No users match your filters</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">College</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Phone</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">AI Usage</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Registered</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(u => {
                  const isActive = session?.id === u.id;
                  const aiUsage = getActivity(u.id);
                  return (
                    <tr key={u.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition ${isActive ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${clrClass(u.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {u.name[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{u.name}</p>
                              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Currently active"/>}
                            </div>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${roleColor(u.role)}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-700 dark:text-gray-300">{u.college || <span className="text-gray-300">—</span>}</p>
                        {u.year && <p className="text-[10px] text-gray-400">{u.year}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">{u.phone || <span className="text-gray-300">—</span>}</p>
                      </td>
                      <td className="px-4 py-3">
                        {aiUsage > 0 ? (
                          <span className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 font-semibold">
                            <Brain size={11}/>{aiUsage} this month
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Clock size={11}/>{fmt(u.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.premium ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-2 py-0.5 rounded-full">
                            <Star size={9}/>Premium
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">Free</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-400 text-center">
        College360 auth is localStorage-based — this shows all users registered in this browser session. Users on other devices are not visible here.
      </p>
    </div>
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
