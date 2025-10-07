// Test Upstash Redis connection
const Redis = require('ioredis');

const redis = new Redis({
  host: 'happy-mustang-20430.upstash.io',
  port: 6379,
  password: 'AU_OAAIncDJlYjE4Yjc4OTJmNDg0NzA0YWRkMWExN2U5MmM2YWYxZnAyMjA0MzA',
  tls: {
    rejectUnauthorized: false
  },
  connectTimeout: 10000,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 200, 1000);
  }
});

async function testRedis() {
  try {
    console.log('🔌 Connecting to Upstash Redis...');

    // Test connection with PING
    const pong = await redis.ping();
    console.log('✅ Connected! Response:', pong);
    console.log('');

    // Test SET operation
    console.log('📝 Testing SET operation...');
    await redis.set('test:key', 'NewsPulse_Test_' + Date.now());
    console.log('✅ SET successful!');
    console.log('');

    // Test GET operation
    console.log('📖 Testing GET operation...');
    const value = await redis.get('test:key');
    console.log('✅ GET successful! Value:', value);
    console.log('');

    // Test deduplication hash storage (like production)
    console.log('🔍 Testing deduplication pattern...');
    const testHash = 'test_article_hash_' + Date.now();
    const exists = await redis.exists(testHash);
    console.log('Hash exists?', exists === 0 ? 'No ✅' : 'Yes');

    await redis.setex(testHash, 86400, '1'); // 24 hour TTL
    console.log('✅ Stored hash with 24h expiry');

    const nowExists = await redis.exists(testHash);
    console.log('Hash exists now?', nowExists === 1 ? 'Yes ✅' : 'No');
    console.log('');

    // Test TTL
    const ttl = await redis.ttl(testHash);
    console.log(`⏰ TTL remaining: ${ttl} seconds (~24 hours)`);
    console.log('');

    // Get Redis info
    const info = await redis.info('server');
    const version = info.match(/redis_version:(\S+)/)?.[1];
    console.log(`📊 Redis version: ${version}`);
    console.log('');

    console.log('🎉 Upstash Redis setup verification complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await redis.quit();
  }
}

testRedis();
