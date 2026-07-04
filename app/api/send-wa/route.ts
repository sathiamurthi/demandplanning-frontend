import { NextRequest, NextResponse } from 'next/server';

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const ACCESS_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN    || '';
const API_VERSION     = process.env.WHATSAPP_API_VERSION     || 'v25.0';

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
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { preview_url: false, body: message },
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
