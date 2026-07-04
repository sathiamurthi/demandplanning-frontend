import { NextRequest, NextResponse } from 'next/server';

// Strip BOM (U+FEFF) and any non-printable chars that PowerShell may inject
const stripBOM = (s: string) => s.replace(/^﻿/, '').replace(/[^\x20-\x7E]/g, '').trim();
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
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      const err = (data as any)?.error?.message || `HTTP ${res.status}`;
      return NextResponse.json({ success: false, error: err }, { status: 502 });
    }

    const messageId = (data as any)?.messages?.[0]?.id;
    return NextResponse.json({ success: true, messageId });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
