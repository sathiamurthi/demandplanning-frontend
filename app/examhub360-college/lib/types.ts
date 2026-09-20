export interface D360User { id: string; name: string; email: string; role: string; firstName?: string; lastName?: string; phone?: string; college?: string; state?: string; is_paid?: boolean; }

// ── Usage quota (free trial + paid packages) ────────────────────────────────
export interface DataPackage { id: string; name: string; documents: number; price_inr: number; support: boolean; }
export interface DataQuota { unlimited: boolean; used: number; limit: number | null; remaining: number | null; packages: DataPackage[]; }

export interface IngestRow {
  source_type: "excel" | "pdf" | "screenshot" | "voice";
  fields: Record<string, string>; // keyed by the user-chosen field names, e.g. {"Invoice Number": "INV-1024", "Phone": "9876543210"}
  raw_snippet?: string;
}

export type VerdictLevel = "ok" | "warning" | "critical";
export type RowStatus = "pending" | "approved" | "rejected";

export interface D360Row {
  id: string;
  batch_id: string;
  row_index: number;
  source_type: string;
  fields: Record<string, string> | null;
  raw_snippet: string | null;
  agent_verdict: string | null;
  verdict_level: VerdictLevel;
  requires_manual_review: boolean;
  manual_override: Record<string, string> | null;
  status: RowStatus;
  // Legacy fixed columns — only populated on batches ingested before dynamic
  // field extraction existed. New rows use `fields` instead.
  extracted_entity?: string | null;
  target_field_a?: string | null;
  target_field_b?: string | null;
}

export type BatchStatus = "pending_approval" | "approved" | "distributed" | "archived";

export interface D360Batch {
  id: string;
  user_id: string;
  name: string;
  source_channel: string;
  status: BatchStatus;
  total_rows: number;
  flagged_rows: number;
  extraction_fields: string[]; // the field names requested at ingest time, e.g. ["Invoice Number", "Name", "Phone"]
  field_mapping: Record<string, string>;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

export type TargetType = "file_export" | "cloud_storage" | "database" | "api" | "rpa_portal";
export type JobStatus = "pending" | "completed" | "failed";

export interface D360Job {
  id: string;
  batch_id: string;
  target_type: TargetType;
  config: Record<string, any>;
  status: JobStatus;
  result: Record<string, any> | null;
  created_at: string;
  completed_at: string | null;
}

// ── Generate stage: reusable templates (extraction fields + output design) ──
export type TemplateOutputType = "fillable_pdf" | "coordinate_layout";

export interface D360Template {
  id: string;
  user_id: string;
  name: string;
  extraction_fields: string[];
  output_type: TemplateOutputType;
  template_file_key: string | null;
  layout_json: { field: string; label?: string; x?: number; y?: number; fontSize?: number }[] | null;
  created_at: string;
  updated_at: string;
}

export type GenerationStatus = "generating" | "ready" | "failed";

export interface D360GeneratedDoc {
  row_id: string;
  row_index: number;
  file_name: string;
  file_base64: string;
}

export interface D360GenerationJob {
  id: string;
  batch_id: string;
  template_id: string;
  status: GenerationStatus;
  result: { documents?: D360GeneratedDoc[]; row_count?: number; error?: string } | null;
  created_at: string;
  completed_at: string | null;
}

// ── School: chapter -> Study Pack ───────────────────────────────────────────
export interface KeyTermItem {
  term: string;
  meaning: string;
  formula?: string;
  practical_context?: string;
}

export interface FormulaItem {
  formula_name: string;
  equation: string;
  parameters_breakdown: string;
  key_rules?: string[];
}

export interface TextbookSolutionItem {
  problem_title?: string;
  question: string;
  step1_given_data: string;
  step2_execution: string;
  step3_final_answer: string;
}

export interface PYQItem {
  question: string;
  difficulty?: "easy" | "medium" | "hard";
  exam_year?: string;
  marks?: number;
  marking_scheme?: {
    introduction_points?: string[];
    derivation_points?: string[];
    conclusion_diagram_result?: string;
  };
  solution?: string;
}

export interface ExamPredictionItem {
  question_type?: string;
  marks?: number;
  question: string;
  solution_steps?: string[];
}

export interface MCQItem {
  question: string;
  options: { label: string; text: string }[];
  correct_option: string;
  explanation: string;
  is_assertion_reason?: boolean;
  assertion?: string;
  reason?: string;
}

export interface MisconceptionItem {
  misconception: string;
  correction: string;
}

export interface ClassTestSectionQuestion {
  q_no: number;
  question: string;
  marks: number;
}

export interface ClassTestPaper {
  test_title?: string;
  max_marks?: number;
  time_minutes?: number;
  section_a_objective?: ClassTestSectionQuestion[];
  section_b_analytical?: ClassTestSectionQuestion[];
  section_c_comprehensive?: ClassTestSectionQuestion[];
  answer_key_and_marking_scheme?: string;
}

export interface StudyPack {
  chapter_title?: string;
  unit_title?: string;
  subject: string;
  course_grade_semester?: string;
  subject_code?: string;
  institution_or_board?: string;

  // Section 1: Executive Summary & Mind Map
  conceptual_mind_map?: string;
  story_telling_explanation?: string;
  core_concepts: { concept: string; simple_explanation: string; why_it_matters: string }[];
  key_terms: KeyTermItem[];

  // Section 2: Core Theorems & Formulae
  formula_sheet?: FormulaItem[];
  quick_reference: string[];

  // Section 3: Textbook Core Exercise Solutions
  textbook_solutions?: TextbookSolutionItem[];
  exercise_questions?: { question: string; answer: string }[];
  ncert_questions?: { question: string; answer: string }[];

  // Section 4: Top 10-Yr PYQs
  pyqs?: PYQItem[];

  // Section 5: High-Probability Exam Predictions
  exam_predictions?: ExamPredictionItem[];
  competency_questions?: { question: string; answer: string; competency_tested: string }[];

  // Section 6: MCQs & Quiz Bank
  mcq_quiz_bank?: MCQItem[];
  practice_questions: { question: string; hint?: string; difficulty?: "easy" | "medium" | "hard"; answer?: string }[];

  // Section 7: Misconceptions & Exam Pitfalls
  misconception_pitfalls?: MisconceptionItem[];
  common_mistakes: string[];

  // Section 8: Class Test & Self Assessment Paper
  class_test_paper?: ClassTestPaper;

  // Study Plan & Custom QnA
  study_plan: { step: number; focus: string; time_minutes: number; activity: string }[];
  custom_qna?: { question: string; answer: string }[];
  lab_viva_questions?: { question: string; answer: string }[];
}
