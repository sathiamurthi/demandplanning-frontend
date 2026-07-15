"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Database, Upload, FileText, Camera, Mic, MicOff, CheckCircle, XCircle,
  AlertTriangle, ChevronRight, X, Loader2, Plus, LogOut, ArrowRight,
  ShieldCheck, GitMerge, Cloud, HardDrive, Bot, Sparkles, Download,
  Cpu, ClipboardCheck, Workflow, Globe, ArrowRightLeft, LayoutTemplate, FileOutput,
} from "lucide-react";
import { data360Api, getToken, setToken, clearToken } from "./lib/api";
import {
  parseExcelFile,
  isVoiceSupported, createVoiceRecognizer, extractFieldsFromText, parseFieldInstruction, isValidFieldValue, flattenAutoExtract, renderPdfPageImages,
} from "./lib/parsers";
import type { D360User, D360Batch, D360Row, D360Job, IngestRow, TargetType, D360Template, D360GenerationJob } from "./lib/types";

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
type View = "landing" | "auth" | "dashboard" | "ingest" | "review" | "mapping" | "generate" | "distribute" | "settings";
type Channel = "excel" | "voice";

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
  const [channel, setChannel] = useState<Channel>("excel");
  const [ingestBusy, setIngestBusy] = useState(false);
  const [ingestErr, setIngestErr] = useState("");
  const [fieldTemplate, setFieldTemplate] = useState<keyof typeof FIELD_TEMPLATES>("invoice");
  const [fieldsInput, setFieldsInput] = useState(FIELD_TEMPLATES.invoice.fields.join(", "));
  const extractionFields = fieldsInput.split(",").map(s => s.trim()).filter(Boolean);
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

  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [mappingBusy, setMappingBusy] = useState(false);

  const [targetType, setTargetType] = useState<TargetType>("file_export");
  const [cloudProvider, setCloudProvider] = useState<"s3" | "azure" | "local">("s3");
  const [bucketName, setBucketName] = useState("");
  const [dbConnectionString, setDbConnectionString] = useState("");
  const [dbTableName, setDbTableName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [apiMethod, setApiMethod] = useState<"POST" | "PUT">("POST");
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
  // AI comparison: for any row that carries real freeform text (PDF/OCR/
  // voice, not structured Excel), fire a parallel call to Claude with the
  // exact same raw text + field list the client-side heuristic just used,
  // so the two can be shown side by side rather than trusting either blindly.
  const [aiCompare, setAiCompare] = useState<Record<number, { busy: boolean; fields?: Record<string, string>; provider?: string; error?: string }>>({});
  const [expandedCompareIdx, setExpandedCompareIdx] = useState<number | null>(null);
  // If the AI's read differs from the rule-based one, open the comparison
  // automatically — the visible columns can be showing dashes/garbage right
  // when the correct value is one click away, which reads as "extraction
  // isn't working" if it stays hidden behind a small link.
  const revealIfDiffers = (idx: number, row: IngestRow, aiFields: Record<string, string>) => {
    const diff = extractionFields.some(f => (aiFields[f] || "") !== (row.fields?.[f] || ""));
    if (diff) setExpandedCompareIdx(idx);
  };
  const triggerAiCompare = async (idx: number, row: IngestRow) => {
    if (!row.raw_snippet?.trim() || extractionFields.length === 0) return;
    setAiCompare(prev => ({ ...prev, [idx]: { busy: true } }));
    try {
      const { fields, provider } = await data360Api.aiExtract(row.raw_snippet, extractionFields, batchName || undefined, "Voice dictation");
      setAiCompare(prev => ({ ...prev, [idx]: { busy: false, fields, provider } }));
      revealIfDiffers(idx, row, fields);
    } catch (e: any) {
      setAiCompare(prev => ({ ...prev, [idx]: { busy: false, error: e.message || "AI comparison failed" } }));
    }
  };
  const acceptAiValue = (idx: number, field: string, value: string) => {
    setPendingRows(prev => prev.map((r, i) => i === idx ? { ...r, fields: { ...r.fields, [field]: value } } : r));
  };
  const acceptAllAiValues = (idx: number) => {
    const aiFields = aiCompare[idx]?.fields;
    if (!aiFields) return;
    setPendingRows(prev => prev.map((r, i) => i === idx ? { ...r, fields: { ...r.fields, ...aiFields } } : r));
  };
  const [jsonViewIdx, setJsonViewIdx] = useState<number | null>(null);

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

  const runOneImage = async (label: string, base64: string, mimeType: string, idx: number) => {
    try {
      const { data, provider, cached } = await data360Api.aiExtractImageAuto(base64, mimeType, batchName || undefined, label);
      setAutoExtractItems(prev => prev.map((it, i) => i === idx ? { ...it, busy: false, data, provider, cached } : it));
    } catch (e: any) {
      setAutoExtractItems(prev => prev.map((it, i) => i === idx ? { ...it, busy: false, error: e.message || "Auto-extraction failed" } : it));
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

  const useAutoExtractResult = (idx: number) => {
    const item = autoExtractItems[idx];
    if (!item?.data) return;
    const flat = flattenAutoExtract(item.data);
    const fieldNames = Object.keys(flat);
    setFieldsInput(fieldNames.join(", "));
    setFieldTemplate("custom");
    setSelectedTemplateId("");
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
    setFieldsInput(Array.from(allFieldNames).join(", "));
    setFieldTemplate("custom");
    setSelectedTemplateId("");
    setPendingRows(prev => [...prev, ...newRows]);
  };

  const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const handleExcelFile = async (file: File) => {
    if (extractionFields.length === 0) { setIngestErr("Choose at least one field to extract first."); return; }
    setIngestErr(""); setIngestBusy(true);
    try {
      const rows = await parseExcelFile(file, extractionFields);
      setPendingRows(prev => [...prev, ...rows]);
    } catch (e: any) {
      setIngestErr(e.message || "Could not parse that file");
    } finally { setIngestBusy(false); }
  };

  const toggleVoice = () => {
    if (voiceActive) {
      recognizerRef.current?.stop();
      return;
    }
    if (extractionFields.length === 0) { setIngestErr("Choose at least one field to extract first."); return; }
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

  const commitVoiceRow = () => {
    if (!voiceTranscript.trim()) return;
    const row = extractFieldsFromText(voiceTranscript, "voice", extractionFields);
    const idx = pendingRows.length;
    setPendingRows(prev => [...prev, row]);
    triggerAiCompare(idx, row);
    setVoiceTranscript("");
  };

  const [batchName, setBatchName] = useState("");
  const [creatingBatch, setCreatingBatch] = useState(false);
  const createBatch = async () => {
    if (!batchName.trim() || pendingRows.length === 0) return;
    setCreatingBatch(true); setIngestErr("");
    try {
      const { batch } = await data360Api.createBatch(batchName.trim(), channel, pendingRows, extractionFields, selectedTemplateId || undefined);
      setPendingRows([]); setBatchName("");
      setActiveBatchId(batch.id);
      await openReview(batch.id);
    } catch (e: any) {
      setIngestErr(e.message || "Could not create the batch");
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
    if (!newTemplateName.trim() || extractionFields.length === 0) return;
    setSavingTemplate(true);
    try {
      const tpl = await data360Api.createTemplate(newTemplateName.trim(), extractionFields, "coordinate_layout");
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
    setActiveBatchId(batchId); setReviewLoading(true); setView("review");
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

  const refreshReview = async () => {
    if (!activeBatchId) return;
    const { batch, rows, jobs } = await data360Api.getBatch(activeBatchId);
    setActiveBatch(batch); setActiveRows(rows); setActiveJobs(jobs);
  };

  const approveRow = async (row: D360Row) => {
    setRowBusy(row.id);
    try {
      await data360Api.updateRow(row.batch_id, row.id, { status: "approved" });
      await refreshReview();
      setFocusedRow(null);
    } finally { setRowBusy(null); }
  };

  const rejectRow = async (row: D360Row) => {
    setRowBusy(row.id);
    try {
      await data360Api.updateRow(row.batch_id, row.id, { status: "rejected" });
      await refreshReview();
      setFocusedRow(null);
    } finally { setRowBusy(null); }
  };

  const applyOverride = async (row: D360Row) => {
    setRowBusy(row.id);
    try {
      await data360Api.updateRow(row.batch_id, row.id, {
        status: "approved",
        manual_override: { fields: overrideFields },
      });
      await refreshReview();
      setFocusedRow(null);
    } finally { setRowBusy(null); }
  };

  const openFocusedRow = (row: D360Row) => {
    setFocusedRow(row);
    const names = activeBatch?.extraction_fields?.length ? activeBatch.extraction_fields : ["Amount", "Email"];
    const seed: Record<string, string> = {};
    for (const name of names) seed[name] = row.fields?.[name] ?? (name === "Amount" ? row.target_field_a : name === "Email" ? row.target_field_b : "") ?? "";
    setOverrideFields(seed);
  };

  // ── Distribution ────────────────────────────────────────────────────────
  const runDistribution = async () => {
    if (!activeBatchId) return;
    setDistributeBusy(true); setDistributeResult(null);
    try {
      let config: Record<string, any> = {};
      if (targetType === "cloud_storage") config = { provider: cloudProvider, bucket_name: bucketName };
      if (targetType === "database") config = { connection_string: dbConnectionString, table_name: dbTableName };
      if (targetType === "api") config = { url: apiUrl, method: apiMethod, auth_token: apiAuthToken || undefined };
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
            <h2 className="text-xl font-black text-gray-900">Omni-Channel Ingestion Gateway</h2>
            <p className="text-sm text-gray-500">Combine as many channels as you need — everything lands in one staging table below.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-black text-gray-900 text-sm mb-1 flex items-center gap-2"><Sparkles size={15} className="text-teal-600" /> What do you want to extract?</h3>
            <p className="text-xs text-gray-400 mb-4">Pick a template, or edit the field list directly — every file/screenshot/PDF/voice note below will be parsed for exactly these fields.</p>
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
                <button onClick={saveCurrentAsTemplate} disabled={savingTemplate || !newTemplateName.trim() || extractionFields.length === 0}
                  className="flex items-center gap-1.5 bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 disabled:opacity-40 font-bold text-xs px-3 py-2 rounded-lg transition shrink-0">
                  {savingTemplate ? <Loader2 size={12} className="animate-spin" /> : <LayoutTemplate size={12} />} Save as Template
                </button>
              </div>
              {selectedTemplateId && <p className="text-[11px] text-teal-600 mt-2">This batch will be linked to that template — after review you'll be able to Generate a real document from it.</p>}
            </div>
          </div>

          <div className="bg-white border-2 border-dashed border-teal-200 rounded-2xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
              <h3 className="font-black text-gray-900 text-sm flex items-center gap-2"><Sparkles size={15} className="text-teal-600" /> Auto-Extract — No Field List Needed</h3>
              <label className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition shrink-0">
                <Bot size={13} /> Upload & Auto-Extract
                <input type="file" accept="image/*,application/pdf,.pdf,.zip,application/zip" multiple className="hidden"
                  onChange={e => { if (e.target.files?.length) runAutoExtractFiles(e.target.files); e.target.value = ""; }} />
              </label>
            </div>
            <p className="text-xs text-gray-400 mb-3">Upload any number of images, PDFs, or a .zip of them — invoices, forms, receipts, scanned pages — and get back whatever each one actually contains as JSON, no need to know field names up front. Every PDF page and zip entry is processed as its own document.</p>
            {autoExtractErr && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">{autoExtractErr}</p>}
            {autoExtractItems.length > 0 && (
              <div className="space-y-3">
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
                          <button onClick={() => useAutoExtractResult(i)} className="text-[10px] font-bold text-white bg-teal-600 hover:bg-teal-700 px-2 py-1 rounded-lg transition">
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

          <div className="grid grid-cols-2 gap-2">
            {([
              ["excel", "Excel / CSV", Upload],
              ["voice", "Voice to Text", Mic],
            ] as [Channel, string, any][]).map(([key, label, Icon]) => (
              <button key={key} onClick={() => setChannel(key)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition ${channel === key ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                <Icon size={20} className={channel === key ? "text-teal-600" : "text-gray-400"} />
                <span className={`text-xs font-bold ${channel === key ? "text-teal-700" : "text-gray-600"}`}>{label}</span>
              </button>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            {channel === "excel" && (
              <div>
                <h3 className="font-black text-gray-900 text-sm mb-1">Excel / CSV Data Dump</h3>
                <p className="text-xs text-gray-400 mb-4">Each requested field is matched to the best-fitting column header — otherwise columns are used positionally.</p>
                <label className="border-2 border-dashed border-gray-200 hover:border-teal-300 rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer transition">
                  <Upload size={22} className="text-gray-300" />
                  <span className="text-sm text-gray-600 font-bold">Drag & drop, or click to choose a file</span>
                  <span className="text-xs text-gray-400">.xlsx, .xls, .csv</span>
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleExcelFile(f); e.target.value = ""; }} />
                </label>
              </div>
            )}
            {channel === "voice" && (
              <div>
                <h3 className="font-black text-gray-900 text-sm mb-1">Voice-to-Text Dictation</h3>
                <p className="text-xs text-gray-400 mb-4">Speak a record — e.g. "Acme Logistics, amount fourteen thousand, billing at acmalog dot com" — then commit it as a row.</p>
                <div className="flex flex-col items-center gap-4 py-6">
                  <button onClick={toggleVoice}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition ${voiceActive ? "bg-red-500 animate-pulse" : "bg-teal-600 hover:bg-teal-700"}`}>
                    {voiceActive ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
                  </button>
                  <p className="text-xs text-gray-400">{voiceActive ? "Listening… tap to stop" : "Tap to speak"}</p>
                  {voiceTranscript && (
                    <div className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3">
                      <p className="text-sm text-gray-700">{voiceTranscript}</p>
                      <button onClick={commitVoiceRow} className="mt-2 text-xs text-teal-600 font-bold hover:underline">+ Add as row</button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {ingestErr && <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{ingestErr}</p>}
            {ingestBusy && <p className="mt-3 text-xs text-teal-600 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Parsing…</p>}
          </div>

          {pendingRows.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-gray-900 text-sm">Staged Rows ({pendingRows.length})</h3>
                <button onClick={() => { setPendingRows([]); setAiCompare({}); setExpandedCompareIdx(null); }} className="text-xs text-gray-400 hover:text-red-500">Clear all</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="py-1.5 pr-3 font-bold">Source</th>
                      {extractionFields.map(f => <th key={f} className="py-1.5 pr-3 font-bold">{f}</th>)}
                      <th className="py-1.5 pr-3 font-bold">AI check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRows.map((r, i) => {
                      const cmp = aiCompare[i];
                      const hasDiff = cmp?.fields && extractionFields.some(f => (cmp.fields![f] || "") !== (r.fields?.[f] || ""));
                      return (
                        <Fragment key={i}>
                          <tr className="border-b border-gray-50">
                            <td className="py-1.5 pr-3 capitalize text-gray-500">{r.source_type}</td>
                            {extractionFields.map(f => <td key={f} className="py-1.5 pr-3 text-gray-800 font-medium">{r.fields?.[f] || "—"}</td>)}
                            <td className="py-1.5 pr-3">
                              {!cmp ? <span className="text-gray-300">—</span>
                                : cmp.busy ? <Loader2 size={12} className="animate-spin text-teal-500" />
                                : cmp.error ? <span className="text-red-400" title={cmp.error}>failed</span>
                                : (
                                  <button onClick={() => setExpandedCompareIdx(expandedCompareIdx === i ? null : i)}
                                    className={`flex items-center gap-1 font-bold ${hasDiff ? "text-amber-600" : "text-green-600"}`}>
                                    <ChevronRight size={11} className={`transition-transform ${expandedCompareIdx === i ? "rotate-90" : ""}`} />
                                    {hasDiff ? "differs" : "matches"}
                                  </button>
                                )}
                            </td>
                          </tr>
                          {expandedCompareIdx === i && cmp?.fields && (
                            <tr className="bg-slate-50">
                              <td colSpan={extractionFields.length + 2} className="p-3">
                                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Bot size={11} className="text-teal-600" /> Rule-based vs. AI ({cmp.provider || "?"}, {r.source_type === "screenshot" ? "reading the image directly" : "reading the extracted text"})
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => acceptAllAiValues(i)}
                                      className="text-[10px] font-bold text-white bg-teal-600 hover:bg-teal-700 px-2 py-1 rounded-lg transition">
                                      Use All AI Values
                                    </button>
                                    <button onClick={() => setJsonViewIdx(jsonViewIdx === i ? null : i)}
                                      className="text-[10px] font-bold text-gray-500 hover:text-teal-600 border border-gray-200 px-2 py-1 rounded-lg transition">
                                      {jsonViewIdx === i ? "Hide JSON" : "View JSON"}
                                    </button>
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  {extractionFields.map(f => {
                                    const ruleVal = r.fields?.[f] || "";
                                    const aiVal = cmp.fields![f] || "";
                                    const same = ruleVal === aiVal;
                                    const ruleOk = isValidFieldValue(f, ruleVal);
                                    const aiOk = isValidFieldValue(f, aiVal);
                                    return (
                                      <div key={f} className="grid grid-cols-[100px_1fr_1fr] gap-2 items-center">
                                        <span className="text-[10px] font-bold text-gray-500 truncate">{f}</span>
                                        <span className={`flex items-center gap-1 text-xs text-gray-700 bg-white border rounded-lg px-2 py-1 truncate ${ruleOk ? "border-gray-200" : "border-red-300"}`} title={ruleVal}>
                                          {!ruleOk && <AlertTriangle size={10} className="text-red-500 shrink-0" />}
                                          {ruleVal || "—"}
                                        </span>
                                        {same ? (
                                          <span className="text-xs text-gray-400 italic px-2 py-1">same as rule</span>
                                        ) : (
                                          <button onClick={() => acceptAiValue(i, f, aiVal)}
                                            className={`flex items-center gap-1 text-left text-xs bg-teal-50 hover:bg-teal-100 border rounded-lg px-2 py-1 truncate transition ${aiOk ? "text-teal-700 border-teal-200" : "text-red-700 border-red-300"}`}
                                            title={`Use AI value: ${aiVal}`}>
                                            {!aiOk && <AlertTriangle size={10} className="text-red-500 shrink-0" />}
                                            {aiVal || "(empty)"} <span className="text-[9px] font-bold">← use this</span>
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                {jsonViewIdx === i && (
                                  <pre className="mt-3 bg-gray-900 text-teal-300 text-[11px] rounded-lg p-3 overflow-x-auto">
{JSON.stringify(r.fields, null, 2)}
                                  </pre>
                                )}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                <input value={batchName} onChange={e => setBatchName(e.target.value)} placeholder="Name this batch…" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                <button onClick={createBatch} disabled={creatingBatch || !batchName.trim()} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition">
                  {creatingBatch ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Create &amp; Validate
                </button>
              </div>
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setFocusedRow(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-900 text-lg flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /> Manual Review — Row #{String(focusedRow.row_index + 1).padStart(3, "0")}</h3>
                <button onClick={() => setFocusedRow(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X size={16} /></button>
              </div>
              <div className={`text-xs font-bold px-3 py-2 rounded-lg border ${(VERDICT_STYLE[focusedRow.verdict_level] || VERDICT_STYLE.ok).badge}`}>{focusedRow.agent_verdict}</div>
              {focusedRow.raw_snippet && (
                <div className="bg-slate-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Raw Source Snippet</p>
                  <p className="text-xs text-gray-600 font-mono leading-relaxed max-h-24 overflow-y-auto">{focusedRow.raw_snippet}</p>
                </div>
              )}
              <div className="space-y-3">
                {Object.keys(overrideFields).map(name => {
                  const isLong = /item\s*-?\s*wise|itemi[sz]ed|line\s*items?|break\s*-?\s*down/i.test(name) || overrideFields[name].length > 60;
                  return (
                    <div key={name}>
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
              <div className="grid grid-cols-2 gap-3 pt-2">
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
        </div>
      )}

      {/* ══════════════════════ MAPPING ══════════════════════ */}
      {view === "mapping" && user && activeBatch && (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
          <button onClick={() => go("review")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 transition"><ArrowRight size={14} className="rotate-180" /> Back to Review</button>
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><ArrowRightLeft size={18} className="text-teal-600" /> Mapping Agent</h2>
            <p className="text-sm text-gray-500 mt-1">Map each ingested field onto the exact column or property name your destination expects. This is what makes the export actually usable by a real database or API — not just a dump of internal field names.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
              <span>Source Field (ingested)</span><span>Maps To (destination field)</span>
            </div>
            {Object.keys(mapping).map(sourceField => (
              <div key={sourceField} className="grid grid-cols-2 gap-3 items-center">
                <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <span className="text-xs font-mono text-gray-600 truncate">{sourceField}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight size={12} className="text-gray-300 shrink-0" />
                  <input value={mapping[sourceField]} onChange={e => setMapping(m => ({ ...m, [sourceField]: e.target.value }))}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-teal-400" />
                </div>
              </div>
            ))}
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
              <p className="text-sm text-gray-500">You haven't saved any templates yet — go back to a New Batch screen and use "Save as Template" under the field list first.</p>
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
                  <p className="text-xs text-gray-500">Real HTTP request with the mapped rows as JSON — works with any REST API or webhook.</p>
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
