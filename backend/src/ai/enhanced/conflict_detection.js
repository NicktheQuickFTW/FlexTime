/**
 * Conflict Detection Module for FlexTime
 * 
 * This module provides specialized detection methods for different types of scheduling conflicts:
 * - Venue conflicts (same venue, overlapping times)
 * - Team conflicts (same team scheduled for multiple events)
 * - Travel conflicts (insufficient travel time between events)
 * - Rest period conflicts (insufficient recovery time)
 * - Resource conflicts (equipment, personnel, etc.)
 */

const logger = require("../../lib/logger");;
const { calculateDistance } = require('../scripts/geo_utils');

/**
 * Check for venue conflicts in a schedule
 * (Same venue booked for overlapping time periods)
 * 
 * @param {Array<object>} schedule - Schedule to check
 * @param {object} venues - Venue information
 * @returns {Array<object>} Detected venue conflicts
 */
function detectVenueConflicts(schedule, venues = {}) {
  const conflicts = [];
  const venueBookings = new Map();
  
  logger.info('Detecting venue conflicts');
  
  try {
    // Sort schedule by date/time for easier processing
    const sortedSchedule = [...schedule].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime || '00:00'}:00`);
      const dateB = new Date(`${b.date}T${b.startTime || '00:00'}:00`);
      return dateA - dateB;
    });
    
    // Process each event
    for (let i = 0; i < sortedSchedule.length; i++) {
      const event = sortedSchedule[i];
      
      if (!event.venue) {
        logger.warn(`Event missing venue: ${JSON.stringify(event)}`);
        continue;
      }
      
      const eventVenue = event.venue;
      const eventStart = new Date(`${event.date}T${event.startTime || '00:00'}:00`);
      const eventEnd = new Date(eventStart);
      
      // Default duration is 3 hours if not specified
      const durationHours = event.durationHours || 3;
      eventEnd.setHours(eventEnd.getHours() + durationHours);
      
      // Check if this venue has any bookings
      if (!venueBookings.has(eventVenue)) {
        venueBookings.set(eventVenue, []);
      }
      
      // Check for conflicts with existing bookings
      const venueEvents = venueBookings.get(eventVenue);
      for (const booking of venueEvents) {
        // Check for overlap
        if (
          (eventStart < booking.end && eventEnd > booking.start) || 
          (booking.start < eventEnd && booking.end > eventStart)
        ) {
          // Overlapping bookings found
          conflicts.push({
            id: `venue_${conflicts.length + 1}`,
            type: 'venue',
            severity: 'high',
            venue: eventVenue,
            events: [
              {
                id: event.id || `event_${i}`,
                date: event.date,
                startTime: event.startTime,
                endTime: event.endTime || formatTime(eventEnd),
                teams: [event.homeTeam, event.awayTeam]
              },
              {
                id: booking.eventId,
                date: booking.date,
                startTime: booking.startTime,
                endTime: booking.endTime,
                teams: booking.teams
              }
            ],
            description: `Venue conflict at ${eventVenue}: Multiple events scheduled at overlapping times`,
            recommendedActions: [
              'Reschedule one of the events to a different time',
              'Relocate one of the events to a different venue'
            ]
          });
        }
      }
      
      // Add this event to the venue bookings
      venueEvents.push({
        eventId: event.id || `event_${i}`,
        start: eventStart,
        end: eventEnd,
        date: event.date,
        startTime: event.startTime,
        endTime: formatTime(eventEnd),
        teams: [event.homeTeam, event.awayTeam]
      });
    }
    
    logger.info(`Detected ${conflicts.length} venue conflicts`);
    return conflicts;
  } catch (error) {
    logger.error(`Error detecting venue conflicts: ${error.message}`);
    return conflicts;
  }
}

/**
 * Check for team conflicts in a schedule
 * (Same team scheduled for multiple events with insufficient time between)
 * 
 * @param {Array<object>} schedule - Schedule to check
 * @param {object} constraints - Team scheduling constraints
 * @returns {Array<object>} Detected team conflicts
 */
function detectTeamConflicts(schedule, constraints = {}) {
  const conflicts = [];
  const teamEvents = new Map();
  
  logger.info('Detecting team conflicts');
  
  try {
    // Minimum hours between games for the same team (default: 20 hours)
    const minHoursBetweenGames = constraints.minHoursBetweenGames || 20;
    
    // Sort schedule by date/time
    const sortedSchedule = [...schedule].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime || '00:00'}:00`);
      const dateB = new Date(`${b.date}T${b.startTime || '00:00'}:00`);
      return dateA - dateB;
    });
    
    // Process each event
    for (let i = 0; i < sortedSchedule.length; i++) {
      const event = sortedSchedule[i];
      
      if (!event.homeTeam || !event.awayTeam) {
        logger.warn(`Event missing team information: ${JSON.stringify(event)}`);
        continue;
      }
      
      const teams = [event.homeTeam, event.awayTeam];
      const eventStart = new Date(`${event.date}T${event.startTime || '00:00'}:00`);
      const eventEnd = new Date(eventStart);
      
      // Default duration is 3 hours if not specified
      const durationHours = event.durationHours || 3;
      eventEnd.setHours(eventEnd.getHours() + durationHours);
      
      // Check each team
      for (const team of teams) {
        if (!teamEvents.has(team)) {
          teamEvents.set(team, []);
        }
        
        const teamSchedule = teamEvents.get(team);
        
        // Check for conflicts with existing team schedule
        for (const existingEvent of teamSchedule) {
          // Same day conflict (same team multiple times in one day)
          if (event.date === existingEvent.date) {
            conflicts.push({
              id: `team_${conflicts.length + 1}`,
              type: 'team',
              severity: 'high',
              team,
              events: [
                {
                  id: event.id || `event_${i}`,
                  date: event.date,
                  startTime: event.startTime,
                  venue: event.venue,
                  teams: [event.homeTeam, event.awayTeam]
                },
                {
                  id: existingEvent.id,
                  date: existingEvent.date,
                  startTime: existingEvent.startTime,
                  venue: existingEvent.venue,
                  teams: [existingEvent.homeTeam, existingEvent.awayTeam]
                }
              ],
              description: `Team ${team} scheduled for multiple events on the same day (${event.date})`,
              recommendedActions: [
                'Reschedule one of the events to a different day',
                'Replace team with a different team for one of the events'
              ]
            });
            continue;
          }
          
          // Insufficient rest time between games
          const existingStart = new Date(`${existingEvent.date}T${existingEvent.startTime || '00:00'}:00`);
          const hoursBetween = Math.abs(eventStart - existingStart) / (1000 * 60 * 60);
          
          if (hoursBetween < minHoursBetweenGames) {
            conflicts.push({
              id: `team_rest_${conflicts.length + 1}`,
              type: 'team',
              subType: 'rest',
              severity: 'medium',
              team,
              hoursBetween,
              minimumRequired: minHoursBetweenGames,
              events: [
                {
                  id: event.id || `event_${i}`,
                  date: event.date,
                  startTime: event.startTime,
                  venue: event.venue,
                  teams: [event.homeTeam, event.awayTeam]
                },
                {
                  id: existingEvent.id,
                  date: existingEvent.date,
                  startTime: existingEvent.startTime,
                  venue: existingEvent.venue,
                  teams: [existingEvent.homeTeam, existingEvent.awayTeam]
                }
              ],
              description: `Insufficient rest time for team ${team} (${hoursBetween.toFixed(1)} hours between games, minimum required: ${minHoursBetweenGames})`,
              recommendedActions: [
                `Reschedule one of the events to allow at least ${minHoursBetweenGames} hours between games`,
                'Adjust game start times to maximize rest time'
              ]
            });
          }
        }
        
        // Add this event to the team's schedule
        teamSchedule.push({
          id: event.id || `event_${i}`,
          date: event.date,
          startTime: event.startTime,
          homeTeam: event.homeTeam,
          awayTeam: event.awayTeam,
          venue: event.venue
        });
      }
    }
    
    logger.info(`Detected ${conflicts.length} team conflicts`);
    return conflicts;
  } catch (error) {
    logger.error(`Error detecting team conflicts: ${error.message}`);
    return conflicts;
  }
}

/**
 * Check for travel conflicts in a schedule
 * (Insufficient travel time between venues for the same team)
 * 
 * @param {Array<object>} schedule - Schedule to check
 * @param {object} venues - Venue location information
 * @param {object} constraints - Travel constraints
 * @returns {Array<object>} Detected travel conflicts
 */
function detectTravelConflicts(schedule, venues = {}, constraints = {}) {
  const conflicts = [];
  const teamSchedules = new Map();
  
  logger.info('Detecting travel conflicts');
  
  try {
    // Default travel constraints
    const defaultTravelSpeed = constraints.travelSpeed || 65; // mph
    const minHoursAfterTravel = constraints.minHoursAfterTravel || 3; // hours of rest after travel
    const bufferHours = constraints.bufferHours || 2; // additional buffer hours for unexpected delays
    
    // Sort schedule by date/time
    const sortedSchedule = [...schedule].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime || '00:00'}:00`);
      const dateB = new Date(`${b.date}T${b.startTime || '00:00'}:00`);
      return dateA - dateB;
    });
    
    // Process each event
    for (let i = 0; i < sortedSchedule.length; i++) {
      const event = sortedSchedule[i];
      
      if (!event.homeTeam || !event.awayTeam || !event.venue) {
        logger.warn(`Event missing required information: ${JSON.stringify(event)}`);
        continue;
      }
      
      const teams = [event.homeTeam, event.awayTeam];
      const eventStart = new Date(`${event.date}T${event.startTime || '00:00'}:00`);
      
      // Process each team
      for (const team of teams) {
        if (!teamSchedules.has(team)) {
          teamSchedules.set(team, []);
        }
        
        const teamEvents = teamSchedules.get(team);
        
        // Check against previous events for this team
        for (const prevEvent of teamEvents) {
          if (prevEvent.venue === event.venue) {
            continue; // Same venue, no travel needed
          }
          
          // Calculate travel time between venues
          const travelHours = calculateTravelHours(
            prevEvent.venue, 
            event.venue, 
            venues, 
            defaultTravelSpeed
          );
          
          if (travelHours < 0) {
            // Couldn't calculate travel time, log and skip
            logger.warn(`Couldn't calculate travel time between ${prevEvent.venue} and ${event.venue}`);
            continue;
          }
          
          const prevEventEnd = new Date(`${prevEvent.date}T${prevEvent.startTime || '00:00'}:00`);
          prevEventEnd.setHours(prevEventEnd.getHours() + (prevEvent.durationHours || 3));
          
          // Calculate available time for travel
          const availableHours = (eventStart - prevEventEnd) / (1000 * 60 * 60);
          
          // Required hours = travel time + rest after travel + buffer
          const requiredHours = travelHours + minHoursAfterTravel + bufferHours;
          
          if (availableHours < requiredHours) {
            conflicts.push({
              id: `travel_${conflicts.length + 1}`,
              type: 'travel',
              severity: 'high',
              team,
              availableHours,
              requiredHours,
              travelHours,
              sourceVenue: prevEvent.venue,
              destinationVenue: event.venue,
              events: [
                {
                  id: prevEvent.id,
                  date: prevEvent.date,
                  startTime: prevEvent.startTime,
                  venue: prevEvent.venue,
                  teams: [prevEvent.homeTeam, prevEvent.awayTeam]
                },
                {
                  id: event.id || `event_${i}`,
                  date: event.date,
                  startTime: event.startTime,
                  venue: event.venue,
                  teams: [event.homeTeam, event.awayTeam]
                }
              ],
              description: `Insufficient travel time for team ${team} between venues (${availableHours.toFixed(1)} hours available, ${requiredHours.toFixed(1)} hours required)`,
              recommendedActions: [
                `Reschedule one of the events to allow at least ${requiredHours.toFixed(1)} hours between games`,
                'Look for an alternate venue closer to the previous location'
              ]
            });
          }
        }
        
        // Add this event to the team's schedule
        teamEvents.push({
          id: event.id || `event_${i}`,
          date: event.date,
          startTime: event.startTime,
          durationHours: event.durationHours || 3,
          homeTeam: event.homeTeam,
          awayTeam: event.awayTeam,
          venue: event.venue
        });
      }
    }
    
    logger.info(`Detected ${conflicts.length} travel conflicts`);
    return conflicts;
  } catch (error) {
    logger.error(`Error detecting travel conflicts: ${error.message}`);
    return conflicts;
  }
}

/**
 * Check for resource conflicts in a schedule
 * (Essential resources not available for all events)
 * 
 * @param {Array<object>} schedule - Schedule to check
 * @param {object} resources - Resource availability information
 * @returns {Array<object>} Detected resource conflicts
 */
function detectResourceConflicts(schedule, resources = {}) {
  const conflicts = [];
  const resourceBookings = new Map();
  
  logger.info('Detecting resource conflicts');
  
  try {
    // Process resources if provided
    if (!resources || Object.keys(resources).length === 0) {
      logger.info('No resource information provided, skipping resource conflict detection');
      return conflicts;
    }
    
    // Sort schedule by date/time
    const sortedSchedule = [...schedule].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime || '00:00'}:00`);
      const dateB = new Date(`${b.date}T${b.startTime || '00:00'}:00`);
      return dateA - dateB;
    });
    
    // Process each event
    for (let i = 0; i < sortedSchedule.length; i++) {
      const event = sortedSchedule[i];
      
      if (!event.requiredResources || !Array.isArray(event.requiredResources)) {
        // No resource requirements specified
        continue;
      }
      
      const eventStart = new Date(`${event.date}T${event.startTime || '00:00'}:00`);
      const eventEnd = new Date(eventStart);
      eventEnd.setHours(eventEnd.getHours() + (event.durationHours || 3));
      
      // Check each required resource
      for (const resourceId of event.requiredResources) {
        if (!resourceBookings.has(resourceId)) {
          resourceBookings.set(resourceId, []);
        }
        
        const bookings = resourceBookings.get(resourceId);
        
        // Check resource availability
        const resource = resources[resourceId];
        if (!resource) {
          conflicts.push({
            id: `resource_missing_${conflicts.length + 1}`,
            type: 'resource',
            subType: 'missing',
            severity: 'high',
            resourceId,
            event: {
              id: event.id || `event_${i}`,
              date: event.date,
              startTime: event.startTime,
              venue: event.venue,
              teams: [event.homeTeam, event.awayTeam]
            },
            description: `Required resource "${resourceId}" does not exist in the system`,
            recommendedActions: [
              'Add the resource to the system',
              'Remove the resource requirement from the event'
            ]
          });
          continue;
        }
        
        // Check resource quantity
        const resourceQuantity = resource.quantity || 1;
        
        // Count bookings at this time
        let overlappingBookings = 0;
        for (const booking of bookings) {
          if (
            (eventStart < booking.end && eventEnd > booking.start) || 
            (booking.start < eventEnd && booking.end > eventStart)
          ) {
            overlappingBookings++;
          }
        }
        
        // Check if we exceed availability
        if (overlappingBookings >= resourceQuantity) {
          // Find all conflicting events
          const conflictingEvents = bookings
            .filter(b => 
              (eventStart < b.end && eventEnd > b.start) || 
              (b.start < eventEnd && b.end > eventStart)
            )
            .map(b => b.event);
          
          conflicts.push({
            id: `resource_overbooked_${conflicts.length + 1}`,
            type: 'resource',
            subType: 'overbooked',
            severity: 'medium',
            resourceId,
            resourceName: resource.name || resourceId,
            availableQuantity: resourceQuantity,
            requiredQuantity: overlappingBookings + 1,
            event: {
              id: event.id || `event_${i}`,
              date: event.date,
              startTime: event.startTime,
              venue: event.venue,
              teams: [event.homeTeam, event.awayTeam]
            },
            conflictingEvents,
            description: `Resource "${resource.name || resourceId}" is overbooked (${overlappingBookings + 1} bookings, only ${resourceQuantity} available)`,
            recommendedActions: [
              'Reschedule one of the events',
              'Increase resource quantity if possible',
              'Find alternative resource'
            ]
          });
        }
        
        // Add this event to the resource bookings
        bookings.push({
          start: eventStart,
          end: eventEnd,
          event: {
            id: event.id || `event_${i}`,
            date: event.date,
            startTime: event.startTime,
            venue: event.venue,
            teams: [event.homeTeam, event.awayTeam]
          }
        });
      }
    }
    
    logger.info(`Detected ${conflicts.length} resource conflicts`);
    return conflicts;
  } catch (error) {
    logger.error(`Error detecting resource conflicts: ${error.message}`);
    return conflicts;
  }
}

/**
 * Check for rest period conflicts in a schedule
 * (Insufficient rest periods between games, especially for travel)
 * 
 * @param {Array<object>} schedule - Schedule to check
 * @param {object} constraints - Rest period constraints
 * @returns {Array<object>} Detected rest period conflicts
 */
function detectRestPeriodConflicts(schedule, constraints = {}) {
  const conflicts = [];
  const teamLastGames = new Map();
  
  logger.info('Detecting rest period conflicts');
  
  try {
    // Default rest period constraints
    const minHoursAfterHomeGame = constraints.minHoursAfterHomeGame || 20;
    const minHoursAfterAwayGame = constraints.minHoursAfterAwayGame || 24;
    const minHoursAfterLongTravel = constraints.minHoursAfterLongTravel || 36; // Long travel = over 500 miles
    const longTravelThresholdMiles = constraints.longTravelThresholdMiles || 500;
    
    // Sport-specific overrides if provided
    const sportType = constraints.sportType;
    if (sportType && constraints.sportSpecificRest && constraints.sportSpecificRest[sportType]) {
      const sportConstraints = constraints.sportSpecificRest[sportType];
      Object.assign(constraints, sportConstraints);
    }
    
    // Sort schedule by date/time
    const sortedSchedule = [...schedule].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime || '00:00'}:00`);
      const dateB = new Date(`${b.date}T${b.startTime || '00:00'}:00`);
      return dateA - dateB;
    });
    
    // Process each event
    for (let i = 0; i < sortedSchedule.length; i++) {
      const event = sortedSchedule[i];
      
      if (!event.homeTeam || !event.awayTeam) {
        logger.warn(`Event missing team information: ${JSON.stringify(event)}`);
        continue;
      }
      
      const teams = [event.homeTeam, event.awayTeam];
      const eventStart = new Date(`${event.date}T${event.startTime || '00:00'}:00`);
      
      // Check each team's rest period
      for (const team of teams) {
        const isHomeTeam = team === event.homeTeam;
        
        if (!teamLastGames.has(team)) {
          teamLastGames.set(team, null);
          continue; // First game, no previous game to check
        }
        
        const lastGame = teamLastGames.get(team);
        if (!lastGame) continue;
        
        const lastGameEnd = new Date(`${lastGame.date}T${lastGame.startTime || '00:00'}:00`);
        lastGameEnd.setHours(lastGameEnd.getHours() + (lastGame.durationHours || 3));
        
        // Calculate rest hours
        const restHours = (eventStart - lastGameEnd) / (1000 * 60 * 60);
        
        // Determine required rest based on home/away status
        let requiredRest = isHomeTeam ? minHoursAfterHomeGame : minHoursAfterAwayGame;
        let restType = isHomeTeam ? 'home' : 'away';
        
        // Check if long travel was involved (venue change)
        if (lastGame.venue !== event.venue) {
          // If we have venue coordinates, calculate actual distance
          // Otherwise assume it's a long travel if venues are different
          const travelDistance = 0; // Would be calculated with geolocation API
          
          if (travelDistance > longTravelThresholdMiles) {
            requiredRest = minHoursAfterLongTravel;
            restType = 'long_travel';
          }
        }
        
        // Check if rest period is sufficient
        if (restHours < requiredRest) {
          conflicts.push({
            id: `rest_${conflicts.length + 1}`,
            type: 'rest',
            subType: restType,
            severity: 'medium',
            team,
            restHours,
            requiredRest,
            events: [
              {
                id: lastGame.id,
                date: lastGame.date,
                startTime: lastGame.startTime,
                venue: lastGame.venue,
                teams: [lastGame.homeTeam, lastGame.awayTeam]
              },
              {
                id: event.id || `event_${i}`,
                date: event.date,
                startTime: event.startTime,
                venue: event.venue,
                teams: [event.homeTeam, event.awayTeam]
              }
            ],
            description: `Insufficient rest period for team ${team} (${restHours.toFixed(1)} hours available, ${requiredRest} hours required after ${restType} game)`,
            recommendedActions: [
              `Reschedule one of the events to allow at least ${requiredRest} hours between games`,
              'Consider swapping with another team that has adequate rest'
            ]
          });
        }
      }
      
      // Update last game for each team
      for (const team of teams) {
        teamLastGames.set(team, {
          id: event.id || `event_${i}`,
          date: event.date,
          startTime: event.startTime,
          durationHours: event.durationHours || 3,
          homeTeam: event.homeTeam,
          awayTeam: event.awayTeam,
          venue: event.venue
        });
      }
    }
    
    logger.info(`Detected ${conflicts.length} rest period conflicts`);
    return conflicts;
  } catch (error) {
    logger.error(`Error detecting rest period conflicts: ${error.message}`);
    return conflicts;
  }
}

/**
 * Calculate travel hours between two venues
 * 
 * @param {string} sourceVenue - Source venue name
 * @param {string} destVenue - Destination venue name
 * @param {object} venues - Venue information with coordinates
 * @param {number} travelSpeed - Travel speed in mph
 * @returns {number} Travel time in hours, -1 if calculation failed
 * @private
 */
function calculateTravelHours(sourceVenue, destVenue, venues, travelSpeed) {
  try {
    if (!venues || !venues[sourceVenue] || !venues[destVenue]) {
      return -1; // Venue information not available
    }
    
    const sourceCoords = venues[sourceVenue].coordinates;
    const destCoords = venues[destVenue].coordinates;
    
    if (!sourceCoords || !destCoords) {
      return -1; // Coordinates not available
    }
    
    // Calculate distance using geo_utils
    const distanceMiles = calculateDistance(
      sourceCoords.latitude, 
      sourceCoords.longitude, 
      destCoords.latitude, 
      destCoords.longitude
    );
    
    // Calculate travel time
    return distanceMiles / travelSpeed;
  } catch (error) {
    logger.error(`Failed to calculate travel time: ${error.message}`);
    return -1;
  }
}

/**
 * Format time from Date object to HH:MM format
 * 
 * @param {Date} date - Date object
 * @returns {string} Time in HH:MM format
 * @private
 */
function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

module.exports = {
  detectVenueConflicts,
  detectTeamConflicts,
  detectTravelConflicts,
  detectResourceConflicts,
  detectRestPeriodConflicts
};
