const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://dplaning_user:ZtyFKhgdv3cCo55h3GRRGEdTIbYvID0F@dpg-da4l2ek9v7es738h31k0-a.ohio-postgres.render.com/dplaning_j4m7',
  ssl: {
    rejectUnauthorized: false
  }
});

const schema = `
-- Master Taxonomy Data (Grades, Subjects, Exams, Boards, Degrees)
CREATE TABLE IF NOT EXISTS taxonomies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id), -- Nullable for global master data
    type VARCHAR(50) NOT NULL, -- 'board', 'grade', 'subject', 'degree', 'branch', 'semester'
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES taxonomies(id), -- For hierarchical relationships (e.g., branch -> degree)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function main() {
  try {
    console.log("Creating Master Data schema...");
    await pool.query(schema);
    console.log("Schema created successfully.");
  } catch (err) {
    console.error("Error creating schema:", err);
  } finally {
    await pool.end();
  }
}

main();
