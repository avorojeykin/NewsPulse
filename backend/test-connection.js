require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    const result = await pool.query('SELECT current_database(), current_user, current_schema()');
    console.log('Connected to:', result.rows[0]);

    const dbList = await pool.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log('\nAvailable databases:');
    dbList.rows.forEach(row => console.log('  -', row.datname));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }

  await pool.end();
}

test();
