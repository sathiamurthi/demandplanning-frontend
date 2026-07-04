import { NextRequest, NextResponse } from 'next/server';

// Strip BOM (U+FEFF) and any non-printable chars that PowerShell may inject
const stripBOM = (s: string) => s.replace(/[^\x20-\x7E]/g, '').trim();
const PHONE_NUMBER_ID = stripBOM(process.env.WHATSAPP_PHONE_NUMBER_ID || '');
const ACCESS_TOKEN    = stripBOM(process.env.WHATSAPP_ACCESS_TOKEN    || '');
const API_VERSION     = stripBOM(process.env.WHATSAPP_API_VERSION     || 'v25.0') || 'v25.0';

export async function GET() {
  return NextResponse.json({
    phone_id_len: PHONE_NUMBER_ID.length,
    phone_id_val: PHONE_NUMBER_ID,
    token_len: ACCESS_TOKEN.length,
    token_start: ACCESS_TOKEN.slice(0, 8),
    token_end: ACCESS_TOKEN.slice(-6),
    api_version: API_VERSION,
  });
}

async function callMetaAPI(body: object) {
  const res = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json() as any;
  return { ok: res.ok, status: res.status, data };
}

export async function POST(req: NextRequest) {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    return NextResponse.json({ success: false, error: 'WhatsApp not configured' }, { status: 503 });
  }

  const { phone, message } = await req.json();
  if (!phone || !message) {
    return NextResponse.json({ success: false, error: 'phone and message required' }, { status: 400 });
  }

  const digits = String(phone).replace(/\D/g, '');
  const to     = digits.length === 10 ? `91${digits}` : digits;

  try {
    // First try: text message
    const { ok, data } = await callMetaAPI({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    });

    if (ok) {
      const messageId = data?.messages?.[0]?.id;
      return NextResponse.json({ success: true, messageId });
    }

    // If text fails with access denied, try hello_world template as fallback
    const errCode = data?.error?.code;
    if (errCode === 131005 || errCode === 131030) {
      const { ok: tok, data: td } = await callMetaAPI({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: { name: 'hello_world', language: { code: 'en_US' } },
      });
      if (tok) {
        return NextResponse.json({ success: true, messageId: td?.messages?.[0]?.id, via: 'template' });
      }
      return NextResponse.json({
        success: false,
        error: td?.error?.message || 'Template also failed',
        meta_error: data?.error,
      }, { status: 502 });
    }

    const err = data?.error?.message || `HTTP ${data?.error?.code || 'unknown'}`;
    return NextResponse.json({ success: false, error: err, meta_error: data?.error }, { status: 502 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
