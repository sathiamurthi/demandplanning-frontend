export interface D360User { id: string; name: string; email: string; role: string; }

export interface IngestRow {
  source_type: "excel" | "pdf" | "screenshot" | "voice";
  extracted_entity: string;
  target_field_a: string; // Amount
  target_field_b: string; // Email
  raw_snippet?: string;
}

export type VerdictLevel = "ok" | "warning" | "critical";
export type RowStatus = "pending" | "approved" | "rejected";

export interface D360Row {
  id: string;
  batch_id: string;
  row_index: number;
  source_type: string;
  extracted_entity: string | null;
  target_field_a: string | null;
  target_field_b: string | null;
  raw_snippet: string | null;
  agent_verdict: string | null;
  verdict_level: VerdictLevel;
  requires_manual_review: boolean;
  manual_override: Record<string, string> | null;
  status: RowStatus;
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
  created_at: string;
  updated_at: string;
}

export type TargetType = "file_export" | "cloud_storage" | "rpa_portal";
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
