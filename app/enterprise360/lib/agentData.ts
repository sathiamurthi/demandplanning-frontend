// ── Tech stack layers (mirrors the real EnterpriseAgent TechStackForm) ─────
export const TECH_OPTIONS: Record<string, string[]> = {
  frontend: [
    "react", "vue", "angular", "nextjs", "nuxtjs", "svelte", "sveltekit", "remix", "astro", "solidjs",
    "typescript", "javascript",
    "tailwind", "bootstrap", "material-ui", "chakra-ui", "shadcn-ui", "styled-components", "css-modules", "sass",
    "zustand", "redux", "mobx", "jotai", "recoil", "pinia", "vuex", "ngrx", "context-api",
    "vite", "webpack", "rollup", "turbopack", "parcel",
    "vitest", "jest", "cypress", "playwright", "testing-library",
    "axios", "react-query", "swr", "framer-motion", "react-hook-form", "zod", "i18next",
  ],
  backend: [
    "express", "fastify", "nestjs", "hono", "koa", "elysia",
    "fastapi", "django", "flask", "litestar",
    "spring-boot", "quarkus", "micronaut",
    "dotnet", "aspnet-core", "minimal-api",
    "laravel", "rails", "go-fiber", "gin", "chi", "actix", "axum",
    "nodejs", "bun", "deno",
    "typescript", "javascript", "python", "java", "kotlin", "csharp", "go", "rust",
  ],
  db: [
    "postgresql", "mysql", "mssql", "sqlite", "mariadb", "cockroachdb",
    "mongodb", "dynamodb", "firestore", "cassandra", "couchdb", "redis-db",
    "planetscale", "supabase", "neon", "turso", "tidb",
    "elasticsearch", "opensearch", "meilisearch", "typesense",
    "timescaledb", "influxdb", "clickhouse",
    "prisma", "drizzle", "typeorm", "sequelize", "sqlalchemy", "hibernate",
  ],
  caching: [
    "redis", "memcached", "hazelcast", "in-memory", "varnish", "nginx-cache",
    "cloudflare-cache", "cdn", "node-cache", "lru-cache",
  ],
  logging: [
    "winston", "pino", "morgan", "bunyan",
    "log4j", "logback", "slf4j",
    "serilog", "nlog",
    "structlog", "loguru",
    "zap", "zerolog",
    "opentelemetry", "datadog-logs", "cloudwatch", "stackdriver", "loki", "elk-stack", "splunk",
  ],
  storage: [
    "local", "s3", "azure-blob", "gcs", "minio", "cloudflare-r2",
    "backblaze-b2", "digitalocean-spaces", "wasabi", "firebase-storage",
  ],
  exceptions: [
    "custom", "sentry", "rollbar", "airbrake", "bugsnag", "datadog-apm",
    "newrelic", "honeybadger", "raygun", "trackjs",
  ],
  integration: [
    "rest", "graphql", "grpc", "soap", "websocket", "sse",
    "webhooks", "openapi", "asyncapi",
  ],
  email: [
    "sendgrid", "mailgun", "smtp", "ses", "postmark", "resend",
    "mailchimp", "brevo", "sparkpost", "mailtrap",
  ],
  notification: [
    "firebase-fcm", "onesignal", "apns", "pusher", "ably", "soketi",
    "supabase-realtime", "centrifugo", "ntfy",
  ],
  whatsapp: [
    "twilio", "whatsapp-business-api", "meta-cloud", "360dialog", "gupshup", "wati", "none",
  ],
  telegram: [
    "telegram-bot", "telegraf", "grammY", "none",
  ],
  sso: [
    "none", "keycloak", "auth0", "okta", "azure-ad", "google-oauth",
    "clerk", "supabase-auth", "nextauth", "passport", "cognito", "firebase-auth",
    "zitadel", "authentik",
  ],
  service_bus: [
    "none", "rabbitmq", "kafka", "azure-service-bus", "aws-sqs", "aws-sns",
    "nats", "pulsar", "celery", "bullmq", "redis-pub", "google-pubsub",
  ],
  business_logic: [
    "layered", "cqrs", "event-sourcing", "hexagonal", "clean-arch",
    "ddd", "microservices", "monolith", "serverless", "modular-monolith",
  ],
};

export const LAYER_META: Array<{ key: string; label: string; emoji: string; hint: string }> = [
  { key: "frontend",       label: "Frontend",        emoji: "🖥️", hint: "Framework, language, styling, state, build tools" },
  { key: "backend",        label: "Backend",         emoji: "⚙️", hint: "Framework, runtime, language" },
  { key: "db",             label: "Database",        emoji: "🗄️", hint: "Storage engine + ORM/query layer" },
  { key: "caching",        label: "Caching",         emoji: "⚡", hint: "Cache store and strategy" },
  { key: "logging",        label: "Logging",         emoji: "📋", hint: "Log library and destination" },
  { key: "storage",        label: "File Storage",    emoji: "💾", hint: "Object / blob storage" },
  { key: "exceptions",     label: "Error Tracking",  emoji: "🚨", hint: "Exception monitoring" },
  { key: "integration",    label: "API Style",       emoji: "🔗", hint: "API protocol and integration" },
  { key: "email",          label: "Email",           emoji: "📧", hint: "Transactional email provider" },
  { key: "notification",   label: "Push / Realtime", emoji: "🔔", hint: "Push notifications and realtime" },
  { key: "whatsapp",       label: "WhatsApp",        emoji: "💬", hint: "WhatsApp messaging provider" },
  { key: "telegram",       label: "Telegram",        emoji: "✈️", hint: "Telegram bot library" },
  { key: "sso",            label: "Auth / SSO",      emoji: "🔐", hint: "Authentication and identity" },
  { key: "service_bus",    label: "Message Queue",   emoji: "🚌", hint: "Async messaging / event bus" },
  { key: "business_logic", label: "Architecture",    emoji: "🏗️", hint: "Code and system architecture pattern" },
];

// ── Agent pipeline (mirrors WorkflowStepsEditor + StepResultCard) ──────────
export const AGENT_ICONS: Record<string, string> = {
  _parse:         "📝", technology:     "🏗️", backend_api:    "⚙️",
  db:             "🗄️", business_logic: "🧠", middleware:     "🔗",
  logging:        "📋", exceptions:     "🚨", cache:          "⚡",
  mock:           "🧪", unit_test:      "✅", api_test:       "🔌",
  swagger:        "📖", qa_deployment:  "🚀", defect_report:  "🐛",
  defect_fix:     "🔧", uat_deployment: "🎯",
};

export const AGENT_GROUPS: Record<string, string[]> = {
  "Core Build":  ["technology", "backend_api", "db", "business_logic", "middleware", "logging", "exceptions", "cache", "mock"],
  "QA Pipeline": ["unit_test", "api_test", "swagger", "qa_deployment", "defect_report", "defect_fix", "uat_deployment"],
};

export const ALL_AGENTS = [...AGENT_GROUPS["Core Build"], ...AGENT_GROUPS["QA Pipeline"]];

export const LR_TOOLS     = ["loadrunner", "jmeter", "k6", "gatling"] as const;
export const LR_PROTOCOLS = ["HTTP/HTML", "HTTPS", "WebServices/SOAP", "AJAX/TruClient", "WebSocket"] as const;
export const LR_PACINGS   = ["as_fast_as_possible", "fixed", "random"] as const;

// ── Types ────────────────────────────────────────────────────────────────
export interface StepRow { agent_name: string; enabled: boolean; requires_approval: boolean; }
export interface LRScenario { name: string; virtual_users: number; duration_minutes: number; }
export interface LRSla { response_time_90pct_ms: number; error_rate_pct: number; throughput_rps: number; }
export interface LRConfig {
  tool: string; target_url: string; protocol: string;
  virtual_users: number; ramp_up_seconds: number; duration_minutes: number;
  think_time_ms: number; pacing: string;
  scenarios: LRScenario[]; sla: LRSla;
}

export const DEFAULT_LR_CONFIG: LRConfig = {
  tool: "loadrunner", target_url: "http://localhost:8000",
  protocol: "HTTP/HTML", virtual_users: 50, ramp_up_seconds: 60,
  duration_minutes: 30, think_time_ms: 3000, pacing: "as_fast_as_possible",
  scenarios: [
    { name: "Smoke Test",  virtual_users: 5,   duration_minutes: 5 },
    { name: "Load Test",   virtual_users: 50,  duration_minutes: 30 },
    { name: "Stress Test", virtual_users: 200, duration_minutes: 15 },
  ],
  sla: { response_time_90pct_ms: 2000, error_rate_pct: 1.0, throughput_rps: 100 },
};

export interface GeneratedFile { path: string; content: string; description?: string; }
export type StepStatus = "pending" | "running" | "awaiting_approval" | "approved" | "rejected" | "completed" | "failed" | "skipped";
export interface ExecutionStep {
  id: string; step_order: number; agent_name: string; status: StepStatus;
  output?: { summary?: string; files?: GeneratedFile[]; error?: string };
}
export interface Execution {
  id: string; workflowId: string; workflowName: string; user_story: string;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string; project_path?: string;
  deploy_status?: "none" | "deploying" | "deployed"; deploy_path?: string; app_number?: number;
  steps: ExecutionStep[];
}
export interface Workflow {
  id: string; name: string; description?: string;
  status: "active" | "draft" | "archived";
  createdAt: string;
  techConfig: Record<string, string>;
  steps: StepRow[];
  lrConfig: LRConfig;
}

// ── Mock output generation ──────────────────────────────────────────────
const FILES_BY_AGENT: Record<string, (story: string) => GeneratedFile[]> = {
  technology: () => [{ path: "STACK.md", description: "Selected technology stack", content: "# Technology Stack\n\n- Frontend: React + TypeScript + Tailwind\n- Backend: Express + Node.js\n- Database: PostgreSQL + Prisma\n- Cache: Redis\n" }],
  backend_api: (story) => [{ path: "src/routes/api.ts", description: "REST route handlers", content: `import { Router } from "express";\nconst router = Router();\n\n// Generated from: "${story.slice(0, 60)}"\nrouter.get("/items", async (req, res) => {\n  const items = await db.item.findMany();\n  res.json({ success: true, data: items });\n});\n\nrouter.post("/items", async (req, res) => {\n  const item = await db.item.create({ data: req.body });\n  res.status(201).json({ success: true, data: item });\n});\n\nexport default router;\n` }],
  db: () => [{ path: "migrations/001_init.sql", description: "Initial schema migration", content: `CREATE TABLE items (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  name TEXT NOT NULL,\n  status TEXT NOT NULL DEFAULT 'pending',\n  created_at TIMESTAMPTZ DEFAULT now()\n);\n\nCREATE INDEX idx_items_status ON items(status);\n` }],
  business_logic: () => [{ path: "src/services/itemService.ts", description: "Core business rules", content: `export class ItemService {\n  async create(input: CreateItemInput) {\n    this.validate(input);\n    return db.item.create({ data: input });\n  }\n\n  private validate(input: CreateItemInput) {\n    if (!input.name?.trim()) throw new Error("name is required");\n  }\n}\n` }],
  middleware: () => [{ path: "src/middleware/auth.ts", description: "Request auth middleware", content: `export function requireAuth(req, res, next) {\n  const token = req.headers.authorization?.split(" ")[1];\n  if (!token) return res.status(401).json({ error: "Unauthorized" });\n  next();\n}\n` }],
  logging: () => [{ path: "src/lib/logger.ts", description: "Structured logger setup", content: `import winston from "winston";\n\nexport const logger = winston.createLogger({\n  level: "info",\n  format: winston.format.json(),\n  transports: [new winston.transports.Console()],\n});\n` }],
  exceptions: () => [{ path: "src/lib/errorTracking.ts", description: "Exception monitoring hook", content: `export function captureException(err: Error, context?: Record<string, unknown>) {\n  console.error("[exception]", err.message, context);\n  // sentry.captureException(err, { extra: context });\n}\n` }],
  cache: () => [{ path: "src/lib/cache.ts", description: "Redis cache wrapper", content: `import Redis from "ioredis";\nconst redis = new Redis(process.env.REDIS_URL);\n\nexport const cache = {\n  get: (k: string) => redis.get(k),\n  set: (k: string, v: string, ttl = 300) => redis.set(k, v, "EX", ttl),\n};\n` }],
  mock: () => [{ path: "src/mocks/items.mock.ts", description: "Seed / mock data for local dev", content: `export const MOCK_ITEMS = [\n  { id: "1", name: "Sample Item A", status: "pending" },\n  { id: "2", name: "Sample Item B", status: "completed" },\n];\n` }],
  unit_test: () => [{ path: "tests/itemService.test.ts", description: "Unit tests — 12 passed", content: `describe("ItemService", () => {\n  it("creates an item", async () => {\n    const item = await service.create({ name: "Test" });\n    expect(item.name).toBe("Test");\n  });\n\n  it("rejects empty name", async () => {\n    await expect(service.create({ name: "" })).rejects.toThrow();\n  });\n});\n` }],
  api_test: () => [{ path: "tests/api.contract.test.ts", description: "API contract tests — 8 passed", content: `describe("GET /items", () => {\n  it("returns 200 with items array", async () => {\n    const res = await request(app).get("/items");\n    expect(res.status).toBe(200);\n    expect(Array.isArray(res.body.data)).toBe(true);\n  });\n});\n` }],
  swagger: () => [{ path: "openapi.yaml", description: "OpenAPI 3.0 spec", content: `openapi: 3.0.0\ninfo:\n  title: Generated API\n  version: 1.0.0\npaths:\n  /items:\n    get:\n      summary: List items\n      responses:\n        "200":\n          description: OK\n` }],
  qa_deployment: () => [{ path: "docker-compose.staging.yml", description: "Staging deployment config", content: `version: "3.9"\nservices:\n  app:\n    build: .\n    ports:\n      - "3000:3000"\n    environment:\n      - DATABASE_URL=\${DATABASE_URL}\n` }],
  defect_report: () => [{ path: "QA_REPORT.md", description: "Defects found during QA pass", content: `# QA Report\n\n- ⚠️ Minor: pagination missing on /items list (non-blocking)\n- ✅ No critical defects found\n` }],
  defect_fix: () => [{ path: "src/routes/api.ts", description: "Patched pagination bug", content: `// Fix: added pagination support\nrouter.get("/items", async (req, res) => {\n  const { page = 1, limit = 20 } = req.query;\n  const items = await db.item.findMany({ skip: (+page - 1) * +limit, take: +limit });\n  res.json({ success: true, data: items });\n});\n` }],
  uat_deployment: () => [{ path: "DEPLOY_NOTES.md", description: "UAT sign-off notes", content: `# UAT Deployment\n\nDeployed to staging for user acceptance testing.\nAll QA checks green. Awaiting human approval to promote to production.\n` }],
};

const SUMMARY_BY_AGENT: Record<string, string> = {
  _parse:         "Parsed the user story into a structured build plan with entities, endpoints, and background jobs.",
  technology:     "Resolved final technology stack from your saved configuration.",
  backend_api:    "Generated REST routes, request validation, and controller logic.",
  db:             "Generated schema migration and indexes for the core entities.",
  business_logic: "Implemented core domain rules and validation logic.",
  middleware:     "Wired authentication and request-processing middleware.",
  logging:        "Configured structured logging per your selected provider.",
  exceptions:     "Wired exception tracking and error capture hooks.",
  cache:          "Configured caching layer per your selected store.",
  mock:           "Generated seed/mock data for local development.",
  unit_test:      "Ran unit tests — 12 passed, 0 failed.",
  api_test:       "Ran API contract tests — 8 passed, 0 failed.",
  swagger:        "Generated OpenAPI specification from the route definitions.",
  qa_deployment:  "Prepared staging deployment configuration.",
  defect_report:  "Completed QA pass — 1 minor defect found.",
  defect_fix:     "Patched the defect found in QA and re-validated.",
  uat_deployment: "Deployed to staging and prepared for UAT sign-off.",
};

export function mockStepOutput(agentName: string, story: string): { summary: string; files?: GeneratedFile[] } {
  const files = FILES_BY_AGENT[agentName]?.(story);
  return { summary: SUMMARY_BY_AGENT[agentName] ?? "Step completed.", files };
}

// ── Storage helpers ──────────────────────────────────────────────────────
const WORKFLOWS_KEY  = "ea360_workflows_v2";
const EXECUTIONS_KEY = "ea360_executions_v2";

export const loadWorkflows  = (): Workflow[]  => { try { return JSON.parse(localStorage.getItem(WORKFLOWS_KEY) || "[]"); } catch { return []; } };
export const saveWorkflows  = (w: Workflow[]) => localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(w));
export const loadExecutions = (): Execution[] => { try { return JSON.parse(localStorage.getItem(EXECUTIONS_KEY) || "[]"); } catch { return []; } };
export const saveExecutions = (e: Execution[]) => localStorage.setItem(EXECUTIONS_KEY, JSON.stringify(e));

export function defaultSteps(): StepRow[] {
  return ALL_AGENTS.map(a => ({ agent_name: a, enabled: true, requires_approval: true }));
}
