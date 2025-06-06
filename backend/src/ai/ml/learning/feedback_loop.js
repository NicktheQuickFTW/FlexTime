/**
 * Feedback Loop System for the FlexTime multi-agent system.
 *
 * This module implements the feedback loop for the agent system to learn
 * from user feedback and improve scheduling over time.
 * Now integrated with the HELiiX Intelligence Engine for enhanced learning
 * and using Neon DB for feedback storage.
 */

const { Pool } = require('pg');
const logger = require('../scripts/logger");
const IntelligenceEngineClient = require('../intelligence_engine_client');
const intelligenceEngineConfig = require('../../config/intelligence_engine_config');
const neonConfig = require('../../config/neon_db_config');

/**
 * Feedback Loop System for agent learning.
 */
class FeedbackLoopSystem {
  /**
   * Initialize a new Feedback Loop System.
   *
   * @param {object} config - Configuration options
   */
  constructor(config = {}) {
    this.neonConfig = config.neonConfig || neonConfig;
    this.memorySystem = config.memorySystem;
    this.mlManager = config.mlManager;

    // Initialize Intelligence Engine client
    this.intelligenceEngine = config.intelligenceEngine ||
      new IntelligenceEngineClient(intelligenceEngineConfig);

    // Initialize Neon DB connection
    this.neonClient = new Pool({
      connectionString: this.neonConfig.connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Ensure feedback table is created
    this._ensureFeedbackTableExists();

    logger.info('Feedback Loop System initialized with Neon DB');
  }

  /**
   * Ensure the feedback table exists in Neon DB
   * @private
   */
  async _ensureFeedbackTableExists() {
    try {
      await this.neonClient.query(`
        CREATE TABLE IF NOT EXISTS agent_feedback (
          id SERIAL PRIMARY KEY,
          agent_id TEXT NOT NULL,
          task_id TEXT,
          schedule_id TEXT,
          sport_type TEXT,
          rating NUMERIC,
          comment TEXT,
          metrics JSONB,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.neonClient.query(`
        CREATE INDEX IF NOT EXISTS idx_agent_feedback_agent_id ON agent_feedback(agent_id)
      `);

      await this.neonClient.query(`
        CREATE INDEX IF NOT EXISTS idx_agent_feedback_schedule_id ON agent_feedback(schedule_id)
      `);

      logger.info('Feedback table created in Neon DB');
    } catch (error) {
      logger.error(`Failed to create feedback table: ${error.message}`);
    }
  }
  
  /**
   * Submit feedback for a schedule.
   *
   * @param {object} feedbackData - Feedback data
   * @returns {Promise<object>} Submission result
   */
  async submitFeedback(feedbackData) {
    logger.info(`Submitting feedback for schedule ${feedbackData.scheduleId}`);

    try {
      // Store in Neon DB
      const result = await this.neonClient.query(`
        INSERT INTO agent_feedback
          (agent_id, task_id, schedule_id, sport_type, rating, comment, metrics)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        feedbackData.agentId,
        feedbackData.taskId,
        feedbackData.scheduleId,
        feedbackData.sportType,
        feedbackData.rating,
        feedbackData.comment,
        JSON.stringify(feedbackData.metrics || {})
      ]);

      const feedbackId = result.rows[0].id;
      logger.info(`Feedback stored in Neon DB with ID: ${feedbackId}`);

      // Store in Intelligence Engine if available
      if (this.intelligenceEngine && this.intelligenceEngine.isEnabled()) {
        try {
          // Format feedback as an experience for the Intelligence Engine
          const experienceData = {
            agentId: feedbackData.agentId || 'scheduling_director',
            type: 'schedule_feedback',
            content: {
              scheduleId: feedbackData.scheduleId,
              sportType: feedbackData.sportType,
              rating: feedbackData.rating,
              metrics: feedbackData.metrics || {},
              comment: feedbackData.comment,
              source: 'user_feedback'
            },
            tags: [
              feedbackData.sportType || 'unknown_sport',
              'feedback',
              `rating_${Math.floor(feedbackData.rating)}`
            ]
          };

          const ieResult = await this.intelligenceEngine.storeExperience(experienceData);
          logger.info(`Feedback stored in Intelligence Engine with ID: ${ieResult.experienceId}`);
        } catch (error) {
          logger.warn(`Failed to store feedback in Intelligence Engine: ${error.message}`);
        }
      }

      // Store in memory system if available
      if (this.memorySystem) {
        await this.memorySystem.storeMemory({
          agentId: feedbackData.agentId || 'scheduling_director',
          type: 'feedback',
          content: {
            scheduleId: feedbackData.scheduleId,
            taskId: feedbackData.taskId,
            rating: feedbackData.rating,
            comment: feedbackData.comment,
            metrics: feedbackData.metrics || {}
          },
          tags: [
            feedbackData.sportType || 'unknown_sport',
            'feedback',
            `rating_${Math.floor(feedbackData.rating)}`
          ]
        });
      }
      
      logger.info(`Feedback submitted successfully for schedule ${feedbackData.scheduleId}`);
      
      return {
        success: true,
        feedbackId: feedback._id.toString()
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
   * Process feedback cycle to improve scheduling.
   * 
   * @param {Array<object>} recentSchedules - Recent schedules to analyze
   * @returns {Promise<object>} Processing results
   */
  async processFeedbackCycle(recentSchedules = []) {
    logger.info('Processing feedback cycle');
    
    try {
      // Get recent feedback
      const recentFeedback = await this.FeedbackModel.find()
        .sort({ timestamp: -1 })
        .limit(50)
        .lean();
      
      logger.info(`Found ${recentFeedback.length} recent feedback items`);
      
      // First try to use Intelligence Engine for insights if available
      let insights = {};
      let ieInsightsUsed = false;
      
      if (this.intelligenceEngine && this.intelligenceEngine.isEnabled()) {
        try {
          // Retrieve feedback experiences from Intelligence Engine
          const feedbackExperiences = await this.intelligenceEngine.retrieveExperiences({
            type: 'schedule_feedback',
            limit: 100,
            sortBy: 'timestamp',
            sortDirection: 'desc'
          });
          
          if (feedbackExperiences && feedbackExperiences.length > 0) {
            logger.info(`Retrieved ${feedbackExperiences.length} feedback experiences from Intelligence Engine`);
            
            // Request insights analysis from Intelligence Engine
            const ieInsights = await this.intelligenceEngine.analyzeFeedback({
              feedbackExperiences,
              recentSchedules
            });
            
            if (ieInsights && ieInsights.success) {
              insights = ieInsights.insights;
              ieInsightsUsed = true;
              logger.info('Using feedback insights from Intelligence Engine');
            }
          }
        } catch (error) {
          logger.warn(`Failed to get insights from Intelligence Engine: ${error.message}`);
        }
      }
      
      // Fall back to local insights extraction if Intelligence Engine failed
      if (!ieInsightsUsed) {
        logger.info('Using local feedback analysis');
        insights = this.extractFeedbackInsights(recentFeedback);
      }
      
      // Apply insights to improve models
      const improvementResults = await this.applyFeedbackInsights(insights);
      
      // Update learning system with insights
      if (this.memorySystem) {
        await this.memorySystem.storeKnowledge({
          domain: 'feedback',
          key: `feedback_insights_${Date.now()}`,
          content: insights,
          tags: ['feedback', 'insights']
        });
      }
      
      // Store consolidated insights in Intelligence Engine
      if (this.intelligenceEngine && this.intelligenceEngine.isEnabled()) {
        try {
          const consolidatedInsight = {
            agentId: 'feedback_system',
            type: 'feedback_insights',
            content: {
              insights,
              improvementResults,
              timestamp: new Date(),
              feedbackCount: recentFeedback.length,
              scheduleCount: recentSchedules.length
            },
            tags: ['feedback', 'insights', 'consolidated']
          };
          
          await this.intelligenceEngine.storeExperience(consolidatedInsight);
          logger.info('Stored consolidated feedback insights in Intelligence Engine');
        } catch (error) {
          logger.warn(`Failed to store consolidated insights: ${error.message}`);
        }
      }
      
      return {
        success: true,
        insightsGenerated: Object.keys(insights).length,
        improvements: improvementResults,
        source: ieInsightsUsed ? 'intelligence_engine' : 'local'
      };
    } catch (error) {
      logger.error(`Failed to process feedback cycle: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Extract insights from feedback data.
   * 
   * @param {Array<object>} feedbackItems - Feedback items
   * @returns {object} Extracted insights
   * @private
   */
  extractFeedbackInsights(feedbackItems) {
    // Group feedback by sport type
    const bySport = {};
    
    feedbackItems.forEach(feedback => {
      const sportType = feedback.sportType || 'unknown';
      
      if (!bySport[sportType]) {
        bySport[sportType] = [];
      }
      
      bySport[sportType].push(feedback);
    });
    
    // Extract insights for each sport type
    const insights = {};
    
    for (const [sportType, items] of Object.entries(bySport)) {
      // Calculate average ratings
      const avgRating = items.reduce((sum, item) => sum + item.rating, 0) / items.length;
      
      // Analyze metrics
      const metricScores = {};
      let metricCount = 0;
      
      items.forEach(item => {
        if (item.metrics) {
          Object.entries(item.metrics).forEach(([metric, value]) => {
            if (typeof value === 'number') {
              metricScores[metric] = (metricScores[metric] || 0) + value;
              metricCount++;
            }
          });
        }
      });
      
      // Calculate average metric scores
      const avgMetrics = {};
      
      Object.entries(metricScores).forEach(([metric, total]) => {
        avgMetrics[metric] = total / metricCount;
      });
      
      // Find lowest rated metric
      let lowestMetric = null;
      let lowestScore = 1.0;
      
      Object.entries(avgMetrics).forEach(([metric, score]) => {
        if (score < lowestScore) {
          lowestScore = score;
          lowestMetric = metric;
        }
      });
      
      // Store insights
      insights[sportType] = {
        averageRating: avgRating,
        sampleSize: items.length,
        metrics: avgMetrics,
        lowestRatedMetric: lowestMetric,
        lowestRatedScore: lowestScore,
        recommendedFocus: this.metricToConstraint(lowestMetric)
      };
    }
    
    return insights;
  }
  
  /**
   * Apply feedback insights to improve models.
   * 
   * @param {object} insights - Feedback insights
   * @returns {Promise<object>} Improvement results
   * @private
   */
  async applyFeedbackInsights(insights) {
    const results = {};
    
    // In a real implementation, this would update model parameters
    // based on feedback insights
    
    for (const [sportType, sportInsights] of Object.entries(insights)) {
      // Simulate model improvement
      results[sportType] = {
        constraintWeightsAdjusted: true,
        focusedConstraint: sportInsights.recommendedFocus,
        weightIncrease: 0.1
      };
      
      logger.info(`Applied feedback insights for ${sportType}`);
    }
    
    return results;
  }
  
  /**
   * Convert metric name to constraint name.
   * 
   * @param {string} metric - Metric name
   * @returns {string|null} Constraint name
   * @private
   */
  metricToConstraint(metric) {
    if (!metric) return null;
    
    const mapping = {
      'travelDistance': 'travel_distance',
      'homeAwayBalance': 'home_away_balance',
      'restPeriods': 'rest_periods',
      'venueUtilization': 'venue_availability',
      'constraintSatisfaction': 'constraint_satisfaction'
    };
    
    return mapping[metric] || metric;
  }
  
  /**
   * Get feedback statistics.
   * 
   * @returns {Promise<object>} Feedback statistics
   */
  async getFeedbackStats() {
    try {
      // Get total feedback count
      const totalCount = await this.FeedbackModel.countDocuments();
      
      // Get average rating
      const ratingResult = await this.FeedbackModel.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]);
      
      const avgRating = ratingResult.length > 0 ? ratingResult[0].avgRating : 0;
      
      // Get feedback by sport type
      const sportCounts = await this.FeedbackModel.aggregate([
        { $group: { _id: '$sportType', count: { $sum: 1 } } }
      ]);
      
      const bySport = {};
      sportCounts.forEach(item => {
        bySport[item._id || 'unknown'] = item.count;
      });
      
      return {
        totalFeedback: totalCount,
        averageRating: avgRating,
        bySportType: bySport,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error(`Failed to get feedback stats: ${error.message}`);
      
      return {
        error: error.message
      };
    }
  }
}

module.exports = FeedbackLoopSystem;
