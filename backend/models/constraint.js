/**
 * FlexTime Scheduling System - Constraint Model
 * 
 * Represents a scheduling constraint with type, category, and parameters.
 * Constraints can be hard (must be satisfied) or soft (preference with penalty).
 */

const { ConstraintType, ConstraintCategory } = require('./types');

class Constraint {
  /**
   * Create a new Constraint
   * @param {string} id - Unique identifier
   * @param {string} name - Constraint name
   * @param {string} description - Detailed description
   * @param {string} type - ConstraintType (HARD or SOFT)
   * @param {string} category - ConstraintCategory
   * @param {Object} parameters - Additional parameters
   * @param {number} weight - Weight for soft constraints (higher = more important)
   */
  constructor(id, name, description, type, category, parameters = {}, weight = 1.0) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.type = type;
    this.category = category;
    this.parameters = parameters;
    this.weight = weight;
  }

  /**
   * Evaluate constraint against a schedule
   * @param {Schedule} schedule - The schedule to evaluate
   * @returns {Array} [satisfied, penalty] tuple
   */
  evaluate(schedule) {
    // Base class doesn't implement evaluation logic
    // Subclasses should override this method
    throw new Error('Constraint evaluation not implemented');
  }

  /**
   * Create a Constraint from a database record
   * @param {Object} record - Database record
   * @returns {Constraint} Constraint instance
   */
  static fromDatabase(record) {
    return new Constraint(
      record.id,
      record.name,
      record.description,
      record.type,
      record.category,
      record.parameters || {},
      record.weight || 1.0
    );
  }

  /**
   * Convert to a database-friendly object
   * @returns {Object} Database-friendly object
   */
  toDatabase() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      category: this.category,
      parameters: this.parameters,
      weight: this.weight
    };
  }
}

// Create specific constraint types as subclasses

/**
 * Constraint for minimum days of rest between games
 */
class RestDaysConstraint extends Constraint {
  /**
   * Create a new RestDaysConstraint
   * @param {string} id - Unique identifier
   * @param {number} minDays - Minimum days of rest required
   * @param {boolean} isHard - Whether this is a hard constraint
   * @param {number} weight - Weight for soft constraints
   */
  constructor(id, minDays, isHard = true, weight = 1.0) {
    super(
      id,
      `Minimum ${minDays} Rest Days`,
      `Teams must have at least ${minDays} days between games`,
      isHard ? ConstraintType.HARD : ConstraintType.SOFT,
      ConstraintCategory.REST,
      { minDays },
      weight
    );
  }

  /**
   * Evaluate constraint against a schedule
   * @param {Schedule} schedule - The schedule to evaluate
   * @returns {Array} [satisfied, penalty] tuple
   */
  evaluate(schedule) {
    const minDays = this.parameters.minDays;
    let violations = 0;
    
    // Check each team's schedule
    for (const team of schedule.teams) {
      const games = schedule.getTeamGames(team);
      
      // Sort games by date
      games.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Check consecutive games
      for (let i = 1; i < games.length; i++) {
        const daysBetween = (games[i].date.getTime() - games[i-1].date.getTime()) / (1000 * 60 * 60 * 24);
        if (daysBetween < minDays) {
          violations++;
        }
      }
    }
    
    const satisfied = violations === 0;
    const penalty = violations;
    
    return [satisfied, penalty];
  }
}

/**
 * Constraint for maximum consecutive away games
 */
class MaxConsecutiveAwayConstraint extends Constraint {
  /**
   * Create a new MaxConsecutiveAwayConstraint
   * @param {string} id - Unique identifier
   * @param {number} maxGames - Maximum consecutive away games allowed
   * @param {boolean} isHard - Whether this is a hard constraint
   * @param {number} weight - Weight for soft constraints
   */
  constructor(id, maxGames, isHard = false, weight = 1.0) {
    super(
      id,
      `Maximum ${maxGames} Consecutive Away Games`,
      `Teams should not play more than ${maxGames} consecutive away games`,
      isHard ? ConstraintType.HARD : ConstraintType.SOFT,
      ConstraintCategory.TRAVEL,
      { maxGames },
      weight
    );
  }

  /**
   * Evaluate constraint against a schedule
   * @param {Schedule} schedule - The schedule to evaluate
   * @returns {Array} [satisfied, penalty] tuple
   */
  evaluate(schedule) {
    const maxGames = this.parameters.maxGames;
    let violations = 0;
    
    // Check each team's schedule
    for (const team of schedule.teams) {
      const awayGames = schedule.getTeamAwayGames(team);
      
      // Sort games by date
      awayGames.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Find consecutive away games
      let currentStreak = 1;
      for (let i = 1; i < awayGames.length; i++) {
        const daysBetween = (awayGames[i].date.getTime() - awayGames[i-1].date.getTime()) / (1000 * 60 * 60 * 24);
        
        // Consider games consecutive if within 3 days
        if (daysBetween <= 3) {
          currentStreak++;
        } else {
          // Check if previous streak violated constraint
          if (currentStreak > maxGames) {
            violations += (currentStreak - maxGames);
          }
          currentStreak = 1;
        }
      }
      
      // Check final streak
      if (currentStreak > maxGames) {
        violations += (currentStreak - maxGames);
      }
    }
    
    const satisfied = violations === 0;
    const penalty = violations;
    
    return [satisfied, penalty];
  }
}

/**
 * Constraint for venue availability
 */
class VenueAvailabilityConstraint extends Constraint {
  /**
   * Create a new VenueAvailabilityConstraint
   * @param {string} id - Unique identifier
   */
  constructor(id) {
    super(
      id,
      'Venue Availability',
      'Games must be scheduled at available venues',
      ConstraintType.HARD,
      ConstraintCategory.VENUE,
      {}
    );
  }

  /**
   * Evaluate constraint against a schedule
   * @param {Schedule} schedule - The schedule to evaluate
   * @returns {Array} [satisfied, penalty] tuple
   */
  evaluate(schedule) {
    let violations = 0;
    
    // Check each game
    for (const game of schedule.games) {
      if (!game.venue.isAvailable(game.date)) {
        violations++;
      }
    }
    
    const satisfied = violations === 0;
    const penalty = violations * 1000; // High penalty for hard constraint
    
    return [satisfied, penalty];
  }
}

module.exports = {
  Constraint,
  RestDaysConstraint,
  MaxConsecutiveAwayConstraint,
  VenueAvailabilityConstraint
};
