"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { getTenantId } from "@/lib/utils";
import { useStore } from "../../appshell";
import {
  Brain, Lock, Sparkles, TrendingUp, AlertTriangle, CheckCircle2,
  XCircle, RefreshCw, Play, Clock, Store, ChevronRight,
  BarChart3, Package, ArrowUpRight,
} from "lucide-react";

/* ── Types ── */
interface AiPlanInfo {
  planTier: "basic" | "advanced";
  planType: string;
  usage: { reportsUsed: number; reportsLimit: number; usagePercent: number; isUnlimited: boolean };
}

interface ForecastItem {
  id: string;
  item_name: string;
  predicted_qty_30d: number;
  risk_level: "Critical" | "High" | "Medium" | "Low";
  confidence_pct: number;
  order_needed: boolean;
  reasoning: string;
  current_stock: number;
  reorder_level: number;
  unit_symbol: string;
}

interface ForecastSummary {
  items_analyzed: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  orders_needed: number;
  last_run_at: string | null;
  ai_reports_used: number;
  ai_reports_per_month: number;
}

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);

/* ── Risk badge ── */
const RISK: Record<string, { bg: string; text: string }> = {
  critical: { bg: "bg-red-100",     text: "text-red-700"    },
  high:     { bg: "bg-orange-100",  text: "text-orange-700" },
  medium:   { bg: "bg-amber-100",   text: "text-amber-700"  },
  low:      { bg: "bg-emerald-100", text: "text-emerald-700"},
};

function RiskBadge({ level }: { level: string }) {
  const s = RISK[level.toLowerCase()] ?? RISK.low;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase
                      ${s.bg} ${s.text}`}>
      {level}
    </span>
  );
}

/* ── Summary stat pill ── */
function SumPill({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div className={`flex flex-col items-center rounded-xl border px-4 py-3 min-w-[72px] ${color}`}>
      <span className="text-2xl font-bold">{count}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide mt-0.5 opacity-70">{label}</span>
    </div>
  );
}

/* ── Page ── */
function AdvancedReportInner() {
  const { storeId, stores, loading: storeLoading } = useStore();
  const [plan, setPlan]         = useState<AiPlanInfo | null>(null);
  const [forecasts, setForecasts] = useState<ForecastItem[]>([]);
  const [summary, setSummary]   = useState<ForecastSummary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg]     = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const tenantId = getTenantId() ?? "";

  const storeName = stores.find((s: any) => s.id === storeId)?.name ?? storeId;

  /* Load plan + forecasts */
  const load = useCallback(async () => {
    if (!tenantId || !storeId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [planRes, latestRes, summaryRes] = await Promise.all([
        apiGet<{ success: boolean; data: AiPlanInfo }>(`/tenants/${tenantId}/ai-settings`),
        apiGet<{ success: boolean; data: ForecastItem[] }>(`/stores/${storeId}/report/latest`),
        apiGet<{ success: boolean; data: ForecastSummary }>(`/stores/${storeId}/report/summary`),
      ]);
      setPlan(planRes.data);
      setForecasts(latestRes.data ?? []);
      setSummary(summaryRes.data ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [storeId, tenantId]);

  useEffect(() => { load(); }, [load]);

  /* Generate new forecast */
  const generate = async () => {
    if (!storeId || !tenantId) return;
    setGenerating(true);
    setGenMsg(null);
    try {
      const user = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
      await apiPost(`/stores/${storeId}/report/generate`, {
        email: user ?? "report@demandplan.ai",
        includeExpiring: true,
        includeSeasonal: true,
      });
      setGenMsg("Forecast generated successfully!");
      await load();
    } catch (e: any) {
      setGenMsg(`Error: ${e?.message ?? "Failed to generate"}`);
    } finally {
      setGenerating(false);
    }
  };

  /* ── States ── */
  if (storeLoading || loading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-8 w-64 bg-gray-100 rounded-lg" />
        <div className="h-24 bg-gray-100 rounded-2xl" />
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
            <p className="font-medium text-red-800 text-sm">Failed to load</p>
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
        <p className="text-sm text-gray-400 mt-1">Select a store from the top bar.</p>
      </div>
    );
  }

  /* ── Locked state ── */
  if (plan && plan.planTier !== "advanced") {
    return (
      <div className="theme-content min-h-full p-5 sm:p-8">
        <div className="max-w-lg mx-auto mt-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mx-auto mb-6">
            <Lock className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced AI Reports</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            30-day demand forecasting, seasonal analysis, risk scoring, and bulk item predictions
            are available on the Growth and Enterprise plans.
          </p>

          <div className="mt-8 rounded-2xl border border-gold-200 bg-gradient-to-br from-gold-50 to-amber-50 p-6 text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-600 mb-3">What you unlock</p>
            <div className="space-y-2">
              {[
                "AI demand forecasts per item (30-day horizon)",
                "Risk-level scoring: Critical / High / Medium / Low",
                "Confidence score per prediction",
                "Automatic reorder recommendations",
                "Seasonal signal detection",
                "One-click bulk forecast for all items",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-gold-500 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <button className="mt-5 flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5
                               text-sm font-semibold text-white hover:bg-gray-800 transition-colors w-full justify-center">
              Upgrade to Growth plan
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Current plan: <strong className="text-gray-600 capitalize">{plan.planType}</strong>
          </p>
        </div>
      </div>
    );
  }

  /* ── Full report ── */
  const criticals = forecasts.filter(f => f.risk_level === "Critical" || f.risk_level === "High");
  const orders    = forecasts.filter(f => f.order_needed);

  return (
    <div className="theme-content min-h-full p-5 sm:p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
            <Brain className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Advanced AI Forecast Report
              <span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-gold-400/20 text-gold-600 uppercase">PRO</span>
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Store className="h-3 w-3" /> {storeName}
              </span>
              {summary?.last_run_at && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last run {new Date(summary.last_run_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2
                       text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={generate}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-3 py-2
                       text-xs font-medium text-white hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-60"
          >
            {generating
              ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              : <Play className="h-3.5 w-3.5" />}
            {generating ? "Generating…" : "Run New Forecast"}
          </button>
        </div>
      </div>

      {genMsg && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium
          ${genMsg.startsWith("Error")
            ? "border-red-100 bg-red-50 text-red-700"
            : "border-emerald-100 bg-emerald-50 text-emerald-700"}`}>
          {genMsg}
        </div>
      )}

      {/* ── Summary pills ── */}
      {summary && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <span className="text-gold-500">01</span> Forecast Overview
          </h2>
          <div className="flex flex-wrap gap-3">
            <SumPill count={summary.items_analyzed}  label="Analyzed"  color="border-gray-200 text-gray-700" />
            <SumPill count={summary.critical_count}  label="Critical"  color="border-red-100 text-red-700" />
            <SumPill count={summary.high_count}      label="High"      color="border-orange-100 text-orange-700" />
            <SumPill count={summary.medium_count}    label="Medium"    color="border-amber-100 text-amber-700" />
            <SumPill count={summary.low_count}       label="Low"       color="border-emerald-100 text-emerald-700" />
            <SumPill count={summary.orders_needed}   label="Orders"    color="border-blue-100 text-blue-700" />
          </div>
          {summary.ai_reports_per_month > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all
                    ${(summary.ai_reports_used / summary.ai_reports_per_month) >= 0.9
                      ? "bg-red-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(100, (summary.ai_reports_used / summary.ai_reports_per_month) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {summary.ai_reports_used} / {summary.ai_reports_per_month} reports used
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Action required ── */}
      {orders.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <span className="text-gold-500">02</span> Action Required
            <span className="ml-auto rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
              {orders.length} items
            </span>
          </h2>
          <div className="space-y-2">
            {orders.map((f, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{f.item_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{f.reasoning}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <RiskBadge level={f.risk_level} />
                  <p className="text-xs text-gray-500 mt-1">{fmt(f.predicted_qty_30d)} units / 30d</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Full forecast table ── */}
      {forecasts.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center">
          <Sparkles className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">No forecasts yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "Run New Forecast" to generate AI predictions for all items.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <span className="text-gold-500">03</span> All Item Forecasts
            <span className="ml-auto text-xs font-medium text-gray-400">{forecasts.length} items</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide border-b border-gray-50">
                  <th className="pb-2.5 text-left">Item</th>
                  <th className="pb-2.5 text-right">Stock</th>
                  <th className="pb-2.5 text-right">Reorder</th>
                  <th className="pb-2.5 text-right">30d Forecast</th>
                  <th className="pb-2.5 text-center">Risk</th>
                  <th className="pb-2.5 text-right">Confidence</th>
                  <th className="pb-2.5 text-center">Order?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {forecasts.map((f, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 font-medium text-gray-900 max-w-[180px] truncate">{f.item_name}</td>
                    <td className="py-3 text-right text-gray-600 tabular-nums">{fmt(f.current_stock)}</td>
                    <td className="py-3 text-right text-gray-500 tabular-nums">{fmt(f.reorder_level ?? 0)}</td>
                    <td className="py-3 text-right font-semibold text-gray-900 tabular-nums">
                      {fmt(f.predicted_qty_30d)} {f.unit_symbol}
                    </td>
                    <td className="py-3 text-center"><RiskBadge level={f.risk_level} /></td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="h-1.5 w-14 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gold-400"
                            style={{ width: `${f.confidence_pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{f.confidence_pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      {f.order_needed
                        ? <span className="text-[10px] font-bold text-red-600">YES</span>
                        : <span className="text-[10px] text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── High-risk callouts ── */}
      {criticals.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <span className="text-gold-500">04</span> Critical & High Risk Items
          </h2>
          <div className="space-y-2">
            {criticals.map((f, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <ArrowUpRight className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{f.item_name}</p>
                      <RiskBadge level={f.risk_level} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-snug">{f.reasoning}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>Predicted: <strong className="text-gray-700">{fmt(f.predicted_qty_30d)} units</strong></span>
                      <span>Confidence: <strong className="text-gray-700">{f.confidence_pct}%</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default function AdvancedReportPage() {
  return <AdvancedReportInner />;
}
