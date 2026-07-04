import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: NextRequest) {
  try {
    const { amount = 99, guest_id, currency = 'INR' } = await req.json();

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ success: false, error: 'Payment gateway not configured' }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency,
      receipt: `contrib_${(guest_id || 'guest').substring(0, 20)}_${Date.now()}`,
      notes: { guest_id: guest_id || '', purpose: 'contributor' },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
    });
  } catch (err: any) {
    console.error('Razorpay create-order error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to create order' }, { status: 500 });
  }
}
