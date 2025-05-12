/**
 * Soccer and Volleyball Scheduling Constraints for the Big 12 Conference
 * 
 * This module defines the specific scheduling constraints for soccer and volleyball
 * based on the Big 12 Championship operational frameworks.
 */

/**
 * Soccer scheduling constraints
 */
const soccerConstraints = {
  // Core scheduling principles (hard constraints)
  hard: {
    'conference_match_count': {
      description: 'Each team must have exactly 11 conference matches',
      value: 11
    },
    'schedule_duration': {
      description: 'All matches must be scheduled within a 7-week period',
      weeks: 7
    },
    'match_cadence': {
      description: 'Follow 1-2-2-1-2-2-1 weekly cadence for matches',
      enforced: true
    },
    'byu_no_sunday': {
      description: 'BYU cannot play on Sunday',
      enforced: true
    },
    'byu_special_handling': {
      description: 'Games with BYU are played Thursday and Monday (never Sunday)',
      enforced: true
    },
    'final_match_timing': {
      description: 'Final match must be on Friday before Conference championship',
      enforced: true
    }
  },
  
  // Soft scheduling principles
  soft: {
    'home_away_balance': {
      description: 'Balance home and away matches throughout the season',
      weight: 0.7
    },
    'travel_efficiency': {
      description: 'Minimize travel distance between consecutive away matches',
      weight: 0.6
    },
    'exam_period_avoidance': {
      description: 'Avoid scheduling matches during final examination periods',
      weight: 0.8
    },
    'even_distribution': {
      description: 'Distribute matches evenly throughout the 7-week period',
      weight: 0.6
    }
  },
  
  // Season parameters
  seasonParameters: {
    totalMatches: 11,
    conferenceMatches: 11,
    totalWeeks: 7,
    byeWeeks: 0,
    matchFormat: 'Single Match',
    typicalMatchDays: ['Thursday', 'Sunday'],
    specialMatchDays: {
      'BYU': ['Thursday', 'Monday'],
      'Single Play': ['Thursday', 'Friday']
    },
    weeklyCadence: '1-2-2-1-2-2-1'
  }
};

/**
 * Volleyball scheduling constraints
 */
const volleyballConstraints = {
  // Core scheduling principles (hard constraints)
  hard: {
    'conference_match_count': {
      description: 'Each team must have exactly 18 conference matches',
      value: 18
    },
    'home_away_balance': {
      description: 'Each team must have 9 home matches and 9 away matches',
      enforced: true
    },
    'schedule_duration': {
      description: 'All matches must be scheduled within a 10-week period',
      weeks: 10
    },
    'play_all_opponents': {
      description: 'Each team must play all other teams at least once',
      enforced: true
    },
    'byu_no_sunday': {
      description: 'BYU cannot play on Sunday',
      enforced: true
    },
    'football_conflict': {
      description: 'If football is home Thursday-Saturday, volleyball must be away that weekend',
      enforced: true
    }
  },
  
  // Soft scheduling principles
  soft: {
    'travel_efficiency': {
      description: 'Minimize travel distance between consecutive away matches',
      weight: 0.6
    },
    'exam_period_avoidance': {
      description: 'Avoid scheduling matches during final examination periods',
      weight: 0.8
    },
    'even_distribution': {
      description: 'Distribute matches evenly throughout the 10-week period',
      weight: 0.6
    },
    'no_away_wednesday_after_away_saturday': {
      description: 'Avoid scheduling away Wednesday matches after away Saturday matches',
      weight: 0.7
    },
    'limit_split_weekends': {
      description: 'Maximum of 2 split weekends per team',
      weight: 0.5
    }
  },
  
  // Season parameters
  seasonParameters: {
    totalMatches: 18,
    conferenceMatches: 18,
    totalWeeks: 10,
    byeWeeks: 0,
    matchFormat: 'Best of 5 Sets',
    typicalMatchDays: ['Wednesday', 'Saturday'],
    weeklyCadence: '2-2-2-2-2-2-2-2-2-2' // 2 matches per week for 10 weeks
  }
};

/**
 * Evaluates if a proposed volleyball schedule respects the football conflict constraint
 * 
 * @param {Object} proposedSchedule - The volleyball schedule being evaluated
 * @param {Object} context - Additional context including football schedule
 * @returns {Object} - Evaluation result with status and explanation
 */
function evaluateVolleyballFootballConflict(proposedSchedule, context) {
  const violations = [];
  const footballSchedule = context.footballSchedule || [];
  
  // Map football home games by school and weekend
  const footballHomeWeekends = {};
  
  footballSchedule.forEach(footballGame => {
    const gameDate = new Date(footballGame.date);
    const gameDay = gameDate.getDay();
    const isHomeGame = footballGame.homeTeam === footballGame.school;
    const school = footballGame.school;
    
    // Only check Thursday-Saturday home football games
    if (isHomeGame && (gameDay >= 4 && gameDay <= 6)) { // Thursday-Saturday
      if (!footballHomeWeekends[school]) {
        footballHomeWeekends[school] = [];
      }
      
      // Define the weekend (Thursday-Saturday)
      const weekendStart = new Date(gameDate);
      weekendStart.setDate(gameDate.getDate() - gameDay + 4); // Set to Thursday
      
      const weekendEnd = new Date(gameDate);
      weekendEnd.setDate(gameDate.getDate() - gameDay + 6); // Set to Saturday
      
      footballHomeWeekends[school].push({
        start: weekendStart,
        end: weekendEnd,
        footballGame
      });
    }
  });
  
  // Check volleyball schedule for conflicts
  proposedSchedule.forEach(volleyballMatch => {
    const matchDate = new Date(volleyballMatch.date);
    const school = volleyballMatch.homeTeam;
    
    // Check if this school has a football home game this weekend
    if (footballHomeWeekends[school]) {
      const conflictingWeekend = footballHomeWeekends[school].find(weekend => 
        matchDate >= weekend.start && matchDate <= weekend.end
      );
      
      if (conflictingWeekend) {
        violations.push({
          type: 'football_conflict',
          volleyballMatch,
          footballGame: conflictingWeekend.footballGame,
          description: `${school} volleyball scheduled at home during football home weekend`
        });
      }
    }
  });
  
  return {
    satisfied: violations.length === 0,
    violations,
    explanation: violations.length === 0 
      ? 'Volleyball schedule respects football conflict constraint' 
      : `Found ${violations.length} volleyball-football scheduling conflicts`
  };
}

module.exports = {
  soccerConstraints,
  volleyballConstraints,
  evaluateVolleyballFootballConflict
};
