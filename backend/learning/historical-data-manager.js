/**
 * FlexTime Historical Data Manager
 * 
 * This module manages the storage, retrieval, and analysis of historical scheduling data,
 * enabling the FlexTime system to learn from past schedules and improve future scheduling decisions.
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const Schedule = require('../models/schedule');

// MongoDB Schema for Historical Schedules
const HistoricalScheduleSchema = new mongoose.Schema({
  originalId: String,
  sportType: String,
  conferenceId: String,
  seasonYear: Number,
  teams: [{
    id: String,
    name: String,
    mascot: String,
    conference: String,
    location: {
      name: String,
      city: String,
      state: String,
      latitude: Number,
      longitude: Number
    }
  }],
  games: [{
    id: String,
    homeTeamId: String,
    awayTeamId: String,
    venueId: String,
    date: Date,
    metadata: mongoose.Schema.Types.Mixed
  }],
  constraints: [{
    type: String,
    parameters: mongoose.Schema.Types.Mixed
  }],
  metrics: {
    travelDistance: Number,
    homeAwayBalance: Number,
    restDays: Number,
    weekendGames: Number,
    fairnessScore: Number
  },
  feedback: {
    userRating: Number,
    comments: String,
    timestamp: Date
  },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create the model if it doesn't exist
let HistoricalSchedule;
try {
  HistoricalSchedule = mongoose.model('HistoricalSchedule');
} catch (error) {
  HistoricalSchedule = mongoose.model('HistoricalSchedule', HistoricalScheduleSchema);
}

/**
 * Historical Data Manager for storing and analyzing past schedules
 */
class HistoricalDataManager {
  /**
   * Create a new Historical Data Manager
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/heliix',
      maxHistoricalSchedules: 1000,
      enableLearning: true,
      ...config
    };
    
    this.isConnected = false;
    this.featureExtractors = {};
    this.patternRecognizers = {};
    
    // Initialize feature extractors
    this._initializeFeatureExtractors();
    
    // Initialize pattern recognizers
    this._initializePatternRecognizers();
  }
  
  /**
   * Initialize the database connection
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      if (!this.isConnected) {
        // Connect to MongoDB if not already connected
        if (mongoose.connection.readyState !== 1) {
          await mongoose.connect(this.config.mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
          });
        }
        
        this.isConnected = true;
        logger.info('Historical Data Manager initialized successfully');
      }
      
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Historical Data Manager: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Store a schedule in the historical database
   * @param {Schedule} schedule - Schedule to store
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result of the storage operation
   */
  async storeSchedule(schedule, options = {}) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }
      
      // Convert schedule to historical format
      const historicalData = this._convertToHistoricalFormat(schedule, options);
      
      // Check if this schedule already exists
      const existingSchedule = await HistoricalSchedule.findOne({ originalId: historicalData.originalId });
      
      if (existingSchedule) {
        // Update existing schedule
        Object.assign(existingSchedule, historicalData, { updatedAt: new Date() });
        await existingSchedule.save();
        
        logger.info(`Updated historical schedule: ${existingSchedule._id}`);
        return { success: true, id: existingSchedule._id, updated: true };
      } else {
        // Create new historical schedule
        const newHistoricalSchedule = new HistoricalSchedule(historicalData);
        await newHistoricalSchedule.save();
        
        // Prune old schedules if necessary
        await this._pruneOldSchedules();
        
        logger.info(`Stored new historical schedule: ${newHistoricalSchedule._id}`);
        return { success: true, id: newHistoricalSchedule._id, updated: false };
      }
    } catch (error) {
      logger.error(`Failed to store historical schedule: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Retrieve historical schedules based on criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Matching historical schedules
   */
  async retrieveSchedules(criteria = {}, options = {}) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }
      
      const query = {};
      
      // Apply criteria
      if (criteria.sportType) {
        query.sportType = criteria.sportType;
      }
      
      if (criteria.conferenceId) {
        query.conferenceId = criteria.conferenceId;
      }
      
      if (criteria.seasonYear) {
        query.seasonYear = criteria.seasonYear;
      }
      
      if (criteria.teamIds && criteria.teamIds.length > 0) {
        query['teams.id'] = { $in: criteria.teamIds };
      }
      
      // Apply options
      const limit = options.limit || 100;
      const skip = options.skip || 0;
      const sort = options.sort || { createdAt: -1 };
      
      // Execute query
      const schedules = await HistoricalSchedule.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);
      
      logger.info(`Retrieved ${schedules.length} historical schedules`);
      return schedules;
    } catch (error) {
      logger.error(`Failed to retrieve historical schedules: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Extract features from a schedule
   * @param {Schedule} schedule - Schedule to extract features from
   * @returns {Object} Extracted features
   */
  extractFeatures(schedule) {
    try {
      const features = {};
      
      // Apply all feature extractors
      for (const [name, extractor] of Object.entries(this.featureExtractors)) {
        features[name] = extractor(schedule);
      }
      
      return features;
    } catch (error) {
      logger.error(`Failed to extract features: ${error.message}`);
      return {};
    }
  }
  
  /**
   * Recognize patterns in historical data
   * @param {Array} historicalSchedules - Historical schedules to analyze
   * @param {Object} options - Analysis options
   * @returns {Object} Recognized patterns
   */
  recognizePatterns(historicalSchedules, options = {}) {
    try {
      const patterns = {};
      
      // Apply all pattern recognizers
      for (const [name, recognizer] of Object.entries(this.patternRecognizers)) {
        patterns[name] = recognizer(historicalSchedules, options);
      }
      
      return patterns;
    } catch (error) {
      logger.error(`Failed to recognize patterns: ${error.message}`);
      return {};
    }
  }
  
  /**
   * Get recommendations for a new schedule based on historical data
   * @param {Object} parameters - Parameters for the new schedule
   * @returns {Promise<Object>} Recommendations
   */
  async getRecommendations(parameters) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }
      
      // Retrieve relevant historical schedules
      const historicalSchedules = await this.retrieveSchedules({
        sportType: parameters.sportType,
        conferenceId: parameters.conferenceId
      }, { limit: 20 });
      
      if (historicalSchedules.length === 0) {
        return { success: true, recommendations: {} };
      }
      
      // Recognize patterns in historical data
      const patterns = this.recognizePatterns(historicalSchedules, parameters);
      
      // Generate recommendations based on patterns
      const recommendations = {
        algorithm: this._recommendAlgorithm(patterns, parameters),
        constraints: this._recommendConstraints(patterns, parameters),
        optimizationStrategy: this._recommendOptimizationStrategy(patterns, parameters),
        parameters: this._recommendParameters(patterns, parameters)
      };
      
      return { success: true, recommendations, source: 'historical_data' };
    } catch (error) {
      logger.error(`Failed to get recommendations: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Store feedback for a schedule
   * @param {string} scheduleId - ID of the schedule
   * @param {Object} feedback - Feedback data
   * @returns {Promise<Object>} Result of the feedback storage
   */
  async storeFeedback(scheduleId, feedback) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }
      
      // Find the historical schedule
      const historicalSchedule = await HistoricalSchedule.findOne({ originalId: scheduleId });
      
      if (!historicalSchedule) {
        return { success: false, error: 'Schedule not found' };
      }
      
      // Update feedback
      historicalSchedule.feedback = {
        ...historicalSchedule.feedback,
        ...feedback,
        timestamp: new Date()
      };
      
      historicalSchedule.updatedAt = new Date();
      await historicalSchedule.save();
      
      logger.info(`Stored feedback for schedule: ${scheduleId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to store feedback: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Convert a schedule to historical format
   * @param {Schedule} schedule - Schedule to convert
   * @param {Object} options - Additional options
   * @returns {Object} Historical format
   * @private
   */
  _convertToHistoricalFormat(schedule, options = {}) {
    // Extract basic schedule information
    const historicalData = {
      originalId: schedule.id || `schedule_${Date.now()}`,
      sportType: schedule.sportType,
      conferenceId: schedule.conferenceId,
      seasonYear: schedule.seasonYear || new Date().getFullYear(),
      teams: schedule.teams.map(team => ({
        id: team.id,
        name: team.name,
        mascot: team.mascot,
        conference: team.conference,
        location: team.location
      })),
      games: schedule.games.map(game => ({
        id: game.id,
        homeTeamId: game.homeTeam.id,
        awayTeamId: game.awayTeam.id,
        venueId: game.venue.id,
        date: game.date,
        metadata: game.metadata
      })),
      constraints: schedule.constraints ? schedule.constraints.map(constraint => ({
        type: constraint.type,
        parameters: constraint.parameters
      })) : [],
      metrics: schedule.metadata?.metrics?.overall || {
        travelDistance: 0,
        homeAwayBalance: 0,
        restDays: 0,
        weekendGames: 0,
        fairnessScore: 0
      },
      metadata: {
        ...schedule.metadata,
        source: options.source || 'manual',
        version: options.version || '2.1'
      }
    };
    
    // Add feedback if provided
    if (options.feedback) {
      historicalData.feedback = {
        ...options.feedback,
        timestamp: new Date()
      };
    }
    
    return historicalData;
  }
  
  /**
   * Prune old schedules to maintain database size
   * @private
   */
  async _pruneOldSchedules() {
    try {
      const count = await HistoricalSchedule.countDocuments();
      
      if (count > this.config.maxHistoricalSchedules) {
        const schedules = await HistoricalSchedule.find()
          .sort({ updatedAt: 1 })
          .limit(count - this.config.maxHistoricalSchedules);
        
        const ids = schedules.map(s => s._id);
        await HistoricalSchedule.deleteMany({ _id: { $in: ids } });
        
        logger.info(`Pruned ${ids.length} old historical schedules`);
      }
    } catch (error) {
      logger.error(`Failed to prune old schedules: ${error.message}`);
    }
  }
  
  /**
   * Initialize feature extractors
   * @private
   */
  _initializeFeatureExtractors() {
    // Travel distance extractor
    this.featureExtractors.travelDistance = (schedule) => {
      if (!schedule.metadata?.metrics?.overall?.travel?.averageDistance) {
        return { average: 0, total: 0, max: 0 };
      }
      
      return {
        average: schedule.metadata.metrics.overall.travel.averageDistance,
        total: schedule.metadata.metrics.overall.travel.totalDistance,
        max: schedule.metadata.metrics.overall.travel.maxDistance
      };
    };
    
    // Home/away balance extractor
    this.featureExtractors.homeAwayBalance = (schedule) => {
      if (!schedule.metadata?.metrics?.overall?.homeAwayBalance?.averageRatio) {
        return { average: 1.0, min: 1.0, max: 1.0 };
      }
      
      return {
        average: parseFloat(schedule.metadata.metrics.overall.homeAwayBalance.averageRatio),
        min: parseFloat(schedule.metadata.metrics.overall.homeAwayBalance.minRatio),
        max: parseFloat(schedule.metadata.metrics.overall.homeAwayBalance.maxRatio)
      };
    };
    
    // Rest days extractor
    this.featureExtractors.restDays = (schedule) => {
      if (!schedule.metadata?.metrics?.overall?.restDays?.average) {
        return { average: 0, min: 0 };
      }
      
      return {
        average: parseFloat(schedule.metadata.metrics.overall.restDays.average),
        min: schedule.metadata.metrics.overall.restDays.minimum
      };
    };
    
    // Weekend games extractor
    this.featureExtractors.weekendGames = (schedule) => {
      if (!schedule.metadata?.metrics?.overall?.weekendGames?.averagePercentage) {
        return { percentage: 0, total: 0 };
      }
      
      return {
        percentage: parseFloat(schedule.metadata.metrics.overall.weekendGames.averagePercentage),
        total: schedule.metadata.metrics.overall.weekendGames.total
      };
    };
    
    // Fairness score extractor
    this.featureExtractors.fairnessScore = (schedule) => {
      return schedule.metadata?.metrics?.overall?.fairnessScore || 0;
    };
  }
  
  /**
   * Initialize pattern recognizers
   * @private
   */
  _initializePatternRecognizers() {
    // Algorithm success pattern recognizer
    this.patternRecognizers.algorithmSuccess = (schedules, options) => {
      const algorithmCounts = {};
      const algorithmScores = {};
      
      for (const schedule of schedules) {
        const algorithm = schedule.metadata?.algorithm || 'unknown';
        const fairnessScore = schedule.metrics?.fairnessScore || 0;
        const userRating = schedule.feedback?.userRating || 0;
        
        // Calculate weighted score (fairness + user rating)
        const weightedScore = fairnessScore * 0.7 + userRating * 3;
        
        if (!algorithmCounts[algorithm]) {
          algorithmCounts[algorithm] = 0;
          algorithmScores[algorithm] = 0;
        }
        
        algorithmCounts[algorithm]++;
        algorithmScores[algorithm] += weightedScore;
      }
      
      // Calculate average scores
      const algorithmAverages = {};
      for (const [algorithm, count] of Object.entries(algorithmCounts)) {
        algorithmAverages[algorithm] = algorithmScores[algorithm] / count;
      }
      
      return {
        counts: algorithmCounts,
        averages: algorithmAverages,
        best: Object.entries(algorithmAverages)
          .sort(([, a], [, b]) => b - a)
          .map(([algorithm]) => algorithm)
      };
    };
    
    // Constraint effectiveness pattern recognizer
    this.patternRecognizers.constraintEffectiveness = (schedules, options) => {
      const constraintCounts = {};
      const constraintScores = {};
      
      for (const schedule of schedules) {
        const fairnessScore = schedule.metrics?.fairnessScore || 0;
        
        for (const constraint of schedule.constraints || []) {
          const constraintType = constraint.type;
          
          if (!constraintCounts[constraintType]) {
            constraintCounts[constraintType] = 0;
            constraintScores[constraintType] = 0;
          }
          
          constraintCounts[constraintType]++;
          constraintScores[constraintType] += fairnessScore;
        }
      }
      
      // Calculate average scores
      const constraintAverages = {};
      for (const [constraintType, count] of Object.entries(constraintCounts)) {
        constraintAverages[constraintType] = constraintScores[constraintType] / count;
      }
      
      return {
        counts: constraintCounts,
        averages: constraintAverages,
        best: Object.entries(constraintAverages)
          .sort(([, a], [, b]) => b - a)
          .map(([constraintType]) => constraintType)
      };
    };
    
    // Optimization strategy effectiveness pattern recognizer
    this.patternRecognizers.optimizationEffectiveness = (schedules, options) => {
      const strategyCounts = {};
      const strategyScores = {};
      
      for (const schedule of schedules) {
        const strategy = schedule.metadata?.optimizationStrategy || 'unknown';
        const fairnessScore = schedule.metrics?.fairnessScore || 0;
        const travelScore = 100 - (schedule.metrics?.travelDistance || 0) / 1000;
        
        // Calculate weighted score
        const weightedScore = fairnessScore * 0.6 + travelScore * 0.4;
        
        if (!strategyCounts[strategy]) {
          strategyCounts[strategy] = 0;
          strategyScores[strategy] = 0;
        }
        
        strategyCounts[strategy]++;
        strategyScores[strategy] += weightedScore;
      }
      
      // Calculate average scores
      const strategyAverages = {};
      for (const [strategy, count] of Object.entries(strategyCounts)) {
        strategyAverages[strategy] = strategyScores[strategy] / count;
      }
      
      return {
        counts: strategyCounts,
        averages: strategyAverages,
        best: Object.entries(strategyAverages)
          .sort(([, a], [, b]) => b - a)
          .map(([strategy]) => strategy)
      };
    };
  }
  
  /**
   * Recommend an algorithm based on patterns
   * @param {Object} patterns - Recognized patterns
   * @param {Object} parameters - Schedule parameters
   * @returns {string} Recommended algorithm
   * @private
   */
  _recommendAlgorithm(patterns, parameters) {
    const { algorithmSuccess } = patterns;
    
    if (!algorithmSuccess || !algorithmSuccess.best || algorithmSuccess.best.length === 0) {
      // Default recommendations based on sport type
      switch (parameters.sportType) {
        case 'football':
          return 'partial_round_robin';
        case 'basketball':
          return 'round_robin';
        default:
          return 'round_robin';
      }
    }
    
    return algorithmSuccess.best[0];
  }
  
  /**
   * Recommend constraints based on patterns
   * @param {Object} patterns - Recognized patterns
   * @param {Object} parameters - Schedule parameters
   * @returns {Array} Recommended constraints
   * @private
   */
  _recommendConstraints(patterns, parameters) {
    const { constraintEffectiveness } = patterns;
    
    if (!constraintEffectiveness || !constraintEffectiveness.best || constraintEffectiveness.best.length === 0) {
      // Default constraints based on sport type
      switch (parameters.sportType) {
        case 'football':
          return ['min_days_between_games', 'max_consecutive_home_games', 'max_consecutive_away_games'];
        case 'basketball':
          return ['min_days_between_games', 'balance_home_away', 'minimize_travel'];
        default:
          return ['min_days_between_games', 'balance_home_away'];
      }
    }
    
    // Return top 3 most effective constraints
    return constraintEffectiveness.best.slice(0, 3);
  }
  
  /**
   * Recommend optimization strategy based on patterns
   * @param {Object} patterns - Recognized patterns
   * @param {Object} parameters - Schedule parameters
   * @returns {string} Recommended optimization strategy
   * @private
   */
  _recommendOptimizationStrategy(patterns, parameters) {
    const { optimizationEffectiveness } = patterns;
    
    if (!optimizationEffectiveness || !optimizationEffectiveness.best || optimizationEffectiveness.best.length === 0) {
      // Default optimization strategy based on sport type
      switch (parameters.sportType) {
        case 'football':
          return 'travel';
        case 'basketball':
          return 'simulated_annealing';
        default:
          return 'simulated_annealing';
      }
    }
    
    return optimizationEffectiveness.best[0];
  }
  
  /**
   * Recommend parameters based on patterns
   * @param {Object} patterns - Recognized patterns
   * @param {Object} parameters - Schedule parameters
   * @returns {Object} Recommended parameters
   * @private
   */
  _recommendParameters(patterns, parameters) {
    // Default parameters
    const defaultParams = {
      minDaysBetweenGames: 2,
      maxConsecutiveHomeGames: 3,
      maxConsecutiveAwayGames: 3,
      preferWeekends: true,
      balanceHomeAway: true,
      optimizeTravel: true
    };
    
    // Adjust based on sport type
    switch (parameters.sportType) {
      case 'football':
        defaultParams.minDaysBetweenGames = 6;
        defaultParams.maxGamesPerWeek = 1;
        break;
      case 'basketball':
        defaultParams.minDaysBetweenGames = 1;
        defaultParams.maxGamesPerWeek = 3;
        break;
      case 'baseball':
      case 'softball':
        defaultParams.minDaysBetweenGames = 0;
        defaultParams.maxGamesPerWeek = 5;
        break;
    }
    
    return defaultParams;
  }
  
  /**
   * Disconnect from the database
   * @returns {Promise<boolean>} Whether disconnection was successful
   */
  async disconnect() {
    try {
      if (this.isConnected) {
        this.isConnected = false;
        logger.info('Historical Data Manager disconnected');
      }
      
      return true;
    } catch (error) {
      logger.error(`Failed to disconnect Historical Data Manager: ${error.message}`);
      return false;
    }
  }
}

module.exports = HistoricalDataManager;
