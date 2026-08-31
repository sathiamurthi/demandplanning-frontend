"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import JSZip from "jszip";
import { 
  Database, Upload, FileText, Camera, Mic, MicOff, CheckCircle, XCircle,
  AlertTriangle, ChevronRight, X, Loader2, Plus, LogOut, ArrowRight,
  ShieldCheck, GitMerge, Cloud, HardDrive, Bot, Sparkles, Download,
  Cpu, ClipboardCheck, Workflow, Globe, ArrowRightLeft, LayoutTemplate, FileOutput,
  GraduationCap, BookOpen, Lightbulb, ListChecks, PenTool, Calendar, Lock, Languages, Menu, MessageSquare, Save
, Printer, MonitorPlay, Users } from "lucide-react";
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

const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Delhi", "Gujarat", "Haryana",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha",
  "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
];

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

// ── Components ───────────────────────────────────────────────────────────────
const MasterGrid = ({ itemsStr, onChange, placeholder, disabled }: { itemsStr: string, onChange: (s: string) => void, placeholder: string, disabled?: boolean }) => {
  const items = itemsStr.split("\n").filter(x => x.trim() !== "");
  const [newItem, setNewItem] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const update = (newArr: string[]) => onChange(newArr.join("\n"));

  return (
    <div className={`border rounded-lg p-4 bg-gray-50 flex flex-col gap-3 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex gap-2">
        <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder={placeholder} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-teal-400 focus:outline-none" />
        <button onClick={() => { if(newItem.trim()) { update([...items, newItem.trim()]); setNewItem(""); } }} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm shrink-0">Add</button>
      </div>
      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1 mt-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-white border border-gray-200 p-2.5 rounded-lg shadow-sm">
            {editingIdx === idx ? (
              <>
                <input value={editValue} onChange={e => setEditValue(e.target.value)} className="flex-1 border border-teal-400 rounded px-2 py-1 text-sm outline-none" autoFocus />
                <button onClick={() => { 
                  const arr = [...items]; arr[idx] = editValue.trim(); 
                  update(arr.filter(x => x)); setEditingIdx(null); 
                }} className="bg-green-100 text-green-700 hover:bg-green-200 text-xs font-bold px-3 py-1.5 rounded">Save</button>
                <button onClick={() => setEditingIdx(null)} className="bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-bold px-3 py-1.5 rounded">Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-gray-700 truncate">{item}</span>
                <button onClick={() => { setEditingIdx(idx); setEditValue(item); }} className="text-blue-600 hover:bg-blue-50 text-xs font-bold px-3 py-1.5 rounded border border-blue-200">Edit</button>
                <button onClick={() => { update(items.filter((_, i) => i !== idx)); }} className="text-red-600 hover:bg-red-50 text-xs font-bold px-3 py-1.5 rounded border border-red-200">Delete</button>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && <div className="text-sm text-gray-400 text-center py-6 border-2 border-dashed rounded-lg">No items found. Add one above!</div>}
      </div>
    </div>
  );
};

// ── Types ────────────────────────────────────────────────────────────────────
type View = "landing" | "auth" | "dashboard" | "ingest" | "review" | "mapping" | "generate" | "distribute" | "settings" | "school" | "examPrep" | "courseSite" | "questionBank" | "superadmin" | "translator" | "master";
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

const TRANSLATE_LANGS = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' }
];

const TranslateWidget = ({ textToTranslate }: { textToTranslate: string }) => {
  const [translating, setTranslating] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleTranslate = async (lang: string) => {
    setTranslating(lang);
    setResult(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToTranslate, fromLang: "Autodetect", toLang: lang })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.translation);
      } else {
        setResult("Error: " + data.error);
      }
    } catch (e: any) {
      setResult("Error: " + (e.message || "Unknown error"));
    }
    setTranslating(null);
  };

  return (
    <div className="mt-3 flex flex-col items-start gap-2 border-t border-gray-100 pt-3 w-full">
      <div className="flex gap-1 items-center flex-wrap">
        <span className="text-[10px] text-gray-400 font-bold uppercase mr-1 flex items-center gap-1"><Languages size={12} /> Translate</span>
        {TRANSLATE_LANGS.map(l => (
          <button key={l.code} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTranslate(l.code); }} disabled={!!translating} className="text-[10px] bg-gray-50 hover:bg-gray-200 border border-gray-200 text-gray-700 px-2 py-0.5 rounded transition disabled:opacity-50">
            {translating === l.code ? "..." : l.name}
          </button>
        ))}
      </div>
      {result && (
        <div className="w-full p-3 bg-indigo-50 text-indigo-900 text-sm rounded-lg border border-indigo-200 relative mt-1">
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setResult(null); }} className="absolute top-1 right-2 text-indigo-400 hover:text-indigo-600 font-bold text-lg">×</button>
          <span className="font-bold block mb-1 text-[10px] uppercase text-indigo-500">Translation Result</span>
          {result}
        </div>
      )}
    </div>
  );
};

const StandaloneTranslator = () => {
  const [text, setText] = useState("");
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
      <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-2">Paste Content</h3>
      <textarea
        rows={12}
        placeholder="Enter text to translate..."
        className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-teal-400 resize-y"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-4">
        <TranslateWidget textToTranslate={text} /> 
      </div>
    </div>
  );
};

export default function Data360Page() {
  const [view, setView] = useState<View>("landing");
  const [user, setUser] = useState<D360User | null>(null);
  const isSuperadmin = user?.email?.toLowerCase() === "superadmin@demandgeniusai.com" || user?.email?.toLowerCase() === "sathia@examhub360.com";
  const [authTab, setAuthTab] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [authCollege, setAuthCollege] = useState("");
  const [authState, setAuthState] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authPortal, setAuthPortal] = useState<"school" | "college">("school");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestAccessOpen, setGuestAccessOpen] = useState(false);
  const [guestErr, setGuestErr] = useState("");
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<string[]>([]);
  
  const [globalConfig, setGlobalConfig] = useState({ tier: "free", enableQuestionBank: true, enableDemoMode: true });
  const [adminQbUsers, setAdminQbUsers] = useState<string[]>([]);
  const canAccessQuestionBank = isSuperadmin || globalConfig.enableQuestionBank || (user?.email && adminQbUsers.includes(user.email));

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
  const [schoolSection, setSchoolSection] = useState<"single" | "batch">("single");
  const [schoolClassLevel, setSchoolClassLevel] = useState("X");
  const [schoolBoard, setSchoolBoard] = useState("CBSE");
  const [schoolState, setSchoolState] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [masterBoard, setMasterBoard] = useState("CBSE");
  const [masterClass, setMasterClass] = useState("10");
  const [masterSubject, setMasterSubject] = useState("");
  const [masterSubjectsEdit, setMasterSubjectsEdit] = useState("");
  const [masterChaptersEdit, setMasterChaptersEdit] = useState("");
  const [masterMessage, setMasterMessage] = useState("");
  const [schoolSubject, setSchoolSubject] = useState("");
  const [schoolChapterLabel, setSchoolChapterLabel] = useState("");
  const [schoolSelectedChapters, setSchoolSelectedChapters] = useState<string[]>([]);
  const [schoolChaptersList, setSchoolChaptersList] = useState<string[]>([]);
  const [schoolSubjectsList, setSchoolSubjectsList] = useState<string[]>([]);
  const [schoolSuggestingSubjects, setSchoolSuggestingSubjects] = useState(false);
  const [schoolSuggesting, setSchoolSuggesting] = useState(false);
  const [schoolPasteText, setSchoolPasteText] = useState("");
  const [schoolBusy, setSchoolBusy] = useState(false);
  const [schoolErr, setSchoolErr] = useState("");
  const [schoolResult, setSchoolResult] = useState<StudyPack | null>(null);
  
  const [studyTipsMarks, setStudyTipsMarks] = useState({
    test1: "", test2: "", test3: "", preMidterm: "", midterm: "", postMidterm: "", test4: "", test5: "", test6: "", practice1: "", practice2: "", practice3: ""
  });
  const [studyTipsResult, setStudyTipsResult] = useState<any>(null);
  const [studyTipsLoading, setStudyTipsLoading] = useState(false);
  
  const generateStudyTips = async (chapter: string, subject: string) => {
    setStudyTipsLoading(true);
    try {
      const res = await fetch("/api/examhub360/generate-tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks: studyTipsMarks, subject, chapter, class_level: schoolClassLevel || "College" })
      });
      const data = await res.json();
      if (data.success) {
        setStudyTipsResult(data);
      } else {
        alert("Failed to generate tips");
      }
    } catch (e) {
      alert("Error generating tips");
    } finally {
      setStudyTipsLoading(false);
    }
  };

  const [fetchingAnswerFor, setFetchingAnswerFor] = useState<{chapter: string, type: string, index: number} | null>(null);

  
  const runAutoGenerateAnswers = async (chapterName: string, chunkType: string, questions: any[]) => {
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].answer) {
        await fetchInlineAnswer(chapterName, chunkType, questions[i], i);
      }
    }
  };
  
  const handlePrintChapter = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 1000);
  };
  const fetchInlineAnswer = async (chapterName: string, chunkType: string, questionObj: any, index: number) => {
    setFetchingAnswerFor({ chapter: chapterName, type: chunkType, index });
    try {
      const res = await fetch("/api/examhub360/generate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionObj.question,
          chapter_name: chapterName,
          subject: schoolSubject,
          class_level: schoolClassLevel,
          board: `${schoolBoard} ${schoolBoard.toLowerCase().includes('state') ? schoolState : ''}`.trim(),
          chunkType,
          target_language: schoolTargetLang
        })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      
      setCourseSiteData((prev: any) => {
        const newData = prev.map((ch: any) => {
          if (ch.chapter !== chapterName) return ch;
          const newPack = { ...ch.studyPack };
          
          let targetArray = null;
          if (chunkType === "practice") targetArray = newPack.practice_questions;
          if (chunkType === "competency") targetArray = newPack.competency_questions;
          if (chunkType === "exercise") targetArray = newPack.exercise_questions;
          if (chunkType === "ncert") targetArray = newPack.ncert_questions;
          if (chunkType === "custom") targetArray = newPack.custom_qna;

          if (targetArray && targetArray[index]) {
            targetArray[index].answer = result.answer;
          }
          
          return { ...ch, studyPack: newPack };
        });
        localStorage.setItem("d360_courseSiteData", JSON.stringify(newData));
        return newData;
      });
    } catch (e) {
      console.error(e);
      alert("Failed to generate answer");
    } finally {
      setFetchingAnswerFor(null);
    }
  };

  const [schoolHistory, setSchoolHistory] = useState<StudyPack[]>([]);
  const [schoolTargetLang, setSchoolTargetLang] = useState("English");
  const [schoolProvider, setSchoolProvider] = useState("");
  const [schoolCached, setSchoolCached] = useState(false);
  

  useEffect(() => {
    fetch("/api/examhub360/config")
      .then(r => r.json())
      .then(d => { if (d.success) setGlobalConfig(d.data); })
      .catch(e => console.error("Failed to fetch config", e));
  }, []);

  type CourseChapterData = {
    chapter: string;
    studyPack: StudyPack | null;
    examPrep: any[] | null;
  };
  const [courseSiteData, setCourseSiteData] = useState<CourseChapterData[]>([]);
  const [courseActiveChapter, setCourseActiveChapter] = useState("");
  const [courseActiveTab, setCourseActiveTab] = useState("core");
  const [courseNavOpen, setCourseNavOpen] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number, total: number, status: string } | null>(null);




  // ── Exam Prep ───────────────────────────────────────
  const [examPrepSubject, setExamPrepSubject] = useState("");
  const [examPrepQuestionsMode, setExamPrepQuestionsMode] = useState<"upload" | "text">("text");
  const [examPrepQuestionsText, setExamPrepQuestionsText] = useState("");
  const [examPrepQuestionsImages, setExamPrepQuestionsImages] = useState<{ image_base64: string; mime_type: string }[]>([]);
  const [examPrepPatternMode, setExamPrepPatternMode] = useState<"upload" | "text">("text");
  const [examPrepPatternText, setExamPrepPatternText] = useState("");
  const [examPrepPatternImages, setExamPrepPatternImages] = useState<{ image_base64: string; mime_type: string }[]>([]);
  const [examPrepBusy, setExamPrepBusy] = useState(false);
  const [examPrepErr, setExamPrepErr] = useState("");
  const [examPrepResult, setExamPrepResult] = useState<any[]>([]);
  const [examPrepCached, setExamPrepCached] = useState(false);
  const [examPrepIncludeCompetitive, setExamPrepIncludeCompetitive] = useState(true);
  const [examPrepIncludeExercise, setExamPrepIncludeExercise] = useState(true);
  const [examPrepIncludeNCERT, setExamPrepIncludeNCERT] = useState(true);
  const [examPrepQuestionCount, setExamPrepQuestionCount] = useState<number>(50);
  const [examPrepPromptOverride, setExamPrepPromptOverride] = useState("");
  const [examPrepCustomQuestions, setExamPrepCustomQuestions] = useState("");

  // ── Super Admin Config ────────────────────────────────────────────────────────
  const [adminChapterConfig, setAdminChapterConfig] = useState<Record<string, "demo" | "paid">>({});
  const [adminPaidUsers, setAdminPaidUsers] = useState<string[]>([]);

  const [adminNewPaidUser, setAdminNewPaidUser] = useState("");
  const [adminNewChapter, setAdminNewChapter] = useState("");
  
  // ── Question Bank ───────────────────────────────────────────────────────────
  const [qbFilterYear, setQbFilterYear] = useState<string>("");
  const [qbFilterSubject, setQbFilterSubject] = useState<string>("");
  const [qbFilterClass, setQbFilterClass] = useState<string>("");
  const [qbUploadFile, setQbUploadFile] = useState<File | null>(null);
  const [qbUploadYear, setQbUploadYear] = useState<string>("2026");
  const [qbUploadSubject, setQbUploadSubject] = useState<string>("");
  const [qbUploadClass, setQbUploadClass] = useState<string>("");
  const [qbList, setQbList] = useState<{ id: string; uploader: string; year: string; subject: string; className: string; fileName: string; isPublic: boolean }[]>([]);
  
  useEffect(() => {
    // Load mock database from local storage
    try {
      const storedQb = localStorage.getItem("examhub_question_bank");
      if (storedQb) setQbList(JSON.parse(storedQb));
      
      const storedChapters = localStorage.getItem("examhub_chapter_config");
      if (storedChapters) setAdminChapterConfig(JSON.parse(storedChapters));
      
      const storedUsers = localStorage.getItem("examhub_paid_users");
      if (storedUsers) setAdminPaidUsers(JSON.parse(storedUsers));

      const storedQbUsers = localStorage.getItem("examhub_qb_users");
      if (storedQbUsers) setAdminQbUsers(JSON.parse(storedQbUsers));

      const allUsers = localStorage.getItem("d360_all_registered_users");
      if (allUsers) setAllRegisteredUsers(JSON.parse(allUsers));
    } catch (e) {}
  }, []);
  const handleExamPrepGenerate = async () => {
    if (!examPrepSubject.trim()) {
      setExamPrepErr("Subject is required.");
      return;
    }
    setExamPrepBusy(true);
    setExamPrepErr("");
    setExamPrepResult([]);
    
    // Simple caching mechanism
    const cacheKey = `examPrep_${examPrepSubject}_${examPrepIncludeCompetitive}_${examPrepIncludeExercise}_${examPrepIncludeNCERT}_${examPrepQuestionCount}_${examPrepPromptOverride}_${examPrepQuestionsText}_${examPrepPatternText}_${examPrepQuestionsImages.length}_${examPrepPatternImages.length}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setExamPrepResult(parsed);
        setExamPrepCached(true);
        setExamPrepBusy(false);
        return;
      } catch (e) {}
    }

    try {
      const res = await fetch("/api/examhub360/generate-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: examPrepSubject,
          questionsText: examPrepQuestionsText,
          questionsImages: examPrepQuestionsImages,
          patternText: examPrepPatternText,
          patternImages: examPrepPatternImages,
          includeCompetitive: examPrepIncludeCompetitive,
          includeExercise: examPrepIncludeExercise,
          includeNCERT: examPrepIncludeNCERT,
          questionCount: examPrepQuestionCount,
          promptOverride: examPrepPromptOverride,
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      setExamPrepResult(data.data);
      setExamPrepCached(false);
      localStorage.setItem(cacheKey, JSON.stringify(data.data));
    } catch (e: any) {
      setExamPrepErr(e.message || "Failed to generate exam questions.");
    } finally {
      setExamPrepBusy(false);
    }
  };

  const [examPrepUploadProgress, setExamPrepUploadProgress] = useState("");

  const processFile = async (file: File | Blob, name: string, imagesArr: any[], onProgress?: (msg: string) => void) => {
    if (name.toLowerCase().endsWith(".zip") || file.type === "application/zip" || file.type === "application/x-zip-compressed") {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
      const entries = Object.entries(loadedZip.files).filter(([_, entry]) => !entry.dir);
      let i = 0;
      for (const [filename, zipEntry] of entries) {
        i++;
        if (onProgress) onProgress(`Extracting ${i}/${entries.length}: ${filename}`);
        if (filename.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
          const blob = await zipEntry.async("blob");
          const mime = filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
          const fileObj = new File([blob], filename, { type: mime });
          imagesArr.push({ image_base64: await fileToBase64(fileObj), mime_type: mime });
        } else if (filename.match(/\.pdf$/i)) {
          const blob = await zipEntry.async("blob");
          const fileObj = new File([blob], filename, { type: "application/pdf" });
          const pages = await renderPdfPageImages(fileObj, 10);
          pages.forEach(p => imagesArr.push({ image_base64: p.base64, mime_type: p.mimeType }));
        }
      }
    } else if (file.type.startsWith("image/") || name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
      if (onProgress) onProgress(`Processing image: ${name}`);
      imagesArr.push({ image_base64: await fileToBase64(file as File), mime_type: file.type || "image/jpeg" });
    } else if (file.type === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
      if (onProgress) onProgress(`Rendering PDF pages: ${name}`);
      const pages = await renderPdfPageImages(file as File, 10);
      pages.forEach(p => imagesArr.push({ image_base64: p.base64, mime_type: p.mimeType }));
    } else {
      throw new Error(`"${name}" is an unsupported type - use images, PDF, or a ZIP containing them.`);
    }
  };

  const handleExamPrepFiles = async (fileList: FileList, type: "questions" | "pattern") => {
    const images: { image_base64: string; mime_type: string }[] = [];
    setExamPrepErr("");
    try {
      const filesArr = Array.from(fileList);
      for (let i = 0; i < filesArr.length; i++) {
        const file = filesArr[i];
        setExamPrepUploadProgress(`Reading file ${i + 1} of ${filesArr.length}: ${file.name}...`);
        await processFile(file, file.name, images, (msg) => setExamPrepUploadProgress(`File ${i + 1}/${filesArr.length} - ${msg}`));
      }
      if (type === "questions") {
        setExamPrepQuestionsImages(prev => [...prev, ...images]);
      } else {
        setExamPrepPatternImages(prev => [...prev, ...images]);
      }
      setExamPrepUploadProgress("");
    } catch (e: any) {
      setExamPrepErr(e.message || "Failed to read files.");
      setExamPrepUploadProgress("");
    }
  };

  useEffect(() => {
    if (!schoolBoard || !schoolClassLevel) {
      setSchoolSubjectsList([]);
      return;
    }
    const fetchSubjects = async () => {
      const cacheKey = `d360_subjects_${schoolBoard}_${schoolClassLevel}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          setSchoolSubjectsList(JSON.parse(cached));
          return;
        } catch (e) {}
      }
      setSchoolSuggestingSubjects(true);
      try {
        const res = await fetch("/api/examhub360/suggest-subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ class_level: schoolClassLevel, board: schoolBoard })
        });
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setSchoolSubjectsList(result.data);
          localStorage.setItem(cacheKey, JSON.stringify(result.data));
        }
      } catch (e) {
        // silently fail and fallback to empty/custom input
      } finally {
        setSchoolSuggestingSubjects(false);
      }
    };
    fetchSubjects();
  }, [schoolBoard, schoolClassLevel]);

  useEffect(() => {
    if (view === "master") {
      const cacheKey = `d360_subjects_${masterBoard}_${masterClass}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try { setMasterSubjectsEdit(JSON.parse(cached).join("\n")); } catch (e) { setMasterSubjectsEdit(""); }
      } else {
        setMasterSubjectsEdit("");
      }
    }
  }, [masterBoard, masterClass, view]);

  useEffect(() => {
    if (view === "master" && masterSubject) {
      const cacheKey = `d360_chapters_${masterBoard}_${masterClass}_${masterSubject}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try { 
          const units = JSON.parse(cached);
          const parsed = Array.isArray(units) ? units : (units.chapters || []);
          setMasterChaptersEdit(parsed.join("\n")); 
        } catch (e) { setMasterChaptersEdit(""); }
      } else {
        setMasterChaptersEdit("");
      }
    }
  }, [masterBoard, masterClass, masterSubject, view]);

  const filterChapters = (chapters: string[]) => {
    const isUserPaid = isSuperadmin || (user?.email && adminPaidUsers.includes(user.email.toLowerCase()));
    if (isUserPaid) return chapters;
    return chapters.filter(chap => adminChapterConfig[chap] !== "paid");
  };

  useEffect(() => {
    if (!schoolBoard || !schoolClassLevel || !schoolSubject) {
      setSchoolChaptersList([]);
      return;
    }
    const cacheKey = `d360_chapters_${schoolBoard}_${schoolClassLevel}_${schoolSubject}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { setSchoolChaptersList(filterChapters(JSON.parse(cached))); } catch (e) {}
    } else {
      setSchoolChaptersList([]);
    }
  }, [schoolBoard, schoolClassLevel, schoolSubject, adminChapterConfig, adminPaidUsers, user, isSuperadmin]);

  
  const addChapterManually = async () => {
    const chapterName = window.prompt("Enter Chapter Name to Add Manually:");
    if (!chapterName || !chapterName.trim()) return;
    const name = chapterName.trim();
    
    // Add to UI list immediately
    if (!schoolChaptersList.includes(name)) {
      setSchoolChaptersList(prev => [...prev, name]);
      setSchoolSelectedChapters(prev => [...prev, name]);
    }

    // Save to master data
    try {
      await fetch('/api/examhub360/master-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type: 'subject_chapter' })
      });
    } catch (e) {
      console.error("Failed to store chapter in master data", e);
    }
  };

  const suggestChapters = async () => {
    if (!schoolClassLevel.trim() || !schoolBoard.trim()) {
      setSchoolErr("Class and Board are required to suggest chapters.");
      return;
    }
    setSchoolSuggesting(true); setSchoolErr("");
    try {
      const res = await fetch("/api/examhub360/suggest-chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: schoolPasteText,
          class_level: schoolClassLevel,
          board: `${schoolBoard} ${schoolBoard.toLowerCase().includes('state') ? schoolState : ''}`.trim(),
          subject: schoolSubject
        })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      
      const filtered = filterChapters(result.data);
      setSchoolChaptersList(filtered);
      setSchoolSelectedChapters(filtered);
      
      const cacheKey = `d360_chapters_${schoolBoard}_${schoolClassLevel}_${schoolSubject}`;
      localStorage.setItem(cacheKey, JSON.stringify(result.data)); // save full list to cache

      // Auto-update master subjects list if it doesn't exist
      const subjectsCacheKey = `d360_subjects_${schoolBoard}_${schoolClassLevel}`;
      let masterSubjects = [];
      try { masterSubjects = JSON.parse(localStorage.getItem(subjectsCacheKey) || "[]"); } catch (e) {}
      if (!masterSubjects.includes(schoolSubject)) {
        masterSubjects.push(schoolSubject);
        localStorage.setItem(subjectsCacheKey, JSON.stringify(masterSubjects));
        setSchoolSubjectsList(masterSubjects);
      }
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

      const res = await fetch("/api/examhub360/generate-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images,
          class_level: schoolClassLevel,
          board: `${schoolBoard} ${schoolBoard.toLowerCase().includes('state') ? schoolState : ''}`.trim(),
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
      const res = await fetch("/api/examhub360/generate-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: schoolPasteText,
          class_level: schoolClassLevel,
          board: `${schoolBoard} ${schoolBoard.toLowerCase().includes('state') ? schoolState : ''}`.trim(),
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
      const res = await fetch("/api/examhub360/generate-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Please generate a comprehensive study guide based solely on your internal knowledge of this topic.",
          class_level: schoolClassLevel,
          board: `${schoolBoard} ${schoolBoard.toLowerCase().includes('state') ? schoolState : ''}`.trim(),
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

  const runBatchGeneration = async (forceBypass = false) => {
    if (schoolSelectedChapters.length === 0) {
      setSchoolErr("Please select at least one chapter to generate.");
      return;
    }
    
    setSchoolBusy(true);
    setSchoolErr("");
    
    const results: CourseChapterData[] = [];
    
    // Load DB to check for cached chapters
    const existingDbStr = localStorage.getItem("examhub_saved_chapters");
    let existingDb: CourseChapterData[] = [];
    if (existingDbStr) {
      try { existingDb = JSON.parse(existingDbStr); } catch(e){}
    }

    try {
      for (let i = 0; i < schoolSelectedChapters.length; i++) {
        const chap = schoolSelectedChapters[i];
        
        // Check DB first unless overridden
        const forceGenerate = (forceBypass === true) || examPrepPromptOverride.includes("***Generate New");
        const cachedChapter = existingDb.find(c => c.chapter === chap);
        // Only require studyPack. examPrep might legitimately be null if skipped or failed previously.
        if (!forceGenerate && cachedChapter && cachedChapter.studyPack) {
          setBatchProgress({ current: i + 1, total: schoolSelectedChapters.length, status: `Loading "${chap}" from Database...` });
          results.push(cachedChapter);
          // artificial delay for UI
          await new Promise(r => setTimeout(r, 500));
          continue;
        }
        
        setBatchProgress({ current: i + 1, total: schoolSelectedChapters.length, status: `Generating Core Concepts for "${chap}" (1/3)...` });
        
        let studyPack: any = {};
        
        const fetchChunk = async (chunkType: string) => {
          const res = await fetch("/api/examhub360/generate-study", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: "Please generate a comprehensive study guide based solely on your internal knowledge of this topic.",
              class_level: schoolClassLevel,
              board: `${schoolBoard} ${schoolBoard.toLowerCase().includes('state') ? schoolState : ''}`.trim(),
              subject: schoolSubject,
              chapter_name: chap,
              target_language: schoolTargetLang,
              includeCompetitive: examPrepIncludeCompetitive,
              includeExercise: examPrepIncludeExercise,
              includeNCERT: examPrepIncludeNCERT,
              questionCount: examPrepQuestionCount,
              promptOverride: examPrepPromptOverride,
              customQuestions: examPrepCustomQuestions,
              chunkType
            })
          });
          const text = await res.text();
          try {
            const data = JSON.parse(text);
            if (data.success) return data.data;
            throw new Error(data.error || "Unknown Error");
          } catch (e) {
            throw new Error(`API error (HTTP ${res.status}) on chunk ${chunkType}: ` + text.substring(0, 100));
          }
        };

        try {
          const coreChunk = await fetchChunk("core");
          studyPack = { ...studyPack, ...coreChunk };
          
          setBatchProgress({ current: i + 1, total: schoolSelectedChapters.length, status: `Generating Practice, Competency, and Exercise Questions for "${chap}" (2/3)...` });
          
          const promises = [fetchChunk("practice")];
          if (examPrepIncludeCompetitive) promises.push(fetchChunk("competency"));
          if (examPrepIncludeExercise) promises.push(fetchChunk("exercise"));
          if (examPrepCustomQuestions) promises.push(fetchChunk("custom_qna"));

          const chunks = await Promise.all(promises);
          chunks.forEach(chunk => { studyPack = { ...studyPack, ...chunk }; });
          
          if (examPrepIncludeNCERT) {
            setBatchProgress({ current: i + 1, total: schoolSelectedChapters.length, status: `Extracting NCERT Questions for "${chap}" (3/3)...` });
            const ncertChunk = await fetchChunk("ncert");
            studyPack = { ...studyPack, ...ncertChunk };
          }
        } catch (e: any) {
          console.error("Failed study pack chunking for " + chap, e);
          setSchoolErr("Study Pack Generation Failed: " + (e.message || String(e)));
          setSchoolBusy(false);
          return;
        }

        setBatchProgress({ current: i + 1, total: schoolSelectedChapters.length, status: `Generating Competitive Q&A for "${chap}"...` });
        
        let examPrep = null;
        try {
          const examRes = await fetch("/api/examhub360/generate-exam", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: `${schoolSubject} - ${chap}`,
              questionsText: "",
              questionsImages: [],
              patternText: `Focus heavily on ${schoolBoard} Class ${schoolClassLevel} competitive patterns.`,
              patternImages: [],
              includeCompetitive: examPrepIncludeCompetitive,
              includeExercise: examPrepIncludeExercise,
              includeNCERT: examPrepIncludeNCERT,
              questionCount: examPrepQuestionCount,
              promptOverride: examPrepPromptOverride,
            })
          });
          const examData = await examRes.json();
          if (examData.success) examPrep = examData.data;
        } catch (e) {
          console.error("Failed exam prep for " + chap, e);
        }
        
        results.push({ chapter: chap, studyPack, examPrep });
      }
      
      setCourseSiteData(results);
      
      // Save cumulatively to simulate DB
      for (const res of results) {
        const idx = existingDb.findIndex(c => c.chapter === res.chapter);
        if (idx >= 0) existingDb[idx] = res;
        else existingDb.push(res);
      }
      localStorage.setItem("examhub_saved_chapters", JSON.stringify(existingDb));
      localStorage.setItem("d360_courseSiteData", JSON.stringify(results)); // Keep legacy key for current session
      
      if (results.length > 0) {
        setCourseActiveChapter(results[0].chapter);
      }
      setView("courseSite");
    } catch (e: any) {
      setSchoolErr(e.message || "Failed to generate batch course site.");
    } finally {
      setSchoolBusy(false);
      setBatchProgress(null);
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
    document.title = "ExamHub360 — Autonomous Exam Prep & Study Generation";
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

  useEffect(() => {
    if (view === "superadmin") {
      fetch("/api/examhub360/users")
        .then(r => r.json())
        .then(res => {
           if (res.success && res.data) {
             setAllRegisteredUsers(res.data.map((u: any) => u.email));
             setAdminPaidUsers(res.data.filter((u: any) => u.isPaid).map((u: any) => u.email));
             setAdminQbUsers(res.data.filter((u: any) => u.hasQbAccess).map((u: any) => u.email));
           }
        })
        .catch(e => console.error("Could not fetch users", e));
    }
  }, [view]);
  useEffect(() => { if (view === "dashboard") loadBatches(); }, [view]);

  // ── Usage quota (2 free documents, then a paywall) ──────────────────────
  const [quota, setQuota] = useState<DataQuota | null>(null);
  const loadQuota = async () => {
    try { setQuota(await data360Api.getQuota()); } catch { /* ignore */ }
  };
  useEffect(() => { if (view === "dashboard" || view === "ingest") loadQuota(); }, [view]);

  // Superadmin-only manual quota grant (no live payment gateway yet — a
  // package purchase is confirmed out-of-band, then credited here).

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
      if (authTab === "register" && (!name.trim() || !phone.trim() || !authCollege.trim() || !authState)) throw new Error("Name, mobile number, college, and state are required.");
      if (!email.trim() || !password) throw new Error("Email and password are required.");
      const result = authTab === "register"
        ? await data360Api.register({ name, email, password, phone, college: authCollege, state: authState })
        : await data360Api.login(email, password);
      const token = result.token || result.accessToken;
      if (!token) throw new Error("Authentication succeeded without an access token.");
      const rawUser = result.user;
      const u = { ...rawUser, name: rawUser.name || [rawUser.firstName, rawUser.lastName].filter(Boolean).join(" ") || email.split("@")[0] };
      setToken(token);
      
      if (authPortal === "college") {
        window.location.href = "/examhub360-college";
        return;
      }
      
      setUser(u); setView("dashboard"); loadTemplates();
      
      if (authTab === "register") {
        try {
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: "avyukt@srichaitanya.com",
              subject: "New ExamHub360 Registration",
              text: `A new user has registered: ${u.name} (${u.email})`
            })
          });
        } catch (e) { console.error("Failed to send notification email", e); }
      }


    } catch (e: any) {
      setAuthErr(e.message || "Something went wrong");
    } finally {
      setAuthBusy(false);
    }
  };

  const continueAsGuest = () => {
    const normalizedPhone = guestPhone.replace(/[\s()-]/g, "");
    if (!/^\+?\d{10,15}$/.test(normalizedPhone)) { setGuestErr("Enter a valid mobile number."); return; }
    localStorage.setItem("examhub360_guest_phone", normalizedPhone);
    setGuestAccessOpen(false); setGuestErr(""); setView("school");
  };

  const handleDemo = async () => {
    if (!globalConfig.enableDemoMode) {
      setAuthErr("Demo Mode is currently disabled by the Superadmin.");
      return;
    }
    setAuthBusy(true);
    try {
      // Just directly allow access without creating a Postgres user
      const demoUser = { 
        id: "demo-user-" + Date.now(), 
        email: `demo+${Date.now()}@data360.ai`, 
        name: "Demo Operator", 
        role: "user",
        isPaid: true,
        hasQbAccess: true
      };
      
      setToken("mock-demo-token");
      if (authPortal === "college") {
        window.location.href = "/examhub360-college";
        return;
      }
      setUser(demoUser as any); 
      setView("dashboard"); 
      loadTemplates();
    } catch (e: any) {
      setAuthErr(e.message || "Something went wrong");
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

  const saveMasterSubjects = () => {
    const list = masterSubjectsEdit.split("\n").map(s => s.trim()).filter(s => s);
    localStorage.setItem(`d360_subjects_${masterBoard}_${masterClass}`, JSON.stringify(list));
    setMasterMessage("Subjects saved successfully to cache.");
    setTimeout(() => setMasterMessage(""), 3000);
  };

  const saveMasterChapters = () => {
    const list = masterChaptersEdit.split("\n").map(s => s.trim()).filter(s => s);
    localStorage.setItem(`d360_chapters_${masterBoard}_${masterClass}_${masterSubject}`, JSON.stringify(list));
    setMasterMessage("Chapters saved successfully to cache.");
    setTimeout(() => setMasterMessage(""), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button onClick={() => go("school")} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center"><GraduationCap size={16} className="text-white" /></div>
            <div className="text-left">
              <p className="font-black text-gray-900 text-sm leading-none">ExamHub360</p>
              <p className="text-[9px] text-teal-600 font-semibold leading-none mt-1">Autonomous Study Pack Generator</p>
            </div>
          </button>
          {view !== "landing" && <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              {/* <button onClick={() => go("dashboard")} className={`hover:text-teal-600 transition ${view === "dashboard" ? "text-teal-600 font-bold" : ""}`}>Batches</button> */}
              {/* <button onClick={() => { setPendingRows([]); go("ingest"); }} className={`hover:text-teal-600 transition ${view === "ingest" ? "text-teal-600 font-bold" : ""}`}>New Batch</button> */}
              <button onClick={() => go("school")} className={`hover:text-teal-600 transition ${view === "school" ? "text-teal-600 font-bold" : ""}`}>School / Study</button>
              {canAccessQuestionBank && (
                <button onClick={() => go("questionBank")} className={`hover:text-teal-600 transition ${view === "questionBank" ? "text-teal-600 font-bold" : ""}`}>Question Bank</button>
              )}
              <button onClick={() => {
                const dbStr = localStorage.getItem("examhub_saved_chapters");
                if (!dbStr) { alert("No pre-generated data found."); return; }
                try {
                  const db = JSON.parse(dbStr);
                  if (db.length === 0) { alert("No pre-generated data found."); return; }
                  let finalDb = db;
                  if (!user || !user.is_paid) {
                     finalDb = [db[0]];
                     alert("Free tier limited to 1 chapter viewing.");
                  }
                  setCourseSiteData(finalDb);
                  setCourseActiveChapter(finalDb[0].chapter);
                  setView("courseSite");
                } catch(e) { alert("Error reading DB."); }
              }} className={`hover:text-teal-600 transition ${view === "courseSite" ? "text-teal-600 font-bold" : ""}`}>Load Pre-Generated</button>
              <button onClick={() => go("translator")} className={`hover:text-teal-600 transition ${view === "translator" ? "text-teal-600 font-bold" : ""}`}>Translator</button>
            </div>}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-black text-sm">{(user.name ? user.name[0] : "A")}</div>
                <button onClick={() => go("dashboard")} className="text-sm font-bold text-gray-600 hover:text-teal-600 transition">Profile</button>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 transition"><LogOut size={16} /></button>
              </>
            ) : null}
          </div>
        </div>
        {view !== "landing" && (
          <div className="md:hidden border-t border-gray-100 px-4 py-2">
            <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto whitespace-nowrap text-xs font-semibold text-gray-600">
              <button onClick={() => go("school")} className={`px-3 py-1.5 rounded-full border transition ${view === "school" ? "bg-teal-600 text-white border-teal-600" : "bg-white border-gray-200 hover:border-teal-300 hover:text-teal-600"}`}>School / Study</button>
              {canAccessQuestionBank && (
                <button onClick={() => go("questionBank")} className={`px-3 py-1.5 rounded-full border transition ${view === "questionBank" ? "bg-teal-600 text-white border-teal-600" : "bg-white border-gray-200 hover:border-teal-300 hover:text-teal-600"}`}>Question Bank</button>
              )}
              <button onClick={() => {
                const dbStr = localStorage.getItem("examhub_saved_chapters");
                if (!dbStr) { alert("No pre-generated data found."); return; }
                try {
                  const db = JSON.parse(dbStr);
                  if (db.length === 0) { alert("No pre-generated data found."); return; }
                  let finalDb = db;
                  if (!user || !user.is_paid) {
                     finalDb = [db[0]];
                     alert("Free tier limited to 1 chapter viewing.");
                  }
                  setCourseSiteData(finalDb);
                  setCourseActiveChapter(finalDb[0].chapter);
                  setView("courseSite");
                } catch(e) { alert("Error reading DB."); }
              }} className={`px-3 py-1.5 rounded-full border transition ${view === "courseSite" ? "bg-teal-600 text-white border-teal-600" : "bg-white border-gray-200 hover:border-teal-300 hover:text-teal-600"}`}>Load Pre-Generated</button>
              <button onClick={() => go("translator")} className={`px-3 py-1.5 rounded-full border transition ${view === "translator" ? "bg-teal-600 text-white border-teal-600" : "bg-white border-gray-200 hover:border-teal-300 hover:text-teal-600"}`}>Translator</button>
            </div>
          </div>
        )}
      </nav>

      {/* ====================== LANDING ====================== */}
      {view === "landing" && (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">ExamHub360</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4"><Users size={32} /></div>
               <h2 className="text-2xl font-bold mb-2">Student & Guest Access</h2>
               <button onClick={() => { setGuestPhone(""); setGuestErr(""); setGuestAccessOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold py-3 px-8 rounded-xl transition w-full">Guest Access</button>
            </div>
            
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-4"><ShieldCheck size={32} /></div>
               <h2 className="text-2xl font-bold mb-2">Admin / Teacher Login</h2>
               <p className="text-gray-500 mb-6">Full access to generate unlimited chapters, configure syllabus, and manage courses.</p>
               <button onClick={() => setView("auth")} className="bg-teal-600 hover:bg-teal-700 text-white text-lg font-bold py-3 px-8 rounded-xl transition w-full">Login / Register</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center max-w-5xl mx-auto">
             <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
               <div className="text-3xl font-black text-teal-600 mb-1">12,500+</div>
               <div className="text-sm font-bold text-gray-500 uppercase tracking-wide">Questions Generated</div>
             </div>
             <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
               <div className="text-3xl font-black text-teal-600 mb-1">450+</div>
               <div className="text-sm font-bold text-gray-500 uppercase tracking-wide">Subjects Covered</div>
             </div>
             <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
               <div className="text-3xl font-black text-teal-600 mb-1">2,100+</div>
               <div className="text-sm font-bold text-gray-500 uppercase tracking-wide">Active Users</div>
             </div>
             <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
               <div className="text-3xl font-black text-teal-600 mb-1">98%</div>
               <div className="text-sm font-bold text-gray-500 uppercase tracking-wide">Accuracy</div>
             </div>
          </div>
        </div>
      )}

      {guestAccessOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setGuestAccessOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-black text-gray-900">Continue as Guest</h2>
            <p className="text-sm text-gray-500 mt-1">Enter your mobile number to continue.</p>
            <input value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="Mobile number" type="tel" autoFocus className="mt-5 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            {guestErr && <p className="mt-2 text-sm text-red-600">{guestErr}</p>}
            <button onClick={continueAsGuest} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg">Continue</button>
          </div>
        </div>
      )}

      {view === "auth" && (
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5">
              {(["register", "login"] as const).map(tab => <button key={tab} onClick={() => setAuthTab(tab)} className={`flex-1 py-2 rounded-md text-sm font-bold ${authTab === tab ? "bg-teal-600 text-white" : "text-gray-600"}`}>{tab === "register" ? "Register" : "Login"}</button>)}
            </div>
            <div className="space-y-3">
              {authTab === "register" && <>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Mobile number" type="tel" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={authCollege} onChange={e => setAuthCollege(e.target.value)} placeholder="College / School name" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <select value={authState} onChange={e => setAuthState(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"><option value="">Select state</option>{INDIAN_STATES.map(state => <option key={state}>{state}</option>)}</select>
              </>}
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            </div>
            {authErr && <p className="mt-3 text-sm text-red-600">{authErr}</p>}
            <button onClick={handleAuth} disabled={authBusy} className="w-full mt-5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg">{authBusy ? "Please wait..." : authTab === "register" ? "Create account" : "Login"}</button>
          </div>
        </div>
      )}

      {/* ====================== SCHOOL GENERATOR ====================== */}
      {view === "school" && (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><GraduationCap size={18} className="text-teal-600" /> ExamHub360 — Autonomous Course Site Generator</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSchoolSection("single")} className={`px-4 py-2 rounded-full text-sm font-bold border transition ${schoolSection === "single" ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-700 border-gray-200 hover:border-teal-300 hover:text-teal-600"}`}>
              Single Chapter Generator
            </button>
            <button onClick={() => setSchoolSection("batch")} className={`px-4 py-2 rounded-full text-sm font-bold border transition ${schoolSection === "batch" ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-700 border-gray-200 hover:border-teal-300 hover:text-teal-600"}`}>
              Course Site Batch Builder
            </button>
          </div>

          {schoolSection === "single" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Class / Grade</label>
                  <select value={schoolClassLevel} onChange={e => setSchoolClassLevel(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400">
                    {["V","VI","VII","VIII","IX","X","XI","XII"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Board</label>
                  <input value={schoolBoard} onChange={e => setSchoolBoard(e.target.value)} placeholder="CBSE" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Subject</label>
                  <input value={schoolSubject} onChange={e => setSchoolSubject(e.target.value)} placeholder="e.g. Science" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Target Language</label>
                  <select value={schoolTargetLang} onChange={e => setSchoolTargetLang(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400">
                    {["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Urdu"].map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {["CBSE", "ICSE", "State Board", "IB", "Cambridge / IGCSE"].map(board => (
                  <button 
                    key={board} 
                    onClick={() => setSchoolBoard(board)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                      schoolBoard === board ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {board}
                  </button>
                ))}
              </div>

              {schoolBoard === "State Board" && (
                <div className="pt-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">State</label>
                  <select value={schoolState} onChange={e => setSchoolState(e.target.value)} className="mt-1 w-full sm:w-1/4 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400">
                    <option value="">Not State Specific (Default)</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                      <option value="Assam">Assam</option>
                      <option value="Bihar">Bihar</option>
                      <option value="Chhattisgarh">Chhattisgarh</option>
                      <option value="Goa">Goa</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Himachal Pradesh">Himachal Pradesh</option>
                      <option value="Jharkhand">Jharkhand</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Manipur">Manipur</option>
                      <option value="Meghalaya">Meghalaya</option>
                      <option value="Mizoram">Mizoram</option>
                      <option value="Nagaland">Nagaland</option>
                      <option value="Odisha">Odisha</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Sikkim">Sikkim</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Tripura">Tripura</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Uttarakhand">Uttarakhand</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                      <option value="Chandigarh">Chandigarh</option>
                      <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                      <option value="Ladakh">Ladakh</option>
                      <option value="Lakshadweep">Lakshadweep</option>
                      <option value="Puducherry">Puducherry</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <button className="flex-1 flex items-center justify-center gap-2 bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold text-sm py-2.5 rounded-lg border border-teal-100 transition">
                  <Upload size={16} /> Upload Syllabus PDF to Extract Chapters
                </button>
                <button onClick={addChapterManually} className="flex items-center justify-center gap-2 bg-white text-teal-600 border border-teal-200 hover:bg-teal-50 font-bold text-sm px-4 py-2.5 rounded-lg transition">
                  <Plus size={16} /> Add Manually
                </button>
                <button onClick={suggestChapters} disabled={schoolSuggesting || !schoolClassLevel || !schoolBoard || !schoolSubject} className="flex items-center justify-center gap-2 bg-[#8cd2c7] text-white hover:bg-teal-400 disabled:opacity-40 font-bold text-sm px-4 py-2.5 rounded-lg transition">
                  {schoolSuggesting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Auto-Suggest Chapters
                </button>
              </div>

              <div className="mt-6 border border-teal-200 border-dashed rounded-xl p-1">
                <div className="flex flex-col sm:flex-row bg-white rounded-lg overflow-hidden">
                  <button onClick={() => setSchoolInputMode('upload')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition ${schoolInputMode === 'upload' ? 'text-teal-700 bg-teal-50 border-b-2 border-teal-500' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Upload size={16} /> Upload Pages
                  </button>
                  <button onClick={() => setSchoolInputMode('text')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition ${schoolInputMode === 'text' ? 'text-teal-700 bg-teal-50 border-b-2 border-teal-500' : 'text-gray-500 hover:text-gray-700'}`}>
                    <FileText size={16} /> Paste Text
                  </button>
                  <button onClick={() => setSchoolInputMode('generate')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition ${schoolInputMode === 'generate' ? 'text-teal-700 bg-teal-50 border-b-2 border-teal-500' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Sparkles size={16} /> Generate by Topic
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="border border-gray-200 rounded-xl p-4 bg-white">
                  <h3 className="font-bold text-sm text-gray-800 mb-3">Generation Options</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={examPrepIncludeCompetitive} onChange={e => setExamPrepIncludeCompetitive(e.target.checked)} className="rounded text-teal-600 focus:ring-teal-500" />
                      Include Competitive Exam Questions
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={examPrepIncludeExercise} onChange={e => setExamPrepIncludeExercise(e.target.checked)} className="rounded text-teal-600 focus:ring-teal-500" />
                      Include Standard Exercise Questions
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={examPrepIncludeNCERT} onChange={e => setExamPrepIncludeNCERT(e.target.checked)} className="rounded text-teal-600 focus:ring-teal-500" />
                      Include NCERT Questions & Answers
                    </label>
                    <div>
                      <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Total Question Count (Approx)</span>
                      <select value={examPrepQuestionCount} onChange={e => setExamPrepQuestionCount(Number(e.target.value))} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-teal-400">
                        <option value={15}>15 Questions (Fastest)</option>
                        <option value={50}>50 Questions</option>
                        <option value={100}>100 Questions</option>
                        <option value={150}>150 Questions</option>
                        <option value={200}>200 Questions</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-4 bg-white flex flex-col gap-4">
                  <div>
                    <h3 className="font-bold text-sm text-gray-800 mb-1">Custom Questions</h3>
                    <textarea value={examPrepCustomQuestions} onChange={e => setExamPrepCustomQuestions(e.target.value)} rows={2} placeholder="e.g. Explain the difference between..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 resize-none" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-800 mb-1">Custom Prompt Override (Optional)</h3>
                    <textarea value={examPrepPromptOverride} onChange={e => setExamPrepPromptOverride(e.target.value)} rows={2} placeholder="e.g. Ensure all questions are strictly aligned to the latest NCERT competency framework..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 resize-none" />
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-dashed border-teal-200 rounded-2xl p-6 print:hidden">
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
                    <button onClick={runStudyGuideGenerate} disabled={schoolBusy || !schoolClassLevel.trim() || !schoolBoard.trim() || !schoolSubject.trim() || !schoolChapterLabel.trim()}
                      className="mt-2 flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-xs px-3 py-2 rounded-lg transition">
                      <Sparkles size={13} /> Generate Study Pack
                    </button>
                  </div>
                )}

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

                  {schoolResult.quick_reference && schoolResult.quick_reference.length > 0 && (
                    <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6">
                      <h4 className="font-black text-teal-800 text-sm mb-3 flex items-center gap-2"><ListChecks size={16} /> Quick Reference</h4>
                      <ul className="space-y-1.5">
                        {schoolResult.quick_reference.map((q, i) => <li key={i} className="text-sm text-teal-900 flex gap-2"><span className="text-teal-400">•</span>{q}</li>)}
                      </ul>
                    </div>
                  )}

                  {schoolResult.quick_reference?.length > 0 && (
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

                  {schoolResult.key_terms && schoolResult.key_terms.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                      <h4 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2"><BookOpen size={16} className="text-teal-600" /> Key Terms</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {schoolResult.key_terms.map((t, i) => (
                          <div key={i} className="text-sm"><span className="font-bold text-gray-900">{t.term}:</span> <span className="text-gray-600">{t.meaning}</span></div>
                        ))}
                      </div>
                    </div>
                  )}

                  {schoolResult.study_plan && schoolResult.study_plan.length > 0 && (
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
                          <details key={i} open={isPrinting} className="group border border-gray-200 rounded-xl bg-gray-50 overflow-hidden print-expand">
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
                          <details key={i} open={isPrinting} className="group border border-gray-200 rounded-xl bg-gray-50 overflow-hidden print-expand">
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

                  {schoolResult.practice_questions && schoolResult.practice_questions.length > 0 && (
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

                  {schoolResult.ncert_questions && schoolResult.ncert_questions.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-4">
                      <h4 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2"><BookOpen size={16} className="text-teal-600" /> NCERT Questions</h4>
                      <div className="space-y-2">
                        {schoolResult.ncert_questions.map((q, i) => (
                          <div key={i} className="border border-gray-100 rounded-xl p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-gray-900">Q{i + 1}. {q.question}</p>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">Ans: {q.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {schoolResult.common_mistakes && schoolResult.common_mistakes.length > 0 && (
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

          {schoolSection === "batch" && schoolChaptersList.length > 0 && (
            <div className="bg-white border border-teal-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-teal-100">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">Course Site Batch Builder</p>
                  <h3 className="text-sm font-black text-gray-800">Generate multiple chapters in one flow</h3>
                </div>
                <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-1">Separate from chapter mode</span>
              </div>

              <div className="pt-1">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Select Chapters to Generate ({schoolSelectedChapters.length} selected)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {schoolChaptersList.map(chap => (
                    <label key={chap} className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition ${schoolSelectedChapters.includes(chap) ? 'bg-teal-50 border-teal-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                      <input type="checkbox" className="rounded text-teal-600 focus:ring-teal-500" checked={schoolSelectedChapters.includes(chap)} onChange={(e) => {
                        if (e.target.checked) setSchoolSelectedChapters(p => [...p, chap]);
                        else setSchoolSelectedChapters(p => p.filter(c => c !== chap));
                      }} />
                      <span className="text-xs font-semibold text-gray-700 truncate">{chap}</span>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-teal-100">
                  <button onClick={() => runBatchGeneration(true)} disabled={schoolBusy || schoolSelectedChapters.length === 0} className="h-10 flex items-center justify-center gap-2 bg-white border border-teal-600 text-teal-700 hover:bg-teal-50 disabled:opacity-40 font-bold text-sm px-6 rounded-lg transition shadow-sm">
                    <Sparkles size={16} /> Regenerate (Bypass Cache)
                  </button>

                  <button onClick={() => runBatchGeneration(false)} disabled={schoolBusy} className="h-10 flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white disabled:opacity-40 font-bold text-sm px-6 rounded-lg transition shadow-sm">
                    {schoolBusy ? <Loader2 size={16} className="animate-spin" /> : <GraduationCap size={16} />} 
                    {schoolBusy ? "Batch Generating..." : `Generate Course Site (${schoolSelectedChapters.length} Chapters)`}
                  </button>
                </div>

                {batchProgress && (
                  <div className="mt-3 p-3 bg-teal-50 rounded-lg border border-teal-100 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-bold text-teal-800">
                      <span>{batchProgress.status}</span>
                      <span>{batchProgress.current} / {batchProgress.total}</span>
                    </div>
                    <div className="w-full bg-teal-200 rounded-full h-1.5">
                      <div className="bg-teal-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}


      {/* ====================== EXAM PREP ====================== */}
      {view === "examPrep" && user && (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><GraduationCap size={18} className="text-teal-600" /> Exam Prep — AI Q&A Generator</h2>
          </div>

          {examPrepUploadProgress && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-xl text-sm flex items-center gap-3 font-medium shadow-sm animate-pulse">
              <Loader2 size={18} className="animate-spin" />
              {examPrepUploadProgress}
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Subject Name</label>
              <input value={examPrepSubject} onChange={e => setExamPrepSubject(e.target.value)} placeholder="e.g. Mathematics" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Previous Questions Section */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                <h3 className="font-bold text-sm text-gray-800 mb-3 flex justify-between items-center">
                  <span>Previous Questions</span>
                  <div className="flex bg-gray-200 rounded-lg p-0.5">
                    <button onClick={() => setExamPrepQuestionsMode("text")} className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition ${examPrepQuestionsMode === "text" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Text</button>
                    <button onClick={() => setExamPrepQuestionsMode("upload")} className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition ${examPrepQuestionsMode === "upload" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Images/PDF</button>
                  </div>
                </h3>
                {examPrepQuestionsMode === "text" ? (
                  <textarea value={examPrepQuestionsText} onChange={e => setExamPrepQuestionsText(e.target.value)} rows={5} placeholder="Paste previous questions here..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 resize-none" />
                ) : (
                  <label className="border-2 border-dashed border-gray-300 hover:border-teal-300 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer bg-white transition">
                    <Upload size={18} className="text-gray-400" />
                    <span className="text-xs text-gray-600 font-medium text-center">Click or drop question images/PDFs/ZIPs</span>
                    <input type="file" accept="image/*,application/pdf,.pdf,application/zip,.zip" multiple className="hidden" onChange={e => { if (e.target.files?.length) handleExamPrepFiles(e.target.files, "questions"); e.target.value = ""; }} />
                  </label>
                )}
                {examPrepQuestionsImages.length > 0 && <p className="text-[10px] mt-2 text-teal-600 font-bold">{examPrepQuestionsImages.length} file(s) attached.</p>}
              </div>

              {/* Exam Pattern Section */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                <h3 className="font-bold text-sm text-gray-800 mb-3 flex justify-between items-center">
                  <span>2026-2027 Pattern / Syllabus</span>
                  <div className="flex bg-gray-200 rounded-lg p-0.5">
                    <button onClick={() => setExamPrepPatternMode("text")} className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition ${examPrepPatternMode === "text" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Text</button>
                    <button onClick={() => setExamPrepPatternMode("upload")} className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition ${examPrepPatternMode === "upload" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Images/PDF</button>
                  </div>
                </h3>
                {examPrepPatternMode === "text" ? (
                  <textarea value={examPrepPatternText} onChange={e => setExamPrepPatternText(e.target.value)} rows={5} placeholder="Describe the new pattern (e.g. competency based, MCQs)..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 resize-none" />
                ) : (
                  <label className="border-2 border-dashed border-gray-300 hover:border-teal-300 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer bg-white transition">
                    <Upload size={18} className="text-gray-400" />
                    <span className="text-xs text-gray-600 font-medium text-center">Click or drop pattern images/PDFs</span>
                    <input type="file" accept="image/*,application/pdf,.pdf" multiple className="hidden" onChange={e => { if (e.target.files?.length) handleExamPrepFiles(e.target.files, "pattern"); e.target.value = ""; }} />
                  </label>
                )}
                {examPrepPatternImages.length > 0 && <p className="text-[10px] mt-2 text-teal-600 font-bold">{examPrepPatternImages.length} file(s) attached.</p>}
              </div>
            </div>

            {/* Custom Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-xl p-4 bg-white">
                <h3 className="font-bold text-sm text-gray-800 mb-3">Generation Options</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={examPrepIncludeCompetitive} onChange={e => setExamPrepIncludeCompetitive(e.target.checked)} className="rounded text-teal-600 focus:ring-teal-500" />
                    Include Competitive Exam Questions
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={examPrepIncludeExercise} onChange={e => setExamPrepIncludeExercise(e.target.checked)} className="rounded text-teal-600 focus:ring-teal-500" />
                    Include Standard Exercise Questions
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={examPrepIncludeNCERT} onChange={e => setExamPrepIncludeNCERT(e.target.checked)} className="rounded text-teal-600 focus:ring-teal-500" />
                    Include NCERT Questions & Answers
                  </label>
                  <div>
                    <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Total Question Count (Approx)</span>
                    <select value={examPrepQuestionCount} onChange={e => setExamPrepQuestionCount(Number(e.target.value))} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-teal-400">
                      <option value={50}>50 Questions</option>
                      <option value={100}>100 Questions</option>
                      <option value={150}>150 Questions</option>
                      <option value={200}>200 Questions</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 bg-white">
                <h3 className="font-bold text-sm text-gray-800 mb-1">Custom Prompt Override (Optional)</h3>
                <p className="text-[10px] text-gray-500 mb-2">Leave blank to use default AI instructions. Sample: <em>"Focus heavily on application-based MCQs. Do not include fill-in-the-blanks."</em></p>
                <textarea value={examPrepPromptOverride} onChange={e => setExamPrepPromptOverride(e.target.value)} rows={4} placeholder="e.g. Ensure all questions are strictly aligned to the latest NCERT competency framework..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 resize-none" />
              </div>
            </div>

            {examPrepErr && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">{examPrepErr}</div>}

            <div className="flex justify-end">
              <button onClick={handleExamPrepGenerate} disabled={examPrepBusy} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-sm">
                {examPrepBusy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} 
                {examPrepBusy ? "Generating..." : "Generate 2026-2027 Questions"}
              </button>
            </div>
          </div>

          {examPrepResult && examPrepResult.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-900 text-lg">Generated Questions & Answers</h3>
                {examPrepCached && <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">Loaded from Cache</span>}
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {examPrepResult.map((qa, i) => (
                  <details key={i} className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <summary className="p-5 cursor-pointer hover:bg-gray-50 transition list-none">
                      <p className="font-bold text-gray-800"><span className="text-teal-600 mr-2">Q{i + 1}.</span>{qa.question}</p>
                      
                      {qa.options && qa.options.length > 0 && (
                        <ul className="pl-6 space-y-1 mt-3">
                          {qa.options.map((opt: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-600 flex gap-2"><span className="font-bold">{String.fromCharCode(65 + idx)}.</span> {opt}</li>
                          ))}
                        </ul>
                      )}
                    </summary>
                    
                    <div className="bg-teal-50 border-t border-teal-100 p-4">
                      <p className="text-sm font-bold text-teal-800">Answer:</p>
                      <p className="text-sm text-teal-900 mt-1">{qa.answer}</p>
                      {qa.explanation && (
                        <div className="mt-2 pt-2 border-t border-teal-200/50">
                          <p className="text-xs font-bold text-teal-800">Explanation:</p>
                          <p className="text-xs text-teal-900 mt-1">{qa.explanation}</p>
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================== COURSE SITE ====================== */}
      {view === "courseSite" && courseSiteData.length > 0 && (
        <div className="relative flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
          {courseNavOpen && <button aria-label="Close chapter navigation" onClick={() => setCourseNavOpen(false)} className="absolute inset-0 z-20 bg-gray-900/25" />}
          {/* Sidebar */}
          <aside className={`absolute inset-y-0 left-0 z-30 w-80 max-w-[85vw] bg-white border-r border-gray-200 overflow-y-auto flex flex-col shadow-xl transition-transform duration-200 ${courseNavOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <button onClick={() => setView("dashboard")} className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-teal-600 transition">
                  <ArrowRight size={12} className="rotate-180" /> Back to Dashboard
                </button>
                <button aria-label="Close chapter navigation" onClick={() => setCourseNavOpen(false)} className="p-1 text-gray-400 hover:text-gray-700" title="Close navigation"><X size={16} /></button>
              </div>
              <h2 className="font-black text-gray-900 text-sm flex items-center gap-2"><BookOpen size={16} className="text-teal-600" /> Complete Course Site</h2>
              <p className="text-[10px] text-gray-500 mt-1">{schoolBoard} • Class {schoolClassLevel} • {schoolSubject}</p>
            </div>
            <div className="p-3 space-y-1" onClick={event => { if ((event.target as HTMLElement).closest("button")) setCourseNavOpen(false); }}>
              {courseSiteData.map((data, idx) => (
                <div key={data.chapter}>
                  <button 
                    onClick={() => { setCourseActiveChapter(data.chapter); setCourseActiveTab("core"); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-between group ${courseActiveChapter === data.chapter ? "bg-teal-50 text-teal-700 border border-teal-200" : "text-gray-600 hover:bg-gray-100 border border-transparent"}`}
                  >
                    <span className="truncate pr-2">{idx + 1}. {data.chapter}</span>
                    {courseActiveChapter === data.chapter ? <ChevronRight size={14} className="text-teal-500 rotate-90 transition-transform" /> : <ChevronRight size={14} className="text-gray-400 group-hover:text-teal-500 opacity-0 group-hover:opacity-100 transition" />}
                  </button>
                  {courseActiveChapter === data.chapter && (
                    <div className="pl-6 pr-2 py-1 space-y-1 mt-1 border-l-2 border-teal-100 ml-4">
                      <button onClick={() => setCourseActiveTab("plan")} className={`w-full text-left px-2 py-1.5 text-[11px] font-bold rounded transition ${(isPrinting || courseActiveTab === "plan") ? "text-teal-700 bg-teal-50" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}>Study Plan</button>
                      <button onClick={() => setCourseActiveTab("videos")} className={`w-full text-left px-2 py-1.5 text-[11px] font-bold rounded transition ${(isPrinting || courseActiveTab === "videos") ? "text-teal-700 bg-teal-50" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}>YouTube References</button>
                      <button onClick={() => setCourseActiveTab("core")} className={`w-full text-left px-2 py-1.5 text-[11px] font-bold rounded transition ${(isPrinting || courseActiveTab === "core") ? "text-teal-700 bg-teal-50" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}>Core Concepts</button>
                      <button onClick={() => setCourseActiveTab("glossary")} className={`w-full text-left px-2 py-1.5 text-[11px] font-bold rounded transition ${(isPrinting || courseActiveTab === "glossary") ? "text-teal-700 bg-teal-50" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}>Glossary & Key Terms</button>
                      <button onClick={() => setCourseActiveTab("formulas")} className={`w-full text-left px-2 py-1.5 text-[11px] font-bold rounded transition ${(isPrinting || courseActiveTab === "formulas") ? "text-teal-700 bg-teal-50" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}>Quick Reference / Formulas</button>
                      <button onClick={() => setCourseActiveTab("mistakes")} className={`w-full text-left px-2 py-1.5 text-[11px] font-bold rounded transition ${(isPrinting || courseActiveTab === "mistakes") ? "text-teal-700 bg-teal-50" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}>Common Mistakes to Avoid</button>
                      <button onClick={() => setCourseActiveTab("practice")} className={`w-full text-left px-2 py-1.5 text-[11px] font-bold rounded transition ${(isPrinting || courseActiveTab === "practice") ? "text-teal-700 bg-teal-50" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}>Practice Questions</button>
                      <button onClick={() => setCourseActiveTab("competitive")} className={`w-full text-left px-2 py-1.5 text-[11px] font-bold rounded transition ${(isPrinting || courseActiveTab === "competitive") ? "text-teal-700 bg-teal-50" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}>Competitive Exam Prep</button>
                      <button onClick={() => setCourseActiveTab("competency")} className={`w-full text-left px-2 py-1.5 text-[11px] font-bold rounded transition ${(isPrinting || courseActiveTab === "competency") ? "text-teal-700 bg-teal-50" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}>Competency Questions</button>
                      <button onClick={() => setCourseActiveTab("exercise")} className={`w-full text-left px-2 py-1.5 text-[11px] font-bold rounded transition ${(isPrinting || courseActiveTab === "exercise") ? "text-teal-700 bg-teal-50" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}>Exercise Questions</button>
                      {data.studyPack?.custom_qna && data.studyPack.custom_qna.length > 0 && (
                        <button onClick={() => setCourseActiveTab("custom")} className={`w-full text-left px-2 py-1.5 text-[11px] font-bold rounded transition ${(isPrinting || courseActiveTab === "custom") ? "text-teal-700 bg-teal-50" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}>Custom Questions</button>
                      )}
                      {data.studyPack?.ncert_questions && data.studyPack.ncert_questions.length > 0 && (
                        <button onClick={() => setCourseActiveTab("ncert")} className={`w-full text-left px-2 py-1.5 text-[11px] font-bold rounded transition ${(isPrinting || courseActiveTab === "ncert") ? "text-teal-700 bg-teal-50" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}>NCERT / Textual</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10">
            <div className="max-w-4xl mx-auto space-y-10 pb-20">
              <div className="flex items-center gap-3 print:hidden">
                <button aria-label="Open chapter navigation" onClick={() => setCourseNavOpen(true)} className="p-2 text-gray-600 hover:text-teal-700 bg-white border border-gray-200 rounded-lg shadow-sm" title="Open chapter navigation"><Menu size={18} /></button>
                <span className="text-xs font-bold text-gray-500 truncate">{courseActiveChapter || "Course navigation"}</span>
              </div>
              {courseSiteData.filter(d => d.chapter === courseActiveChapter).map(data => (
                <div key={data.chapter}>
                  {/* Header */}
                  <div className="border-b border-gray-200 pb-6 mb-8">
                    <h1 className="text-3xl font-black text-gray-900">{data.chapter}</h1>
                    
                    <div className="flex gap-3 mt-3">
                      <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">Chapter</span>
                      <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">{schoolSubject}</span>
                      <button onClick={handlePrintChapter} className="ml-auto bg-gray-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide hover:bg-gray-700 transition flex items-center gap-1"><Printer size={12} /> Export to PDF</button>
                    </div>

                  </div>

                  {!data.studyPack && !data.examPrep && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200">
                      Failed to generate content for this chapter.
                    </div>
                  )}

                                    {/* YouTube References */}
                  {(isPrinting || courseActiveTab === "videos") && (
                    <section className="mb-10">
                      <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2"><MonitorPlay size={20} className="text-red-500" /> Top 5 YouTube References</h2>
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                        <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${data.chapter} ${schoolSubject || ''} class ${schoolClassLevel || ''} full chapter explained`)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition">
                          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600"><MonitorPlay size={20} /></div>
                          <div><h3 className="font-bold text-gray-800 text-sm">1. Full Chapter Explanation</h3><p className="text-xs text-gray-500">Comprehensive overview of {data.chapter}</p></div>
                        </a>
                        <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${data.chapter} ${schoolSubject || ''} class ${schoolClassLevel || ''} one shot revision`)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition">
                          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600"><MonitorPlay size={20} /></div>
                          <div><h3 className="font-bold text-gray-800 text-sm">2. One Shot Revision</h3><p className="text-xs text-gray-500">Quick recap and summary</p></div>
                        </a>
                        <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${data.chapter} ${schoolSubject || ''} class ${schoolClassLevel || ''} important questions`)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition">
                          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600"><MonitorPlay size={20} /></div>
                          <div><h3 className="font-bold text-gray-800 text-sm">3. Important Questions</h3><p className="text-xs text-gray-500">Board exam focused questions</p></div>
                        </a>
                        <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${data.chapter} ${schoolSubject || ''} class ${schoolClassLevel || ''} ncert solutions`)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition">
                          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600"><MonitorPlay size={20} /></div>
                          <div><h3 className="font-bold text-gray-800 text-sm">4. NCERT Solutions</h3><p className="text-xs text-gray-500">Step by step textbook solutions</p></div>
                        </a>
                        <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${data.chapter} ${schoolSubject || ''} class ${schoolClassLevel || ''} mcqs competency`)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition">
                          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600"><MonitorPlay size={20} /></div>
                          <div><h3 className="font-bold text-gray-800 text-sm">5. MCQs & Competency</h3><p className="text-xs text-gray-500">Objective and critical thinking questions</p></div>
                        </a>
                      </div>
                    </section>
                  )}

                  {/* Core Concepts */}
                  {(isPrinting || courseActiveTab === "core") && data.studyPack?.core_concepts && data.studyPack.core_concepts.length > 0 && (
                    <section className="mb-10">
                      <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2"><Sparkles size={20} className="text-teal-500" /> Core Concepts</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.studyPack.core_concepts.map((cc: any, i: number) => (
                          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
                            <h3 className="font-bold text-gray-800 text-sm">{cc.concept}</h3>
                            <p className="text-gray-600 text-sm mt-2 leading-relaxed">{cc.simple_explanation}</p>
                            {cc.why_it_matters && (
                              <div className="mt-3 bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm text-gray-700">
                                <span className="font-bold text-gray-800 block text-xs uppercase tracking-wide mb-1">Why it matters</span>
                                {cc.why_it_matters}
                              </div>
                            )}
                            <TranslateWidget textToTranslate={`${cc.concept}\n\n${cc.simple_explanation}\n\n${cc.why_it_matters || ""}`} />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Key Terms */}
                  {(isPrinting || courseActiveTab === "glossary") && data.studyPack?.key_terms && data.studyPack.key_terms.length > 0 && (
                    <section className="mb-10 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2"><BookOpen size={20} className="text-teal-500" /> Glossary / Key Terms</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        {data.studyPack.key_terms.map((kt: any, i: number) => (
                          <div key={i} className="flex gap-3 items-start border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                            <div className="min-w-3 max-w-3 h-3 rounded-full bg-teal-200 mt-1"></div>
                            <div>
                              <span className="font-bold text-sm text-gray-800 block">{kt.term}</span>
                              <span className="text-sm text-gray-600 leading-relaxed">{kt.meaning}</span>
                              <TranslateWidget textToTranslate={`${kt.term}: ${kt.meaning}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Exam Prep (Competitive Q&A) */}
                  {(isPrinting || courseActiveTab === "competitive") && data.examPrep && data.examPrep.length > 0 && (
                    <section className="mb-10">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><GraduationCap size={20} className="text-indigo-500" /> Competitive Exam Prep</h2>
                        <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">2026-2027 Pattern</span>
                      </div>
                      <div className="space-y-4">
                        {data.examPrep.map((qa: any, i: number) => (
                          <div key={i} className="bg-white border-l-4 border-l-indigo-400 border border-gray-200 rounded-xl p-5 shadow-sm">
                            <p className="font-bold text-gray-800"><span className="text-indigo-600 mr-2">Q{i + 1}.</span>{qa.question}</p>
                            
                            {qa.options && qa.options.length > 0 && (
                              <ul className="pl-6 space-y-1 mt-3">
                                {qa.options.map((opt: string, idx: number) => (
                                  <li key={idx} className="text-sm text-gray-600 flex gap-2"><span className="font-bold text-gray-400">{String.fromCharCode(65 + idx)}.</span> {opt}</li>
                                ))}
                              </ul>
                            )}
                            
                            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg mt-4">
                              <p className="text-sm font-bold text-indigo-800">Answer:</p>
                              <p className="text-sm text-indigo-900 mt-1">{qa.answer}</p>
                              {qa.explanation && (
                                <div className="mt-2 pt-2 border-t border-indigo-200/50">
                                  <p className="text-xs font-bold text-indigo-800">Explanation:</p>
                                  <p className="text-xs text-indigo-900 mt-1">{qa.explanation}</p>
                                </div>
                              )}
                            </div>
                            <TranslateWidget textToTranslate={`${qa.question}\n\n${(qa.options || []).join('\n')}\n\nAnswer: ${qa.answer}\n\nExplanation: ${qa.explanation || ""}`} />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Practice Questions */}
                  {(isPrinting || courseActiveTab === "practice") && data.studyPack?.practice_questions && data.studyPack.practice_questions.length > 0 && (
                    <section className="mb-10">
                      <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2"><PenTool size={20} className="text-teal-500" /> Standard Practice Questions</h2>
                      <div className="space-y-3">
                        {data.studyPack.practice_questions.map((q: any, i: number) => (
                          <details key={i} open={isPrinting} className="group border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
                            <summary className="font-medium text-sm text-gray-900 p-4 cursor-pointer hover:bg-gray-50 transition list-none flex gap-2">
                              <span className="text-teal-600 font-black">Q{i+1}.</span> {q.question}
                            </summary>
                            <div className="p-4 pt-0 text-sm text-gray-700 bg-gray-50 border-t border-gray-100 mt-2">
                              {q.hint && (
                                <div className="mb-2">
                                  <span className="font-bold text-amber-600 block text-[10px] uppercase tracking-wide mb-1">Hint</span>
                                  {q.hint}
                                </div>
                              )}
                              <span className="font-bold text-teal-800 block text-[10px] uppercase tracking-wide mb-1">Suggested Answer</span>
                              {q.answer ? (
                                <div className="prose prose-sm max-w-none whitespace-pre-wrap">{q.answer}</div>
                              ) : (
                                <button 
                                  onClick={() => fetchInlineAnswer(data.chapter, courseActiveTab, q, i)}
                                  disabled={fetchingAnswerFor?.chapter === data.chapter && fetchingAnswerFor?.type === courseActiveTab && fetchingAnswerFor?.index === i}
                                  className="mt-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-2"
                                >
                                  {fetchingAnswerFor?.chapter === data.chapter && fetchingAnswerFor?.type === courseActiveTab && fetchingAnswerFor?.index === i ? "Generating Answer..." : "Get Answer with AI"}
                                </button>
                              )}
                              <TranslateWidget textToTranslate={`${q.question}\n\nHint: ${q.hint || ""}\n\nAnswer: ${q.answer || ""}`} />
                            </div>
                          </details>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Competency Questions (from studyPack) */}
                  {(isPrinting || courseActiveTab === "competency") && data.studyPack?.competency_questions && data.studyPack.competency_questions.length > 0 && (
                    <section className="mb-10">
                      <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2"><GraduationCap size={20} className="text-indigo-500" /> Competency Questions</h2>
                      <div className="space-y-3">
                        {data.studyPack.competency_questions.map((q: any, i: number) => (
                          <details key={i} open={isPrinting} className="group border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
                            <summary className="font-medium text-sm text-gray-900 p-4 cursor-pointer hover:bg-gray-50 transition list-none flex gap-2">
                              <span className="text-indigo-600 font-black">Q{i+1}.</span> {q.question}
                            </summary>
                            <div className="p-4 pt-0 text-sm text-gray-700 bg-gray-50 border-t border-gray-100 mt-2">
                              <span className="font-bold text-indigo-800 block text-[10px] uppercase tracking-wide mb-1">Competency: {q.competency_tested || "General"}</span>
                              <span className="font-bold text-indigo-800 block text-[10px] uppercase tracking-wide mb-1 mt-2">Suggested Answer</span>
                              {q.answer ? (
                                <div className="prose prose-sm max-w-none whitespace-pre-wrap">{q.answer}</div>
                              ) : (
                                <button 
                                  onClick={() => fetchInlineAnswer(data.chapter, courseActiveTab, q, i)}
                                  disabled={fetchingAnswerFor?.chapter === data.chapter && fetchingAnswerFor?.type === courseActiveTab && fetchingAnswerFor?.index === i}
                                  className="mt-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-2"
                                >
                                  {fetchingAnswerFor?.chapter === data.chapter && fetchingAnswerFor?.type === courseActiveTab && fetchingAnswerFor?.index === i ? "Generating Answer..." : "Get Answer with AI"}
                                </button>
                              )}
                              <TranslateWidget textToTranslate={`${q.question}\n\nAnswer: ${q.answer || ""}`} />
                            </div>
                          </details>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Exercise Questions (from studyPack) */}
                  {(isPrinting || courseActiveTab === "exercise") && data.studyPack?.exercise_questions && data.studyPack.exercise_questions.length > 0 && (
                    <section className="mb-10">
                      <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2"><BookOpen size={20} className="text-blue-500" /> Textbook Exercise Questions</h2>
                      <div className="space-y-3">
                        {data.studyPack.exercise_questions.map((q: any, i: number) => (
                          <details key={i} open={isPrinting} className="group border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
                            <summary className="font-medium text-sm text-gray-900 p-4 cursor-pointer hover:bg-gray-50 transition list-none flex gap-2">
                              <span className="text-blue-600 font-black">Q{i+1}.</span> {q.question}
                            </summary>
                            <div className="p-4 pt-0 text-sm text-gray-700 bg-gray-50 border-t border-gray-100 mt-2">
                              <span className="font-bold text-blue-800 block text-[10px] uppercase tracking-wide mb-1">Answer</span>
                              {q.answer ? (
                                <div className="prose prose-sm max-w-none whitespace-pre-wrap">{q.answer}</div>
                              ) : (
                                <button 
                                  onClick={() => fetchInlineAnswer(data.chapter, courseActiveTab, q, i)}
                                  disabled={fetchingAnswerFor?.chapter === data.chapter && fetchingAnswerFor?.type === courseActiveTab && fetchingAnswerFor?.index === i}
                                  className="mt-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-2"
                                >
                                  {fetchingAnswerFor?.chapter === data.chapter && fetchingAnswerFor?.type === courseActiveTab && fetchingAnswerFor?.index === i ? "Generating Answer..." : "Get Answer with AI"}
                                </button>
                              )}
                              <TranslateWidget textToTranslate={`${q.question}\n\nAnswer: ${q.answer || ""}`} />
                            </div>
                          </details>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Custom Questions */}
                  {(isPrinting || courseActiveTab === "custom") && data.studyPack?.custom_qna && data.studyPack.custom_qna.length > 0 && (
                    <section className="mb-10">
                      <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2"><MessageSquare size={20} className="text-teal-500" /> Custom Questions Answered</h2>
                      <div className="space-y-3">
                        {data.studyPack.custom_qna.map((q: any, i: number) => (
                          <details key={i} className="group border border-teal-100 bg-white rounded-lg p-4 cursor-pointer hover:border-teal-300 transition-colors">
                            <summary className="font-semibold text-gray-800 list-none flex items-start gap-3">
                              <span className="bg-teal-50 text-teal-600 font-bold px-2 py-0.5 rounded text-xs mt-0.5 flex-shrink-0">Q{i + 1}</span>
                              <span className="flex-1">{q.question}</span>
                            </summary>
                            <div className="mt-4 pt-4 border-t border-teal-50 text-gray-700 text-sm pl-11 whitespace-pre-wrap">
                              <span className="font-bold text-teal-800 block text-[10px] uppercase tracking-wide mb-1">Answer</span>
                              {q.answer ? (
                                <div className="prose prose-sm max-w-none whitespace-pre-wrap">{q.answer}</div>
                              ) : (
                                <button 
                                  onClick={() => fetchInlineAnswer(data.chapter, courseActiveTab, q, i)}
                                  disabled={fetchingAnswerFor?.chapter === data.chapter && fetchingAnswerFor?.type === courseActiveTab && fetchingAnswerFor?.index === i}
                                  className="mt-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-2"
                                >
                                  {fetchingAnswerFor?.chapter === data.chapter && fetchingAnswerFor?.type === courseActiveTab && fetchingAnswerFor?.index === i ? "Generating Answer..." : "Get Answer with AI"}
                                </button>
                              )}
                              <TranslateWidget textToTranslate={`${q.question}\n\nAnswer: ${q.answer || ""}`} />
                            </div>
                          </details>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* NCERT Questions */}
                  {(isPrinting || courseActiveTab === "ncert") && data.studyPack?.ncert_questions && data.studyPack.ncert_questions.length > 0 && (
                    <section className="mb-10">
                      <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2"><BookOpen size={20} className="text-teal-500" /> NCERT Questions & Answers</h2>
                      <div className="space-y-3">
                        {data.studyPack.ncert_questions.map((q: any, i: number) => (
                          <details key={i} open={isPrinting} className="group border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
                            <summary className="font-medium text-sm text-gray-900 p-4 cursor-pointer hover:bg-gray-50 transition list-none flex gap-2">
                              <span className="text-teal-600 font-black">NCERT Q{i+1}.</span> {q.question}
                            </summary>
                            <div className="p-4 pt-0 text-sm text-gray-700 bg-gray-50 border-t border-gray-100 mt-2">
                              <span className="font-bold text-teal-800 block text-[10px] uppercase tracking-wide mb-1">Answer</span>
                              {q.answer ? (
                                <div className="prose prose-sm max-w-none whitespace-pre-wrap">{q.answer}</div>
                              ) : (
                                <button 
                                  onClick={() => fetchInlineAnswer(data.chapter, courseActiveTab, q, i)}
                                  disabled={fetchingAnswerFor?.chapter === data.chapter && fetchingAnswerFor?.type === courseActiveTab && fetchingAnswerFor?.index === i}
                                  className="mt-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-2"
                                >
                                  {fetchingAnswerFor?.chapter === data.chapter && fetchingAnswerFor?.type === courseActiveTab && fetchingAnswerFor?.index === i ? "Generating Answer..." : "Get Answer with AI"}
                                </button>
                              )}
                              <TranslateWidget textToTranslate={`${q.question}\n\nAnswer: ${q.answer || ""}`} />
                            </div>
                          </details>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Study Plan */}
                  {(isPrinting || courseActiveTab === "plan") && data.studyPack?.study_plan && data.studyPack.study_plan.length > 0 && (
                    <section className="mb-10 bg-teal-50/50 border border-teal-100 p-6 rounded-2xl">
                      <h2 className="text-xl font-black text-teal-900 mb-4 flex items-center gap-2"><Calendar size={20} className="text-teal-600" /> Suggested Study Plan</h2>
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-teal-200 before:to-transparent">
                        {data.studyPack.study_plan.map((step: any, i: number) => (
                          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-teal-500 text-white font-bold text-xs shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                              {i + 1}
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-teal-100 shadow-sm">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-bold text-teal-900 text-sm">{step.focus}</h4>
                                <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{step.time_minutes} min</span>
                              </div>
                              <p className="text-xs text-gray-600">{step.activity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Common Mistakes */}
                  {(isPrinting || courseActiveTab === "mistakes") && data.studyPack?.common_mistakes && data.studyPack.common_mistakes.length > 0 && (
                    <section className="mb-10 bg-amber-50 border border-amber-200 rounded-2xl p-6">
                      <h2 className="text-xl font-black text-amber-900 mb-4 flex items-center gap-2"><AlertTriangle size={20} className="text-amber-500" /> Common Mistakes to Avoid</h2>
                      <ul className="space-y-2">
                        {data.studyPack.common_mistakes.map((m: string, i: number) => (
                          <li key={i} className="text-sm text-amber-900 flex gap-3"><span className="text-amber-400 font-bold">•</span>{m}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                  
                  {/* Quick Reference */}
                  {(isPrinting || courseActiveTab === "formulas") && data.studyPack?.quick_reference && data.studyPack.quick_reference.length > 0 && (
                    <section className="mb-10">
                      <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2"><BookOpen size={20} className="text-teal-500" /> Quick Reference / Formulas</h2>
                      <div className="bg-gray-900 text-gray-100 p-5 rounded-2xl shadow-inner overflow-x-auto">
                        <ul className="space-y-2">
                          {data.studyPack.quick_reference.map((ref: string, i: number) => (
                            <li key={i} className="text-sm font-mono flex gap-3"><span className="text-teal-400 font-bold">{i+1}.</span>{ref}</li>
                          ))}
                        </ul>
                      </div>
                    </section>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================== SETTINGS ====================== */}
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

      {view === "questionBank" && canAccessQuestionBank && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <BookOpen className="text-teal-600" /> Question Bank
              </h1>
              <p className="text-sm text-gray-500 mt-1">Upload and access previous year question papers.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload form */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Upload Question Paper</h3>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Year</label>
                <select value={qbUploadYear} onChange={e => setQbUploadYear(e.target.value)} className="w-full text-sm border-gray-200 rounded-lg">
                  {["2023", "2024", "2025", "2026", "2027"].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Subject</label>
                <input value={qbUploadSubject} onChange={e => setQbUploadSubject(e.target.value)} placeholder="e.g. Mathematics" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Class</label>
                <input value={qbUploadClass} onChange={e => setQbUploadClass(e.target.value)} placeholder="e.g. Class 12" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">File (PDF/Image)</label>
                <input type="file" accept=".pdf,image/*" onChange={e => setQbUploadFile(e.target.files?.[0] || null)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5" />
              </div>

              <button 
                onClick={() => {
                  if (!qbUploadSubject || !qbUploadClass || !qbUploadFile) return;
                  const newDoc = {
                    id: Math.random().toString(36).substring(7),
                    uploader: user?.email || "Unknown",
                    year: qbUploadYear,
                    subject: qbUploadSubject,
                    className: qbUploadClass,
                    fileName: qbUploadFile.name,
                    isPublic: true
                  };
                  const newList = [...qbList, newDoc];
                  setQbList(newList);
                  localStorage.setItem("examhub_question_bank", JSON.stringify(newList));
                  setQbUploadSubject(""); setQbUploadClass(""); setQbUploadFile(null);
                }}
                disabled={!qbUploadSubject || !qbUploadClass || !qbUploadFile}
                className="mt-2 w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm py-2 rounded-xl transition"
              >
                Upload to Bank
              </button>
            </div>

            {/* List */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <select value={qbFilterYear} onChange={e => setQbFilterYear(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none">
                  <option value="">All Years</option>
                  {["2023", "2024", "2025", "2026", "2027"].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <input value={qbFilterSubject} onChange={e => setQbFilterSubject(e.target.value)} placeholder="Filter Subject..." className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 flex-1 focus:outline-none" />
              </div>
              
              <div className="space-y-3">
                {qbList
                  .filter(doc => !qbFilterYear || doc.year === qbFilterYear)
                  .filter(doc => !qbFilterSubject || doc.subject.toLowerCase().includes(qbFilterSubject.toLowerCase()))
                  .map(doc => {
                    const isMyUpload = doc.uploader === user?.email;
                    const isPaid = isSuperadmin || (user?.email && adminPaidUsers.includes(user?.email.toLowerCase()));
                    const canAccess = isMyUpload || isPaid;
                    
                    return (
                      <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white transition gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{doc.year}</span>
                            <h4 className="font-bold text-gray-800 text-sm">{doc.subject} - {doc.className}</h4>
                          </div>
                          <p className="text-xs text-gray-500">File: {doc.fileName} • Uploaded by {isMyUpload ? "You" : doc.uploader}</p>
                        </div>
                        
                        {canAccess ? (
                          <button className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:border-teal-400 hover:text-teal-700 text-gray-600 text-xs font-bold px-4 py-2 rounded-lg transition shrink-0">
                            <Download size={14} /> Download
                          </button>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 shrink-0">
                            <Lock size={12} /> Paid Access Only
                          </span>
                        )}
                      </div>
                    );
                  })
                }
                {qbList.length === 0 && <p className="text-center text-sm text-gray-400 py-8">No question papers uploaded yet.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {view === "superadmin" && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <ShieldCheck className="text-teal-600" /> Super Admin Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">Manage paid users and chapter access rules.</p>
            </div>
          </div>
          
          <div className="grid gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">Global Features</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-gray-800">Enable Question Bank</div>
                    <div className="text-xs text-gray-500">Allow users to access the Question Bank portal.</div>
                  </div>
                  <button 
                    onClick={() => {
                      const nu = { ...globalConfig, enableQuestionBank: !globalConfig.enableQuestionBank };
                      setGlobalConfig(nu);
                      fetch("/api/examhub360/config", { method: "POST", body: JSON.stringify(nu) });
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${globalConfig.enableQuestionBank ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {globalConfig.enableQuestionBank ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-gray-800">Global Tier (Paid/Free)</div>
                    <div className="text-xs text-gray-500">When set to paid, limits free registrations.</div>
                  </div>
                  <button 
                    onClick={() => {
                      const nu = { ...globalConfig, tier: globalConfig.tier === "paid" ? "free" : "paid" };
                      setGlobalConfig(nu);
                      fetch("/api/examhub360/config", { method: "POST", body: JSON.stringify(nu) });
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${globalConfig.tier === "paid" ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}
                  >
                    {globalConfig.tier === "paid" ? 'Paid Tier Active' : 'Free Tier Active'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-gray-800">Enable Demo Mode</div>
                    <div className="text-xs text-gray-500">Allow users to login as a demo operator.</div>
                  </div>
                  <button 
                    onClick={() => {
                      const nu = { ...globalConfig, enableDemoMode: !globalConfig.enableDemoMode };
                      setGlobalConfig(nu);
                      fetch("/api/examhub360/config", { method: "POST", body: JSON.stringify(nu) });
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${globalConfig.enableDemoMode ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {globalConfig.enableDemoMode ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">User Access Tracking</h3>
              <div className="flex gap-2 mb-4">
                <input value={adminNewPaidUser} onChange={e => setAdminNewPaidUser(e.target.value)} placeholder="user@email.com" className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-400" />
                <button 
                  onClick={() => {
                    if (!adminNewPaidUser) return;
                    const val = adminNewPaidUser.toLowerCase().trim();
                    if (!adminPaidUsers.includes(val)) {
                      const nu = [...adminPaidUsers, val];
                      setAdminPaidUsers(nu);
                      localStorage.setItem("examhub_paid_users", JSON.stringify(nu));
                    }
                    if (!allRegisteredUsers.includes(val)) {
                      const nuAll = [...allRegisteredUsers, val];
                      setAllRegisteredUsers(nuAll);
                      localStorage.setItem("d360_all_registered_users", JSON.stringify(nuAll));
                    }
                    setAdminNewPaidUser("");
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition"
                >
                  Add User
                </button>
              </div>
              <ul className="space-y-2">
                {Array.from(new Set([...allRegisteredUsers, ...adminPaidUsers, ...adminQbUsers])).map(email => {
                  const isPaid = adminPaidUsers.includes(email);
                  const hasQb = adminQbUsers.includes(email);
                  return (
                    <li key={email} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100 flex-wrap gap-2">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900 font-bold">{email}</span>
                        <div className="flex gap-2 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${isPaid ? 'bg-teal-100 text-teal-800' : 'bg-gray-200 text-gray-500'}`}>{isPaid ? 'Premium Tier' : 'Free Tier'}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${hasQb ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 text-gray-500'}`}>{hasQb ? 'QB Access' : 'No QB Access'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            let nu = [...adminPaidUsers];
                            if (isPaid) nu = nu.filter(e => e !== email);
                            else nu.push(email);
                            setAdminPaidUsers(nu);
                            localStorage.setItem("examhub_paid_users", JSON.stringify(nu));
                          }}
                          className={`text-xs font-bold px-3 py-1.5 border rounded shadow-sm ${isPaid ? 'text-red-600 border-red-200 bg-white hover:bg-red-50' : 'text-teal-700 border-teal-200 bg-white hover:bg-teal-50'}`}
                        >
                          {isPaid ? 'Revoke Paid' : 'Make Paid'}
                        </button>
                        <button 
                          onClick={() => {
                            let nu = [...adminQbUsers];
                            if (hasQb) nu = nu.filter(e => e !== email);
                            else nu.push(email);
                            setAdminQbUsers(nu);
                            localStorage.setItem("examhub_qb_users", JSON.stringify(nu));
                          }}
                          className={`text-xs font-bold px-3 py-1.5 border rounded shadow-sm ${hasQb ? 'text-red-600 border-red-200 bg-white hover:bg-red-50' : 'text-indigo-700 border-indigo-200 bg-white hover:bg-indigo-50'}`}
                        >
                          {hasQb ? 'Revoke QB' : 'Enable QB'}
                        </button>
                      </div>
                    </li>
                  );
                })}
                {allRegisteredUsers.length === 0 && adminPaidUsers.length === 0 && adminQbUsers.length === 0 && <li className="text-xs text-gray-400 py-2">No users found.</li>}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">Chapter Access Configuration</h3>
              <p className="text-xs text-gray-500 mb-4">Define which chapters require paid status. By default, chapters are considered Demo (free) unless explicitly marked here as Paid.</p>
              
              <div className="flex gap-2 mb-4">
                <input value={adminNewChapter} onChange={e => setAdminNewChapter(e.target.value)} placeholder="Exact Chapter Name (e.g. Current Electricity)" className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-400" />
                <button 
                  onClick={() => {
                    if (!adminNewChapter) return;
                    const nc = { ...adminChapterConfig, [adminNewChapter.trim()]: "paid" as const };
                    setAdminChapterConfig(nc);
                    localStorage.setItem("examhub_chapter_config", JSON.stringify(nc));
                    setAdminNewChapter("");
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition"
                >
                  Lock Chapter (Paid Only)
                </button>
              </div>

              <ul className="space-y-2">
                {Object.entries(adminChapterConfig).map(([chap, type]) => (
                  <li key={chap} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2">
                      <Lock size={14} className="text-amber-500" />
                      <span className="text-sm font-bold text-gray-800">{chap}</span>
                    </div>
                    <button 
                      onClick={() => {
                        const nc = { ...adminChapterConfig };
                        delete nc[chap];
                        setAdminChapterConfig(nc);
                        localStorage.setItem("examhub_chapter_config", JSON.stringify(nc));
                      }}
                      className="text-gray-500 hover:text-gray-700 text-xs font-bold bg-white border border-gray-200 px-3 py-1 rounded"
                    >
                      Make Demo (Free)
                    </button>
                  </li>
                ))}
                {Object.keys(adminChapterConfig).length === 0 && <li className="text-xs text-gray-400 py-2">No chapters locked yet.</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
      {view === "translator" && (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><Languages size={18} className="text-teal-600" /> Free Content Translator</h2>
            <p className="text-sm text-gray-500">Paste your content here to instantly translate it into regional languages.</p>
          </div>
          <StandaloneTranslator />
        </div>
      )}

    </div>
  );
}
