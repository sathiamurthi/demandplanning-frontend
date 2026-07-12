"use client";

import { useState } from "react";
import { TECH_OPTIONS, LAYER_META } from "../lib/agentData";

function toSet(value: string): Set<string> {
  return new Set(value ? value.split(",").map(s => s.trim()).filter(Boolean) : []);
}
function fromSet(set: Set<string>): string {
  return [...set].join(",");
}

function CheckboxGroup({ layerKey, options, selected, onChange }: {
  layerKey: string; options: string[]; selected: Set<string>;
  onChange: (key: string, next: Set<string>) => void;
}) {
  const toggle = (opt: string) => {
    const next = new Set(selected);
    next.has(opt) ? next.delete(opt) : next.add(opt);
    onChange(layerKey, next);
  };
  return (
    <div>
      <div className="flex gap-3 mb-2">
        <button type="button" onClick={() => onChange(layerKey, new Set(options))} className="text-xs text-teal-600 hover:text-teal-800 font-semibold transition">Select all</button>
        <span className="text-gray-300">·</span>
        <button type="button" onClick={() => onChange(layerKey, new Set())} className="text-xs text-gray-400 hover:text-gray-600 transition">Clear</button>
        {selected.size > 0 && <span className="text-xs text-gray-400 ml-auto">{selected.size} selected</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const checked = selected.has(opt);
          return (
            <label key={opt} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer border transition-all select-none ${
              checked ? "bg-teal-50 border-teal-400 text-teal-700" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}>
              <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(opt)} />
              {checked && <span className="text-teal-600 text-xs leading-none">✓</span>}
              {opt}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function LayerCard({ meta, options, selected, onChange }: {
  meta: typeof LAYER_META[0]; options: string[]; selected: Set<string>;
  onChange: (key: string, next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(selected.size > 0);
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition">
        <span className="text-lg shrink-0">{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{meta.label}</p>
          <p className="text-xs text-gray-400 truncate">{meta.hint}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selected.size > 0 && (
            <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2 py-0.5 font-semibold">{selected.size} selected</span>
          )}
          {selected.size > 0 && selected.size <= 3 && !open && (
            <span className="text-xs text-gray-400 hidden sm:block">{[...selected].join(", ")}</span>
          )}
          <span className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </div>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-4 py-4 bg-slate-50">
          <CheckboxGroup layerKey={meta.key} options={options} selected={selected} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

export function TechStackForm({ initial, onSave, saving }: {
  initial: Record<string, string>; onSave: (cfg: Record<string, string>) => void; saving: boolean;
}) {
  const [selections, setSelections] = useState<Record<string, Set<string>>>(() => {
    const s: Record<string, Set<string>> = {};
    for (const { key } of LAYER_META) s[key] = toSet(initial[key] ?? "");
    return s;
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (key: string, next: Set<string>) => {
    setSelections(prev => ({ ...prev, [key]: next }));
    setSaved(false);
  };

  const handleSave = () => {
    const cfg: Record<string, string> = {};
    for (const { key } of LAYER_META) cfg[key] = fromSet(selections[key] ?? new Set());
    onSave(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const totalSelected = LAYER_META.reduce((n, m) => n + (selections[m.key]?.size ?? 0), 0);

  return (
    <div className="space-y-3">
      {LAYER_META.map(meta => (
        <LayerCard key={meta.key} meta={meta} options={TECH_OPTIONS[meta.key] ?? []}
          selected={selections[meta.key] ?? new Set()} onChange={handleChange} />
      ))}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-gray-400">{totalSelected} technolog{totalSelected === 1 ? "y" : "ies"} selected across all layers</span>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-green-600 font-bold">✓ Saved</span>}
          <button type="button" onClick={handleSave} disabled={saving}
            className="rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 px-5 py-2 text-sm font-bold text-white transition">
            {saving ? "Saving…" : "Save Tech Stack"}
          </button>
        </div>
      </div>
    </div>
  );
}
