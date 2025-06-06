/**
 * FlexTime League Adapter
 * 
 * Inspired by Fastbreak AI's approach, this module provides league-specific
 * adaptability for the FlexTime scheduling system, allowing algorithms to
 * automatically adjust to different sports and conference requirements.
 */

const logger = require('../scripts/logger");
const IntelligenceEngineClient = require('../clients/intelligence-engine-client');

/**
 * League Adapter for sport and conference-specific adaptations
 */
class LeagueAdapter {
  /**
   * Create a new League Adapter
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      enabled: true,
      ...config
    };
    
    // Initialize Intelligence Engine client if provided
    this.intelligenceEngine = config.intelligenceEngine ? 
      new IntelligenceEngineClient(config.intelligenceEngine) : null;
    
    // Initialize league configurations
    this.leagueConfigs = {};
    
    // Load built-in configurations for Big 12
    this._loadBig12Configurations();
    
    logger.info('League Adapter created');
  }
  
  /**
   * Initialize the adapter
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      // Initialize Intelligence Engine client if available
      if (this.intelligenceEngine) {
        await this.intelligenceEngine.initialize();
        
        // Load league configurations from Intelligence Engine
        await this._loadLeagueConfigurationsFromIE();
      }
      
      logger.info('League Adapter initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize League Adapter: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get league configuration for a specific sport and conference
   * @param {string} sportType - Type of sport
   * @param {string} conferenceId - ID of the conference
   * @returns {Promise<Object>} League configuration
   */
  async getLeagueConfiguration(sportType, conferenceId) {
    logger.debug(`Getting league configuration for ${sportType} in conference ${conferenceId}`);
    
    // Check if we have a cached configuration
    const cacheKey = `${sportType}:${conferenceId}`;
    if (this.leagueConfigs[cacheKey]) {
      return this.leagueConfigs[cacheKey];
    }
    
    // Try to get from Intelligence Engine if available
    if (this.intelligenceEngine && this.intelligenceEngine.enabled) {
      try {
        const ieConfig = await this.intelligenceEngine.getLeagueConfiguration(sportType, conferenceId);
        
        if (ieConfig.success) {
          // Cache the configuration
          this.leagueConfigs[cacheKey] = ieConfig.configuration;
          return ieConfig.configuration;
        }
      } catch (error) {
        logger.warn(`Failed to get league configuration from Intelligence Engine: ${error.message}`);
        // Fall back to built-in configurations
      }
    }
    
    // Fall back to built-in configurations
    return this._getBuiltInConfiguration(sportType, conferenceId);
  }
  
  /**
   * Adapt constraints for a specific sport and conference
   * @param {Array} constraints - Original constraints
   * @param {string} sportType - Type of sport
   * @param {string} conferenceId - ID of the conference
   * @returns {Promise<Array>} Adapted constraints
   */
  async adaptConstraints(constraints, sportType, conferenceId) {
    // Get league configuration
    const leagueConfig = await this.getLeagueConfiguration(sportType, conferenceId);
    
    if (!leagueConfig) {
      logger.warn(`No league configuration found for ${sportType} in conference ${conferenceId}`);
      return constraints;
    }
    
    // Start with original constraints
    const adaptedConstraints = [...constraints];
    
    // Apply league-specific constraint adaptations
    if (leagueConfig.constraints) {
      leagueConfig.constraints.forEach(leagueConstraint => {
        const existingIndex = adaptedConstraints.findIndex(c => c.type === leagueConstraint.type);
        
        if (existingIndex >= 0) {
          // Merge with existing constraint
          adaptedConstraints[existingIndex] = {
            ...adaptedConstraints[existingIndex],
            weight: leagueConstraint.weight !== undefined ? 
              leagueConstraint.weight : adaptedConstraints[existingIndex].weight,
            parameters: {
              ...adaptedConstraints[existingIndex].parameters,
              ...leagueConstraint.parameters
            }
          };
        } else {
          // Add new constraint
          adaptedConstraints.push(leagueConstraint);
        }
      });
    }
    
    logger.info(`Adapted constraints for ${sportType} in conference ${conferenceId}`);
    return adaptedConstraints;
  }
  
  /**
   * Adapt schedule parameters for a specific sport and conference
   * @param {Object} parameters - Original parameters
   * @param {string} sportType - Type of sport
   * @param {string} conferenceId - ID of the conference
   * @returns {Promise<Object>} Adapted parameters
   */
  async adaptParameters(parameters, sportType, conferenceId) {
    // Get league configuration
    const leagueConfig = await this.getLeagueConfiguration(sportType, conferenceId);
    
    if (!leagueConfig) {
      logger.warn(`No league configuration found for ${sportType} in conference ${conferenceId}`);
      return parameters;
    }
    
    // Apply league-specific parameter adaptations
    const adaptedParameters = {
      ...parameters
    };
    
    if (leagueConfig.parameters) {
      // Apply each parameter adaptation
      Object.entries(leagueConfig.parameters).forEach(([key, value]) => {
        // Only override if not explicitly set by user
        if (adaptedParameters[key] === undefined) {
          adaptedParameters[key] = value;
        }
      });
    }
    
    logger.info(`Adapted parameters for ${sportType} in conference ${conferenceId}`);
    return adaptedParameters;
  }
  
  /**
   * Get optimization options for a specific sport and conference
   * @param {string} sportType - Type of sport
   * @param {string} conferenceId - ID of the conference
   * @returns {Promise<Object>} Optimization options
   */
  async getOptimizationOptions(sportType, conferenceId) {
    // Get league configuration
    const leagueConfig = await this.getLeagueConfiguration(sportType, conferenceId);
    
    if (!leagueConfig) {
      logger.warn(`No league configuration found for ${sportType} in conference ${conferenceId}`);
      return {};
    }
    
    return leagueConfig.optimization || {};
  }
  
  /**
   * Register a custom league configuration
   * @param {string} sportType - Type of sport
   * @param {string} conferenceId - ID of the conference
   * @param {Object} configuration - League configuration
   */
  registerLeagueConfiguration(sportType, conferenceId, configuration) {
    const cacheKey = `${sportType}:${conferenceId}`;
    this.leagueConfigs[cacheKey] = configuration;
    
    logger.info(`Registered custom league configuration for ${sportType} in conference ${conferenceId}`);
    
    // Store in Intelligence Engine if available
    if (this.intelligenceEngine && this.intelligenceEngine.enabled) {
      this.intelligenceEngine.storeLeagueConfiguration(sportType, conferenceId, configuration)
        .catch(error => {
          logger.warn(`Failed to store league configuration in Intelligence Engine: ${error.message}`);
        });
    }
  }
  
  /**
   * Load league configurations from Intelligence Engine
   * @returns {Promise<void>}
   * @private
   */
  async _loadLeagueConfigurationsFromIE() {
    if (!this.intelligenceEngine || !this.intelligenceEngine.enabled) {
      return;
    }
    
    try {
      const configs = await this.intelligenceEngine.getAllLeagueConfigurations();
      
      if (configs.success && configs.configurations) {
        // Cache all configurations
        configs.configurations.forEach(config => {
          const cacheKey = `${config.sportType}:${config.conferenceId}`;
          this.leagueConfigs[cacheKey] = config;
        });
        
        logger.info(`Loaded ${configs.configurations.length} league configurations from Intelligence Engine`);
      }
    } catch (error) {
      logger.warn(`Failed to load league configurations from Intelligence Engine: ${error.message}`);
    }
  }
  
  /**
   * Get built-in configuration for a specific sport and conference
   * @param {string} sportType - Type of sport
   * @param {string} conferenceId - ID of the conference
   * @returns {Object} Built-in configuration
   * @private
   */
  _getBuiltInConfiguration(sportType, conferenceId) {
    // Check for Big 12 Conference
    if (conferenceId === 'big12' || conferenceId === 'big-12') {
      const cacheKey = `${sportType}:big12`;
      return this.leagueConfigs[cacheKey] || this._getDefaultConfiguration(sportType);
    }
    
    // Fall back to default configuration for the sport
    return this._getDefaultConfiguration(sportType);
  }
  
  /**
   * Get default configuration for a specific sport
   * @param {string} sportType - Type of sport
   * @returns {Object} Default configuration
   * @private
   */
  _getDefaultConfiguration(sportType) {
    switch (sportType) {
      case 'football':
        return {
          sportType: 'football',
          conferenceId: 'default',
          parameters: {
            gameCount: 9,
            homeAwayBalance: true,
            weekendGames: true
          },
          constraints: [
            {
              type: 'restDays',
              weight: 1.5,
              parameters: {
                minRestDays: 6
              }
            },
            {
              type: 'travelDistance',
              weight: 1.2
            },
            {
              type: 'weekendDistribution',
              weight: 1.5
            }
          ],
          optimization: {
            prioritizeWeekends: true,
            maxConsecutiveAway: 2
          }
        };
        
      case 'basketball':
        return {
          sportType: 'basketball',
          conferenceId: 'default',
          parameters: {
            gameCount: 18,
            homeAwayBalance: true
          },
          constraints: [
            {
              type: 'travelDistance',
              weight: 1.3
            },
            {
              type: 'homeAwayBalance',
              weight: 1.3
            },
            {
              type: 'consecutiveGames',
              weight: 1.2,
              parameters: {
                maxConsecutiveAway: 3
              }
            }
          ],
          optimization: {
            tripCombining: true
          }
        };
        
      case 'volleyball':
        return {
          sportType: 'volleyball',
          conferenceId: 'default',
          parameters: {
            gameCount: 18,
            homeAwayBalance: true
          },
          constraints: [
            {
              type: 'travelDistance',
              weight: 1.2
            },
            {
              type: 'homeAwayBalance',
              weight: 1.2
            },
            {
              type: 'restDays',
              weight: 1.1,
              parameters: {
                minRestDays: 2
              }
            }
          ],
          optimization: {
            weekendFocus: true
          }
        };
        
      default:
        return {
          sportType: sportType,
          conferenceId: 'default',
          parameters: {
            homeAwayBalance: true
          },
          constraints: [
            {
              type: 'travelDistance',
              weight: 1.0
            },
            {
              type: 'homeAwayBalance',
              weight: 1.0
            }
          ],
          optimization: {}
        };
    }
  }
  
  /**
   * Load built-in configurations for Big 12 Conference
   * @private
   */
  _loadBig12Configurations() {
    // Football configuration for Big 12
    this.leagueConfigs['football:big12'] = {
      sportType: 'football',
      conferenceId: 'big12',
      parameters: {
        gameCount: 9,
        homeAwayBalance: true,
        weekendGames: true,
        teamCount: 16
      },
      constraints: [
        {
          type: 'restDays',
          weight: 1.5,
          parameters: {
            minRestDays: 6
          }
        },
        {
          type: 'travelDistance',
          weight: 1.2
        },
        {
          type: 'weekendDistribution',
          weight: 1.5
        },
        {
          type: 'competitiveBalance',
          weight: 1.3,
          parameters: {
            strengthMetric: 'winPercentage'
          }
        }
      ],
      optimization: {
        prioritizeWeekends: true,
        maxConsecutiveAway: 2,
        rivalryGames: true
      }
    };
    
    // Men's Basketball configuration for Big 12
    this.leagueConfigs['basketball:big12'] = {
      sportType: 'basketball',
      conferenceId: 'big12',
      parameters: {
        gameCount: 20,
        homeAwayBalance: true,
        teamCount: 16,
        playTwice: 5,
        playOnce: 10
      },
      constraints: [
        {
          type: 'travelDistance',
          weight: 1.3
        },
        {
          type: 'homeAwayBalance',
          weight: 1.3
        },
        {
          type: 'consecutiveGames',
          weight: 1.2,
          parameters: {
            maxConsecutiveAway: 3
          }
        },
        {
          type: 'competitiveBalance',
          weight: 1.2,
          parameters: {
            strengthMetric: 'rpi'
          }
        }
      ],
      optimization: {
        tripCombining: true,
        rivalryGames: true
      }
    };
    
    // Women's Basketball configuration for Big 12
    this.leagueConfigs['womensBasketball:big12'] = {
      sportType: 'womensBasketball',
      conferenceId: 'big12',
      parameters: {
        gameCount: 18,
        homeAwayBalance: true,
        teamCount: 16,
        playTwice: 3,
        playOnce: 12
      },
      constraints: [
        {
          type: 'travelDistance',
          weight: 1.3
        },
        {
          type: 'homeAwayBalance',
          weight: 1.3
        },
        {
          type: 'consecutiveGames',
          weight: 1.2,
          parameters: {
            maxConsecutiveAway: 3
          }
        }
      ],
      optimization: {
        tripCombining: true,
        rivalryGames: true
      }
    };
    
    // Volleyball configuration for Big 12
    this.leagueConfigs['volleyball:big12'] = {
      sportType: 'volleyball',
      conferenceId: 'big12',
      parameters: {
        gameCount: 18,
        homeAwayBalance: true,
        teamCount: 15,
        playTwice: 4,
        playOnce: 10
      },
      constraints: [
        {
          type: 'travelDistance',
          weight: 1.2
        },
        {
          type: 'homeAwayBalance',
          weight: 1.2
        },
        {
          type: 'restDays',
          weight: 1.1,
          parameters: {
            minRestDays: 2
          }
        }
      ],
      optimization: {
        weekendFocus: true,
        tripCombining: true
      }
    };
    
    logger.info('Loaded built-in configurations for Big 12 Conference');
  }
}

module.exports = LeagueAdapter;
