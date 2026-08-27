import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // For now, get the ExamHub360 tenant config
    const res = await query(`
      SELECT tier, enable_demo as "enableDemoMode", enable_qb as "enableQuestionBank" 
      FROM examhub_config 
      LIMIT 1
    `);
    
    if (res.rows.length === 0) {
      return NextResponse.json({ success: true, data: { tier: 'free', enableDemoMode: true, enableQuestionBank: true } });
    }
    
    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Get the tenant ID
    const tenantRes = await query(`SELECT id FROM tenants WHERE domain = 'examhub360.com' LIMIT 1`);
    if (tenantRes.rows.length === 0) throw new Error("Tenant not found");
    const tenantId = tenantRes.rows[0].id;
    
    await query(`
      INSERT INTO examhub_config (tenant_id, tier, enable_demo, enable_qb)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tenant_id) DO UPDATE SET
        tier = EXCLUDED.tier,
        enable_demo = EXCLUDED.enable_demo,
        enable_qb = EXCLUDED.enable_qb
    `, [
      tenantId, 
      body.tier || 'free', 
      body.enableDemoMode ?? true, 
      body.enableQuestionBank ?? true
    ]);
    
    return NextResponse.json({ success: true, data: body });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
