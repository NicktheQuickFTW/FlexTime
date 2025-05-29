/**
 * COMPASS Core System - Comprehensive Program Assessment
 * 
 * A revolutionary AI-powered intelligence system for collegiate athletics
 * that transforms scheduling from an art to a science.
 */

const logger = require('../../utils/logger');

class COMPASSCore {
  /**
   * Create a new COMPASS Core instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      refreshFrequency: 24 * 60 * 60 * 1000, // 24 hours by default
      weightConfig: {
        performance: 0.25,
        resources: 0.20,
        recruiting: 0.15,
        prestige: 0.15,
        talent: 0.15,
        infrastructure: 0.10
      },
      ...options
    };

    this.components = {
      performance: null,
      resources: null,
      recruiting: null,
      prestige: null,
      talent: null,
      infrastructure: null
    };

    this.scores = new Map();
    this.rankings = new Map();
    this.lastUpdated = null;
    this.updatePromise = null;

    logger.info('COMPASS Core system initialized');
  }

  /**
   * Register a component to the COMPASS system
   * @param {string} componentName - Name of the component
   * @param {Object} component - Component instance
   */
  registerComponent(componentName, component) {
    if (!this.components.hasOwnProperty(componentName)) {
      throw new Error(`Unknown COMPASS component: ${componentName}`);
    }

    this.components[componentName] = component;
    logger.info(`Registered COMPASS component: ${componentName}`);
  }

  /**
   * Get all registered components
   * @returns {Object} Map of component name to component instance
   */
  getComponents() {
    return this.components;
  }

  /**
   * Check if all essential components are registered
   * @returns {boolean} True if essential components are registered
   */
  hasEssentialComponents() {
    // At minimum we need performance and resources
    return this.components.performance && this.components.resources;
  }

  /**
   * Update COMPASS scores for all programs
   * @param {boolean} force - Force update even if recently updated
   * @returns {Promise<Map>} Updated scores
   */
  async updateScores(force = false) {
    // If update is already in progress, return the existing promise
    if (this.updatePromise) {
      return this.updatePromise;
    }

    // Check if update is needed
    const now = Date.now();
    if (
      !force && 
      this.lastUpdated && 
      (now - this.lastUpdated) < this.options.refreshFrequency
    ) {
      logger.info('Using cached COMPASS scores');
      return this.scores;
    }

    // Start update process
    this.updatePromise = this._performUpdate();
    
    try {
      await this.updatePromise;
      this.lastUpdated = Date.now();
      logger.info('COMPASS scores updated successfully');
    } catch (error) {
      logger.error(`Error updating COMPASS scores: ${error.message}`);
      throw error;
    } finally {
      this.updatePromise = null;
    }

    return this.scores;
  }

  /**
   * Perform the actual update process
   * @returns {Promise<Map>} Updated scores
   * @private
   */
  async _performUpdate() {
    if (!this.hasEssentialComponents()) {
      throw new Error('Not all essential COMPASS components are registered');
    }

    // Get all programs from the performance component
    const programs = await this.components.performance.getAllPrograms();
    
    // Process each program
    for (const program of programs) {
      const scores = {};
      const weights = this.options.weightConfig;
      
      // Get scores from each component
      for (const [componentName, component] of Object.entries(this.components)) {
        if (component) {
          try {
            const componentScore = await component.getScore(program.id);
            scores[componentName] = componentScore;
          } catch (error) {
            logger.warn(`Error getting ${componentName} score for program ${program.id}: ${error.message}`);
            scores[componentName] = 0;
          }
        } else {
          scores[componentName] = 0;
        }
      }
      
      // Calculate weighted score
      let totalScore = 0;
      let weightSum = 0;
      
      for (const [componentName, score] of Object.entries(scores)) {
        if (score > 0 && weights[componentName] > 0) {
          totalScore += score * weights[componentName];
          weightSum += weights[componentName];
        }
      }
      
      // Normalize to account for missing components
      const normalizedScore = weightSum > 0 ? 
        (totalScore / weightSum) * 100 : 0;
      
      // Store the score
      this.scores.set(program.id, {
        program,
        totalScore: Math.round(normalizedScore * 10) / 10, // Round to 1 decimal place
        componentScores: scores,
        updatedAt: new Date().toISOString()
      });
    }
    
    // Update rankings
    this._updateRankings();
    
    return this.scores;
  }

  /**
   * Update rankings based on current scores
   * @private
   */
  _updateRankings() {
    // Convert scores map to array and sort by total score (descending)
    const sortedPrograms = Array.from(this.scores.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalScore - a.totalScore);
    
    // Assign rankings
    sortedPrograms.forEach((program, index) => {
      const scoreData = this.scores.get(program.id);
      this.scores.set(program.id, {
        ...scoreData,
        rank: index + 1
      });
      
      this.rankings.set(program.id, index + 1);
    });
  }

  /**
   * Get COMPASS score for a specific program
   * @param {string} programId - Program ID
   * @returns {Object|null} Program COMPASS score or null if not found
   */
  async getProgramScore(programId) {
    // Ensure scores are up to date
    await this.updateScores();
    
    return this.scores.get(programId) || null;
  }

  /**
   * Get all COMPASS scores
   * @returns {Map} Map of program ID to score data
   */
  async getAllScores() {
    // Ensure scores are up to date
    await this.updateScores();
    
    return this.scores;
  }

  /**
   * Get program rankings
   * @param {string} [sport] - Filter by sport (optional)
   * @returns {Array} Array of ranked programs
   */
  async getRankings(sport = null) {
    // Ensure scores are up to date
    await this.updateScores();
    
    // Convert to array and sort by rank
    let rankings = Array.from(this.scores.values())
      .sort((a, b) => a.rank - b.rank);
    
    // Filter by sport if specified
    if (sport) {
      rankings = rankings.filter(
        program => program.program.sport === sport
      );
      
      // Re-rank within the sport
      rankings.forEach((program, index) => {
        program.sportRank = index + 1;
      });
    }
    
    return rankings;
  }

  /**
   * Get competitive analysis between two programs
   * @param {string} program1Id - First program ID
   * @param {string} program2Id - Second program ID 
   * @returns {Object} Competitive analysis data
   */
  async getCompetitiveAnalysis(program1Id, program2Id) {
    // Ensure scores are up to date
    await this.updateScores();
    
    const program1 = this.scores.get(program1Id);
    const program2 = this.scores.get(program2Id);
    
    if (!program1 || !program2) {
      throw new Error('One or both programs not found');
    }
    
    // Calculate differences
    const componentDifferences = {};
    const weights = this.options.weightConfig;
    
    for (const component of Object.keys(this.components)) {
      const score1 = program1.componentScores[component] || 0;
      const score2 = program2.componentScores[component] || 0;
      
      componentDifferences[component] = {
        program1Score: score1,
        program2Score: score2,
        difference: score1 - score2,
        percentDifference: score2 > 0 ? 
          ((score1 - score2) / score2) * 100 : 0,
        weight: weights[component]
      };
    }
    
    // Determine advantages
    const program1Advantages = [];
    const program2Advantages = [];
    
    for (const [component, diff] of Object.entries(componentDifferences)) {
      if (diff.difference > 5) {
        program1Advantages.push({
          component,
          advantage: diff.difference,
          weight: diff.weight
        });
      } else if (diff.difference < -5) {
        program2Advantages.push({
          component,
          advantage: -diff.difference,
          weight: diff.weight
        });
      }
    }
    
    // Sort advantages by weighted value (most significant first)
    const sortByWeightedAdvantage = (a, b) => 
      (b.advantage * b.weight) - (a.advantage * a.weight);
    
    program1Advantages.sort(sortByWeightedAdvantage);
    program2Advantages.sort(sortByWeightedAdvantage);
    
    return {
      program1: {
        id: program1Id,
        name: program1.program.name,
        score: program1.totalScore,
        rank: program1.rank,
        advantages: program1Advantages
      },
      program2: {
        id: program2Id,
        name: program2.program.name,
        score: program2.totalScore,
        rank: program2.rank,
        advantages: program2Advantages
      },
      scoreGap: program1.totalScore - program2.totalScore,
      components: componentDifferences,
      competitiveBalance: this._calculateCompetitiveBalance(program1, program2)
    };
  }

  /**
   * Calculate competitive balance metrics between two programs
   * @param {Object} program1 - First program data
   * @param {Object} program2 - Second program data
   * @returns {Object} Competitive balance metrics
   * @private
   */
  _calculateCompetitiveBalance(program1, program2) {
    const scoreDifference = Math.abs(program1.totalScore - program2.totalScore);
    
    // Calculate expected competitiveness on scale of 0-100
    // Lower score difference = higher competitiveness
    let competitiveness = Math.max(0, 100 - scoreDifference * 2);
    
    // Calculate fan interest based on competitiveness and program ranks
    // Higher ranked programs and closer matchups generate more interest
    const rankingFactor = Math.min(program1.rank, program2.rank) / 10;
    const fanInterest = (competitiveness * 0.7) + 
      (Math.max(0, 100 - rankingFactor) * 0.3);
    
    // Calculate upset potential
    // Higher when lower-ranked team has specific advantages
    let upsetPotential = 0;
    
    if (program1.rank > program2.rank) {
      // Program 1 is lower ranked but might upset program 2
      upsetPotential = this._calculateUpsetPotential(program1, program2);
    } else if (program2.rank > program1.rank) {
      // Program 2 is lower ranked but might upset program 1
      upsetPotential = this._calculateUpsetPotential(program2, program1);
    }
    
    return {
      competitiveness: Math.round(competitiveness),
      fanInterest: Math.round(fanInterest),
      upsetPotential: Math.round(upsetPotential),
      recommendedTierMatch: this._getMatchupTier(competitiveness)
    };
  }

  /**
   * Calculate upset potential
   * @param {Object} lowerRankedProgram - Lower ranked program
   * @param {Object} higherRankedProgram - Higher ranked program
   * @returns {number} Upset potential (0-100)
   * @private
   */
  _calculateUpsetPotential(lowerRankedProgram, higherRankedProgram) {
    // Base upset potential starts low
    let potential = 20;
    
    // Factor in how close the teams are
    const scoreDifference = 
      higherRankedProgram.totalScore - lowerRankedProgram.totalScore;
    
    if (scoreDifference < 5) {
      potential += 30; // Very close teams
    } else if (scoreDifference < 10) {
      potential += 20; // Moderately close
    } else if (scoreDifference < 15) {
      potential += 10; // Some gap
    }
    
    // Factor in specific advantages the lower team has
    const components = Object.keys(this.components);
    
    for (const component of components) {
      const lowerScore = lowerRankedProgram.componentScores[component] || 0;
      const higherScore = higherRankedProgram.componentScores[component] || 0;
      
      if (lowerScore > higherScore) {
        // Lower ranked team has an advantage in this component
        const weight = this.options.weightConfig[component];
        potential += 10 * weight; // Weight the importance of this advantage
      }
    }
    
    // Cap at 100
    return Math.min(100, potential);
  }

  /**
   * Get matchup tier based on competitiveness
   * @param {number} competitiveness - Competitiveness score
   * @returns {string} Matchup tier
   * @private
   */
  _getMatchupTier(competitiveness) {
    if (competitiveness >= 85) return 'Tier 1 - Premium';
    if (competitiveness >= 70) return 'Tier 2 - Featured';
    if (competitiveness >= 55) return 'Tier 3 - Quality';
    if (competitiveness >= 40) return 'Tier 4 - Standard';
    return 'Tier 5 - Development';
  }

  /**
   * Get schedule quality assessment for a team
   * @param {string} teamId - Team ID
   * @param {Object} schedule - Schedule to assess
   * @returns {Object} Schedule quality assessment
   */
  async getScheduleQualityAssessment(teamId, schedule) {
    // Ensure scores are up to date
    await this.updateScores();
    
    const teamScore = this.scores.get(teamId);
    if (!teamScore) {
      throw new Error(`Team not found: ${teamId}`);
    }
    
    const games = schedule.games.filter(game => 
      game.homeTeam.id === teamId || game.awayTeam.id === teamId
    );
    
    // Initialize assessment data
    const assessment = {
      teamId,
      teamName: teamScore.program.name,
      teamRank: teamScore.rank,
      teamScore: teamScore.totalScore,
      overallAssessment: {
        totalGames: games.length,
        averageOpponentRank: 0,
        averageOpponentScore: 0,
        premiumMatchups: 0,
        qualityMatchups: 0,
        strengthOfSchedule: 0,
        revenuePotential: 0,
        nationalExposure: 0,
        fanInterest: 0
      },
      homeVsAway: {
        homeGames: 0,
        awayGames: 0,
        homeQuality: 0,
        awayQuality: 0,
        homeRevenue: 0
      },
      opponents: []
    };
    
    // Process each game
    let totalOpponentRank = 0;
    let totalOpponentScore = 0;
    let totalHomeQuality = 0;
    let totalAwayQuality = 0;
    let totalRevenue = 0;
    let totalExposure = 0;
    let totalFanInterest = 0;
    
    for (const game of games) {
      const opponentId = game.homeTeam.id === teamId ? 
        game.awayTeam.id : game.homeTeam.id;
      
      const opponentScore = this.scores.get(opponentId);
      
      if (!opponentScore) {
        logger.warn(`Opponent not found in COMPASS data: ${opponentId}`);
        continue;
      }
      
      // Get competitive analysis for this matchup
      const analysis = await this.getCompetitiveAnalysis(teamId, opponentId);
      
      // Get revenue potential (implementation depends on revenueSensor)
      let revenuePotential = 0;
      let nationalExposure = 0;
      
      if (this.components.resources) {
        try {
          const gameMetrics = await this.components.resources.getGameMetrics(
            teamId, opponentId, game.date, game.isHome
          );
          
          revenuePotential = gameMetrics.revenuePotential || 0;
          nationalExposure = gameMetrics.nationalExposure || 0;
        } catch (error) {
          logger.warn(`Error getting game metrics: ${error.message}`);
        }
      }
      
      // Increment totals
      totalOpponentRank += opponentScore.rank;
      totalOpponentScore += opponentScore.totalScore;
      totalRevenue += revenuePotential;
      totalExposure += nationalExposure;
      totalFanInterest += analysis.competitiveBalance.fanInterest;
      
      // Track home/away metrics
      if (game.homeTeam.id === teamId) {
        assessment.homeVsAway.homeGames++;
        totalHomeQuality += opponentScore.totalScore;
        assessment.homeVsAway.homeRevenue += revenuePotential;
      } else {
        assessment.homeVsAway.awayGames++;
        totalAwayQuality += opponentScore.totalScore;
      }
      
      // Track matchup tiers
      if (analysis.competitiveBalance.recommendedTierMatch.startsWith('Tier 1')) {
        assessment.overallAssessment.premiumMatchups++;
      } else if (
        analysis.competitiveBalance.recommendedTierMatch.startsWith('Tier 2') || 
        analysis.competitiveBalance.recommendedTierMatch.startsWith('Tier 3')
      ) {
        assessment.overallAssessment.qualityMatchups++;
      }
      
      // Add opponent details
      assessment.opponents.push({
        id: opponentId,
        name: opponentScore.program.name,
        rank: opponentScore.rank,
        score: opponentScore.totalScore,
        isHome: game.homeTeam.id === teamId,
        date: game.date,
        competitiveness: analysis.competitiveBalance.competitiveness,
        fanInterest: analysis.competitiveBalance.fanInterest,
        upsetPotential: analysis.competitiveBalance.upsetPotential,
        revenuePotential,
        nationalExposure,
        tier: analysis.competitiveBalance.recommendedTierMatch
      });
    }
    
    // Calculate averages
    const gameCount = games.length;
    
    if (gameCount > 0) {
      assessment.overallAssessment.averageOpponentRank = 
        Math.round(totalOpponentRank / gameCount);
      assessment.overallAssessment.averageOpponentScore = 
        Math.round(totalOpponentScore / gameCount * 10) / 10;
      assessment.overallAssessment.revenuePotential = 
        Math.round(totalRevenue / gameCount * 10) / 10;
      assessment.overallAssessment.nationalExposure = 
        Math.round(totalExposure / gameCount * 10) / 10;
      assessment.overallAssessment.fanInterest = 
        Math.round(totalFanInterest / gameCount);
      
      // Calculate strength of schedule score (0-100)
      // Higher opponent score = higher SoS
      const maxPossibleScore = 100; // theoretical max opponent score
      assessment.overallAssessment.strengthOfSchedule = Math.round(
        (assessment.overallAssessment.averageOpponentScore / maxPossibleScore) * 100
      );
    }
    
    // Calculate home/away quality
    if (assessment.homeVsAway.homeGames > 0) {
      assessment.homeVsAway.homeQuality = Math.round(
        totalHomeQuality / assessment.homeVsAway.homeGames * 10
      ) / 10;
    }
    
    if (assessment.homeVsAway.awayGames > 0) {
      assessment.homeVsAway.awayQuality = Math.round(
        totalAwayQuality / assessment.homeVsAway.awayGames * 10
      ) / 10;
    }
    
    return assessment;
  }
}

module.exports = COMPASSCore;