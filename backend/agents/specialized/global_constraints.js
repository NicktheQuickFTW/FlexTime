/**
 * Global Scheduling Constraints for the Big 12 Conference
 * 
 * This module defines global constraints that apply across all sports
 * in the Big 12 Championship.
 */

/**
 * Global team-specific constraints
 */
const teamSpecificConstraints = {
  // BYU-specific constraints
  'BYU': {
    'no_sunday_play': {
      description: 'BYU cannot play on Sunday for any sport',
      enforced: true,
      priority: 'CRITICAL', // Highest priority constraint
      applicable_sports: 'ALL'
    }
  }
};

/**
 * Helper function to check if a game involves BYU
 * @param {object} game - Game object with homeTeamId and awayTeamId
 * @returns {boolean} - True if BYU is involved in the game
 */
function gameInvolvesBYU(game) {
  return game.homeTeamId === 'BYU' || game.awayTeamId === 'BYU';
}

/**
 * Helper function to check if a date is a Sunday
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if the date is a Sunday
 */
function isSunday(date) {
  const gameDate = new Date(date);
  return gameDate.getDay() === 0; // 0 = Sunday in JavaScript
}

/**
 * Evaluate the BYU Sunday play constraint
 * @param {object} schedule - Schedule to evaluate
 * @returns {object} - Evaluation result
 */
function evaluateBYUSundayConstraint(schedule) {
  const result = {
    satisfied: true,
    violations: [],
    score: 1.0
  };
  
  const games = schedule.games || [];
  
  // Check each game
  for (const game of games) {
    if (gameInvolvesBYU(game) && isSunday(game.date)) {
      result.satisfied = false;
      result.violations.push({
        gameId: game.id,
        date: game.date,
        teams: `${game.homeTeamId} vs ${game.awayTeamId}`,
        description: 'BYU is scheduled to play on a Sunday'
      });
    }
  }
  
  // Calculate score based on violations
  if (result.violations.length > 0) {
    // This is a critical constraint, so even one violation results in a score of 0
    result.score = 0;
  }
  
  return result;
}

module.exports = {
  teamSpecificConstraints,
  gameInvolvesBYU,
  isSunday,
  evaluateBYUSundayConstraint
};
