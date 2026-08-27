const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://dplaning_user:ZtyFKhgdv3cCo55h3GRRGEdTIbYvID0F@dpg-da4l2ek9v7es738h31k0-a.ohio-postgres.render.com/dplaning_j4m7',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(async () => {
  await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;');
  await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS has_qb_access BOOLEAN DEFAULT false;');
  await client.query('UPDATE users SET is_paid = true WHERE email = $1', ['avyukt@srichaitanya.com']);
  console.log('DB updated!');
  client.end();
}).catch(e => { console.error(e); client.end(); });
