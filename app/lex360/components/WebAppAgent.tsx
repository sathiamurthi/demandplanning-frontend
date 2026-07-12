"use client";

import React, { useState, useEffect } from "react";
import JSZip from "jszip";
import { useExtractorStore } from "../store/useExtractorStore";
import { parseCellKeyString, cellKeyToString, extractDependencies } from "../lib/formulaEvaluator";
import { colNumToLabel, ParsedCell } from "../lib/excelParser";
import OopRequestSimulator from "./OopRequestSimulator";
import OopLogicExplorer from "./OopLogicExplorer";
import GraphAgent from "./GraphAgent";
import { Globe, ArrowRight, Eye, Mail, FileSpreadsheet, Layers, GitFork, Sliders, RotateCcw, AlertTriangle } from "lucide-react";

export default function WebAppAgent() {
  const isLoaded = useExtractorStore((state) => state.isLoaded);
  const fileName = useExtractorStore((state) => state.fileName);
  const sheets = useExtractorStore((state) => state.sheets);
  const cellDb = useExtractorStore((state) => state.cellDb);
  const inputs = useExtractorStore((state) => state.inputs);
  const formulas = useExtractorStore((state) => state.formulas);
  const simulatedValues = useExtractorStore((state) => state.simulatedValues);
  const updateInputValue = useExtractorStore((state) => state.updateInputValue);
  const updateCellFormula = useExtractorStore((state) => state.updateCellFormula);
  const resetSimulation = useExtractorStore((state) => state.resetSimulation);

  // OOP Rating Rules states
  const isOopModel = useExtractorStore((state) => state.isOopModel);
  const oopRules = useExtractorStore((state) => state.oopRules);
  const oopRequestContextString = useExtractorStore((state) => state.oopRequestContextString);

  const [activeSubTab, setActiveSubTab] = useState<"preview">("preview");
  const [copiedCode, setCopiedCode] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Company Registration States for sending request email
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regCompanyName, setRegCompanyName] = useState("");
  const [regContactName, setRegContactName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regFormError, setRegFormError] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // States for the Live Preview Grid
  const [activePreviewSheet, setActivePreviewSheet] = useState("");
  const [selectedPreviewCellKey, setSelectedPreviewCellKey] = useState<string | null>(null);
  const [editedPreviewFormula, setEditedPreviewFormula] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize active sheet name once loaded
  useEffect(() => {
    if (sheets.length > 0) {
      setActivePreviewSheet(sheets[0].name);
    }
  }, [sheets]);

  // Sync edited formula string when selected cell changes in preview
  useEffect(() => {
    if (selectedPreviewCellKey) {
      const cell = cellDb[selectedPreviewCellKey];
      setEditedPreviewFormula(cell && cell.formula ? "=" + cell.formula : (cell ? String(cell.value) : ""));
    } else {
      setEditedPreviewFormula("");
    }
  }, [selectedPreviewCellKey, cellDb]);

  if (!isLoaded) return null;

  const currentSheet = sheets.find((s) => s.name === activePreviewSheet) || sheets[0];
  if (!currentSheet) return null;

  const maxRenderRow = Math.min(Math.max(currentSheet.rowCount, 12), 30);
  const maxRenderCol = Math.min(Math.max(currentSheet.colCount, 8), 10);

  // Compile the sheets structure and cell properties to pass to the generated code
  const getCompiledModelJson = (): string => {
    const compiledSheets = sheets.map((sheet) => {
      const sheetCells: Record<string, any> = {};
      Object.keys(sheet.cells).forEach((ref) => {
        const cell = sheet.cells[ref];
        sheetCells[ref] = {
          ref: cell.ref,
          value: cell.value,
          formula: cell.formula,
          type: cell.type,
          formattedValue: cell.formattedValue,
        };
      });
      return {
        name: sheet.name,
        rowCount: sheet.rowCount,
        colCount: sheet.colCount,
        cells: sheetCells,
      };
    });

    const model = {
      workbookName: fileName,
      sheets: compiledSheets,
      inputs,
      formulas,
    };

    return JSON.stringify(model, null, 2);
  };

  const handleCellClick = (ref: string) => {
    const key = cellKeyToString(activePreviewSheet, ref);
    setSelectedPreviewCellKey(key);
  };

  const getCellType = (ref: string) => {
    const key = cellKeyToString(activePreviewSheet, ref);
    if (formulas.includes(key)) return "formula";
    if (inputs.includes(key)) return "input";
    if (cellDb[key] && cellDb[key].value !== "") return "static";
    return "empty";
  };

  const handleSaveFormula = () => {
    if (!selectedPreviewCellKey) return;
    updateCellFormula(selectedPreviewCellKey, editedPreviewFormula);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Compile standard spreadsheet app code
  const generateStandardReactCode = (): string => {
    return `"use client";

import React, { useState, useEffect } from "react";
import { 
  FileSpreadsheet, 
  Layers, 
  Settings, 
  GitFork, 
  Sliders, 
  RotateCcw, 
  Check, 
  Edit2, 
  Play,
  ArrowRight,
  Database,
  Cpu
} from "lucide-react";

// Initial compiled model containing all sheet grids, cells, inputs, and formulas
const INITIAL_MODEL = ${getCompiledModelJson()};

// Convert column index (1-based) to letter (e.g. 1 -> A, 27 -> AA)
function colNumToLabel(colNum) {
  let temp = colNum;
  let label = "";
  while (temp > 0) {
    let modulo = (temp - 1) % 26;
    label = String.fromCharCode(65 + modulo) + label;
    temp = Math.floor((temp - modulo) / 26);
  }
  return label;
}

export default function StandaloneModelApp() {
  const [activeSheetName, setActiveSheetName] = useState(INITIAL_MODEL.sheets[0]?.name || "");
  const [cellDb, setCellDb] = useState({});
  const [rules, setRules] = useState({});
  const [simulatedValues, setSimulatedValues] = useState({});
  const [selectedCellKey, setSelectedCellKey] = useState(null);
  const [editedFormula, setEditedFormula] = useState("");
  const [isRuleModeActive, setIsRuleModeActive] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize DB structures
  useEffect(() => {
    const initialDb = {};
    const initialRules = {};
    const initialVals = {};

    INITIAL_MODEL.sheets.forEach(sheet => {
      Object.keys(sheet.cells).forEach(ref => {
        const cell = sheet.cells[ref];
        const key = sheet.name + "!" + ref;
        initialDb[key] = cell;
        initialVals[key] = cell.value;
        if (cell.formula) {
          initialRules[key] = cell.formula;
        }
      });
    });

    setCellDb(initialDb);
    setRules(initialRules);
    setSimulatedValues(initialVals);
  }, []);

  // Sync edited formula string when selected cell changes
  useEffect(() => {
    if (selectedCellKey) {
      const cell = cellDb[selectedCellKey];
      const formula = rules[selectedCellKey];
      setEditedFormula(formula ? "=" + formula : (cell ? String(cell.value) : ""));
    } else {
      setEditedFormula("");
    }
  }, [selectedCellKey, rules, cellDb]);

  // Recalculate spreadsheet logic in-memory using topological sorting
  useEffect(() => {
    if (Object.keys(simulatedValues).length === 0) return;

    try {
      const nextValues = {};
      Object.keys(cellDb).forEach(k => {
        nextValues[k] = cellDb[k].value;
      });

      const formulasList = Object.keys(rules).filter(k => rules[k]);

      const getDeps = (formulaStr, defaultSheet) => {
        if (!formulaStr) return [];
        const cleanFormula = formulaStr.replace(/\$/g, "");
        const regex = /(?:(?:'([^']+)')|([a-zA-Z0-9_]+))?!([a-zA-Z]+[0-9]+)|([a-zA-Z]+[0-9]+)/g;
        const deps = [];
        let match;
        while ((match = regex.exec(cleanFormula)) !== null) {
          const sheetName = match[1] || match[2] || defaultSheet;
          const ref = match[3] || match[4];
          deps.push(sheetName + "!" + ref);
        }
        return deps;
      };

      const inDegree = {};
      const adj = {};
      formulasList.forEach(k => {
        inDegree[k] = 0;
        adj[k] = [];
      });

      formulasList.forEach(k => {
        const parts = k.split("!");
        const sheet = parts[0];
        const deps = getDeps(rules[k], sheet);
        deps.forEach(dep => {
          if (cellDb[dep] !== undefined) {
            adj[dep] = adj[dep] || [];
            adj[dep].push(k);
            inDegree[k] = (inDegree[k] || 0) + 1;
          }
        });
      });

      const queue = Object.keys(inDegree).filter(k => inDegree[k] === 0);
      const order = [];
      while (queue.length > 0) {
        const u = queue.shift();
        order.push(u);
        const neighbors = adj[u] || [];
        neighbors.forEach(v => {
          inDegree[v]--;
          if (inDegree[v] === 0) queue.push(v);
        });
      }

      const expandRange = (rangeStr) => {
        const cleanRange = rangeStr.replace(/\$/g, "");
        const parts = cleanRange.split(":");
        if (parts.length !== 2) return [rangeStr];
        const start = parts[0];
        const end = parts[1];
        const startMatch = start.match(/^([A-Z]+)([0-9]+)$/i);
        const endMatch = end.match(/^([A-Z]+)([0-9]+)$/i);
        if (!startMatch || !endMatch) return [rangeStr];
        
        const labelToColNum = (label) => {
          let colNum = 0;
          for (let i = 0; i < label.length; i++) {
            colNum = colNum * 26 + (label.charCodeAt(i) - 64);
          }
          return colNum;
        };
        const colNumToLabel = (colNum) => {
          let temp = colNum;
          let label = "";
          while (temp > 0) {
            let modulo = (temp - 1) % 26;
            label = String.fromCharCode(65 + modulo) + label;
            temp = Math.floor((temp - modulo) / 26);
          }
          return label;
        };

        const startCol = labelToColNum(startMatch[1].toUpperCase());
        const startRow = parseInt(startMatch[2], 10);
        const endCol = labelToColNum(endMatch[1].toUpperCase());
        const endRow = parseInt(endMatch[2], 10);

        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);

        const cells = [];
        for (let c = minCol; c <= maxCol; c++) {
          const colLabel = colNumToLabel(c);
          for (let r = minRow; r <= maxRow; r++) {
            cells.push(colLabel + r);
          }
        }
        return cells;
      };

      class Evaluator {
        constructor(vals) {
          this.values = vals;
        }
        getCellValue(sheetName, cellRef) {
          const key = sheetName + "!" + cellRef.toUpperCase();
          return this.values[key] !== undefined ? this.values[key] : 0;
        }
        evaluate(formula, defaultSheetName) {
          try {
            const cleanFormula = formula.replace(/\$/g, "");
            const tokens = this.tokenize(cleanFormula);
            let idx = 0;
            const parseExpression = () => parseLogical();
            const parseLogical = () => {
              let left = parseAdditive();
              while (idx < tokens.length) {
                const token = tokens[idx];
                if (["=", "<>", "<", ">", "<=", ">="].includes(token)) {
                  idx++;
                  const right = parseAdditive();
                  if (token === "=") left = left === right;
                  else if (token === "<>") left = left !== right;
                  else if (token === "<") left = left < right;
                  else if (token === ">") left = left > right;
                  else if (token === "<=") left = left <= right;
                  else if (token === ">=") left = left >= right;
                } else break;
              }
              return left;
            };
            const parseAdditive = () => {
              let left = parseMultiplicative();
              while (idx < tokens.length) {
                const token = tokens[idx];
                if (token === "+" || token === "-") {
                  idx++;
                  const right = parseMultiplicative();
                  if (token === "+") left = Number(left) + Number(right);
                  else left = Number(left) - Number(right);
                } else break;
              }
              return left;
            };
            const parseMultiplicative = () => {
              let left = parsePower();
              while (idx < tokens.length) {
                const token = tokens[idx];
                if (token === "*" || token === "/") {
                  idx++;
                  const right = parsePower();
                  if (token === "*") left = Number(left) * Number(right);
                  else left = Number(left) / Number(right);
                } else break;
              }
              return left;
            };
            const parsePower = () => {
              let left = parsePrimary();
              while (idx < tokens.length && tokens[idx] === "^") {
                idx++;
                const right = parsePrimary();
                left = Math.pow(Number(left), Number(right));
              }
              return left;
            };
            const parsePrimary = () => {
              if (idx >= tokens.length) return 0;
              const token = tokens[idx];
              if (token === "(") {
                idx++;
                const val = parseExpression();
                if (tokens[idx] === ")") idx++;
                return val;
              }
              if (token === "-") { idx++; return -Number(parsePrimary()); }
              if (token === "+") { idx++; return Number(parsePrimary()); }
              if (idx + 1 < tokens.length && tokens[idx + 1] === "(") {
                const funcName = token.toUpperCase();
                idx += 2;
                const args = [];
                if (tokens[idx] !== ")") {
                  while (true) {
                    let tempIdx = idx;
                    let isRange = false;
                    let rangeStr = "";
                    let sheet = defaultSheetName;
                    if (tempIdx + 1 < tokens.length && tokens[tempIdx + 1] === "!") {
                      sheet = tokens[tempIdx];
                      if (sheet.startsWith("'") && sheet.endsWith("'")) sheet = sheet.slice(1, -1);
                      tempIdx += 2;
                    }
                    if (tempIdx + 1 < tokens.length && tokens[tempIdx + 1] === ":") {
                      rangeStr = tokens[tempIdx] + ":" + tokens[tempIdx + 2];
                      isRange = true;
                      idx = tempIdx + 3;
                    }
                    if (isRange) {
                      args.push({ type: "range", sheetName: sheet, rangeStr, cells: expandRange(rangeStr) });
                    } else {
                      args.push(parseExpression());
                    }
                    if (tokens[idx] === ",") idx++;
                    else if (tokens[idx] === ")") break;
                    else break;
                  }
                }
                if (tokens[idx] === ")") idx++;
                return this.evaluateFunction(funcName, args);
              }
              if (/^\d+(\.\d+)?$/.test(token)) { idx++; return Number(token); }
              if (token.startsWith('"') && token.endsWith('"')) { idx++; return token.slice(1, -1); }
              if (token.toUpperCase() === "TRUE") { idx++; return true; }
              if (token.toUpperCase() === "FALSE") { idx++; return false; }
              let cellRef = token;
              let sheet = defaultSheetName;
              if (idx + 1 < tokens.length && tokens[idx + 1] === "!") {
                sheet = token;
                if (sheet.startsWith("'") && sheet.endsWith("'")) sheet = sheet.slice(1, -1);
                cellRef = tokens[idx + 2];
                idx += 3;
              } else idx++;
              return this.getCellValue(sheet, cellRef);
            };
            return parseExpression();
          } catch {
            return "#VALUE!";
          }
        }
        tokenize(formula) {
          const tokens = [];
          let i = 0;
          while (i < formula.length) {
            const char = formula[i];
            if (/\s/.test(char)) { i++; continue; }
            if (["+", "-", "*", "/", "^", "(", ")", ",", "!", ":"].includes(char)) { tokens.push(char); i++; continue; }
            if (char === "<" && formula[i + 1] === "=") { tokens.push("<="); i += 2; continue; }
            if (char === ">" && formula[i + 1] === "=") { tokens.push(">="); i += 2; continue; }
            if (char === "<" && formula[i + 1] === ">") { tokens.push("<>"); i += 2; continue; }
            if (char === "<" || char === ">" || char === "=") { tokens.push(char); i++; continue; }
            if (char === '"') {
              let str = '"'; i++;
              while (i < formula.length && formula[i] !== '"') { str += formula[i]; i++; }
              if (i < formula.length) { str += '"'; i++; }
              tokens.push(str); continue;
            }
            if (char === "'") {
              let str = "'"; i++;
              while (i < formula.length && formula[i] !== "'") { str += formula[i]; i++; }
              if (i < formula.length) { str += "'"; i++; }
              tokens.push(str); continue;
            }
            if (/\d/.test(char)) {
              let num = "";
              while (i < formula.length && /[\d\.]/.test(formula[i])) { num += formula[i]; i++; }
              tokens.push(num); continue;
            }
            if (/[a-zA-Z0-9_]/.test(char)) {
              let ref = "";
              while (i < formula.length && /[a-zA-Z0-9_]/.test(formula[i])) { ref += formula[i]; i++; }
              tokens.push(ref); continue;
            }
            i++;
          }
          return tokens;
        }
        evaluateFunction(funcName, args) {
          const flattenArgs = (rawArgs) => {
            const flat = [];
            rawArgs.forEach(arg => {
              if (arg && typeof arg === "object" && arg.type === "range") {
                arg.cells.forEach(cell => { flat.push(this.getCellValue(arg.sheetName, cell)); });
              } else flat.push(arg);
            });
            return flat;
          };
          switch (funcName) {
            case "SUM": {
              const flat = flattenArgs(args).map(a => Number(a) || 0);
              return flat.reduce((acc, v) => acc + v, 0);
            }
            case "AVERAGE": {
              const flat = flattenArgs(args).map(a => Number(a) || 0);
              return flat.length > 0 ? flat.reduce((acc, v) => acc + v, 0) / flat.length : 0;
            }
            case "PRODUCT": {
              const flat = flattenArgs(args).map(a => Number(a) || 0);
              return flat.length > 0 ? flat.reduce((acc, v) => acc * v, 1) : 0;
            }
            case "MIN": {
              const flat = flattenArgs(args).map(a => Number(a) || 0);
              return flat.length > 0 ? Math.min(...flat) : 0;
            }
            case "MAX": {
              const flat = flattenArgs(args).map(a => Number(a) || 0);
              return flat.length > 0 ? Math.max(...flat) : 0;
            }
            case "IF": {
              const [cond, trueVal, falseVal] = args;
              return cond ? trueVal : falseVal;
            }
            case "INDEX": {
              const range = args[0];
              if (!range || typeof range !== "object" || range.type !== "range") return "#VALUE!";
              const rowIdx = Number(args[1]) || 1;
              const colIdx = args[2] !== undefined ? Number(args[2]) : null;
              if (colIdx === null) {
                const cell = range.cells[rowIdx - 1];
                return cell ? this.getCellValue(range.sheetName, cell) : 0;
              } else {
                const cells = range.cells;
                const labelToColNum = (label) => {
                  let colNum = 0;
                  for (let i = 0; i < label.length; i++) colNum = colNum * 26 + (label.charCodeAt(i) - 64);
                  return colNum;
                };
                const rangeCells = cells.map(c => {
                  const match = c.match(/^([A-Z]+)([0-9]+)$/i);
                  return { ref: c, col: match ? labelToColNum(match[1].toUpperCase()) : 0, row: match ? parseInt(match[2], 10) : 0 };
                });
                const minCol = Math.min(...rangeCells.map(rc => rc.col));
                const minRow = Math.min(...rangeCells.map(rc => rc.row));
                const targetCol = minCol + colIdx - 1;
                const targetRow = minRow + rowIdx - 1;
                const cellObj = rangeCells.find(rc => rc.col === targetCol && rc.row === targetRow);
                return cellObj ? this.getCellValue(range.sheetName, cellObj.ref) : 0;
              }
            }
            case "MATCH": {
              const [lookupVal, range, matchTypeRaw] = args;
              const matchType = matchTypeRaw !== undefined ? Number(matchTypeRaw) : 1;
              if (!range || typeof range !== "object" || range.type !== "range") return "#VALUE!";
              const cellValues = range.cells.map(c => this.getCellValue(range.sheetName, c));
              if (matchType === 0) {
                const idx = cellValues.findIndex(val => String(val).toUpperCase() === String(lookupVal).toUpperCase());
                return idx === -1 ? "#N/A" : idx + 1;
              } else if (matchType === 1) {
                let bestIdx = -1;
                for (let i = 0; i < cellValues.length; i++) {
                  if (Number(cellValues[i]) <= Number(lookupVal)) bestIdx = i;
                }
                return bestIdx === -1 ? "#N/A" : bestIdx + 1;
              } else {
                let bestIdx = -1;
                for (let i = 0; i < cellValues.length; i++) {
                  if (Number(cellValues[i]) >= Number(lookupVal)) bestIdx = i;
                }
                return bestIdx === -1 ? "#N/A" : bestIdx + 1;
              }
            }
            case "SUMIFS": {
              const sumRange = args[0];
              if (!sumRange || typeof sumRange !== "object" || sumRange.type !== "range") return "#VALUE!";
              const pairs = [];
              for (let i = 1; i < args.length; i += 2) {
                if (args[i] && typeof args[i] === "object" && args[i].type === "range" && args[i+1] !== undefined) {
                  pairs.push({ range: args[i], crit: args[i+1] });
                }
              }
              if (pairs.length === 0) return 0;
              let total = 0;
              for (let idx = 0; idx < sumRange.cells.length; idx++) {
                let matchesAll = true;
                for (const pair of pairs) {
                  const critCell = pair.range.cells[idx];
                  if (!critCell) { matchesAll = false; break; }
                  const critVal = this.getCellValue(pair.range.sheetName, critCell);
                  const targetCrit = String(pair.crit).toUpperCase();
                  const sourceVal = String(critVal).toUpperCase();
                  if (targetCrit.startsWith("<=")) {
                    if (!(Number(critVal) <= Number(targetCrit.slice(2)))) { matchesAll = false; break; }
                  } else if (targetCrit.startsWith(">=")) {
                    if (!(Number(critVal) >= Number(targetCrit.slice(2)))) { matchesAll = false; break; }
                  } else if (targetCrit.startsWith("<>")) {
                    if (sourceVal === targetCrit.slice(2)) { matchesAll = false; break; }
                  } else if (targetCrit.startsWith("<")) {
                    if (!(Number(critVal) < Number(targetCrit.slice(1)))) { matchesAll = false; break; }
                  } else if (targetCrit.startsWith(">")) {
                    if (!(Number(critVal) > Number(targetCrit.slice(1)))) { matchesAll = false; break; }
                  } else if (targetCrit.startsWith("=")) {
                    if (sourceVal !== targetCrit.slice(1)) { matchesAll = false; break; }
                  } else {
                    if (sourceVal !== targetCrit) { matchesAll = false; break; }
                  }
                }
                if (matchesAll) {
                  const sumCell = sumRange.cells[idx];
                  if (sumCell) total += Number(this.getCellValue(sumRange.sheetName, sumCell)) || 0;
                }
              }
              return total;
            }
            default:
              return "#NAME?";
          }
        }
      }

      const evaluator = new Evaluator(nextValues);
      order.forEach(k => {
        const parts = k.split("!");
        const formula = rules[k];
        if (formula) {
          nextValues[k] = evaluator.evaluate(formula, parts[0]);
        }
      });

      setSimulatedValues(nextValues);
    } catch (err) {
      console.error("Recalculation error", err);
    }
  }, [rules, cellDb]);

  const handleInputChange = (key, value) => {
    let parsed = value;
    if (value !== "" && !isNaN(Number(value))) {
      parsed = Number(value);
    }
    setCellDb(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value: parsed,
      }
    }));
  };

  const handleSaveFormula = () => {
    if (!selectedCellKey) return;
    let formula = editedFormula.trim();
    if (formula.startsWith("=")) {
      formula = formula.slice(1);
      setRules(prev => ({ ...prev, [selectedCellKey]: formula }));
      setCellDb(prev => ({
        ...prev,
        [selectedCellKey]: {
          ...prev[selectedCellKey],
          formula,
        }
      }));
    } else {
      setRules(prev => ({ ...prev, [selectedCellKey]: null }));
      let parsed = formula;
      if (formula !== "" && !isNaN(Number(formula))) {
        parsed = Number(formula);
      }
      setCellDb(prev => ({
        ...prev,
        [selectedCellKey]: {
          ...prev[selectedCellKey],
          formula: null,
          value: parsed,
        }
      }));
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleReset = () => {
    const initialDb = {};
    const initialRules = {};
    const initialVals = {};

    INITIAL_MODEL.sheets.forEach(sheet => {
      Object.keys(sheet.cells).forEach(ref => {
        const cell = sheet.cells[ref];
        const key = sheet.name + "!" + ref;
        initialDb[key] = cell;
        initialVals[key] = cell.value;
        if (cell.formula) {
          initialRules[key] = cell.formula;
        }
      });
    });

    setCellDb(initialDb);
    setRules(initialRules);
    setSimulatedValues(initialVals);
    setSelectedCellKey(null);
  };

  const currentSheet = INITIAL_MODEL.sheets.find(s => s.name === activeSheetName) || INITIAL_MODEL.sheets[0];
  if (!currentSheet) return <div>No worksheets loaded</div>;

  const maxRenderRow = Math.min(Math.max(currentSheet.rowCount, 15), 40);
  const maxRenderCol = Math.min(Math.max(currentSheet.colCount, 8), 12);

  const selectedCell = selectedCellKey ? cellDb[selectedCellKey] : null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col antialiased">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-emerald-500 rounded-xl flex items-center justify-center border border-emerald-400/20 shadow-sm text-white">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider text-gray-900 flex items-center gap-1">
                {INITIAL_MODEL.workbookName.replace(/\\.[^/.]+$/, "")} <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 uppercase font-sans">Interactive</span>
              </h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-sans">
                Working Sheet Grid & Business Rules Sandbox
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-100 text-gray-700 hover:text-gray-900 rounded-xl text-xs font-bold border border-gray-200 transition-colors shadow-2xs"
            >
              <RotateCcw className="h-3.5 w-3.5 text-gray-500" /> Reset Sheet
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col md:flex-row gap-6 items-start">
        
        {/* Left Navigation: Worksheets List */}
        <div className="w-full md:w-60 bg-white border border-gray-200 p-5 rounded-3xl shadow-sm space-y-4 shrink-0">
          <div>
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-emerald-500" /> Worksheets
            </h3>
            <p className="text-[9px] text-gray-400 leading-normal mt-0.5">Select sheet to load</p>
          </div>
          
          <div className="space-y-1.5">
            {INITIAL_MODEL.sheets.map(sheet => (
              <button
                key={sheet.name}
                onClick={() => {
                  setActiveSheetName(sheet.name);
                  setSelectedCellKey(null);
                }}
                className={\`flex items-center gap-2.5 w-full p-2.5 rounded-2xl text-xs font-bold transition-all text-left border \${
                  activeSheetName === sheet.name
                    ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-2xs"
                    : "bg-transparent border-transparent text-gray-500 hover:text-gray-800"
                }\`}
              >
                <FileSpreadsheet className="h-4 w-4 shrink-0" />
                <span className="truncate">{sheet.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Section: Spreadsheet Grid */}
        <div className="flex-1 bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col min-w-0">
          <div className="border-b border-gray-200 px-5 py-4 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Sheet Grid: {activeSheetName}
            </h3>
            <span className="text-[10px] text-gray-400 font-bold animate-pulse">
              Click cells to view formula rules and edit inputs
            </span>
          </div>

          <div className="p-5 overflow-auto max-h-[500px]">
            <table className="w-full border-collapse text-left text-xs text-gray-600 font-mono">
              <thead>
                <tr>
                  <th className="p-1.5 bg-gray-50 border border-gray-200 text-center font-sans text-[9px] text-gray-400 font-bold min-w-[40px]">
                    Row
                  </th>
                  {Array.from({ length: maxRenderCol }).map((_, cIdx) => (
                    <th
                      key={cIdx}
                      className="p-1.5 bg-gray-50 border border-gray-200 text-center font-sans text-[9px] text-gray-400 font-bold min-w-[90px]"
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
                        const cellRef = colLabel + rowNum;
                        const cellKey = activeSheetName + "!" + cellRef;
                        const cell = cellDb[cellKey];
                        const formula = rules[cellKey];
                        
                        const isFormulaCell = !!formula;
                        const isInputCell = INITIAL_MODEL.inputs.some(ip => ip.key === cellKey);
                        const hasVal = cell !== undefined && cell.value !== "";

                        let cellStyle = "bg-transparent border-gray-100";
                        if (isFormulaCell) {
                          cellStyle = selectedCellKey === cellKey
                            ? "bg-violet-50 border-2 border-violet-500 text-violet-700 font-bold cursor-pointer"
                            : "bg-violet-50/50 hover:bg-violet-100/40 border border-violet-100 text-violet-600 cursor-pointer";
                        } else if (isInputCell) {
                          cellStyle = selectedCellKey === cellKey
                            ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-700 font-bold cursor-pointer"
                            : "bg-emerald-50/40 hover:bg-emerald-100/40 border border-emerald-100 text-emerald-600 cursor-pointer";
                        } else if (hasVal) {
                          cellStyle = selectedCellKey === cellKey
                            ? "bg-gray-100 border-2 border-gray-400 text-gray-800 cursor-pointer"
                            : "bg-gray-50/60 hover:bg-gray-100 border border-gray-100 text-gray-700 cursor-pointer";
                        } else {
                          cellStyle = "hover:bg-gray-50 border-gray-100/80 cursor-pointer";
                        }

                        const displayVal = simulatedValues[cellKey];

                        return (
                          <td
                            key={cIdx}
                            onClick={() => setSelectedCellKey(cellKey)}
                            className={\`p-2 border truncate max-w-[120px] transition-all text-center select-none sm:p-1.5 \${cellStyle}\`}
                          >
                            {displayVal !== undefined && displayVal !== "" ? (
                              typeof displayVal === "number" ? (
                                displayVal.toLocaleString(undefined, { maximumFractionDigits: 3 })
                              ) : (
                                String(displayVal)
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
        </div>

        {/* Right Section: Logic rule changer */}
        <div className="w-full md:w-85 flex flex-col bg-white border border-gray-200 rounded-3xl p-5 shadow-sm text-sm shrink-0">
          <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
            <GitFork className="h-5 w-5 text-emerald-500" /> Model Rule Changer
          </h3>

          {selectedCellKey ? (
            <div className="space-y-5 flex-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 border border-gray-200 rounded-lg">
                    {selectedCellKey.split("!")[0]}
                  </span>
                  <span className="text-xs font-bold font-mono text-gray-700">
                    {selectedCellKey.split("!")[1]}
                  </span>
                </div>
                <div className="mt-3 flex justify-between items-baseline border-b border-gray-100 pb-3">
                  <span className="text-xs text-gray-400 font-semibold">Simulated Value:</span>
                  <span className="text-md font-bold font-mono text-gray-800">
                    {simulatedValues[selectedCellKey] !== undefined && simulatedValues[selectedCellKey] !== ""
                      ? typeof simulatedValues[selectedCellKey] === "number"
                        ? simulatedValues[selectedCellKey].toLocaleString(undefined, { maximumFractionDigits: 3 })
                        : String(simulatedValues[selectedCellKey])
                      : "0"}
                  </span>
                </div>
              </div>

              {!rules[selectedCellKey] && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Modify Cell Parameter Value
                  </span>
                  <input
                    type="number"
                    value={cellDb[selectedCellKey]?.value !== undefined ? cellDb[selectedCellKey].value : ""}
                    onChange={(e) => handleInputChange(selectedCellKey, e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 focus:border-emerald-500 focus:outline-none text-xs font-mono text-gray-700 rounded-xl"
                  />
                </div>
              )}

              {isRuleModeActive && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                    <span>Spreadsheet Rule Formula</span>
                  </span>
                  
                  <textarea
                    value={editedFormula}
                    onChange={(e) => setEditedFormula(e.target.value)}
                    className="w-full h-20 p-2.5 bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:outline-none text-xs font-mono text-gray-700 rounded-xl leading-relaxed resize-none"
                  />
                  <button
                    onClick={handleSaveFormula}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    {saveSuccess ? "Rule Saved!" : "Update Cell / Rule"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-gray-50/20">
              <Sliders className="h-8 w-8 text-gray-300 mb-3" />
              <p className="text-xs max-w-[180px] leading-relaxed">
                Click on any cell in the sheet grid to modify its parameter values or change its business formulas.
              </p>
            </div>
          )}
        </div>

      </div>

      <footer className="border-t border-gray-200 py-6 bg-white text-center text-xs text-gray-400 font-medium mt-auto">
        <p>© Compiled dynamically by LEX. Runs 100% in-memory.</p>
      </footer>
    </div>
  );
}
`;
  };

  // Compile OOP database-driven Rules Engine app code
  const generateOopReactCode = (): string => {
    return `"use client";

import React, { useState, useEffect } from "react";
import { 
  GitFork, 
  Play, 
  Terminal, 
  Layers, 
  RotateCcw, 
  Check, 
  Edit3,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders,
  Database,
  TrendingUp,
  Plus,
  Trash2
} from "lucide-react";

// Compile extracted OOP Rules
const INITIAL_RULES = ${JSON.stringify(oopRules, null, 2)};
const INITIAL_REQUEST_JSON = ${JSON.stringify(JSON.parse(oopRequestContextString || "{}"), null, 2)};

// Helper function to translate standard OOP database rules into plain English logic statements
const explainOopLogic = (rule) => {
  if (!rule) return "";
  const mode = (rule.mode || "").toUpperCase();
  const field = rule.fieldName || "Result";
  const params = rule.parameters || "";
  const conds = rule.conditions || "";

  let logicDesc = "";

  if (mode.startsWith("MULTIPLY")) {
    const list = params.split(",").map(p => p.trim().replace(/^!/, ""));
    logicDesc = "Multiply [" + list.join(" \u00d7 ") + "] to calculate [" + field + "].";
  } else if (mode.startsWith("ADD")) {
    const list = params.split(",").map(p => p.trim().replace(/^!/, ""));
    logicDesc = "Add [" + list.join(" + ") + "] to calculate [" + field + "].";
  } else if (mode.startsWith("SUBTRACT")) {
    const list = params.split(",").map(p => p.trim().replace(/^!/, ""));
    logicDesc = "Subtract [" + (list[1] || "0") + "] from [" + (list[0] || "0") + "] to calculate [" + field + "].";
  } else if (mode.startsWith("DIVIDE")) {
    const list = params.split(",").map(p => p.trim().replace(/^!/, ""));
    logicDesc = "Divide [" + (list[0] || "0") + "] by [" + (list[1] || "1") + "]" + (list[2] ? " and multiply by [" + list[2] + "]" : "") + " to calculate [" + field + "].";
  } else if (mode.startsWith("ASSIGNFIELD")) {
    logicDesc = "Assign the value of [" + params.replace(/^!/, "") + "] directly to [" + field + "].";
  } else if (mode.startsWith("SETVARIABLE")) {
    logicDesc = "Set the variable [" + field + "] to a constant value of " + params + ".";
  } else if (mode.startsWith("LOOKUPVARIABLE")) {
    const list = params.split(",").map(p => p.trim().replace(/^!/, ""));
    logicDesc = "Look up rating factors for [" + list.join(", ") + "] and assign to [" + field + "].";
  } else if (mode.startsWith("RATEIFPOSITIVE")) {
    logicDesc = "Determine base insurance rate from Policy Form and Protection Class and store in [" + field + "].";
  } else {
    logicDesc = "Set variable [" + field + "] using operation " + rule.mode + " with parameters (" + params + ").";
  }

  if (conds && conds !== "NULL" && conds.trim() !== "") {
    const parts = conds.split(";").map(p => p.trim()).filter(p => p !== "");
    const condList = [];
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
          condList.push("[" + left + "] " + opSym + " \\"" + right + "\\"");
        } else {
          condList.push("[" + part.replace(/^!/, "") + "] is True");
        }
      }
    });
    logicDesc += " (Only executes if: " + condList.join(" ") + ")";
  }

  return logicDesc;
};

// OOP Rating engine runtime helper functions
function evaluateConditionString(condStr, context) {
  if (!condStr || condStr === "NULL" || condStr.trim() === "") return true;
  const parts = condStr.split(";").map(p => p.trim()).filter(p => p !== "");
  const stack = [];

  for (const part of parts) {
    const upperPart = part.toUpperCase();
    if (upperPart === "AND") {
      const b = stack.pop() ?? true;
      const a = stack.pop() ?? true;
      stack.push(a && b);
    } else if (upperPart === "OR") {
      const b = stack.pop() ?? false;
      const a = stack.pop() ?? false;
      stack.push(a || b);
    } else if (upperPart === "NOT") {
      const a = stack.pop() ?? false;
      stack.push(!a);
    } else {
      const compParts = part.split(",");
      if (compParts.length === 3) {
        const leftRef = compParts[0].trim();
        const op = compParts[1].trim();
        const rightRef = compParts[2].trim();

        let leftVal = leftRef.startsWith("!") ? context[leftRef.slice(1)] : context[leftRef];
        if (leftVal === undefined) leftVal = "";

        let rightVal = rightRef;
        if (rightRef.startsWith("&")) {
          rightVal = context[rightRef.slice(1)];
        } else if (rightRef.startsWith("'") && rightRef.endsWith("'")) {
          rightVal = rightRef.slice(1, -1);
        } else if (!isNaN(Number(rightRef))) {
          rightVal = Number(rightRef);
        }

        if (typeof leftVal === "number" && typeof rightVal === "string" && !isNaN(Number(rightVal))) {
          rightVal = Number(rightVal);
        }

        let res = false;
        if (op === "=" || op === "==") {
          res = String(leftVal) === String(rightVal) || leftVal === rightVal;
        } else if (op === "<>") {
          res = String(leftVal) !== String(rightVal) && leftVal !== rightVal;
        } else if (op === "<") {
          res = Number(leftVal) < Number(rightVal);
        } else if (op === ">") {
          res = Number(leftVal) > Number(rightVal);
        } else if (op === "<=") {
          res = Number(leftVal) <= Number(rightVal);
        } else if (op === ">=") {
          res = Number(leftVal) >= Number(rightVal);
        }
        stack.push(res);
      } else {
        const val = part.startsWith("!") ? context[part.slice(1)] : context[part];
        stack.push(!!val && val !== "N" && val !== "0" && val !== "FALSE");
      }
    }
  }
  return stack.pop() ?? true;
}

function resolveValue(ref, context) {
  if (!ref) return 0;
  const cleanRef = ref.trim();
  if (cleanRef.startsWith("!")) return context[cleanRef.slice(1)] ?? 0;
  if (!isNaN(Number(cleanRef))) return Number(cleanRef);
  return context[cleanRef] ?? 0;
}

// Rule Engine Runner
class OopRulesEngine {
  constructor(rules) {
    this.rules = [...rules].sort((a, b) => a.order - b.order);
  }

  run(requestContext) {
    const context = {
      ...requestContext,
      PolicyYear: new Date().getFullYear(),
      EffDate: requestContext.EffectiveDate || "06/17/2019"
    };

    const trace = [];

    this.rules.forEach(rule => {
      const isMet = evaluateConditionString(rule.conditions, context);
      let actionLog = "Condition not met, skipped";

      if (isMet) {
        const mode = (rule.mode || "").toUpperCase();
        const target = rule.fieldName;
        
        if (mode.startsWith("MULTIPLY")) {
          const params = rule.parameters.split(",").map(p => p.trim()).filter(p => p !== "");
          let res = 1;
          params.forEach(p => { res *= Number(resolveValue(p, context)) || 0; });
          context[target] = res;
          actionLog = "Multiplied [" + params.join(" * ") + "] to yield " + res;
        } else if (mode.startsWith("ADD")) {
          const params = rule.parameters.split(",").map(p => p.trim()).filter(p => p !== "");
          let res = 0;
          params.forEach(p => { res += Number(resolveValue(p, context)) || 0; });
          context[target] = res;
          actionLog = "Added [" + params.join(" + ") + "] to yield " + res;
        } else if (mode.startsWith("SUBTRACT")) {
          const params = rule.parameters.split(",").map(p => p.trim());
          const left = Number(resolveValue(params[0], context)) || 0;
          const right = Number(resolveValue(params[1], context)) || 0;
          const res = left - right;
          context[target] = res;
          actionLog = "Subtracted (" + left + " - " + right + ") to yield " + res;
        } else if (mode.startsWith("DIVIDE")) {
          const params = rule.parameters.split(",").map(p => p.trim());
          const num = Number(resolveValue(params[0], context)) || 0;
          const den = Number(resolveValue(params[1], context)) || 1;
          const base = params[2] ? Number(resolveValue(params[2], context)) : 1;
          const res = (den !== 0 ? num / den : 0) * base;
          context[target] = res;
          actionLog = "Divided (" + num + " / " + den + ") * " + base + " to yield " + res;
        } else if (mode.startsWith("ASSIGNFIELD")) {
          const val = resolveValue(rule.parameters, context);
          context[target] = val;
          actionLog = "Assigned parameter " + rule.parameters + " (" + val + ")";
        } else if (mode.startsWith("SETVARIABLE")) {
          let val = rule.parameters.trim();
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
          else if (!isNaN(Number(val))) val = Number(val);
          context[target] = val;
          actionLog = "Set variable to static: " + val;
        } else if (mode.startsWith("LOOKUPVARIABLE")) {
          let factor = 1.0;
          if (target === "TierFactor") {
            const tier = context["RatingTier"] || "1";
            factor = tier === "1" ? 0.90 : tier === "2" ? 1.00 : 1.15;
          } else if (target === "AgeSurchargeFactor") {
            const ageGroup = Number(context["DwellingAgeGroup"]) || 0;
            factor = ageGroup === 0 ? 0.85 : ageGroup === 1 ? 1.00 : 1.25;
          } else if (target === "OccupancyFactor") {
            const occ = context["Occupancy"] || "O";
            factor = occ === "O" ? 1.00 : 1.20;
          } else if (target === "TaxRate") {
            factor = 0.04;
          } else {
            factor = 1.05;
          }
          context[target] = factor;
          actionLog = "Looked up rating factor: " + factor;
        } else if (mode.startsWith("RATEIFPOSITIVE")) {
          const form = context["PolicyForm"] || "DP-1";
          const pc = Number(context["ProtectionClass"]) || 5;
          let rate = 350;
          if (form === "DP-3") rate = 480;
          if (pc > 6) rate += 120;
          context[target] = rate;
          actionLog = "Looked up Base Premium rate: $" + rate;
        } else {
          let val = rule.parameters.trim();
          context[target] = val;
          actionLog = "Set parameter: " + val;
        }
      }

      trace.push({
        order: rule.order,
        id: rule.id,
        desc: rule.description,
        met: isMet,
        action: actionLog
      });
    });

    return { finalContext: context, trace };
  }
}

export default function StandaloneModelApp() {
  const [activeTab, setActiveTab] = useState("simulator");
  const [oopRules, setOopRules] = useState(INITIAL_RULES);
  const [requestText, setRequestText] = useState(JSON.stringify(INITIAL_REQUEST_JSON, null, 2));
  
  const [oopTrace, setOopTrace] = useState([]);
  const [oopFinalContext, setOopFinalContext] = useState({});
  const [selectedRuleId, setSelectedRuleId] = useState(null);
  
  // Editor values
  const [editedDesc, setEditedDesc] = useState("");
  const [editedMode, setEditedMode] = useState("");
  const [editedParams, setEditedParams] = useState("");
  const [editedConds, setEditedConds] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Sweep states
  const [sweepDimension, setSweepDimension] = useState("ProtectionClass");
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const runSimulation = (currentRules, currentRequestJson) => {
    try {
      const engine = new OopRulesEngine(currentRules);
      const { finalContext, trace } = engine.run(currentRequestJson);
      setOopTrace(trace);
      setOopFinalContext(finalContext);
      setErrorMsg("");
    } catch (e) {
      setErrorMsg("Failed to run rating engine: " + e.message);
    }
  };

  // Run on mount
  useEffect(() => {
    runSimulation(oopRules, INITIAL_REQUEST_JSON);
  }, []);

  const handleRun = () => {
    try {
      const parsed = JSON.parse(requestText);
      runSimulation(oopRules, parsed);
    } catch (e) {
      setErrorMsg("Invalid JSON Request format: " + e.message);
    }
  };

  const handleSelectRule = (rule) => {
    setSelectedRuleId(rule.id);
    setEditedDesc(rule.description);
    setEditedMode(rule.mode);
    setEditedParams(rule.parameters);
    setEditedConds(rule.conditions);
  };

  const handleSaveRule = () => {
    const nextRules = oopRules.map(r => {
      if (r.id === selectedRuleId) {
        return {
          ...r,
          description: editedDesc,
          mode: editedMode,
          parameters: editedParams,
          conditions: editedConds
        };
      }
      return r;
    });
    setOopRules(nextRules);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    
    // Re-run simulation
    try {
      runSimulation(nextRules, JSON.parse(requestText));
    } catch (e) {}
  };

  const handleAddNewRule = () => {
    const newId = String(Math.floor(Math.random() * 90000) + 10000);
    const newRule = {
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
    const nextRules = [...oopRules, newRule].sort((a, b) => a.order - b.order);
    setOopRules(nextRules);
    handleSelectRule(newRule);
    try {
      runSimulation(nextRules, JSON.parse(requestText));
    } catch (e) {}
  };

  const handleDeleteRule = () => {
    if (!selectedRuleId) return;
    const nextRules = oopRules.filter(r => r.id !== selectedRuleId);
    setOopRules(nextRules);
    setSelectedRuleId(null);
    try {
      runSimulation(nextRules, JSON.parse(requestText));
    } catch (e) {}
  };

  // Generate sensitivity sweep points
  const getSweepPoints = () => {
    try {
      const parsedReq = JSON.parse(requestText);
      const engine = new OopRulesEngine(oopRules);
      const points = [];

      if (sweepDimension === "ProtectionClass") {
        for (let pc = 1; pc <= 10; pc++) {
          const tempReq = { ...parsedReq, ProtectionClass: String(pc) };
          const { finalContext } = engine.run(tempReq);
          const premium = finalContext["BasicPremium"] ?? finalContext["BaseRate"] ?? 0;
          points.push({ x: pc, y: Number(premium) || 0 });
        }
      } else if (sweepDimension === "Deductible") {
        const deductibles = [250, 500, 1000, 2500, 5000];
        deductibles.forEach((ded) => {
          const tempReq = { ...parsedReq, Deductible: String(ded) };
          const { finalContext } = engine.run(tempReq);
          const premium = finalContext["BasicPremium"] ?? finalContext["BaseRate"] ?? 0;
          points.push({ x: ded, y: Number(premium) || 0 });
        });
      } else {
        const coverages = [50000, 100000, 150000, 200000, 250000, 300000, 400000, 500000];
        coverages.forEach((cov) => {
          const tempReq = { ...parsedReq, COVERAGEA: "$" + cov.toLocaleString() };
          const { finalContext } = engine.run(tempReq);
          const premium = finalContext["BasicPremium"] ?? finalContext["BaseRate"] ?? 0;
          points.push({ x: cov, y: Number(premium) || 0 });
        });
      }
      return points;
    } catch (e) {
      return [];
    }
  };

  const sweepPoints = getSweepPoints();

  // SVG Chart Layout Math
  const svgWidth = 500;
  const svgHeight = 220;
  const padding = 45;
  const plotWidth = svgWidth - 2 * padding;
  const plotHeight = svgHeight - 2 * padding;

  const xValues = sweepPoints.map(p => p.x);
  const yValues = sweepPoints.map(p => p.y);
  
  const xMin = sweepPoints.length > 0 ? Math.min(...xValues) : 0;
  const xMax = sweepPoints.length > 0 ? Math.max(...xValues) : 10;
  const yMin = Math.max(0, sweepPoints.length > 0 ? Math.min(...yValues) * 0.9 : 0);
  const yMax = sweepPoints.length > 0 ? Math.max(...yValues) * 1.1 : 100;

  const getSvgCoords = (x, y) => {
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;
    const svgX = padding + ((x - xMin) / xRange) * plotWidth;
    const svgY = padding + plotHeight - ((y - yMin) / yRange) * plotHeight;
    return { x: svgX, y: svgY };
  };

  // Build SVG path
  let pathD = "";
  let areaD = "";
  if (sweepPoints.length > 0) {
    const startCoord = getSvgCoords(sweepPoints[0].x, sweepPoints[0].y);
    pathD = "M " + startCoord.x + " " + startCoord.y;
    areaD = "M " + startCoord.x + " " + (padding + plotHeight) + " L " + startCoord.x + " " + startCoord.y;

    for (let i = 1; i < sweepPoints.length; i++) {
      const coord = getSvgCoords(sweepPoints[i].x, sweepPoints[i].y);
      pathD += " L " + coord.x + " " + coord.y;
      areaD += " L " + coord.x + " " + coord.y;
    }

    const endCoord = getSvgCoords(sweepPoints[sweepPoints.length - 1].x, sweepPoints[sweepPoints.length - 1].y);
    areaD += " L " + endCoord.x + " " + (padding + plotHeight) + " Z";
  }

  // Identify computed outcomes
  const originalKeys = Object.keys(INITIAL_REQUEST_JSON);
  const calculatedVars = Object.keys(oopFinalContext)
    .filter(k => !originalKeys.includes(k) && k !== "PolicyYear" && k !== "EffDate")
    .map(key => ({ key, value: oopFinalContext[key] }));

  const selectedRule = oopRules.find(r => r.id === selectedRuleId);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col antialiased">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
              <GitFork className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider text-gray-900">
                OOP Rules Rating Engine <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 uppercase">Standalone</span>
              </h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-sans">
                Interactive Transaction Runner & Business Logic
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col md:flex-row gap-6 items-start">
        
        {/* Left Navigation Workspace */}
        <div className="w-full md:w-60 bg-white border border-gray-200 p-5 rounded-3xl shadow-sm space-y-4 shrink-0 font-sans">
          <div>
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
              Rating Workspace
            </h3>
            <p className="text-[9px] text-gray-400 mt-0.5">Toggle workspaces</p>
          </div>
          
          <div className="space-y-1.5">
            <button
              onClick={() => setActiveTab("simulator")}
              className={\`flex items-center gap-2.5 w-full p-2.5 rounded-2xl text-xs font-bold transition-all text-left border \${
                activeTab === "simulator"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-2xs"
                  : "bg-transparent border-transparent text-gray-500 hover:text-gray-800"
              }\`}
            >
              <Terminal className="h-4 w-4" /> Transaction Runner
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={\`flex items-center gap-2.5 w-full p-2.5 rounded-2xl text-xs font-bold transition-all text-left border \${
                activeTab === "rules"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-2xs"
                  : "bg-transparent border-transparent text-gray-500 hover:text-gray-800"
              }\`}
            >
              <GitFork className="h-4 w-4" /> Rule Configurations
            </button>
            <button
              onClick={() => setActiveTab("graph")}
              className={\`flex items-center gap-2.5 w-full p-2.5 rounded-2xl text-xs font-bold transition-all text-left border \${
                activeTab === "graph"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-2xs"
                  : "bg-transparent border-transparent text-gray-500 hover:text-gray-800"
              }\`}
            >
              <TrendingUp className="h-4 w-4" /> Graph Analytics
            </button>
          </div>
        </div>

        {/* Tab Dispatcher */}
        <div className="flex-1 w-full min-w-0">
          
          {/* SIMULATOR TAB */}
          {activeTab === "simulator" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* JSON Request Editor */}
                <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    Request Editor
                  </h4>
                  <textarea
                    value={requestText}
                    onChange={(e) => setRequestText(e.target.value)}
                    className="w-full h-[380px] p-3.5 bg-gray-900 text-emerald-400 font-mono text-xs rounded-2xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    onClick={handleRun}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    Run Simulation
                  </button>
                  {errorMsg && <p className="text-[10px] text-red-500 font-bold">{errorMsg}</p>}
                </div>

                {/* Rating steps list */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                  <div className="border-b border-gray-200 px-5 py-4 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                      OOP Steps Trace
                    </h3>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-sans">
                      {oopTrace.length} Steps Executed
                    </span>
                  </div>

                  <div className="p-5 overflow-y-auto max-h-[440px] space-y-3">
                    {oopTrace.map((step, idx) => (
                      <div
                        key={idx}
                        className={\`p-3.5 border rounded-2xl flex items-start justify-between gap-4 transition-all \${
                          step.met ? "bg-emerald-50/20 border-emerald-100" : "bg-gray-50/40 border-gray-100 opacity-60"
                        }\`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.2 rounded border border-gray-200 font-mono">
                              Order {step.order}
                            </span>
                            <span className="text-[10px] font-extrabold text-gray-700 font-mono">ID {step.id}</span>
                          </div>
                          <p className="text-xs font-bold text-gray-800 mt-1 font-sans">{step.desc}</p>
                          <p className="text-[10px] text-emerald-600 font-mono mt-0.5">{step.action}</p>
                        </div>
                        <div className="shrink-0 mt-0.5">
                          {step.met ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> MET</span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400"><XCircle className="h-4 w-4" /> SKIPPED</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Outcomes list */}
              <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                  <HelpCircle className="h-5 w-5 text-emerald-500" /> Output Variables
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {calculatedVars.map(v => (
                    <div key={v.key} className="p-3 bg-gray-50 border border-gray-100 rounded-2xl">
                      <span className="text-[10px] font-bold font-mono text-gray-500 block truncate">{v.key}</span>
                      <span className="text-sm font-extrabold font-mono text-emerald-600 block mt-1">
                        {typeof v.value === "number" ? v.value.toLocaleString(undefined, { maximumFractionDigits: 3 }) : String(v.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RULES CONFIGURATION TAB */}
          {activeTab === "rules" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              
              <div className="lg:col-span-3 bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                <div className="border-b border-gray-200 px-5 py-4 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    OOP Rule Logic Table
                  </h3>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={handleAddNewRule}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold transition-all"
                    >
                      <Plus className="h-3 w-3 inline mr-1" /> Add Rule
                    </button>
                    {selectedRuleId && (
                      <button
                        onClick={handleDeleteRule}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg text-[10px] font-bold transition-all"
                      >
                        <Trash2 className="h-3 w-3 inline mr-1" /> Delete
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[460px] p-5">
                  <table className="w-full border-collapse text-xs text-gray-600 font-mono">
                    <thead>
                      <tr className="border-b border-gray-200 pb-2 text-left">
                        <th className="p-2.5 font-sans font-extrabold text-gray-400 uppercase text-[10px] tracking-wider">Order</th>
                        <th className="p-2.5 font-sans font-extrabold text-gray-400 uppercase text-[10px] tracking-wider">FieldName</th>
                        <th className="p-2.5 font-sans font-extrabold text-gray-400 uppercase text-[10px] tracking-wider">Mode</th>
                        <th className="p-2.5 font-sans font-extrabold text-gray-400 uppercase text-[10px] tracking-wider">Parameters</th>
                        <th className="p-2.5 font-sans font-extrabold text-gray-400 uppercase text-[10px] tracking-wider">OOP Logic (Understanding)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oopRules.map((rule) => (
                        <tr
                          key={rule.id}
                          onClick={() => handleSelectRule(rule)}
                          className={\`border-b border-gray-100 hover:bg-gray-50 cursor-pointer \${
                            selectedRuleId === rule.id ? "bg-emerald-50/30 text-emerald-900" : ""
                          }\`}
                        >
                          <td className="p-2.5 font-sans">{rule.order}</td>
                          <td className="p-2.5 font-bold">{rule.fieldName}</td>
                          <td className="p-2.5 text-violet-600">{rule.mode}</td>
                          <td className="p-2.5 text-gray-500 truncate max-w-[120px]">{rule.parameters}</td>
                          <td className="p-2.5 text-gray-500 font-sans italic truncate max-w-[280px]" title={explainOopLogic(rule)}>{explainOopLogic(rule)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sidebar Logic Editor */}
              <div className="w-full bg-white border border-gray-200 rounded-3xl p-5 shadow-sm text-sm shrink-0">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                  Rule Logic Editor
                </h3>

                {selectedRule ? (
                  <div className="space-y-4">
                    {/* Rules Agent Understanding Card */}
                    <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl space-y-2 mb-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 flex items-center gap-1 font-sans">
                        <HelpCircle className="h-3 w-3 inline" /> Rules Agent Understanding
                      </span>
                      <p className="text-xs text-gray-700 font-sans leading-relaxed font-medium">
                        {explainOopLogic(selectedRule)}
                      </p>
                    </div>

                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 border border-gray-200 rounded-lg">
                        Order {selectedRule.order}
                      </span>
                      <h4 className="text-xs font-bold text-gray-800 mt-2 font-sans">
                        {selectedRule.fieldName} (ID {selectedRule.id})
                      </h4>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Description</span>
                      <textarea
                        value={editedDesc}
                        onChange={(e) => setEditedDesc(e.target.value)}
                        className="w-full h-14 p-2 bg-gray-50 border border-gray-200 text-xs rounded-xl resize-none focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Mode</span>
                      <input
                        type="text"
                        value={editedMode}
                        onChange={(e) => setEditedMode(e.target.value)}
                        className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 text-xs text-violet-600 font-mono rounded-xl focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Parameters</span>
                      <input
                        type="text"
                        value={editedParams}
                        onChange={(e) => setEditedParams(e.target.value)}
                        className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 text-xs font-mono rounded-xl focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Conditions</span>
                      <textarea
                        value={editedConds}
                        onChange={(e) => setEditedConds(e.target.value)}
                        className="w-full h-14 p-2 bg-gray-50 border border-gray-200 text-xs text-amber-600 font-mono rounded-xl resize-none focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handleSaveRule}
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      {saveSuccess ? "Logic Rule Saved!" : "Save Rule logic"}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-gray-50/20">
                    <Sliders className="h-8 w-8 text-gray-300 mb-3" />
                    <p className="text-xs max-w-[180px] leading-relaxed">
                      Click any row in the logic table to edit rating step configurations.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* GRAPH TAB */}
          {activeTab === "graph" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white border border-gray-200 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" /> Graph Analytics Agent
                  </h3>
                  <p className="text-[10px] text-gray-400 leading-normal">
                    Interactive SVG sensitivity graph curves and business premium outcomes.
                  </p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={sweepDimension}
                    onChange={(e) => setSweepDimension(e.target.value)}
                    className="px-3.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-3xs"
                  >
                    <option value="ProtectionClass">Sweep: Protection Class</option>
                    <option value="Deductible">Sweep: Deductibles</option>
                    <option value="CoverageA">Sweep: Coverage A Limit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* SVG Graph rendering */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                      Pricing curve: {sweepDimension} vs Outcome Premium
                    </span>
                  </div>

                  <div className="relative flex justify-center">
                    {sweepPoints.length > 0 ? (
                      <svg width={svgWidth} height={svgHeight} viewBox={\`0 0 \${svgWidth} \${svgHeight}\`} className="w-full h-auto overflow-visible">
                        <defs>
                          <linearGradient id="sweepGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Grid Lines */}
                        {Array.from({ length: 5 }).map((_, idx) => {
                          const yVal = yMin + (idx / 4) * (yMax - yMin);
                          const coord = getSvgCoords(xMin, yVal);
                          return (
                            <g key={idx}>
                              <line x1={padding} y1={coord.y} x2={padding + plotWidth} y2={coord.y} stroke="#f3f4f6" strokeWidth="1" />
                              <text x={padding - 10} y={coord.y + 3} textAnchor="end" className="text-[8px] fill-gray-400 font-bold">\${Math.round(yVal)}</text>
                            </g>
                          );
                        })}

                        {/* X Labels */}
                        {sweepPoints.map((p, idx) => {
                          const coord = getSvgCoords(p.x, yMin);
                          const shouldLabel = sweepPoints.length < 12 || idx % 2 === 0;
                          return shouldLabel && (
                            <g key={idx}>
                              <line x1={coord.x} y1={padding + plotHeight} x2={coord.x} y2={padding + plotHeight + 4} stroke="#d1d5db" />
                              <text x={coord.x} y={padding + plotHeight + 14} textAnchor="middle" className="text-[8px] fill-gray-400 font-bold">
                                {sweepDimension === "CoverageA" ? \`\${(p.x / 1000)}k\` : p.x}
                              </text>
                            </g>
                          );
                        })}

                        <path d={areaD} fill="url(#sweepGrad)" />
                        <path d={pathD} fill="none" stroke="#10b981" strokeWidth="3" />

                        {/* Points */}
                        {sweepPoints.map((p, idx) => {
                          const coord = getSvgCoords(p.x, p.y);
                          const isHovered = hoveredPoint?.x === p.x;
                          return (
                            <circle
                              key={idx}
                              cx={coord.x}
                              cy={coord.y}
                              r={isHovered ? 7 : 4.5}
                              fill={isHovered ? "#059669" : "#10b981"}
                              stroke="#ffffff"
                              strokeWidth="2"
                              onMouseEnter={() => setHoveredPoint(p)}
                              onMouseLeave={() => setHoveredPoint(null)}
                              className="cursor-pointer transition-all"
                            />
                          );
                        })}

                        {hoveredPoint && (
                          <g>
                            <rect x={getSvgCoords(hoveredPoint.x, hoveredPoint.y).x - 55} y={getSvgCoords(hoveredPoint.x, hoveredPoint.y).y - 32} width="110" height="22" rx="6" fill="#1f2937" />
                            <text x={getSvgCoords(hoveredPoint.x, hoveredPoint.y).x} y={getSvgCoords(hoveredPoint.x, hoveredPoint.y).y - 18} textAnchor="middle" fill="#ffffff" className="font-mono text-[9px] font-bold">
                              \${Math.round(hoveredPoint.y)}
                            </text>
                          </g>
                        )}
                      </svg>
                    ) : (
                      <p className="text-xs text-gray-400 py-16">No sweep data.</p>
                    )}
                  </div>
                </div>

                {/* Stat summary */}
                <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-3">Report Details</h4>
                  <div className="space-y-3 text-xs text-gray-600">
                    <div className="flex justify-between"><span>Minimum Price</span><span className="font-bold">\${yValues.length > 0 ? Math.round(Math.min(...yValues)) : 0}</span></div>
                    <div className="flex justify-between"><span>Maximum Price</span><span className="font-bold">\${yValues.length > 0 ? Math.round(Math.max(...yValues)) : 0}</span></div>
                    <div className="flex justify-between"><span>Average Price</span><span className="font-bold">\${yValues.length > 0 ? Math.round(yValues.reduce((a,b)=>a+b,0)/yValues.length) : 0}</span></div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

      <footer className="border-t border-gray-200 py-6 bg-white text-center text-xs text-gray-400 font-medium mt-auto">
        <p>© Standalone Rating Rules App generated by LEX. Runs 100% in-memory.</p>
      </footer>
    </div>
  );
}
`;
  };

  const handleCopyCode = () => {
    const code = isOopModel ? generateOopReactCode() : generateStandardReactCode();
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Internal ZIP generator preserved for code packaging, but it is not wired to any visible download button.
  // Visible UI actions send email requests only.
  const handleDownloadAppBundle = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // 1. Write the appropriate App.tsx code
      const reactCode = isOopModel ? generateOopReactCode() : generateStandardReactCode();
      zip.file("src/App.tsx", reactCode);

      // 2. Write project build dependencies
      const packageJson = {
        name: "lex-spreadsheet-app",
        version: "1.0.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
        },
        dependencies: {
          next: "^14.1.0",
          react: "^18.2.0",
          "react-dom": "^18.2.0",
          "lucide-react": "^0.344.0",
        },
        devDependencies: {
          typescript: "^5.3.3",
          "@types/node": "^20.11.24",
          "@types/react": "^18.2.61",
          "@types/react-dom": "^18.2.19",
          tailwindcss: "^3.4.1",
          postcss: "^8.4.35",
          autoprefixer: "^10.4.18",
        },
      };
      zip.file("package.json", JSON.stringify(packageJson, null, 2));

      // 3. Tailwind config files
      const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
      zip.file("tailwind.config.js", tailwindConfig);

      const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
      zip.file("postcss.config.js", postcssConfig);

      // 4. tsconfig file
      const tsconfigJson = {
        compilerOptions: {
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
        },
        include: ["src/**/*"],
      };
      zip.file("tsconfig.json", JSON.stringify(tsconfigJson, null, 2));

      // 5. README instructions file
      const generateReadme = (): string => {
        return `# Dynamic Spreadsheet Web Application

This project was automatically compiled from the spreadsheet **${fileName}** using the **LEX Web Application Agent**.

It represents your spreadsheet as an interactive web form grid and embeds a "Rule Changer Configuration" panel so users can modify formula rules directly online.

## Getting Started

1. Unzip this package to a directory on your machine.
2. Open your terminal in the unzipped folder.
3. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
4. Run the development server locally:
   \`\`\`bash
   npm run dev
   \`\`\`
5. Open your browser and navigate to **http://localhost:3000** to see your interactive spreadsheet form.

## Deployment Online

### Vercel (Recommended)
1. Install Vercel CLI: \`npm install -g vercel\`
2. Run \`vercel\` in the project root directory.
3. Follow the CLI prompts to launch online in seconds.

### Netlify
1. Install Netlify CLI: \`npm install -g netlify-cli\`
2. Run \`netlify deploy --prod\` and follow the CLI prompts.
`;
      };
      zip.file("README.md", generateReadme());

      // 6. Root configurations page.tsx, layout.tsx, globals.css
      const layoutCode = `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Spreadsheet Web App",
  description: "Compiled Excel Formula Simulator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}`;
      zip.file("src/app/layout.tsx", layoutCode);

      const pageCode = `import StandaloneModelApp from "../App";
export default function Page() {
  return <StandaloneModelApp />;
}`;
      zip.file("src/app/page.tsx", pageCode);

      const cssCode = `@tailwind base;
@tailwind components;
@tailwind utilities;
body { background: #f9fafb; }`;
      zip.file("src/app/globals.css", cssCode);

      // 7. Compile ZIP. This helper is kept internally only; no visible UI path currently triggers a browser download.
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(/\.[^/.]+$/, "")}_web_application.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <button
          onClick={() => setShowRegisterModal(true)}
          disabled={isSendingEmail}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-sm font-bold transition-all shadow-lg disabled:opacity-50"
        >
          <Mail className="h-4 w-4" /> {isSendingEmail ? "Sending request..." : "Send Email Request"}
        </button>
      </div>

      {/* Header Info */}
      <div className="p-5 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Globe className="h-5 w-5 text-emerald-500" /> Web Application Agent
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {isOopModel 
                ? "Request a compiled build for the OOP Rating Rules engine rather than sharing raw source code."
                : "Request a compiled build for the workbook web application rather than sharing raw source code."}
            </p>
          </div>
          <button
            onClick={() => setActiveSubTab("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "preview"
                ? "bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-2xs"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Eye className="h-3.5 w-3.5" /> Standalone Preview
          </button>
      </div>

      {/* Subtab Contents */}
      <div className="min-h-[300px]">
        {/* 1. STANDALONE PREVIEW */}
        {activeSubTab === "preview" && (
          <div className="bg-gray-100/40 border border-gray-200 rounded-3xl p-5 shadow-inner">
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">
              <span>App Sandbox Simulator ({isOopModel ? "OOP Preview" : "Grid Preview"} Mode)</span>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            </div>
            
            {isOopModel ? (
              <OopRequestSimulator />
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-5 space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">{fileName.replace(/\.[^/.]+$/, "")} Web App Mockup</h4>
                    <p className="text-[9px] text-gray-400 leading-normal mt-0.5">
                      Double-click input cells (green) to edit values, and formula cells (purple) to edit rules.
                    </p>
                  </div>
                  <button
                    onClick={resetSimulation}
                    className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3 text-gray-400" /> Reset Preview
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-5 items-start">
                  
                  {/* Worksheets list */}
                  <div className="w-full md:w-44 border border-gray-200 p-3 rounded-2xl bg-gray-50 space-y-1.5 shrink-0">
                    <span className="font-extrabold text-gray-400 text-[9px] uppercase tracking-wider block mb-1">
                      Sheets List
                    </span>
                    {sheets.map((s) => (
                      <button
                        key={s.name}
                        onClick={() => {
                          setActivePreviewSheet(s.name);
                          setSelectedPreviewCellKey(null);
                        }}
                        className={`flex items-center gap-1.5 w-full p-2 rounded-xl text-[11px] font-bold transition-all text-left border ${
                          activePreviewSheet === s.name
                            ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-3xs"
                            : "bg-transparent border-transparent text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{s.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Sheet Grid */}
                  <div className="flex-1 border border-gray-200 rounded-2xl overflow-hidden min-w-0 bg-white">
                    <div className="border-b border-gray-200 px-4 py-2.5 bg-gray-50/50 flex justify-between items-center text-[10px]">
                      <span className="font-extrabold text-gray-400 uppercase tracking-wider">
                        Grid View: {activePreviewSheet}
                      </span>
                      <span className="font-bold text-emerald-600">Recalculates In-Memory</span>
                    </div>

                    <div className="p-3 overflow-auto max-h-[350px]">
                      <table className="w-full border-collapse text-left text-xs text-gray-600 font-mono">
                        <thead>
                          <tr>
                            <th className="p-1 bg-gray-50 border border-gray-200 text-center font-sans text-[9px] text-gray-400 font-bold min-w-[30px]">
                              Row
                            </th>
                            {Array.from({ length: maxRenderCol }).map((_, cIdx) => (
                              <th
                                key={cIdx}
                                className="p-1 bg-gray-50 border border-gray-200 text-center font-sans text-[9px] text-gray-400 font-bold min-w-[70px]"
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
                                <td className="p-1 bg-gray-50 border border-gray-100 text-center font-sans text-[9px] text-gray-400 font-semibold">
                                  {rowNum}
                                </td>
                                {Array.from({ length: maxRenderCol }).map((_, cIdx) => {
                                  const colLabel = colNumToLabel(cIdx + 1);
                                  const cellRef = colLabel + rowNum;
                                  const cellKey = activePreviewSheet + "!" + cellRef;
                                  const cell = cellDb[cellKey];
                                  const cellType = getCellType(cellRef);
                                  const simVal = simulatedValues[cellKey];

                                  let cellStyle = "bg-transparent border-gray-100";

                                  if (cellType === "formula") {
                                    cellStyle = selectedPreviewCellKey === cellKey
                                      ? "bg-violet-50 border-2 border-violet-500 text-violet-700 font-bold cursor-pointer"
                                      : "bg-violet-50/50 hover:bg-violet-100/40 border border-violet-100 text-violet-600 cursor-pointer";
                                  } else if (cellType === "input") {
                                    cellStyle = selectedPreviewCellKey === cellKey
                                      ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-700 font-bold cursor-pointer"
                                      : "bg-emerald-50/40 hover:bg-emerald-100/40 border border-emerald-100 text-emerald-600 cursor-pointer";
                                  } else if (cellType === "static") {
                                    cellStyle = selectedPreviewCellKey === cellKey
                                      ? "bg-gray-100 border-2 border-gray-400 text-gray-800 cursor-pointer"
                                      : "bg-gray-50/60 hover:bg-gray-100 border border-gray-100 text-gray-700 cursor-pointer";
                                  } else {
                                    cellStyle = "hover:bg-gray-50 border-gray-100/80 cursor-pointer";
                                  }

                                  return (
                                    <td
                                      key={cIdx}
                                      onClick={() => handleCellClick(cellRef)}
                                      className={`p-1.5 border truncate max-w-[100px] text-center select-none text-[10px] ${cellStyle}`}
                                    >
                                      {simVal !== undefined && simVal !== "" ? (
                                        typeof simVal === "number" ? (
                                          simVal.toLocaleString(undefined, { maximumFractionDigits: 3 })
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
                  </div>

                  {/* Sidebar edit inspect */}
                  <div className="w-full md:w-56 border border-gray-200 rounded-2xl p-4 bg-white space-y-4 shrink-0 text-[11px]">
                    <span className="font-extrabold text-gray-400 text-[9px] uppercase tracking-wider block border-b border-gray-100 pb-1">
                      Cell Inspector
                    </span>
                    
                    {selectedPreviewCellKey ? (
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold font-mono text-gray-500">{selectedPreviewCellKey.split("!")[1]}</span>
                            <span className="font-bold text-emerald-500">
                              {simulatedValues[selectedPreviewCellKey] !== undefined
                                ? typeof simulatedValues[selectedPreviewCellKey] === "number"
                                  ? simulatedValues[selectedPreviewCellKey].toLocaleString()
                                  : String(simulatedValues[selectedPreviewCellKey])
                                : "0"}
                            </span>
                          </div>
                        </div>

                        {inputs.includes(selectedPreviewCellKey) ? (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Edit Input Value</span>
                            <input
                              type="number"
                              value={simulatedValues[selectedPreviewCellKey] !== undefined ? simulatedValues[selectedPreviewCellKey] : ""}
                              onChange={(e) => updateInputValue(selectedPreviewCellKey, e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-gray-200 text-xs font-mono rounded"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Spreadsheet Formula Rule</span>
                            <textarea
                              value={editedPreviewFormula}
                              onChange={(e) => setEditedPreviewFormula(e.target.value)}
                              className="w-full h-14 p-1.5 bg-gray-50 border border-gray-200 text-[10px] font-mono rounded resize-none focus:outline-none"
                            />
                            <button
                              onClick={handleSaveFormula}
                              className="w-full py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-bold shadow-3xs"
                            >
                              {saveSuccess ? "Updated!" : "Update Rule"}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-[10px] leading-relaxed py-8 text-center border border-dashed border-gray-100 rounded-xl">
                        Click any cell in the grid to view rules or change parameters.
                      </p>
                    )}
                  </div>

                </div>

                <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-medium">
                  <span>The sandbox above is live. Click <strong>Send Email Request</strong> to request a compiled build by email.</span>
                  <ArrowRight className="h-4 w-4 text-emerald-500 animate-pulse" />
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {/* REQUEST DETAILS MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="border-b border-gray-100 pb-3 flex items-center gap-2.5">
              <div className="h-9 w-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Globe className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                  Build Request Details
                </h3>
                <p className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">
                  Enter your details to request a compiled build link for the deployable app.
                </p>
              </div>
            </div>

            {regFormError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-bold text-rose-600">
                {regFormError}
              </div>
            )}

            <div className="space-y-3.5 text-xs text-gray-700">
              {/* Company Name */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Company Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corporation"
                  value={regCompanyName}
                  onChange={(e) => setRegCompanyName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs font-bold"
                />
              </div>

              {/* Contact Name */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Contact Name *</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={regContactName}
                  onChange={(e) => setRegContactName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs font-bold"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. john@acme.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs font-bold font-mono"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. +1 (555) 019-2834"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs font-bold font-mono"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  setRegFormError("");
                }}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-100 text-gray-700 font-extrabold text-xs rounded-xl border border-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!regCompanyName.trim() || !regContactName.trim() || !regEmail.trim()) {
                    setRegFormError("Please fill out all required fields marked with *");
                    return;
                  }
                  if (!regEmail.includes("@")) {
                    setRegFormError("Please enter a valid email address.");
                    return;
                  }
                  
                  // Reset error
                  setRegFormError("");
                  setIsSendingEmail(true);
                  
                  // Send email request only; no ZIP download is triggered by this button.
                  fetch("/api/lex360-register", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      companyName: regCompanyName,
                      contactName: regContactName,
                      email: regEmail,
                      phone: regPhone,
                      fileName: fileName,
                    }),
                  })
                    .then(async (res) => {
                      setIsSendingEmail(false);
                      if (!res.ok) {
                        console.error("Email API failed:", await res.text());
                      }
                      setShowRegisterModal(false);
                      setRegCompanyName("");
                      setRegContactName("");
                      setRegEmail("");
                      setRegPhone("");
                    })
                    .catch((err) => {
                      setIsSendingEmail(false);
                      console.error("Email API failed to dispatch:", err);
                      setShowRegisterModal(false);
                      setRegCompanyName("");
                      setRegContactName("");
                      setRegEmail("");
                      setRegPhone("");
                    });
                }}
                disabled={isSendingEmail}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {isSendingEmail ? "Sending details..." : "Send Email Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
