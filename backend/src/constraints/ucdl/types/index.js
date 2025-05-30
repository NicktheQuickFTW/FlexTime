/**
 * Unified Constraint Definition Language (UCDL) - Type Definitions
 * 
 * This module provides the core type definitions for the UCDL system.
 * UCDL standardizes constraint definitions across all sports and use cases.
 */

/**
 * Constraint enforcement levels
 */
const ConstraintType = {
  HARD: 'hard',           // Must be satisfied (violation = invalid schedule)
  SOFT: 'soft',           // Preference with penalty (violation = penalty points)
  FLEXIBLE: 'flexible',   // Adaptable based on context
  CONDITIONAL: 'conditional' // Applies only under certain conditions
};

/**
 * Constraint scope definitions
 */
const ConstraintScope = {
  GLOBAL: 'global',       // Applies to entire schedule
  SPORT: 'sport',         // Applies to specific sport
  TEAM: 'team',           // Applies to specific team(s)
  GAME: 'game',           // Applies to specific game(s)
  VENUE: 'venue',         // Applies to specific venue(s)
  DATE: 'date',           // Applies to specific date(s)
  TIME: 'time',           // Applies to specific time(s)
  SEASON: 'season',       // Applies to season parameters
  TOURNAMENT: 'tournament' // Applies to tournament/championship
};

/**
 * Constraint categories for organization
 */
const ConstraintCategory = {
  TEMPORAL: 'temporal',     // Time-based constraints
  SPATIAL: 'spatial',       // Location/venue-based constraints
  COMPETITIVE: 'competitive', // Fair play and balance
  OPERATIONAL: 'operational', // Practical scheduling needs
  REGULATORY: 'regulatory',   // Rules and compliance
  FINANCIAL: 'financial',     // Budget and cost considerations
  BROADCAST: 'broadcast',     // Media and TV requirements
  ACADEMIC: 'academic',       // Academic calendar alignment
  TRAVEL: 'travel',          // Travel optimization
  WELLNESS: 'wellness'       // Player health and recovery
};

/**
 * Constraint evaluation result types
 */
const EvaluationResult = {
  SATISFIED: 'satisfied',
  VIOLATED: 'violated',
  PARTIALLY_SATISFIED: 'partial',
  NOT_APPLICABLE: 'not_applicable',
  ERROR: 'error'
};

/**
 * Constraint priority levels
 */
const ConstraintPriority = {
  CRITICAL: 1,    // Must be enforced (championship requirements)
  HIGH: 2,        // Very important (conference rules)
  MEDIUM: 3,      // Important (optimization preferences)
  LOW: 4,         // Nice to have (convenience)
  OPTIONAL: 5     // Can be ignored if necessary
};

/**
 * Constraint evaluation context
 */
const EvaluationContext = {
  FULL_SCHEDULE: 'full_schedule',     // Evaluating complete schedule
  PARTIAL_SCHEDULE: 'partial_schedule', // Evaluating incomplete schedule
  GAME_PLACEMENT: 'game_placement',   // Evaluating single game placement
  SCHEDULE_MODIFICATION: 'modification', // Evaluating schedule changes
  VALIDATION: 'validation',           // Final validation check
  OPTIMIZATION: 'optimization'       // During optimization process
};

/**
 * Constraint temporal patterns
 */
const TemporalPattern = {
  FIXED_DATE: 'fixed_date',           // Specific date requirement
  DATE_RANGE: 'date_range',           // Must occur within range
  RECURRING: 'recurring',             // Repeating pattern
  RELATIVE: 'relative',               // Relative to other events
  SEASONAL: 'seasonal',               // Season-based timing
  PERIODIC: 'periodic'                // Regular intervals
};

/**
 * Constraint resolution strategies
 */
const ResolutionStrategy = {
  STRICT: 'strict',         // No flexibility
  NEGOTIATE: 'negotiate',   // Allow minor adjustments
  FALLBACK: 'fallback',     // Alternative solutions
  DEFER: 'defer',           // Postpone if possible
  OVERRIDE: 'override'      // Can be overridden by higher priority
};

/**
 * Standard constraint parameters schema
 */
const ParameterTypes = {
  // Temporal parameters
  DATE: 'date',
  TIME: 'time',
  DURATION: 'duration',
  DAYS_COUNT: 'days_count',
  WEEKS_COUNT: 'weeks_count',
  
  // Numeric parameters
  INTEGER: 'integer',
  FLOAT: 'float',
  PERCENTAGE: 'percentage',
  COUNT: 'count',
  
  // Categorical parameters
  SPORT_TYPE: 'sport_type',
  TEAM_ID: 'team_id',
  VENUE_ID: 'venue_id',
  DAY_OF_WEEK: 'day_of_week',
  
  // Boolean parameters
  BOOLEAN: 'boolean',
  
  // Complex parameters
  ARRAY: 'array',
  OBJECT: 'object',
  CONDITION: 'condition'
};

module.exports = {
  ConstraintType,
  ConstraintScope,
  ConstraintCategory,
  EvaluationResult,
  ConstraintPriority,
  EvaluationContext,
  TemporalPattern,
  ResolutionStrategy,
  ParameterTypes
};