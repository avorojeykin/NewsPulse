require('dotenv').config();
const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected');

    // Same query psql uses
    const result = await client.query(`
      SELECT n.nspname as "Schema",
        c.relname as "Name",
        CASE c.relkind WHEN 'r' THEN 'table' END as "Type"
      FROM pg_catalog.pg_class c
      LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind IN ('r')
        AND n.nspname = 'public'
      ORDER BY 1,2
    `);

    console.log('\nTables from pg_catalog:');
    result.rows.forEach(row => console.log(`  - ${row.Name}`));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

test();
