export interface D360User { id: string; name: string; email: string; role: string; }

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
