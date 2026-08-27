import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const logs = await query(`
      SELECT id, name, created_at 
      FROM workflows 
      WHERE name LIKE 'LOGIN_ATTEMPT:%' OR name LIKE 'REGISTRATION:%'
      ORDER BY created_at DESC 
      LIMIT 100
    `);

    return NextResponse.json({ success: true, data: logs.rows });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
