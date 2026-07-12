"use client";

import React, { useState, useEffect } from "react";
import { useExtractorStore } from "../store/useExtractorStore";
import { OopRulesEngine } from "../lib/oopRulesEngine";
import { FormulaEvaluator, parseCellKeyString, cellKeyToString, extractDependencies } from "../lib/formulaEvaluator";
import { TrendingUp, FileText, Sliders, RefreshCw, Eye, Download, Info, BarChart2, PieChart } from "lucide-react";

export default function GraphAgent() {
  const isLoaded = useExtractorStore((state) => state.isLoaded);
  const isOopModel = useExtractorStore((state) => state.isOopModel);
  const oopRules = useExtractorStore((state) => state.oopRules);
  const oopRequestContextString = useExtractorStore((state) => state.oopRequestContextString);
  const oopFinalContext = useExtractorStore((state) => state.oopFinalContext);

  // Standard Spreadsheet properties
  const sheets = useExtractorStore((state) => state.sheets);
  const cellDb = useExtractorStore((state) => state.cellDb);
  const inputs = useExtractorStore((state) => state.inputs);
  const formulas = useExtractorStore((state) => state.formulas);
  const simulatedValues = useExtractorStore((state) => state.simulatedValues);
  const calculationOrder = useExtractorStore((state) => state.calculationOrder);

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

  // States
  const [sweepDimension, setSweepDimension] = useState<"ProtectionClass" | "Deductible" | "CoverageA">("ProtectionClass");
  
  // Custom cell sweep states for standard spreadsheets
  const [selectedInputKey, setSelectedInputKey] = useState("");
  const [selectedOutputKey, setSelectedOutputKey] = useState("");
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number } | null>(null);

  // Initialize selected input and output keys for standard spreadsheets
  useEffect(() => {
    if (!isOopModel && inputs.length > 0) {
      setSelectedInputKey(inputs[0]);
    }
  }, [inputs, isOopModel]);

  useEffect(() => {
    if (!isOopModel) {
      if (outputCells.length > 0) {
        setSelectedOutputKey(outputCells[0]);
      } else if (formulas.length > 0) {
        setSelectedOutputKey(formulas[formulas.length - 1]);
      }
    }
  }, [formulas, outputCells, isOopModel]);

  if (!isLoaded) return null;

  // 1. Check if the spreadsheet has any summary metrics/charts-compatible tables
  const getAutoChartData = () => {
    try {
      if (isOopModel) return null;

      // Look for a sheet containing product sales/revenue data (usually named "Summary" or "Sales")
      const targetSheet = sheets.find(s => s.name.toLowerCase() === "summary" || s.name.toLowerCase() === "sales") || sheets[0];
      if (!targetSheet) return null;

      // Scan cells to reconstruct a 2D grid matrix
      const maxRow = Math.min(targetSheet.rowCount, 50);
      const maxCol = Math.min(targetSheet.colCount, 15);
      const grid: any[][] = Array.from({ length: maxRow }, () => Array(maxCol).fill(""));

      Object.keys(targetSheet.cells).forEach(ref => {
        const match = ref.match(/^([A-Z]+)([0-9]+)$/i);
        if (match) {
          const colLabel = match[1].toUpperCase();
          let colIdx = 0;
          for (let i = 0; i < colLabel.length; i++) {
            colIdx = colIdx * 26 + (colLabel.charCodeAt(i) - 64);
          }
          colIdx--; // 0-based
          const rowIdx = parseInt(match[2], 10) - 1; // 0-based
          
          if (rowIdx < maxRow && colIdx < maxCol) {
            const cellKey = cellKeyToString(targetSheet.name, ref);
            grid[rowIdx][colIdx] = simulatedValues[cellKey] ?? targetSheet.cells[ref].value;
          }
        }
      });

      // Find the header row (has cells like ProductID, Product Name, TotalQtySold, TotalRevenue)
      let headerRowIndex = -1;
      let headers: string[] = [];

      for (let r = 0; r < maxRow; r++) {
        const row = grid[r];
        const hasProductId = row.some(cell => {
          const text = String(cell || "").toLowerCase();
          return text.includes("productid") || text.includes("productname") || text.includes("product id") || text.includes("item");
        });
        if (hasProductId) {
          headerRowIndex = r;
          headers = row.map(c => String(c || "").trim());
          break;
        }
      }

      if (headerRowIndex === -1) return null;

      // Extract data rows below the headers until a grand total or empty row
      const dataRows: any[][] = [];
      for (let r = headerRowIndex + 1; r < maxRow; r++) {
        const row = grid[r];
        const firstCell = String(row[0] || "").trim();
        const secondCell = String(row[1] || "").trim();
        if (firstCell.toLowerCase().includes("total") || firstCell.toLowerCase().includes("grand") || secondCell.toLowerCase().includes("total") || (firstCell === "" && secondCell === "")) {
          break;
        }
        dataRows.push(row);
      }

      if (dataRows.length === 0) return null;

      // Identify target column indices
      const prodNameIdx = headers.findIndex(h => h.toLowerCase().includes("productname") || h.toLowerCase().includes("product name"));
      const prodIdIdx = headers.findIndex(h => h.toLowerCase().includes("productid") || h.toLowerCase().includes("product id") || h.toLowerCase().includes("id"));
      const qtyIdx = headers.findIndex(h => h.toLowerCase().includes("qty") || h.toLowerCase().includes("quantity") || h.toLowerCase().includes("sold"));
      const revIdx = headers.findIndex(h => h.toLowerCase().includes("revenue") || h.toLowerCase().includes("sales") || h.toLowerCase().includes("totalrevenue") || h.toLowerCase().includes("amount"));
      const discountIdx = headers.findIndex(h => h.toLowerCase().includes("discount") || h.toLowerCase().includes("given"));

      const nameColIdx = prodNameIdx !== -1 ? prodNameIdx : (prodIdIdx !== -1 ? prodIdIdx : 0);
      const valColIdx = revIdx !== -1 ? revIdx : (qtyIdx !== -1 ? qtyIdx : 1);

      const items = dataRows.map(row => {
        const name = String(row[nameColIdx] || "");
        const value = Number(String(row[valColIdx] || "0").replace(/[^0-9.-]/g, "")) || 0;
        const qty = qtyIdx !== -1 ? Number(String(row[qtyIdx] || "0").replace(/[^0-9.-]/g, "")) || 0 : 0;
        const discount = discountIdx !== -1 ? Number(String(row[discountIdx] || "0").replace(/[^0-9.-]/g, "")) || 0 : 0;
        return { name, value, qty, discount };
      }).filter(item => item.name !== "");

      return {
        sheetName: targetSheet.name,
        categoryName: headers[nameColIdx] || "Product",
        valueName: headers[valColIdx] || "Total Revenue",
        items
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const autoChartData = getAutoChartData();

  // 2. Fallback Sensitivity Sweep logic
  const getSweepData = () => {
    try {
      if (isOopModel) {
        const parsedReq = JSON.parse(oopRequestContextString || "{}");
        const engine = new OopRulesEngine(oopRules);
        const points: { x: number; y: number }[] = [];

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
          // Sweep CoverageA
          const coverages = [50000, 100000, 150000, 200000, 250000, 300000, 400000, 500000];
          coverages.forEach((cov) => {
            const tempReq = { ...parsedReq, COVERAGEA: `$${cov.toLocaleString()}` };
            const { finalContext } = engine.run(tempReq);
            const premium = finalContext["BasicPremium"] ?? finalContext["BaseRate"] ?? 0;
            points.push({ x: cov, y: Number(premium) || 0 });
          });
        }
        return points;
      } else {
        const sweepInput = selectedInputKey || inputs[0];
        const targetOutput = selectedOutputKey || (outputCells[0] || formulas[formulas.length - 1]);
        if (!sweepInput || !targetOutput) return [];

        const points: { x: number; y: number }[] = [];
        const rawBase = String(simulatedValues[sweepInput] ?? cellDb[sweepInput]?.value ?? "10");
        const cleanBase = Number(rawBase.replace(/[^0-9.-]/g, ""));
        const baseVal = isNaN(cleanBase) || cleanBase === 0 ? 10 : cleanBase;

        for (let i = 1; i <= 8; i++) {
          const testVal = baseVal * (0.5 + i * 0.25);
          const nextSimulatedValues = {
            ...simulatedValues,
            [sweepInput]: testVal,
          };

          const evaluator = new FormulaEvaluator(nextSimulatedValues);
          calculationOrder.forEach((formulaKey) => {
            const cell = cellDb[formulaKey];
            if (cell && cell.formula) {
              const parsedKey = parseCellKeyString(formulaKey);
              nextSimulatedValues[formulaKey] = evaluator.evaluate(cell.formula, parsedKey.sheetName);
            }
          });

          const rawOutput = String(nextSimulatedValues[targetOutput] ?? 0);
          const cleanOutput = Number(rawOutput.replace(/[^0-9.-]/g, ""));
          points.push({ x: testVal, y: isNaN(cleanOutput) ? 0 : cleanOutput });
        }
        return points;
      }
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const sweepPoints = getSweepData();

  // SVG Chart Dimensions
  const svgWidth = 600;
  const svgHeight = 280;
  const padding = 50;
  const plotWidth = svgWidth - 2 * padding;
  const plotHeight = svgHeight - 2 * padding;

  const xValues = sweepPoints.map((p) => p.x);
  const yValues = sweepPoints.map((p) => p.y);
  
  const xMin = sweepPoints.length > 0 ? Math.min(...xValues) : 0;
  const xMax = sweepPoints.length > 0 ? Math.max(...xValues) : 10;
  
  const allYMin = sweepPoints.length > 0 ? Math.min(...yValues) : 0;
  const allYMax = sweepPoints.length > 0 ? Math.max(...yValues) : 100;
  
  const yMin = Math.max(0, sweepPoints.length > 0 ? (allYMin === allYMax ? allYMin * 0.5 : allYMin * 0.9) : 0);
  const yMax = sweepPoints.length > 0 ? (allYMin === allYMax ? (allYMax === 0 ? 100 : allYMax * 1.5) : allYMax * 1.1) : 100;

  const getSvgCoords = (x: number, y: number) => {
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
    pathD = `M ${startCoord.x} ${startCoord.y}`;
    areaD = `M ${startCoord.x} ${padding + plotHeight} L ${startCoord.x} ${startCoord.y}`;

    for (let i = 1; i < sweepPoints.length; i++) {
      const coord = getSvgCoords(sweepPoints[i].x, sweepPoints[i].y);
      pathD += ` L ${coord.x} ${coord.y}`;
      areaD += ` L ${coord.x} ${coord.y}`;
    }

    const endCoord = getSvgCoords(sweepPoints[sweepPoints.length - 1].x, sweepPoints[sweepPoints.length - 1].y);
    areaD += ` L ${endCoord.x} ${padding + plotHeight} Z`;
  }

  // Statistics calculation for the business report card
  const avgPremium = yValues.length > 0 ? Math.round(yValues.reduce((a, b) => a + b, 0) / yValues.length) : 0;
  const maxPremium = yValues.length > 0 ? Math.round(Math.max(...yValues)) : 0;
  const minPremium = yValues.length > 0 ? Math.round(Math.min(...yValues)) : 0;

  const formatCellLabel = (key: string) => {
    if (!key) return "";
    const parsed = parseCellKeyString(key);
    return `${parsed.sheetName}!${parsed.ref}`;
  };

  // Render original spreadsheet graphs if autoChartData is parsed
  if (autoChartData) {
    const items = autoChartData.items;
    const totalVal = items.reduce((sum, item) => sum + item.value, 0) || 1;

    // Bar Chart drawing parameters
    const barWidth = 45;
    const barSpacing = 25;
    const barChartHeight = 220;
    const maxBarVal = Math.max(...items.map(item => item.value)) * 1.1 || 100;

    // Pie Chart drawing parameters (Radius = 80, Center = 280, 160)
    const pieRadius = 80;
    const cx = 280;
    const cy = 160;
    
    // Sleek premium colors for pie slices
    const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];

    let cumulativeAngle = 0;

    return (
      <div className="space-y-6">
        
        {/* Header Title */}
        <div className="bg-white border border-gray-200 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" /> Summary Report
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
              Automatically identified and rendered {items.length} product revenue metrics from sheet &quot;{autoChartData.sheetName}&quot;.
            </p>
          </div>
          <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-100 uppercase tracking-wider">
            Excel Charts Identified
          </span>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 1. Bar Chart: Revenue by Product */}
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col">
            <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <BarChart2 className="h-4.5 w-4.5 text-emerald-500" /> Revenue by Product
            </h4>

            <div className="flex-1 flex justify-center items-end py-6 min-h-[250px] overflow-x-auto pr-1">
              <svg width={(barWidth + barSpacing) * items.length + 80} height={barChartHeight + 40} className="overflow-visible select-none">
                {/* Horizontal grid lines */}
                {Array.from({ length: 5 }).map((_, idx) => {
                  const val = (idx / 4) * maxBarVal;
                  const y = barChartHeight - (val / maxBarVal) * barChartHeight + 20;
                  return (
                    <g key={idx}>
                      <line x1="45" y1={y} x2={(barWidth + barSpacing) * items.length + 50} y2={y} stroke="#f3f4f6" strokeWidth="1" />
                      <text x="35" y={y + 3} textAnchor="end" className="font-mono text-[9px] fill-gray-400 font-bold">${Math.round(val)}</text>
                    </g>
                  );
                })}

                {/* Bars */}
                {items.map((item, idx) => {
                  const x = 55 + idx * (barWidth + barSpacing);
                  const barHeight = (item.value / maxBarVal) * barChartHeight;
                  const y = barChartHeight - barHeight + 20;

                  return (
                    <g key={idx} className="group">
                      {/* Column Bar */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(barHeight, 2)}
                        rx="4"
                        fill="url(#barGrad)"
                        className="cursor-pointer transition-all hover:opacity-90"
                      />
                      {/* Value label on top of bar */}
                      <text
                        x={x + barWidth / 2}
                        y={y - 6}
                        textAnchor="middle"
                        className="font-mono text-[9px] font-bold fill-gray-800"
                      >
                        ${item.value.toFixed(2)}
                      </text>
                      {/* Product Name Label on X axis */}
                      <text
                        x={x + barWidth / 2}
                        y={barChartHeight + 35}
                        textAnchor="middle"
                        className="font-sans text-[8px] fill-gray-400 font-bold uppercase tracking-wider"
                      >
                        {item.name.length > 10 ? `${item.name.slice(0, 9)}..` : item.name}
                      </text>
                      <title>{item.name}: ${item.value.toFixed(2)}</title>
                    </g>
                  );
                })}

                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* 2. Pie Chart: Revenue Share */}
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4 col-span-1 lg:col-span-2">
            <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <PieChart className="h-4.5 w-4.5 text-emerald-500" /> Revenue Share by Product
            </h4>

            <div className="flex flex-col items-center justify-center py-6 min-h-[350px]">
              {/* SVG Pie Chart with Labels */}
              <svg width="560" height="320" className="overflow-visible select-none max-w-full">
                {items.map((item, idx) => {
                  const percent = item.value / totalVal;
                  const angle = percent * 360;
                  
                  const startAngle = cumulativeAngle;
                  const endAngle = cumulativeAngle + angle;
                  const midAngle = cumulativeAngle + angle / 2;
                  
                  const x1 = cx + pieRadius * Math.cos((startAngle - 90) * Math.PI / 180);
                  const y1 = cy + pieRadius * Math.sin((startAngle - 90) * Math.PI / 180);
                  const x2 = cx + pieRadius * Math.cos((endAngle - 90) * Math.PI / 180);
                  const y2 = cy + pieRadius * Math.sin((endAngle - 90) * Math.PI / 180);
                  
                  cumulativeAngle = endAngle;
                  
                  const largeArcFlag = angle > 180 ? 1 : 0;
                  const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${pieRadius} ${pieRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                  const color = colors[idx % colors.length];

                  // Label lines
                  const rad = (midAngle - 90) * Math.PI / 180;
                  const bx = cx + (pieRadius + 4) * Math.cos(rad);
                  const by = cy + (pieRadius + 4) * Math.sin(rad);
                  const lx = cx + (pieRadius + 24) * Math.cos(rad);
                  const ly = cy + (pieRadius + 24) * Math.sin(rad);
                  const textAnchor = lx < cx ? "end" : "start";

                  return (
                    <g key={idx}>
                      <path
                        d={pathData}
                        fill={color}
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all hover:opacity-95 cursor-pointer"
                      >
                        <title>{item.name}: ${(percent * 100).toFixed(1)}%</title>
                      </path>
                      
                      {/* Pointer line */}
                      <line
                        x1={bx}
                        y1={by}
                        x2={lx}
                        y2={ly}
                        stroke="#9ca3af"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                      />

                      {/* Multiline excel label */}
                      <text
                        x={lx}
                        y={ly}
                        textAnchor={textAnchor}
                        className="font-sans text-[8.5px] fill-gray-500 font-extrabold"
                      >
                        <tspan x={lx} dy="-8">{autoChartData.valueName} ;</tspan>
                        <tspan x={lx} dy="10.5">{item.name};</tspan>
                        <tspan x={lx} dy="10.5" className="fill-emerald-600 font-mono">${item.value.toFixed(2)}; {Math.round(percent * 100)}%</tspan>
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

        </div>

      </div>
    );
  }

  // Else, fallback to standard sweep sensitivity curve chart
  return (
    <div className="space-y-6">
      
      {/* Header Title */}
      <div className="bg-white border border-gray-200 p-5 rounded-3xl shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" /> Summary Report
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
            Visualize sensitivity curves and business rule sweeps directly in-memory.
          </p>
        </div>

        {/* Dynamic Sweep Selectors */}
        {isOopModel ? (
          <div className="flex gap-2 shrink-0">
            <select
              value={sweepDimension}
              onChange={(e) => setSweepDimension(e.target.value as any)}
              className="px-3.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-emerald-500 transition-colors shadow-3xs cursor-pointer"
            >
              <option value="ProtectionClass">Sweep: Protection Class</option>
              <option value="Deductible">Sweep: Deductibles</option>
              <option value="CoverageA">Sweep: Coverage A Limit</option>
            </select>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase font-sans">Sweep Input:</span>
              <select
                value={selectedInputKey}
                onChange={(e) => setSelectedInputKey(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-3xs"
              >
                {inputs.map((ip) => (
                  <option key={ip} value={ip}>
                    {formatCellLabel(ip)} ({simulatedValues[ip] !== undefined ? String(simulatedValues[ip]) : cellDb[ip]?.value || "0"})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase font-sans">Output Plot:</span>
              <select
                value={selectedOutputKey}
                onChange={(e) => setSelectedOutputKey(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-3xs"
              >
                {outputCells.map((op) => (
                  <option key={op} value={op}>
                    [Outcome] {formatCellLabel(op)}
                  </option>
                ))}
                {formulas.filter(f => !outputCells.includes(f)).map((op) => (
                  <option key={op} value={op}>
                    [Formula] {formatCellLabel(op)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* SVG Graph View (2/3 width) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
              {isOopModel 
                ? `Sensitivity Sweep Plot: ${sweepDimension} vs Pricing Outcome`
                : `Sensitivity Sweep Plot: ${formatCellLabel(selectedInputKey)} vs ${formatCellLabel(selectedOutputKey)}`
              }
            </span>
            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100">
              Interactive SVG Graph
            </span>
          </div>

          <div className="relative flex justify-center">
            {sweepPoints.length > 0 ? (
              <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
                <defs>
                  <linearGradient id="sweepGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y Axis Grid Lines */}
                {Array.from({ length: 5 }).map((_, idx) => {
                  const yVal = yMin + (idx / 4) * (yMax - yMin);
                  const coord = getSvgCoords(xMin, yVal);
                  return (
                    <g key={idx}>
                      <line
                        x1={padding}
                        y1={coord.y}
                        x2={padding + plotWidth}
                        y2={coord.y}
                        stroke="#f3f4f6"
                        strokeWidth="1.2"
                      />
                      <text
                        x={padding - 10}
                        y={coord.y + 3}
                        textAnchor="end"
                        className="font-sans text-[8px] fill-gray-400 font-bold"
                      >
                        ${Math.round(yVal)}
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Coordinates */}
                {sweepPoints.map((p, idx) => {
                  const coord = getSvgCoords(p.x, yMin);
                  const shouldRenderLabel = sweepPoints.length < 12 || idx % 2 === 0;
                  return (
                    shouldRenderLabel && (
                      <g key={idx}>
                        <line
                          x1={coord.x}
                          y1={padding + plotHeight}
                          x2={coord.x}
                          y2={padding + plotHeight + 4}
                          stroke="#d1d5db"
                          strokeWidth="1"
                        />
                        <text
                          x={coord.x}
                          y={padding + plotHeight + 14}
                          textAnchor="middle"
                          className="font-sans text-[8px] fill-gray-400 font-bold"
                        >
                          {isOopModel && sweepDimension === "CoverageA" 
                            ? `$${(p.x / 1000)}k` 
                            : typeof p.x === "number" && p.x > 1000 
                            ? `${Math.round(p.x)}` 
                            : p.x.toFixed(1).replace(/\.0$/, "")
                          }
                        </text>
                      </g>
                    )
                  );
                })}

                {/* Area Gradient under line */}
                {yMax > yMin && <path d={areaD} fill="url(#sweepGrad)" />}

                {/* Line Path */}
                <path d={pathD} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                {/* Markers */}
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
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredPoint(p)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}

                {/* Interactive Tooltip bubble */}
                {hoveredPoint && (
                  <g>
                    <rect
                      x={getSvgCoords(hoveredPoint.x, hoveredPoint.y).x - 55}
                      y={getSvgCoords(hoveredPoint.x, hoveredPoint.y).y - 32}
                      width="110"
                      height="22"
                      rx="6"
                      fill="#1f2937"
                    />
                    <text
                      x={getSvgCoords(hoveredPoint.x, hoveredPoint.y).x}
                      y={getSvgCoords(hoveredPoint.x, hoveredPoint.y).y - 18}
                      textAnchor="middle"
                      fill="#ffffff"
                      className="font-mono text-[9px] font-bold"
                    >
                      {hoveredPoint.x.toFixed(1).replace(/\.0$/, "")} → ${Math.round(hoveredPoint.y)}
                    </text>
                  </g>
                )}
              </svg>
            ) : (
              <p className="text-xs text-gray-400 py-16">No sweep data generated yet.</p>
            )}
          </div>
        </div>

        {/* Business Report Card (1/3 width) */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-emerald-500" /> Executive Report Card
            </h4>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-2xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase font-sans">Min Outcome Value</span>
              <span className="text-xs font-extrabold font-mono text-emerald-600">${minPremium}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-2xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase font-sans">Max Outcome Value</span>
              <span className="text-xs font-extrabold font-mono text-emerald-600">${maxPremium}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-2xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase font-sans">Average Sweep Value</span>
              <span className="text-xs font-extrabold font-mono text-emerald-600">${avgPremium}</span>
            </div>

            <div className="p-3.5 bg-emerald-50/45 border border-emerald-100 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1.5 font-sans">
                <Info className="h-4 w-4 text-emerald-500" /> Pricing Sensitivity Insights
              </span>
              <p className="text-[10px] text-emerald-700 leading-relaxed font-sans">
                {isOopModel ? (
                  sweepDimension === "ProtectionClass" 
                    ? "Protection class changes directly alter rating factors. Higher protective services reduce structural premiums dynamically."
                    : sweepDimension === "Deductible"
                    ? "Opting for higher deductible levels reduces base underwriting risk exposures, lowering pricing rates linearly."
                    : "Increasing the limit of liability raises building exposures, triggering base premiums expansion."
                ) : (
                  "Sweeping spreadsheet inputs triggers the topological formula dependency engine. Changing input cell values cascades down, modifying target outcomes instantaneously."
                )}
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
