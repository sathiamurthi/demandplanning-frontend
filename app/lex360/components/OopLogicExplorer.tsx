"use client";

import React, { useState } from "react";
import { useExtractorStore } from "../store/useExtractorStore";
import { RuleRow } from "../lib/oopRulesEngine";
import { GitFork, Edit3, Check, Sliders, Settings, Plus, Trash2, ShieldAlert, HelpCircle } from "lucide-react";

// Helper function to translate standard OOP database rules into plain English logic statements
export const explainOopLogic = (rule: RuleRow): string => {
  const mode = (rule.mode || "").toUpperCase();
  const field = rule.fieldName || "Result";
  const params = rule.parameters || "";
  const conds = rule.conditions || "";

  let logicDesc = "";

  // 1. Operator logic explanation
  if (mode.startsWith("MULTIPLY")) {
    const list = params.split(",").map(p => p.trim().replace(/^!/, ""));
    logicDesc = `Multiply [${list.join(" × ")}] to calculate [${field}].`;
  } else if (mode.startsWith("ADD")) {
    const list = params.split(",").map(p => p.trim().replace(/^!/, ""));
    logicDesc = `Add [${list.join(" + ")}] to calculate [${field}].`;
  } else if (mode.startsWith("SUBTRACT")) {
    const list = params.split(",").map(p => p.trim().replace(/^!/, ""));
    logicDesc = `Subtract [${list[1] || "0"}] from [${list[0] || "0"}] to calculate [${field}].`;
  } else if (mode.startsWith("DIVIDE")) {
    const list = params.split(",").map(p => p.trim().replace(/^!/, ""));
    logicDesc = `Divide [${list[0] || "0"}] by [${list[1] || "1"}]${list[2] ? ` and multiply by [${list[2]}]` : ""} to calculate [${field}].`;
  } else if (mode.startsWith("ASSIGNFIELD")) {
    logicDesc = `Assign the value of [${params.replace(/^!/, "")}] directly to [${field}].`;
  } else if (mode.startsWith("SETVARIABLE")) {
    logicDesc = `Set the variable [${field}] to a constant value of ${params}.`;
  } else if (mode.startsWith("LOOKUPVARIABLE")) {
    const list = params.split(",").map(p => p.trim().replace(/^!/, ""));
    logicDesc = `Look up rating factors for [${list.join(", ")}] and assign to [${field}].`;
  } else if (mode.startsWith("RATEIFPOSITIVE")) {
    logicDesc = `Determine base insurance rate from Policy Form and Protection Class and store in [${field}].`;
  } else {
    logicDesc = `Set variable [${field}] using operation ${rule.mode} with parameters (${params}).`;
  }

  // 2. Conditions logic explanation
  if (conds && conds !== "NULL" && conds.trim() !== "") {
    const parts = conds.split(";").map(p => p.trim()).filter(p => p !== "");
    const condList: string[] = [];
    parts.forEach(part => {
      if (["AND", "OR", "NOT"].includes(part.toUpperCase())) {
        condList.push(part.toUpperCase());
      } else {
        const comp = part.split(",");
        if (comp.length === 3) {
          const left = comp[0].replace(/^!/, "");
          const op = comp[1];
          const right = comp[2].replace(/^'|'$/g, "").replace(/^&/, "");
          const opSym = op === "=" || op === "==" ? "equals" : op === "<>" ? "does not equal" : op;
          condList.push(`[${left}] ${opSym} "${right}"`);
        } else {
          condList.push(`[${part.replace(/^!/, "")}] is True`);
        }
      }
    });
    logicDesc += ` (Only executes if: ${condList.join(" ")})`;
  }

  return logicDesc;
};

export default function OopLogicExplorer() {
  const isLoaded = useExtractorStore((state) => state.isLoaded);
  const isOopModel = useExtractorStore((state) => state.isOopModel);
  const oopRules = useExtractorStore((state) => state.oopRules);
  const updateOopRule = useExtractorStore((state) => state.updateOopRule);
  const addOopRule = useExtractorStore((state) => state.addOopRule);
  const deleteOopRule = useExtractorStore((state) => state.deleteOopRule);

  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  
  // Rule editor fields
  const [editedDesc, setEditedDesc] = useState("");
  const [editedMode, setEditedMode] = useState("");
  const [editedParams, setEditedParams] = useState("");
  const [editedConds, setEditedConds] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isLoaded || !isOopModel) return null;

  const handleSelectRule = (rule: RuleRow) => {
    setSelectedRuleId(rule.id);
    setEditedDesc(rule.description);
    setEditedMode(rule.mode);
    setEditedParams(rule.parameters);
    setEditedConds(rule.conditions);
  };

  const handleSaveRule = () => {
    if (!selectedRuleId) return;
    updateOopRule(selectedRuleId, {
      description: editedDesc,
      mode: editedMode,
      parameters: editedParams,
      conditions: editedConds
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleAddNewRule = () => {
    const newId = String(Math.floor(Math.random() * 90000) + 10000);
    const newRule: RuleRow = {
      id: newId,
      page: "2",
      description: "New rating step logic rule",
      typeCode: "RATING",
      fieldName: "NewFactor",
      fieldType: "NULL",
      order: oopRules.length > 0 ? oopRules[oopRules.length - 1].order + 10 : 10,
      mode: "SetVariable",
      parameters: "1.0",
      applyTo: "NULL",
      conditions: "NULL"
    };
    addOopRule(newRule);
    handleSelectRule(newRule);
  };

  const handleDeleteRule = () => {
    if (!selectedRuleId) return;
    deleteOopRule(selectedRuleId);
    setSelectedRuleId(null);
  };

  const selectedRule = oopRules.find(r => r.id === selectedRuleId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
      
      {/* Rules Database Table */}
      <div className="lg:col-span-3 bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col min-w-0">
        <div className="border-b border-gray-200 px-5 py-4 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <GitFork className="h-4 w-4 text-emerald-500" /> Compiled OOP Rule Logic Table (ManualID999)
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5 font-sans">
              Rules execute sequentially by order. Select a row to update.
            </p>
          </div>

          {/* CRUD Actions */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleAddNewRule}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 rounded-xl text-xs font-bold transition-all shadow-3xs"
            >
              <Plus className="h-3.5 w-3.5" /> Add Rule
            </button>
            {selectedRuleId && (
              <button
                onClick={handleDeleteRule}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all shadow-3xs"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Rule
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px] p-5">
          <table className="w-full table-fixed border-collapse text-left text-xs text-gray-600 font-mono">
            <thead>
              <tr className="border-b border-gray-200 pb-2">
                <th className="p-2.5 font-sans font-extrabold text-gray-400 uppercase text-[10px] tracking-wider min-w-[50px] w-[64px]">
                  Order
                </th>
                <th className="p-2.5 font-sans font-extrabold text-gray-400 uppercase text-[10px] tracking-wider min-w-[120px]">
                  FieldName
                </th>
                <th className="p-2.5 font-sans font-extrabold text-gray-400 uppercase text-[10px] tracking-wider min-w-[70px]">
                  Operator
                </th>
                <th className="p-2.5 font-sans font-extrabold text-gray-400 uppercase text-[10px] tracking-wider min-w-[100px]">
                  Parameters
                </th>
                <th className="p-2.5 font-sans font-extrabold text-gray-400 uppercase text-[10px] tracking-wider">
                  OOP Logic (Understanding)
                </th>
              </tr>
            </thead>
            <tbody>
              {oopRules.map((rule) => {
                const isSelected = selectedRuleId === rule.id;
                const logicalDescription = explainOopLogic(rule);
                
                return (
                  <tr
                    key={rule.id}
                    onClick={() => handleSelectRule(rule)}
                    className={`border-b border-gray-100 hover:bg-gray-50/60 cursor-pointer select-none transition-all ${
                      isSelected
                        ? "bg-emerald-50/30 border-emerald-100 text-emerald-900 font-semibold"
                        : "text-gray-700"
                    }`}
                  >
                    <td className="p-2.5 font-sans text-gray-400 font-bold">{rule.order}</td>
                    <td className="p-2.5 text-gray-900 font-bold">{rule.fieldName}</td>
                    <td className="p-2.5 text-violet-600 font-semibold">{rule.mode}</td>
                    <td className="p-2.5 text-gray-500 truncate max-w-[120px]" title={rule.parameters}>
                      {rule.parameters}
                    </td>
                    <td className="p-2.5 text-gray-500 font-sans italic truncate max-w-[300px]" title={logicalDescription}>
                      {logicalDescription}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logic Editor sidebar */}
      <div className="w-full flex flex-col bg-white border border-gray-200 rounded-3xl p-5 shadow-sm text-sm shrink-0">
        <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
          <Edit3 className="h-5 w-5 text-emerald-500" /> Rule Logic Editor
        </h3>

        {selectedRule ? (
          <div className="space-y-4 flex-1">
            {/* Rules Agent Logic Understanding Card */}
            <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl space-y-2">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                <HelpCircle className="h-3 w-3" /> Rules Agent Understanding
              </span>
              <p className="text-xs text-gray-700 font-sans leading-relaxed font-medium">
                {explainOopLogic(selectedRule)}
              </p>
            </div>

            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 border border-gray-200 rounded-lg">
                Order {selectedRule.order}
              </span>
              <h4 className="text-xs font-bold text-gray-800 mt-2 font-sans leading-relaxed">
                {selectedRule.fieldName} (ID {selectedRule.id})
              </h4>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 font-sans">
                Description
              </span>
              <textarea
                value={editedDesc}
                onChange={(e) => setEditedDesc(e.target.value)}
                className="w-full h-14 p-2 bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-xl leading-normal resize-none focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Mode */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 font-sans">
                Operator Mode
              </span>
              <input
                type="text"
                value={editedMode}
                onChange={(e) => setEditedMode(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 text-xs text-violet-600 font-mono rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Parameters */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 font-sans">
                Parameters (comma-separated)
              </span>
              <input
                type="text"
                value={editedParams}
                onChange={(e) => setEditedParams(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 text-xs text-gray-700 font-mono rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Conditions */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 font-sans">
                Execution Conditions
              </span>
              <textarea
                value={editedConds}
                onChange={(e) => setEditedConds(e.target.value)}
                className="w-full h-14 p-2 bg-gray-50 border border-gray-200 text-xs text-amber-600 font-mono rounded-xl leading-normal resize-none focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveRule}
              className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors font-sans"
            >
              {saveSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 text-white animate-bounce" /> Rule logic saved!
                </>
              ) : (
                "Save Logic Rule"
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-gray-50/20">
            <Sliders className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-xs max-w-[180px] leading-relaxed font-sans">
              Click on any row in the rules grid to view logic details, modify operations, parameters or condition flags.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
