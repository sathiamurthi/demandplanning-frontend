import { NextRequest, NextResponse } from 'next/server';

const stripBOM = (s: string) => s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
const ANTHROPIC_KEY = stripBOM(process.env.ANTHROPIC_API_KEY || '');
const GEMINI_KEY    = stripBOM(process.env.GEMINI_API_KEY || '');

function extractJson(raw: string): any {
  const md = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (md) { try { return JSON.parse(md[1]); } catch {} }
  const brace = raw.match(/\{[\s\S]*\}/);
  if (brace) { try { return JSON.parse(brace[0]); } catch {} }
  try { return JSON.parse(raw.trim()); } catch {}
  throw new Error('No valid JSON found');
}

function buildPrompt(topic: string, technology: string): string {
  return `You are a coding tutor. Generate a practical example for a student studying "${topic}" in ${technology || 'programming'}.

Return ONLY valid JSON (no markdown wrapper):
{
  "explanation": "One clear sentence explaining the concept",
  "code": "A concise, runnable code snippet (10-30 lines). Use real code, not pseudocode.",
  "language": "The programming language (e.g. python, javascript, java, sql, bash)",
  "practice": "One specific hands-on challenge the student can try right now"
}

Keep the code focused on the topic "${topic}". Make it beginner-friendly but realistic.`;
}

async function callClaude(prompt: string): Promise<any> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(15000),
  });
  if (!resp.ok) throw new Error(`Claude ${resp.status}`);
  return extractJson((await resp.json()).content?.[0]?.text || '');
}

async function callGemini(prompt: string): Promise<any> {
  for (const model of ['gemini-2.0-flash', 'gemini-1.5-flash']) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 1200 } }),
        signal: AbortSignal.timeout(15000),
      });
      if (!resp.ok) continue;
      const raw = (await resp.json()).candidates?.[0]?.content?.parts?.[0]?.text || '';
      return extractJson(raw);
    } catch {}
  }
  throw new Error('Gemini failed');
}

export async function POST(req: NextRequest) {
  const { topic, technology } = await req.json();
  if (!topic?.trim()) return NextResponse.json({ success: false, error: 'topic is required' }, { status: 400 });

  const prompt = buildPrompt(topic.trim(), (technology || '').trim());

  if (ANTHROPIC_KEY) {
    try {
      const data = await callClaude(prompt);
      if (data?.code) return NextResponse.json({ success: true, example: data });
    } catch {}
  }

  if (GEMINI_KEY) {
    try {
      const data = await callGemini(prompt);
      if (data?.code) return NextResponse.json({ success: true, example: data });
    } catch {}
  }

  return NextResponse.json({ success: false, error: 'AI unavailable' }, { status: 502 });
}
