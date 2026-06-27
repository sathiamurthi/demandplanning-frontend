import { NextRequest, NextResponse } from 'next/server';

// Server-side Overpass proxy — browser calls /api/overpass, Vercel calls overpass-api.de
// No CORS issues since this runs on Vercel's edge/serverless, not in the browser.
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

export async function POST(req: NextRequest) {
  const body = await req.text();

  for (const endpoint of ENDPOINTS) {
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(18000),
      });
      if (!resp.ok) continue;
      const data = await resp.text();
      return new NextResponse(data, {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    } catch {
      // try next endpoint
    }
  }

  // All endpoints failed — return empty result set so callers degrade gracefully
  return NextResponse.json({ elements: [] });
}
