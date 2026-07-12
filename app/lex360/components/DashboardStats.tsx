"use client";

import React from "react";
import { useExtractorStore } from "../store/useExtractorStore";
import { Layers, GitCommit, Settings, AlertOctagon, HelpCircle as InfoIcon } from "lucide-react";

export default function DashboardStats() {
  const isLoaded = useExtractorStore((state) => state.isLoaded);
  const sheets = useExtractorStore((state) => state.sheets);
  const inputs = useExtractorStore((state) => state.inputs);
  const formulas = useExtractorStore((state) => state.formulas);
  const cyclicCells = useExtractorStore((state) => state.cyclicCells);

  if (!isLoaded) return null;

  const totalCellsCount = sheets.reduce((acc, sheet) => acc + Object.keys(sheet.cells).length, 0);

  const stats = [
    {
      name: "Sheets In Workbook",
      value: sheets.length,
      description: `${sheets.map(s => s.name).join(", ")}`,
      icon: Layers,
      color: "text-blue-500 bg-blue-50 border-blue-100",
    },
    {
      name: "Total Cells Extracted",
      value: totalCellsCount,
      description: "Parsed values and layouts",
      icon: GitCommit,
      color: "text-indigo-500 bg-indigo-50 border-indigo-100",
    },
    {
      name: "Business Logic Rules",
      value: formulas.length,
      description: "Formula equations parsed",
      icon: Settings,
      color: "text-violet-500 bg-violet-50 border-violet-100",
    },
    {
      name: "Active Simulation Inputs",
      value: inputs.length,
      description: "Tweakable model parameters",
      icon: InfoIcon,
      color: "text-emerald-500 bg-emerald-50 border-emerald-100",
    },
  ];

  return (
    <div className="space-y-6">
      {cyclicCells.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs">
          <AlertOctagon className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <h4 className="font-bold text-amber-900">Circular Dependencies Detected!</h4>
            <p className="mt-1 text-amber-700 leading-relaxed">
              The following cells form an infinite calculation loop. Real-time recalculations for these cells might not evaluate correctly:{" "}
              <span className="font-mono bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-amber-900 text-[10px]">
                {cyclicCells.join(", ")}
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm relative overflow-hidden group hover:border-gray-300 transition-all"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {stat.name}
                </span>
                <div className="text-xl font-extrabold tracking-tight text-gray-800">
                  {stat.value}
                </div>
              </div>
              <div className={`p-2.5 rounded-xl border ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 truncate font-semibold">
              {stat.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
