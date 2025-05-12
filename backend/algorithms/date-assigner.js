/**
 * FlexTime Scheduling System - Date Assigner
 * 
 * Advanced utility for assigning dates to games in a schedule with support for
 * complex constraints like venue availability, academic calendars, and travel optimization.
 */

const Schedule = require('../models/schedule');
const Game = require('../models/game');

class DateAssigner {
  /**
   * Create a new DateAssigner
   * @param {Schedule} schedule - Schedule to assign dates to
   * @param {Date} startDate - Season start date
   * @param {Date} endDate - Season end date
   * @param {Object} options - Additional options
   */
  constructor(schedule, startDate, endDate, options = {}) {
    this.schedule = schedule;
    this.startDate = new Date(startDate);
    this.endDate = new Date(endDate);
    
    // Default options
    this.options = {
      minDaysBetweenGames: 2,
      preferWeekends: true,
      avoidHolidays: true,
      maxConsecutiveAwayGames: 3,
      respectAcademicCalendar: true,
      balanceHomeAway: true,
      optimizeTravel: true,
      maxGamesPerWeek: 3,
      ...options
    };
    
    // Holidays to avoid (MM-DD format)
    this.holidays = [
      '01-01', // New Year's Day
      '01-15', // MLK Day (approximate)
      '02-14', // Valentine's Day
      '03-17', // St. Patrick's Day
      '07-04', // Independence Day
      '09-01', // Labor Day (approximate)
      '10-31', // Halloween
      '11-11', // Veterans Day
      '11-24', // Thanksgiving (approximate)
      '11-25', // Day after Thanksgiving
      '12-24', // Christmas Eve
      '12-25', // Christmas Day
      '12-31'  // New Year's Eve
    ];
    
    // Academic calendar periods to avoid (MM-DD to MM-DD format)
    this.academicCalendar = {
      finals: [
        { start: '12-10', end: '12-20' },  // Fall finals
        { start: '05-01', end: '05-15' }   // Spring finals
      ],
      breaks: [
        { start: '03-10', end: '03-20' },  // Spring break (approximate)
        { start: '11-20', end: '11-30' },  // Thanksgiving break
        { start: '12-15', end: '01-15' }   // Winter break
      ]
    };
  }

  /**
   * Assign dates to all games in the schedule
   * @returns {Schedule} Schedule with assigned dates
   */
  assignDates() {
    // Create a deep copy of the schedule to work with
    const newSchedule = this.schedule.clone();
    
    // Get all available dates in the season
    const availableDates = this._generateAvailableDates();
    
    // Group games by teams
    const teamGames = new Map();
    
    for (const team of newSchedule.teams) {
      teamGames.set(team.id, []);
    }
    
    // Sort games by priority (conference games first, rivalry games, etc.)
    const sortedGames = [...newSchedule.games].sort((a, b) => {
      // Conference games have higher priority
      const aIsConference = a.metadata?.isConferenceGame || false;
      const bIsConference = b.metadata?.isConferenceGame || false;
      
      if (aIsConference && !bIsConference) return -1;
      if (!aIsConference && bIsConference) return 1;
      
      // Rivalry games have higher priority
      const aIsRivalry = a.metadata?.isRivalryGame || false;
      const bIsRivalry = b.metadata?.isRivalryGame || false;
      
      if (aIsRivalry && !bIsRivalry) return -1;
      if (!aIsRivalry && bIsRivalry) return 1;
      
      return 0;
    });
    
    // First pass: Assign dates to high-priority games
    for (const game of sortedGames) {
      // Skip games that already have dates
      if (game.date && game.date.getTime() > 0) continue;
      
      // Find a suitable date for this game
      const date = this._findSuitableDateForGame(game, teamGames, availableDates);
      
      if (date) {
        // Assign the date to the game
        game.date = date;
        
        // Update team games
        teamGames.get(game.homeTeam.id).push(game);
        teamGames.get(game.awayTeam.id).push(game);
        
        // Remove the date from available dates
        const dateIndex = availableDates.findIndex(d => d.getTime() === date.getTime());
        if (dateIndex !== -1) {
          availableDates.splice(dateIndex, 1);
        }
      }
    }
    
    // Second pass: Try to assign dates to remaining games with relaxed constraints
    const unassignedGames = sortedGames.filter(game => !game.date || game.date.getTime() === 0);
    
    if (unassignedGames.length > 0) {
      console.warn(`Retrying date assignment for ${unassignedGames.length} games with relaxed constraints`);
      
      for (const game of unassignedGames) {
        const date = this._findSuitableDateForGame(game, teamGames, availableDates, true);
        
        if (date) {
          // Assign the date to the game
          game.date = date;
          
          // Update team games
          teamGames.get(game.homeTeam.id).push(game);
          teamGames.get(game.awayTeam.id).push(game);
          
          // Remove the date from available dates
          const dateIndex = availableDates.findIndex(d => d.getTime() === date.getTime());
          if (dateIndex !== -1) {
            availableDates.splice(dateIndex, 1);
          }
        } else {
          console.warn(`Could not find suitable date for game: ${game.homeTeam.name} vs ${game.awayTeam.name}`);
          
          // Assign a fallback date from the available dates
          if (availableDates.length > 0) {
            game.date = availableDates.shift();
            teamGames.get(game.homeTeam.id).push(game);
            teamGames.get(game.awayTeam.id).push(game);
          } else {
            // Last resort: assign the end date
            game.date = new Date(this.endDate);
          }
        }
      }
    }
    
    // Final pass: Optimize road trips if enabled
    if (this.options.optimizeTravel) {
      this._optimizeRoadTrips(newSchedule, teamGames);
    }
    
    return newSchedule;
  }

  /**
   * Generate all available dates in the season
   * @returns {Array<Date>} Available dates
   * @private
   */
  _generateAvailableDates() {
    const dates = [];
    const currentDate = new Date(this.startDate);
    
    while (currentDate <= this.endDate) {
      // Check if date should be included
      if (this._isDateAvailable(currentDate)) {
        dates.push(new Date(currentDate));
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Sort dates by preference
    dates.sort((a, b) => {
      // Weekends first if preferred
      if (this.options.preferWeekends) {
        const aIsWeekend = this._isWeekend(a);
        const bIsWeekend = this._isWeekend(b);
        
        if (aIsWeekend && !bIsWeekend) return -1;
        if (!aIsWeekend && bIsWeekend) return 1;
      }
      
      // Otherwise sort by date
      return a.getTime() - b.getTime();
    });
    
    return dates;
  }

  /**
   * Check if a date is available for scheduling
   * @param {Date} date - Date to check
   * @returns {boolean} True if available
   * @private
   */
  _isDateAvailable(date) {
    // Check if it's a holiday
    if (this.options.avoidHolidays && this._isHoliday(date)) {
      return false;
    }
    
    // Check if it's during finals
    if (this.options.respectAcademicCalendar && this._isDuringFinals(date)) {
      return false;
    }
    
    // Check if it's during a school break
    if (this.options.respectAcademicCalendar && this._isDuringBreak(date)) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if a date is a weekend (Saturday or Sunday)
   * @param {Date} date - Date to check
   * @returns {boolean} True if weekend
   * @private
   */
  _isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  }

  /**
   * Check if a date is a holiday
   * @param {Date} date - Date to check
   * @returns {boolean} True if holiday
   * @private
   */
  _isHoliday(date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${month}-${day}`;
    
    return this.holidays.includes(dateStr);
  }
  
  /**
   * Check if a date is during finals period
   * @param {Date} date - Date to check
   * @returns {boolean} True if during finals
   * @private
   */
  _isDuringFinals(date) {
    return this._isDateInPeriods(date, this.academicCalendar.finals);
  }
  
  /**
   * Check if a date is during a school break
   * @param {Date} date - Date to check
   * @returns {boolean} True if during break
   * @private
   */
  _isDuringBreak(date) {
    return this._isDateInPeriods(date, this.academicCalendar.breaks);
  }
  
  /**
   * Check if a date falls within any of the specified periods
   * @param {Date} date - Date to check
   * @param {Array<Object>} periods - Array of period objects with start and end dates
   * @returns {boolean} True if date is in any period
   * @private
   */
  _isDateInPeriods(date, periods) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${month}-${day}`;
    
    for (const period of periods) {
      if (this._isDateStringInRange(dateStr, period.start, period.end)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if a date string is within a range of date strings
   * @param {string} dateStr - Date string in MM-DD format
   * @param {string} startStr - Start date string in MM-DD format
   * @param {string} endStr - End date string in MM-DD format
   * @returns {boolean} True if date is in range
   * @private
   */
  _isDateStringInRange(dateStr, startStr, endStr) {
    // Handle ranges that span across years (e.g., Dec to Jan)
    if (startStr > endStr) {
      return dateStr >= startStr || dateStr <= endStr;
    }
    
    return dateStr >= startStr && dateStr <= endStr;
  }

  /**
   * Find a suitable date for a game
   * @param {Game} game - Game to find date for
   * @param {Map<string, Array<Game>>} teamGames - Games grouped by team
   * @param {Array<Date>} availableDates - Available dates
   * @param {boolean} relaxConstraints - Whether to relax constraints
   * @returns {Date|null} Suitable date or null if none found
   * @private
   */
  _findSuitableDateForGame(game, teamGames, availableDates, relaxConstraints = false) {
    const homeTeamGames = teamGames.get(game.homeTeam.id) || [];
    const awayTeamGames = teamGames.get(game.awayTeam.id) || [];
    
    // Try each available date
    for (const date of availableDates) {
      if (this._isDateSuitableForGame(date, game, homeTeamGames, awayTeamGames, relaxConstraints)) {
        return date;
      }
    }
    
    // If no suitable date found and constraints not relaxed, try again with relaxed constraints
    if (!relaxConstraints) {
      for (const date of availableDates) {
        if (this._isDateSuitableForGame(date, game, homeTeamGames, awayTeamGames, true)) {
          return date;
        }
      }
    }
    
    return null;
  }

  /**
   * Check if a date is suitable for a game
   * @param {Date} date - Date to check
   * @param {Game} game - Game to schedule
   * @param {Array<Game>} homeTeamGames - Home team's games
   * @param {Array<Game>} awayTeamGames - Away team's games
   * @param {boolean} relaxConstraints - Whether to relax constraints
   * @returns {boolean} True if suitable
   * @private
   */
  _isDateSuitableForGame(date, game, homeTeamGames, awayTeamGames, relaxConstraints = false) {
    // Check venue availability
    if (game.venue && typeof game.venue.isAvailable === 'function' && !game.venue.isAvailable(date)) {
      return false;
    }
    
    // Check if teams already have games on this date
    if (this._teamHasGameOnDate(homeTeamGames, date) || 
        this._teamHasGameOnDate(awayTeamGames, date)) {
      return false;
    }
    
    // Check minimum days between games
    const minDays = relaxConstraints ? 
      Math.max(1, this.options.minDaysBetweenGames - 1) : 
      this.options.minDaysBetweenGames;
    
    if (!this._hasMinimumDaysBetweenGames(homeTeamGames, date, minDays) ||
        !this._hasMinimumDaysBetweenGames(awayTeamGames, date, minDays)) {
      return false;
    }
    
    // Check maximum consecutive away games for away team
    if (!relaxConstraints && this.options.maxConsecutiveAwayGames > 0) {
      if (this._wouldExceedMaxConsecutiveAwayGames(awayTeamGames, date)) {
        return false;
      }
    }
    
    // Check maximum games per week
    if (!relaxConstraints && this.options.maxGamesPerWeek > 0) {
      if (this._wouldExceedMaxGamesPerWeek(homeTeamGames, date) ||
          this._wouldExceedMaxGamesPerWeek(awayTeamGames, date)) {
        return false;
      }
    }
    
    // Check home/away balance if enabled
    if (!relaxConstraints && this.options.balanceHomeAway) {
      if (this._wouldUnbalanceHomeAway(game.homeTeam.id, game.awayTeam.id, homeTeamGames, awayTeamGames)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if a team has a game on a specific date
   * @param {Array<Game>} teamGames - Team's games
   * @param {Date} date - Date to check
   * @returns {boolean} True if team has a game on the date
   * @private
   */
  _teamHasGameOnDate(teamGames, date) {
    const dateStr = date.toDateString();
    return teamGames.some(game => game.date && game.date.toDateString() === dateStr);
  }

  /**
   * Check if a date has minimum days between other games
   * @param {Array<Game>} teamGames - Team's games
   * @param {Date} date - Date to check
   * @param {number} minDays - Minimum days required
   * @returns {boolean} True if minimum days requirement is met
   * @private
   */
  _hasMinimumDaysBetweenGames(teamGames, date, minDays) {
    for (const game of teamGames) {
      if (!game.date) continue;
      
      const daysBetween = Math.abs((date.getTime() - game.date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysBetween < minDays) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if adding a game on this date would exceed max consecutive away games
   * @param {Array<Game>} awayTeamGames - Away team's games
   * @param {Date} date - Date to check
   * @returns {boolean} True if would exceed maximum
   * @private
   */
  _wouldExceedMaxConsecutiveAwayGames(awayTeamGames, date) {
    const maxConsecutive = this.options.maxConsecutiveAwayGames;
    
    // Sort games by date
    const sortedGames = [...awayTeamGames]
      .filter(game => game.date)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Find where the new game would fit in the sequence
    let insertIndex = sortedGames.findIndex(game => game.date > date);
    if (insertIndex === -1) {
      insertIndex = sortedGames.length;
    }
    
    // Check consecutive games before and after the insertion point
    let consecutiveBefore = 0;
    for (let i = insertIndex - 1; i >= 0; i--) {
      const daysBetween = (date.getTime() - sortedGames[i].date.getTime()) / (1000 * 60 * 60 * 24);
      if (daysBetween <= 3) { // Consider games within 3 days as consecutive
        consecutiveBefore++;
      } else {
        break;
      }
    }
    
    let consecutiveAfter = 0;
    for (let i = insertIndex; i < sortedGames.length; i++) {
      const daysBetween = (sortedGames[i].date.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      if (daysBetween <= 3) {
        consecutiveAfter++;
      } else {
        break;
      }
    }
    
    // Check if adding this game would create too many consecutive away games
    return (consecutiveBefore + 1 + consecutiveAfter) > maxConsecutive;
  }
  
  /**
   * Check if adding a game on this date would exceed max games per week
   * @param {Array<Game>} teamGames - Team's games
   * @param {Date} date - Date to check
   * @returns {boolean} True if would exceed maximum
   * @private
   */
  _wouldExceedMaxGamesPerWeek(teamGames, date) {
    const maxGamesPerWeek = this.options.maxGamesPerWeek;
    
    // Get the start and end of the week for the given date
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Sunday
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Saturday
    
    // Count games in this week
    let gamesInWeek = 0;
    
    for (const game of teamGames) {
      if (!game.date) continue;
      
      if (game.date >= weekStart && game.date <= weekEnd) {
        gamesInWeek++;
      }
    }
    
    return gamesInWeek >= maxGamesPerWeek;
  }
  
  /**
   * Check if adding a game would unbalance home/away ratio
   * @param {string} homeTeamId - Home team ID
   * @param {string} awayTeamId - Away team ID
   * @param {Array<Game>} homeTeamGames - Home team's games
   * @param {Array<Game>} awayTeamGames - Away team's games
   * @returns {boolean} True if would unbalance home/away ratio
   * @private
   */
  _wouldUnbalanceHomeAway(homeTeamId, awayTeamId, homeTeamGames, awayTeamGames) {
    // Count home and away games for home team
    let homeTeamHomeGames = 0;
    let homeTeamAwayGames = 0;
    
    for (const game of homeTeamGames) {
      if (game.homeTeam.id === homeTeamId) {
        homeTeamHomeGames++;
      } else {
        homeTeamAwayGames++;
      }
    }
    
    // Count home and away games for away team
    let awayTeamHomeGames = 0;
    let awayTeamAwayGames = 0;
    
    for (const game of awayTeamGames) {
      if (game.homeTeam.id === awayTeamId) {
        awayTeamHomeGames++;
      } else {
        awayTeamAwayGames++;
      }
    }
    
    // Check if adding this game would create too much imbalance
    const homeTeamRatio = (homeTeamHomeGames + 1) / (homeTeamAwayGames + 1);
    const awayTeamRatio = awayTeamHomeGames / (awayTeamAwayGames + 1);
    
    // Allow up to 60% home games or 60% away games
    return homeTeamRatio > 1.5 || homeTeamRatio < 0.5 || awayTeamRatio > 1.5 || awayTeamRatio < 0.5;
  }
  
  /**
   * Optimize road trips to minimize travel
   * @param {Schedule} schedule - Schedule to optimize
   * @param {Map<string, Array<Game>>} teamGames - Games grouped by team
   * @private
   */
  _optimizeRoadTrips(schedule, teamGames) {
    // For each team, identify potential road trips
    for (const [teamId, games] of teamGames.entries()) {
      const team = schedule.teams.find(t => t.id === teamId);
      if (!team) continue;
      
      // Get away games sorted by date
      const awayGames = games
        .filter(game => game.awayTeam.id === teamId && game.date)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Identify potential road trips (consecutive away games)
      const roadTrips = [];
      let currentTrip = [];
      
      for (let i = 0; i < awayGames.length; i++) {
        const game = awayGames[i];
        
        if (currentTrip.length === 0) {
          currentTrip.push(game);
        } else {
          const lastGame = currentTrip[currentTrip.length - 1];
          const daysBetween = (game.date.getTime() - lastGame.date.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysBetween <= 4) { // Max 4 days between games in a trip
            currentTrip.push(game);
          } else {
            if (currentTrip.length > 1) {
              roadTrips.push([...currentTrip]);
            }
            currentTrip = [game];
          }
        }
      }
      
      if (currentTrip.length > 1) {
        roadTrips.push([...currentTrip]);
      }
      
      // Optimize each road trip
      for (const trip of roadTrips) {
        this._optimizeTripSequence(trip, team);
      }
    }
  }
  
  /**
   * Optimize the sequence of games in a road trip
   * @param {Array<Game>} trip - Games in the road trip
   * @param {Object} team - Team object
   * @private
   */
  _optimizeTripSequence(trip, team) {
    if (trip.length <= 2) return; // No optimization needed for 1 or 2 games
    
    // Calculate distances between all venues
    const distanceMatrix = new Map();
    
    for (let i = 0; i < trip.length; i++) {
      for (let j = 0; j < trip.length; j++) {
        if (i !== j) {
          const venue1 = trip[i].venue;
          const venue2 = trip[j].venue;
          
          if (!venue1.location || !venue2.location) continue;
          
          const key = `${venue1.id}-${venue2.id}`;
          
          const distance = this._calculateDistance(
            venue1.location.latitude,
            venue1.location.longitude,
            venue2.location.latitude,
            venue2.location.longitude
          );
          
          distanceMatrix.set(key, distance);
        }
      }
    }
    
    // Use a greedy algorithm to find a better sequence
    // Start from team's home location
    const homeLocation = team.location;
    const remainingGames = [...trip];
    const optimizedSequence = [];
    
    let currentLocation = homeLocation;
    
    while (remainingGames.length > 0) {
      // Find closest venue
      let closestGame = null;
      let closestDistance = Infinity;
      
      for (const game of remainingGames) {
        const venue = game.venue;
        
        if (!venue.location) continue;
        
        const distance = this._calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          venue.location.latitude,
          venue.location.longitude
        );
        
        if (distance < closestDistance) {
          closestGame = game;
          closestDistance = distance;
        }
      }
      
      if (closestGame) {
        optimizedSequence.push(closestGame);
        currentLocation = closestGame.venue.location;
        remainingGames.splice(remainingGames.indexOf(closestGame), 1);
      } else {
        break;
      }
    }
    
    // Reorder the trip dates to match the optimized sequence
    const dates = trip.map(game => new Date(game.date)).sort((a, b) => a.getTime() - b.getTime());
    
    for (let i = 0; i < optimizedSequence.length; i++) {
      optimizedSequence[i].date = dates[i];
    }
  }
  
  /**
   * Calculate the distance between two points using the Haversine formula
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lon1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lon2 - Longitude of point 2
   * @returns {number} Distance in miles
   * @private
   */
  _calculateDistance(lat1, lon1, lat2, lon2) {
    if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || 
        typeof lat2 !== 'number' || typeof lon2 !== 'number') {
      return 0;
    }
    
    const R = 3958.8; // Earth's radius in miles
    const dLat = this._toRadians(lat2 - lat1);
    const dLon = this._toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._toRadians(lat1)) * Math.cos(this._toRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  /**
   * Convert degrees to radians
   * @param {number} degrees - Angle in degrees
   * @returns {number} Angle in radians
   * @private
   */
  _toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = DateAssigner;
