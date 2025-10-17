export const RSS_FEEDS = {
  crypto: [
    { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
    { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss' },
    { name: 'Decrypt', url: 'https://decrypt.co/feed' },
    { name: 'CryptoSlate', url: 'https://cryptoslate.com/feed/' },
    { name: 'Bitcoin Magazine', url: 'https://bitcoinmagazine.com/.rss/full/' },
    { name: 'The Block', url: 'https://www.theblock.co/rss.xml' },
    { name: 'Bitcoin.com', url: 'https://news.bitcoin.com/feed/' },
    { name: 'CryptoNews', url: 'https://cryptonews.com/news/feed/' },
    { name: 'NewsBTC', url: 'https://www.newsbtc.com/feed/' },
    { name: 'CoinJournal', url: 'https://coinjournal.net/feed/' },
    { name: 'CryptoDaily', url: 'https://cryptodaily.co.uk/feed' },
    { name: 'Crypto Briefing', url: 'https://cryptobriefing.com/feed/' },
  ],
  stocks: [
    // Feeds with rich content/descriptions
    { name: 'MarketWatch', url: 'https://www.marketwatch.com/rss/topstories' },
    { name: 'Bloomberg Markets', url: 'https://feeds.bloomberg.com/markets/news.rss' },
    { name: 'Financial Times', url: 'https://www.ft.com/companies?format=rss' },
    { name: 'CNBC Markets', url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html' },
    { name: 'Wall Street Journal', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml' },
    { name: 'Investor Business Daily', url: 'https://www.investors.com/feed/' },
    { name: 'Business Insider Markets', url: 'https://markets.businessinsider.com/rss/news' },
    { name: 'TradingView News', url: 'https://www.tradingview.com/feed/' },
    { name: 'CNBC Top News', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
    // Keep some title-only feeds for broader coverage
    { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex' },
    { name: 'Seeking Alpha', url: 'https://seekingalpha.com/feed.xml' },
    { name: 'Benzinga', url: 'https://www.benzinga.com/feed' },
  ],
  sports: [
    { name: 'ESPN', url: 'https://www.espn.com/espn/rss/news' },
    { name: 'Bleacher Report', url: 'https://bleacherreport.com/articles/feed' },
    { name: 'CBS Sports', url: 'https://www.cbssports.com/rss/headlines' },
    { name: 'Yahoo Sports', url: 'https://sports.yahoo.com/rss/' },
    { name: 'Action Network', url: 'https://www.actionnetwork.com/news/rss' },
    { name: 'Covers', url: 'https://www.covers.com/rss/news' },
    { name: 'Sports Betting Dime', url: 'https://www.sportsbettingdime.com/news/feed/' },
    { name: 'The Lines', url: 'https://www.thelines.com/feed/' },
    { name: 'Sports Handle', url: 'https://sportshandle.com/feed/' },
    { name: 'Oddschecker', url: 'https://www.oddschecker.com/us/insight/rss.xml' },
    { name: 'Pickswise', url: 'https://www.pickswise.com/feed/' },
    { name: 'BettingPros', url: 'https://www.bettingpros.com/feed/' },
  ],
} as const;

export type Vertical = keyof typeof RSS_FEEDS;
