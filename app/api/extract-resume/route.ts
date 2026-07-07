import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const GEMINI_KEY    = process.env.GEMINI_API_KEY
  || Buffer.from('QUl6YVN5Qi1JdUNLelJPSXpkSDNxdnBqeUtjWjVZMTdMRm9xVjQ=', 'base64').toString('utf-8');

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'];

const SCHEMA = `Return ONLY valid JSON — no markdown, no code blocks, no explanation.

{
  "name": "Full Name",
  "headline": "Short headline e.g. 'CBSE Maths Teacher · 8 years · Bengaluru'",
  "contact": { "phone": "", "email": "", "city": "" },
  "summary": "2-3 sentence professional summary (compose one if absent)",
  "experience": [
    { "title": "Job Title", "org": "Organisation", "period": "Jan 2020 – Dec 2023", "bullets": ["Achievement 1"] }
  ],
  "education": [
    { "degree": "M.Sc Mathematics", "institution": "University", "year": "2016" }
  ],
  "skills": ["Skill 1"],
  "certifications": ["Cert 1"],
  "experience_years": 5,
  "salary_min": 50000,
  "salary_max": 80000,
  "job_type_preference": "fulltime",
  "subjects": ["Subject 1"],
  "qualifications": ["Degree 1"]
}

Salary rules (INR/month, estimate if not stated):
0-2 yr → 25000-50000 | 3-5 yr → 50000-100000 | 5-8 yr → 80000-140000 | 8+ yr → 120000-200000`;

const PROMPT_TEXT = `You are a professional resume parser for the Indian job market. Extract ALL information from the provided resume.\n\n${SCHEMA}`;

// ── Claude (Anthropic) ────────────────────────────────────────────────────────
async function callClaude(content: any[]): Promise<any> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content }],
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!resp.ok) throw new Error(`Claude: ${resp.status} ${await resp.text()}`);
  const result = await resp.json();
  const raw = result.content?.[0]?.text || '';
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude: no JSON in response');
  return JSON.parse(match[0]);
}

// ── Gemini (Google) ───────────────────────────────────────────────────────────
async function callGemini(parts: any[]): Promise<any> {
  let lastErr = '';
  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!resp.ok) throw new Error(`Gemini ${model}: ${resp.status}`);
      const json = await resp.json();
      const raw = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Gemini: no JSON in response');
      return JSON.parse(match[0]);
    } catch (e: any) {
      lastErr = e.message;
    }
  }
  throw new Error(`Gemini all models failed: ${lastErr}`);
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();
  const mime: string = body.mimeType || '';
  const isFile = !!(body.fileBase64 && mime);
  const isPdf  = isFile && mime === 'application/pdf';
  const isImg  = isFile && mime.startsWith('image/');
  const isText = !!body.text?.trim();

  if (!isFile && !isText) {
    return NextResponse.json({ success: false, error: 'Provide text or fileBase64+mimeType' }, { status: 400 });
  }

  // Build Claude content blocks
  const buildClaudeContent = (): any[] => {
    if (isPdf)  return [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: body.fileBase64 } }, { type: 'text', text: PROMPT_TEXT }];
    if (isImg)  return [{ type: 'image',    source: { type: 'base64', media_type: mime,               data: body.fileBase64 } }, { type: 'text', text: PROMPT_TEXT }];
    return [{ type: 'text', text: `${PROMPT_TEXT}\n\nResume text:\n${body.text.trim().slice(0, 8000)}` }];
  };

  // Build Gemini parts
  const buildGeminiParts = (): any[] => {
    if (isFile) return [{ inlineData: { mimeType: mime, data: body.fileBase64 } }, { text: PROMPT_TEXT }];
    return [{ text: `${PROMPT_TEXT}\n\nResume text:\n${body.text.trim().slice(0, 8000)}` }];
  };

  if (ANTHROPIC_KEY) {
    try {
      const data = await callClaude(buildClaudeContent());
      return NextResponse.json({ success: true, data, provider: 'claude' });
    } catch (e: any) {
      console.warn('Claude failed, falling back to Gemini:', e.message);
    }
  }

  try {
    const data = await callGemini(buildGeminiParts());
    return NextResponse.json({ success: true, data, provider: 'gemini' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: `Both AI providers failed: ${e.message}` }, { status: 502 });
  }
}
