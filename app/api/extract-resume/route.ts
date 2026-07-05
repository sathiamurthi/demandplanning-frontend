import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ success: false, error: 'AI not configured' }, { status: 503 });
  }

  const { text } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ success: false, error: 'Resume text required' }, { status: 400 });
  }

  const prompt = `Extract structured information from this resume text. Return ONLY valid JSON, no markdown, no explanation.

Resume:
${text.trim().slice(0, 6000)}

Return this exact JSON structure:
{
  "name": "full name",
  "headline": "short professional headline (e.g. Maths Teacher · 8 years · CBSE)",
  "qualifications": ["B.Ed", "M.Sc Mathematics"],
  "subjects": ["Mathematics", "Physics"],
  "skills": ["CBSE Curriculum", "Online Teaching", "Result Analytics"],
  "experience_years": 8,
  "experience_summary": "2-3 sentence professional summary",
  "salary_min": 45000,
  "salary_max": 65000
}

Rules:
- salary_min and salary_max in INR per month (estimate from experience/level if not stated)
- experience_years as integer
- qualifications: degrees and certifications only
- subjects: teaching subjects OR technical skills domain
- skills: specific tools, methods, platforms
- If any field is not found, use empty string or 0`;

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
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return NextResponse.json({ success: false, error: err }, { status: 502 });
    }

    const result = await resp.json();
    const raw = result.content?.[0]?.text || '';

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ success: false, error: 'No JSON in response' }, { status: 502 });
    }

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
