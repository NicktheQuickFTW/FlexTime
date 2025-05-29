/**
 * Predictive Scheduling Agent for FlexTime
 * 
 * This agent analyzes historical scheduling data to predict optimal schedules, focusing on:
 * - Pattern recognition in successful past schedules
 * - Learning from scheduling conflicts and resolutions
 * - Applying predictions to new scheduling scenarios
 * - Confidence scoring for predictions
 */

const logger = require('../../../utils/logger');
const MCPConnector = require('../mcp_connector');
const EnhancedMemoryAgent = require('./enhanced_memory_agent');
// MCP config removed, using default config instead
const mcpConfig = {}; // Empty object as fallback
const { SportType } = require('../../../frontend/FlexTime-ui/src/config/sportConfig');

/**
 * Predictive Scheduling Agent for optimizing schedules based on historical patterns
 */
class PredictiveSchedulingAgent {
  /**
   * Initialize a new Predictive Scheduling Agent
   * 
   * @param {object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = { ...mcpConfig, ...config };
    this.enabled = this.config.enabled;
    this.mcpConnector = new MCPConnector(this.config);
    this.memoryAgent = new EnhancedMemoryAgent(this.config);
    
    // Model configuration
    this.defaultModel = 'claude-3-sonnet-20240229';
    this.highComplexityModel = 'claude-3-opus-20240229';
    
    // Prediction cache to avoid redundant processing
    this.predictionCache = new Map();
    this.cacheExpiryHours = 24;
    
    // Tracking the system's prediction confidence
    this.confidenceThreshold = config.confidenceThreshold || 0.7;
    this.minDataPointsRequired = config.minDataPointsRequired || 5;
    
    // Sport-specific historical patterns
    this.sportPatterns = new Map();
    
    logger.info('Predictive Scheduling Agent initialized');
  }

  /**
   * Generate a cache key for prediction requests
   * 
   * @param {object} parameters - Scheduling parameters
   * @returns {string} Cache key
   * @private
   */
  generateCacheKey(parameters) {
    const { sportType, season, institutions } = parameters;
    const institutionsStr = institutions ? institutions.sort().join('_') : 'all';
    return `${sportType}_${season}_${institutionsStr}`;
  }
  
  /**
   * Check if cached prediction is still valid
   * 
   * @param {object} cachedPrediction - Cached prediction to check
   * @returns {boolean} Whether the cache is still valid
   * @private
   */
  isCacheValid(cachedPrediction) {
    if (!cachedPrediction) return false;
    
    const cacheTime = new Date(cachedPrediction.timestamp);
    const currentTime = new Date();
    const hoursDiff = (currentTime - cacheTime) / (1000 * 60 * 60);
    
    return hoursDiff < this.cacheExpiryHours;
  }
  
  /**
   * Retrieve historical data for a specific sport and season
   * 
   * @param {string} sportType - Type of sport
   * @param {string} season - Season (e.g., '2024-2025')
   * @returns {Promise<Array<object>>} Historical scheduling data
   * @private
   */
  async retrieveHistoricalData(sportType, season) {
    try {
      // First, check if we have previously learned patterns for this sport
      if (this.sportPatterns.has(sportType)) {
        logger.info(`Using cached sport patterns for ${sportType}`);
        return this.sportPatterns.get(sportType);
      }
      
      // Query the memory agent for relevant historical data
      const historicalData = await this.memoryAgent.findRelevantMemories({
        query: `${sportType} scheduling patterns and conflicts`,
        tags: ['scheduling', sportType, 'historical'],
        limit: 10,
        threshold: 0.6
      });
      
      if (historicalData.length < this.minDataPointsRequired) {
        logger.warn(`Insufficient historical data for ${sportType}`);
        return [];
      }
      
      // Process and structure the historical data
      const processedData = historicalData.map(memory => {
        try {
          // Parse the memory content if it's JSON
          if (typeof memory.content === 'string' && memory.content.trim().startsWith('{')) {
            return JSON.parse(memory.content);
          }
          return memory;
        } catch (error) {
          logger.warn(`Failed to parse memory content: ${error.message}`);
          return memory;
        }
      });
      
      // Cache the processed patterns
      this.sportPatterns.set(sportType, processedData);
      
      return processedData;
    } catch (error) {
      logger.error(`Failed to retrieve historical data: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Extract patterns from historical scheduling data
   * 
   * @param {Array<object>} historicalData - Historical scheduling data
   * @returns {object} Extracted patterns
   * @private
   */
  extractPatterns(historicalData) {
    // This is a simplified implementation - production version would use more advanced ML
    const patterns = {
      homeAwayPatterns: {},
      travelPatterns: {},
      restDayPatterns: {},
      venueConflictPatterns: {},
      weekdayPreferences: {},
      successfulSequences: []
    };
    
    // Process each historical data point
    historicalData.forEach(dataPoint => {
      if (!dataPoint.schedule) return;
      
      // Extract home/away patterns
      if (dataPoint.teams) {
        dataPoint.teams.forEach(team => {
          if (!patterns.homeAwayPatterns[team]) {
            patterns.homeAwayPatterns[team] = {
              homeGames: 0,
              awayGames: 0,
              preferredHomeGameDays: {},
              consecutiveHomeGameLimit: 0,
              consecutiveAwayGameLimit: 0
            };
          }
          
          // Analyze the schedule for this team
          let consecutiveHome = 0;
          let consecutiveAway = 0;
          let maxConsecutiveHome = 0;
          let maxConsecutiveAway = 0;
          
          dataPoint.schedule.forEach(game => {
            if (game.homeTeam === team) {
              patterns.homeAwayPatterns[team].homeGames++;
              consecutiveHome++;
              consecutiveAway = 0;
              
              // Track day preferences
              const gameDay = new Date(game.date).getDay();
              patterns.homeAwayPatterns[team].preferredHomeGameDays[gameDay] = 
                (patterns.homeAwayPatterns[team].preferredHomeGameDays[gameDay] || 0) + 1;
              
              maxConsecutiveHome = Math.max(maxConsecutiveHome, consecutiveHome);
            } else if (game.awayTeam === team) {
              patterns.homeAwayPatterns[team].awayGames++;
              consecutiveAway++;
              consecutiveHome = 0;
              maxConsecutiveAway = Math.max(maxConsecutiveAway, consecutiveAway);
            }
          });
          
          // Update consecutive game limits
          if (maxConsecutiveHome > patterns.homeAwayPatterns[team].consecutiveHomeGameLimit) {
            patterns.homeAwayPatterns[team].consecutiveHomeGameLimit = maxConsecutiveHome;
          }
          
          if (maxConsecutiveAway > patterns.homeAwayPatterns[team].consecutiveAwayGameLimit) {
            patterns.homeAwayPatterns[team].consecutiveAwayGameLimit = maxConsecutiveAway;
          }
        });
      }
      
      // Extract weekday preferences
      dataPoint.schedule.forEach(game => {
        const gameDay = new Date(game.date).getDay();
        patterns.weekdayPreferences[gameDay] = (patterns.weekdayPreferences[gameDay] || 0) + 1;
      });
      
      // Extract successful sequences (simplified version)
      if (dataPoint.success && dataPoint.schedule.length > 0) {
        patterns.successfulSequences.push({
          length: dataPoint.schedule.length,
          startDate: dataPoint.schedule[0].date,
          endDate: dataPoint.schedule[dataPoint.schedule.length - 1].date,
          sequenceHash: this.generateSequenceHash(dataPoint.schedule)
        });
      }
    });
    
    return patterns;
  }
  
  /**
   * Generate a hash to identify schedule sequence patterns
   * 
   * @param {Array<object>} schedule - Game schedule
   * @returns {string} Sequence hash
   * @private
   */
  generateSequenceHash(schedule) {
    // A simplified hash function for schedule patterns
    // Production implementation would use more sophisticated pattern recognition
    return schedule.map(game => {
      const date = new Date(game.date);
      return `${game.homeTeam.substring(0, 3)}_${game.awayTeam.substring(0, 3)}_${date.getDay()}`;
    }).join('|');
  }
  
  /**
   * Calculate the confidence score for a prediction
   * 
   * @param {object} prediction - Schedule prediction
   * @param {Array<object>} historicalData - Historical data used
   * @returns {number} Confidence score (0-1)
   * @private
   */
  calculateConfidence(prediction, historicalData) {
    if (!prediction || !historicalData || historicalData.length === 0) {
      return 0;
    }
    
    // Base confidence on amount of historical data
    let dataScore = Math.min(historicalData.length / this.minDataPointsRequired, 1);
    
    // Adjust based on recency of data
    const currentYear = new Date().getFullYear();
    const recencySum = historicalData.reduce((sum, data) => {
      const dataYear = data.season ? parseInt(data.season.split('-')[0]) : currentYear - 5;
      const yearDiff = currentYear - dataYear;
      return sum + Math.max(0, 1 - (yearDiff * 0.1)); // Reduce confidence by 10% per year
    }, 0);
    
    const recencyScore = recencySum / historicalData.length;
    
    // Adjust based on pattern matching
    const patternMatchScore = prediction.patternMatchRate || 0.5;
    
    // Final confidence calculation
    const confidence = (dataScore * 0.4) + (recencyScore * 0.3) + (patternMatchScore * 0.3);
    
    return Math.min(confidence, 1);
  }
  
  /**
   * Generate scheduling predictions based on historical patterns
   * 
   * @param {object} parameters - Scheduling parameters
   * @returns {Promise<object>} Scheduling predictions with confidence scores
   */
  async predictOptimalSchedule(parameters) {
    if (!this.enabled) {
      logger.warn('Predictive Scheduling Agent is disabled');
      return { 
        success: false, 
        error: 'Agent is disabled',
        predictions: []
      };
    }
    
    const { sportType, season } = parameters;
    
    if (!sportType || !season) {
      return {
        success: false,
        error: 'Missing required parameters: sportType and season',
        predictions: []
      };
    }
    
    try {
      logger.info(`Generating predictions for ${sportType} (${season})`);
      
      // Check cache
      const cacheKey = this.generateCacheKey(parameters);
      if (this.predictionCache.has(cacheKey)) {
        const cachedPrediction = this.predictionCache.get(cacheKey);
        if (this.isCacheValid(cachedPrediction)) {
          logger.info(`Using cached prediction for ${sportType} (${season})`);
          return cachedPrediction;
        }
      }
      
      // Retrieve historical data
      const historicalData = await this.retrieveHistoricalData(sportType, season);
      
      if (historicalData.length < this.minDataPointsRequired) {
        // Handle insufficient data
        logger.warn(`Insufficient historical data for ${sportType}`);
        return {
          success: false,
          error: 'Insufficient historical data',
          historicalDataPoints: historicalData.length,
          requiredDataPoints: this.minDataPointsRequired,
          predictions: []
        };
      }
      
      // Extract patterns
      const patterns = this.extractPatterns(historicalData);
      
      // For complex sports or large number of teams, use the more powerful model
      const useHighComplexityModel = (
        parameters.institutions?.length > 12 || 
        sportType === SportType.FOOTBALL || 
        sportType === SportType.MENS_BASKETBALL || 
        sportType === SportType.WOMENS_BASKETBALL
      );
      
      const modelToUse = useHighComplexityModel ? 
        this.highComplexityModel : this.defaultModel;
      
      // Create prompt for the AI to generate scheduling predictions
      const prompt = `
      Based on historical scheduling data and patterns for ${sportType} in similar seasons to ${season}, 
      generate an optimal schedule proposal with the following constraints:
      
      - Sport: ${sportType}
      - Season: ${season}
      - Institutions: ${parameters.institutions ? parameters.institutions.join(', ') : 'All Big 12 institutions'}
      - Start Date: ${parameters.startDate || 'Default for the sport'}
      - End Date: ${parameters.endDate || 'Default for the sport'}
      
      Historical pattern analysis has revealed:
      - Preferred weekdays: ${Object.entries(patterns.weekdayPreferences).sort((a, b) => b[1] - a[1]).map(([day, count]) => `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]} (${count})`).join(', ')}
      - Average consecutive home games limit: ${Math.round(Object.values(patterns.homeAwayPatterns).reduce((sum, p) => sum + p.consecutiveHomeGameLimit, 0) / Object.keys(patterns.homeAwayPatterns).length || 3)}
      - Average consecutive away games limit: ${Math.round(Object.values(patterns.homeAwayPatterns).reduce((sum, p) => sum + p.consecutiveAwayGameLimit, 0) / Object.keys(patterns.homeAwayPatterns).length || 2)}
      
      ${parameters.additionalConstraints ? `Additional constraints: ${parameters.additionalConstraints}` : ''}
      
      Provide a schedule that:
      1. Balances home/away games for each institution
      2. Respects travel constraints and rest periods
      3. Avoids venue conflicts
      4. Follows conference scheduling rules
      5. Optimizes for competitive balance
      
      Format the output as a JSON object with the following structure:
      {
        "scheduleProposal": [
          {
            "date": "YYYY-MM-DD",
            "homeTeam": "Team Name",
            "awayTeam": "Team Name",
            "venue": "Venue Name",
            "startTime": "HH:MM" (24-hour format)
          },
          ...
        ],
        "patternMatchRate": 0.XX, // How well this matches historical patterns
        "schedulingNotes": [] // Array of important notes about the schedule
      }
      `;
      
      // Use FlexTime AI to generate prediction
      const response = await this.mcpConnector.sendRequest({
        agentId: 'predictive_scheduling',
        taskType: 'schedule_prediction',
        prompt,
        context: {
          sportType,
          season,
          historicalPatterns: patterns,
          parameters
        },
        parameters: {
          temperature: 0.2,
          max_tokens: 4000
        }
      });
      
      if (response.status !== 'success' || !response.content) {
        throw new Error(`Failed to generate prediction: ${response.error || 'Unknown error'}`);
      }
      
      // Parse the prediction from the response
      let predictionData;
      try {
        // Extract JSON from the response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        predictionData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        
        if (!predictionData) {
          throw new Error('Failed to parse prediction data');
        }
      } catch (parseError) {
        logger.error(`Failed to parse prediction: ${parseError.message}`);
        
        // Attempt to salvage by using regex to extract schedule items
        const datePattern = /\d{4}-\d{2}-\d{2}/g;
        const teamPattern = /"(home|away)Team"\s*:\s*"([^"]+)"/g;
        
        const dates = response.content.match(datePattern) || [];
        const teamMatches = [...response.content.matchAll(teamPattern)];
        
        if (dates.length > 0) {
          predictionData = {
            scheduleProposal: dates.map((date, i) => ({
              date,
              homeTeam: teamMatches[i*2]?.[2] || 'Unknown',
              awayTeam: teamMatches[i*2+1]?.[2] || 'Unknown',
              venue: 'TBD',
              startTime: '14:00'
            })),
            patternMatchRate: 0.5,
            schedulingNotes: ['Generated with partial data parsing']
          };
        } else {
          predictionData = {
            scheduleProposal: [],
            patternMatchRate: 0,
            schedulingNotes: ['Failed to parse prediction']
          };
        }
      }
      
      // Calculate confidence score
      const confidence = this.calculateConfidence(predictionData, historicalData);
      
      // Create result
      const result = {
        success: confidence >= this.confidenceThreshold,
        sportType,
        season,
        confidence,
        predictions: [{
          schedule: predictionData.scheduleProposal,
          confidence,
          patternMatchRate: predictionData.patternMatchRate || 0,
          notes: predictionData.schedulingNotes || []
        }],
        modelUsed: response.model || modelToUse,
        historicalDataPoints: historicalData.length,
        timestamp: new Date().toISOString()
      };
      
      // Cache the result
      this.predictionCache.set(cacheKey, result);
      
      // Store prediction in memory for future learning
      await this.memoryAgent.storeMemory({
        content: JSON.stringify({
          predictionData,
          parameters,
          confidence,
          timestamp: new Date().toISOString()
        }),
        agentId: 'predictive_scheduling',
        tags: ['prediction', sportType, season],
        importance: confidence > 0.8 ? 'high' : 'medium'
      });
      
      logger.info(`Generated prediction for ${sportType} (${season}) with confidence: ${confidence}`);
      return result;
    } catch (error) {
      logger.error(`Failed to predict optimal schedule: ${error.message}`);
      return {
        success: false,
        error: error.message,
        predictions: []
      };
    }
  }
  
  /**
   * Submit feedback about a prediction to improve future predictions
   * 
   * @param {string} predictionId - ID of the prediction
   * @param {object} feedback - Feedback data
   * @returns {Promise<boolean>} Whether feedback was processed successfully
   */
  async submitPredictionFeedback(predictionId, feedback) {
    if (!this.enabled) {
      logger.warn('Predictive Scheduling Agent is disabled');
      return false;
    }
    
    try {
      // Store feedback in memory
      await this.memoryAgent.storeMemory({
        content: JSON.stringify({
          predictionId,
          feedback,
          timestamp: new Date().toISOString()
        }),
        agentId: 'predictive_scheduling',
        tags: ['feedback', feedback.sportType || 'unknown'],
        importance: 'high'
      });
      
      logger.info(`Stored feedback for prediction ${predictionId}`);
      
      // Clear cache for this sport type to force fresh predictions
      if (feedback.sportType) {
        for (const [key, value] of this.predictionCache.entries()) {
          if (key.startsWith(feedback.sportType)) {
            this.predictionCache.delete(key);
          }
        }
        
        // Clear sport patterns to force relearning
        if (this.sportPatterns.has(feedback.sportType)) {
          this.sportPatterns.delete(feedback.sportType);
        }
      }
      
      return true;
    } catch (error) {
      logger.error(`Failed to process prediction feedback: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Analyze the effectiveness of past predictions
   * 
   * @returns {Promise<object>} Analysis results
   */
  async analyzePredictionEffectiveness() {
    if (!this.enabled) {
      logger.warn('Predictive Scheduling Agent is disabled');
      return { success: false, error: 'Agent is disabled' };
    }
    
    try {
      // Retrieve prediction memories
      const predictions = await this.memoryAgent.findRelevantMemories({
        query: 'schedule prediction',
        tags: ['prediction'],
        limit: 50,
        threshold: 0.6
      });
      
      // Retrieve feedback memories
      const feedbacks = await this.memoryAgent.findRelevantMemories({
        query: 'prediction feedback',
        tags: ['feedback'],
        limit: 50,
        threshold: 0.6
      });
      
      if (predictions.length === 0) {
        return {
          success: false,
          error: 'No predictions found',
          analysis: {}
        };
      }
      
      // Parse memory contents
      const parsedPredictions = predictions.map(memory => {
        try {
          return JSON.parse(memory.content);
        } catch (error) {
          logger.warn(`Failed to parse prediction content: ${error.message}`);
          return null;
        }
      }).filter(Boolean);
      
      const parsedFeedbacks = feedbacks.map(memory => {
        try {
          return JSON.parse(memory.content);
        } catch (error) {
          logger.warn(`Failed to parse feedback content: ${error.message}`);
          return null;
        }
      }).filter(Boolean);
      
      // Match feedbacks to predictions
      const matchedData = parsedPredictions.map(prediction => {
        const matchingFeedback = parsedFeedbacks.find(feedback => 
          feedback.predictionId === prediction.predictionId
        );
        
        return {
          prediction,
          feedback: matchingFeedback || null
        };
      });
      
      // Calculate effectiveness metrics
      const withFeedback = matchedData.filter(item => item.feedback !== null);
      const positiveRatings = withFeedback.filter(item => 
        item.feedback.rating >= 4 || 
        item.feedback.success === true
      );
      
      const effectivenessRate = withFeedback.length > 0 ?
        positiveRatings.length / withFeedback.length : 0;
      
      // Group by sport type
      const bySportType = {};
      matchedData.forEach(item => {
        const sportType = item.prediction.parameters?.sportType || 'unknown';
        if (!bySportType[sportType]) {
          bySportType[sportType] = {
            total: 0,
            withFeedback: 0,
            positiveRatings: 0,
            averageConfidence: 0
          };
        }
        
        bySportType[sportType].total++;
        bySportType[sportType].averageConfidence += (item.prediction.confidence || 0);
        
        if (item.feedback) {
          byAnalysis[sportType].withFeedback++;
          if (item.feedback.rating >= 4 || item.feedback.success === true) {
            byAnalysis[sportType].positiveRatings++;
          }
        }
      });
      
      // Calculate averages
      Object.keys(byAnalysis).forEach(key => {
        byAnalysis[key].averageConfidence /= byAnalysis[key].total || 1;
        byAnalysis[key].effectivenessRate = byAnalysis[key].withFeedback > 0 ?
          byAnalysis[key].positiveRatings / byAnalysis[key].withFeedback : 0;
      });
      
      // Create analysis result
      const result = {
        success: true,
        analysis: {
          totalPredictions: parsedPredictions.length,
          predictionsWithFeedback: withFeedback.length,
          positiveRatings: positiveRatings.length,
          effectivenessRate,
          byAnalysis,
          lastAnalysisDate: new Date().toISOString()
        }
      };
      
      // Store analysis in memory
      await this.memoryAgent.storeMemory({
        content: JSON.stringify(result),
        agentId: 'predictive_scheduling',
        tags: ['analysis', 'meta'],
        importance: 'medium'
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to analyze prediction effectiveness: ${error.message}`);
      return {
        success: false,
        error: error.message,
        analysis: {}
      };
    }
  }
}

module.exports = PredictiveSchedulingAgent;
