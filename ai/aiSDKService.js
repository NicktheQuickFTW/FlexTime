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
import Redis from 'redis';
import crypto from 'crypto';

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
    this.serviceId = 'ai_sdk_service';
    
    // Redis setup for caching and agent coordination
    this.redis = null;
    this.initializeRedis();
    
    // Cache configuration
    this.cacheConfig = {
      optimization: { ttl: 3600, prefix: 'ai:optimization:' },  // 1 hour
      constraints: { ttl: 7200, prefix: 'ai:constraints:' },    // 2 hours
      research: { ttl: 21600, prefix: 'ai:research:' },         // 6 hours
      consensus: { ttl: 1800, prefix: 'ai:consensus:' }         // 30 minutes
    };
    
    // Performance metrics
    this.metrics = {
      requests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      averageResponseTime: 0,
      providerUsage: {},
      lastReset: new Date().toISOString()
    };
  }

  /**
   * Initialize Redis connection for caching and coordination
   */
  async initializeRedis() {
    try {
      this.redis = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      
      await this.redis.connect();
      
      // Subscribe to agent coordination for AI requests
      await this.redis.subscribe('flextime:agents:ai_requests', (message) => {
        this.handleAgentAIRequest(JSON.parse(message));
      });
      
      console.log(`🤖 [${this.serviceId}] Connected to Redis for AI caching and coordination`);
    } catch (error) {
      console.warn(`⚠️  [${this.serviceId}] Redis connection failed, running without cache:`, error.message);
    }
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

    console.log(`🔑 [${this.serviceId}] Available AI Providers: ${available.join(', ')}`);
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
   * Generate schedule optimization recommendations with Redis caching
   */
  async optimizeSchedule(scheduleData, sport, provider = 'claude') {
    const startTime = Date.now();
    this.metrics.requests++;
    
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey('optimization', { scheduleData, sport, provider });
      
      // Check cache first
      const cached = await this.getCachedResult(cacheKey, 'optimization');
      if (cached) {
        this.metrics.cacheHits++;
        this.updateMetrics(Date.now() - startTime, provider);
        return { ...cached, metadata: { ...cached.metadata, cached: true } };
      }
      
      this.metrics.cacheMisses++;
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

      const result = {
        success: true,
        provider,
        data: object,
        timestamp: new Date().toISOString(),
        metadata: {
          serviceId: this.serviceId,
          processingTime: Date.now() - startTime,
          cached: false
        }
      };
      
      // Cache result
      await this.cacheResult(cacheKey, result, 'optimization');
      this.updateMetrics(Date.now() - startTime, provider);
      
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.updateMetrics(Date.now() - startTime, provider);
      
      return {
        success: false,
        provider,
        error: error.message,
        timestamp: new Date().toISOString(),
        metadata: {
          serviceId: this.serviceId,
          processingTime: Date.now() - startTime,
          error: true
        }
      };
    }
  }

  /**
   * Analyze constraint violations with Redis caching
   */
  async analyzeConstraints(schedule, constraints, provider = 'claude') {
    const startTime = Date.now();
    this.metrics.requests++;
    
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey('constraints', { schedule, constraints, provider });
      
      // Check cache first
      const cached = await this.getCachedResult(cacheKey, 'constraints');
      if (cached) {
        this.metrics.cacheHits++;
        this.updateMetrics(Date.now() - startTime, provider);
        return { ...cached, metadata: { ...cached.metadata, cached: true } };
      }
      
      this.metrics.cacheMisses++;
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

      const result = {
        success: true,
        provider,
        data: object,
        timestamp: new Date().toISOString(),
        metadata: {
          serviceId: this.serviceId,
          processingTime: Date.now() - startTime,
          cached: false
        }
      };
      
      // Cache result
      await this.cacheResult(cacheKey, result, 'constraints');
      this.updateMetrics(Date.now() - startTime, provider);
      
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.updateMetrics(Date.now() - startTime, provider);
      
      return {
        success: false,
        provider,
        error: error.message,
        timestamp: new Date().toISOString(),
        metadata: {
          serviceId: this.serviceId,
          processingTime: Date.now() - startTime,
          error: true
        }
      };
    }
  }

  /**
   * Research scheduling strategies with real-time data and caching
   */
  async researchSchedulingStrategies(sport, season, provider = 'sonar') {
    const startTime = Date.now();
    this.metrics.requests++;
    
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey('research', { sport, season, provider });
      
      // Check cache first
      const cached = await this.getCachedResult(cacheKey, 'research');
      if (cached) {
        this.metrics.cacheHits++;
        this.updateMetrics(Date.now() - startTime, provider);
        return { ...cached, metadata: { ...cached.metadata, cached: true } };
      }
      
      this.metrics.cacheMisses++;
      const model = this.getModel(provider);

      const prompt = `Research current best practices for ${sport} scheduling in collegiate athletics for ${season} season. Include recent trends, successful strategies from other conferences, and any new considerations for Big 12 scheduling.`;

      const { text } = await generateText({
        model,
        prompt,
        maxTokens: 1000
      });

      const result = {
        success: true,
        provider,
        data: { research: text },
        timestamp: new Date().toISOString(),
        metadata: {
          serviceId: this.serviceId,
          processingTime: Date.now() - startTime,
          cached: false
        }
      };
      
      // Cache result (longer TTL for research)
      await this.cacheResult(cacheKey, result, 'research');
      this.updateMetrics(Date.now() - startTime, provider);
      
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.updateMetrics(Date.now() - startTime, provider);
      
      return {
        success: false,
        provider,
        error: error.message,
        timestamp: new Date().toISOString(),
        metadata: {
          serviceId: this.serviceId,
          processingTime: Date.now() - startTime,
          error: true
        }
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
   * Multi-provider consensus analysis with caching
   */
  async getConsensusAnalysis(data, prompt, providers = ['claude', 'gpt', 'gemini']) {
    const startTime = Date.now();
    this.metrics.requests++;
    
    try {
      // Generate cache key for consensus
      const cacheKey = this.generateCacheKey('consensus', { data, prompt, providers });
      
      // Check cache first
      const cached = await this.getCachedResult(cacheKey, 'consensus');
      if (cached) {
        this.metrics.cacheHits++;
        this.updateMetrics(Date.now() - startTime, 'consensus');
        return { ...cached, metadata: { ...cached.metadata, cached: true } };
      }
      
      this.metrics.cacheMisses++;
      
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

      const result = {
        consensus_count: successful.length,
        analyses: successful,
        timestamp: new Date().toISOString(),
        metadata: {
          serviceId: this.serviceId,
          processingTime: Date.now() - startTime,
          providersUsed: providers,
          cached: false
        }
      };
      
      // Cache consensus result
      await this.cacheResult(cacheKey, result, 'consensus');
      this.updateMetrics(Date.now() - startTime, 'consensus');
      
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.updateMetrics(Date.now() - startTime, 'consensus');
      
      return {
        consensus_count: 0,
        analyses: [],
        error: error.message,
        timestamp: new Date().toISOString(),
        metadata: {
          serviceId: this.serviceId,
          processingTime: Date.now() - startTime,
          error: true
        }
      };
    }
  }

  /**
   * Generate cache key for Redis storage
   */
  generateCacheKey(type, data) {
    const hash = crypto.createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
      .substring(0, 16);
    return `${this.cacheConfig[type].prefix}${hash}`;
  }

  /**
   * Cache AI result in Redis
   */
  async cacheResult(key, result, type) {
    if (!this.redis) return;
    
    try {
      const ttl = this.cacheConfig[type].ttl;
      await this.redis.setEx(key, ttl, JSON.stringify(result));
      console.log(`💾 [${this.serviceId}] Cached ${type} result for ${ttl}s`);
    } catch (error) {
      console.error(`❌ [${this.serviceId}] Failed to cache result:`, error);
    }
  }

  /**
   * Retrieve cached result from Redis
   */
  async getCachedResult(key, type) {
    if (!this.redis) return null;
    
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        console.log(`🎯 [${this.serviceId}] Cache hit for ${type}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error(`❌ [${this.serviceId}] Failed to retrieve cache:`, error);
    }
    
    return null;
  }

  /**
   * Handle AI requests from other agents
   */
  async handleAgentAIRequest(message) {
    console.log(`📩 [${this.serviceId}] Received AI request from ${message.from}: ${message.type}`);
    
    try {
      let result;
      
      switch (message.type) {
        case 'optimization_request':
          result = await this.optimizeSchedule(
            message.data.schedule,
            message.data.sport,
            message.data.provider || 'claude'
          );
          break;
          
        case 'constraint_analysis_request':
          result = await this.analyzeConstraints(
            message.data.schedule,
            message.data.constraints,
            message.data.provider || 'claude'
          );
          break;
          
        case 'research_request':
          result = await this.researchSchedulingStrategies(
            message.data.sport,
            message.data.season,
            message.data.provider || 'sonar'
          );
          break;
          
        case 'consensus_request':
          result = await this.getConsensusAnalysis(
            message.data.data,
            message.data.prompt,
            message.data.providers
          );
          break;
          
        default:
          console.log(`🤷 [${this.serviceId}] Unknown AI request type: ${message.type}`);
          return;
      }
      
      // Publish result back to requesting agent
      await this.publishAIResult(result, message.from, message.requestId);
      
    } catch (error) {
      console.error(`❌ [${this.serviceId}] Failed to handle AI request:`, error);
      
      // Send error response
      await this.publishAIResult({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }, message.from, message.requestId);
    }
  }

  /**
   * Publish AI result back to requesting agent
   */
  async publishAIResult(result, targetAgent, requestId) {
    if (!this.redis) return;
    
    try {
      const message = {
        from: this.serviceId,
        to: targetAgent,
        requestId: requestId,
        timestamp: new Date().toISOString(),
        type: 'ai_response',
        data: result
      };
      
      await this.redis.publish('flextime:agents:ai_responses', JSON.stringify(message));
      console.log(`📡 [${this.serviceId}] Published AI result to ${targetAgent}`);
    } catch (error) {
      console.error(`❌ [${this.serviceId}] Failed to publish AI result:`, error);
    }
  }

  /**
   * Update performance metrics
   */
  updateMetrics(processingTime, provider) {
    // Update provider usage
    if (!this.metrics.providerUsage[provider]) {
      this.metrics.providerUsage[provider] = 0;
    }
    this.metrics.providerUsage[provider]++;
    
    // Update rolling average response time
    const totalRequests = this.metrics.requests;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalRequests - 1) + processingTime) / totalRequests;
  }

  /**
   * Get comprehensive service metrics
   */
  getMetrics() {
    const now = new Date();
    const uptime = now - new Date(this.metrics.lastReset);
    
    return {
      ...this.metrics,
      uptime: uptime,
      cacheHitRate: this.metrics.requests > 0 ? 
        (this.metrics.cacheHits / this.metrics.requests) * 100 : 0,
      errorRate: this.metrics.requests > 0 ? 
        (this.metrics.errors / this.metrics.requests) * 100 : 0,
      requestsPerMinute: this.metrics.requests / (uptime / 60000),
      redis_connected: !!this.redis?.isReady,
      timestamp: now.toISOString()
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.metrics = {
      requests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      averageResponseTime: 0,
      providerUsage: {},
      lastReset: new Date().toISOString()
    };
    
    console.log(`🔄 [${this.serviceId}] Metrics reset`);
  }

  /**
   * Get provider capabilities and status
   */
  getProviderStatus() {
    return Object.entries(AI_MODELS).map(([name, config]) => ({
      provider: name,
      model: config.model,
      available: !!this.apiKeys[name],
      strengths: config.strengths,
      usage: this.metrics.providerUsage[name] || 0
    }));
  }

  /**
   * Cleanup Redis connections
   */
  async shutdown() {
    console.log(`🔌 [${this.serviceId}] Shutting down AI SDK service`);
    
    if (this.redis) {
      await this.redis.unsubscribe('flextime:agents:ai_requests');
      await this.redis.quit();
      console.log(`✅ [${this.serviceId}] Disconnected from Redis`);
    }
  }
}

// Export singleton instance
export const aiSDK = new AISDKService();
export default aiSDK;