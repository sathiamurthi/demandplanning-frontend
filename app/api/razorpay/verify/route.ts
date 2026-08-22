import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, guest_id } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Missing payment details' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ success: false, error: 'Payment gateway not configured' }, { status: 500 });
    }

    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 400 });
    }

    // Record via backend (best-effort)
    if (guest_id) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://demandplanning-backend.onrender.com';
      fetch(`${apiUrl}/v1/public/sessions/contribution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id }),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, payment_id: razorpay_payment_id });
  } catch (err: any) {
    console.error('Razorpay verify error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Verification failed' }, { status: 500 });
  }
}
