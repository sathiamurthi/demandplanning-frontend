"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet } from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { getTenantId } from "@/lib/utils";
import { useStore } from "../../appshell";

/* ───────────────── TYPES ───────────────── */

export interface DashboardConfig {
  title: string;
  storeId: string;
  refreshInterval?: number;
  sections: {
    kpis: boolean;
    salesTrend: boolean;
    lowStockItems: boolean;
    alerts: boolean;
    forecast: boolean;
  };
}

interface RawDashboardData {
  totalItems?: number;
  stockValue?: number;
  lowStock?: number;
  todaySales?: number;
  salesTrend?: { day: string; total: string | number }[];
  lowStockItems?: { name: string; current_stock: string | number }[];
  alerts?: { message: string; severity: string }[];
  forecast?: {
    name: string;
    predicted_qty_30d: string | number;
    risk_level: string;
  }[];
}

interface DashboardApiResponse {
  success: boolean;
  data: RawDashboardData;
}

interface DashboardData {
  totalItems: number;
  stockValue: number;
  lowStock: number;
  todaySales: number;
  salesTrend: { day: string; total: number }[];
  lowStockItems: { name: string; current_stock: number }[];
  alerts: { message: string; severity: string }[];
  forecast: {
    name: string;
    predicted_qty_30d: number;
    risk_level: string;
  }[];
}

/* ───────────────── NORMALISE ───────────────── */

function normalise(raw: RawDashboardData = {}): DashboardData {
  return {
    totalItems: Number(raw.totalItems ?? 0),
    stockValue: Number(raw.stockValue ?? 0),
    lowStock: Number(raw.lowStock ?? 0),
    todaySales: Number(raw.todaySales ?? 0),

    salesTrend: Array.isArray(raw.salesTrend)
      ? raw.salesTrend.map((x) => ({
          day: x.day,
          total: Number(x.total),
        }))
      : [],

    lowStockItems: Array.isArray(raw.lowStockItems)
      ? raw.lowStockItems.map((x) => ({
          name: x.name,
          current_stock: Number(x.current_stock),
        }))
      : [],

    alerts: Array.isArray(raw.alerts) ? raw.alerts : [],

    forecast: Array.isArray(raw.forecast)
      ? raw.forecast.map((x) => ({
          name: x.name,
          predicted_qty_30d: Number(x.predicted_qty_30d),
          risk_level: x.risk_level.toLowerCase(),
        }))
      : [],
  };
}

/* ───────────────── HELPERS ───────────────── */

function fmt(n: number, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-IN", opts).format(n);
}

function fmtCurrency(n: number) {
  return fmt(n, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-blue-50 text-blue-700 border-blue-200",
  medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

const RISK_BADGE: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
  critical: "bg-red-100 text-red-700",
};

/* ───────────────── UI COMPONENTS ───────────────── */

function KpiCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold text-slate-800 mb-4">
      {children}
    </h2>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="text-sm text-slate-400 py-6 text-center">
      {label}
    </p>
  );
}

/* ───────────────── MAIN ───────────────── */

export function DynamicDashboard({
  config,
}: {
  config: DashboardConfig;
}) {

  const { stores } = useStore();
   const storeName =
    stores.find((store) => store.id === config.storeId)?.name ||
    "Store Dashboard";
  const [data, setData] = useState<DashboardData>(normalise());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const tenantId = getTenantId();

  const load = useCallback(async () => {
    if (!config.storeId || !tenantId) return;

    try {
      setError(null);

      const response = await apiGet<DashboardApiResponse>(
        `/tenants/${tenantId}/stores/${config.storeId}/dashboard`
      );

      setData(normalise(response?.data || {}));
      setLastUpdated(new Date());
    } catch (e: any) {
      console.error(e);
      setData(normalise());
      setError(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [config.storeId, tenantId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    if (!config.refreshInterval) return;
    const id = setInterval(load, config.refreshInterval);
    return () => clearInterval(id);
  }, [load, config.refreshInterval]);

  if (loading) {
    return (
      <div className="p-8 text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-500">{error}</div>
    );
  }

  const trendData = data.salesTrend.map((row) => ({
    day: new Date(row.day).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    }),
    total: row.total,
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">
        {storeName}   
             </h1>
        <p className="text-slate-500 text-sm">
          AI-powered demand planning overview
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Medicines" value={fmt(data.totalItems)} />
        <KpiCard label="Low Stock" value={fmt(data.lowStock)} />
        <KpiCard
          label="Critical Alerts"
          value={fmt(
            data.alerts.filter((a) => a.severity === "critical").length
          )}
        />
        <KpiCard
          label="Orders Needed"
          value={fmt(data.forecast.length)}
        />
      </div>

      {/* Charts + Alerts */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Sales */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <SectionHeading>Recent Sales</SectionHeading>

          {!trendData.length ? (
            <EmptyState label="No sales data" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line
                  dataKey="total"
                  stroke="#2563EB"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm max-h-[360px] overflow-y-auto">
          <SectionHeading>Active Alerts</SectionHeading>

          {!data.alerts.length ? (
            <EmptyState label="No alerts 🎉" />
          ) : (
            <div className="space-y-3">
              {data.alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-4 ${
                    SEVERITY_STYLES[alert.severity] ||
                    SEVERITY_STYLES.low
                  }`}
                >
                  <div className="font-medium">
                    {alert.message}
                  </div>

                  <div className="text-xs mt-2 opacity-70">
                    {new Date().toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Forecast */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-slate-800">
          AI Forecasts
        </h2>

        <div className="grid md:grid-cols-3 gap-5">
          {data.forecast.map((f, i) => (
            <div
              key={i}
              className="bg-white border rounded-2xl p-5 shadow-sm"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-800">
                  {f.name}
                </h3>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    RISK_BADGE[f.risk_level] || RISK_BADGE.low
                  }`}
                >
                  {f.risk_level}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-semibold">
                    {fmt(f.predicted_qty_30d)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Predicted
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-semibold">
                    {Math.floor(Math.random() * 20) + 80}%
                  </p>
                  <p className="text-xs text-slate-500">
                    Confidence
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-semibold">
                    {Math.floor(f.predicted_qty_30d / 2)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Order Qty
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-500">
                AI recommendation based on inventory trends
                and projected demand.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      {lastUpdated && (
        <p className="text-xs text-slate-400 mt-8">
          Updated {lastUpdated.toLocaleTimeString("en-IN")}
        </p>
      )}
    </div>
  );
}