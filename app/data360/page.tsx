"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Database, Upload, FileText, Camera, Mic, MicOff, CheckCircle, XCircle,
  AlertTriangle, ChevronRight, X, Loader2, Plus, LogOut, ArrowRight,
  ShieldCheck, GitMerge, Cloud, HardDrive, Bot, Sparkles, Download,
  Cpu, ClipboardCheck, Workflow, Globe, ArrowRightLeft, LayoutTemplate, FileOutput,
  GraduationCap, BookOpen, Lightbulb, ListChecks,
} from "lucide-react";
import { data360Api, getToken, setToken, clearToken, ApiError } from "./lib/api";
import {
  isVoiceSupported, createVoiceRecognizer, parseFieldInstruction, flattenAutoExtract, renderPdfPageImages,
} from "./lib/parsers";
import type { D360User, D360Batch, D360Row, D360Job, IngestRow, TargetType, D360Template, D360GenerationJob, StudyPack, DataQuota } from "./lib/types";

const FIELD_TEMPLATES: Record<string, { label: string; fields: string[] }> = {
  invoice: { label: "Invoice", fields: ["Invoice Number", "Vendor Name", "Amount", "Due Date"] },
  contact: { label: "Contact / Lead", fields: ["Name", "Phone", "Email"] },
  receipt: { label: "Receipt", fields: ["Merchant", "Amount", "Date"] },
  custom:  { label: "Custom", fields: [] },
};

// ── Marketing content ───────────────────────────────────────────────────────
const CHANNELS = [
  { icon: Upload,  title: "Excel / CSV / JSON",   desc: "Direct-stream table parsing — drag & drop a spreadsheet, columns auto-detected." },
  { icon: FileText, title: "PDF Documents",        desc: "Extracts the text layer from invoices and receipts to pull entities, amounts, and emails." },
  { icon: Camera,  title: "Screenshot Catcher",    desc: "Client-side OCR reads text directly out of a pasted or uploaded screenshot." },
  { icon: Mic,     title: "Voice-to-Text",         desc: "Real-time dictation — speak a record and the pipeline extracts the structured fields." },
];

const STAGES = [
  { icon: Upload,        label: "Ingest",    desc: "Four channels feed a single unified row format." },
  { icon: ShieldCheck,   label: "Validate",  desc: "An agent flags malformed emails and anomalous amounts." },
  { icon: ClipboardCheck, label: "Approve",  desc: "A human reviews and corrects every flagged row before it moves on." },
  { icon: ArrowRightLeft, label: "Map",      desc: "An agent maps source fields onto the exact schema your destination expects." },
  { icon: Workflow,      label: "Distribute", desc: "Send mapped rows to a database, an API, cloud storage, or a file." },
];

// ── Types ────────────────────────────────────────────────────────────────────
type View = "landing" | "auth" | "dashboard" | "ingest" | "review" | "mapping" | "generate" | "distribute" | "settings" | "school";
type InputMode = "upload" | "text" | "voice";

const VERDICT_STYLE: Record<string, { badge: string; dot: string }> = {
  ok:       { badge: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  warning:  { badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  critical: { badge: "bg-red-50 text-red-700 border-red-200",       dot: "bg-red-500" },
};
const BATCH_STATUS_STYLE: Record<string, string> = {
  pending_approval: "bg-amber-50 text-amber-700 border-amber-200",
  approved:         "bg-teal-50 text-teal-700 border-teal-200",
  distributed:      "bg-green-50 text-green-700 border-green-200",
  archived:         "bg-gray-100 text-gray-500 border-gray-200",
};

export default function Data360Page() {
  const [view, setView] = useState<View>("landing");
  const [user, setUser] = useState<D360User | null>(null);
  const [authTab, setAuthTab] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const [batches, setBatches] = useState<D360Batch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  const [pendingRows, setPendingRows] = useState<IngestRow[]>([]);
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [pasteText, setPasteText] = useState("");
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [ingestBusy, setIngestBusy] = useState(false);
  const [ingestErr, setIngestErr] = useState("");
  const [fieldTemplate, setFieldTemplate] = useState<keyof typeof FIELD_TEMPLATES>("custom");
  // Empty by default — this is what makes Auto-Extract the real default mode
  // (no field list needed at all). Only set once the user opens "Custom
  // fields" and picks a template or types field names.
  const [fieldsInput, setFieldsInput] = useState("");
  const extractionFields = fieldsInput.split(",").map(s => s.trim()).filter(Boolean);
  // Tracks the field names actually *discovered* by auto-extraction (for the
  // Staged Rows table + what gets persisted as the batch's extraction_fields)
  // — kept separate from `extractionFields` above so that "Use as Staged Row"
  // never silently flips later uploads from auto mode into custom-fields
  // mode.
  const [stagedFieldNames, setStagedFieldNames] = useState<string[]>([]);
  const effectiveFields = extractionFields.length > 0 ? extractionFields : stagedFieldNames;
  const [instructionInput, setInstructionInput] = useState("");
  const applyInstruction = () => {
    const fields = parseFieldInstruction(instructionInput);
    if (fields.length === 0) return;
    setFieldsInput(fields.join(", "));
    setFieldTemplate("custom");
    setSelectedTemplateId("");
  };

  // Reusable templates (Generate stage): a saved field list + output design.
  const [templates, setTemplates] = useState<D360Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [genTemplateId, setGenTemplateId] = useState<string>("");
  const [generateBusy, setGenerateBusy] = useState(false);
  const [generationJob, setGenerationJob] = useState<D360GenerationJob | null>(null);

  const loadTemplates = async () => {
    try { setTemplates(await data360Api.listTemplates()); } catch { /* ignore */ }
  };

  // Settings — AI cost/token usage tracking.
  const [aiUsageFiles, setAiUsageFiles] = useState<Awaited<ReturnType<typeof data360Api.getAiUsage>>["files"]>([]);
  const [aiUsageBatches, setAiUsageBatches] = useState<Awaited<ReturnType<typeof data360Api.getAiUsage>>["batches"]>([]);
  const [aiUsageCacheStats, setAiUsageCacheStats] = useState<Awaited<ReturnType<typeof data360Api.getAiUsage>>["cacheStats"] | null>(null);
  const [aiUsageLoading, setAiUsageLoading] = useState(false);
  const loadAiUsage = async () => {
    setAiUsageLoading(true);
    try {
      const { files, batches, cacheStats } = await data360Api.getAiUsage();
      setAiUsageFiles(files); setAiUsageBatches(batches); setAiUsageCacheStats(cacheStats);
    } catch { /* ignore */ } finally { setAiUsageLoading(false); }
  };
  useEffect(() => { if (view === "settings") loadAiUsage(); }, [view]);

  // ── School: chapter -> Study Pack ───────────────────────────────────────
  const BOARD_PRESETS = ["CBSE", "ICSE", "State Board", "IB", "Cambridge / IGCSE"];
  const [schoolInputMode, setSchoolInputMode] = useState<"upload" | "text" | "generate">("upload");
  const [schoolClassLevel, setSchoolClassLevel] = useState("");
  const [schoolBoard, setSchoolBoard] = useState("CBSE");
  const [schoolSubject, setSchoolSubject] = useState("");
  const [schoolChapterLabel, setSchoolChapterLabel] = useState("");
  const [schoolChaptersList, setSchoolChaptersList] = useState<string[]>([]);
  const [schoolSuggesting, setSchoolSuggesting] = useState(false);
  const [schoolPasteText, setSchoolPasteText] = useState("");
  const [schoolBusy, setSchoolBusy] = useState(false);
  const [schoolErr, setSchoolErr] = useState("");
  const [schoolResult, setSchoolResult] = useState<StudyPack | null>(null);
  const [schoolHistory, setSchoolHistory] = useState<StudyPack[]>([]);
  const [schoolTargetLang, setSchoolTargetLang] = useState("English");
  const [schoolProvider, setSchoolProvider] = useState("");
  const [schoolCached, setSchoolCached] = useState(false);

  useEffect(() => {
    if (!schoolBoard || !schoolClassLevel || !schoolSubject) {
      setSchoolChaptersList([]);
      return;
    }
    const cacheKey = `d360_chapters_${schoolBoard}_${schoolClassLevel}_${schoolSubject}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { setSchoolChaptersList(JSON.parse(cached)); } catch (e) {}
    } else {
      setSchoolChaptersList([]);
    }
  }, [schoolBoard, schoolClassLevel, schoolSubject]);

  const suggestChapters = async () => {
    if (!schoolClassLevel.trim() || !schoolBoard.trim() || !schoolSubject.trim()) {
      setSchoolErr("Class, Board, and Subject are required to suggest chapters.");
      return;
    }
    setSchoolSuggesting(true); setSchoolErr("");
    try {
      const res = await fetch("/api/data360/suggest-chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: schoolPasteText,
          class_level: schoolClassLevel,
          board: schoolBoard,
          subject: schoolSubject
        })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setSchoolChaptersList(result.data);
      const cacheKey = `d360_chapters_${schoolBoard}_${schoolClassLevel}_${schoolSubject}`;
      localStorage.setItem(cacheKey, JSON.stringify(result.data));
    } catch (error: any) {
      setSchoolErr(error.message || "Failed to suggest chapters");
    } finally {
      setSchoolSuggesting(false);
    }
  };


  const runStudyGuideFromFiles = async (fileList: FileList) => {
    if (!schoolClassLevel.trim() || !schoolBoard.trim()) {
      setSchoolErr("Class and Board are required first.");
      return;
    }
    setSchoolBusy(true); setSchoolErr(""); setSchoolResult(null);
    try {
      const images: { image_base64: string; mime_type: string }[] = [];
      for (const file of Array.from(fileList)) {
        if (file.type.startsWith("image/")) {
          images.push({ image_base64: await fileToBase64(file), mime_type: file.type });
        } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          const pages = await renderPdfPageImages(file, 10);
          pages.forEach(p => images.push({ image_base64: p.base64, mime_type: p.mimeType }));
        } else {
          throw new Error(`"${file.name}" is an unsupported type - use images or a PDF.`);
        }
      }
      if (images.length === 0) return;
      if (images.length > 10) images.length = 10;

      const res = await fetch("/api/data360/generate-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images,
          class_level: schoolClassLevel,
          board: schoolBoard,
          subject: schoolSubject,
          chapter_name: schoolChapterLabel,
          target_language: schoolTargetLang
        })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      
      setSchoolResult(result.data); setSchoolProvider("Gemini 2.5 Flash"); setSchoolCached(false);
      setSchoolHistory(prev => [result.data, ...prev]);
    } catch (e: any) {
      setSchoolErr(e.message || "Failed to generate study guide.");
    } finally {
      setSchoolBusy(false);
    }
  };

  const runStudyGuideFromText = async () => {
    if (!schoolClassLevel.trim() || !schoolBoard.trim()) {
      setSchoolErr("Class and Board are required first.");
      return;
    }
    setSchoolBusy(true); setSchoolErr(""); setSchoolResult(null);
    try {
      const res = await fetch("/api/data360/generate-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: schoolPasteText,
          class_level: schoolClassLevel,
          board: schoolBoard,
          subject: schoolSubject,
          chapter_name: schoolChapterLabel,
          target_language: schoolTargetLang
        })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      
      setSchoolResult(result.data); setSchoolProvider("Gemini 2.5 Flash"); setSchoolCached(false);
      setSchoolHistory(prev => [result.data, ...prev]);
    } catch (e: any) {
      setSchoolErr(e.message || "Failed to generate study guide.");
    } finally {
      setSchoolBusy(false);
    }
  };

  const runStudyGuideGenerate = async () => {
    if (!schoolClassLevel.trim() || !schoolBoard.trim() || !schoolSubject.trim() || !schoolChapterLabel.trim()) {
      setSchoolErr("Class, Board, Subject, and Chapter Name are required to generate from scratch.");
      return;
    }
    setSchoolBusy(true); setSchoolErr(""); setSchoolResult(null);
    try {
      const res = await fetch("/api/data360/generate-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Please generate a comprehensive study guide based solely on your internal knowledge of this topic.",
          class_level: schoolClassLevel,
          board: schoolBoard,
          subject: schoolSubject,
          chapter_name: schoolChapterLabel,
          target_language: schoolTargetLang
        })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      
      setSchoolResult(result.data); setSchoolProvider("Gemini 2.5 Flash"); setSchoolCached(false);
      setSchoolHistory(prev => [result.data, ...prev]);
    } catch (e: any) {
      setSchoolErr(e.message || "Failed to generate study guide.");
    } finally {
      setSchoolBusy(false);
    }
  };


  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const recognizerRef = useRef<any>(null);

  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [activeBatch, setActiveBatch] = useState<D360Batch | null>(null);
  const [activeRows, setActiveRows] = useState<D360Row[]>([]);
  const [activeJobs, setActiveJobs] = useState<D360Job[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [focusedRow, setFocusedRow] = useState<D360Row | null>(null);
  const [overrideFields, setOverrideFields] = useState<Record<string, string>>({});
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [reviewErr, setReviewErr] = useState("");

  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [mappingBusy, setMappingBusy] = useState(false);

  const [targetType, setTargetType] = useState<TargetType>("file_export");
  const [cloudProvider, setCloudProvider] = useState<"s3" | "azure" | "local">("s3");
  const [bucketName, setBucketName] = useState("");
  const [dbConnectionString, setDbConnectionString] = useState("");
  const [dbTableName, setDbTableName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [apiMethod, setApiMethod] = useState<"POST" | "PUT">("POST");
  const [apiFormat, setApiFormat] = useState<"json" | "xml">("json");
  const [apiAuthToken, setApiAuthToken] = useState("");
  const [rpaUrl, setRpaUrl] = useState("");
  const [rpaProfile, setRpaProfile] = useState("");
  const [rpaToken, setRpaToken] = useState("");
  const [distributeBusy, setDistributeBusy] = useState(false);
  const [distributeResult, setDistributeResult] = useState<D360Job | null>(null);

  useEffect(() => {
    document.title = "Data360 — Autonomous Data Entry & Validation Pipeline";
    if (getToken()) {
      data360Api.me().then(u => { setUser(u); setView("dashboard"); loadTemplates(); }).catch(() => clearToken());
    }
    return () => { document.title = "NexusOS"; };
  }, []);

  const go = (v: View) => setView(v);

  const loadBatches = async () => {
    setBatchesLoading(true);
    try { setBatches(await data360Api.listBatches()); } catch { /* ignore */ } finally { setBatchesLoading(false); }
  };

  useEffect(() => { if (view === "dashboard") loadBatches(); }, [view]);

  // ── Usage quota (2 free documents, then a paywall) ──────────────────────
  const [quota, setQuota] = useState<DataQuota | null>(null);
  const loadQuota = async () => {
    try { setQuota(await data360Api.getQuota()); } catch { /* ignore */ }
  };
  useEffect(() => { if (view === "dashboard" || view === "ingest") loadQuota(); }, [view]);

  // Superadmin-only manual quota grant (no live payment gateway yet — a
  // package purchase is confirmed out-of-band, then credited here).
  const isSuperadmin = user?.email?.toLowerCase() === "superadmin@demandgeniusai.com";
  const [grantEmail, setGrantEmail] = useState("");
  const [grantDocs, setGrantDocs] = useState("100");
  const [grantBusy, setGrantBusy] = useState(false);
  const [grantMsg, setGrantMsg] = useState("");
  const runGrantQuota = async () => {
    const docs = parseInt(grantDocs, 10);
    if (!grantEmail.trim() || !docs || docs <= 0) return;
    setGrantBusy(true); setGrantMsg("");
    try {
      const updated = await data360Api.grantQuota(grantEmail.trim(), docs);
      setGrantMsg(`${updated.email} now has ${updated.purchased_document_quota} purchased documents credited.`);
      setGrantEmail("");
    } catch (e: any) {
      setGrantMsg(e.message || "Could not grant quota");
    } finally {
      setGrantBusy(false);
    }
  };

  // ── Auth ───────────────────────────────────────────────────────────────
  const handleAuth = async () => {
    setAuthErr(""); setAuthBusy(true);
    try {
      const fn = authTab === "register" ? data360Api.register(name, email, password) : data360Api.login(email, password);
      const { token, user: u } = await fn;
      setToken(token); setUser(u); setView("dashboard"); loadTemplates();
    } catch (e: any) {
      setAuthErr(e.message || "Something went wrong");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleDemo = async () => {
    setAuthErr(""); setAuthBusy(true);
    try {
      const demoEmail = `demo+${Date.now()}@data360.ai`;
      const { token, user: u } = await data360Api.register("Demo Operator", demoEmail, "demo-pass-12345");
      setToken(token); setUser(u); setView("dashboard"); loadTemplates();
    } catch (e: any) {
      setAuthErr(e.message || "Demo login failed");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = () => {
    clearToken(); setUser(null); setView("landing"); setBatches([]);
  };

  // ── Ingestion ────────────────────────────────────────────────────────────
  // Auto-extraction: no field list at all — hand it any document(s) and get
  // back whatever key/value structure each one actually has (flat fields,
  // nested groups, line-item arrays), instead of first deciding field names.
  // Accepts images, PDFs (each page rendered to a real image client-side —
  // no vision provider reliably accepts raw PDF bytes), and .zip archives
  // (unpacked client-side, each image/PDF entry inside processed the same
  // way), any number of files at once.
  type AutoExtractItem = { label: string; busy: boolean; data?: Record<string, any>; provider?: string; cached?: boolean; error?: string };
  const [autoExtractItems, setAutoExtractItems] = useState<AutoExtractItem[]>([]);
  const [autoExtractErr, setAutoExtractErr] = useState("");

  // If a custom field list is set, use the field-list endpoints (structured,
  // exactly those columns); otherwise use the fully-auto endpoints (no field
  // list needed at all, arbitrary JSON shape back).
  const runOneImage = async (label: string, base64: string, mimeType: string, idx: number) => {
    try {
      if (extractionFields.length > 0) {
        const { fields, provider, cached } = await data360Api.aiExtractImage(base64, mimeType, extractionFields, batchName || undefined, label);
        setAutoExtractItems(prev => prev.map((it, i) => i === idx ? { ...it, busy: false, data: fields, provider, cached } : it));
      } else {
        const { data, provider, cached } = await data360Api.aiExtractImageAuto(base64, mimeType, batchName || undefined, label);
        setAutoExtractItems(prev => prev.map((it, i) => i === idx ? { ...it, busy: false, data, provider, cached } : it));
      }
    } catch (e: any) {
      setAutoExtractItems(prev => prev.map((it, i) => i === idx ? { ...it, busy: false, error: e.message || "Auto-extraction failed" } : it));
    }
  };

  // Human-text and voice-transcript extraction share this path — same
  // custom-fields-vs-auto branch as runOneImage, just against raw text
  // instead of an image.
  const runTextItem = async (text: string, label: string) => {
    if (!text.trim()) return;
    const idx = autoExtractItems.length;
    setAutoExtractItems(prev => [...prev, { label, busy: true }]);
    try {
      if (extractionFields.length > 0) {
        const { fields, provider, cached } = await data360Api.aiExtract(text, extractionFields, batchName || undefined, label);
        setAutoExtractItems(prev => prev.map((it, i) => i === idx ? { ...it, busy: false, data: fields, provider, cached } : it));
      } else {
        const { data, provider, cached } = await data360Api.aiExtractAuto(text, batchName || undefined, label);
        setAutoExtractItems(prev => prev.map((it, i) => i === idx ? { ...it, busy: false, data, provider, cached } : it));
      }
    } catch (e: any) {
      setAutoExtractItems(prev => prev.map((it, i) => i === idx ? { ...it, busy: false, error: e.message || "Extraction failed" } : it));
    }
  };

  const runAutoExtractFiles = async (fileList: FileList) => {
    setAutoExtractErr("");
    // Build a flat queue of { label, base64, mimeType } tasks first — PDFs
    // expand into one task per page, zips expand into one task per entry —
    // then kick every task off in parallel against the placeholder list.
    type Task = { label: string; base64: string; mimeType: string };
    const tasks: Task[] = [];

    for (const file of Array.from(fileList)) {
      try {
        if (file.type.startsWith("image/")) {
          tasks.push({ label: file.name, base64: await fileToBase64(file), mimeType: file.type });
        } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          const pages = await renderPdfPageImages(file);
          pages.forEach((p, i) => tasks.push({ label: pages.length > 1 ? `${file.name} (page ${i + 1})` : file.name, base64: p.base64, mimeType: p.mimeType }));
        } else if (file.type === "application/zip" || file.name.toLowerCase().endsWith(".zip")) {
          const JSZip = (await import("jszip")).default;
          const zip = await JSZip.loadAsync(file);
          for (const [entryName, entry] of Object.entries(zip.files)) {
            if (entry.dir) continue;
            const lower = entryName.toLowerCase();
            if (/\.(png|jpe?g|webp|gif)$/.test(lower)) {
              const blob = await entry.async("blob");
              const mimeType = blob.type || (lower.endsWith(".png") ? "image/png" : "image/jpeg");
              const base64 = await fileToBase64(new File([blob], entryName, { type: mimeType }));
              tasks.push({ label: entryName, base64, mimeType });
            } else if (lower.endsWith(".pdf")) {
              const blob = await entry.async("blob");
              const pdfFile = new File([blob], entryName, { type: "application/pdf" });
              const pages = await renderPdfPageImages(pdfFile);
              pages.forEach((p, i) => tasks.push({ label: pages.length > 1 ? `${entryName} (page ${i + 1})` : entryName, base64: p.base64, mimeType: p.mimeType }));
            }
          }
        } else {
          setAutoExtractErr(prev => prev ? `${prev} / "${file.name}" is an unsupported type` : `"${file.name}" is an unsupported type — use an image, PDF, or .zip of those`);
        }
      } catch (e: any) {
        setAutoExtractErr(prev => prev ? `${prev} / ${file.name}: ${e.message}` : `${file.name}: ${e.message || "could not be read"}`);
      }
    }

    if (tasks.length === 0) return;
    const baseIdx = autoExtractItems.length;
    setAutoExtractItems(prev => [...prev, ...tasks.map(t => ({ label: t.label, busy: true }))]);
    tasks.forEach((t, i) => runOneImage(t.label, t.base64, t.mimeType, baseIdx + i));
  };

  const applyAutoExtractResult = (idx: number) => {
    const item = autoExtractItems[idx];
    if (!item?.data) return;
    const flat = flattenAutoExtract(item.data);
    setStagedFieldNames(prev => Array.from(new Set([...prev, ...Object.keys(flat)])));
    setPendingRows(prev => [...prev, { source_type: "screenshot", fields: flat, raw_snippet: JSON.stringify(item.data).slice(0, 500) }]);
  };
  const useAllAutoExtractResults = () => {
    const ready = autoExtractItems.filter(it => it.data);
    if (ready.length === 0) return;
    const allFieldNames = new Set<string>();
    const newRows: IngestRow[] = ready.map(it => {
      const flat = flattenAutoExtract(it.data!);
      Object.keys(flat).forEach(k => allFieldNames.add(k));
      return { source_type: "screenshot" as const, fields: flat, raw_snippet: JSON.stringify(it.data).slice(0, 500) };
    });
    setStagedFieldNames(prev => Array.from(new Set([...prev, ...allFieldNames])));
    setPendingRows(prev => [...prev, ...newRows]);
  };

  const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const toggleVoice = () => {
    if (voiceActive) {
      recognizerRef.current?.stop();
      return;
    }
    if (!isVoiceSupported()) { setIngestErr("Voice dictation isn't supported in this browser — try Chrome or Edge."); return; }
    setIngestErr(""); setVoiceTranscript("");
    const recognizer = createVoiceRecognizer(
      (transcript) => setVoiceTranscript(transcript),
      () => setVoiceActive(false),
      (msg) => { setIngestErr(msg); setVoiceActive(false); }
    );
    recognizerRef.current = recognizer;
    recognizer.start();
    setVoiceActive(true);
  };

  const extractVoiceTranscript = () => {
    if (!voiceTranscript.trim()) return;
    runTextItem(voiceTranscript, "Voice dictation");
    setVoiceTranscript("");
  };

  const [batchName, setBatchName] = useState("");
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [quotaBlock, setQuotaBlock] = useState<DataQuota & { used: number; limit: number } | null>(null);
  const createBatch = async () => {
    if (!batchName.trim() || pendingRows.length === 0) return;
    setCreatingBatch(true); setIngestErr(""); setQuotaBlock(null);
    try {
      const { batch } = await data360Api.createBatch(batchName.trim(), "auto_extract", pendingRows, effectiveFields, selectedTemplateId || undefined);
      setPendingRows([]); setStagedFieldNames([]); setBatchName("");
      setActiveBatchId(batch.id);
      await openReview(batch.id);
    } catch (e: any) {
      if (e instanceof ApiError && e.code === "QUOTA_EXCEEDED") {
        setQuotaBlock(e.data);
      } else {
        setIngestErr(e.message || "Could not create the batch");
      }
    } finally {
      setCreatingBatch(false);
    }
  };

  const applyTemplate = (tpl: D360Template) => {
    setSelectedTemplateId(tpl.id);
    setFieldTemplate("custom");
    setFieldsInput(tpl.extraction_fields.join(", "));
  };

  const saveCurrentAsTemplate = async () => {
    // Uses effectiveFields (not extractionFields) so this works whether the
    // fields came from the Custom Fields box OR were auto-discovered by
    // Auto-Extract — otherwise there'd be no way to save a template at all
    // in the (now-default) fully-automatic mode.
    if (!newTemplateName.trim() || effectiveFields.length === 0) return;
    setSavingTemplate(true);
    try {
      const tpl = await data360Api.createTemplate(newTemplateName.trim(), effectiveFields, "coordinate_layout");
      setTemplates(prev => [tpl, ...prev]);
      setSelectedTemplateId(tpl.id);
      setNewTemplateName("");
    } catch (e: any) {
      setIngestErr(e.message || "Could not save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  // ── Review / approval ──────────────────────────────────────────────────
  // Fallback for legacy batches ingested before dynamic field extraction existed.
  const DEFAULT_MAPPING: Record<string, string> = { extracted_entity: "entity_name", target_field_a: "amount", target_field_b: "email", source_type: "source_type" };

  const openReview = async (batchId: string) => {
    setActiveBatchId(batchId); setReviewLoading(true); setReviewErr(""); setView("review");
    try {
      const { batch, rows, jobs } = await data360Api.getBatch(batchId);
      setActiveBatch(batch); setActiveRows(rows); setActiveJobs(jobs);
      setGenTemplateId(batch.template_id || "");
      const identityMapping = Object.fromEntries((batch.extraction_fields || []).map(f => [f, f]));
      setMapping(
        Object.keys(batch.field_mapping || {}).length ? batch.field_mapping
        : Object.keys(identityMapping).length ? identityMapping
        : DEFAULT_MAPPING
      );
    } finally { setReviewLoading(false); }
  };

  const saveMappingAndContinue = async () => {
    if (!activeBatchId) return;
    setMappingBusy(true);
    try {
      const batch = await data360Api.saveMapping(activeBatchId, mapping);
      setActiveBatch(batch);
      setDistributeResult(null);
      setGenerationJob(null);
      setGenTemplateId(batch.template_id || "");
      go("generate");
    } finally { setMappingBusy(false); }
  };

  // ── Generate (row → real document, from a saved template) ────────────────
  // Lets a user create a template right from the Generate screen, using the
  // active batch's own already-known field list — instead of sending them
  // back to New Batch to find "Save as Template" under a field list they'd
  // have to recreate from scratch.
  const [genNewTemplateName, setGenNewTemplateName] = useState("");
  const [genSavingTemplate, setGenSavingTemplate] = useState(false);
  // The generated document should only ever contain the fields actually
  // mapped (checked) in the Mapping stage, under their destination names —
  // not every raw extraction field, some of which may have been
  // deliberately excluded.
  const mappedFieldNames = Array.from(new Set(Object.values(activeBatch?.field_mapping || {}).filter((v): v is string => !!v?.trim())));
  const templateFieldSource = mappedFieldNames.length ? mappedFieldNames : (activeBatch?.extraction_fields || []);
  const saveTemplateFromActiveBatch = async () => {
    if (!genNewTemplateName.trim() || templateFieldSource.length === 0) return;
    setGenSavingTemplate(true);
    try {
      const tpl = await data360Api.createTemplate(genNewTemplateName.trim(), templateFieldSource, "coordinate_layout");
      setTemplates(prev => [tpl, ...prev]);
      setGenTemplateId(tpl.id);
      setGenNewTemplateName("");
    } finally {
      setGenSavingTemplate(false);
    }
  };

  const downloadBase64Pdf = (file_base64: string, file_name: string) => {
    const bytes = atob(file_base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const runGenerate = async () => {
    if (!activeBatchId || !genTemplateId) return;
    setGenerateBusy(true); setGenerationJob(null);
    try {
      const job = await data360Api.generate(activeBatchId, genTemplateId);
      setGenerationJob(job);
    } catch (e: any) {
      setGenerationJob({ id: "", batch_id: activeBatchId, template_id: genTemplateId, status: "failed", result: { error: e.message }, created_at: "", completed_at: null });
    } finally {
      setGenerateBusy(false);
    }
  };

  const refreshReview = async (): Promise<D360Row[]> => {
    if (!activeBatchId) return [];
    const { batch, rows, jobs } = await data360Api.getBatch(activeBatchId);
    setActiveBatch(batch); setActiveRows(rows); setActiveJobs(jobs);
    return rows;
  };

  const openFocusedRow = (row: D360Row) => {
    setFocusedRow(row);
    const names = activeBatch?.extraction_fields?.length ? activeBatch.extraction_fields : ["Amount", "Email"];
    const seed: Record<string, string> = {};
    for (const name of names) seed[name] = row.fields?.[name] ?? (name === "Amount" ? row.target_field_a : name === "Email" ? row.target_field_b : "") ?? "";
    setOverrideFields(seed);
  };

  // After resolving one row, jump straight to the next row still awaiting
  // review (if any) instead of just closing the modal — with several
  // flagged rows in a batch, silently returning to the table after each one
  // made it look like nothing was happening / progress was stuck, when
  // really there was just another row left to handle.
  const advanceOrClose = (rows: D360Row[], justResolvedId: string) => {
    const next = rows.find(r => r.id !== justResolvedId && r.requires_manual_review && r.status === "pending");
    if (next) openFocusedRow(next); else setFocusedRow(null);
  };

  const approveRow = async (row: D360Row) => {
    setRowBusy(row.id); setReviewErr("");
    try {
      await data360Api.updateRow(row.batch_id, row.id, { status: "approved" });
      const rows = await refreshReview();
      advanceOrClose(rows, row.id);
    } catch (e: any) {
      setReviewErr(e.message || "Could not approve this row");
    } finally { setRowBusy(null); }
  };

  const rejectRow = async (row: D360Row) => {
    setRowBusy(row.id); setReviewErr("");
    try {
      await data360Api.updateRow(row.batch_id, row.id, { status: "rejected" });
      const rows = await refreshReview();
      advanceOrClose(rows, row.id);
    } catch (e: any) {
      setReviewErr(e.message || "Could not delete this row");
    } finally { setRowBusy(null); }
  };

  const applyOverride = async (row: D360Row) => {
    setRowBusy(row.id); setReviewErr("");
    try {
      await data360Api.updateRow(row.batch_id, row.id, {
        status: "approved",
        manual_override: { fields: overrideFields },
      });
      const rows = await refreshReview();
      advanceOrClose(rows, row.id);
    } catch (e: any) {
      setReviewErr(e.message || "Could not save this override");
    } finally { setRowBusy(null); }
  };

  // ── Distribution ────────────────────────────────────────────────────────
  const runDistribution = async () => {
    if (!activeBatchId) return;
    setDistributeBusy(true); setDistributeResult(null);
    try {
      let config: Record<string, any> = {};
      if (targetType === "cloud_storage") config = { provider: cloudProvider, bucket_name: bucketName };
      if (targetType === "database") config = { connection_string: dbConnectionString, table_name: dbTableName };
      if (targetType === "api") config = { url: apiUrl, method: apiMethod, format: apiFormat, auth_token: apiAuthToken || undefined };
      if (targetType === "rpa_portal") config = { target_url: rpaUrl, auth_profile: rpaProfile, secret_password_token: rpaToken };
      const job = await data360Api.distribute(activeBatchId, targetType, config);
      setDistributeResult(job);

      if (targetType === "file_export" && job.result?.file_base64) {
        const bytes = atob(job.result.file_base64);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        const blob = new Blob([arr], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = job.result.file_name || "data360_export.xlsx";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      setDistributeResult({ id: "", batch_id: activeBatchId, target_type: targetType, config: {}, status: "failed", result: { error: e.message }, created_at: "", completed_at: null });
    } finally {
      setDistributeBusy(false);
    }
  };

  const flaggedPending = activeRows.filter(r => r.requires_manual_review && r.status === "pending");
  const approvedCount = activeRows.filter(r => r.status === "approved").length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button onClick={() => go(user ? "dashboard" : "landing")} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center"><Database size={16} className="text-white" /></div>
            <div className="text-left">
              <p className="font-black text-gray-900 text-sm leading-none">Data360</p>
              <p className="text-[9px] text-teal-600 font-semibold leading-none mt-1">Nexus Flow RPA Engine</p>
            </div>
          </button>
          {user && (
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <button onClick={() => go("dashboard")} className={`hover:text-teal-600 transition ${view === "dashboard" ? "text-teal-600 font-bold" : ""}`}>Batches</button>
              <button onClick={() => { setPendingRows([]); go("ingest"); }} className={`hover:text-teal-600 transition ${view === "ingest" ? "text-teal-600 font-bold" : ""}`}>New Batch</button>
              <button onClick={() => go("school")} className={`hover:text-teal-600 transition ${view === "school" ? "text-teal-600 font-bold" : ""}`}>School</button>
              <button onClick={() => go("settings")} className={`hover:text-teal-600 transition ${view === "settings" ? "text-teal-600 font-bold" : ""}`}>Settings</button>
            </div>
          )}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-black text-sm">{user.name[0]}</div>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 transition"><LogOut size={16} /></button>
              </>
            ) : (
              <button onClick={() => go("auth")} className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-4 py-2 rounded-lg transition">Get Started</button>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════════════════ LANDING ══════════════════════ */}
      {view === "landing" && (
        <>
          <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 text-white">
            <div className="max-w-7xl mx-auto px-4 py-12 sm:py-20 text-center">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold mb-5 border border-white/20">
                <Sparkles size={12} className="text-yellow-300" /> Omni-Channel Ingestion · Human-in-the-Loop
              </div>
              <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-4">
                Autonomous Data Entry.<br /><span className="text-yellow-300">100% Verified.</span>
              </h1>
              <p className="text-teal-100 text-sm sm:text-base max-w-xl mx-auto mb-8">
                Data360 ingests Excel, PDF, screenshots, and voice dictation, runs an AI validation agent, gates every anomaly behind a human approval, then distributes verified rows to a file, cloud storage, or an RPA target.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={() => go("auth")} className="bg-white text-teal-700 hover:bg-teal-50 font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 transition">
                  Get Started Free <ArrowRight size={16} />
                </button>
                <button onClick={() => { setAuthTab("register"); go("auth"); }} className="border border-white/40 bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-6 py-3 rounded-xl transition">
                  Try Live Demo
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6 overflow-x-auto text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1.5 shrink-0"><Upload size={12} className="text-teal-500" /><strong className="text-gray-900">4</strong> Ingestion Channels</span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1.5 shrink-0"><ShieldCheck size={12} className="text-teal-500" /><strong className="text-gray-900">Real-time</strong> Validation Agent</span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1.5 shrink-0"><ClipboardCheck size={12} className="text-teal-500" /><strong className="text-gray-900">Human</strong> Approval Gate</span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1.5 shrink-0 text-green-600 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />Live Pipeline</span>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Five vectors in, one clean structure out</h2>
              <p className="text-gray-500 mt-2 text-sm">Every channel runs fully client-side — nothing leaves your browser until you approve it.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {CHANNELS.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.title} className="bg-white border border-gray-200 hover:border-teal-300 rounded-2xl p-5 transition-all">
                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-4 text-teal-600"><Icon size={18} /></div>
                    <h3 className="font-black text-gray-900 text-sm mb-1.5">{c.title}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">{c.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border-y border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-16">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900">The pipeline, stage by stage</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {STAGES.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="relative bg-slate-50 border border-gray-200 rounded-2xl p-5">
                      <span className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center">{i + 1}</span>
                      <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center mb-4 text-teal-700"><Icon size={18} /></div>
                      <h3 className="font-black text-gray-900 text-sm mb-1">{s.label}</h3>
                      <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="bg-gradient-to-br from-teal-700 to-emerald-600 rounded-3xl p-10 text-center text-white">
              <h2 className="text-2xl sm:text-3xl font-black mb-3">Zero manual entry. Zero bad rows.</h2>
              <p className="text-teal-100 text-sm mb-8">Upload a spreadsheet and watch the validation agent flag every anomaly before it ever reaches a target system.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={handleDemo} disabled={authBusy} className="inline-flex items-center justify-center gap-2 bg-white text-teal-700 hover:bg-teal-50 px-7 py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                  {authBusy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} Try Live Demo
                </button>
                <Link href="/" className="inline-flex items-center justify-center gap-2 border border-white/40 hover:border-white text-white px-7 py-3.5 rounded-xl font-medium text-sm transition-all">
                  Back to DemandGeniusAI
                </Link>
              </div>
              {authErr && <p className="text-red-100 text-xs mt-4">{authErr}</p>}
            </div>
          </div>

          <footer className="bg-gray-900 text-white py-10">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center"><Database size={16} className="text-white" /></div>
                <div><p className="font-black text-sm">Data360</p><p className="text-gray-400 text-xs">Nexus Flow RPA Engine</p></div>
              </div>
              <Link href="/" className="text-teal-400 hover:text-white transition text-xs">← Back to DemandGeniusAI</Link>
            </div>
            <p className="text-center text-xs text-gray-600 mt-6">© 2026 Data360 · Powered by Paariwala Platform</p>
          </footer>
        </>
      )}

      {/* ══════════════════════ AUTH ══════════════════════ */}
      {view === "auth" && (
        <div className="min-h-[calc(100vh-61px)] bg-slate-50 flex items-center justify-center px-4 py-12">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-gray-900 text-lg">{authTab === "register" ? "Create Your Workspace" : "Welcome Back"}</h2>
              <button onClick={() => go("landing")} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1">
              {(["register", "login"] as const).map(t => (
                <button key={t} onClick={() => { setAuthTab(t); setAuthErr(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${authTab === t ? "bg-white text-teal-700 shadow" : "text-gray-500 hover:text-gray-700"}`}>
                  {t === "register" ? "Register" : "Sign In"}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {authTab === "register" && (
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
              )}
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
            </div>
            {authErr && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{authErr}</p>}
            <button onClick={handleAuth} disabled={authBusy} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2">
              {authBusy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} {authTab === "register" ? "Create Account" : "Sign In"}
            </button>
            <button onClick={handleDemo} disabled={authBusy} className="w-full text-center text-xs text-teal-600 font-bold hover:underline">Or jump straight into the live demo →</button>
          </div>
        </div>
      )}

      {/* ══════════════════════ DASHBOARD ══════════════════════ */}
      {view === "dashboard" && user && (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-black text-gray-900">Welcome back, {user.name.split(" ")[0]}</h2>
              <p className="text-sm text-gray-500">Ingest a file or start dictating to create a new batch.</p>
            </div>
            <button onClick={() => { setPendingRows([]); go("ingest"); }} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition">
              <Plus size={16} /> New Batch
            </button>
          </div>

          {batchesLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={24} /></div>
          ) : batches.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <Database size={28} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-4">No batches yet. Ingest a file or dictate a record to get started.</p>
              <button onClick={() => go("ingest")} className="text-sm text-teal-600 font-bold hover:underline">Create your first batch →</button>
            </div>
          ) : (
            <div className="space-y-3">
              {batches.map(b => (
                <button key={b.id} onClick={() => openReview(b.id)} className="w-full text-left bg-white border border-gray-200 hover:border-teal-300 hover:shadow-md rounded-2xl p-5 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{b.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${BATCH_STATUS_STYLE[b.status]}`}>{b.status.replace("_", " ")}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400">
                        <span className="capitalize">{b.source_channel}</span>
                        <span>{b.total_rows} rows</span>
                        {b.flagged_rows > 0 && <span className="text-amber-600 font-semibold">{b.flagged_rows} flagged</span>}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════ INGEST ══════════════════════ */}
      {view === "ingest" && user && (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <button onClick={() => go("dashboard")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 transition"><ArrowRight size={14} className="rotate-180" /> Back to Batches</button>
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><Sparkles size={18} className="text-teal-600" /> Auto-Extract — No Field List Needed</h2>
            <p className="text-sm text-gray-500">Upload a document, paste text, or dictate a record — AI reads it and hands back structured data, no field list required. Everything lands in one staging table below.</p>
          </div>

          {quota && !quota.unlimited && (
            <div className={`rounded-xl px-4 py-2.5 text-xs font-bold flex items-center justify-between gap-3 ${quota.remaining === 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-50 text-gray-500 border border-gray-200"}`}>
              <span>{quota.used} of {quota.limit} free documents used{quota.remaining === 0 ? " — buy a package below to continue" : ""}</span>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <button onClick={() => setShowCustomFields(v => !v)} className="w-full flex items-center justify-between text-left">
              <span className="font-black text-gray-900 text-sm flex items-center gap-2"><LayoutTemplate size={15} className="text-teal-600" /> Custom fields (optional)</span>
              <ChevronRight size={14} className={`text-gray-400 transition-transform ${showCustomFields ? "rotate-90" : ""}`} />
            </button>
            <p className="text-xs text-gray-400 mt-1">Leave this closed for fully-automatic extraction. Open it to pin down an exact field list instead — every upload/paste/voice note below will then be parsed for exactly those fields.</p>
            {showCustomFields && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-2 mb-3">
                  {(Object.keys(FIELD_TEMPLATES) as (keyof typeof FIELD_TEMPLATES)[]).map(key => (
                    <button key={key}
                      onClick={() => { setFieldTemplate(key); setFieldsInput(FIELD_TEMPLATES[key].fields.join(", ")); setSelectedTemplateId(""); }}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${fieldTemplate === key ? "bg-teal-600 border-teal-600 text-white" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                      {FIELD_TEMPLATES[key].label}
                    </button>
                  ))}
                </div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Fields to extract (comma-separated)</label>
                <textarea
                  value={fieldsInput}
                  onChange={e => { setFieldsInput(e.target.value); setFieldTemplate("custom"); setSelectedTemplateId(""); }}
                  rows={2}
                  placeholder="e.g. Invoice Number, Vendor Name, Amount, Phone"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none"
                />
                {extractionFields.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {extractionFields.map(f => <span key={f} className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">{f}</span>)}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Or just describe it in plain English</label>
                  <p className="text-[11px] text-gray-400 mb-1.5">e.g. "give me amount, item, date, item wise and total amount" — we'll turn that into the field list above.</p>
                  <div className="flex items-start gap-2">
                    <textarea value={instructionInput} onChange={e => setInstructionInput(e.target.value)} rows={1}
                      placeholder="Describe what you want extracted…"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none" />
                    <button onClick={applyInstruction} disabled={!instructionInput.trim()}
                      className="flex items-center gap-1.5 bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 disabled:opacity-40 font-bold text-xs px-3 py-2.5 rounded-xl transition shrink-0">
                      <Sparkles size={12} /> Convert to Fields
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-black text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5"><LayoutTemplate size={13} className="text-teal-600" /> Reusable templates</h4>
                  {templates.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {templates.map(tpl => (
                        <button key={tpl.id} onClick={() => applyTemplate(tpl)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${selectedTemplateId === tpl.id ? "bg-teal-600 border-teal-600 text-white" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                          {tpl.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="Name this field list to reuse it later…"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-400" />
                    <button onClick={saveCurrentAsTemplate} disabled={savingTemplate || !newTemplateName.trim() || effectiveFields.length === 0}
                      className="flex items-center gap-1.5 bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 disabled:opacity-40 font-bold text-xs px-3 py-2 rounded-lg transition shrink-0">
                      {savingTemplate ? <Loader2 size={12} className="animate-spin" /> : <LayoutTemplate size={12} />} Save as Template
                    </button>
                  </div>
                  {selectedTemplateId && <p className="text-[11px] text-teal-600 mt-2">This batch will be linked to that template — after review you'll be able to Generate a real document from it.</p>}
                  {effectiveFields.length === 0 && <p className="text-[11px] text-gray-400 mt-2">No fields yet — run Auto-Extract below first, or type a field list above.</p>}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border-2 border-dashed border-teal-200 rounded-2xl p-6">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {([
                ["upload", "Upload File", Upload],
                ["text", "Paste Text", FileText],
                ["voice", "Voice Dictation", Mic],
              ] as [InputMode, string, any][]).map(([key, label, Icon]) => (
                <button key={key} onClick={() => setInputMode(key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition ${inputMode === key ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  <Icon size={18} className={inputMode === key ? "text-teal-600" : "text-gray-400"} />
                  <span className={`text-xs font-bold ${inputMode === key ? "text-teal-700" : "text-gray-600"}`}>{label}</span>
                </button>
              ))}
            </div>

            {inputMode === "upload" && (
              <div>
                <label className="border-2 border-dashed border-gray-200 hover:border-teal-300 rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer transition">
                  <Bot size={22} className="text-gray-300" />
                  <span className="text-sm text-gray-600 font-bold">Drag & drop, or click to choose files</span>
                  <span className="text-xs text-gray-400">Images, PDFs, or a .zip of them — any number at once</span>
                  <input type="file" accept="image/*,application/pdf,.pdf,.zip,application/zip" multiple className="hidden"
                    onChange={e => { if (e.target.files?.length) runAutoExtractFiles(e.target.files); e.target.value = ""; }} />
                </label>
                <p className="text-xs text-gray-400 mt-3">Invoices, forms, receipts, scanned pages — every PDF page and zip entry is processed as its own document.</p>
              </div>
            )}
            {inputMode === "text" && (
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Paste or type the document's text</label>
                <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={5}
                  placeholder="Paste an invoice, receipt, email, or any raw text here…"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none" />
                <button onClick={() => { runTextItem(pasteText, "Pasted text"); setPasteText(""); }} disabled={!pasteText.trim()}
                  className="mt-2 flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-xs px-3 py-2 rounded-lg transition">
                  <Bot size={13} /> Extract
                </button>
              </div>
            )}
            {inputMode === "voice" && (
              <div className="flex flex-col items-center gap-4 py-6">
                <button onClick={toggleVoice}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition ${voiceActive ? "bg-red-500 animate-pulse" : "bg-teal-600 hover:bg-teal-700"}`}>
                  {voiceActive ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
                </button>
                <p className="text-xs text-gray-400">{voiceActive ? "Listening… tap to stop" : "Tap to speak"}</p>
                {voiceTranscript && (
                  <div className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3">
                    <p className="text-sm text-gray-700">{voiceTranscript}</p>
                    <button onClick={extractVoiceTranscript} className="mt-2 flex items-center gap-1.5 text-xs text-teal-600 font-bold hover:underline"><Bot size={12} /> Extract from transcript</button>
                  </div>
                )}
              </div>
            )}
            {ingestErr && <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{ingestErr}</p>}
            {ingestBusy && <p className="mt-3 text-xs text-teal-600 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Parsing…</p>}
            {autoExtractErr && <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{autoExtractErr}</p>}

            {autoExtractItems.length > 0 && (
              <div className="space-y-3 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{autoExtractItems.length} document{autoExtractItems.length === 1 ? "" : "s"}</p>
                  {autoExtractItems.some(it => it.data) && (
                    <button onClick={useAllAutoExtractResults} className="text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-lg transition">
                      Use All as Staged Rows
                    </button>
                  )}
                </div>
                {autoExtractItems.map((item, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-700 truncate">{item.label}</span>
                      {item.busy && <Loader2 size={13} className="animate-spin text-teal-500 shrink-0" />}
                      {item.data && (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-gray-400">via {item.provider}</span>
                          {item.cached && <span className="text-[9px] font-bold text-teal-600 bg-teal-50 border border-teal-200 rounded-full px-1.5 py-0.5">cached</span>}
                          <button onClick={() => applyAutoExtractResult(i)} className="text-[10px] font-bold text-white bg-teal-600 hover:bg-teal-700 px-2 py-1 rounded-lg transition">
                            Use as Staged Row
                          </button>
                        </div>
                      )}
                      {item.error && <span className="text-[10px] text-red-500 shrink-0" title={item.error}>failed</span>}
                    </div>
                    {item.data && (
                      <pre className="bg-gray-900 text-teal-300 text-[11px] rounded-lg p-3 overflow-x-auto max-h-56 overflow-y-auto">
{JSON.stringify(item.data, null, 2)}
                      </pre>
                    )}
                    {item.error && <p className="text-[11px] text-red-500">{item.error}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {pendingRows.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-gray-900 text-sm">Staged Rows ({pendingRows.length})</h3>
                <button onClick={() => { setPendingRows([]); setStagedFieldNames([]); }} className="text-xs text-gray-400 hover:text-red-500">Clear all</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="py-1.5 pr-3 font-bold">Source</th>
                      {effectiveFields.map(f => <th key={f} className="py-1.5 pr-3 font-bold">{f}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRows.map((r, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-1.5 pr-3 capitalize text-gray-500">{r.source_type}</td>
                        {effectiveFields.map(f => <td key={f} className="py-1.5 pr-3 text-gray-800 font-medium">{r.fields?.[f] || "—"}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Surfaced here (not just inside the collapsed Custom Fields
                  panel) since this is the first point in the flow where real
                  field names definitely exist — whether typed manually or
                  discovered by Auto-Extract — and it's what unlocks the
                  Generate stage later (Generate needs a saved template). */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                {selectedTemplateId ? (
                  <p className="text-xs text-teal-600 font-bold flex items-center gap-1.5"><LayoutTemplate size={13} /> Linked to a saved template — after review, you'll be able to Generate a real document from it.</p>
                ) : (
                  <>
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Want to Generate a real document later? Save these fields as a template</label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <input value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="Name this template, e.g. &quot;Invoice&quot;…"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-400" />
                      <button onClick={saveCurrentAsTemplate} disabled={savingTemplate || !newTemplateName.trim() || effectiveFields.length === 0}
                        className="flex items-center gap-1.5 bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 disabled:opacity-40 font-bold text-xs px-3 py-2 rounded-lg transition shrink-0">
                        {savingTemplate ? <Loader2 size={12} className="animate-spin" /> : <LayoutTemplate size={12} />} Save as Template
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Optional — you can always Create &amp; Validate without one and just download/distribute the raw data instead.</p>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <input value={batchName} onChange={e => setBatchName(e.target.value)} placeholder="Name this batch…" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                <button onClick={createBatch} disabled={creatingBatch || !batchName.trim()} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition">
                  {creatingBatch ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Create &amp; Validate
                </button>
              </div>

              {quotaBlock && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                  <p className="text-sm text-amber-800 font-bold">You've used {quotaBlock.used} of your {quotaBlock.limit}-document free quota — choose a package to keep going.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quotaBlock.packages.map(pkg => (
                      <div key={pkg.id} className="border border-amber-200 bg-white rounded-xl p-4">
                        <p className="font-black text-gray-900 text-sm">{pkg.name}</p>
                        <p className="text-2xl font-black text-teal-700 mt-1">₹{pkg.price_inr.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-gray-500">{pkg.documents} documents{pkg.support ? " · support provided" : ""}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-[11px] text-amber-700">Payments are handled manually for now — contact support to arrange payment; your quota is credited as soon as it's confirmed.</p>
                    <a href={`mailto:paariwalaconnect@gmail.com?subject=${encodeURIComponent("Data360 package purchase")}&body=${encodeURIComponent(`Hi,\n\nI'd like to purchase a Data360 document package.\n\nAccount email: ${user?.email || ""}\nPackage: \n\nThanks!`)}`}
                      className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3 py-2 rounded-lg transition shrink-0">
                      <Globe size={12} /> Contact paariwalaconnect@gmail.com
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════ REVIEW / APPROVAL ══════════════════════ */}
      {view === "review" && user && (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
          <button onClick={() => go("dashboard")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 transition"><ArrowRight size={14} className="rotate-180" /> Back to Batches</button>

          {reviewLoading || !activeBatch ? (
            <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={24} /></div>
          ) : (
            <>
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="font-black text-gray-900 text-lg">{activeBatch.name}</h2>
                    <p className="text-xs text-gray-400 font-mono mt-1">Batch #{activeBatch.id.slice(0, 8)}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${BATCH_STATUS_STYLE[activeBatch.status]}`}>{activeBatch.status.replace("_", " ")}</span>
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                  <span>{activeRows.length} total rows</span>
                  <span className="text-amber-600 font-semibold">{flaggedPending.length} awaiting review</span>
                  <span className="text-green-600 font-semibold">{approvedCount} approved</span>
                </div>
              </div>

              {/* Pipeline stepper — makes each stage of this batch's lifecycle
                  explicit (ingest already happened by the time this screen
                  loads; validate ran server-side at ingest time) instead of
                  it being implicit in which view/button is showing. */}
              {(() => {
                const reviewDone = flaggedPending.length === 0;
                const mapDone = Object.keys(activeBatch.field_mapping || {}).length > 0;
                const outputDone = activeBatch.status === "distributed" || activeJobs.some(j => j.status === "completed");
                const steps: { label: string; done: boolean; current: boolean }[] = [
                  { label: "Ingest", done: true, current: false },
                  { label: "Validate", done: true, current: false },
                  { label: "Review", done: reviewDone, current: !reviewDone },
                  { label: "Map", done: mapDone, current: reviewDone && !mapDone },
                  { label: "Generate / Distribute", done: outputDone, current: reviewDone && mapDone && !outputDone },
                ];
                return (
                  <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4">
                    <div className="flex items-center">
                      {steps.map((s, i) => (
                        <div key={s.label} className="flex items-center flex-1 last:flex-none">
                          <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                              s.done ? "bg-teal-600 border-teal-600 text-white"
                              : s.current ? "border-teal-500 text-teal-600 bg-teal-50"
                              : "border-gray-200 text-gray-300"
                            }`}>
                              {s.done ? <CheckCircle size={14} /> : i + 1}
                            </div>
                            <span className={`text-[10px] font-bold text-center whitespace-nowrap ${s.done || s.current ? "text-gray-700" : "text-gray-300"}`}>{s.label}</span>
                          </div>
                          {i < steps.length - 1 && (
                            <div className={`h-0.5 flex-1 mx-1.5 rounded-full ${steps[i + 1].done || steps[i + 1].current ? "bg-teal-300" : "bg-gray-100"}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-slate-50">
                        <th className="py-2.5 px-4">Row</th><th className="py-2.5 px-4">Source</th>
                        {(activeBatch.extraction_fields?.length ? activeBatch.extraction_fields : ["Entity", "Amount", "Email"]).map(f => (
                          <th key={f} className="py-2.5 px-4">{f}</th>
                        ))}
                        <th className="py-2.5 px-4">Verdict</th><th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRows.map(r => {
                        const vs = VERDICT_STYLE[r.verdict_level] || VERDICT_STYLE.ok;
                        const cols = activeBatch.extraction_fields?.length ? activeBatch.extraction_fields : ["Entity", "Amount", "Email"];
                        const legacy: Record<string, string | null> = { Entity: r.extracted_entity ?? null, Amount: r.target_field_a ?? null, Email: r.target_field_b ?? null };
                        return (
                          <tr key={r.id} className={`border-b border-gray-50 ${r.status === "rejected" ? "opacity-40" : ""}`}>
                            <td className="py-2.5 px-4 text-gray-400 font-mono text-xs">#{String(r.row_index + 1).padStart(3, "0")}</td>
                            <td className="py-2.5 px-4 text-gray-500 capitalize text-xs">{r.source_type}</td>
                            {cols.map(f => (
                              <td key={f} className="py-2.5 px-4 text-gray-900 font-medium text-xs max-w-[160px] truncate">{r.fields?.[f] || legacy[f] || "—"}</td>
                            ))}
                            <td className="py-2.5 px-4">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${vs.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${vs.dot}`} />{r.agent_verdict}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              {r.status === "pending" ? (
                                <button onClick={() => openFocusedRow(r)} className="text-xs font-bold text-teal-600 hover:underline">Review</button>
                              ) : (
                                <span className={`text-[10px] font-bold ${r.status === "approved" ? "text-green-600" : "text-red-500"}`}>{r.status}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {reviewErr && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{reviewErr}</p>}

              {flaggedPending.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={20} className="text-amber-500" />
                    <p className="text-sm text-amber-700 font-bold">{flaggedPending.length} row{flaggedPending.length === 1 ? "" : "s"} still need{flaggedPending.length === 1 ? "s" : ""} review before you can proceed to Mapping.</p>
                  </div>
                  <button onClick={() => openFocusedRow(flaggedPending[0])} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition">
                    Review Next <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {flaggedPending.length === 0 && activeBatch.status !== "distributed" && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-green-600" />
                    <p className="text-sm text-green-700 font-bold">All rows resolved — ready to map onto your destination schema.</p>
                  </div>
                  <button onClick={() => go("mapping")} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition">
                    Proceed to Mapping <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Manual review side panel ── */}
      {focusedRow && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setFocusedRow(null)}>
          <div className="bg-white rounded-2xl w-full max-w-[95vw] xl:max-w-7xl h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 shrink-0">
              <h3 className="font-black text-gray-900 text-lg flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /> Manual Review — Row #{String(focusedRow.row_index + 1).padStart(3, "0")}</h3>
              <button onClick={() => setFocusedRow(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center shrink-0"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto grow">
              {reviewErr && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{reviewErr}</p>}
              <div className={`text-xs font-bold px-3 py-2 rounded-lg border inline-block ${(VERDICT_STYLE[focusedRow.verdict_level] || VERDICT_STYLE.ok).badge}`}>{focusedRow.agent_verdict}</div>
              {focusedRow.raw_snippet && (
                <div className="bg-slate-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Raw Source Snippet</p>
                  <p className="text-xs text-gray-600 font-mono leading-relaxed max-h-24 overflow-y-auto">{focusedRow.raw_snippet}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Object.keys(overrideFields).map(name => {
                  const isLong = /item\s*-?\s*wise|itemi[sz]ed|line\s*items?|break\s*-?\s*down|address/i.test(name) || overrideFields[name].length > 60;
                  return (
                    <div key={name} className={isLong ? "sm:col-span-2" : undefined}>
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">{name}</label>
                      {isLong ? (
                        <textarea value={overrideFields[name]} onChange={e => setOverrideFields(f => ({ ...f, [name]: e.target.value }))} rows={3}
                          className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none" />
                      ) : (
                        <input value={overrideFields[name]} onChange={e => setOverrideFields(f => ({ ...f, [name]: e.target.value }))} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-6 pt-4 border-t border-gray-100 shrink-0 max-w-md ml-auto">
              <button onClick={() => rejectRow(focusedRow)} disabled={rowBusy === focusedRow.id}
                className="flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 font-bold text-sm py-2.5 rounded-xl transition disabled:opacity-50">
                <XCircle size={14} /> Delete Row
              </button>
              <button onClick={() => applyOverride(focusedRow)} disabled={rowBusy === focusedRow.id}
                className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-2.5 rounded-xl transition disabled:opacity-50">
                {rowBusy === focusedRow.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Apply Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ MAPPING ══════════════════════ */}
      {view === "mapping" && user && activeBatch && (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
          <button onClick={() => go("review")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 transition"><ArrowRight size={14} className="rotate-180" /> Back to Review</button>
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><ArrowRightLeft size={18} className="text-teal-600" /> Mapping Agent</h2>
            <p className="text-sm text-gray-500 mt-1">Map each ingested field onto the exact column or property name your destination expects, or uncheck a field to leave it out entirely. Only checked fields reach the generated document, database, API, or any other destination — this is what makes the export actually usable, not a dump of every internal field.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-[auto_1fr_1fr] gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
              <span></span><span>Source Field (ingested)</span><span>Maps To (destination field)</span>
            </div>
            {Object.keys(mapping).map(sourceField => {
              const included = !!mapping[sourceField]?.trim();
              return (
                <div key={sourceField} className="grid grid-cols-[auto_1fr_1fr] gap-3 items-center">
                  <input type="checkbox" checked={included} title="Include this field in the generated output"
                    onChange={e => setMapping(m => ({ ...m, [sourceField]: e.target.checked ? sourceField : "" }))}
                    className="accent-teal-600 w-4 h-4" />
                  <div className={`flex items-center gap-2 bg-slate-50 border border-gray-200 rounded-lg px-3 py-2.5 transition ${included ? "" : "opacity-40"}`}>
                    <span className="text-xs font-mono text-gray-600 truncate">{sourceField}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight size={12} className="text-gray-300 shrink-0" />
                    <input value={mapping[sourceField]} disabled={!included} onChange={e => setMapping(m => ({ ...m, [sourceField]: e.target.value }))}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-teal-400 disabled:opacity-50 disabled:bg-gray-50" />
                  </div>
                </div>
              );
            })}
            <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-100">Destination field names must be plain identifiers (letters, numbers, underscore) if you're mapping onto a database table.</p>
          </div>
          <button onClick={saveMappingAndContinue} disabled={mappingBusy}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm transition">
            {mappingBusy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} Save Mapping &amp; Continue to Generate
          </button>
        </div>
      )}

      {/* ══════════════════════ GENERATE ══════════════════════ */}
      {view === "generate" && user && activeBatch && (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
          <button onClick={() => go("mapping")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 transition"><ArrowRight size={14} className="rotate-180" /> Back to Mapping</button>
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><FileOutput size={18} className="text-teal-600" /> Generate Agent</h2>
            <p className="text-sm text-gray-500 mt-1">Turn {approvedCount} approved row{approvedCount === 1 ? "" : "s"} from "{activeBatch.name}" into a real document per row, using a saved template.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            {templates.length === 0 ? (
              templateFieldSource.length > 0 ? (
                <>
                  <p className="text-sm text-gray-500">No saved templates yet — create one now from this batch's mapped fields ({templateFieldSource.join(", ")}). It'll lay them out on a simple auto-generated page; no design tool needed.</p>
                  <div className="flex items-center gap-2">
                    <input value={genNewTemplateName} onChange={e => setGenNewTemplateName(e.target.value)} placeholder='Name this template, e.g. "Invoice"…'
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                    <button onClick={saveTemplateFromActiveBatch} disabled={genSavingTemplate || !genNewTemplateName.trim()}
                      className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm px-4 py-2 rounded-xl transition shrink-0">
                      {genSavingTemplate ? <Loader2 size={14} className="animate-spin" /> : <LayoutTemplate size={14} />} Create Template
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">This batch has no field names to build a template from — go back to New Batch, run Auto-Extract or type a custom field list, then Save as Template before creating the batch.</p>
              )
            ) : (
              <>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Template</label>
                <div className="flex flex-wrap gap-2">
                  {templates.map(tpl => (
                    <button key={tpl.id} onClick={() => setGenTemplateId(tpl.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${genTemplateId === tpl.id ? "bg-teal-600 border-teal-600 text-white" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                      {tpl.name} <span className="opacity-60 font-normal">· {tpl.output_type === "fillable_pdf" ? "fillable PDF" : "layout"}</span>
                    </button>
                  ))}
                </div>
                <button onClick={runGenerate} disabled={generateBusy || !genTemplateId || approvedCount === 0}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white font-black text-sm py-3.5 rounded-2xl transition">
                  {generateBusy ? <Loader2 size={16} className="animate-spin" /> : <FileOutput size={16} />} Generate Documents
                </button>
                {approvedCount === 0 && <p className="text-xs text-amber-600">No approved rows yet — go back and approve at least one row first.</p>}
              </>
            )}
          </div>

          {generationJob && (
            <div className={`rounded-2xl border p-5 space-y-3 ${generationJob.status === "ready" ? "bg-green-50 border-green-200" : generationJob.status === "failed" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center gap-2">
                {generationJob.status === "ready" ? <CheckCircle size={16} className="text-green-600" /> : generationJob.status === "failed" ? <XCircle size={16} className="text-red-600" /> : <Loader2 size={16} className="text-amber-600 animate-spin" />}
                <p className={`font-bold text-sm ${generationJob.status === "ready" ? "text-green-700" : generationJob.status === "failed" ? "text-red-700" : "text-amber-700"}`}>
                  {generationJob.status === "ready" ? `${generationJob.result?.row_count ?? 0} document(s) ready` : generationJob.status === "failed" ? "Generation failed" : "Generating…"}
                </p>
              </div>
              {generationJob.result?.error && <p className="text-xs text-gray-600">{generationJob.result.error}</p>}
              {generationJob.result?.documents?.map(doc => (
                <div key={doc.row_id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <span className="text-xs font-mono text-gray-600">{doc.file_name}</span>
                  <button onClick={() => downloadBase64Pdf(doc.file_base64, doc.file_name)} className="flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:underline"><Download size={12} /> Download</button>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => { setDistributeResult(null); go("distribute"); }} className="w-full text-center text-xs text-gray-400 hover:text-teal-600 font-bold py-2">
            Skip Generate — go straight to Distribution →
          </button>
        </div>
      )}

      {/* ══════════════════════ DISTRIBUTE ══════════════════════ */}
      {view === "distribute" && user && activeBatch && (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
          <button onClick={() => go("generate")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 transition"><ArrowRight size={14} className="rotate-180" /> Back to Generate</button>
          <div>
            <h2 className="text-xl font-black text-gray-900">Target Agent Configuration</h2>
            <p className="text-sm text-gray-500">Choose where {approvedCount} approved rows from "{activeBatch.name}" should go.</p>
          </div>

          <div className="space-y-3">
            {/* Option A */}
            <label className={`block border-2 rounded-2xl p-5 cursor-pointer transition ${targetType === "file_export" ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
              <div className="flex items-center gap-3">
                <input type="radio" checked={targetType === "file_export"} onChange={() => setTargetType("file_export")} className="accent-teal-600" />
                <Download size={18} className="text-teal-600" />
                <div>
                  <p className="font-black text-gray-900 text-sm">Static File Extraction</p>
                  <p className="text-xs text-gray-500">Download the transformed master Excel (.xlsx) of every approved row.</p>
                </div>
              </div>
            </label>

            {/* Option B */}
            <label className={`block border-2 rounded-2xl p-5 cursor-pointer transition ${targetType === "cloud_storage" ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
              <div className="flex items-center gap-3 mb-3">
                <input type="radio" checked={targetType === "cloud_storage"} onChange={() => setTargetType("cloud_storage")} className="accent-teal-600" />
                <Cloud size={18} className="text-teal-600" />
                <div>
                  <p className="font-black text-gray-900 text-sm">Cloud Infrastructure Storage</p>
                  <p className="text-xs text-gray-500">Upload approved rows as JSON to an S3 bucket.</p>
                </div>
              </div>
              {targetType === "cloud_storage" && (
                <div className="pl-8 space-y-2">
                  <div className="flex gap-2">
                    {(["s3", "azure", "local"] as const).map(p => (
                      <button key={p} type="button" onClick={() => setCloudProvider(p)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${cloudProvider === p ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-500 border-gray-200"}`}>
                        {p === "s3" ? "AWS S3" : p === "azure" ? "Azure Blob" : "Local File Server"}
                      </button>
                    ))}
                  </div>
                  {cloudProvider === "s3" ? (
                    <input value={bucketName} onChange={e => setBucketName(e.target.value)} placeholder="bucket-name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                  ) : (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Only AWS S3 is wired up for real uploads right now — Azure Blob and Local File Server are configuration-only.</p>
                  )}
                </div>
              )}
            </label>

            {/* Option: Database */}
            <label className={`block border-2 rounded-2xl p-5 cursor-pointer transition ${targetType === "database" ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
              <div className="flex items-center gap-3 mb-3">
                <input type="radio" checked={targetType === "database"} onChange={() => setTargetType("database")} className="accent-teal-600" />
                <HardDrive size={18} className="text-teal-600" />
                <div>
                  <p className="font-black text-gray-900 text-sm">Database</p>
                  <p className="text-xs text-gray-500">Real INSERT into a Postgres table you own — columns come straight from your mapping above.</p>
                </div>
              </div>
              {targetType === "database" && (
                <div className="pl-8 space-y-2">
                  <input type="password" value={dbConnectionString} onChange={e => setDbConnectionString(e.target.value)} placeholder="postgresql://user:pass@host:5432/dbname" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                  <input value={dbTableName} onChange={e => setDbTableName(e.target.value)} placeholder="target_table_name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                  <p className="text-[11px] text-gray-400">The table must already exist with columns matching your mapped field names.</p>
                </div>
              )}
            </label>

            {/* Option: API / Webhook */}
            <label className={`block border-2 rounded-2xl p-5 cursor-pointer transition ${targetType === "api" ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
              <div className="flex items-center gap-3 mb-3">
                <input type="radio" checked={targetType === "api"} onChange={() => setTargetType("api")} className="accent-teal-600" />
                <Globe size={18} className="text-teal-600" />
                <div>
                  <p className="font-black text-gray-900 text-sm">API / Webhook</p>
                  <p className="text-xs text-gray-500">Real HTTP request with the mapped rows as JSON or XML — works with any REST API or webhook.</p>
                </div>
              </div>
              {targetType === "api" && (
                <div className="pl-8 space-y-2">
                  <div className="flex gap-2">
                    <select value={apiMethod} onChange={e => setApiMethod(e.target.value as "POST" | "PUT")} className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-teal-400 bg-white">
                      <option>POST</option><option>PUT</option>
                    </select>
                    <input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="https://your-system.com/api/ingest" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                  </div>
                  <div className="flex gap-2">
                    {(["json", "xml"] as const).map(f => (
                      <button key={f} type="button" onClick={() => setApiFormat(f)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition uppercase ${apiFormat === f ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-500 border-gray-200"}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                  <input type="password" value={apiAuthToken} onChange={e => setApiAuthToken(e.target.value)} placeholder="Bearer token (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                </div>
              )}
            </label>

            {/* Option C */}
            <label className={`block border-2 rounded-2xl p-5 cursor-pointer transition ${targetType === "rpa_portal" ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
              <div className="flex items-center gap-3 mb-3">
                <input type="radio" checked={targetType === "rpa_portal"} onChange={() => setTargetType("rpa_portal")} className="accent-teal-600" />
                <Cpu size={18} className="text-teal-600" />
                <div>
                  <p className="font-black text-gray-900 text-sm">Active RPA Portal Target Engine</p>
                  <p className="text-xs text-gray-500">Configure a browser-automation target — execution is queued, not live yet.</p>
                </div>
              </div>
              {targetType === "rpa_portal" && (
                <div className="pl-8 space-y-2">
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-1.5"><AlertTriangle size={12} className="shrink-0 mt-0.5" /> Live browser automation isn't connected in this environment — this saves your target configuration and queues the job for a worker to pick up.</p>
                  <input value={rpaUrl} onChange={e => setRpaUrl(e.target.value)} placeholder="Target endpoint URL (https://…)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                  <input value={rpaProfile} onChange={e => setRpaProfile(e.target.value)} placeholder="RPA authentication profile name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                  <input type="password" value={rpaToken} onChange={e => setRpaToken(e.target.value)} placeholder="Secure password token" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                </div>
              )}
            </label>
          </div>

          <button onClick={runDistribution} disabled={distributeBusy}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-sm py-4 rounded-2xl transition disabled:opacity-50">
            {distributeBusy ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />} START TERMINAL INTEGRATION PIPELINE
          </button>

          {distributeResult && (
            <div className={`rounded-2xl border p-5 ${distributeResult.status === "completed" ? "bg-green-50 border-green-200" : distributeResult.status === "failed" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center gap-2 mb-1">
                {distributeResult.status === "completed" ? <CheckCircle size={16} className="text-green-600" /> : distributeResult.status === "failed" ? <XCircle size={16} className="text-red-600" /> : <Loader2 size={16} className="text-amber-600" />}
                <p className={`font-bold text-sm ${distributeResult.status === "completed" ? "text-green-700" : distributeResult.status === "failed" ? "text-red-700" : "text-amber-700"}`}>
                  {distributeResult.status === "completed" ? "Distribution complete" : distributeResult.status === "failed" ? "Distribution failed" : "Job queued"}
                </p>
              </div>
              {distributeResult.result?.note && <p className="text-xs text-gray-600 mt-1">{distributeResult.result.note}</p>}
              {distributeResult.result?.error && <p className="text-xs text-gray-600 mt-1">{distributeResult.result.error}</p>}
              {distributeResult.result?.bucket && <p className="text-xs text-gray-600 mt-1 font-mono">s3://{distributeResult.result.bucket}/{distributeResult.result.key}</p>}
              {distributeResult.result?.file_name && <p className="text-xs text-gray-600 mt-1">Downloaded {distributeResult.result.file_name} ({distributeResult.result.row_count} rows).</p>}
              {distributeResult.result?.table && <p className="text-xs text-gray-600 mt-1 font-mono">Inserted {distributeResult.result.row_count} rows into "{distributeResult.result.table}"</p>}
              {distributeResult.result?.status_code && <p className="text-xs text-gray-600 mt-1">API responded {distributeResult.result.status_code} · {distributeResult.result.row_count} rows sent</p>}
              {distributeResult.result?.response_snippet && <p className="text-[11px] text-gray-400 mt-1 font-mono break-all">{distributeResult.result.response_snippet}</p>}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════ SCHOOL ══════════════════════ */}
      {view === "school" && user && (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><GraduationCap size={18} className="text-teal-600" /> School — Chapter to Study Pack</h2>
            <p className="text-sm text-gray-500">Upload a chapter's pages (or paste its text), tell us the class and board, and get back simplified concepts, a study plan, and a quick-reference guide — generated by AI, not extracted from the source.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Class / Grade</label>
                <input value={schoolClassLevel} onChange={e => setSchoolClassLevel(e.target.value)} placeholder="e.g. Class 8" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Board</label>
                <input value={schoolBoard} onChange={e => setSchoolBoard(e.target.value)} placeholder="e.g. CBSE" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Subject (optional)</label>
                <input value={schoolSubject} onChange={e => setSchoolSubject(e.target.value)} placeholder="e.g. Science" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Target Language</label>
                <select value={schoolTargetLang} onChange={e => setSchoolTargetLang(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400">
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Malayalam">Malayalam</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {BOARD_PRESETS.map(b => (
                <button key={b} onClick={() => setSchoolBoard(b)} className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${schoolBoard === b ? "bg-teal-600 border-teal-600 text-white" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>{b}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input list="chapters-datalist" value={schoolChapterLabel} onChange={e => setSchoolChapterLabel(e.target.value)} placeholder={`Chapter title ${schoolInputMode === 'generate' ? '(required)' : '(optional, for your reference)'}`} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-400" />
                <datalist id="chapters-datalist">
                  {schoolChaptersList.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <button onClick={suggestChapters} disabled={schoolSuggesting || !schoolClassLevel || !schoolBoard || !schoolSubject} className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 disabled:opacity-40 font-bold text-xs px-3 py-2 rounded-lg transition whitespace-nowrap">
                {schoolSuggesting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Suggest Chapters
              </button>
            </div>
          </div>

          <div className="bg-white border-2 border-dashed border-teal-200 rounded-2xl p-6 print:hidden">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(["upload", "text", "generate"] as const).map(key => (
                <button key={key} onClick={() => setSchoolInputMode(key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition ${schoolInputMode === key ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  {key === "upload" ? <Upload size={18} className={schoolInputMode === key ? "text-teal-600" : "text-gray-400"} /> : key === "text" ? <FileText size={18} className={schoolInputMode === key ? "text-teal-600" : "text-gray-400"} /> : <Sparkles size={18} className={schoolInputMode === key ? "text-teal-600" : "text-gray-400"} />}
                  <span className={`text-xs font-bold text-center ${schoolInputMode === key ? "text-teal-700" : "text-gray-600"}`}>{key === "upload" ? "Upload Pages" : key === "text" ? "Paste Text" : "Generate by Topic"}</span>
                </button>
              ))}
            </div>

            {schoolInputMode === "upload" && (
              <label className="border-2 border-dashed border-gray-200 hover:border-teal-300 rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer transition">
                <BookOpen size={22} className="text-gray-300" />
                <span className="text-sm text-gray-600 font-bold">Drag & drop, or click to choose chapter pages</span>
                <span className="text-xs text-gray-400">Images or a PDF — up to 10 pages</span>
                <input type="file" accept="image/*,application/pdf,.pdf" multiple className="hidden"
                  onChange={e => { if (e.target.files?.length) runStudyGuideFromFiles(e.target.files); e.target.value = ""; }} />
              </label>
            )}
            {schoolInputMode === "text" && (
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Paste the chapter's text</label>
                <textarea value={schoolPasteText} onChange={e => setSchoolPasteText(e.target.value)} rows={8}
                  placeholder="Paste the chapter content here…"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none" />
                <button onClick={runStudyGuideFromText} disabled={schoolBusy || !schoolPasteText.trim()}
                  className="mt-2 flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-xs px-3 py-2 rounded-lg transition">
                  <Sparkles size={13} /> Generate Study Pack
                </button>
              </div>
            )}
            {schoolInputMode === "generate" && (
              <div>
                <p className="text-xs text-gray-500 mb-3">No document needed! Just ensure Class, Board, Subject, and Chapter Name are filled above, and the AI will generate a complete study pack from its curriculum knowledge.</p>
                <button onClick={runStudyGuideGenerate} disabled={schoolBusy || !schoolClassLevel.trim() || !schoolBoard.trim() || !schoolSubject.trim() || !schoolChapterLabel.trim()}
                  className="mt-2 flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-xs px-3 py-2 rounded-lg transition">
                  <Sparkles size={13} /> Generate Study Pack
                </button>
              </div>
            )}

            {schoolBusy && <p className="mt-3 text-xs text-teal-600 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Reading the chapter and building your study pack…</p>}
            {schoolErr && <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{schoolErr}</p>}
          </div>

          {schoolHistory.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h4 className="font-black text-gray-900 text-sm mb-3">Recent Chapters</h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {schoolHistory.map((h, i) => (
                  <button key={i} onClick={() => setSchoolResult(h)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:border-teal-500 hover:text-teal-700 transition whitespace-nowrap flex items-center gap-2">
                    <BookOpen size={14} className="text-teal-600" />
                    {h.chapter_title || "Study Pack " + (i + 1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {schoolResult && (
            <div className="space-y-5">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-black text-gray-900 text-lg">{schoolResult.chapter_title}</h3>
                    <p className="text-xs text-gray-400">{schoolResult.subject} · {schoolClassLevel} · {schoolBoard}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">via {schoolProvider}</span>
                      {schoolCached && <span className="text-[9px] font-bold text-teal-600 bg-teal-50 border border-teal-200 rounded-full px-1.5 py-0.5">cached</span>}
                    </div>
                    <button onClick={() => window.print()} className="print:hidden text-xs font-bold text-teal-700 bg-teal-100 hover:bg-teal-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5">
                      <FileText size={14} /> Print to PDF
                    </button>
                  </div>
                </div>
              </div>

              {schoolResult.story_telling_explanation && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <h4 className="font-black text-blue-900 text-sm mb-3 flex items-center gap-2"><Sparkles size={16} /> Concept Story</h4>
                  <p className="text-sm text-blue-900 leading-relaxed">{schoolResult.story_telling_explanation}</p>
                </div>
              )}

              {schoolResult.quick_reference?.length > 0 && (
                <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6">
                  <h4 className="font-black text-teal-800 text-sm mb-3 flex items-center gap-2"><ListChecks size={16} /> Quick Reference</h4>
                  <ul className="space-y-1.5">
                    {schoolResult.quick_reference.map((q, i) => <li key={i} className="text-sm text-teal-900 flex gap-2"><span className="text-teal-400">•</span>{q}</li>)}
                  </ul>
                </div>
              )}

              {schoolResult.core_concepts?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h4 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2"><Lightbulb size={16} className="text-amber-500" /> Core Concepts</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {schoolResult.core_concepts.map((c, i) => (
                      <div key={i} className="border border-gray-200 rounded-xl p-4">
                        <p className="font-bold text-gray-900 text-sm">{c.concept}</p>
                        <p className="text-sm text-gray-600 mt-1">{c.simple_explanation}</p>
                        <p className="text-xs text-gray-400 mt-2 italic">Why it matters: {c.why_it_matters}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {schoolResult.key_terms?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h4 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2"><BookOpen size={16} className="text-teal-600" /> Key Terms</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {schoolResult.key_terms.map((t, i) => (
                      <div key={i} className="text-sm"><span className="font-bold text-gray-900">{t.term}:</span> <span className="text-gray-600">{t.meaning}</span></div>
                    ))}
                  </div>
                </div>
              )}

            {schoolResult.study_plan?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h4 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2"><ClipboardCheck size={16} className="text-teal-600" /> Study Plan</h4>
                  <div className="space-y-2">
                    {schoolResult.study_plan.map((s, i) => (
                      <div key={i} className="flex items-start gap-3 border border-gray-100 rounded-xl p-3">
                        <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{s.step}</span>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{s.focus} <span className="text-xs font-normal text-gray-400">· {s.time_minutes} min</span></p>
                          <p className="text-xs text-gray-600 mt-0.5">{s.activity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {schoolResult.competency_questions && schoolResult.competency_questions.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h4 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2"><Lightbulb size={16} className="text-purple-600" /> Competency-Based Questions</h4>
                  <div className="space-y-3">
                    {schoolResult.competency_questions.map((q, i) => (
                      <details key={i} className="group border border-gray-200 rounded-xl bg-gray-50 overflow-hidden print-expand">
                        <summary className="font-medium text-sm text-gray-900 p-4 cursor-pointer hover:bg-gray-100 transition list-none flex gap-2">
                          <span className="text-purple-600 font-black">Q{i+1}.</span> {q.question}
                          <span className="ml-auto text-xs text-gray-400 bg-white border px-2 py-0.5 rounded-full shrink-0">{q.competency_tested}</span>
                        </summary>
                        <div className="p-4 pt-0 text-sm text-gray-700 bg-white border-t border-gray-200 mt-2">
                          <div className="font-black text-xs text-purple-600 mb-1 uppercase tracking-wide">Answer</div>
                          <div className="whitespace-pre-wrap">{q.answer}</div>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}

              {schoolResult.exercise_questions && schoolResult.exercise_questions.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h4 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2"><BookOpen size={16} className="text-blue-600" /> Exercise Questions</h4>
                  <div className="space-y-3">
                    {schoolResult.exercise_questions.map((q, i) => (
                      <details key={i} className="group border border-gray-200 rounded-xl bg-gray-50 overflow-hidden print-expand">
                        <summary className="font-medium text-sm text-gray-900 p-4 cursor-pointer hover:bg-gray-100 transition list-none flex gap-2">
                          <span className="text-blue-600 font-black">Q{i+1}.</span> {q.question}
                        </summary>
                        <div className="p-4 pt-0 text-sm text-gray-700 bg-white border-t border-gray-200 mt-2">
                          <div className="font-black text-xs text-blue-600 mb-1 uppercase tracking-wide">Answer</div>
                          <div className="whitespace-pre-wrap">{q.answer}</div>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}

              {schoolResult.practice_questions?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h4 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2"><Sparkles size={16} className="text-teal-600" /> Practice Questions</h4>
                  <div className="space-y-2">
                    {schoolResult.practice_questions.map((q, i) => (
                      <div key={i} className="border border-gray-100 rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900">{i + 1}. {q.question}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${q.difficulty === "easy" ? "bg-green-50 text-green-700 border-green-200" : q.difficulty === "hard" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{q.difficulty}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Hint: {q.hint}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {schoolResult.common_mistakes?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                  <h4 className="font-black text-amber-800 text-sm mb-3 flex items-center gap-2"><AlertTriangle size={16} /> Common Mistakes to Avoid</h4>
                  <ul className="space-y-1.5">
                    {schoolResult.common_mistakes.map((m, i) => <li key={i} className="text-sm text-amber-900 flex gap-2"><span className="text-amber-400">•</span>{m}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════ SETTINGS ══════════════════════ */}
      {view === "settings" && user && (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-black text-gray-900">AI Cost &amp; Token Usage</h2>
              <p className="text-sm text-gray-500 max-w-2xl">Every AI extraction call (rule-vs-AI comparisons and Auto-Extract) is logged here. Costs are <strong>estimates</strong> from published per-token rates, not pulled from each provider's billing dashboard — treat them as a sanity check, not an invoice.</p>
            </div>
            <button onClick={async () => { if (confirm("Clear the AI result cache? Every document will need a fresh AI call next time, even if it was processed before.")) { await data360Api.clearAiCache(); loadAiUsage(); } }}
              className="text-xs font-bold text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-2 rounded-xl transition shrink-0">
              Clear Result Cache
            </button>
          </div>

          {isSuperadmin && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
              <h3 className="font-black text-gray-900 text-sm flex items-center gap-2"><ShieldCheck size={15} className="text-teal-600" /> Grant Purchased Quota (superadmin)</h3>
              <p className="text-xs text-gray-400">No live payment gateway yet — after confirming a package purchase out-of-band, credit the buyer's account here.</p>
              <div className="flex flex-wrap items-center gap-2">
                <input value={grantEmail} onChange={e => setGrantEmail(e.target.value)} placeholder="buyer@email.com" className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                <input value={grantDocs} onChange={e => setGrantDocs(e.target.value)} type="number" min={1} placeholder="100" className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                <button onClick={runGrantQuota} disabled={grantBusy || !grantEmail.trim()} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm px-4 py-2 rounded-xl transition">
                  {grantBusy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Grant
                </button>
              </div>
              {grantMsg && <p className="text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">{grantMsg}</p>}
            </div>
          )}

          {aiUsageLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={24} /></div>
          ) : (
            <>
              {aiUsageCacheStats && aiUsageCacheStats.total_calls > 0 && (
                <div className="bg-teal-50 border border-teal-200 rounded-2xl px-5 py-3 flex items-center gap-2 text-sm">
                  <LayoutTemplate size={15} className="text-teal-600 shrink-0" />
                  <span className="text-teal-800">
                    <strong>{aiUsageCacheStats.cache_hits}</strong> of <strong>{aiUsageCacheStats.total_calls}</strong> calls served from cache — an exact document + field-list/mode match skips the AI provider entirely, at zero cost.
                  </span>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-gray-900 text-sm">By Batch</h3>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>{aiUsageBatches.reduce((s, b) => s + b.total_pages, 0)} total pages</span>
                    <span className="font-bold text-teal-600">${aiUsageBatches.reduce((s, b) => s + Number(b.total_cost_usd), 0).toFixed(4)} total est.</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                        <th className="py-2 pr-3">Batch</th>
                        <th className="py-2 pr-3">Files</th>
                        <th className="py-2 pr-3">Cache Hits</th>
                        <th className="py-2 pr-3">Total Pages</th>
                        <th className="py-2 pr-3">Input Tokens</th>
                        <th className="py-2 pr-3">Output Tokens</th>
                        <th className="py-2 pr-3">Est. Cost (USD)</th>
                        <th className="py-2 pr-3">Last Used</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiUsageBatches.length === 0 ? (
                        <tr><td colSpan={8} className="py-8 text-center text-gray-400">No AI extraction calls logged yet.</td></tr>
                      ) : aiUsageBatches.map(b => (
                        <tr key={b.batch_label} className="border-b border-gray-50">
                          <td className="py-2 pr-3 font-bold text-gray-800">{b.batch_label}</td>
                          <td className="py-2 pr-3 text-gray-600">{b.file_count}</td>
                          <td className="py-2 pr-3 text-gray-600">{b.cache_hits > 0 ? <span className="text-teal-600 font-bold">{b.cache_hits}</span> : "—"}</td>
                          <td className="py-2 pr-3 text-gray-600">{b.total_pages}</td>
                          <td className="py-2 pr-3 text-gray-600 font-mono">{b.total_input_tokens.toLocaleString()}</td>
                          <td className="py-2 pr-3 text-gray-600 font-mono">{b.total_output_tokens.toLocaleString()}</td>
                          <td className="py-2 pr-3 font-bold text-teal-700">${Number(b.total_cost_usd).toFixed(4)}</td>
                          <td className="py-2 pr-3 text-gray-400">{new Date(b.last_used_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="font-black text-gray-900 text-sm mb-4">By File</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                        <th className="py-2 pr-3">File</th>
                        <th className="py-2 pr-3">Batch</th>
                        <th className="py-2 pr-3">Provider</th>
                        <th className="py-2 pr-3">Model</th>
                        <th className="py-2 pr-3">Input Tokens</th>
                        <th className="py-2 pr-3">Output Tokens</th>
                        <th className="py-2 pr-3">Est. Cost (USD)</th>
                        <th className="py-2 pr-3">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiUsageFiles.length === 0 ? (
                        <tr><td colSpan={8} className="py-8 text-center text-gray-400">No AI extraction calls logged yet.</td></tr>
                      ) : aiUsageFiles.map(f => (
                        <tr key={f.id} className="border-b border-gray-50">
                          <td className="py-2 pr-3 font-medium text-gray-800 truncate max-w-[160px]">
                            {f.file_label || "—"}
                            {f.from_cache && <span className="ml-1.5 text-[9px] font-bold text-teal-600 bg-teal-50 border border-teal-200 rounded-full px-1.5 py-0.5">cached</span>}
                          </td>
                          <td className="py-2 pr-3 text-gray-500 truncate max-w-[120px]">{f.batch_label || "(unassigned)"}</td>
                          <td className="py-2 pr-3 text-gray-600 capitalize">{f.provider}</td>
                          <td className="py-2 pr-3 text-gray-400 font-mono">{f.model}</td>
                          <td className="py-2 pr-3 text-gray-600 font-mono">{f.input_tokens.toLocaleString()}</td>
                          <td className="py-2 pr-3 text-gray-600 font-mono">{f.output_tokens.toLocaleString()}</td>
                          <td className="py-2 pr-3 font-bold text-teal-700">${Number(f.estimated_cost_usd).toFixed(5)}</td>
                          <td className="py-2 pr-3 text-gray-400">{new Date(f.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
