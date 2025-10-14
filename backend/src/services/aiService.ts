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
    if (!this.apiKey) {
      console.error('❌ Groq API key not configured');
      return null;
    }

    // Check quota before making request
    if (!this.isWithinQuota()) {
      const quota = this.getRemainingQuota();
      console.warn(`⚠️  Daily quota exceeded: ${quota.used}/${quota.limit} requests used`);
      return null;
    }

    try {
      const prompt = generateAnalysisPrompt(config);

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
          max_tokens: 800, // Reduced from 1000 to save token quota
        }),
      });

      // Increment quota counter
      dailyRequestCount++;

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Groq API error (${response.status}):`, errorText);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.error('❌ No content in Groq response');
        return null;
      }

      console.log(`🔍 AI raw response (first 200 chars): ${content.substring(0, 200)}...`);

      // Parse JSON response
      let analysisResult: AIAnalysisResult;
      try {
        let jsonStr = content.trim();

        // Try 1: Extract from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1].trim();
        }

        // Try 2: Parse as-is
        try {
          analysisResult = JSON.parse(jsonStr);
        } catch (firstError) {
          // Try 3: Remove trailing extra braces (common AI error)
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
            analysisResult = JSON.parse(cleanedJson);
            console.log('⚠️  Fixed malformed JSON by removing trailing characters');
          } else {
            throw firstError;
          }
        }
      } catch (parseError) {
        console.error('❌ Failed to parse AI response as JSON:', content);
        return null;
      }

      // Validate response structure
      if (!validateAnalysisResponse(analysisResult)) {
        console.error('❌ Invalid AI response structure:', analysisResult);
        return null;
      }

      const quota = this.getRemainingQuota();
      console.log(
        `✅ AI parsed successfully: ${analysisResult.sentiment.label} (${Math.round(analysisResult.sentiment.confidence * 100)}%) | ${analysisResult.price_impact.level} | Quota: ${quota.used}/${quota.limit} (${quota.percentage}%)`
      );

      return analysisResult;
    } catch (error) {
      console.error('❌ Error calling Groq API:', error);
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
