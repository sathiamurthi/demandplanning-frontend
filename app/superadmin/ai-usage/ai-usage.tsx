"use client";
import { useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────
interface UsageSummary {
  totalCalls: number;
  totalTokens: number;
  estimatedCostUsd: number;
  successRate: number;
  avgLatencyMs: number;
  byFeature: { feature: string; calls: number; tokens: number }[];
  trend: { date: string; calls: number; tokens: number }[];
  recentLogs: {
    id: string; feature: string; agent_name: string | null; model: string;
    prompt_tokens: number; completion_tokens: number; latency_ms: number;
    status: string; error_msg: string | null; created_at: string;
  }[];
}

interface PipelineRun {
  id: string; store_name: string; status: string;
  agents_completed: number; agents_total: number;
  total_tokens: number; started_at: string; completed_at: string | null;
  duration_s: number | null; error: string | null;
}

interface PipelineResult {
  runId: string; status: string; durationMs: number; totalTokens: number;
  agents: { name: string; status: string; latencyMs: number; outputSummary: string }[];
  result: {
    trend: { overallHealth: string; insights: string[]; trends: any[] };
    risk: { riskScore: number; criticalCount: number; summary: string; risks: any[] };
    forecast: { totalOrderValue: number; forecastConfidence: number; forecasts: any[] };
    recommendation: { urgency: string; estimatedImpact: string; recommendations: any[] };
    report: { executiveSummary: string; keyMetrics: any; nextSteps: string[] };
    collector: { totalItems: number; totalAlerts: number; categories: string[] };
  };
}

interface Store { id: string; name: string; city: string; tenant_id: string; tenant_name: string }

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") || "" : ""; }
function auth() { return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }; }

// ── Helpers ───────────────────────────────────────────────────
const featureColor: Record<string, string> = {
  forecast: "bg-purple-500", search: "bg-blue-500", pipeline: "bg-orange-500",
  suggest: "bg-green-500", quicksearch: "bg-cyan-500",
};
const featureLabel: Record<string, string> = {
  forecast: "AI Forecast", search: "AI Search", pipeline: "Pipeline",
  suggest: "Suggestions", quicksearch: "Quick Search",
};
const healthColor: Record<string, string> = {
  good: "text-green-400", warning: "text-yellow-400", critical: "text-red-400",
};
const priorityColor: Record<string, string> = {
  P1: "bg-red-600", P2: "bg-yellow-600", P3: "bg-blue-700",
};
const urgencyLabel: Record<string, string> = {
  immediate: "🔴 Immediate", this_week: "🟡 This week", next_month: "🟢 Next month",
};

const AGENT_ICONS: Record<string, string> = {
  DataCollector: "🗄️", TrendAnalyzer: "📈", RiskAssessor: "⚠️",
  ForecastEngine: "🔮", RecommendationAgent: "💡", ReportWriter: "📝",
};

// ── Main Component ─────────────────────────────────────────────
export default function AIUsagePage() {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("daily");
  const [summary, setSummary]   = useState<UsageSummary | null>(null);
  const [runs, setRuns]         = useState<PipelineRun[]>([]);
  const [stores, setStores]     = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [running, setRunning]   = useState(false);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [tab, setTab]           = useState<"usage" | "pipeline">("usage");
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [loadingRuns, setLoadingRuns]   = useState(false);
  const [error, setError]       = useState("");
  const [pipelineError, setPipelineError] = useState("");

  const loadUsage = useCallback(() => {
    setLoadingUsage(true); setError("");
    fetch(`/v1/superadmin/ai-usage?range=${range}`, { headers: auth() })
      .then(r => r.json())
      .then(d => { if (d.success) setSummary(d.data); else setError(d.error || "Failed to load"); })
      .catch(e => setError(e.message))
      .finally(() => setLoadingUsage(false));
  }, [range]);

  const loadRuns = useCallback(() => {
    setLoadingRuns(true);
    fetch("/v1/superadmin/ai-pipeline/runs", { headers: auth() })
      .then(r => r.json())
      .then(d => { if (d.success) setRuns(d.data); })
      .catch(() => {})
      .finally(() => setLoadingRuns(false));
  }, []);

  const loadStores = useCallback(() => {
    fetch("/v1/superadmin/ai-pipeline/stores", { headers: auth() })
      .then(r => r.json())
      .then(d => { if (d.success) { setStores(d.data); if (d.data.length > 0) setSelectedStore(d.data[0]); } })
      .catch(() => {});
  }, []);

  useEffect(() => { loadUsage(); }, [loadUsage]);
  useEffect(() => { loadRuns(); loadStores(); }, [loadRuns, loadStores]);

  const runPipeline = async () => {
    if (!selectedStore) { setPipelineError("Select a store first"); return; }
    setRunning(true); setPipelineResult(null); setPipelineError("");
    try {
      const resp = await fetch("/v1/superadmin/ai-pipeline/run", {
        method: "POST", headers: auth(),
        body: JSON.stringify({ storeId: selectedStore.id, storeName: selectedStore.name, tenantId: selectedStore.tenant_id }),
      });
      const d = await resp.json();
      if (d.success) {
        setPipelineResult(d.data);
        loadRuns(); loadUsage();
      } else {
        setPipelineError(d.error || "Pipeline failed");
      }
    } catch (e: any) {
      setPipelineError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const viewRun = async (runId: string) => {
    const resp = await fetch(`/v1/superadmin/ai-pipeline/runs/${runId}`, { headers: auth() });
    const d = await resp.json();
    if (d.success) setSelectedRun(d.data);
  };

  const maxCalls = Math.max(1, ...(summary?.byFeature.map(f => f.calls) ?? [1]));

  return (
    <div className="space-y-6 text-white">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">🤖 AI Usage & Pipeline Monitor</h1>
          <p className="text-gray-400 text-sm mt-0.5">Track every Claude API call · Run multi-agent demand analysis pipelines</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab("usage")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${tab === "usage" ? "bg-[#6c63ff] text-white" : "bg-[#1f2430] text-gray-300 hover:bg-[#2a3040]"}`}>Usage Report</button>
          <button onClick={() => setTab("pipeline")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${tab === "pipeline" ? "bg-orange-600 text-white" : "bg-[#1f2430] text-gray-300 hover:bg-[#2a3040]"}`}>AI Pipeline</button>
        </div>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 rounded-lg p-3 text-red-300 text-sm">{error}</div>}

      {/* ━━━━━━━━━━━━━━━━━━━ TAB: USAGE REPORT ━━━━━━━━━━━━━━━━━━━ */}
      {tab === "usage" && (
        <div className="space-y-5">
          {/* Range selector */}
          <div className="flex gap-2">
            {(["daily", "weekly", "monthly"] as const).map(r => (
              <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${range === r ? "bg-[#6c63ff]" : "bg-[#1f2430] text-gray-400 hover:bg-[#2a3040]"}`}>{r}</button>
            ))}
            <button onClick={loadUsage} className="ml-auto px-3 py-1 rounded-lg text-xs bg-[#1f2430] text-gray-400 hover:bg-[#2a3040]">↻ Refresh</button>
          </div>

          {loadingUsage ? (
            <div className="text-center text-gray-400 py-12">Loading AI usage data…</div>
          ) : summary ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { label: "Total Calls", value: summary.totalCalls.toLocaleString(), sub: `${range}`, icon: "📞" },
                  { label: "Total Tokens", value: (summary.totalTokens / 1000).toFixed(1) + "K", sub: "tokens consumed", icon: "🔤" },
                  { label: "Est. Cost", value: "$" + summary.estimatedCostUsd.toFixed(4), sub: "USD blended rate", icon: "💰" },
                  { label: "Success Rate", value: summary.successRate + "%", sub: "of all calls", icon: "✅" },
                  { label: "Avg Latency", value: summary.avgLatencyMs + "ms", sub: "per API call", icon: "⚡" },
                ].map(c => (
                  <div key={c.label} className="bg-[#1f2430] rounded-xl p-4 border border-[#2a3040]">
                    <div className="text-2xl mb-1">{c.icon}</div>
                    <div className="text-xl font-bold text-white">{c.value}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{c.label}</div>
                    <div className="text-[10px] text-gray-500">{c.sub}</div>
                  </div>
                ))}
              </div>

              {/* By Feature breakdown */}
              <div className="bg-[#1f2430] rounded-xl p-5 border border-[#2a3040]">
                <h3 className="font-semibold text-gray-200 mb-4">Usage by Feature</h3>
                {summary.byFeature.length === 0 ? (
                  <p className="text-gray-500 text-sm">No AI calls recorded yet in this period. Calls appear here after forecasts, searches, or pipelines run.</p>
                ) : (
                  <div className="space-y-3">
                    {summary.byFeature.map(f => (
                      <div key={f.feature}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300 font-semibold">{featureLabel[f.feature] || f.feature}</span>
                          <span className="text-gray-400">{f.calls} calls · {(f.tokens / 1000).toFixed(1)}K tokens</span>
                        </div>
                        <div className="h-2 bg-[#0d0f14] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${featureColor[f.feature] || "bg-gray-600"}`}
                            style={{ width: `${(f.calls / maxCalls) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Daily trend */}
              {summary.trend.length > 0 && (
                <div className="bg-[#1f2430] rounded-xl p-5 border border-[#2a3040]">
                  <h3 className="font-semibold text-gray-200 mb-4">Daily Call Trend</h3>
                  <div className="flex items-end gap-1 h-24 overflow-x-auto">
                    {summary.trend.map(t => {
                      const maxV = Math.max(1, ...summary.trend.map(x => x.calls));
                      const h = Math.max(4, (t.calls / maxV) * 88);
                      return (
                        <div key={t.date} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: 28 }}>
                          <div className="text-[9px] text-gray-500">{t.calls}</div>
                          <div className="w-5 bg-[#6c63ff] rounded-t" style={{ height: h }} title={`${t.date}: ${t.calls} calls`} />
                          <div className="text-[8px] text-gray-600 rotate-[-45deg] whitespace-nowrap">{t.date.slice(5)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent logs */}
              <div className="bg-[#1f2430] rounded-xl border border-[#2a3040] overflow-hidden">
                <div className="p-4 border-b border-[#2a3040]">
                  <h3 className="font-semibold text-gray-200">Recent AI Calls (last 50)</h3>
                </div>
                {summary.recentLogs.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">No AI calls yet. Run a forecast, search, or pipeline to see logs here.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-[#161a23] text-gray-400">
                        <tr>
                          {["Feature", "Agent", "Model", "Tokens", "Latency", "Status", "Time"].map(h => (
                            <th key={h} className="text-left px-3 py-2 font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {summary.recentLogs.map((l, i) => (
                          <tr key={l.id} className={`border-t border-[#2a3040] ${i % 2 === 0 ? "" : "bg-[#161a23]/30"}`}>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${featureColor[l.feature] || "bg-gray-700"}`}>
                                {featureLabel[l.feature] || l.feature}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-400">{l.agent_name || "—"}</td>
                            <td className="px-3 py-2 text-gray-500 font-mono truncate max-w-[120px]">{l.model.replace("claude-", "")}</td>
                            <td className="px-3 py-2 text-gray-300">{(l.prompt_tokens + l.completion_tokens).toLocaleString()}</td>
                            <td className="px-3 py-2 text-gray-400">{l.latency_ms}ms</td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${l.status === "success" ? "bg-green-800 text-green-200" : "bg-red-800 text-red-200"}`}>
                                {l.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{new Date(l.created_at).toLocaleTimeString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400 py-12">No data yet — run a forecast or AI search to start tracking usage.</div>
          )}
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━ TAB: PIPELINE ━━━━━━━━━━━━━━━━━━━━━━ */}
      {tab === "pipeline" && (
        <div className="space-y-5">
          {/* Pipeline trigger panel */}
          <div className="bg-[#1f2430] rounded-xl p-5 border border-[#2a3040] space-y-4">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🔗</div>
              <div>
                <h3 className="font-bold text-white text-lg">Run AI Agent Pipeline</h3>
                <p className="text-gray-400 text-sm mt-0.5">
                  Sequentially runs 6 specialized AI agents on a store's inventory.
                  Each agent passes its structured output to the next.
                </p>
              </div>
            </div>

            {/* Agent flow diagram */}
            <div className="flex items-center gap-1 flex-wrap text-xs">
              {["DataCollector","TrendAnalyzer","RiskAssessor","ForecastEngine","RecommendationAgent","ReportWriter"].map((a, i, arr) => (
                <div key={a} className="flex items-center gap-1">
                  <div className="bg-[#0d0f14] border border-[#3a4050] rounded-lg px-2.5 py-1.5 text-gray-300 font-semibold">
                    <span className="mr-1">{AGENT_ICONS[a]}</span>{a}
                  </div>
                  {i < arr.length - 1 && <span className="text-orange-400 font-bold">→</span>}
                </div>
              ))}
            </div>

            {/* Store selector + run button */}
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-gray-400 mb-1 block">Select Store</label>
                <select
                  value={selectedStore?.id || ""}
                  onChange={e => setSelectedStore(stores.find(s => s.id === e.target.value) || null)}
                  className="w-full bg-[#0d0f14] border border-[#2a3040] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6c63ff]"
                >
                  {stores.length === 0 && <option value="">No stores found</option>}
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.tenant_name} → {s.name} ({s.city})</option>
                  ))}
                </select>
              </div>
              <button
                onClick={runPipeline}
                disabled={running || !selectedStore}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
              >
                {running ? (
                  <><span className="animate-spin">⚙️</span> Running Pipeline…</>
                ) : (
                  <><span>▶</span> Run Pipeline</>
                )}
              </button>
            </div>

            {pipelineError && (
              <div className="bg-red-900/40 border border-red-700 rounded-lg p-3 text-red-300 text-sm">{pipelineError}</div>
            )}
          </div>

          {/* Running indicator */}
          {running && (
            <div className="bg-[#1f2430] rounded-xl p-5 border border-orange-700/50 space-y-3">
              <h3 className="font-semibold text-orange-300">Pipeline Running…</h3>
              <div className="space-y-2">
                {["DataCollector","TrendAnalyzer","RiskAssessor","ForecastEngine","RecommendationAgent","ReportWriter"].map(a => (
                  <div key={a} className="flex items-center gap-2">
                    <span className="text-lg animate-pulse">{AGENT_ICONS[a]}</span>
                    <span className="text-sm text-gray-300">{a}</span>
                    <span className="ml-auto text-xs text-orange-400 animate-pulse">processing…</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pipeline result */}
          {pipelineResult && !running && (
            <PipelineResultView result={pipelineResult} />
          )}

          {/* Past runs */}
          <div className="bg-[#1f2430] rounded-xl border border-[#2a3040] overflow-hidden">
            <div className="p-4 border-b border-[#2a3040] flex justify-between items-center">
              <h3 className="font-semibold text-gray-200">Pipeline Run History</h3>
              <button onClick={loadRuns} className="text-xs text-gray-400 hover:text-gray-200">↻ Refresh</button>
            </div>
            {loadingRuns ? (
              <div className="p-6 text-center text-gray-400">Loading…</div>
            ) : runs.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No pipeline runs yet. Click "Run Pipeline" above to start.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#161a23] text-gray-400">
                    <tr>
                      {["Store","Status","Agents","Tokens","Duration","Started",""].map(h => (
                        <th key={h} className="text-left px-3 py-2 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((r, i) => (
                      <tr key={r.id} className={`border-t border-[#2a3040] ${i % 2 === 0 ? "" : "bg-[#161a23]/30"}`}>
                        <td className="px-3 py-2 text-gray-200 font-semibold">{r.store_name || "—"}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${r.status === "completed" ? "bg-green-800 text-green-200" : r.status === "running" ? "bg-yellow-800 text-yellow-200" : "bg-red-800 text-red-200"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-400">{r.agents_completed}/{r.agents_total}</td>
                        <td className="px-3 py-2 text-gray-400">{r.total_tokens?.toLocaleString() || "—"}</td>
                        <td className="px-3 py-2 text-gray-400">{r.duration_s != null ? `${r.duration_s}s` : "—"}</td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{new Date(r.started_at).toLocaleString()}</td>
                        <td className="px-3 py-2">
                          {r.status === "completed" && (
                            <button onClick={() => viewRun(r.id)} className="text-[#6c63ff] hover:underline text-[10px]">View</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Selected historical run detail */}
          {selectedRun?.result && !running && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-200">
                Run Detail — {selectedRun.store_name} · {new Date(selectedRun.started_at).toLocaleString()}
              </h3>
              <PipelineResultView result={{ ...selectedRun, result: selectedRun.result, agents: [] }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Pipeline Result Viewer ─────────────────────────────────────
function PipelineResultView({ result }: { result: Partial<PipelineResult> & { result: PipelineResult["result"] } }) {
  const [open, setOpen] = useState<string>("report");
  const r = result.result;
  if (!r) return null;

  const healthColor: Record<string, string> = {
    good: "text-green-400", warning: "text-yellow-400", critical: "text-red-400",
  };

  return (
    <div className="space-y-4">
      {/* Agent steps (if fresh run) */}
      {result.agents && result.agents.length > 0 && (
        <div className="bg-[#1f2430] rounded-xl p-4 border border-green-700/40 space-y-2">
          <h3 className="font-semibold text-green-300 text-sm">✅ Pipeline Completed in {((result.durationMs || 0) / 1000).toFixed(1)}s · {result.totalTokens?.toLocaleString()} tokens</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {result.agents.map(a => (
              <div key={a.name} className={`rounded-lg p-2.5 text-center border ${a.status === "success" ? "bg-green-900/20 border-green-700/40" : "bg-red-900/20 border-red-700/40"}`}>
                <div className="text-xl">{AGENT_ICONS[a.name] || "🤖"}</div>
                <div className="text-[10px] font-bold text-white mt-1">{a.name}</div>
                <div className="text-[9px] text-gray-400 mt-0.5">{a.latencyMs}ms</div>
                <div className={`text-[9px] mt-0.5 font-semibold ${a.status === "success" ? "text-green-400" : "text-red-400"}`}>{a.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executive Report card */}
      {r.report && (
        <div className="bg-gradient-to-br from-[#1f2430] to-[#1a2035] rounded-xl p-5 border border-[#6c63ff]/30">
          <div className="flex items-start gap-3">
            <span className="text-3xl">📋</span>
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg">Executive Report</h3>
              <p className="text-gray-300 text-sm mt-2 leading-relaxed">{r.report.executiveSummary}</p>
              {r.report.keyMetrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {[
                    { label: "Health Score", value: r.report.keyMetrics.healthScore + "/100", icon: "💚" },
                    { label: "Critical Items", value: r.report.keyMetrics.criticalItems, icon: "🚨" },
                    { label: "Need Reorder", value: r.report.keyMetrics.reorderItems, icon: "📦" },
                    { label: "Est. Spend", value: "₹" + (r.report.keyMetrics.estimatedSpend || 0).toLocaleString(), icon: "💰" },
                  ].map(m => (
                    <div key={m.label} className="bg-[#0d0f14] rounded-lg p-3 text-center">
                      <div className="text-xl">{m.icon}</div>
                      <div className="text-lg font-bold text-white mt-1">{m.value}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>
              )}
              {r.report.nextSteps?.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold text-gray-400 mb-2">Next Steps</div>
                  {r.report.nextSteps.map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-300 mb-1">
                      <span className="text-[#6c63ff] font-bold shrink-0">{i + 1}.</span>{s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Agent detail accordions */}
      <div className="space-y-2">
        {[
          {
            key: "trend", icon: "📈", label: "TrendAnalyzer Output",
            preview: r.trend ? `Health: ${r.trend.overallHealth} · ${r.trend.trends?.length || 0} trends identified` : "—",
            content: r.trend && (
              <div className="space-y-3">
                <p className={`font-bold text-lg ${healthColor[r.trend.overallHealth] || "text-white"}`}>
                  Overall Health: {r.trend.overallHealth?.toUpperCase()}
                </p>
                {r.trend.insights?.map((ins: string, i: number) => (
                  <div key={i} className="flex gap-2 text-sm text-gray-300">
                    <span className="text-blue-400">•</span>{ins}
                  </div>
                ))}
                {r.trend.trends?.length > 0 && (
                  <div className="overflow-x-auto mt-2">
                    <table className="w-full text-xs">
                      <thead><tr className="text-gray-500">{["Category","Direction","Change%","Confidence","Note"].map(h=><th key={h} className="text-left pb-1 pr-4">{h}</th>)}</tr></thead>
                      <tbody>
                        {r.trend.trends.map((t: any, i: number) => (
                          <tr key={i} className="border-t border-[#2a3040]">
                            <td className="py-1.5 pr-4 text-gray-200 font-semibold">{t.category}</td>
                            <td className="py-1.5 pr-4"><span className={`font-bold ${t.direction==="rising"?"text-green-400":t.direction==="declining"?"text-red-400":"text-gray-400"}`}>{t.direction}</span></td>
                            <td className="py-1.5 pr-4 text-gray-400">{t.change_pct ?? 0}%</td>
                            <td className="py-1.5 pr-4 text-gray-400">{t.confidence ?? 0}%</td>
                            <td className="py-1.5 text-gray-500 text-[11px]">{t.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "risk", icon: "⚠️", label: "RiskAssessor Output",
            preview: r.risk ? `Risk Score: ${r.risk.riskScore}/100 · ${r.risk.criticalCount} critical items` : "—",
            content: r.risk && (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-3xl font-black text-white">{r.risk.riskScore}<span className="text-base font-normal text-gray-400">/100</span></div>
                    <div className="text-xs text-gray-400">Risk Score</div>
                  </div>
                  <div className="flex-1 bg-[#0d0f14] rounded-full h-3 overflow-hidden">
                    <div className={`h-full rounded-full ${r.risk.riskScore > 70 ? "bg-red-500" : r.risk.riskScore > 40 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${r.risk.riskScore}%` }} />
                  </div>
                </div>
                <p className="text-gray-300 text-sm">{r.risk.summary}</p>
                {r.risk.risks?.slice(0, 8).map((risk: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 bg-[#0d0f14] rounded-lg p-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${risk.severity==="high"?"bg-red-700 text-red-200":risk.severity==="medium"?"bg-yellow-700 text-yellow-200":"bg-blue-800 text-blue-200"}`}>{risk.severity?.toUpperCase()}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{risk.itemName}</div>
                      <div className="text-[11px] text-gray-400">{risk.riskType} · {risk.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            ),
          },
          {
            key: "forecast", icon: "🔮", label: "ForecastEngine Output",
            preview: r.forecast ? `Total Order Value: ₹${(r.forecast.totalOrderValue || 0).toLocaleString()} · Confidence: ${r.forecast.forecastConfidence || 0}%` : "—",
            content: r.forecast && (
              <div className="space-y-3">
                <div className="flex gap-6 text-sm">
                  <div><span className="text-gray-400">Est. Reorder Spend:</span> <span className="font-bold text-white">₹{(r.forecast.totalOrderValue || 0).toLocaleString()}</span></div>
                  <div><span className="text-gray-400">Forecast Confidence:</span> <span className="font-bold text-white">{r.forecast.forecastConfidence || 0}%</span></div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-gray-500">{["Item","30d Forecast","Confidence","Order?","Qty","Est. Cost"].map(h=><th key={h} className="text-left pb-1 pr-4">{h}</th>)}</tr></thead>
                    <tbody>
                      {r.forecast.forecasts?.slice(0, 10).map((f: any, i: number) => (
                        <tr key={i} className="border-t border-[#2a3040]">
                          <td className="py-1.5 pr-4 text-gray-200 font-semibold">{f.itemName}</td>
                          <td className="py-1.5 pr-4 text-gray-400">{f.predicted30d}</td>
                          <td className="py-1.5 pr-4 text-gray-400">{f.confidence}%</td>
                          <td className="py-1.5 pr-4"><span className={`font-bold ${f.shouldOrder?"text-orange-400":"text-gray-500"}`}>{f.shouldOrder?"YES":"NO"}</span></td>
                          <td className="py-1.5 pr-4 text-gray-400">{f.orderQty}</td>
                          <td className="py-1.5 text-gray-400">₹{(f.estimatedCost || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ),
          },
          {
            key: "recommendation", icon: "💡", label: "RecommendationAgent Output",
            preview: r.recommendation ? `Urgency: ${r.recommendation.urgency} · ${r.recommendation.recommendations?.length || 0} actions` : "—",
            content: r.recommendation && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">Urgency:</span>
                  <span className="text-sm font-bold">{urgencyLabel[r.recommendation.urgency] || r.recommendation.urgency}</span>
                </div>
                <p className="text-gray-400 text-sm">{r.recommendation.estimatedImpact}</p>
                {r.recommendation.recommendations?.map((rec: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 bg-[#0d0f14] rounded-lg p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${priorityColor[rec.priority] || "bg-gray-700"}`}>{rec.priority}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{rec.action}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{rec.impact} · <span className="text-orange-400">{rec.deadline}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            ),
          },
        ].map(section => (
          <div key={section.key} className="bg-[#1f2430] rounded-xl border border-[#2a3040] overflow-hidden">
            <button
              onClick={() => setOpen(open === section.key ? "" : section.key)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#2a3040] transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{section.icon}</span>
                <span className="font-semibold text-gray-200 text-sm">{section.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{section.preview}</span>
                <span className="text-gray-500 text-sm">{open === section.key ? "▲" : "▼"}</span>
              </div>
            </button>
            {open === section.key && section.content && (
              <div className="px-4 pb-4 pt-2 border-t border-[#2a3040]">{section.content}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
