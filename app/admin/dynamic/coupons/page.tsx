"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Plus, Edit2, CheckCircle2, XCircle, Tag, RefreshCw,
  Loader2, AlertTriangle, Copy, Clock, Users, Lock,
  TrendingUp, Calendar, ChevronDown, ChevronUp,
} from "lucide-react";

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}
function getTenantId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("tenantId") || "";
}
function authHeaders(): HeadersInit {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}
function fmtINR(v: any) {
  const n = parseFloat(v);
  if (isNaN(n)) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n);
}
function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** Returns a human-readable expiry string + urgency level */
function expiryInfo(valid_to: string | null): { label: string; color: string; urgent: boolean } {
  if (!valid_to) return { label: "No expiry", color: "text-gray-400", urgent: false };
  const diff = Math.ceil((new Date(valid_to).getTime() - Date.now()) / 86400000);
  if (diff < 0)  return { label: `Expired ${Math.abs(diff)}d ago`, color: "text-red-500", urgent: true };
  if (diff === 0) return { label: "Expires today!", color: "text-red-500", urgent: true };
  if (diff <= 3)  return { label: `Expires in ${diff}d`, color: "text-amber-500", urgent: true };
  if (diff <= 7)  return { label: `Expires in ${diff}d`, color: "text-amber-400", urgent: false };
  return { label: `Expires ${fmtDate(valid_to)}`, color: "text-gray-400", urgent: false };
}

/** Returns claim status info */
function claimInfo(used_count: number, usage_limit: number | null): {
  label: string; color: string; pct: number; blocked: boolean;
} {
  if (!usage_limit) return { label: `${used_count} used · Unlimited`, color: "bg-blue-400", pct: 0, blocked: false };
  const pct = Math.min(100, Math.round((used_count / usage_limit) * 100));
  if (used_count >= usage_limit)
    return { label: `${used_count}/${usage_limit} · Fully Claimed`, color: "bg-red-500", pct: 100, blocked: true };
  if (pct >= 75)
    return { label: `${used_count}/${usage_limit} claimed`, color: "bg-amber-400", pct, blocked: false };
  return { label: `${used_count}/${usage_limit} claimed`, color: "bg-green-400", pct, blocked: false };
}

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: string;
  min_order_value: string;
  max_discount: string | null;
  usage_limit: number | null;
  used_count: number;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean;
  store_name: string | null;
  created_at: string;
}

const emptyForm = {
  code: "", description: "", discount_type: "percentage" as "percentage" | "fixed",
  discount_value: "", min_order_value: "0", max_discount: "",
  usage_limit: "", valid_from: "", valid_to: "", is_active: true,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "claimed" | "inactive">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/v1/tenants/${getTenantId()}/coupons`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setCoupons(d.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ ...emptyForm }); setEditId(null); setShowForm(true); setMsg(null); };
  const openEdit = (c: Coupon) => {
    setForm({
      code: c.code, description: c.description || "",
      discount_type: c.discount_type, discount_value: c.discount_value,
      min_order_value: c.min_order_value || "0",
      max_discount: c.max_discount || "", usage_limit: c.usage_limit?.toString() || "",
      valid_from: c.valid_from ? c.valid_from.slice(0, 10) : "",
      valid_to: c.valid_to ? c.valid_to.slice(0, 10) : "",
      is_active: c.is_active,
    });
    setEditId(c.id); setShowForm(true); setMsg(null);
  };

  const handleSave = async () => {
    if (!form.discount_value || isNaN(parseFloat(form.discount_value))) {
      setMsg({ ok: false, text: "Discount value required" }); return;
    }
    setSaving(true); setMsg(null);
    try {
      const payload = {
        ...(form.code.trim() ? { code: form.code.trim().toUpperCase() } : {}),
        description: form.description || undefined,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_order_value: parseFloat(form.min_order_value) || 0,
        max_discount: form.max_discount ? parseFloat(form.max_discount) : undefined,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : undefined,
        valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : undefined,
        valid_to: form.valid_to ? new Date(form.valid_to + "T23:59:59").toISOString() : undefined,
        is_active: form.is_active,
      };
      const tid = getTenantId();
      const url = editId ? `/v1/tenants/${tid}/coupons/${editId}` : `/v1/tenants/${tid}/coupons`;
      const r = await fetch(url, { method: editId ? "PATCH" : "POST", headers: authHeaders(), body: JSON.stringify(payload) });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || "Failed");
      setMsg({ ok: true, text: editId ? "Coupon updated!" : "Coupon created!" });
      setShowForm(false); setEditId(null); load();
    } catch (e: any) { setMsg({ ok: false, text: e.message }); }
    setSaving(false);
  };

  const handleDeactivate = async (id: string) => {
    await fetch(`/v1/tenants/${getTenantId()}/coupons/${id}`, { method: "DELETE", headers: authHeaders() });
    load();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code); setTimeout(() => setCopied(null), 1500);
  };

  // Derived status for each coupon
  const getCouponStatus = (c: Coupon) => {
    const now = new Date();
    if (!c.is_active) return "inactive";
    if (c.valid_to && new Date(c.valid_to) < now) return "expired";
    if (c.usage_limit && c.used_count >= c.usage_limit) return "claimed";
    return "active";
  };

  const filtered = coupons.filter(c => {
    if (filter === "all") return true;
    return getCouponStatus(c) === filter;
  });

  // Stats
  const stats = {
    all: coupons.length,
    active: coupons.filter(c => getCouponStatus(c) === "active").length,
    expired: coupons.filter(c => getCouponStatus(c) === "expired").length,
    claimed: coupons.filter(c => getCouponStatus(c) === "claimed").length,
    inactive: coupons.filter(c => getCouponStatus(c) === "inactive").length,
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Tag size={22} className="text-orange-500" /> Coupons
          </h1>
          <p className="text-gray-400 text-sm mt-1">Create and manage discount codes for customers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
            <RefreshCw size={15} />
          </button>
          <button onClick={openNew}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm">
            <Plus size={15} /> New Coupon
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {!loading && coupons.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {(["all", "active", "expired", "claimed", "inactive"] as const).map(s => {
            const colors = {
              all: "bg-gray-50 text-gray-700 border-gray-200",
              active: "bg-green-50 text-green-700 border-green-200",
              expired: "bg-red-50 text-red-600 border-red-200",
              claimed: "bg-amber-50 text-amber-600 border-amber-200",
              inactive: "bg-gray-50 text-gray-500 border-gray-200",
            };
            const labels = { all: "All", active: "Active", expired: "Expired", claimed: "Fully Claimed", inactive: "Inactive" };
            const isSelected = filter === s;
            return (
              <button key={s} onClick={() => setFilter(s)}
                className={`rounded-xl border p-3 text-left transition-all ${colors[s]} ${isSelected ? "ring-2 ring-offset-1 ring-orange-400 shadow-sm" : "hover:opacity-80"}`}>
                <p className="text-xs font-semibold">{labels[s]}</p>
                <p className="text-xl font-black mt-0.5">{stats[s]}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Global message */}
      {msg && !showForm && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {msg.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />} {msg.text}
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-900 text-lg">{editId ? "Edit Coupon" : "Create New Coupon"}</h2>
          {msg && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
              {msg.ok ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />} {msg.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                Code <span className="normal-case text-gray-400 font-normal">(leave blank to auto-generate)</span>
              </label>
              <div className="flex gap-2">
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="Auto-generated if blank"
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-400" />
                <button type="button"
                  onClick={() => {
                    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
                    const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
                    setForm(f => ({ ...f, code }));
                  }}
                  className="px-3 py-2 rounded-xl border border-orange-200 bg-orange-50 text-orange-600 text-xs font-bold hover:bg-orange-100 whitespace-nowrap transition-colors">
                  Generate
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Festive 20% discount"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Discount Type *</label>
              <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as any }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                Value * {form.discount_type === "percentage" ? "(%)" : "(₹)"}
              </label>
              <input type="number" min="0" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                placeholder={form.discount_type === "percentage" ? "e.g. 20" : "e.g. 50"}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Min Order (₹)</label>
              <input type="number" min="0" value={form.min_order_value} onChange={e => setForm(f => ({ ...f, min_order_value: e.target.value }))}
                placeholder="0 = no minimum"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            {form.discount_type === "percentage" && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Max Discount Cap (₹)</label>
                <input type="number" min="0" value={form.max_discount} onChange={e => setForm(f => ({ ...f, max_discount: e.target.value }))}
                  placeholder="Optional — no cap"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                Max Claims <span className="normal-case text-gray-400 font-normal">(usage limit)</span>
              </label>
              <input type="number" min="1" value={form.usage_limit} onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))}
                placeholder="Leave blank = unlimited"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Valid From</label>
              <input type="date" value={form.valid_from} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Expiry Date</label>
              <input type="date" value={form.valid_to} onChange={e => setForm(f => ({ ...f, valid_to: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4 accent-orange-500" />
              <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">Active (usable by customers)</label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {saving ? "Saving…" : (editId ? "Update Coupon" : "Create Coupon")}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); setMsg(null); }}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-semibold">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Coupon List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <Loader2 size={24} className="animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading coupons…</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <Tag size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 font-semibold">No coupons yet</p>
          <p className="text-gray-300 text-sm mt-1">Create your first coupon to start offering discounts</p>
          <button onClick={openNew} className="mt-4 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold">
            Create Coupon
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No coupons match this filter.</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(c => {
            const status = getCouponStatus(c);
            const isBlocked = status === "expired" || status === "claimed" || status === "inactive";
            const expiry = expiryInfo(c.valid_to);
            const claim = claimInfo(c.used_count, c.usage_limit);

            const statusBadge = {
              active:   { label: "Active",        bg: "bg-green-50 text-green-700 border-green-200" },
              expired:  { label: "Expired",        bg: "bg-red-50 text-red-600 border-red-200" },
              claimed:  { label: "Fully Claimed",  bg: "bg-amber-50 text-amber-600 border-amber-200" },
              inactive: { label: "Inactive",       bg: "bg-gray-100 text-gray-500 border-gray-200" },
            }[status];

            return (
              <div key={c.id}
                className={`bg-white border rounded-2xl p-5 transition-all ${
                  isBlocked
                    ? "border-gray-100 opacity-70 grayscale-[30%]"
                    : expiry.urgent
                    ? "border-amber-200 shadow-sm shadow-amber-50"
                    : "border-gray-100 hover:shadow-sm"
                }`}>
                <div className="flex items-start gap-4">
                  {/* Code badge */}
                  <div className={`shrink-0 rounded-xl px-4 py-3 text-center min-w-[96px] border ${
                    isBlocked ? "bg-gray-50 border-gray-100" : "bg-orange-50 border-orange-100"
                  }`}>
                    <p className={`font-black text-sm tracking-widest ${isBlocked ? "text-gray-400" : "text-orange-500"}`}>{c.code}</p>
                    <button onClick={() => copyCode(c.code)}
                      className="mt-1 text-[10px] text-gray-400 hover:text-orange-400 flex items-center gap-0.5 mx-auto transition-colors">
                      <Copy size={9} />{copied === c.code ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    {/* Top row: status + discount type + blocked warning */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                        {c.discount_type === "percentage"
                          ? `${c.discount_value}% off${c.max_discount ? ` · max ${fmtINR(c.max_discount)}` : ""}`
                          : `Flat ${fmtINR(c.discount_value)} off`}
                      </span>
                      {isBlocked && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-500">
                          <Lock size={9} /> Cannot be used
                        </span>
                      )}
                    </div>

                    {c.description && <p className="text-xs text-gray-500 mt-1">{c.description}</p>}

                    {/* Claim progress bar */}
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold">
                          <Users size={9} /> {claim.label}
                        </span>
                        {c.usage_limit && (
                          <span className="text-[10px] text-gray-400">
                            {Math.min(100, Math.round((c.used_count / c.usage_limit) * 100))}% claimed
                          </span>
                        )}
                      </div>
                      {c.usage_limit ? (
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${claim.color}`}
                            style={{ width: `${claim.pct}%` }}
                          />
                        </div>
                      ) : (
                        <div className="h-1.5 bg-blue-100 rounded-full" />
                      )}
                    </div>

                    {/* Expiry + meta */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-2 text-[10px]">
                      <span className={`flex items-center gap-1 font-semibold ${expiry.color}`}>
                        <Clock size={9} /> {expiry.label}
                      </span>
                      {parseFloat(c.min_order_value) > 0 && (
                        <span className="text-gray-400">Min order: {fmtINR(c.min_order_value)}</span>
                      )}
                      {c.valid_from && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Calendar size={9} /> From {fmtDate(c.valid_from)}
                        </span>
                      )}
                      {c.store_name && <span className="text-gray-400">· {c.store_name}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => openEdit(c)} title="Edit"
                      className="p-2 rounded-lg border border-gray-100 hover:bg-orange-50 hover:border-orange-200 text-gray-400 hover:text-orange-500 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    {c.is_active && (
                      <button onClick={() => handleDeactivate(c.id)} title="Deactivate"
                        className="p-2 rounded-lg border border-gray-100 hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-500 transition-colors">
                        <XCircle size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
