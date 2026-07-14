import * as XLSX from "xlsx";
import type { IngestRow } from "./types";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const AMOUNT_RE = /\$?\s?[0-9][0-9,]*(?:\.[0-9]{1,2})?/;
const PHONE_RE = /(?:\+?\d{1,3}[\s-]?)?\(?\d{3,4}\)?[\s-]?\d{3}[\s-]?\d{3,4}\b/;
const DATE_RE = /\b\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4}\b/;

type FieldType = "email" | "phone" | "amount" | "date" | "generic";

/** Classifies a user-chosen field name (e.g. "Invoice Number", "Phone", "Amount Due") so the
 *  extractor knows which regex/heuristic to apply — this is what makes arbitrary, user-typed
 *  field lists work without a fixed schema. */
function fieldType(name: string): FieldType {
  const n = name.toLowerCase();
  if (/e-?mail/.test(n)) return "email";
  if (/phone|mobile|contact\s*(no|number)?|cell/.test(n)) return "phone";
  if (/amount|total|price|value|cost|sum|balance/.test(n)) return "amount";
  if (/date/.test(n)) return "date";
  return "generic";
}

function pickBestAmount(text: string, exclude: string[] = []): string {
  const matches = (text.match(new RegExp(AMOUNT_RE, "g")) || []).filter(m => !exclude.includes(m));
  const withDollar = matches.find(m => m.includes("$"));
  const best = withDollar || matches.sort((a, b) => b.replace(/[^0-9.]/g, "").length - a.replace(/[^0-9.]/g, "").length)[0];
  return best ? best.replace(/^\$\s?/, "").trim() : "";
}

/** Looks for "Label: value" / "Label - value" on a line — the general-purpose fallback for any
 *  field name that isn't a recognized type (email/phone/amount/date), e.g. "Invoice Number". */
function findLabelValue(text: string, label: string): string {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${esc}\\s*[:\\-]\\s*([^\\n\\r]{1,80})`, "i");
  const m = text.match(re);
  return m ? m[1].trim() : "";
}

function guessEntity(text: string, exclude: string[]): string {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (exclude.some(e => e && line.includes(e))) continue;
    if (line.length < 2 || line.length > 80) continue;
    if (/^[0-9\s.,$-]+$/.test(line)) continue;
    return line;
  }
  return lines[0]?.slice(0, 80) || "";
}

/** Best-effort structured extraction from freeform text (used by PDF, OCR, and voice channels),
 *  filling exactly the field names the user asked for at ingest time — not a fixed schema. */
export function extractFieldsFromText(text: string, sourceType: IngestRow["source_type"], fieldNames: string[]): IngestRow {
  const fields: Record<string, string> = {};
  const used: string[] = [];
  let genericFilled = false;

  for (const name of fieldNames) {
    const type = fieldType(name);
    let value = "";
    if (type === "email") {
      value = text.match(EMAIL_RE)?.[0] || "";
    } else if (type === "phone") {
      value = text.match(PHONE_RE)?.[0].trim() || "";
    } else if (type === "amount") {
      value = pickBestAmount(text, used);
    } else if (type === "date") {
      value = text.match(DATE_RE)?.[0] || "";
    } else {
      value = findLabelValue(text, name);
      if (!value && !genericFilled) {
        // First unmatched generic field gets the best-guess "entity" line (e.g. a name/company).
        value = guessEntity(text, used);
        genericFilled = true;
      }
    }
    if (value) used.push(value);
    fields[name] = value;
  }

  return { source_type: sourceType, fields, raw_snippet: text.slice(0, 500) };
}

/** Parse an Excel/CSV file into rows, matching each requested field name to the best-fitting
 *  column header (synonym regex per field type), falling back to positional columns. */
export async function parseExcelFile(file: File, fieldNames: string[]): Promise<IngestRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
  if (json.length === 0) return [];

  const headers = Object.keys(json[0]);
  const usedHeaders = new Set<string>();
  const colFor = (name: string, idx: number): string | undefined => {
    const type = fieldType(name);
    const synonyms =
      type === "email" ? /e-?mail/i :
      type === "phone" ? /phone|mobile|contact/i :
      type === "amount" ? /amount|price|total|value|cost/i :
      type === "date" ? /date/i :
      new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    let col = headers.find(h => !usedHeaders.has(h) && synonyms.test(h));
    if (!col) col = headers.find((h, i) => !usedHeaders.has(h) && i === idx);
    if (col) usedHeaders.add(col);
    return col;
  };
  const colMap = fieldNames.map((name, i) => ({ name, col: colFor(name, i) }));

  return json.map(row => ({
    source_type: "excel" as const,
    fields: Object.fromEntries(colMap.map(({ name, col }) => [name, col ? String(row[col] ?? "").trim() : ""])),
    raw_snippet: JSON.stringify(row),
  }));
}

/** Extract text from a PDF's text layer (pdfjs-dist) and run best-effort field extraction.
 *  Note: this reads embedded text, not scanned/image-only PDFs — those need the OCR channel. */
export async function parsePdfFile(file: File, fieldNames: string[]): Promise<IngestRow> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  let fullText = "";
  for (let i = 1; i <= Math.min(doc.numPages, 5); i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((it: any) => it.str).join(" ") + "\n";
  }
  return extractFieldsFromText(fullText || "(no extractable text found in PDF)", "pdf", fieldNames);
}

/** OCR an uploaded/pasted screenshot via Tesseract.js (fully client-side, no backend). */
export async function parseScreenshotFile(file: File, fieldNames: string[], onProgress?: (pct: number) => void): Promise<IngestRow> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m: any) => { if (m.status === "recognizing text" && onProgress) onProgress(Math.round((m.progress || 0) * 100)); },
  });
  try {
    const { data } = await worker.recognize(file);
    return extractFieldsFromText(data.text || "(no text recognized in image)", "screenshot", fieldNames);
  } finally {
    await worker.terminate();
  }
}

/** Real-time speech-to-text via the browser's native Web Speech API (Chrome/Edge). */
export function isVoiceSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function createVoiceRecognizer(onResult: (transcript: string, isFinal: boolean) => void, onEnd: () => void, onError: (msg: string) => void) {
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognizer = new Ctor();
  recognizer.continuous = true;
  recognizer.interimResults = true;
  recognizer.lang = "en-US";
  recognizer.onresult = (event: any) => {
    let transcript = "";
    let isFinal = false;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
      if (event.results[i].isFinal) isFinal = true;
    }
    onResult(transcript, isFinal);
  };
  recognizer.onerror = (e: any) => onError(e.error || "Speech recognition error");
  recognizer.onend = onEnd;
  return recognizer;
}
