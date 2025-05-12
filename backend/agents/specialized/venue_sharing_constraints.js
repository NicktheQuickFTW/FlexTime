/**
 * Venue Sharing Constraints for the Big 12 Conference
 * 
 * This module defines constraints for schools that share venues across multiple sports,
 * ensuring that scheduling conflicts are avoided based on the priority hierarchy.
 */

/**
 * Schools with shared venues and the sports that share them
 */
const sharedVenueSchools = {
  'Arizona State': {
    venue: 'Desert Financial Arena',
    sports: [
      'Men\'s Basketball',
      'Women\'s Basketball',
      'Volleyball',
      'Gymnastics',
      'Wrestling'
    ]
  },
  'Iowa State': {
    venue: 'Hilton Coliseum',
    sports: [
      'Men\'s Basketball',
      'Women\'s Basketball',
      'Volleyball',
      'Gymnastics',
      'Wrestling'
    ]
  },
  'West Virginia': {
    venue: 'WVU Coliseum',
    sports: [
      'Men\'s Basketball',
      'Women\'s Basketball',
      'Volleyball',
      'Gymnastics',
      'Wrestling'
    ]
  }
};

/**
 * Priority hierarchy for scheduling in shared venues
 * Lower number indicates higher priority
 */
const sportPriorityHierarchy = {
  'Men\'s Basketball': 1,
  'Women\'s Basketball': 2,
  'Volleyball': 3,
  'Gymnastics': 4,
  'Wrestling': 5
};

/**
 * Venue sharing constraints
 */
const venueConstraints = {
  // Core scheduling principles (hard constraints)
  hard: {
    'no_same_day_conflicts': {
      description: 'Sports sharing the same venue cannot be scheduled on the same day at the same time',
      enforced: true
    }
  },
  
  // Soft scheduling principles
  soft: {
    'priority_hierarchy': {
      description: 'Respect the priority hierarchy when scheduling sports that share venues',
      weight: 0.9
    },
    'buffer_time': {
      description: 'Allow sufficient buffer time between events in shared venues',
      weight: 0.7,
      minBufferHours: 4
    },
    'venue_turnaround': {
      description: 'Allow sufficient time for venue setup/teardown between different sports',
      weight: 0.8,
      minTurnaroundHours: 6,
      sportSpecificTurnaround: {
        'Gymnastics': {
          before: 12, // Hours needed to set up gymnastics equipment
          after: 8    // Hours needed to tear down gymnastics equipment
        }
      }
    }
  }
};

/**
 * Evaluates if a proposed schedule respects venue sharing constraints
 * 
 * @param {Object} proposedSchedule - The schedule being evaluated
 * @param {Object} context - Additional context for evaluation
 * @returns {Object} - Evaluation result with status and explanation
 */
function evaluateVenueConstraints(proposedSchedule, context) {
  const conflicts = [];
  
  // Check for same-day conflicts at shared venues
  for (const school in sharedVenueSchools) {
    const sportEvents = proposedSchedule.filter(event => 
      event.homeTeam === school && 
      sharedVenueSchools[school].sports.includes(event.sport)
    );
    
    // Group events by date
    const eventsByDate = {};
    sportEvents.forEach(event => {
      const dateKey = event.date.toISOString().split('T')[0];
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = [];
      }
      eventsByDate[dateKey].push(event);
    });
    
    // Check for conflicts on each date
    for (const date in eventsByDate) {
      const eventsOnDate = eventsByDate[date];
      if (eventsOnDate.length > 1) {
        // Check for time overlaps
        for (let i = 0; i < eventsOnDate.length; i++) {
          for (let j = i + 1; j < eventsOnDate.length; j++) {
            const event1 = eventsOnDate[i];
            const event2 = eventsOnDate[j];
            
            // Check if events overlap in time
            if (doEventsOverlap(event1, event2)) {
              // Determine which event should have priority
              const priority1 = sportPriorityHierarchy[event1.sport] || 999;
              const priority2 = sportPriorityHierarchy[event2.sport] || 999;
              
              conflicts.push({
                school,
                venue: sharedVenueSchools[school].venue,
                date,
                conflictingEvents: [event1, event2],
                priorityConflict: priority1 !== priority2,
                higherPriorityEvent: priority1 < priority2 ? event1 : event2
              });
            }
          }
        }
      }
    }
  }
  
  return {
    satisfied: conflicts.length === 0,
    conflicts,
    explanation: conflicts.length === 0 
      ? 'No venue sharing conflicts detected' 
      : `Found ${conflicts.length} venue sharing conflicts`
  };
}

/**
 * Helper function to check if two events overlap in time
 */
function doEventsOverlap(event1, event2) {
  const start1 = new Date(event1.startTime).getTime();
  const end1 = new Date(event1.endTime).getTime();
  const start2 = new Date(event2.startTime).getTime();
  const end2 = new Date(event2.endTime).getTime();
  
  // Get the required turnaround time
  let turnaroundTime = 6 * 60 * 60 * 1000; // Default 6 hours in milliseconds
  
  // Check for sport-specific turnaround times
  if (event1.sport === 'Gymnastics' || event2.sport === 'Gymnastics') {
    // If event1 is gymnastics and happens before event2
    if (event1.sport === 'Gymnastics' && end1 <= start2) {
      turnaroundTime = 8 * 60 * 60 * 1000; // 8 hours after gymnastics
    }
    // If event2 is gymnastics and happens before event1
    else if (event2.sport === 'Gymnastics' && end2 <= start1) {
      turnaroundTime = 8 * 60 * 60 * 1000; // 8 hours after gymnastics
    }
    // If event1 is before gymnastics
    else if (event1.sport !== 'Gymnastics' && end1 <= start2 && event2.sport === 'Gymnastics') {
      turnaroundTime = 12 * 60 * 60 * 1000; // 12 hours before gymnastics
    }
    // If event2 is before gymnastics
    else if (event2.sport !== 'Gymnastics' && end2 <= start1 && event1.sport === 'Gymnastics') {
      turnaroundTime = 12 * 60 * 60 * 1000; // 12 hours before gymnastics
    }
  }
  
  // Check if events overlap considering the required turnaround time
  return (start1 < end2 + turnaroundTime && end1 + turnaroundTime > start2);
}

/**
 * Recommended scheduling windows for each sport in shared venues
 */
const recommendedWindows = {
  'Men\'s Basketball': {
    preferredDays: ['Tuesday', 'Wednesday', 'Saturday'],
    preferredTimeWindows: ['18:00-21:00'] // 6pm-9pm
  },
  'Women\'s Basketball': {
    preferredDays: ['Sunday', 'Monday', 'Thursday'],
    preferredTimeWindows: ['18:00-21:00'] // 6pm-9pm
  },
  'Volleyball': {
    preferredDays: ['Friday', 'Saturday', 'Sunday'],
    preferredTimeWindows: ['17:00-20:00'] // 5pm-8pm
  },
  'Gymnastics': {
    preferredDays: ['Friday', 'Saturday', 'Sunday'],
    preferredTimeWindows: ['13:00-16:00'] // 1pm-4pm
  },
  'Wrestling': {
    preferredDays: ['Friday', 'Saturday', 'Sunday'],
    preferredTimeWindows: ['12:00-15:00'] // 12pm-3pm
  }
};

module.exports = {
  sharedVenueSchools,
  sportPriorityHierarchy,
  venueConstraints,
  evaluateVenueConstraints,
  recommendedWindows
};
