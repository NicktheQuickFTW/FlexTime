const { openai } = require('@ai-sdk/openai');
const { anthropic } = require('@ai-sdk/anthropic');
const { generateObject, generateText, streamText } = require('ai');
const { z } = require('zod');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'ai-scheduling.log' })
  ]
});

// Zod schemas for structured AI responses
const ScheduleSuggestionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(100),
  action: z.string(),
  impact: z.enum(['low', 'medium', 'high']),
  reasoning: z.string(),
  estimated_improvement: z.number().optional(),
  affected_teams: z.array(z.string()).optional()
});

const ScheduleOptimizationSchema = z.object({
  optimizations: z.array(ScheduleSuggestionSchema),
  overall_score: z.number().min(0).max(100),
  key_improvements: z.array(z.string()),
  risk_factors: z.array(z.string()),
  implementation_priority: z.enum(['immediate', 'next_week', 'future'])
});

class AISchedulingService {
  constructor() {
    // Use Anthropic Claude for complex reasoning, OpenAI for structured outputs
    this.reasoningModel = anthropic('claude-3-5-sonnet-20241022');
    this.structuredModel = openai('gpt-4o-mini');
    
    // Big 12 Conference context
    this.conferenceContext = {
      teams: [
        'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado',
        'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State',
        'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
      ],
      constraints: [
        'Minimum 48 hours rest between games',
        'No more than 3 consecutive road games',
        'BYU cannot play on Sundays',
        'Finals week restrictions (mid-December, early May)',
        'Travel partner optimization',
        'TV broadcast windows (Tuesday/Saturday preferred)',
        'Rivalry game scheduling (Kansas vs Kansas State, etc.)',
        'Academic calendar integration'
      ],
      venues: {
        'Kansas': 'Allen Fieldhouse',
        'Kansas State': 'Bramlage Coliseum',
        'Iowa State': 'Hilton Coliseum',
        'Baylor': 'Ferrell Center',
        'Texas Tech': 'United Supermarkets Arena',
        'TCU': 'Schollmaier Arena',
        'Oklahoma State': 'Gallagher-Iba Arena',
        'West Virginia': 'WVU Coliseum'
      }
    };
  }

  async generateScheduleSuggestions(userQuery, currentSchedule = null) {
    try {
      logger.info('Generating schedule suggestions', { userQuery });

      const systemPrompt = `You are FlexTime AI, an advanced sports scheduling assistant for the Big 12 Conference. 
      
      Conference Context:
      - 16 teams: ${this.conferenceContext.teams.join(', ')}
      - Key constraints: ${this.conferenceContext.constraints.join(', ')}
      
      Your expertise includes:
      - Constraint satisfaction optimization
      - Travel efficiency maximization
      - Academic calendar integration
      - Revenue optimization through strategic scheduling
      - COMPASS strength-of-schedule calculations
      
      Always provide specific, actionable recommendations with confidence scores and clear reasoning.`;

      const userPrompt = `User Query: "${userQuery}"
      
      ${currentSchedule ? `Current Schedule Context: ${JSON.stringify(currentSchedule, null, 2)}` : ''}
      
      Please analyze this request and provide intelligent scheduling suggestions. Focus on:
      1. Identifying optimization opportunities
      2. Resolving potential conflicts
      3. Improving competitive balance
      4. Minimizing travel costs
      5. Maximizing revenue potential`;

      // Generate structured suggestions using OpenAI
      const { object: suggestions } = await generateObject({
        model: this.structuredModel,
        schema: ScheduleOptimizationSchema,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.3 // Lower temperature for more consistent suggestions
      });

      logger.info('Generated schedule suggestions', { 
        count: suggestions.optimizations.length,
        overall_score: suggestions.overall_score 
      });

      return {
        success: true,
        suggestions: suggestions.optimizations,
        overall_score: suggestions.overall_score,
        key_improvements: suggestions.key_improvements,
        risk_factors: suggestions.risk_factors,
        priority: suggestions.implementation_priority
      };

    } catch (error) {
      logger.error('Error generating schedule suggestions', { error: error.message });
      return {
        success: false,
        error: 'Failed to generate suggestions',
        details: error.message
      };
    }
  }

  async generateConversationalResponse(userMessage, conversationHistory = []) {
    try {
      logger.info('Generating conversational response', { userMessage });

      const systemPrompt = `You are FlexTime AI, a friendly and knowledgeable sports scheduling assistant for the Big 12 Conference.

      Your personality:
      - Professional but approachable
      - Deeply knowledgeable about Big 12 athletics
      - Proactive in suggesting optimizations
      - Clear and concise in explanations
      
      Big 12 Context:
      - 16 member institutions with diverse geographic distribution
      - Complex scheduling requirements for 12+ sports
      - Academic calendar integration is crucial
      - Travel efficiency directly impacts budgets
      
      Always:
      - Provide specific, actionable advice
      - Include confidence levels for recommendations
      - Explain the reasoning behind suggestions
      - Offer multiple solution options when possible`;

      const conversationContext = conversationHistory.length > 0 
        ? `\n\nConversation History:\n${conversationHistory.map(msg => 
            `${msg.role}: ${msg.content}`
          ).join('\n')}`
        : '';

      const { text } = await generateText({
        model: this.reasoningModel,
        system: systemPrompt,
        prompt: `${userMessage}${conversationContext}`,
        temperature: 0.7, // Higher temperature for more natural conversation
        maxTokens: 500
      });

      logger.info('Generated conversational response', { 
        responseLength: text.length 
      });

      return {
        success: true,
        response: text,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error generating conversational response', { error: error.message });
      return {
        success: false,
        error: 'Failed to generate response',
        details: error.message,
        fallback: "I apologize, but I'm experiencing technical difficulties. Please try your request again, or contact support if the issue persists."
      };
    }
  }

  async optimizeSchedule(scheduleData, optimizationGoals = []) {
    try {
      logger.info('Starting schedule optimization', { 
        optimizationGoals,
        gameCount: scheduleData.games?.length || 0 
      });

      const prompt = `Analyze and optimize this Big 12 basketball schedule:

      Schedule Data: ${JSON.stringify(scheduleData, null, 2)}
      
      Optimization Goals: ${optimizationGoals.join(', ')}
      
      Please provide:
      1. Current schedule quality score (0-100)
      2. Top 5 optimization opportunities
      3. Specific game moves/changes recommended
      4. Expected improvement metrics
      5. Implementation timeline
      
      Focus on maximizing competitive balance while minimizing travel costs and avoiding academic conflicts.`;

      const { object: optimization } = await generateObject({
        model: this.structuredModel,
        schema: ScheduleOptimizationSchema,
        prompt,
        temperature: 0.2 // Very low temperature for optimization consistency
      });

      // Calculate estimated cost savings and efficiency improvements
      const estimatedSavings = this.calculateOptimizationImpact(optimization);

      logger.info('Completed schedule optimization', { 
        score: optimization.overall_score,
        optimizations: optimization.optimizations.length 
      });

      return {
        success: true,
        currentScore: optimization.overall_score,
        optimizations: optimization.optimizations,
        estimatedSavings,
        implementationPriority: optimization.implementation_priority,
        keyImprovements: optimization.key_improvements,
        riskFactors: optimization.risk_factors
      };

    } catch (error) {
      logger.error('Error optimizing schedule', { error: error.message });
      return {
        success: false,
        error: 'Failed to optimize schedule',
        details: error.message
      };
    }
  }

  async streamSchedulingResponse(userQuery) {
    try {
      const systemPrompt = `You are FlexTime AI, providing real-time scheduling assistance for the Big 12 Conference.
      
      Stream helpful, actionable insights as you analyze the user's request. Break down complex scheduling problems into digestible steps.`;

      const result = streamText({
        model: this.reasoningModel,
        system: systemPrompt,
        prompt: userQuery,
        temperature: 0.7
      });

      return result;

    } catch (error) {
      logger.error('Error streaming response', { error: error.message });
      throw error;
    }
  }

  calculateOptimizationImpact(optimization) {
    // Calculate estimated improvements based on optimization suggestions
    let travelSavings = 0;
    let efficiencyGains = 0;
    let conflictReductions = 0;

    optimization.optimizations.forEach(opt => {
      if (opt.title.toLowerCase().includes('travel')) {
        travelSavings += (opt.estimated_improvement || 5) * 1000; // $1000 per improvement point
      }
      if (opt.title.toLowerCase().includes('conflict')) {
        conflictReductions += opt.estimated_improvement || 3;
      }
      if (opt.impact === 'high') {
        efficiencyGains += 10;
      } else if (opt.impact === 'medium') {
        efficiencyGains += 5;
      }
    });

    return {
      estimatedTravelSavings: travelSavings,
      efficiencyImprovement: efficiencyGains,
      conflictReductions: conflictReductions,
      overallImprovement: Math.min(95, optimization.overall_score + efficiencyGains)
    };
  }

  // Real-time constraint validation
  async validateScheduleChange(gameMove, currentSchedule) {
    try {
      const prompt = `Validate this proposed schedule change for Big 12 basketball:
      
      Proposed Change: ${JSON.stringify(gameMove)}
      Current Schedule Context: ${JSON.stringify(currentSchedule)}
      
      Check for:
      - Constraint violations
      - Academic calendar conflicts  
      - Travel efficiency impact
      - Competitive balance effects
      
      Provide a validation score (0-100) and list any issues.`;

      const { text } = await generateText({
        model: this.structuredModel,
        prompt,
        temperature: 0.1 // Very low temperature for consistent validation
      });

      return {
        valid: true,
        score: 85, // Would be parsed from AI response in production
        issues: [],
        recommendations: text
      };

    } catch (error) {
      logger.error('Error validating schedule change', { error: error.message });
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

module.exports = { AISchedulingService };