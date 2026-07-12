import * as XLSX from "xlsx";

export interface ParsedCell {
  ref: string; // e.g. "A1"
  sheetName: string;
  value: any; // Raw value (number, string, etc.)
  formattedValue: string;
  formula: string | null; // Formula string without leading "="
  type: string; // e.g., 'n' for number, 's' for string, 'b' for boolean
}

export interface ParsedSheet {
  name: string;
  cells: Record<string, ParsedCell>;
  rowCount: number;
  colCount: number;
}

export interface ParsedWorkbook {
  fileName: string;
  sheets: ParsedSheet[];
}

// Convert column index (1-based) to letter (e.g. 1 -> A, 27 -> AA)
export function colNumToLabel(colNum: number): string {
  let temp = colNum;
  let label = "";
  while (temp > 0) {
    let modulo = (temp - 1) % 26;
    label = String.fromCharCode(65 + modulo) + label;
    temp = Math.floor((temp - modulo) / 26);
  }
  return label;
}

// Convert column letter to index (1-based, e.g. A -> 1, AA -> 27)
export function labelToColNum(label: string): number {
  let colNum = 0;
  for (let i = 0; i < label.length; i++) {
    colNum = colNum * 26 + (label.charCodeAt(i) - 64);
  }
  return colNum;
}

// Convert R1C1 cell references to A1 format.
// e.g., RC[-2] relative to C3 (row 3, col 3) => A3
// R[1]C[-1] relative to B2 (row 2, col 2) => A3
// R5C2 => B5 (absolute)
export function convertR1C1ToA1(r1c1Formula: string, currentRow: number, currentCol: number): string {
  // Regex to match R1C1 references: R([+-]?\d+|\[[+-]?\d+\])?C([+-]?\d+|\[[+-]?\d+\])?
  // Note: we need to handle cases like RC[-2], R[1]C, R5C2, R[-1]C[-1]
  const regex = /R(?:\[([+-]?\d+)\]|(\d+))?C(?:\[([+-]?\d+)\]|(\d+))?/g;

  return r1c1Formula.replace(regex, (match, rRel, rAbs, cRel, cAbs) => {
    let targetRow = currentRow;
    let targetCol = currentCol;

    if (rRel !== undefined) {
      targetRow = currentRow + parseInt(rRel, 10);
    } else if (rAbs !== undefined) {
      targetRow = parseInt(rAbs, 10);
    }

    if (cRel !== undefined) {
      targetCol = currentCol + parseInt(cRel, 10);
    } else if (cAbs !== undefined) {
      targetCol = parseInt(cAbs, 10);
    }

    // Safeguard indices
    if (targetRow < 1 || targetCol < 1) {
      return match; // Return unchanged if invalid coordinate
    }

    return colNumToLabel(targetCol) + targetRow;
  });
}

/**
 * Parses a binary Excel workbook (.xlsx, .xls, .ods, etc.) using SheetJS.
 */
export function parseXlsxWorkbook(arrayBuffer: ArrayBuffer, fileName: string): ParsedWorkbook {
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: "array", cellFormula: true, cellNF: true });
  
  const parsedSheets: ParsedSheet[] = workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const cells: Record<string, ParsedCell> = {};
    
    // Find range
    const rangeRef = sheet["!ref"];
    let rowCount = 0;
    let colCount = 0;
    
    if (rangeRef) {
      const range = XLSX.utils.decode_range(rangeRef);
      rowCount = range.e.r + 1;
      colCount = range.e.c + 1;

      // Extract cells
      for (let r = range.s.r; r <= range.e.r; r++) {
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cellRef = XLSX.utils.encode_cell({ r, c });
          const cell = sheet[cellRef];
          
          if (cell) {
            cells[cellRef] = {
              ref: cellRef,
              sheetName,
              value: cell.v ?? "",
              formattedValue: cell.w ?? (cell.v !== undefined ? String(cell.v) : ""),
              formula: cell.f ? cell.f : null,
              type: cell.t || "s",
            };
          }
        }
      }
    }

    return {
      name: sheetName,
      cells,
      rowCount,
      colCount,
    };
  });

  return {
    fileName,
    sheets: parsedSheets,
  };
}

/**
 * Parses an Excel SpreadsheetML 2003 XML string.
 */
export function parseXmlWorkbook(xmlString: string, fileName: string): ParsedWorkbook {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");
  
  // Check for XML parsing error
  const parserError = xmlDoc.getElementsByTagName("parsererror")[0];
  if (parserError) {
    throw new Error("Invalid XML file structure: " + parserError.textContent);
  }

  const worksheets = xmlDoc.getElementsByTagName("Worksheet");
  const parsedSheets: ParsedSheet[] = [];

  for (let i = 0; i < worksheets.length; i++) {
    const worksheet = worksheets[i];
    const sheetName = worksheet.getAttribute("ss:Name") || worksheet.getAttribute("Name") || `Sheet${i + 1}`;
    const cells: Record<string, ParsedCell> = {};
    
    const rows = worksheet.getElementsByTagName("Row");
    let maxRow = 0;
    let maxCol = 0;
    
    let currentRowIdx = 0;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      // ss:Index on Row overrides sequence (1-indexed in Excel XML)
      const rowIndexAttr = row.getAttribute("ss:Index") || row.getAttribute("Index");
      if (rowIndexAttr) {
        currentRowIdx = parseInt(rowIndexAttr, 10);
      } else {
        currentRowIdx++;
      }

      maxRow = Math.max(maxRow, currentRowIdx);

      const xmlCells = row.getElementsByTagName("Cell");
      let currentColIdx = 0;
      for (let c = 0; c < xmlCells.length; c++) {
        const cell = xmlCells[c];
        // ss:Index on Cell overrides sequence (1-indexed in Excel XML)
        const cellIndexAttr = cell.getAttribute("ss:Index") || cell.getAttribute("Index");
        if (cellIndexAttr) {
          currentColIdx = parseInt(cellIndexAttr, 10);
        } else {
          currentColIdx++;
        }

        maxCol = Math.max(maxCol, currentColIdx);
        const cellRef = colNumToLabel(currentColIdx) + currentRowIdx;

        // Extract value
        const dataTag = cell.getElementsByTagName("Data")[0];
        let rawVal: any = "";
        let valType = "s";
        let formattedVal = "";

        if (dataTag) {
          const typeAttr = dataTag.getAttribute("ss:Type") || dataTag.getAttribute("Type") || "String";
          const text = dataTag.textContent || "";
          
          if (typeAttr === "Number") {
            rawVal = parseFloat(text);
            if (isNaN(rawVal)) rawVal = text;
            valType = "n";
          } else if (typeAttr === "Boolean") {
            rawVal = text === "1" || text.toLowerCase() === "true";
            valType = "b";
          } else {
            rawVal = text;
            valType = "s";
          }
          formattedVal = text;
        }

        // Formula
        let formula = cell.getAttribute("ss:Formula") || cell.getAttribute("Formula") || null;
        if (formula) {
          // Excel formulas in XML often start with "=" or "of:=" or similar
          if (formula.startsWith("of:=")) {
            formula = formula.slice(4);
          } else if (formula.startsWith("=")) {
            formula = formula.slice(1);
          }
          // If the formula is in R1C1 format, convert it to A1
          if (formula.includes("R") || formula.includes("C")) {
            formula = convertR1C1ToA1(formula, currentRowIdx, currentColIdx);
          }
        }

        cells[cellRef] = {
          ref: cellRef,
          sheetName,
          value: rawVal,
          formattedValue: formattedVal,
          formula,
          type: valType,
        };
      }
    }

    parsedSheets.push({
      name: sheetName,
      cells,
      rowCount: maxRow,
      colCount: maxCol,
    });
  }

  return {
    fileName,
    sheets: parsedSheets,
  };
}
