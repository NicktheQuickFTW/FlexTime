/**
 * COMPASS Performance Component
 * 
 * Analyzes and scores athletic programs based on on-court/field performance metrics
 * including win-loss records, conference standings, tournament success, and
 * advanced statistical indicators specific to each sport.
 */

const logger = require('../../utils/logger');

class PerformanceComponent {
  /**
   * Create a new Performance Component
   * @param {Object} db - Database connection
   * @param {Object} options - Configuration options
   */
  constructor(db, options = {}) {
    this.db = db;
    this.options = {
      recentSeasonWeight: 0.6,        // Weight given to most recent season
      previousSeasonWeight: 0.3,       // Weight given to previous season
      seasonBeforeLastWeight: 0.1,     // Weight given to season before last
      winLossWeight: 0.4,              // Weight for win-loss record
      tournamentSuccessWeight: 0.3,    // Weight for tournament/postseason success
      conferenceStandingWeight: 0.2,   // Weight for conference standing
      advancedStatsWeight: 0.1,        // Weight for advanced statistical metrics
      ...options
    };
    
    this.cachedProgramData = new Map();
    this.cachedScores = new Map();
    this.sportSpecificMetrics = this._initializeSportMetrics();
    
    logger.info('COMPASS Performance Component initialized');
  }
  
  /**
   * Initialize sport-specific metrics configuration
   * @returns {Object} Sport metrics configuration
   * @private
   */
  _initializeSportMetrics() {
    return {
      'Football': {
        advancedStats: ['offensiveEfficiency', 'defensiveEfficiency', 'specialTeamsEfficiency'],
        tournamentTiers: {
          'CFP National Championship': 100,
          'CFP Semifinal': 90,
          'New Year\'s Six Bowl': 80,
          'Bowl Game': 60
        }
      },
      'Basketball': {
        advancedStats: ['offensiveEfficiency', 'defensiveEfficiency', 'tempo', 'strengthOfSchedule'],
        tournamentTiers: {
          'National Championship': 100,
          'Final Four': 95,
          'Elite Eight': 85,
          'Sweet Sixteen': 75,
          'Round of 32': 65,
          'NCAA Tournament': 60,
          'NIT': 40
        }
      },
      'Baseball': {
        advancedStats: ['battingAverage', 'era', 'fieldingPercentage'],
        tournamentTiers: {
          'College World Series Champion': 100,
          'College World Series': 90,
          'Super Regional': 80,
          'Regional': 70,
          'NCAA Tournament': 60
        }
      },
      'Softball': {
        advancedStats: ['battingAverage', 'era', 'fieldingPercentage'],
        tournamentTiers: {
          'Women\'s College World Series Champion': 100,
          'Women\'s College World Series': 90,
          'Super Regional': 80,
          'Regional': 70,
          'NCAA Tournament': 60
        }
      },
      'Volleyball': {
        advancedStats: ['attackEfficiency', 'blockingEfficiency', 'serviceEfficiency'],
        tournamentTiers: {
          'National Championship': 100,
          'Final Four': 90,
          'Elite Eight': 80,
          'Sweet Sixteen': 70,
          'NCAA Tournament': 60
        }
      },
      'Soccer': {
        advancedStats: ['goalsPerGame', 'goalDifferential', 'shotsOnGoal'],
        tournamentTiers: {
          'National Championship': 100,
          'Final Four': 90,
          'Elite Eight': 80,
          'Sweet Sixteen': 70,
          'NCAA Tournament': 60
        }
      },
      // Default for other sports
      'default': {
        advancedStats: ['winPercentage'],
        tournamentTiers: {
          'National Championship': 100,
          'Final Four/Semifinal': 90,
          'Tournament Qualification': 70
        }
      }
    };
  }
  
  /**
   * Get all programs in the database
   * @returns {Promise<Array>} Array of program objects
   */
  async getAllPrograms() {
    try {
      // If we've already cached the programs, return them
      if (this.cachedProgramData.size > 0) {
        return Array.from(this.cachedProgramData.values());
      }
      
      // Get all teams with related data
      const teams = await this.db.Team.findAll({
        include: [
          { model: this.db.Institution, as: 'institution' },
          { model: this.db.Sport, as: 'sport' }
        ]
      });
      
      // Transform into program objects and cache
      for (const team of teams) {
        const program = {
          id: team.team_id || team.id,
          name: team.institution ? team.institution.name : team.name,
          sport: team.sport ? team.sport.name : 'Unknown',
          conference: team.conference,
          division: team.division
        };
        
        this.cachedProgramData.set(program.id, program);
      }
      
      return Array.from(this.cachedProgramData.values());
    } catch (error) {
      logger.error(`Error getting all programs: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get a single program by ID
   * @param {string} programId - Program ID
   * @returns {Promise<Object>} Program object
   */
  async getProgram(programId) {
    // Try from cache first
    if (this.cachedProgramData.has(programId)) {
      return this.cachedProgramData.get(programId);
    }
    
    try {
      // Get team with related data
      const team = await this.db.Team.findByPk(programId, {
        include: [
          { model: this.db.Institution, as: 'institution' },
          { model: this.db.Sport, as: 'sport' }
        ]
      });
      
      if (!team) {
        throw new Error(`Program not found: ${programId}`);
      }
      
      // Transform into program object and cache
      const program = {
        id: team.team_id || team.id,
        name: team.institution ? team.institution.name : team.name,
        sport: team.sport ? team.sport.name : 'Unknown',
        conference: team.conference,
        division: team.division
      };
      
      this.cachedProgramData.set(programId, program);
      
      return program;
    } catch (error) {
      logger.error(`Error getting program ${programId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get performance score for a program
   * @param {string} programId - Program ID
   * @returns {Promise<number>} Performance score (0-1)
   */
  async getScore(programId) {
    // Check cache first
    if (this.cachedScores.has(programId)) {
      return this.cachedScores.get(programId);
    }
    
    try {
      const program = await this.getProgram(programId);
      
      // Get performance metrics for the program
      const metrics = await this._getProgramPerformanceMetrics(programId, program.sport);
      
      // Calculate weighted score
      const score = this._calculatePerformanceScore(metrics);
      
      // Cache the score
      this.cachedScores.set(programId, score);
      
      return score;
    } catch (error) {
      logger.error(`Error calculating performance score for ${programId}: ${error.message}`);
      // Return default score on error
      return 0.5;
    }
  }
  
  /**
   * Get detailed performance metrics for a program
   * @param {string} programId - Program ID
   * @param {string} sport - Sport name
   * @returns {Promise<Object>} Performance metrics
   * @private
   */
  async _getProgramPerformanceMetrics(programId, sport) {
    try {
      // In a real implementation, this would query historical performance data
      // For this prototype, we'll generate realistic but synthetic data
      
      // Get the sport-specific configuration or default
      const sportConfig = this.sportSpecificMetrics[sport] || this.sportSpecificMetrics.default;
      
      // For the prototype, generate synthetic data based on program ID
      // This ensures consistent results for the same program
      const idHash = this._simpleHash(programId);
      
      // Generate season metrics for recent seasons (synthetic data)
      const currentSeason = {
        season: '2024-2025',
        winLoss: {
          wins: 15 + (idHash % 15),
          losses: 30 - (idHash % 15),
          winPercentage: (15 + (idHash % 15)) / 30
        },
        conferenceStanding: 1 + (idHash % 12),
        tournamentResult: this._assignTournamentResult(idHash, sportConfig.tournamentTiers),
        advancedStats: this._generateAdvancedStats(sportConfig.advancedStats, idHash)
      };
      
      const previousSeason = {
        season: '2023-2024',
        winLoss: {
          wins: 14 + ((idHash * 2) % 16),
          losses: 30 - (14 + ((idHash * 2) % 16)),
          winPercentage: (14 + ((idHash * 2) % 16)) / 30
        },
        conferenceStanding: 1 + ((idHash * 3) % 12),
        tournamentResult: this._assignTournamentResult((idHash * 3) % 100, sportConfig.tournamentTiers),
        advancedStats: this._generateAdvancedStats(sportConfig.advancedStats, (idHash * 2) % 100)
      };
      
      const seasonBeforeLast = {
        season: '2022-2023',
        winLoss: {
          wins: 13 + ((idHash * 3) % 17),
          losses: 30 - (13 + ((idHash * 3) % 17)),
          winPercentage: (13 + ((idHash * 3) % 17)) / 30
        },
        conferenceStanding: 1 + ((idHash * 5) % 12),
        tournamentResult: this._assignTournamentResult((idHash * 5) % 100, sportConfig.tournamentTiers),
        advancedStats: this._generateAdvancedStats(sportConfig.advancedStats, (idHash * 3) % 100)
      };
      
      return {
        programId,
        sport,
        currentSeason,
        previousSeason,
        seasonBeforeLast
      };
    } catch (error) {
      logger.error(`Error getting performance metrics for ${programId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Calculate performance score from metrics
   * @param {Object} metrics - Performance metrics
   * @returns {number} Performance score (0-1)
   * @private
   */
  _calculatePerformanceScore(metrics) {
    try {
      // Calculate individual season scores
      const currentSeasonScore = this._calculateSeasonScore(metrics.currentSeason);
      const previousSeasonScore = this._calculateSeasonScore(metrics.previousSeason);
      const seasonBeforeLastScore = this._calculateSeasonScore(metrics.seasonBeforeLast);
      
      // Apply temporal weights
      const weightedScore = 
        (currentSeasonScore * this.options.recentSeasonWeight) +
        (previousSeasonScore * this.options.previousSeasonWeight) +
        (seasonBeforeLastScore * this.options.seasonBeforeLastWeight);
      
      return weightedScore;
    } catch (error) {
      logger.error(`Error calculating performance score: ${error.message}`);
      return 0.5; // Default score on error
    }
  }
  
  /**
   * Calculate score for a single season
   * @param {Object} seasonData - Season data
   * @returns {number} Season score (0-1)
   * @private
   */
  _calculateSeasonScore(seasonData) {
    // Win-loss component (0-1)
    const winLossScore = seasonData.winLoss.winPercentage;
    
    // Conference standing component (0-1)
    // Assumes maximum of 14 teams in conference (adjust as needed)
    const maxConferenceTeams = 14;
    const conferenceScore = 1 - ((seasonData.conferenceStanding - 1) / maxConferenceTeams);
    
    // Tournament success component (0-1)
    // This uses the tournament result value from the map (already normalized)
    const tournamentScore = seasonData.tournamentResult.value / 100;
    
    // Advanced stats component (0-1)
    // This is already normalized in the generation function
    const advancedStatsScore = seasonData.advancedStats.averageValue;
    
    // Calculate weighted score
    const seasonScore = 
      (winLossScore * this.options.winLossWeight) +
      (conferenceScore * this.options.conferenceStandingWeight) +
      (tournamentScore * this.options.tournamentSuccessWeight) +
      (advancedStatsScore * this.options.advancedStatsWeight);
    
    return seasonScore;
  }
  
  /**
   * Assign a tournament result based on a hash value
   * @param {number} hash - Hash value
   * @param {Object} tournamentTiers - Tournament tier configuration
   * @returns {Object} Tournament result
   * @private
   */
  _assignTournamentResult(hash, tournamentTiers) {
    // Convert the tournament tiers to an array
    const tiers = Object.entries(tournamentTiers).map(([name, value]) => ({ name, value }));
    
    // Sort by value (highest first)
    tiers.sort((a, b) => b.value - a.value);
    
    // Determine tier based on hash value (higher hash = better result)
    if (hash > 90) {
      return tiers[0]; // Top tier (e.g., National Championship)
    } else if (hash > 80) {
      return tiers[1] || tiers[0]; // Second tier if exists, otherwise top tier
    } else if (hash > 70) {
      return tiers[2] || tiers[1] || tiers[0]; // Third tier if exists, otherwise second or top
    } else if (hash > 50) {
      // Middle tiers
      const middleIndex = Math.floor(tiers.length / 2);
      return tiers[middleIndex] || tiers[0];
    } else if (hash > 30) {
      // Lower middle tier
      const lowerMiddleIndex = Math.floor(tiers.length * 0.75);
      return tiers[lowerMiddleIndex] || tiers[tiers.length - 1];
    } else {
      // Did not qualify for tournament
      return { name: 'Did Not Qualify', value: 0 };
    }
  }
  
  /**
   * Generate advanced stats based on sport configuration
   * @param {Array} statsTypes - Types of advanced stats to generate
   * @param {number} hash - Hash value for consistency
   * @returns {Object} Advanced stats values
   * @private
   */
  _generateAdvancedStats(statsTypes, hash) {
    const stats = {};
    let totalValue = 0;
    
    for (const statType of statsTypes) {
      // Generate a value between 0.3 and 0.95 based on hash and stat type
      const statHash = this._simpleHash(`${hash}-${statType}`);
      const value = 0.3 + (statHash % 65) / 100;
      stats[statType] = value;
      totalValue += value;
    }
    
    // Add average value for convenience
    stats.averageValue = totalValue / statsTypes.length;
    
    return stats;
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
    this.cachedProgramData.clear();
    this.cachedScores.clear();
    logger.info('Performance component cache cleared');
  }
}

module.exports = PerformanceComponent;