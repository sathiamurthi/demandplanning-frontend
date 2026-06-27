"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Search, Edit, Phone, MapPin, Leaf, Calendar, CheckCircle, XCircle, X, KeyRound } from "lucide-react";

import { teaAuthHeaders, teaUrl } from "@/lib/tea-api";

interface Grower {
  id: string;
  grower_code: string;
  name: string;
  phone: string;
  address: string;
  land_acres: number;
  land_type: string;
  pluck_cycle_days: number;
  last_pluck_date: string;
  will_pluck: boolean;
  is_active: boolean;
  portal_enabled: boolean;
}

const empty: Partial<Grower> = { name: "", grower_code: "", phone: "", address: "", land_acres: 0, land_type: "", pluck_cycle_days: 15, is_active: true };

export default function GrowersPage() {
  const [growers, setGrowers]   = useState<Grower[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Grower | null>(null);
  const [form, setForm]         = useState<Partial<Grower>>(empty);
  const [saving, setSaving]     = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "pluck-plan">("all");
  const [pluckPlan, setPluckPlan] = useState<any[]>([]);
  const [portalGrower, setPortalGrower] = useState<Grower | null>(null);
  const [portalPin, setPortalPin] = useState("");
  const [portalSaving, setPortalSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(teaUrl(`/growers?search=${search}`), { headers: teaAuthHeaders() });
      const d = await r.json();
      if (d.success) setGrowers(d.data);
    } catch {}
    setLoading(false);
  };

  const loadPluckPlan = async () => {
    try {
      const r = await fetch(teaUrl("/growers/pluck-plan"), { headers: teaAuthHeaders() });
      const d = await r.json();
      if (d.success) setPluckPlan(d.data);
    } catch {}
  };

  useEffect(() => { load(); }, [search]);
  useEffect(() => { if (activeTab === "pluck-plan") loadPluckPlan(); }, [activeTab]);

  const openNew = () => { setForm(empty); setEditing(null); setShowForm(true); };
  const openEdit = (g: Grower) => { setForm(g); setEditing(g); setShowForm(true); };

  const save = async () => {
    setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing
        ? teaUrl(`/growers/${editing.id}`)
        : teaUrl("/growers");

      const r = await fetch(url, { method, headers: teaAuthHeaders(), body: JSON.stringify(form) });
      const d = await r.json();
      if (d.success) { setShowForm(false); load(); }
      else alert(d.error || "Save failed");
    } catch { alert("Error saving"); }
    setSaving(false);
  };

  const savePortalPin = async (pin: string | null) => {
    if (!portalGrower) return;
    setPortalSaving(true);
    try {
      const r = await fetch(teaUrl(`/growers/${portalGrower.id}/portal-pin`), {
        method: "PUT",
        headers: teaAuthHeaders(),
        body: JSON.stringify({ pin }),
      });
      const d = await r.json();
      if (d.success) { setPortalGrower(null); setPortalPin(""); load(); }
      else alert(d.error || "Failed to update portal PIN");
    } catch { alert("Error updating portal PIN"); }
    setPortalSaving(false);
  };

  const toggleActive = async (g: Grower) => {
    await fetch(teaUrl(`/growers/${g.id}`), {
      method: "PUT",
      headers: teaAuthHeaders(),
      body: JSON.stringify({ is_active: !g.is_active }),
    });
    load();
  };

  const daysSinceLastPluck = (date: string) => {
    if (!date) return null;
    return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Users size={18} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Tea Growers</h1>
            <p className="text-white/40 text-xs">{growers.length} growers registered</p>
          </div>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={15} /> Add Grower
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[#161a23] border border-white/8 rounded-xl p-1 w-fit">
        {(["all", "pluck-plan"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs capitalize transition-all ${activeTab === tab ? "bg-green-600/20 text-green-400" : "text-white/40 hover:text-white"}`}>
            {tab === "pluck-plan" ? "🌿 Pluck Plan" : "All Growers"}
          </button>
        ))}
      </div>

      {/* Search */}
      {activeTab === "all" && (
        <div className="relative mb-4 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text" placeholder="Search by name, code, phone..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#161a23] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40"
          />
        </div>
      )}

      {/* Growers Table */}
      {activeTab === "all" && (
        <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-white/30 text-sm animate-pulse">Loading...</div>
          ) : growers.length === 0 ? (
            <div className="p-8 text-center text-white/30 text-sm">
              <Users size={32} className="mx-auto mb-2 opacity-20" />
              No growers yet. Add your first grower.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="px-4 py-3 text-left text-white/40 text-xs">Code</th>
                    <th className="px-4 py-3 text-left text-white/40 text-xs">Name</th>
                    <th className="px-4 py-3 text-left text-white/40 text-xs hidden sm:table-cell">Phone</th>
                    <th className="px-4 py-3 text-left text-white/40 text-xs hidden md:table-cell">Land</th>
                    <th className="px-4 py-3 text-left text-white/40 text-xs hidden md:table-cell">Last Pluck</th>
                    <th className="px-4 py-3 text-left text-white/40 text-xs">Cycle</th>
                    <th className="px-4 py-3 text-left text-white/40 text-xs">Status</th>
                    <th className="px-4 py-3 text-right text-white/40 text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {growers.map((g, i) => {
                    const days = daysSinceLastPluck(g.last_pluck_date);
                    const due = days !== null && g.pluck_cycle_days && days >= g.pluck_cycle_days;
                    return (
                      <tr key={g.id} className="border-b border-white/5 hover:bg-white/3">
                        <td className="px-4 py-3 text-white/60 text-xs font-mono">{g.grower_code || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-green-500/10 rounded-lg flex items-center justify-center">
                              <Leaf size={12} className="text-green-400" />
                            </div>
                            <span className="text-white text-sm font-medium">{g.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-white/60 text-sm">{g.phone || "—"}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-white/60 text-sm">{g.land_acres ? `${g.land_acres} ac` : "—"}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {g.last_pluck_date ? (
                            <span className={`text-xs ${due ? "text-yellow-400" : "text-white/50"}`}>
                              {days} days ago
                              {due && " ⚠️"}
                            </span>
                          ) : <span className="text-white/30 text-xs">Not set</span>}
                        </td>
                        <td className="px-4 py-3 text-white/60 text-xs">{g.pluck_cycle_days}d</td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleActive(g)} className={`text-xs px-2 py-1 rounded-full ${g.is_active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                            {g.is_active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => { setPortalGrower(g); setPortalPin(""); }}
                              title={g.portal_enabled ? "Manage portal access" : "Enable grower portal"}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 ${g.portal_enabled ? "bg-green-500/15 text-green-400" : "bg-white/5 text-white/30"}`}>
                              <KeyRound size={12} />
                            </button>
                            <button onClick={() => openEdit(g)} className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10">
                              <Edit size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pluck Plan tab */}
      {activeTab === "pluck-plan" && (
        <div className="bg-[#161a23] border border-white/8 rounded-xl overflow-hidden">
          {pluckPlan.length === 0 ? (
            <div className="p-8 text-center text-white/30 text-sm">No pluck plan data.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="px-4 py-3 text-left text-white/40 text-xs">Grower</th>
                    <th className="px-4 py-3 text-left text-white/40 text-xs">Last Pluck</th>
                    <th className="px-4 py-3 text-left text-white/40 text-xs">Next Expected</th>
                    <th className="px-4 py-3 text-left text-white/40 text-xs">Status</th>
                    <th className="px-4 py-3 text-left text-white/40 text-xs">Land</th>
                  </tr>
                </thead>
                <tbody>
                  {pluckPlan.map((g: any) => (
                    <tr key={g.id} className="border-b border-white/5 hover:bg-white/3">
                      <td className="px-4 py-3">
                        <p className="text-white text-sm font-medium">{g.name}</p>
                        <p className="text-white/40 text-xs">{g.grower_code}</p>
                      </td>
                      <td className="px-4 py-3 text-white/60 text-sm">
                        {g.last_pluck_date ? new Date(g.last_pluck_date).toLocaleDateString("en-IN") : "Not set"}
                      </td>
                      <td className="px-4 py-3 text-white text-sm">
                        {g.next_pluck_date ? new Date(g.next_pluck_date).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {g.pluck_today ? (
                          <span className="text-xs bg-green-500/15 text-green-400 px-2 py-1 rounded-full">🌿 Today</span>
                        ) : g.pluck_soon ? (
                          <span className="text-xs bg-yellow-500/15 text-yellow-400 px-2 py-1 rounded-full">⚠️ Soon (3d)</span>
                        ) : (
                          <span className="text-xs text-white/30">Upcoming</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/60 text-xs">
                        {g.land_acres ? `${g.land_acres} ac` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Portal PIN Modal */}
      {portalGrower && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#161a23] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-green-400" />
                <h2 className="font-bold text-white">Grower Portal Access</h2>
              </div>
              <button onClick={() => setPortalGrower(null)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>

            <div className="bg-[#0d0f14] rounded-xl p-3 mb-4">
              <p className="text-white font-medium text-sm">{portalGrower.name}</p>
              <p className="text-white/40 text-xs">{portalGrower.phone || portalGrower.grower_code}</p>
              <div className="mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${portalGrower.portal_enabled ? "bg-green-500/15 text-green-400" : "bg-white/8 text-white/30"}`}>
                  {portalGrower.portal_enabled ? "Portal Enabled" : "Portal Disabled"}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-white/50 text-xs block mb-1.5">
                {portalGrower.portal_enabled ? "Set New PIN (4–6 digits)" : "Set PIN to enable portal (4–6 digits)"}
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="e.g. 1234"
                value={portalPin}
                onChange={e => setPortalPin(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm tracking-widest focus:outline-none focus:border-green-500/40"
              />
              <p className="text-white/30 text-xs mt-1.5">
                Grower logs in at <span className="text-white/50 font-mono">/grower/login</span> using their phone + this PIN.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => savePortalPin(portalPin)}
                disabled={portalSaving || portalPin.length < 4}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium text-white">
                {portalSaving ? "Saving..." : portalGrower.portal_enabled ? "Update PIN" : "Enable Portal"}
              </button>
              {portalGrower.portal_enabled && (
                <button
                  onClick={() => savePortalPin(null)}
                  disabled={portalSaving}
                  className="w-full border border-red-500/30 rounded-xl py-2 text-sm text-red-400 hover:bg-red-500/10">
                  Disable Portal Access
                </button>
              )}
              <button onClick={() => setPortalGrower(null)} className="w-full border border-white/8 rounded-xl py-2 text-sm text-white/40 hover:text-white">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#161a23] border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white">{editing ? "Edit Grower" : "Add Grower"}</h2>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "name", label: "Name *", type: "text", full: true },
                { key: "grower_code", label: "Grower Code", type: "text" },
                { key: "phone", label: "Phone", type: "text" },
                { key: "land_acres", label: "Land (acres)", type: "number" },
                { key: "land_type", label: "Land Type", type: "text" },
                { key: "pluck_cycle_days", label: "Pluck Cycle (days)", type: "number" },
              ].map(f => (
                <div key={f.key} className={f.full ? "col-span-2" : ""}>
                  <label className="text-white/50 text-xs block mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key] ?? ""}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === "number" ? parseFloat(e.target.value) : e.target.value }))}
                    className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/40"
                  />
                </div>
              ))}

              <div className="col-span-2">
                <label className="text-white/50 text-xs block mb-1">Address</label>
                <textarea
                  value={form.address ?? ""}
                  onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                  className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/40"
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                  <input type="checkbox" checked={form.will_pluck ?? false}
                    onChange={e => setForm(prev => ({ ...prev, will_pluck: e.target.checked }))}
                    className="w-4 h-4 rounded border-white/20" />
                  Will pluck today (agent confirmation)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-white/10 rounded-xl py-2.5 text-sm text-white/50 hover:text-white">
                Cancel
              </button>
              <button onClick={save} disabled={saving || !form.name}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium text-white">
                {saving ? "Saving..." : editing ? "Update" : "Add Grower"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
