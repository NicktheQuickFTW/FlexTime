/**
 * Enhanced Feedback Loop System for FlexTime
 * 
 * This module provides an enhanced feedback loop system that integrates
 * with the HELiiX Intelligence Engine and uses multiple MCPs according
 * to the architecture where Claude is the primary MCP for FlexTime.
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Enhanced Feedback Loop System for continuous learning
 */
class FeedbackLoopSystem {
  /**
   * Initialize a new Feedback Loop System
   * 
   * @param {Object} config - Configuration options
   * @param {Object} services - Service dependencies
   */
  constructor(config = {}, services = {}) {
    this.config = config;
    this.intelligenceEngine = services.intelligenceEngine;
    this.mcpRouter = services.mcpRouter;
    this.memoryManager = services.memoryManager;
    this.enabled = config.enabled !== false;
    
    // Track feedback statistics
    this.stats = {
      totalFeedback: 0,
      positiveFeedback: 0,
      negativeFeedback: 0,
      neutralFeedback: 0,
      lastProcessed: null
    };
    
    logger.info('Enhanced Feedback Loop System initialized');
  }
  
  /**
   * Submit feedback for a scheduling experience
   * 
   * @param {Object} feedback - Feedback data
   * @param {string} feedback.scheduleId - ID of the schedule
   * @param {string} feedback.userId - ID of the user providing feedback
   * @param {number} feedback.rating - Numeric rating (1-5)
   * @param {string} feedback.comments - Text comments
   * @param {Object} feedback.details - Detailed feedback by category
   * @returns {Promise<Object>} Processing result
   */
  async submitFeedback(feedback) {
    if (!this.enabled) {
      logger.info('Feedback system is disabled');
      return { success: false, error: 'Feedback system is disabled' };
    }
    
    try {
      // Prepare feedback document
      const feedbackDoc = {
        id: feedback.id || uuidv4(),
        scheduleId: feedback.scheduleId,
        userId: feedback.userId,
        rating: feedback.rating,
        comments: feedback.comments,
        details: feedback.details || {},
        timestamp: feedback.timestamp || new Date().toISOString(),
        processed: false
      };
      
      logger.info(`Processing feedback for schedule ${feedbackDoc.scheduleId}`);
      
      // Update statistics
      this.stats.totalFeedback++;
      if (feedbackDoc.rating >= 4) {
        this.stats.positiveFeedback++;
      } else if (feedbackDoc.rating <= 2) {
        this.stats.negativeFeedback++;
      } else {
        this.stats.neutralFeedback++;
      }
      
      // Try to store in Intelligence Engine first
      if (this.intelligenceEngine && this.intelligenceEngine.enabled) {
        try {
          const response = await this.intelligenceEngine.storeFeedback(feedbackDoc);
          
          if (response.success) {
            logger.info(`Feedback stored in Intelligence Engine: ${feedbackDoc.id}`);
            
            // Request learning update based on feedback
            await this.requestLearningUpdate(feedbackDoc);
            
            return { 
              success: true, 
              feedbackId: feedbackDoc.id,
              learningRequested: true
            };
          }
        } catch (error) {
          logger.warn(`Intelligence Engine feedback storage failed: ${error.message}`);
          // Fall through to direct MCP
        }
      }
      
      // Store feedback in the database using the MCP router
      try {
        const response = await this.mcpRouter.routeRequest({
          taskType: 'feedback_storage',
          request: {
            operation: 'insert',
            collection: 'schedule_feedback',
            document: feedbackDoc
          }
        });
        
        if (response.success) {
          logger.info(`Feedback stored successfully: ${feedbackDoc.id}`);
          
          // Store as memory for relevant agents
          await this.storeAsFeedbackMemory(feedbackDoc);
          
          return { 
            success: true, 
            feedbackId: feedbackDoc.id,
            learningRequested: false,
            note: 'Feedback stored successfully, but learning update not requested'
          };
        } else {
          throw new Error(response.error || 'Unknown error storing feedback');
        }
      } catch (error) {
        logger.error(`Failed to process feedback: ${error.message}`);
        return { success: false, error: error.message };
      }
    } catch (error) {
      logger.error(`Unexpected error in submitFeedback: ${error.message}`);
      return { success: false, error: 'An unexpected error occurred while processing feedback' };
    }
  }
  
  /**
   * Request a learning update based on feedback
   * 
   * @param {Object} feedback - Feedback document
   * @returns {Promise<Object>} Learning task result
   * @private
   */
  async requestLearningUpdate(feedback) {
    try {
      logger.info(`Requesting learning update for feedback: ${feedback.id}`);
      
      // This will use Claude as primary MCP per architecture
      const learningTask = {
        type: 'update_learning_model',
        data: { 
          feedbackId: feedback.id,
          scheduleId: feedback.scheduleId,
          priority: feedback.rating <= 2 ? 'high' : 'normal' // Prioritize negative feedback
        }
      };
      
      const response = await this.intelligenceEngine.submitAgentTask(learningTask);
      
      if (response.success) {
        logger.info(`Learning update requested: ${response.taskId}`);
        return response;
      } else {
        throw new Error(response.error || 'Unknown error requesting learning update');
      }
    } catch (error) {
      logger.error(`Failed to request learning update: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Store feedback as a memory for relevant agents
   * 
   * @param {Object} feedback - Feedback document
   * @returns {Promise<boolean>} Success status
   * @private
   */
  async storeAsFeedbackMemory(feedback) {
    try {
      if (!this.memoryManager) {
        logger.warn('Memory manager not available, skipping feedback memory storage');
        return false;
      }
      
      // Determine which agents should receive this feedback memory
      const relevantAgents = [
        'scheduling_director',
        'constraint_management',
        'travel_optimization'
      ];
      
      // Store as memory for each relevant agent
      for (const agentId of relevantAgents) {
        await this.memoryManager.storeMemory({
          type: 'episodic',
          agentId,
          content: {
            type: 'feedback',
            scheduleId: feedback.scheduleId,
            rating: feedback.rating,
            key_points: feedback.comments,
            timestamp: feedback.timestamp
          },
          metadata: {
            source: 'feedback_system',
            importance: feedback.rating <= 2 ? 0.8 : 0.5 // Higher importance for negative feedback
          }
        });
      }
      
      logger.info(`Feedback stored as memory for ${relevantAgents.length} agents`);
      return true;
    } catch (error) {
      logger.error(`Failed to store feedback as memory: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Process the feedback cycle to generate insights
   * 
   * @returns {Promise<Object>} Processing results
   */
  async processFeedbackCycle() {
    if (!this.enabled) {
      logger.info('Feedback system is disabled');
      return { success: false, error: 'Feedback system is disabled' };
    }
    
    try {
      logger.info('Processing feedback cycle');
      
      // Try to use Intelligence Engine for feedback analysis
      if (this.intelligenceEngine && this.intelligenceEngine.enabled) {
        try {
          // Submit a task to analyze all feedback
          const analysisTask = {
            type: 'analyze_feedback',
            data: {
              timeframe: 'last_30_days',
              generateInsights: true,
              updateLearningModel: true
            }
          };
          
          const response = await this.intelligenceEngine.submitAgentTask(analysisTask);
          
          if (response.success) {
            this.stats.lastProcessed = new Date().toISOString();
            
            logger.info(`Feedback cycle processed via Intelligence Engine: ${response.taskId}`);
            return response;
          }
        } catch (error) {
          logger.warn(`Intelligence Engine feedback cycle processing failed: ${error.message}`);
          // Fall through to direct implementation
        }
      }
      
      // Use MCP router to get recent feedback
      const feedbackResponse = await this.mcpRouter.routeRequest({
        taskType: 'feedback_storage',
        request: {
          operation: 'find',
          collection: 'schedule_feedback',
          query: { processed: false },
          options: {
            limit: 100,
            sort: { timestamp: -1 }
          }
        }
      });
      
      if (!feedbackResponse.success) {
        throw new Error(feedbackResponse.error || 'Failed to retrieve feedback');
      }
      
      const feedback = feedbackResponse.documents || [];
      
      if (feedback.length === 0) {
        logger.info('No unprocessed feedback found');
        return { success: true, processed: 0, insights: [] };
      }
      
      // Use Claude MCP to analyze feedback
      const analysisResponse = await this.mcpRouter.routeRequest({
        taskType: 'constraint_management', // Use scheduling-related task type to route to Claude
        request: {
          prompt: `Analyze the following ${feedback.length} pieces of schedule feedback and generate insights:
          
${JSON.stringify(feedback, null, 2)}

Generate key insights about:
1. Common issues in schedules
2. Patterns in constraints that cause problems
3. Recommendations for improving scheduling algorithms
4. Specific areas that need attention

Format your response as a JSON object with these keys: insights, recommendations, priority_issues`,
          model: 'claude-3-opus-20240229',
          temperature: 0.2,
          max_tokens: 1000
        }
      });
      
      if (!analysisResponse.success) {
        throw new Error(analysisResponse.error || 'Failed to analyze feedback');
      }
      
      // Parse insights from the response
      let insights;
      try {
        insights = JSON.parse(analysisResponse.content);
      } catch (error) {
        logger.warn(`Failed to parse insights JSON: ${error.message}`);
        insights = {
          insights: [analysisResponse.content],
          recommendations: [],
          priority_issues: []
        };
      }
      
      // Mark feedback as processed
      const updateResponse = await this.mcpRouter.routeRequest({
        taskType: 'feedback_storage',
        request: {
          operation: 'updateMany',
          collection: 'schedule_feedback',
          query: { id: { $in: feedback.map(f => f.id) } },
          update: { $set: { processed: true } }
        }
      });
      
      this.stats.lastProcessed = new Date().toISOString();
      
      logger.info(`Processed ${feedback.length} feedback items`);
      return {
        success: true,
        processed: feedback.length,
        insights,
        updateStatus: updateResponse.success
      };
    } catch (error) {
      logger.error(`Failed to process feedback cycle: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get feedback statistics
   * 
   * @returns {Object} Feedback statistics
   */
  getStats() {
    return {
      ...this.stats,
      positivePercentage: this.stats.totalFeedback > 0 
        ? (this.stats.positiveFeedback / this.stats.totalFeedback) * 100 
        : 0,
      negativePercentage: this.stats.totalFeedback > 0 
        ? (this.stats.negativeFeedback / this.stats.totalFeedback) * 100 
        : 0
    };
  }
}

module.exports = FeedbackLoopSystem;
