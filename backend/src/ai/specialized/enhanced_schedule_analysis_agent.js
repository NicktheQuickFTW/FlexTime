/**
 * Enhanced Schedule Analysis Agent for FlexTime
 * 
 * This specialized agent provides comprehensive schedule analysis with
 * visualization capabilities and detailed metrics.
 */

const Agent = require('../agent');
const logger = require("../../lib/logger");;
const ScheduleVisualizationGenerator = require('../../utils/visualization/schedule_visualization');
const { ConstraintEvaluator } = require('../../algorithms/improvements/constraint_evaluator');

class EnhancedScheduleAnalysisAgent extends Agent {
  /**
   * Initialize a new Enhanced Schedule Analysis Agent
   * @param {Object} mcpConnector - MCP server connector
   * @param {Object} options - Configuration options
   */
  constructor(mcpConnector, options = {}) {
    super('enhanced_schedule_analysis', 'specialized', mcpConnector);
    
    // Initialize visualization generator
    this.visualizationGenerator = new ScheduleVisualizationGenerator({
      debug: options.debug || false,
      includeRawData: options.includeRawData || false
    });
    
    // Initialize constraint evaluator
    this.constraintEvaluator = new ConstraintEvaluator();
    
    // Configuration
    this.generateVisualizations = options.generateVisualizations !== false;
    this.generateAIInsights = options.generateAIInsights !== false;
    this.sport = options.sport || null;
    
    // Sport-specific analyzers (loaded on demand)
    this.sportAnalyzers = {};
    
    // Analysis types available
    this.analysisTypes = [
      'basic',
      'constraints',
      'travel',
      'balance',
      'patterns',
      'sportSpecific',
      'visualizations',
      'aiInsights'
    ];
    
    logger.info('Enhanced Schedule Analysis Agent initialized');
  }
  
  /**
   * Process a task to analyze a schedule
   * @param {Object} task - The task to process
   * @returns {Promise<Object>} Analysis results
   * @private
   */
  async _processTask(task) {
    logger.info(`Enhanced Schedule Analysis Agent processing task: ${task.description}`);
    
    const schedule = task.parameters.schedule;
    const options = task.parameters.options || {};
    
    // Validate inputs
    if (!schedule) {
      throw new Error('Schedule is required for analysis');
    }
    
    // Determine which analysis types to perform
    const analysisTypes = options.analysisTypes || this.analysisTypes;
    
    // Prepare analysis result
    const result = {
      scheduleId: schedule.id,
      sport: schedule.sport,
      analysis: {}
    };
    
    // Get sport-specific analyzer if available
    const sportAnalyzer = await this._getSportAnalyzer(schedule.sport);
    
    // Process each requested analysis type
    for (const analysisType of analysisTypes) {
      try {
        switch (analysisType) {
          case 'basic':
            result.analysis.basic = this._performBasicAnalysis(schedule);
            break;
          case 'constraints':
            result.analysis.constraints = this._analyzeConstraints(schedule, options);
            break;
          case 'travel':
            result.analysis.travel = this._analyzeTravelDistance(schedule);
            break;
          case 'balance':
            result.analysis.balance = this._analyzeHomeAwayBalance(schedule);
            break;
          case 'patterns':
            result.analysis.patterns = this._analyzeSchedulePatterns(schedule);
            break;
          case 'sportSpecific':
            result.analysis.sportSpecific = 
              await this._performSportSpecificAnalysis(schedule, sportAnalyzer, options);
            break;
          case 'visualizations':
            if (this.generateVisualizations) {
              result.analysis.visualizations = 
                this.visualizationGenerator.generateVisualizations(schedule);
            }
            break;
          case 'aiInsights':
            if (this.generateAIInsights && this.mcpConnector) {
              result.analysis.aiInsights = await this._generateAIInsights(
                schedule, 
                result.analysis
              );
            }
            break;
          default:
            logger.warn(`Unknown analysis type: ${analysisType}`);
        }
      } catch (error) {
        logger.error(`Error in ${analysisType} analysis: ${error.message}`);
        result.analysis[analysisType] = { error: error.message };
      }
    }
    
    // Add analysis completion information
    result.completedAt = new Date().toISOString();
    result.analysisTypes = analysisTypes;
    
    return result;
  }
  
  /**
   * Perform basic schedule analysis
   * @param {Object} schedule - Schedule to analyze
   * @returns {Object} Basic analysis
   * @private
   */
  _performBasicAnalysis(schedule) {
    // Extract basic schedule statistics
    const startDate = new Date(schedule.startDate || schedule.games[0]?.date);
    const endDate = new Date(schedule.endDate || schedule.games[schedule.games.length - 1]?.date);
    
    // Calculate schedule duration in days
    const durationDays = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;
    
    // Count unique venues
    const venueIds = new Set(schedule.games.map(g => g.venue.id));
    
    // Calculate games per team
    const gamesPerTeam = {};
    for (const team of schedule.teams) {
      gamesPerTeam[team.id] = {
        home: 0,
        away: 0,
        total: 0
      };
    }
    
    for (const game of schedule.games) {
      if (gamesPerTeam[game.homeTeam.id]) {
        gamesPerTeam[game.homeTeam.id].home++;
        gamesPerTeam[game.homeTeam.id].total++;
      }
      
      if (gamesPerTeam[game.awayTeam.id]) {
        gamesPerTeam[game.awayTeam.id].away++;
        gamesPerTeam[game.awayTeam.id].total++;
      }
    }
    
    // Calculate games per day of week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const gamesByDay = daysOfWeek.map(day => ({ day, count: 0 }));
    
    for (const game of schedule.games) {
      const date = new Date(game.date);
      gamesByDay[date.getDay()].count++;
    }
    
    return {
      teamCount: schedule.teams.length,
      gameCount: schedule.games.length,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      durationDays,
      venueCount: venueIds.size,
      gamesPerTeamStats: {
        min: Math.min(...Object.values(gamesPerTeam).map(g => g.total)),
        max: Math.max(...Object.values(gamesPerTeam).map(g => g.total)),
        avg: schedule.games.length * 2 / schedule.teams.length
      },
      gamesByDay,
      weekendGamesCount: gamesByDay[0].count + gamesByDay[6].count,
      weekendGamesPercentage: 
        ((gamesByDay[0].count + gamesByDay[6].count) / schedule.games.length) * 100
    };
  }
  
  /**
   * Analyze schedule constraints
   * @param {Object} schedule - Schedule to analyze
   * @param {Object} options - Analysis options
   * @returns {Object} Constraint analysis
   * @private
   */
  _analyzeConstraints(schedule, options) {
    // Set up constraints if not already in schedule
    const constraints = schedule.constraints || [];
    
    // Use constraint evaluator to assess the schedule
    this.constraintEvaluator.setConstraints(constraints);
    const evaluation = this.constraintEvaluator.evaluateSchedule(schedule);
    
    // Group violations by constraint type
    const violationsByType = {};
    
    for (const violation of evaluation.violations) {
      const type = violation.constraintType || 'unknown';
      
      if (!violationsByType[type]) {
        violationsByType[type] = [];
      }
      
      violationsByType[type].push(violation);
    }
    
    // Analyze violation patterns
    const patterns = this._identifyConstraintViolationPatterns(evaluation.violations);
    
    return {
      score: evaluation.score,
      valid: evaluation.valid,
      hardConstraintViolations: evaluation.hardConstraintViolations,
      violationCount: evaluation.violations.length,
      violationsByType,
      constraintSatisfactionRate: constraints.length > 0 ?
        (constraints.length - Object.keys(violationsByType).length) / constraints.length * 100 : 100,
      patterns,
      details: options.includeDetails ? evaluation : undefined
    };
  }
  
  /**
   * Identify patterns in constraint violations
   * @param {Array} violations - Constraint violations
   * @returns {Array} Violation patterns
   * @private
   */
  _identifyConstraintViolationPatterns(violations) {
    // Simple implementation to identify patterns
    // In a production system, this would be more sophisticated
    
    const teamViolations = {};
    const venueViolations = {};
    const dateViolations = {};
    
    // Count violations by team, venue, and date
    for (const violation of violations) {
      // Count team violations
      if (violation.team) {
        teamViolations[violation.team] = (teamViolations[violation.team] || 0) + 1;
      }
      
      // Count venue violations
      if (violation.venue) {
        venueViolations[violation.venue] = (venueViolations[violation.venue] || 0) + 1;
      }
      
      // Count date violations
      if (violation.date) {
        dateViolations[violation.date] = (dateViolations[violation.date] || 0) + 1;
      }
    }
    
    // Identify teams with multiple violations
    const problematicTeams = Object.entries(teamViolations)
      .filter(([_, count]) => count > 1)
      .map(([team, count]) => ({ team, count }))
      .sort((a, b) => b.count - a.count);
    
    // Identify venues with multiple violations
    const problematicVenues = Object.entries(venueViolations)
      .filter(([_, count]) => count > 1)
      .map(([venue, count]) => ({ venue, count }))
      .sort((a, b) => b.count - a.count);
    
    // Identify dates with multiple violations
    const problematicDates = Object.entries(dateViolations)
      .filter(([_, count]) => count > 1)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.count - a.count);
    
    // Return identified patterns
    return {
      problematicTeams: problematicTeams.slice(0, 5),
      problematicVenues: problematicVenues.slice(0, 5),
      problematicDates: problematicDates.slice(0, 5),
      mostCommonViolation: this._getMostCommonViolationType(violations)
    };
  }
  
  /**
   * Get the most common violation type
   * @param {Array} violations - Constraint violations
   * @returns {Object} Most common violation
   * @private
   */
  _getMostCommonViolationType(violations) {
    if (violations.length === 0) return null;
    
    const typeCounts = {};
    
    for (const violation of violations) {
      const type = violation.constraintType || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
    
    let maxType = null;
    let maxCount = 0;
    
    for (const [type, count] of Object.entries(typeCounts)) {
      if (count > maxCount) {
        maxCount = count;
        maxType = type;
      }
    }
    
    return {
      type: maxType,
      count: maxCount,
      percentage: (maxCount / violations.length) * 100
    };
  }
  
  /**
   * Analyze travel distance
   * @param {Object} schedule - Schedule to analyze
   * @returns {Object} Travel distance analysis
   * @private
   */
  _analyzeTravelDistance(schedule) {
    // Group games by team
    const teamGames = {};
    
    for (const team of schedule.teams) {
      teamGames[team.id] = [];
    }
    
    for (const game of schedule.games) {
      teamGames[game.homeTeam.id].push({
        opponent: game.awayTeam.id,
        venue: game.venue,
        date: new Date(game.date),
        isHome: true
      });
      
      teamGames[game.awayTeam.id].push({
        opponent: game.homeTeam.id,
        venue: game.venue,
        date: new Date(game.date),
        isHome: false
      });
    }
    
    // Calculate travel distances
    const teamDistances = {};
    let totalDistance = 0;
    
    for (const [teamId, games] of Object.entries(teamGames)) {
      // Sort games by date
      games.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      const team = schedule.teams.find(t => t.id === teamId);
      if (!team || !team.location) continue;
      
      // Calculate total travel distance for this team
      let teamDistance = 0;
      let previousLocation = team.location;
      const trips = [];
      
      for (const game of games) {
        if (!game.venue || !game.venue.location) continue;
        
        // Calculate distance to venue
        const distance = this._calculateDistance(
          previousLocation,
          game.venue.location
        );
        
        trips.push({
          date: game.date,
          from: previousLocation.name || 'Home Base',
          to: game.venue.name,
          distance,
          isHomeGame: game.isHome
        });
        
        teamDistance += distance;
        previousLocation = game.venue.location;
      }
      
      // Add trip back home after last game
      if (games.length > 0 && games[games.length - 1].venue && 
          games[games.length - 1].venue.location) {
        const distance = this._calculateDistance(
          games[games.length - 1].venue.location,
          team.location
        );
        
        trips.push({
          date: games[games.length - 1].date,
          from: games[games.length - 1].venue.name,
          to: team.location.name || 'Home Base',
          distance,
          isReturn: true
        });
        
        teamDistance += distance;
      }
      
      teamDistances[teamId] = {
        totalDistance: teamDistance,
        trips,
        averagePerGame: games.length > 0 ? teamDistance / games.length : 0
      };
      
      totalDistance += teamDistance;
    }
    
    // Find teams with most and least travel
    const teamTravelList = Object.entries(teamDistances).map(([teamId, data]) => ({
      teamId,
      distance: data.totalDistance
    }));
    
    teamTravelList.sort((a, b) => b.distance - a.distance);
    
    return {
      totalDistance,
      averagePerTeam: schedule.teams.length > 0 ? totalDistance / schedule.teams.length : 0,
      mostTravel: teamTravelList.length > 0 ? {
        teamId: teamTravelList[0].teamId,
        distance: teamTravelList[0].distance
      } : null,
      leastTravel: teamTravelList.length > 0 ? {
        teamId: teamTravelList[teamTravelList.length - 1].teamId,
        distance: teamTravelList[teamTravelList.length - 1].distance
      } : null,
      travelRatio: teamTravelList.length > 0 ?
        teamTravelList[0].distance / (teamTravelList[teamTravelList.length - 1].distance || 1) : 0,
      teamDistances
    };
  }
  
  /**
   * Analyze home/away balance
   * @param {Object} schedule - Schedule to analyze
   * @returns {Object} Home/away balance analysis
   * @private
   */
  _analyzeHomeAwayBalance(schedule) {
    // Count home and away games for each team
    const teamGames = {};
    
    for (const team of schedule.teams) {
      teamGames[team.id] = { home: 0, away: 0, total: 0, homeRatio: 0 };
    }
    
    for (const game of schedule.games) {
      teamGames[game.homeTeam.id].home++;
      teamGames[game.homeTeam.id].total++;
      
      teamGames[game.awayTeam.id].away++;
      teamGames[game.awayTeam.id].total++;
    }
    
    // Calculate home ratios and identify imbalances
    const idealRatio = 0.5; // 50% home, 50% away
    let totalImbalance = 0;
    const imbalancedTeams = [];
    
    for (const [teamId, counts] of Object.entries(teamGames)) {
      if (counts.total > 0) {
        counts.homeRatio = counts.home / counts.total;
        
        const imbalance = Math.abs(counts.homeRatio - idealRatio);
        totalImbalance += imbalance;
        
        if (imbalance > 0.1) { // More than 10% off from ideal
          imbalancedTeams.push({
            teamId,
            homeGames: counts.home,
            awayGames: counts.away,
            homeRatio: counts.homeRatio,
            imbalance
          });
        }
      }
    }
    
    // Sort imbalanced teams by degree of imbalance
    imbalancedTeams.sort((a, b) => b.imbalance - a.imbalance);
    
    return {
      averageHomeRatio: schedule.teams.length > 0 ?
        Object.values(teamGames).reduce((sum, t) => sum + t.homeRatio, 0) / schedule.teams.length :
        0,
      imbalanceScore: schedule.teams.length > 0 ?
        totalImbalance / schedule.teams.length :
        0,
      imbalancedTeamCount: imbalancedTeams.length,
      mostImbalancedTeams: imbalancedTeams.slice(0, 5),
      homeAwayData: teamGames
    };
  }
  
  /**
   * Analyze schedule patterns
   * @param {Object} schedule - Schedule to analyze
   * @returns {Object} Pattern analysis
   * @private
   */
  _analyzeSchedulePatterns(schedule) {
    // Group games by team
    const teamGames = {};
    
    for (const team of schedule.teams) {
      teamGames[team.id] = [];
    }
    
    for (const game of schedule.games) {
      teamGames[game.homeTeam.id].push({
        opponent: game.awayTeam.id,
        venue: game.venue,
        date: new Date(game.date),
        isHome: true
      });
      
      teamGames[game.awayTeam.id].push({
        opponent: game.homeTeam.id,
        venue: game.venue,
        date: new Date(game.date),
        isHome: false
      });
    }
    
    // Find consecutive games (back-to-back)
    const backToBackGames = {};
    
    for (const [teamId, games] of Object.entries(teamGames)) {
      // Sort games by date
      games.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      let backToBackCount = 0;
      let backToBackHomeCount = 0;
      let backToBackAwayCount = 0;
      const backToBackDates = [];
      
      // Check each consecutive pair of games
      for (let i = 1; i < games.length; i++) {
        const prevGame = games[i - 1];
        const currGame = games[i];
        
        // Calculate days between games
        const daysBetween = Math.floor(
          (currGame.date.getTime() - prevGame.date.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysBetween <= 1) {
          backToBackCount++;
          
          if (prevGame.isHome && currGame.isHome) {
            backToBackHomeCount++;
          } else if (!prevGame.isHome && !currGame.isHome) {
            backToBackAwayCount++;
          }
          
          backToBackDates.push({
            first: prevGame.date.toISOString().split('T')[0],
            second: currGame.date.toISOString().split('T')[0]
          });
        }
      }
      
      backToBackGames[teamId] = {
        count: backToBackCount,
        homeCount: backToBackHomeCount,
        awayCount: backToBackAwayCount,
        dates: backToBackDates
      };
    }
    
    // Find longest home and away streaks
    const streaks = {};
    
    for (const [teamId, games] of Object.entries(teamGames)) {
      let currentHomeStreak = 0;
      let currentAwayStreak = 0;
      let maxHomeStreak = 0;
      let maxAwayStreak = 0;
      
      for (const game of games) {
        if (game.isHome) {
          currentHomeStreak++;
          currentAwayStreak = 0;
          maxHomeStreak = Math.max(maxHomeStreak, currentHomeStreak);
        } else {
          currentAwayStreak++;
          currentHomeStreak = 0;
          maxAwayStreak = Math.max(maxAwayStreak, currentAwayStreak);
        }
      }
      
      streaks[teamId] = {
        maxHomeStreak,
        maxAwayStreak
      };
    }
    
    // Analyze weekend vs weekday distribution
    const weekendDistribution = {};
    
    for (const [teamId, games] of Object.entries(teamGames)) {
      let weekendGames = 0;
      let weekdayGames = 0;
      
      for (const game of games) {
        const dayOfWeek = game.date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          weekendGames++;
        } else {
          weekdayGames++;
        }
      }
      
      weekendDistribution[teamId] = {
        weekendGames,
        weekdayGames,
        weekendRatio: games.length > 0 ? weekendGames / games.length : 0
      };
    }
    
    return {
      backToBackGames,
      streaks,
      weekendDistribution,
      teamPatterns: this._analyzeTeamPatterns(teamGames)
    };
  }
  
  /**
   * Analyze team patterns
   * @param {Object} teamGames - Games grouped by team
   * @returns {Object} Team pattern analysis
   * @private
   */
  _analyzeTeamPatterns(teamGames) {
    const patterns = {};
    
    for (const [teamId, games] of Object.entries(teamGames)) {
      // Skip teams with too few games
      if (games.length < 4) continue;
      
      // Sort games by date
      games.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Check home/away pattern
      const homeAwayPattern = games.map(g => g.isHome ? 'H' : 'A').join('');
      
      // Check if there are repeating patterns
      const repeatingPattern = this._findRepeatingPattern(homeAwayPattern);
      
      // Check rest days between games
      const restDays = [];
      
      for (let i = 1; i < games.length; i++) {
        const daysBetween = Math.floor(
          (games[i].date.getTime() - games[i - 1].date.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        restDays.push(daysBetween);
      }
      
      // Store pattern analysis
      patterns[teamId] = {
        homeAwayPattern,
        hasRepeatingPattern: repeatingPattern !== null,
        repeatingPattern,
        restDays,
        avgRestDays: restDays.length > 0 ? 
          restDays.reduce((sum, days) => sum + days, 0) / restDays.length : 0,
        minRestDays: restDays.length > 0 ? Math.min(...restDays) : 0,
        consecutiveGamesCount: restDays.filter(days => days === 0).length
      };
    }
    
    return patterns;
  }
  
  /**
   * Find repeating pattern in string
   * @param {string} str - String to check
   * @returns {string|null} Repeating pattern or null
   * @private
   */
  _findRepeatingPattern(str) {
    for (let i = 2; i <= str.length / 2; i++) {
      const pattern = str.substring(0, i);
      let matches = 0;
      
      for (let j = 0; j < str.length; j += i) {
        if (str.substring(j, j + i) === pattern) {
          matches++;
        }
      }
      
      if (matches > 1 && matches * i >= str.length * 0.5) {
        return pattern;
      }
    }
    
    return null;
  }
  
  /**
   * Perform sport-specific analysis
   * @param {Object} schedule - Schedule to analyze
   * @param {Object} sportAnalyzer - Sport-specific analyzer
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Sport-specific analysis
   * @private
   */
  async _performSportSpecificAnalysis(schedule, sportAnalyzer, options) {
    if (!sportAnalyzer) {
      return {
        message: `No sport-specific analyzer available for ${schedule.sport}`
      };
    }
    
    return await sportAnalyzer.analyzeSchedule(schedule, options);
  }
  
  /**
   * Generate AI insights
   * @param {Object} schedule - Schedule to analyze
   * @param {Object} analysisSoFar - Analysis data
   * @returns {Promise<Object>} AI insights
   * @private
   */
  async _generateAIInsights(schedule, analysisSoFar) {
    try {
      // Prepare simplified schedule data
      const scheduleData = {
        id: schedule.id,
        sport: schedule.sport,
        teams: schedule.teams.map(t => t.name || t.id),
        gameCount: schedule.games.length,
        startDate: schedule.startDate,
        endDate: schedule.endDate
      };
      
      // Prepare analysis data
      const analysisData = {
        basic: analysisSoFar.basic,
        travel: analysisSoFar.travel ? {
          totalDistance: analysisSoFar.travel.totalDistance,
          averagePerTeam: analysisSoFar.travel.averagePerTeam,
          mostTravel: analysisSoFar.travel.mostTravel,
          leastTravel: analysisSoFar.travel.leastTravel
        } : null,
        balance: analysisSoFar.balance ? {
          imbalanceScore: analysisSoFar.balance.imbalanceScore,
          imbalancedTeamCount: analysisSoFar.balance.imbalancedTeamCount
        } : null,
        constraints: analysisSoFar.constraints ? {
          hardConstraintViolations: analysisSoFar.constraints.hardConstraintViolations,
          violationCount: analysisSoFar.constraints.violationCount
        } : null,
        patterns: analysisSoFar.patterns ? {
          backToBackCount: Object.values(analysisSoFar.patterns.backToBackGames)
            .reduce((sum, data) => sum + data.count, 0)
        } : null
      };
      
      // Prepare context
      const context = {
        schedule: scheduleData,
        analysis: analysisData
      };
      
      // Prepare prompt
      const prompt = `
        As a sports scheduling expert, analyze this ${schedule.sport} schedule:
        
        - ${schedule.teams.length} teams
        - ${schedule.games.length} games
        - Season: ${schedule.startDate} to ${schedule.endDate}
        
        Based on the analysis data provided, please:
        
        1. Identify 3-5 key strengths of this schedule
        2. Identify 3-5 areas that could be improved
        3. Provide specific, actionable recommendations
        4. Highlight any unusual patterns or anomalies
        
        Keep your response concise and focused on the most significant insights.
        
        Return your analysis in this JSON format:
        {
          "strengths": ["Strength 1", "Strength 2", ...],
          "improvementAreas": ["Area 1", "Area 2", ...],
          "recommendations": ["Recommendation 1", "Recommendation 2", ...],
          "anomalies": ["Anomaly 1", "Anomaly 2", ...],
          "summary": "Brief overall assessment"
        }
      `;
      
      // Send request to MCP server
      const model = schedule.teams.length > 20 ? 'claude-3-opus-20240229' : 'claude-3-haiku-20240307';
      const response = await this.mcpConnector.sendRequest(
        model,
        prompt,
        context,
        `schedule_analysis_${schedule.id}`
      );
      
      // Parse response
      try {
        // Extract JSON from response
        const jsonMatch = response.content.match(/```json\n([\s\S]*?)\n```/) || 
                          response.content.match(/{[\s\S]*}/);
        
        if (jsonMatch) {
          const jsonString = jsonMatch[1] || jsonMatch[0];
          return JSON.parse(jsonString);
        }
        
        // Fallback to simple format
        return {
          summary: response.content,
          analysisModel: model,
          raw: response.content
        };
      } catch (error) {
        logger.error('Error parsing AI response:', error);
        return {
          summary: response.content,
          analysisModel: model,
          error: error.message
        };
      }
    } catch (error) {
      logger.error('Error generating AI insights:', error);
      return {
        error: `Failed to generate AI insights: ${error.message}`
      };
    }
  }
  
  /**
   * Get sport-specific analyzer
   * @param {string} sport - Sport type
   * @returns {Promise<Object>} Sport-specific analyzer
   * @private
   */
  async _getSportAnalyzer(sport) {
    if (!sport) return null;
    
    // Convert sport name to lowercase for consistency
    const sportLower = sport.toLowerCase();
    
    // Return from cache if already loaded
    if (this.sportAnalyzers[sportLower]) {
      return this.sportAnalyzers[sportLower];
    }
    
    try {
      // Try to dynamically load sport-specific analyzer
      let SportAnalyzerClass;
      
      switch (sportLower) {
        case 'basketball':
          // This is where you'd import the BasketballScheduleAnalyzer
          // const BasketballScheduleAnalyzer = require('...');
          // SportAnalyzerClass = BasketballScheduleAnalyzer;
          return null;
        case 'football':
          // const FootballScheduleAnalyzer = require('...');
          // SportAnalyzerClass = FootballScheduleAnalyzer;
          return null;
        case 'baseball':
          // const BaseballScheduleAnalyzer = require('...');
          // SportAnalyzerClass = BaseballScheduleAnalyzer;
          return null;
        default:
          return null;
      }
      
      // Create instance and cache it
      if (SportAnalyzerClass) {
        const analyzer = new SportAnalyzerClass();
        this.sportAnalyzers[sportLower] = analyzer;
        return analyzer;
      }
    } catch (error) {
      logger.warn(`Failed to load ${sport} analyzer: ${error.message}`);
    }
    
    return null;
  }
  
  /**
   * Calculate distance between two locations
   * @param {Object} loc1 - First location
   * @param {Object} loc2 - Second location
   * @returns {number} Distance in miles
   * @private
   */
  _calculateDistance(loc1, loc2) {
    // Implementation of haversine formula
    const R = 3958.8; // Earth radius in miles
    
    const lat1 = loc1.latitude * Math.PI / 180;
    const lat2 = loc2.latitude * Math.PI / 180;
    const deltaLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const deltaLng = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }
}

module.exports = EnhancedScheduleAnalysisAgent;