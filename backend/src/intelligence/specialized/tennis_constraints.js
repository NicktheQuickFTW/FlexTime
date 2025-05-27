/**
 * Tennis Scheduling Constraints for the Big 12 Conference
 * 
 * This module defines the specific scheduling constraints for men's and women's tennis
 * based on the Big 12 Championship operational frameworks.
 */

/**
 * Men's Tennis scheduling constraints
 */
const mensTennisConstraints = {
  // Core scheduling principles (hard constraints)
  hard: {
    'conference_match_count': {
      description: 'Each team must play exactly 8 conference matches',
      value: 8
    },
    'round_robin': {
      description: 'Schedule must be a single round-robin (each team plays every other team exactly once)',
      enforced: true
    },
    'schedule_duration': {
      description: 'All matches must be scheduled within a 5-week period',
      weeks: 5
    },
    'bye_week': {
      description: 'Each team must have exactly one bye week',
      enforced: true
    },
    'travel_partner_system': {
      description: 'Respect established travel partnerships for scheduling',
      enforced: true
    },
    'byu_no_sunday': {
      description: 'BYU cannot play on Sunday',
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
    'facility_availability': {
      description: 'Consider indoor facility availability for early-season matches',
      weight: 0.5
    },
    'exam_period_avoidance': {
      description: 'Avoid scheduling matches during final examination periods',
      weight: 0.8
    },
    'ucf_special_handling': {
      description: 'Provide special handling for UCF as an outlier without a travel partner',
      weight: 0.7
    },
    'elevation_consideration': {
      description: 'Consider elevation changes when scheduling matches',
      weight: 0.6
    }
  },
  
  // Season parameters
  seasonParameters: {
    totalMatches: 8,
    conferenceMatches: 8,
    totalWeeks: 5,
    byeWeeks: 1,
    matchFormat: 'Dual Match',
    typicalMatchDays: ['Friday', 'Saturday', 'Sunday']
  }
};

/**
 * Women's Tennis scheduling constraints
 */
const womensTennisConstraints = {
  // Core scheduling principles (hard constraints)
  hard: {
    'conference_match_count': {
      description: 'Each team must play exactly 13 conference matches',
      value: 13
    },
    'schedule_duration': {
      description: 'All matches must be scheduled within a 7-week period',
      weeks: 7
    },
    'no_byes': {
      description: 'Schedule has no bye weeks',
      enforced: true
    },
    'play_all_opponents': {
      description: 'Each team must play all other conference teams at least once',
      enforced: true
    },
    'travel_partner_system': {
      description: 'Respect established travel partnerships and pods for scheduling',
      enforced: true
    },
    'home_away_balance': {
      description: 'Schedule 7H/6A or 6H/7A rotating H/A with travel partner each year',
      enforced: true
    },
    'byu_no_sunday': {
      description: 'BYU cannot play on Sunday',
      enforced: true
    }
  },
  
  // Soft scheduling principles
  soft: {
    'travel_efficiency': {
      description: 'Minimize travel distance between consecutive away matches',
      weight: 0.6
    },
    'facility_availability': {
      description: 'Consider indoor facility availability for early-season matches',
      weight: 0.5
    },
    'exam_period_avoidance': {
      description: 'Avoid scheduling matches during final examination periods',
      weight: 0.8
    },
    'even_distribution': {
      description: 'Distribute matches evenly throughout the 7-week period',
      weight: 0.6
    },
    'elevation_avoidance': {
      description: 'Avoid scheduling teams against both elevation pairs in a single year',
      weight: 0.7
    },
    'travel_pod_scheduling': {
      description: 'Schedule H-H or A-A against another travel pair with one weekend against your travel partner only',
      weight: 0.8
    }
  },
  
  // Season parameters
  seasonParameters: {
    totalMatches: 13,
    conferenceMatches: 13,
    totalWeeks: 7,
    byeWeeks: 0,
    matchFormat: 'Dual Match',
    typicalMatchDays: ['Friday', 'Saturday', 'Sunday']
  }
};

/**
 * Men's Tennis travel partners
 */
const mensTennisPartners = {
  'Arizona': 'Arizona State',
  'Arizona State': 'Arizona',
  'BYU': 'Utah',
  'Utah': 'BYU',
  'Baylor': 'TCU',
  'TCU': 'Baylor',
  'Oklahoma State': 'Texas Tech',
  'Texas Tech': 'Oklahoma State',
  'UCF': null // Outlier without a travel partner
};

/**
 * Women's Tennis travel partners
 */
const womensTennisPartners = {
  'Arizona': 'Arizona State',
  'Arizona State': 'Arizona',
  'BYU': 'Utah',
  'Utah': 'BYU',
  'Colorado': 'Texas Tech',
  'Texas Tech': 'Colorado',
  'Baylor': 'TCU',
  'TCU': 'Baylor',
  'UCF': 'Houston',
  'Houston': 'UCF',
  'Cincinnati': 'West Virginia',
  'West Virginia': 'Cincinnati',
  'Iowa State': 'Kansas',
  'Kansas': 'Iowa State',
  'K-State': 'Oklahoma State',
  'Oklahoma State': 'K-State'
};

/**
 * Women's Tennis travel pods
 */
const womensTennisPods = {
  'Pod1': ['Arizona', 'Arizona State', 'BYU', 'Utah'],
  'Pod2': ['Colorado', 'Texas Tech', 'Baylor', 'TCU'],
  'Pod3': ['UCF', 'Houston', 'Cincinnati', 'West Virginia'],
  'Pod4': ['Iowa State', 'Kansas', 'K-State', 'Oklahoma State']
};

/**
 * Teams at elevation
 */
const elevationTeams = ['BYU', 'Utah', 'Colorado'];

/**
 * Tennis season dates for upcoming seasons
 * Note: These are placeholder dates that should be updated with actual conference schedules
 */
const tennisSeasonDates = {
  mensTennis: [
    {
      season: '2024-25',
      conferencePlayStartDate: '2025-03-06', // Approximate start date for conference play
      conferencePlayEndDate: '2025-04-10',   // Approximate end date for conference play
      conferenceChampionshipStartDate: '2025-04-17',
      conferenceChampionshipEndDate: '2025-04-20',
      postseasonStartDate: '2025-05-01',     // NCAA Tournament approximate start
      postseasonEndDate: '2025-05-25',       // NCAA Finals end
      notes: 'Single round-robin dual match schedule (8 matches over 5 Weeks; 1 bye)'
    },
    {
      season: '2025-26',
      conferencePlayStartDate: '2026-03-05',
      conferencePlayEndDate: '2026-04-09',
      conferenceChampionshipStartDate: '2026-04-16',
      conferenceChampionshipEndDate: '2026-04-19',
      postseasonStartDate: '2026-04-30',
      postseasonEndDate: '2026-05-24',
      notes: 'Single round-robin dual match schedule (8 matches over 5 Weeks; 1 bye)'
    }
  ],
  womensTennis: [
    {
      season: '2024-25',
      conferencePlayStartDate: '2025-02-27', // Approximate start date for conference play
      conferencePlayEndDate: '2025-04-13',   // Approximate end date for conference play
      conferenceChampionshipStartDate: '2025-04-17',
      conferenceChampionshipEndDate: '2025-04-20',
      postseasonStartDate: '2025-05-01',     // NCAA Tournament approximate start
      postseasonEndDate: '2025-05-25',       // NCAA Finals end
      notes: '13 matches over 7 weeks (no byes), using travel partner system and pods'
    },
    {
      season: '2025-26',
      conferencePlayStartDate: '2026-02-26',
      conferencePlayEndDate: '2026-04-12',
      conferenceChampionshipStartDate: '2026-04-16',
      conferenceChampionshipEndDate: '2026-04-19',
      postseasonStartDate: '2026-04-30',
      postseasonEndDate: '2026-05-24',
      notes: '13 matches over 7 weeks (no byes), using travel partner system and pods with home/away rotation from previous year'
    }
  ]
};

// Special dates to consider for scheduling
const specialDates = {
  '2024-25': {
    'Spring Break': {
      'Approximate Start': '2025-03-15',
      'Approximate End': '2025-03-23'
    },
    'Final Exams': {
      'Approximate Start': '2025-05-03',
      'Approximate End': '2025-05-14'
    }
  },
  '2025-26': {
    'Spring Break': {
      'Approximate Start': '2026-03-14',
      'Approximate End': '2026-03-22'
    },
    'Final Exams': {
      'Approximate Start': '2026-05-02',
      'Approximate End': '2026-05-13'
    }
  }
};

/**
 * Tennis scheduling constraints
 */
const tennisSchedulingRules = {
  // Core scheduling rules
  core: {
    'standard_play_days': {
      description: 'Standard tennis matches are played Friday-Saturday',
      enforced: true
    },
    'byu_utah_play_days': {
      description: 'Matches against BYU and Utah are played Thursday-Saturday',
      enforced: true
    },
    'travel_partner_play_day': {
      description: 'Travel partner weekends (single play) default to Saturday',
      enforced: true
    },
    'easter_weekend': {
      description: 'Easter weekend matches are played Thursday-Saturday',
      enforced: true
    },
    'avoid_double_headers': {
      description: 'Avoid scheduling Men\'s and Women\'s Tennis at home on the same day',
      enforced: true
    },
    'football_conflict': {
      description: 'If football is home Thursday-Saturday, that school\'s tennis teams should be away',
      enforced: true
    }
  },
  
  // Exceptions and special cases
  exceptions: {
    'unavoidable_double_headers': {
      description: 'Men\'s and Women\'s Tennis may be scheduled at home on the same day if absolutely necessary',
      conditions: ['limited_facilities', 'scheduling_deadlock', 'championship_proximity']
    }
  }
};

/**
 * Evaluates if a proposed tennis schedule respects the scheduling rules
 * 
 * @param {Object} proposedSchedule - The schedule being evaluated
 * @param {Object} context - Additional context for evaluation including football schedule
 * @returns {Object} - Evaluation result with status and explanation
 */
function evaluateTennisScheduleRules(proposedSchedule, context) {
  const violations = [];
  const footballSchedule = context.footballSchedule || [];
  
  // Check for BYU/Utah play days
  proposedSchedule.forEach(match => {
    const isAgainstBYUOrUtah = match.homeTeam === 'BYU' || match.awayTeam === 'BYU' || 
                              match.homeTeam === 'Utah' || match.awayTeam === 'Utah';
    
    const matchDay = new Date(match.date).getDay(); // 0 = Sunday, 4 = Thursday, 5 = Friday, 6 = Saturday
    
    // Check if BYU/Utah matches are on Thursday or Saturday (not Friday)
    if (isAgainstBYUOrUtah && matchDay === 5) { // Friday
      violations.push({
        type: 'byu_utah_play_days',
        match,
        description: 'Matches against BYU or Utah must be played Thursday or Saturday, not Friday'
      });
    }
    
    // Check for travel partner single play day (should be Saturday)
    const isTravelPartnerMatch = isTravelPartnerSinglePlay(match, mensTennisPartners, womensTennisPartners);
    if (isTravelPartnerMatch && matchDay !== 6) { // Not Saturday
      violations.push({
        type: 'travel_partner_play_day',
        match,
        description: 'Travel partner single play matches should be scheduled on Saturday'
      });
    }
    
    // Check for Easter weekend matches
    if (isEasterWeekend(match.date) && matchDay === 5) { // Friday of Easter weekend
      violations.push({
        type: 'easter_weekend',
        match,
        description: 'Easter weekend matches should be played Thursday or Saturday, not Friday'
      });
    }
  });
  
  // Check for Men's/Women's Tennis double headers
  const matchesBySchoolAndDate = {};
  
  proposedSchedule.forEach(match => {
    const dateKey = new Date(match.date).toISOString().split('T')[0];
    const school = match.homeTeam; // Only checking home matches
    const sportType = match.sportType; // 'Men\'s Tennis' or 'Women\'s Tennis'
    
    const key = `${school}_${dateKey}`;
    if (!matchesBySchoolAndDate[key]) {
      matchesBySchoolAndDate[key] = [];
    }
    
    matchesBySchoolAndDate[key].push({ match, sportType });
  });
  
  // Check for schools with both men's and women's tennis at home on the same day
  for (const key in matchesBySchoolAndDate) {
    const matches = matchesBySchoolAndDate[key];
    
    if (matches.length > 1) {
      const hasMensTennis = matches.some(m => m.sportType === 'Men\'s Tennis');
      const hasWomensTennis = matches.some(m => m.sportType === 'Women\'s Tennis');
      
      if (hasMensTennis && hasWomensTennis) {
        violations.push({
          type: 'avoid_double_headers',
          matches: matches.map(m => m.match),
          description: 'Men\'s and Women\'s Tennis should not be scheduled at home on the same day'
        });
      }
    }
  }
  
  // Check for football conflicts
  footballSchedule.forEach(footballGame => {
    const gameDate = new Date(footballGame.date);
    const gameDay = gameDate.getDay();
    const isHomeGame = footballGame.homeTeam === footballGame.school;
    
    // Only check Thursday-Saturday home football games
    if (isHomeGame && (gameDay >= 4 && gameDay <= 6)) { // Thursday-Saturday
      const school = footballGame.school;
      const footballWeekendStart = new Date(gameDate);
      footballWeekendStart.setDate(gameDate.getDate() - gameDay + 4); // Set to Thursday
      
      const footballWeekendEnd = new Date(gameDate);
      footballWeekendEnd.setDate(gameDate.getDate() - gameDay + 6); // Set to Saturday
      
      // Check if tennis teams are home during football weekend
      proposedSchedule.forEach(match => {
        const matchDate = new Date(match.date);
        const isWeekendMatch = matchDate >= footballWeekendStart && matchDate <= footballWeekendEnd;
        
        if (isWeekendMatch && match.homeTeam === school) {
          violations.push({
            type: 'football_conflict',
            match,
            footballGame,
            description: `${school} tennis team scheduled at home during football home weekend`
          });
        }
      });
    }
  });
  
  return {
    satisfied: violations.length === 0,
    violations,
    explanation: violations.length === 0 
      ? 'Tennis schedule respects all scheduling rules' 
      : `Found ${violations.length} tennis scheduling rule violations`
  };
}

/**
 * Helper function to check if a match is a travel partner single play match
 */
function isTravelPartnerSinglePlay(match, mensTennisPartners, womensTennisPartners) {
  const partners = match.sportType === 'Men\'s Tennis' ? mensTennisPartners : womensTennisPartners;
  
  const homePartner = partners[match.homeTeam];
  const awayPartner = partners[match.awayTeam];
  
  // If the teams are travel partners, this is a single play match
  return homePartner === match.awayTeam && awayPartner === match.homeTeam;
}

/**
 * Helper function to check if a date falls on Easter weekend
 */
function isEasterWeekend(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  
  // Approximate Easter date calculation (this is a simplified version)
  // For a more accurate calculation, you would use the actual Easter date for each year
  const easterDates = {
    2025: new Date(2025, 3, 20), // April 20, 2025
    2026: new Date(2026, 3, 5)   // April 5, 2026
  };
  
  const easterDate = easterDates[year];
  if (!easterDate) return false;
  
  // Check if the date is within Easter weekend (Thursday-Sunday)
  const easterThursday = new Date(easterDate);
  easterThursday.setDate(easterDate.getDate() - 3);
  
  const easterSunday = easterDate;
  
  return date >= easterThursday && date <= easterSunday;
}

// Add to module exports
module.exports = {
  mensTennisConstraints,
  womensTennisConstraints,
  mensTennisPartners,
  womensTennisPartners,
  womensTennisPods,
  elevationTeams,
  tennisSeasonDates,
  specialDates,
  tennisSchedulingRules,
  evaluateTennisScheduleRules
};
