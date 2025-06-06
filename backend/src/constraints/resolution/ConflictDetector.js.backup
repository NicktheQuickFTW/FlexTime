/**
 * Enhanced Conflict Detection System for FlexTime
 * 
 * Comprehensive conflict detection with Big 12 specific rules,
 * cascading conflict analysis, and intelligent severity assessment.
 */

const logger = require("../utils/logger");
const { evaluateBYUSundayConstraint, isSunday } = require('../../ai/specialized/global_constraints');

class ConflictDetector {
  constructor(options = {}) {
    this.options = {
      enableCascadingDetection: options.enableCascadingDetection !== false,
      enableSeverityScoring: options.enableSeverityScoring !== false,
      big12SpecificRules: options.big12SpecificRules !== false,
      ...options
    };

    // Conflict type definitions
    this.conflictTypes = {
      BYU_SUNDAY: 'byu_sunday',
      VENUE: 'venue',
      TEAM: 'team',
      TRAVEL: 'travel',
      REST: 'rest',
      RESOURCE: 'resource',
      MEDIA: 'media',
      VENUE_SHARING: 'venue_sharing'
    };

    // Severity levels
    this.severityLevels = {
      CRITICAL: 'CRITICAL',    // Impossible to execute (BYU Sunday, same team twice)
      HIGH: 'HIGH',            // Major logistics issues (venue conflicts)
      MEDIUM: 'MEDIUM',        // Suboptimal but workable (travel, rest)
      LOW: 'LOW'               // Preference violations (media windows)
    };
  }

  /**
   * Detect all conflicts in a schedule
   * @param {Array} schedule - Schedule to analyze
   * @param {Object} context - Additional context (venues, teams, constraints)
   * @returns {Array} Array of detected conflicts
   */
  async detectAllConflicts(schedule, context = {}) {
    logger.info('Starting comprehensive conflict detection');
    const startTime = Date.now();

    try {
      const conflicts = [];

      // Phase 1: Big 12 specific conflicts (highest priority)
      if (this.options.big12SpecificRules) {
        conflicts.push(...await this._detectBig12SpecificConflicts(schedule, context));
      }

      // Phase 2: Core scheduling conflicts
      conflicts.push(...this._detectVenueConflicts(schedule, context));
      conflicts.push(...this._detectTeamConflicts(schedule, context));
      conflicts.push(...this._detectTravelConflicts(schedule, context));
      conflicts.push(...this._detectRestPeriodConflicts(schedule, context));

      // Phase 3: Resource and logistics conflicts
      conflicts.push(...this._detectResourceConflicts(schedule, context));
      conflicts.push(...this._detectVenueSharingConflicts(schedule, context));

      // Phase 4: Business and media conflicts
      conflicts.push(...this._detectMediaConflicts(schedule, context));

      // Phase 5: Cascading conflict analysis
      if (this.options.enableCascadingDetection) {
        conflicts.push(...this._detectCascadingConflicts(conflicts, schedule, context));
      }

      // Phase 6: Enhance conflicts with severity scoring and impact analysis
      if (this.options.enableSeverityScoring) {
        this._enhanceConflictsWithScoring(conflicts, schedule, context);
      }

      // Remove duplicates and sort by severity
      const uniqueConflicts = this._deduplicateConflicts(conflicts);
      const sortedConflicts = this._sortConflictsBySeverity(uniqueConflicts);

      const endTime = Date.now();
      logger.info(`Conflict detection completed in ${endTime - startTime}ms. Found ${sortedConflicts.length} conflicts`);

      return sortedConflicts;

    } catch (error) {
      logger.error(`Error in conflict detection: ${error.message}`);
      return [];
    }
  }

  /**
   * Detect Big 12 specific conflicts
   * @param {Array} schedule - Schedule to analyze
   * @param {Object} context - Additional context
   * @returns {Array} Big 12 specific conflicts
   * @private
   */
  async _detectBig12SpecificConflicts(schedule, context) {
    const conflicts = [];

    // BYU Sunday conflicts - CRITICAL priority
    conflicts.push(...this._detectBYUSundayConflicts(schedule, context));

    // Conference championship constraints
    conflicts.push(...this._detectChampionshipConflicts(schedule, context));

    // Media rights conflicts (Big 12 specific TV windows)
    conflicts.push(...this._detectBig12MediaConflicts(schedule, context));

    return conflicts;
  }

  /**
   * Detect BYU Sunday conflicts
   * @param {Array} schedule - Schedule to analyze
   * @param {Object} context - Additional context
   * @returns {Array} BYU Sunday conflicts
   * @private
   */
  _detectBYUSundayConflicts(schedule, context) {
    const conflicts = [];

    for (let i = 0; i < schedule.length; i++) {
      const game = schedule[i];
      
      // Check if BYU is involved and game is on Sunday
      if (this._gameInvolvesBYU(game) && isSunday(game.date)) {
        conflicts.push({
          id: `byu_sunday_${conflicts.length + 1}`,
          type: this.conflictTypes.BYU_SUNDAY,
          severity: this.severityLevels.CRITICAL,
          gameId: game.id || `game_${i}`,
          date: game.date,
          teams: [game.homeTeam, game.awayTeam],
          venue: game.venue,
          description: `BYU is scheduled to play on Sunday (${game.date}) - violates religious observance policy`,
          impact: {
            teamsAffected: [game.homeTeam, game.awayTeam],
            venuesAffected: [game.venue],
            cascadingEffects: []
          },
          recommendedActions: [
            'Reschedule to Saturday or another weekday',
            'Swap opponent if possible',
            'Move to Friday evening time slot'
          ],
          big12Rule: 'BYU_SUNDAY_PROHIBITION',
          priority: 1000 // Highest priority
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect venue conflicts with enhanced analysis
   * @param {Array} schedule - Schedule to analyze
   * @param {Object} context - Additional context
   * @returns {Array} Venue conflicts
   * @private
   */
  _detectVenueConflicts(schedule, context) {
    const conflicts = [];
    const venueBookings = new Map();

    for (let i = 0; i < schedule.length; i++) {
      const game = schedule[i];
      
      if (!game.venue || !game.date || !game.startTime) {
        continue;
      }

      const venueKey = game.venue;
      const gameStart = new Date(`${game.date}T${game.startTime || '00:00'}:00`);
      const gameEnd = new Date(gameStart);
      gameEnd.setHours(gameEnd.getHours() + (game.duration || 3));

      if (!venueBookings.has(venueKey)) {
        venueBookings.set(venueKey, []);
      }

      const bookings = venueBookings.get(venueKey);
      
      // Check for overlaps with existing bookings
      for (const booking of bookings) {
        if (this._timePeriodsOverlap(gameStart, gameEnd, booking.start, booking.end)) {
          conflicts.push({
            id: `venue_${conflicts.length + 1}`,
            type: this.conflictTypes.VENUE,
            severity: this.severityLevels.HIGH,
            venue: venueKey,
            conflictingGames: [
              {
                id: game.id || `game_${i}`,
                date: game.date,
                startTime: game.startTime,
                teams: [game.homeTeam, game.awayTeam]
              },
              {
                id: booking.gameId,
                date: booking.date,
                startTime: booking.startTime,
                teams: booking.teams
              }
            ],
            description: `Venue conflict at ${venueKey}: Multiple games scheduled for overlapping times`,
            impact: {
              teamsAffected: [game.homeTeam, game.awayTeam, ...booking.teams],
              venuesAffected: [venueKey],
              cascadingEffects: []
            },
            recommendedActions: [
              'Reschedule one game to different time',
              'Move one game to alternate venue',
              'Extend time between games if possible'
            ],
            overlapDuration: this._calculateOverlapMinutes(gameStart, gameEnd, booking.start, booking.end)
          });
        }
      }

      bookings.push({
        gameId: game.id || `game_${i}`,
        start: gameStart,
        end: gameEnd,
        date: game.date,
        startTime: game.startTime,
        teams: [game.homeTeam, game.awayTeam]
      });
    }

    return conflicts;
  }

  /**
   * Detect team conflicts with advanced rest period analysis
   * @param {Array} schedule - Schedule to analyze
   * @param {Object} context - Additional context
   * @returns {Array} Team conflicts
   * @private
   */
  _detectTeamConflicts(schedule, context) {
    const conflicts = [];
    const teamSchedules = new Map();

    // Enhanced team conflict detection
    for (let i = 0; i < schedule.length; i++) {
      const game = schedule[i];
      
      if (!game.homeTeam || !game.awayTeam) {
        continue;
      }

      const teams = [game.homeTeam, game.awayTeam];
      const gameDate = new Date(`${game.date}T${game.startTime || '00:00'}:00`);

      for (const team of teams) {
        if (!teamSchedules.has(team)) {
          teamSchedules.set(team, []);
        }

        const teamGames = teamSchedules.get(team);

        // Check for same-day conflicts
        const sameDayGames = teamGames.filter(tg => tg.date === game.date);
        if (sameDayGames.length > 0) {
          conflicts.push({
            id: `team_same_day_${conflicts.length + 1}`,
            type: this.conflictTypes.TEAM,
            severity: this.severityLevels.CRITICAL,
            team,
            date: game.date,
            conflictingGames: [
              { id: game.id || `game_${i}`, teams: [game.homeTeam, game.awayTeam] },
              ...sameDayGames.map(sg => ({ id: sg.id, teams: sg.teams }))
            ],
            description: `Team ${team} scheduled for multiple games on the same day (${game.date})`,
            impact: {
              teamsAffected: [team],
              venuesAffected: [game.venue, ...sameDayGames.map(sg => sg.venue)],
              cascadingEffects: []
            },
            recommendedActions: [
              'Reschedule one game to different day',
              'Swap one opponent to different team'
            ]
          });
        }

        // Check for insufficient rest periods
        for (const prevGame of teamGames) {
          const prevGameEnd = new Date(`${prevGame.date}T${prevGame.startTime || '00:00'}:00`);
          prevGameEnd.setHours(prevGameEnd.getHours() + (prevGame.duration || 3));
          
          const restHours = (gameDate - prevGameEnd) / (1000 * 60 * 60);
          const minRestHours = this._getMinimumRestHours(team, prevGame, game, context);

          if (restHours > 0 && restHours < minRestHours) {
            conflicts.push({
              id: `team_rest_${conflicts.length + 1}`,
              type: this.conflictTypes.REST,
              severity: restHours < (minRestHours * 0.5) ? this.severityLevels.HIGH : this.severityLevels.MEDIUM,
              team,
              restHours,
              minimumRequired: minRestHours,
              previousGame: prevGame,
              currentGame: {
                id: game.id || `game_${i}`,
                date: game.date,
                startTime: game.startTime,
                teams: [game.homeTeam, game.awayTeam]
              },
              description: `Insufficient rest for team ${team}: ${restHours.toFixed(1)} hours (minimum: ${minRestHours})`,
              impact: {
                teamsAffected: [team],
                playerWelfare: true,
                performanceImpact: 'medium'
              },
              recommendedActions: [
                `Reschedule to allow at least ${minRestHours} hours rest`,
                'Adjust game start times'
              ]
            });
          }
        }

        teamSchedules.get(team).push({
          id: game.id || `game_${i}`,
          date: game.date,
          startTime: game.startTime,
          duration: game.duration || 3,
          teams: [game.homeTeam, game.awayTeam],
          venue: game.venue
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect travel conflicts with geographic optimization
   * @param {Array} schedule - Schedule to analyze
   * @param {Object} context - Additional context
   * @returns {Array} Travel conflicts
   * @private
   */
  _detectTravelConflicts(schedule, context) {
    const conflicts = [];
    const venues = context.venues || {};
    const teamTravelSchedules = new Map();

    for (let i = 0; i < schedule.length; i++) {
      const game = schedule[i];
      
      if (!game.homeTeam || !game.awayTeam || !game.venue) {
        continue;
      }

      const teams = [game.homeTeam, game.awayTeam];
      const gameStart = new Date(`${game.date}T${game.startTime || '00:00'}:00`);

      for (const team of teams) {
        if (!teamTravelSchedules.has(team)) {
          teamTravelSchedules.set(team, []);
        }

        const teamTravel = teamTravelSchedules.get(team);
        const isHomeTeam = team === game.homeTeam;

        // For away teams, check travel requirements
        if (!isHomeTeam) {
          for (const prevEvent of teamTravel) {
            if (prevEvent.venue === game.venue) {
              continue; // Same venue, no travel needed
            }

            const travelInfo = this._calculateTravelRequirements(
              prevEvent.venue, 
              game.venue, 
              venues, 
              context
            );

            if (travelInfo.conflict) {
              conflicts.push({
                id: `travel_${conflicts.length + 1}`,
                type: this.conflictTypes.TRAVEL,
                severity: travelInfo.severity,
                team,
                sourceVenue: prevEvent.venue,
                destinationVenue: game.venue,
                travelDistance: travelInfo.distance,
                travelTime: travelInfo.travelTime,
                availableTime: travelInfo.availableTime,
                requiredTime: travelInfo.requiredTime,
                previousGame: prevEvent,
                currentGame: {
                  id: game.id || `game_${i}`,
                  date: game.date,
                  startTime: game.startTime,
                  teams: [game.homeTeam, game.awayTeam]
                },
                description: `Insufficient travel time for team ${team}: ${travelInfo.availableTime}h available, ${travelInfo.requiredTime}h required`,
                impact: {
                  teamsAffected: [team],
                  logisticsComplexity: 'high',
                  costImplications: travelInfo.estimatedCost
                },
                recommendedActions: [
                  'Reschedule current game to later time/date',
                  'Find closer venue for one of the games',
                  'Arrange charter transportation'
                ]
              });
            }
          }
        }

        teamTravelSchedules.get(team).push({
          id: game.id || `game_${i}`,
          date: game.date,
          startTime: game.startTime,
          venue: game.venue,
          isHome: isHomeTeam,
          teams: [game.homeTeam, game.awayTeam]
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect rest period conflicts
   * @param {Array} schedule - Schedule to analyze
   * @param {Object} context - Additional context
   * @returns {Array} Rest period conflicts
   * @private
   */
  _detectRestPeriodConflicts(schedule, context) {
    // This is handled within team conflicts but could be expanded
    // for sport-specific rest requirements
    return [];
  }

  /**
   * Detect resource conflicts
   * @param {Array} schedule - Schedule to analyze
   * @param {Object} context - Additional context
   * @returns {Array} Resource conflicts
   * @private
   */
  _detectResourceConflicts(schedule, context) {
    const conflicts = [];
    const resources = context.resources || {};
    
    if (Object.keys(resources).length === 0) {
      return conflicts;
    }

    // Implementation for resource conflict detection
    // This would check equipment, personnel, facility resources
    
    return conflicts;
  }

  /**
   * Detect venue sharing conflicts
   * @param {Array} schedule - Schedule to analyze
   * @param {Object} context - Additional context
   * @returns {Array} Venue sharing conflicts
   * @private
   */
  _detectVenueSharingConflicts(schedule, context) {
    const conflicts = [];
    const sharedVenues = context.sharedVenues || {};

    // Check for shared venue usage conflicts
    // Some venues host multiple sports or external events
    
    return conflicts;
  }

  /**
   * Detect media conflicts
   * @param {Array} schedule - Schedule to analyze
   * @param {Object} context - Additional context
   * @returns {Array} Media conflicts
   * @private
   */
  _detectMediaConflicts(schedule, context) {
    const conflicts = [];
    
    // Check for TV window conflicts, overlapping broadcast times
    // Big 12 media rights considerations
    
    return conflicts;
  }

  /**
   * Detect Big 12 specific media conflicts
   * @param {Array} schedule - Schedule to analyze
   * @param {Object} context - Additional context
   * @returns {Array} Big 12 media conflicts
   * @private
   */
  _detectBig12MediaConflicts(schedule, context) {
    const conflicts = [];
    
    // ESPN, FOX, Big 12 Now conflicts
    // Prime time slots, regional coverage
    
    return conflicts;
  }

  /**
   * Detect championship-related conflicts
   * @param {Array} schedule - Schedule to analyze
   * @param {Object} context - Additional context
   * @returns {Array} Championship conflicts
   * @private
   */
  _detectChampionshipConflicts(schedule, context) {
    const conflicts = [];
    
    // Check for conflicts with Big 12 Championship dates
    // NCAA tournament implications
    
    return conflicts;
  }

  /**
   * Detect cascading conflicts
   * @param {Array} existingConflicts - Already detected conflicts
   * @param {Array} schedule - Schedule to analyze
   * @param {Object} context - Additional context
   * @returns {Array} Cascading conflicts
   * @private
   */
  _detectCascadingConflicts(existingConflicts, schedule, context) {
    const cascadingConflicts = [];
    
    // Analyze how existing conflicts might create additional conflicts
    // when resolved using typical strategies
    
    return cascadingConflicts;
  }

  /**
   * Enhance conflicts with severity scoring
   * @param {Array} conflicts - Conflicts to enhance
   * @param {Array} schedule - Schedule
   * @param {Object} context - Additional context
   * @private
   */
  _enhanceConflictsWithScoring(conflicts, schedule, context) {
    for (const conflict of conflicts) {
      // Add impact scores
      conflict.impactScore = this._calculateImpactScore(conflict, schedule, context);
      conflict.resolutionDifficulty = this._estimateResolutionDifficulty(conflict, context);
      conflict.businessImpact = this._assessBusinessImpact(conflict, context);
    }
  }

  /**
   * Helper method to check if a game involves BYU
   * @param {Object} game - Game object
   * @returns {boolean} True if BYU is involved
   * @private
   */
  _gameInvolvesBYU(game) {
    return game.homeTeam === 'BYU' || game.awayTeam === 'BYU';
  }

  /**
   * Calculate overlap between two time periods
   * @param {Date} start1 - Start of first period
   * @param {Date} end1 - End of first period
   * @param {Date} start2 - Start of second period
   * @param {Date} end2 - End of second period
   * @returns {boolean} True if periods overlap
   * @private
   */
  _timePeriodsOverlap(start1, end1, start2, end2) {
    return start1 < end2 && end1 > start2;
  }

  /**
   * Calculate overlap duration in minutes
   * @param {Date} start1 - Start of first period
   * @param {Date} end1 - End of first period
   * @param {Date} start2 - Start of second period
   * @param {Date} end2 - End of second period
   * @returns {number} Overlap in minutes
   * @private
   */
  _calculateOverlapMinutes(start1, end1, start2, end2) {
    const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
    const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
    return Math.max(0, (overlapEnd - overlapStart) / (1000 * 60));
  }

  /**
   * Get minimum rest hours for a team
   * @param {string} team - Team name
   * @param {Object} prevGame - Previous game
   * @param {Object} currentGame - Current game
   * @param {Object} context - Additional context
   * @returns {number} Minimum rest hours
   * @private
   */
  _getMinimumRestHours(team, prevGame, currentGame, context) {
    const sport = context.sport || 'general';
    const sportRestRequirements = {
      'football': 144,      // 6 days
      'basketball': 20,     // 20 hours
      'baseball': 16,       // 16 hours
      'soccer': 48,         // 2 days
      'volleyball': 20,     // 20 hours
      'general': 24         // 1 day default
    };

    return sportRestRequirements[sport.toLowerCase()] || sportRestRequirements.general;
  }

  /**
   * Calculate travel requirements between venues
   * @param {string} sourceVenue - Source venue
   * @param {string} destVenue - Destination venue
   * @param {Object} venues - Venue information
   * @param {Object} context - Additional context
   * @returns {Object} Travel requirements and conflict info
   * @private
   */
  _calculateTravelRequirements(sourceVenue, destVenue, venues, context) {
    // Simplified travel calculation
    // In production, this would use real geographic data
    
    const defaultTravelTime = 4; // hours
    const defaultDistance = 200; // miles
    const bufferTime = 2; // hours
    
    return {
      distance: defaultDistance,
      travelTime: defaultTravelTime,
      requiredTime: defaultTravelTime + bufferTime,
      availableTime: 8, // This would be calculated from actual schedule
      conflict: false,
      severity: this.severityLevels.MEDIUM,
      estimatedCost: defaultDistance * 2 // $2 per mile estimate
    };
  }

  /**
   * Calculate impact score for a conflict
   * @param {Object} conflict - Conflict to score
   * @param {Array} schedule - Schedule
   * @param {Object} context - Additional context
   * @returns {number} Impact score (0-100)
   * @private
   */
  _calculateImpactScore(conflict, schedule, context) {
    let score = 0;
    
    // Base score by severity
    const severityScores = {
      CRITICAL: 80,
      HIGH: 60,
      MEDIUM: 40,
      LOW: 20
    };
    
    score += severityScores[conflict.severity] || 0;
    
    // Additional factors
    if (conflict.impact?.teamsAffected?.length > 2) score += 10;
    if (conflict.impact?.playerWelfare) score += 15;
    if (conflict.big12Rule) score += 20;
    
    return Math.min(100, score);
  }

  /**
   * Estimate resolution difficulty
   * @param {Object} conflict - Conflict to assess
   * @param {Object} context - Additional context
   * @returns {string} Difficulty level
   * @private
   */
  _estimateResolutionDifficulty(conflict, context) {
    if (conflict.type === this.conflictTypes.BYU_SUNDAY) return 'easy';
    if (conflict.type === this.conflictTypes.VENUE) return 'medium';
    if (conflict.type === this.conflictTypes.TRAVEL) return 'hard';
    return 'medium';
  }

  /**
   * Assess business impact
   * @param {Object} conflict - Conflict to assess
   * @param {Object} context - Additional context
   * @returns {string} Business impact level
   * @private
   */
  _assessBusinessImpact(conflict, context) {
    if (conflict.type === this.conflictTypes.BYU_SUNDAY) return 'high';
    if (conflict.type === this.conflictTypes.MEDIA) return 'high';
    return 'medium';
  }

  /**
   * Remove duplicate conflicts
   * @param {Array} conflicts - Conflicts to deduplicate
   * @returns {Array} Unique conflicts
   * @private
   */
  _deduplicateConflicts(conflicts) {
    const seen = new Set();
    return conflicts.filter(conflict => {
      const key = `${conflict.type}_${conflict.date}_${conflict.teams?.join('_') || conflict.venue}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Sort conflicts by severity and priority
   * @param {Array} conflicts - Conflicts to sort
   * @returns {Array} Sorted conflicts
   * @private
   */
  _sortConflictsBySeverity(conflicts) {
    const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    
    return conflicts.sort((a, b) => {
      const aSeverity = severityOrder[a.severity] || 0;
      const bSeverity = severityOrder[b.severity] || 0;
      
      if (aSeverity !== bSeverity) {
        return bSeverity - aSeverity;
      }
      
      // Tie-break by priority or impact score
      const aPriority = a.priority || a.impactScore || 0;
      const bPriority = b.priority || b.impactScore || 0;
      
      return bPriority - aPriority;
    });
  }
}

module.exports = ConflictDetector;