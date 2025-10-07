require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    // Try with explicit schema
    const newsTest = await pool.query('SELECT COUNT(*) FROM public.news_items');
    console.log('✅ With explicit schema - count:', newsTest.rows[0].count);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  try {
    // Try without schema
    const newsTest2 = await pool.query('SELECT COUNT(*) FROM news_items');
    console.log('✅ Without schema - count:', newsTest2.rows[0].count);
  } catch (error) {
    console.error('❌ Error without schema:', error.message);
  }

  await pool.end();
}

test();
