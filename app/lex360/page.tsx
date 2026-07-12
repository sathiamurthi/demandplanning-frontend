"use client";

import React, { useState, useEffect } from "react";
import { useExtractorStore } from "./store/useExtractorStore";
import FileUploader from "./components/FileUploader";
import DashboardStats from "./components/DashboardStats";
import LogicExplorer from "./components/LogicExplorer";
import InteractiveSimulator from "./components/InteractiveSimulator";
import LogicExporter from "./components/LogicExporter";
import WebAppAgent from "./components/WebAppAgent";
import OopRequestSimulator from "./components/OopRequestSimulator";
import OopLogicExplorer from "./components/OopLogicExplorer";
import GraphAgent from "./components/GraphAgent";
import { Brain, Cpu, Database, Settings, BarChart2 } from "lucide-react";

export default function Home() {
  const isLoaded = useExtractorStore((state) => state.isLoaded);
  const isAppAgentMode = useExtractorStore((state) => state.isAppAgentMode);
  const toggleAppAgentMode = useExtractorStore((state) => state.toggleAppAgentMode);
  const isOopModel = useExtractorStore((state) => state.isOopModel);

  // States for toggling agent displays from the right panel
  const [isFileExtractorActive, setIsFileExtractorActive] = useState(true);
  const [isDataExtractorActive, setIsDataExtractorActive] = useState(true);
  const [isAppAgentActive, setIsAppAgentActive] = useState(false);
  const [isJsonAgentActive, setIsJsonAgentActive] = useState(true);
  const [isWebAppAgentActive, setIsWebAppAgentActive] = useState(false); // Controls Web Application Agent display
  const [isGraphAgentActive, setIsGraphAgentActive] = useState(false); // Controls Summary Agent display

  // Sync the Application Agent checkbox with store rule editing flag
  useEffect(() => {
    if (isAppAgentActive && !isAppAgentMode) {
      toggleAppAgentMode();
    } else if (!isAppAgentActive && isAppAgentMode) {
      toggleAppAgentMode();
    }
  }, [isAppAgentActive]);

  // Sync state if store gets reset/cleared
  useEffect(() => {
    if (!isLoaded) {
      setIsAppAgentActive(false);
      setIsWebAppAgentActive(false);
      setIsGraphAgentActive(false);
    }
  }, [isLoaded]);

  // Determine active tab based on what's enabled
  const [activeTab, setActiveTab] = useState<"simulation" | "logic" | "exporter" | "webapp" | "graph">("simulation");

  // Keep active tab relevant if tabs are toggled off
  useEffect(() => {
    if (isAppAgentActive) {
      setActiveTab("simulation");
    } else if (isDataExtractorActive) {
      setActiveTab("logic");
    } else if (isGraphAgentActive) {
      setActiveTab("graph");
    } else if (isWebAppAgentActive) {
      setActiveTab("webapp");
    } else if (isJsonAgentActive) {
      setActiveTab("exporter");
    }
  }, [isAppAgentActive, isDataExtractorActive, isJsonAgentActive, isWebAppAgentActive, isGraphAgentActive]);

  return (
    <div className="min-h-screen bg-gray-50/65 text-gray-900 flex flex-col font-sans select-none antialiased">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center border border-emerald-400/20 shadow-sm">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider text-gray-900 flex items-center gap-1.5">
                LEX <span className="text-[10px] font-bold text-emerald-600 border border-emerald-500/20 px-1.5 py-0.2 rounded bg-emerald-50">v1.2</span>
              </h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                Legacy Excel Extractor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:flex items-center text-[10px] font-bold tracking-wider text-gray-500 uppercase gap-1.5 bg-gray-100 border border-gray-200 px-2.5 py-1.5 rounded-xl">
              <Cpu className="h-3.5 w-3.5 text-emerald-500" /> In-Memory Client Only
            </span>
            <span className="hidden md:flex items-center text-[10px] font-bold tracking-wider text-gray-500 uppercase gap-1.5 bg-gray-100 border border-gray-200 px-2.5 py-1.5 rounded-xl">
              <Database className="h-3.5 w-3.5 text-emerald-500" /> Zero Storage Server
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* LANDING / UPLOAD VIEW (FileUploader + Processing Agents Checkbox sidebar) */}
        {!isLoaded && (
          <div className="space-y-8 py-6">
            <div className="max-w-xl mx-auto text-center space-y-4">
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Turn Legacy Spreadsheets into Interactive Applications
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
                Upload spreadsheets or ZIP archives containing .xlsx models. LEX parses formulas, maps downstream cell dependencies, and generates a simulator dynamically.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-5xl mx-auto">
              <div className="lg:col-span-2">
                <FileUploader />
              </div>
              
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-3xl shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-emerald-500" /> Processing agents
                </h3>
                <div className="space-y-3">
                  
                  {/* File Info Extractor */}
                  <label className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow transition-shadow select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFileExtractorActive}
                      onChange={() => setIsFileExtractorActive(!isFileExtractorActive)}
                      className="accent-emerald-500 rounded border-gray-300 h-4 w-4 bg-gray-50 cursor-pointer mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">File Info Extractor</span>
                      <span className="text-[10px] text-gray-400 leading-normal mt-0.5 block">
                        Extract spreadsheet structure and stats.
                      </span>
                    </div>
                  </label>

                  {/* Data Extractor Agent */}
                  <label className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow transition-shadow select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDataExtractorActive}
                      onChange={() => setIsDataExtractorActive(!isDataExtractorActive)}
                      className="accent-emerald-500 rounded border-gray-300 h-4 w-4 bg-gray-50 cursor-pointer mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Data Extractor Agent</span>
                      <span className="text-[10px] text-gray-400 leading-normal mt-0.5 block">
                        Parse formula logic, grids, and cells.
                      </span>
                    </div>
                  </label>

                  {/* Application Agent */}
                  <label className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow transition-shadow select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAppAgentActive}
                      onChange={() => setIsAppAgentActive(!isAppAgentActive)}
                      className="accent-emerald-500 rounded border-gray-300 h-4 w-4 bg-gray-50 cursor-pointer mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Application Agent</span>
                      <span className="text-[10px] text-gray-400 leading-normal mt-0.5 block">
                        Enable dynamic rule editing and recalculation.
                      </span>
                    </div>
                  </label>

                  {/* Web Application Agent */}
                  <label className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow transition-shadow select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isWebAppAgentActive}
                      onChange={() => setIsWebAppAgentActive(!isWebAppAgentActive)}
                      className="accent-emerald-500 rounded border-gray-300 h-4 w-4 bg-gray-50 cursor-pointer mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Web Application Agent</span>
                      <span className="text-[10px] text-gray-400 leading-normal mt-0.5 block">
                        Compile spreadsheet logic into a standalone web app.
                      </span>
                    </div>
                  </label>

                  {/* Summary Agent Checkbox */}
                  <label className="flex items-start gap-3 p-4 bg-white border border-emerald-100/50 rounded-2xl shadow-sm hover:shadow transition-shadow select-none cursor-pointer ring-2 ring-emerald-500/10">
                    <input
                      type="checkbox"
                      checked={isGraphAgentActive}
                      onChange={() => setIsGraphAgentActive(!isGraphAgentActive)}
                      className="accent-emerald-500 rounded border-gray-300 h-4 w-4 bg-gray-50 cursor-pointer mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Summary Agent</span>
                      <span className="text-[10px] text-emerald-600 font-semibold leading-normal mt-0.5 block">
                        Generate summary reports and sensitivity curves.
                      </span>
                    </div>
                  </label>

                  {/* jsonAgent */}
                  <label className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow transition-shadow select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isJsonAgentActive}
                      onChange={() => setIsJsonAgentActive(!isJsonAgentActive)}
                      className="accent-emerald-500 rounded border-gray-300 h-4 w-4 bg-gray-50 cursor-pointer mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">jsonAgent</span>
                      <span className="text-[10px] text-gray-400 leading-normal mt-0.5 block">
                        Generate JSON/XML logic rules configuration.
                      </span>
                    </div>
                  </label>

                </div>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD DETAILS VIEW (Split layout once spreadsheet is loaded) */}
        {isLoaded && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start mt-6 animate-in fade-in duration-300">
            
            {/* Left Area: Main Extractor outputs (3/4 width) */}
            <div className="lg:col-span-3 space-y-8">
              
              {/* Uploader indicator (stays for fast resetting/re-uploading) */}
              <FileUploader />

              {/* Stats: shown if File Info Extractor is checked */}
              {isFileExtractorActive && !isOopModel && <DashboardStats />}

              {/* Exporter: shown if jsonAgent is checked */}
              {isJsonAgentActive && !isOopModel && <LogicExporter />}

              {/* Dynamic Dashboard Tabs */}
              <div className="border-b border-gray-200 flex gap-4">
                {isAppAgentActive && (
                  <button
                    onClick={() => setActiveTab("simulation")}
                    className={`py-3 text-xs font-extrabold border-b-2 px-1 transition-all ${
                      activeTab === "simulation"
                        ? "border-emerald-500 text-emerald-600"
                        : "border-transparent text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    {isOopModel ? "OOP Rating Simulator" : "Simulation Sandbox"}
                  </button>
                )}
                {isDataExtractorActive && (
                  <button
                    onClick={() => setActiveTab("logic")}
                    className={`py-3 text-xs font-extrabold border-b-2 px-1 transition-all ${
                      activeTab === "logic"
                        ? "border-emerald-500 text-emerald-600"
                        : "border-transparent text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    {isOopModel ? "OOP Rules Explorer" : "Logic Grid & Explorer"}
                  </button>
                )}
                {isGraphAgentActive && (
                  <button
                    onClick={() => setActiveTab("graph")}
                    className={`py-3 text-xs font-extrabold border-b-2 px-1 transition-all ${
                      activeTab === "graph"
                        ? "border-emerald-500 text-emerald-600"
                        : "border-transparent text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    Summary
                  </button>
                )}
                {isWebAppAgentActive && (
                  <button
                    onClick={() => setActiveTab("webapp")}
                    className={`py-3 text-xs font-extrabold border-b-2 px-1 transition-all ${
                      activeTab === "webapp"
                        ? "border-emerald-500 text-emerald-600"
                        : "border-transparent text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    Web Application Agent
                  </button>
                )}
                {isJsonAgentActive && !isAppAgentActive && !isDataExtractorActive && !isWebAppAgentActive && !isGraphAgentActive && (
                  <button
                    onClick={() => setActiveTab("exporter")}
                    className={`py-3 text-xs font-extrabold border-b-2 px-1 transition-all ${
                      activeTab === "exporter"
                        ? "border-emerald-500 text-emerald-600"
                        : "border-transparent text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    Logic Exports
                  </button>
                )}
              </div>

              {/* Tab panel dispatcher */}
              <div className="pb-16">
                {activeTab === "simulation" && isAppAgentActive && (
                  isOopModel ? <OopRequestSimulator /> : <InteractiveSimulator />
                )}
                {activeTab === "logic" && isDataExtractorActive && (
                  isOopModel ? <OopLogicExplorer /> : <LogicExplorer />
                )}
                {activeTab === "graph" && isGraphAgentActive && <GraphAgent />}
                {activeTab === "webapp" && isWebAppAgentActive && <WebAppAgent />}
                {activeTab === "exporter" && isJsonAgentActive && (
                  <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                    <p className="text-xs text-gray-500">
                      Use the Export panel above to copy or download your logic models.
                    </p>
                  </div>
                )}
                {!isAppAgentActive && !isDataExtractorActive && !isJsonAgentActive && !isWebAppAgentActive && !isGraphAgentActive && (
                  <div className="p-8 text-center bg-white border border-gray-200 rounded-3xl text-gray-400 text-xs">
                    Please check one of the &quot;Processing agents&quot; boxes on the right panel to show interactive results.
                  </div>
                )}
              </div>

            </div>

            {/* Right Area: Control Panel (1/4 width) */}
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-3xl shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Processing agents</h3>
                <p className="text-[10px] text-gray-400 leading-normal">
                  Toggle checkboxes below to filter dashboard widgets and compile static web application builds.
                </p>
              </div>
              
              <div className="space-y-3">
                {/* File Info Extractor */}
                <label className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow transition-shadow select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFileExtractorActive}
                    onChange={() => setIsFileExtractorActive(!isFileExtractorActive)}
                    className="accent-emerald-500 rounded border-gray-300 h-4 w-4 bg-gray-50 cursor-pointer mt-0.5"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-gray-800 block">File Info Extractor</span>
                    <span className="text-[9px] text-gray-400 leading-normal mt-0.5 block">
                      Spreadsheet metadata summary cards.
                    </span>
                  </div>
                </label>

                {/* Data Extractor Agent */}
                <label className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow transition-shadow select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDataExtractorActive}
                    onChange={() => setIsDataExtractorActive(!isDataExtractorActive)}
                    className="accent-emerald-500 rounded border-gray-300 h-4 w-4 bg-gray-50 cursor-pointer mt-0.5"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-gray-800 block">Data Extractor Agent</span>
                    <span className="text-[9px] text-gray-400 leading-normal mt-0.5 block">
                      Parsed formula grid list and sheet layout.
                    </span>
                  </div>
                </label>

                {/* Application Agent */}
                <label className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow transition-shadow select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAppAgentActive}
                    onChange={() => setIsAppAgentActive(!isAppAgentActive)}
                    className="accent-emerald-500 rounded border-gray-300 h-4 w-4 bg-gray-50 cursor-pointer mt-0.5"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-gray-800 block">Application Agent</span>
                    <span className="text-[9px] text-gray-400 leading-normal mt-0.5 block">
                      Enable dynamic rule editing and recalculation.
                    </span>
                  </div>
                </label>

                {/* Web Application Agent */}
                <label className="flex items-start gap-3 p-3 bg-white border border-emerald-100/55 rounded-2xl shadow-sm hover:shadow transition-shadow select-none cursor-pointer ring-2 ring-emerald-500/10">
                  <input
                    type="checkbox"
                    checked={isWebAppAgentActive}
                    onChange={() => setIsWebAppAgentActive(!isWebAppAgentActive)}
                    className="accent-emerald-500 rounded border-gray-300 h-4 w-4 bg-gray-50 cursor-pointer mt-0.5"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-gray-800 block">Web Application Agent</span>
                    <span className="text-[9px] text-emerald-600 font-semibold leading-normal mt-0.5 block">
                      Compile Excel logic into online Next.js app.
                    </span>
                  </div>
                </label>

                {/* Summary Agent Checkbox */}
                <label className="flex items-start gap-3 p-3 bg-white border border-emerald-100/55 rounded-2xl shadow-sm hover:shadow transition-shadow select-none cursor-pointer ring-2 ring-emerald-500/10">
                  <input
                    type="checkbox"
                    checked={isGraphAgentActive}
                    onChange={() => setIsGraphAgentActive(!isGraphAgentActive)}
                    className="accent-emerald-500 rounded border-gray-300 h-4 w-4 bg-gray-50 cursor-pointer mt-0.5"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-gray-800 block">Summary Agent</span>
                    <span className="text-[9px] text-emerald-600 font-semibold leading-normal mt-0.5 block">
                      Summary reports and sensitivity curves.
                    </span>
                  </div>
                </label>

                {/* jsonAgent */}
                <label className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow transition-shadow select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isJsonAgentActive}
                    onChange={() => setIsJsonAgentActive(!isJsonAgentActive)}
                    className="accent-emerald-500 rounded border-gray-300 h-4 w-4 bg-gray-50 cursor-pointer mt-0.5"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-gray-800 block">jsonAgent</span>
                    <span className="text-[9px] text-gray-400 leading-normal mt-0.5 block">
                      Logical rules XML and JSON downloads.
                    </span>
                  </div>
                </label>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 bg-white text-center text-xs text-gray-400 font-medium mt-auto">
        <p>© 2026 LEX. Extracted completely in-memory inside your browser.</p>
      </footer>
    </div>
  );
}
