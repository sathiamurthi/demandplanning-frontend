import { create } from "zustand";
import { ParsedWorkbook, ParsedSheet, ParsedCell } from "../lib/excelParser";
import {
  cellKeyToString,
  extractDependencies,
  FormulaEvaluator,
  getTopologicalSortOrder,
  parseCellKeyString,
} from "../lib/formulaEvaluator";
import { RuleRow, OopRulesEngine } from "../lib/oopRulesEngine";

// Utility to parse rule rows from sheet named ManualID999
function parseOopRulesFromSheet(sheet: ParsedSheet): RuleRow[] {
  const rows: Record<number, Record<string, any>> = {};

  Object.keys(sheet.cells).forEach((ref) => {
    const match = ref.match(/^([A-Z]+)([0-9]+)$/i);
    if (match) {
      const col = match[1].toUpperCase();
      const rowNum = parseInt(match[2], 10);
      if (rowNum === 1) return; // skip header row

      rows[rowNum] = rows[rowNum] || {};
      rows[rowNum][col] = sheet.cells[ref].value;
    }
  });

  const ruleRows: RuleRow[] = [];
  Object.keys(rows).forEach((rStr) => {
    const rIdx = parseInt(rStr, 10);
    const row = rows[rIdx];

    if (row.A !== undefined && row.A !== "") {
      ruleRows.push({
        id: String(row.A),
        page: String(row.B || ""),
        description: String(row.C || ""),
        typeCode: String(row.D || ""),
        fieldName: String(row.E || ""),
        fieldType: String(row.F || ""),
        order: Number(row.G) || 0,
        mode: String(row.H || ""),
        parameters: String(row.I || ""),
        applyTo: String(row.J || ""),
        conditions: String(row.K || ""),
      });
    }
  });

  return ruleRows;
}

export interface ExtractorState {
  fileName: string;
  sheets: ParsedSheet[];
  cellDb: Record<string, ParsedCell>; // Key: "SheetName!CellRef"
  inputs: string[]; // List of "SheetName!CellRef" keys
  formulas: string[]; // List of "SheetName!CellRef" keys
  simulatedValues: Record<string, any>; // Key: "SheetName!CellRef", Value: simulated value
  calculationOrder: string[]; // Topological execution list of formula keys
  cyclicCells: string[]; // Cells with circular dependencies
  isLoaded: boolean;
  isLoading: boolean;
  activeSheetName: string;
  isAppAgentMode: boolean; // Flag to toggle formula/rules editing mode

  // OOP Rating Rules Engine properties
  isOopModel: boolean;
  oopRules: RuleRow[];
  oopRequestContext: Record<string, any>;
  oopRequestContextString: string;
  oopTrace: { order: number; id: string; desc: string; met: boolean; action: string }[];
  oopFinalContext: Record<string, any>;

  // Actions
  setWorkbook: (workbook: ParsedWorkbook) => void;
  updateInputValue: (key: string, value: any) => void;
  updateCellFormula: (key: string, newFormula: string) => void;
  resetSimulation: () => void;
  setActiveSheet: (sheetName: string) => void;
  toggleAppAgentMode: () => void;
  clearWorkbook: () => void;

  // CRUD Actions for Sheets and Rows
  addSheet: (sheetName: string) => void;
  deleteSheet: (sheetName: string) => void;
  addSheetRow: (sheetName: string) => void;
  deleteSheetRow: (sheetName: string, rowIndex: number) => void;

  // OOP Rules Actions
  updateOopRequest: (requestJsonStr: string) => void;
  updateOopRule: (id: string, updatedFields: Partial<RuleRow>) => void;
  addOopRule: (rule: RuleRow) => void;
  deleteOopRule: (id: string) => void;
}

export const useExtractorStore = create<ExtractorState>((set, get) => ({
  fileName: "",
  sheets: [],
  cellDb: {},
  inputs: [],
  formulas: [],
  simulatedValues: {},
  calculationOrder: [],
  cyclicCells: [],
  isLoaded: false,
  isLoading: false,
  activeSheetName: "",
  isAppAgentMode: false,

  // OOP initial states
  isOopModel: false,
  oopRules: [],
  oopRequestContext: {},
  oopRequestContextString: "",
  oopTrace: [],
  oopFinalContext: {},

  setWorkbook: (workbook: ParsedWorkbook) => {
    set({ isLoading: true });

    // 1. Check if this is an OOP Rules Sheet workbook
    const ruleSheet = workbook.sheets.find(
      (s) => s.name === "ManualID999" || Object.keys(s.cells).some((ref) => ref === "G1" && s.cells[ref].value === "RateOrder")
    );

    if (ruleSheet) {
      const oopRules = parseOopRulesFromSheet(ruleSheet);

      let oopRequestContextString = "";
      const requestSheet = workbook.sheets.find((s) => s.name === "Request");
      if (requestSheet && requestSheet.cells["A1"]) {
        oopRequestContextString = String(requestSheet.cells["A1"].value);
      } else {
        oopRequestContextString = JSON.stringify(
          {
            ManualID: 999,
            Company: "38",
            County: "1",
            PolicyTerm: "12",
            Occupancy: "O",
            TerritoryCode: "1",
            ProtectionClass: "6",
            ConstructionType: "S",
            PolicyForm: "DP-1",
            PaymentPlanOption: "FULL",
            COVERAGEA: 1000,
            RoofUpdate: 2017,
            Deductible: 1000,
          },
          null,
          2
        );
      }

      let oopRequestContext = {};
      try {
        oopRequestContext = JSON.parse(oopRequestContextString);
      } catch (e) {
        console.error("Failed to parse request JSON", e);
      }

      const engine = new OopRulesEngine(oopRules);
      const { finalContext, trace } = engine.run(oopRequestContext);

      set({
        fileName: workbook.fileName,
        sheets: workbook.sheets,
        isLoaded: true,
        isLoading: false,
        activeSheetName: ruleSheet.name,
        isOopModel: true,
        oopRules,
        oopRequestContext,
        oopRequestContextString,
        oopTrace: trace,
        oopFinalContext: finalContext,
      });
      return;
    }

    // 2. Fallback to standard cell-based spreadsheet parser
    const cellDb: Record<string, ParsedCell> = {};
    const formulas: string[] = [];
    const allReferencedDeps = new Set<string>();

    workbook.sheets.forEach((sheet) => {
      Object.keys(sheet.cells).forEach((ref) => {
        const cell = sheet.cells[ref];
        const key = cellKeyToString(sheet.name, ref);
        cellDb[key] = cell;

        if (cell.formula) {
          formulas.push(key);
          const cellDeps = extractDependencies(cell.formula, sheet.name);
          cellDeps.forEach((dep) => allReferencedDeps.add(dep));
        }
      });
    });

    const inputs: string[] = [];
    allReferencedDeps.forEach((depKey) => {
      const cell = cellDb[depKey];
      if (!cell || !cell.formula) {
        inputs.push(depKey);
      }
    });

    inputs.sort();

    const graphCells: Record<string, { formula: string | null; dependencies: string[] }> = {};
    formulas.forEach((key) => {
      const cell = cellDb[key];
      const cellDeps = extractDependencies(cell.formula!, parseCellKeyString(key).sheetName);
      graphCells[key] = {
        formula: cell.formula,
        dependencies: cellDeps,
      };
    });

    const { order, cyclicKeys } = getTopologicalSortOrder(graphCells);

    const simulatedValues: Record<string, any> = {};
    Object.keys(cellDb).forEach((key) => {
      simulatedValues[key] = cellDb[key].value;
    });

    inputs.forEach((key) => {
      if (simulatedValues[key] === undefined) {
        simulatedValues[key] = 0;
      }
    });

    const evaluator = new FormulaEvaluator(simulatedValues);
    order.forEach((key) => {
      const cell = cellDb[key];
      const parsedKey = parseCellKeyString(key);
      const evaluatedVal = evaluator.evaluate(cell.formula!, parsedKey.sheetName);
      simulatedValues[key] = evaluatedVal;
    });

    set({
      fileName: workbook.fileName,
      sheets: workbook.sheets,
      cellDb,
      inputs,
      formulas,
      simulatedValues,
      calculationOrder: order,
      cyclicCells: cyclicKeys,
      isLoaded: true,
      isLoading: false,
      activeSheetName: workbook.sheets[0]?.name || "",
      isOopModel: false,
    });
  },

  updateInputValue: (key: string, value: any) => {
    const { cellDb, calculationOrder, simulatedValues } = get();

    let parsedVal = value;
    if (value !== "" && !isNaN(Number(value))) {
      parsedVal = Number(value);
    } else if (value === "true" || value === "FALSE") {
      parsedVal = value === "true";
    }

    const nextSimulatedValues = {
      ...simulatedValues,
      [key]: parsedVal,
    };

    const evaluator = new FormulaEvaluator(nextSimulatedValues);
    calculationOrder.forEach((formulaKey) => {
      const cell = cellDb[formulaKey];
      if (cell) {
        const parsedKey = parseCellKeyString(formulaKey);
        const evaluatedVal = evaluator.evaluate(cell.formula!, parsedKey.sheetName);
        nextSimulatedValues[formulaKey] = evaluatedVal;
      }
    });

    set({ simulatedValues: nextSimulatedValues });
  },

  updateCellFormula: (key: string, newFormula: string) => {
    const { cellDb, simulatedValues } = get();
    const cell = cellDb[key];
    if (!cell) return;

    let formula = newFormula.trim();
    if (formula.startsWith("=")) {
      formula = formula.slice(1);
    }

    const updatedCell: ParsedCell = {
      ...cell,
      formula: formula || null,
    };

    const nextCellDb = {
      ...cellDb,
      [key]: updatedCell,
    };

    const formulas: string[] = [];
    const allReferencedDeps = new Set<string>();

    Object.keys(nextCellDb).forEach((k) => {
      const c = nextCellDb[k];
      if (c.formula) {
        formulas.push(k);
        const cellDeps = extractDependencies(c.formula, parseCellKeyString(k).sheetName);
        cellDeps.forEach((dep) => allReferencedDeps.add(dep));
      }
    });

    const nextInputs: string[] = [];
    allReferencedDeps.forEach((depKey) => {
      const c = nextCellDb[depKey];
      if (!c || !c.formula) {
        nextInputs.push(depKey);
      }
    });
    nextInputs.sort();

    const graphCells: Record<string, { formula: string | null; dependencies: string[] }> = {};
    formulas.forEach((k) => {
      const c = nextCellDb[k];
      const cellDeps = extractDependencies(c.formula!, parseCellKeyString(k).sheetName);
      graphCells[k] = {
        formula: c.formula,
        dependencies: cellDeps,
      };
    });

    const { order, cyclicKeys } = getTopologicalSortOrder(graphCells);

    const nextSimulatedValues = { ...simulatedValues };
    nextInputs.forEach((k) => {
      if (nextSimulatedValues[k] === undefined) {
        nextSimulatedValues[k] = 0;
      }
    });

    const evaluator = new FormulaEvaluator(nextSimulatedValues);
    order.forEach((k) => {
      const c = nextCellDb[k];
      if (c && c.formula) {
        const parsedKey = parseCellKeyString(k);
        const evaluatedVal = evaluator.evaluate(c.formula, parsedKey.sheetName);
        nextSimulatedValues[k] = evaluatedVal;
      }
    });

    const nextSheets = get().sheets.map((sheet) => {
      const updatedCells = { ...sheet.cells };
      Object.keys(updatedCells).forEach((ref) => {
        const cellKey = cellKeyToString(sheet.name, ref);
        if (nextCellDb[cellKey]) {
          updatedCells[ref] = nextCellDb[cellKey];
        }
      });
      return {
        ...sheet,
        cells: updatedCells,
      };
    });

    set({
      cellDb: nextCellDb,
      sheets: nextSheets,
      inputs: nextInputs,
      formulas,
      simulatedValues: nextSimulatedValues,
      calculationOrder: order,
      cyclicCells: cyclicKeys,
    });
  },

  resetSimulation: () => {
    const { cellDb, calculationOrder } = get();
    const simulatedValues: Record<string, any> = {};

    Object.keys(cellDb).forEach((key) => {
      simulatedValues[key] = cellDb[key].value;
    });

    const evaluator = new FormulaEvaluator(simulatedValues);
    calculationOrder.forEach((formulaKey) => {
      const cell = cellDb[formulaKey];
      if (cell) {
        const parsedKey = parseCellKeyString(formulaKey);
        const evaluatedVal = evaluator.evaluate(cell.formula!, parsedKey.sheetName);
        simulatedValues[formulaKey] = evaluatedVal;
      }
    });

    set({ simulatedValues });
  },

  setActiveSheet: (sheetName: string) => {
    set({ activeSheetName: sheetName });
  },

  toggleAppAgentMode: () => {
    set((state) => ({ isAppAgentMode: !state.isAppAgentMode }));
  },

  clearWorkbook: () => {
    set({
      fileName: "",
      sheets: [],
      cellDb: {},
      inputs: [],
      formulas: [],
      simulatedValues: {},
      calculationOrder: [],
      cyclicCells: [],
      isLoaded: false,
      isLoading: false,
      activeSheetName: "",
      isAppAgentMode: false,
      isOopModel: false,
      oopRules: [],
      oopRequestContext: {},
      oopRequestContextString: "",
      oopTrace: [],
      oopFinalContext: {},
    });
  },

  // CRUD Actions for Sheets and Rows
  addSheet: (sheetName: string) => {
    const { sheets } = get();
    if (sheets.some((s) => s.name === sheetName)) return;

    const newSheet: ParsedSheet = {
      name: sheetName,
      rowCount: 15,
      colCount: 8,
      cells: {},
    };

    set({
      sheets: [...sheets, newSheet],
      activeSheetName: sheetName,
    });
  },

  deleteSheet: (sheetName: string) => {
    const { sheets, activeSheetName } = get();
    const nextSheets = sheets.filter((s) => s.name !== sheetName);
    set({
      sheets: nextSheets,
      activeSheetName: activeSheetName === sheetName ? (nextSheets[0]?.name || "") : activeSheetName,
    });
  },

  addSheetRow: (sheetName: string) => {
    const { sheets } = get();
    const nextSheets = sheets.map((s) => {
      if (s.name === sheetName) {
        return {
          ...s,
          rowCount: s.rowCount + 1,
        };
      }
      return s;
    });
    set({ sheets: nextSheets });
  },

  deleteSheetRow: (sheetName: string, rowIndex: number) => {
    const { sheets } = get();
    const nextSheets = sheets.map((s) => {
      if (s.name === sheetName) {
        const nextCells: Record<string, ParsedCell> = {};
        Object.keys(s.cells).forEach((ref) => {
          const match = ref.match(/^([A-Z]+)([0-9]+)$/i);
          if (match) {
            const col = match[1];
            const r = parseInt(match[2], 10);
            if (r < rowIndex) {
              nextCells[ref] = s.cells[ref];
            } else if (r > rowIndex) {
              const newRef = col + (r - 1);
              nextCells[newRef] = {
                ...s.cells[ref],
                ref: newRef,
              };
            }
          }
        });

        return {
          ...s,
          rowCount: Math.max(s.rowCount - 1, 0),
          cells: nextCells,
        };
      }
      return s;
    });

    const nextCellDb: Record<string, ParsedCell> = {};
    nextSheets.forEach((sheet) => {
      Object.keys(sheet.cells).forEach((ref) => {
        const key = sheet.name + "!" + ref;
        nextCellDb[key] = sheet.cells[ref];
      });
    });

    set({ sheets: nextSheets, cellDb: nextCellDb });
  },

  // OOP rating engine actions
  updateOopRequest: (requestJsonStr: string) => {
    const { oopRules } = get();
    let oopRequestContext = {};
    try {
      oopRequestContext = JSON.parse(requestJsonStr);
    } catch (e) {
      console.error("Failed to parse request JSON", e);
    }

    const engine = new OopRulesEngine(oopRules);
    const { finalContext, trace } = engine.run(oopRequestContext);

    set({
      oopRequestContext,
      oopRequestContextString: requestJsonStr,
      oopTrace: trace,
      oopFinalContext: finalContext,
    });
  },

  updateOopRule: (id: string, updatedFields: Partial<RuleRow>) => {
    const { oopRules, oopRequestContext } = get();
    const nextRules = oopRules.map((rule) => {
      if (rule.id === id) {
        return {
          ...rule,
          ...updatedFields,
        };
      }
      return rule;
    });

    const engine = new OopRulesEngine(nextRules);
    const { finalContext, trace } = engine.run(oopRequestContext);

    set({
      oopRules: nextRules,
      oopTrace: trace,
      oopFinalContext: finalContext,
    });
  },

  addOopRule: (rule: RuleRow) => {
    const { oopRules, oopRequestContext } = get();
    const nextRules = [...oopRules, rule].sort((a, b) => a.order - b.order);
    const engine = new OopRulesEngine(nextRules);
    const { finalContext, trace } = engine.run(oopRequestContext);

    set({
      oopRules: nextRules,
      oopTrace: trace,
      oopFinalContext: finalContext,
    });
  },

  deleteOopRule: (id: string) => {
    const { oopRules, oopRequestContext } = get();
    const nextRules = oopRules.filter((r) => r.id !== id);
    const engine = new OopRulesEngine(nextRules);
    const { finalContext, trace } = engine.run(oopRequestContext);

    set({
      oopRules: nextRules,
      oopTrace: trace,
      oopFinalContext: finalContext,
    });
  },
}));
