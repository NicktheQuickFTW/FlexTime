/**
 * Universal Alternating Venue Constraint for All Sports
 * 
 * Ensures that single-game trips alternate venues between consecutive seasons.
 * If a team has a road trip to a single opponent one year, the next year 
 * the single competition would be at home.
 * 
 * This constraint applies to all Big 12 sports where teams may play 
 * single games against some opponents.
 */

const logger = require("../../utils/logger");

class UniversalAlternatingVenueConstraint {
  constructor() {
    this.name = 'Universal Alternating Venue Constraint';
    this.version = '1.0';
    this.type = 'SINGLE_GAME_ALTERNATING_VENUE';
    this.hardness = 'hard';
    this.category = 'fairness';
    this.weight = 85;
    this.description = 'Single-game trips must alternate venues between consecutive seasons';
  }

  /**
   * Generate the alternating venue constraint for any sport
   * @param {Object} parameters - Configuration parameters
   * @returns {Object} Constraint configuration
   */
  generateConstraint(parameters = {}) {
    const sport = parameters.sport || 'generic';
    const gender = parameters.gender || null;
    const constraintId = gender ? 
      `${gender}_${sport}_single_game_alternating_venue` : 
      `${sport}_single_game_alternating_venue`;

    return {
      id: constraintId,
      type: this.type,
      hardness: this.hardness,
      category: this.category,
      weight: this.weight,
      description: this.description,
      sport,
      gender,
      parameters: {
        requireAlternating: true,
        lookbackSeasons: 1,
        scope: 'conference_only',
        sport,
        gender,
        ...parameters
      },
      evaluation: (schedule, previousSeasonSchedule) => 
        this.evaluateAlternatingVenue(schedule, previousSeasonSchedule, { sport, gender }),
      violation: 'high'
    };
  }

  /**
   * Evaluate the alternating venue constraint
   * @param {Array} schedule - Current season schedule
   * @param {Array} previousSeasonSchedule - Previous season schedule
   * @param {Object} context - Additional context (sport, gender, etc.)
   * @returns {Object} Evaluation result
   */
  evaluateAlternatingVenue(schedule, previousSeasonSchedule, context = {}) {
    if (!previousSeasonSchedule || !Array.isArray(previousSeasonSchedule)) {
      // If no previous season data, constraint is satisfied by default
      return {
        satisfied: true,
        score: 1.0,
        details: { 
          message: 'No previous season data available',
          context
        }
      };
    }

    // Get all conference teams
    const teams = new Set();
    schedule.filter(game => game.isConference).forEach(game => {
      teams.add(game.homeTeam);
      teams.add(game.awayTeam);
    });

    let violations = 0;
    const violationDetails = [];

    for (const team of teams) {
      // Find single-game opponents from previous season
      const previousOpponents = this.findSingleGameOpponents(previousSeasonSchedule, team);
      
      // Check current season single-game opponents
      const currentOpponents = this.findSingleGameOpponents(schedule, team);
      
      for (const [opponent, prevVenue] of previousOpponents) {
        if (currentOpponents.has(opponent)) {
          // Same opponent appears as single-game in both seasons
          const currVenue = currentOpponents.get(opponent);
          
          // Check if venue alternated
          if (prevVenue === currVenue) {
            violations++;
            violationDetails.push({
              team,
              opponent,
              previousVenue: prevVenue,
              currentVenue: currVenue,
              sport: context.sport,
              gender: context.gender,
              message: `${team} vs ${opponent} repeated same venue (${currVenue}) in consecutive seasons`
            });

            logger.warn(`Alternating venue violation detected`, {
              sport: context.sport,
              gender: context.gender,
              team,
              opponent,
              venue: currVenue,
              violation: 'repeated_venue'
            });
          }
        }
      }
    }

    const satisfied = violations === 0;
    const score = satisfied ? 1.0 : Math.max(0, 1.0 - violations * 0.2);

    if (!satisfied) {
      logger.info(`Alternating venue constraint evaluation completed`, {
        sport: context.sport,
        gender: context.gender,
        violations,
        score,
        satisfied
      });
    }

    return {
      satisfied,
      score,
      details: {
        violations,
        violationDetails,
        sport: context.sport,
        gender: context.gender,
        rule: 'single_game_alternating_venue',
        description: 'Teams with single-game matchups must alternate home/away venues between seasons'
      }
    };
  }

  /**
   * Find opponents that a team plays only once (single-game trips)
   * @param {Array} schedule - Season schedule
   * @param {string} team - Team name
   * @returns {Map} Map of opponent -> venue ('home' or 'away')
   */
  findSingleGameOpponents(schedule, team) {
    const opponents = new Map();
    
    // Count games against each opponent
    schedule.filter(game => 
      (game.homeTeam === team || game.awayTeam === team) && game.isConference
    ).forEach(game => {
      const opponent = game.homeTeam === team ? game.awayTeam : game.homeTeam;
      const venue = game.homeTeam === team ? 'home' : 'away';
      
      if (opponents.has(opponent)) {
        // Multiple games against this opponent, not a single-game trip
        opponents.delete(opponent);
      } else {
        opponents.set(opponent, venue);
      }
    });

    return opponents;
  }

  /**
   * Generate recommendations for fixing alternating venue violations
   * @param {Object} evaluationResult - Result from evaluateAlternatingVenue
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(evaluationResult) {
    const recommendations = [];

    if (!evaluationResult.satisfied && evaluationResult.details.violationDetails) {
      for (const violation of evaluationResult.details.violationDetails) {
        const oppositeVenue = violation.currentVenue === 'home' ? 'away' : 'home';
        
        recommendations.push({
          type: 'venue_swap',
          priority: 'high',
          team: violation.team,
          opponent: violation.opponent,
          currentVenue: violation.currentVenue,
          recommendedVenue: oppositeVenue,
          reason: `${violation.team} played ${violation.opponent} at ${violation.previousVenue} last season, should be ${oppositeVenue} this season`,
          sport: violation.sport,
          gender: violation.gender
        });
      }
    }

    return recommendations;
  }

  /**
   * Validate constraint parameters
   * @param {Object} parameters - Constraint parameters
   * @returns {Object} Validation result
   */
  validateParameters(parameters) {
    const errors = [];
    const warnings = [];

    if (parameters.lookbackSeasons && typeof parameters.lookbackSeasons !== 'number') {
      errors.push('lookbackSeasons must be a number');
    }

    if (parameters.lookbackSeasons && parameters.lookbackSeasons < 1) {
      warnings.push('lookbackSeasons should be at least 1 for meaningful constraint enforcement');
    }

    if (parameters.scope && !['conference_only', 'all_games'].includes(parameters.scope)) {
      warnings.push('scope should be either "conference_only" or "all_games"');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get constraint metadata
   * @returns {Object} Constraint metadata
   */
  getMetadata() {
    return {
      name: this.name,
      version: this.version,
      type: this.type,
      hardness: this.hardness,
      category: this.category,
      weight: this.weight,
      description: this.description,
      applicableSports: ['football', 'basketball', 'baseball', 'softball', 'soccer', 'volleyball', 'all'],
      parameters: {
        required: [],
        optional: ['sport', 'gender', 'lookbackSeasons', 'scope']
      },
      examples: [
        {
          scenario: 'Football single-game scheduling',
          description: 'In a 9-game football season, if Team A played at Team B last year, this year Team B must visit Team A'
        },
        {
          scenario: 'Basketball play-once opponents',
          description: 'In basketball where some opponents are played twice and others once, single-game opponents must alternate venues'
        }
      ]
    };
  }
}

module.exports = UniversalAlternatingVenueConstraint;