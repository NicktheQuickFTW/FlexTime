/**
 * Intelligent Model Allocation for FlexTime Agents
 * 
 * This module optimizes model selection based on task complexity,
 * balancing performance and cost effectiveness.
 */

const logger = require('../scripts/logger");

/**
 * Model allocation optimizer for the FlexTime agent system
 */
class ModelAllocation {
  /**
   * Initialize model allocation
   */
  constructor() {
    this.modelCapabilities = this._defineModelCapabilities();
    this.taskComplexityRules = this._defineTaskComplexityRules();
    this.usageStats = {
      opus: { calls: 0, tokensUsed: 0, costEstimate: 0 },
      sonnet: { calls: 0, tokensUsed: 0, costEstimate: 0 },
      haiku: { calls: 0, tokensUsed: 0, costEstimate: 0 }
    };
    logger.info('Model allocation optimizer initialized');
  }

  /**
   * Define capabilities of each model
   * 
   * @returns {Object} Model capabilities
   * @private
   */
  _defineModelCapabilities() {
    return {
      'claude-3-opus-20240229': {
        complexity: 'high',
        reasoning: 'excellent',
        contextWindow: 200000,
        costPerInputToken: 0.000015,
        costPerOutputToken: 0.000075,
        description: 'Best for complex strategic decisions and multi-step reasoning'
      },
      'claude-3-sonnet-20240229': {
        complexity: 'medium',
        reasoning: 'good',
        contextWindow: 200000,
        costPerInputToken: 0.000003,
        costPerOutputToken: 0.000015,
        description: 'Good balance for most scheduling tasks'
      },
      'claude-3-haiku-20240307': {
        complexity: 'low',
        reasoning: 'basic',
        contextWindow: 200000,
        costPerInputToken: 0.00000025,
        costPerOutputToken: 0.00000125,
        description: 'Most cost-effective for simple, routine tasks'
      }
    };
  }

  /**
   * Define rules for assessing task complexity
   * 
   * @returns {Object} Task complexity rules
   * @private
   */
  _defineTaskComplexityRules() {
    return {
      // High complexity tasks requiring Opus
      highComplexity: [
        'championship_scheduling',
        'multi_season_planning',
        'knowledge_graph_construction',
        'strategic_decision_making',
        'complex_constraint_resolution',
        'novel_problem_solving'
      ],
      
      // Medium complexity tasks for Sonnet
      mediumComplexity: [
        'schedule_generation',
        'schedule_optimization',
        'constraint_analysis',
        'conflict_resolution',
        'conflict_explanation',
        'feedback_analysis',
        'pattern_recognition'
      ],
      
      // Low complexity tasks for Haiku
      lowComplexity: [
        'venue_availability_check',
        'team_selection',
        'conflict_summary',
        'travel_distance_calculation',
        'schedule_validation',
        'simple_query_response',
        'data_formatting',
        'status_update'
      ]
    };
  }

  /**
   * Select the optimal model for a task based on its complexity
   * 
   * @param {string} taskType - Type of task
   * @param {Object} context - Task context (can include parameters, constraints, etc.)
   * @returns {string} Selected model ID
   */
  selectModelForTask(taskType, context = {}) {
    // Assess task complexity
    const complexityLevel = this._assessTaskComplexity(taskType, context);
    
    // Map complexity to model
    let selectedModel;
    switch (complexityLevel) {
      case 'high':
        selectedModel = 'claude-3-opus-20240229';
        break;
      case 'medium':
        selectedModel = 'claude-3-sonnet-20240229';
        break;
      case 'low':
        selectedModel = 'claude-3-haiku-20240307';
        break;
      default:
        // Default to Sonnet for unknown complexity
        selectedModel = 'claude-3-sonnet-20240229';
    }
    
    logger.info(`Selected model ${selectedModel} for task "${taskType}" (complexity: ${complexityLevel})`);
    return selectedModel;
  }

  /**
   * Assess the complexity of a task
   * 
   * @param {string} taskType - Type of task
   * @param {Object} context - Task context
   * @returns {string} Complexity level (high, medium, low)
   * @private
   */
  _assessTaskComplexity(taskType, context) {
    // Direct match based on task type
    if (this.taskComplexityRules.highComplexity.includes(taskType)) {
      return 'high';
    } else if (this.taskComplexityRules.mediumComplexity.includes(taskType)) {
      return 'medium';
    } else if (this.taskComplexityRules.lowComplexity.includes(taskType)) {
      return 'low';
    }
    
    // No direct match, use contextual analysis
    return this._analyzeContextComplexity(taskType, context);
  }

  /**
   * Analyze context to determine task complexity
   * 
   * @param {string} taskType - Type of task
   * @param {Object} context - Task context
   * @returns {string} Complexity level (high, medium, low)
   * @private
   */
  _analyzeContextComplexity(taskType, context) {
    // Count complexity indicators
    let complexityScore = 0;
    
    // Check for complex scheduling parameters
    if (context.teams && context.teams.length > 12) {
      complexityScore += 2; // More teams = more complex
    }
    
    // Check for complex constraints
    if (context.constraints && context.constraints.length > 5) {
      complexityScore += 2; // More constraints = more complex
    }
    
    // Check for championship context
    if (context.championship || taskType.includes('championship')) {
      complexityScore += 3; // Championship scheduling is complex
    }
    
    // Check for multi-sport or multi-season
    if (context.multiSport || context.multiSeason) {
      complexityScore += 3; // Multi-dimensional scheduling is complex
    }
    
    // Check for optimization requirements
    if (context.optimization && context.optimization.priority === 'high') {
      complexityScore += 2; // Optimization adds complexity
    }
    
    // Map score to complexity level
    if (complexityScore >= 5) {
      return 'high';
    } else if (complexityScore >= 2) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Record model usage for cost tracking and optimization
   * 
   * @param {string} model - Model used
   * @param {number} inputTokens - Number of input tokens
   * @param {number} outputTokens - Number of output tokens
   */
  recordUsage(model, inputTokens, outputTokens) {
    // Extract model tier
    let tier;
    if (model.includes('opus')) {
      tier = 'opus';
    } else if (model.includes('sonnet')) {
      tier = 'sonnet';
    } else if (model.includes('haiku')) {
      tier = 'haiku';
    } else {
      return; // Unknown model
    }
    
    // Update usage stats
    this.usageStats[tier].calls += 1;
    this.usageStats[tier].tokensUsed += (inputTokens + outputTokens);
    
    // Calculate cost
    const modelInfo = this.modelCapabilities[model];
    if (modelInfo) {
      const cost = (inputTokens * modelInfo.costPerInputToken) + 
                   (outputTokens * modelInfo.costPerOutputToken);
      this.usageStats[tier].costEstimate += cost;
    }
  }

  /**
   * Get usage statistics and cost optimization recommendations
   * 
   * @returns {Object} Usage statistics and recommendations
   */
  getUsageStats() {
    // Calculate total cost
    const totalCost = Object.values(this.usageStats).reduce(
      (sum, stats) => sum + stats.costEstimate, 0
    );
    
    // Generate cost optimization recommendations
    const recommendations = [];
    
    // Check Opus usage
    if (this.usageStats.opus.calls > 20) {
      recommendations.push('Consider reducing Claude Opus usage by refining high-complexity task detection');
    }
    
    // Check if Haiku is underutilized
    const haikuPercentage = this.usageStats.haiku.calls / 
      (this.usageStats.opus.calls + this.usageStats.sonnet.calls + this.usageStats.haiku.calls || 1) * 100;
    
    if (haikuPercentage < 30) {
      recommendations.push('Increase Claude Haiku usage for routine tasks to optimize costs');
    }
    
    return {
      usageStats: this.usageStats,
      totalCost,
      recommendations
    };
  }
}

module.exports = ModelAllocation;