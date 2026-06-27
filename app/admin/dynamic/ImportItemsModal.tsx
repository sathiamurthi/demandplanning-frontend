"use client";

/**
 * ImportItemsModal — Bulk import items from CSV.
 * Features:
 *  - Download CSV template
 *  - Drag-and-drop or file picker
 *  - Client-side CSV parse + preview table
 *  - Mode selector: upsert | insert_only
 *  - Submit to POST /items/import
 */

import React, { useCallback, useRef, useState } from "react";
import {
  Download, Upload, FileText, CheckCircle2,
  XCircle, Loader2, X, AlertTriangle,
} from "lucide-react";
import { getAuthHeaders } from "./usercrud";
import { getTenantId, getStoreId } from "@/lib/utils";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

type ParsedRow = Record<string, string>;
type ImportResult = { created: number; updated: number; errors: { row: number; message: string }[]; total: number };

const EXPECTED_HEADERS = [
  "name", "sku", "barcode", "brand", "description",
  "currentStock", "reorderLevel", "maxStockLevel",
  "sellingPrice", "purchasePrice", "mrp", "gstRate",
  "expiryDate", "batchNumber", "isSeasonal",
];

/* ─── CSV parser (no external library) ─── */
function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
  if (lines.length < 1) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: ParsedRow = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
    return row;
  }).filter((r) => Object.values(r).some((v) => v.trim().length > 0));

  return { headers, rows };
}

type Props = { isOpen: boolean; onClose: () => void; onImported: () => void };

export function ImportItemsModal({ isOpen, onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [mode, setMode] = useState<"upsert" | "insert_only">("upsert");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [submitError, setSubmitError] = useState("");

  const tenantId = getTenantId();
  const storeId  = getStoreId();

  /* ── Reset ── */
  const reset = () => {
    setFileName(""); setHeaders([]); setRows([]); setParseError("");
    setResult(null); setSubmitError(""); setMode("upsert");
  };
  const handleClose = () => { reset(); onClose(); };

  /* ── Template download ── */
  const downloadTemplate = async () => {
    try {
      const res = await fetch(
        `${BASE}/tenants/${tenantId}/stores/${storeId}/items/import/template`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error("Failed to download template");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "items_import_template.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message);
    }
  };

  /* ── File processing ── */
  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      setParseError("Only CSV files are supported.");
      return;
    }
    setFileName(file.name);
    setParseError("");
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      if (r.length === 0) { setParseError("No data rows found in the file."); return; }
      if (r.length > 500) { setParseError("Maximum 500 rows per import."); return; }
      setHeaders(h);
      setRows(r);
    };
    reader.readAsText(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (rows.length === 0) return;
    setSubmitting(true); setSubmitError(""); setResult(null);
    try {
      const res = await fetch(
        `${BASE}/tenants/${tenantId}/stores/${storeId}/items/import`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ rows, mode }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Import failed");
      setResult(json.data);
      if (json.data.created > 0 || json.data.updated > 0) onImported();
    } catch (e: any) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Missing headers check ── */
  const missingHeaders = rows.length > 0
    ? ["name"].filter((h) => !headers.includes(h))
    : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full sm:max-w-2xl rounded-2xl bg-white shadow-2xl
                      max-h-[90vh] flex flex-col overflow-hidden
                      animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
              <Upload className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Import items</h2>
              <p className="text-[11px] text-gray-400">Upload a CSV file • max 500 rows</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Template download */}
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5
                         text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Template</span>
            </button>
            <button onClick={handleClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Result */}
          {result && (
            <div className={`rounded-xl border p-4 ${
              result.errors.length > 0 ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {result.errors.length > 0
                  ? <AlertTriangle className="h-4 w-4 text-amber-600" />
                  : <CheckCircle2 className="h-4 w-4 text-green-600" />
                }
                <span className="text-sm font-semibold">
                  {result.errors.length > 0 ? "Import completed with errors" : "Import successful!"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                <div className="text-center p-2 bg-white rounded-lg border">
                  <div className="text-lg font-bold text-green-600">{result.created}</div>
                  <div className="text-gray-500">Created</div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border">
                  <div className="text-lg font-bold text-blue-600">{result.updated}</div>
                  <div className="text-gray-500">Updated</div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border">
                  <div className="text-lg font-bold text-red-500">{result.errors.length}</div>
                  <div className="text-gray-500">Errors</div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <p key={i} className="text-xs text-amber-700">Row {err.row}: {err.message}</p>
                  ))}
                  {result.errors.length > 10 && (
                    <p className="text-xs text-amber-600">…and {result.errors.length - 10} more errors</p>
                  )}
                </div>
              )}
              <button
                onClick={handleClose}
                className="mt-3 w-full rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold
                           text-white hover:bg-gray-800 transition-colors theme-btn-primary"
              >
                Done
              </button>
            </div>
          )}

          {!result && (
            <>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center
                            transition-all select-none
                            ${dragging
                              ? "border-gold-400 bg-gold-50"
                              : rows.length > 0
                                ? "border-green-300 bg-green-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
              >
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                {rows.length > 0 ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <FileText className="h-8 w-8 text-green-500" />
                    <p className="text-sm font-semibold text-green-700">{fileName}</p>
                    <p className="text-xs text-green-600">{rows.length} rows ready to import</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); reset(); }}
                      className="mt-1 text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className={`h-8 w-8 ${dragging ? "text-gold-500" : "text-gray-300"}`} />
                    <p className="text-sm font-medium text-gray-600">
                      {dragging ? "Drop to upload" : "Drag & drop CSV or click to browse"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Download the template first to ensure correct column names
                    </p>
                  </div>
                )}
              </div>

              {parseError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  <XCircle className="h-4 w-4 shrink-0" />
                  {parseError}
                </div>
              )}

              {missingHeaders.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200
                                px-3 py-2 text-xs text-amber-700">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Missing required columns: <strong>{missingHeaders.join(", ")}</strong></span>
                </div>
              )}

              {/* Preview table */}
              {rows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-700">Preview ({Math.min(rows.length, 5)} of {rows.length} rows)</p>
                    {/* Mode selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Mode:</span>
                      <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value as any)}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs
                                   focus:outline-none focus:ring-2 focus:ring-gold-400/20"
                      >
                        <option value="upsert">Upsert (update if SKU exists)</option>
                        <option value="insert_only">Insert only (skip duplicates)</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {EXPECTED_HEADERS.slice(0, 7).filter(h => headers.includes(h)).map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {rows.slice(0, 5).map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                            {EXPECTED_HEADERS.slice(0, 7).filter(h => headers.includes(h)).map((h) => (
                              <td key={h} className="px-3 py-2 text-gray-700 max-w-[120px] truncate">
                                {row[h] || "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {submitError}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="flex gap-2 border-t border-gray-100 px-5 py-4 shrink-0">
            <button
              onClick={handleClose}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm
                         font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || rows.length === 0 || missingHeaders.length > 0}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg
                         bg-gray-900 px-4 py-2 text-sm font-semibold text-white
                         theme-btn-primary transition-colors hover:bg-gray-800
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Import {rows.length > 0 ? `${rows.length} items` : ""}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
