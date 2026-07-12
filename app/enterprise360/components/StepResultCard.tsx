"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { AGENT_ICONS, ExecutionStep, GeneratedFile } from "../lib/agentData";

const STATUS_STYLES: Record<string, { border: string; badge: string; label: string }> = {
  pending:           { border: "border-gray-200",    badge: "bg-gray-100 text-gray-500",     label: "Pending" },
  running:           { border: "border-amber-300",   badge: "bg-amber-50 text-amber-700",    label: "Running…" },
  completed:         { border: "border-gray-200",    badge: "bg-gray-100 text-gray-600",     label: "Done" },
  awaiting_approval: { border: "border-amber-400",   badge: "bg-amber-100 text-amber-700",   label: "Awaiting Approval" },
  approved:          { border: "border-green-300",   badge: "bg-green-50 text-green-700",    label: "Approved" },
  rejected:          { border: "border-red-300",     badge: "bg-red-50 text-red-700",        label: "Rejected" },
  failed:            { border: "border-red-300",     badge: "bg-red-50 text-red-700",        label: "Failed" },
  skipped:           { border: "border-gray-100",    badge: "bg-gray-50 text-gray-400",      label: "Skipped" },
};

function detectLang(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx",
    py: "python", sql: "sql", yaml: "yaml", yml: "yaml",
    json: "json", md: "markdown", sh: "bash", xml: "xml",
  };
  return map[ext] ?? "text";
}
function isMarkdown(path: string) { return path.toLowerCase().endsWith(".md"); }
function fileSize(content: string) {
  const bytes = new Blob([content]).size;
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

function FileModal({ file, onClose }: { file: GeneratedFile; onClose: () => void }) {
  const lang = detectLang(file.path);
  const md = isMarkdown(file.path);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 font-mono truncate">{file.path}</p>
            {file.description && <p className="text-xs text-gray-400 mt-0.5">{file.description}</p>}
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5 font-mono">{lang}</span>
          <span className="text-xs text-gray-400">{fileSize(file.content)}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none ml-2 transition">×</button>
        </div>
        <div className="overflow-auto flex-1 rounded-b-2xl">
          {md ? (
            <div className="prose prose-sm max-w-none px-6 py-5">
              <ReactMarkdown>{file.content}</ReactMarkdown>
            </div>
          ) : (
            <SyntaxHighlighter language={lang} style={oneLight} showLineNumbers
              customStyle={{ margin: 0, borderRadius: "0 0 1rem 1rem", fontSize: "0.78rem", minHeight: "100%" }}>
              {file.content}
            </SyntaxHighlighter>
          )}
        </div>
      </div>
    </div>
  );
}

function FilesTable({ files }: { files: GeneratedFile[] }) {
  const [modal, setModal] = useState<GeneratedFile | null>(null);
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="py-2 px-3 text-xs font-black text-gray-400 uppercase tracking-wider w-8">#</th>
              <th className="py-2 px-3 text-xs font-black text-gray-400 uppercase tracking-wider">File</th>
              <th className="py-2 px-3 text-xs font-black text-gray-400 uppercase tracking-wider hidden sm:table-cell">Description</th>
              <th className="py-2 px-3 text-xs font-black text-gray-400 uppercase tracking-wider text-right">View</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => setModal(f)}>
                <td className="py-2.5 px-3 text-gray-400 font-mono">{i + 1}</td>
                <td className="py-2.5 px-3"><span className="font-mono text-teal-700 group-hover:text-teal-800 text-xs">{f.path}</span></td>
                <td className="py-2.5 px-3 text-gray-400 text-xs hidden sm:table-cell max-w-xs truncate">{f.description || "—"}</td>
                <td className="py-2.5 px-3 text-right">
                  <button onClick={e => { e.stopPropagation(); setModal(f); }}
                    className="text-xs text-teal-600 hover:text-teal-800 border border-teal-200 hover:border-teal-400 rounded px-2 py-0.5 transition">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && <FileModal file={modal} onClose={() => setModal(null)} />}
    </>
  );
}

export function StepResultCard({ step, onApprove, onReject, actioning }: {
  step: ExecutionStep; onApprove?: () => void; onReject?: () => void; actioning?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const st = STATUS_STYLES[step.status] ?? STATUS_STYLES.pending;
  const icon = AGENT_ICONS[step.agent_name] ?? "🤖";
  const label = step.agent_name === "_parse" ? "Story Parser" : step.agent_name.replace(/_/g, " ");
  const files = step.output?.files ?? [];
  const isAwaiting = step.status === "awaiting_approval";
  const isRunning = step.status === "running";
  const isPending = step.status === "pending";

  return (
    <div className={`rounded-xl border ${st.border} bg-white transition-all`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          isRunning ? "bg-amber-400 text-white animate-pulse" :
          step.status === "approved" || step.status === "completed" ? "bg-green-500 text-white" :
          step.status === "failed" || step.status === "rejected" ? "bg-red-500 text-white" :
          isPending ? "bg-gray-200 text-gray-400" : "bg-amber-200 text-amber-700"
        }`}>
          {step.status === "approved" || step.status === "completed" ? "✓" :
           step.status === "failed" || step.status === "rejected" ? "✗" :
           isRunning ? "●" : step.step_order}
        </div>
        <span className="text-lg shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 capitalize">{label}</p>
          {step.output?.summary && <p className="text-xs text-gray-400 mt-0.5 truncate">{step.output.summary}</p>}
          {isRunning && !step.output?.summary && <p className="text-xs text-amber-600 mt-0.5">Generating…</p>}
          {isPending && <p className="text-xs text-gray-400 mt-0.5">Waiting for previous steps</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {files.length > 0 && (
            <button onClick={() => setExpanded(e => !e)} className="text-xs text-teal-600 hover:text-teal-800 border border-teal-200 rounded px-2 py-0.5 transition">
              {files.length} file{files.length !== 1 ? "s" : ""} {expanded ? "▲" : "▼"}
            </button>
          )}
          <span className={`text-xs font-bold rounded-full px-2.5 py-0.5 ${st.badge}`}>{st.label}</span>
        </div>
      </div>

      {isAwaiting && (
        <div className="border-t border-amber-100 bg-amber-50 px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-amber-700 flex-1 min-w-0">Review generated files below, then approve to continue or reject to stop.</span>
          <button onClick={onReject} disabled={actioning}
            className="px-4 py-1.5 rounded-lg border border-red-300 text-red-600 text-sm font-bold hover:bg-red-50 disabled:opacity-40 transition">
            ✗ Reject
          </button>
          <button onClick={onApprove} disabled={actioning}
            className="px-4 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold disabled:opacity-40 transition">
            {actioning ? "Processing…" : "✓ Approve & Continue"}
          </button>
        </div>
      )}

      {step.output?.error && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-3 space-y-1">
          <p className="text-xs font-bold text-red-600">Error</p>
          <p className="text-xs text-red-500 font-mono whitespace-pre-wrap break-words leading-relaxed">{step.output.error}</p>
        </div>
      )}

      {expanded && files.length > 0 && (
        <div className="border-t border-gray-100 bg-slate-50 rounded-b-xl">
          <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-100">
            <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Generated Files</span>
          </div>
          <FilesTable files={files} />
        </div>
      )}
    </div>
  );
}
