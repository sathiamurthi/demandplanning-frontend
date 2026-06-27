"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { getTenantId } from "@/lib/utils";
import {
  Sparkles, Brain, Zap, TrendingUp, Bell, Globe, Lock,
  CheckCircle2, XCircle, AlertCircle, ChevronRight, BarChart3,
  Search, Calendar, Package, Wand2,
} from "lucide-react";

/* ── Types ── */
interface AiSettings {
  planType: string;
  planTier: "basic" | "advanced";
  tenantName: string;
  billingStatus: string;
  usage: {
    reportsUsed: number;
    reportsLimit: number;
    usagePercent: number;
    isUnlimited: boolean;
  };
  features: {
    basicSuggest: boolean;
    lowStockAlerts: boolean;
    aiSearch: boolean;
    aiForecasting: boolean;
    seasonalAnalysis: boolean;
    whatsappAlerts: boolean;
    apiAccess: boolean;
    customIndustry: boolean;
    scheduledReports: boolean;
    bulkForecast: boolean;
  };
  industries: { slug: string; label: string }[];
  industryCount: number;
}

/* ── Helpers ── */
function FeatureRow({
  icon: Icon,
  label,
  description,
  enabled,
  tier,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
  tier: "basic" | "advanced";
}) {
  return (
    <div className={`flex items-center gap-4 rounded-xl p-4 border transition-colors
      ${enabled ? "bg-white border-gray-100" : "bg-gray-50 border-gray-100 opacity-70"}`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
        ${enabled ? "bg-gold-50 text-gold-600" : "bg-gray-100 text-gray-400"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${enabled ? "text-gray-900" : "text-gray-500"}`}>{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded
          ${tier === "basic"
            ? "bg-gray-100 text-gray-500"
            : "bg-gold-50 text-gold-700"}`}>
          {tier}
        </span>
        {enabled
          ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          : <XCircle className="h-4 w-4 text-gray-300" />
        }
      </div>
    </div>
  );
}

function IndustryBadge({ label, slug }: { label: string; slug: string }) {
  const COLORS: Record<string, string> = {
    pharma:   "bg-blue-50 text-blue-700 border-blue-100",
    grocery:  "bg-green-50 text-green-700 border-green-100",
    auto:     "bg-orange-50 text-orange-700 border-orange-100",
    general:  "bg-gray-50 text-gray-700 border-gray-100",
    retail:   "bg-purple-50 text-purple-700 border-purple-100",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium
      ${COLORS[slug] ?? COLORS.general}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {label}
    </span>
  );
}

/* ── Main component ── */
export default function AiSettingsPage() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tenantId = getTenantId() ?? "";

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    apiGet<{ success: boolean; data: AiSettings }>(`/tenants/${tenantId}/ai-settings`)
      .then((r) => setSettings(r.data))
      .catch((e) => setError(e?.message || "Failed to load AI settings"))
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Sparkles className="h-8 w-8 text-gold-400 animate-pulse mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading AI settings…</p>
        </div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Failed to load AI settings</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const isAdvanced = settings.planTier === "advanced";
  const usageColor = settings.usage.usagePercent >= 90
    ? "bg-red-500"
    : settings.usage.usagePercent >= 70
    ? "bg-amber-500"
    : "bg-emerald-500";

  return (
    <div className="theme-content min-h-full p-5 sm:p-8 space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold-500" />
            AI Configuration
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage AI features and usage for {settings.tenantName}
          </p>
        </div>

        {/* Plan badge */}
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5
          ${isAdvanced
            ? "bg-gold-50 border-gold-200 text-gold-800"
            : "bg-gray-50 border-gray-200 text-gray-700"}`}>
          {isAdvanced
            ? <Brain className="h-4 w-4 text-gold-600" />
            : <Zap className="h-4 w-4 text-gray-400" />}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide">
              {isAdvanced ? "Advanced AI" : "Basic AI"}
            </p>
            <p className="text-[11px] opacity-70 capitalize">{settings.planType} plan</p>
          </div>
        </div>
      </div>

      {/* Upgrade banner */}
      {!isAdvanced && (
        <div className="rounded-2xl border border-gold-200 bg-gradient-to-r from-gold-50 to-amber-50 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-100">
              <Brain className="h-6 w-6 text-gold-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Unlock Advanced AI Features</p>
              <p className="text-sm text-gray-600 mt-0.5">
                Upgrade to Growth or Enterprise plan for AI forecasting, seasonal analysis, and unlimited reports.
              </p>
            </div>
            <button className="hidden sm:flex items-center gap-1.5 rounded-xl bg-gold-500 px-4 py-2.5
                               text-sm font-semibold text-white hover:bg-gold-600 transition-colors shrink-0">
              Upgrade plan
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left column: features */}
        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-gold-500" />
              AI Feature Availability
            </h2>
            <div className="space-y-2">
              <FeatureRow
                icon={Zap}
                label="Quick Add AI Suggest"
                description="AI suggests SKU, category, and reorder level when adding items"
                enabled={settings.features.basicSuggest}
                tier="basic"
              />
              <FeatureRow
                icon={Bell}
                label="Low Stock Alerts"
                description="Automatic alerts when stock drops below reorder level"
                enabled={settings.features.lowStockAlerts}
                tier="basic"
              />
              <FeatureRow
                icon={Search}
                label="AI Semantic Search"
                description="Find items using natural language and AI-powered semantic matching"
                enabled={settings.features.aiSearch}
                tier="advanced"
              />
              <FeatureRow
                icon={TrendingUp}
                label="Demand Forecasting"
                description="30-day Claude-powered demand predictions with confidence scores"
                enabled={settings.features.aiForecasting}
                tier="advanced"
              />
              <FeatureRow
                icon={BarChart3}
                label="Seasonal Analysis"
                description="Detect and plan for seasonal demand patterns automatically"
                enabled={settings.features.seasonalAnalysis}
                tier="advanced"
              />
              <FeatureRow
                icon={Calendar}
                label="Scheduled Reports"
                description="Auto-generate and email AI forecast reports on a schedule"
                enabled={settings.features.scheduledReports}
                tier="advanced"
              />
              <FeatureRow
                icon={Package}
                label="Bulk Forecast"
                description="Forecast all items simultaneously with one click"
                enabled={settings.features.bulkForecast}
                tier="advanced"
              />
              <FeatureRow
                icon={Bell}
                label="WhatsApp Alerts"
                description="Receive critical stock alerts directly on WhatsApp"
                enabled={settings.features.whatsappAlerts}
                tier="advanced"
              />
              <FeatureRow
                icon={Globe}
                label="API Access"
                description="Programmatic access to AI forecasts via REST API"
                enabled={settings.features.apiAccess}
                tier="advanced"
              />
              <FeatureRow
                icon={Lock}
                label="Custom Industry Config"
                description="Configure AI prompts and parameters per industry vertical"
                enabled={settings.features.customIndustry}
                tier="advanced"
              />
            </div>
          </div>
        </div>

        {/* Right column: usage + industries */}
        <div className="space-y-4">

          {/* Usage card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gold-500" />
              Monthly AI Usage
            </h2>

            {settings.usage.isUnlimited ? (
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-gray-900">{settings.usage.reportsUsed}</p>
                <p className="text-xs text-gray-500 mt-1">reports this month</p>
                <span className="mt-3 inline-block rounded-full bg-emerald-50 px-3 py-1
                                 text-xs font-medium text-emerald-700">
                  Unlimited
                </span>
              </div>
            ) : (
              <div>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">{settings.usage.reportsUsed}</span>
                    <span className="text-sm text-gray-400 ml-1">/ {settings.usage.reportsLimit}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                    ${settings.usage.usagePercent >= 90
                      ? "bg-red-50 text-red-700"
                      : settings.usage.usagePercent >= 70
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"}`}>
                    {settings.usage.usagePercent}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${usageColor}`}
                    style={{ width: `${settings.usage.usagePercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {settings.usage.reportsLimit - settings.usage.reportsUsed} reports remaining
                </p>
              </div>
            )}
          </div>

          {/* Industries card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-gold-500" />
              Configured Industries
            </h2>
            {settings.industries.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-gray-400">No industries configured</p>
                <p className="text-xs text-gray-400 mt-1">
                  Contact support to set up your industry vertical
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {settings.industries.map((ind) => (
                  <IndustryBadge key={ind.slug} label={ind.label} slug={ind.slug} />
                ))}
              </div>
            )}
          </div>

          {/* Plan comparison */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Plan Tiers</h2>
            <div className="space-y-3 text-xs">
              {[
                { tier: "Starter", features: "Quick Add AI, Low stock alerts" },
                { tier: "Growth", features: "+ AI Forecasting, Semantic search" },
                { tier: "Enterprise", features: "+ Unlimited reports, WhatsApp, API" },
              ].map((row) => (
                <div key={row.tier}
                     className={`flex gap-2 rounded-lg p-2.5 border
                       ${settings.planType.toLowerCase() === row.tier.toLowerCase()
                         ? "border-gold-200 bg-gold-50"
                         : "border-transparent bg-gray-50"}`}>
                  <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0
                    ${settings.planType.toLowerCase() === row.tier.toLowerCase()
                      ? "bg-gold-500"
                      : "bg-gray-300"}`} />
                  <div>
                    <p className={`font-semibold ${settings.planType.toLowerCase() === row.tier.toLowerCase()
                      ? "text-gold-800" : "text-gray-700"}`}>
                      {row.tier}
                    </p>
                    <p className="text-gray-500 mt-0.5">{row.features}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
