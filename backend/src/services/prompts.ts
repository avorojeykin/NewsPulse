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

  const categoryContext = getCategoryContext(category, ticker);
  const articleText = content ? `\n\nArticle Content:\n${content.substring(0, 1000)}` : '';

  return `You are an expert ${categoryContext.expertType} analyst. Analyze this news article and provide structured JSON output.

${categoryContext.context}

Article Title: ${title}${articleText}

Provide your analysis as a JSON object with this exact structure:
{
  "sentiment": {
    "label": "bullish" | "bearish" | "neutral",
    "confidence": 0.0-1.0,
    "reasoning": "brief explanation (1 sentence)"
  },
  "price_impact": {
    "level": "critical" | "high" | "medium" | "low",
    "direction": "up" | "down" | "uncertain",
    "reasoning": "brief explanation (1 sentence)"
  },
  "summary": {
    "tldr": "2-3 sentence summary",
    "key_points": ["point 1", "point 2", "point 3"],
    "entities": ["entity1", "entity2"]
  }
}

IMPORTANT: Respond ONLY with valid JSON. No additional text or explanation.`;
}

function getCategoryContext(
  category: string,
  ticker?: string
): { expertType: string; context: string } {
  switch (category) {
    case 'crypto':
      return {
        expertType: 'cryptocurrency',
        context: `Focus on:
- Sentiment: Bullish (positive for crypto prices), Bearish (negative), or Neutral
- Impact: Critical (regulatory/major hacks), High (exchange listings/ETF news), Medium (partnerships), Low (opinion pieces)
- Consider: Regulatory changes, adoption news, technical developments, market sentiment
- Entities: Extract cryptocurrency names, companies, protocols mentioned`,
      };

    case 'stocks':
      return {
        expertType: 'stock market',
        context: `${ticker ? `Analyzing news for ${ticker}. ` : ''}Focus on:
- Sentiment: Bullish (positive for stock price), Bearish (negative), or Neutral
- Impact: Critical (earnings surprises/major events), High (earnings/guidance), Medium (analyst upgrades/downgrades), Low (general news)
- Consider: Earnings reports, guidance changes, analyst ratings, market trends, sector news
- Entities: Extract company names, tickers, executives, sectors mentioned`,
      };

    case 'sports':
      return {
        expertType: 'sports betting',
        context: `Focus on:
- Sentiment: Bullish (favorable for betting outcomes), Bearish (unfavorable), or Neutral
- Impact: Critical (game-changing injuries/suspensions), High (starting lineup changes), Medium (performance trends), Low (general commentary)
- Consider: Injuries, suspensions, lineup changes, recent performance, betting trends
- Entities: Extract team names, player names, sports leagues mentioned`,
      };

    default:
      return {
        expertType: 'news',
        context: 'Analyze the sentiment and potential impact of this news article.',
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
      !['bullish', 'bearish', 'neutral'].includes(response.sentiment.label) ||
      typeof response.sentiment.confidence !== 'number' ||
      response.sentiment.confidence < 0 ||
      response.sentiment.confidence > 1 ||
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
