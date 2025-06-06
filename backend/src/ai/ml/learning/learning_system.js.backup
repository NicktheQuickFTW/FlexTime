/**
 * Learning System Integration for FlexTime
 *
 * This module integrates the agent memory, machine learning, and feedback loop
 * components into a unified learning system for the FlexTime scheduling platform.
 * It now connects with the HELiiX Intelligence Engine for enhanced learning capabilities.
 */

const logger = require("../utils/logger");
const { CentralizedMemoryManager } = require('../../enhanced/centralized_memory_manager');
const { MachineLearningManager } = require('./machine_learning');
const FeedbackLoopSystem = require('./feedback_loop');
const IntelligenceEngineClient = require('../../intelligence_engine_client');
// const intelligenceEngineConfig = require('../../config/intelligence_engine_config'); // Config file doesn't exist
const neonConfig = require('../../../../config/neon_db_config');

/**
 * Learning System that integrates memory, ML, and feedback
 */
class LearningSystem {
  /**
   * Initialize the Learning System
   *
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.neonConfig = config.neonConfig || neonConfig;
    this.modelsPath = config.modelsPath || './models';

    // Initialize components
    this.memorySystem = new CentralizedMemoryManager({
      neon: {
        enabled: true,
        connectionString: this.neonConfig.connectionString
      }
    });

    this.mlManager = new MachineLearningManager({
      modelsPath: this.modelsPath
    });

    this.feedbackSystem = new FeedbackLoopSystem({
      memorySystem: this.memorySystem,
      mlManager: this.mlManager
    });

    this.intelligenceEngineClient = new IntelligenceEngineClient(intelligenceEngineConfig);

    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.shutdown = this.shutdown.bind(this);
    this.getRecommendations = this.getRecommendations.bind(this);
    this.submitFeedback = this.submitFeedback.bind(this);
    this.learnFromHistoricalData = this.learnFromHistoricalData.bind(this);
    this.runLearningCycle = this.runLearningCycle.bind(this);
    this.getSystemStatus = this.getSystemStatus.bind(this);
  }

  /**
   * Initialize the learning system
   *
   * @returns {Promise<Object>} Initialization result
   */
  async initialize() {
    logger.info('Initializing FlexTime Learning System');

    try {
      // Connect to memory system
      await this.memorySystem.connect();

      // Load ML models
      await this.mlManager.loadAllModels();

      // Connect to Intelligence Engine
      await this.intelligenceEngineClient.connect();

      logger.info('FlexTime Learning System initialized successfully');

      return {
        success: true,
        message: 'Learning system initialized successfully'
      };
    } catch (error) {
      logger.error(`Failed to initialize learning system: ${error.message}`);

      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Shutdown the learning system
   * 
   * @returns {Promise<Object>} Shutdown result
   */
  async shutdown() {
    logger.info('Shutting down FlexTime Learning System');
    
    try {
      // Disconnect from memory system
      await this.memorySystem.disconnect();
      
      // Disconnect from Intelligence Engine
      await this.intelligenceEngineClient.disconnect();
      
      logger.info('FlexTime Learning System shut down successfully');
      
      return {
        success: true,
        message: 'Learning system shut down successfully'
      };
    } catch (error) {
      logger.error(`Failed to shut down learning system: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get scheduling recommendations based on parameters
   * 
   * @param {Object} parameters - Scheduling parameters
   * @param {Object} context - Context information
   * @returns {Promise<Object>} Recommendations
   */
  async getRecommendations(parameters, context = {}) {
    logger.info('Getting scheduling recommendations', { sportType: parameters.sportType });
    
    try {
      // First try to get recommendations from Intelligence Engine
      if (this.intelligenceEngineClient.isEnabled()) {
        try {
          const ieRecommendations = await this.intelligenceEngineClient.getSchedulingRecommendations({
            ...parameters,
            context
          });
          
          if (ieRecommendations.success) {
            logger.info('Using recommendations from Intelligence Engine');
            return {
              success: true,
              recommendations: ieRecommendations.recommendations,
              source: {
                intelligenceEngine: true,
                ml: false,
                memory: false
              }
            };
          }
        } catch (error) {
          logger.warn(`Intelligence Engine recommendations failed, falling back to local: ${error.message}`);
        }
      }
      
      // Fall back to local recommendations if Intelligence Engine is unavailable
      logger.info('Using local recommendation system');
      
      // Get ML recommendations
      const mlRecommendations = await this.mlManager.getComprehensiveRecommendations(parameters);
      
      // Get relevant memories
      const memories = await this.memorySystem.retrieveMemories(
        'master_director_agent',
        {
          sportType: parameters.sportType,
          taskType: 'scheduling'
        },
        {
          limit: 5,
          minImportance: 0.6
        }
      );
      
      // Extract insights from memories
      const memoryInsights = this.extractMemoryInsights(memories);
      
      // Combine ML and memory recommendations
      const combinedRecommendations = this.combineRecommendations(
        mlRecommendations,
        memoryInsights
      );
      
      // Try to enhance with Intelligence Engine if available
      let enhancedRecommendations = combinedRecommendations;
      if (this.intelligenceEngineClient.isEnabled()) {
        try {
          const enhancementResult = await this.intelligenceEngineClient.enhanceRecommendations({
            recommendations: combinedRecommendations,
            parameters,
            context
          });
          
          if (enhancementResult.success) {
            enhancedRecommendations = enhancementResult.recommendations;
            logger.info('Enhanced recommendations with Intelligence Engine');
          }
        } catch (error) {
          logger.warn(`Failed to enhance recommendations: ${error.message}`);
        }
      }
      
      return {
        success: true,
        recommendations: enhancedRecommendations,
        source: {
          ml: true,
          memory: memories.length > 0,
          memoryCount: memories.length,
          intelligenceEngine: enhancedRecommendations !== combinedRecommendations
        }
      };
    } catch (error) {
      logger.error(`Failed to get recommendations: ${error.message}`);
      
      // Fallback to basic ML recommendations
      try {
        const fallbackRecommendations = await this.mlManager.getBasicRecommendations(parameters);
        
        return {
          success: true,
          recommendations: fallbackRecommendations,
          source: {
            ml: true,
            memory: false,
            memoryCount: 0,
            intelligenceEngine: false
          },
          warning: 'Memory system unavailable, using ML-only recommendations'
        };
      } catch (mlError) {
        logger.error(`ML fallback also failed: ${mlError.message}`);
        
        return {
          success: false,
          error: error.message,
          fallbackError: mlError.message
        };
      }
    }
  }
  
  /**
   * Extract insights from agent memories
   * 
   * @param {Array<Object>} memories - Agent memories
   * @returns {Object} Memory insights
   */
  extractMemoryInsights(memories) {
    if (!memories || memories.length === 0) {
      return {
        hasInsights: false,
        insights: []
      };
    }
    
    const insights = [];
    
    // Process episodic memories
    const episodicMemories = memories.filter(m => m.memoryType === 'episodic');
    
    episodicMemories.forEach(memory => {
      const content = memory.content.episodic;
      
      // Extract insights from feedback memories
      if (content.taskId === 'schedule_feedback') {
        insights.push({
          type: 'feedback',
          importance: memory.importance,
          evaluation: content.evaluation,
          parameters: content.parameters,
          outcome: content.outcome
        });
      }
    });
    
    // Process semantic memories
    const semanticMemories = memories.filter(m => m.memoryType === 'semantic');
    
    semanticMemories.forEach(memory => {
      const content = memory.content.semantic;
      
      insights.push({
        type: 'concept',
        importance: memory.importance,
        concept: content.concept,
        attributes: content.attributes,
        confidence: content.confidence
      });
    });
    
    return {
      hasInsights: insights.length > 0,
      insights
    };
  }
  
  /**
   * Combine ML recommendations with memory insights
   * 
   * @param {Object} mlRecommendations - ML recommendations
   * @param {Object} memoryInsights - Memory insights
   * @returns {Object} Combined recommendations
   */
  combineRecommendations(mlRecommendations, memoryInsights) {
    // If no memory insights, return ML recommendations as is
    if (!memoryInsights.hasInsights) {
      return mlRecommendations;
    }
    
    // Clone ML recommendations
    const combined = JSON.parse(JSON.stringify(mlRecommendations));
    
    // Add memory-based adjustments
    combined.memoryAdjustments = [];
    
    // Process feedback insights
    const feedbackInsights = memoryInsights.insights.filter(i => i.type === 'feedback');
    
    if (feedbackInsights.length > 0) {
      // Calculate average evaluation
      const avgEvaluation = feedbackInsights.reduce((sum, i) => sum + i.evaluation, 0) / feedbackInsights.length;
      
      // Adjust constraint weights based on feedback
      if (combined.constraintWeights && combined.constraintWeights.weightRecommendations) {
        const weights = combined.constraintWeights.weightRecommendations;
        
        // If past schedules were rated poorly, increase weight of constraints
        if (avgEvaluation < 0.5) {
          // Find the lowest rated constraint in feedback
          const lowestRatedConstraint = this.findLowestRatedConstraint(feedbackInsights);
          
          if (lowestRatedConstraint && weights[lowestRatedConstraint]) {
            // Increase weight of the problematic constraint
            const oldWeight = weights[lowestRatedConstraint];
            weights[lowestRatedConstraint] = Math.min(1, oldWeight + 0.2);
            
            combined.memoryAdjustments.push({
              type: 'constraint_weight',
              constraint: lowestRatedConstraint,
              oldValue: oldWeight,
              newValue: weights[lowestRatedConstraint],
              reason: `Increased weight due to poor ratings in past schedules (avg: ${avgEvaluation.toFixed(2)})`
            });
          }
        }
      }
      
      // Adjust travel parameters based on feedback
      if (combined.travelOptimization && combined.travelOptimization.travelParameters) {
        const params = combined.travelOptimization.travelParameters;
        
        // Check if travel was an issue in past schedules
        const travelFeedback = feedbackInsights.filter(i => 
          i.parameters && i.parameters.feedbackType === 'travel'
        );
        
        if (travelFeedback.length > 0) {
          const avgTravelEval = travelFeedback.reduce((sum, i) => sum + i.evaluation, 0) / travelFeedback.length;
          
          if (avgTravelEval < 0.4) {
            // Travel was a significant issue, adjust parameters
            
            // Increase region clustering
            if (params.regionClusteringStrength) {
              const oldValue = params.regionClusteringStrength;
              params.regionClusteringStrength = Math.min(1, oldValue + 0.15);
              
              combined.memoryAdjustments.push({
                type: 'travel_parameter',
                parameter: 'regionClusteringStrength',
                oldValue,
                newValue: params.regionClusteringStrength,
                reason: `Increased clustering due to poor travel ratings (avg: ${avgTravelEval.toFixed(2)})`
              });
            }
            
            // Adjust road trip length if needed
            if (params.maxRoadTripLength && avgTravelEval < 0.3) {
              const oldValue = params.maxRoadTripLength;
              
              // For very poor ratings, try different approach (either shorter or longer trips)
              if (oldValue <= 2) {
                // If trips were very short, try longer trips to reduce back-and-forth
                params.maxRoadTripLength = oldValue + 1;
              } else {
                // If trips were longer, try shorter trips
                params.maxRoadTripLength = Math.max(1, oldValue - 1);
              }
              
              combined.memoryAdjustments.push({
                type: 'travel_parameter',
                parameter: 'maxRoadTripLength',
                oldValue,
                newValue: params.maxRoadTripLength,
                reason: `Adjusted road trip length due to very poor travel ratings (avg: ${avgTravelEval.toFixed(2)})`
              });
            }
          }
        }
      }
    }
    
    // Process concept insights
    const conceptInsights = memoryInsights.insights.filter(i => i.type === 'concept');
    
    if (conceptInsights.length > 0) {
      // Apply concept-based adjustments
      // This is a simplified implementation
      
      // Look for algorithm preference concepts
      const algorithmConcepts = conceptInsights.filter(i => 
        i.concept && i.concept.startsWith('algorithm_preference_')
      );
      
      if (algorithmConcepts.length > 0 && combined.algorithm) {
        // Sort by confidence and importance
        algorithmConcepts.sort((a, b) => 
          (b.confidence * b.importance) - (a.confidence * a.importance)
        );
        
        // Get top concept
        const topConcept = algorithmConcepts[0];
        
        // Extract algorithm from concept
        const preferredAlgorithm = topConcept.concept.replace('algorithm_preference_', '');
        
        // Check if it's different from ML recommendation
        if (preferredAlgorithm !== combined.algorithm.recommendedAlgorithm) {
          // Check if it's in the alternatives
          const isAlternative = combined.algorithm.alternativeAlgorithms.includes(preferredAlgorithm);
          
          if (isAlternative) {
            // Swap recommended with the preferred alternative
            const oldRecommended = combined.algorithm.recommendedAlgorithm;
            combined.algorithm.recommendedAlgorithm = preferredAlgorithm;
            
            // Update alternatives
            const altIndex = combined.algorithm.alternativeAlgorithms.indexOf(preferredAlgorithm);
            combined.algorithm.alternativeAlgorithms[altIndex] = oldRecommended;
            
            combined.memoryAdjustments.push({
              type: 'algorithm_preference',
              oldValue: oldRecommended,
              newValue: preferredAlgorithm,
              confidence: topConcept.confidence,
              reason: `Changed based on past successful use of ${preferredAlgorithm} (confidence: ${topConcept.confidence.toFixed(2)})`
            });
          }
        }
      }
    }
    
    return combined;
  }
  
  /**
   * Find the lowest rated constraint from feedback insights
   * 
   * @param {Array<Object>} feedbackInsights - Feedback insights
   * @returns {string|null} Lowest rated constraint
   */
  findLowestRatedConstraint(feedbackInsights) {
    // Get constraint-specific feedback
    const constraintFeedback = feedbackInsights.filter(i => 
      i.parameters && i.parameters.feedbackType === 'constraints'
    );
    
    if (constraintFeedback.length === 0) {
      return null;
    }
    
    // Count negative feedback for each constraint
    const constraintIssues = {};
    
    constraintFeedback.forEach(feedback => {
      if (feedback.outcome && feedback.outcome.metrics) {
        const metrics = feedback.outcome.metrics;
        
        // Find the lowest satisfaction metric
        let lowestMetric = null;
        let lowestValue = 1;
        
        Object.entries(metrics).forEach(([metric, value]) => {
          if (value < lowestValue) {
            lowestValue = value;
            lowestMetric = metric;
          }
        });
        
        if (lowestMetric) {
          // Convert metric name to constraint name
          const constraint = this.metricToConstraint(lowestMetric);
          
          if (constraint) {
            constraintIssues[constraint] = (constraintIssues[constraint] || 0) + 1;
          }
        }
      }
    });
    
    // Find constraint with most issues
    let maxIssues = 0;
    let worstConstraint = null;
    
    Object.entries(constraintIssues).forEach(([constraint, count]) => {
      if (count > maxIssues) {
        maxIssues = count;
        worstConstraint = constraint;
      }
    });
    
    return worstConstraint;
  }
  
  /**
   * Convert metric name to constraint name
   * 
   * @param {string} metric - Metric name
   * @returns {string|null} Constraint name
   */
  metricToConstraint(metric) {
    const mapping = {
      'homeAwayBalance': 'balanceHomeAway',
      'travelDistance': 'minimizeTravel',
      'rivalryRespect': 'respectRivalries',
      'backToBackGames': 'avoidBackToBack',
      'weekendUtilization': 'preferWeekends'
    };
    
    return mapping[metric] || null;
  }
  
  /**
   * Submit feedback for a schedule
   * 
   * @param {Object} feedbackData - Feedback data
   * @returns {Promise<Object>} Submission result
   */
  async submitFeedback(feedbackData) {
    try {
      // Submit to feedback system
      const feedback = await this.feedbackSystem.submitFeedback(feedbackData);
      
      // Apply to agent memory
      await this.feedbackSystem.applyFeedbackToAgents(feedback);
      
      return {
        success: true,
        feedback
      };
    } catch (error) {
      logger.error(`Failed to submit feedback: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Learn from historical scheduling data
   * 
   * @param {Array<Object>} historicalData - Historical scheduling data
   * @returns {Promise<Object>} Learning result
   */
  async learnFromHistoricalData(historicalData) {
    logger.info(`Learning from ${historicalData.length} historical schedules`);
    
    try {
      // First, store historical data in Intelligence Engine if available
      if (this.intelligenceEngineClient.isEnabled()) {
        try {
          const batchExperiences = historicalData.map(data => ({
            agentId: data.agentId || 'scheduling_director',
            type: 'historical_schedule',
            content: {
              sportType: data.sportType,
              conferenceId: data.conferenceId,
              seasonYear: data.seasonYear,
              teamCount: data.teams?.length || 0,
              constraintCount: data.constraints?.length || 0,
              outcome: data.outcome || 'success',
              metrics: data.metrics || {}
            },
            tags: [
              data.sportType || 'unknown_sport',
              data.conferenceId || 'no_conference',
              'historical'
            ]
          }));
          
          const ieResult = await this.intelligenceEngineClient.storeBatchExperiences(batchExperiences);
          logger.info(`Stored ${ieResult.successCount} experiences in Intelligence Engine`);
        } catch (error) {
          logger.warn(`Failed to store historical data in Intelligence Engine: ${error.message}`);
        }
      }
      
      // Store historical data as agent memories
      const memoryResult = await this.storeHistoricalDataAsMemories(historicalData);
      
      // Train ML models on historical data
      const mlResult = await this.mlManager.trainOnHistoricalData(historicalData);
      
      return {
        success: true,
        memoryResult,
        mlResult,
        totalSchedules: historicalData.length
      };
    } catch (error) {
      logger.error(`Failed to learn from historical data: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Store historical data as agent memories
   * 
   * @param {Array<Object>} historicalData - Historical scheduling data
   * @returns {Promise<Object>} Storage result
   */
  async storeHistoricalDataAsMemories(historicalData) {
    const results = {
      total: historicalData.length,
      stored: 0,
      failed: 0,
      byAgent: {}
    };
    
    // Connect to memory system
    await this.memorySystem.connect();
    
    // Process each historical schedule
    for (const schedule of historicalData) {
      try {
        // Create context
        const context = {
          sportType: schedule.sportType,
          season: schedule.season,
          taskType: 'scheduling'
        };
        
        // Store for master director agent
        await this.storeScheduleMemory(
          'master_director_agent',
          schedule,
          context
        );
        results.stored++;
        
        // Track by agent
        if (!results.byAgent['master_director_agent']) {
          results.byAgent['master_director_agent'] = 0;
        }
        results.byAgent['master_director_agent']++;
        
        // Store for algorithm selection agent if algorithm is specified
        if (schedule.algorithm) {
          await this.storeScheduleMemory(
            'algorithm_selection_agent',
            schedule,
            context
          );
          
          if (!results.byAgent['algorithm_selection_agent']) {
            results.byAgent['algorithm_selection_agent'] = 0;
          }
          results.byAgent['algorithm_selection_agent']++;
        }
        
        // Store for travel optimization agent if travel metrics exist
        if (schedule.metrics && schedule.metrics.travelEfficiency) {
          await this.storeScheduleMemory(
            'travel_optimization_agent',
            schedule,
            context
          );
          
          if (!results.byAgent['travel_optimization_agent']) {
            results.byAgent['travel_optimization_agent'] = 0;
          }
          results.byAgent['travel_optimization_agent']++;
        }
      } catch (error) {
        logger.error(`Failed to store schedule memory: ${error.message}`);
        results.failed++;
      }
    }
    
    return results;
  }
  
  /**
   * Store a schedule as agent memory
   * 
   * @param {string} agentId - Agent ID
   * @param {Object} schedule - Schedule data
   * @param {Object} context - Memory context
   * @returns {Promise<Object>} Stored memory
   */
  async storeScheduleMemory(agentId, schedule, context) {
    // Create episodic memory content
    const episodicContent = {
      taskId: 'historical_schedule',
      parameters: {
        scheduleId: schedule.id,
        sportType: schedule.sportType,
        teamCount: schedule.parameters?.teams?.length || 0,
        gamesPerTeam: schedule.parameters?.constraints?.gamesPerTeam || 0
      },
      decision: {
        algorithm: schedule.algorithm,
        constraintWeights: schedule.constraintWeights,
        travelParameters: schedule.travelParameters
      },
      outcome: {
        metrics: schedule.metrics || {}
      },
      evaluation: schedule.metrics?.overallQuality || 0.5
    };
    
    // Calculate importance based on quality
    const importance = this.calculateImportanceFromQuality(schedule.metrics?.overallQuality);
    
    // Store episodic memory
    return await this.memorySystem.storeMemory(
      agentId,
      agentId.includes('director') ? 'director' : 'specialized',
      'episodic',
      context,
      episodicContent,
      importance
    );
  }
  
  /**
   * Calculate memory importance from schedule quality
   * 
   * @param {number} quality - Schedule quality (0-1)
   * @returns {number} Importance (0-1)
   */
  calculateImportanceFromQuality(quality) {
    if (!quality) {
      return 0.5; // Default medium importance
    }
    
    // Both very good and very bad schedules are important to remember
    const distanceFromMiddle = Math.abs(quality - 0.5);
    
    // Scale to 0.5-1 range
    return 0.5 + distanceFromMiddle;
  }
  
  /**
   * Run a complete learning cycle
   * 
   * @param {Array<Object>} recentSchedules - Recent schedules
   * @returns {Promise<Object>} Learning cycle result
   */
  async runLearningCycle(recentSchedules) {
    logger.info('Running complete learning cycle');
    
    try {
      // Process feedback cycle
      const feedbackResult = await this.feedbackSystem.processFeedbackCycle(recentSchedules);
      
      // Consolidate memories
      const consolidationResults = await this.consolidateAgentMemories();
      
      return {
        success: true,
        feedbackResult,
        consolidationResults
      };
    } catch (error) {
      logger.error(`Learning cycle failed: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Consolidate agent memories
   * 
   * @returns {Promise<Object>} Consolidation results
   */
  async consolidateAgentMemories() {
    const results = {
      byAgent: {}
    };
    
    // Connect to memory system
    await this.memorySystem.connect();
    
    // List of agents to consolidate
    const agents = [
      'master_director_agent',
      'algorithm_selection_agent',
      'constraint_management_agent',
      'schedule_optimization_agent',
      'travel_optimization_agent'
    ];
    
    // Consolidate memories for each agent
    for (const agentId of agents) {
      try {
        // Consolidate episodic memories
        const episodicCount = await this.memorySystem.consolidateMemories(
          agentId,
          'episodic'
        );
        
        // Consolidate semantic memories
        const semanticCount = await this.memorySystem.consolidateMemories(
          agentId,
          'semantic'
        );
        
        results.byAgent[agentId] = {
          episodicConsolidated: episodicCount,
          semanticConsolidated: semanticCount
        };
      } catch (error) {
        logger.error(`Failed to consolidate memories for ${agentId}: ${error.message}`);
        
        results.byAgent[agentId] = {
          error: error.message
        };
      }
    }
    
    return results;
  }
  
  /**
   * Get system status
   * 
   * @returns {Promise<Object>} System status
   */
  async getSystemStatus() {
    try {
      // Get memory stats
      const memoryStats = await this.memorySystem.getMemoryStats('master_director_agent');
      
      // Get feedback stats
      const feedbackStats = await this.feedbackSystem.getFeedbackStats();
      
      // Get Intelligence Engine stats
      const intelligenceEngineStats = await this.intelligenceEngineClient.getStats();
      
      return {
        success: true,
        timestamp: new Date(),
        memory: memoryStats,
        feedback: feedbackStats,
        ml: {
          modelsPath: this.mlManager.modelsPath,
          models: Object.keys(this.mlManager.models)
        },
        intelligenceEngine: intelligenceEngineStats
      };
    } catch (error) {
      logger.error(`Failed to get system status: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

module.exports = LearningSystem;
