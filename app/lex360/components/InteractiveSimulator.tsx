"use client";

import React, { useState } from "react";
import { useExtractorStore } from "../store/useExtractorStore";
import { parseCellKeyString, extractDependencies } from "../lib/formulaEvaluator";
import { Sliders, RotateCcw, AlertCircle, Play, Bookmark, Trash2, LineChart, HelpCircle, ArrowRight, Activity, CornerDownRight } from "lucide-react";

interface Scenario {
  name: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
}

export default function InteractiveSimulator() {
  const isLoaded = useExtractorStore((state) => state.isLoaded);
  const cellDb = useExtractorStore((state) => state.cellDb);
  const inputs = useExtractorStore((state) => state.inputs);
  const formulas = useExtractorStore((state) => state.formulas);
  const simulatedValues = useExtractorStore((state) => state.simulatedValues);
  const updateInputValue = useExtractorStore((state) => state.updateInputValue);
  const resetSimulation = useExtractorStore((state) => state.resetSimulation);

  const [scenarioName, setScenarioName] = useState("");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  
  // Track the parameter currently focused/tweaked by the user for impact tracing
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  if (!isLoaded) return null;

  // Set default focused input if none selected
  const activeInputKey = focusedKey || (inputs.length > 0 ? inputs[0] : null);

  // Identify final output cells (leaf nodes in formula graph: not referenced by any other formula)
  const outputCells = formulas.filter((fKey) => {
    return !formulas.some((otherKey) => {
      if (otherKey === fKey) return false;
      const otherCell = cellDb[otherKey];
      if (!otherCell || !otherCell.formula) return false;
      const parsedOtherKey = parseCellKeyString(otherKey);
      const deps = extractDependencies(otherCell.formula, parsedOtherKey.sheetName);
      return deps.includes(fKey);
    });
  });

  // Calculate downstream formula dependencies for a given input parameter
  const getDownstreamDependencies = (startKey: string | null): string[] => {
    if (!startKey) return [];
    const affected = new Set<string>([startKey]);
    
    // formulas list is already topologically sorted, so downstream matches propagate linearly
    formulas.forEach((key) => {
      const cell = cellDb[key];
      if (!cell || !cell.formula) return;
      const parsed = parseCellKeyString(key);
      const deps = extractDependencies(cell.formula, parsed.sheetName);
      if (deps.some(dep => affected.has(dep))) {
        affected.add(key);
      }
    });

    affected.delete(startKey); // Remove the input node itself to keep calculations only
    return Array.from(affected);
  };

  const downstreamCalcs = getDownstreamDependencies(activeInputKey);

  const handleInputChange = (key: string, val: string) => {
    updateInputValue(key, val);
    setFocusedKey(key);
  };

  // Resolve human-readable label for inputs
  const getInputLabel = (key: string) => {
    const parsed = parseCellKeyString(key);
    const cell = cellDb[key];
    if (!cell) return key;

    if (parsed.sheetName === "Products") {
      const rowNumMatch = parsed.ref.match(/[0-9]+/);
      if (rowNumMatch) {
        const row = rowNumMatch[0];
        const nameVal = cellDb[`Products!B${row}`]?.value || `Row ${row}`;
        const fieldName = parsed.ref.startsWith("C") ? "UnitPrice" : parsed.ref.startsWith("D") ? "TaxRate" : "Value";
        return `${nameVal} (${fieldName})`;
      }
    } else if (parsed.sheetName === "Customers_API") {
      const rowNumMatch = parsed.ref.match(/[0-9]+/);
      if (rowNumMatch) {
        const row = rowNumMatch[0];
        const nameVal = cellDb[`Customers_API!B${row}`]?.value || `Row ${row}`;
        return `${nameVal} (LoyaltyDiscount)`;
      }
    } else if (parsed.sheetName === "Sales") {
      const rowNumMatch = parsed.ref.match(/[0-9]+/);
      if (rowNumMatch) {
        const row = rowNumMatch[0];
        const orderId = cellDb[`Sales!A${row}`]?.value || `${row}`;
        const prodName = cellDb[`Sales!D${row}`]?.value || `Product`;
        const fieldName = parsed.ref.startsWith("E") ? "Quantity" : parsed.ref.startsWith("F") ? "UnitPrice" : "Value";
        return `Order #${orderId}: ${prodName} (${fieldName})`;
      }
    }

    const rowNumMatch = parsed.ref.match(/[0-9]+/);
    if (rowNumMatch) {
      const row = rowNumMatch[0];
      const descVal = cellDb[`${parsed.sheetName}!B${row}`]?.value || cellDb[`${parsed.sheetName}!A${row}`]?.value;
      if (descVal && typeof descVal === "string" && isNaN(Number(descVal))) {
        return `${descVal} (${parsed.ref})`;
      }
    }

    return `${parsed.sheetName}!${parsed.ref}`;
  };

  // Resolve human-readable label for outputs
  const getOutputLabel = (key: string) => {
    const parsed = parseCellKeyString(key);
    const cell = cellDb[key];
    if (!cell) return key;

    if (parsed.sheetName === "Summary") {
      const rowNumMatch = parsed.ref.match(/[0-9]+/);
      if (rowNumMatch) {
        const row = rowNumMatch[0];
        if (row === "8") return "Grand Total";
        const nameVal = cellDb[`Summary!B${row}`]?.value || `Product Row ${row}`;
        
        let suffix = "";
        if (parsed.ref.startsWith("C")) suffix = "Qty Sold";
        else if (parsed.ref.startsWith("D")) suffix = "Revenue";
        else if (parsed.ref.startsWith("E")) suffix = "Discount";
        else if (parsed.ref.startsWith("F")) suffix = "% Share";
        
        return `${nameVal} (${suffix})`;
      }
    }

    const rowNumMatch = parsed.ref.match(/[0-9]+/);
    if (rowNumMatch) {
      const row = rowNumMatch[0];
      const descVal = cellDb[`${parsed.sheetName}!B${row}`]?.value || cellDb[`${parsed.sheetName}!A${row}`]?.value;
      if (descVal && typeof descVal === "string" && isNaN(Number(descVal))) {
        return `${descVal} (${parsed.ref})`;
      }
    }

    return `${parsed.sheetName}!${parsed.ref}`;
  };

  const getSliderProperties = (key: string) => {
    const originalCell = cellDb[key];
    const rawVal = originalCell ? String(originalCell.value).replace(/[^0-9.-]/g, "") : "";
    const initialVal = rawVal !== "" ? Number(rawVal) : NaN;

    if (isNaN(initialVal)) {
      return {
        min: 0,
        max: 0,
        step: 0,
        isPercentage: false,
        isInvalidNumber: true,
      };
    }

    if (initialVal >= 0 && initialVal <= 1 && (String(originalCell?.formattedValue).includes("%") || initialVal !== 0)) {
      if (initialVal <= 1) {
        return {
          min: 0,
          max: 1,
          step: 0.01,
          isPercentage: true,
          isInvalidNumber: false,
        };
      }
    }

    const absVal = Math.abs(initialVal);
    const min = initialVal < 0 ? initialVal * 2 : 0;
    const max = initialVal === 0 ? 100 : initialVal * 2;
    const step = absVal > 0 ? (absVal / 50 > 1 ? Math.round(absVal / 50) : 0.1) : 1;

    return {
      min,
      max,
      step,
      isPercentage: false,
      isInvalidNumber: false,
    };
  };

  const saveScenario = () => {
    if (!scenarioName.trim()) return;

    const inputSnapshot: Record<string, any> = {};
    inputs.forEach((k) => {
      inputSnapshot[k] = simulatedValues[k];
    });

    const outputSnapshot: Record<string, any> = {};
    outputCells.forEach((k) => {
      outputSnapshot[k] = simulatedValues[k];
    });

    setScenarios([
      ...scenarios,
      {
        name: scenarioName.trim(),
        inputs: inputSnapshot,
        outputs: outputSnapshot,
      },
    ]);
    setScenarioName("");
  };

  const loadScenario = (scenario: Scenario) => {
    Object.entries(scenario.inputs).forEach(([key, val]) => {
      updateInputValue(key, val);
    });
  };

  const deleteScenario = (idx: number) => {
    setScenarios(scenarios.filter((_, i) => i !== idx));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Tweakable Parameters (Left Column) */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 mb-5">
          <div>
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-emerald-500" /> Interactive Simulation Sandbox
            </h3>
            <p className="text-[10px] text-gray-400 font-medium leading-normal mt-0.5">
              Click any input card to view its nested formulas and dynamically affected calculations inline.
            </p>
          </div>
          <button
            onClick={() => {
              resetSimulation();
              setFocusedKey(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 rounded-xl text-xs font-bold border border-gray-200 transition-colors shadow-2xs"
          >
            <RotateCcw className="h-3.5 w-3.5 text-gray-500" /> Reset Preview
          </button>
        </div>

        {inputs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
            <AlertCircle className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-xs max-w-xs leading-relaxed">
              No variable parameters detected. This spreadsheet may only contain static equations without upstream editable inputs.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {inputs.map((key) => {
              const { sheetName, ref } = parseCellKeyString(key);
              const cell = cellDb[key];
              const val = simulatedValues[key];
              const { min, max, step, isPercentage, isInvalidNumber } = getSliderProperties(key);
              const readableLabel = getInputLabel(key);
              const isFocused = activeInputKey === key;

              // Resolve dynamic inline child dependencies just for this card when active
              const inlineDeps = isFocused ? getDownstreamDependencies(key) : [];

              return (
                <div 
                  key={key} 
                  onMouseEnter={() => setFocusedKey(key)}
                  onClick={() => setFocusedKey(key)}
                  className={`p-4 border rounded-2xl space-y-3.5 transition-all cursor-pointer ${
                    isFocused 
                      ? "bg-emerald-50/15 border-emerald-500 ring-2 ring-emerald-500/10 shadow-3xs" 
                      : "bg-gray-50/60 border-gray-100 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded border font-sans ${
                          isFocused 
                            ? "text-emerald-700 bg-emerald-50 border-emerald-100" 
                            : "text-gray-500 bg-gray-100 border-gray-200"
                        }`}>
                          {sheetName}
                        </span>
                        <span className="text-xs font-black text-gray-800 font-sans">{readableLabel}</span>
                        <span className="text-[9px] font-mono text-gray-400">({ref})</span>
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 mt-1 block">
                        Base Uploaded Value: {cell ? String(cell.formattedValue) : "0"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={val !== undefined ? val : ""}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        className="w-24 px-2 py-1 bg-white border border-gray-200 hover:border-gray-300 focus:border-emerald-500 focus:outline-none text-right font-mono text-xs font-extrabold text-gray-800 rounded-lg transition-colors"
                      />
                      {isPercentage && <span className="text-xs font-bold text-gray-400">%</span>}
                    </div>
                  </div>

                  {!isInvalidNumber && !isNaN(Number(val)) && (
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] text-gray-400 font-bold font-mono">{min}</span>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={Number(val) || 0}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        className="flex-1 accent-emerald-500 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-[9px] text-gray-400 font-bold font-mono font-sans">
                        {isPercentage ? "100%" : max.toFixed(0)}
                      </span>
                    </div>
                  )}

                  {/* INLINE DYNAMIC DEPENDENCY TRACER (Rendered inside the active left-side card) */}
                  {isFocused && inlineDeps.length > 0 && (
                    <div className="mt-3.5 pt-3.5 border-t border-emerald-100/60 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 uppercase tracking-wide">
                        <CornerDownRight className="h-3.5 w-3.5 text-emerald-500" />
                        Inline Impact Trail ({inlineDeps.length} Affected Cells)
                      </div>
                      
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1 select-none">
                        {inlineDeps.map((depKey) => {
                          const depCell = cellDb[depKey];
                          if (!depCell) return null;
                          const depVal = simulatedValues[depKey];
                          const parsedDep = parseCellKeyString(depKey);
                          const depLabel = getOutputLabel(depKey);
                          
                          const originalNum = Number(String(depCell.value).replace(/[^0-9.-]/g, ""));
                          const simulatedNum = Number(String(depVal !== undefined ? depVal : 0).replace(/[^0-9.-]/g, ""));
                          const variance = simulatedNum - originalNum;
                          const percentVar = originalNum !== 0 ? (variance / originalNum) * 100 : 0;
                          const hasChanged = Math.abs(variance) > 0.001;

                          return (
                            <div 
                              key={depKey} 
                              className={`flex items-center justify-between text-[10px] p-2 border rounded-xl transition-all ${
                                hasChanged 
                                  ? "bg-white border-emerald-300 shadow-3xs" 
                                  : "bg-white/50 border-gray-100 opacity-60"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`text-[7.5px] font-extrabold px-1.5 py-0.2 rounded border uppercase shrink-0 font-sans ${
                                  hasChanged 
                                    ? "text-emerald-700 bg-emerald-50 border-emerald-100" 
                                    : "text-gray-500 bg-gray-50 border-gray-200"
                                }`}>
                                  {parsedDep.sheetName}
                                </span>
                                <span className="font-extrabold text-gray-700 truncate max-w-[120px]" title={depLabel}>
                                  {depLabel}
                                </span>
                                <span className="font-mono text-gray-400">({parsedDep.ref})</span>
                              </div>
                              
                              <div className="flex items-center gap-1.5 shrink-0 pl-2">
                                <span className="font-bold text-gray-400 line-through font-mono">
                                  {originalNum.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                </span>
                                <ArrowRight className="h-2.5 w-2.5 text-gray-300" />
                                <span className="font-black font-mono text-emerald-600">
                                  {typeof depVal === "number" ? depVal.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(depVal)}
                                </span>
                                {hasChanged && (
                                  <span className={`px-1 py-0.1 rounded text-[8px] font-black font-mono shrink-0 ${
                                    variance > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                  }`}>
                                    {variance > 0 ? "+" : ""}{percentVar.toFixed(0)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic Results Display & Validation (Right Column) */}
      <div className="flex flex-col bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3.5 mb-4">
          <Activity className="h-5 w-5 text-emerald-500 animate-pulse" /> Impact Trace & Dependencies
        </h3>

        {/* Selected Parameter Header */}
        {activeInputKey && (
          <div className="mb-4 p-3 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[8px] font-extrabold text-emerald-600 uppercase tracking-wide block">Auditing active input</span>
              <span className="text-xs font-black text-gray-800 truncate block mt-0.5">{getInputLabel(activeInputKey)}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-emerald-500 shrink-0 ml-2" />
          </div>
        )}

        {/* Impact Calculations List */}
        <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
          {downstreamCalcs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-gray-50/20">
              <HelpCircle className="h-8 w-8 text-gray-300 mb-3" />
              <p className="text-xs max-w-[190px] leading-relaxed font-sans font-medium">
                Adjust a parameter slider on the left to trace which downstream grid formulas and totals are affected by the sweep.
              </p>
            </div>
          ) : (
            downstreamCalcs.map((key) => {
              const { sheetName, ref } = parseCellKeyString(key);
              const cell = cellDb[key];
              const simVal = simulatedValues[key];
              const readableLabel = getOutputLabel(key);

              // Calculate Before vs After variance for verification
              const originalNum = Number(String(cell ? cell.value : 0).replace(/[^0-9.-]/g, ""));
              const simulatedNum = Number(String(simVal !== undefined ? simVal : 0).replace(/[^0-9.-]/g, ""));
              
              const variance = simulatedNum - originalNum;
              const percentVar = originalNum !== 0 ? (variance / originalNum) * 100 : 0;
              const hasChanged = Math.abs(variance) > 0.001;

              return (
                <div 
                  key={key} 
                  className={`p-4 rounded-2xl flex flex-col justify-between min-h-[110px] space-y-3 border transition-all ${
                    hasChanged 
                      ? "bg-emerald-50/25 border-emerald-300 ring-1 ring-emerald-300/30" 
                      : "bg-gray-50/30 border-gray-100 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded border font-sans ${
                        hasChanged 
                          ? "text-emerald-700 bg-emerald-50 border-emerald-100" 
                          : "text-gray-500 bg-gray-100 border-gray-200"
                      }`}>
                        {sheetName}
                      </span>
                      <span className="text-xs font-black text-gray-800 font-sans">{readableLabel}</span>
                      <span className="text-[9px] font-mono text-gray-400">({ref})</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-baseline">
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-400 block font-bold font-sans uppercase">
                        Before: {cell ? String(cell.formattedValue) : "0"}
                      </span>
                      <span className="text-[9px] text-emerald-600 block font-extrabold font-mono truncate max-w-[140px]" title={cell?.formula || ""}>
                        Formula: {cell && cell.formula ? `=${cell.formula}` : "Outcome"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black font-mono text-emerald-600 block">
                        {simVal !== undefined && simVal !== "" ? (
                          typeof simVal === "number" ? (
                            simVal.toLocaleString(undefined, { maximumFractionDigits: 2 })
                          ) : (
                            String(simVal)
                          )
                        ) : (
                          "0"
                        )}
                      </span>
                      
                      {/* Variance indicator pill */}
                      {hasChanged ? (
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold font-mono mt-1 ${
                          variance > 0 
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                            : "bg-rose-50 text-rose-600 border border-rose-100"
                        }`}>
                          {variance > 0 ? "+" : ""}{variance.toFixed(2)} ({variance > 0 ? "+" : ""}{percentVar.toFixed(1)}%)
                        </span>
                      ) : (
                        <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-bold text-gray-400 bg-gray-100 border border-gray-200 mt-1 uppercase">
                          No Change
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Scenario Snapshot Saver */}
        <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block font-sans">
            Scenario Sandbox Snapshots
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Scenario Name"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:outline-none text-xs rounded-xl"
            />
            <button
              onClick={saveScenario}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-3xs transition-colors"
            >
              Save
            </button>
          </div>

          {/* Scenario List */}
          {scenarios.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {scenarios.map((sc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded-xl">
                  <span className="text-xs font-bold text-gray-700 truncate max-w-[110px]">{sc.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => loadScenario(sc)}
                      className="p-1 hover:bg-emerald-50 text-emerald-600 rounded"
                      title="Load Scenario"
                    >
                      <Play className="h-3 w-3 fill-current" />
                    </button>
                    <button
                      onClick={() => deleteScenario(idx)}
                      className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                      title="Delete Scenario"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
