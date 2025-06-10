/**
 * 2025-26 Big 12 Campus Conflicts Configuration
 * 
 * Centralized configuration for all campus-specific scheduling conflicts
 * Based on official Big 12 Campus Conflicts spreadsheet
 */

export default {
  // Graduation dates when schools cannot host
  graduationBlackouts: {
    '2026-04-23': ['byu'],
    '2026-04-24': ['byu'],
    '2026-04-30': ['utah', 'ucf'],
    '2026-05-01': ['utah', 'ucf', 'cincinnati'],
    '2026-05-02': ['ucf', 'cincinnati'],
    '2026-05-07': ['colorado'],
    '2026-05-09': ['tcu', 'houston'],
    '2026-05-10': ['tcu', 'houston'],
    '2026-05-11': ['arizona-state', 'houston'],
    '2026-05-14': ['iowa-state'],
    '2026-05-15': ['iowa-state', 'texas-tech', 'west-virginia'],
    '2026-05-16': ['iowa-state', 'texas-tech', 'west-virginia'],
    '2026-05-17': ['kansas', 'west-virginia']
  },
  
  // Religious observances
  religiousBlackouts: {
    // BYU - No Sunday competitions ever (handled separately)
    // LDS General Conference dates
    '2025-10-04': ['byu'],
    '2025-10-05': ['byu'],
    '2026-04-04': ['byu'],
    '2026-04-05': ['byu']
  },
  
  // Facility-specific blackouts
  facilityBlackouts: {
    // Arizona State
    '2025-12-13': ['arizona-state'], // Arena closed for graduation
    '2025-12-14': ['arizona-state'],
    '2025-12-15': ['arizona-state'],
    '2025-12-16': ['arizona-state'],
    '2025-12-17': ['arizona-state'],
    '2025-12-18': ['arizona-state'],
    '2026-04-01': ['arizona-state'], // NCAA events
    '2026-04-02': ['arizona-state'],
    '2026-04-03': ['arizona-state'],
    '2026-04-04': ['arizona-state'],
    '2026-04-05': ['arizona-state'],
    '2026-05-18': ['arizona-state'], // NCAA Golf
    '2026-05-19': ['arizona-state'],
    '2026-05-20': ['arizona-state'],
    
    // TCU
    '2025-12-13': ['tcu']
  },
  
  // Sport-specific preferences
  sportPreferences: {
    baseball: {
      // Teams preferring home games during exams
      homeExamPreferences: {
        'baylor': { preference: 'during_exams' },
        'cincinnati': { dates: ['2026-04-24', '2026-04-25', '2026-04-26'] },
        'houston': { dates: ['2026-04-30', '2026-05-01', '2026-05-02', '2026-05-03'] },
        'kansas': { dates: ['2026-05-15', '2026-05-16', '2026-05-17'] },
        'tcu': { dates: ['2026-05-04', '2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08'] },
        'texas-tech': { dates: ['2026-05-07', '2026-05-08', '2026-05-09', '2026-05-10', '2026-05-11', '2026-05-12'] },
        'utah': { dates: ['2026-04-23', '2026-04-24', '2026-04-25', '2026-04-26'] },
        'west-virginia': { 
          dates: ['2026-04-30', '2026-05-01', '2026-05-02', '2026-05-03'],
          note: 'Prefer travel before exams rather than during'
        }
      },
      
      // Special preferences
      specialPreferences: {
        'arizona-state': {
          marchApril: 'High attendance due to Spring Training (5-6K crowds)'
        },
        'byu': {
          preferredDates: ['2026-04-17', '2026-04-18']
        },
        'ucf': {
          preferredDates: ['2026-04-24', '2026-04-25', '2026-04-26']
        },
        'west-virginia': {
          byeWeek: 'Prefer early in conference schedule'
        }
      }
    },
    
    softball: {
      // Teams preferring home games during exams
      homeExamPreferences: {
        'baylor': { preference: 'during_exams' },
        'houston': { dates: ['2026-04-30', '2026-05-01', '2026-05-02', '2026-05-03'] },
        'kansas': { dates: ['2026-05-15', '2026-05-16', '2026-05-17'] },
        'texas-tech': { dates: ['2026-05-07', '2026-05-08', '2026-05-09', '2026-05-10', '2026-05-11', '2026-05-12'] },
        'utah': { 
          dates: ['2026-04-23', '2026-04-24', '2026-04-25', '2026-04-26'],
          awaySchedule: 'If away, prefer Fri/Sat/Sun schedule'
        }
      },
      
      // Special preferences
      specialPreferences: {
        'byu': {
          preferredDates: ['2026-04-17', '2026-04-18']
        },
        'ucf': {
          preferredDates: ['2026-04-24', '2026-04-25', '2026-04-26']
        }
      }
    },
    
    menstennis: {
      specialArrangements: {
        'byu-utah': 'Traditional home-and-home with Utah hosting last'
      }
    },
    
    womenstennis: {
      specialArrangements: {
        'byu-utah': 'Traditional home-and-home with Utah hosting last'
      }
    },
    
    soccer: {
      avoidConflicts: {
        'arizona-state': 'Cannot host on home football dates',
        'ucf': 'Prefer not to host on home football dates'
      }
    },
    
    volleyball: {
      avoidConflicts: {
        'arizona-state': 'Cannot host on home football dates',
        'ucf': 'Prefer not to host on home football dates'
      }
    }
  },
  
  // Finals week restrictions
  finalsRestrictions: {
    'arizona-state': {
      restriction: 'Unable to compete during finals',
      sports: ['basketball', 'gymnastics']
    },
    'colorado': {
      restriction: 'Cannot host during final exams'
    }
  },
  
  // Calendar status
  calendarStatus: {
    'baylor': {
      status: 'In progress',
      expectedCompletion: 'Mid-December 2025'
    },
    'west-virginia': {
      status: 'Not finalized',
      note: 'Dates subject to change'
    },
    'texas-tech': {
      graduationStatus: 'Unofficial'
    },
    'kansas': {
      graduationStatus: 'Tentative'
    }
  },
  
  /**
   * Helper function to check if a date is blacked out for a school
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} schoolId - School identifier
   * @returns {boolean} True if date is blacked out
   */
  isDateBlackedOut(date, schoolId) {
    // Check graduation blackouts
    if (this.graduationBlackouts[date]?.includes(schoolId)) {
      return true;
    }
    
    // Check religious blackouts
    if (this.religiousBlackouts[date]?.includes(schoolId)) {
      return true;
    }
    
    // Check facility blackouts
    if (this.facilityBlackouts[date]?.includes(schoolId)) {
      return true;
    }
    
    // BYU Sunday check
    if (schoolId === 'byu') {
      const dayOfWeek = new Date(date).getDay();
      if (dayOfWeek === 0) { // Sunday
        return true;
      }
    }
    
    return false;
  },
  
  /**
   * Get all blackout dates for a school
   * @param {string} schoolId - School identifier
   * @returns {Array} Array of blackout dates
   */
  getSchoolBlackouts(schoolId) {
    const blackouts = [];
    
    // Add graduation blackouts
    Object.entries(this.graduationBlackouts).forEach(([date, schools]) => {
      if (schools.includes(schoolId)) {
        blackouts.push({ date, reason: 'graduation' });
      }
    });
    
    // Add religious blackouts
    Object.entries(this.religiousBlackouts).forEach(([date, schools]) => {
      if (schools.includes(schoolId)) {
        blackouts.push({ date, reason: 'religious observance' });
      }
    });
    
    // Add facility blackouts
    Object.entries(this.facilityBlackouts).forEach(([date, schools]) => {
      if (schools.includes(schoolId)) {
        blackouts.push({ date, reason: 'facility unavailable' });
      }
    });
    
    return blackouts;
  },
  
  /**
   * Get sport-specific preferences for a school
   * @param {string} sport - Sport name
   * @param {string} schoolId - School identifier
   * @returns {Object} Preferences object
   */
  getSportPreferences(sport, schoolId) {
    const sportLower = sport.toLowerCase().replace(/\s+/g, '');
    const prefs = this.sportPreferences[sportLower];
    
    if (!prefs) return null;
    
    return {
      homeExam: prefs.homeExamPreferences?.[schoolId],
      special: prefs.specialPreferences?.[schoolId],
      avoid: prefs.avoidConflicts?.[schoolId],
      arrangement: prefs.specialArrangements?.[`${schoolId}-*`] || 
                   Object.entries(prefs.specialArrangements || {})
                     .find(([key]) => key.includes(schoolId))?.[1]
    };
  }
};