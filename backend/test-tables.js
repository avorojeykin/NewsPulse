require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    const result = await pool.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
      AND table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `);

    console.log('Tables visible to this connection:');
    if (result.rows.length === 0) {
      console.log('  ❌ NO TABLES FOUND!');
    } else {
      result.rows.forEach(row => console.log(`  - ${row.table_schema}.${row.table_name}`));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  await pool.end();
}

test();
