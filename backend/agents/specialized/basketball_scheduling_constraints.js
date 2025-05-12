/**
 * Basketball Scheduling Constraints for the Big 12 Conference
 * 
 * This module defines the specific scheduling constraints for men's and women's
 * basketball based on the Big 12 Championship operational frameworks.
 */

/**
 * Men's Basketball scheduling constraints
 */
const mensBasketballConstraints = {
  // Core scheduling principles (hard constraints)
  hard: {
    'conference_game_count': {
      description: 'Each team must play exactly 18 conference games',
      value: 18
    },
    'play_distribution': {
      description: 'Each team plays 3 opponents twice (home and away) and 12 opponents once',
      playTwiceCount: 3,
      playOnceCount: 12
    },
    'first_four_balance': {
      description: 'Among the first four games, at least two will be at home and two on the road',
      minHome: 2,
      minAway: 2
    },
    'last_four_balance': {
      description: 'Among the last four games, at least two will be at home and two on the road',
      minHome: 2,
      minAway: 2
    },
    'max_consecutive_road': {
      description: 'No team will play more than two consecutive Conference road games',
      value: 2
    },
    'big_monday_prerequisite': {
      description: 'A road Big Monday game will be preceded by a home game on Saturday',
      exceptions: ['nearby_opponents']
    },
    'avoid_compressed_schedule': {
      description: 'No team will be scheduled for Saturday-Monday-Wednesday (mid-week)'
    },
    'rematch_separation': {
      description: 'At least three games and/or 10 days between rematches',
      minGames: 3,
      minDays: 10,
      preferred: {
        minGames: 4,
        minDays: 15
      }
    }
  },
  
  // Soft scheduling principles
  soft: {
    'weekend_home_games': {
      description: 'Each institution will have a similar number of weekend home games (a minimum of four)',
      minWeekendHomeGames: 4,
      weight: 0.8
    },
    'bye_placement': {
      description: 'Bye dates, when available, will generally be mid-week',
      weight: 0.6
    },
    'avoid_road_clusters': {
      description: 'Avoid four of five games on the road anywhere in the schedule',
      weight: 0.7
    },
    'avoid_early_road_cluster': {
      description: 'Avoid four of first six games on the road',
      weight: 0.7
    },
    'avoid_late_road_cluster': {
      description: 'Avoid four of last six games on the road',
      weight: 0.7
    },
    'avoid_opening_consecutive_road': {
      description: 'Avoid opening road/road',
      weight: 0.5
    },
    'avoid_closing_consecutive_road': {
      description: 'Avoid closing road/road',
      weight: 0.5
    },
    'balance_bye_advantage': {
      description: 'Work to balance playing teams coming off a bye date',
      weight: 0.4
    },
    'big_monday_home_preceded_by_road': {
      description: 'Big Monday home game is preceded by a road game',
      weight: 0.3
    }
  },
  
  // Season parameters
  seasonParameters: {
    totalGames: 18,
    totalWindows: 19,
    hasBye: true,
    conferencePlayStart: 'January',
    conferencePlayEnd: 'Early March',
    championshipTournament: 'Mid March',
    venue: 'Kansas City'
  }
};

/**
 * Women's Basketball scheduling constraints
 */
const womensBasketballConstraints = {
  // Core scheduling principles (hard constraints)
  hard: {
    'conference_game_count': {
      description: 'Each team must play exactly 20 conference games',
      value: 20
    },
    'play_distribution': {
      description: 'Each team plays 5 opponents twice (home and away) and 10 opponents once',
      playTwiceCount: 5,
      playOnceCount: 10
    },
    'first_four_balance': {
      description: 'Among the first four games, at least two will be at home and two on the road',
      minHome: 2,
      minAway: 2
    },
    'last_four_balance': {
      description: 'Among the last four games, at least two will be at home and two on the road',
      minHome: 2,
      minAway: 2
    },
    'max_consecutive_road': {
      description: 'No team will play more than two consecutive Conference road games',
      value: 2
    },
    'big_monday_prerequisite': {
      description: 'A road Big Monday game will be preceded by a home game on Saturday',
      exceptions: ['nearby_opponents']
    },
    'avoid_compressed_schedule': {
      description: 'No team will be scheduled for Saturday-Monday-Wednesday (mid-week)'
    },
    'rematch_separation': {
      description: 'At least three games and/or 10 days between rematches',
      minGames: 3,
      minDays: 10,
      preferred: {
        minGames: 4,
        minDays: 15
      }
    }
  },
  
  // Soft scheduling principles
  soft: {
    'weekend_home_games': {
      description: 'Each institution will have a similar number of weekend home games (a minimum of four)',
      minWeekendHomeGames: 4,
      weight: 0.8
    },
    'avoid_road_clusters': {
      description: 'Avoid four of five games on the road anywhere in the schedule',
      weight: 0.7
    },
    'avoid_early_road_cluster': {
      description: 'Avoid four of first six games on the road',
      weight: 0.7
    },
    'avoid_late_road_cluster': {
      description: 'Avoid four of last six games on the road',
      weight: 0.7
    },
    'avoid_opening_consecutive_road': {
      description: 'Avoid opening road/road',
      weight: 0.5
    },
    'avoid_closing_consecutive_road': {
      description: 'Avoid closing road/road',
      weight: 0.5
    },
    'minimize_same_day_games': {
      description: 'Minimize men\'s and women\'s games scheduled at home on the same day',
      weight: 0.6
    }
  },
  
  // Season parameters
  seasonParameters: {
    totalGames: 20,
    totalWindows: 20,
    hasBye: false,
    conferencePlayStart: 'Late December',
    conferencePlayEnd: 'Late February/Early March',
    championshipTournament: 'Early March',
    venue: 'Kansas City'
  }
};

/**
 * Basketball season dates for the next five years
 */
const basketballSeasonDates = {
  mensBasketball: [
    {
      season: '2025-26',
      firstPracticeDate: '2025-10-01', // Varies by institution
      firstGameDate: '2025-11-03',
      conferencePlayStartDate: '2026-01-02',
      conferencePlayEndDate: '2026-03-07',
      conferenceChampionshipStartDate: '2026-03-10',
      conferenceChampionshipEndDate: '2026-03-14',
      postseasonStartDate: '2026-03-17',
      postseasonEndDate: '2026-04-06',
      finalFourLocation: 'Indianapolis'
    },
    {
      season: '2026-27',
      firstPracticeDate: '2026-10-01', // Varies by institution
      firstGameDate: '2026-11-02',
      conferencePlayStartDate: '2027-01-01',
      conferencePlayEndDate: '2027-03-06',
      conferenceChampionshipStartDate: '2027-03-09',
      conferenceChampionshipEndDate: '2027-03-13',
      postseasonStartDate: '2027-03-16',
      postseasonEndDate: '2027-04-05',
      finalFourLocation: 'Detroit'
    },
    {
      season: '2027-28',
      firstPracticeDate: '2027-10-01', // Varies by institution
      firstGameDate: '2027-11-01',
      conferencePlayStartDate: '2026-12-31',
      conferencePlayEndDate: '2028-03-04',
      conferenceChampionshipStartDate: '2028-03-07',
      conferenceChampionshipEndDate: '2028-03-11',
      postseasonStartDate: '2028-03-14',
      postseasonEndDate: '2028-04-03',
      finalFourLocation: 'Las Vegas'
    },
    {
      season: '2028-29',
      firstPracticeDate: '2028-10-01', // Varies by institution
      firstGameDate: '2028-10-30',
      conferencePlayStartDate: '2028-12-29',
      conferencePlayEndDate: '2029-03-03',
      conferenceChampionshipStartDate: '2029-03-06',
      conferenceChampionshipEndDate: '2029-03-10',
      postseasonStartDate: '2029-03-13',
      postseasonEndDate: '2029-04-02',
      finalFourLocation: 'Indianapolis'
    },
    {
      season: '2029-30',
      firstPracticeDate: '2029-10-01', // Varies by institution
      firstGameDate: '2029-11-05',
      conferencePlayStartDate: '2029-12-31',
      conferencePlayEndDate: '2030-03-09',
      conferenceChampionshipStartDate: '2030-03-12',
      conferenceChampionshipEndDate: '2030-03-16',
      postseasonStartDate: '2030-03-19',
      postseasonEndDate: '2030-04-08',
      finalFourLocation: 'North Texas'
    }
  ],
  womensBasketball: [
    {
      season: '2025-26',
      firstPracticeDate: '2025-10-01', // Varies by institution
      firstGameDate: '2025-11-03',
      conferencePlayStartDate: '2025-12-20',
      conferencePlayEndDate: '2026-02-28',
      conferenceChampionshipStartDate: '2026-03-04',
      conferenceChampionshipEndDate: '2026-03-09',
      postseasonStartDate: '2026-03-18',
      postseasonEndDate: '2026-04-05',
      finalFourLocation: 'Phoenix'
    },
    {
      season: '2026-27',
      firstPracticeDate: '2026-10-01', // Varies by institution
      firstGameDate: '2026-11-02',
      conferencePlayStartDate: '2026-12-19',
      conferencePlayEndDate: '2027-02-27',
      conferenceChampionshipStartDate: '2027-03-03',
      conferenceChampionshipEndDate: '2027-03-08',
      postseasonStartDate: '2027-03-17',
      postseasonEndDate: '2027-04-04',
      finalFourLocation: 'Columbus'
    },
    {
      season: '2027-28',
      firstPracticeDate: '2027-10-01', // Varies by institution
      firstGameDate: '2027-11-01',
      conferencePlayStartDate: '2027-12-18',
      conferencePlayEndDate: '2028-02-26',
      conferenceChampionshipStartDate: '2028-03-01',
      conferenceChampionshipEndDate: '2028-03-06',
      postseasonStartDate: '2028-03-15',
      postseasonEndDate: '2028-04-02',
      finalFourLocation: 'Indianapolis'
    },
    {
      season: '2028-29',
      firstPracticeDate: '2028-10-01', // Varies by institution
      firstGameDate: '2028-10-30',
      conferencePlayStartDate: '2028-12-16',
      conferencePlayEndDate: '2029-02-24',
      conferenceChampionshipStartDate: '2029-02-28',
      conferenceChampionshipEndDate: '2029-03-05',
      postseasonStartDate: '2029-03-14',
      postseasonEndDate: '2029-04-01',
      finalFourLocation: 'San Antonio'
    },
    {
      season: '2029-30',
      firstPracticeDate: '2029-10-01', // Varies by institution
      firstGameDate: '2029-11-05',
      conferencePlayStartDate: '2029-12-22',
      conferencePlayEndDate: '2030-03-02',
      conferenceChampionshipStartDate: '2030-03-06',
      conferenceChampionshipEndDate: '2030-03-11',
      postseasonStartDate: '2030-03-20',
      postseasonEndDate: '2030-04-07',
      finalFourLocation: 'Portland'
    }
  ]
};

module.exports = {
  mensBasketballConstraints,
  womensBasketballConstraints,
  basketballSeasonDates
};
