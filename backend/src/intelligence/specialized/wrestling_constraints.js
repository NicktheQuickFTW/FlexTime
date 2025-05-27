/**
 * Wrestling Scheduling Constraints for the Big 12 Conference
 * 
 * This module defines the specific scheduling constraints for wrestling
 * based on the Big 12 Championship operational frameworks.
 */

/**
 * Wrestling scheduling constraints
 */
const wrestlingConstraints = {
  // Core scheduling principles (hard constraints)
  hard: {
    'conference_meet_count': {
      description: 'Each team must have exactly 8 conference meets (4 home, 4 away)',
      value: 8
    },
    'home_away_balance': {
      description: 'Each team must have exactly 4 home meets and 4 away meets',
      enforced: true
    },
    'schedule_duration': {
      description: 'All meets must be scheduled within a 7-week period',
      weeks: 7
    },
    'legacy_matchups': {
      description: 'Legacy schools (Arizona State, Iowa State, Oklahoma State, West Virginia) must wrestle each other every year',
      enforced: true
    },
    'travel_partner_system': {
      description: 'Respect established travel partnerships for scheduling',
      enforced: true
    },
    'special_agreements': {
      description: 'Honor special scheduling agreements between schools (e.g., Arizona State hosting Oklahoma State in 2026 and 2027)',
      enforced: true
    }
  },
  
  // Soft scheduling principles
  soft: {
    'travel_optimization': {
      description: 'Schedule road trips with 2 away matches against another travel pair on the same weekend',
      weight: 0.8
    },
    'affiliate_hosting': {
      description: 'Affiliate schools must host a legacy school every two years',
      weight: 0.7
    },
    'rest_days': {
      description: 'Ensure adequate rest between meets',
      weight: 0.7,
      minRestDays: 1
    },
    'travel_distance': {
      description: 'Minimize travel distance between consecutive away meets',
      weight: 0.6
    },
    'exam_period_avoidance': {
      description: 'Avoid scheduling meets during final examination periods',
      weight: 0.6
    },
    'two_year_cycle': {
      description: 'In year two, teams should compete against the same opponents but flip home/away designations',
      weight: 0.9
    }
  },
  
  // Season parameters
  seasonParameters: {
    totalMeets: 8,
    conferenceMeets: 8,
    totalWeeks: 7,
    byeWeeks: 0,
    meetFormat: 'Dual Meet',
    typicalMeetDays: ['Friday', 'Saturday'],
    minRestDays: 1,
    twoYearCycle: true
  }
};

/**
 * Travel partners for wrestling
 */
const travelPartners = {
  'Air Force': 'Northern Colorado',
  'Northern Colorado': 'Air Force',
  'Wyoming': 'Utah Valley',
  'Utah Valley': 'Wyoming',
  'North Dakota State': 'South Dakota State',
  'South Dakota State': 'North Dakota State',
  'Oklahoma': 'Oklahoma State',
  'Oklahoma State': 'Oklahoma',
  'Cal Baptist': 'Arizona State',
  'Arizona State': 'Cal Baptist',
  'Iowa State': 'Northern Iowa',
  'Northern Iowa': 'Iowa State',
  'Missouri': 'West Virginia',
  'West Virginia': 'Missouri'
};

/**
 * Legacy and affiliate schools
 */
const schools = {
  legacy: ['Arizona State', 'Iowa State', 'Oklahoma State', 'West Virginia'],
  affiliate: [
    'Air Force', 'Northern Colorado', 'Wyoming', 'Utah Valley', 
    'North Dakota State', 'South Dakota State', 'Oklahoma', 
    'Cal Baptist', 'Northern Iowa', 'Missouri'
  ]
};

/**
 * Special scheduling agreements
 */
const specialAgreements = [
  {
    teams: ['Arizona State', 'Oklahoma State'],
    years: ['2026', '2027'],
    homeTeam: 'Arizona State',
    description: 'Arizona State must host Oklahoma State in 2026 and 2027 per a previous agreement'
  }
];

/**
 * Wrestling season dates for upcoming seasons
 */
const wrestlingSeasonDates = [
  {
    season: '2024-25',
    conferencePlayStartDate: '2025-01-10',
    conferencePlayEndDate: '2025-02-28',
    conferenceChampionshipStartDate: '2025-03-07',
    conferenceChampionshipEndDate: '2025-03-08',
    notes: '8 meets (4 home, 4 away) over 7 weeks with travel partner system'
  },
  {
    season: '2025-26',
    conferencePlayStartDate: '2026-01-09',
    conferencePlayEndDate: '2026-02-27',
    conferenceChampionshipStartDate: '2026-03-06',
    conferenceChampionshipEndDate: '2026-03-07',
    notes: '8 meets (4 home, 4 away) over 7 weeks with travel partner system, flipped home/away from previous year'
  }
];

/**
 * Special dates to consider for scheduling
 */
const specialDates = {
  '2024-25': {
    'Winter Break': {
      'Approximate Start': '2024-12-15',
      'Approximate End': '2025-01-05'
    },
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
    'Winter Break': {
      'Approximate Start': '2025-12-14',
      'Approximate End': '2026-01-04'
    },
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

module.exports = {
  wrestlingConstraints,
  travelPartners,
  schools,
  specialAgreements,
  wrestlingSeasonDates,
  specialDates
};
