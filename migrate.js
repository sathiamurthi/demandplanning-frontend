const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://dplaning_user:ZtyFKhgdv3cCo55h3GRRGEdTIbYvID0F@dpg-da4l2ek9v7es738h31k0-a.ohio-postgres.render.com/dplaning_j4m7',
  ssl: {
    rejectUnauthorized: false
  }
});

const schema = `
-- Core Tenants
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(100) UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_superadmin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    UNIQUE(tenant_id, name)
);

-- User-Role Mapping
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Role-Permission Mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ==========================================
-- Application-Specific Entities
-- ==========================================

-- ExamHub Global Config
CREATE TABLE IF NOT EXISTS examhub_config (
    tenant_id UUID REFERENCES tenants(id) PRIMARY KEY,
    tier VARCHAR(50) DEFAULT 'free',
    enable_demo BOOLEAN DEFAULT true,
    enable_qb BOOLEAN DEFAULT true
);

-- Batches
CREATE TABLE IF NOT EXISTS exam_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', 
    model_used VARCHAR(50),
    total_cost_usd DECIMAL(10, 5) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Study Packs (JSONB storage)
CREATE TABLE IF NOT EXISTS exam_study_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES exam_batches(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id),
    chapter_name VARCHAR(255),
    content_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function main() {
  try {
    console.log("Creating schema...");
    await pool.query(schema);
    console.log("Schema created successfully.");
  } catch (err) {
    console.error("Error creating schema:", err);
  } finally {
    await pool.end();
  }
}

main();
