/**
 * Enhanced Feedback System for FlexTime Scheduling
 * 
 * This module improves the feedback loop integration with:
 * - More sophisticated feedback analysis
 * - Adaptive constraint weighting
 * - Learning from recurring patterns
 */

const { FeedbackSystem } = require('../ml/feedback_system');
const { EnhancedMemoryManager } = require('../memory/enhanced_memory_manager');
const { ModelAllocation } = require('../model_allocation');
const logger = require('../../utils/logger');

class EnhancedFeedbackSystem extends FeedbackSystem {
  /**
   * Create a new EnhancedFeedbackSystem
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    super(config);
    
    // Enhanced feedback parameters
    this.feedbackCategories = {
      travelDistance: {
        weight: config.travelDistanceWeight || 1.0,
        minThreshold: 0.0,
        maxThreshold: 1.0
      },
      homeAwayBalance: {
        weight: config.homeAwayBalanceWeight || 1.0,
        minThreshold: 0.0,
        maxThreshold: 1.0
      },
      restDays: {
        weight: config.restDaysWeight || 1.0,
        minThreshold: 0.0,
        maxThreshold: 1.0
      },
      gameSpacing: {
        weight: config.gameSpacingWeight || 1.0,
        minThreshold: 0.0,
        maxThreshold: 1.0
      },
      divisionBalance: {
        weight: config.divisionBalanceWeight || 1.0,
        minThreshold: 0.0,
        maxThreshold: 1.0
      }
    };
    
    // Sport-specific feedback parameters
    this.sportSpecificFeedback = {
      basketball: {
        weekdayWeekendBalance: {
          weight: 1.2,
          minThreshold: 0.0,
          maxThreshold: 1.0
        },
        rivalryGameSpacing: {
          weight: 1.5,
          minThreshold: 0.0,
          maxThreshold: 1.0
        }
      },
      football: {
        byeWeekPlacement: {
          weight: 1.8,
          minThreshold: 0.0,
          maxThreshold: 1.0
        },
        primeTimeGames: {
          weight: 1.5,
          minThreshold: 0.0,
          maxThreshold: 1.0
        }
      }
    };
    
    // Feedback data aggregation
    this.aggregatedFeedback = {
      count: 0,
      categoryScores: {},
      constraintViolations: {},
      teamSpecificFeedback: {}
    };
    
    // Initialize aggregated feedback
    for (const category of Object.keys(this.feedbackCategories)) {
      this.aggregatedFeedback.categoryScores[category] = {
        sum: 0,
        count: 0,
        average: 0
      };
    }
    
    // Learning parameters
    this.adaptiveLearningRate = config.adaptiveLearningRate || 0.1;
    this.persistentStorage = config.persistentStorage || false;
    this.enableContinualLearning = config.enableContinualLearning !== false;
    
    // Track optimization parameters
    this.optimizerParameters = {
      travelOptimizationWeight: 1.0,
      homeAwayBalanceWeight: 1.0,
      restDaysWeight: 1.0,
      constraintWeights: {}
    };
    
    logger.info('Enhanced Feedback System initialized');
  }
  
  /**
   * Process detailed feedback on a schedule
   * @param {Object} scheduleData - The schedule that was executed
   * @param {Object} feedbackData - User feedback and performance metrics
   * @returns {Promise<Object>} - Analysis and learning outcomes
   */
  async processDetailedFeedback(scheduleData, feedbackData) {
    try {
      logger.info(`Processing detailed feedback for schedule ${scheduleData.id}`);
      
      // Store original feedback in memory system
      await this.memoryManager.storeMemory('feedback', {
        scheduleId: scheduleData.id,
        timestamp: Date.now(),
        feedback: feedbackData,
        scheduleData: scheduleData
      });
      
      // Parse and validate the feedback
      const parsedFeedback = this._parseFeedback(feedbackData);
      
      // Analyze the feedback for insights
      const analysisResults = await this._analyzeScheduleFeedback(
        scheduleData, 
        parsedFeedback
      );
      
      // Update constraint weights based on analysis
      const constraintUpdates = await this._updateConstraintWeights(
        analysisResults.constraintAnalysis
      );
      
      // Update optimizer parameters
      const optimizerUpdates = await this._updateOptimizerParameters(
        analysisResults.optimizerAnalysis
      );
      
      // Update aggregated feedback data
      this._updateAggregatedFeedback(parsedFeedback, scheduleData);
      
      // Store the analyzed feedback for future learning
      await this._storeFeedbackInsights(
        scheduleData.id,
        analysisResults,
        constraintUpdates,
        optimizerUpdates
      );
      
      // Run feedback-triggered optimizations if needed
      let optimizationResults = null;
      if (analysisResults.requiresOptimizationUpdate) {
        optimizationResults = await this._triggerOptimizationUpdate(
          scheduleData.sport,
          constraintUpdates,
          optimizerUpdates
        );
      }
      
      // Return comprehensive results
      return {
        processed: true,
        scheduleId: scheduleData.id,
        sport: scheduleData.sport,
        analysis: analysisResults,
        constraintUpdates,
        optimizerUpdates,
        optimizationTriggered: !!optimizationResults,
        optimizationResults,
        insights: analysisResults.summary
      };
    } catch (error) {
      logger.error('Error processing detailed feedback:', error);
      throw new Error(`Failed to process detailed feedback: ${error.message}`);
    }
  }
  
  /**
   * Analyze schedule feedback
   * @param {Object} scheduleData - Schedule data
   * @param {Object} feedbackData - Parsed feedback data
   * @returns {Promise<Object>} - Analysis results
   * @private
   */
  async _analyzeScheduleFeedback(scheduleData, feedbackData) {
    logger.info(`Analyzing feedback for schedule ${scheduleData.id}`);
    
    // Prepare data for analysis
    const feedbackContext = {
      schedule: {
        id: scheduleData.id,
        sport: scheduleData.sport,
        season: scheduleData.season,
        teams: scheduleData.teams.map(t => t.name || t.id),
        gameCount: scheduleData.games.length
      },
      feedback: feedbackData,
      currentWeights: this.constraintWeights,
      currentOptimizerParams: this.optimizerParameters,
      aggregatedFeedback: this.aggregatedFeedback
    };
    
    // Use Claude API to analyze feedback
    const analysisRequest = this._prepareAnalysisRequest(feedbackContext);
    const model = this.modelAllocation.allocateModel('feedback_analysis');
    
    // Send request to MCP server
    const analysisResponse = await this.mcpConnector.processWithClaude(
      analysisRequest,
      model
    );
    
    // Parse the analysis response
    const analysisResults = this._parseAnalysisResponse(analysisResponse);
    
    // Determine if optimization parameters need updating
    const requiresOptimizationUpdate = 
      analysisResults.constraintAnalysis.significantChanges ||
      analysisResults.optimizerAnalysis.significantChanges;
    
    return {
      ...analysisResults,
      requiresOptimizationUpdate
    };
  }
  
  /**
   * Parse and validate feedback data
   * @param {Object} feedbackData - Raw feedback data
   * @returns {Object} - Parsed feedback
   * @private
   */
  _parseFeedback(feedbackData) {
    // Extract and normalize feedback
    const parsed = {
      userSatisfaction: parseFloat(feedbackData.userSatisfaction) || 0,
      constraintViolations: parseInt(feedbackData.constraintViolations, 10) || 0,
      completionRate: parseFloat(feedbackData.completionRate) || 1.0,
      resourceUtilization: parseFloat(feedbackData.resourceUtilization) || 0.5,
      travelSatisfaction: parseFloat(feedbackData.travelSatisfaction) || 0,
      homeAwaySatisfaction: parseFloat(feedbackData.homeAwaySatisfaction) || 0,
      restDaysSatisfaction: parseFloat(feedbackData.restDaysSatisfaction) || 0,
      comments: feedbackData.comments || '',
      timestamp: feedbackData.timestamp || Date.now(),
      violations: feedbackData.violations || [],
      constraintFeedback: feedbackData.constraintFeedback || {},
      teamFeedback: feedbackData.teamFeedback || {}
    };
    
    // Validate and normalize scores to 0-1 range
    for (const key of ['userSatisfaction', 'completionRate', 'resourceUtilization', 
                        'travelSatisfaction', 'homeAwaySatisfaction', 'restDaysSatisfaction']) {
      parsed[key] = Math.max(0, Math.min(1, parsed[key]));
    }
    
    return parsed;
  }
  
  /**
   * Update constraint weights based on feedback analysis
   * @param {Object} constraintAnalysis - Constraint analysis results
   * @returns {Promise<Object>} - Updated constraint weights
   * @private
   */
  async _updateConstraintWeights(constraintAnalysis) {
    const updates = {};
    let hasChanges = false;
    
    // Process recommended weight changes
    if (constraintAnalysis.recommendations) {
      for (const [constraint, data] of Object.entries(constraintAnalysis.recommendations)) {
        if (data.weight && typeof data.weight === 'number') {
          const currentWeight = this.constraintWeights[constraint] || 1.0;
          
          // Apply change with adaptive learning rate
          const newWeight = currentWeight + 
            ((data.weight - currentWeight) * this.adaptiveLearningRate);
          
          // Store update
          updates[constraint] = {
            oldWeight: currentWeight,
            newWeight: newWeight,
            change: newWeight - currentWeight,
            reason: data.reason || 'Based on feedback analysis'
          };
          
          // Update constraint weight
          this.constraintWeights[constraint] = newWeight;
          hasChanges = true;
        }
      }
    }
    
    // If weights were changed, store them for persistence
    if (hasChanges && this.persistentStorage) {
      await this.memoryManager.storeMemory('system', {
        type: 'constraint_weights',
        timestamp: Date.now(),
        weights: { ...this.constraintWeights }
      });
    }
    
    return {
      hasChanges,
      updates,
      currentWeights: { ...this.constraintWeights }
    };
  }
  
  /**
   * Update optimizer parameters based on feedback analysis
   * @param {Object} optimizerAnalysis - Optimizer analysis results
   * @returns {Promise<Object>} - Updated optimizer parameters
   * @private
   */
  async _updateOptimizerParameters(optimizerAnalysis) {
    const updates = {};
    let hasChanges = false;
    
    // Process recommended parameter changes
    if (optimizerAnalysis.recommendations) {
      for (const [param, data] of Object.entries(optimizerAnalysis.recommendations)) {
        if (data.value && typeof data.value === 'number') {
          const currentValue = this.optimizerParameters[param] || 1.0;
          
          // Apply change with adaptive learning rate
          const newValue = currentValue + 
            ((data.value - currentValue) * this.adaptiveLearningRate);
          
          // Store update
          updates[param] = {
            oldValue: currentValue,
            newValue: newValue,
            change: newValue - currentValue,
            reason: data.reason || 'Based on feedback analysis'
          };
          
          // Update optimizer parameter
          this.optimizerParameters[param] = newValue;
          hasChanges = true;
        }
      }
    }
    
    // If parameters were changed, store them for persistence
    if (hasChanges && this.persistentStorage) {
      await this.memoryManager.storeMemory('system', {
        type: 'optimizer_parameters',
        timestamp: Date.now(),
        parameters: { ...this.optimizerParameters }
      });
    }
    
    return {
      hasChanges,
      updates,
      currentParameters: { ...this.optimizerParameters }
    };
  }
  
  /**
   * Update aggregated feedback statistics
   * @param {Object} feedback - Parsed feedback data
   * @param {Object} scheduleData - Schedule data
   * @private
   */
  _updateAggregatedFeedback(feedback, scheduleData) {
    // Increment counters
    this.aggregatedFeedback.count++;
    
    // Update category scores
    for (const category of Object.keys(this.feedbackCategories)) {
      const feedbackKey = `${category}Satisfaction`;
      
      if (typeof feedback[feedbackKey] === 'number') {
        const stats = this.aggregatedFeedback.categoryScores[category];
        stats.sum += feedback[feedbackKey];
        stats.count++;
        stats.average = stats.sum / stats.count;
      }
    }
    
    // Update constraint violations
    for (const violation of feedback.violations) {
      const constraintType = violation.constraintType || 'unknown';
      
      if (!this.aggregatedFeedback.constraintViolations[constraintType]) {
        this.aggregatedFeedback.constraintViolations[constraintType] = {
          count: 0,
          schedules: []
        };
      }
      
      this.aggregatedFeedback.constraintViolations[constraintType].count++;
      this.aggregatedFeedback.constraintViolations[constraintType].schedules.push(scheduleData.id);
    }
    
    // Update team-specific feedback
    for (const [teamId, teamFeedback] of Object.entries(feedback.teamFeedback || {})) {
      if (!this.aggregatedFeedback.teamSpecificFeedback[teamId]) {
        this.aggregatedFeedback.teamSpecificFeedback[teamId] = {
          satisfactionSum: 0,
          count: 0,
          average: 0,
          comments: []
        };
      }
      
      const teamStats = this.aggregatedFeedback.teamSpecificFeedback[teamId];
      
      if (typeof teamFeedback.satisfaction === 'number') {
        teamStats.satisfactionSum += teamFeedback.satisfaction;
        teamStats.count++;
        teamStats.average = teamStats.satisfactionSum / teamStats.count;
      }
      
      if (teamFeedback.comment) {
        teamStats.comments.push({
          scheduleId: scheduleData.id,
          comment: teamFeedback.comment
        });
      }
    }
  }
  
  /**
   * Store feedback insights for future learning
   * @param {string} scheduleId - Schedule ID
   * @param {Object} analysisResults - Analysis results
   * @param {Object} constraintUpdates - Constraint weight updates
   * @param {Object} optimizerUpdates - Optimizer parameter updates
   * @returns {Promise<void>}
   * @private
   */
  async _storeFeedbackInsights(
    scheduleId,
    analysisResults,
    constraintUpdates,
    optimizerUpdates
  ) {
    // Store the insights in memory for future reference
    await this.memoryManager.storeMemory('learning', {
      type: 'feedback_analysis',
      scheduleId,
      timestamp: Date.now(),
      insights: analysisResults,
      constraintUpdates,
      optimizerUpdates,
      applied: true
    });
  }
  
  /**
   * Trigger optimization parameter updates across the system
   * @param {string} sport - Sport type
   * @param {Object} constraintUpdates - Constraint weight updates
   * @param {Object} optimizerUpdates - Optimizer parameter updates
   * @returns {Promise<Object>} - Optimization results
   * @private
   */
  async _triggerOptimizationUpdate(sport, constraintUpdates, optimizerUpdates) {
    logger.info(`Triggering optimization updates for ${sport}`);
    
    // Notify other system components about the updates
    // This depends on system architecture and would interact with other components
    
    return {
      timestamp: Date.now(),
      sport,
      constraintUpdatesApplied: constraintUpdates.hasChanges,
      optimizerUpdatesApplied: optimizerUpdates.hasChanges,
      status: 'optimization_parameters_updated'
    };
  }
  
  /**
   * Prepare analysis request for Claude
   * @param {Object} feedbackContext - Feedback context
   * @returns {Object} - Formatted request for Claude
   * @private
   */
  _prepareAnalysisRequest(feedbackContext) {
    return {
      messages: [
        {
          role: 'system',
          content: `You are an advanced schedule feedback analysis system. Your task is to:

1. Analyze the given schedule feedback data
2. Identify patterns in user satisfaction and constraint violations
3. Recommend specific improvements to constraint weights and optimizer parameters
4. Provide a concise summary of insights

Focus on identifying the most impactful changes to improve future schedules.
Your analysis should be precise and data-driven.`
        },
        {
          role: 'user',
          content: `Please analyze this scheduling feedback:

Sport: ${feedbackContext.schedule.sport}
Schedule ID: ${feedbackContext.schedule.id}
Season: ${feedbackContext.schedule.season}

Feedback Data: ${JSON.stringify(feedbackContext.feedback, null, 2)}

Current constraint weights:
${JSON.stringify(feedbackContext.currentWeights, null, 2)}

Current optimizer parameters:
${JSON.stringify(feedbackContext.currentOptimizerParams, null, 2)}

Aggregated feedback statistics:
${JSON.stringify(feedbackContext.aggregatedFeedback, null, 2)}

Provide your analysis as a structured JSON with:
1. A "summary" field containing key insights
2. A "constraintAnalysis" object with "patterns", "significantChanges" (boolean), and "recommendations"
3. An "optimizerAnalysis" object with "patterns", "significantChanges" (boolean), and "recommendations"`
        }
      ]
    };
  }
  
  /**
   * Parse Claude's analysis response
   * @param {Object} response - Claude API response
   * @returns {Object} - Parsed analysis
   * @private
   */
  _parseAnalysisResponse(response) {
    try {
      // Try to extract JSON from the response
      const responseText = response.response.content;
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                         responseText.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0];
        const parsedResponse = JSON.parse(jsonString);
        
        // Ensure required fields exist
        return {
          summary: parsedResponse.summary || 'No summary provided',
          constraintAnalysis: parsedResponse.constraintAnalysis || {
            patterns: [],
            significantChanges: false,
            recommendations: {}
          },
          optimizerAnalysis: parsedResponse.optimizerAnalysis || {
            patterns: [],
            significantChanges: false,
            recommendations: {}
          }
        };
      }
      
      // If no JSON found, create a default response
      return {
        summary: 'Unable to extract structured analysis from response',
        constraintAnalysis: {
          patterns: [],
          significantChanges: false,
          recommendations: {}
        },
        optimizerAnalysis: {
          patterns: [],
          significantChanges: false,
          recommendations: {}
        }
      };
    } catch (error) {
      logger.error('Error parsing analysis response:', error);
      
      // Return default structure on error
      return {
        summary: `Error parsing analysis: ${error.message}`,
        constraintAnalysis: {
          patterns: [],
          significantChanges: false,
          recommendations: {}
        },
        optimizerAnalysis: {
          patterns: [],
          significantChanges: false,
          recommendations: {}
        }
      };
    }
  }
  
  /**
   * Run comprehensive feedback analysis
   * @returns {Promise<Object>} - Analysis results
   */
  async runComprehensiveAnalysis() {
    logger.info('Running comprehensive feedback analysis');
    
    try {
      // Get recent feedback from memory
      const recentFeedback = await this.memoryManager.searchMemories('feedback', {
        limit: 50,
        sortBy: 'timestamp',
        sortDirection: 'desc'
      });
      
      if (recentFeedback.length === 0) {
        return {
          status: 'skipped',
          reason: 'No feedback data available'
        };
      }
      
      // Group feedback by sport
      const feedbackByCategory = {};
      
      for (const feedback of recentFeedback) {
        const sport = feedback.scheduleData?.sport || 'unknown';
        
        if (!feedbackByCategory[sport]) {
          feedbackByCategory[sport] = [];
        }
        
        feedbackByCategory[sport].push(feedback);
      }
      
      // Analyze each sport category
      const sportAnalyses = {};
      
      for (const [sport, sportFeedback] of Object.entries(feedbackByCategory)) {
        sportAnalyses[sport] = await this._analyzeMultipleFeedback(
          sport, 
          sportFeedback
        );
      }
      
      // Generate overall recommendations
      const globalRecommendations = this._generateGlobalRecommendations(
        sportAnalyses
      );
      
      // Store analysis results
      await this.memoryManager.storeMemory('system', {
        type: 'comprehensive_analysis',
        timestamp: Date.now(),
        sportAnalyses,
        globalRecommendations,
        feedbackCount: recentFeedback.length
      });
      
      return {
        status: 'completed',
        timestamp: Date.now(),
        sportAnalyses,
        globalRecommendations,
        feedbackCount: recentFeedback.length
      };
    } catch (error) {
      logger.error('Error running comprehensive analysis:', error);
      
      return {
        status: 'error',
        message: error.message
      };
    }
  }
  
  /**
   * Analyze multiple feedback items
   * @param {string} sport - Sport type
   * @param {Array} feedbackItems - Feedback items
   * @returns {Promise<Object>} - Analysis for this sport
   * @private
   */
  async _analyzeMultipleFeedback(sport, feedbackItems) {
    // Implementation would analyze patterns across multiple feedback items
    // This is a simplified placeholder
    return {
      sport,
      count: feedbackItems.length,
      averageSatisfaction: feedbackItems.reduce((sum, item) => 
        sum + (item.feedback.userSatisfaction || 0), 0) / feedbackItems.length,
      commonIssues: [],
      recommendedChanges: {}
    };
  }
  
  /**
   * Generate global recommendations
   * @param {Object} sportAnalyses - Analysis by sport
   * @returns {Object} - Global recommendations
   * @private
   */
  _generateGlobalRecommendations(sportAnalyses) {
    // Implementation would generate cross-sport recommendations
    // This is a simplified placeholder
    return {
      constraintWeights: {},
      optimizerParameters: {},
      systemSuggestions: []
    };
  }
}

module.exports = EnhancedFeedbackSystem;