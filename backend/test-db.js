require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  console.log('🧪 Testing database connection');
  console.log('Connection string:', process.env.DATABASE_URL);

  try {
    const result = await pool.query('SELECT tablename FROM pg_tables WHERE schemaname = $1', ['public']);
    console.log('✅ Connected! Tables found:');
    result.rows.forEach(row => console.log('  -', row.tablename));

    const newsTest = await pool.query('SELECT COUNT(*) FROM news_items');
    console.log('\n✅ news_items table accessible, count:', newsTest.rows[0].count);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

test();
