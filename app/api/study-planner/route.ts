import { NextRequest, NextResponse } from 'next/server';

const stripBOM = (s: string) => s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
const ANTHROPIC_KEY    = stripBOM(process.env.ANTHROPIC_API_KEY || '');
const GEMINI_KEY       = stripBOM(process.env.GEMINI_API_KEY || '');
const AZURE_KEY        = stripBOM(process.env.AZURE_OPENAI_KEY || '');
const AZURE_ENDPOINT   = stripBOM(process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/$/, '');
const AZURE_DEPLOYMENT = stripBOM(process.env.AZURE_DEPLOYMENT_NAME || 'gpt-4o');
const OPENAI_KEY       = stripBOM(process.env.OPENAI_API_KEY || '');

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-8b'];

function buildPrompt(goal: string, technology: string, currentLevel: string, hoursPerWeek: number, weeks: number): string {
  const dailyHours = Math.max(1, Math.floor(hoursPerWeek / 5));
  return `Create a structured ${weeks}-week study plan for:
- Goal: ${goal}
- Technology/Domain: ${technology}
- Current Level: ${currentLevel}
- Available: ${hoursPerWeek} hours/week (≈${dailyHours}h/day on weekdays)

Return ONLY valid JSON (no markdown, no code blocks):
{
  "plan": {
    "weeks": [
      {
        "week": 1,
        "focus": "Week theme in 5 words max",
        "days": [
          { "day": "Monday", "topic": "Specific topic", "tasks": ["Actionable task 1", "Actionable task 2"], "resource": "Book/course/tool name" },
          { "day": "Tuesday", "topic": "Specific topic", "tasks": ["Task 1", "Task 2"], "resource": "Resource" },
          { "day": "Wednesday", "topic": "Specific topic", "tasks": ["Task 1", "Task 2"], "resource": "Resource" },
          { "day": "Thursday", "topic": "Specific topic", "tasks": ["Task 1", "Task 2"], "resource": "Resource" },
          { "day": "Friday", "topic": "Specific topic", "tasks": ["Task 1", "Task 2"], "resource": "Resource" }
        ]
      }
    ]
  }
}

Generate exactly ${weeks} weeks. Topics must be specific to "${technology}" at "${currentLevel}" level. Tasks must be concrete and achievable in ${dailyHours} hours.`;
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
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(20000),
  });
  if (!resp.ok) throw new Error(`Claude ${resp.status}`);
  return extractJson((await resp.json()).content?.[0]?.text || '');
}

async function callOpenAICompat({ apiUrl, authHeader, model, prompt }: { apiUrl: string; authHeader: Record<string, string>; model: string; prompt: string }): Promise<any> {
  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 4000, temperature: 0.3 }),
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
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 4000 } }),
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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const goal: string         = (body.goal || '').trim();
  const technology: string   = (body.technology || '').trim();
  const currentLevel: string = body.currentLevel || 'beginner';
  const hoursPerWeek: number = Math.min(Math.max(parseInt(body.hoursPerWeek) || 10, 3), 40);
  const weeks: number        = Math.min(Math.max(parseInt(body.weeks) || 4, 1), 12);

  if (!goal || !technology) {
    return NextResponse.json({ success: false, error: 'goal and technology are required' }, { status: 400 });
  }

  const prompt = buildPrompt(goal, technology, currentLevel, hoursPerWeek, weeks);
  const errors: string[] = [];

  if (ANTHROPIC_KEY) {
    try {
      const data = await callClaude(prompt);
      if (data?.plan?.weeks?.length) return NextResponse.json({ success: true, plan: data.plan, provider: 'claude' });
      errors.push('claude: empty plan');
    } catch (e: any) { errors.push(`claude: ${e.message}`); }
  }

  if (AZURE_KEY && AZURE_ENDPOINT) {
    try {
      const url = `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=2024-02-01`;
      const data = await callOpenAICompat({ apiUrl: url, authHeader: { 'api-key': AZURE_KEY }, model: AZURE_DEPLOYMENT, prompt });
      if (data?.plan?.weeks?.length) return NextResponse.json({ success: true, plan: data.plan, provider: 'azure' });
      errors.push('azure: empty plan');
    } catch (e: any) { errors.push(`azure: ${e.message}`); }
  }

  if (OPENAI_KEY) {
    try {
      const data = await callOpenAICompat({ apiUrl: 'https://api.openai.com/v1/chat/completions', authHeader: { 'Authorization': `Bearer ${OPENAI_KEY}` }, model: 'gpt-4o-mini', prompt });
      if (data?.plan?.weeks?.length) return NextResponse.json({ success: true, plan: data.plan, provider: 'openai' });
      errors.push('openai: empty plan');
    } catch (e: any) { errors.push(`openai: ${e.message}`); }
  }

  if (GEMINI_KEY) {
    try {
      const data = await callGemini(prompt);
      if (data?.plan?.weeks?.length) return NextResponse.json({ success: true, plan: data.plan, provider: 'gemini' });
      errors.push('gemini: empty plan');
    } catch (e: any) { errors.push(`gemini: ${e.message}`); }
  } else {
    errors.push('gemini: not configured');
  }

  return NextResponse.json({ success: false, error: 'All AI providers failed.', details: errors }, { status: 502 });
}
