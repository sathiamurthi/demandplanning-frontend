"use client";

import React, { useState } from "react";
import { useExtractorStore } from "../store/useExtractorStore";
import { parseCellKeyString, extractDependencies } from "../lib/formulaEvaluator";
import { Download, FileCode, Copy, Check } from "lucide-react";

export default function LogicExporter() {
  const isLoaded = useExtractorStore((state) => state.isLoaded);
  const fileName = useExtractorStore((state) => state.fileName);
  const sheets = useExtractorStore((state) => state.sheets);
  const cellDb = useExtractorStore((state) => state.cellDb);
  const inputs = useExtractorStore((state) => state.inputs);
  const formulas = useExtractorStore((state) => state.formulas);
  const simulatedValues = useExtractorStore((state) => state.simulatedValues);

  const [copied, setCopied] = useState(false);

  if (!isLoaded) return null;

  const generateXml = (): string => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<LogicalModel>\n`;
    xml += `  <Metadata>\n`;
    xml += `    <SourceFile>${fileName}</SourceFile>\n`;
    xml += `    <ExportedAt>${new Date().toISOString()}</ExportedAt>\n`;
    xml += `    <SheetsCount>${sheets.length}</SheetsCount>\n`;
    xml += `    <InputsCount>${inputs.length}</InputsCount>\n`;
    xml += `    <RulesCount>${formulas.length}</RulesCount>\n`;
    xml += `  </Metadata>\n\n`;

    xml += `  <Sheets>\n`;
    sheets.forEach((sheet) => {
      xml += `    <Sheet name="${sheet.name}" rows="${sheet.rowCount}" cols="${sheet.colCount}" />\n`;
    });
    xml += `  </Sheets>\n\n`;

    xml += `  <ModelParameters>\n`;
    inputs.forEach((key) => {
      const { sheetName, ref } = parseCellKeyString(key);
      const originalCell = cellDb[key];
      const initialVal = originalCell ? originalCell.value : "";
      const simVal = simulatedValues[key];

      xml += `    <Parameter cell="${ref}" sheet="${sheetName}">\n`;
      xml += `      <InitialValue>${initialVal}</InitialValue>\n`;
      xml += `      <CurrentSimulatedValue>${simVal}</CurrentSimulatedValue>\n`;
      xml += `    </Parameter>\n`;
    });
    xml += `  </ModelParameters>\n\n`;

    xml += `  <BusinessRules>\n`;
    formulas.forEach((key) => {
      const { sheetName, ref } = parseCellKeyString(key);
      const cell = cellDb[key];
      if (cell && cell.formula) {
        const deps = extractDependencies(cell.formula, sheetName);
        const originalVal = cell.value;
        const currentSimVal = simulatedValues[key];

        xml += `    <Rule cell="${ref}" sheet="${sheetName}">\n`;
        xml += `      <Expression>=${cell.formula}</Expression>\n`;
        xml += `      <OriginalValue>${originalVal}</OriginalValue>\n`;
        xml += `      <CurrentSimulatedValue>${currentSimVal}</CurrentSimulatedValue>\n`;
        if (deps.length > 0) {
          xml += `      <Dependencies>\n`;
          deps.forEach((dep) => {
            const parsedDep = parseCellKeyString(dep);
            xml += `        <Dependency cell="${parsedDep.ref}" sheet="${parsedDep.sheetName}" />\n`;
          });
          xml += `      </Dependencies>\n`;
        }
        xml += `    </Rule>\n`;
      }
    });
    xml += `  </BusinessRules>\n`;
    xml += `</LogicalModel>`;
    return xml;
  };

  const generateJson = (): string => {
    const model = {
      sourceFile: fileName,
      exportedAt: new Date().toISOString(),
      sheets: sheets.map((s) => ({ name: s.name, rows: s.rowCount, cols: s.colCount })),
      parameters: inputs.map((key) => {
        const { sheetName, ref } = parseCellKeyString(key);
        const cell = cellDb[key];
        return {
          key,
          sheet: sheetName,
          cell: ref,
          initialValue: cell ? cell.value : "",
          simulatedValue: simulatedValues[key],
        };
      }),
      rules: formulas.map((key) => {
        const { sheetName, ref } = parseCellKeyString(key);
        const cell = cellDb[key];
        const deps = cell?.formula ? extractDependencies(cell.formula, sheetName) : [];
        return {
          key,
          sheet: sheetName,
          cell: ref,
          expression: cell?.formula ? `=${cell.formula}` : "",
          initialValue: cell ? cell.value : "",
          simulatedValue: simulatedValues[key],
          dependencies: deps,
        };
      }),
    };
    return JSON.stringify(model, null, 2);
  };

  const downloadFile = (content: string, type: "xml" | "json") => {
    const blob = new Blob([content], { type: type === "xml" ? "text/xml" : "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.replace(/\.[^/.]+$/, "")}_business_logic.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const xml = generateXml();
    navigator.clipboard.writeText(xml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <FileCode className="h-5 w-5 text-emerald-500" /> Export Business Logic
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Export the extracted formula dependency structure and parameter values as XML or JSON.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => downloadFile(generateXml(), "xml")}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-white" /> Download XML
          </button>
          <button
            onClick={() => downloadFile(generateJson(), "json")}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all border border-gray-200 shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-gray-500" /> Download JSON
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all border border-gray-200 shadow-xs min-w-[100px]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500 animate-bounce" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-gray-500" /> Copy XML
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
