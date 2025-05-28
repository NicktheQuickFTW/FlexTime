/**
 * COMPASS Predictive Analytics Component
 * 
 * Implements neural network-based predictive analytics to forecast game outcomes,
 * create adaptive team rating models, and provide real-time performance insights.
 */

const logger = require('../../utils/logger');
const tf = require('@tensorflow/tfjs-node'); // For neural network implementation

class PredictiveAnalyticsComponent {
  /**
   * Create a new Predictive Analytics Component
   * @param {Object} db - Database connection
   * @param {Object} options - Configuration options
   */
  constructor(db, options = {}) {
    this.db = db;
    this.options = {
      modelUpdateFrequency: 24 * 60 * 60 * 1000, // 24 hours by default
      predictionConfidenceThreshold: 0.6,
      rosterChangeImpactFactor: 0.15,
      ratingSystemWeights: {
        internalModel: 0.40,      // COMPASS's own predictive model
        netRanking: 0.20,         // NCAA NET Ranking
        kenpom: 0.15,             // KenPom ratings
        nationalPolls: 0.10,      // AP/Coaches polls
        conferenceStanding: 0.10, // Current conference standing
        socialMedia: 0.05         // Social media sentiment
      },
      ...options
    };
    
    this.teamRatings = new Map();
    this.rosterChanges = new Map();
    this.predictionModels = new Map(); // Sport-specific prediction models
    this.lastModelUpdate = null;
    this.updatePromise = null;
    
    // Initialize rating system data sources
    this.ratingSystems = {
      netRanking: new Map(),
      kenpom: new Map(),
      nationalPolls: new Map(),
      conferenceStanding: new Map(),
      socialMedia: new Map()
    };
    
    logger.info('COMPASS Predictive Analytics Component initialized');
  }
  
  /**
   * Initialize the component
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Load external rating data
      await this._loadExternalRatings();
      
      // Initialize neural network models
      await this._initializePredictionModels();
      
      logger.info('Predictive Analytics Component initialized successfully');
    } catch (error) {
      logger.error(`Error initializing Predictive Analytics Component: ${error.message}`);
    }
  }
  
  /**
   * Get predictive score for a program
   * @param {string} programId - Program ID
   * @returns {Promise<number>} Predictive score (0-1)
   */
  async getScore(programId) {
    try {
      // Ensure models and ratings are up to date
      await this._ensureUpdated();
      
      // Check if we already have a rating
      if (this.teamRatings.has(programId)) {
        return this.teamRatings.get(programId).normalizedRating;
      }
      
      // Generate rating if not available
      const rating = await this._generateTeamRating(programId);
      return rating.normalizedRating;
    } catch (error) {
      logger.error(`Error getting predictive analytics score for ${programId}: ${error.message}`);
      return 0.6; // Default moderate score
    }
  }
  
  /**
   * Get detailed team rating with all components
   * @param {string} programId - Program ID
   * @returns {Promise<Object>} Detailed team rating
   */
  async getTeamRating(programId) {
    try {
      // Ensure models and ratings are up to date
      await this._ensureUpdated();
      
      // Check if we already have a rating
      if (this.teamRatings.has(programId)) {
        return this.teamRatings.get(programId);
      }
      
      // Generate rating if not available
      return await this._generateTeamRating(programId);
    } catch (error) {
      logger.error(`Error getting team rating for ${programId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Register a roster change for a team
   * @param {string} teamId - Team ID
   * @param {Object} change - Roster change details
   * @returns {Promise<void>}
   */
  async registerRosterChange(teamId, change) {
    try {
      // Initialize team's roster changes array if not exists
      if (!this.rosterChanges.has(teamId)) {
        this.rosterChanges.set(teamId, []);
      }
      
      // Add the change with timestamp
      const teamChanges = this.rosterChanges.get(teamId);
      teamChanges.push({
        ...change,
        timestamp: new Date().toISOString()
      });
      
      // Limit array size to prevent memory issues (keep last 50 changes)
      if (teamChanges.length > 50) {
        teamChanges.shift(); // Remove oldest change
      }
      
      // Reset team rating to trigger recalculation
      this.teamRatings.delete(teamId);
      
      logger.info(`Registered roster change for team ${teamId}: ${change.type} - ${change.playerName}`);
    } catch (error) {
      logger.error(`Error registering roster change: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Predict game outcome between two teams
   * @param {string} team1Id - First team ID
   * @param {string} team2Id - Second team ID
   * @param {string} sport - Sport name
   * @param {boolean} neutralSite - Whether the game is at a neutral site
   * @returns {Promise<Object>} Game prediction
   */
  async predictGameOutcome(team1Id, team2Id, sport, neutralSite = false) {
    try {
      // Get team ratings
      const [team1Rating, team2Rating] = await Promise.all([
        this.getTeamRating(team1Id),
        this.getTeamRating(team2Id)
      ]);
      
      // Get sport-specific prediction model
      const model = this.predictionModels.get(sport) || this.predictionModels.get('default');
      
      if (!model) {
        throw new Error('Prediction model not available');
      }
      
      // Prepare input features
      const features = this._prepareGamePredictionFeatures(
        team1Rating, team2Rating, neutralSite
      );
      
      // Convert to tensor
      const inputTensor = tf.tensor2d([features]);
      
      // Run prediction
      const prediction = model.predict(inputTensor);
      const predictionData = await prediction.data();
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();
      
      // Team 1 win probability
      const team1WinProb = predictionData[0];
      
      // Calculate expected margin
      const expectedMargin = this._calculateExpectedMargin(
        team1Rating, team2Rating, team1WinProb, sport
      );
      
      // Determine confidence level
      let confidence;
      if (team1WinProb > 0.8 || team1WinProb < 0.2) confidence = 'High';
      else if (team1WinProb > 0.65 || team1WinProb < 0.35) confidence = 'Medium';
      else confidence = 'Low';
      
      return {
        team1: {
          id: team1Id,
          name: team1Rating.name,
          rating: team1Rating.rating,
          winProbability: team1WinProb
        },
        team2: {
          id: team2Id,
          name: team2Rating.name,
          rating: team2Rating.rating,
          winProbability: 1 - team1WinProb
        },
        expectedMargin: expectedMargin,
        confidence: confidence,
        isTossUp: Math.abs(team1WinProb - 0.5) < 0.1,
        factors: this._getPredictionFactors(team1Rating, team2Rating),
        neutralSite: neutralSite,
        predictedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error predicting game outcome: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Calculate strength of schedule
   * @param {Array} games - Array of games to analyze
   * @param {string} teamId - Team ID to calculate SoS for
   * @returns {Promise<Object>} Strength of schedule metrics
   */
  async calculateStrengthOfSchedule(games, teamId) {
    try {
      // Filter for team's games
      const teamGames = games.filter(game => 
        (game.homeTeam && game.homeTeam.id === teamId) || 
        (game.awayTeam && game.awayTeam.id === teamId)
      );
      
      if (teamGames.length === 0) {
        return {
          overallSoS: 0.5,
          homeSoS: 0.5,
          awaySoS: 0.5,
          pastSoS: 0.5,
          futureSoS: 0.5,
          difficulty: 'Average'
        };
      }
      
      // Get opponent ratings
      const opponentRatings = [];
      const homeOpponentRatings = [];
      const awayOpponentRatings = [];
      const pastOpponentRatings = [];
      const futureOpponentRatings = [];
      
      const now = new Date();
      
      for (const game of teamGames) {
        // Determine opponent
        const opponentId = game.homeTeam && game.homeTeam.id === teamId ? 
          game.awayTeam.id : game.homeTeam.id;
        
        // Get opponent rating
        let opponentRating;
        try {
          opponentRating = await this.getTeamRating(opponentId);
        } catch (error) {
          // Use default if rating not available
          opponentRating = { normalizedRating: 0.5 };
        }
        
        opponentRatings.push(opponentRating.normalizedRating);
        
        // Track home/away
        if (game.homeTeam && game.homeTeam.id === teamId) {
          homeOpponentRatings.push(opponentRating.normalizedRating);
        } else {
          awayOpponentRatings.push(opponentRating.normalizedRating);
        }
        
        // Track past/future
        const gameDate = new Date(game.date);
        if (gameDate < now) {
          pastOpponentRatings.push(opponentRating.normalizedRating);
        } else {
          futureOpponentRatings.push(opponentRating.normalizedRating);
        }
      }
      
      // Calculate average ratings
      const calculateAverage = arr => arr.length ? 
        arr.reduce((sum, val) => sum + val, 0) / arr.length : 0.5;
      
      const overallSoS = calculateAverage(opponentRatings);
      const homeSoS = calculateAverage(homeOpponentRatings);
      const awaySoS = calculateAverage(awayOpponentRatings);
      const pastSoS = calculateAverage(pastOpponentRatings);
      const futureSoS = calculateAverage(futureOpponentRatings);
      
      // Determine difficulty level
      let difficulty;
      if (overallSoS >= 0.8) difficulty = 'Extremely High';
      else if (overallSoS >= 0.7) difficulty = 'Very High';
      else if (overallSoS >= 0.6) difficulty = 'High';
      else if (overallSoS >= 0.5) difficulty = 'Above Average';
      else if (overallSoS >= 0.4) difficulty = 'Average';
      else if (overallSoS >= 0.3) difficulty = 'Below Average';
      else difficulty = 'Low';
      
      return {
        overallSoS,
        homeSoS,
        awaySoS,
        pastSoS,
        futureSoS,
        difficulty,
        opponentCount: opponentRatings.length,
        topTierOpponents: opponentRatings.filter(r => r >= 0.7).length,
        calculatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error calculating strength of schedule: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Ensure models and ratings are up to date
   * @returns {Promise<void>}
   * @private
   */
  async _ensureUpdated() {
    const now = Date.now();
    
    // Check if update is needed
    if (
      !this.lastModelUpdate || 
      (now - this.lastModelUpdate) > this.options.modelUpdateFrequency
    ) {
      // If update is already in progress, wait for it
      if (this.updatePromise) {
        return this.updatePromise;
      }
      
      // Start update
      this.updatePromise = this._updateModelsAndRatings();
      
      try {
        await this.updatePromise;
        this.lastModelUpdate = now;
      } finally {
        this.updatePromise = null;
      }
    }
  }
  
  /**
   * Update models and external ratings
   * @returns {Promise<void>}
   * @private
   */
  async _updateModelsAndRatings() {
    try {
      // Update external ratings data
      await this._loadExternalRatings();
      
      // Retrain models with newest data (would connect to training data in real implementation)
      // Here we'll just refresh our synthetic model parameters
      await this._refreshModelParameters();
      
      logger.info('Updated prediction models and ratings');
    } catch (error) {
      logger.error(`Error updating models and ratings: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load external ratings from various sources
   * @returns {Promise<void>}
   * @private
   */
  async _loadExternalRatings() {
    try {
      // In a real implementation, these would load from APIs, databases, or web scraping
      // For this prototype, we'll generate synthetic data
      
      // Get all teams
      let teams;
      try {
        teams = await this.db.Team.findAll({
          include: [
            { model: this.db.Sport, as: 'sport' }
          ]
        });
      } catch (error) {
        logger.warn(`DB query failed, using synthetic teams: ${error.message}`);
        // Generate synthetic teams
        teams = Array(100).fill(0).map((_, i) => ({
          id: `team_${i}`,
          name: `Team ${i}`,
          sport: { name: i % 3 === 0 ? 'Basketball' : (i % 3 === 1 ? 'Football' : 'Baseball') }
        }));
      }
      
      // Generate synthetic ratings for each team
      for (const team of teams) {
        const teamId = team.id || team.team_id;
        const idHash = this._simpleHash(teamId);
        
        // NET Ranking (0-1 where 1 is best)
        this.ratingSystems.netRanking.set(
          teamId, 
          0.2 + ((idHash * 31 % 80) / 100)
        );
        
        // KenPom (0-1 where 1 is best)
        this.ratingSystems.kenpom.set(
          teamId, 
          0.2 + ((idHash * 17 % 80) / 100)
        );
        
        // National Polls (0-1 where 1 is best)
        this.ratingSystems.nationalPolls.set(
          teamId, 
          0.2 + ((idHash * 23 % 80) / 100)
        );
        
        // Conference Standing (0-1 where 1 is best)
        this.ratingSystems.conferenceStanding.set(
          teamId, 
          0.2 + ((idHash * 13 % 80) / 100)
        );
        
        // Social Media Sentiment (0-1 where 1 is best)
        this.ratingSystems.socialMedia.set(
          teamId, 
          0.2 + ((idHash * 19 % 80) / 100)
        );
      }
      
      logger.info(`Loaded external ratings for ${teams.length} teams`);
    } catch (error) {
      logger.error(`Error loading external ratings: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Initialize neural network prediction models
   * @returns {Promise<void>}
   * @private
   */
  async _initializePredictionModels() {
    try {
      // Create models for each major sport
      
      // Basketball prediction model
      const basketballModel = tf.sequential();
      basketballModel.add(tf.layers.dense({
        units: 16,
        activation: 'relu',
        inputShape: [10] // 10 input features
      }));
      basketballModel.add(tf.layers.dense({
        units: 8,
        activation: 'relu'
      }));
      basketballModel.add(tf.layers.dense({
        units: 1,
        activation: 'sigmoid'
      }));
      
      basketballModel.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
      
      // Football prediction model
      const footballModel = tf.sequential();
      footballModel.add(tf.layers.dense({
        units: 16,
        activation: 'relu',
        inputShape: [10] // 10 input features
      }));
      footballModel.add(tf.layers.dense({
        units: 8,
        activation: 'relu'
      }));
      footballModel.add(tf.layers.dense({
        units: 1,
        activation: 'sigmoid'
      }));
      
      footballModel.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
      
      // Default model for other sports
      const defaultModel = tf.sequential();
      defaultModel.add(tf.layers.dense({
        units: 12,
        activation: 'relu',
        inputShape: [10] // 10 input features
      }));
      defaultModel.add(tf.layers.dense({
        units: 6,
        activation: 'relu'
      }));
      defaultModel.add(tf.layers.dense({
        units: 1,
        activation: 'sigmoid'
      }));
      
      defaultModel.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
      
      // Store models
      this.predictionModels.set('Basketball', basketballModel);
      this.predictionModels.set('Football', footballModel);
      this.predictionModels.set('default', defaultModel);
      
      // "Train" models with dummy data
      await this._trainModelsWithDummyData();
      
      logger.info('Initialized prediction models');
    } catch (error) {
      logger.error(`Error initializing prediction models: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Train models with dummy data for initialization
   * @returns {Promise<void>}
   * @private
   */
  async _trainModelsWithDummyData() {
    try {
      // Generate some dummy training data
      const generateDummyData = count => {
        const xs = [];
        const ys = [];
        
        for (let i = 0; i < count; i++) {
          // Generate features
          const features = Array(10).fill(0).map(() => Math.random());
          
          // Higher rating for team 1 means higher probability of winning
          const team1Rating = features[0];
          const team2Rating = features[1];
          
          // Simple win probability with some noise
          const winProb = (team1Rating - team2Rating + 0.5) + (Math.random() * 0.2 - 0.1);
          const outcome = winProb > Math.random() ? 1 : 0;
          
          xs.push(features);
          ys.push(outcome);
        }
        
        return {
          x: tf.tensor2d(xs),
          y: tf.tensor2d(ys, [count, 1])
        };
      };
      
      // Train each model with dummy data
      const dummyData = generateDummyData(500);
      
      const trainPromises = [];
      for (const model of this.predictionModels.values()) {
        trainPromises.push(
          model.fit(dummyData.x, dummyData.y, {
            epochs: 10,
            batchSize: 32,
            verbose: 0
          })
        );
      }
      
      await Promise.all(trainPromises);
      
      // Clean up tensors
      dummyData.x.dispose();
      dummyData.y.dispose();
      
      logger.info('Trained prediction models with dummy data');
    } catch (error) {
      logger.error(`Error training models with dummy data: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Refresh model parameters
   * @returns {Promise<void>}
   * @private
   */
  async _refreshModelParameters() {
    try {
      // In a real implementation, this would retrain models or update parameters
      // For this prototype, we'll just log the refresh
      logger.info('Refreshed model parameters');
    } catch (error) {
      logger.error(`Error refreshing model parameters: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate a team rating based on all available data
   * @param {string} programId - Program ID
   * @returns {Promise<Object>} Team rating
   * @private
   */
  async _generateTeamRating(programId) {
    try {
      // Get team data
      let team;
      try {
        team = await this.db.Team.findByPk(programId, {
          include: [
            { model: this.db.Institution, as: 'institution' },
            { model: this.db.Sport, as: 'sport' }
          ]
        });
      } catch (error) {
        logger.warn(`DB query failed, using synthetic team: ${error.message}`);
        // Generate synthetic team
        const idHash = this._simpleHash(programId);
        team = {
          id: programId,
          name: `Team ${idHash % 100}`,
          sport: { name: idHash % 3 === 0 ? 'Basketball' : (idHash % 3 === 1 ? 'Football' : 'Baseball') }
        };
      }
      
      // Get team name and sport
      const teamName = team.institution ? team.institution.name : team.name;
      const sport = team.sport ? team.sport.name : 'Basketball';
      
      // Get ratings from external systems
      const netRanking = this.ratingSystems.netRanking.get(programId) || 0.5;
      const kenpom = this.ratingSystems.kenpom.get(programId) || 0.5;
      const nationalPolls = this.ratingSystems.nationalPolls.get(programId) || 0.5;
      const conferenceStanding = this.ratingSystems.conferenceStanding.get(programId) || 0.5;
      const socialMedia = this.ratingSystems.socialMedia.get(programId) || 0.5;
      
      // Calculate internal model rating
      const internalModelRating = await this._calculateInternalRating(programId, sport);
      
      // Apply weights to each rating system
      const weights = this.options.ratingSystemWeights;
      const weightedRating = 
        (internalModelRating * weights.internalModel) +
        (netRanking * weights.netRanking) +
        (kenpom * weights.kenpom) +
        (nationalPolls * weights.nationalPolls) +
        (conferenceStanding * weights.conferenceStanding) +
        (socialMedia * weights.socialMedia);
      
      // Adjust for recent roster changes
      const rosterAdjustment = await this._calculateRosterChangeImpact(programId);
      
      // Final rating (0-1 scale)
      const finalRating = Math.min(1, Math.max(0, weightedRating + rosterAdjustment));
      
      // Raw rating for the sport (e.g. 0-100 points for basketball)
      const rawRatingScale = sport === 'Basketball' ? 100 : 
                            sport === 'Football' ? 50 : 10;
      
      const rawRating = finalRating * rawRatingScale;
      
      // Create and store the rating object
      const rating = {
        programId,
        name: teamName,
        sport,
        normalizedRating: finalRating,
        rating: Math.round(rawRating * 10) / 10,
        components: {
          internalModel: internalModelRating,
          netRanking,
          kenpom,
          nationalPolls,
          conferenceStanding,
          socialMedia
        },
        rosterAdjustment,
        ratingDistribution: this._calculateRatingPercentile(finalRating, sport),
        lastUpdated: new Date().toISOString()
      };
      
      // Store in cache
      this.teamRatings.set(programId, rating);
      
      return rating;
    } catch (error) {
      logger.error(`Error generating team rating for ${programId}: ${error.message}`);
      
      // Return default rating on error
      return {
        programId,
        name: 'Unknown Team',
        sport: 'Unknown',
        normalizedRating: 0.5,
        rating: 50,
        components: {
          internalModel: 0.5,
          netRanking: 0.5,
          kenpom: 0.5,
          nationalPolls: 0.5,
          conferenceStanding: 0.5,
          socialMedia: 0.5
        },
        rosterAdjustment: 0,
        ratingDistribution: { percentile: 50, tier: 'Average' },
        lastUpdated: new Date().toISOString(),
        error: error.message
      };
    }
  }
  
  /**
   * Calculate internal model rating for a team
   * @param {string} programId - Program ID
   * @param {string} sport - Sport name
   * @returns {Promise<number>} Internal rating (0-1)
   * @private
   */
  async _calculateInternalRating(programId, sport) {
    try {
      // In a real implementation, this would use our own predictive model
      // For this prototype, we'll create a synthetic rating
      
      // Generate a base rating from program ID for consistency
      const idHash = this._simpleHash(programId);
      let baseRating = 0.2 + ((idHash * 29 % 80) / 100); // 0.2-1.0 range
      
      // Adjust rating based on sport (if needed)
      if (sport === 'Basketball') {
        // No adjustment needed
      } else if (sport === 'Football') {
        // Slightly different distribution for football
        baseRating = 0.9 * baseRating + 0.1;
      } else {
        // Other sports
        baseRating = 0.8 * baseRating + 0.1;
      }
      
      return baseRating;
    } catch (error) {
      logger.error(`Error calculating internal rating: ${error.message}`);
      return 0.5; // Default moderate rating
    }
  }
  
  /**
   * Calculate the impact of roster changes
   * @param {string} programId - Program ID
   * @returns {Promise<number>} Rating adjustment (-0.1 to +0.1)
   * @private
   */
  async _calculateRosterChangeImpact(programId) {
    try {
      // Get roster changes for this team
      const changes = this.rosterChanges.get(programId) || [];
      
      // If no changes, return 0 adjustment
      if (changes.length === 0) {
        return 0;
      }
      
      // Filter to recent changes (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentChanges = changes.filter(change => {
        const changeDate = new Date(change.timestamp);
        return changeDate >= thirtyDaysAgo;
      });
      
      // Calculate impact of each change
      let totalImpact = 0;
      
      for (const change of recentChanges) {
        // Impact depends on change type and player quality
        const playerQuality = change.playerRating || 0.5; // 0-1 where 1 is best
        
        let impact = 0;
        
        switch (change.type) {
          case 'add': // Adding a player (recruit, transfer)
            impact = playerQuality * this.options.rosterChangeImpactFactor;
            break;
            
          case 'remove': // Losing a player (graduation, transfer out, injury)
            impact = -playerQuality * this.options.rosterChangeImpactFactor;
            break;
            
          case 'injury': // Temporary loss
            impact = -playerQuality * this.options.rosterChangeImpactFactor * 0.8;
            break;
            
          case 'return': // Player returning from injury
            impact = playerQuality * this.options.rosterChangeImpactFactor * 0.8;
            break;
            
          default:
            impact = 0;
        }
        
        totalImpact += impact;
      }
      
      // Cap impact to prevent extreme swings (-0.1 to +0.1)
      return Math.max(-0.1, Math.min(0.1, totalImpact));
    } catch (error) {
      logger.error(`Error calculating roster change impact: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Calculate rating percentile and tier
   * @param {number} rating - Normalized rating (0-1)
   * @param {string} sport - Sport name
   * @returns {Object} Percentile and tier information
   * @private
   */
  _calculateRatingPercentile(rating, sport) {
    // Calculate percentile (approximate)
    const percentile = Math.round(rating * 100);
    
    // Determine tier
    let tier;
    if (percentile >= 95) tier = 'Elite';
    else if (percentile >= 85) tier = 'Excellent';
    else if (percentile >= 70) tier = 'Very Good';
    else if (percentile >= 55) tier = 'Above Average';
    else if (percentile >= 45) tier = 'Average';
    else if (percentile >= 30) tier = 'Below Average';
    else if (percentile >= 15) tier = 'Poor';
    else tier = 'Very Poor';
    
    return { percentile, tier };
  }
  
  /**
   * Prepare features for game prediction
   * @param {Object} team1 - First team rating
   * @param {Object} team2 - Second team rating
   * @param {boolean} neutralSite - Whether the game is at a neutral site
   * @returns {Array} Feature array
   * @private
   */
  _prepareGamePredictionFeatures(team1, team2, neutralSite) {
    return [
      team1.normalizedRating,
      team2.normalizedRating,
      team1.components.internalModel,
      team2.components.internalModel,
      team1.components.netRanking,
      team2.components.netRanking,
      team1.components.conferenceStanding,
      team2.components.conferenceStanding,
      team1.rosterAdjustment,
      neutralSite ? 0.5 : 1.0 // Home court advantage factor
    ];
  }
  
  /**
   * Calculate expected margin for a game
   * @param {Object} team1 - First team rating
   * @param {Object} team2 - Second team rating
   * @param {number} team1WinProb - Team 1 win probability
   * @param {string} sport - Sport name
   * @returns {number} Expected margin
   * @private
   */
  _calculateExpectedMargin(team1, team2, team1WinProb, sport) {
    // Different scaling factors for different sports
    let scaleFactor;
    
    if (sport === 'Basketball') {
      scaleFactor = 30; // Basketball can have margins up to ~30 points
    } else if (sport === 'Football') {
      scaleFactor = 21; // Football typically has margins up to ~21 points
    } else {
      scaleFactor = 5; // Other sports have smaller margins
    }
    
    // Rating difference component
    const ratingDiff = team1.normalizedRating - team2.normalizedRating;
    
    // Win probability component (more predictive than pure ratings)
    const probDiff = team1WinProb - 0.5;
    
    // Combined calculation with diminishing returns for very high differences
    const expectedMargin = scaleFactor * (
      0.7 * Math.sign(probDiff) * Math.pow(Math.abs(probDiff), 0.8) +
      0.3 * Math.sign(ratingDiff) * Math.pow(Math.abs(ratingDiff), 0.8)
    );
    
    return Math.round(expectedMargin * 10) / 10;
  }
  
  /**
   * Get key factors influencing a prediction
   * @param {Object} team1 - First team rating
   * @param {Object} team2 - Second team rating
   * @returns {Array} Influential factors
   * @private
   */
  _getPredictionFactors(team1, team2) {
    const factors = [];
    
    // Compare components to find biggest differences
    const components = Object.keys(team1.components);
    
    for (const component of components) {
      const diff = team1.components[component] - team2.components[component];
      
      if (Math.abs(diff) >= 0.1) {
        factors.push({
          factor: this._formatComponentName(component),
          advantage: diff > 0 ? team1.name : team2.name,
          impact: Math.abs(diff) >= 0.2 ? 'High' : 'Medium'
        });
      }
    }
    
    // Add roster changes if significant
    if (Math.abs(team1.rosterAdjustment) >= 0.05) {
      factors.push({
        factor: 'Recent Roster Changes',
        advantage: team1.rosterAdjustment > 0 ? team1.name : 
                 team1.rosterAdjustment < 0 ? team2.name : 'None',
        impact: Math.abs(team1.rosterAdjustment) >= 0.08 ? 'High' : 'Medium'
      });
    }
    
    if (Math.abs(team2.rosterAdjustment) >= 0.05) {
      factors.push({
        factor: 'Recent Roster Changes',
        advantage: team2.rosterAdjustment > 0 ? team2.name : 
                 team2.rosterAdjustment < 0 ? team1.name : 'None',
        impact: Math.abs(team2.rosterAdjustment) >= 0.08 ? 'High' : 'Medium'
      });
    }
    
    // Sort by impact (high to low)
    factors.sort((a, b) => {
      if (a.impact === 'High' && b.impact !== 'High') return -1;
      if (a.impact !== 'High' && b.impact === 'High') return 1;
      return 0;
    });
    
    return factors.slice(0, 3); // Return top 3 factors
  }
  
  /**
   * Format component name for display
   * @param {string} component - Component key
   * @returns {string} Formatted name
   * @private
   */
  _formatComponentName(component) {
    switch (component) {
      case 'internalModel': return 'COMPASS Rating';
      case 'netRanking': return 'NET Ranking';
      case 'kenpom': return 'KenPom Rating';
      case 'nationalPolls': return 'National Polls';
      case 'conferenceStanding': return 'Conference Standing';
      case 'socialMedia': return 'Fan Sentiment';
      default: return component.replace(/([A-Z])/g, ' $1').trim();
    }
  }
  
  /**
   * Simple hash function for generating consistent synthetic data
   * @param {string} input - Input string
   * @returns {number} Hash value
   * @private
   */
  _simpleHash(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash % 100);
  }
  
  /**
   * Clear cached data
   */
  clearCache() {
    this.teamRatings.clear();
    logger.info('Predictive Analytics component cache cleared');
  }
}

module.exports = PredictiveAnalyticsComponent;