/**
 * AI Prompt Templates for News Analysis
 * Vertical-specific prompts for sentiment and impact analysis
 */

export interface PromptConfig {
  category: 'crypto' | 'stocks' | 'sports';
  title: string;
  content?: string;
  url?: string;
  ticker?: string;
}

export function generateAnalysisPrompt(config: PromptConfig): string {
  const { category, title, content, ticker } = config;
  // NOTE: We use title + RSS content/description for better context
  // RSS content is typically 1-2 paragraphs (~100-200 tokens) - much more context without full article

  const categoryContext = getCategoryContext(category, ticker);

  return `You are a ${categoryContext.expertType} analyst. Analyze this news and respond with ONLY valid JSON. NO explanations, NO markdown, NO additional text.

${categoryContext.context}

News: ${title}
${content ? `\nDetails: ${content}` : ''}

CONFIDENCE RULES (use full 0.3-0.95 range):
- 0.9-0.95: Definitive events only (confirmed partnerships, actual hacks, earnings)
- 0.7-0.85: Clear news, some uncertainty
- 0.5-0.65: Moderate signals, mixed factors
- 0.3-0.45: Speculative, opinion, analysis
- KEY: If explaining WHY (not announcing WHAT), use LOW confidence

${categoryContext.impactGuidelines}

CRITICAL: Your entire response must be ONLY this exact JSON structure. Do not add any text before or after. Start with { and end with }:
{
  "sentiment": {
    "label": ${category === 'sports' ? '"favorable"|"unfavorable"|"neutral"' : '"bullish"|"bearish"|"neutral"'},
    "confidence": 0.3-0.95,
    "reasoning": "1 sentence"
  },
  "price_impact": {
    "level": "critical"|"high"|"medium"|"low",
    "direction": "up"|"down"|"uncertain",
    "reasoning": "1 sentence"
  },
  "summary": {
    "tldr": "2 sentences max",
    "key_points": ["2-3 points"],
    "entities": ["names mentioned"]
  }
}`;
}

function getCategoryContext(
  category: string,
  ticker?: string
): { expertType: string; context: string; impactGuidelines: string } {
  switch (category) {
    case 'crypto':
      return {
        expertType: 'crypto',
        context: `Sentiment: bullish/bearish/neutral. Extract coins, companies, protocols.`,
        impactGuidelines: `IMPACT (be strict):
CRITICAL: SEC rulings, country bans, major hacks (>$100M), exploits
HIGH: Exchange listings, ETF flows, major partnerships, hard forks
MEDIUM: Partnerships, upgrades, whale moves
LOW: Opinions, price analysis, "why X down" articles`,
      };

    case 'stocks':
      return {
        expertType: 'stock',
        context: `${ticker ? `Stock: ${ticker}. ` : ''}Sentiment: bullish/bearish/neutral. Extract tickers, execs.`,
        impactGuidelines: `IMPACT (be strict):
CRITICAL: Earnings surprise >20%, CEO exits, M&A, bankruptcy
HIGH: Earnings, guidance, launches, FDA approvals, splits
MEDIUM: Analyst ratings, targets, exec appointments
LOW: Opinions, sector news, "why X down" articles`,
      };

    case 'sports':
      return {
        expertType: 'sports betting',
        context: `Sentiment: favorable/unfavorable/neutral for betting. Extract teams, players, games.`,
        impactGuidelines: `IMPACT (be strict):
CRITICAL: Star injury <48h to game, starting QB/pitcher out, coach fired
HIGH: Key returns, lineup changes, weather impacts
MEDIUM: Form updates, practice news, minor injuries
LOW: Commentary, predictions, stats, "why team lost"`,
      };

    default:
      return {
        expertType: 'news',
        context: 'Analyze the sentiment and potential impact of this news article.',
        impactGuidelines: 'Use critical thinking to assess real impact vs. noise.',
      };
  }
}

export function validateAnalysisResponse(response: any): boolean {
  try {
    // Check required structure
    if (!response || typeof response !== 'object') return false;

    // Validate sentiment
    if (
      !response.sentiment ||
      !['bullish', 'bearish', 'neutral', 'favorable', 'unfavorable'].includes(response.sentiment.label) ||
      typeof response.sentiment.confidence !== 'number' ||
      response.sentiment.confidence < 0.3 ||  // Updated: minimum 0.3
      response.sentiment.confidence > 0.95 || // Updated: maximum 0.95
      typeof response.sentiment.reasoning !== 'string'
    ) {
      return false;
    }

    // Validate price_impact
    if (
      !response.price_impact ||
      !['critical', 'high', 'medium', 'low'].includes(response.price_impact.level) ||
      !['up', 'down', 'uncertain'].includes(response.price_impact.direction) ||
      typeof response.price_impact.reasoning !== 'string'
    ) {
      return false;
    }

    // Validate summary
    if (
      !response.summary ||
      typeof response.summary.tldr !== 'string' ||
      !Array.isArray(response.summary.key_points) ||
      !Array.isArray(response.summary.entities)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
