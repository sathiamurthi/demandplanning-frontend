import { NextRequest, NextResponse } from 'next/server';

const BACKEND = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

// POST — create booking request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const resp = await fetch(`${BACKEND}/v1/public/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Network error reaching booking service' }, { status: 502 });
  }
}

// GET — booking history by phone OR single booking by id
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const id    = searchParams.get('id');
    const url   = id
      ? `${BACKEND}/v1/public/bookings/${encodeURIComponent(id)}`
      : `${BACKEND}/v1/public/bookings?phone=${encodeURIComponent(phone || '')}`;
    const resp = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Network error' }, { status: 502 });
  }
}
