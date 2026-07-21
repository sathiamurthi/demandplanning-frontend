"use client";

import { useState, useEffect } from "react";
import { Leaf, Scale, Users, Truck, Factory, Wallet, TrendingUp, AlertCircle, RefreshCw, ClipboardList, Package, Sparkles, ArrowRight, X } from "lucide-react";
import { teaUrl, teaAuthHeaders } from "@/lib/tea-api";

interface Dashboard {
  today_kg: number;
  today_growers: number;
  dispatch_pending: number;
  factory_receivable: number;
  pending_payments: number;
}

interface AIData {
  forecast?: { predicted_kg: number; confidence_pct: number; trend: string };
  rateRec?: { recommended: { grade_a: number; grade_b: number; grade_c: number } };
  factoryRec?: { best_factory: string };
  paymentRisk?: { risk_level: string; grower_payment_due: number; factory_receivable: number };
}

function fmt(n: number) {
  return n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : n >= 1000
    ? `₹${(n / 1000).toFixed(1)}K`
    : `₹${n.toFixed(0)}`;
}

export default function TeaDashboard() {
  const [dash, setDash]   = useState<Dashboard | null>(null);
  const [ai, setAi]       = useState<AIData>({});
  const [loading, setLoading] = useState(true);
  const [dateStr, setDateStr] = useState("");
  const [setupIncomplete, setSetupIncomplete] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const checkSetup = async () => {
    if (localStorage.getItem("tea_onboarding_done")) return;
    try {
      const headers = teaAuthHeaders() as Record<string, string>;
      const [gRes, rRes, fRes, vRes] = await Promise.all([
        fetch(teaUrl("/growers"), { headers }),
        fetch(teaUrl("/rates"), { headers }),
        fetch(teaUrl("/factories"), { headers }),
        fetch(teaUrl("/vehicles"), { headers }),
      ]);
      const [g, r, f, v] = await Promise.all([gRes.json(), rRes.json(), fRes.json(), vRes.json()]);
      const empty = (x: any) => x.success && Array.isArray(x.data) && x.data.length === 0;
      if (empty(g) && empty(r) && empty(f) && empty(v)) setSetupIncomplete(true);
    } catch { /* silently fail — never block the dashboard on this check */ }
  };

  const load = async () => {
    setLoading(true);
    try {
      const headers = teaAuthHeaders() as Record<string, string>;
      const [dRes, fRes, rRes, factRes, pRes] = await Promise.all([
        fetch(teaUrl("/dashboard"), { headers }),
        fetch(teaUrl("/ai/forecast"), { headers }),
        fetch(teaUrl("/ai/rate-recommendation"), { headers }),
        fetch(teaUrl("/ai/factory-recommendation"), { headers }),
        fetch(teaUrl("/ai/payment-risk"), { headers }),
      ]);

      const [d, f, r, fact, p] = await Promise.all([dRes.json(), fRes.json(), rRes.json(), factRes.json(), pRes.json()]);
      if (d.success) setDash(d.data);
      setAi({
        forecast: f.success ? f.data : undefined,
        rateRec: r.success ? r.data : undefined,
        factoryRec: fact.success ? fact.data : undefined,
        paymentRisk: p.success ? p.data : undefined,
      });
    } catch { /* silently fail */ }
    setLoading(false);
  };

  useEffect(() => {
    load();
    checkSetup();
    setDateStr(new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }));
  }, []);

  const kpis = dash ? [
    { label: "Today's KG",        value: `${dash.today_kg.toFixed(1)} kg`,  icon: Scale,   color: "text-green-600",  bg: "bg-green-500/10" },
    { label: "Growers Today",     value: String(dash.today_growers),         icon: Users,   color: "text-blue-600",   bg: "bg-blue-500/10" },
    { label: "Dispatch Pending",  value: String(dash.dispatch_pending),      icon: Truck,   color: "text-yellow-600", bg: "bg-yellow-500/10" },
    { label: "Factory Receivable",value: fmt(dash.factory_receivable),       icon: Factory, color: "text-purple-600", bg: "bg-purple-500/10" },
    { label: "Pending Payments",  value: fmt(dash.pending_payments),         icon: Wallet,  color: "text-orange-600", bg: "bg-orange-500/10" },
  ] : [];

  const riskColor = ai.paymentRisk?.risk_level === "High" ? "text-red-600" : ai.paymentRisk?.risk_level === "Medium" ? "text-yellow-600" : "text-green-600";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-md">
            <Leaf size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">TeaFactory360</h1>
            <p className="text-gray-500 text-xs">ABC Tea Agency{dateStr ? ` · ${dateStr}` : ""}</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Setup checklist banner — new tenant with no growers/rates/factories/vehicles yet */}
      {setupIncomplete && !bannerDismissed && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-4 flex-wrap">
          <div className="w-10 h-10 bg-white border border-emerald-200 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-emerald-600" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-semibold text-gray-900">Let's get TeaFactory360 set up for you</p>
            <p className="text-xs text-gray-600 mt-0.5">Add your rates, growers, and first vehicle & factory — takes about 2 minutes.</p>
          </div>
          <a href="/tea/onboarding" className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors text-white px-4 py-2 rounded-lg text-sm font-medium">
            Start Setup <ArrowRight size={14} />
          </a>
          <button onClick={() => setBannerDismissed(true)} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {Array.from({length:5}).map((_,i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {kpis.map(k => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:border-gray-300 hover:-translate-y-0.5 transition-all">
                <div className={`w-8 h-8 ${k.bg} rounded-lg flex items-center justify-center mb-2`}>
                  <Icon size={15} className={k.color} />
                </div>
                <p className="text-gray-900 font-bold text-lg leading-none">{k.value}</p>
                <p className="text-gray-500 text-xs mt-1">{k.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Forecast */}
        <div className="bg-white border border-green-100 rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-green-600" />
            <p className="text-gray-600 text-xs font-medium">Tomorrow Forecast</p>
          </div>
          {ai.forecast ? (
            <>
              <p className="text-2xl font-bold text-gray-900">{ai.forecast.predicted_kg} kg</p>
              <p className="text-gray-500 text-xs mt-1">{ai.forecast.confidence_pct}% confidence · {ai.forecast.trend}</p>
            </>
          ) : (
            <p className="text-gray-600 text-sm">No data yet</p>
          )}
        </div>

        {/* Recommended Rate */}
        <div className="bg-white border border-blue-100 rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Scale size={14} className="text-blue-600" />
            <p className="text-gray-600 text-xs font-medium">Recommended Rate</p>
          </div>
          {ai.rateRec ? (
            <>
              <p className="text-2xl font-bold text-gray-900">₹{ai.rateRec.recommended.grade_a}<span className="text-gray-500 text-sm">/kg</span></p>
              <p className="text-gray-500 text-xs mt-1">A: ₹{ai.rateRec.recommended.grade_a} · B: ₹{ai.rateRec.recommended.grade_b} · C: ₹{ai.rateRec.recommended.grade_c}</p>
            </>
          ) : (
            <p className="text-gray-600 text-sm">No data yet</p>
          )}
        </div>

        {/* Best Factory */}
        <div className="bg-white border border-purple-100 rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Factory size={14} className="text-purple-600" />
            <p className="text-gray-600 text-xs font-medium">Best Factory</p>
          </div>
          {ai.factoryRec ? (
            <>
              <p className="text-xl font-bold text-gray-900 tracking-tight">{ai.factoryRec.best_factory || "—"}</p>
              <p className="text-gray-500 text-xs mt-1">Dispatch 70% here</p>
            </>
          ) : (
            <p className="text-gray-600 text-sm">No settlement data</p>
          )}
        </div>

        {/* Cash Flow Risk */}
        <div className="bg-white border border-yellow-100 rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-yellow-600" />
            <p className="text-gray-600 text-xs font-medium">Cash Flow Risk</p>
          </div>
          {ai.paymentRisk ? (
            <>
              <p className={`text-2xl font-bold ${riskColor}`}>{ai.paymentRisk.risk_level}</p>
              <p className="text-gray-500 text-xs mt-1">Due: {fmt(ai.paymentRisk.grower_payment_due)}</p>
            </>
          ) : (
            <p className="text-gray-600 text-sm">Calculating...</p>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-sm text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/tea/collections", icon: ClipboardList, label: "New Collection", color: "text-green-600 bg-green-500/10" },
            { href: "/tea/growers",     icon: Users,         label: "Add Grower",     color: "text-blue-600 bg-blue-500/10" },
            { href: "/tea/dispatch",    icon: Truck,         label: "New Dispatch",   color: "text-yellow-600 bg-yellow-500/10" },
            { href: "/tea/payments",    icon: Wallet,        label: "Process Payment",color: "text-orange-600 bg-orange-500/10" },
            { href: "/tea/suppliers",   icon: Package,       label: "Suppliers & Fuel", color: "text-amber-600 bg-amber-500/10" },
            { href: "/tea/fleet",       icon: Truck,         label: "Fleet & Live Map", color: "text-cyan-600 bg-cyan-500/10" },
            { href: "/tea/ai",          icon: Sparkles,      label: "AI Assistant",   color: "text-purple-600 bg-purple-500/10" },
            { href: "/tea/reports",     icon: TrendingUp,    label: "Reports",        color: "text-pink-600 bg-pink-500/10" },
          ].map(q => {
            const Icon = q.icon;
            return (
              <a key={q.href} href={q.href}
                className="flex items-center gap-3 p-3 bg-gradient-to-b from-white/[0.04] to-transparent rounded-xl border border-gray-200 hover:border-gray-300 hover:-translate-y-0.5 transition-all">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${q.color.split(' ')[1]}`}>
                  <Icon size={15} className={q.color.split(' ')[0]} />
                </div>
                <span className="text-gray-700 text-xs font-medium">{q.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
