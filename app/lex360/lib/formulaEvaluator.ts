import { colNumToLabel, labelToColNum } from "./excelParser";

export interface CellKey {
  sheetName: string;
  ref: string;
}

// Convert cell key to string representation "SheetName!CellRef"
export function cellKeyToString(sheetName: string, ref: string): string {
  return `${sheetName}!${ref}`;
}

// Parse "SheetName!CellRef" back into SheetName and CellRef
export function parseCellKeyString(keyStr: string): CellKey {
  const parts = keyStr.split("!");
  if (parts.length === 2) {
    return { sheetName: parts[0], ref: parts[1] };
  }
  return { sheetName: "", ref: keyStr };
}

// Expand a range reference e.g., "A1:B3" to ["A1", "A2", "A3", "B1", "B2", "B3"]
export function expandRange(rangeStr: string): string[] {
  const cleanRange = rangeStr.replace(/\$/g, "");
  const parts = cleanRange.split(":");
  if (parts.length !== 2) return [rangeStr];

  const start = parts[0];
  const end = parts[1];

  const startMatch = start.match(/^([A-Z]+)([0-9]+)$/i);
  const endMatch = end.match(/^([A-Z]+)([0-9]+)$/i);

  if (!startMatch || !endMatch) return [rangeStr];

  const startCol = labelToColNum(startMatch[1].toUpperCase());
  const startRow = parseInt(startMatch[2], 10);
  const endCol = labelToColNum(endMatch[1].toUpperCase());
  const endRow = parseInt(endMatch[2], 10);

  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);

  const cells: string[] = [];
  for (let c = minCol; c <= maxCol; c++) {
    const colLabel = colNumToLabel(c);
    for (let r = minRow; r <= maxRow; r++) {
      cells.push(`${colLabel}${r}`);
    }
  }
  return cells;
}

/**
 * Regex to extract dependencies from a formula.
 * Handles ranges, single cell references, with or without sheet names.
 */
export function extractDependencies(formula: string, defaultSheetName: string): string[] {
  if (!formula) return [];
  const cleanFormula = formula.replace(/\$/g, "");

  // Match sheet name if present, either quoted 'Sheet 1'! or unquoted Sheet1!
  // Followed by cell range or single cell reference: e.g. A1:B3 or A1
  const cellRefOrRangeRegex = /(?:(?:'([^']+)')|([a-zA-Z0-9_]+))?!([a-zA-Z]+[0-9]+)(?::([a-zA-Z]+[0-9]+))?|([a-zA-Z]+[0-9]+)(?::([a-zA-Z]+[0-9]+))?/g;

  const deps = new Set<string>();
  let match;

  while ((match = cellRefOrRangeRegex.exec(cleanFormula)) !== null) {
    const sheetName = match[1] || match[2] || defaultSheetName;
    
    // Check if it's a range
    if (match[3] && match[4]) {
      // Range with sheet name: e.g., Sheet1!A1:B3
      const rangeCells = expandRange(`${match[3]}:${match[4]}`);
      rangeCells.forEach(cell => deps.add(cellKeyToString(sheetName, cell)));
    } else if (match[3]) {
      // Single cell with sheet name: e.g., Sheet1!A1
      deps.add(cellKeyToString(sheetName, match[3]));
    } else if (match[5] && match[6]) {
      // Range without sheet name: e.g., A1:B3
      const rangeCells = expandRange(`${match[5]}:${match[6]}`);
      rangeCells.forEach(cell => deps.add(cellKeyToString(sheetName, cell)));
    } else if (match[5]) {
      // Single cell without sheet name: e.g., A1
      deps.add(cellKeyToString(sheetName, match[5]));
    }
  }

  return Array.from(deps);
}

/**
 * Custom Excel formula parser & evaluator
 */
export class FormulaEvaluator {
  private values: Record<string, any>; // Key is "SheetName!CellRef"

  constructor(cellValues: Record<string, any>) {
    this.values = cellValues;
  }

  public evaluate(formula: string, defaultSheetName: string): any {
    try {
      const cleanFormula = formula.replace(/\$/g, "");
      const tokens = this.tokenize(cleanFormula);
      let index = 0;

      const parseExpression = (): any => {
        return parseLogical();
      };

      const parseLogical = (): any => {
        let left = parseAdditive();
        while (index < tokens.length) {
          const token = tokens[index];
          if (["=", "<>", "<", ">", "<=", ">="].includes(token)) {
            index++;
            const right = parseAdditive();
            if (token === "=") left = left === right;
            else if (token === "<>") left = left !== right;
            else if (token === "<") left = left < right;
            else if (token === ">") left = left > right;
            else if (token === "<=") left = left <= right;
            else if (token === ">=") left = left >= right;
          } else {
            break;
          }
        }
        return left;
      };

      const parseAdditive = (): any => {
        let left = parseMultiplicative();
        while (index < tokens.length) {
          const token = tokens[index];
          if (token === "+" || token === "-") {
            index++;
            const right = parseMultiplicative();
            const leftNum = parseFloat(left);
            const rightNum = parseFloat(right);
            if (token === "+") left = leftNum + rightNum;
            else left = leftNum - rightNum;
          } else {
            break;
          }
        }
        return left;
      };

      const parseMultiplicative = (): any => {
        let left = parsePower();
        while (index < tokens.length) {
          const token = tokens[index];
          if (token === "*" || token === "/") {
            index++;
            const right = parsePower();
            const leftNum = parseFloat(left);
            const rightNum = parseFloat(right);
            if (token === "*") left = leftNum * rightNum;
            else left = leftNum / rightNum;
          } else {
            break;
          }
        }
        return left;
      };

      const parsePower = (): any => {
        let left = parsePrimary();
        while (index < tokens.length && tokens[index] === "^") {
          index++;
          const right = parsePrimary();
          left = Math.pow(parseFloat(left), parseFloat(right));
        }
        return left;
      };

      const parsePrimary = (): any => {
        if (index >= tokens.length) return 0;
        const token = tokens[index];

        // Paren
        if (token === "(") {
          index++;
          const val = parseExpression();
          if (tokens[index] === ")") index++;
          return val;
        }

        // Unary minus
        if (token === "-") {
          index++;
          return -parseFloat(parsePrimary());
        }

        // Unary plus
        if (token === "+") {
          index++;
          return parseFloat(parsePrimary());
        }

        // Function call
        if (index + 1 < tokens.length && tokens[index + 1] === "(") {
          const funcName = token.toUpperCase();
          index += 2; // skip name and '('
          
          const args: any[] = [];
          if (tokens[index] !== ")") {
            while (true) {
              // Range support inside function args (e.g. A1:B3 or Sheet1!A1:B3)
              const argStartToken = tokens[index];
              let isRange = false;
              let rangeStr = "";

              // Check if we have a range or sheet range next
              let tempIdx = index;
              let sheetName = defaultSheetName;

              // Check for sheet prefix
              if (tempIdx + 1 < tokens.length && tokens[tempIdx + 1] === "!") {
                sheetName = tokens[tempIdx];
                // strip quotes if sheetName is quoted
                if (sheetName.startsWith("'") && sheetName.endsWith("'")) {
                  sheetName = sheetName.slice(1, -1);
                }
                tempIdx += 2;
              }

              if (tempIdx + 1 < tokens.length && tokens[tempIdx + 1] === ":") {
                // Yes, range: e.g., A1:A5
                rangeStr = `${tokens[tempIdx]}:${tokens[tempIdx + 2]}`;
                isRange = true;
                index = tempIdx + 3; // Advance past the range tokens
              }

              if (isRange) {
                args.push({
                  type: "range",
                  sheetName,
                  rangeStr,
                  cells: expandRange(rangeStr)
                });
              } else {
                args.push(parseExpression());
              }

              if (tokens[index] === ",") {
                index++;
              } else if (tokens[index] === ")") {
                break;
              } else {
                break;
              }
            }
          }
          if (tokens[index] === ")") index++;
          return this.evaluateFunction(funcName, args);
        }

        // Number
        if (/^\d+(\.\d+)?$/.test(token)) {
          index++;
          return parseFloat(token);
        }

        // String literal
        if (token.startsWith('"') && token.endsWith('"')) {
          index++;
          return token.slice(1, -1);
        }

        // Boolean
        if (token.toUpperCase() === "TRUE") {
          index++;
          return true;
        }
        if (token.toUpperCase() === "FALSE") {
          index++;
          return false;
        }

        // Cell reference (e.g., A1, Sheet1!A1, 'Sheet 1'!B3)
        // Let's parse cell ref: check if next is '!'
        let cellRef = token;
        let sheetName = defaultSheetName;
        if (index + 1 < tokens.length && tokens[index + 1] === "!") {
          sheetName = token;
          if (sheetName.startsWith("'") && sheetName.endsWith("'")) {
            sheetName = sheetName.slice(1, -1);
          }
          cellRef = tokens[index + 2];
          index += 3;
        } else {
          index++;
        }

        return this.getCellValue(sheetName, cellRef);
      };

      return parseExpression();
    } catch (e) {
      console.error("Formula parsing error:", formula, e);
      return "#VALUE!";
    }
  }

  private getCellValue(sheetName: string, cellRef: string): any {
    const key = cellKeyToString(sheetName, cellRef.toUpperCase());
    const val = this.values[key];
    if (val === undefined) return 0;
    return val;
  }

  private evaluateFunction(funcName: string, args: any[]): any {
    const flattenArgs = (rawArgs: any[]): any[] => {
      const flat: any[] = [];
      rawArgs.forEach(arg => {
        if (arg && typeof arg === "object" && arg.type === "range") {
          arg.cells.forEach((cell: string) => {
            flat.push(this.getCellValue(arg.sheetName, cell));
          });
        } else {
          flat.push(arg);
        }
      });
      return flat;
    };

    switch (funcName) {
      case "SUM": {
        const flat = flattenArgs(args).map(a => (typeof a === "number" ? a : parseFloat(a) || 0));
        return flat.reduce((acc, v) => acc + v, 0);
      }
      case "AVERAGE": {
        const flat = flattenArgs(args).map(a => (typeof a === "number" ? a : parseFloat(a) || 0));
        return flat.length > 0 ? flat.reduce((acc, v) => acc + v, 0) / flat.length : 0;
      }
      case "PRODUCT": {
        const flat = flattenArgs(args).map(a => (typeof a === "number" ? a : parseFloat(a) || 0));
        return flat.length > 0 ? flat.reduce((acc, v) => acc * v, 1) : 0;
      }
      case "MIN": {
        const flat = flattenArgs(args).map(a => (typeof a === "number" ? a : parseFloat(a) || 0));
        return flat.length > 0 ? Math.min(...flat) : 0;
      }
      case "MAX": {
        const flat = flattenArgs(args).map(a => (typeof a === "number" ? a : parseFloat(a) || 0));
        return flat.length > 0 ? Math.max(...flat) : 0;
      }
      case "IF": {
        const [cond, trueVal, falseVal] = args;
        return cond ? trueVal : falseVal;
      }
      case "INDEX": {
        const range = args[0];
        if (!range || typeof range !== "object" || range.type !== "range") {
          return "#VALUE!";
        }
        const rowIdx = Number(args[1]) || 1;
        const colIdx = args[2] !== undefined ? Number(args[2]) : null;

        if (colIdx === null) {
          const targetCell = range.cells[rowIdx - 1];
          if (!targetCell) return 0;
          return this.getCellValue(range.sheetName, targetCell);
        } else {
          const cells = range.cells;
          const rangeCells = cells.map((c: string) => {
            const match = c.match(/^([A-Z]+)([0-9]+)$/i);
            return {
              ref: c,
              col: match ? labelToColNum(match[1].toUpperCase()) : 0,
              row: match ? parseInt(match[2], 10) : 0
            };
          });
          const minCol = Math.min(...rangeCells.map((rc: any) => rc.col));
          const minRow = Math.min(...rangeCells.map((rc: any) => rc.row));
          
          const targetCol = minCol + colIdx - 1;
          const targetRow = minRow + rowIdx - 1;
          const targetCellObj = rangeCells.find((rc: any) => rc.col === targetCol && rc.row === targetRow);
          if (!targetCellObj) return 0;
          return this.getCellValue(range.sheetName, targetCellObj.ref);
        }
      }
      case "MATCH": {
        const lookupVal = args[0];
        const range = args[1];
        const matchType = args[2] !== undefined ? Number(args[2]) : 1;

        if (!range || typeof range !== "object" || range.type !== "range") {
          return "#VALUE!";
        }

        const cellValues = range.cells.map((cell: string) => this.getCellValue(range.sheetName, cell));

        if (matchType === 0) {
          const idx = cellValues.findIndex((val: any) => String(val).toUpperCase() === String(lookupVal).toUpperCase());
          if (idx === -1) return "#N/A";
          return idx + 1;
        } else if (matchType === 1) {
          let bestIdx = -1;
          for (let i = 0; i < cellValues.length; i++) {
            const valNum = Number(cellValues[i]);
            const lookupNum = Number(lookupVal);
            if (valNum <= lookupNum) {
              bestIdx = i;
            }
          }
          if (bestIdx === -1) return "#N/A";
          return bestIdx + 1;
        } else {
          let bestIdx = -1;
          for (let i = 0; i < cellValues.length; i++) {
            const valNum = Number(cellValues[i]);
            const lookupNum = Number(lookupVal);
            if (valNum >= lookupNum) {
              bestIdx = i;
            }
          }
          if (bestIdx === -1) return "#N/A";
          return bestIdx + 1;
        }
      }
      case "SUMIFS": {
        const sumRange = args[0];
        if (!sumRange || typeof sumRange !== "object" || sumRange.type !== "range") {
          return "#VALUE!";
        }

        const criteriaPairs: { range: any; crit: any }[] = [];
        for (let i = 1; i < args.length; i += 2) {
          if (args[i] && typeof args[i] === "object" && args[i].type === "range" && args[i+1] !== undefined) {
            criteriaPairs.push({ range: args[i], crit: args[i+1] });
          }
        }

        if (criteriaPairs.length === 0) return 0;

        let total = 0;
        for (let idx = 0; idx < sumRange.cells.length; idx++) {
          let matchesAll = true;

          for (const pair of criteriaPairs) {
            const critCell = pair.range.cells[idx];
            if (!critCell) {
              matchesAll = false;
              break;
            }
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
            if (sumCell) {
              total += Number(this.getCellValue(sumRange.sheetName, sumCell)) || 0;
            }
          }
        }

        return total;
      }
      default:
        console.warn("Unsupported Excel function:", funcName);
        return "#NAME?";
    }
  }

  // Formula Tokenizer
  private tokenize(formula: string): string[] {
    const tokens: string[] = [];
    let i = 0;

    while (i < formula.length) {
      const char = formula[i];

      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Operators and punctuation
      if (["+", "-", "*", "/", "^", "(", ")", ",", "!", ":"].includes(char)) {
        tokens.push(char);
        i++;
        continue;
      }

      // Logical comparison operators: <=, >=, <>, <, >
      if (char === "<" && formula[i + 1] === "=") {
        tokens.push("<=");
        i += 2;
        continue;
      }
      if (char === ">" && formula[i + 1] === "=") {
        tokens.push(">=");
        i += 2;
        continue;
      }
      if (char === "<" && formula[i + 1] === ">") {
        tokens.push("<>");
        i += 2;
        continue;
      }
      if (char === "<" || char === ">" || char === "=") {
        tokens.push(char);
        i++;
        continue;
      }

      // Quoted string (e.g. "My Sheet" or "result")
      if (char === '"') {
        let str = '"';
        i++;
        while (i < formula.length && formula[i] !== '"') {
          str += formula[i];
          i++;
        }
        if (i < formula.length) {
          str += '"';
          i++;
        }
        tokens.push(str);
        continue;
      }

      // Single quoted sheet name (e.g. 'Sheet Name'!)
      if (char === "'") {
        let str = "'";
        i++;
        while (i < formula.length && formula[i] !== "'") {
          str += formula[i];
          i++;
        }
        if (i < formula.length) {
          str += "'";
          i++;
        }
        tokens.push(str);
        continue;
      }

      // Number literals
      if (/\d/.test(char)) {
        let num = "";
        while (i < formula.length && /[\d\.]/.test(formula[i])) {
          num += formula[i];
          i++;
        }
        tokens.push(num);
        continue;
      }

      // Cell reference or Function name (e.g. A1, SUM, Sheet1)
      if (/[a-zA-Z0-9_]/.test(char)) {
        let ref = "";
        while (i < formula.length && /[a-zA-Z0-9_]/.test(formula[i])) {
          ref += formula[i];
          i++;
        }
        tokens.push(ref);
        continue;
      }

      // Skip unknown character
      i++;
    }

    return tokens;
  }
}

/**
 * Performs topological sort on cell dependency graph.
 * Returns evaluation order list of keys or throws an error on cycles.
 */
export function getTopologicalSortOrder(
  cells: Record<string, { formula: string | null; dependencies: string[] }>
): { order: string[]; cyclicKeys: string[] } {
  const adjacencyList: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  const allKeys = Object.keys(cells);

  // Initialize
  allKeys.forEach((key) => {
    adjacencyList[key] = [];
    inDegree[key] = 0;
  });

  // Build Graph
  allKeys.forEach((key) => {
    const cell = cells[key];
    cell.dependencies.forEach((dep) => {
      // If the dependency exists in our workbook
      if (cells[dep] !== undefined) {
        if (!adjacencyList[dep]) adjacencyList[dep] = [];
        adjacencyList[dep].push(key);
        inDegree[key] = (inDegree[key] || 0) + 1;
      }
    });
  });

  // Kahn's algorithm
  const queue: string[] = [];
  allKeys.forEach((key) => {
    if ((inDegree[key] || 0) === 0) {
      queue.push(key);
    }
  });

  const order: string[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    order.push(u);

    const neighbors = adjacencyList[u] || [];
    neighbors.forEach((v) => {
      inDegree[v]--;
      if (inDegree[v] === 0) {
        queue.push(v);
      }
    });
  }

  // Find cycles (any node with inDegree > 0 after queue is empty)
  const cyclicKeys = allKeys.filter((key) => inDegree[key] > 0);

  return {
    order,
    cyclicKeys,
  };
}
