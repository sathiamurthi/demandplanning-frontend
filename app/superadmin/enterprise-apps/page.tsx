"use client";

import { useEffect, useState } from "react";
import {
  Store, CheckCircle2, Save, Loader2,
  ToggleLeft, ToggleRight, Eye, AlertCircle,
  ShoppingCart, Pill, Wrench, Leaf,
} from "lucide-react";

const ALL_MODULES = [
  {
    id: "grocery",
    label: "Grocery & Retail",
    emoji: "🛒",
    icon: ShoppingCart,
    desc: "Supermarkets, kirana stores, FMCG retail with shelf-life and reorder management",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    id: "pharmacy",
    label: "Pharma & Medical",
    emoji: "💊",
    icon: Pill,
    desc: "Medical stores, pharmacies with batch tracking, expiry alerts and audit trails",
    color: "text-pink-500",
    bg: "bg-pink-50",
  },
  {
    id: "autoparts",
    label: "Auto Parts",
    emoji: "🔧",
    icon: Wrench,
    desc: "Automotive spare parts with SKU-level inventory and supplier lead-time forecasting",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    id: "krishna",
    label: "Krishna Store (Kirana)",
    emoji: "🏪",
    icon: Store,
    desc: "General kirana / neighbourhood retail — mixed grocery, household & daily essentials",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  {
    id: "tea",
    label: "TeaFactory360",
    emoji: "🍃",
    icon: Leaf,
    desc: "Grower-to-factory tea collection, production stages, payroll, fleet, inventory, sales & compliance",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
];

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "https://demandplanning-backend.onrender.com";
function authHeader() {
  if (typeof window === "undefined") return {};
  const tok = localStorage.getItem("nexus_superadmin_token") || "";
  return { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" };
}

export default function EnterpriseAppsSettingsPage() {
  const [enabled, setEnabled] = useState<string[]>(["grocery", "pharmacy", "autoparts", "krishna"]);
  const [appsOn,  setAppsOn]  = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [err,     setErr]     = useState("");

  useEffect(() => {
    fetch(`${API}/v1/superadmin/platform-config`, { headers: authHeader() as HeadersInit })
      .then(r => r.json())
      .then(d => {
        const cfg = d.data?.enterprise_apps || {};
        setEnabled(cfg.enabled_modules || ["grocery", "pharmacy", "autoparts", "krishna"]);
        setAppsOn(cfg.enabled !== false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (mod: string) => {
    setEnabled(prev => prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]);
    setSaved(false);
  };

  const save = async () => {
    setSaving(true); setErr(""); setSaved(false);
    try {
      const r = await fetch(`${API}/v1/superadmin/platform-config`, {
        method: "PUT",
        headers: authHeader() as HeadersInit,
        body: JSON.stringify({
          key: "enterprise_apps",
          value: {
            enabled: appsOn,
            enabled_modules: enabled,
            all_modules: ALL_MODULES.map(m => m.id),
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
          <Store size={22} className="text-orange-500"/> Enterprise App Modules
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Control which business verticals are available for tenant registration and shown on the public landing page.
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
              <p className="font-bold text-gray-900">Enterprise Platform Status</p>
              <p className="text-xs text-gray-500 mt-0.5">Enable or disable the entire enterprise application vertical section on the public landing page</p>
            </div>
            <button onClick={() => { setAppsOn(p => !p); setSaved(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition ${appsOn ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}>
              {appsOn ? <><ToggleRight size={18}/> Enabled</> : <><ToggleLeft size={18}/> Disabled</>}
            </button>
          </div>

          {/* Module toggles */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">Active Modules</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {enabled.length} of {ALL_MODULES.length} enabled · Only enabled modules appear on the landing page and in tenant registration
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEnabled(ALL_MODULES.map(m => m.id)); setSaved(false); }}
                  className="text-xs text-orange-500 font-bold hover:underline">Enable All</button>
                <span className="text-gray-300">·</span>
                <button onClick={() => { setEnabled([]); setSaved(false); }}
                  className="text-xs text-gray-400 font-bold hover:underline">Disable All</button>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {ALL_MODULES.map(mod => {
                const on = enabled.includes(mod.id);
                const Icon = mod.icon;
                return (
                  <div key={mod.id} className={`flex items-center justify-between px-5 py-4 transition ${on ? "" : "opacity-55"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${mod.bg} rounded-xl flex items-center justify-center shrink-0`}>
                        <Icon size={18} className={mod.color}/>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                          <span>{mod.emoji}</span> {mod.label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{mod.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      {on
                        ? <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full uppercase tracking-wide">Active</span>
                        : <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wide">Off</span>}
                      <button onClick={() => toggle(mod.id)}
                        className={`w-10 h-6 rounded-full transition-all relative ${on ? "bg-green-500" : "bg-gray-300"}`}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${on ? "left-5" : "left-1"}`}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview strip */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-orange-700 uppercase tracking-wide mb-3">
              <Eye size={12}/> Preview — industry verticals shown on landing page
            </p>
            <div className="flex flex-wrap gap-2">
              {enabled.length === 0
                ? <span className="text-xs text-orange-600 italic">No modules enabled — industry section will be hidden from the landing page</span>
                : ALL_MODULES.filter(m => enabled.includes(m.id)).map(m => (
                  <span key={m.id} className="flex items-center gap-1.5 bg-white border border-orange-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700">
                    {m.emoji} {m.label}
                  </span>
                ))
              }
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
                <CheckCircle2 size={16}/> Saved — landing page updated
              </span>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-700">How this works</p>
            <p>• Enabled modules appear in the "Built for your industry" section on the public landing page.</p>
            <p>• When tenants register, only enabled business types appear in the dropdown.</p>
            <p>• Disabling a module hides it from new registrations but does NOT affect existing tenant data.</p>
            <p>• Changes take effect immediately for new visitors (cached up to 30 seconds).</p>
          </div>
        </>
      )}
    </div>
  );
}
