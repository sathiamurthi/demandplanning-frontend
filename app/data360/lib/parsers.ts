import * as XLSX from "xlsx";
import type { IngestRow } from "./types";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const AMOUNT_RE = /\$?\s?[0-9][0-9,]*(?:\.[0-9]{1,2})?/;

function pickBestAmount(text: string): string {
  const matches = text.match(new RegExp(AMOUNT_RE, "g")) || [];
  const withDollar = matches.find(m => m.includes("$"));
  const best = withDollar || matches.sort((a, b) => b.replace(/[^0-9.]/g, "").length - a.replace(/[^0-9.]/g, "").length)[0];
  return best ? best.replace(/^\$\s?/, "").trim() : "";
}

function guessEntity(text: string, excludeEmail: string, excludeAmount: string): string {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (line.includes(excludeEmail) || (excludeAmount && line.includes(excludeAmount))) continue;
    if (line.length < 3 || line.length > 80) continue;
    if (/^[0-9\s.,$-]+$/.test(line)) continue;
    return line;
  }
  return lines[0]?.slice(0, 80) || "Unknown Entity";
}

/** Best-effort structured extraction from freeform text (used by PDF, OCR, and voice channels). */
export function extractFromText(text: string, sourceType: IngestRow["source_type"]): IngestRow {
  const emailMatch = text.match(EMAIL_RE);
  const email = emailMatch ? emailMatch[0] : "";
  const amount = pickBestAmount(text);
  const entity = guessEntity(text, email, amount);
  return {
    source_type: sourceType,
    extracted_entity: entity,
    target_field_a: amount,
    target_field_b: email,
    raw_snippet: text.slice(0, 500),
  };
}

/** Parse an Excel/CSV file into rows. Expects Entity/Amount/Email columns (case-insensitive),
 *  falling back to the first three columns positionally if those headers aren't found. */
export async function parseExcelFile(file: File): Promise<IngestRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
  if (json.length === 0) return [];

  const headers = Object.keys(json[0]);
  const findCol = (re: RegExp) => headers.find(h => re.test(h));
  const entityCol = findCol(/entity|company|name|vendor|customer/i) || headers[0];
  const amountCol = findCol(/amount|price|total|value|cost/i) || headers[1];
  const emailCol = findCol(/e-?mail/i) || headers[2];

  return json.map(row => ({
    source_type: "excel" as const,
    extracted_entity: String(row[entityCol] ?? "").trim(),
    target_field_a: String(row[amountCol] ?? "").trim(),
    target_field_b: String(row[emailCol] ?? "").trim(),
    raw_snippet: JSON.stringify(row),
  }));
}

/** Extract text from a PDF's text layer (pdfjs-dist) and run best-effort field extraction.
 *  Note: this reads embedded text, not scanned/image-only PDFs — those need the OCR channel. */
export async function parsePdfFile(file: File): Promise<IngestRow> {
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
  return extractFromText(fullText || "(no extractable text found in PDF)", "pdf");
}

/** OCR an uploaded/pasted screenshot via Tesseract.js (fully client-side, no backend). */
export async function parseScreenshotFile(file: File, onProgress?: (pct: number) => void): Promise<IngestRow> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m: any) => { if (m.status === "recognizing text" && onProgress) onProgress(Math.round((m.progress || 0) * 100)); },
  });
  try {
    const { data } = await worker.recognize(file);
    return extractFromText(data.text || "(no text recognized in image)", "screenshot");
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
