import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const PROMPT = `You are a professional resume parser for the Indian job market. Extract ALL information from the provided resume.

Return ONLY valid JSON — no markdown, no code blocks, no explanation.

{
  "name": "Full Name",
  "headline": "Short headline e.g. 'CBSE Maths Teacher · 8 years · Bengaluru'",
  "contact": { "phone": "", "email": "", "city": "" },
  "summary": "2-3 sentence professional summary (compose one if absent)",
  "experience": [
    { "title": "Job Title", "org": "Organisation", "period": "Jan 2020 – Dec 2023", "bullets": ["Achievement 1"] }
  ],
  "education": [
    { "degree": "M.Sc Mathematics", "institution": "University Name", "year": "2016" }
  ],
  "skills": ["Skill 1", "Skill 2"],
  "certifications": ["Cert 1"],
  "experience_years": 5,
  "salary_min": 50000,
  "salary_max": 80000,
  "job_type_preference": "fulltime",
  "subjects": ["Subject 1"],
  "qualifications": ["Degree 1", "Cert 1"]
}

Salary rules (INR/month, estimate if not stated):
0-2 yr → 25000-50000 | 3-5 yr → 50000-100000 | 5-8 yr → 80000-140000 | 8+ yr → 120000-200000`;

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ success: false, error: 'AI not configured — add ANTHROPIC_API_KEY to Vercel env vars' }, { status: 503 });
  }

  const body = await req.json();
  let content: any[];

  if (body.fileBase64 && body.mimeType === 'application/pdf') {
    content = [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: body.fileBase64 } },
      { type: 'text', text: PROMPT },
    ];
  } else if (body.text?.trim()) {
    content = [{ type: 'text', text: `${PROMPT}\n\nResume text:\n${body.text.trim().slice(0, 8000)}` }];
  } else {
    return NextResponse.json({ success: false, error: 'Provide text or fileBase64+mimeType' }, { status: 400 });
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content }],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!resp.ok) {
      return NextResponse.json({ success: false, error: await resp.text() }, { status: 502 });
    }

    const result = await resp.json();
    const raw = result.content?.[0]?.text || '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ success: false, error: 'No JSON in AI response' }, { status: 502 });

    return NextResponse.json({ success: true, data: JSON.parse(match[0]) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
