"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet } from "@/lib/api";
import { getTenantId } from "@/lib/utils";
import { useStore } from "../../appshell";
import {
  FileBarChart2, Package, AlertTriangle, ShoppingCart, BarChart3,
  CheckCircle, XCircle, Printer, RefreshCw, TrendingDown, ArrowRight,
  Clock, Store,
} from "lucide-react";

/* ── Types ── */
interface DashboardData {
  totalItems: number;
  stockValue: number;
  lowStock: number;
  outOfStock: number;
  todaySales: number;
  monthSales: number;
  lowStockItems: { name: string; current_stock: number; reorder_level: number; deficit_pct: number }[];
  alerts: { message: string; severity: string }[];
  topItems: { name: string; qty_sold: number; revenue: number }[];
}

function normalise(raw: Partial<DashboardData> = {}): DashboardData {
  return {
    totalItems:    Number(raw.totalItems ?? 0),
    stockValue:    Number(raw.stockValue ?? 0),
    lowStock:      Number(raw.lowStock ?? 0),
    outOfStock:    Number(raw.outOfStock ?? 0),
    todaySales:    Number(raw.todaySales ?? 0),
    monthSales:    Number(raw.monthSales ?? 0),
    lowStockItems: Array.isArray(raw.lowStockItems) ? raw.lowStockItems : [],
    alerts:        Array.isArray(raw.alerts)        ? raw.alerts : [],
    topItems:      Array.isArray(raw.topItems)      ? raw.topItems : [],
  };
}

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);
const fmtCur = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

/* ── Health score ── */
function calcHealth(d: DashboardData): { score: number; label: string; color: string; bg: string } {
  if (d.totalItems === 0) return { score: 0, label: "No data", color: "text-gray-500", bg: "bg-gray-100" };
  const outPct   = (d.outOfStock / d.totalItems) * 100;
  const lowPct   = (d.lowStock   / d.totalItems) * 100;
  const critFactor = d.alerts.filter(a => a.severity === "critical").length;
  let score = 100 - outPct * 2 - lowPct - critFactor * 5;
  score = Math.min(100, Math.max(0, Math.round(score)));
  if (score >= 80) return { score, label: "Healthy",  color: "text-emerald-700", bg: "bg-emerald-50" };
  if (score >= 60) return { score, label: "Moderate", color: "text-amber-700",   bg: "bg-amber-50"   };
  return              { score, label: "Critical", color: "text-red-700",     bg: "bg-red-50"     };
}

/* ── Action item row ── */
function ActionItem({ priority, text, icon: Icon }: { priority: "high" | "medium" | "low"; text: string; icon: React.ElementType }) {
  const styles = {
    high:   "border-l-red-500    bg-red-50    text-red-800",
    medium: "border-l-amber-500  bg-amber-50  text-amber-800",
    low:    "border-l-blue-500   bg-blue-50   text-blue-800",
  };
  return (
    <div className={`flex items-start gap-3 border-l-4 rounded-r-xl px-4 py-3 ${styles[priority]}`}>
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

/* ── Stat row ── */
function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold text-gray-900">{value}</span>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Page ── */
function BasicReportInner() {
  const { storeId, stores, loading: storeLoading } = useStore();
  const [data, setData]       = useState<DashboardData>(normalise());
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const tenantId = getTenantId() ?? "";

  const storeName = stores.find((s: any) => s.id === storeId)?.name ?? storeId;

  const load = useCallback(async () => {
    if (!storeId || !tenantId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const r = await apiGet<{ success: boolean; data: any }>(
        `/tenants/${tenantId}/stores/${storeId}/dashboard`
      );
      setData(normalise(r?.data ?? {}));
      setGeneratedAt(new Date());
    } catch (e: any) {
      setError(e?.message ?? "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [storeId, tenantId]);

  useEffect(() => { load(); }, [load]);

  if (storeLoading || loading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-8 w-64 bg-gray-100 rounded-lg" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="h-48 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 p-8">
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 flex gap-3 max-w-md">
          <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 text-sm">Failed to generate report</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
            <button onClick={load} className="mt-3 text-xs font-medium text-red-700 underline">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <Store className="h-10 w-10 text-gray-300 mb-3" />
        <p className="font-semibold text-gray-700">No store selected</p>
        <p className="text-sm text-gray-400 mt-1">Select a store from the top bar to generate a report.</p>
      </div>
    );
  }

  const health  = calcHealth(data);
  const actions: { priority: "high" | "medium" | "low"; text: string; icon: React.ElementType }[] = [];

  if (data.outOfStock > 0)
    actions.push({ priority: "high", text: `${data.outOfStock} item(s) are completely out of stock — place orders immediately.`, icon: XCircle });
  if (data.lowStock > data.outOfStock)
    actions.push({ priority: "medium", text: `${data.lowStock - data.outOfStock} item(s) are below reorder level — review and replenish.`, icon: AlertTriangle });
  if (data.alerts.filter(a => a.severity === "critical").length > 0)
    actions.push({ priority: "high", text: `${data.alerts.filter(a => a.severity === "critical").length} critical alert(s) require immediate attention.`, icon: AlertTriangle });
  if (actions.length === 0)
    actions.push({ priority: "low", text: "Stock levels are healthy. Continue regular monitoring.", icon: CheckCircle });

  return (
    <div className="theme-content min-h-full p-5 sm:p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <FileBarChart2 className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Basic Inventory Report</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Store className="h-3 w-3" /> {storeName}
              </span>
              {generatedAt && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {generatedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })},&nbsp;
                  {generatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2
                       text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-3 py-2
                       text-xs font-medium text-white hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* ── Health Score ── */}
      <div className={`rounded-2xl border p-5 ${health.bg} flex items-center gap-6`}
           style={{ borderColor: "transparent" }}>
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke={health.score >= 80 ? "#10b981" : health.score >= 60 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="3"
                    strokeDasharray={`${health.score} ${100 - health.score}`}
                    strokeLinecap="round" />
          </svg>
          <span className={`absolute text-lg font-bold ${health.color}`}>{health.score}</span>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
            Inventory Health Score
          </p>
          <p className={`text-2xl font-bold ${health.color}`}>{health.label}</p>
          <p className="text-sm text-gray-600 mt-1">
            Based on stock levels, out-of-stock items, and active alerts.
          </p>
        </div>
      </div>

      {/* ── KPI Summary ── */}
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
          <span className="text-gold-500">01</span> Summary
        </h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Total SKUs",    value: fmt(data.totalItems),     sub: "in store",            icon: Package,       iconBg: "bg-blue-50",    iconColor: "text-blue-500"    },
            { label: "Stock Value",   value: fmtCur(data.stockValue),  sub: "current inventory",   icon: BarChart3,     iconBg: "bg-gold-50",    iconColor: "text-gold-600"    },
            { label: "Low Stock",     value: fmt(data.lowStock),       sub: `${data.outOfStock} out of stock`, icon: AlertTriangle, iconBg: data.lowStock > 0 ? "bg-orange-50" : "bg-gray-100", iconColor: data.lowStock > 0 ? "text-orange-500" : "text-gray-400" },
            { label: "Month Sales",   value: fmtCur(data.monthSales),  sub: `${fmtCur(data.todaySales)} today`, icon: ShoppingCart,  iconBg: "bg-emerald-50", iconColor: "text-emerald-500" },
          ].map((k) => (
            <div key={k.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest pr-2">{k.label}</p>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${k.iconBg}`}>
                  <k.icon className={`h-4 w-4 ${k.iconColor}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{k.value}</p>
              <p className="text-xs text-gray-500 mt-2">{k.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Action Items ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <span className="text-gold-500">02</span> Action Items
          </h2>
          <div className="space-y-2">
            {actions.map((a, i) => <ActionItem key={i} {...a} />)}
          </div>
        </div>

        {/* ── Inventory Stats ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <span className="text-gold-500">03</span> Inventory Metrics
          </h2>
          <StatRow label="Total SKUs"            value={fmt(data.totalItems)} />
          <StatRow label="In-stock items"        value={fmt(data.totalItems - data.outOfStock)} sub={`${data.outOfStock} out of stock`} />
          <StatRow label="Low-stock items"       value={fmt(data.lowStock)} sub="below reorder level" />
          <StatRow label="Stock value"           value={fmtCur(data.stockValue)} />
          <StatRow label="Today's revenue"       value={fmtCur(data.todaySales)} />
          <StatRow label="Monthly revenue"       value={fmtCur(data.monthSales)} />
        </div>

      </div>

      {/* ── Low Stock Table ── */}
      {data.lowStockItems.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <span className="text-gold-500">04</span> Items Needing Attention
            <span className="ml-auto rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700">
              {data.lowStockItems.length} items
            </span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide border-b border-gray-50">
                  <th className="pb-2 text-left">Item</th>
                  <th className="pb-2 text-right">Current</th>
                  <th className="pb-2 text-right">Reorder level</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.lowStockItems.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 font-medium text-gray-800">{item.name}</td>
                    <td className="py-2.5 text-right text-gray-600">{fmt(item.current_stock)}</td>
                    <td className="py-2.5 text-right text-gray-500">{fmt(item.reorder_level)}</td>
                    <td className="py-2.5 text-right">
                      {item.current_stock === 0 ? (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">OUT</span>
                      ) : (
                        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                          {Math.round(item.deficit_pct ?? 0)}% low
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Top Items ── */}
      {data.topItems.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <span className="text-gold-500">05</span> Top Selling Items
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[360px]">
              <thead>
                <tr className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide border-b border-gray-50">
                  <th className="pb-2 text-left">#</th>
                  <th className="pb-2 text-left">Item</th>
                  <th className="pb-2 text-right">Qty Sold</th>
                  <th className="pb-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.topItems.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 text-xs font-bold text-gold-500">{String(i + 1).padStart(2, "0")}</td>
                    <td className="py-2.5 font-medium text-gray-800">{item.name}</td>
                    <td className="py-2.5 text-right text-gray-600">{fmt(item.qty_sold)}</td>
                    <td className="py-2.5 text-right font-semibold text-gray-900">{fmtCur(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Upgrade prompt ── */}
      <div className="rounded-2xl border border-gold-200 bg-gradient-to-r from-gold-50 to-amber-50 p-5
                      flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-100">
          <TrendingDown className="h-5 w-5 text-gold-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">Get AI-powered demand forecasts</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Upgrade to Advanced to unlock 30-day predictions, seasonal analysis, and bulk forecasting.
          </p>
        </div>
        <a href="/admin/dynamic/ai-reports/advanced"
           className="hidden sm:flex items-center gap-1.5 rounded-xl bg-gray-900 px-3 py-2
                      text-xs font-semibold text-white hover:bg-gray-800 transition-colors shrink-0">
          View Advanced
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

    </div>
  );
}

export default function BasicReportPage() {
  return <BasicReportInner />;
}
