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
          <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center">
            <Users size={18} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Tea Growers</h1>
            <p className="text-gray-500 text-xs">{growers.length} growers registered</p>
          </div>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={15} /> Add Grower
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white border border-gray-200 rounded-xl shadow-sm p-1 w-fit">
        {(["all", "pluck-plan"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs capitalize transition-all ${activeTab === tab ? "bg-white text-emerald-700 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-900"}`}>
            {tab === "pluck-plan" ? "🌿 Pluck Plan" : "All Growers"}
          </button>
        ))}
      </div>

      {/* Search */}
      {activeTab === "all" && (
        <div className="relative mb-4 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text" placeholder="Search by name, code, phone..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors pl-9 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-emerald-500"
          />
        </div>
      )}

      {/* Growers Table */}
      {activeTab === "all" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600 text-sm animate-pulse">Loading...</div>
          ) : growers.length === 0 ? (
            <div className="p-8 text-center text-gray-600 text-sm">
              <Users size={32} className="mx-auto mb-2 opacity-20" />
              No growers yet. Add your first grower.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">Code</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">Name</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs hidden sm:table-cell">Phone</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs hidden md:table-cell">Land</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs hidden md:table-cell">Last Pluck</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">Cycle</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">Status</th>
                    <th className="px-4 py-3 text-right text-gray-500 text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {growers.map((g, i) => {
                    const days = daysSinceLastPluck(g.last_pluck_date);
                    const due = days !== null && g.pluck_cycle_days && days >= g.pluck_cycle_days;
                    return (
                      <tr key={g.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600 text-xs font-mono">{g.grower_code || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-green-500/10 rounded-lg flex items-center justify-center">
                              <Leaf size={12} className="text-green-600" />
                            </div>
                            <span className="text-gray-900 text-sm font-medium">{g.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-gray-600 text-sm">{g.phone || "—"}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-gray-600 text-sm">{g.land_acres ? `${g.land_acres} ac` : "—"}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {g.last_pluck_date ? (
                            <span className={`text-xs ${due ? "text-yellow-600" : "text-gray-500"}`}>
                              {days} days ago
                              {due && " ⚠️"}
                            </span>
                          ) : <span className="text-gray-600 text-xs">Not set</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{g.pluck_cycle_days}d</td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleActive(g)} className={`text-xs px-2 py-1 rounded-full ${g.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {g.is_active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => { setPortalGrower(g); setPortalPin(""); }}
                              title={g.portal_enabled ? "Manage portal access" : "Enable grower portal"}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 ${g.portal_enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                              <KeyRound size={12} />
                            </button>
                            <button onClick={() => openEdit(g)} className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-100">
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
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {pluckPlan.length === 0 ? (
            <div className="p-8 text-center text-gray-600 text-sm">No pluck plan data.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">Grower</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">Last Pluck</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">Next Expected</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">Status</th>
                    <th className="px-4 py-3 text-left text-gray-500 text-xs">Land</th>
                  </tr>
                </thead>
                <tbody>
                  {pluckPlan.map((g: any) => (
                    <tr key={g.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-gray-900 text-sm font-medium">{g.name}</p>
                        <p className="text-gray-500 text-xs">{g.grower_code}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {g.last_pluck_date ? new Date(g.last_pluck_date).toLocaleDateString("en-IN") : "Not set"}
                      </td>
                      <td className="px-4 py-3 text-gray-900 text-sm">
                        {g.next_pluck_date ? new Date(g.next_pluck_date).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {g.pluck_today ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">🌿 Today</span>
                        ) : g.pluck_soon ? (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">⚠️ Soon (3d)</span>
                        ) : (
                          <span className="text-xs text-gray-600">Upcoming</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
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
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-green-600" />
                <h2 className="font-bold text-gray-900">Grower Portal Access</h2>
              </div>
              <button onClick={() => setPortalGrower(null)} className="text-gray-500 hover:text-gray-900"><X size={18} /></button>
            </div>

            <div className="bg-gray-100 rounded-xl p-3 mb-4">
              <p className="text-gray-900 font-medium text-sm">{portalGrower.name}</p>
              <p className="text-gray-500 text-xs">{portalGrower.phone || portalGrower.grower_code}</p>
              <div className="mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${portalGrower.portal_enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {portalGrower.portal_enabled ? "Portal Enabled" : "Portal Disabled"}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-gray-500 text-xs block mb-1.5">
                {portalGrower.portal_enabled ? "Set New PIN (4–6 digits)" : "Set PIN to enable portal (4–6 digits)"}
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="e.g. 1234"
                value={portalPin}
                onChange={e => setPortalPin(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-white border border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2.5 text-gray-900 text-sm tracking-widest focus:outline-none focus:border-emerald-500"
              />
              <p className="text-gray-600 text-xs mt-1.5">
                Grower logs in at <span className="text-gray-500 font-mono">/grower/login</span> using their phone + this PIN.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => savePortalPin(portalPin)}
                disabled={portalSaving || portalPin.length < 4}
                className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium text-white">
                {portalSaving ? "Saving..." : portalGrower.portal_enabled ? "Update PIN" : "Enable Portal"}
              </button>
              {portalGrower.portal_enabled && (
                <button
                  onClick={() => savePortalPin(null)}
                  disabled={portalSaving}
                  className="w-full border border-red-500/30 rounded-xl py-2 text-sm text-red-600 hover:bg-red-500/10">
                  Disable Portal Access
                </button>
              )}
              <button onClick={() => setPortalGrower(null)} className="w-full border border-gray-200 rounded-xl py-2 text-sm text-gray-500 hover:text-gray-900">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">{editing ? "Edit Grower" : "Add Grower"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-900"><X size={18} /></button>
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
                  <label className="text-gray-500 text-xs block mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key] ?? ""}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === "number" ? parseFloat(e.target.value) : e.target.value }))}
                    className="w-full bg-white border border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ))}

              <div className="col-span-2">
                <label className="text-gray-500 text-xs block mb-1">Address</label>
                <textarea
                  value={form.address ?? ""}
                  onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                  className="w-full bg-white border border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={form.will_pluck ?? false}
                    onChange={e => setForm(prev => ({ ...prev, will_pluck: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300" />
                  Will pluck today (agent confirmation)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-500 hover:text-gray-900">
                Cancel
              </button>
              <button onClick={save} disabled={saving || !form.name}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium text-white">
                {saving ? "Saving..." : editing ? "Update" : "Add Grower"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
