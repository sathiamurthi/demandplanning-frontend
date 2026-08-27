import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { name, type } = await req.json();

    if (!name || !type) {
      return NextResponse.json({ success: false, error: 'Name and type are required' }, { status: 400 });
    }

    const tenantRes = await query(`SELECT id FROM tenants WHERE domain = 'examhub360.com' LIMIT 1`);
    if (tenantRes.rows.length === 0) throw new Error("Tenant not found");
    const tenantId = tenantRes.rows[0].id;

    const res = await query(`
      INSERT INTO taxonomies (tenant_id, name, type)
      VALUES ($1, $2, $3)
      RETURNING id, name, type
    `, [tenantId, name, type]);

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error: any) {
    console.error("Error saving master data:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
