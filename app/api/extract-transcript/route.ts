import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const GEMINI_KEY    = process.env.GEMINI_API_KEY
  || Buffer.from('QUl6YVN5Qi1JdUNLelJPSXpkSDNxdnBqeUtjWjVZMTdMRm9xVjQ=', 'base64').toString('utf-8');

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'];

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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const isPdf  = body.fileBase64 && body.mimeType === 'application/pdf';
  const isText = !!body.text?.trim();

  if (!isPdf && !isText) {
    return NextResponse.json({ success: false, error: 'Provide text or fileBase64+mimeType' }, { status: 400 });
  }

  if (ANTHROPIC_KEY) {
    try {
      const content: any[] = isPdf
        ? [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: body.fileBase64 } }, { type: 'text', text: PROMPT }]
        : [{ type: 'text', text: `${PROMPT}\n\nDocument text:\n${body.text.trim().slice(0, 8000)}` }];
      const data = await callClaude(content);
      return NextResponse.json({ success: true, data, provider: 'claude' });
    } catch (e: any) {
      console.warn('Claude failed, falling back to Gemini:', e.message);
    }
  }

  try {
    const parts: any[] = isPdf
      ? [{ inlineData: { mimeType: 'application/pdf', data: body.fileBase64 } }, { text: PROMPT }]
      : [{ text: `${PROMPT}\n\nDocument text:\n${body.text.trim().slice(0, 8000)}` }];
    const data = await callGemini(parts);
    return NextResponse.json({ success: true, data, provider: 'gemini' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: `Both AI providers failed: ${e.message}` }, { status: 502 });
  }
}
