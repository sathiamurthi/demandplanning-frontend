import type { D360User, D360Batch, D360Row, D360Job, IngestRow, TargetType, D360Template, TemplateOutputType, D360GenerationJob, StudyPack, DataQuota } from "./types";

const BASE = "/v1/data360";
const TOKEN_KEY = "data360_token";

export const getToken = (): string | null => (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Carries the extra fields a 402 QUOTA_EXCEEDED response includes (used,
// limit, remaining, packages) so the caller can render the paywall with
// real numbers/pricing instead of just a generic error string.
export class ApiError extends Error {
  code?: string;
  data?: any;
  constructor(message: string, code?: string, data?: any) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(opts.headers as any) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  const json = await res.json().catch(() => ({ success: false, error: "Invalid server response" }));
  if (!res.ok || !json.success) throw new ApiError(json.error || `Request failed (${res.status})`, json.code, json);
  return json.data as T;
}

export const data360Api = {
  register: (payload: { name: string; email: string; password: string; phone: string; college: string; state: string }) =>
     req<{ token?: string; accessToken?: string; user: D360User }>("/auth/register", { method: "POST", body: JSON.stringify({ email: payload.email, password: payload.password, phone: payload.phone, firstName: payload.name.trim().split(/\s+/)[0], lastName: payload.name.trim().split(/\s+/).slice(1).join(' '), college: payload.college, state: payload.state }) }),
  login: (email: string, password: string) =>
     req<{ token?: string; accessToken?: string; user: D360User }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => req<D360User>("/auth/me"),

  createBatch: (name: string, source_channel: string, rows: IngestRow[], extraction_fields: string[], template_id?: string) =>
    req<{ batch: D360Batch; rows: D360Row[] }>("/batches", { method: "POST", body: JSON.stringify({ name, source_channel, rows, extraction_fields, template_id }) }),
  listBatches: () => req<D360Batch[]>("/batches"),
  getBatch: (id: string) => req<{ batch: D360Batch; rows: D360Row[]; jobs: D360Job[]; generationJobs: D360GenerationJob[] }>(`/batches/${id}`),

  updateRow: (batchId: string, rowId: string, body: { status?: "approved" | "rejected"; manual_override?: { fields?: Record<string, string> } }) =>
    req<D360Row>(`/batches/${batchId}/rows/${rowId}`, { method: "PATCH", body: JSON.stringify(body) }),

  saveMapping: (batchId: string, field_mapping: Record<string, string>) =>
    req<D360Batch>(`/batches/${batchId}/mapping`, { method: "PATCH", body: JSON.stringify({ field_mapping }) }),

  distribute: (batchId: string, target_type: TargetType, config: Record<string, any>) =>
    req<D360Job>(`/batches/${batchId}/distribute`, { method: "POST", body: JSON.stringify({ target_type, config }) }),

  // ── Templates (Generate stage) ──────────────────────────────────────────
  listTemplates: () => req<D360Template[]>("/templates"),
  createTemplate: (name: string, extraction_fields: string[], output_type: TemplateOutputType = "coordinate_layout") =>
    req<D360Template>("/templates", { method: "POST", body: JSON.stringify({ name, extraction_fields, output_type }) }),
  deleteTemplate: (id: string) => req<{ deleted: true }>(`/templates/${id}`, { method: "DELETE" }),

  generate: (batchId: string, template_id?: string) =>
    req<D360GenerationJob>(`/batches/${batchId}/generate`, { method: "POST", body: JSON.stringify({ template_id }) }),

  // Runs raw text through the server's AI fallback chain (Anthropic ->
  // Gemini -> Azure OpenAI), constrained to an explicit field list.
  // batch_label/file_label are optional — passed through so the call shows
  // up correctly in Settings' cost/token usage tables even though no
  // data360_batches row exists yet at this point in the flow (AI calls
  // happen during staging, before "Create & Validate").
  // `cached: true` means this exact document (same content + same field
  // list/mode) was already processed for this user — no AI provider was
  // called at all, so it works even while every provider is down/rate
  // limited, and costs nothing.
  aiExtract: (raw_snippet: string, fields: string[], batch_label?: string, file_label?: string) =>
    req<{ fields: Record<string, string>; provider: string; cached: boolean }>("/ai-extract", { method: "POST", body: JSON.stringify({ raw_snippet, fields, batch_label, file_label }) }),
  aiExtractImage: (image_base64: string, mime_type: string, fields: string[], batch_label?: string, file_label?: string) =>
    req<{ fields: Record<string, string>; provider: string; cached: boolean }>("/ai-extract-image", { method: "POST", body: JSON.stringify({ image_base64, mime_type, fields, batch_label, file_label }) }),

  // Auto-extraction: no field list at all — hands back whatever key/value
  // structure the document actually has (flat fields, nested groups,
  // repeating tables as arrays), rather than requiring the caller to know
  // field names up front.
  aiExtractAuto: (raw_snippet: string, batch_label?: string, file_label?: string) =>
    req<{ data: Record<string, any>; provider: string; cached: boolean }>("/ai-extract-auto", { method: "POST", body: JSON.stringify({ raw_snippet, batch_label, file_label }) }),
  aiExtractImageAuto: (image_base64: string, mime_type: string, batch_label?: string, file_label?: string) =>
    req<{ data: Record<string, any>; provider: string; cached: boolean }>("/ai-extract-image-auto", { method: "POST", body: JSON.stringify({ image_base64, mime_type, batch_label, file_label }) }),

  // ── School: chapter -> Study Pack ───────────────────────────────────────
  // Generative, not extractive — always goes through AI (there's no field
  // list to fall back to a regex heuristic for). Same cache/cost-tracking
  // shape as the extraction endpoints; `cached: true` means this exact
  // chapter + class + board + subject combination was already prepared.
  studyGuideFromText: (raw_snippet: string, class_level: string, board: string, subject?: string, file_label?: string) =>
    req<{ data: StudyPack; provider: string; cached: boolean }>("/school/study-guide", { method: "POST", body: JSON.stringify({ raw_snippet, class_level, board, subject, file_label }) }),
  studyGuideFromImages: (images: { image_base64: string; mime_type: string }[], class_level: string, board: string, subject?: string, file_label?: string) =>
    req<{ data: StudyPack; provider: string; cached: boolean }>("/school/study-guide-image", { method: "POST", body: JSON.stringify({ images, class_level, board, subject, file_label }) }),
  generateStudyGuide: (class_level: string, board: string, subject: string, chapter_name: string) =>
    req<{ data: StudyPack; provider: string; cached: boolean }>("/school/generate-chapter-guide", { method: "POST", body: JSON.stringify({ class_level, board, subject, chapter_name }) }),

  // ── Usage quota (free trial + paid packages) ────────────────────────────
  getQuota: () => req<DataQuota>("/quota"),
  // Superadmin-only (checked server-side by email) — credits a buyer's
  // quota after a package purchase is confirmed out-of-band (no live
  // payment gateway wired up yet).
  grantQuota: (user_email: string, additional_documents: number) =>
    req<{ id: string; email: string; purchased_document_quota: number }>("/admin/grant-quota", { method: "POST", body: JSON.stringify({ user_email, additional_documents }) }),

  // ── AI usage (Settings — cost/token tracking) ───────────────────────────
  getAiUsage: () => req<{
    files: { id: string; batch_label: string | null; file_label: string | null; provider: string; model: string; input_tokens: number; output_tokens: number; pages: number; estimated_cost_usd: number; from_cache: boolean; created_at: string }[];
    batches: { batch_label: string; file_count: number; cache_hits: number; total_pages: number; total_input_tokens: number; total_output_tokens: number; total_cost_usd: number; started_at: string; last_used_at: string }[];
    cacheStats: { total_calls: number; cache_hits: number };
  }>("/ai-usage"),
  clearAiCache: () => req<{ cleared: number }>("/ai-cache", { method: "DELETE" }),
};
