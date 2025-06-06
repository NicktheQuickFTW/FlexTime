/**
 * Resolution Strategies Module for FlexTime
 * 
 * This module provides specialized resolution strategies for different types of scheduling conflicts:
 * - Time-shifting strategies (move events earlier/later)
 * - Date-shifting strategies (reschedule to different days)
 * - Venue reassignment strategies
 * - Team swapping strategies
 */

const logger = require("../../lib/logger");;
const MCPConnector = require('../mcp_connector');
// MCP config removed, using default config instead
const mcpConfig = {}; // Empty object as fallback

// Initialize FlexTime connector for AI-assisted resolutions
const mcpConnector = new MCPConnector(mcpConfig);

/**
 * Resolve venue conflicts by relocating or rescheduling events
 * 
 * @param {Array<object>} conflicts - Venue conflicts to resolve
 * @param {Array<object>} schedule - Original schedule
 * @param {object} context - Additional context including venues
 * @returns {object} Resolution results with modified schedule
 */
async function resolveVenueConflicts(conflicts, schedule, context = {}) {
  const resolutions = [];
  const modifiedSchedule = JSON.parse(JSON.stringify(schedule));
  const venues = context.venues || {};
  
  logger.info(`Resolving ${conflicts.length} venue conflicts`);
  
  try {
    for (const conflict of conflicts) {
      if (conflict.type !== 'venue') continue;
      
      const conflictingEvents = conflict.events;
      if (!conflictingEvents || conflictingEvents.length < 2) continue;
      
      // Get the actual events from the schedule
      const event1Index = findEventIndex(modifiedSchedule, conflictingEvents[0]);
      const event2Index = findEventIndex(modifiedSchedule, conflictingEvents[1]);
      
      if (event1Index === -1 || event2Index === -1) {
        logger.warn(`Could not find conflicting events in schedule`);
        continue;
      }
      
      // Try resolution strategies in priority order
      let resolved = false;
      
      // 1. Try to find an alternate venue for one of the events
      if (!resolved && Object.keys(venues).length > 0) {
        resolved = await tryAlternateVenue(modifiedSchedule, event1Index, event2Index, venues, resolutions, conflict);
      }
      
      // 2. Try to time-shift one of the events
      if (!resolved) {
        resolved = tryTimeShift(modifiedSchedule, event1Index, event2Index, resolutions, conflict);
      }
      
      // 3. Try to date-shift one of the events
      if (!resolved) {
        resolved = tryDateShift(modifiedSchedule, event1Index, event2Index, resolutions, conflict);
      }
      
      // If all strategies fail, log that this conflict couldn't be resolved
      if (!resolved) {
        logger.warn(`Could not resolve venue conflict: ${conflict.id}`);
      }
    }
    
    return {
      resolutions,
      modifiedSchedule
    };
  } catch (error) {
    logger.error(`Error resolving venue conflicts: ${error.message}`);
    return {
      error: error.message,
      resolutions,
      modifiedSchedule
    };
  }
}

/**
 * Resolve team conflicts by rescheduling events
 * 
 * @param {Array<object>} conflicts - Team conflicts to resolve
 * @param {Array<object>} schedule - Original schedule
 * @param {object} context - Additional context
 * @returns {object} Resolution results with modified schedule
 */
async function resolveTeamConflicts(conflicts, schedule, context = {}) {
  const resolutions = [];
  const modifiedSchedule = JSON.parse(JSON.stringify(schedule));
  
  logger.info(`Resolving ${conflicts.length} team conflicts`);
  
  try {
    for (const conflict of conflicts) {
      if (conflict.type !== 'team') continue;
      
      const conflictingEvents = conflict.events;
      if (!conflictingEvents || conflictingEvents.length < 2) continue;
      
      // Get the actual events from the schedule
      const event1Index = findEventIndex(modifiedSchedule, conflictingEvents[0]);
      const event2Index = findEventIndex(modifiedSchedule, conflictingEvents[1]);
      
      if (event1Index === -1 || event2Index === -1) {
        logger.warn(`Could not find conflicting events in schedule`);
        continue;
      }
      
      // Try resolution strategies in priority order
      let resolved = false;
      
      // 1. Try to date-shift one of the events (most effective for team conflicts)
      if (!resolved) {
        resolved = tryDateShift(modifiedSchedule, event1Index, event2Index, resolutions, conflict, 1); // +1 day
      }
      
      // 2. If same-day conflict, try time shift with larger gap
      if (!resolved && conflict.subType !== 'rest') {
        resolved = tryTimeShift(modifiedSchedule, event1Index, event2Index, resolutions, conflict, 4); // 4 hours shift
      }
      
      // 3. Try team swap (if we have context about eligible teams)
      if (!resolved && context.eligibleTeams) {
        resolved = await tryTeamSwap(modifiedSchedule, event1Index, event2Index, context.eligibleTeams, resolutions, conflict);
      }
      
      // If all strategies fail, log that this conflict couldn't be resolved
      if (!resolved) {
        logger.warn(`Could not resolve team conflict: ${conflict.id}`);
      }
    }
    
    return {
      resolutions,
      modifiedSchedule
    };
  } catch (error) {
    logger.error(`Error resolving team conflicts: ${error.message}`);
    return {
      error: error.message,
      resolutions,
      modifiedSchedule
    };
  }
}

/**
 * Resolve travel conflicts by adjusting schedules to accommodate travel time
 * 
 * @param {Array<object>} conflicts - Travel conflicts to resolve
 * @param {Array<object>} schedule - Original schedule
 * @param {object} context - Additional context
 * @returns {object} Resolution results with modified schedule
 */
async function resolveTravelConflicts(conflicts, schedule, context = {}) {
  const resolutions = [];
  const modifiedSchedule = JSON.parse(JSON.stringify(schedule));
  
  logger.info(`Resolving ${conflicts.length} travel conflicts`);
  
  try {
    for (const conflict of conflicts) {
      if (conflict.type !== 'travel') continue;
      
      const conflictingEvents = conflict.events;
      if (!conflictingEvents || conflictingEvents.length < 2) continue;
      
      // Get the actual events from the schedule
      const event1Index = findEventIndex(modifiedSchedule, conflictingEvents[0]);
      const event2Index = findEventIndex(modifiedSchedule, conflictingEvents[1]);
      
      if (event1Index === -1 || event2Index === -1) {
        logger.warn(`Could not find conflicting events in schedule`);
        continue;
      }
      
      // Try resolution strategies in priority order
      let resolved = false;
      
      // 1. Try to shift the second event to provide adequate travel time
      if (!resolved) {
        const hoursToShift = Math.ceil(conflict.requiredHours - conflict.availableHours);
        resolved = tryDateTimeShift(modifiedSchedule, event2Index, hoursToShift, resolutions, conflict);
      }
      
      // 2. Try to find an alternate venue for the second event
      if (!resolved && context.venues) {
        resolved = await tryAlternateVenue(
          modifiedSchedule, 
          event1Index, 
          event2Index, 
          context.venues, 
          resolutions, 
          conflict,
          true // Prioritize closer venues
        );
      }
      
      // If all strategies fail, log that this conflict couldn't be resolved
      if (!resolved) {
        logger.warn(`Could not resolve travel conflict: ${conflict.id}`);
      }
    }
    
    return {
      resolutions,
      modifiedSchedule
    };
  } catch (error) {
    logger.error(`Error resolving travel conflicts: ${error.message}`);
    return {
      error: error.message,
      resolutions,
      modifiedSchedule
    };
  }
}

/**
 * Resolve rest period conflicts by adjusting schedules to provide adequate rest
 * 
 * @param {Array<object>} conflicts - Rest period conflicts to resolve
 * @param {Array<object>} schedule - Original schedule
 * @param {object} context - Additional context
 * @returns {object} Resolution results with modified schedule
 */
async function resolveRestPeriodConflicts(conflicts, schedule, context = {}) {
  const resolutions = [];
  const modifiedSchedule = JSON.parse(JSON.stringify(schedule));
  
  logger.info(`Resolving ${conflicts.length} rest period conflicts`);
  
  try {
    for (const conflict of conflicts) {
      if (conflict.type !== 'rest') continue;
      
      const conflictingEvents = conflict.events;
      if (!conflictingEvents || conflictingEvents.length < 2) continue;
      
      // Get the actual events from the schedule
      const event1Index = findEventIndex(modifiedSchedule, conflictingEvents[0]);
      const event2Index = findEventIndex(modifiedSchedule, conflictingEvents[1]);
      
      if (event1Index === -1 || event2Index === -1) {
        logger.warn(`Could not find conflicting events in schedule`);
        continue;
      }
      
      // Try resolution strategies in priority order
      let resolved = false;
      
      // 1. Try to shift the second event to provide adequate rest
      if (!resolved) {
        const hoursToShift = Math.ceil(conflict.requiredRest - conflict.restHours);
        resolved = tryDateTimeShift(modifiedSchedule, event2Index, hoursToShift, resolutions, conflict);
      }
      
      // 2. Try team swap if we have eligible teams
      if (!resolved && context.eligibleTeams) {
        resolved = await tryTeamSwap(modifiedSchedule, event2Index, -1, context.eligibleTeams, resolutions, conflict);
      }
      
      // If all strategies fail, log that this conflict couldn't be resolved
      if (!resolved) {
        logger.warn(`Could not resolve rest period conflict: ${conflict.id}`);
      }
    }
    
    return {
      resolutions,
      modifiedSchedule
    };
  } catch (error) {
    logger.error(`Error resolving rest period conflicts: ${error.message}`);
    return {
      error: error.message,
      resolutions,
      modifiedSchedule
    };
  }
}

/**
 * Try to find an alternate venue for one of the events
 * 
 * @param {Array<object>} schedule - Schedule to modify
 * @param {number} event1Index - Index of first event
 * @param {number} event2Index - Index of second event
 * @param {object} venues - Available venues
 * @param {Array<object>} resolutions - Resolution results to update
 * @param {object} conflict - Original conflict
 * @param {boolean} prioritizeCloser - Whether to prioritize closer venues
 * @returns {boolean} Whether the conflict was resolved
 * @private
 */
async function tryAlternateVenue(
  schedule, 
  event1Index, 
  event2Index, 
  venues, 
  resolutions, 
  conflict,
  prioritizeCloser = false
) {
  try {
    const event1 = schedule[event1Index];
    const event2 = schedule[event2Index];
    
    // Get the current venue
    const currentVenue = event1.venue;
    
    // Find alternative venues
    const alternativeVenues = Object.keys(venues).filter(venue => 
      venue !== currentVenue && 
      venue !== event2.venue
    );
    
    if (alternativeVenues.length === 0) {
      return false;
    }
    
    // Sort venues by suitability
    let suitableVenues = alternativeVenues;
    
    if (prioritizeCloser && venues[currentVenue]?.coordinates) {
      // Sort by distance if we're looking for closer venues
      suitableVenues = alternativeVenues.sort((a, b) => {
        const distanceA = calculateDistance(
          venues[currentVenue].coordinates,
          venues[a].coordinates
        );
        const distanceB = calculateDistance(
          venues[currentVenue].coordinates,
          venues[b].coordinates
        );
        return distanceA - distanceB;
      });
    }
    
    // Check venue availability (simplified - in production would check against all events)
    // For now, just pick the first alternative venue
    const newVenue = suitableVenues[0];
    
    // Apply the change
    const oldVenue = event1.venue;
    event1.venue = newVenue;
    
    // Record the resolution
    resolutions.push({
      conflictId: conflict.id,
      conflictType: conflict.type,
      resolutionType: 'venue_change',
      event: {
        id: event1.id,
        date: event1.date,
        startTime: event1.startTime
      },
      change: {
        from: { venue: oldVenue },
        to: { venue: newVenue }
      },
      description: `Changed venue for event on ${event1.date} from ${oldVenue} to ${newVenue}`
    });
    
    return true;
  } catch (error) {
    logger.error(`Error in tryAlternateVenue: ${error.message}`);
    return false;
  }
}

/**
 * Try to shift the time of one event to resolve a conflict
 * 
 * @param {Array<object>} schedule - Schedule to modify
 * @param {number} event1Index - Index of first event
 * @param {number} event2Index - Index of second event
 * @param {Array<object>} resolutions - Resolution results to update
 * @param {object} conflict - Original conflict
 * @param {number} hoursToShift - How many hours to shift the time
 * @returns {boolean} Whether the conflict was resolved
 * @private
 */
function tryTimeShift(schedule, event1Index, event2Index, resolutions, conflict, hoursToShift = 3) {
  try {
    const event1 = schedule[event1Index];
    const event2 = schedule[event2Index];
    
    // Parse the original time
    const originalTime = event2.startTime || '00:00';
    const [hours, minutes] = originalTime.split(':').map(Number);
    
    // Calculate new time
    const eventDate = new Date(`${event2.date}T${originalTime}:00`);
    eventDate.setHours(eventDate.getHours() + hoursToShift);
    
    // Format new time
    const newHours = eventDate.getHours().toString().padStart(2, '0');
    const newMinutes = eventDate.getMinutes().toString().padStart(2, '0');
    const newTime = `${newHours}:${newMinutes}`;
    
    // Apply the change
    event2.startTime = newTime;
    
    // Record the resolution
    resolutions.push({
      conflictId: conflict.id,
      conflictType: conflict.type,
      resolutionType: 'time_shift',
      event: {
        id: event2.id,
        date: event2.date,
        startTime: originalTime
      },
      change: {
        from: { startTime: originalTime },
        to: { startTime: newTime }
      },
      description: `Shifted time for event on ${event2.date} from ${originalTime} to ${newTime}`
    });
    
    return true;
  } catch (error) {
    logger.error(`Error in tryTimeShift: ${error.message}`);
    return false;
  }
}

/**
 * Try to shift the date of one event to resolve a conflict
 * 
 * @param {Array<object>} schedule - Schedule to modify
 * @param {number} event1Index - Index of first event
 * @param {number} event2Index - Index of second event
 * @param {Array<object>} resolutions - Resolution results to update
 * @param {object} conflict - Original conflict
 * @param {number} daysToShift - How many days to shift the date
 * @returns {boolean} Whether the conflict was resolved
 * @private
 */
function tryDateShift(schedule, event1Index, event2Index, resolutions, conflict, daysToShift = 1) {
  try {
    const event1 = schedule[event1Index];
    const event2 = schedule[event2Index];
    
    // Parse the original date
    const originalDate = event2.date;
    
    // Calculate new date
    const eventDate = new Date(`${originalDate}T00:00:00`);
    eventDate.setDate(eventDate.getDate() + daysToShift);
    
    // Format new date as YYYY-MM-DD
    const newDate = eventDate.toISOString().split('T')[0];
    
    // Apply the change
    event2.date = newDate;
    
    // Record the resolution
    resolutions.push({
      conflictId: conflict.id,
      conflictType: conflict.type,
      resolutionType: 'date_shift',
      event: {
        id: event2.id,
        date: originalDate,
        startTime: event2.startTime
      },
      change: {
        from: { date: originalDate },
        to: { date: newDate }
      },
      description: `Shifted date for event from ${originalDate} to ${newDate}`
    });
    
    return true;
  } catch (error) {
    logger.error(`Error in tryDateShift: ${error.message}`);
    return false;
  }
}

/**
 * Try to shift both date and time to resolve a conflict
 * 
 * @param {Array<object>} schedule - Schedule to modify
 * @param {number} eventIndex - Index of event to shift
 * @param {number} hoursToShift - How many hours to shift
 * @param {Array<object>} resolutions - Resolution results to update
 * @param {object} conflict - Original conflict
 * @returns {boolean} Whether the conflict was resolved
 * @private
 */
function tryDateTimeShift(schedule, eventIndex, hoursToShift, resolutions, conflict) {
  try {
    const event = schedule[eventIndex];
    
    // Parse the original date and time
    const originalDate = event.date;
    const originalTime = event.startTime || '00:00';
    
    // Calculate new date and time
    const eventDateTime = new Date(`${originalDate}T${originalTime}:00`);
    eventDateTime.setHours(eventDateTime.getHours() + hoursToShift);
    
    // Format new date as YYYY-MM-DD
    const newDate = eventDateTime.toISOString().split('T')[0];
    
    // Format new time
    const newHours = eventDateTime.getHours().toString().padStart(2, '0');
    const newMinutes = eventDateTime.getMinutes().toString().padStart(2, '0');
    const newTime = `${newHours}:${newMinutes}`;
    
    // Apply the changes
    event.date = newDate;
    event.startTime = newTime;
    
    // Record the resolution
    resolutions.push({
      conflictId: conflict.id,
      conflictType: conflict.type,
      resolutionType: 'date_time_shift',
      event: {
        id: event.id,
        date: originalDate,
        startTime: originalTime
      },
      change: {
        from: { date: originalDate, startTime: originalTime },
        to: { date: newDate, startTime: newTime }
      },
      description: `Shifted event from ${originalDate} ${originalTime} to ${newDate} ${newTime} to provide sufficient time`
    });
    
    return true;
  } catch (error) {
    logger.error(`Error in tryDateTimeShift: ${error.message}`);
    return false;
  }
}

/**
 * Try to swap a team to resolve a conflict
 * 
 * @param {Array<object>} schedule - Schedule to modify
 * @param {number} eventIndex - Index of event to modify
 * @param {number} otherEventIndex - Index of other event (-1 if not applicable)
 * @param {Array<string>} eligibleTeams - Teams that can be used as replacements
 * @param {Array<object>} resolutions - Resolution results to update
 * @param {object} conflict - Original conflict
 * @returns {boolean} Whether the conflict was resolved
 * @private
 */
async function tryTeamSwap(schedule, eventIndex, otherEventIndex, eligibleTeams, resolutions, conflict) {
  try {
    const event = schedule[eventIndex];
    
    // Get conflicting team
    const conflictingTeam = conflict.team;
    
    // Determine if this team is home or away
    const isHomeTeam = event.homeTeam === conflictingTeam;
    
    // Find eligible replacement teams
    const replacementTeams = eligibleTeams.filter(team => 
      team !== conflictingTeam &&
      team !== (isHomeTeam ? event.awayTeam : event.homeTeam)
    );
    
    if (replacementTeams.length === 0) {
      return false;
    }
    
    // Use FlexTime AI to select the most appropriate replacement team
    const response = await mcpConnector.sendRequest({
      agentId: 'conflict_resolution',
      taskType: 'team_selection',
      prompt: `Select the most appropriate replacement team from ${JSON.stringify(replacementTeams)} to replace ${conflictingTeam} in a game against ${isHomeTeam ? event.awayTeam : event.homeTeam} on ${event.date}. Consider team strength balance and scheduling history.`,
      parameters: {
        temperature: 0.3,
        max_tokens: 100
      }
    });
    
    let replacementTeam;
    if (response.status === 'success' && response.content) {
      // Try to extract team name from response
      const possibleTeams = replacementTeams.filter(team => 
        response.content.includes(team)
      );
      
      replacementTeam = possibleTeams.length > 0 ? 
        possibleTeams[0] : replacementTeams[0];
    } else {
      // Default to first eligible team
      replacementTeam = replacementTeams[0];
    }
    
    // Apply the team swap
    const originalTeam = isHomeTeam ? event.homeTeam : event.awayTeam;
    
    if (isHomeTeam) {
      event.homeTeam = replacementTeam;
    } else {
      event.awayTeam = replacementTeam;
    }
    
    // Record the resolution
    resolutions.push({
      conflictId: conflict.id,
      conflictType: conflict.type,
      resolutionType: 'team_swap',
      event: {
        id: event.id,
        date: event.date,
        startTime: event.startTime
      },
      change: {
        from: { [isHomeTeam ? 'homeTeam' : 'awayTeam']: originalTeam },
        to: { [isHomeTeam ? 'homeTeam' : 'awayTeam']: replacementTeam }
      },
      description: `Replaced ${originalTeam} with ${replacementTeam} as ${isHomeTeam ? 'home' : 'away'} team for event on ${event.date}`
    });
    
    return true;
  } catch (error) {
    logger.error(`Error in tryTeamSwap: ${error.message}`);
    return false;
  }
}

/**
 * Find the index of an event in the schedule
 * 
 * @param {Array<object>} schedule - Schedule to search
 * @param {object} event - Event to find
 * @returns {number} Index of the event, or -1 if not found
 * @private
 */
function findEventIndex(schedule, event) {
  // Try to find by ID first
  if (event.id) {
    const index = schedule.findIndex(e => e.id === event.id);
    if (index !== -1) return index;
  }
  
  // Find by date, time and teams
  return schedule.findIndex(e => 
    e.date === event.date &&
    e.startTime === event.startTime &&
    ((e.homeTeam === event.teams[0] && e.awayTeam === event.teams[1]) ||
     (e.homeTeam === event.teams[1] && e.awayTeam === event.teams[0]))
  );
}

/**
 * Calculate distance between two coordinate points
 * 
 * @param {object} point1 - First coordinate point {latitude, longitude}
 * @param {object} point2 - Second coordinate point {latitude, longitude}
 * @returns {number} Distance in miles
 * @private
 */
function calculateDistance(point1, point2) {
  if (!point1 || !point2) return 999999; // Large number if coordinates not available
  
  // Simplified distance calculation
  const earthRadiusMiles = 3958.8;
  
  const lat1 = point1.latitude * Math.PI / 180;
  const lat2 = point2.latitude * Math.PI / 180;
  const lon1 = point1.longitude * Math.PI / 180;
  const lon2 = point2.longitude * Math.PI / 180;
  
  const dlon = lon2 - lon1;
  const dlat = lat2 - lat1;
  
  const a = Math.sin(dlat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon/2)**2;
  const c = 2 * Math.asin(Math.sqrt(a));
  
  return earthRadiusMiles * c;
}

module.exports = {
  resolveVenueConflicts,
  resolveTeamConflicts,
  resolveTravelConflicts,
  resolveRestPeriodConflicts
};
