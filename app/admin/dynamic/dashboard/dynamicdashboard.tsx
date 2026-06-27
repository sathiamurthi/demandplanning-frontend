"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet } from "@/lib/api";
import { getTenantId } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area,
} from "recharts";
import {
  Package, TrendingUp, AlertTriangle, ShoppingCart,
  RefreshCw, Sparkles, ArrowUpRight, ArrowDownRight,
  AlertCircle, CheckCircle, BarChart3, Clock,
} from "lucide-react";

/* ── Types ── */
interface DashboardData {
  totalItems: number;
  stockValue: number;
  lowStock: number;
  outOfStock: number;
  todaySales: number;
  monthSales: number;
  salesTrend: { day: string; total: number }[];
  lowStockItems: { name: string; current_stock: number; reorder_level: number; deficit_pct: number }[];
  alerts: { message: string; severity: string; created_at: string }[];
  forecast: { name: string; predicted_qty_30d: number; risk_level: string; confidence_pct: number; order_needed: boolean; reasoning: string }[];
  topItems: { name: string; qty_sold: number; revenue: number }[];
}

/* ── Normalise raw API response ── */
function normalise(raw: Partial<DashboardData> = {}): DashboardData {
  return {
    totalItems:   Number(raw.totalItems ?? 0),
    stockValue:   Number(raw.stockValue ?? 0),
    lowStock:     Number(raw.lowStock ?? 0),
    outOfStock:   Number(raw.outOfStock ?? 0),
    todaySales:   Number(raw.todaySales ?? 0),
    monthSales:   Number(raw.monthSales ?? 0),
    salesTrend:   Array.isArray(raw.salesTrend)   ? raw.salesTrend.map(x => ({ ...x, total: Number(x.total) })) : [],
    lowStockItems:Array.isArray(raw.lowStockItems) ? raw.lowStockItems.map(x => ({ ...x, current_stock: Number(x.current_stock), reorder_level: Number(x.reorder_level ?? 0), deficit_pct: Number(x.deficit_pct ?? 0) })) : [],
    alerts:       Array.isArray(raw.alerts)        ? raw.alerts : [],
    forecast:     Array.isArray(raw.forecast)      ? raw.forecast.map(x => ({ ...x, predicted_qty_30d: Number(x.predicted_qty_30d), confidence_pct: Number(x.confidence_pct ?? 0) })) : [],
    topItems:     Array.isArray(raw.topItems)      ? raw.topItems.map(x => ({ ...x, qty_sold: Number(x.qty_sold), revenue: Number(x.revenue) })) : [],
  };
}

/* ── Formatters ── */
const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

/* ── KPI card ── */
function KpiCard({
  label, value, sub, icon: Icon,
  iconBg = "bg-gray-100", iconColor = "text-gray-500",
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; iconBg?: string; iconColor?: string;
}) {
  return (
    <div className="theme-card bg-white border border-gray-100 rounded-2xl p-5 shadow-sm
                    hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest leading-tight pr-2">
          {label}
        </p>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-4xl sm:text-5xl font-bold text-gray-900 leading-none tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-2 leading-snug">{sub}</p>}
    </div>
  );
}

/* ── Risk badge ── */
const RISK_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high:     "bg-orange-100 text-orange-700",
  medium:   "bg-amber-100 text-amber-700",
  low:      "bg-emerald-100 text-emerald-700",
};
const SEVERITY_COLORS: Record<string, string> = {
  critical: "border-l-red-500 bg-red-50",
  warning:  "border-l-amber-500 bg-amber-50",
  high:     "border-l-orange-500 bg-orange-50",
  low:      "border-l-blue-500 bg-blue-50",
  info:     "border-l-blue-500 bg-blue-50",
};

function RiskBadge({ level }: { level: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${RISK_COLORS[level.toLowerCase()] ?? RISK_COLORS.low}`}>
      {level}
    </span>
  );
}

/* ── Section header ── */
function Section({ title, icon: Icon, badge, num, children }: {
  title: string; icon: React.ElementType; badge?: number; num?: number; children: React.ReactNode;
}) {
  return (
    <div className="theme-card rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          {num !== undefined && (
            <span className="text-xs font-bold text-gold-500 min-w-[1.5rem]">
              {String(num).padStart(2, "0")}
            </span>
          )}
          <Icon className="h-4 w-4 text-gold-500" />
          {title}
        </h2>
        {badge !== undefined && badge > 0 && (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Custom chart tooltip ── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-lg text-xs">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      <p className="text-gold-600 font-semibold">{fmtCurrency(payload[0].value)}</p>
    </div>
  );
}

/* ── Config type ── */
export interface DashboardConfig {
  storeId: string;
  title: string;
  refreshInterval?: number;
  sections?: Record<string, boolean>;
}

/* ── Main dashboard ── */
export function DynamicDashboard({ config }: { config: DashboardConfig }) {
  const [data, setData]           = useState<DashboardData>(normalise());
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const tenantId = getTenantId() ?? "";
  const storeId  = config.storeId;

  const load = useCallback(async (silent = false) => {
    if (!storeId || !tenantId) return;
    if (!silent) setLoading(true); else setRefreshing(true);
    setError(null);
    try {
      const r = await apiGet<{ success: boolean; data: any }>(
        `/tenants/${tenantId}/stores/${storeId}/dashboard`
      );
      setData(normalise(r?.data ?? {}));
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId, tenantId]);

  useEffect(() => { load(false); }, [load]);

  useEffect(() => {
    if (!config.refreshInterval) return;
    const id = setInterval(() => load(true), config.refreshInterval);
    return () => clearInterval(id);
  }, [load, config.refreshInterval]);

  const trendData = data.salesTrend.map((row) => ({
    day: new Date(row.day).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    total: row.total,
  }));

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-7 w-44 bg-gray-100 rounded-lg" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="h-56 bg-gray-100 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-48 bg-gray-100 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 p-8">
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 flex gap-3 max-w-md">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 text-sm">Failed to load dashboard</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
            <button onClick={() => load(false)}
                    className="mt-3 text-xs font-medium text-red-700 underline hover:no-underline">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-content min-h-full p-5 sm:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {lastUpdated && (
              <span className="flex items-center gap-1">
                · <Clock className="h-3 w-3" />
                {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2
                     text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors
                     disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Items"
          value={fmt(data.totalItems)}
          sub="SKUs in store"
          icon={Package}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <KpiCard
          label="Stock Value"
          value={fmtCurrency(data.stockValue)}
          sub="Current inventory"
          icon={BarChart3}
          iconBg="bg-gold-50"
          iconColor="text-gold-600"
        />
        <KpiCard
          label="Low Stock"
          value={fmt(data.lowStock)}
          sub={data.outOfStock > 0 ? `${data.outOfStock} out of stock` : "items below reorder"}
          icon={AlertTriangle}
          iconBg={data.lowStock > 0 ? "bg-orange-50" : "bg-gray-100"}
          iconColor={data.lowStock > 0 ? "text-orange-500" : "text-gray-400"}
        />
        <KpiCard
          label="Today's Sales"
          value={fmtCurrency(data.todaySales)}
          sub={`${fmtCurrency(data.monthSales)} this month`}
          icon={ShoppingCart}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
        />
      </div>

      {/* Sales Trend */}
      <Section title="Sales Trend — Last 30 Days" icon={TrendingUp} num={1}>
        {trendData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <TrendingUp className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No sales data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#D4A843" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                     tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" stroke="#D4A843" strokeWidth={2}
                    fill="url(#salesGrad)" dot={false} activeDot={{ r: 4, fill: "#D4A843" }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Low Stock Alerts */}
        <Section title="Low Stock" icon={AlertTriangle} badge={data.lowStock} num={2}>
          {data.lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <CheckCircle className="h-7 w-7 mb-1.5 text-emerald-400" />
              <p className="text-sm text-emerald-600 font-medium">All stock levels healthy</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {data.lowStockItems.map((item, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.current_stock} / {item.reorder_level} (reorder level)
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-bold text-amber-700">
                      {item.current_stock === 0 ? "OUT" : `${Math.round(item.deficit_pct ?? 0)}% low`}
                    </span>
                    <div className="h-1.5 w-20 rounded-full bg-amber-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${item.current_stock === 0 ? "bg-red-500" : "bg-amber-500"}`}
                        style={{ width: `${Math.max(5, 100 - (item.deficit_pct ?? 0))}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* AI Forecasts */}
        <Section title="AI Demand Forecast" icon={Sparkles} badge={data.forecast.filter(f => f.order_needed).length} num={3}>
          {data.forecast.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Sparkles className="h-7 w-7 mb-1.5 opacity-30" />
              <p className="text-sm">No forecasts yet</p>
              <p className="text-xs mt-1 text-center max-w-[200px]">
                Run a forecast report to see AI predictions here
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {data.forecast.map((f, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                      <RiskBadge level={f.risk_level} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{f.reasoning}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-800">{fmt(f.predicted_qty_30d)}</p>
                    <p className="text-[10px] text-gray-400">30d forecast</p>
                    {f.order_needed && (
                      <span className="text-[10px] font-semibold text-red-600">Order needed</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

      </div>

      {/* System Alerts */}
      {data.alerts.length > 0 && (
        <Section title="Alerts" icon={AlertCircle} badge={data.alerts.length} num={4}>
          <ul className="space-y-2">
            {data.alerts.map((alert, i) => (
              <li key={i}
                  className={`border-l-4 rounded-r-xl px-4 py-2.5 text-sm
                    ${SEVERITY_COLORS[alert.severity?.toLowerCase()] ?? SEVERITY_COLORS.info}`}>
                {alert.message}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Top Selling Items */}
      {data.topItems.length > 0 && (
        <Section title="Top Items (Last 30 Days)" icon={BarChart3} num={5}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[360px]">
              <thead>
                <tr className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  <th className="pb-2 text-left">Item</th>
                  <th className="pb-2 text-right">Qty Sold</th>
                  <th className="pb-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.topItems.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 font-medium text-gray-800">{item.name}</td>
                    <td className="py-2 text-right text-gray-600">{fmt(item.qty_sold)}</td>
                    <td className="py-2 text-right font-semibold text-gray-800">{fmtCurrency(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}
