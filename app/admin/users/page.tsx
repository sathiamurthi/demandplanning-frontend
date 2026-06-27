"use client";

import { useEffect, useState } from "react";
import { Search, Plus, X, Users } from "lucide-react";
import { getUsers, createUser, updateUser, deleteUser } from "@/lib/tenant/tenant.users";
import { apiGet } from "@/lib/api";
import { getTenantId } from "@/lib/utils";
import { useToast } from "@/components/ui/useToast";

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none";

type UserRow = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  store_id: string | null;
  store_name: string | null;
};

type Store = { id: string; name: string };

const ROLES = ["admin", "manager", "staff", "cashier"];

export default function ManageUsers() {
  const { show } = useToast();
  const tenantId = getTenantId() || "";

  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [activeStoreId, setActiveStoreId] = useState<string>(""); // "" = all
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  // View
  const [view, setView] = useState<"grid" | "table">("table");

  // Modals
  const [openForm, setOpenForm] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    fetchStores();
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    fetchUsers();
  }, [tenantId, activeStoreId, roleFilter, statusFilter, search]);

  async function fetchStores() {
    try {
      const res: any = await apiGet(`/tenants/${tenantId}/stores`);
      const data = res?.data ?? res ?? [];
      setStores(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      // stores not critical for page to work
    }
  }

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await getUsers(
        tenantId,
        undefined,
        search || undefined,
        activeStoreId || undefined,
        roleFilter || undefined,
        statusFilter || undefined,
      );
      const raw: any[] = res?.data ?? (res as any) ?? [];
      setUsers(
        raw.map((u: any) => ({
          id: u.id,
          first_name: u.first_name ?? "",
          last_name: u.last_name ?? null,
          email: u.email ?? "",
          role: u.role ?? "staff",
          is_active: u.is_active ?? false,
          last_login_at: u.last_login_at ?? null,
          store_id: u.store_id ?? null,
          store_name: u.store_name ?? null,
        }))
      );
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  const fullName = (u: UserRow) =>
    [u.first_name, u.last_name].filter(Boolean).join(" ") || "User";

  const statusBadge = (active: boolean) => (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );

  const roleBadge = (role: string) => (
    <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
      {role}
    </span>
  );

  async function handleSave(data: Partial<UserRow>) {
    try {
      if (!data.first_name) { show("First name is required", "error"); return; }
      if (!data.email?.includes("@")) { show("Invalid email", "error"); return; }
      if (editUser) {
        await updateUser(tenantId, editUser.id, data);
        show("User updated");
      } else {
        await createUser(tenantId, data);
        show("User created");
      }
    } catch (err: any) {
      show(err?.message || "Failed. Try again.", "error");
    } finally {
      setOpenForm(false);
      setEditUser(null);
      fetchUsers();
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteUser(tenantId, deleteId);
      show("User deleted");
      fetchUsers();
    } catch {
      show("Delete failed", "error");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-900">

      {/* ── HEADER ── */}
      <div className="border-b bg-white px-5 py-4 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold">Users</h1>
              <p className="text-xs text-gray-500">{users.length} result{users.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex border rounded-lg overflow-hidden text-sm">
              {(["table", "grid"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 capitalize ${
                    view === v ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            <button
              onClick={() => { setEditUser(null); setOpenForm(true); }}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add User
            </button>
          </div>
        </div>

        {/* ── STORE TABS ── */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {[{ id: "", name: "All Users" }, ...stores].map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveStoreId(s.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition ${
                activeStoreId === s.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* ── FILTERS ROW ── */}
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {/* Clear filters */}
          {(activeStoreId || roleFilter || statusFilter || search) && (
            <button
              onClick={() => { setActiveStoreId(""); setRoleFilter(""); setStatusFilter(""); setSearch(""); }}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading…</div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <Users className="h-8 w-8 opacity-30" />
            <p className="text-sm">No users found</p>
          </div>
        ) : view === "table" ? (
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Store</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Last Login</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium">{fullName(u)}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">{roleBadge(u.role)}</td>
                    <td className="px-4 py-3 text-gray-500">{u.store_name || "—"}</td>
                    <td className="px-4 py-3">{statusBadge(u.is_active)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => { setEditUser(u); setOpenForm(true); }}
                        className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-200 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(u.id)}
                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((u) => (
              <div key={u.id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{fullName(u)}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                  {statusBadge(u.is_active)}
                </div>
                <div className="flex gap-2 items-center">
                  {roleBadge(u.role)}
                  {u.store_name && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {u.store_name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Last login: {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : "Never"}
                </p>
                <div className="flex gap-2 pt-1 border-t">
                  <button
                    onClick={() => { setEditUser(u); setOpenForm(true); }}
                    className="flex-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(u.id)}
                    className="flex-1 text-sm text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      <UserFormModal
        isOpen={openForm}
        onClose={() => { setOpenForm(false); setEditUser(null); }}
        initialData={editUser}
        stores={stores}
        onSubmit={handleSave}
      />

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

/* ── USER FORM MODAL ── */

function UserFormModal({
  isOpen, onClose, onSubmit, initialData, stores,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData: any | null;
  stores: Store[];
}) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "staff",
    is_active: true,
    store_id: "",
    password: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        first_name: initialData.first_name ?? "",
        last_name: initialData.last_name ?? "",
        email: initialData.email ?? "",
        role: initialData.role ?? "staff",
        is_active: initialData.is_active ?? true,
        store_id: initialData.store_id ?? "",
        password: "",
      });
    } else {
      setForm({ first_name: "", last_name: "", email: "", role: "staff", is_active: true, store_id: "", password: "" });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border">

        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold">{initialData ? "Edit User" : "Add User"}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.first_name}
              onChange={(e) => set("first_name", e.target.value)}
              placeholder="First Name *"
              className={inputClass}
            />
            <input
              value={form.last_name}
              onChange={(e) => set("last_name", e.target.value)}
              placeholder="Last Name"
              className={inputClass}
            />
          </div>

          <input
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="Email *"
            type="email"
            className={inputClass}
          />

          {!initialData && (
            <input
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Password (default: Welcome@123)"
              type="password"
              className={inputClass}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <select value={form.role} onChange={(e) => set("role", e.target.value)} className={inputClass}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>

            <select value={form.store_id} onChange={(e) => set("store_id", e.target.value)} className={inputClass}>
              <option value="">No Store</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1.5">Status</p>
            <div className="flex gap-2">
              {[{ label: "Active", value: true }, { label: "Inactive", value: false }].map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => set("is_active", value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition border ${
                    form.is_active === value
                      ? value
                        ? "bg-green-100 text-green-700 border-green-300"
                        : "bg-red-100 text-red-600 border-red-300"
                      : "bg-gray-50 text-gray-500 border-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => onSubmit(form)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {initialData ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── DELETE MODAL ── */

function DeleteModal({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Delete User</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-500" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">This action cannot be undone. The user will be deactivated.</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
}
