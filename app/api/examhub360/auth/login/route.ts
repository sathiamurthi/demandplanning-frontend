import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

const hashPassword = (password: string) => crypto.createHash('sha256').update(password).digest('hex');

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) throw new Error("Email and password required");
    
    // Log login request for superadmin dashboard (audit log)
    try {
      await query(`
        INSERT INTO workflows (tenant_id, name, status) 
        VALUES (
          (SELECT id FROM tenants WHERE domain = 'examhub360.com' LIMIT 1), 
          'LOGIN_ATTEMPT: ' || $1, 
          'completed'
        )
      `, [email.toLowerCase().trim()]);
    } catch(e) { /* Ignore audit log failure */ }

    // Hardcoded global admins
    if ((email === "sathia@examhub360.com" || email === "superadmin@demandgeniusai.com") && password === "Admin@123") {
      return NextResponse.json({ 
        success: true, 
        token: "admin-token",
        user: { id: "admin-1", email, name: "Admin", role: "superadmin" }
      });
    }

    const userRes = await query(`
      SELECT id, tenant_id, email, first_name, is_superadmin, is_paid, has_qb_access
      FROM users 
      WHERE email = $1 AND password_hash = $2
    `, [email.toLowerCase().trim(), hashPassword(password)]);

    if (userRes.rows.length === 0) {
      throw new Error("Invalid email or password");
    }

    const user = userRes.rows[0];

    return NextResponse.json({ 
      success: true, 
      token: "mock-jwt-token-" + user.id,
      user: {
        id: user.id,
        tenant_id: user.tenant_id,
        email: user.email,
        name: user.first_name,
        role: user.is_superadmin ? "superadmin" : "user",
        isPaid: user.is_paid,
        hasQbAccess: user.has_qb_access
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
