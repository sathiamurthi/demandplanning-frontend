"use client";

import React, { useState, useEffect } from "react";
import { useExtractorStore } from "../store/useExtractorStore";
import { parseCellKeyString, cellKeyToString, extractDependencies } from "../lib/formulaEvaluator";
import { colNumToLabel, ParsedCell } from "../lib/excelParser";
import { FileSpreadsheet, List, ChevronRight, CornerDownRight, ArrowRightLeft, GitFork, Check, Edit2, Plus, Trash2 } from "lucide-react";

type ExplorerTab = "grid" | "formulas";

export default function LogicExplorer() {
  const isLoaded = useExtractorStore((state) => state.isLoaded);
  const sheets = useExtractorStore((state) => state.sheets);
  const cellDb = useExtractorStore((state) => state.cellDb);
  const inputs = useExtractorStore((state) => state.inputs);
  const formulas = useExtractorStore((state) => state.formulas);
  const simulatedValues = useExtractorStore((state) => state.simulatedValues);
  const activeSheetName = useExtractorStore((state) => state.activeSheetName);
  const setActiveSheet = useExtractorStore((state) => state.setActiveSheet);
  const isAppAgentMode = useExtractorStore((state) => state.isAppAgentMode);
  const updateCellFormula = useExtractorStore((state) => state.updateCellFormula);

  // CRUD actions from store
  const addSheet = useExtractorStore((state) => state.addSheet);
  const deleteSheet = useExtractorStore((state) => state.deleteSheet);
  const addSheetRow = useExtractorStore((state) => state.addSheetRow);
  const deleteSheetRow = useExtractorStore((state) => state.deleteSheetRow);

  const [activeTab, setActiveTab] = useState<ExplorerTab>("grid");
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);
  const [editedFormula, setEditedFormula] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (selectedCellKey) {
      const cell = cellDb[selectedCellKey];
      setEditedFormula(cell && cell.formula ? "=" + cell.formula : "");
    } else {
      setEditedFormula("");
    }
  }, [selectedCellKey, cellDb]);

  if (!isLoaded) return null;

  const currentSheet = sheets.find((s) => s.name === activeSheetName) || sheets[0];
  if (!currentSheet) return null;

  const maxRenderRow = Math.min(Math.max(currentSheet.rowCount, 15), 45);
  const maxRenderCol = Math.min(Math.max(currentSheet.colCount, 8), 12);

  const getCellType = (sheetName: string, ref: string) => {
    const key = cellKeyToString(sheetName, ref);
    if (formulas.includes(key)) return "formula";
    if (inputs.includes(key)) return "input";
    if (cellDb[key] && cellDb[key].value !== "") return "static";
    return "empty";
  };

  const handleCellClick = (sheetName: string, ref: string) => {
    const key = cellKeyToString(sheetName, ref);
    setSelectedCellKey(key);
  };

  const handleSaveFormula = () => {
    if (!selectedCellKey) return;
    updateCellFormula(selectedCellKey, editedFormula);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleAddNewSheet = () => {
    const sheetName = prompt("Enter sheet name:", `Sheet${sheets.length + 1}`);
    if (sheetName) {
      addSheet(sheetName.trim());
    }
  };

  const handleDeleteActiveSheet = () => {
    if (sheets.length <= 1) {
      alert("Workbook must contain at least one worksheet.");
      return;
    }
    if (confirm(`Are you sure you want to delete worksheet "${activeSheetName}"?`)) {
      deleteSheet(activeSheetName);
      setSelectedCellKey(null);
    }
  };

  const handleAddGridRow = () => {
    addSheetRow(activeSheetName);
  };

  // Determine row to delete based on active cell selection
  const selectedRowMatch = selectedCellKey ? parseCellKeyString(selectedCellKey).ref.match(/[0-9]+/) : null;
  const selectedRowIndex = selectedRowMatch ? parseInt(selectedRowMatch[0], 10) : null;

  const handleDeleteGridRow = () => {
    if (selectedRowIndex) {
      if (confirm(`Delete Row ${selectedRowIndex} from worksheet "${activeSheetName}"?`)) {
        deleteSheetRow(activeSheetName, selectedRowIndex);
        setSelectedCellKey(null);
      }
    } else {
      alert("Please click a cell in the row you wish to delete first.");
    }
  };

  const selectedCell = selectedCellKey ? cellDb[selectedCellKey] : null;
  const selectedCellSimVal = selectedCellKey ? simulatedValues[selectedCellKey] : null;
  const selectedCellFormulaDeps = (selectedCell && selectedCell.formula)
    ? extractDependencies(selectedCell.formula, selectedCell.sheetName)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Explorer Panel */}
      <div className="lg:col-span-2 flex flex-col bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Header Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 px-5 py-4 bg-gray-50/50 gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("grid")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                activeTab === "grid"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-xs"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Sheet Grid View
            </button>
            <button
              onClick={() => setActiveTab("formulas")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                activeTab === "formulas"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-xs"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <List className="h-3.5 w-3.5" /> Formula Rules List
            </button>
          </div>

          {/* Worksheet CRUD Actions */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 overflow-x-auto py-0.5 max-w-[150px] sm:max-w-none">
              {sheets.map((sheet) => (
                <button
                  key={sheet.name}
                  onClick={() => {
                    setActiveSheet(sheet.name);
                    setSelectedCellKey(null);
                  }}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition-all shrink-0 ${
                    activeSheetName === sheet.name
                      ? "bg-gray-100 border-gray-200 text-gray-700 shadow-2xs"
                      : "bg-transparent border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {sheet.name}
                </button>
              ))}
            </div>

            <span className="h-4 w-px bg-gray-300 mx-1 shrink-0" />

            <div className="flex gap-1 shrink-0">
              <button
                onClick={handleAddNewSheet}
                title="Create New Worksheet"
                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 rounded-lg transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDeleteActiveSheet}
                title="Delete Active Worksheet"
                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-auto flex-1 max-h-[500px]">
          {activeTab === "grid" ? (
            <div className="w-full overflow-auto space-y-4">
              {/* Row CRUD actions */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleAddGridRow}
                  className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-[10px] font-bold transition-all shadow-3xs"
                >
                  <Plus className="h-3 w-3" /> Insert Row
                </button>
                {selectedRowIndex && (
                  <button
                    onClick={handleDeleteGridRow}
                    className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg text-[10px] font-bold transition-all shadow-3xs"
                  >
                    <Trash2 className="h-3 w-3" /> Delete Row {selectedRowIndex}
                  </button>
                )}
              </div>

              <table className="w-full border-collapse text-left text-xs text-gray-600 font-mono">
                <thead>
                  <tr>
                    <th className="p-1.5 bg-gray-50 border border-gray-200 text-center font-sans text-[10px] text-gray-400 font-bold min-w-[40px]">
                      Row
                    </th>
                    {Array.from({ length: maxRenderCol }).map((_, cIdx) => (
                      <th
                        key={cIdx}
                        className="p-1.5 bg-gray-50 border border-gray-200 text-center font-sans text-[10px] text-gray-400 font-bold min-w-[90px]"
                      >
                        {colNumToLabel(cIdx + 1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: maxRenderRow }).map((_, rIdx) => {
                    const rowNum = rIdx + 1;
                    return (
                      <tr key={rIdx}>
                        <td className="p-1.5 bg-gray-50 border border-gray-100 text-center font-sans text-[10px] text-gray-400 font-semibold">
                          {rowNum}
                        </td>
                        {Array.from({ length: maxRenderCol }).map((_, cIdx) => {
                          const colLabel = colNumToLabel(cIdx + 1);
                          const cellRef = `${colLabel}${rowNum}`;
                          const cellKey = cellKeyToString(currentSheet.name, cellRef);
                          const cell = currentSheet.cells[cellRef];
                          const cellType = getCellType(currentSheet.name, cellRef);
                          const simVal = simulatedValues[cellKey];

                          let cellStyle = "bg-transparent border-gray-100";

                          if (cellType === "formula") {
                            cellStyle =
                              selectedCellKey === cellKey
                                ? "bg-violet-50 border-2 border-violet-500 text-violet-700 font-bold cursor-pointer shadow-[0_0_8px_rgba(139,92,246,0.1)]"
                                : "bg-violet-50/50 hover:bg-violet-100/40 border border-violet-100 text-violet-600/90 cursor-pointer";
                          } else if (cellType === "input") {
                            cellStyle =
                              selectedCellKey === cellKey
                                ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-700 font-bold cursor-pointer shadow-[0_0_8px_rgba(16,185,129,0.1)]"
                                : "bg-emerald-50/50 hover:bg-emerald-100/40 border border-emerald-100 text-emerald-600/90 cursor-pointer";
                          } else if (cellType === "static") {
                            cellStyle =
                              selectedCellKey === cellKey
                                ? "bg-gray-100 border-2 border-gray-400 text-gray-800 cursor-pointer"
                                : "bg-gray-50/60 hover:bg-gray-100 border border-gray-100 text-gray-700 cursor-pointer";
                          } else {
                            cellStyle = "hover:bg-gray-50 border-gray-100/80 cursor-pointer";
                          }

                          return (
                            <td
                              key={cIdx}
                              onClick={() => handleCellClick(currentSheet.name, cellRef)}
                              className={`p-2 border truncate max-w-[120px] transition-all text-center select-none ${cellStyle}`}
                            >
                              {simVal !== undefined && simVal !== "" ? (
                                typeof simVal === "number" ? (
                                  simVal.toLocaleString(undefined, { maximumFractionDigits: 4 })
                                ) : (
                                  String(simVal)
                                )
                              ) : cell ? (
                                String(cell.value)
                              ) : (
                                ""
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-2.5">
              {formulas.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  No formula logic found in this workbook.
                </p>
              ) : (
                formulas.map((key) => {
                  const { sheetName, ref } = parseCellKeyString(key);
                  const cell = cellDb[key];
                  const simVal = simulatedValues[key];
                  const isSelected = selectedCellKey === key;

                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedCellKey(key)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50/65 border-emerald-300 text-gray-800 font-semibold"
                          : "bg-gray-50/40 border-gray-100 hover:border-gray-200 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-extrabold tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded uppercase">
                            {sheetName}
                          </span>
                          <span className="text-xs font-bold font-mono text-gray-800">{ref}</span>
                        </div>
                        <span className="text-xs font-bold font-mono text-emerald-500">
                          {typeof simVal === "number"
                            ? simVal.toLocaleString(undefined, { maximumFractionDigits: 4 })
                            : String(simVal)}
                        </span>
                      </div>
                      <div className="mt-2 text-xs font-mono text-gray-600 bg-gray-50 border border-gray-100 p-2 rounded-lg overflow-x-auto">
                        ={cell?.formula}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Side Details Panel */}
      <div className="flex flex-col bg-white border border-gray-200 rounded-3xl p-5 shadow-sm text-sm">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
          <GitFork className="h-5 w-5 text-emerald-500" /> Cell Logic Inspector
        </h3>

        {selectedCellKey && (cellDb[selectedCellKey] || inputs.includes(selectedCellKey)) ? (
          <div className="space-y-5 flex-1">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 border border-gray-200 rounded-lg">
                  {parseCellKeyString(selectedCellKey).sheetName}
                </span>
                <span className="text-xs font-bold font-mono text-gray-700">
                  {parseCellKeyString(selectedCellKey).ref}
                </span>
              </div>
              <div className="mt-3 flex justify-between items-baseline border-b border-gray-100 pb-3">
                <span className="text-xs text-gray-400 font-semibold">Simulated Value:</span>
                <span className="text-md font-bold font-mono text-gray-800">
                  {selectedCellSimVal !== undefined && selectedCellSimVal !== ""
                    ? typeof selectedCellSimVal === "number"
                      ? selectedCellSimVal.toLocaleString(undefined, { maximumFractionDigits: 4 })
                      : String(selectedCellSimVal)
                    : "0"}
                </span>
              </div>
            </div>

            {/* Formula Block / Editable Input */}
            {selectedCell && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                  <span>Logic Rule Formula</span>
                  {isAppAgentMode && (
                    <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">
                      Editing Rule
                    </span>
                  )}
                </span>
                
                {isAppAgentMode ? (
                  <div className="space-y-2">
                    <textarea
                      value={editedFormula}
                      onChange={(e) => setEditedFormula(e.target.value)}
                      placeholder="e.g. =A1*B1"
                      className="w-full h-20 p-2.5 bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:outline-none text-xs font-mono text-gray-700 rounded-xl leading-relaxed resize-none"
                    />
                    <button
                      onClick={handleSaveFormula}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      {saveSuccess ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-white animate-bounce" /> Rule Recalculated!
                        </>
                      ) : (
                        "Update Logic Rule"
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs text-gray-600 overflow-x-auto leading-relaxed">
                    {selectedCell.formula ? `=${selectedCell.formula}` : String(selectedCell.value)}
                  </div>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-sans">Original Value</div>
                <div className="mt-1 font-bold text-gray-700 font-mono">
                  {selectedCell ? String(selectedCell.value) : "0"}
                </div>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-sans">Classification</div>
                <div className="mt-1 font-bold text-gray-700 capitalize font-sans">
                  {formulas.includes(selectedCellKey) ? "Formula Cell" : inputs.includes(selectedCellKey) ? "Input Cell" : "Static Cell"}
                </div>
              </div>
            </div>

            {/* Dependencies */}
            {selectedCellFormulaDeps.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  Calculated From
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedCellFormulaDeps.map((dep) => {
                    const parsedDep = parseCellKeyString(dep);
                    const depVal = simulatedValues[dep];
                    return (
                      <button
                        key={dep}
                        onClick={() => setSelectedCellKey(dep)}
                        className="flex items-center justify-between w-full p-2 bg-gray-50/50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200 rounded-lg text-left transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <CornerDownRight className="h-3 w-3 text-gray-400" />
                          <span className="text-xs font-mono font-bold text-gray-700 group-hover:text-emerald-500">
                            {parsedDep.sheetName}!{parsedDep.ref}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-gray-500">
                          {typeof depVal === "number" ? depVal.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(depVal)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-gray-50/30">
            <ArrowRightLeft className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-xs max-w-[180px] leading-relaxed font-sans">
              Click on any cell in the spreadsheet grid or formula list to inspect its logic rules.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
