import { NextRequest, NextResponse } from 'next/server';

const stripBOM = (s: string) => s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
const ANTHROPIC_KEY    = stripBOM(process.env.ANTHROPIC_API_KEY || '');
const GEMINI_KEY       = stripBOM(process.env.GEMINI_API_KEY || '');
const AZURE_KEY        = stripBOM(process.env.AZURE_OPENAI_KEY || '');
const AZURE_ENDPOINT   = stripBOM(process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/$/, '');
const AZURE_DEPLOYMENT = stripBOM(process.env.AZURE_DEPLOYMENT_NAME || 'gpt-4o');
const OPENAI_KEY       = stripBOM(process.env.OPENAI_API_KEY || '');

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];

function buildPrompt(question: string, answer: string, technology: string, role: string, difficulty: string): string {
  return `You are a senior technical interviewer evaluating a candidate for a "${role}" position.
Technology focus: ${technology} | Difficulty: ${difficulty}

QUESTION ASKED:
"${question}"

CANDIDATE'S ANSWER:
"${answer}"

Evaluate the answer. Return ONLY valid JSON (no markdown, no code blocks):
{
  "relevance": <integer 1-10, did they answer what was asked>,
  "depth": <integer 1-10, technical accuracy depth and examples>,
  "communication": <integer 1-10, clarity structure conciseness>,
  "overall": <integer 1-10, holistic rating>,
  "feedback": "<2-3 sentence personalised coaching — cite specifics from their answer>",
  "strengths": ["<specific strength from their answer>", "<another strength>"],
  "improvements": ["<specific gap to address>", "<another improvement>"]
}

Scoring guide: 1-3 = poor/off-topic, 4-6 = partial/basic, 7-8 = solid/correct, 9-10 = exceptional/insightful.
If answer is blank or very short, score 1-3 and explain what a strong answer should cover.`;
}

function extractJson(raw: string): any {
  const md = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (md) { try { return JSON.parse(md[1]); } catch {} }
  const brace = raw.match(/\{[\s\S]*\}/);
  if (brace) { try { return JSON.parse(brace[0]); } catch {} }
  try { return JSON.parse(raw.trim()); } catch {}
  throw new Error('No valid JSON found');
}

async function callClaude(prompt: string): Promise<any> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(20000),
  });
  if (!resp.ok) throw new Error(`Claude ${resp.status}`);
  return extractJson((await resp.json()).content?.[0]?.text || '');
}

async function callOpenAICompat({ apiUrl, authHeader, model, prompt }: { apiUrl: string; authHeader: Record<string, string>; model: string; prompt: string }): Promise<any> {
  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 1000, temperature: 0.3 }),
    signal: AbortSignal.timeout(18000),
  });
  if (!resp.ok) throw new Error(`${resp.status}`);
  return extractJson((await resp.json()).choices?.[0]?.message?.content || '');
}

async function callGemini(prompt: string): Promise<any> {
  const errors: string[] = [];
  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 1000 } }),
        signal: AbortSignal.timeout(20000),
      });
      if (!resp.ok) throw new Error(`${model} ${resp.status}`);
      const raw = (await resp.json()).candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!raw) throw new Error(`${model}: empty`);
      return extractJson(raw);
    } catch (e: any) { errors.push(e.message); }
  }
  throw new Error(`Gemini failed: ${errors.join(' | ')}`);
}

async function cascade(prompt: string): Promise<{ data: any; provider: string }> {
  const errors: string[] = [];
  const ok = (d: any) => typeof d?.overall === 'number' && d.overall >= 1;

  if (ANTHROPIC_KEY) {
    try { const d = await callClaude(prompt); if (ok(d)) return { data: d, provider: 'claude' }; } catch (e: any) { errors.push(`claude: ${e.message}`); }
  }
  if (AZURE_KEY && AZURE_ENDPOINT) {
    try {
      const url = `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=2024-02-01`;
      const d = await callOpenAICompat({ apiUrl: url, authHeader: { 'api-key': AZURE_KEY }, model: AZURE_DEPLOYMENT, prompt });
      if (ok(d)) return { data: d, provider: 'azure' };
    } catch (e: any) { errors.push(`azure: ${e.message}`); }
  }
  if (OPENAI_KEY) {
    try {
      const d = await callOpenAICompat({ apiUrl: 'https://api.openai.com/v1/chat/completions', authHeader: { 'Authorization': `Bearer ${OPENAI_KEY}` }, model: 'gpt-4o-mini', prompt });
      if (ok(d)) return { data: d, provider: 'openai' };
    } catch (e: any) { errors.push(`openai: ${e.message}`); }
  }
  if (GEMINI_KEY) {
    try {
      const d = await callGemini(prompt);
      if (ok(d)) return { data: d, provider: 'gemini' };
    } catch (e: any) { errors.push(`gemini: ${e.message}`); }
  }
  throw new Error(`All providers failed: ${errors.join(' | ')}`);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const question: string   = (body.question || '').trim();
  const answer: string     = (body.answer || '').trim();
  const technology: string = (body.technology || '').trim();
  const role: string       = (body.role || '').trim();
  const difficulty: string = body.difficulty || 'Medium';

  if (!question || !technology || !role) {
    return NextResponse.json({ success: false, error: 'question, technology and role are required' }, { status: 400 });
  }

  const prompt = buildPrompt(question, answer || '[No answer provided]', technology, role, difficulty);

  try {
    const { data, provider } = await cascade(prompt);
    return NextResponse.json({
      success: true,
      relevance:      Math.min(10, Math.max(1, Math.round(data.relevance))),
      depth:          Math.min(10, Math.max(1, Math.round(data.depth))),
      communication:  Math.min(10, Math.max(1, Math.round(data.communication))),
      overall:        Math.min(10, Math.max(1, Math.round(data.overall))),
      feedback:       data.feedback || '',
      strengths:      Array.isArray(data.strengths)    ? data.strengths.slice(0, 3)    : [],
      improvements:   Array.isArray(data.improvements) ? data.improvements.slice(0, 3) : [],
      provider,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 502 });
  }
}
