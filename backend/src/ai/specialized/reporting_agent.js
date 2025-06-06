/**
 * Reporting Agent for the FlexTime multi-agent system.
 * 
 * This specialized agent generates reports about schedules and their analysis
 * to provide insights and documentation for users.
 */

const Agent = require('../agent');
const logger = require("../../lib/logger");;

/**
 * Specialized agent for generating reports about schedules.
 */
class ReportingAgent extends Agent {
  /**
   * Initialize a new Reporting Agent.
   * 
   * @param {object} mcpConnector - MCP server connector
   */
  constructor(mcpConnector) {
    super('reporting', 'specialized', mcpConnector);
    logger.info('Reporting Agent initialized');
  }
  
  /**
   * Process a task to generate a report.
   * 
   * @param {object} task - The task to process
   * @returns {Promise<object>} Generated report
   * @private
   */
  async _processTask(task) {
    logger.info(`Reporting Agent processing task: ${task.taskId}`);
    
    const { data, options = {} } = task.parameters;
    const reportType = options.type || 'summary';
    
    try {
      let reportContent;
      
      switch (reportType) {
        case 'summary':
          reportContent = this._generateSummaryReport(data, options);
          break;
        case 'detailed':
          reportContent = this._generateDetailedReport(data, options);
          break;
        case 'comparison':
          reportContent = this._generateComparisonReport(data, options);
          break;
        default:
          throw new Error(`Unsupported report type: ${reportType}`);
      }
      
      return {
        type: reportType,
        content: reportContent,
        format: options.format || 'json',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error generating report: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate a summary report.
   * 
   * @param {object} data - Data to include in the report
   * @param {object} options - Report options
   * @returns {object} Report content
   * @private
   */
  _generateSummaryReport(data, options) {
    // Extract schedule and metrics if available
    const schedule = data.schedule || data;
    const metrics = data.metrics || {};
    
    // Create report sections
    const sections = [
      this._createOverviewSection(schedule),
      this._createMetricsSection(metrics),
      this._createRecommendationsSection(data.recommendations || [])
    ];
    
    return {
      title: 'Schedule Summary Report',
      description: 'A brief overview of the schedule and its quality metrics',
      sections: sections,
      options: options
    };
  }
  
  /**
   * Generate a detailed report.
   * 
   * @param {object} data - Data to include in the report
   * @param {object} options - Report options
   * @returns {object} Report content
   * @private
   */
  _generateDetailedReport(data, options) {
    // Extract schedule and metrics if available
    const schedule = data.schedule || data;
    const metrics = data.metrics || {};
    
    // Create report sections
    const sections = [
      this._createOverviewSection(schedule),
      this._createMetricsSection(metrics),
      this._createTeamSchedulesSection(schedule),
      this._createVenueUsageSection(schedule),
      this._createConstraintAnalysisSection(schedule),
      this._createRecommendationsSection(data.recommendations || [])
    ];
    
    return {
      title: 'Detailed Schedule Report',
      description: 'A comprehensive analysis of the schedule and its properties',
      sections: sections,
      options: options
    };
  }
  
  /**
   * Generate a comparison report.
   * 
   * @param {object} data - Data to include in the report
   * @param {object} options - Report options
   * @returns {object} Report content
   * @private
   */
  _generateComparisonReport(data, options) {
    // Extract schedules to compare
    const schedules = data.schedules || [data];
    
    // Create report sections
    const sections = [
      this._createComparisonOverviewSection(schedules),
      this._createMetricsComparisonSection(schedules),
      this._createKeyDifferencesSection(schedules),
      this._createRecommendationsSection(data.recommendations || [])
    ];
    
    return {
      title: 'Schedule Comparison Report',
      description: 'A comparison of multiple schedule options',
      sections: sections,
      options: options
    };
  }
  
  /**
   * Create an overview section for a report.
   * 
   * @param {object} schedule - Schedule data
   * @returns {object} Report section
   * @private
   */
  _createOverviewSection(schedule) {
    // Format team names according to Big 12 naming conventions
    const teams = this._formatTeamNames(schedule.teams || []);
    
    return {
      title: 'Overview',
      content: {
        name: schedule.name || 'Unnamed Schedule',
        description: schedule.description || 'No description provided',
        teams: teams,
        venues: schedule.venues || [],
        gameCount: (schedule.games || []).length,
        dateRange: this._calculateDateRange(schedule.games || [])
      }
    };
  }
  
  /**
   * Create a metrics section for a report.
   * 
   * @param {object} metrics - Metrics data
   * @returns {object} Report section
   * @private
   */
  _createMetricsSection(metrics) {
    return {
      title: 'Quality Metrics',
      content: {
        overallQuality: metrics.overallQuality || 'N/A',
        travelDistance: metrics.travelDistance || 'N/A',
        homeAwayBalance: metrics.homeAwayBalance || 'N/A',
        restPeriods: metrics.restPeriods || 'N/A',
        constraintSatisfaction: metrics.constraintSatisfaction || 'N/A'
      }
    };
  }
  
  /**
   * Create a team schedules section for a report.
   * 
   * @param {object} schedule - Schedule data
   * @returns {object} Report section
   * @private
   */
  _createTeamSchedulesSection(schedule) {
    const teamSchedules = {};
    const teams = schedule.teams || [];
    const games = schedule.games || [];
    
    // Group games by team
    for (const team of teams) {
      const teamId = team.id;
      teamSchedules[teamId] = {
        team: this._formatTeamName(team),
        homeGames: [],
        awayGames: [],
        totalGames: 0
      };
    }
    
    // Populate team schedules
    for (const game of games) {
      const homeTeamId = game.homeTeamId;
      const awayTeamId = game.awayTeamId;
      
      if (teamSchedules[homeTeamId]) {
        teamSchedules[homeTeamId].homeGames.push(game);
        teamSchedules[homeTeamId].totalGames++;
      }
      
      if (teamSchedules[awayTeamId]) {
        teamSchedules[awayTeamId].awayGames.push(game);
        teamSchedules[awayTeamId].totalGames++;
      }
    }
    
    return {
      title: 'Team Schedules',
      content: teamSchedules
    };
  }
  
  /**
   * Create a venue usage section for a report.
   * 
   * @param {object} schedule - Schedule data
   * @returns {object} Report section
   * @private
   */
  _createVenueUsageSection(schedule) {
    const venueUsage = {};
    const venues = schedule.venues || [];
    const games = schedule.games || [];
    
    // Initialize venue usage
    for (const venue of venues) {
      const venueId = venue.id;
      venueUsage[venueId] = {
        venue: venue,
        games: [],
        totalGames: 0
      };
    }
    
    // Populate venue usage
    for (const game of games) {
      const venueId = game.venueId;
      
      if (venueUsage[venueId]) {
        venueUsage[venueId].games.push(game);
        venueUsage[venueId].totalGames++;
      }
    }
    
    return {
      title: 'Venue Usage',
      content: venueUsage
    };
  }
  
  /**
   * Create a constraint analysis section for a report.
   * 
   * @param {object} schedule - Schedule data
   * @returns {object} Report section
   * @private
   */
  _createConstraintAnalysisSection(schedule) {
    const constraints = schedule.constraints || [];
    const constraintAnalysis = {
      total: constraints.length,
      satisfied: 0,
      violated: 0,
      byCategory: {}
    };
    
    // Count satisfied and violated constraints
    for (const constraint of constraints) {
      const category = constraint.category || 'Uncategorized';
      
      // Initialize category if not exists
      if (!constraintAnalysis.byCategory[category]) {
        constraintAnalysis.byCategory[category] = {
          total: 0,
          satisfied: 0,
          violated: 0
        };
      }
      
      // Update counts
      constraintAnalysis.byCategory[category].total++;
      
      if (constraint.satisfied) {
        constraintAnalysis.satisfied++;
        constraintAnalysis.byCategory[category].satisfied++;
      } else {
        constraintAnalysis.violated++;
        constraintAnalysis.byCategory[category].violated++;
      }
    }
    
    return {
      title: 'Constraint Analysis',
      content: constraintAnalysis
    };
  }
  
  /**
   * Create a recommendations section for a report.
   * 
   * @param {Array<string>} recommendations - List of recommendations
   * @returns {object} Report section
   * @private
   */
  _createRecommendationsSection(recommendations) {
    // Add default recommendations if none provided
    if (!recommendations || recommendations.length === 0) {
      recommendations = [
        'Ensure proper handling of TCU, UCF, and BYU abbreviations in all schedule outputs.',
        'Verify that University of Arizona and Arizona State University are correctly included in the schedule.'
      ];
    }
    
    return {
      title: 'Recommendations',
      content: recommendations
    };
  }
  
  /**
   * Create a comparison overview section for a report.
   * 
   * @param {Array<object>} schedules - Schedules to compare
   * @returns {object} Report section
   * @private
   */
  _createComparisonOverviewSection(schedules) {
    const overview = schedules.map((schedule, index) => {
      return {
        id: index + 1,
        name: schedule.name || `Schedule Option ${index + 1}`,
        description: schedule.description || 'No description provided',
        teamCount: (schedule.teams || []).length,
        gameCount: (schedule.games || []).length,
        dateRange: this._calculateDateRange(schedule.games || [])
      };
    });
    
    return {
      title: 'Comparison Overview',
      content: overview
    };
  }
  
  /**
   * Create a metrics comparison section for a report.
   * 
   * @param {Array<object>} schedules - Schedules to compare
   * @returns {object} Report section
   * @private
   */
  _createMetricsComparisonSection(schedules) {
    const metricsComparison = schedules.map((schedule, index) => {
      const metrics = schedule.metrics || {};
      
      return {
        id: index + 1,
        name: schedule.name || `Schedule Option ${index + 1}`,
        metrics: {
          overallQuality: metrics.overallQuality || 'N/A',
          travelDistance: metrics.travelDistance || 'N/A',
          homeAwayBalance: metrics.homeAwayBalance || 'N/A',
          restPeriods: metrics.restPeriods || 'N/A',
          constraintSatisfaction: metrics.constraintSatisfaction || 'N/A'
        }
      };
    });
    
    return {
      title: 'Metrics Comparison',
      content: metricsComparison
    };
  }
  
  /**
   * Create a key differences section for a report.
   * 
   * @param {Array<object>} schedules - Schedules to compare
   * @returns {object} Report section
   * @private
   */
  _createKeyDifferencesSection(schedules) {
    // In a real implementation, this would identify and highlight
    // key differences between the schedules
    
    return {
      title: 'Key Differences',
      content: [
        'Different game assignments for key matchups',
        'Variations in travel patterns',
        'Different handling of constraint priorities'
      ]
    };
  }
  
  /**
   * Format team names according to Big 12 naming conventions.
   * 
   * @param {Array<object>} teams - List of teams
   * @returns {Array<object>} Formatted team list
   * @private
   */
  _formatTeamNames(teams) {
    return teams.map(team => this._formatTeamName(team));
  }
  
  /**
   * Format a single team name according to Big 12 naming conventions.
   * 
   * @param {object} team - Team object
   * @returns {object} Formatted team object
   * @private
   */
  _formatTeamName(team) {
    const formattedTeam = { ...team };
    const name = team.name || '';
    
    // Apply Big 12 naming conventions
    if (name.includes('Texas Christian University')) {
      formattedTeam.name = 'TCU';
    } else if (name.includes('University of Central Florida')) {
      formattedTeam.name = 'UCF';
    } else if (name.includes('Brigham Young University')) {
      formattedTeam.name = 'BYU';
    }
    
    // Replace University of Texas and University of Oklahoma
    if (name.includes('University of Texas')) {
      formattedTeam.name = 'University of Arizona';
    } else if (name.includes('University of Oklahoma')) {
      formattedTeam.name = 'Arizona State University';
    }
    
    return formattedTeam;
  }
  
  /**
   * Calculate the date range for a list of games.
   * 
   * @param {Array<object>} games - List of games
   * @returns {object} Date range with start and end dates
   * @private
   */
  _calculateDateRange(games) {
    if (!games || games.length === 0) {
      return { start: 'N/A', end: 'N/A' };
    }
    
    let startDate = new Date(games[0].date);
    let endDate = new Date(games[0].date);
    
    for (const game of games) {
      const gameDate = new Date(game.date);
      
      if (gameDate < startDate) {
        startDate = gameDate;
      }
      
      if (gameDate > endDate) {
        endDate = gameDate;
      }
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  }
}

module.exports = ReportingAgent;
