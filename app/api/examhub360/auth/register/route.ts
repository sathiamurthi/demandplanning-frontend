import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

// Basic hash for demo purposes, you should use bcrypt in production
const hashPassword = (password: string) => crypto.createHash('sha256').update(password).digest('hex');

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!email || !password) throw new Error("Email and password required");
    
    // 1. Create a new Tenant for this user (as requested: each user is a tenant)
    const tenantName = name ? `${name}'s Workspace` : `${email}'s Workspace`;
    const tenantRes = await query(`
      INSERT INTO tenants (name, domain) VALUES ($1, $2) RETURNING id
    `, [tenantName, `user-${Date.now()}`]);
    const tenantId = tenantRes.rows[0].id;

    // 2. Insert User
    const userRes = await query(`
      INSERT INTO users (tenant_id, email, password_hash, first_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, first_name, is_superadmin
    `, [tenantId, email.toLowerCase().trim(), hashPassword(password), name]);

    const user = userRes.rows[0];

    // 3. Log the registration
    try {
      await query(`
        INSERT INTO workflows (tenant_id, name, status) 
        VALUES ($1, 'REGISTRATION: ' || $2, 'completed')
      `, [tenantId, email.toLowerCase().trim()]);
    } catch(e) {}

    return NextResponse.json({ 
      success: true, 
      token: "mock-jwt-token-" + user.id, // Replace with jsonwebtoken in prod
      user: {
        id: user.id,
        tenant_id: tenantId,
        email: user.email,
        name: user.first_name,
        role: user.is_superadmin ? "superadmin" : "user"
      }
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ success: false, error: "Email already exists" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
