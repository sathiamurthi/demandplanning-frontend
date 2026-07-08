import { NextRequest, NextResponse } from 'next/server';

const stripBOM = (s: string) => s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
const ANTHROPIC_KEY    = stripBOM(process.env.ANTHROPIC_API_KEY || '');
const GEMINI_KEY       = stripBOM(process.env.GEMINI_API_KEY || '');
const AZURE_KEY        = stripBOM(process.env.AZURE_OPENAI_KEY || '');
const AZURE_ENDPOINT   = stripBOM(process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/$/, '');
const AZURE_DEPLOYMENT = stripBOM(process.env.AZURE_DEPLOYMENT_NAME || 'gpt-4o');
const OPENAI_KEY       = stripBOM(process.env.OPENAI_API_KEY || '');

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];

function buildPrompt(type: string, collegeName: string, program: string, queries: string, userName: string, userEmail: string, recipientName: string, context: string): string {
  if (type === 'outreach') {
    const templates: Record<string, string> = {
      recruiter: 'a job/internship outreach message to a recruiter or hiring manager',
      mentor: 'a mentorship request message to an industry professional',
      collab: 'a collaboration request message to a peer or professional',
    };
    const templateDesc = templates[program] || 'a professional outreach message';
    return `Write ${templateDesc} from ${userName} to ${recipientName || 'the recipient'}.
Context about this outreach: ${context || queries}

Return ONLY valid JSON (no markdown):
{
  "draft": "Full message body — 3-4 paragraphs, warm but professional, highly specific to the context, ends with a clear single call-to-action. Do NOT include a subject line.",
  "subject": "Suggested email subject line"
}

Rules: Avoid generic phrases like 'I hope this message finds you well'. Be specific, authentic, concise. Show genuine value or fit.`;
  }

  return `Draft a professional college enquiry email from a student named "${userName}" (${userEmail}) to "${collegeName}" about the "${program}" program.

The student's questions/queries:
${queries}

Return ONLY valid JSON (no markdown):
{
  "subject": "Professional email subject line",
  "draftEmail": "Full formal email body including: formal greeting to Admissions Team, clear numbered questions derived from the queries above, brief student introduction in 1-2 sentences, professional closing with student's name and contact. Keep it 200-250 words. Professional, polite, specific.",
  "tips": ["Actionable tip 1 about when/how to follow up", "Tip 2 about what documents to attach", "Tip 3 about college visit or virtual session"]
}`;
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
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(20000),
  });
  if (!resp.ok) throw new Error(`Claude ${resp.status}`);
  return extractJson((await resp.json()).content?.[0]?.text || '');
}

async function callOpenAICompat({ apiUrl, authHeader, model, prompt }: { apiUrl: string; authHeader: Record<string, string>; model: string; prompt: string }): Promise<any> {
  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 2000, temperature: 0.4 }),
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
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 2000 } }),
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

async function cascade(prompt: string, validate: (d: any) => boolean): Promise<{ data: any; provider: string }> {
  const errors: string[] = [];

  if (ANTHROPIC_KEY) {
    try { const d = await callClaude(prompt); if (validate(d)) return { data: d, provider: 'claude' }; errors.push('claude: invalid'); } catch (e: any) { errors.push(`claude: ${e.message}`); }
  }
  if (AZURE_KEY && AZURE_ENDPOINT) {
    try {
      const url = `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=2024-02-01`;
      const d = await callOpenAICompat({ apiUrl: url, authHeader: { 'api-key': AZURE_KEY }, model: AZURE_DEPLOYMENT, prompt });
      if (validate(d)) return { data: d, provider: 'azure' };
      errors.push('azure: invalid');
    } catch (e: any) { errors.push(`azure: ${e.message}`); }
  }
  if (OPENAI_KEY) {
    try {
      const d = await callOpenAICompat({ apiUrl: 'https://api.openai.com/v1/chat/completions', authHeader: { 'Authorization': `Bearer ${OPENAI_KEY}` }, model: 'gpt-4o-mini', prompt });
      if (validate(d)) return { data: d, provider: 'openai' };
      errors.push('openai: invalid');
    } catch (e: any) { errors.push(`openai: ${e.message}`); }
  }
  if (GEMINI_KEY) {
    try {
      const d = await callGemini(prompt);
      if (validate(d)) return { data: d, provider: 'gemini' };
      errors.push('gemini: invalid');
    } catch (e: any) { errors.push(`gemini: ${e.message}`); }
  } else {
    errors.push('gemini: not configured');
  }

  throw new Error(`All providers failed: ${errors.join(' | ')}`);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const type: string         = body.type || 'enquiry';
  const collegeName: string  = (body.collegeName || '').trim();
  const program: string      = (body.program || '').trim();
  const queries: string      = (body.queries || '').trim();
  const userName: string     = (body.userName || 'Student').trim();
  const userEmail: string    = (body.userEmail || '').trim();
  const recipientName: string = (body.recipientName || '').trim();
  const context: string      = (body.context || '').trim();

  if (type === 'outreach' && !queries && !context) {
    return NextResponse.json({ success: false, error: 'context is required for outreach' }, { status: 400 });
  }
  if (type === 'enquiry' && (!collegeName || !queries)) {
    return NextResponse.json({ success: false, error: 'collegeName and queries are required' }, { status: 400 });
  }

  const prompt = buildPrompt(type, collegeName, program, queries, userName, userEmail, recipientName, context);

  try {
    if (type === 'outreach') {
      const { data, provider } = await cascade(prompt, d => typeof d?.draft === 'string' && d.draft.length > 50);
      return NextResponse.json({ success: true, draft: data.draft, subject: data.subject || '', provider });
    } else {
      const { data, provider } = await cascade(prompt, d => typeof d?.draftEmail === 'string' && d.draftEmail.length > 50);
      return NextResponse.json({ success: true, draftEmail: data.draftEmail, subject: data.subject || '', tips: data.tips || [], provider });
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 502 });
  }
}
