"use client";

import { useState } from "react";
import { AGENT_ICONS, AGENT_GROUPS, StepRow } from "../lib/agentData";

export function WorkflowStepsEditor({ steps, onSave, saving }: {
  steps: StepRow[]; onSave: (steps: StepRow[]) => void; saving: boolean;
}) {
  const [local, setLocal] = useState<StepRow[]>(steps);

  const toggle = (name: string, field: "enabled" | "requires_approval") =>
    setLocal(prev => prev.map(s => s.agent_name === name ? { ...s, [field]: !s[field] } : s));

  return (
    <div className="space-y-6">
      {Object.entries(AGENT_GROUPS).map(([group, agents]) => (
        <div key={group}>
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{group}</h4>
          <div className="grid grid-cols-[1fr_80px_130px] gap-2 mb-1 px-3">
            <span className="text-xs text-gray-400">Agent</span>
            <span className="text-xs text-gray-400 text-center">Enabled</span>
            <span className="text-xs text-gray-400 text-center">Needs Approval</span>
          </div>
          <div className="space-y-1">
            {agents.map(a => {
              const s = local.find(x => x.agent_name === a);
              if (!s) return null;
              return (
                <div key={a} className={`grid grid-cols-[1fr_80px_130px] gap-2 items-center rounded-lg border px-3 py-2 ${
                  s.enabled ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 opacity-50"
                }`}>
                  <span className="text-sm text-gray-900 flex items-center gap-2">
                    <span>{AGENT_ICONS[a] ?? "🤖"}</span>
                    <span className="capitalize">{a.replace(/_/g, " ")}</span>
                  </span>
                  <div className="flex justify-center">
                    <button type="button" onClick={() => toggle(a, "enabled")}
                      className={`w-10 h-5 rounded-full transition-colors relative ${s.enabled ? "bg-teal-600" : "bg-gray-300"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${s.enabled ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <button type="button" onClick={() => toggle(a, "requires_approval")} disabled={!s.enabled}
                      className={`w-10 h-5 rounded-full transition-colors relative disabled:cursor-not-allowed ${s.requires_approval && s.enabled ? "bg-amber-500" : "bg-gray-300"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${s.requires_approval && s.enabled ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4 pt-2">
        <button onClick={() => onSave(local)} disabled={saving}
          className="rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 px-5 py-2 text-sm font-bold text-white transition">
          {saving ? "Saving…" : "Save Agent Steps"}
        </button>
        <p className="text-xs text-gray-400">
          <span className="text-amber-600 font-bold">Amber = needs your approval</span> before the next step runs
        </p>
      </div>
    </div>
  );
}
