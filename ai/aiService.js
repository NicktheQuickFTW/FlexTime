/**
 * AI Service for FlexTime Scheduling
 * 
 * Integrates AI SDK with scheduling engine for:
 * - Constraint conflict resolution
 * - Schedule optimization suggestions
 * - Natural language constraint parsing
 * - Travel efficiency analysis
 */

const { openai } = require('@ai-sdk/openai');
const { anthropic } = require('@ai-sdk/anthropic');
const { xai } = require('@ai-sdk/xai');
const { google } = require('@ai-sdk/google');
const { perplexity } = require('@ai-sdk/perplexity');
const { generateObject, generateText, streamText } = require('ai');
const { z } = require('zod');
const logger = require('../utils/logger');

class AIService {
  constructor(config = {}) {
    this.config = {
      defaultProvider: config.defaultProvider || 'openai',
      model: config.model || 'gpt-4',
      maxTokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.3, // Lower for more deterministic scheduling
      ...config
    };

    logger.info('AI Service initialized', {
      provider: this.config.defaultProvider,
      model: this.config.model
    });
  }

  /**
   * Get AI provider instance
   */
  getProvider(provider = this.config.defaultProvider) {
    switch (provider) {
      case 'openai':
        return openai(this.config.model);
      case 'anthropic':
        return anthropic('claude-3-haiku-20240307');
      case 'grok':
      case 'xai':
        return xai('grok-beta');
      case 'gemini':
      case 'google':
        return google('gemini-1.5-pro');
      case 'perplexity':
        return perplexity('llama-3.1-sonar-large-128k-online');
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  /**
   * Analyze schedule conflicts and suggest resolutions
   */
  async analyzeConflicts(schedule, conflicts) {
    try {
      const prompt = `
        Analyze the following scheduling conflicts for Big 12 Conference sports:

        Schedule Context:
        - Sport: ${schedule.sport}
        - Teams: ${schedule.teams?.length || 0}
        - Games: ${schedule.games?.length || 0}

        Conflicts:
        ${conflicts.map(c => `- ${c.type}: ${c.message}`).join('\n')}

        Provide specific, actionable solutions considering:
        - Big 12 travel partners
        - Conference rules and constraints
        - TV scheduling requirements
        - Campus conflicts and blackout dates

        Focus on practical solutions that maintain schedule integrity.
      `;

      const result = await generateText({
        model: this.getProvider(),
        prompt,
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      logger.info('AI conflict analysis completed', {
        conflictCount: conflicts.length,
        responseLength: result.text.length
      });

      return {
        analysis: result.text,
        suggestions: this.parseResolutionSuggestions(result.text),
        metadata: {
          tokensUsed: result.usage?.totalTokens,
          provider: this.config.defaultProvider
        }
      };

    } catch (error) {
      logger.error('AI conflict analysis failed:', error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate schedule optimization suggestions
   */
  async optimizeSchedule(schedule, preferences = {}) {
    try {
      const schema = z.object({
        optimizations: z.array(z.object({
          type: z.enum(['travel', 'balance', 'conflicts', 'fairness']),
          priority: z.enum(['high', 'medium', 'low']),
          description: z.string(),
          gameChanges: z.array(z.object({
            gameId: z.string(),
            fromDate: z.string(),
            toDate: z.string(),
            reason: z.string()
          })).optional()
        })),
        expectedImprovement: z.object({
          travelEfficiency: z.number().min(0).max(1),
          conflictReduction: z.number().min(0).max(1),
          balanceScore: z.number().min(0).max(1)
        })
      });

      const prompt = `
        Optimize this Big 12 ${schedule.sport} schedule:

        Current Metrics:
        - Travel Efficiency: ${schedule.metrics?.travelEfficiency || 'Unknown'}
        - Conflict Score: ${schedule.metrics?.conflictScore || 'Unknown'}
        - Balance Score: ${schedule.metrics?.balanceScore || 'Unknown'}

        Preferences: ${JSON.stringify(preferences, null, 2)}

        Games Summary:
        ${this.formatGamesForAI(schedule.games?.slice(0, 10) || [])}
        
        Provide specific optimization recommendations with measurable improvements.
      `;

      const result = await generateObject({
        model: this.getProvider(),
        schema,
        prompt,
        maxTokens: this.config.maxTokens
      });

      logger.info('AI schedule optimization completed', {
        optimizationCount: result.object.optimizations.length,
        expectedImprovement: result.object.expectedImprovement
      });

      return result.object;

    } catch (error) {
      logger.error('AI schedule optimization failed:', error);
      throw new Error(`AI optimization failed: ${error.message}`);
    }
  }

  /**
   * Parse natural language constraints
   */
  async parseConstraints(naturalLanguageInput) {
    try {
      const schema = z.object({
        constraints: z.array(z.object({
          type: z.enum(['travel_partner', 'blackout_date', 'campus_conflict', 'rest_day', 'venue_availability']),
          weight: z.number().min(0).max(1),
          description: z.string(),
          parameters: z.object({
            teams: z.array(z.string()).optional(),
            dates: z.array(z.string()).optional(),
            venues: z.array(z.string()).optional()
          })
        }))
      });

      const prompt = `
        Parse this natural language constraint for Big 12 sports scheduling:

        Input: "${naturalLanguageInput}"

        Convert to structured constraints considering:
        - Big 12 team names and abbreviations
        - Common scheduling terminology
        - Date formats and ranges
        - Venue and campus references

        Extract all relevant scheduling constraints.
      `;

      const result = await generateObject({
        model: this.getProvider(),
        schema,
        prompt,
        maxTokens: 500
      });

      logger.info('AI constraint parsing completed', {
        inputLength: naturalLanguageInput.length,
        constraintsFound: result.object.constraints.length
      });

      return result.object.constraints;

    } catch (error) {
      logger.error('AI constraint parsing failed:', error);
      throw new Error(`AI parsing failed: ${error.message}`);
    }
  }

  /**
   * Stream AI responses for real-time feedback
   */
  async streamScheduleAnalysis(schedule, userQuery) {
    try {
      const prompt = `
        Analyze this Big 12 ${schedule.sport} schedule and answer: "${userQuery}"

        Schedule Overview:
        - Teams: ${schedule.teams?.length || 0}
        - Games: ${schedule.games?.length || 0}
        - Conflicts: ${schedule.conflicts?.length || 0}

        Provide a detailed, helpful response about the schedule.
      `;

      const stream = await streamText({
        model: this.getProvider(),
        prompt,
        maxTokens: this.config.maxTokens
      });

      return stream;

    } catch (error) {
      logger.error('AI streaming analysis failed:', error);
      throw new Error(`AI streaming failed: ${error.message}`);
    }
  }

  /**
   * Helper: Format games for AI consumption
   */
  formatGamesForAI(games) {
    return games.map(game => 
      `${game.homeTeam} vs ${game.awayTeam} on ${game.date} at ${game.venue || 'TBD'}`
    ).join('\n');
  }

  /**
   * Helper: Parse resolution suggestions from AI text
   */
  parseResolutionSuggestions(text) {
    // Simple parsing - could be enhanced with more AI
    const suggestions = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      if (line.includes('move') || line.includes('reschedule') || line.includes('swap')) {
        suggestions.push({
          type: 'reschedule',
          description: line.trim()
        });
      } else if (line.includes('partner') || line.includes('travel')) {
        suggestions.push({
          type: 'travel_optimization',
          description: line.trim()
        });
      }
    });

    return suggestions;
  }
}

module.exports = AIService;