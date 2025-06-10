/**
 * AI SDK Service for FlexTime
 * Provides unified interface to all AI providers for scheduling optimization
 */

import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { perplexity } from '@ai-sdk/perplexity';
import { xai } from '@ai-sdk/xai';
import { generateText, generateObject, streamText } from 'ai';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// AI Provider Models Configuration
const AI_MODELS = {
  claude: {
    provider: anthropic,
    model: 'claude-3-5-sonnet-20241022',
    strengths: ['analysis', 'reasoning', 'constraints']
  },
  gpt: {
    provider: openai,
    model: 'gpt-4o',
    strengths: ['optimization', 'creativity', 'general']
  },
  gemini: {
    provider: google,
    model: 'gemini-1.5-pro',
    strengths: ['data analysis', 'structured output']
  },
  sonar: {
    provider: perplexity,
    model: 'sonar-pro',
    strengths: ['research', 'real-time data']
  },
  grok: {
    provider: xai,
    model: 'grok-2',
    strengths: ['creative solutions', 'unconventional approaches']
  }
};

// Schemas for structured outputs
const ScheduleOptimizationSchema = z.object({
  recommendations: z.array(z.object({
    type: z.enum(['travel', 'conflict', 'balance', 'media']),
    priority: z.enum(['high', 'medium', 'low']),
    description: z.string(),
    impact_score: z.number().min(0).max(1)
  })),
  overall_score: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1)
});

const ConstraintAnalysisSchema = z.object({
  violations: z.array(z.object({
    constraint_type: z.string(),
    severity: z.enum(['critical', 'major', 'minor']),
    affected_games: z.array(z.string()),
    suggested_fix: z.string()
  })),
  compliance_score: z.number().min(0).max(1)
});

class AISDKService {
  constructor() {
    this.defaultProvider = 'claude';
    this.apiKeys = this.validateAPIKeys();
  }

  validateAPIKeys() {
    const keys = {
      claude: process.env.ANTHROPIC_API_KEY,
      gpt: process.env.OPENAI_API_KEY,
      gemini: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      sonar: process.env.PERPLEXITY_API_KEY,
      grok: process.env.XAI_API_KEY
    };

    const available = Object.entries(keys)
      .filter(([_, key]) => key)
      .map(([provider, _]) => provider);

    console.log(`🔑 Available AI Providers: ${available.join(', ')}`);
    return keys;
  }

  getModel(providerName = this.defaultProvider) {
    const config = AI_MODELS[providerName];
    if (!config || !this.apiKeys[providerName]) {
      throw new Error(`Provider ${providerName} not available or not configured`);
    }
    return config.provider(config.model);
  }

  /**
   * Generate schedule optimization recommendations
   */
  async optimizeSchedule(scheduleData, sport, provider = 'claude') {
    try {
      const model = this.getModel(provider);
      
      const prompt = `Analyze this Big 12 ${sport} schedule and provide optimization recommendations:

Schedule Data: ${JSON.stringify(scheduleData, null, 2)}

Consider:
- Travel efficiency between Big 12 schools
- Conference balance and competitive fairness
- TV broadcast windows and media requirements
- Campus conflicts and academic calendars
- Sport-specific requirements

Provide structured recommendations for improvement.`;

      const { object } = await generateObject({
        model,
        schema: ScheduleOptimizationSchema,
        prompt
      });

      return {
        success: true,
        provider,
        data: object,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        provider,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Analyze constraint violations
   */
  async analyzeConstraints(schedule, constraints, provider = 'claude') {
    try {
      const model = this.getModel(provider);

      const prompt = `Analyze constraint violations in this Big 12 sports schedule:

Schedule: ${JSON.stringify(schedule, null, 2)}
Constraints: ${JSON.stringify(constraints, null, 2)}

Identify violations and suggest fixes for:
- Travel partner requirements
- Campus conflict avoidance
- BYU Sunday restrictions
- Competitive balance requirements
- Media window requirements`;

      const { object } = await generateObject({
        model,
        schema: ConstraintAnalysisSchema,
        prompt
      });

      return {
        success: true,
        provider,
        data: object,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        provider,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Research scheduling strategies with real-time data
   */
  async researchSchedulingStrategies(sport, season, provider = 'sonar') {
    try {
      const model = this.getModel(provider);

      const prompt = `Research current best practices for ${sport} scheduling in collegiate athletics for ${season} season. Include recent trends, successful strategies from other conferences, and any new considerations for Big 12 scheduling.`;

      const { text } = await generateText({
        model,
        prompt,
        maxTokens: 1000
      });

      return {
        success: true,
        provider,
        data: { research: text },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        provider,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Stream creative scheduling solutions
   */
  async *streamSchedulingSolutions(problem, provider = 'grok') {
    try {
      const model = this.getModel(provider);

      const prompt = `Creative problem-solving for Big 12 scheduling challenge:

Problem: ${problem}

Provide innovative, unconventional solutions that think outside traditional scheduling approaches. Consider:
- Novel travel optimizations
- Creative use of technology
- Unique partnership opportunities
- Non-obvious scheduling patterns`;

      const { textStream } = await streamText({
        model,
        prompt,
        maxTokens: 800
      });

      for await (const delta of textStream) {
        yield {
          success: true,
          provider,
          chunk: delta,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      yield {
        success: false,
        provider,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Multi-provider consensus analysis
   */
  async getConsensusAnalysis(data, prompt, providers = ['claude', 'gpt', 'gemini']) {
    const results = await Promise.allSettled(
      providers.map(async (provider) => {
        if (!this.apiKeys[provider]) return null;
        
        const model = this.getModel(provider);
        const { text } = await generateText({
          model,
          prompt: `${prompt}\n\nData: ${JSON.stringify(data, null, 2)}`,
          maxTokens: 500
        });
        
        return { provider, analysis: text };
      })
    );

    const successful = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    return {
      consensus_count: successful.length,
      analyses: successful,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get provider capabilities and status
   */
  getProviderStatus() {
    return Object.entries(AI_MODELS).map(([name, config]) => ({
      provider: name,
      model: config.model,
      available: !!this.apiKeys[name],
      strengths: config.strengths
    }));
  }
}

// Export singleton instance
export const aiSDK = new AISDKService();
export default aiSDK;