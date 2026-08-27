const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://dplaning_user:ZtyFKhgdv3cCo55h3GRRGEdTIbYvID0F@dpg-da4l2ek9v7es738h31k0-a.ohio-postgres.render.com/dplaning_j4m7',
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    const res = await pool.query(`
      INSERT INTO tenants (name, domain) 
      VALUES ('ExamHub360', 'examhub360.com') 
      ON CONFLICT (domain) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    
    const tenantId = res.rows[0].id;
    console.log("Tenant ID:", tenantId);
    
    // Seed initial config
    await pool.query(`
      INSERT INTO examhub_config (tenant_id, tier, enable_demo, enable_qb)
      VALUES ($1, 'free', true, true)
      ON CONFLICT DO NOTHING
    `, [tenantId]);
    console.log("Config seeded.");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();
