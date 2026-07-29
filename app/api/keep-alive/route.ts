import { NextResponse } from "next/server";

const BACKEND = "https://demandplanning-backend.onrender.com";
const ENDPOINTS = ["/v1/health", "/v1/ping", "/"];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Verify it's called by Vercel Cron (not a random user hitting the endpoint)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, any> = {};
  const start = Date.now();

  for (const path of ENDPOINTS) {
    try {
      const t0 = Date.now();
      const r = await fetch(`${BACKEND}${path}`, {
        method: "GET",
        signal: AbortSignal.timeout(10_000),
        headers: { "User-Agent": "TeaFactory360-KeepAlive/1.0" },
        cache: "no-store",
      });
      results[path] = { status: r.status, ms: Date.now() - t0 };
      // If first endpoint replies, backend is awake — no need to hit more
      if (r.ok) break;
    } catch (e: any) {
      results[path] = { error: e.message };
    }
  }

  const totalMs = Date.now() - start;
  const awake = Object.values(results).some((r: any) => r.status && r.status < 500);

  console.log(`[keep-alive] backend=${awake ? "AWAKE" : "COLD"} ${totalMs}ms`, results);

  return NextResponse.json({
    ok: true,
    awake,
    backend: BACKEND,
    results,
    totalMs,
    ts: new Date().toISOString(),
  });
}
