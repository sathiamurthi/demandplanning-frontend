"use client";

import React, { useRef, useState, DragEvent, ChangeEvent } from "react";
import JSZip from "jszip";
import { useExtractorStore } from "../store/useExtractorStore";
import { parseXlsxWorkbook, parseXmlWorkbook, ParsedWorkbook } from "../lib/excelParser";
import { Upload, FileSpreadsheet, Archive, CheckCircle2, AlertTriangle, FileCode } from "lucide-react";

interface ExtractedFile {
  name: string;
  type: "xlsx" | "xml";
  data: ArrayBuffer | string;
}

type UploadMode = "files" | "zip";

export default function FileUploader() {
  const setWorkbook = useExtractorStore((state) => state.setWorkbook);
  const clearWorkbook = useExtractorStore((state) => state.clearWorkbook);
  const isLoaded = useExtractorStore((state) => state.isLoaded);
  const fileName = useExtractorStore((state) => state.fileName);
  const isLoading = useExtractorStore((state) => state.isLoading);

  const [mode, setMode] = useState<UploadMode>("files");
  const [dragActive, setDragActive] = useState(false);
  const [zipFiles, setZipFiles] = useState<ExtractedFile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setErrorMessage(null);
    setZipFiles([]);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setZipFiles([]);

    if (e.target.files && e.target.files[0]) {
      await processUploadedFile(e.target.files[0]);
    }
  };

  const processUploadedFile = async (file: File) => {
    setStatusMessage(`Reading file: ${file.name}...`);
    const name = file.name.toLowerCase();

    try {
      if (name.endsWith(".zip")) {
        setStatusMessage("Extracting zip file in memory...");
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        const files: ExtractedFile[] = [];

        for (const [filename, fileEntry] of Object.entries(loadedZip.files)) {
          if (fileEntry.dir) continue;

          const lowerFilename = filename.toLowerCase();
          if (lowerFilename.endsWith(".xlsx")) {
            const buffer = await fileEntry.async("arraybuffer");
            files.push({
              name: filename,
              type: "xlsx",
              data: buffer,
            });
          } else if (lowerFilename.endsWith(".xml")) {
            const text = await fileEntry.async("text");
            files.push({
              name: filename,
              type: "xml",
              data: text,
            });
          }
        }

        if (files.length === 0) {
          throw new Error("No spreadsheet files (.xlsx or .xml) found in the zip archive.");
        }

        setZipFiles(files);
        setStatusMessage(null);

        if (files.length === 1) {
          loadExtractedFile(files[0]);
        }
      } else if (name.endsWith(".xlsx")) {
        setStatusMessage("Parsing Excel workbook...");
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result instanceof ArrayBuffer) {
            const parsed = parseXlsxWorkbook(e.target.result, file.name);
            setWorkbook(parsed);
            setStatusMessage(null);
          }
        };
        reader.onerror = () => {
          throw new Error("Failed to read Excel file");
        };
        reader.readAsArrayBuffer(file);
      } else if (name.endsWith(".xml")) {
        setStatusMessage("Parsing Excel XML Spreadsheet...");
        const reader = new FileReader();
        reader.onload = (e) => {
          if (typeof e.target?.result === "string") {
            const parsed = parseXmlWorkbook(e.target.result, file.name);
            setWorkbook(parsed);
            setStatusMessage(null);
          }
        };
        reader.onerror = () => {
          throw new Error("Failed to read XML file");
        };
        reader.readAsText(file);
      } else {
        throw new Error("Unsupported file format. Please upload a .xlsx or .zip containing them.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while processing the file.");
      setStatusMessage(null);
    }
  };

  const loadExtractedFile = (file: ExtractedFile) => {
    try {
      setStatusMessage(`Parsing: ${file.name}...`);
      if (file.type === "xlsx") {
        const parsed = parseXlsxWorkbook(file.data as ArrayBuffer, file.name);
        setWorkbook(parsed);
      } else {
        const parsed = parseXmlWorkbook(file.data as string, file.name);
        setWorkbook(parsed);
      }
      setStatusMessage(null);
      setZipFiles([]);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to parse the selected file.");
      setStatusMessage(null);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      {!isLoaded && !isLoading && zipFiles.length === 0 && (
        <div className="space-y-4">
          {/* Tabs styled exactly like the screenshot */}
          <div className="flex bg-gray-100/80 border border-gray-200/40 p-1.5 rounded-2xl w-full">
            <button
              type="button"
              onClick={() => setMode("files")}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                mode === "files"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Multiple files
            </button>
            <button
              type="button"
              onClick={() => setMode("zip")}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                mode === "zip"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Zip file
            </button>
          </div>

          {/* Dashed Drop Zone */}
          <div
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-12 text-center transition-all bg-white cursor-pointer ${
              dragActive
                ? "border-emerald-500 bg-emerald-50/10 shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
          >
            <input
              ref={fileInputRef}
              type="file"
              key={mode}
              className="hidden"
              accept={mode === "zip" ? ".zip" : ".xlsx,.xml"}
              multiple={mode === "files"}
              onChange={handleFileChange}
            />
            
            {/* Upload Circle Icon exactly like screenshot */}
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-5 transition-transform hover:scale-105 shadow-inner">
              <Upload className="h-6 w-6 stroke-[2.5]" />
            </div>

            <h3 className="text-md font-bold text-gray-800 mb-1">
              {mode === "zip" ? "Upload zip file" : "Upload files"}
            </h3>
            
            <p className="text-xs text-gray-400 max-w-xs mb-5 leading-normal">
              {mode === "zip"
                ? "Select a .zip spreadsheet archive to process immediately."
                : "Select one or more individual files to process immediately."}
            </p>

            {/* Choose files button in emerald green */}
            <button
              type="button"
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-bold rounded-full transition-colors shadow-sm"
            >
              {mode === "zip" ? "Choose zip file" : "Choose files"}
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-100 rounded-3xl shadow-sm">
          <div className="relative flex h-12 w-12 items-center justify-center mb-4">
            <div className="absolute animate-ping h-full w-full rounded-full bg-emerald-400/20 opacity-75"></div>
            <div className="relative animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-emerald-500"></div>
          </div>
          <p className="text-gray-600 text-xs font-semibold animate-pulse">
            {statusMessage || "Processing files..."}
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs mb-6 shadow-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
          <div>
            <h4 className="font-bold text-red-800">Processing Error</h4>
            <p className="mt-1 leading-relaxed">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="mt-2 text-xs font-bold text-red-600 hover:text-red-800 underline underline-offset-2"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* ZIP Archive Content Selection Screen */}
      {zipFiles.length > 1 && (
        <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-500">
              <Archive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Multiple Spreadsheets Found</h3>
              <p className="text-[11px] text-gray-400 leading-normal">
                Select which spreadsheet file inside the ZIP archive you would like to analyze:
              </p>
            </div>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {zipFiles.map((file, idx) => (
              <button
                key={idx}
                onClick={() => loadExtractedFile(file)}
                className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100/80 border border-gray-100 hover:border-gray-300 rounded-xl transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  {file.type === "xlsx" ? (
                    <FileSpreadsheet className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <FileCode className="h-5 w-5 text-indigo-500 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-gray-700 truncate max-w-md">
                    {file.name}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-500">
                  {file.type.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => {
                setZipFiles([]);
                setErrorMessage(null);
              }}
              className="text-xs text-gray-500 hover:text-gray-800 font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Uploaded File Header */}
      {isLoaded && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-500">
              {fileName.endsWith(".xml") ? (
                <FileCode className="h-5 w-5 text-indigo-500" />
              ) : (
                <FileSpreadsheet className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                  Active Model
                </span>
                <span className="flex items-center text-[10px] text-emerald-500 gap-1 font-bold">
                  <CheckCircle2 className="h-3 w-3" /> In-Memory Loaded
                </span>
              </div>
              <h4 className="text-xs font-bold text-gray-800 mt-1 truncate max-w-sm sm:max-w-md">
                {fileName}
              </h4>
            </div>
          </div>
          <button
            onClick={clearWorkbook}
            className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 rounded-xl text-xs font-bold border border-gray-200 transition-colors shadow-sm self-stretch sm:self-auto text-center"
          >
            Reset Extractor
          </button>
        </div>
      )}
    </div>
  );
}
