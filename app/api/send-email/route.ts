import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const strip = (s: string) => s.replace(/[^\x20-\x7E]/g, '').trim();
const SMTP_USER      = strip(process.env.SMTP_USER      || '');
const SMTP_PASS      = strip(process.env.SMTP_PASS      || '');
const SMTP_FROM      = strip(process.env.SMTP_FROM_EMAIL || SMTP_USER);
const SMTP_FROM_NAME = strip(process.env.SMTP_FROM_NAME  || 'DemandGenius');

export async function POST(req: NextRequest) {
  if (!SMTP_USER || !SMTP_PASS) {
    return NextResponse.json({ success: false, error: 'Email not configured' }, { status: 503 });
  }

  const { to, toName, subject, text } = await req.json();
  if (!to || !subject || !text) {
    return NextResponse.json({ success: false, error: 'to, subject, and text are required' }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    const info = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM}>`,
      to: toName ? `"${toName}" <${to}>` : to,
      cc: SMTP_FROM,
      subject,
      text,
    });
    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 502 });
  }
}
