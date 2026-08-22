import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const strip = (s: string) => s.replace(/[^\x20-\x7E]/g, '').trim();
const SMTP_USER      = strip(process.env.SMTP_USER      || '');
const SMTP_PASS      = strip(process.env.SMTP_PASS      || '');
const SMTP_FROM      = strip(process.env.SMTP_FROM_EMAIL || SMTP_USER);
const SMTP_FROM_NAME = strip(process.env.SMTP_FROM_NAME  || 'DemandGenius');
const BACKEND_URL    = (process.env.BACKEND_URL || '').replace(/\/$/, '');

type InquiryData = {
  inqId: string; service: string; city: string;
  checkIn?: string; checkOut?: string; guests?: string | number;
  budget?: string; requirements?: string;
};

function buildHtml(toName: string, inq: InquiryData, responseUrl?: string | null) {
  const rows = [
    ['Inquiry ID', inq.inqId],
    ['Service',    `${inq.service} in ${inq.city}`],
    inq.checkIn  ? ['Check-in',  inq.checkIn]  : null,
    inq.checkOut ? ['Check-out', inq.checkOut] : null,
    inq.guests   ? ['Guests',    String(inq.guests)] : null,
    inq.budget   ? ['Budget',    inq.budget]   : null,
    inq.requirements ? ['Note',  inq.requirements] : null,
  ].filter(Boolean) as [string, string][];

  const tableRows = rows.map(([label, value]) => `
    <tr>
      <td style="padding:7px 0;font-size:12px;color:#64748b;width:36%;vertical-align:top;">${label}</td>
      <td style="padding:7px 0;font-size:12px;font-weight:700;color:#0f172a;">${value}</td>
    </tr>`).join('');

  const steps = [
    'Click the green button to open your response form',
    'Choose: Accept &middot; Send Quote &middot; Hold &middot; Decline',
    'Customer is notified instantly &mdash; no login needed',
  ];

  const ctaSection = responseUrl
    ? `<div style="padding:8px 32px 20px;text-align:center;">
        <a href="${responseUrl}"
           style="display:inline-block;background:#16a34a;color:#ffffff;font-size:14px;font-weight:800;
                  padding:14px 36px;border-radius:12px;text-decoration:none;">
          &#10003; Confirm Availability
        </a>
        <p style="margin:14px 0 0;font-size:11px;color:#94a3b8;">
          Or copy this link:<br>
          <span style="color:#0ea5e9;word-break:break-all;">${responseUrl}</span>
        </p>
      </div>
      <div style="margin:0 32px 28px;background:#fff7ed;border-radius:12px;padding:16px 20px;border:1px solid #fed7aa;">
        <p style="margin:0 0 10px;font-size:10px;font-weight:800;color:#9a3412;letter-spacing:1px;text-transform:uppercase;">How to respond</p>
        <table style="width:100%;border-collapse:collapse;">
          ${steps.map((s, i) => `
          <tr>
            <td style="width:28px;vertical-align:top;padding:5px 8px 5px 0;">
              <span style="display:inline-block;width:20px;height:20px;background:#0ea5e9;border-radius:50%;
                           font-size:10px;color:#fff;font-weight:800;text-align:center;line-height:20px;">${i + 1}</span>
            </td>
            <td style="font-size:12px;color:#44403c;padding:5px 0;">${s}</td>
          </tr>`).join('')}
        </table>
      </div>`
    : `<div style="padding:0 32px 28px;text-align:center;">
        <p style="font-size:13px;color:#475569;">Please reply to this email to confirm your availability.</p>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1642832204354188"
     crossorigin="anonymous"></script>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Service Inquiry &mdash; DemandGenius</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

  <div style="background:#0ea5e9;padding:28px 32px;">
    <p style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">DemandGenius</p>
    <p style="margin:6px 0 0;color:#bae6fd;font-size:12px;">New Service Inquiry &mdash; Action Required</p>
  </div>

  <div style="padding:28px 32px 20px;">
    <p style="margin:0;font-size:15px;color:#0f172a;font-weight:700;">Hello ${toName},</p>
    <p style="margin:10px 0 0;font-size:13px;color:#475569;line-height:1.7;">
      A customer is looking for <strong>${inq.service}</strong> in <strong>${inq.city}</strong>
      through DemandGenius. Please review the details and confirm your availability.
    </p>
  </div>

  <div style="margin:0 32px 20px;background:#f8fafc;border-radius:12px;padding:20px;border:1px solid #e2e8f0;">
    <p style="margin:0 0 12px;font-size:10px;font-weight:800;color:#64748b;letter-spacing:1px;text-transform:uppercase;">Request Details</p>
    <table style="width:100%;border-collapse:collapse;">
      ${tableRows}
    </table>
  </div>

  ${ctaSection}

  <div style="background:#f8fafc;padding:14px 32px;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="margin:0;font-size:11px;color:#94a3b8;">
      Powered by <strong style="color:#64748b;">DemandGenius</strong> &middot;
      Sent on behalf of a customer inquiry &middot; Not a promotional email.
    </p>
  </div>

</div>
</body>
</html>`;
}

// Try to create an outreach record on the Render backend (server-to-server, faster than browser)
async function tryCreateOutreach(inquiry: InquiryData, toName: string, toEmail: string): Promise<{ token: string; id: string; created_at: string } | null> {
  if (!BACKEND_URL) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000); // 12s server-side timeout
    const resp = await fetch(`${BACKEND_URL}/v1/public/hotel-response/outreach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        inquiry_id:   inquiry.inqId,
        hotel_name:   toName,
        hotel_email:  toEmail,
        hotel_phone:  null,
        city:         inquiry.city,
        inquiry_snapshot: {
          inqId:       inquiry.inqId,
          serviceType: inquiry.service,
          city:        inquiry.city,
          checkIn:     inquiry.checkIn,
          checkOut:    inquiry.checkOut,
          guests:      inquiry.guests,
          budget:      inquiry.budget,
          requirements: inquiry.requirements,
        },
      }),
    });
    clearTimeout(timer);
    const data = await resp.json();
    if (!data.success) return null;
    return { token: data.data.token, id: data.data.id, created_at: data.data.created_at };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!SMTP_USER || !SMTP_PASS) {
    return NextResponse.json({ success: false, error: 'Email not configured' }, { status: 503 });
  }

  const { to, toName, subject, text, inquiry } = await req.json();
  if (!to || !subject || !text) {
    return NextResponse.json({ success: false, error: 'to, subject, and text are required' }, { status: 400 });
  }

  // Create outreach server-side to get the response token
  let outreachData: { token: string; id: string; created_at: string } | null = null;
  let responseUrl: string | null = null;
  if (inquiry) {
    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^/]*$/, '') || 'https://dplan-ebon.vercel.app';
    outreachData = await tryCreateOutreach(inquiry as InquiryData, toName || to, to);
    if (outreachData) responseUrl = `${origin}/hotel-respond?token=${outreachData.token}`;
  }

  const html = inquiry ? buildHtml(toName || to, inquiry as InquiryData, responseUrl) : undefined;
  const ccList = [SMTP_FROM].filter(Boolean).join(', ');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  // Inject response URL into plain-text fallback
  const finalText = responseUrl
    ? text.replace('Please reply to this email to confirm your availability.', `Confirm availability: ${responseUrl}`)
    : text;

  try {
    const info = await transporter.sendMail({
      from:    `"${SMTP_FROM_NAME}" <${SMTP_FROM}>`,
      to:      toName ? `"${toName}" <${to}>` : to,
      cc:      ccList || undefined,
      subject,
      text:    finalText,
      ...(html ? { html } : {}),
    });
    return NextResponse.json({
      success:    true,
      messageId:  info.messageId,
      outreach:   outreachData,   // return to frontend so it can update local state
      hasLink:    !!responseUrl,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 502 });
  }
}
