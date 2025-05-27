/**
 * Gymnastics Scheduling Constraints for the Big 12 Conference
 * 
 * This module defines the specific scheduling constraints for gymnastics
 * based on the Big 12 Championship operational frameworks.
 */

/**
 * Gymnastics scheduling constraints
 */
const gymnasticsConstraints = {
  // Core scheduling principles (hard constraints)
  hard: {
    'conference_meet_count': {
      description: 'Each team must have exactly 6 conference meets (3 home, 3 away)',
      value: 6
    },
    'home_away_balance': {
      description: 'Each team must have exactly 3 home meets and 3 away meets',
      enforced: true
    },
    'schedule_duration': {
      description: 'All meets must be scheduled within an 8-week period',
      weeks: 8
    },
    'bye_weeks': {
      description: 'Each team must have exactly two bye weeks',
      enforced: true
    },
    'meet_each_opponent': {
      description: 'Each team must meet each other team at least once during the regular season',
      enforced: true
    },
    'dual_meet_format': {
      description: 'All conference meets shall be conducted as dual meets unless coaches mutually agree',
      enforced: true
    }
  },
  
  // Soft scheduling principles
  soft: {
    'consecutive_meets': {
      description: 'Avoid scheduling more than two consecutive meets without a bye',
      weight: 0.7
    },
    'travel_efficiency': {
      description: 'Minimize travel distance between consecutive away meets',
      weight: 0.6
    },
    'facility_availability': {
      description: 'Consider facility availability for meets',
      weight: 0.8
    },
    'exam_period_avoidance': {
      description: 'Avoid scheduling meets during final examination periods',
      weight: 0.8
    },
    'even_distribution': {
      description: 'Distribute meets evenly throughout the 8-week period',
      weight: 0.6
    }
  },
  
  // Season parameters
  seasonParameters: {
    totalMeets: 6,
    conferenceMeets: 6,
    totalWeeks: 8,
    byeWeeks: 2,
    meetFormat: 'Dual Meet',
    typicalMeetDays: ['Friday', 'Saturday', 'Sunday']
  }
};

/**
 * Gymnastics season dates for upcoming seasons
 * Note: These are placeholder dates that should be updated with actual conference schedules
 */
const gymnasticsSeasonDates = [
  {
    season: '2024-25',
    conferencePlayStartDate: '2025-01-10',
    conferencePlayEndDate: '2025-03-07',
    conferenceChampionshipStartDate: '2025-03-21',
    conferenceChampionshipEndDate: '2025-03-22',
    postseasonStartDate: '2025-04-04',
    postseasonEndDate: '2025-04-20',
    notes: '6 dual meets (3 home, 3 away) over 8 weeks with 2 bye weeks'
  },
  {
    season: '2025-26',
    conferencePlayStartDate: '2026-01-09',
    conferencePlayEndDate: '2026-03-06',
    conferenceChampionshipStartDate: '2026-03-20',
    conferenceChampionshipEndDate: '2026-03-21',
    postseasonStartDate: '2026-04-03',
    postseasonEndDate: '2026-04-19',
    notes: '6 dual meets (3 home, 3 away) over 8 weeks with 2 bye weeks'
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

/**
 * NCAA gymnastics guidelines for regular-season competition
 */
const ncaaGuidelines = {
  meetFormat: {
    events: ['Vault', 'Uneven Bars', 'Balance Beam', 'Floor Exercise'],
    rotationOrder: 'Determined by home team or visiting coach in multi-team meets',
    warmupTime: '4:00 per event',
    competitionTime: 'Approximately 2 hours total'
  },
  scoring: {
    judgesPerEvent: 2,
    scoreRange: '0.00 to 10.00',
    teamScore: 'Sum of top 5 scores from 6 competitors per event'
  },
  facilityRequirements: {
    equipmentStandards: 'Must meet NCAA specifications',
    safetyMats: 'Required around all apparatus',
    lightingStandards: 'Minimum 100 foot-candles',
    temperatureRange: '68-72 degrees Fahrenheit'
  }
};

module.exports = {
  gymnasticsConstraints,
  gymnasticsSeasonDates,
  specialDates,
  ncaaGuidelines
};
