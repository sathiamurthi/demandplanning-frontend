"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bot, Workflow, Plug, ShieldCheck, BarChart3, UserCheck,
  Sparkles, ArrowRight, CheckCircle, Brain,
  FileSpreadsheet, Truck, ChevronRight, X, Loader2, Plus,
  Clock, LogOut, Settings, Zap, AlertCircle, Copy, ListChecks,
} from "lucide-react";
import { TechStackForm } from "./components/TechStackForm";
import { WorkflowStepsEditor } from "./components/WorkflowStepsEditor";
import { LoadRunnerConfigForm } from "./components/LoadRunnerConfigForm";
import { StepResultCard } from "./components/StepResultCard";
import {
  Workflow as WorkflowT, Execution, ExecutionStep, StepStatus,
  DEFAULT_LR_CONFIG, defaultSteps, mockStepOutput,
  loadWorkflows, saveWorkflows, loadExecutions, saveExecutions,
} from "./lib/agentData";

// ── Marketing content ───────────────────────────────────────────────────────
const CAPABILITIES = [
  { icon: Brain,       title: "Autonomous Planning",       desc: "Agents break enterprise goals into ordered, dependency-aware task plans without a human writing the runbook." },
  { icon: Workflow,    title: "Multi-Agent Orchestration", desc: "16 specialist agents — from tech-stack resolution to QA and UAT deployment — hand off work automatically." },
  { icon: Plug,        title: "Enterprise Integrations",   desc: "Connects to your ERP, inventory, and messaging stack — no rip-and-replace, agents work with what you have." },
  { icon: UserCheck,   title: "Human-in-the-Loop",         desc: "Every agent step can require your approval before it continues — reject to stop, approve to proceed." },
  { icon: ShieldCheck, title: "Audit & Compliance",        desc: "Every decision an agent makes is logged with its reasoning, inputs, and outcome for full traceability." },
  { icon: BarChart3,   title: "Real-Time Analytics",       desc: "Live dashboards show what every agent is doing right now, and what it did yesterday." },
];

const USE_CASES = [
  { icon: BarChart3,       title: "Demand Forecasting Agent",  desc: "Continuously reforecasts demand as new sales data lands, flagging risk before a stockout happens." },
  { icon: Truck,            title: "Procurement Agent",         desc: "Raises purchase orders against supplier lead times automatically, escalating only exceptions." },
  { icon: FileSpreadsheet,  title: "Reporting Agent",           desc: "Compiles daily and weekly reports from live data — no more manual spreadsheet rollups." },
  { icon: Sparkles,         title: "Customer Response Agent",   desc: "Drafts and triages customer and vendor replies, escalating anything outside its confidence band." },
];

// ── Types / storage ──────────────────────────────────────────────────────────
type View = "landing" | "auth" | "workflows" | "workflowDetail" | "executions" | "executionDetail" | "settings";
type Tab = "tech" | "steps" | "loadrunner" | "run";
interface EAUser { name: string; email: string; }

const AUTH_KEY = "ea360_user";
const getStoredUser = (): EAUser | null => { try { const s = localStorage.getItem(AUTH_KEY); return s ? JSON.parse(s) : null; } catch { return null; } };
const storeUser = (u: EAUser) => localStorage.setItem(AUTH_KEY, JSON.stringify(u));
const removeUser = () => localStorage.removeItem(AUTH_KEY);

const WF_STATUS_BADGE: Record<string, string> = {
  active:   "bg-green-50 text-green-700 border-green-200",
  draft:    "bg-amber-50 text-amber-700 border-amber-200",
  archived: "bg-gray-100 text-gray-500 border-gray-200",
};
const EX_STATUS_BADGE: Record<string, string> = {
  pending:   "bg-gray-100 text-gray-500",
  running:   "bg-amber-50 text-amber-700",
  completed: "bg-green-50 text-green-700",
  failed:    "bg-red-50 text-red-700",
};

// ── Component ────────────────────────────────────────────────────────────────
export default function Enterprise360Page() {
  const [view, setView] = useState<View>("landing");
  const [user, setUser] = useState<EAUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [authErr, setAuthErr] = useState("");

  const [workflows, setWorkflows] = useState<WorkflowT[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedWfId, setSelectedWfId] = useState<string | null>(null);
  const [selectedExId, setSelectedExId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("tech");
  const [newWfName, setNewWfName] = useState("");
  const [creatingWf, setCreatingWf] = useState(false);
  const [saving, setSaving] = useState(false);

  const [story, setStory] = useState("");
  const [launching, setLaunching] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [copied, setCopied] = useState(false);

  const [apiKey, setApiKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const runningExec = useRef<Set<string>>(new Set());

  useEffect(() => {
    document.title = "EnterpriseAgent360 — Agentic Intelligence Delivered.";
    const u = getStoredUser();
    if (u) { setUser(u); setView("workflows"); }
    setWorkflows(loadWorkflows());
    setExecutions(loadExecutions());
    return () => { document.title = "NexusOS"; };
  }, []);

  const go = (v: View) => setView(v);

  const handleAuth = () => {
    setAuthErr("");
    if (!name.trim() || !email.trim()) { setAuthErr("Name and email are required."); return; }
    const u: EAUser = { name: name.trim(), email: email.trim() };
    storeUser(u); setUser(u); setView("workflows");
  };
  const handleDemo = () => {
    const u: EAUser = { name: "Asha Rao", email: "demo@enterprise360.ai" };
    storeUser(u); setUser(u); setView("workflows");
  };
  const handleLogout = () => {
    removeUser(); setUser(null); setView("landing");
    setName(""); setEmail(""); setAuthErr("");
  };

  // ── Workflows ──────────────────────────────────────────────────────────
  const createWorkflow = () => {
    if (!newWfName.trim()) return;
    setCreatingWf(true);
    const wf: WorkflowT = {
      id: `wf_${Date.now()}`, name: newWfName.trim(), status: "draft",
      createdAt: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      techConfig: {}, steps: defaultSteps(), lrConfig: DEFAULT_LR_CONFIG,
    };
    const next = [wf, ...workflows];
    setWorkflows(next); saveWorkflows(next);
    setNewWfName(""); setCreatingWf(false);
    setSelectedWfId(wf.id); setTab("tech"); setView("workflowDetail");
  };

  const selectedWf = workflows.find(w => w.id === selectedWfId) || null;

  const saveTech = (cfg: Record<string, string>) => {
    if (!selectedWf) return;
    setSaving(true);
    const next = workflows.map(w => w.id === selectedWf.id ? { ...w, techConfig: cfg, status: "active" as const } : w);
    setWorkflows(next); saveWorkflows(next);
    setTimeout(() => setSaving(false), 300);
  };
  const saveSteps = (steps: WorkflowT["steps"]) => {
    if (!selectedWf) return;
    setSaving(true);
    const next = workflows.map(w => w.id === selectedWf.id ? { ...w, steps } : w);
    setWorkflows(next); saveWorkflows(next);
    setTimeout(() => setSaving(false), 300);
  };
  const saveLR = (cfg: WorkflowT["lrConfig"]) => {
    if (!selectedWf) return;
    setSaving(true);
    const next = workflows.map(w => w.id === selectedWf.id ? { ...w, lrConfig: cfg } : w);
    setWorkflows(next); saveWorkflows(next);
    setTimeout(() => setSaving(false), 300);
  };

  // ── Execution pipeline simulation ─────────────────────────────────────
  const advanceExecution = (execId: string, stepIdx: number) => {
    if (runningExec.current.has(execId) === false) runningExec.current.add(execId);

    setExecutions(prev => {
      const next = prev.map(e => {
        if (e.id !== execId) return e;
        const steps = e.steps.map((s, i) => i === stepIdx ? { ...s, status: "running" as StepStatus } : s);
        return { ...e, status: "running" as const, steps };
      });
      saveExecutions(next);
      return next;
    });

    setTimeout(() => {
      setExecutions(prev => {
        const exec = prev.find(e => e.id === execId);
        if (!exec) return prev;
        const wf = loadWorkflows().find(w => w.id === exec.workflowId);
        const step = exec.steps[stepIdx];
        const stepCfg = wf?.steps.find(s => s.agent_name === step.agent_name);
        const needsApproval = step.agent_name !== "_parse" && (stepCfg?.requires_approval ?? true);
        const output = mockStepOutput(step.agent_name, exec.user_story);

        const next = prev.map(e => {
          if (e.id !== execId) return e;
          const steps = e.steps.map((s, i) => i === stepIdx
            ? { ...s, status: (needsApproval ? "awaiting_approval" : "completed") as StepStatus, output }
            : s);
          const allDone = steps.every(s => ["completed", "approved", "skipped"].includes(s.status));
          const isProjectDone = allDone;
          return {
            ...e, steps,
            status: (needsApproval ? "running" : isProjectDone ? "completed" : "running") as Execution["status"],
            project_path: isProjectDone ? `~/EnterpriseAgent/generated/${e.workflowName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : e.project_path,
          };
        });
        saveExecutions(next);
        return next;
      });

      const exec = loadExecutions().find(e => e.id === execId);
      const step = exec?.steps[stepIdx];
      const wf = exec ? loadWorkflows().find(w => w.id === exec.workflowId) : null;
      const stepCfg = wf?.steps.find(s => s.agent_name === step?.agent_name);
      const needsApproval = step && step.agent_name !== "_parse" && (stepCfg?.requires_approval ?? true);

      if (!needsApproval && exec && stepIdx + 1 < exec.steps.length) {
        advanceExecution(execId, stepIdx + 1);
      } else if (!needsApproval) {
        runningExec.current.delete(execId);
      }
      // if needsApproval, pipeline pauses here until user approves/rejects
    }, 900 + Math.random() * 700);
  };

  const runStory = () => {
    if (!story.trim() || !selectedWf) return;
    setLaunching(true);
    const enabledAgents = selectedWf.steps.filter(s => s.enabled).map(s => s.agent_name);
    const stepList: ExecutionStep[] = [
      { id: "s0", step_order: 0, agent_name: "_parse", status: "pending" },
      ...enabledAgents.map((a, i) => ({ id: `s${i + 1}`, step_order: i + 1, agent_name: a, status: "pending" as StepStatus })),
    ];
    const exec: Execution = {
      id: `ex_${Date.now()}`, workflowId: selectedWf.id, workflowName: selectedWf.name,
      user_story: story.trim(), status: "pending",
      createdAt: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      deploy_status: "none", steps: stepList,
    };
    const next = [exec, ...executions];
    setExecutions(next); saveExecutions(next);
    setStory(""); setLaunching(false);
    setSelectedExId(exec.id); setView("executionDetail");
    advanceExecution(exec.id, 0);
  };

  const selectedEx = executions.find(e => e.id === selectedExId) || null;

  const approveStep = (stepId: string) => {
    if (!selectedEx) return;
    setActioning(stepId);
    const stepIdx = selectedEx.steps.findIndex(s => s.id === stepId);
    const next = executions.map(e => e.id === selectedEx.id
      ? { ...e, steps: e.steps.map(s => s.id === stepId ? { ...s, status: "approved" as StepStatus } : s) }
      : e);
    setExecutions(next); saveExecutions(next);
    setTimeout(() => {
      setActioning(null);
      if (stepIdx + 1 < selectedEx.steps.length) advanceExecution(selectedEx.id, stepIdx + 1);
      else {
        const done = executions.map(e => e.id === selectedEx.id ? { ...e, status: "completed" as const } : e);
        setExecutions(done); saveExecutions(done);
      }
    }, 300);
  };

  const rejectStep = (stepId: string) => {
    if (!selectedEx) return;
    setActioning(stepId);
    const next = executions.map(e => e.id === selectedEx.id
      ? { ...e, status: "failed" as const, steps: e.steps.map(s => s.id === stepId ? { ...s, status: "rejected" as StepStatus } : s) }
      : e);
    setExecutions(next); saveExecutions(next);
    setTimeout(() => setActioning(null), 300);
  };

  const rerun = () => {
    if (!selectedEx) return;
    setRerunning(true);
    const wf = workflows.find(w => w.id === selectedEx.workflowId);
    const enabledAgents = wf ? wf.steps.filter(s => s.enabled).map(s => s.agent_name) : [];
    const stepList: ExecutionStep[] = [
      { id: "s0", step_order: 0, agent_name: "_parse", status: "pending" },
      ...enabledAgents.map((a, i) => ({ id: `s${i + 1}`, step_order: i + 1, agent_name: a, status: "pending" as StepStatus })),
    ];
    const exec: Execution = {
      id: `ex_${Date.now()}`, workflowId: selectedEx.workflowId, workflowName: selectedEx.workflowName,
      user_story: selectedEx.user_story, status: "pending",
      createdAt: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      deploy_status: "none", steps: stepList,
    };
    const next = [exec, ...executions];
    setExecutions(next); saveExecutions(next);
    setRerunning(false);
    setSelectedExId(exec.id);
    advanceExecution(exec.id, 0);
  };

  const deploy = () => {
    if (!selectedEx) return;
    setDeploying(true);
    const next = executions.map(e => e.id === selectedEx.id ? { ...e, deploy_status: "deploying" as const } : e);
    setExecutions(next); saveExecutions(next);
    setTimeout(() => {
      const appNum = Math.floor(Math.random() * 9) + 1;
      const path = `deploy/App${appNum}`;
      const done = executions.map(e => e.id === selectedEx.id
        ? { ...e, deploy_status: "deployed" as const, deploy_path: path, app_number: appNum }
        : e);
      setExecutions(done); saveExecutions(done);
      setDeploying(false);
    }, 1400);
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };

  const stats = {
    workflows: workflows.length,
    running: executions.filter(e => e.status === "running" || e.status === "pending").length,
    completed: executions.filter(e => e.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button onClick={() => go(user ? "workflows" : "landing")} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center"><Bot size={16} className="text-white" /></div>
            <div className="text-left">
              <p className="font-black text-gray-900 text-sm leading-none">EnterpriseAgent360</p>
              <p className="text-[9px] text-teal-600 font-semibold leading-none mt-1">Agentic Intelligence Delivered.</p>
            </div>
          </button>
          {user && (
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <button onClick={() => go("workflows")} className={`hover:text-teal-600 transition ${view==="workflows"||view==="workflowDetail"?"text-teal-600 font-bold":""}`}>Workflows</button>
              <button onClick={() => go("executions")} className={`hover:text-teal-600 transition ${view==="executions"||view==="executionDetail"?"text-teal-600 font-bold":""}`}>Executions</button>
              <button onClick={() => go("settings")} className={`hover:text-teal-600 transition ${view==="settings"?"text-teal-600 font-bold":""}`}>Settings</button>
            </div>
          )}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-black text-sm">{user.name[0]}</div>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 transition"><LogOut size={16}/></button>
              </>
            ) : (
              <>
                <Link href="/lex360" className="hidden sm:block border border-teal-600 text-teal-600 hover:bg-teal-50 font-bold text-sm px-4 py-2 rounded-lg transition">See Lex360</Link>
                <button onClick={() => go("auth")} className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-4 py-2 rounded-lg transition">Get Started</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════ LANDING ══════════════════════════════ */}
      {view === "landing" && (
        <>
          <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 text-white">
            <div className="max-w-7xl mx-auto px-4 py-12 sm:py-20 text-center">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold mb-5 border border-white/20">
                <Sparkles size={12} className="text-yellow-300" /> Multi-Agent Orchestration · Enterprise AI
              </div>
              <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-4">
                Agentic Intelligence<br /><span className="text-yellow-300">Delivered.</span>
              </h1>
              <p className="text-teal-100 text-sm sm:text-base max-w-xl mx-auto mb-8">
                EnterpriseAgent360 deploys autonomous AI agents that plan, execute, and orchestrate your enterprise workflows end-to-end — coordinated without manual handoffs.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={() => go("auth")} className="bg-white text-teal-700 hover:bg-teal-50 font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 transition">
                  Get Started Free <ArrowRight size={16} />
                </button>
                <button onClick={handleDemo} className="border border-white/40 bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-6 py-3 rounded-xl transition">
                  Try Live Demo
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6 overflow-x-auto text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1.5 shrink-0"><Bot size={12} className="text-teal-500" /><strong className="text-gray-900">16</strong> Specialist Agents</span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1.5 shrink-0"><ListChecks size={12} className="text-teal-500" /><strong className="text-gray-900">15</strong> Tech-Stack Layers</span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1.5 shrink-0"><UserCheck size={12} className="text-teal-500" /><strong className="text-gray-900">Per-Step</strong> Approval Gates</span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1.5 shrink-0 text-green-600 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />Live Orchestration</span>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Built for enterprise-grade autonomy</h2>
              <p className="text-gray-500 mt-2 text-sm">Every agent operates inside guardrails you control.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {CAPABILITIES.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.title} className="bg-white border border-gray-200 hover:border-teal-300 rounded-2xl p-5 transition-all">
                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-4 text-teal-600"><Icon size={18} /></div>
                    <h3 className="font-black text-gray-900 text-sm mb-1.5">{c.title}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">{c.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 pb-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Agents already at work</h2>
              <p className="text-gray-500 mt-2 text-sm">Drop-in specialists for the workflows that eat your team's day.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {USE_CASES.map((u) => {
                const Icon = u.icon;
                return (
                  <div key={u.title} className="bg-white border border-gray-200 hover:border-teal-300 hover:shadow-md rounded-2xl p-5 flex items-start gap-4 transition-all">
                    <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center shrink-0 text-teal-600"><Icon size={20} /></div>
                    <div>
                      <h3 className="font-black text-gray-900 text-sm mb-1">{u.title}</h3>
                      <p className="text-gray-500 text-xs leading-relaxed">{u.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 pb-20">
            <div className="bg-gradient-to-br from-teal-700 to-emerald-600 rounded-3xl p-10 text-center text-white">
              <h2 className="text-2xl sm:text-3xl font-black mb-3">Ready to hand off the busywork?</h2>
              <p className="text-teal-100 text-sm mb-8">Configure a workflow, describe a story, and watch the agent pipeline build it.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={handleDemo} className="inline-flex items-center justify-center gap-2 bg-white text-teal-700 hover:bg-teal-50 px-7 py-3.5 rounded-xl font-bold text-sm transition-all">
                  <CheckCircle size={15} /> Try Live Demo
                </button>
                <Link href="/" className="inline-flex items-center justify-center gap-2 border border-white/40 hover:border-white text-white px-7 py-3.5 rounded-xl font-medium text-sm transition-all">
                  Back to DemandGeniusAI
                </Link>
              </div>
            </div>
          </div>

          <footer className="bg-gray-900 text-white py-10">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center"><Bot size={16} className="text-white" /></div>
                <div><p className="font-black text-sm">EnterpriseAgent360</p><p className="text-gray-400 text-xs">Agentic Intelligence Delivered.</p></div>
              </div>
              <Link href="/" className="text-teal-400 hover:text-white transition text-xs">← Back to DemandGeniusAI</Link>
            </div>
            <p className="text-center text-xs text-gray-600 mt-6">© 2026 EnterpriseAgent360 · Powered by Paariwala Platform</p>
          </footer>
        </>
      )}

      {/* ══════════════════════════════ AUTH ══════════════════════════════ */}
      {view === "auth" && (
        <div className="min-h-[calc(100vh-61px)] bg-slate-50 flex items-center justify-center px-4 py-12">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-gray-900 text-lg">Create Your Workspace</h2>
              <button onClick={() => go("landing")} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X size={16}/></button>
            </div>
            <div className="space-y-3">
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Work email" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
            </div>
            {authErr && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{authErr}</p>}
            <button onClick={handleAuth} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2">
              <CheckCircle size={15}/> Enter Workspace
            </button>
            <button onClick={handleDemo} className="w-full text-center text-xs text-teal-600 font-bold hover:underline">Or jump straight into the live demo →</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════ WORKFLOWS LIST ══════════════════════════════ */}
      {view === "workflows" && user && (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-black text-gray-900">Workflows</h2>
              <p className="text-sm text-gray-500">Configure a workflow's tech stack and agents, then run a story against it.</p>
            </div>
            <div className="flex items-center gap-2">
              <input value={newWfName} onChange={e => setNewWfName(e.target.value)} placeholder="New workflow name…"
                onKeyDown={e => e.key === "Enter" && createWorkflow()}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-teal-400 w-56"/>
              <button onClick={createWorkflow} disabled={creatingWf || !newWfName.trim()}
                className="rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 px-4 py-2 text-sm font-bold text-white transition">
                {creatingWf ? "Creating…" : "+ New"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Workflows</span><Workflow size={16} className="text-teal-600"/></div>
              <p className="text-2xl font-black text-gray-900">{stats.workflows}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Executions Running</span><Loader2 size={16} className="text-amber-600"/></div>
              <p className="text-2xl font-black text-gray-900">{stats.running}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Completed</span><CheckCircle size={16} className="text-green-600"/></div>
              <p className="text-2xl font-black text-gray-900">{stats.completed}</p>
            </div>
          </div>

          {workflows.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <Bot size={28} className="text-gray-300 mx-auto mb-3"/>
              <p className="text-sm text-gray-500">No workflows yet. Create one above.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {workflows.map(wf => {
                const techCount = Object.values(wf.techConfig).reduce((n, v) => n + (v ? v.split(",").filter(Boolean).length : 0), 0);
                const agentCount = wf.steps.filter(s => s.enabled).length;
                return (
                  <button key={wf.id} onClick={() => { setSelectedWfId(wf.id); setTab("tech"); setView("workflowDetail"); }}
                    className="text-left rounded-2xl bg-white border border-gray-200 p-5 hover:border-teal-300 hover:shadow-md transition group">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900 group-hover:text-teal-700 transition">{wf.name}</h3>
                      <span className={`text-xs border rounded-full px-2 py-0.5 shrink-0 ${WF_STATUS_BADGE[wf.status]}`}>{wf.status}</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">{techCount} technologies · {agentCount} agents enabled</p>
                    <p className="mt-3 text-xs text-gray-400">{wf.createdAt}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════ WORKFLOW DETAIL ══════════════════════════════ */}
      {view === "workflowDetail" && user && selectedWf && (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
          <div className="flex items-center gap-4">
            <button onClick={() => go("workflows")} className="text-gray-400 hover:text-gray-700 text-sm transition">← Back</button>
            <h1 className="text-xl font-black text-gray-900">{selectedWf.name}</h1>
            <span className={`text-xs border rounded-full px-2 py-0.5 ${WF_STATUS_BADGE[selectedWf.status]}`}>{selectedWf.status}</span>
          </div>

          <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
            {[
              { key: "tech" as Tab, label: "⚙️ Tech Stack" },
              { key: "steps" as Tab, label: "📋 Agent Steps" },
              { key: "loadrunner" as Tab, label: "📈 LoadRunner" },
              { key: "run" as Tab, label: "🚀 Run Story" },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-sm font-bold whitespace-nowrap transition rounded-t-lg ${tab === t.key ? "bg-white text-teal-700 border-b-2 border-teal-600" : "text-gray-400 hover:text-gray-700"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "tech" && (
            <div className="rounded-2xl bg-white border border-gray-200 p-6">
              <h2 className="text-lg font-black text-gray-900 mb-4">Technology Stack</h2>
              <TechStackForm initial={selectedWf.techConfig} onSave={saveTech} saving={saving} />
            </div>
          )}

          {tab === "steps" && (
            <div className="rounded-2xl bg-white border border-gray-200 p-6">
              <h2 className="text-lg font-black text-gray-900 mb-1">Agent Workflow Steps</h2>
              <p className="text-xs text-gray-400 mb-5">Toggle agents on/off. The amber "Needs Approval" switch pauses the pipeline after each step so you can review and approve before continuing.</p>
              <WorkflowStepsEditor steps={selectedWf.steps} onSave={saveSteps} saving={saving} />
            </div>
          )}

          {tab === "loadrunner" && (
            <div className="rounded-2xl bg-white border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-black text-gray-900">Performance Test Configuration</h2>
                <p className="text-sm text-gray-400 mt-1">Configure the load testing tool and parameters used by the LoadRunner agents.</p>
              </div>
              <LoadRunnerConfigForm initial={selectedWf.lrConfig} onSave={saveLR} saving={saving} />
            </div>
          )}

          {tab === "run" && (
            <div className="rounded-2xl bg-white border border-gray-200 p-6 space-y-4">
              <div>
                <h2 className="text-lg font-black text-gray-900 mb-1">Run a User Story</h2>
                <p className="text-xs text-gray-400">The pipeline runs step-by-step through {selectedWf.steps.filter(s=>s.enabled).length} enabled agents. Steps marked "Needs Approval" will pause and wait for your sign-off.</p>
              </div>
              <textarea value={story} onChange={e => setStory(e.target.value)} rows={6}
                placeholder="As a user, I want to… so that…"
                className="w-full rounded-lg border border-gray-200 text-sm px-3 py-2.5 focus:outline-none focus:border-teal-400 resize-none"/>
              <button onClick={runStory} disabled={launching || !story.trim()}
                className="rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 px-6 py-2.5 text-sm font-bold text-white transition flex items-center gap-2">
                {launching ? <><Loader2 size={14} className="animate-spin"/> Launching…</> : <>🚀 Generate Project</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════ EXECUTIONS LIST ══════════════════════════════ */}
      {view === "executions" && user && (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          <h1 className="text-xl font-black text-gray-900">Execution History</h1>
          {executions.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center text-sm text-gray-400">
              No executions yet. Open a workflow and run a story.
            </div>
          ) : (
            <div className="space-y-2">
              {executions.map(ex => (
                <button key={ex.id} onClick={() => { setSelectedExId(ex.id); setView("executionDetail"); }}
                  className="w-full text-left rounded-xl bg-white border border-gray-200 hover:border-teal-300 px-4 py-3 transition group">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${ex.status==="running"?"bg-amber-400 animate-pulse":ex.status==="completed"?"bg-green-500":ex.status==="failed"?"bg-red-500":"bg-gray-300"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-bold truncate group-hover:text-teal-700 transition">{ex.user_story}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{ex.workflowName} · {ex.createdAt}</p>
                    </div>
                    <span className={`text-xs font-bold rounded-full px-2.5 py-0.5 shrink-0 ${EX_STATUS_BADGE[ex.status]}`}>{ex.status}</span>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition"/>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════ EXECUTION DETAIL ══════════════════════════════ */}
      {view === "executionDetail" && user && selectedEx && (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <button onClick={() => go("executions")} className="text-gray-400 hover:text-gray-700 text-sm transition shrink-0">← Back</button>
              <span className={`text-xs font-bold rounded-full px-2.5 py-0.5 ${EX_STATUS_BADGE[selectedEx.status]}`}>{selectedEx.status}</span>
              <p className="text-xs text-gray-400 font-mono hidden sm:block">{selectedEx.id}</p>
            </div>
            <p className="text-sm text-gray-700 mb-1">{selectedEx.user_story}</p>
            <p className="text-xs text-gray-400 mb-4">{selectedEx.workflowName}</p>
            <button onClick={rerun} disabled={rerunning}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition disabled:opacity-50 ${
                selectedEx.status === "completed" || selectedEx.status === "failed"
                  ? "bg-teal-600 hover:bg-teal-700 text-white"
                  : "border border-teal-300 text-teal-700 hover:bg-teal-50"}`}>
              {rerunning ? <><Loader2 size={14} className="animate-spin"/> Starting new run…</> : <>↺ Rerun from scratch</>}
            </button>
          </div>

          {selectedEx.steps.length > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{selectedEx.steps.filter(s => ["completed","approved"].includes(s.status)).length} / {selectedEx.steps.length} steps done</span>
                <span>{Math.round((selectedEx.steps.filter(s => ["completed","approved"].includes(s.status)).length / selectedEx.steps.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${selectedEx.status === "failed" ? "bg-red-500" : "bg-teal-500"}`}
                  style={{ width: `${(selectedEx.steps.filter(s => ["completed","approved"].includes(s.status)).length / selectedEx.steps.length) * 100}%` }}/>
              </div>
            </div>
          )}

          {selectedEx.steps.some(s => s.status === "awaiting_approval") && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 flex items-center gap-3">
              <span className="text-amber-500 text-lg shrink-0">⏳</span>
              <div>
                <p className="text-sm font-bold text-amber-700">Approval required</p>
                <p className="text-xs text-amber-600">Review the step output below and approve or reject to continue.</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {selectedEx.steps.map(step => (
              <StepResultCard key={step.id} step={step}
                onApprove={() => approveStep(step.id)} onReject={() => rejectStep(step.id)}
                actioning={actioning === step.id} />
            ))}
          </div>

          {selectedEx.status === "completed" && (
            <div className="space-y-3">
              <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4">
                <p className="text-green-700 font-bold">✓ All steps complete</p>
                {selectedEx.project_path && <p className="mt-1 text-xs text-gray-500 font-mono">{selectedEx.project_path}</p>}
              </div>

              <div className={`rounded-xl border px-5 py-4 space-y-4 ${selectedEx.deploy_status === "deployed" ? "border-teal-200 bg-teal-50" : "border-gray-200 bg-white"}`}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xl">{selectedEx.deploy_status === "deployed" ? "🚀" : "📦"}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{selectedEx.deploy_status === "deployed" ? `App${selectedEx.app_number} — Deployed for Testing` : "Deploy for Local Testing"}</p>
                    <p className="text-xs text-gray-400">{selectedEx.deploy_status === "deployed" ? "All generated files written to your local deploy folder." : "Writes all generated files to deploy/AppN and runs npm install."}</p>
                  </div>
                  {selectedEx.deploy_status === "deploying" && <span className="text-xs bg-amber-50 text-amber-700 rounded-full px-2.5 py-0.5">Deploying…</span>}
                </div>

                {selectedEx.deploy_path && (
                  <div className="bg-gray-900 rounded-lg px-4 py-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 uppercase tracking-wider font-bold w-16 shrink-0">Folder</span>
                      <code className="text-xs text-teal-300 font-mono flex-1 break-all">{selectedEx.deploy_path}</code>
                      <button onClick={() => copyText(selectedEx.deploy_path!)} className="text-xs text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 rounded px-2 py-0.5 transition shrink-0">
                        {copied ? "Copied!" : <Copy size={11}/>}
                      </button>
                    </div>
                    <div className="border-t border-gray-800 pt-3 space-y-1.5">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">How to start</p>
                      {[`cd "${selectedEx.deploy_path}"`, `copy .env.example .env`, `npm run dev`].map((cmd, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs font-mono w-4 shrink-0">{i+1}.</span>
                          <code className="text-xs text-teal-300 font-mono flex-1">{cmd}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!selectedEx.deploy_path && (
                  <button onClick={deploy} disabled={deploying}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition disabled:opacity-50">
                    {deploying ? <><Loader2 size={14} className="animate-spin"/> Deploying…</> : <>🚀 Deploy to Local Folder</>}
                  </button>
                )}
              </div>
            </div>
          )}

          {selectedEx.status === "failed" && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
              <p className="text-red-600 font-bold">✗ Execution stopped</p>
              <p className="text-xs text-gray-400 mt-1">Use "↺ Rerun from scratch" above to start a fresh run.</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════ SETTINGS ══════════════════════════════ */}
      {view === "settings" && user && (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
          <h2 className="text-xl font-black text-gray-900 mb-2">Settings</h2>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2"><Settings size={16} className="text-teal-500"/>Profile</h3>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-teal-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">{user.name[0]}</div>
              <div><p className="font-black text-gray-900">{user.name}</p><p className="text-sm text-gray-500">{user.email}</p></div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 text-sm font-bold px-4 py-2 rounded-xl transition">
              <LogOut size={14}/> Sign Out
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-black text-gray-900 mb-1 flex items-center gap-2"><ShieldCheck size={16} className="text-teal-500"/>LLM Provider Key</h3>
            <p className="text-xs text-gray-400 mb-4">Add your Anthropic or OpenAI API key so agents can call a real model instead of the simulation.</p>
            <div className="flex gap-2">
              <input type="password" value={apiKey} onChange={e => { setApiKey(e.target.value); setKeySaved(false); }} placeholder="sk-ant-…"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"/>
              <button onClick={() => setKeySaved(true)} className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-5 py-2 rounded-xl transition flex items-center gap-2">
                {keySaved ? <CheckCircle size={14}/> : <Zap size={14}/>}{keySaved ? "Saved" : "Save"}
              </button>
            </div>
            {!apiKey && <p className="flex items-center gap-1.5 text-[11px] text-amber-600 mt-3"><AlertCircle size={11}/> Running in simulation mode — no key configured.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
