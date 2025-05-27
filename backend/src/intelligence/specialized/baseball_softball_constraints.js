/**
 * Baseball and Softball Scheduling Constraints for the Big 12 Conference
 * 
 * This module defines the specific scheduling constraints for baseball and softball
 * based on the Big 12 Championship operational frameworks.
 */

/**
 * Baseball scheduling constraints
 */
const baseballConstraints = {
  // Core scheduling principles (hard constraints)
  hard: {
    'conference_game_count': {
      description: 'Each team must play exactly 30 conference games',
      value: 30
    },
    'series_format': {
      description: 'Schedule must consist of ten three-game series',
      seriesCount: 10,
      gamesPerSeries: 3
    },
    'home_series_limit': {
      description: 'Each institution will play no more than five series at home in a given year',
      maxHomeSeries: 5
    },
    'series_integrity': {
      description: 'All games in a series must be played at the same venue',
      enforced: true
    },
    'series_scheduling': {
      description: 'Three-game series are typically played over three days (Friday-Sunday)',
      defaultFormat: 'Friday-Sunday',
      exceptions: ['weather', 'exams', 'travel']
    }
  },
  
  // Soft scheduling principles
  soft: {
    'home_away_balance': {
      description: 'Balance home and away series throughout the season',
      weight: 0.7
    },
    'weather_considerations': {
      description: 'Consider weather patterns when scheduling early-season games',
      weight: 0.6,
      preferredPattern: 'Schedule southern/warm weather locations earlier in season'
    },
    'exam_period_avoidance': {
      description: 'Avoid scheduling games during final examination periods',
      weight: 0.8
    },
    'travel_efficiency': {
      description: 'Minimize travel distance between series',
      weight: 0.7
    },
    'tv_opportunities': {
      description: 'Consider TV broadcast opportunities for high-profile matchups',
      weight: 0.5,
      preferredDays: ['Friday evening', 'Saturday afternoon']
    }
  },
  
  // Season parameters
  seasonParameters: {
    totalGames: 30,
    conferenceGames: 30,
    seriesCount: 10,
    gamesPerSeries: 3,
    maxHomeSeries: 5,
    typicalSeriesFormat: 'Friday-Sunday',
    seasonLength: '14 weeks'
  }
};

/**
 * Softball scheduling constraints
 */
const softballConstraints = {
  // Core scheduling principles (hard constraints)
  hard: {
    'conference_game_count': {
      description: 'Each team must play exactly 24 conference games',
      value: 24
    },
    'series_format': {
      description: 'Schedule must consist of eight three-game series',
      seriesCount: 8,
      gamesPerSeries: 3
    },
    'series_integrity': {
      description: 'All games in a series must be played at the same venue',
      enforced: true
    },
    'series_scheduling': {
      description: 'Three-game series are typically played over three days',
      defaultFormat: 'Friday-Sunday',
      exceptions: {
        'BYU': 'Thursday-Saturday',
        'Easter': 'Thursday-Saturday'
      }
    },
    'season_length': {
      description: '24-game schedule must be played over a nine-week period',
      weeks: 9
    }
  },
  
  // Soft scheduling principles
  soft: {
    'home_away_balance': {
      description: 'Balance home and away series throughout the season',
      weight: 0.7
    },
    'weather_considerations': {
      description: 'Consider weather patterns when scheduling early-season games',
      weight: 0.6,
      preferredPattern: 'Schedule southern/warm weather locations earlier in season'
    },
    'exam_period_avoidance': {
      description: 'Avoid scheduling games during final examination periods',
      weight: 0.8
    },
    'travel_efficiency': {
      description: 'Minimize travel distance between series',
      weight: 0.7
    },
    'tv_opportunities': {
      description: 'Consider TV broadcast opportunities for high-profile matchups',
      weight: 0.5,
      preferredDays: ['Saturday doubleheaders']
    },
    'mutual_agreement_format': {
      description: 'Allow 2-1 format by mutual agreement of participating institutions',
      weight: 0.4,
      format: '2 games one day, 1 game another day'
    }
  },
  
  // Season parameters
  seasonParameters: {
    totalGames: 24,
    conferenceGames: 24,
    seriesCount: 8,
    gamesPerSeries: 3,
    seasonLength: '9 weeks',
    typicalSeriesFormat: 'Friday-Sunday',
    specialCases: {
      'BYU': 'Thursday-Saturday',
      'Easter': 'Thursday-Saturday'
    },
    optionalFormat: '2-1 format by mutual agreement'
  }
};

/**
 * Baseball and Softball season dates for upcoming seasons
 * Note: These are placeholder dates that should be updated with actual conference schedules
 */
const baseballSoftballSeasonDates = {
  baseball: [
    {
      season: '2025-26',
      conferencePlayStartDate: '2026-03-13', // Approximate start date for conference play
      conferencePlayEndDate: '2026-05-16',   // Approximate end date for conference play
      conferenceChampionshipStartDate: '2026-05-20',
      conferenceChampionshipEndDate: '2026-05-24',
      postseasonStartDate: '2026-05-29',     // NCAA Regionals approximate start
      postseasonEndDate: '2026-06-21',       // College World Series end
      notes: 'Conference schedule features ten 3-game series'
    },
    {
      season: '2026-27',
      conferencePlayStartDate: '2027-03-12',
      conferencePlayEndDate: '2027-05-15',
      conferenceChampionshipStartDate: '2027-05-19',
      conferenceChampionshipEndDate: '2027-05-23',
      postseasonStartDate: '2027-05-28',
      postseasonEndDate: '2027-06-20',
      notes: 'Conference schedule features ten 3-game series'
    }
  ],
  softball: [
    {
      season: '2025-26',
      conferencePlayStartDate: '2026-03-05', // Approximate start date for conference play
      conferencePlayEndDate: '2026-05-02',   // Approximate end date for conference play
      conferenceChampionshipStartDate: '2026-05-07',
      conferenceChampionshipEndDate: '2026-05-09',
      postseasonStartDate: '2026-05-14',     // NCAA Regionals approximate start
      postseasonEndDate: '2026-06-07',       // Women's College World Series end
      notes: '24-game schedule (eight 3-game series) over a nine-week period'
    },
    {
      season: '2026-27',
      conferencePlayStartDate: '2027-03-04',
      conferencePlayEndDate: '2027-05-01',
      conferenceChampionshipStartDate: '2027-05-06',
      conferenceChampionshipEndDate: '2027-05-08',
      postseasonStartDate: '2027-05-13',
      postseasonEndDate: '2027-06-06',
      notes: '24-game schedule (eight 3-game series) over a nine-week period'
    }
  ]
};

// Special dates to consider for scheduling
const specialDates = {
  '2025-26': {
    'Easter': '2026-04-05',
    'Final Exams': {
      'Approximate Start': '2026-05-03',
      'Approximate End': '2026-05-14'
    }
  },
  '2026-27': {
    'Easter': '2027-03-28',
    'Final Exams': {
      'Approximate Start': '2027-05-02',
      'Approximate End': '2027-05-13'
    }
  }
};

module.exports = {
  baseballConstraints,
  softballConstraints,
  baseballSoftballSeasonDates,
  specialDates
};
