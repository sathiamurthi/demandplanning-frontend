"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart2, RefreshCw, Calendar, TrendingUp, Leaf, FlaskConical, Zap, HardHat } from "lucide-react";
import { tfFetch, fmtINR, fmtKg } from "@/lib/tf-api";

type Period = "week" | "month" | "year";
type ReportTab = "production" | "energy" | "labour" | "grade";

interface ProdPoint { label: string; gl_kg: number; made_tea_kg: number; outturn_pct: number; }
interface EnergyPoint { label: string; eb_cost: number; firewood_cost: number; fuel_cost: number; }
interface LabourPoint { label: string; workers: number; wage_cost: number; }
interface GradePoint { label: string; bop: number; bp: number; dust: number; ctc: number; rc: number; waste: number; }

interface ReportData {
  production: ProdPoint[];
  energy: EnergyPoint[];
  labour: LabourPoint[];
  grade: GradePoint[];
  summary: {
    total_gl_kg: number; total_made_tea_kg: number; avg_outturn_pct: number;
    total_eb_cost: number; total_firewood_cost: number; total_labour_cost: number;
    total_cost: number;
  };
}

const GRADE_COLORS: Record<string, string> = {
  bop: "#059669", bp: "#2563eb", dust: "#d97706", ctc: "#7c3aed", rc: "#ea580c", waste: "#9ca3af",
};

/* ─── SVG Bar Chart ─────────────────────────────────────────────────────── */
function BarChart({ data, bars, height = 160 }: {
  data: Record<string, any>[];
  bars: { key: string; color: string; label: string }[];
  height?: number;
}) {
  const maxVal = Math.max(...data.flatMap(d => bars.map(b => Number(d[b.key]) || 0)), 1);
  const chartW = 100;
  const chartH = height;
  const labelH = 20;
  const innerH = chartH - labelH;
  const barW = chartW / data.length;
  const subW = barW / bars.length * 0.7;
  const gap = barW * 0.15;

  return (
    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(pct => (
        <line key={pct} x1={0} y1={innerH * (1 - pct)} x2={chartW} y2={innerH * (1 - pct)}
          stroke="#f3f4f6" strokeWidth="0.3" />
      ))}
      {data.map((d, i) => {
        const groupX = i * barW + gap;
        return (
          <g key={i}>
            {bars.map((b, j) => {
              const val = Number(d[b.key]) || 0;
              const barH = (val / maxVal) * innerH;
              const x = groupX + j * (subW + 0.5);
              return (
                <rect key={b.key} x={x} y={innerH - barH} width={subW} height={barH}
                  fill={b.color} rx="0.5" opacity="0.85">
                  <title>{b.label}: {val.toLocaleString("en-IN")}</title>
                </rect>
              );
            })}
            <text x={i * barW + barW / 2} y={chartH - 2} textAnchor="middle"
              fontSize="3.5" fill="#9ca3af">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Stacked Bar Chart ─────────────────────────────────────────────────── */
function StackedBar({ data, keys, colors, height = 140 }: {
  data: Record<string, any>[];
  keys: string[];
  colors: string[];
  height?: number;
}) {
  const totals = data.map(d => keys.reduce((s, k) => s + (Number(d[k]) || 0), 0));
  const maxVal = Math.max(...totals, 1);
  const labelH = 20;
  const innerH = height - labelH;

  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }}>
      {[0.25, 0.5, 0.75, 1].map(pct => (
        <line key={pct} x1={0} y1={innerH * (1 - pct)} x2={100} y2={innerH * (1 - pct)}
          stroke="#f3f4f6" strokeWidth="0.3" />
      ))}
      {data.map((d, i) => {
        const barW = 100 / data.length;
        const barPad = barW * 0.2;
        let yOff = 0;
        return (
          <g key={i}>
            {keys.map((k, j) => {
              const val = Number(d[k]) || 0;
              const h = (val / maxVal) * innerH;
              const rect = (
                <rect key={k} x={i * barW + barPad} y={innerH - yOff - h}
                  width={barW - barPad * 2} height={h}
                  fill={colors[j]} opacity="0.85" rx="0.3">
                  <title>{k}: {val.toLocaleString("en-IN")}</title>
                </rect>
              );
              yOff += h;
              return rect;
            })}
            <text x={i * barW + barW / 2} y={height - 2} textAnchor="middle" fontSize="3.5" fill="#9ca3af">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Outturn Line ───────────────────────────────────────────────────────── */
function OutturnLine({ data, height = 50 }: { data: { label: string; value: number }[]; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data.map(d => d.value), 30);
  const min = Math.min(...data.map(d => d.value), 20);
  const range = max - min || 5;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - ((d.value - min) / range) * height * 0.8 - height * 0.1;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }}>
      <polyline points={pts} fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = height - ((d.value - min) / range) * height * 0.8 - height * 0.1;
        return <circle key={i} cx={x} cy={y} r="1.5" fill="#7c3aed"><title>{d.label}: {d.value.toFixed(2)}%</title></circle>;
      })}
    </svg>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [tab, setTab]       = useState<ReportTab>("production");
  const [data, setData]     = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await tfFetch<ReportData>(`/reports?period=${period}`);
    if (r.success) setData(r.data ?? null);
    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const periods: { key: Period; label: string }[] = [
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "year", label: "This FY" },
  ];

  const tabs: { key: ReportTab; label: string; icon: any }[] = [
    { key: "production", label: "Production", icon: FlaskConical },
    { key: "energy",     label: "Energy",     icon: Zap },
    { key: "labour",     label: "Labour",     icon: HardHat },
    { key: "grade",      label: "Grades",     icon: BarChart2 },
  ];

  /* ── Placeholder data so charts render without backend ── */
  const pd = data?.production ?? [];
  const ed = data?.energy ?? [];
  const ld = data?.labour ?? [];
  const gd = data?.grade ?? [];
  const sm = data?.summary ?? {
    total_gl_kg: 0, total_made_tea_kg: 0, avg_outturn_pct: 0,
    total_eb_cost: 0, total_firewood_cost: 0, total_labour_cost: 0, total_cost: 0,
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
            <BarChart2 size={18} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-500 text-xs">Weekly · Monthly · Yearly — Production, Energy, Labour, Grades</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
            {periods.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${period === p.key ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-900"}`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={load} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-500">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total GL Intake", val: fmtKg(sm.total_gl_kg), color: "bg-green-50 border-green-200 text-green-900", icon: Leaf },
          { label: "Total Made Tea", val: fmtKg(sm.total_made_tea_kg), color: "bg-emerald-50 border-emerald-200 text-emerald-900", icon: FlaskConical },
          { label: "Avg Outturn %", val: `${sm.avg_outturn_pct.toFixed(2)}%`, color: "bg-violet-50 border-violet-200 text-violet-900", icon: TrendingUp },
          { label: "Total Factory Cost", val: fmtINR(sm.total_cost), color: "bg-blue-50 border-blue-200 text-blue-900", icon: BarChart2 },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.color}`}>
            <div className="flex items-center gap-2 mb-1"><c.icon size={13} className="opacity-50" /><p className="text-xs font-semibold opacity-70">{c.label}</p></div>
            <p className="text-xl font-black">{c.val}</p>
          </div>
        ))}
      </div>

      {/* Report type tabs */}
      <div className="flex gap-1 mb-5 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all min-h-[44px] ${tab === t.key ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>

      {/* ── PRODUCTION CHART ── */}
      {tab === "production" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-gray-800">Green Leaf vs Made Tea</p>
                <p className="text-xs text-gray-400">kg — {period === "week" ? "daily" : period === "month" ? "weekly" : "monthly"} view</p>
              </div>
              <div className="flex gap-3 text-xs">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-600 opacity-85" /><span className="text-gray-500">Green Leaf</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-violet-600 opacity-85" /><span className="text-gray-500">Made Tea</span></div>
              </div>
            </div>
            {pd.length > 0 ? (
              <BarChart data={pd}
                bars={[{ key: "gl_kg", color: "#16a34a", label: "Green Leaf (kg)" }, { key: "made_tea_kg", color: "#7c3aed", label: "Made Tea (kg)" }]}
                height={160} />
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-300 text-sm">No data for this period</div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-gray-800">Outturn % Trend</p>
                <p className="text-xs text-gray-400">Target: 25%</p>
              </div>
              <div className="bg-violet-50 border border-violet-200 text-violet-800 text-xs font-bold px-3 py-1 rounded-full">
                Avg {sm.avg_outturn_pct.toFixed(2)}%
              </div>
            </div>
            {pd.length > 0 ? (
              <>
                {/* Target line reference */}
                <div className="relative">
                  <OutturnLine data={pd.map(d => ({ label: d.label, value: d.outturn_pct }))} height={60} />
                  <div className="absolute inset-0 flex items-center pointer-events-none">
                    <div className="w-full border-t-2 border-dashed border-red-300 opacity-50" />
                  </div>
                </div>
                <p className="text-[10px] text-red-400 text-right mt-1">— — 25% target</p>
              </>
            ) : (
              <div className="h-16 flex items-center justify-center text-gray-300 text-sm">No data</div>
            )}
          </div>
        </div>
      )}

      {/* ── ENERGY CHART ── */}
      {tab === "energy" && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-800">Energy Cost Breakdown</p>
              <p className="text-xs text-gray-400">₹ — EB + Firewood + Other Fuel</p>
            </div>
            <div className="flex gap-3 text-xs flex-wrap justify-end">
              {[["EB", "#d97706"], ["Firewood", "#ea580c"], ["Fuel", "#dc2626"]].map(([l, c]) => (
                <div key={l} className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ background: c as string, opacity: 0.85 }} /><span className="text-gray-500">{l}</span></div>
              ))}
            </div>
          </div>
          {ed.length > 0 ? (
            <StackedBar data={ed} keys={["eb_cost", "firewood_cost", "fuel_cost"]}
              colors={["#d97706", "#ea580c", "#dc2626"]} height={160} />
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-300 text-sm">No data</div>
          )}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
            {[
              { label: "Total EB Cost", val: fmtINR(sm.total_eb_cost), color: "text-amber-700" },
              { label: "Total Firewood", val: fmtINR(sm.total_firewood_cost), color: "text-orange-700" },
              { label: "Total Fuel+Other", val: fmtINR(sm.total_cost - sm.total_eb_cost - sm.total_firewood_cost - sm.total_labour_cost), color: "text-red-700" },
            ].map(c => (
              <div key={c.label} className="text-center">
                <p className="text-xs text-gray-500">{c.label}</p>
                <p className={`text-lg font-bold ${c.color}`}>{c.val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LABOUR CHART ── */}
      {tab === "labour" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-sm font-bold text-gray-800 mb-1">Workers & Wage Cost</p>
            <p className="text-xs text-gray-400 mb-4">Mandays vs wage spend</p>
            {ld.length > 0 ? (
              <BarChart data={ld}
                bars={[{ key: "workers", color: "#e11d48", label: "Workers" }, { key: "wage_cost", color: "#6366f1", label: "Wage Cost (₹)" }]}
                height={160} />
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-300 text-sm">No data</div>
            )}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-sm font-bold text-gray-800 mb-3">Labour Cost Summary</p>
            <div className="flex gap-6">
              <div><p className="text-xs text-gray-500">Total Labour Cost</p><p className="text-2xl font-black text-rose-700">{fmtINR(sm.total_labour_cost)}</p></div>
              <div><p className="text-xs text-gray-500">Cost per kg Made Tea</p>
                <p className="text-2xl font-black text-gray-900">
                  {sm.total_made_tea_kg > 0 ? `₹${(sm.total_labour_cost / sm.total_made_tea_kg).toFixed(2)}` : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── GRADE CHART ── */}
      {tab === "grade" && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-bold text-gray-800">Grade-wise Production</p>
              <p className="text-xs text-gray-400">BOP · BP · DUST · CTC · RC · Waste (kg)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(GRADE_COLORS).map(([g, c]) => (
                <div key={g} className="flex items-center gap-1 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c, opacity: 0.85 }} />
                  <span className="text-gray-500 uppercase">{g}</span>
                </div>
              ))}
            </div>
          </div>
          {gd.length > 0 ? (
            <StackedBar data={gd} keys={["bop", "bp", "dust", "ctc", "rc", "waste"]}
              colors={Object.values(GRADE_COLORS)} height={180} />
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-300 text-sm">No grade data</div>
          )}
        </div>
      )}
    </div>
  );
}
