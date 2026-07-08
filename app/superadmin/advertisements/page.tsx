"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Megaphone, Plus, Edit2, Trash2, X, MousePointerClick, Eye,
  ToggleLeft, ToggleRight, CheckCircle, Info, Calendar,
} from "lucide-react";
import type { Ad } from "@/components/AdBanner";

const STORE_KEY = "nexus_ads";
const PAGE_OPTIONS = ["jobs", "edu360", "college360", "explore"] as const;

const BG_PRESETS = [
  { label: "Violet → Indigo",  value: "linear-gradient(135deg,#7c3aed,#4f46e5)", light: true },
  { label: "Teal → Cyan",      value: "linear-gradient(135deg,#0f766e,#0891b2)", light: true },
  { label: "Rose → Pink",      value: "linear-gradient(135deg,#e11d48,#ec4899)", light: true },
  { label: "Amber → Orange",   value: "linear-gradient(135deg,#d97706,#ea580c)", light: true },
  { label: "Sky → Blue",       value: "linear-gradient(135deg,#0284c7,#1d4ed8)", light: true },
  { label: "Emerald → Green",  value: "linear-gradient(135deg,#059669,#16a34a)", light: true },
  { label: "Soft Amber",       value: "#fef3c7", light: false },
  { label: "Soft Violet",      value: "#ede9fe", light: false },
];

const EMPTY_FORM = {
  title: "", body: "", cta: "", ctaUrl: "",
  bg: BG_PRESETS[0].value, textLight: true,
  pages: [] as string[], active: true,
  validFrom: new Date().toISOString().slice(0, 10),
  validTo: new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10),
};

function load(): Ad[] {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); } catch { return []; }
}
function save(ads: Ad[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(ads));
}
function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function fmtDate(s: string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function adStatus(ad: Ad): "active" | "paused" | "expired" | "scheduled" {
  if (!ad.active) return "paused";
  const now = Date.now();
  if (ad.validTo && new Date(ad.validTo).getTime() < now) return "expired";
  if (ad.validFrom && new Date(ad.validFrom).getTime() > now) return "scheduled";
  return "active";
}
const STATUS_MAP = {
  active:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  paused:    "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  expired:   "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

type FormState = typeof EMPTY_FORM;

function AdForm({ initial, onSave, onCancel }: {
  initial: FormState; onSave: (f: FormState) => void; onCancel: () => void;
}) {
  const [f, setF] = useState(initial);
  const set = (k: keyof FormState, v: any) => setF(p => ({ ...p, [k]: v }));
  const togglePage = (p: string) =>
    set("pages", f.pages.includes(p) ? f.pages.filter(x => x !== p) : [...f.pages, p]);
  const chooseBg = (preset: typeof BG_PRESETS[0]) => {
    set("bg", preset.value); set("textLight", preset.light);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">Title</label>
          <input value={f.title} onChange={e => set("title", e.target.value)}
            placeholder="e.g. 🚀 NexusOS Pro is now available!"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"/>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">Body</label>
          <input value={f.body} onChange={e => set("body", e.target.value)}
            placeholder="Short description shown under the title"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"/>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">CTA Label</label>
          <input value={f.cta} onChange={e => set("cta", e.target.value)}
            placeholder="e.g. Upgrade Now"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"/>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">CTA URL</label>
          <input value={f.ctaUrl} onChange={e => set("ctaUrl", e.target.value)}
            placeholder="https://…"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"/>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">Valid From</label>
          <input type="date" value={f.validFrom} onChange={e => set("validFrom", e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-300"/>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">Valid To</label>
          <input type="date" value={f.validTo} onChange={e => set("validTo", e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-300"/>
        </div>
      </div>

      {/* Pages */}
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2 block">Show On Pages</label>
        <div className="flex flex-wrap gap-2">
          {PAGE_OPTIONS.map(p => (
            <button key={p} onClick={() => togglePage(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition capitalize ${
                f.pages.includes(p) ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-orange-300"
              }`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Background */}
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2 block">Background</label>
        <div className="flex flex-wrap gap-2">
          {BG_PRESETS.map(p => (
            <button key={p.value} onClick={() => chooseBg(p)}
              style={{ background: p.value }}
              className={`w-8 h-8 rounded-lg border-2 transition ${f.bg === p.value ? "border-orange-500 scale-110" : "border-transparent"}`}
              title={p.label}/>
          ))}
        </div>
      </div>

      {/* Preview */}
      {f.title && (
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">Preview</label>
          <div className="relative flex items-center gap-3 px-4 py-3 rounded-xl overflow-hidden"
            style={{ background: f.bg }}>
            <span className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none"/>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-black truncate ${f.textLight?"text-white":"text-gray-900"}`}>{f.title}</p>
              <p className={`text-[11px] mt-0.5 truncate ${f.textLight?"text-white/80":"text-gray-600"}`}>{f.body || "Your body text here"}</p>
            </div>
            {f.cta && (
              <span className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold ${f.textLight?"bg-white/20 text-white":"bg-gray-900/10 text-gray-900"}`}>{f.cta}</span>
            )}
            <X size={14} className={f.textLight?"text-white/50":"text-gray-400"}/>
            <span className={`absolute bottom-0.5 right-2 text-[9px] uppercase tracking-wider ${f.textLight?"text-white/30":"text-gray-400/60"}`}>Sponsored</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button onClick={() => set("active", !f.active)}
          className={`flex items-center gap-1.5 text-xs font-semibold transition ${f.active?"text-green-600":"text-gray-400"}`}>
          {f.active ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
          {f.active ? "Active" : "Paused"}
        </button>
        <div className="flex-1"/>
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">Cancel</button>
        <button onClick={() => onSave(f)} disabled={!f.title || f.pages.length === 0}
          className="px-5 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition">
          Save Ad
        </button>
      </div>
    </div>
  );
}

export default function AdvertisementsPage() {
  const [ads, setAds]         = useState<Ad[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]   = useState<string | null>(null);
  const [saved, setSaved]     = useState(false);

  useEffect(() => { setAds(load()); }, []);

  const persist = (next: Ad[]) => { setAds(next); save(next); };

  const handleSave = (f: FormState) => {
    if (editId) {
      persist(ads.map(a => a.id === editId ? { ...a, ...f } : a));
      setEditId(null);
    } else {
      const newAd: Ad = { ...f, id: newId(), clicks: 0, impressions: 0 };
      // Seed example if first ad
      persist([...ads, newAd]);
    }
    setShowForm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleActive = (id: string) =>
    persist(ads.map(a => a.id === id ? { ...a, active: !a.active } : a));

  const deleteAd = (id: string) => persist(ads.filter(a => a.id !== id));

  const seedExample = () => {
    const ex: Ad = {
      id: newId(),
      title: "🚀 NexusOS Pro — Upgrade Today",
      body: "Unlock AI reports, advanced analytics and priority support for your team.",
      cta: "See Plans",
      ctaUrl: "https://nexusos.in/pricing",
      bg: "linear-gradient(135deg,#7c3aed,#4f46e5)",
      textLight: true,
      pages: ["jobs", "college360"],
      active: true,
      validFrom: new Date().toISOString().slice(0, 10),
      validTo: new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10),
      clicks: 0, impressions: 0,
    };
    persist([...ads, ex]);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const totalClicks = ads.reduce((s, a) => s + (a.clicks || 0), 0);
  const totalImpressions = ads.reduce((s, a) => s + (a.impressions || 0), 0);
  const activeCount = ads.filter(a => adStatus(a) === "active").length;

  const editingAd = editId ? ads.find(a => a.id === editId) : null;
  const editInitial: FormState = editingAd
    ? { title: editingAd.title, body: editingAd.body, cta: editingAd.cta, ctaUrl: editingAd.ctaUrl, bg: editingAd.bg, textLight: editingAd.textLight, pages: editingAd.pages, active: editingAd.active, validFrom: editingAd.validFrom, validTo: editingAd.validTo }
    : EMPTY_FORM;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
            <Megaphone size={18} className="text-orange-500"/>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Advertisements</h1>
            <p className="text-xs text-gray-500">Manage banners shown on /jobs, /edu360, /college360, /explore</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="flex items-center gap-1 text-xs text-green-600 font-semibold"><CheckCircle size={13}/>Saved</span>}
          {ads.length === 0 && (
            <button onClick={seedExample}
              className="px-3 py-2 border border-dashed border-orange-300 rounded-lg text-xs font-semibold text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition">
              + Add Example Ad
            </button>
          )}
          <button onClick={() => { setEditId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg text-sm font-semibold transition">
            <Plus size={15}/>New Ad
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Ads",    value: ads.length,       icon: <Megaphone size={14}/>, color: "text-orange-500 bg-orange-50 dark:bg-orange-900/20" },
          { label: "Live Now",     value: activeCount,      icon: <CheckCircle size={14}/>, color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
          { label: "Impressions",  value: totalImpressions, icon: <Eye size={14}/>, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
          { label: "Clicks",       value: totalClicks,      icon: <MousePointerClick size={14}/>, color: "text-violet-600 bg-violet-50 dark:bg-violet-900/20" },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-4 border border-white/50`}>
            <div className="flex items-center gap-1.5 text-xs font-semibold opacity-70">{s.icon}{s.label}</div>
            <p className="text-2xl font-black mt-1 text-gray-900 dark:text-white">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {(showForm || editId) && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{editId ? "Edit Ad" : "New Ad"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
          </div>
          <AdForm initial={editInitial} onSave={handleSave} onCancel={() => { setShowForm(false); setEditId(null); }}/>
        </div>
      )}

      {/* Ads list */}
      {ads.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <Megaphone size={32} className="mx-auto mb-3 text-gray-200"/>
          <p className="text-sm font-semibold text-gray-400">No ads yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add Example Ad" to load a sample or create one manually</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map(ad => {
            const status = adStatus(ad);
            return (
              <div key={ad.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex gap-4 items-start">
                {/* Color swatch */}
                <div className="shrink-0 w-12 h-12 rounded-xl" style={{ background: ad.bg }}/>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{ad.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_MAP[status]}`}>{status}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{ad.body}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><Calendar size={9}/>{fmtDate(ad.validFrom)} → {fmtDate(ad.validTo)}</span>
                    <span className="flex items-center gap-1"><Eye size={9}/>{(ad.impressions||0).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><MousePointerClick size={9}/>{(ad.clicks||0).toLocaleString()}</span>
                    <span className="flex flex-wrap gap-1">
                      {ad.pages.map(p => (
                        <span key={p} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded capitalize">{p}</span>
                      ))}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(ad.id)} title={ad.active ? "Pause" : "Activate"}
                    className="text-gray-400 hover:text-orange-500 transition">
                    {ad.active ? <ToggleRight size={20} className="text-green-500"/> : <ToggleLeft size={20}/>}
                  </button>
                  <button onClick={() => { setEditId(ad.id); setShowForm(false); }} className="text-gray-400 hover:text-blue-500 transition">
                    <Edit2 size={14}/>
                  </button>
                  <button onClick={() => deleteAd(ad.id)} className="text-gray-400 hover:text-red-500 transition">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
        <Info size={13} className="shrink-0 mt-0.5"/>
        Ads are stored client-side and shown to users who visit the selected pages. Stats (impressions, clicks) are tracked per-device in the user's browser.
      </div>
    </div>
  );
}
