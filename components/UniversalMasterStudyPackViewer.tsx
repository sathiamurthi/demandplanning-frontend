"use client";

import { useState, useEffect } from "react";
import {
  Brain, FileText, CheckCircle2, AlertTriangle, BookOpen, GraduationCap,
  Sparkles, Download, Copy, Printer, Check, X, HelpCircle, Layers,
  ChevronDown, ChevronUp, Award, Zap, Clock, FileCheck, ShieldAlert
} from "lucide-react";
import type { StudyPack, MCQItem, PYQItem, ExamPredictionItem, TextbookSolutionItem, FormulaItem, MisconceptionItem } from "@/app/examhub360/lib/types";

interface Props {
  studyPack: StudyPack;
  isCollege?: boolean;
  onClose?: () => void;
  externalTab?: string;
}

const mapExternalTabToMasterTab = (ext?: string): string => {
  if (!ext || ext === "all" || ext === "plan") return "all";
  if (ext === "core" || ext === "glossary") return "sec1";
  if (ext === "formulas" || ext === "quick_reference") return "sec2";
  if (ext === "solutions" || ext === "exercise" || ext === "ncert" || ext === "custom") return "sec3";
  if (ext === "competitive" || ext === "pyq") return "sec4";
  if (ext === "predictions") return "sec5";
  if (ext === "practice" || ext === "mcq" || ext === "competency") return "sec6";
  if (ext === "mistakes" || ext === "pitfalls") return "sec7";
  if (ext === "test" || ext === "class_test") return "sec8";
  return "all";
};

export function UniversalMasterStudyPackViewer({ studyPack, isCollege = false, onClose, externalTab }: Props) {
  const [activeTab, setActiveTab] = useState<string>(() => mapExternalTabToMasterTab(externalTab));
  const [copied, setCopied] = useState(false);
  const [quizState, setQuizState] = useState<Record<number, { selected?: string; revealed?: boolean }>>({});
  const [showTestAnswers, setShowTestAnswers] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (externalTab) {
      setActiveTab(mapExternalTabToMasterTab(externalTab));
    }
  }, [externalTab]);

  const title = studyPack.chapter_title || studyPack.unit_title || "Master Study Pack";
  const subject = studyPack.subject || "Subject";
  const gradeOrSem = studyPack.course_grade_semester || (isCollege ? "B.Tech / Higher Ed" : "Class 10 / 12 Board");
  const subjectCode = studyPack.subject_code || (isCollege ? "CS-402" : "SUB-101");
  const boardOrInst = studyPack.institution_or_board || (isCollege ? "University / Autonomous" : "CBSE / State Board");

  // Helper to toggle accordion
  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Convert StudyPack object to clean formatted Markdown matching Universal_Master_Study_Pack_Template_School360_College360.md
  const generateMarkdown = (): string => {
    let md = `# ${subject.toUpperCase()}: ${title.toUpperCase()}\n`;
    md += `## Master Study Pack & Exam Predictions (2026–2027)\n`;
    md += `**Course / Grade / Semester:** ${gradeOrSem}  \n`;
    md += `**Subject Code:** ${subjectCode} | **Institution / Board:** ${boardOrInst}\n\n`;
    md += `---\n\n`;

    // 1. Mind Map & Glossary
    md += `## 🧠 1. Executive Summary & Conceptual Mind Map\n\n`;
    if (studyPack.conceptual_mind_map) {
      md += `\`\`\`\n${studyPack.conceptual_mind_map}\n\`\`\`\n\n`;
    }
    if (studyPack.story_telling_explanation) {
      md += `> 📖 **Overview:** ${studyPack.story_telling_explanation}\n\n`;
    }
    if (studyPack.key_terms && studyPack.key_terms.length > 0) {
      md += `### 📖 Key Terms, Technical Vocabulary & Glossary\n\n`;
      md += `| Term / Symbol | Definition / Meaning | Mathematical / Technical Formula | Practical Context |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      studyPack.key_terms.forEach(kt => {
        md += `| **${kt.term}** | ${kt.meaning} | ${kt.formula || 'N/A'} | ${kt.practical_context || 'Curriculum concept'} |\n`;
      });
      md += `\n`;
    }

    // 2. Theorems & Formulae
    md += `## 📐 2. Core Theorems, Formulae & Key Rules\n\n`;
    if (studyPack.formula_sheet && studyPack.formula_sheet.length > 0) {
      studyPack.formula_sheet.forEach(f => {
        md += `### 🔹 ${f.formula_name}\n`;
        md += `- **Primary Equation:**\n  $$\\text{${f.equation}}$$\n`;
        md += `- **Parameters:** ${f.parameters_breakdown}\n`;
        if (f.key_rules && f.key_rules.length > 0) {
          f.key_rules.forEach(r => md += `- **Rule:** ${r}\n`);
        }
        md += `\n`;
      });
    } else if (studyPack.quick_reference && studyPack.quick_reference.length > 0) {
      studyPack.quick_reference.forEach(ref => md += `- ${ref}\n`);
      md += `\n`;
    }

    // 3. Textbook Solutions
    md += `## 📚 3. Official Curriculum / Textbook Core Exercise Solutions\n\n`;
    if (studyPack.textbook_solutions && studyPack.textbook_solutions.length > 0) {
      studyPack.textbook_solutions.forEach((ts, i) => {
        md += `### Problem ${i + 1} [${ts.problem_title || 'Core Concept'}]\n`;
        md += `**Question:** ${ts.question}\n`;
        md += `- **Step 1 (Given Data & Principle):** ${ts.step1_given_data}\n`;
        md += `- **Step 2 (Execution / Derivation):** ${ts.step2_execution}\n`;
        md += `- **Step 3 (Final Answer & Unit):** ${ts.step3_final_answer}\n\n`;
      });
    } else if (studyPack.exercise_questions && studyPack.exercise_questions.length > 0) {
      studyPack.exercise_questions.forEach((q, i) => {
        md += `### Problem ${i + 1}\n**Question:** ${q.question}\n**Answer:** ${q.answer}\n\n`;
      });
    }

    // 4. Past 10-Yr PYQs
    md += `## 🏆 4. Top Past 10 Years Examination Questions (PYQs)\n\n`;
    if (studyPack.pyqs && studyPack.pyqs.length > 0) {
      studyPack.pyqs.forEach((pyq, i) => {
        md += `### Q${i + 1} [${pyq.difficulty || 'Medium'} - ${pyq.marks || 5} Marks] [Exam Year: ${pyq.exam_year || '2022, 2024'}]\n`;
        md += `**Question:** ${pyq.question}\n\n`;
        if (pyq.marking_scheme) {
          md += `**Detailed Solution & Marking Scheme:**\n`;
          if (pyq.marking_scheme.introduction_points) {
            md += `1. **Introduction / Definition (1 Mark):** ${pyq.marking_scheme.introduction_points.join("; ")}\n`;
          }
          if (pyq.marking_scheme.derivation_points) {
            md += `2. **Core Derivation / Explanation (3 Marks):** ${pyq.marking_scheme.derivation_points.join("; ")}\n`;
          }
          if (pyq.marking_scheme.conclusion_diagram_result) {
            md += `3. **Conclusion / Result (1 Mark):** ${pyq.marking_scheme.conclusion_diagram_result}\n`;
          }
          md += `\n`;
        } else if (pyq.solution) {
          md += `**Solution:** ${pyq.solution}\n\n`;
        }
      });
    }

    // 5. Exam Predictions
    md += `## 🔮 5. High-Probability Exam Predictions (2026–2027)\n\n`;
    if (studyPack.exam_predictions && studyPack.exam_predictions.length > 0) {
      studyPack.exam_predictions.forEach((ep, i) => {
        md += `### Q${i + 1} [${ep.question_type || 'Exam Prediction'} - ${ep.marks || 5} Marks]\n`;
        md += `**Question:** ${ep.question}\n`;
        if (ep.solution_steps) {
          ep.solution_steps.forEach(st => md += `- **Step:** ${st}\n`);
        }
        md += `\n`;
      });
    }

    // 6. MCQs
    md += `## ⚡ 6. Multiple Choice Questions (MCQs) & Quiz Bank\n\n`;
    if (studyPack.mcq_quiz_bank && studyPack.mcq_quiz_bank.length > 0) {
      studyPack.mcq_quiz_bank.forEach((mcq, i) => {
        if (mcq.is_assertion_reason) {
          md += `${i + 1}. **Assertion (A):** ${mcq.assertion || mcq.question}  \n`;
          md += `   **Reason (R):** ${mcq.reason || ''}  \n`;
        } else {
          md += `${i + 1}. **${mcq.question}**  \n`;
        }
        mcq.options.forEach(opt => md += `   - (${opt.label}) ${opt.text}\n`);
        md += `   - **Correct Answer:** **(${mcq.correct_option})**\n`;
        md += `   - **Explanation:** ${mcq.explanation}\n\n`;
      });
    }

    // 7. Misconceptions
    md += `## ⚠️ 7. Common Student Misconceptions & Exam Pitfalls\n\n`;
    if (studyPack.misconception_pitfalls && studyPack.misconception_pitfalls.length > 0) {
      studyPack.misconception_pitfalls.forEach((m, i) => {
        md += `> [!WARNING] Misconception ${i + 1}\n`;
        md += `> **Error:** ${m.misconception}  \n`;
        md += `> **Correction:** ${m.correction}\n\n`;
      });
    } else if (studyPack.common_mistakes && studyPack.common_mistakes.length > 0) {
      studyPack.common_mistakes.forEach((m, i) => md += `- ⚠️ **Mistake ${i + 1}:** ${m}\n`);
      md += `\n`;
    }

    // 8. Class Test
    md += `## 📝 8. Class Test / Self-Assessment Exam Paper\n\n`;
    if (studyPack.class_test_paper) {
      const tp = studyPack.class_test_paper;
      md += `**Max Marks:** ${tp.max_marks || 25} | **Time:** ${tp.time_minutes || 45} Minutes | **Target:** Self-Assessment Quiz\n\n`;
      if (tp.section_a_objective) {
        md += `### Section A: Objective & Short Concept Questions (6 Marks)\n`;
        tp.section_a_objective.forEach(q => md += `${q.q_no}. ${q.question} (${q.marks}M)\n`);
        md += `\n`;
      }
      if (tp.section_b_analytical) {
        md += `### Section B: Analytical & Problem Solving (9 Marks)\n`;
        tp.section_b_analytical.forEach(q => md += `${q.q_no}. ${q.question} (${q.marks}M)\n`);
        md += `\n`;
      }
      if (tp.section_c_comprehensive) {
        md += `### Section C: Comprehensive Essay / Case Study (10 Marks)\n`;
        tp.section_c_comprehensive.forEach(q => md += `${q.q_no}. ${q.question} (${q.marks}M)\n`);
        md += `\n`;
      }
      if (tp.answer_key_and_marking_scheme) {
        md += `### 🔑 Answer Key & Marking Scheme\n${tp.answer_key_and_marking_scheme}\n\n`;
      }
    }

    return md;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([generateMarkdown()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `StudyPack_${title.replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(studyPack, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `StudyPack_${title.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl border border-teal-500/20 shadow-2xl overflow-hidden max-w-6xl mx-auto my-6">
      {/* ── Top Header Bar ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 p-6 md:p-8 border-b border-teal-500/20 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-300 font-semibold text-xs rounded-full flex items-center gap-1.5">
                <Sparkles size={13} /> Universal Master Study Pack (2026–2027)
              </span>
              <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs rounded-full">
                {gradeOrSem}
              </span>
              <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-full">
                Code: {subjectCode}
              </span>
              <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-full">
                {boardOrInst}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <BookOpen className="text-teal-400 shrink-0" size={32} />
              <span>{subject}: <span className="text-teal-300">{title}</span></span>
            </h1>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleCopyMarkdown}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold rounded-xl border border-teal-500/30 transition flex items-center gap-1.5"
              title="Copy formatted Markdown matching Master Template"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? "Copied MD!" : "Copy MD"}
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-500/30 transition flex items-center gap-1.5"
              title="Download Markdown file"
            >
              <Download size={14} /> MD File
            </button>

            <button
              onClick={handleDownloadJSON}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
              title="Download JSON"
            >
              <FileText size={14} /> JSON
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:opacity-90 text-white text-xs font-bold rounded-xl transition shadow-lg flex items-center gap-1.5"
            >
              <Printer size={14} /> Print / PDF
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition ml-2"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Section Tabs Navigation */}
        <div className="flex items-center gap-1.5 mt-6 overflow-x-auto pb-2 scrollbar-none border-t border-slate-800 pt-4">
          {[
            { id: "all", label: "📖 Complete Master Pack", count: null },
            { id: "sec1", label: "🧠 1. Mind Map & Glossary", count: studyPack.key_terms?.length },
            { id: "sec2", label: "📐 2. Formula Sheet", count: studyPack.formula_sheet?.length || studyPack.quick_reference?.length },
            { id: "sec3", label: "📚 3. Textbook Solutions", count: studyPack.textbook_solutions?.length || studyPack.exercise_questions?.length },
            { id: "sec4", label: "🏆 4. Top 10-Yr PYQs", count: studyPack.pyqs?.length },
            { id: "sec5", label: "🔮 5. Predictions (2026-27)", count: studyPack.exam_predictions?.length },
            { id: "sec6", label: "⚡ 6. MCQs & Quiz Bank", count: studyPack.mcq_quiz_bank?.length || studyPack.practice_questions?.length },
            { id: "sec7", label: "⚠️ 7. Misconceptions", count: studyPack.misconception_pitfalls?.length || studyPack.common_mistakes?.length },
            { id: "sec8", label: "📝 8. Class Test Paper", count: null },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20"
                  : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50"
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                  activeTab === tab.id ? "bg-slate-900 text-teal-300" : "bg-slate-700 text-slate-300"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <div className="p-6 md:p-8 space-y-10">

        {/* ── SECTION 1: Mind Map & Glossary ──────────────────────────────── */}
        {(activeTab === "all" || activeTab === "sec1") && (
          <section className="space-y-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
                <Brain size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  1. Executive Summary & Conceptual Mind Map
                </h2>
                <p className="text-xs text-slate-400">Core subject breakdown, visual relationship map & key terminology</p>
              </div>
            </div>

            {/* Mind Map Box */}
            {studyPack.conceptual_mind_map && (
              <div className="bg-slate-950 p-5 rounded-2xl border border-teal-500/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-teal-400 uppercase tracking-wider font-bold">Conceptual Hierarchy & Diagram</span>
                  <span className="text-[10px] text-slate-500 font-mono">ASCII / MindMap</span>
                </div>
                <pre className="font-mono text-xs text-teal-300 bg-slate-900/90 p-4 rounded-xl overflow-x-auto leading-relaxed border border-slate-800">
                  {studyPack.conceptual_mind_map}
                </pre>
              </div>
            )}

            {/* Story / Overview */}
            {studyPack.story_telling_explanation && (
              <div className="bg-gradient-to-r from-teal-950/40 to-slate-900 p-5 rounded-2xl border border-teal-500/20">
                <h3 className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <BookOpen size={14} /> Concept Story & Context
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed italic">
                  "{studyPack.story_telling_explanation}"
                </p>
              </div>
            )}

            {/* Core Concepts */}
            {studyPack.core_concepts && studyPack.core_concepts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studyPack.core_concepts.map((c, i) => (
                  <div key={i} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-2">
                    <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
                      <span className="w-5 h-5 bg-teal-500/20 text-teal-300 rounded-full text-xs flex items-center justify-center font-mono">
                        {i + 1}
                      </span>
                      {c.concept}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{c.simple_explanation}</p>
                    <div className="text-[11px] text-teal-400/90 font-medium bg-teal-950/40 p-2 rounded-lg border border-teal-900/50">
                      💡 <strong>Why it matters:</strong> {c.why_it_matters}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Glossary Table */}
            {studyPack.key_terms && studyPack.key_terms.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers size={16} className="text-teal-400" /> Key Terms & Glossary
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800 text-slate-200 font-semibold border-b border-slate-700">
                      <tr>
                        <th className="p-3">Term / Symbol</th>
                        <th className="p-3">Definition / Meaning</th>
                        <th className="p-3">Formula / Equation</th>
                        <th className="p-3">Practical Context</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                      {studyPack.key_terms.map((kt, i) => (
                        <tr key={i} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-bold text-teal-300 whitespace-nowrap">{kt.term}</td>
                          <td className="p-3">{kt.meaning}</td>
                          <td className="p-3 font-mono text-amber-300">{kt.formula || '—'}</td>
                          <td className="p-3 text-slate-400">{kt.practical_context || 'Standard curriculum'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── SECTION 2: Core Theorems & Formulae ──────────────────────────── */}
        {(activeTab === "all" || activeTab === "sec2") && (
          <section className="space-y-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Sparkles size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  2. Core Theorems, Formulae & Key Rules
                </h2>
                <p className="text-xs text-slate-400">Formula bank, governing equations, parameter breakdown & laws</p>
              </div>
            </div>

            {studyPack.formula_sheet && studyPack.formula_sheet.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studyPack.formula_sheet.map((f, i) => (
                  <div key={i} className="bg-slate-950 p-5 rounded-2xl border border-indigo-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-indigo-300">{f.formula_name}</h3>
                      <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">Equation #{i+1}</span>
                    </div>

                    <div className="bg-slate-900 p-3.5 rounded-xl border border-indigo-900/50 text-center font-mono text-base font-bold text-amber-300 shadow-inner">
                      {f.equation}
                    </div>

                    <div className="text-xs text-slate-300 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div className="font-semibold text-slate-400 text-[11px]">Parameters & Variables:</div>
                      <div>{f.parameters_breakdown}</div>
                    </div>

                    {f.key_rules && f.key_rules.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-teal-400">Key Rules & Properties:</div>
                        <ul className="text-xs text-slate-300 space-y-1 pl-4 list-disc">
                          {f.key_rules.map((r, ri) => <li key={ri}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              studyPack.quick_reference && (
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Formula Quick Reference List</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {studyPack.quick_reference.map((ref, i) => (
                      <div key={i} className="p-3 bg-slate-900 rounded-xl font-mono text-xs text-amber-300 border border-slate-800 flex items-center gap-2">
                        <span className="text-indigo-400 font-bold">{i+1}.</span> {ref}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </section>
        )}

        {/* ── SECTION 3: Textbook Core Exercise Solutions ─────────────────── */}
        {(activeTab === "all" || activeTab === "sec3") && (
          <section className="space-y-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <BookOpen size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  3. Official Curriculum / Textbook Core Exercise Solutions
                </h2>
                <p className="text-xs text-slate-400">Step-by-step problem working (Given Data → Execution → Final Answer)</p>
              </div>
            </div>

            {studyPack.textbook_solutions && studyPack.textbook_solutions.length > 0 ? (
              <div className="space-y-4">
                {studyPack.textbook_solutions.map((ts, i) => (
                  <div key={i} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="font-bold text-sm text-blue-400">
                        Problem #{i + 1} {ts.problem_title ? `— ${ts.problem_title}` : ''}
                      </span>
                      <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                        Textbook Standard Solution
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-white bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                      ❓ <strong>Question:</strong> {ts.question}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                        <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Step 1: Given Data & Principle</div>
                        <div className="text-xs text-slate-300 leading-relaxed">{ts.step1_given_data}</div>
                      </div>
                      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                        <div className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">Step 2: Execution / Working</div>
                        <div className="text-xs text-slate-300 leading-relaxed font-mono">{ts.step2_execution}</div>
                      </div>
                      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-emerald-500/30 space-y-1">
                        <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Step 3: Final Answer & Unit</div>
                        <div className="text-xs font-bold text-emerald-300 leading-relaxed">{ts.step3_final_answer}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              (studyPack.exercise_questions || studyPack.ncert_questions) && (
                <div className="space-y-3">
                  {studyPack.exercise_questions?.map((q, i) => (
                    <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="font-semibold text-sm text-slate-200">Ex Q{i+1}: {q.question}</div>
                      <div className="text-xs text-teal-300 bg-slate-900 p-3 rounded-lg border border-slate-800">
                        {q.answer}
                      </div>
                    </div>
                  ))}
                  {studyPack.ncert_questions?.map((q, i) => (
                    <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="font-semibold text-sm text-slate-200">NCERT Q{i+1}: {q.question}</div>
                      {q.answer && (
                        <div className="text-xs text-teal-300 bg-slate-900 p-3 rounded-lg border border-slate-800">
                          {q.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </section>
        )}

        {/* ── SECTION 4: Top 10-Yr PYQs ─────────────────────────────────────── */}
        {(activeTab === "all" || activeTab === "sec4") && (
          <section className="space-y-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Award size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  4. Top Past 10 Years Examination Questions (PYQs)
                </h2>
                <p className="text-xs text-slate-400">Authentic board & university examination questions with step marking schemes</p>
              </div>
            </div>

            {studyPack.pyqs && studyPack.pyqs.length > 0 ? (
              <div className="space-y-4">
                {studyPack.pyqs.map((pyq, i) => (
                  <div key={i} className="bg-slate-950 p-5 rounded-2xl border border-amber-500/20 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-amber-300">PYQ #{i + 1}</span>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[11px] font-semibold rounded-full">
                          Exam Years: {pyq.exam_year || '2021, 2023'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[11px] rounded-full">
                          {pyq.marks || 5} Marks
                        </span>
                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                          pyq.difficulty === "easy" ? "bg-emerald-500/20 text-emerald-300" :
                          pyq.difficulty === "hard" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"
                        }`}>
                          {pyq.difficulty ? pyq.difficulty.toUpperCase() : "MEDIUM"}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-white bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                      {pyq.question}
                    </div>

                    {/* Marking Scheme Breakdown */}
                    {pyq.marking_scheme ? (
                      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                        <div className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <FileCheck size={14} /> Official Step Marking Breakdown
                        </div>
                        {pyq.marking_scheme.introduction_points && (
                          <div className="border-l-2 border-amber-400 pl-3 py-1 space-y-0.5">
                            <span className="font-bold text-amber-300">1. Introduction / Definition (1 Mark):</span>
                            <p className="text-slate-300">{pyq.marking_scheme.introduction_points.join(" ")}</p>
                          </div>
                        )}
                        {pyq.marking_scheme.derivation_points && (
                          <div className="border-l-2 border-teal-400 pl-3 py-1 space-y-0.5">
                            <span className="font-bold text-teal-300">2. Core Derivation / Working (3 Marks):</span>
                            <p className="text-slate-300">{pyq.marking_scheme.derivation_points.join(" ")}</p>
                          </div>
                        )}
                        {pyq.marking_scheme.conclusion_diagram_result && (
                          <div className="border-l-2 border-emerald-400 pl-3 py-1 space-y-0.5">
                            <span className="font-bold text-emerald-300">3. Final Conclusion & Diagram (1 Mark):</span>
                            <p className="text-slate-300">{pyq.marking_scheme.conclusion_diagram_result}</p>
                          </div>
                        )}
                      </div>
                    ) : pyq.solution && (
                      <div className="text-xs text-slate-300 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                        <strong>Solution:</strong> {pyq.solution}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No PYQs generated for this section yet.</p>
            )}
          </section>
        )}

        {/* ── SECTION 5: High-Probability Exam Predictions ───────────────── */}
        {(activeTab === "all" || activeTab === "sec5") && (
          <section className="space-y-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                <Zap size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  5. High-Probability Exam Predictions (2026–2027)
                </h2>
                <p className="text-xs text-slate-400">AI-predicted exam papers based on latest pattern trends & weighting</p>
              </div>
            </div>

            {studyPack.exam_predictions && studyPack.exam_predictions.length > 0 ? (
              <div className="space-y-4">
                {studyPack.exam_predictions.map((ep, i) => (
                  <div key={i} className="bg-slate-950 p-5 rounded-2xl border border-purple-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 font-bold text-xs rounded-full">
                        🎯 {ep.question_type || 'Short Answer (3M)'}
                      </span>
                      <span className="text-xs text-purple-400 font-mono font-bold">Predicted {ep.marks || 5} Marks</span>
                    </div>

                    <div className="text-sm font-semibold text-white bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                      {ep.question}
                    </div>

                    {ep.solution_steps && (
                      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                        <div className="font-bold text-purple-300 text-[11px] uppercase tracking-wider">Step-by-Step Model Solution:</div>
                        <ul className="space-y-1.5 text-slate-300">
                          {ep.solution_steps.map((st, sidx) => (
                            <li key={sidx} className="flex items-start gap-2">
                              <span className="text-purple-400 font-mono font-bold">•</span>
                              <span>{st}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              studyPack.competency_questions && (
                <div className="space-y-3">
                  {studyPack.competency_questions.map((cq, i) => (
                    <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="font-semibold text-sm text-slate-200">Competency Q{i+1}: {cq.question}</div>
                      <div className="text-xs text-purple-300 bg-slate-900 p-3 rounded-lg border border-slate-800">
                        {cq.answer}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </section>
        )}

        {/* ── SECTION 6: MCQs & Quiz Bank ─────────────────────────────────── */}
        {(activeTab === "all" || activeTab === "sec6") && (
          <section className="space-y-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  6. Multiple Choice Questions (MCQs) & Interactive Quiz Bank
                </h2>
                <p className="text-xs text-slate-400">Interactive practice with instant answer validation & explanation</p>
              </div>
            </div>

            {studyPack.mcq_quiz_bank && studyPack.mcq_quiz_bank.length > 0 ? (
              <div className="space-y-4">
                {studyPack.mcq_quiz_bank.map((mcq, i) => {
                  const state = quizState[i] || {};
                  const isAnswered = !!state.selected;
                  const isCorrect = state.selected === mcq.correct_option;

                  return (
                    <div key={i} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-emerald-400 uppercase tracking-wider">
                          Question #{i + 1} {mcq.is_assertion_reason ? "— Assertion & Reason" : ""}
                        </span>
                        {isAnswered && (
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                            isCorrect ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                          }`}>
                            {isCorrect ? "Correct!" : "Incorrect"}
                          </span>
                        )}
                      </div>

                      {mcq.is_assertion_reason ? (
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                          <div><strong className="text-amber-300">Assertion (A):</strong> {mcq.assertion || mcq.question}</div>
                          <div><strong className="text-teal-300">Reason (R):</strong> {mcq.reason || ''}</div>
                        </div>
                      ) : (
                        <div className="text-sm font-semibold text-white bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                          {mcq.question}
                        </div>
                      )}

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {mcq.options.map(opt => {
                          const isThisSelected = state.selected === opt.label;
                          const isThisCorrect = opt.label === mcq.correct_option;

                          let btnStyle = "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800";
                          if (isAnswered) {
                            if (isThisCorrect) {
                              btnStyle = "bg-emerald-950/80 text-emerald-200 border-emerald-500/50 font-bold";
                            } else if (isThisSelected) {
                              btnStyle = "bg-red-950/80 text-red-200 border-red-500/50";
                            }
                          }

                          return (
                            <button
                              key={opt.label}
                              onClick={() => {
                                setQuizState(prev => ({
                                  ...prev,
                                  [i]: { selected: opt.label, revealed: true }
                                }));
                              }}
                              className={`p-3 rounded-xl border text-xs text-left transition flex items-start gap-3 ${btnStyle}`}
                            >
                              <span className="w-5 h-5 bg-slate-800 rounded-full text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                                {opt.label}
                              </span>
                              <span className="leading-snug">{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation Reveal */}
                      {(state.revealed || isAnswered) && (
                        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5 animate-fadeIn">
                          <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 size={14} /> Correct Answer: ({mcq.correct_option})
                          </div>
                          <p className="text-slate-300 leading-relaxed">{mcq.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              studyPack.practice_questions && (
                <div className="space-y-3">
                  {studyPack.practice_questions.map((q, i) => (
                    <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="font-semibold text-sm text-slate-200">Q{i+1}: {q.question}</div>
                      {q.hint && <div className="text-xs text-amber-300 italic">💡 Hint: {q.hint}</div>}
                      {q.answer && <div className="text-xs text-emerald-300 bg-slate-900 p-3 rounded-lg border border-slate-800">{q.answer}</div>}
                    </div>
                  ))}
                </div>
              )
            )}
          </section>
        )}

        {/* ── SECTION 7: Misconceptions & Exam Pitfalls ───────────────────── */}
        {(activeTab === "all" || activeTab === "sec7") && (
          <section className="space-y-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  7. Common Student Misconceptions & Exam Pitfalls
                </h2>
                <p className="text-xs text-slate-400">High-risk conceptual errors, unit mismatches & examiner warning traps</p>
              </div>
            </div>

            {studyPack.misconception_pitfalls && studyPack.misconception_pitfalls.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studyPack.misconception_pitfalls.map((m, i) => (
                  <div key={i} className="bg-slate-950 p-5 rounded-2xl border border-red-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                        <AlertTriangle size={14} /> Pitfall #{i + 1}
                      </span>
                      <span className="text-[10px] bg-red-500/10 text-red-300 px-2 py-0.5 rounded-full font-mono">AVOID ERROR</span>
                    </div>

                    <div className="bg-red-950/40 p-3.5 rounded-xl border border-red-900/50 text-xs text-red-200 space-y-1">
                      <div className="font-bold text-red-400 text-[11px] uppercase tracking-wider">❌ Common Misconception:</div>
                      <p>{m.misconception}</p>
                    </div>

                    <div className="bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-900/50 text-xs text-emerald-200 space-y-1">
                      <div className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider">✅ Correct Approach & Rule:</div>
                      <p>{m.correction}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              studyPack.common_mistakes && (
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                  {studyPack.common_mistakes.map((cm, i) => (
                    <div key={i} className="p-3 bg-slate-900 rounded-xl text-xs text-amber-200 border border-slate-800 flex items-start gap-2">
                      <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                      <span>{cm}</span>
                    </div>
                  ))}
                </div>
              )
            )}
          </section>
        )}

        {/* ── SECTION 8: Class Test & Self-Assessment Exam Paper ───────────── */}
        {(activeTab === "all" || activeTab === "sec8") && (
          <section className="space-y-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
                <FileCheck size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  8. Class Test / Self-Assessment Exam Paper
                </h2>
                <p className="text-xs text-slate-400">Institutional pattern 25-mark evaluation paper with answer key</p>
              </div>
            </div>

            {studyPack.class_test_paper ? (
              <div className="bg-slate-950 p-6 md:p-8 rounded-2xl border border-teal-500/30 space-y-6">
                {/* Paper Header */}
                <div className="text-center border-b border-slate-800 pb-6 space-y-2">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    {studyPack.class_test_paper.test_title || `${subject}: ${title} — Self Assessment Test`}
                  </h3>
                  <div className="flex items-center justify-center gap-6 text-xs text-slate-400 font-mono">
                    <span>Max Marks: <strong>{studyPack.class_test_paper.max_marks || 25}</strong></span>
                    <span>Time Allowed: <strong>{studyPack.class_test_paper.time_minutes || 45} Mins</strong></span>
                  </div>
                </div>

                {/* Section A */}
                {studyPack.class_test_paper.section_a_objective && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-teal-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                      Section A: Objective & Short Concept Questions (6 Marks)
                    </div>
                    <div className="space-y-2 text-xs text-slate-200">
                      {studyPack.class_test_paper.section_a_objective.map(q => (
                        <div key={q.q_no} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between gap-4">
                          <span><strong>Q{q.q_no}.</strong> {q.question}</span>
                          <span className="text-teal-400 font-mono font-bold shrink-0">[{q.marks}M]</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section B */}
                {studyPack.class_test_paper.section_b_analytical && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                      Section B: Analytical & Problem Solving (9 Marks)
                    </div>
                    <div className="space-y-2 text-xs text-slate-200">
                      {studyPack.class_test_paper.section_b_analytical.map(q => (
                        <div key={q.q_no} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between gap-4">
                          <span><strong>Q{q.q_no}.</strong> {q.question}</span>
                          <span className="text-indigo-400 font-mono font-bold shrink-0">[{q.marks}M]</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section C */}
                {studyPack.class_test_paper.section_c_comprehensive && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                      Section C: Comprehensive Essay / Case Study (10 Marks)
                    </div>
                    <div className="space-y-2 text-xs text-slate-200">
                      {studyPack.class_test_paper.section_c_comprehensive.map(q => (
                        <div key={q.q_no} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between gap-4">
                          <span><strong>Q{q.q_no}.</strong> {q.question}</span>
                          <span className="text-amber-400 font-mono font-bold shrink-0">[{q.marks}M]</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Answer Key Toggle */}
                {studyPack.class_test_paper.answer_key_and_marking_scheme && (
                  <div className="border-t border-slate-800 pt-6">
                    <button
                      onClick={() => setShowTestAnswers(!showTestAnswers)}
                      className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-teal-300 font-bold text-xs rounded-xl border border-teal-500/30 transition flex items-center justify-center gap-2"
                    >
                      {showTestAnswers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {showTestAnswers ? "Hide Class Test Answer Key & Solutions" : "Show Class Test Answer Key & Solutions"}
                    </button>

                    {showTestAnswers && (
                      <div className="mt-4 p-5 bg-slate-900 rounded-2xl border border-teal-500/20 text-xs text-slate-300 space-y-3 animate-fadeIn">
                        <div className="font-bold text-teal-400 text-sm flex items-center gap-2">
                          <CheckCircle2 size={16} /> Class Test Answer Key & Detailed Marking Scheme
                        </div>
                        <pre className="font-sans text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {studyPack.class_test_paper.answer_key_and_marking_scheme}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No class test paper generated yet.</p>
            )}
          </section>
        )}

        {/* ── Study Plan Footer ────────────────────────────────────────────── */}
        {studyPack.study_plan && studyPack.study_plan.length > 0 && (
          <section className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} /> Recommended 5-Step Revision Timeline
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {studyPack.study_plan.map((st, i) => (
                <div key={i} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono text-teal-400 font-bold">Step #{st.step || i+1}</div>
                  <div className="font-bold text-xs text-white">{st.focus}</div>
                  <div className="text-[11px] text-slate-400">{st.activity} ({st.time_minutes}m)</div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
