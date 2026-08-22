"use client";

import React, { useState } from "react";
import { Sparkles, Printer, BookOpen, BrainCircuit, Lightbulb, Loader2 } from "lucide-react";
import { getAuthHeaders } from "../usercrud";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

type StudyGuide = {
  concept: string;
  questions: string[];
  quickReference: string[];
};

export default function SchoolAIPage() {
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guide, setGuide] = useState<StudyGuide | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !chapter.trim()) {
      setError("Please enter both Subject and Chapter name.");
      return;
    }

    setLoading(true);
    setError("");
    setGuide(null);

    try {
      const res = await fetch(`${BASE}/school/generate-study-guide`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ subject, chapterName: chapter }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate study guide.");
      
      setGuide(json.data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen">
      {/* ── HEADER ── */}
      <div className="print:hidden mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-gold-500" />
          School AI Tutor
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate CBSE pattern study guides, top 20 questions, and quick reference sheets instantly.
        </p>
      </div>

      {/* ── FORM ── */}
      <div className="print:hidden bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
        <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Science"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20 transition-all"
              disabled={loading}
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Chapter Name
            </label>
            <input
              type="text"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="e.g. Light: Reflection and Refraction"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20 transition-all"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !subject || !chapter}
            className="w-full md:w-auto flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white theme-btn-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate Guide
          </button>
        </form>

        {error && (
          <div className="mt-4 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* ── OUTPUT SECTION ── */}
      {guide && (
        <div className="print:m-0 print:p-0">
          {/* Action Bar (Hidden on print) */}
          <div className="print:hidden flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">Generated Study Guide</h2>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
            >
              <Printer className="h-4 w-4" />
              Print to PDF
            </button>
          </div>

          {/* Printable Content */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 print:border-none print:p-0 print:shadow-none shadow-sm space-y-10">
            {/* Header for PDF */}
            <div className="border-b border-gray-100 pb-6 text-center">
              <h1 className="text-3xl font-extrabold text-gray-900">{subject}</h1>
              <h2 className="text-xl font-medium text-gray-600 mt-2">{chapter}</h2>
            </div>

            {/* Concept */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-blue-600 print:text-gray-800" />
                <h3 className="text-xl font-bold text-gray-800">Concept Understanding</h3>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed bg-blue-50/50 print:bg-transparent rounded-xl p-5 border border-blue-100 print:border-none print:p-0">
                {guide.concept}
              </div>
            </section>

            {/* Quick Reference */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-amber-500 print:text-gray-800" />
                <h3 className="text-xl font-bold text-gray-800">Quick Reference & Takeaways</h3>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 print:grid-cols-2">
                {guide.quickReference.map((point, i) => (
                  <li key={i} className="bg-amber-50/30 print:bg-transparent border border-amber-100 print:border-gray-200 rounded-lg p-3 text-sm text-gray-800 flex items-start gap-3">
                    <span className="font-bold text-amber-500 print:text-gray-800 mt-0.5">•</span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Questions */}
            <section className="print:break-before-page">
              <div className="flex items-center gap-2 mb-4">
                <BrainCircuit className="h-5 w-5 text-purple-600 print:text-gray-800" />
                <h3 className="text-xl font-bold text-gray-800">Top 20 CBSE Pattern Questions</h3>
              </div>
              <div className="space-y-4">
                {guide.questions.map((q, i) => {
                  const splitQ = q.split(/\*\*Hint:\*\*|\*\*Answer:\*\*|\n/i).filter(Boolean);
                  return (
                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm print:shadow-none print:border-b print:rounded-none">
                      <div className="flex gap-3 items-start">
                        <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-700 print:bg-gray-100 print:text-gray-800 text-xs font-bold mt-0.5">
                          {i + 1}
                        </span>
                        <div className="space-y-1.5">
                          <p className="text-sm font-semibold text-gray-900 leading-relaxed">{splitQ[0]}</p>
                          {splitQ[1] && (
                            <p className="text-xs text-gray-500 italic">Hint: {splitQ[1].replace(/^-/, '').trim()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
