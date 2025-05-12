/**
 * COMPASS Predictive Analytics Database Adapter
 * 
 * Handles all database operations for the predictive analytics component,
 * providing persistence for team ratings, game predictions, and model training data.
 */

const { Op } = require('sequelize');
const logger = require('../../utils/logger');

class PredictiveAnalyticsDB {
  /**
   * Create a new PredictiveAnalyticsDB instance
   * @param {Object} db - Database models
   */
  constructor(db) {
    this.db = db;
    logger.info('Predictive Analytics DB adapter initialized');
  }
  
  /**
   * Get team rating from database
   * @param {string} teamId - Team ID
   * @param {number} maxAgeHours - Maximum age in hours
   * @returns {Promise<Object|null>} Team rating or null if not found
   */
  async getTeamRating(teamId, maxAgeHours = 24) {
    try {
      // Ensure we have access to the model
      if (!this.db.TeamRating) {
        logger.warn('TeamRating model not available');
        return null;
      }
      
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);
      
      // Get rating from database
      const dbRating = await this.db.TeamRating.findOne({
        where: {
          team_id: teamId,
          last_updated: {
            [Op.gte]: cutoffDate
          }
        },
        order: [['last_updated', 'DESC']]
      });
      
      if (!dbRating) {
        return null;
      }
      
      // Convert to component format
      return {
        programId: teamId,
        sport: dbRating.sport,
        normalizedRating: dbRating.normalized_rating,
        rating: dbRating.raw_rating,
        components: dbRating.rating_components,
        rosterAdjustment: dbRating.roster_adjustment,
        ratingDistribution: {
          percentile: dbRating.percentile,
          tier: dbRating.tier
        },
        lastUpdated: dbRating.last_updated
      };
    } catch (error) {
      logger.error(`Error getting team rating from DB: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Save team rating to database
   * @param {string} teamId - Team ID
   * @param {Object} rating - Team rating
   * @returns {Promise<boolean>} Success indicator
   */
  async saveTeamRating(teamId, rating) {
    try {
      // Ensure we have access to the model
      if (!this.db.TeamRating) {
        logger.warn('TeamRating model not available');
        return false;
      }
      
      // Save to database
      await this.db.TeamRating.upsert({
        team_id: teamId,
        sport: rating.sport,
        normalized_rating: rating.normalizedRating,
        raw_rating: rating.rating,
        percentile: rating.ratingDistribution.percentile,
        tier: rating.ratingDistribution.tier,
        rating_components: rating.components,
        roster_adjustment: rating.rosterAdjustment,
        prediction_confidence: 0.8,
        last_updated: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error(`Error saving team rating to DB: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Save roster change to database
   * @param {string} teamId - Team ID
   * @param {Object} change - Roster change
   * @returns {Promise<boolean>} Success indicator
   */
  async saveRosterChange(teamId, change) {
    try {
      // Ensure we have access to the model
      if (!this.db.RosterChange) {
        logger.warn('RosterChange model not available');
        return false;
      }
      
      // Calculate impact score
      const playerQuality = change.playerRating || 0.5;
      let impactScore = 0;
      
      switch (change.type) {
        case 'add':
          impactScore = playerQuality * 0.15;
          break;
        case 'remove':
          impactScore = -playerQuality * 0.15;
          break;
        case 'injury':
          impactScore = -playerQuality * 0.15 * 0.8;
          break;
        case 'return':
          impactScore = playerQuality * 0.15 * 0.8;
          break;
        default:
          impactScore = 0;
      }
      
      // Save to database
      await this.db.RosterChange.create({
        team_id: teamId,
        player_name: change.playerName,
        change_type: change.type,
        player_rating: change.playerRating || 0.5,
        impact_score: impactScore,
        details: change.details || ''
      });
      
      return true;
    } catch (error) {
      logger.error(`Error saving roster change to DB: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get recent roster changes for a team
   * @param {string} teamId - Team ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<Array>} Roster changes
   */
  async getRecentRosterChanges(teamId, days = 30) {
    try {
      // Ensure we have access to the model
      if (!this.db.RosterChange) {
        logger.warn('RosterChange model not available');
        return [];
      }
      
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      // Get changes from database
      const changes = await this.db.RosterChange.findAll({
        where: {
          team_id: teamId,
          createdAt: {
            [Op.gte]: cutoffDate
          }
        },
        order: [['createdAt', 'DESC']]
      });
      
      // Convert to component format
      return changes.map(change => ({
        playerName: change.player_name,
        type: change.change_type,
        playerRating: change.player_rating,
        impactScore: change.impact_score,
        details: change.details,
        timestamp: change.createdAt.toISOString()
      }));
    } catch (error) {
      logger.error(`Error getting roster changes from DB: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Save game prediction to database
   * @param {Object} prediction - Game prediction
   * @returns {Promise<boolean>} Success indicator
   */
  async saveGamePrediction(prediction) {
    try {
      // Ensure we have access to the model
      if (!this.db.GamePrediction) {
        logger.warn('GamePrediction model not available');
        return false;
      }
      
      // Save to database
      await this.db.GamePrediction.create({
        game_id: prediction.gameId,
        home_team_id: prediction.team1.id,
        away_team_id: prediction.team2.id,
        sport: prediction.sport || 'Basketball',
        home_win_probability: prediction.team1.winProbability,
        expected_margin: prediction.expectedMargin,
        confidence_level: prediction.confidence,
        is_neutral_site: prediction.neutralSite || false,
        key_factors: prediction.factors || [],
        prediction_date: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error(`Error saving game prediction to DB: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get prediction for a game
   * @param {string} gameId - Game ID
   * @returns {Promise<Object|null>} Game prediction or null if not found
   */
  async getGamePrediction(gameId) {
    try {
      // Ensure we have access to the model
      if (!this.db.GamePrediction) {
        logger.warn('GamePrediction model not available');
        return null;
      }
      
      // Get prediction from database
      const prediction = await this.db.GamePrediction.findOne({
        where: { game_id: gameId },
        order: [['prediction_date', 'DESC']]
      });
      
      if (!prediction) {
        return null;
      }
      
      // Convert to component format
      return {
        gameId,
        team1: {
          id: prediction.home_team_id,
          winProbability: prediction.home_win_probability
        },
        team2: {
          id: prediction.away_team_id,
          winProbability: 1 - prediction.home_win_probability
        },
        expectedMargin: prediction.expected_margin,
        confidence: prediction.confidence_level,
        neutralSite: prediction.is_neutral_site,
        factors: prediction.key_factors,
        predictedAt: prediction.prediction_date.toISOString()
      };
    } catch (error) {
      logger.error(`Error getting game prediction from DB: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Save strength of schedule to database
   * @param {string} teamId - Team ID
   * @param {string} scheduleId - Schedule ID
   * @param {Object} sos - Strength of schedule data
   * @returns {Promise<boolean>} Success indicator
   */
  async saveStrengthOfSchedule(teamId, scheduleId, sos) {
    try {
      // Ensure we have access to the model
      if (!this.db.StrengthOfSchedule) {
        logger.warn('StrengthOfSchedule model not available');
        return false;
      }
      
      // Save to database
      await this.db.StrengthOfSchedule.upsert({
        team_id: teamId,
        schedule_id: scheduleId,
        sport: sos.sport || 'Basketball',
        season: sos.season || '2025-2026',
        overall_sos: sos.overallSoS,
        home_sos: sos.homeSoS,
        away_sos: sos.awaySoS,
        past_sos: sos.pastSoS,
        future_sos: sos.futureSoS,
        difficulty_tier: sos.difficulty,
        opponent_metrics: sos.opponentMetrics || {},
        calculation_date: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error(`Error saving strength of schedule to DB: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get strength of schedule for a team
   * @param {string} teamId - Team ID
   * @param {string} scheduleId - Schedule ID
   * @returns {Promise<Object|null>} Strength of schedule or null if not found
   */
  async getStrengthOfSchedule(teamId, scheduleId) {
    try {
      // Ensure we have access to the model
      if (!this.db.StrengthOfSchedule) {
        logger.warn('StrengthOfSchedule model not available');
        return null;
      }
      
      // Build query
      const query = { team_id: teamId };
      if (scheduleId) {
        query.schedule_id = scheduleId;
      }
      
      // Get SoS from database
      const sos = await this.db.StrengthOfSchedule.findOne({
        where: query,
        order: [['calculation_date', 'DESC']]
      });
      
      if (!sos) {
        return null;
      }
      
      // Convert to component format
      return {
        overallSoS: sos.overall_sos,
        homeSoS: sos.home_sos,
        awaySoS: sos.away_sos,
        pastSoS: sos.past_sos,
        futureSoS: sos.future_sos,
        difficulty: sos.difficulty_tier,
        opponentMetrics: sos.opponent_metrics,
        calculatedAt: sos.calculation_date.toISOString()
      };
    } catch (error) {
      logger.error(`Error getting strength of schedule from DB: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Save external rating to database
   * @param {string} teamId - Team ID
   * @param {string} source - Rating source
   * @param {Object} rating - Rating data
   * @returns {Promise<boolean>} Success indicator
   */
  async saveExternalRating(teamId, source, rating) {
    try {
      // Ensure we have access to the model
      if (!this.db.ExternalRating) {
        logger.warn('ExternalRating model not available');
        return false;
      }
      
      // Save to database
      await this.db.ExternalRating.upsert({
        team_id: teamId,
        source,
        rating_value: rating.value,
        normalized_value: rating.normalizedValue,
        ranking: rating.ranking,
        season: rating.season || '2025-2026',
        raw_data: rating.rawData || {},
        fetch_date: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error(`Error saving external rating to DB: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get external ratings for a team
   * @param {string} teamId - Team ID
   * @param {Array} sources - Rating sources to include
   * @returns {Promise<Object>} External ratings by source
   */
  async getExternalRatings(teamId, sources = []) {
    try {
      // Ensure we have access to the model
      if (!this.db.ExternalRating) {
        logger.warn('ExternalRating model not available');
        return {};
      }
      
      // Build query
      const query = { team_id: teamId };
      if (sources && sources.length > 0) {
        query.source = { [Op.in]: sources };
      }
      
      // Get ratings from database
      const ratings = await this.db.ExternalRating.findAll({
        where: query,
        order: [['fetch_date', 'DESC']]
      });
      
      // Group by source
      const ratingsBySource = {};
      
      for (const rating of ratings) {
        if (!ratingsBySource[rating.source]) {
          ratingsBySource[rating.source] = {
            value: rating.rating_value,
            normalizedValue: rating.normalized_value,
            ranking: rating.ranking,
            season: rating.season,
            fetchDate: rating.fetch_date.toISOString()
          };
        }
      }
      
      return ratingsBySource;
    } catch (error) {
      logger.error(`Error getting external ratings from DB: ${error.message}`);
      return {};
    }
  }
  
  /**
   * Save training data to database
   * @param {string} sport - Sport name
   * @param {string} dataType - Data type
   * @param {Object} data - Training data
   * @returns {Promise<boolean>} Success indicator
   */
  async saveTrainingData(sport, dataType, data) {
    try {
      // Ensure we have access to the model
      if (!this.db.ModelTrainingData) {
        logger.warn('ModelTrainingData model not available');
        return false;
      }
      
      // Save to database
      await this.db.ModelTrainingData.create({
        sport,
        data_type: dataType,
        features: data.features,
        labels: data.labels,
        weight: data.weight || 1.0,
        source: data.source || 'system',
        is_validated: data.isValidated || false,
        collection_date: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error(`Error saving training data to DB: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get training data for model training
   * @param {string} sport - Sport name
   * @param {string} dataType - Data type
   * @param {number} limit - Maximum number of records
   * @returns {Promise<Array>} Training data
   */
  async getTrainingData(sport, dataType, limit = 1000) {
    try {
      // Ensure we have access to the model
      if (!this.db.ModelTrainingData) {
        logger.warn('ModelTrainingData model not available');
        return [];
      }
      
      // Build query
      const query = {};
      if (sport) query.sport = sport;
      if (dataType) query.data_type = dataType;
      
      // Get data from database
      const trainingData = await this.db.ModelTrainingData.findAll({
        where: query,
        order: [['collection_date', 'DESC']],
        limit
      });
      
      // Convert to component format
      return trainingData.map(data => ({
        features: data.features,
        labels: data.labels,
        weight: data.weight,
        source: data.source,
        isValidated: data.is_validated,
        collectionDate: data.collection_date.toISOString()
      }));
    } catch (error) {
      logger.error(`Error getting training data from DB: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Save model weights to database
   * @param {string} modelName - Model name
   * @param {string} sport - Sport name
   * @param {Object} weights - Model weights
   * @returns {Promise<boolean>} Success indicator
   */
  async saveModelWeights(modelName, sport, weights) {
    try {
      // Ensure we have access to the model
      if (!this.db.ModelWeights) {
        logger.warn('ModelWeights model not available');
        return false;
      }
      
      // Generate version string
      const version = `${sport}-${Date.now()}`;
      
      // Save to database
      await this.db.ModelWeights.create({
        model_name: modelName,
        sport,
        version,
        weights_data: weights.data,
        performance_metrics: weights.metrics || {},
        is_active: true,
        training_date: new Date()
      });
      
      // Deactivate previous versions
      await this.db.ModelWeights.update(
        { is_active: false },
        { 
          where: { 
            model_name: modelName,
            sport,
            version: { [Op.ne]: version }
          }
        }
      );
      
      return true;
    } catch (error) {
      logger.error(`Error saving model weights to DB: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get active model weights
   * @param {string} modelName - Model name
   * @param {string} sport - Sport name
   * @returns {Promise<Object|null>} Model weights or null if not found
   */
  async getModelWeights(modelName, sport) {
    try {
      // Ensure we have access to the model
      if (!this.db.ModelWeights) {
        logger.warn('ModelWeights model not available');
        return null;
      }
      
      // Get weights from database
      const weights = await this.db.ModelWeights.findOne({
        where: {
          model_name: modelName,
          sport,
          is_active: true
        },
        order: [['training_date', 'DESC']]
      });
      
      if (!weights) {
        return null;
      }
      
      // Convert to component format
      return {
        version: weights.version,
        data: weights.weights_data,
        metrics: weights.performance_metrics,
        trainingDate: weights.training_date.toISOString()
      };
    } catch (error) {
      logger.error(`Error getting model weights from DB: ${error.message}`);
      return null;
    }
  }
}

module.exports = PredictiveAnalyticsDB;