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

function buildPrompt(type: string, name: string, city?: string): string {
  const loc = city ? ` in ${city}` : ' in India';

  if (type === 'college') {
    return `You are a research assistant. Based on your knowledge, extract information about the college or university named "${name}"${loc}.

Return ONLY valid JSON with these fields (use null for unknown fields, empty array [] for unknown lists):
{
  "name": "Full official name of the institution",
  "city": "City",
  "state": "State",
  "website": "Official website URL or null",
  "description": "2-3 sentence description of the institution",
  "established_year": number or null,
  "college_type": "Engineering/Medical/Arts/Commerce/Deemed University/IIT/NIT/etc",
  "accreditation": "NAAC grade/NBA/NIRF rank or null",
  "programs": ["B.Tech", "MBA", "M.Tech", ...up to 8 programs],
  "ranking": "NIRF rank or other notable ranking or null",
  "placement_stats": "Average/highest package or placement % if known or null"
}

If the institution is not widely known, return reasonable generic fields based on the type and name. Do NOT refuse — always return valid JSON.`;
  }

  if (type === 'expert') {
    return `You are a professional profiler. Based on the name "${name}"${loc}, suggest a realistic expert profile for a professional on the College360 platform.

Return ONLY valid JSON:
{
  "designation": "Most common designation for this name/context (e.g. Senior Software Engineer, Product Manager)",
  "company": "Company name — use a realistic Indian company or MNC",
  "industry": "Industry sector (Tech/Finance/Healthcare/etc.)",
  "bio": "2-3 sentence professional bio in first person",
  "skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5"],
  "expertise_areas": ["Area1", "Area2", "Area3"],
  "years_experience": number between 3 and 20,
  "linkedin": null
}

Always return valid JSON.`;
  }

  if (type === 'training_center') {
    return `You are a research assistant. Extract or generate information about a training center named "${name}"${loc}.

Return ONLY valid JSON:
{
  "name": "Full name of the training center",
  "city": "${city || 'Bangalore'}",
  "state": "State",
  "website": "Website URL or null",
  "description": "2-3 sentence description of what this training center offers",
  "courses": ["Course1", "Course2", "Course3", "Course4", "Course5"],
  "certifications": ["Cert1", "Cert2"],
  "fee_range": "Fee range (e.g. ₹15,000 - ₹50,000) or null",
  "placement_support": true or false
}

Always return valid JSON.`;
  }

  throw new Error('Unknown type');
}

async function callClaude(prompt: string): Promise<any> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
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
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 1500 } }),
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
  const { type, name, city } = await req.json();

  if (!type || !name?.trim()) {
    return NextResponse.json({ success: false, error: 'type and name are required' }, { status: 400 });
  }
  if (!['college', 'expert', 'training_center'].includes(type)) {
    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  }

  const prompt = buildPrompt(type, name.trim(), city?.trim());

  if (ANTHROPIC_KEY) {
    try {
      const data = await callClaude(prompt);
      return NextResponse.json({ success: true, data, provider: 'claude' });
    } catch {}
  }

  if (GEMINI_KEY) {
    try {
      const data = await callGemini(prompt);
      return NextResponse.json({ success: true, data, provider: 'gemini' });
    } catch {}
  }

  return NextResponse.json({ success: false, error: 'AI enrichment unavailable' }, { status: 502 });
}
