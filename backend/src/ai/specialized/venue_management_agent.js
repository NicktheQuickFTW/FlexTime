/**
 * Venue Management Agent for the FlexTime multi-agent system.
 * 
 * This specialized agent is responsible for managing venue information,
 * availability, and selection for sports schedules.
 */

const Agent = require('../agent');
const logger = require("../../lib/logger");;

/**
 * Specialized agent for venue management.
 */
class VenueManagementAgent extends Agent {
  /**
   * Initialize a new Venue Management Agent.
   * 
   * @param {object} mcpConnector - MCP server connector
   */
  constructor(mcpConnector) {
    super('venue_management', 'specialized', mcpConnector);
    
    // Venue evaluation criteria
    this.evaluationCriteria = {
      'capacity': {
        description: 'Seating capacity of the venue',
        weight: 0.8
      },
      'facilities': {
        description: 'Quality and availability of facilities',
        weight: 0.7
      },
      'accessibility': {
        description: 'Transportation access and parking',
        weight: 0.6
      },
      'cost': {
        description: 'Rental and operational costs',
        weight: 0.9
      },
      'availability': {
        description: 'Available dates and flexibility',
        weight: 1.0
      },
      'broadcast_suitability': {
        description: 'Suitability for broadcast requirements',
        weight: 0.7
      },
      'previous_experience': {
        description: 'Past experience with the venue',
        weight: 0.5
      }
    };
    
    // Sport-specific venue requirements
    this.sportRequirements = {
      'football': {
        minimumCapacity: 15000,
        fieldDimensions: '120x53.3 yards',
        requiredFacilities: ['locker rooms', 'press box', 'replay booth'],
        priorityCriteria: ['capacity', 'broadcast_suitability', 'accessibility']
      },
      'basketball': {
        minimumCapacity: 5000,
        courtDimensions: '94x50 feet',
        requiredFacilities: ['locker rooms', 'scoreboard', 'shot clocks'],
        priorityCriteria: ['facilities', 'capacity', 'broadcast_suitability']
      },
      // Additional sport requirements would be defined here
    };
    
    logger.info('Venue Management Agent initialized');
  }
  
  /**
   * Process a task related to venue management.
   * 
   * @param {object} task - The task to process
   * @returns {Promise<object>} Task result
   * @private
   */
  async _processTask(task) {
    logger.info(`Venue Management Agent processing task: ${task.description}`);
    
    const taskType = task.taskType;
    const sportType = task.parameters.sportType;
    const venues = task.parameters.venues || [];
    const schedule = task.parameters.schedule;
    const criteria = task.parameters.criteria || {};
    
    // Use MCP for venue analysis if available
    if (taskType === 'analyze_venues' && this.mcpConnector) {
      try {
        const venueAnalysis = await this._getAIVenueAnalysis(sportType, venues, criteria);
        return venueAnalysis;
      } catch (error) {
        logger.warning(`Failed to get AI venue analysis: ${error.message}`);
        // Fall back to rule-based analysis
      }
    }
    
    // Handle different task types
    switch (taskType) {
      case 'evaluate_venues':
        return this._evaluateVenues(sportType, venues, criteria);
      
      case 'assign_venues':
        return this._assignVenuesToSchedule(sportType, schedule, venues);
      
      case 'check_availability':
        return this._checkVenueAvailability(venues, task.parameters.dateRange);
      
      case 'recommend_venues':
        return this._recommendVenues(sportType, venues, criteria);
      
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }
  
  /**
   * Evaluate venues based on sport requirements and criteria.
   * 
   * @param {string} sportType - Type of sport
   * @param {Array<object>} venues - List of venues to evaluate
   * @param {object} criteria - Custom evaluation criteria
   * @returns {object} Venue evaluation results
   * @private
   */
  _evaluateVenues(sportType, venues, criteria) {
    // Get sport-specific requirements
    const requirements = this.sportRequirements[sportType.toLowerCase()] || {
      minimumCapacity: 1000,
      requiredFacilities: ['locker rooms'],
      priorityCriteria: ['availability', 'cost']
    };
    
    // Merge default and custom criteria
    const mergedCriteria = { ...this.evaluationCriteria };
    
    // Update weights based on custom criteria
    if (criteria.weights) {
      Object.entries(criteria.weights).forEach(([criterion, weight]) => {
        if (mergedCriteria[criterion]) {
          mergedCriteria[criterion].weight = weight;
        }
      });
    }
    
    // Evaluate each venue
    const evaluatedVenues = venues.map(venue => {
      // Check if venue meets minimum requirements
      const meetsMinimumRequirements = this._checkMinimumRequirements(venue, requirements);
      
      // Calculate scores for each criterion
      const criteriaScores = {};
      let totalScore = 0;
      let totalWeight = 0;
      
      Object.entries(mergedCriteria).forEach(([criterion, details]) => {
        const score = this._evaluateCriterion(venue, criterion, requirements);
        criteriaScores[criterion] = {
          score,
          weight: details.weight
        };
        
        totalScore += score * details.weight;
        totalWeight += details.weight;
      });
      
      // Calculate weighted average score
      const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;
      
      return {
        venueId: venue.id,
        venueName: venue.name,
        meetsMinimumRequirements,
        criteriaScores,
        overallScore,
        suitable: meetsMinimumRequirements && overallScore >= 0.7
      };
    });
    
    // Sort venues by overall score
    evaluatedVenues.sort((a, b) => b.overallScore - a.overallScore);
    
    return {
      sport: sportType,
      evaluatedVenues,
      recommendedVenues: evaluatedVenues
        .filter(venue => venue.suitable)
        .map(venue => venue.venueId),
      metadata: {
        evaluationCriteria: Object.keys(mergedCriteria),
        sportRequirements: requirements
      }
    };
  }
  
  /**
   * Assign venues to games in a schedule.
   * 
   * @param {string} sportType - Type of sport
   * @param {object} schedule - Schedule to assign venues to
   * @param {Array<object>} venues - List of available venues
   * @returns {object} Schedule with assigned venues
   * @private
   */
  _assignVenuesToSchedule(sportType, schedule, venues) {
    // Evaluate venues first
    const evaluation = this._evaluateVenues(sportType, venues, {});
    const suitableVenues = evaluation.evaluatedVenues
      .filter(venue => venue.suitable)
      .map(venue => {
        const venueObj = venues.find(v => v.id === venue.venueId);
        return {
          ...venueObj,
          score: venue.overallScore
        };
      });
    
    if (suitableVenues.length === 0) {
      throw new Error('No suitable venues available for assignment');
    }
    
    // Create a mapping of team to home venue
    const teamVenueMap = {};
    
    // Assign primary venues to teams based on team information if available
    schedule.teams.forEach(teamId => {
      const team = typeof teamId === 'object' ? teamId : { id: teamId };
      
      if (team.homeVenueId) {
        const venue = venues.find(v => v.id === team.homeVenueId);
        if (venue) {
          teamVenueMap[team.id] = venue;
        }
      }
    });
    
    // For teams without assigned venues, assign the best available
    schedule.teams.forEach(teamId => {
      const team = typeof teamId === 'object' ? teamId : { id: teamId };
      
      if (!teamVenueMap[team.id]) {
        // Find the best venue for this team
        // In a real implementation, this would consider team location, etc.
        const bestVenue = suitableVenues[0];
        teamVenueMap[team.id] = bestVenue;
      }
    });
    
    // Create a deep copy of the schedule
    const updatedSchedule = JSON.parse(JSON.stringify(schedule));
    
    // Assign venues to each game
    updatedSchedule.rounds.forEach(round => {
      round.games.forEach(game => {
        const homeTeam = game.homeTeam;
        const homeVenue = teamVenueMap[homeTeam];
        
        if (homeVenue) {
          game.venue = {
            id: homeVenue.id,
            name: homeVenue.name
          };
        }
      });
    });
    
    return {
      sport: sportType,
      originalSchedule: schedule,
      updatedSchedule,
      venueAssignments: Object.entries(teamVenueMap).map(([teamId, venue]) => ({
        teamId,
        venueId: venue.id,
        venueName: venue.name
      }))
    };
  }
  
  /**
   * Check availability of venues for a date range.
   * 
   * @param {Array<object>} venues - List of venues to check
   * @param {object} dateRange - Date range to check
   * @returns {object} Venue availability results
   * @private
   */
  _checkVenueAvailability(venues, dateRange) {
    // In a real implementation, this would query a database or external system
    // This is a placeholder implementation
    
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    const availabilityResults = venues.map(venue => {
      // Generate some random availability data
      const unavailableDates = [];
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        // 20% chance a date is unavailable
        if (Math.random() < 0.2) {
          unavailableDates.push(new Date(currentDate).toISOString().split('T')[0]);
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return {
        venueId: venue.id,
        venueName: venue.name,
        unavailableDates,
        fullyAvailable: unavailableDates.length === 0,
        availabilityPercentage: 100 - (unavailableDates.length / ((endDate - startDate) / (24 * 60 * 60 * 1000) + 1) * 100)
      };
    });
    
    return {
      dateRange: {
        start: dateRange.start,
        end: dateRange.end
      },
      availabilityResults,
      fullyAvailableVenues: availabilityResults
        .filter(result => result.fullyAvailable)
        .map(result => result.venueId)
    };
  }
  
  /**
   * Recommend venues based on sport requirements and criteria.
   * 
   * @param {string} sportType - Type of sport
   * @param {Array<object>} venues - List of venues to evaluate
   * @param {object} criteria - Custom evaluation criteria
   * @returns {object} Venue recommendations
   * @private
   */
  _recommendVenues(sportType, venues, criteria) {
    // This is similar to evaluate but with more detailed recommendations
    const evaluation = this._evaluateVenues(sportType, venues, criteria);
    
    // Group venues by suitability
    const highlyRecommended = [];
    const recommended = [];
    const conditionallyRecommended = [];
    const notRecommended = [];
    
    evaluation.evaluatedVenues.forEach(venue => {
      if (!venue.meetsMinimumRequirements) {
        notRecommended.push(venue);
      } else if (venue.overallScore >= 0.85) {
        highlyRecommended.push(venue);
      } else if (venue.overallScore >= 0.7) {
        recommended.push(venue);
      } else {
        conditionallyRecommended.push(venue);
      }
    });
    
    return {
      sport: sportType,
      recommendations: {
        highlyRecommended: highlyRecommended.map(v => ({
          venueId: v.venueId,
          venueName: v.venueName,
          score: v.overallScore
        })),
        recommended: recommended.map(v => ({
          venueId: v.venueId,
          venueName: v.venueName,
          score: v.overallScore
        })),
        conditionallyRecommended: conditionallyRecommended.map(v => ({
          venueId: v.venueId,
          venueName: v.venueName,
          score: v.overallScore
        })),
        notRecommended: notRecommended.map(v => ({
          venueId: v.venueId,
          venueName: v.venueName,
          score: v.overallScore,
          reason: 'Does not meet minimum requirements'
        }))
      },
      metadata: {
        evaluationCriteria: Object.keys(this.evaluationCriteria),
        sportRequirements: this.sportRequirements[sportType.toLowerCase()]
      }
    };
  }
  
  /**
   * Get AI-enhanced venue analysis using MCP.
   * 
   * @param {string} sportType - Type of sport
   * @param {Array<object>} venues - List of venues to analyze
   * @param {object} criteria - Custom evaluation criteria
   * @returns {Promise<object>} AI-enhanced venue analysis
   * @private
   */
  async _getAIVenueAnalysis(sportType, venues, criteria) {
    // Prepare context for the AI model
    const context = {
      sportType,
      venues,
      criteria,
      evaluationCriteria: this.evaluationCriteria,
      sportRequirements: this.sportRequirements
    };
    
    // Prepare prompt for the AI model
    const prompt = `
      As an expert in sports venue management, analyze the following venues for ${sportType}:
      
      Venues: ${JSON.stringify(venues.map(v => v.name))}
      
      Based on your expertise and the provided information:
      1. Evaluate each venue's suitability for ${sportType}
      2. Identify strengths and weaknesses of each venue
      3. Recommend optimal venue assignments
      4. Suggest any venue improvements that would enhance suitability
      
      Return your response in JSON format with the following structure:
      {
        "venueAnalysis": [
          {
            "venueId": "venue_id",
            "venueName": "Venue Name",
            "suitabilityScore": 0.85,
            "strengths": ["strength1", "strength2"],
            "weaknesses": ["weakness1", "weakness2"],
            "recommendedImprovements": ["improvement1", "improvement2"]
          }
        ],
        "overallRecommendations": "detailed recommendations for venue selection and assignment"
      }
    `;
    
    // Generate cache key
    const cacheKey = `venue_analysis_${sportType}_${venues.map(v => v.id).join('_')}`;
    
    // Send request to MCP server
    const response = await this.mcpConnector.sendRequest(
      'gpt-4',  // Or other appropriate model
      prompt,
      context,
      cacheKey
    );
    
    // Parse and validate response
    try {
      const result = typeof response.content === 'string' 
        ? JSON.parse(response.content) 
        : response.content;
      
      return {
        sport: sportType,
        aiAnalysis: result,
        metadata: {
          generatedAt: new Date().toISOString(),
          evaluationCriteria: Object.keys(this.evaluationCriteria),
          sportRequirements: this.sportRequirements[sportType.toLowerCase()]
        }
      };
    } catch (error) {
      logger.error(`Failed to parse AI response: ${error.message}`);
      // Fall back to rule-based analysis
      return this._evaluateVenues(sportType, venues, criteria);
    }
  }
  
  // Helper methods
  
  _checkMinimumRequirements(venue, requirements) {
    // Check capacity
    if (requirements.minimumCapacity && venue.capacity < requirements.minimumCapacity) {
      return false;
    }
    
    // Check required facilities
    if (requirements.requiredFacilities && requirements.requiredFacilities.length > 0) {
      if (!venue.facilities) {
        return false;
      }
      
      for (const facility of requirements.requiredFacilities) {
        if (!venue.facilities.includes(facility)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  _evaluateCriterion(venue, criterion, requirements) {
    // This is a placeholder implementation
    // In a real implementation, this would have detailed logic for each criterion
    
    switch (criterion) {
      case 'capacity':
        if (!venue.capacity) return 0;
        if (requirements.minimumCapacity) {
          return Math.min(1, venue.capacity / (requirements.minimumCapacity * 1.5));
        }
        return 0.8;
      
      case 'facilities':
        if (!venue.facilities || venue.facilities.length === 0) return 0;
        if (requirements.requiredFacilities) {
          const requiredCount = requirements.requiredFacilities.length;
          const presentCount = requirements.requiredFacilities.filter(f => 
            venue.facilities.includes(f)
          ).length;
          return presentCount / requiredCount;
        }
        return 0.7;
      
      case 'accessibility':
        return venue.accessibility || 0.6;
      
      case 'cost':
        if (!venue.cost) return 0.5;
        // Lower cost is better
        return 1 - Math.min(1, venue.cost / 10000);
      
      case 'availability':
        return venue.availabilityPercentage ? venue.availabilityPercentage / 100 : 0.8;
      
      case 'broadcast_suitability':
        return venue.broadcastSuitability || 0.7;
      
      case 'previous_experience':
        return venue.previousExperience || 0.5;
      
      default:
        return 0.5;
    }
  }
}

module.exports = VenueManagementAgent;
