export interface D360User { id: string; name: string; email: string; role: string; is_paid?: boolean; }

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
export interface StudyPack {
  chapter_title: string;
  subject: string;
  story_telling_explanation?: string;
  core_concepts: { concept: string; simple_explanation: string; why_it_matters: string }[];
  key_terms: { term: string; meaning: string }[];
  study_plan: { step: number; focus: string; time_minutes: number; activity: string }[];
  quick_reference: string[];
  practice_questions: { question: string; hint: string; difficulty: "easy" | "medium" | "hard" }[];
  common_mistakes: string[];
  competency_questions?: { question: string; answer: string; competency_tested: string }[];
  exercise_questions?: { question: string; answer: string }[];
  ncert_questions?: { question: string; answer: string }[];
  custom_qna?: { question: string; answer: string }[];
}
