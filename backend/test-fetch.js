// Quick test to manually fetch RSS and see if it works
const Parser = require('rss-parser');
const parser = new Parser();

const testFeed = {
  name: 'CoinDesk',
  url: 'https://www.coindesk.com/arc/outboundfeeds/rss/'
};

async function test() {
  console.log('🧪 Testing RSS fetch from', testFeed.name);
  try {
    const feed = await parser.parseURL(testFeed.url);
    console.log('✅ Success! Fetched', feed.items.length, 'items');
    console.log('\nFirst item:');
    console.log('Title:', feed.items[0].title);
    console.log('Link:', feed.items[0].link);
    console.log('Published:', feed.items[0].pubDate);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
