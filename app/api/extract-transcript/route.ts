import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_KEY    = process.env.ANTHROPIC_API_KEY || '';
const GEMINI_KEY       = process.env.GEMINI_API_KEY
  || Buffer.from('QUl6YVN5Qi1JdUNLelJPSXpkSDNxdnBqeUtjWjVZMTdMRm9xVjQ=', 'base64').toString('utf-8');
const AZURE_KEY        = process.env.AZURE_OPENAI_KEY || '';
const AZURE_ENDPOINT   = (process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/$/, '');
const AZURE_DEPLOYMENT = process.env.AZURE_DEPLOYMENT_NAME || 'gpt-4o';
const OPENAI_KEY       = process.env.OPENAI_API_KEY || '';

const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash-8b',
];

const SCHEMA = `Return ONLY valid JSON — no markdown, no code blocks, no explanation.

{
  "name": "Student Full Name",
  "dob": "2008-01-15",
  "board": "CBSE / ICSE / State Board / IB / IGCSE",
  "class_or_year": "Class 10 / Class 12 / 1st Year / Final Year",
  "stream": "Science / Commerce / Arts / General / Engineering / Medical",
  "subjects": [
    { "name": "Mathematics", "marks": 95, "max_marks": 100, "grade": "A1" }
  ],
  "percentage": 91.2,
  "cgpa": null,
  "year_of_passing": 2024,
  "school_name": "School or College Name",
  "contact": { "email": "", "phone": "", "city": "" },
  "seeking": ["B.Tech Engineering", "MBBS Medical", "B.Com Commerce"],
  "preferred_cities": ["Bangalore", "Mumbai", "Delhi"],
  "strengths": ["Mathematics", "Physics"],
  "extracurriculars": ["Cricket captain", "NSS volunteer"],
  "achievements": ["School topper 2024", "District science olympiad winner"],
  "profile_headline": "Short headline e.g. 'CBSE Class 12 Science · 92% · Aspiring Engineer · Bengaluru'"
}

Rules:
- percentage: calculate from marks/max if not stated, else null
- cgpa: if marks are on 10-point scale, fill this instead
- seeking: infer 2-3 realistic program aspirations from stream and marks
- If any field is missing from the document, set it to null or []`;

const PROMPT = `You are an academic transcript parser for Indian students. Extract ALL information from the provided marksheet or document.\n\n${SCHEMA}`;

// ── JSON extractor ─────────────────────────────────────────────────────────────
function extractJson(raw: string): any {
  const mdMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (mdMatch) {
    try { return JSON.parse(mdMatch[1]); } catch {}
  }
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try { return JSON.parse(braceMatch[0]); } catch {}
  }
  try { return JSON.parse(raw.trim()); } catch {}
  throw new Error('No valid JSON found in response');
}

// ── Claude (Anthropic) ─────────────────────────────────────────────────────────
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
    signal: AbortSignal.timeout(40000),
  });
  if (!resp.ok) throw new Error(`Claude ${resp.status}: ${await resp.text()}`);
  const result = await resp.json();
  const raw = result.content?.[0]?.text || '';
  return extractJson(raw);
}

// ── Gemini (Google) ────────────────────────────────────────────────────────────
async function callGemini(parts: any[], isFile: boolean): Promise<any> {
  const errors: string[] = [];
  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
      const generationConfig: Record<string, any> = { temperature: 0.1, maxOutputTokens: 2048 };
      if (!isFile) generationConfig.responseMimeType = 'application/json';

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }], generationConfig }),
        signal: AbortSignal.timeout(40000),
      });
      if (!resp.ok) {
        const errText = await resp.text().catch(() => `${resp.status}`);
        throw new Error(`${model} ${resp.status}: ${errText.slice(0, 200)}`);
      }
      const json = await resp.json();
      const raw = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!raw) throw new Error(`${model}: empty response`);
      return extractJson(raw);
    } catch (e: any) {
      errors.push(e.message);
    }
  }
  throw new Error(`Gemini failed — ${errors.join(' | ')}`);
}

// ── Azure OpenAI / OpenAI ──────────────────────────────────────────────────────
async function callOpenAICompat({ apiUrl, authHeader, model, prompt, isImg, fileBase64, mime }: {
  apiUrl: string; authHeader: Record<string,string>; model: string;
  prompt: string; isImg: boolean; fileBase64?: string; mime?: string;
}): Promise<any> {
  const content: any[] = isImg && fileBase64 && mime
    ? [{ type: 'image_url', image_url: { url: `data:${mime};base64,${fileBase64}`, detail: 'high' } },
       { type: 'text', text: prompt }]
    : [{ type: 'text', text: prompt }];
  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({ model, messages: [{ role: 'user', content }], max_tokens: 2048, temperature: 0.1, response_format: { type: 'json_object' } }),
    signal: AbortSignal.timeout(30000),
  });
  if (!resp.ok) throw new Error(`${resp.status}: ${(await resp.text().catch(()=>'')).slice(0,200)}`);
  const json = await resp.json();
  const raw  = json.choices?.[0]?.message?.content || '';
  if (!raw) throw new Error('Empty response');
  return extractJson(raw);
}

async function callAzure(prompt: string, isImg: boolean, fileBase64?: string, mime?: string): Promise<any> {
  if (!AZURE_KEY || !AZURE_ENDPOINT) throw new Error('Azure not configured');
  const url = `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=2024-02-01`;
  return callOpenAICompat({ apiUrl: url, authHeader: { 'api-key': AZURE_KEY }, model: AZURE_DEPLOYMENT, prompt, isImg, fileBase64, mime });
}

async function callOpenAI(prompt: string, isImg: boolean, fileBase64?: string, mime?: string): Promise<any> {
  if (!OPENAI_KEY) throw new Error('OpenAI not configured');
  return callOpenAICompat({ apiUrl: 'https://api.openai.com/v1/chat/completions', authHeader: { 'Authorization': `Bearer ${OPENAI_KEY}` }, model: 'gpt-4o-mini', prompt, isImg, fileBase64, mime });
}

// ── Route handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();
  const mime: string = body.mimeType || '';
  const isFile       = !!(body.fileBase64 && mime);
  const isPdf        = isFile && mime === 'application/pdf';
  const isImg        = isFile && mime.startsWith('image/');
  const isText       = !!body.text?.trim();

  if (!isFile && !isText) {
    return NextResponse.json({ success: false, error: 'Provide text or fileBase64+mimeType' }, { status: 400 });
  }

  const buildClaudeContent = (): any[] => {
    if (isPdf) return [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: body.fileBase64 } }, { type: 'text', text: PROMPT }];
    if (isImg) return [{ type: 'image',    source: { type: 'base64', media_type: mime,               data: body.fileBase64 } }, { type: 'text', text: PROMPT }];
    return [{ type: 'text', text: `${PROMPT}\n\nDocument text:\n${body.text.trim().slice(0, 8000)}` }];
  };

  const buildGeminiParts = (): any[] => {
    if (isFile) return [{ inlineData: { mimeType: mime, data: body.fileBase64 } }, { text: PROMPT }];
    return [{ text: `${PROMPT}\n\nDocument text:\n${body.text.trim().slice(0, 8000)}` }];
  };

  const claudeErrors: string[] = [];
  const azureErrors:  string[] = [];
  const openaiErrors: string[] = [];
  const geminiErrors: string[] = [];

  const textPrompt = `${PROMPT}\n\nDocument text:\n${(body.text || '').trim().slice(0, 8000)}`;

  // 1 — Claude (supports PDF + image + text)
  if (ANTHROPIC_KEY) {
    try {
      const data = await callClaude(buildClaudeContent());
      return NextResponse.json({ success: true, data, provider: 'claude' });
    } catch (e: any) {
      claudeErrors.push(e.message);
      console.warn('[extract-transcript] Claude failed:', e.message);
    }
  }

  // 2 — Azure OpenAI (image + text only; skips PDF)
  if (!isPdf && AZURE_KEY && AZURE_ENDPOINT) {
    try {
      const data = await callAzure(isText ? textPrompt : PROMPT, isImg, body.fileBase64, mime);
      return NextResponse.json({ success: true, data, provider: 'azure' });
    } catch (e: any) {
      azureErrors.push(e.message);
      console.warn('[extract-transcript] Azure failed:', e.message);
    }
  }

  // 3 — OpenAI fallback (image + text only; skips PDF)
  if (!isPdf && OPENAI_KEY) {
    try {
      const data = await callOpenAI(isText ? textPrompt : PROMPT, isImg, body.fileBase64, mime);
      return NextResponse.json({ success: true, data, provider: 'openai' });
    } catch (e: any) {
      openaiErrors.push(e.message);
      console.warn('[extract-transcript] OpenAI failed:', e.message);
    }
  }

  // 4 — Gemini (supports PDF + image + text)
  try {
    const data = await callGemini(buildGeminiParts(), isFile);
    return NextResponse.json({ success: true, data, provider: 'gemini' });
  } catch (e: any) {
    geminiErrors.push(e.message);
    console.error('[extract-transcript] Gemini failed:', e.message);
  }

  // 5 — Last-resort Claude retry
  if (ANTHROPIC_KEY) {
    try {
      const data = await callClaude(buildClaudeContent());
      return NextResponse.json({ success: true, data, provider: 'claude-retry' });
    } catch (e: any) {
      console.error('[extract-transcript] Claude retry failed:', e.message);
    }
  }

  return NextResponse.json(
    { success: false, error: `AI extraction failed. Claude: ${claudeErrors[0] || 'not configured'}. Azure: ${azureErrors[0] || (isPdf ? 'skipped (PDF)' : 'not configured')}. OpenAI: ${openaiErrors[0] || (isPdf ? 'skipped (PDF)' : 'not configured')}. Gemini: ${geminiErrors[0] || 'not tried'}.` },
    { status: 502 }
  );
}
