const { Client } = require('pg');

async function test() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'newspulse',
    user: 'postgres',
    password: '12345'
  });

  try {
    await client.connect();
    console.log('✅ Connected to localhost:5432/newspulse');

    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version.split(',')[0]);

    const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    console.log('\nTables:', tables.rows.length);
    tables.rows.forEach(row => console.log('  -', row.tablename));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

test();
