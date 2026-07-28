"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Leaf, FlaskConical, Archive, Zap, HardHat,
  TrendingUp, TrendingDown, AlertTriangle, Clock, RefreshCw,
  ChevronRight, BarChart2, Activity,
} from "lucide-react";
import { tfFetch, fmtINR, fmtKg, fmtDate } from "@/lib/tf-api";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface KPI {
  today_gl_kg: number; today_gl_target_kg: number;
  mtd_made_tea_kg: number; mtd_outturn_pct: number; outturn_target_pct: number;
  firewood_stock_kg: number; pending_dispatch_kg: number; pending_leaf_kg: number;
  mtd_eb_cost: number; mtd_firewood_cost: number; mtd_labour_cost: number;
  mtd_total_cost: number; mtd_revenue: number;
  stock: { grade: string; kg: number }[];
  weekly_intake: { day: string; kg: number }[];
  weekly_made_tea: { day: string; kg: number; outturn: number }[];
  recent_alerts: { type: string; message: string; ts: string }[];
}

const GRADE_COLORS: Record<string, string> = {
  BOP: "#059669", BP: "#2563eb", DUST: "#d97706",
  CTC: "#7c3aed", RC: "#ea580c", WASTE: "#9ca3af",
};

/* ─── Mini SVG Bar Chart ─────────────────────────────────────────────────── */
function MiniBarChart({ data, color = "#059669", height = 60 }: {
  data: { label: string; value: number }[]; color?: string; height?: number;
}) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 100 / data.length;
  return (
    <div className="flex items-end gap-0.5 h-16" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
          <div
            className="w-full rounded-t-sm transition-all"
            style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 4 : 0, background: color, opacity: 0.85 }}
          />
          <span className="text-[8px] text-gray-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Mini SVG Donut ─────────────────────────────────────────────────────── */
function DonutChart({ slices, size = 80 }: {
  slices: { label: string; value: number; color: string }[]; size?: number;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let angle = -90;
  const cx = size / 2, cy = size / 2, r = size * 0.38, ir = size * 0.22;
  const polarToXY = (deg: number, radius: number) => ({
    x: cx + radius * Math.cos((deg * Math.PI) / 180),
    y: cy + radius * Math.sin((deg * Math.PI) / 180),
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.filter(s => s.value > 0).map((s, i) => {
        const sweep = (s.value / total) * 360;
        const start = angle;
        angle += sweep;
        const p1 = polarToXY(start, r);
        const p2 = polarToXY(angle - 0.1, r);
        const i1 = polarToXY(start, ir);
        const i2 = polarToXY(angle - 0.1, ir);
        const large = sweep > 180 ? 1 : 0;
        return (
          <path key={i}
            d={`M ${i1.x} ${i1.y} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y} L ${i2.x} ${i2.y} A ${ir} ${ir} 0 ${large} 0 ${i1.x} ${i1.y}`}
            fill={s.color} stroke="white" strokeWidth="1" />
        );
      })}
    </svg>
  );
}

/* ─── KPI Card ───────────────────────────────────────────────────────────── */
function KPICard({ label, value, sub, trend, color, icon: Icon }: {
  label: string; value: string; sub?: string; trend?: "up" | "down" | "neutral";
  color: string; icon: any;
}) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-semibold opacity-70">{label}</p>
        <Icon size={14} className="opacity-50" />
      </div>
      <p className="text-2xl font-black leading-tight">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
      {trend && trend !== "neutral" && (
        <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${trend === "up" ? "text-emerald-600" : "text-red-500"}`}>
          {trend === "up" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {trend === "up" ? "Above target" : "Below target"}
        </div>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function FactoryDashboardPage() {
  const [kpi, setKpi]       = useState<KPI | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await tfFetch<KPI>("/dashboard/kpi");
    if (r.success) setKpi(r.data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Skeleton placeholder ── */
  if (!kpi) return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center">
            <LayoutDashboard size={18} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Executive Dashboard</h1>
            <p className="text-gray-500 text-xs">Today's factory overview · MTD summary</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2 min-h-[40px]">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 h-24 animate-pulse" />)}
      </div>
    </div>
  );

  const outturnOk = kpi.mtd_outturn_pct >= kpi.outturn_target_pct;
  const intakeOk  = kpi.today_gl_kg >= kpi.today_gl_target_kg * 0.9;
  const totalStock = kpi.stock.reduce((s, x) => s + x.kg, 0);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center">
            <LayoutDashboard size={18} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Executive Dashboard</h1>
            <p className="text-gray-500 text-xs">Today's factory overview · MTD summary</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2 min-h-[40px]">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Alerts */}
      {kpi.recent_alerts.length > 0 && (
        <div className="space-y-2 mb-5">
          {kpi.recent_alerts.slice(0, 3).map((a, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${a.type === "warning" ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-red-50 border-red-200 text-red-800"}`}>
              <AlertTriangle size={14} />{a.message}
            </div>
          ))}
        </div>
      )}

      {/* KPI Row 1 — Production */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Production</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <KPICard label="GL Intake Today" value={fmtKg(kpi.today_gl_kg)}
          sub={`Target: ${fmtKg(kpi.today_gl_target_kg)}`}
          trend={intakeOk ? "up" : "down"}
          color={intakeOk ? "bg-green-50 border-green-200 text-green-900" : "bg-red-50 border-red-200 text-red-900"}
          icon={Leaf} />
        <KPICard label="Made Tea MTD" value={fmtKg(kpi.mtd_made_tea_kg)}
          sub="Month to date"
          trend="neutral"
          color="bg-emerald-50 border-emerald-200 text-emerald-900"
          icon={FlaskConical} />
        <KPICard label="Outturn % MTD" value={`${kpi.mtd_outturn_pct.toFixed(2)}%`}
          sub={`Target: ${kpi.outturn_target_pct}%`}
          trend={outturnOk ? "up" : "down"}
          color={outturnOk ? "bg-blue-50 border-blue-200 text-blue-900" : "bg-amber-50 border-amber-200 text-amber-900"}
          icon={Activity} />
        <KPICard label="Total Made Tea Stock" value={fmtKg(totalStock)}
          sub={`${kpi.stock.length} grades`}
          trend="neutral"
          color="bg-violet-50 border-violet-200 text-violet-900"
          icon={Archive} />
      </div>

      {/* KPI Row 2 — Costs */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cost MTD</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <KPICard label="EB Cost" value={fmtINR(kpi.mtd_eb_cost)} sub="Electricity MTD" trend="neutral" color="bg-amber-50 border-amber-200 text-amber-900" icon={Zap} />
        <KPICard label="Firewood Cost" value={fmtINR(kpi.mtd_firewood_cost)} sub="Fuel MTD" trend="neutral" color="bg-orange-50 border-orange-200 text-orange-900" icon={Activity} />
        <KPICard label="Labour Cost" value={fmtINR(kpi.mtd_labour_cost)} sub="Mandays MTD" trend="neutral" color="bg-rose-50 border-rose-200 text-rose-900" icon={HardHat} />
        <KPICard label="Total Factory Cost" value={fmtINR(kpi.mtd_total_cost)} sub="EB + Fuel + Labour" trend="neutral" color="bg-gray-50 border-gray-200 text-gray-900" icon={TrendingUp} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {/* Weekly GL Intake */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-700 mb-3">GL Intake — This Week</p>
          <MiniBarChart
            data={kpi.weekly_intake.map(d => ({ label: d.day, value: d.kg }))}
            color="#059669" height={72}
          />
        </div>

        {/* Weekly Made Tea */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-700 mb-3">Made Tea — This Week</p>
          <MiniBarChart
            data={kpi.weekly_made_tea.map(d => ({ label: d.day, value: d.kg }))}
            color="#7c3aed" height={72}
          />
        </div>

        {/* Stock donut */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-700 mb-2">Stock by Grade</p>
          <div className="flex items-center gap-3">
            <DonutChart size={80}
              slices={kpi.stock.filter(s => s.kg > 0).map(s => ({
                label: s.grade, value: s.kg, color: GRADE_COLORS[s.grade] ?? "#9ca3af"
              }))}
            />
            <div className="space-y-1 flex-1">
              {kpi.stock.filter(s => s.kg > 0).map(s => (
                <div key={s.grade} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: GRADE_COLORS[s.grade] ?? "#9ca3af" }} />
                    <span className="text-gray-600">{s.grade}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{s.kg.toLocaleString("en-IN")} kg</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pending items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "Pending Leaf", value: fmtKg(kpi.pending_leaf_kg), desc: "Received, not yet processed", color: "border-amber-200 bg-amber-50", textColor: "text-amber-900", icon: Clock },
          { label: "Pending Dispatch", value: fmtKg(kpi.pending_dispatch_kg), desc: "Made tea awaiting gate pass", color: "border-blue-200 bg-blue-50", textColor: "text-blue-900", icon: Archive },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-semibold opacity-70 ${c.textColor}`}>{c.label}</p>
                <p className={`text-2xl font-black ${c.textColor}`}>{c.value}</p>
                <p className={`text-xs opacity-60 mt-0.5 ${c.textColor}`}>{c.desc}</p>
              </div>
              <c.icon size={28} className="opacity-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
