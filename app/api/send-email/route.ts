import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const SMTP_HOST     = process.env.SMTP_HOST     || 'smtp.gmail.com';
const SMTP_PORT     = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER     = process.env.SMTP_USER     || '';
const SMTP_PASS     = process.env.SMTP_PASS     || '';
const SMTP_FROM     = process.env.SMTP_FROM_EMAIL || SMTP_USER;
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'DemandGenius';

export async function POST(req: NextRequest) {
  if (!SMTP_USER || !SMTP_PASS) {
    return NextResponse.json({ success: false, error: 'Email not configured' }, { status: 503 });
  }

  const { to, toName, subject, text } = await req.json();
  if (!to || !subject || !text) {
    return NextResponse.json({ success: false, error: 'to, subject, and text are required' }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
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
