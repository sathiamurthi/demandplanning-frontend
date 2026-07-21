"use client";

import { useState, useEffect } from "react";
import { Leaf, Scale, Users, Truck, Factory, Wallet, TrendingUp, AlertCircle, RefreshCw, ClipboardList, Package, Sparkles } from "lucide-react";
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
    setDateStr(new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }));
  }, []);

  const kpis = dash ? [
    { label: "Today's KG",        value: `${dash.today_kg.toFixed(1)} kg`,  icon: Scale,   color: "text-green-400",  bg: "bg-green-500/10" },
    { label: "Growers Today",     value: String(dash.today_growers),         icon: Users,   color: "text-blue-400",   bg: "bg-blue-500/10" },
    { label: "Dispatch Pending",  value: String(dash.dispatch_pending),      icon: Truck,   color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Factory Receivable",value: fmt(dash.factory_receivable),       icon: Factory, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Pending Payments",  value: fmt(dash.pending_payments),         icon: Wallet,  color: "text-orange-400", bg: "bg-orange-500/10" },
  ] : [];

  const riskColor = ai.paymentRisk?.risk_level === "High" ? "text-red-400" : ai.paymentRisk?.risk_level === "Medium" ? "text-yellow-400" : "text-green-400";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-950/40 ring-1 ring-white/10">
            <Leaf size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">TeaFactory360</h1>
            <p className="text-white/40 text-xs">ABC Tea Agency{dateStr ? ` · ${dateStr}` : ""}</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {Array.from({length:5}).map((_,i) => (
            <div key={i} className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {kpis.map(k => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-4 hover:border-white/20 hover:-translate-y-0.5 transition-all">
                <div className={`w-8 h-8 ${k.bg} rounded-lg flex items-center justify-center mb-2`}>
                  <Icon size={15} className={k.color} />
                </div>
                <p className="text-white font-bold text-lg leading-none">{k.value}</p>
                <p className="text-white/40 text-xs mt-1">{k.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Forecast */}
        <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-green-500/25 rounded-2xl shadow-lg shadow-green-950/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-green-400" />
            <p className="text-white/60 text-xs font-medium">Tomorrow Forecast</p>
          </div>
          {ai.forecast ? (
            <>
              <p className="text-2xl font-bold text-white">{ai.forecast.predicted_kg} kg</p>
              <p className="text-white/40 text-xs mt-1">{ai.forecast.confidence_pct}% confidence · {ai.forecast.trend}</p>
            </>
          ) : (
            <p className="text-white/30 text-sm">No data yet</p>
          )}
        </div>

        {/* Recommended Rate */}
        <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-blue-500/25 rounded-2xl shadow-lg shadow-blue-950/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Scale size={14} className="text-blue-400" />
            <p className="text-white/60 text-xs font-medium">Recommended Rate</p>
          </div>
          {ai.rateRec ? (
            <>
              <p className="text-2xl font-bold text-white">₹{ai.rateRec.recommended.grade_a}<span className="text-white/40 text-sm">/kg</span></p>
              <p className="text-white/40 text-xs mt-1">A: ₹{ai.rateRec.recommended.grade_a} · B: ₹{ai.rateRec.recommended.grade_b} · C: ₹{ai.rateRec.recommended.grade_c}</p>
            </>
          ) : (
            <p className="text-white/30 text-sm">No data yet</p>
          )}
        </div>

        {/* Best Factory */}
        <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-purple-500/25 rounded-2xl shadow-lg shadow-purple-950/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Factory size={14} className="text-purple-400" />
            <p className="text-white/60 text-xs font-medium">Best Factory</p>
          </div>
          {ai.factoryRec ? (
            <>
              <p className="text-xl font-bold text-white tracking-tight">{ai.factoryRec.best_factory || "—"}</p>
              <p className="text-white/40 text-xs mt-1">Dispatch 70% here</p>
            </>
          ) : (
            <p className="text-white/30 text-sm">No settlement data</p>
          )}
        </div>

        {/* Cash Flow Risk */}
        <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-yellow-500/25 rounded-2xl shadow-lg shadow-yellow-950/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-yellow-400" />
            <p className="text-white/60 text-xs font-medium">Cash Flow Risk</p>
          </div>
          {ai.paymentRisk ? (
            <>
              <p className={`text-2xl font-bold ${riskColor}`}>{ai.paymentRisk.risk_level}</p>
              <p className="text-white/40 text-xs mt-1">Due: {fmt(ai.paymentRisk.grower_payment_due)}</p>
            </>
          ) : (
            <p className="text-white/30 text-sm">Calculating...</p>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-5">
        <h3 className="font-semibold text-sm text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/tea/collections", icon: ClipboardList, label: "New Collection", color: "text-green-400 bg-green-500/10" },
            { href: "/tea/growers",     icon: Users,         label: "Add Grower",     color: "text-blue-400 bg-blue-500/10" },
            { href: "/tea/dispatch",    icon: Truck,         label: "New Dispatch",   color: "text-yellow-400 bg-yellow-500/10" },
            { href: "/tea/payments",    icon: Wallet,        label: "Process Payment",color: "text-orange-400 bg-orange-500/10" },
            { href: "/tea/suppliers",   icon: Package,       label: "Suppliers & Fuel", color: "text-amber-400 bg-amber-500/10" },
            { href: "/tea/fleet",       icon: Truck,         label: "Fleet & Live Map", color: "text-cyan-400 bg-cyan-500/10" },
            { href: "/tea/ai",          icon: Sparkles,      label: "AI Assistant",   color: "text-purple-400 bg-purple-500/10" },
            { href: "/tea/reports",     icon: TrendingUp,    label: "Reports",        color: "text-pink-400 bg-pink-500/10" },
          ].map(q => {
            const Icon = q.icon;
            return (
              <a key={q.href} href={q.href}
                className="flex items-center gap-3 p-3 bg-gradient-to-b from-white/[0.04] to-transparent rounded-xl border border-white/8 hover:border-white/20 hover:-translate-y-0.5 transition-all">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${q.color.split(' ')[1]}`}>
                  <Icon size={15} className={q.color.split(' ')[0]} />
                </div>
                <span className="text-white/70 text-xs font-medium">{q.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
