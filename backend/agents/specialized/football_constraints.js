/**
 * Football Scheduling Constraints for the Big 12 Conference
 * 
 * This module defines the specific scheduling constraints for football
 * based on the Big 12 Championship operational frameworks.
 */

/**
 * Football scheduling constraints
 */
const footballConstraints = {
  // Core scheduling principles (hard constraints) - required for each schedule
  hard: {
    'consecutive_road_games': {
      description: 'No school plays more than two consecutive road Conference games',
      enforced: true
    },
    'road_game_distribution': {
      description: 'No school plays four-of-five Conference games on the road',
      enforced: true
    },
    'open_week_advantage': {
      description: 'No school plays a Conference team coming off an open week more than twice (unless both teams are coming off an open week)',
      enforced: true
    },
    'back_to_back_road_sets': {
      description: 'No school plays two sets of back-to-back Conference Road games in a season',
      enforced: true
    },
    'thursday_game_recovery': {
      description: 'Each school playing in a Thursday game will have a similar recovery period from the previous week',
      enforced: true
    },
    'conference_game_count': {
      description: 'Each team must play exactly 9 conference games',
      value: 9
    },
    'schedule_duration': {
      description: 'All games must be scheduled within a 9-week period with the final game on Thanksgiving Saturday',
      weeks: 9
    }
  },
  
  // Soft scheduling principles - considered but not required
  soft: {
    'early_home_game': {
      description: 'At least one of the first two games will be scheduled as a home game',
      weight: 0.7
    },
    'avoid_three_weeks_without_home': {
      description: 'Avoid institutions playing three straight weeks without a home game on campus',
      weight: 0.8
    },
    'late_home_game': {
      description: 'At least one of the last two games will be scheduled as a home game (may be waived by the institution)',
      weight: 0.6
    },
    'avoid_away_bye_away': {
      description: 'Avoid the away-bye-away scenario unless a Thursday appearance is involved',
      weight: 0.7
    },
    'short_week_equality': {
      description: 'When two institutions are playing each other on a short week (Thursday), an effort will be made to have them both play either at home or on the road and/or have the same recovery time',
      weight: 0.8
    },
    'limit_open_date_advantage': {
      description: 'Avoid institutions playing a team coming off an open date more than once (unless both teams are coming off an open date)',
      weight: 0.7
    },
    'time_zone_travel': {
      description: 'Crossing over multiple time zones will be considered in the final sequencing of games',
      weight: 0.6
    },
    'schedule_balance': {
      description: 'Balance in opening Conference play on the road, Thursday games, and the number of total teams open on the same week',
      weight: 0.5
    },
    'player_health_recovery': {
      description: 'Travel considerations will be built into the schedules with an emphasis on players\' health and recovery',
      weight: 0.8
    }
  },
  
  // Media rights considerations
  media: {
    'abc_espn_obligations': {
      description: 'Meet contractual obligations for ABC/ESPN telecasts',
      enforced: true
    },
    'fox_obligations': {
      description: 'Meet contractual obligations for FOX telecasts',
      enforced: true
    },
    'weeknight_games': {
      description: 'Provide contractually required weeknight games',
      enforced: true
    }
  },
  
  // Season parameters
  seasonParameters: {
    totalGames: 12, // Including non-conference
    conferenceGames: 9,
    totalWeeks: 9,
    byeWeeks: 1,
    gameFormat: 'Regular',
    typicalGameDays: ['Saturday'],
    specialGameDays: ['Thursday'],
    championshipGame: true,
    nonRoundRobin: true // Does not include a full round-robin play rotation
  }
};

/**
 * Football season dates for upcoming seasons
 */
const footballSeasonDates = [
  {
    season: '2024-25',
    conferencePlayStartDate: '2024-09-14', // Approximate start date for conference play
    conferencePlayEndDate: '2024-11-30',   // Thanksgiving Saturday
    conferenceChampionshipDate: '2024-12-07',
    notes: '9 conference games over 9 weeks'
  },
  {
    season: '2025-26',
    conferencePlayStartDate: '2025-09-13',
    conferencePlayEndDate: '2025-11-29',   // Thanksgiving Saturday
    conferenceChampionshipDate: '2025-12-06',
    notes: '9 conference games over 9 weeks'
  }
];

/**
 * Special dates to consider for scheduling
 */
const specialDates = {
  '2024-25': {
    'Thanksgiving': '2024-11-28',
    'Fall Break': {
      'Approximate Start': '2024-10-12',
      'Approximate End': '2024-10-20'
    }
  },
  '2025-26': {
    'Thanksgiving': '2025-11-27',
    'Fall Break': {
      'Approximate Start': '2025-10-11',
      'Approximate End': '2025-10-19'
    }
  }
};

/**
 * Media rights information
 */
const mediaRights = {
  'ABC/ESPN': {
    contractEndYear: 2031,
    requirements: 'National and regional telecasts of Big 12 football games'
  },
  'FOX': {
    contractEndYear: 2031,
    requirements: 'National and regional telecasts of Big 12 football games'
  },
  'Coverage': 'All Big 12 Conference home games will be televised on an ABC/ESPN, FOX or member institution platform'
};

module.exports = {
  footballConstraints,
  footballSeasonDates,
  specialDates,
  mediaRights
};
