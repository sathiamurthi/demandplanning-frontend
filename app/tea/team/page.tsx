"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Shield, Plus, X, Edit, Trash2, UserX, KeyRound,
} from "lucide-react";
import { teaFetch } from "@/lib/tea-api";

type Tab = "team" | "roles";

interface TeaModule { key: string; label: string; }
interface TeaRole {
  id: string;
  name: string;
  permissions: Record<string, boolean>;
  user_count: number;
  created_at: string;
}
interface TeamMember {
  id: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string | null;
  role: string;
  is_active: boolean;
  tea_role_id: string | null;
  tea_role_name: string | null;
  last_login_at: string | null;
  created_at: string;
}

const BASE_ROLES = [
  { value: "manager", label: "Manager — full access" },
  { value: "staff",   label: "Staff — base access" },
  { value: "agent",   label: "Agent (legacy field role)" },
];

function RoleBadge({ role, teaRoleName }: { role: string; teaRoleName: string | null }) {
  if (teaRoleName) {
    return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">{teaRoleName}</span>;
  }
  const styles: Record<string, string> = {
    owner: "text-emerald-700 bg-emerald-50 border-emerald-200",
    manager: "text-blue-700 bg-blue-50 border-blue-200",
    staff: "text-gray-600 bg-gray-50 border-gray-200",
    agent: "text-amber-700 bg-amber-50 border-amber-200",
    superadmin: "text-rose-700 bg-rose-50 border-rose-200",
  };
  return <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${styles[role] || styles.staff}`}>{role}</span>;
}

export default function TeamPage() {
  const router = useRouter();

  // Team/role management is owner+manager only — this screen can grant
  // access to everything else, so it must never be reachable by a
  // delegated custom role or the legacy agent role.
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role && !["owner", "manager", "superadmin"].includes(role)) {
      router.replace("/tea");
    }
  }, [router]);

  const [tab, setTab] = useState<Tab>("team");
  const [modules, setModules] = useState<TeaModule[]>([]);
  const [roles, setRoles] = useState<TeaRole[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberForm, setMemberForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "",
    baseRole: "staff", teaRoleId: "",
  });
  const [savingMember, setSavingMember] = useState(false);

  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<TeaRole | null>(null);
  const [roleForm, setRoleForm] = useState<{ name: string; permissions: Record<string, boolean> }>({ name: "", permissions: {} });
  const [savingRole, setSavingRole] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [m, r, t] = await Promise.all([
      teaFetch<TeaModule[]>("/roles/modules"),
      teaFetch<TeaRole[]>("/roles"),
      teaFetch<TeamMember[]>("/team"),
    ]);
    if (m.success) setModules(m.data || []);
    if (r.success) setRoles(r.data || []);
    if (t.success) setTeam(t.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (ok: boolean, text: string) => { setMsg({ ok, text }); setTimeout(() => setMsg(null), 3000); };

  // ── Team member form ──
  const openNewMember = () => {
    setEditingMember(null);
    setMemberForm({ firstName: "", lastName: "", email: "", phone: "", password: "", baseRole: "staff", teaRoleId: "" });
    setShowMemberForm(true);
  };
  const openEditMember = (m: TeamMember) => {
    setEditingMember(m);
    setMemberForm({
      firstName: m.first_name, lastName: m.last_name || "", email: m.email, phone: m.phone || "",
      password: "", baseRole: m.role, teaRoleId: m.tea_role_id || "",
    });
    setShowMemberForm(true);
  };

  const saveMember = async () => {
    setSavingMember(true);
    try {
      if (editingMember) {
        const r = await teaFetch(`/team/${editingMember.id}`, {
          method: "PUT",
          body: JSON.stringify({
            firstName: memberForm.firstName, lastName: memberForm.lastName || undefined,
            baseRole: memberForm.baseRole, teaRoleId: memberForm.teaRoleId || null,
            ...(memberForm.password ? { password: memberForm.password } : {}),
          }),
        });
        if (!r.success) throw new Error(r.error);
        flash(true, "Team member updated");
      } else {
        const r = await teaFetch("/team", {
          method: "POST",
          body: JSON.stringify({
            firstName: memberForm.firstName, lastName: memberForm.lastName || undefined,
            email: memberForm.email || undefined, phone: memberForm.phone || undefined,
            password: memberForm.password, baseRole: memberForm.baseRole,
            teaRoleId: memberForm.teaRoleId || undefined,
          }),
        });
        if (!r.success) throw new Error(r.error);
        flash(true, "Team member added");
      }
      setShowMemberForm(false);
      load();
    } catch (e: any) {
      flash(false, e.message || "Failed to save");
    } finally { setSavingMember(false); }
  };

  const deactivateMember = async (m: TeamMember) => {
    if (!confirm(`Deactivate ${m.first_name}? They will no longer be able to log in.`)) return;
    const r = await teaFetch(`/team/${m.id}`, { method: "DELETE" });
    if (r.success) { flash(true, "Team member deactivated"); load(); }
    else flash(false, r.error || "Failed to deactivate");
  };

  const reactivateMember = async (m: TeamMember) => {
    const r = await teaFetch(`/team/${m.id}`, { method: "PUT", body: JSON.stringify({ isActive: true }) });
    if (r.success) { flash(true, "Team member reactivated"); load(); }
    else flash(false, r.error || "Failed to reactivate");
  };

  // ── Role form ──
  const openNewRole = () => {
    setEditingRole(null);
    setRoleForm({ name: "", permissions: {} });
    setShowRoleForm(true);
  };
  const openEditRole = (r: TeaRole) => {
    setEditingRole(r);
    setRoleForm({ name: r.name, permissions: { ...r.permissions } });
    setShowRoleForm(true);
  };
  const toggleModule = (key: string) =>
    setRoleForm(f => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }));

  const saveRole = async () => {
    if (!roleForm.name.trim()) { flash(false, "Role name is required"); return; }
    setSavingRole(true);
    try {
      if (editingRole) {
        const r = await teaFetch(`/roles/${editingRole.id}`, {
          method: "PUT", body: JSON.stringify({ name: roleForm.name, permissions: roleForm.permissions }),
        });
        if (!r.success) throw new Error(r.error);
        flash(true, "Role updated");
      } else {
        const r = await teaFetch("/roles", {
          method: "POST", body: JSON.stringify({ name: roleForm.name, permissions: roleForm.permissions }),
        });
        if (!r.success) throw new Error(r.error);
        flash(true, "Role created");
      }
      setShowRoleForm(false);
      load();
    } catch (e: any) {
      flash(false, e.message || "Failed to save role");
    } finally { setSavingRole(false); }
  };

  const deleteRole = async (r: TeaRole) => {
    const warn = r.user_count > 0
      ? `${r.user_count} team member(s) currently have this role — they'll fall back to their base role. Delete "${r.name}"?`
      : `Delete role "${r.name}"?`;
    if (!confirm(warn)) return;
    const res = await teaFetch(`/roles/${r.id}`, { method: "DELETE" });
    if (res.success) { flash(true, "Role deleted"); load(); }
    else flash(false, res.error || "Failed to delete");
  };

  return (
    <div className="p-5 sm:p-6 space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
          <Users className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Team & Roles</h1>
          <p className="text-xs text-gray-400 mt-0.5">Add team members and define custom roles like &ldquo;Field Officer&rdquo; with their own module access.</p>
        </div>
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-2.5 text-sm font-medium ${msg.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.text}
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200">
        {(["team", "roles"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize border-b-2 -mb-px transition-colors ${
              tab === t ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}>
            {t === "team" ? "Team" : "Roles"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : tab === "team" ? (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={openNewMember}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors">
              <Plus size={15} /> Add Team Member
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {team.length === 0 && <p className="text-sm text-gray-400 p-5">No team members yet.</p>}
            {team.map(m => (
              <div key={m.id} className={`flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-50 last:border-0 ${!m.is_active ? "opacity-50" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm truncate">{[m.first_name, m.last_name].filter(Boolean).join(" ")}</p>
                    <RoleBadge role={m.role} teaRoleName={m.tea_role_name} />
                    {!m.is_active && (
                      m.last_login_at
                        ? <span className="text-[11px] text-gray-400 font-medium">Deactivated</span>
                        : <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">Pending approval</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{m.email}{m.phone ? ` · ${m.phone}` : ""}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEditMember(m)} title="Edit"
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"><Edit size={15} /></button>
                  {m.is_active ? (
                    <button onClick={() => deactivateMember(m)} title="Deactivate"
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><UserX size={15} /></button>
                  ) : (
                    <button onClick={() => reactivateMember(m)} title={m.last_login_at ? "Reactivate" : "Approve"}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-2">
                      {m.last_login_at ? "Reactivate" : "Approve"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={openNewRole}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors">
              <Plus size={15} /> New Role
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roles.length === 0 && <p className="text-sm text-gray-400">No custom roles yet — Owner and Manager already have full access by default.</p>}
            {roles.map(r => (
              <div key={r.id} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-violet-500" />
                    <p className="font-bold text-gray-900 text-sm">{r.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditRole(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"><Edit size={14} /></button>
                    <button onClick={() => deleteRole(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400">{r.user_count} team member{r.user_count === 1 ? "" : "s"}</p>
                <div className="flex flex-wrap gap-1">
                  {modules.filter(m => r.permissions[m.key]).map(m => (
                    <span key={m.key} className="text-[10px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">{m.label}</span>
                  ))}
                  {modules.every(m => !r.permissions[m.key]) && <span className="text-[11px] text-gray-300">No modules granted</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member form modal */}
      {showMemberForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowMemberForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900">{editingMember ? "Edit Team Member" : "Add Team Member"}</h3>
              <button onClick={() => setShowMemberForm(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X size={16} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input placeholder="First name" value={memberForm.firstName} onChange={e => setMemberForm(f => ({ ...f, firstName: e.target.value }))}
                className="col-span-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
              <input placeholder="Last name" value={memberForm.lastName} onChange={e => setMemberForm(f => ({ ...f, lastName: e.target.value }))}
                className="col-span-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
            </div>
            {!editingMember && (
              <>
                <input placeholder="Email" type="email" value={memberForm.email} onChange={e => setMemberForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
                <input placeholder="Phone (optional if email given)" value={memberForm.phone} onChange={e => setMemberForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
              </>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 flex items-center gap-1 mb-1"><KeyRound size={12} /> {editingMember ? "New password (leave blank to keep current)" : "Password"}</label>
              <input type="password" value={memberForm.password} onChange={e => setMemberForm(f => ({ ...f, password: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Base role</label>
              <select value={memberForm.baseRole} onChange={e => setMemberForm(f => ({ ...f, baseRole: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400">
                {BASE_ROLES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Custom role (optional — overrides module access for Staff/Agent)</label>
              <select value={memberForm.teaRoleId} onChange={e => setMemberForm(f => ({ ...f, teaRoleId: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400">
                <option value="">None — use base role only</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <button onClick={saveMember} disabled={savingMember || !memberForm.firstName || (!editingMember && (!memberForm.password || (!memberForm.email && !memberForm.phone)))}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold transition-colors">
              {savingMember ? "Saving…" : editingMember ? "Save Changes" : "Add Team Member"}
            </button>
          </div>
        </div>
      )}

      {/* Role form modal */}
      {showRoleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowRoleForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900">{editingRole ? "Edit Role" : "New Role"}</h3>
              <button onClick={() => setShowRoleForm(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X size={16} /></button>
            </div>

            <input placeholder="Role name (e.g. Field Officer)" value={roleForm.name} onChange={e => setRoleForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400" />

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block">Module access</label>
              <div className="space-y-1.5">
                {modules.map(m => (
                  <label key={m.key} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={!!roleForm.permissions[m.key]} onChange={() => toggleModule(m.key)}
                      className="w-4 h-4 rounded accent-violet-600" />
                    <span className="text-sm text-gray-700">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button onClick={saveRole} disabled={savingRole}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-bold transition-colors">
              {savingRole ? "Saving…" : editingRole ? "Save Changes" : "Create Role"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
