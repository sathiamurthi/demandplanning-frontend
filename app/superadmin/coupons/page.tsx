"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Tag, RefreshCw, Loader2, Search, CheckCircle, XCircle,
  Building2, Store, Clock, Users, Lock, AlertTriangle, Calendar,
} from "lucide-react";

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
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

function expiryInfo(valid_to: string | null): { label: string; color: string; urgent: boolean } {
  if (!valid_to) return { label: "No expiry", color: "text-gray-400", urgent: false };
  const diff = Math.ceil((new Date(valid_to).getTime() - Date.now()) / 86400000);
  if (diff < 0)   return { label: `Expired ${Math.abs(diff)}d ago`, color: "text-red-500", urgent: true };
  if (diff === 0) return { label: "Expires today!", color: "text-red-500", urgent: true };
  if (diff <= 3)  return { label: `Expires in ${diff}d`, color: "text-amber-500", urgent: true };
  if (diff <= 7)  return { label: `Expires in ${diff}d`, color: "text-amber-400", urgent: false };
  return { label: `Expires ${fmtDate(valid_to)}`, color: "text-gray-400", urgent: false };
}

function claimInfo(used_count: number, usage_limit: number | null): {
  label: string; barColor: string; pct: number; blocked: boolean;
} {
  if (!usage_limit) return { label: `${used_count} used · Unlimited`, barColor: "bg-blue-400", pct: 0, blocked: false };
  const pct = Math.min(100, Math.round((used_count / usage_limit) * 100));
  if (used_count >= usage_limit)
    return { label: `${used_count}/${usage_limit} · Fully Claimed`, barColor: "bg-red-500", pct: 100, blocked: true };
  if (pct >= 75)
    return { label: `${used_count}/${usage_limit} claimed`, barColor: "bg-amber-400", pct, blocked: false };
  return { label: `${used_count}/${usage_limit} claimed`, barColor: "bg-green-400", pct, blocked: false };
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
  tenant_name: string | null;
  store_name: string | null;
  created_at: string;
}

type StatusKey = "all" | "active" | "expired" | "claimed" | "inactive";

function getCouponStatus(c: Coupon): Exclude<StatusKey, "all"> {
  if (!c.is_active) return "inactive";
  if (c.valid_to && new Date(c.valid_to) < new Date()) return "expired";
  if (c.usage_limit && c.used_count >= c.usage_limit) return "claimed";
  return "active";
}

export default function SuperadminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTenant, setFilterTenant] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusKey>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const r = await fetch(`/v1/superadmin/coupons?${params}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setCoupons(d.data || []);
    } catch {}
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const tenants = Array.from(new Set(coupons.map(c => c.tenant_name).filter(Boolean))) as string[];

  const filtered = coupons.filter(c => {
    if (filterTenant && c.tenant_name !== filterTenant) return false;
    if (filterStatus !== "all" && getCouponStatus(c) !== filterStatus) return false;
    return true;
  });

  const stats: Record<StatusKey, number> = {
    all:      coupons.length,
    active:   coupons.filter(c => getCouponStatus(c) === "active").length,
    expired:  coupons.filter(c => getCouponStatus(c) === "expired").length,
    claimed:  coupons.filter(c => getCouponStatus(c) === "claimed").length,
    inactive: coupons.filter(c => getCouponStatus(c) === "inactive").length,
  };
  const totalUsages = coupons.reduce((s, c) => s + (c.used_count || 0), 0);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Tag size={22} className="text-violet-500" /> All Tenant Coupons
          </h1>
          <p className="text-gray-400 text-sm mt-1">Cross-tenant coupon monitoring — expiry, claim status, and usage</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {([
          { key: "all",      label: "Total",         color: "text-violet-600 bg-violet-50" },
          { key: "active",   label: "Active",        color: "text-green-600 bg-green-50" },
          { key: "expired",  label: "Expired",       color: "text-red-500 bg-red-50" },
          { key: "claimed",  label: "Fully Claimed", color: "text-amber-600 bg-amber-50" },
          { key: "inactive", label: "Inactive",      color: "text-gray-500 bg-gray-100" },
        ] as const).map(s => (
          <button key={s.key} onClick={() => setFilterStatus(s.key as StatusKey)}
            className={`${s.color} rounded-2xl p-4 text-left transition-all ${filterStatus === s.key ? "ring-2 ring-violet-400 ring-offset-1 shadow-sm" : "hover:opacity-80"}`}>
            <p className="text-xs font-semibold opacity-70">{s.label}</p>
            <p className="text-2xl font-black mt-1">{stats[s.key as StatusKey]}</p>
          </button>
        ))}
      </div>

      <div className="bg-violet-50 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm text-violet-700 font-semibold">
        <Users size={14} /> Total usages across all coupons: <span className="font-black">{totalUsages}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white border border-gray-100 rounded-2xl p-4">
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search code or description…"
            className="flex-1 text-sm outline-none bg-transparent" />
        </div>
        <select value={filterTenant} onChange={e => setFilterTenant(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 min-w-[160px]">
          <option value="">All Tenants</option>
          {tenants.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <Loader2 size={24} className="animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading coupons…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <Tag size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 font-semibold">No coupons found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(c => {
            const status = getCouponStatus(c);
            const isBlocked = status !== "active";
            const expiry = expiryInfo(c.valid_to);
            const claim = claimInfo(c.used_count, c.usage_limit);

            const statusConfig = {
              active:   { label: "Active",        cls: "bg-green-50 text-green-700 border-green-200" },
              expired:  { label: "Expired",        cls: "bg-red-50 text-red-600 border-red-200" },
              claimed:  { label: "Fully Claimed",  cls: "bg-amber-50 text-amber-600 border-amber-200" },
              inactive: { label: "Inactive",       cls: "bg-gray-100 text-gray-500 border-gray-200" },
            }[status];

            return (
              <div key={c.id}
                className={`bg-white rounded-2xl border p-5 transition-all ${
                  isBlocked
                    ? "border-gray-100 opacity-70"
                    : expiry.urgent
                    ? "border-amber-200 shadow-sm"
                    : "border-gray-100 hover:shadow-sm"
                }`}>
                <div className="flex items-start gap-4">
                  {/* Code badge */}
                  <div className={`shrink-0 rounded-xl px-4 py-3 text-center min-w-[96px] border ${
                    isBlocked ? "bg-gray-50 border-gray-100" : "bg-violet-50 border-violet-100"
                  }`}>
                    <p className={`font-black text-sm tracking-widest font-mono ${isBlocked ? "text-gray-400" : "text-violet-600"}`}>
                      {c.code}
                    </p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border mt-1 inline-block ${statusConfig.cls}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-700">
                        {c.discount_type === "percentage"
                          ? `${c.discount_value}% off${c.max_discount ? ` · max ${fmtINR(c.max_discount)}` : ""}`
                          : `Flat ${fmtINR(c.discount_value)} off`}
                      </span>
                      {parseFloat(c.min_order_value) > 0 && (
                        <span className="text-[10px] text-gray-400">· min {fmtINR(c.min_order_value)}</span>
                      )}
                      {isBlocked && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 ml-auto">
                          <Lock size={9} /> Cannot be used
                        </span>
                      )}
                    </div>

                    {/* Tenant + store */}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold">
                        <Building2 size={9} className="text-violet-400" /> {c.tenant_name || "—"}
                      </span>
                      {c.store_name && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Store size={9} /> {c.store_name}
                        </span>
                      )}
                      {!c.store_name && (
                        <span className="text-[10px] text-gray-300 italic">All stores</span>
                      )}
                    </div>

                    {c.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-md">{c.description}</p>
                    )}

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
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-xs">
                          <div className={`h-full rounded-full transition-all ${claim.barColor}`}
                            style={{ width: `${claim.pct}%` }} />
                        </div>
                      ) : (
                        <div className="h-1.5 bg-blue-100 rounded-full max-w-xs" />
                      )}
                    </div>

                    {/* Expiry row */}
                    <div className="flex flex-wrap items-center gap-x-4 mt-2 text-[10px]">
                      <span className={`flex items-center gap-1 font-semibold ${expiry.color}`}>
                        <Clock size={9} /> {expiry.label}
                      </span>
                      {c.valid_from && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Calendar size={9} /> From {fmtDate(c.valid_from)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 text-right">
        Showing {filtered.length} of {coupons.length} coupons
      </p>
    </div>
  );
}
