/**
 * Advanced Scheduling Service for FlexTime
 * 
 * This service provides enhanced scheduling capabilities directly integrated
 * into the FlexTime backend, combining features previously dependent on
 * the external Intelligence Engine.
 */

const logger = require("../../lib/logger");;
const AgentMemoryManager = require('../src/intelligence/memory/agent_memory_manager');
const neonConfig = require('../tools/neon_db_config');

/**
 * Advanced Scheduling Service that integrates historical learning,
 * optimization, and schedule generation capabilities.
 */
class AdvancedSchedulingService {
  /**
   * Create a new Advanced Scheduling Service
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      // Default configuration
      useHistoricalData: true,
      useLocalRecommendations: true,
      useAdaptiveOptimization: true,
      ...config
    };
    
    // Memory management for storing historical schedules
    this.memoryManager = new AgentMemoryManager({
      neonDB: neonConfig,
      ...config.memory
    });
    
    logger.info('Advanced Scheduling Service created', {
      useHistoricalData: this.config.useHistoricalData,
      useAdaptiveOptimization: this.config.useAdaptiveOptimization
    });
  }
  
  /**
   * Initialize the service
   * 
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      // Connect to memory manager
      await this.memoryManager.connect();
      logger.info('Advanced Scheduling Service initialized successfully');
      
      // Pre-load common recommendations
      await this._preloadRecommendations();
      
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Advanced Scheduling Service: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get scheduling recommendations based on sport type and parameters
   * 
   * @param {Object} parameters - Scheduling parameters
   * @returns {Promise<Object>} Recommendations
   */
  async getSchedulingRecommendations(parameters) {
    try {
      const sportType = parameters.sportType || 'unknown';
      logger.info(`Getting scheduling recommendations for ${sportType}`);
      
      // Check if we have historical data to use
      if (this.config.useHistoricalData) {
        try {
          const historicalRecommendations = await this._getHistoricalRecommendations(parameters);
          if (historicalRecommendations) {
            logger.info(`Using historical recommendations for ${sportType}`);
            return {
              success: true,
              sportType,
              ...historicalRecommendations,
              source: 'historical_data'
            };
          }
        } catch (error) {
          logger.warn(`Failed to get historical recommendations: ${error.message}`);
          // Continue with defaults
        }
      }
      
      // Fall back to best practice recommendations
      return this._getDefaultRecommendations(sportType);
    } catch (error) {
      logger.error(`Error getting scheduling recommendations: ${error.message}`);
      
      // Return safe default recommendations
      return this._getDefaultRecommendations(parameters.sportType || 'unknown');
    }
  }
  
  /**
   * Get sport-specific scheduling templates
   * 
   * @param {string} sportType - Type of sport
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Sport-specific templates
   */
  async getSportTemplates(sportType, options = {}) {
    try {
      logger.info(`Getting templates for ${sportType}`);
      
      // Check for custom templates in memory
      if (this.config.useHistoricalData) {
        try {
          const customTemplates = await this.memoryManager.retrieveMemories({
            type: 'template',
            metadata: {
              sportType,
              isCustomTemplate: true
            },
            sort: { timestamp: -1 },
            limit: 5
          });
          
          if (customTemplates && customTemplates.length > 0) {
            logger.info(`Found ${customTemplates.length} custom templates for ${sportType}`);
            
            // Map to template format
            const templates = customTemplates.map(template => ({
              name: template.metadata.name,
              description: template.metadata.description,
              parameters: template.content
            }));
            
            return {
              success: true,
              sportType,
              templates,
              source: 'custom'
            };
          }
        } catch (error) {
          logger.warn(`Failed to get custom templates: ${error.message}`);
          // Continue with defaults
        }
      }
      
      // Return default templates
      return this._getDefaultSportTemplates(sportType);
    } catch (error) {
      logger.error(`Error getting sport templates: ${error.message}`);
      return this._getDefaultSportTemplates(sportType);
    }
  }
  
  /**
   * Store schedule data for future reference
   * 
   * @param {Object} schedule - Schedule to store
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} ID of the stored schedule
   */
  async storeScheduleData(schedule, metadata = {}) {
    try {
      if (!this.config.useHistoricalData) {
        logger.info('Historical data storage is disabled');
        return null;
      }
      
      logger.info(`Storing schedule data for ${schedule.sportType}`);
      
      // Extract key metrics for metadata
      const metrics = {
        gameCount: schedule.games?.length || 0,
        teamCount: schedule.teams?.length || 0,
        score: schedule.metadata?.optimization?.score || 0,
        generationTime: schedule.metadata?.generation?.elapsedTime || 0,
        ...metadata
      };
      
      // Store in memory manager
      const memoryId = await this.memoryManager.storeMemory({
        type: 'schedule',
        content: {
          id: schedule.id,
          sportType: schedule.sportType,
          season: schedule.season,
          algorithms: schedule.metadata?.generation?.algorithms || {},
          constraints: schedule.metadata?.optimization?.constraints || [],
          parameters: schedule.metadata?.generation?.parameters || {},
          metrics
        },
        metadata: {
          sportType: schedule.sportType,
          season: schedule.season,
          conferenceId: schedule.conferenceId,
          score: metrics.score,
          timestamp: new Date().toISOString()
        }
      });
      
      logger.info(`Schedule data stored with ID: ${memoryId}`);
      return memoryId;
    } catch (error) {
      logger.error(`Failed to store schedule data: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Store user feedback for learning and improvement
   * 
   * @param {Object} feedback - User feedback
   * @returns {Promise<string>} ID of the stored feedback
   */
  async storeFeedback(feedback) {
    try {
      if (!this.config.useHistoricalData) {
        logger.info('Historical data storage is disabled');
        return null;
      }
      
      logger.info(`Storing user feedback for schedule ${feedback.scheduleId}`);
      
      // Store in memory manager
      const memoryId = await this.memoryManager.storeMemory({
        type: 'feedback',
        content: feedback,
        metadata: {
          scheduleId: feedback.scheduleId,
          rating: feedback.rating,
          sportType: feedback.sportType,
          timestamp: new Date().toISOString()
        }
      });
      
      logger.info(`Feedback stored with ID: ${memoryId}`);
      return memoryId;
    } catch (error) {
      logger.error(`Failed to store feedback: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Get learning insights from historical data
   * 
   * @param {Object} parameters - Query parameters
   * @returns {Promise<Object>} Learning insights
   */
  async getLearningInsights(parameters = {}) {
    try {
      if (!this.config.useHistoricalData) {
        return {
          success: false,
          error: 'Historical data is disabled'
        };
      }
      
      const sportType = parameters.sportType;
      logger.info(`Getting learning insights for ${sportType || 'all sports'}`);
      
      // Prepare query
      const query = {
        type: 'schedule',
        metadata: {}
      };
      
      if (sportType) {
        query.metadata.sportType = sportType;
      }
      
      // Get historical schedules
      const schedules = await this.memoryManager.retrieveMemories(query);
      
      if (!schedules || schedules.length === 0) {
        return {
          success: true,
          insights: [],
          message: 'No historical data available'
        };
      }
      
      // Analyze historical data
      const insights = this._analyzeHistoricalData(schedules, parameters);
      
      return {
        success: true,
        insights,
        count: schedules.length,
        sportTypes: [...new Set(schedules.map(s => s.metadata.sportType))]
      };
    } catch (error) {
      logger.error(`Error getting learning insights: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Optimize an existing schedule using best practices
   * 
   * @param {Object} schedule - Schedule to optimize
   * @param {Array} constraints - Constraints to apply
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Optimized schedule
   */
  async optimizeSchedule(schedule, constraints = [], options = {}) {
    try {
      logger.info(`Optimizing schedule for ${schedule.sportType}`);
      
      // Load the appropriate optimizer based on sport type
      const { SimulatedAnnealingOptimizer } = require('../algorithms/schedule-optimizer');
      
      // Create optimizer instance
      const optimizer = new SimulatedAnnealingOptimizer({
        iterations: options.iterations || 1000,
        coolingRate: options.coolingRate || 0.95,
        initialTemperature: options.initialTemperature || 100
      });
      
      // Apply sport-specific optimizations
      const sportType = schedule.sportType || 'unknown';
      const sportSpecificOptions = this._getSportSpecificOptimizations(sportType);
      
      // Merge constraints
      const mergedConstraints = this._mergeConstraints(
        constraints,
        sportSpecificOptions.constraints || []
      );
      
      // Optimize the schedule
      const optimizedSchedule = await optimizer.optimize(
        schedule,
        mergedConstraints,
        {
          ...sportSpecificOptions,
          ...options
        }
      );
      
      // Store optimization for learning if historical data is enabled
      if (this.config.useHistoricalData) {
        this.storeScheduleData(optimizedSchedule, {
          optimizationType: 'post_generation',
          originalId: schedule.id
        });
      }
      
      return optimizedSchedule;
    } catch (error) {
      logger.error(`Failed to optimize schedule: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Shutdown the service
   * 
   * @returns {Promise<boolean>} Success status
   */
  async shutdown() {
    try {
      logger.info('Shutting down Advanced Scheduling Service');
      await this.memoryManager.disconnect();
      return true;
    } catch (error) {
      logger.error(`Error shutting down Advanced Scheduling Service: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Preload common recommendations
   * 
   * @private
   */
  async _preloadRecommendations() {
    // This method preloads common recommendations for faster access
    this.recommendations = {
      football: this._getDefaultRecommendations('football'),
      basketball: this._getDefaultRecommendations('basketball'),
      baseball: this._getDefaultRecommendations('baseball'),
      volleyball: this._getDefaultRecommendations('volleyball')
    };
    
    logger.debug('Preloaded common recommendations');
  }
  
  /**
   * Get historical recommendations from memory
   * 
   * @param {Object} parameters - Scheduling parameters
   * @returns {Promise<Object>} Historical recommendations
   * @private
   */
  async _getHistoricalRecommendations(parameters) {
    const sportType = parameters.sportType || 'unknown';
    
    // Retrieve past schedule data for this sport
    const schedules = await this.memoryManager.retrieveMemories({
      type: 'schedule',
      metadata: {
        sportType
      },
      sort: { 'metadata.score': -1 }, // Sort by score descending
      limit: 5
    });
    
    if (!schedules || schedules.length === 0) {
      return null;
    }
    
    // Use the best performing schedule as a model
    const bestSchedule = schedules[0];
    
    return {
      algorithms: bestSchedule.content.algorithms,
      constraints: bestSchedule.content.constraints,
      parameters: bestSchedule.content.parameters
    };
  }
  
  /**
   * Get default recommendations for a sport type
   * 
   * @param {string} sportType - Type of sport
   * @returns {Object} Default recommendations
   * @private
   */
  _getDefaultRecommendations(sportType) {
    // Default recommendations
    const defaultRecommendations = {
      success: true,
      sportType,
      algorithms: {
        generator: 'RoundRobinGenerator',
        optimizer: 'SimulatedAnnealingOptimizer'
      },
      constraints: [
        {
          type: 'HomeAwayBalance',
          weight: 1.0,
          parameters: {}
        },
        {
          type: 'MinimumRestDays',
          weight: 0.8,
          parameters: { minDays: 1 }
        }
      ],
      parameters: {
        optimizationIterations: 1000,
        coolingRate: 0.95,
        initialTemperature: 100
      },
      source: 'defaults'
    };
    
    // Sport-specific recommendations
    switch (sportType) {
      case 'football':
        defaultRecommendations.constraints.push({
          type: 'WeekendGamesPreference',
          weight: 0.9,
          parameters: {}
        });
        defaultRecommendations.algorithms.generator = 'PartialRoundRobinGenerator';
        break;
        
      case 'basketball':
        defaultRecommendations.constraints.push({
          type: 'AvoidBackToBack',
          weight: 0.7,
          parameters: {}
        });
        break;
        
      case 'baseball':
      case 'softball':
        defaultRecommendations.constraints.push({
          type: 'SeriesPreference',
          weight: 0.8,
          parameters: { seriesLength: 3 }
        });
        break;
        
      case 'volleyball':
      case 'soccer':
        defaultRecommendations.constraints.push({
          type: 'TravelDistanceMinimization',
          weight: 0.8,
          parameters: {}
        });
        break;
    }
    
    return defaultRecommendations;
  }
  
  /**
   * Get default sport templates
   * 
   * @param {string} sportType - Type of sport
   * @returns {Object} Default templates
   * @private
   */
  _getDefaultSportTemplates(sportType) {
    // Default templates
    return {
      success: true,
      sportType,
      templates: [
        {
          name: 'Standard Season',
          description: `Standard ${sportType} season template`,
          parameters: {
            gameCount: sportType === 'football' ? 12 : 30,
            homeAwayBalance: true,
            weekendPreference: sportType === 'football'
          }
        },
        {
          name: 'Conference Play',
          description: `${sportType} conference play template`,
          parameters: {
            gameCount: sportType === 'football' ? 9 : 18,
            homeAwayBalance: true,
            divisionalPlay: true
          }
        },
        {
          name: 'Tournament Format',
          description: `${sportType} tournament template`,
          parameters: {
            gameCount: sportType === 'football' ? 4 : 10,
            singleElimination: true,
            neutralSites: true
          }
        }
      ],
      source: 'defaults'
    };
  }
  
  /**
   * Get sport-specific optimizations
   * 
   * @param {string} sportType - Type of sport
   * @returns {Object} Optimization options
   * @private
   */
  _getSportSpecificOptimizations(sportType) {
    // Provide sport-specific optimization settings
    switch (sportType) {
      case 'football':
        return {
          constraints: [
            {
              type: 'WeekendGamesPreference',
              weight: 0.9,
              parameters: {}
            },
            {
              type: 'MinimumRestDays',
              weight: 1.2,
              parameters: { minDays: 5 }
            }
          ],
          parameters: {
            coolingRate: 0.96,
            initialTemperature: 120
          }
        };
        
      case 'basketball':
        return {
          constraints: [
            {
              type: 'AvoidBackToBack',
              weight: 0.9,
              parameters: {}
            },
            {
              type: 'TravelDistanceMinimization',
              weight: 0.8,
              parameters: {}
            }
          ],
          parameters: {
            coolingRate: 0.94,
            initialTemperature: 100
          }
        };
        
      case 'baseball':
      case 'softball':
        return {
          constraints: [
            {
              type: 'SeriesPreference',
              weight: 1.0,
              parameters: { seriesLength: 3 }
            },
            {
              type: 'TravelDistanceMinimization',
              weight: 0.9,
              parameters: {}
            }
          ],
          parameters: {
            coolingRate: 0.95,
            initialTemperature: 90
          }
        };
        
      default:
        return {
          constraints: [
            {
              type: 'HomeAwayBalance',
              weight: 1.0,
              parameters: {}
            }
          ],
          parameters: {
            coolingRate: 0.95,
            initialTemperature: 100
          }
        };
    }
  }
  
  /**
   * Merge constraints from different sources
   * 
   * @param {Array} userConstraints - User-defined constraints
   * @param {Array} recommendedConstraints - Recommended constraints
   * @returns {Array} Merged constraints
   * @private
   */
  _mergeConstraints(userConstraints, recommendedConstraints) {
    // Start with user constraints
    const mergedConstraints = [...userConstraints];
    
    // Add recommended constraints that don't conflict
    recommendedConstraints.forEach(recommended => {
      const existingIndex = mergedConstraints.findIndex(c => c.type === recommended.type);
      
      if (existingIndex >= 0) {
        // User constraint takes precedence, but we can merge parameters
        mergedConstraints[existingIndex].parameters = {
          ...recommended.parameters,
          ...mergedConstraints[existingIndex].parameters
        };
      } else {
        // Add the recommended constraint
        mergedConstraints.push(recommended);
      }
    });
    
    return mergedConstraints;
  }
  
  /**
   * Analyze historical scheduling data
   * 
   * @param {Array} schedules - Historical schedules
   * @param {Object} parameters - Analysis parameters
   * @returns {Array} Insights derived from analysis
   * @private
   */
  _analyzeHistoricalData(schedules, parameters) {
    // Group schedules by sport type
    const sportGroups = schedules.reduce((groups, schedule) => {
      const sportType = schedule.metadata.sportType;
      if (!groups[sportType]) {
        groups[sportType] = [];
      }
      groups[sportType].push(schedule);
      return groups;
    }, {});
    
    // Generate insights for each sport
    const insights = [];
    
    for (const [sportType, sportSchedules] of Object.entries(sportGroups)) {
      // Skip if we're filtering by a different sport type
      if (parameters.sportType && parameters.sportType !== sportType) {
        continue;
      }
      
      // Sort by score
      sportSchedules.sort((a, b) => 
        (b.metadata.score || 0) - (a.metadata.score || 0)
      );
      
      // Find the best performing schedule
      const bestSchedule = sportSchedules[0];
      
      // Find what makes the best schedule successful
      const bestAlgorithms = bestSchedule.content.algorithms || {};
      const bestConstraints = bestSchedule.content.constraints || [];
      
      // Look for patterns in constraints used by successful schedules
      const topSchedules = sportSchedules.slice(0, Math.min(5, sportSchedules.length));
      const constraintCounts = {};
      
      // Count constraint usage in top schedules
      topSchedules.forEach(schedule => {
        (schedule.content.constraints || []).forEach(constraint => {
          if (!constraintCounts[constraint.type]) {
            constraintCounts[constraint.type] = 0;
          }
          constraintCounts[constraint.type]++;
        });
      });
      
      // Find most common constraints
      const commonConstraints = Object.entries(constraintCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      
      // Add insight for this sport
      insights.push({
        sportType,
        scheduleCount: sportSchedules.length,
        bestAlgorithms,
        bestScore: bestSchedule.metadata.score || 0,
        commonConstraints: commonConstraints.map(c => c.type),
        recommendedApproach: {
          generator: bestAlgorithms.generator || 'RoundRobinGenerator',
          optimizer: bestAlgorithms.optimizer || 'SimulatedAnnealingOptimizer',
          keyConstraints: bestConstraints.map(c => c.type)
        }
      });
    }
    
    return insights;
  }
}

module.exports = AdvancedSchedulingService;