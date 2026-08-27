import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const tenantRes = await query(`SELECT id FROM tenants WHERE domain = 'examhub360.com' LIMIT 1`);
    if (tenantRes.rows.length === 0) return NextResponse.json({ success: true, data: [] });
    const tenantId = tenantRes.rows[0].id;

    const users = await query(`
      SELECT email, is_paid as "isPaid", has_qb_access as "hasQbAccess" 
      FROM users 
      WHERE tenant_id = $1
    `, [tenantId]);

    return NextResponse.json({ success: true, data: users.rows });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, isPaid, hasQbAccess } = body;
    
    if (!email) throw new Error("Email is required");

    const tenantRes = await query(`SELECT id FROM tenants WHERE domain = 'examhub360.com' LIMIT 1`);
    if (tenantRes.rows.length === 0) throw new Error("Tenant not found");
    const tenantId = tenantRes.rows[0].id;

    // Upsert user tracking info
    await query(`
      INSERT INTO users (tenant_id, email, password_hash, is_paid, has_qb_access)
      VALUES ($1, $2, 'NO_AUTH_SET', $3, $4)
      ON CONFLICT (tenant_id, email) DO UPDATE SET
        is_paid = EXCLUDED.is_paid,
        has_qb_access = EXCLUDED.has_qb_access
    `, [tenantId, email.toLowerCase().trim(), !!isPaid, !!hasQbAccess]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
