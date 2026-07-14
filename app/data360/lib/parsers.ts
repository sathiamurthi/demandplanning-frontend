import * as XLSX from "xlsx";
import type { IngestRow } from "./types";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:\+?\d{1,3}[\s-]?)?\(?\d{3,4}\)?[\s-]?\d{3}[\s-]?\d{3,4}\b/;
const DATE_RE = /\b\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4}\b/;

type FieldType = "email" | "phone" | "amount" | "date" | "merchant" | "itemized" | "generic";

/** Classifies a user-chosen field name (e.g. "Invoice Number", "Phone", "Amount Due") so the
 *  extractor knows which regex/heuristic to apply — this is what makes arbitrary, user-typed
 *  field lists work without a fixed schema. */
function fieldType(name: string): FieldType {
  const n = name.toLowerCase();
  if (/e-?mail/.test(n)) return "email";
  if (/phone|mobile|contact\s*(no|number)?|cell/.test(n)) return "phone";
  if (/item\s*-?\s*wise|itemi[sz]ed|line\s*items?|break\s*-?\s*down/.test(n)) return "itemized";
  if (/amount|total|price|value|cost|sum|balance/.test(n)) return "amount";
  if (/date/.test(n)) return "date";
  if (/merchant|vendor|store|shop|payee|business\s*name/.test(n)) return "merchant";
  return "generic";
}

// Real receipts/invoices are full of numbers bigger than the actual amount —
// HSN codes, bill/voucher numbers, MIDs, phone numbers, GSTINs. Naively
// picking "the biggest/longest number on the page" grabs those instead of
// the total. Two fixes: (1) a wide set of real-world "this is the final
// amount" phrasings (Net Payable, UPI Payment, Amount Paid...), not just
// "Total"; (2) any fallback is restricted to decimal-formatted numbers
// (35.00, 915.50) off lines that don't look like an ID/code, since printed
// currency amounts are reliably decimal while codes/IDs are reliably bare
// integers.
const AMOUNT_KEYWORDS: RegExp[] = [
  /net\s*payable/i,
  /grand\s*total/i,
  /total\s*amount/i,
  /amount\s*paid/i,
  /upi\s*payment/i,
  /amount\s*received/i,
  /bill\s*amount/i,
  /paid\s*\(?\s*rs/i,
  /\btotal\b/i,
];
const ID_LABEL_RE = /\b(no|id|gstin|hsn|phone|batch|bill|invoice|txn|voucher|mid|roc|cons|order|booking|cashier)\b\s*[:.]?/i;
const DECIMAL_NUM_RE = /[₹$]?\s?[0-9][0-9,]*\.[0-9]{1,2}\b/g;
const PLAIN_NUM_RE = /[₹$]?\s?[0-9][0-9,]*\b/g;
const cleanAmount = (m: string) => m.replace(/[₹$,\s]/g, "");

// A field literally named "Sub Total" wants the subtotal, not the grand
// total — but the keyword scan below deliberately skips subtotal lines when
// looking for the *final* amount (so a field like "Total" doesn't grab the
// subtotal instead). Without knowing which field is being asked for, both
// "Sub Total" and "Total" collapse to the exact same guess. Passing the
// field name in lets us invert that exclusion when the field itself is
// asking for the subtotal.
function pickBestAmount(text: string, fieldName: string = ""): string {
  const wantsSubtotal = /sub\s*-?\s*total/i.test(fieldName);
  const lines = text.split(/\r?\n/);

  if (wantsSubtotal) {
    // Only the subtotal line counts — don't fall through to "grand total" /
    // "net payable" style keywords, which would silently hand back the
    // wrong (final) amount for a field that specifically asked for the
    // subtotal.
    for (const line of lines) {
      if (!/sub\s*-?total/i.test(line)) continue;
      const decimals = line.match(DECIMAL_NUM_RE);
      if (decimals?.length) return cleanAmount(decimals[decimals.length - 1]);
      if (!ID_LABEL_RE.test(line)) {
        const plain = line.match(PLAIN_NUM_RE);
        if (plain?.length) {
          const v = cleanAmount(plain[plain.length - 1]);
          if (v && v.length <= 6) return v;
        }
      }
    }
    return "";
  }

  for (const kw of AMOUNT_KEYWORDS) {
    for (const line of lines) {
      if (/sub\s*-?total/i.test(line)) continue;
      if (!kw.test(line)) continue;
      const decimals = line.match(DECIMAL_NUM_RE);
      if (decimals?.length) return cleanAmount(decimals[decimals.length - 1]);
      if (!ID_LABEL_RE.test(line)) {
        const plain = line.match(PLAIN_NUM_RE);
        if (plain?.length) {
          const v = cleanAmount(plain[plain.length - 1]);
          if (v && v.length <= 6) return v;
        }
      }
    }
  }
  // No keyword line found — fall back to decimal-formatted numbers only,
  // skipping any line that looks like it's labeling an ID/code.
  const safeLines = lines.filter(l => !ID_LABEL_RE.test(l));
  const decimalsAnywhere = safeLines.join("\n").match(DECIMAL_NUM_RE);
  if (decimalsAnywhere?.length) return cleanAmount(decimalsAnywhere[decimalsAnywhere.length - 1]);
  // Last resort: a bounded plain integer (≤6 digits) off a non-ID line.
  const plainAnywhere = (safeLines.join(" ").match(PLAIN_NUM_RE) || [])
    .map(cleanAmount)
    .filter(n => n && !Number.isNaN(parseFloat(n)) && n.length <= 6);
  if (plainAnywhere.length === 0) return "";
  return plainAnywhere.reduce((max, n) => (parseFloat(n) > parseFloat(max) ? n : max), plainAnywhere[0]);
}

/** Looks for "Label: value" / "Label - value" on a line — the general-purpose fallback for any
 *  field name that isn't a recognized type (email/phone/amount/date), e.g. "Invoice Number". */
function findLabelValue(text: string, label: string): string {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${esc}\\s*[:\\-]\\s*([^\\n\\r]{1,80})`, "i");
  const m = text.match(re);
  return m ? m[1].trim() : "";
}

// Itemized receipts (e.g. a supermarket tax invoice) print each product as
// "NAME  QTY  RATE  VALUE" — three trailing plain numbers. Detecting that
// row shape gives real product names/lines instead of a metadata line.
const ITEM_HEADER_SKIP_RE = /particulars|qty\s*\/?\s*kg|n\s*\/?\s*rate|^hsn\b|gst\s*breakup/i;
function guessLineItems(text: string): { name: string; value: string }[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items: { name: string; value: string }[] = [];
  for (const line of lines) {
    if (ITEM_HEADER_SKIP_RE.test(line)) continue;
    const stripped = line.replace(/^\d{5,}\s*/, ""); // drop a leading glued-on HSN code
    const m = stripped.match(/^([A-Za-z][A-Za-z0-9 .,'&-]{2,40}?)\s+[\d.]+\s+[\d.]+\s+([\d.]+)\s*$/);
    if (m) items.push({ name: m[1].trim(), value: m[2] });
  }
  return items;
}

// Metadata lines (bill/voucher/txn numbers, GSTIN, HSN, cashier, addresses…)
// vastly outnumber the one line that's actually the merchant name on a real
// receipt — this skip-list is built directly off what shows up on real
// Indian retail/utility receipts, not just generic POS jargon.
const ENTITY_SKIP_RE = /^(total|subtotal|sub-total|tax\s*invoice|bill\s*(no|dt)|vou\.?\s*no|cashier|hsn|particulars|qty|cgst|sgst|cess|gst|phone|thank you|change|receipt|invoice|order\s*type|cons\s*no|booking\s*no|landmark|category|equipment|quota|address|name\s*:|date\s*\/\s*time|mid\s*:|batch\s*id|roc\s*:|txn\s*id|upi|amount|net\s*payable|paid\s*\(|advance|price\s*\(|digital\s*incentive)/i;

function guessEntity(text: string, exclude: string[]): string {
  // Prefer an actual product line off an itemized table — more useful than
  // just the store name for "what did I buy" style fields.
  const items = guessLineItems(text);
  if (items.length > 0) return items.slice(0, 3).map(i => i.name).join(", ");

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (exclude.some(e => e && line.includes(e))) continue;
    if (line.length < 2 || line.length > 40) continue;
    if (/^[0-9\s.,₹$()/:-]+$/.test(line)) continue;
    if (ENTITY_SKIP_RE.test(line)) continue;
    if (/\b\d{6,}\b/.test(line)) continue; // long ID glued into an otherwise plausible line
    return line;
  }
  return lines[0]?.slice(0, 80) || "";
}

function guessItemizedBreakdown(text: string): string {
  const items = guessLineItems(text);
  if (items.length === 0) return "";
  return items.map(i => `${i.name}: ${i.value}`).join("; ");
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
      value = pickBestAmount(text, name);
    } else if (type === "date") {
      value = text.match(DATE_RE)?.[0] || "";
    } else if (type === "itemized") {
      value = guessItemizedBreakdown(text);
    } else if (type === "merchant") {
      value = guessEntity(text, used);
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

// Filler words stripped before splitting a plain-English "what to extract"
// instruction into field names, e.g. "give me amount, item, date, item wise
// and total amount" → ["Amount", "Item", "Date", "Item-wise Breakdown",
// "Total Amount"]. Recognized concepts get a canonical field name so the
// right heuristic above (amount/date/itemized/merchant) actually fires;
// anything unrecognized is kept as typed, just title-cased.
const INSTRUCTION_LEAD_RE = /^\s*(pls\.?|please)?\s*(give me|extract|show me|list out|list|i want|i need|need)\s*/i;
export function parseFieldInstruction(instruction: string): string[] {
  const stripped = instruction.replace(INSTRUCTION_LEAD_RE, "");
  const parts = stripped.split(/\s*,\s*|\s+and\s+/i).map(p => p.trim()).filter(Boolean);
  const canon = (p: string): string => {
    const n = p.toLowerCase();
    if (/total/.test(n)) return "Total Amount";
    if (/item\s*-?\s*wise|line\s*items?|break\s*-?\s*down/.test(n)) return "Item-wise Breakdown";
    if (/^items?$/.test(n)) return "Item";
    if (n.startsWith("amo")) return "Amount";
    if (n.startsWith("dat")) return "Date";
    if (/merchant|store|vendor|shop/.test(n)) return "Merchant";
    if (n.startsWith("emai")) return "Email";
    if (n.startsWith("phon") || n.startsWith("mobil")) return "Phone";
    return p.replace(/\b\w/g, c => c.toUpperCase());
  };
  return Array.from(new Set(parts.map(canon).filter(Boolean)));
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
