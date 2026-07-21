"use client";

import { useState, useEffect } from "react";
import { Sparkles, Mic, MessageSquare, Users, Fuel, Wrench, TrendingUp, Send } from "lucide-react";
import { teaAuthHeaders, teaUrl } from "@/lib/tea-api";

interface Grower { id: string; name: string; grower_code: string; phone: string; }
interface FarmerRow { id: string; name: string; grower_code: string; total_kg: number; drop_offs: number; grade_a_pct: number | null; days_since_last_pluck: number | null; rank: number; }
interface FuelAnomaly { id: string; consumption_date: string; quantity_used: number; unit: string; fuel_per_kg: number; pct_above_avg: number; }
interface BudgetAlert { center: string; this_month: number; last_month: number; pct_change: number }
interface MaintNudge { id: string; name: string; nudge: string; }

const ALL_TABS = [["assistant", "Ask Owner Assistant"], ["intake", "Voice/WhatsApp Intake"], ["payment", "Payment Summary"], ["ops", "Ops Intelligence"]] as const;
// Agent role only gets the field-relevant AI features — owner narrative
// (assistant) and factory-wide ops intelligence stay owner/manager-only.
const AGENT_TABS = [["intake", "Voice/WhatsApp Intake"], ["payment", "Payment Summary"]] as const;

export default function TeaAIPage() {
  const [role, setRole] = useState<string | null>(null);
  const [tab, setTab] = useState<"intake" | "assistant" | "payment" | "vendor" | "ops">("assistant");

  useEffect(() => {
    const r = localStorage.getItem("role");
    setRole(r);
    if (r === "agent") setTab("intake");
  }, []);

  // Owner assistant
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [askingAssistant, setAskingAssistant] = useState(false);

  // Voice/WhatsApp intake parse
  const [intakeText, setIntakeText] = useState("");
  const [intakeDraft, setIntakeDraft] = useState<any>(null);
  const [parsingIntake, setParsingIntake] = useState(false);

  // Payment summary
  const [growers, setGrowers] = useState<Grower[]>([]);
  const [selectedGrower, setSelectedGrower] = useState("");
  const [paymentSummary, setPaymentSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  // Ops intelligence
  const [farmerComparison, setFarmerComparison] = useState<FarmerRow[]>([]);
  const [fuelAnomalies, setFuelAnomalies] = useState<{ average_fuel_per_kg: number; anomalies: FuelAnomaly[] } | null>(null);
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
  const [maintNudges, setMaintNudges] = useState<MaintNudge[]>([]);

  useEffect(() => {
    fetch(teaUrl("/growers"), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setGrowers(d.data));
  }, []);

  useEffect(() => {
    if (tab !== "ops") return;
    fetch(teaUrl("/ai/farmer-comparison"), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setFarmerComparison(d.data));
    fetch(teaUrl("/ai/fuel-anomalies"), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setFuelAnomalies(d.data));
    fetch(teaUrl("/ai/budget-alerts"), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setBudgetAlerts(d.data));
    fetch(teaUrl("/ai/maintenance-nudges"), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setMaintNudges(d.data));
  }, [tab]);

  const askAssistant = async () => {
    setAskingAssistant(true); setAnswer(null);
    const r = await fetch(teaUrl("/ai/assistant"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify({ question }) }).then(r => r.json());
    setAnswer(r.success ? r.data.answer : (r.error || "Could not reach the assistant."));
    setAskingAssistant(false);
  };

  const parseIntake = async () => {
    if (!intakeText.trim()) return;
    setParsingIntake(true); setIntakeDraft(null);
    const r = await fetch(teaUrl("/ai/parse-intake"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify({ text: intakeText }) }).then(r => r.json());
    setIntakeDraft(r.success ? r.data : { error: r.error });
    setParsingIntake(false);
  };

  const generateSummary = async () => {
    if (!selectedGrower) return;
    setLoadingSummary(true); setPaymentSummary(null); setSendResult(null);
    const r = await fetch(teaUrl(`/ai/payment-summary/${selectedGrower}`), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify({}) }).then(r => r.json());
    setPaymentSummary(r.success ? r.data : { error: r.error });
    setLoadingSummary(false);
  };
  const sendSummary = async () => {
    if (!selectedGrower || !paymentSummary?.summary) return;
    const r = await fetch(teaUrl(`/ai/payment-summary/${selectedGrower}/send`), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify({ summary: paymentSummary.summary }) }).then(r => r.json());
    setSendResult(r.success ? (r.data.sent ? "Sent via WhatsApp." : `Not sent: ${r.data.error || "skipped"}`) : (r.error || "Send failed."));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 rounded-xl flex items-center justify-center shadow-sm shadow-purple-950/20"><Sparkles size={18} className="text-purple-400" /></div>
        <div><h1 className="text-xl font-bold text-white tracking-tight">AI Assistant</h1><p className="text-white/40 text-xs">Powered by Claude — voice intake, payment summaries, and factory intelligence</p></div>
      </div>

      <div className="flex gap-1 mb-4 bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-1 w-fit flex-wrap">
        {(role === "agent" ? AGENT_TABS : ALL_TABS).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-1.5 rounded-lg text-xs transition-all ${tab === k ? "bg-purple-600/20 text-purple-300" : "text-white/40 hover:text-white"}`}>{l}</button>
        ))}
      </div>

      {tab === "assistant" && role !== "agent" && (
        <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-4">
          <p className="text-white/50 text-xs mb-3 flex items-center gap-1"><MessageSquare size={14} /> Ask anything about today's factory numbers, in plain language.</p>
          <div className="flex gap-2 mb-3">
            <input placeholder="e.g. How did today go?" value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === "Enter" && askAssistant()} className="flex-1 bg-[#0d0f16] border border-white/10 rounded-lg focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-colors px-3 py-2 text-sm text-white" />
            <button onClick={askAssistant} disabled={askingAssistant} className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-md shadow-purple-950/40 transition-all text-white rounded-lg text-sm font-medium px-4 disabled:opacity-50"><Send size={14} /> {askingAssistant ? "Thinking…" : "Ask"}</button>
          </div>
          {answer && <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-sm text-purple-100 whitespace-pre-wrap">{answer}</div>}
        </div>
      )}

      {tab === "intake" && (
        <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-4">
          <p className="text-white/50 text-xs mb-3 flex items-center gap-1"><Mic size={14} /> Paste a transcribed voice note or WhatsApp message (Tamil/English mix OK). Produces a draft only — never writes to collections directly.</p>
          <textarea rows={3} placeholder='e.g. "Murugan 45 kg grade A today"' value={intakeText} onChange={e => setIntakeText(e.target.value)} className="w-full bg-[#0d0f16] border border-white/10 rounded-lg focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-colors px-3 py-2 text-sm text-white mb-3" />
          <button onClick={parseIntake} disabled={parsingIntake} className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-md shadow-purple-950/40 transition-all text-white rounded-lg text-sm font-medium px-4 py-2 disabled:opacity-50 mb-3"><Sparkles size={14} /> {parsingIntake ? "Parsing…" : "Parse Intake"}</button>
          {intakeDraft && (
            intakeDraft.error ? <p className="text-red-400 text-sm">{intakeDraft.error}</p> : (
              <div className="bg-white/5 rounded-xl p-4 space-y-1 text-sm">
                <p><span className="text-white/40">Grower:</span> <span className="text-white">{intakeDraft.matched_grower_name || intakeDraft.grower_name || "unmatched"}</span></p>
                <p><span className="text-white/40">Weight:</span> <span className="text-white">{intakeDraft.gross_weight_kg ?? "?"} kg</span></p>
                <p><span className="text-white/40">Grade:</span> <span className="text-white">{intakeDraft.grade || "?"}</span></p>
                <p><span className="text-white/40">Confidence:</span> <span className="text-white capitalize">{intakeDraft.confidence}</span></p>
                {intakeDraft.notes && <p className="text-yellow-400 text-xs mt-2">{intakeDraft.notes}</p>}
              </div>
            )
          )}
        </div>
      )}

      {tab === "payment" && (
        <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-4">
          <div className="flex gap-2 mb-3">
            <select value={selectedGrower} onChange={e => setSelectedGrower(e.target.value)} className="flex-1 bg-[#0d0f16] border border-white/10 rounded-lg focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-colors px-3 py-2 text-sm text-white">
              <option value="">Select grower...</option>
              {growers.map(g => <option key={g.id} value={g.id}>{g.name} ({g.grower_code})</option>)}
            </select>
            <button onClick={generateSummary} disabled={loadingSummary || !selectedGrower} className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-md shadow-purple-950/40 transition-all text-white rounded-lg text-sm font-medium px-4 disabled:opacity-50"><Sparkles size={14} /> {loadingSummary ? "Generating…" : "Generate"}</button>
          </div>
          {paymentSummary && (
            paymentSummary.error ? <p className="text-red-400 text-sm">{paymentSummary.error}</p> : (
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white text-sm whitespace-pre-wrap mb-3">{paymentSummary.summary}</p>
                {paymentSummary.anomaly && <p className="text-yellow-400 text-xs mb-3">⚠ {paymentSummary.deviation_pct > 0 ? "Well above" : "Well below"} usual average ({paymentSummary.deviation_pct}%)</p>}
                <button onClick={sendSummary} className="flex items-center gap-1 text-xs bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-lg"><Send size={12} /> Send via WhatsApp</button>
                {sendResult && <p className="text-white/50 text-xs mt-2">{sendResult}</p>}
              </div>
            )
          )}
        </div>
      )}

      {tab === "ops" && role !== "agent" && (
        <div className="space-y-4">
          <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-4">
            <p className="text-white text-sm font-medium mb-3 flex items-center gap-2"><Users size={14} className="text-purple-400" /> Farmer Comparison (last 90 days)</p>
            {farmerComparison.length === 0 ? <p className="text-white/30 text-sm">No data yet.</p> : farmerComparison.slice(0, 10).map(f => (
              <div key={f.id} className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                <span className="text-white/70">#{f.rank} {f.name}</span>
                <span className="text-white/50 text-xs">{f.total_kg} kg · {f.drop_offs} drop-offs · Grade A {f.grade_a_pct ?? "—"}%</span>
                <span className="text-white/40 text-xs">{f.days_since_last_pluck != null ? `${f.days_since_last_pluck}d since last` : "—"}</span>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-4">
            <p className="text-white text-sm font-medium mb-3 flex items-center gap-2"><Fuel size={14} className="text-orange-400" /> Fuel Anomalies {fuelAnomalies && `(avg ${fuelAnomalies.average_fuel_per_kg}/kg)`}</p>
            {!fuelAnomalies || fuelAnomalies.anomalies.length === 0 ? <p className="text-white/30 text-sm">No anomalies detected.</p> : fuelAnomalies.anomalies.map(a => (
              <div key={a.id} className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                <span className="text-white/70">{new Date(a.consumption_date).toLocaleDateString("en-IN")}</span>
                <span className="text-white/50 text-xs">{a.quantity_used} {a.unit} used</span>
                <span className="text-red-400 text-xs">+{a.pct_above_avg}% above avg</span>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-4">
            <p className="text-white text-sm font-medium mb-3 flex items-center gap-2"><TrendingUp size={14} className="text-red-400" /> Budget Alerts (month-over-month, ≥25% jump)</p>
            {budgetAlerts.length === 0 ? <p className="text-white/30 text-sm">No unusual cost jumps this month.</p> : budgetAlerts.map((b, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                <span className="text-white/70 capitalize">{b.center.replace("_", " ")}</span>
                <span className="text-white/50 text-xs">₹{b.last_month} → ₹{b.this_month}</span>
                <span className="text-red-400 text-xs">+{b.pct_change}%</span>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-4">
            <p className="text-white text-sm font-medium mb-3 flex items-center gap-2"><Wrench size={14} className="text-yellow-400" /> Predictive Maintenance Nudges</p>
            {maintNudges.length === 0 ? <p className="text-white/30 text-sm">Nothing needs attention.</p> : maintNudges.map(m => (
              <div key={m.id} className="text-sm py-1.5 border-b border-white/5 last:border-0 text-white/70">{m.nudge}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
