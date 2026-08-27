import { NextRequest, NextResponse } from 'next/server';

const stripBOM = (s: string) => s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
const ANTHROPIC_KEY    = stripBOM(process.env.ANTHROPIC_API_KEY || '');
const GEMINI_KEY       = stripBOM(process.env.GEMINI_API_KEY || '');
const AZURE_KEY        = stripBOM(process.env.AZURE_OPENAI_KEY || '');
const AZURE_ENDPOINT   = stripBOM(process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/$/, '');
const AZURE_DEPLOYMENT = stripBOM(process.env.AZURE_DEPLOYMENT_NAME || 'gpt-4o');
const OPENAI_KEY       = stripBOM(process.env.OPENAI_API_KEY || '');

// Most reliable models first
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-3.6-flash',
  'gemini-3.6-flash-8b',
  'gemini-3.6-flash',
];

function buildPrompt(technology: string, role: string, difficulty: string, count: number): string {
  return `You are a senior technical interviewer preparing candidates for ${role} positions.

Generate exactly ${count} interview questions with model answers for:
- Technology: ${technology}
- Role: ${role}
- Difficulty: ${difficulty}

Return ONLY valid JSON (no markdown, no code blocks, no explanation):
{
  "questions": [
    {
      "q": "Question text here?",
      "a": "Model answer (2-5 sentences, specific, practical, interview-ready)"
    }
  ]
}

Difficulty guidelines:
- Easy: fundamentals, basic syntax, common patterns, definitions
- Medium: practical application, debugging scenarios, design choices, trade-offs
- Hard: system design, performance, edge cases, architecture decisions, deep internals

Mix question types: conceptual (30%), practical/coding (40%), behavioral/scenario (30%).
All questions must be specific to "${technology}" in the context of a "${role}" interview.
Answers should sound like what a strong candidate would say — not textbook definitions.`;
}

function extractJson(raw: string): any {
  const mdMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (mdMatch) { try { return JSON.parse(mdMatch[1]); } catch {} }
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) { try { return JSON.parse(braceMatch[0]); } catch {} }
  try { return JSON.parse(raw.trim()); } catch {}
  throw new Error('No valid JSON found in response');
}

async function callClaude(prompt: string): Promise<any> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!resp.ok) throw new Error(`Claude ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const raw = (await resp.json()).content?.[0]?.text || '';
  return extractJson(raw);
}

async function callOpenAICompat({ apiUrl, authHeader, model, prompt }: {
  apiUrl: string; authHeader: Record<string, string>; model: string; prompt: string;
}): Promise<any> {
  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(18000),
  });
  if (!resp.ok) throw new Error(`${resp.status}: ${(await resp.text().catch(() => '')).slice(0, 200)}`);
  const raw = (await resp.json()).choices?.[0]?.message?.content || '';
  if (!raw) throw new Error('Empty response');
  return extractJson(raw);
}

async function callAzure(prompt: string): Promise<any> {
  if (!AZURE_KEY || !AZURE_ENDPOINT) throw new Error('Azure not configured');
  const url = `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=2024-02-01`;
  return callOpenAICompat({ apiUrl: url, authHeader: { 'api-key': AZURE_KEY }, model: AZURE_DEPLOYMENT, prompt });
}

async function callOpenAI(prompt: string): Promise<any> {
  if (!OPENAI_KEY) throw new Error('OpenAI not configured');
  return callOpenAICompat({ apiUrl: 'https://api.openai.com/v1/chat/completions', authHeader: { 'Authorization': `Bearer ${OPENAI_KEY}` }, model: 'gpt-4o-mini', prompt });
}

async function callGemini(prompt: string): Promise<any> {
  const errors: string[] = [];
  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 3000 },
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!resp.ok) {
        const t = await resp.text().catch(() => `${resp.status}`);
        throw new Error(`${model} ${resp.status}: ${t.slice(0, 200)}`);
      }
      const raw = (await resp.json()).candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!raw) throw new Error(`${model}: empty response`);
      return extractJson(raw);
    } catch (e: any) {
      errors.push(e.message);
    }
  }
  throw new Error(`Gemini failed — ${errors.join(' | ')}`);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const technology: string = (body.technology || '').trim();
  const role: string       = (body.role || '').trim();
  const difficulty: string = body.difficulty || 'Medium';
  const count: number      = Math.min(Math.max(parseInt(body.count) || 10, 5), 20);

  if (!technology || !role) {
    return NextResponse.json({ success: false, error: 'technology and role are required' }, { status: 400 });
  }

  const prompt = buildPrompt(technology, role, difficulty, count);
  const providerErrors: string[] = [];

  // 1 — Claude
  if (ANTHROPIC_KEY) {
    try {
      const data = await callClaude(prompt);
      if (data?.questions?.length) return NextResponse.json({ success: true, questions: data.questions, provider: 'claude' });
      providerErrors.push('claude: empty questions array');
    } catch (e: any) {
      providerErrors.push(`claude: ${e.message}`);
      console.warn('[interview-questions] Claude failed:', e.message);
    }
  } else {
    providerErrors.push('claude: not configured (ANTHROPIC_API_KEY missing)');
  }

  // 2 — Azure
  if (AZURE_KEY && AZURE_ENDPOINT) {
    try {
      const data = await callAzure(prompt);
      if (data?.questions?.length) return NextResponse.json({ success: true, questions: data.questions, provider: 'azure' });
      providerErrors.push('azure: empty questions array');
    } catch (e: any) {
      providerErrors.push(`azure: ${e.message}`);
      console.warn('[interview-questions] Azure failed:', e.message);
    }
  } else {
    providerErrors.push('azure: not configured');
  }

  // 3 — OpenAI
  if (OPENAI_KEY) {
    try {
      const data = await callOpenAI(prompt);
      if (data?.questions?.length) return NextResponse.json({ success: true, questions: data.questions, provider: 'openai' });
      providerErrors.push('openai: empty questions array');
    } catch (e: any) {
      providerErrors.push(`openai: ${e.message}`);
      console.warn('[interview-questions] OpenAI failed:', e.message);
    }
  } else {
    providerErrors.push('openai: not configured');
  }

  // 4 — Gemini
  if (GEMINI_KEY) {
    try {
      const data = await callGemini(prompt);
      if (data?.questions?.length) return NextResponse.json({ success: true, questions: data.questions, provider: 'gemini' });
      providerErrors.push('gemini: empty questions array');
    } catch (e: any) {
      providerErrors.push(`gemini: ${e.message}`);
      console.error('[interview-questions] Gemini failed:', e.message);
    }
  } else {
    providerErrors.push('gemini: not configured (GEMINI_API_KEY missing)');
  }

  // 5 — Claude retry
  if (ANTHROPIC_KEY) {
    try {
      const data = await callClaude(prompt);
      if (data?.questions?.length) return NextResponse.json({ success: true, questions: data.questions, provider: 'claude-retry' });
    } catch (e: any) {
      providerErrors.push(`claude-retry: ${e.message}`);
      console.error('[interview-questions] Claude retry failed:', e.message);
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: 'All AI providers failed. Please try again in a moment.',
      details: providerErrors,
    },
    { status: 502 }
  );
}
