"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Smartphone, RefreshCw, Share2, Leaf, FlaskConical,
  Zap, HardHat, CheckCircle2, AlertTriangle, Clock,
} from "lucide-react";
import { tfFetch, fmtKg, fmtINR, fmtDate } from "@/lib/tf-api";

interface PhoneSummary {
  date: string;
  gl_intake_kg: number;
  made_tea_kg: number;
  outturn_pct: number | null;
  outturn_target: number;
  eb_units: number;
  firewood_kg: number;
  workers: number;
  pending_leaf_kg: number;
  top_grade: string | null;
  top_grade_kg: number;
  shift_incharge: string | null;
  alerts: string[];
  stock_total_kg: number;
}

const GRADE_EMOJI: Record<string, string> = {
  BOP: "🟢", BP: "🔵", DUST: "🟡", CTC: "🟣", RC: "🟠", WASTE: "⚪",
};

export default function PhoneReportPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [summary, setSummary] = useState<PhoneSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [shared, setShared]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await tfFetch<PhoneSummary>(`/reports/phone?date=${today}`);
    if (r.success) setSummary(r.data ?? null);
    setLoading(false);
  }, [today]);

  useEffect(() => { load(); }, [load]);

  /* ── WhatsApp share ── */
  const shareToWhatsApp = () => {
    if (!summary) return;
    const outturn = summary.outturn_pct !== null ? `${summary.outturn_pct.toFixed(2)}%` : "—";
    const status  = summary.outturn_pct !== null && summary.outturn_pct >= summary.outturn_target ? "✅" : "⚠️";
    const text = [
      `🍃 *Tea Factory Daily Report — ${fmtDate(summary.date)}*`,
      ``,
      `📥 Green Leaf Intake: *${fmtKg(summary.gl_intake_kg)}*`,
      `🏭 Made Tea Produced: *${fmtKg(summary.made_tea_kg)}*`,
      `📊 Outturn %: *${outturn}* ${status} (target ${summary.outturn_target}%)`,
      ``,
      `⚡ EB Units: *${summary.eb_units.toFixed(1)} units*`,
      `🪵 Firewood: *${fmtKg(summary.firewood_kg)}*`,
      `👷 Workers: *${summary.workers}*`,
      ``,
      `📦 Total Stock: *${fmtKg(summary.stock_total_kg)}*`,
      summary.top_grade ? `🏆 Top Grade: *${summary.top_grade}* (${fmtKg(summary.top_grade_kg)})` : "",
      summary.pending_leaf_kg > 0 ? `⏳ Pending Leaf: *${fmtKg(summary.pending_leaf_kg)}*` : "",
      ``,
      `_Powered by TeaFactory360_`,
    ].filter(Boolean).join("\n");

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setShared(true);
    setTimeout(() => setShared(false), 3000);
  };

  const outturnOk = summary?.outturn_pct !== null && summary !== null && summary.outturn_pct !== null
    ? summary.outturn_pct >= summary.outturn_target
    : null;

  return (
    /* Mobile-first container — max 390px, centered */
    <div className="p-4 max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center">
            <Smartphone size={16} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Today's Report</h1>
            <p className="text-gray-500 text-[11px]">{fmtDate(today)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={shareToWhatsApp} className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all ${shared ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-gray-200 text-gray-600"}`}>
            {shared ? <CheckCircle2 size={14} /> : <Share2 size={14} />}
          </button>
        </div>
      </div>

      {!summary ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Outturn hero card */}
          <div className={`rounded-2xl p-5 border-2 ${outturnOk === true ? "bg-emerald-50 border-emerald-300" : outturnOk === false ? "bg-red-50 border-red-300" : "bg-gray-50 border-gray-200"}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold opacity-70 mb-1">Outturn %</p>
                <p className={`text-5xl font-black leading-none ${outturnOk === true ? "text-emerald-700" : outturnOk === false ? "text-red-700" : "text-gray-600"}`}>
                  {summary.outturn_pct !== null ? `${summary.outturn_pct.toFixed(2)}` : "—"}
                  {summary.outturn_pct !== null && <span className="text-2xl font-bold">%</span>}
                </p>
                <p className="text-xs opacity-60 mt-1">Target: {summary.outturn_target}%</p>
              </div>
              <div className="text-4xl">{outturnOk === true ? "✅" : outturnOk === false ? "⚠️" : "➖"}</div>
            </div>
          </div>

          {/* Alerts */}
          {summary.alerts.length > 0 && summary.alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <AlertTriangle size={13} />{a}
            </div>
          ))}

          {/* Core metrics grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "GL Intake", val: fmtKg(summary.gl_intake_kg), icon: Leaf, color: "bg-green-50 border-green-200 text-green-900" },
              { label: "Made Tea", val: fmtKg(summary.made_tea_kg), icon: FlaskConical, color: "bg-emerald-50 border-emerald-200 text-emerald-900" },
              { label: "EB Units", val: `${summary.eb_units.toFixed(1)} u`, icon: Zap, color: "bg-amber-50 border-amber-200 text-amber-900" },
              { label: "Firewood", val: fmtKg(summary.firewood_kg), icon: Zap, color: "bg-orange-50 border-orange-200 text-orange-900" },
              { label: "Workers", val: `${summary.workers}`, icon: HardHat, color: "bg-rose-50 border-rose-200 text-rose-900" },
              { label: "Stock", val: fmtKg(summary.stock_total_kg), icon: CheckCircle2, color: "bg-violet-50 border-violet-200 text-violet-900" },
            ].map(c => (
              <div key={c.label} className={`rounded-xl border p-3.5 ${c.color}`}>
                <p className="text-[11px] font-semibold opacity-70 mb-1">{c.label}</p>
                <p className="text-lg font-black leading-tight">{c.val}</p>
              </div>
            ))}
          </div>

          {/* Top grade badge */}
          {summary.top_grade && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Top Grade Today</p>
                <p className="text-xl font-black text-gray-900">
                  {GRADE_EMOJI[summary.top_grade] ?? "🍵"} {summary.top_grade}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-0.5">Qty</p>
                <p className="text-xl font-black text-gray-900">{fmtKg(summary.top_grade_kg)}</p>
              </div>
            </div>
          )}

          {/* Pending leaf warning */}
          {summary.pending_leaf_kg > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <Clock size={16} className="text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800">Pending Leaf</p>
                <p className="text-base font-black text-amber-900">{fmtKg(summary.pending_leaf_kg)}</p>
              </div>
            </div>
          )}

          {/* Shift incharge */}
          {summary.shift_incharge && (
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700">
              <span className="text-gray-400 text-xs">Shift Incharge</span>
              <p className="font-semibold">{summary.shift_incharge}</p>
            </div>
          )}

          {/* Share button */}
          <button onClick={shareToWhatsApp}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all min-h-[52px] ${shared ? "bg-emerald-600 text-white" : "bg-[#25D366] text-white"}`}>
            {shared ? <CheckCircle2 size={16} /> : <Share2 size={16} />}
            {shared ? "Shared!" : "Share via WhatsApp"}
          </button>
        </div>
      )}
    </div>
  );
}
