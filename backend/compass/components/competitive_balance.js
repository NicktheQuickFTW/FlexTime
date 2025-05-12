/**
 * COMPASS Competitive Balance Guardian Component
 * 
 * Analyzes and ensures fair schedule distribution across programs,
 * optimizing for competitive equity and appropriate matchups.
 */

const logger = require('../../utils/logger');

class CompetitiveBalanceComponent {
  /**
   * Create a new Competitive Balance Component
   * @param {Object} compassCore - Reference to COMPASS core system
   * @param {Object} options - Configuration options
   */
  constructor(compassCore, options = {}) {
    this.compassCore = compassCore;
    this.options = {
      strengthOfScheduleWeight: 0.3,      // Weight for schedule strength balance
      homeAwayBalanceWeight: 0.25,        // Weight for home/away equity
      restAdvantageWeight: 0.25,          // Weight for rest day equality
      qualityGameDistributionWeight: 0.2, // Weight for premium matchup distribution
      ...options
    };
    
    this.scheduleAssessments = new Map();
    this.balanceScores = new Map();
    
    logger.info('COMPASS Competitive Balance Component initialized');
  }
  
  /**
   * Assess a schedule for competitive balance
   * @param {Object} schedule - Schedule to assess
   * @returns {Promise<Object>} Balance assessment
   */
  async assessSchedule(schedule) {
    try {
      // Check if we've already assessed this schedule
      const scheduleId = schedule.id || schedule.schedule_id;
      
      if (this.scheduleAssessments.has(scheduleId)) {
        return this.scheduleAssessments.get(scheduleId);
      }
      
      // Initialize assessment structure
      const assessment = {
        scheduleId,
        strengthOfSchedule: {},
        homeAwayBalance: {},
        restAdvantage: {},
        qualityGameDistribution: {},
        overallBalance: 0
      };
      
      // Extract teams from schedule
      const teams = schedule.teams || [];
      const teamIds = teams.map(team => team.id || team.team_id);
      
      // Process each aspect of competitive balance
      assessment.strengthOfSchedule = await this._assessStrengthOfSchedule(schedule, teamIds);
      assessment.homeAwayBalance = this._assessHomeAwayBalance(schedule, teamIds);
      assessment.restAdvantage = this._assessRestAdvantage(schedule, teamIds);
      assessment.qualityGameDistribution = await this._assessQualityGameDistribution(schedule, teamIds);
      
      // Calculate overall balance score
      assessment.overallBalance = this._calculateOverallBalance(assessment);
      
      // Store assessment
      this.scheduleAssessments.set(scheduleId, assessment);
      
      return assessment;
    } catch (error) {
      logger.error(`Error assessing schedule balance: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get competitive balance score for a league/conference
   * @param {string} conferenceId - Conference ID
   * @returns {Promise<number>} Balance score (0-1)
   */
  async getScore(conferenceId) {
    try {
      // In a production system, this would retrieve actual conference/league data
      // For this prototype, we'll use a consistent synthetic score based on ID
      
      // Check if we've already calculated this score
      if (this.balanceScores.has(conferenceId)) {
        return this.balanceScores.get(conferenceId);
      }
      
      // Generate a synthetic score between 0.5 and 0.95
      const idHash = this._simpleHash(conferenceId);
      const score = 0.5 + (idHash % 45) / 100;
      
      // Store in cache
      this.balanceScores.set(conferenceId, score);
      
      return score;
    } catch (error) {
      logger.error(`Error calculating balance score: ${error.message}`);
      return 0.7; // Default moderate score
    }
  }
  
  /**
   * Assess strength of schedule balance across teams
   * @param {Object} schedule - Schedule to assess
   * @param {Array} teamIds - Team IDs to assess
   * @returns {Promise<Object>} Strength of schedule assessment
   * @private
   */
  async _assessStrengthOfSchedule(schedule, teamIds) {
    try {
      // Get opponent quality for each team's schedule
      const teamSchedules = {};
      
      for (const teamId of teamIds) {
        teamSchedules[teamId] = {
          opponents: [],
          averageOpponentScore: 0,
          totalGames: 0
        };
      }
      
      // For each game, record opponents
      for (const game of schedule.games) {
        const homeTeamId = game.homeTeam.id || game.homeTeam;
        const awayTeamId = game.awayTeam.id || game.awayTeam;
        
        // Skip if either team is not in our assessment list
        if (!teamIds.includes(homeTeamId) || !teamIds.includes(awayTeamId)) {
          continue;
        }
        
        // Get team scores from COMPASS
        let homeTeamScore, awayTeamScore;
        
        try {
          [homeTeamScore, awayTeamScore] = await Promise.all([
            this.compassCore.getProgramScore(homeTeamId).then(data => data?.totalScore || 50),
            this.compassCore.getProgramScore(awayTeamId).then(data => data?.totalScore || 50)
          ]);
        } catch (error) {
          // If scores not available, use default values
          homeTeamScore = 50;
          awayTeamScore = 50;
          logger.warn(`Using default scores for game: ${homeTeamId} vs ${awayTeamId}`);
        }
        
        // Record opponent for home team
        if (teamSchedules[homeTeamId]) {
          teamSchedules[homeTeamId].opponents.push({
            id: awayTeamId,
            score: awayTeamScore,
            date: game.date
          });
          teamSchedules[homeTeamId].totalGames++;
        }
        
        // Record opponent for away team
        if (teamSchedules[awayTeamId]) {
          teamSchedules[awayTeamId].opponents.push({
            id: homeTeamId,
            score: homeTeamScore,
            date: game.date
          });
          teamSchedules[awayTeamId].totalGames++;
        }
      }
      
      // Calculate average opponent score for each team
      for (const [teamId, schedule] of Object.entries(teamSchedules)) {
        if (schedule.totalGames > 0) {
          const totalScore = schedule.opponents.reduce((sum, opp) => sum + opp.score, 0);
          schedule.averageOpponentScore = totalScore / schedule.totalGames;
        }
      }
      
      // Calculate standard deviation of strength of schedule
      const scheduleStrengths = Object.values(teamSchedules).map(s => s.averageOpponentScore);
      const stdDev = this._calculateStandardDeviation(scheduleStrengths);
      
      // Normalize to a 0-100 score (lower std dev = higher balance)
      // A perfect schedule would have stdDev of 0
      // A typical unbalanced schedule might have stdDev around 10-15
      const maxStdDev = 15; // Theoretical maximum expected
      const balanceScore = Math.max(0, 100 - ((stdDev / maxStdDev) * 100));
      
      return {
        teamSchedules,
        standardDeviation: stdDev,
        balanceScore,
        assessmentDate: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error assessing strength of schedule: ${error.message}`);
      return {
        standardDeviation: 10,
        balanceScore: 50,
        error: error.message
      };
    }
  }
  
  /**
   * Assess home/away balance across teams
   * @param {Object} schedule - Schedule to assess
   * @param {Array} teamIds - Team IDs to assess
   * @returns {Object} Home/away balance assessment
   * @private
   */
  _assessHomeAwayBalance(schedule, teamIds) {
    try {
      // Count home and away games for each team
      const teamCounts = {};
      
      for (const teamId of teamIds) {
        teamCounts[teamId] = {
          homeGames: 0,
          awayGames: 0,
          ratio: 0
        };
      }
      
      // For each game, increment counts
      for (const game of schedule.games) {
        const homeTeamId = game.homeTeam.id || game.homeTeam;
        const awayTeamId = game.awayTeam.id || game.awayTeam;
        
        // Skip if either team is not in our assessment list
        if (!teamIds.includes(homeTeamId) || !teamIds.includes(awayTeamId)) {
          continue;
        }
        
        // Increment home and away counts
        if (teamCounts[homeTeamId]) {
          teamCounts[homeTeamId].homeGames++;
        }
        
        if (teamCounts[awayTeamId]) {
          teamCounts[awayTeamId].awayGames++;
        }
      }
      
      // Calculate home/away ratio for each team
      for (const [teamId, counts] of Object.entries(teamCounts)) {
        if (counts.awayGames > 0) {
          counts.ratio = counts.homeGames / counts.awayGames;
        } else if (counts.homeGames > 0) {
          counts.ratio = Infinity; // All home games
        } else {
          counts.ratio = 1; // No games
        }
      }
      
      // Calculate standard deviation of home/away ratios
      const ratios = Object.values(teamCounts)
        .filter(c => c.ratio !== Infinity) // Remove infinite values
        .map(c => c.ratio);
      
      const stdDev = this._calculateStandardDeviation(ratios);
      
      // In an ideal schedule, home/away ratio is close to 1.0 for all teams
      // Calculate how far each team is from the ideal 1.0 ratio
      const deviations = Object.values(teamCounts)
        .filter(c => c.ratio !== Infinity)
        .map(c => Math.abs(c.ratio - 1.0));
      
      const avgDeviation = deviations.length > 0 ?
        deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length : 0;
      
      // Normalize to a 0-100 score (lower deviation = higher balance)
      // Perfect balance would have avgDeviation of 0
      const maxAvgDeviation = 0.5; // Theoretical maximum expected
      const balanceScore = Math.max(0, 100 - ((avgDeviation / maxAvgDeviation) * 100));
      
      return {
        teamCounts,
        standardDeviation: stdDev,
        averageDeviation: avgDeviation,
        balanceScore,
        assessmentDate: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error assessing home/away balance: ${error.message}`);
      return {
        standardDeviation: 0.2,
        balanceScore: 60,
        error: error.message
      };
    }
  }
  
  /**
   * Assess rest advantage across teams
   * @param {Object} schedule - Schedule to assess
   * @param {Array} teamIds - Team IDs to assess
   * @returns {Object} Rest advantage assessment
   * @private
   */
  _assessRestAdvantage(schedule, teamIds) {
    try {
      // Analyze rest days between games for each team
      const teamRestData = {};
      
      for (const teamId of teamIds) {
        teamRestData[teamId] = {
          games: [],
          restDays: [],
          averageRest: 0,
          restAdvantages: 0,
          restDisadvantages: 0
        };
      }
      
      // For each game, record date for teams involved
      for (const game of schedule.games) {
        const homeTeamId = game.homeTeam.id || game.homeTeam;
        const awayTeamId = game.awayTeam.id || game.awayTeam;
        const gameDate = new Date(game.date);
        
        // Skip if either team is not in our assessment list
        if (!teamIds.includes(homeTeamId) || !teamIds.includes(awayTeamId)) {
          continue;
        }
        
        // Record game for home team
        if (teamRestData[homeTeamId]) {
          teamRestData[homeTeamId].games.push({
            opponent: awayTeamId,
            date: gameDate,
            isHome: true
          });
        }
        
        // Record game for away team
        if (teamRestData[awayTeamId]) {
          teamRestData[awayTeamId].games.push({
            opponent: homeTeamId,
            date: gameDate,
            isHome: false
          });
        }
      }
      
      // Sort games chronologically for each team
      for (const teamData of Object.values(teamRestData)) {
        teamData.games.sort((a, b) => a.date - b.date);
      }
      
      // Calculate rest days between games for each team
      for (const [teamId, teamData] of Object.entries(teamRestData)) {
        const games = teamData.games;
        
        for (let i = 1; i < games.length; i++) {
          const prevGame = games[i - 1];
          const currGame = games[i];
          
          // Calculate days between games
          const daysDiff = Math.round(
            (currGame.date - prevGame.date) / (1000 * 60 * 60 * 24)
          );
          
          teamData.restDays.push(daysDiff);
        }
        
        // Calculate average rest
        if (teamData.restDays.length > 0) {
          teamData.averageRest = teamData.restDays.reduce((sum, days) => sum + days, 0) / 
            teamData.restDays.length;
        }
      }
      
      // Calculate rest advantages in matchups
      for (const game of schedule.games) {
        const homeTeamId = game.homeTeam.id || game.homeTeam;
        const awayTeamId = game.awayTeam.id || game.awayTeam;
        const gameDate = new Date(game.date);
        
        // Skip if either team is not in our assessment list
        if (!teamIds.includes(homeTeamId) || !teamIds.includes(awayTeamId)) {
          continue;
        }
        
        // Find previous game for each team
        const homePrevGame = this._findPreviousGame(teamRestData[homeTeamId].games, gameDate);
        const awayPrevGame = this._findPreviousGame(teamRestData[awayTeamId].games, gameDate);
        
        // If both teams had a previous game, compare rest days
        if (homePrevGame && awayPrevGame) {
          const homeRestDays = Math.round(
            (gameDate - homePrevGame.date) / (1000 * 60 * 60 * 24)
          );
          
          const awayRestDays = Math.round(
            (gameDate - awayPrevGame.date) / (1000 * 60 * 60 * 24)
          );
          
          // Rest advantage if diff is >= 2 days
          if (homeRestDays >= awayRestDays + 2) {
            teamRestData[homeTeamId].restAdvantages++;
            teamRestData[awayTeamId].restDisadvantages++;
          } else if (awayRestDays >= homeRestDays + 2) {
            teamRestData[awayTeamId].restAdvantages++;
            teamRestData[homeTeamId].restDisadvantages++;
          }
        }
      }
      
      // Calculate standard deviation of rest advantages
      const restAdvantages = Object.values(teamRestData).map(d => d.restAdvantages);
      const restDisadvantages = Object.values(teamRestData).map(d => d.restDisadvantages);
      
      const advantageStdDev = this._calculateStandardDeviation(restAdvantages);
      const disadvantageStdDev = this._calculateStandardDeviation(restDisadvantages);
      
      // Calculate net advantage imbalance
      const netAdvantages = Object.values(teamRestData)
        .map(d => d.restAdvantages - d.restDisadvantages);
      
      const netAdvantageStdDev = this._calculateStandardDeviation(netAdvantages);
      
      // Normalize to a 0-100 score (lower std dev = higher balance)
      const maxNetStdDev = 5; // Theoretical maximum expected
      const balanceScore = Math.max(0, 100 - ((netAdvantageStdDev / maxNetStdDev) * 100));
      
      return {
        teamRestData,
        advantageStandardDeviation: advantageStdDev,
        disadvantageStandardDeviation: disadvantageStdDev,
        netAdvantageStandardDeviation: netAdvantageStdDev,
        balanceScore,
        assessmentDate: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error assessing rest advantage: ${error.message}`);
      return {
        netAdvantageStandardDeviation: 2,
        balanceScore: 60,
        error: error.message
      };
    }
  }
  
  /**
   * Assess quality game distribution across teams
   * @param {Object} schedule - Schedule to assess
   * @param {Array} teamIds - Team IDs to assess
   * @returns {Promise<Object>} Quality game distribution assessment
   * @private
   */
  async _assessQualityGameDistribution(schedule, teamIds) {
    try {
      // Count premium matchups for each team
      const teamMatchups = {};
      
      for (const teamId of teamIds) {
        teamMatchups[teamId] = {
          premiumMatchups: 0,
          qualityMatchups: 0,
          standardMatchups: 0,
          totalMatchups: 0,
          premiumMatchupPercentage: 0
        };
      }
      
      // Process each game to classify matchups
      for (const game of schedule.games) {
        const homeTeamId = game.homeTeam.id || game.homeTeam;
        const awayTeamId = game.awayTeam.id || game.awayTeam;
        
        // Skip if either team is not in our assessment list
        if (!teamIds.includes(homeTeamId) || !teamIds.includes(awayTeamId)) {
          continue;
        }
        
        // Get competitiveness score for this matchup using COMPASS
        let matchupQuality;
        
        try {
          const analysis = await this.compassCore.getCompetitiveAnalysis(homeTeamId, awayTeamId);
          matchupQuality = analysis.competitiveBalance.recommendedTierMatch;
        } catch (error) {
          // If analysis not available, use a default classification
          const idHash = this._simpleHash(`${homeTeamId}-${awayTeamId}`);
          if (idHash > 80) matchupQuality = 'Tier 1 - Premium';
          else if (idHash > 60) matchupQuality = 'Tier 2 - Featured';
          else if (idHash > 40) matchupQuality = 'Tier 3 - Quality';
          else matchupQuality = 'Tier 4 - Standard';
        }
        
        // Increment appropriate counters for both teams
        for (const teamId of [homeTeamId, awayTeamId]) {
          if (teamMatchups[teamId]) {
            if (matchupQuality.startsWith('Tier 1')) {
              teamMatchups[teamId].premiumMatchups++;
            } else if (matchupQuality.startsWith('Tier 2') || matchupQuality.startsWith('Tier 3')) {
              teamMatchups[teamId].qualityMatchups++;
            } else {
              teamMatchups[teamId].standardMatchups++;
            }
            
            teamMatchups[teamId].totalMatchups++;
          }
        }
      }
      
      // Calculate percentages for each team
      for (const [teamId, data] of Object.entries(teamMatchups)) {
        if (data.totalMatchups > 0) {
          data.premiumMatchupPercentage = (data.premiumMatchups / data.totalMatchups) * 100;
        }
      }
      
      // Calculate standard deviation of premium matchup percentages
      const premiumPercentages = Object.values(teamMatchups)
        .filter(d => d.totalMatchups > 0)
        .map(d => d.premiumMatchupPercentage);
      
      const stdDev = this._calculateStandardDeviation(premiumPercentages);
      
      // Normalize to a 0-100 score (lower std dev = higher balance)
      const maxStdDev = 20; // Theoretical maximum expected
      const balanceScore = Math.max(0, 100 - ((stdDev / maxStdDev) * 100));
      
      return {
        teamMatchups,
        standardDeviation: stdDev,
        balanceScore,
        assessmentDate: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error assessing quality game distribution: ${error.message}`);
      return {
        standardDeviation: 10,
        balanceScore: 50,
        error: error.message
      };
    }
  }
  
  /**
   * Calculate overall balance score from component scores
   * @param {Object} assessment - Balance assessment
   * @returns {number} Overall balance score (0-100)
   * @private
   */
  _calculateOverallBalance(assessment) {
    try {
      // Extract component scores
      const strengthScore = assessment.strengthOfSchedule.balanceScore || 0;
      const homeAwayScore = assessment.homeAwayBalance.balanceScore || 0;
      const restScore = assessment.restAdvantage.balanceScore || 0;
      const qualityScore = assessment.qualityGameDistribution.balanceScore || 0;
      
      // Apply weights
      const weightedScore = 
        (strengthScore * this.options.strengthOfScheduleWeight) +
        (homeAwayScore * this.options.homeAwayBalanceWeight) +
        (restScore * this.options.restAdvantageWeight) +
        (qualityScore * this.options.qualityGameDistributionWeight);
      
      return Math.round(weightedScore);
    } catch (error) {
      logger.error(`Error calculating overall balance: ${error.message}`);
      return 60; // Default moderate score
    }
  }
  
  /**
   * Find previous game for a team before a given date
   * @param {Array} games - Chronologically sorted games
   * @param {Date} date - Reference date
   * @returns {Object|null} Previous game or null if none
   * @private
   */
  _findPreviousGame(games, date) {
    // Games should already be sorted by date
    for (let i = games.length - 1; i >= 0; i--) {
      if (games[i].date < date) {
        return games[i];
      }
    }
    return null;
  }
  
  /**
   * Calculate standard deviation of an array of numbers
   * @param {Array} values - Array of numeric values
   * @returns {number} Standard deviation
   * @private
   */
  _calculateStandardDeviation(values) {
    if (!values || values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Math.sqrt(variance);
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
    this.scheduleAssessments.clear();
    this.balanceScores.clear();
    logger.info('Competitive Balance component cache cleared');
  }
}

module.exports = CompetitiveBalanceComponent;