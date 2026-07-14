import type { D360User, D360Batch, D360Row, D360Job, IngestRow, TargetType, D360Template, TemplateOutputType, D360GenerationJob } from "./types";

const BASE = "/v1/data360";
const TOKEN_KEY = "data360_token";

export const getToken = (): string | null => (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(opts.headers as any) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  const json = await res.json().catch(() => ({ success: false, error: "Invalid server response" }));
  if (!res.ok || !json.success) throw new Error(json.error || `Request failed (${res.status})`);
  return json.data as T;
}

export const data360Api = {
  register: (name: string, email: string, password: string) =>
    req<{ token: string; user: D360User }>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  login: (email: string, password: string) =>
    req<{ token: string; user: D360User }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
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

  // Runs the same raw text through Claude server-side, in parallel with the
  // client-side regex heuristic, so the two can be compared row by row.
  aiExtract: (raw_snippet: string, fields: string[]) =>
    req<{ fields: Record<string, string> }>("/ai-extract", { method: "POST", body: JSON.stringify({ raw_snippet, fields }) }),

  // For the screenshot channel: sends the actual image to Claude's vision
  // model, bypassing Tesseract OCR entirely — the fix for stylized/graphic
  // documents where OCR itself comes back unreadable.
  aiExtractImage: (image_base64: string, mime_type: string, fields: string[]) =>
    req<{ fields: Record<string, string> }>("/ai-extract-image", { method: "POST", body: JSON.stringify({ image_base64, mime_type, fields }) }),
};
