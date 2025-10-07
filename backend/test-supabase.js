// Test Supabase connection and verify schema
const { Client } = require('pg');

// Supabase Connection Pooler (IPv4 compatible)
const connectionString = 'postgresql://postgres.jtijtatoptvrpzrbkvdm:NewsPulse2025Secure@aws-1-us-east-2.pooler.supabase.com:5432/postgres';

async function testSupabase() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
  });

  try {
    console.log('🔌 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Check tables
    console.log('📋 Checking tables...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    console.log('');

    // Check indexes
    console.log('🔍 Checking indexes...');
    const indexesResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      ORDER BY indexname
    `);

    console.log(`Indexes created: ${indexesResult.rows.length}`);
    indexesResult.rows.slice(0, 5).forEach(row => {
      console.log(`  ✅ ${row.indexname}`);
    });
    if (indexesResult.rows.length > 5) {
      console.log(`  ... and ${indexesResult.rows.length - 5} more`);
    }
    console.log('');

    // Test insert
    console.log('📝 Testing data insert...');
    await client.query(`
      INSERT INTO news_items (source, category, title, content, url, hash, published_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (hash) DO NOTHING
      RETURNING id
    `, [
      'Test Source',
      'crypto',
      'Test Article',
      'Test content',
      'https://example.com/test',
      'test_hash_' + Date.now()
    ]);
    console.log('✅ Insert successful!\n');

    // Count records
    const countResult = await client.query('SELECT COUNT(*) FROM news_items');
    console.log(`📊 Total news items: ${countResult.rows[0].count}\n`);

    console.log('🎉 Supabase setup verification complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testSupabase();
