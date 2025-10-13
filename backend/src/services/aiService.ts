/**
 * AI Service - OpenRouter Integration
 * Handles communication with OpenRouter API for news analysis
 */

import { generateAnalysisPrompt, validateAnalysisResponse, PromptConfig } from './prompts.js';

// OpenRouter Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const MODEL = 'moonshotai/kimi-k2:free'; // Free model - $0.00 per request

// Site Configuration for OpenRouter rankings
const SITE_URL = process.env.SITE_URL || 'https://newspulse.app';
const SITE_NAME = 'NewsPulse';

export interface AIAnalysisResult {
  sentiment: {
    label: 'bullish' | 'bearish' | 'neutral';
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
    this.apiKey = OPENROUTER_API_KEY;
    this.baseUrl = OPENROUTER_BASE_URL;
    this.model = MODEL;

    if (!this.apiKey) {
      console.warn('⚠️  OPENROUTER_API_KEY not set - AI features will be disabled');
    }
  }

  /**
   * Analyze a news article using AI
   */
  async analyzeNews(config: PromptConfig): Promise<AIAnalysisResult | null> {
    if (!this.apiKey) {
      console.error('❌ OpenRouter API key not configured');
      return null;
    }

    try {
      const prompt = generateAnalysisPrompt(config);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': SITE_URL,
          'X-Title': SITE_NAME,
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
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ OpenRouter API error (${response.status}):`, errorText);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.error('❌ No content in OpenRouter response');
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

      console.log(`✅ AI parsed successfully: ${analysisResult.sentiment.label} (${Math.round(analysisResult.sentiment.confidence * 100)}%) | ${analysisResult.price_impact.level}`);

      return analysisResult;
    } catch (error) {
      console.error('❌ Error calling OpenRouter API:', error);
      return null;
    }
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get service status
   */
  getStatus(): { available: boolean; model: string; baseUrl: string } {
    return {
      available: this.isAvailable(),
      model: this.model,
      baseUrl: this.baseUrl,
    };
  }
}

// Export singleton instance
export const aiService = new AIService();
