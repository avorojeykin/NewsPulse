/**
 * AI Service - Groq Integration
 * Handles communication with Groq API for news analysis
 * Free tier limits: 14.4K RPD (requests/day), 30 RPM (requests/minute)
 */

import { generateAnalysisPrompt, validateAnalysisResponse, PromptConfig } from './prompts.js';

// Groq Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const MODEL = 'llama-3.1-8b-instant'; // Free tier: 14.4K RPD, 30 RPM, 6K TPM

// Daily quota tracking (reset at midnight UTC)
let dailyRequestCount = 0;
let lastResetDate = new Date().toISOString().split('T')[0];
const DAILY_LIMIT = 14000; // Leave 400 as buffer (out of 14,400)
const RATE_LIMIT_RPM = 30; // Requests per minute

export interface AIAnalysisResult {
  sentiment: {
    label: 'bullish' | 'bearish' | 'neutral' | 'favorable' | 'unfavorable';
    confidence: number;
    reasoning: string;
  };
  price_impact: {
    level: 'critical' | 'high' | 'medium' | 'low';
    direction: 'up' | 'down' | 'uncertain';
    reasoning: string;
  };
  summary: {
    tldr: string;
    key_points: string[];
    entities: string[];
  };
}

export class AIService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = GROQ_API_KEY;
    this.baseUrl = GROQ_BASE_URL;
    this.model = MODEL;

    if (!this.apiKey) {
      console.warn('⚠️  GROQ_API_KEY not set - AI features will be disabled');
    }
  }

  /**
   * Reset daily quota counter if it's a new day
   */
  private checkAndResetQuota(): void {
    const today = new Date().toISOString().split('T')[0];
    if (today !== lastResetDate) {
      console.log(`📊 Daily quota reset: ${dailyRequestCount} requests used yesterday`);
      dailyRequestCount = 0;
      lastResetDate = today;
    }
  }

  /**
   * Check if we're within quota limits
   */
  private isWithinQuota(): boolean {
    this.checkAndResetQuota();
    return dailyRequestCount < DAILY_LIMIT;
  }

  /**
   * Get remaining quota for today
   */
  public getRemainingQuota(): { used: number; limit: number; remaining: number; percentage: number } {
    this.checkAndResetQuota();
    const remaining = DAILY_LIMIT - dailyRequestCount;
    const percentage = Math.round((dailyRequestCount / DAILY_LIMIT) * 100);
    return {
      used: dailyRequestCount,
      limit: DAILY_LIMIT,
      remaining,
      percentage,
    };
  }

  /**
   * Analyze a news article using AI
   */
  async analyzeNews(config: PromptConfig): Promise<AIAnalysisResult | null> {
    console.log(`\n🤖 [AI-SERVICE] analyzeNews called`);
    console.log(`📊 [AI-SERVICE] Config:`, {
      category: config.category,
      ticker: config.ticker || 'none',
      titleLength: config.title.length,
      contentLength: config.content?.length || 0,
      hasUrl: !!config.url,
    });

    if (!this.apiKey) {
      console.error('❌ [AI-SERVICE] Groq API key not configured');
      return null;
    }
    console.log(`✅ [AI-SERVICE] API key is configured`);

    // Check quota before making request
    console.log(`🔍 [AI-SERVICE] Checking quota...`);
    if (!this.isWithinQuota()) {
      const quota = this.getRemainingQuota();
      console.warn(`⚠️  [AI-SERVICE] Daily quota exceeded: ${quota.used}/${quota.limit} requests used`);
      return null;
    }
    const quota = this.getRemainingQuota();
    console.log(`✅ [AI-SERVICE] Quota OK: ${quota.used}/${quota.limit} (${quota.percentage}%)`);

    try {
      console.log(`🔍 [AI-SERVICE] Generating prompt...`);
      const prompt = generateAnalysisPrompt(config);
      console.log(`📝 [AI-SERVICE] Prompt generated (${prompt.length} chars)`);
      console.log(`📝 [AI-SERVICE] Prompt preview (first 300 chars):`, prompt.substring(0, 300) + '...');

      console.log(`🔍 [AI-SERVICE] Sending request to Groq API...`);
      console.log(`📊 [AI-SERVICE] Request params:`, {
        model: this.model,
        temperature: 0.3,
        max_tokens: 600,
      });

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3, // Lower temperature for more consistent analysis
          max_tokens: 600, // Optimized for concise responses
        }),
      });

      // Increment quota counter
      dailyRequestCount++;
      console.log(`📊 [AI-SERVICE] Quota incremented: ${dailyRequestCount}/${DAILY_LIMIT}`);

      console.log(`📊 [AI-SERVICE] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [AI-SERVICE] Groq API error (${response.status}):`, errorText);
        return null;
      }

      console.log(`✅ [AI-SERVICE] Response OK, parsing JSON...`);
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.error('❌ [AI-SERVICE] No content in Groq response');
        console.error('❌ [AI-SERVICE] Response data:', JSON.stringify(data, null, 2));
        return null;
      }

      console.log(`✅ [AI-SERVICE] Content received (${content.length} chars)`);
      console.log(`🔍 [AI-SERVICE] AI raw response (first 200 chars): ${content.substring(0, 200)}...`);

      // Parse JSON response
      console.log(`🔍 [AI-SERVICE] Parsing JSON response...`);
      let analysisResult: AIAnalysisResult;
      try {
        let jsonStr = content.trim();

        // Try 1: Extract from markdown code blocks if present
        console.log(`🔍 [AI-SERVICE] Try 1: Checking for markdown code blocks...`);
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1].trim();
          console.log(`✅ [AI-SERVICE] Extracted JSON from code block`);
        } else {
          console.log(`ℹ️ [AI-SERVICE] No code blocks found, using raw content`);
        }

        // Try 2: Extract JSON from text with markdown headers (e.g., "**Sentiment:**\n{...}")
        // Look for the first { and last } to extract just the JSON object
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
          const extractedJson = jsonStr.substring(firstBrace, lastBrace + 1);
          if (extractedJson !== jsonStr) {
            console.log(`🔍 [AI-SERVICE] Try 2: Extracted JSON from position ${firstBrace} to ${lastBrace}`);
            jsonStr = extractedJson;
          }
        }

        // Try 3: Parse as-is
        console.log(`🔍 [AI-SERVICE] Try 3: Parsing JSON (${jsonStr.length} chars)...`);
        try {
          analysisResult = JSON.parse(jsonStr);
          console.log(`✅ [AI-SERVICE] JSON parsed successfully`);
        } catch (firstError) {
          console.log(`⚠️ [AI-SERVICE] Try 3 failed, attempting bracket cleanup...`);
          // Try 4: Remove trailing extra braces (common AI error)
          // Find the position of the last valid closing brace
          let bracketCount = 0;
          let lastValidIndex = -1;

          for (let i = 0; i < jsonStr.length; i++) {
            if (jsonStr[i] === '{') bracketCount++;
            if (jsonStr[i] === '}') {
              bracketCount--;
              if (bracketCount === 0) {
                lastValidIndex = i;
                break;
              }
            }
          }

          if (lastValidIndex > 0) {
            const cleanedJson = jsonStr.substring(0, lastValidIndex + 1);
            console.log(`🔍 [AI-SERVICE] Try 4: Parsing cleaned JSON (${cleanedJson.length} chars)...`);
            analysisResult = JSON.parse(cleanedJson);
            console.log('⚠️  [AI-SERVICE] Fixed malformed JSON by removing trailing characters');
          } else {
            console.error(`❌ [AI-SERVICE] Could not fix malformed JSON`);
            throw firstError;
          }
        }
      } catch (parseError) {
        console.error('❌ [AI-SERVICE] Failed to parse AI response as JSON:', content);
        console.error('❌ [AI-SERVICE] Parse error:', parseError);
        return null;
      }

      // Validate response structure
      console.log(`🔍 [AI-SERVICE] Validating response structure...`);
      if (!validateAnalysisResponse(analysisResult)) {
        console.error('❌ [AI-SERVICE] Invalid AI response structure:', JSON.stringify(analysisResult, null, 2));
        return null;
      }
      console.log(`✅ [AI-SERVICE] Response structure is valid`);

      const quotaFinal = this.getRemainingQuota();
      console.log(
        `✅ [AI-SERVICE] AI parsed successfully: ${analysisResult.sentiment.label} (${Math.round(analysisResult.sentiment.confidence * 100)}%) | ${analysisResult.price_impact.level} | Quota: ${quotaFinal.used}/${quotaFinal.limit} (${quotaFinal.percentage}%)`
      );

      return analysisResult;
    } catch (error) {
      console.error('❌ [AI-SERVICE] Error calling Groq API:', error);
      console.error('❌ [AI-SERVICE] Error details:', error instanceof Error ? error.message : String(error));
      console.error('❌ [AI-SERVICE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return null;
    }
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return !!this.apiKey && this.isWithinQuota();
  }

  /**
   * Get service status
   */
  getStatus(): {
    available: boolean;
    model: string;
    baseUrl: string;
    quota: { used: number; limit: number; remaining: number; percentage: number };
  } {
    return {
      available: this.isAvailable(),
      model: this.model,
      baseUrl: this.baseUrl,
      quota: this.getRemainingQuota(),
    };
  }
}

// Export singleton instance
export const aiService = new AIService();
