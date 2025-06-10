/**
 * Historical Big 12 Campus Conflicts Configuration
 * 
 * Maintains historical record of campus conflicts for pattern analysis
 * and future scheduling reference
 */

module.exports = {
  /**
   * 2024-25 Academic Year Conflicts (Reference)
   */
  '2024-25': {
    graduationDates: {
      'arizona': '2025-05-16',
      'arizona-state': '2025-05-12',
      'baylor': '2025-05-16 to 2025-05-17',
      'byu': '2025-04-24 to 2025-04-25',
      'ucf': '2025-05-01 to 2025-05-03',
      'cincinnati': '2025-05-02 to 2025-05-03',
      'colorado': '2025-05-08',
      'houston': '2025-05-08 to 2025-05-11',
      'iowa-state': '2025-05-15 to 2025-05-17',
      'kansas': '2025-05-18',
      'kansas-state': '2025-05-16 to 2025-05-17',
      'oklahoma-state': '2025-05-03',
      'tcu': '2025-05-10',
      'texas-tech': '2025-05-16 to 2025-05-17',
      'utah': '2025-05-01 to 2025-05-02',
      'west-virginia': '2025-05-16 to 2025-05-18'
    },
    
    springBreaks: {
      'arizona': '2025-03-08 to 2025-03-16',
      'arizona-state': '2025-03-09 to 2025-03-16',
      'baylor': '2025-03-08 to 2025-03-16',
      'byu': '2025-03-21', // Only one day!
      'ucf': '2025-03-15 to 2025-03-23',
      'cincinnati': '2025-03-17 to 2025-03-23',
      'colorado': '2025-03-24 to 2025-03-28',
      'houston': '2025-03-10 to 2025-03-16',
      'iowa-state': '2025-03-17 to 2025-03-21',
      'kansas': '2025-03-17 to 2025-03-21',
      'kansas-state': '2025-03-17 to 2025-03-21',
      'oklahoma-state': '2025-03-17 to 2025-03-21',
      'tcu': '2025-03-10 to 2025-03-14',
      'texas-tech': '2025-03-10 to 2025-03-15',
      'utah': '2025-03-09 to 2025-03-16',
      'west-virginia': '2025-03-15 to 2025-03-23'
    },
    
    examPreferences: {
      baseball: {
        'baylor': 'Home during exams (May 9-11)',
        'byu': 'Home April 18-19',
        'cincinnati': 'Home April 25-27 (beginning of exam week)',
        'houston': 'Home during exams (May 1-4)',
        'kansas': 'Home May 8-11 (weekend before exams)',
        'tcu': 'Home during exam week (May 8-11)',
        'texas-tech': 'Home during exams (May 8-13)',
        'utah': 'Home during exam week (April 24-27)',
        'ucf': 'Home April 20-21',
        'west-virginia': 'Home May 1-4 (before exams)'
      },
      softball: {
        'baylor': 'Home during exams (May 9-11)',
        'byu': 'Home April 18-19',
        'houston': 'Home during exams (May 1-4)',
        'kansas': 'Home May 8-11 (weekend before exams)',
        'texas-tech': 'Home during exams (May 8-13)',
        'utah': 'Home April 24-27 (Fri/Sat/Sun if away)',
        'ucf': 'Home April 20-21'
      }
    },
    
    facilityConflicts: {
      'arizona-state': [
        'May 5-7 hosting NCAA W Golf Regionals',
        'Arena closed Dec 16-19 for graduation',
        'Arena closed May 12-15 for graduation',
        'Unable to compete during finals'
      ],
      'cincinnati': ['Cannot host baseball May 2-3 (commencement)'],
      'colorado': ['Cannot host during finals or commencement']
    },
    
    religiousObservances: {
      'byu': [
        'No Sunday competitions',
        'Avoid Oct 5-6, 2024 (LDS General Conference)',
        'Avoid April 5-6, 2025 (LDS General Conference)'
      ],
      'utah': ['Oct 5-6, 2024 (LDS General Conference)']
    }
  },
  
  /**
   * 2025-26 Academic Year Conflicts (Current)
   */
  '2025-26': {
    graduationDates: {
      'arizona': 'Not provided',
      'arizona-state': '2026-05-11',
      'baylor': 'Not available (calendar in progress)',
      'byu': '2026-04-23 to 2026-04-24',
      'ucf': '2026-04-30 to 2026-05-02',
      'cincinnati': '2026-05-01 to 2026-05-02',
      'colorado': '2026-05-07',
      'houston': '2026-05-09 to 2026-05-11',
      'iowa-state': '2026-05-14 to 2026-05-16',
      'kansas': '2026-05-17 (tentative)',
      'kansas-state': 'Not provided',
      'oklahoma-state': 'Not provided',
      'tcu': '2026-05-09 to 2026-05-10',
      'texas-tech': '2026-05-15 to 2026-05-16 (unofficial)',
      'utah': '2026-04-30 to 2026-05-01',
      'west-virginia': '2026-05-15 to 2026-05-17 (tentative)'
    },
    
    examPreferences: {
      baseball: {
        'baylor': 'Home during exams',
        'byu': 'Home April 17-18',
        'cincinnati': 'Home April 24-26 (beginning of exams)',
        'houston': 'Home April 30 - May 3',
        'kansas': 'Home May 15-17',
        'tcu': 'Home May 4-8',
        'texas-tech': 'Home May 7-12',
        'utah': 'Home April 23-26',
        'ucf': 'Home April 24-26',
        'west-virginia': 'Home April 30 - May 3 (before exams preferred)'
      },
      softball: {
        'baylor': 'Home during exams',
        'byu': 'Home April 17-18',
        'houston': 'Home April 30 - May 3',
        'kansas': 'Home May 15-17',
        'texas-tech': 'Home May 7-12',
        'utah': 'Home April 23-26 (Fri/Sat/Sun if away)',
        'ucf': 'Home April 24-26'
      }
    },
    
    facilityConflicts: {
      'arizona-state': [
        'April 1-5 hosting NCAA Gymnastics regionals and WBB Final Four',
        'May 18-20 hosting NCAA Men\'s Golf regional',
        'Arena closed Dec 13-18 for graduation',
        'Unable to compete during finals',
        'Cannot host soccer/volleyball on home football dates'
      ],
      'colorado': ['Cannot host during finals or commencement'],
      'tcu': ['Cannot host December 13'],
      'ucf': ['Prefer not to host soccer/volleyball on home football dates']
    },
    
    religiousObservances: {
      'byu': [
        'No Sunday competitions',
        'Avoid Oct 4-5, 2025 (LDS General Conference)',
        'Avoid April 4-5, 2026 (LDS General Conference)'
      ]
    },
    
    specialNotes: {
      'arizona': 'Football scheduling through 2034 provided',
      'arizona-state': 'March/April baseball highly attended (Spring Training)',
      'baylor': 'Calendar to be completed by mid-December',
      'byu': 'Tennis traditionally plays Utah last',
      'west-virginia': 'Baseball prefers early conference bye weekend',
      'west-virginia': '2025-26 calendar not finalized'
    }
  },
  
  /**
   * Common Patterns Across Years
   */
  patterns: {
    graduationPeriod: {
      earliest: 'Late April (BYU)',
      latest: 'Mid-May (most schools)',
      peak: 'May 8-17'
    },
    
    examPreferences: {
      trend: 'Most baseball/softball programs prefer home games during exams',
      exceptions: ['West Virginia prefers travel before exams']
    },
    
    consistentConflicts: {
      'byu': 'Sunday restrictions and LDS General Conference dates',
      'arizona-state': 'Arena closures for graduation, NCAA hosting duties',
      'colorado': 'Cannot host during finals or commencement'
    },
    
    footballConflicts: {
      'arizona-state': 'Cannot host soccer/volleyball on home football dates',
      'ucf': 'Prefers not to host soccer/volleyball on home football dates'
    },
    
    calendarVariability: {
      note: 'Several schools finalize calendars late in the fall',
      affected: ['baylor', 'west-virginia', 'texas-tech', 'kansas']
    }
  },
  
  /**
   * Helper function to check if a pattern exists across years
   */
  hasConsistentPattern(school, conflictType) {
    const patterns = [];
    Object.keys(this).forEach(year => {
      if (year.includes('-') && this[year][conflictType]) {
        const pattern = this[year][conflictType][school];
        if (pattern) patterns.push({ year, pattern });
      }
    });
    return patterns.length > 1;
  }
};