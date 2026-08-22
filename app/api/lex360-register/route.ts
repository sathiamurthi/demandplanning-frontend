import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyName, contactName, email, phone, fileName } = body;

    // Validate required fields
    if (!companyName || !contactName || !email) {
      return NextResponse.json(
        { error: "Missing required fields (companyName, contactName, and email are required)." },
        { status: 400 }
      );
    }

    // Check if SMTP environment variables are set
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const fromName = process.env.SMTP_FROM_NAME || "DemandGenious";
    const fromEmail = process.env.SMTP_FROM_EMAIL || user || "paariwalaconnect@gmail.com";

    const smtpConfigured = Boolean(user && pass);
    if (!smtpConfigured) {
      console.warn("SMTP not configured: SMTP_USER or SMTP_PASS is missing. Email notifications will be skipped.");
    }

    let transporter;
    if (smtpConfigured) {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for 587
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }

    // Construct the email body
    const emailText = `LEX WEB APP BUNDLE EXPORT REGISTRATION
======================================

Company Name: ${companyName}
Contact Name: ${contactName}
Recipient Email Address: ${email}
Phone Number: ${phone || "Not provided"}

Export Timestamp: ${new Date().toLocaleString()}
Model Name: ${fileName || "Standard Spreadsheet"}
`;

    // Configure mail options
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: `${email}, dnmsathia@gmail.com`,
      subject: `LEX Registration: ${companyName}`,
      text: emailText,
    };

    // Send email using SMTP if configured; continue even if SMTP is unavailable
    if (smtpConfigured && transporter) {
      await transporter.sendMail(mailOptions);
    }

    return NextResponse.json({ success: true, emailSent: smtpConfigured });
  } catch (error: any) {
    console.error("SMTP Delivery Error:", error);
    return NextResponse.json(
      { 
        error: "SMTP Delivery Error: " + (error.message || String(error)),
        hint: "Make sure SMTP_USER is your full Gmail address and SMTP_PASS is a valid 16-character Google App Password (not your regular account password)."
      },
      { status: 500 }
    );
  }
}
