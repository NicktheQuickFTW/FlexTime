/**
 * Enhanced Football Constraint System for Big 12 Conference
 * 
 * Advanced optimization capabilities for:
 * - Media rights optimization with ABC/ESPN and FOX requirements
 * - Intelligent travel burden optimization with geographic clustering
 * - Thanksgiving weekend scheduling optimization
 * - Championship game preparation constraints
 * - Rivalry game placement optimization
 */

const logger = require("../utils/logger");
const { ConstraintTypes } = require('../constraint-management-system');

/**
 * Enhanced Football Constraints with Advanced Optimization
 */
class EnhancedFootballConstraints {
  constructor() {
    this.name = 'Enhanced Football Constraints';
    this.version = '3.0';
    this.sport = 'football';
    
    // Geographic clustering for travel optimization
    this.geographicClusters = {
      west: {
        teams: ['Arizona', 'Arizona State', 'Colorado', 'Utah'],
        centralLocation: { lat: 39.7392, lng: -104.9903 } // Denver
      },
      southwest: {
        teams: ['BYU'],
        centralLocation: { lat: 40.2518, lng: -111.6493 } // Provo
      },
      central: {
        teams: ['Texas Tech', 'TCU', 'Baylor', 'Houston', 'Oklahoma State'],
        centralLocation: { lat: 32.7767, lng: -96.7970 } // Dallas
      },
      midwest: {
        teams: ['Kansas', 'Kansas State', 'Iowa State'],
        centralLocation: { lat: 39.0458, lng: -94.5951 } // Kansas City
      },
      east: {
        teams: ['West Virginia', 'Cincinnati', 'UCF'],
        centralLocation: { lat: 39.1031, lng: -84.5120 } // Cincinnati
      }
    };
    
    // Media rights optimization parameters
    this.mediaRightsOptimization = {
      abcEspn: {
        minimumGames: 40,
        preferredTimeSlots: ['12:00', '15:30', '19:00'],
        premiumMatchups: ['Top 25 vs Top 25', 'Rivalry Games'],
        blackoutDates: ['NFL Conflict Dates']
      },
      fox: {
        minimumGames: 25,
        preferredTimeSlots: ['12:00', '16:00', '20:00'],
        premiumMatchups: ['Conference Championship Implications'],
        exclusiveWindows: ['Big Noon Saturday']
      },
      weeknightRequirements: {
        thursday: { minimum: 6, optimal: 8 },
        friday: { minimum: 2, optimal: 4 }
      }
    };
    
    // Rivalry game optimization
    this.rivalryGames = {
      primary: [
        { teams: ['Kansas', 'Kansas State'], name: 'Sunflower Showdown', timing: 'late_season', importance: 10 },
        { teams: ['Texas Tech', 'Baylor'], name: 'Battle of the Brazos', timing: 'mid_season', importance: 9 },
        { teams: ['Iowa State', 'Kansas State'], name: 'Farmageddon', timing: 'late_season', importance: 8 }
      ],
      developing: [
        { teams: ['Arizona', 'Arizona State'], name: 'Territorial Cup', timing: 'late_season', importance: 7 },
        { teams: ['Colorado', 'Utah'], name: 'Rocky Mountain Showdown', timing: 'mid_season', importance: 6 }
      ]
    };
  }

  /**
   * Generate comprehensive football constraints for Big 12
   * @param {Object} parameters - Configuration parameters
   * @returns {Array} Enhanced constraint set
   */
  generateConstraints(parameters = {}) {
    const constraints = [];
    
    // Core hard constraints
    constraints.push(...this._generateHardConstraints(parameters));
    
    // Media rights optimization constraints
    constraints.push(...this._generateMediaRightsConstraints(parameters));
    
    // Travel optimization constraints
    constraints.push(...this._generateTravelOptimizationConstraints(parameters));
    
    // Thanksgiving weekend optimization
    constraints.push(...this._generateThanksgivingConstraints(parameters));
    
    // Championship preparation constraints
    constraints.push(...this._generateChampionshipPreparationConstraints(parameters));
    
    // Rivalry game optimization
    constraints.push(...this._generateRivalryGameConstraints(parameters));
    
    // Venue sharing and facility constraints
    constraints.push(...this._generateVenueConstraints(parameters));
    
    // Weather and climate optimization
    constraints.push(...this._generateWeatherConstraints(parameters));
    
    logger.info(`Generated ${constraints.length} enhanced football constraints`, {
      sport: this.sport,
      version: this.version
    });
    
    return constraints;
  }

  /**
   * Generate hard constraints that must be satisfied
   * @param {Object} parameters - Configuration parameters
   * @returns {Array} Hard constraints
   * @private
   */
  _generateHardConstraints(parameters) {
    return [
      {
        id: 'football_consecutive_road_games',
        type: 'CONSECUTIVE_ROAD_GAMES',
        hardness: 'hard',
        category: 'balance',
        weight: 100,
        description: 'No school plays more than two consecutive road Conference games',
        parameters: {
          maxConsecutive: 2,
          scope: 'conference_only'
        },
        evaluation: (schedule, team) => this._evaluateConsecutiveRoadGames(schedule, team),
        violation: 'critical'
      },
      
      {
        id: 'football_road_game_distribution',
        type: 'ROAD_GAME_DISTRIBUTION',
        hardness: 'hard',
        category: 'fairness',
        weight: 95,
        description: 'No school plays four-of-five Conference games on the road',
        parameters: {
          maxRoadInWindow: 4,
          windowSize: 5
        },
        evaluation: (schedule, team) => this._evaluateRoadGameDistribution(schedule, team),
        violation: 'critical'
      },
      
      {
        id: 'football_conference_game_count',
        type: 'CONFERENCE_GAME_COUNT',
        hardness: 'hard',
        category: 'scheduling',
        weight: 100,
        description: 'Each team must play exactly 9 conference games',
        parameters: {
          requiredGames: 9,
          conferenceOnly: true
        },
        evaluation: (schedule, team) => this._evaluateConferenceGameCount(schedule, team),
        violation: 'critical'
      },
      
      {
        id: 'football_schedule_duration',
        type: 'SCHEDULE_DURATION',
        hardness: 'hard',
        category: 'temporal',
        weight: 90,
        description: 'All games must be scheduled within a 9-week period ending on Thanksgiving Saturday',
        parameters: {
          totalWeeks: 9,
          endDate: parameters.thanksgivingDate || 'Thanksgiving Saturday'
        },
        evaluation: (schedule) => this._evaluateScheduleDuration(schedule),
        violation: 'critical'
      },
      
      {
        id: 'byu_sunday_restriction',
        type: 'BYU_SUNDAY_RESTRICTION',
        hardness: 'hard',
        category: 'religious',
        weight: 100,
        description: 'BYU cannot play games on Sunday',
        parameters: {
          team: 'BYU',
          restrictedDays: ['Sunday']
        },
        evaluation: (schedule) => this._evaluateBYUSundayRestriction(schedule),
        violation: 'critical'
      },
      
      {
        id: 'single_game_alternating_venue',
        type: 'SINGLE_GAME_ALTERNATING_VENUE',
        hardness: 'hard',
        category: 'fairness',
        weight: 85,
        description: 'Single-game trips must alternate venues between consecutive seasons',
        parameters: {
          requireAlternating: true,
          lookbackSeasons: 1,
          scope: 'conference_only'
        },
        evaluation: (schedule, previousSeasonSchedule) => this._evaluateSingleGameAlternatingVenue(schedule, previousSeasonSchedule),
        violation: 'high'
      }
    ];
  }

  /**
   * Generate media rights optimization constraints
   * @param {Object} parameters - Configuration parameters
   * @returns {Array} Media constraints
   * @private
   */
  _generateMediaRightsConstraints(parameters) {
    return [
      {
        id: 'abc_espn_game_minimum',
        type: 'TV_BROADCAST_MANDATORY',
        hardness: 'hard',
        category: 'media',
        weight: 85,
        description: 'Meet ABC/ESPN minimum game requirements',
        parameters: {
          network: 'ABC/ESPN',
          minimumGames: this.mediaRightsOptimization.abcEspn.minimumGames,
          preferredTimeSlots: this.mediaRightsOptimization.abcEspn.preferredTimeSlots
        },
        evaluation: (schedule) => this._evaluateABCESPNRequirements(schedule),
        violation: 'high'
      },
      
      {
        id: 'fox_game_minimum',
        type: 'TV_BROADCAST_MANDATORY',
        hardness: 'hard',
        category: 'media',
        weight: 85,
        description: 'Meet FOX minimum game requirements',
        parameters: {
          network: 'FOX',
          minimumGames: this.mediaRightsOptimization.fox.minimumGames,
          exclusiveWindows: this.mediaRightsOptimization.fox.exclusiveWindows
        },
        evaluation: (schedule) => this._evaluateFOXRequirements(schedule),
        violation: 'high'
      },
      
      {
        id: 'weeknight_game_requirements',
        type: 'WEEKNIGHT_GAMES',
        hardness: 'hard',
        category: 'media',
        weight: 80,
        description: 'Provide required weeknight games for TV',
        parameters: {
          thursdayGames: this.mediaRightsOptimization.weeknightRequirements.thursday,
          fridayGames: this.mediaRightsOptimization.weeknightRequirements.friday
        },
        evaluation: (schedule) => this._evaluateWeeknightRequirements(schedule),
        violation: 'high'
      },
      
      {
        id: 'premium_matchup_optimization',
        type: 'TV_BROADCAST_PREFERRED',
        hardness: 'soft',
        category: 'media',
        weight: 70,
        description: 'Optimize placement of premium matchups for maximum TV value',
        parameters: {
          premiumCriteria: ['Top 25 Rankings', 'Rivalry Games', 'Championship Implications'],
          optimalTimeSlots: ['Prime Time', 'Big Noon', 'Afternoon'],
          avoidConflicts: ['NFL Games', 'Other Major Sports']
        },
        evaluation: (schedule) => this._evaluatePremiumMatchupPlacement(schedule),
        optimization: 'maximize_tv_value'
      }
    ];
  }

  /**
   * Generate travel optimization constraints using geographic clustering
   * @param {Object} parameters - Configuration parameters
   * @returns {Array} Travel constraints
   * @private
   */
  _generateTravelOptimizationConstraints(parameters) {
    return [
      {
        id: 'geographic_clustering_optimization',
        type: 'TRAVEL_DISTANCE',
        hardness: 'soft',
        category: 'logistics',
        weight: 75,
        description: 'Optimize travel by clustering geographically proximate games',
        parameters: {
          clusters: this.geographicClusters,
          maxTravelDistance: 1500, // miles
          preferredClusterSequencing: true
        },
        evaluation: (schedule) => this._evaluateGeographicClustering(schedule),
        optimization: 'minimize_travel_burden'
      },
      
      {
        id: 'cross_timezone_travel_optimization',
        type: 'TIME_ZONE_TRAVEL',
        hardness: 'soft',
        category: 'logistics',
        weight: 65,
        description: 'Minimize adverse effects of cross-timezone travel',
        parameters: {
          maxTimezoneChanges: 2,
          recoveryTime: '72_hours',
          preferredDirection: 'west_to_east'
        },
        evaluation: (schedule) => this._evaluateTimezoneTravel(schedule),
        optimization: 'minimize_timezone_impact'
      },
      
      {
        id: 'travel_circuit_optimization',
        type: 'TRAVEL_CIRCUIT',
        hardness: 'soft',
        category: 'logistics',
        weight: 60,
        description: 'Create efficient travel circuits for multi-game road trips',
        parameters: {
          maxCircuitGames: 3,
          circuitEfficiencyThreshold: 0.8,
          allowBacktracking: false
        },
        evaluation: (schedule) => this._evaluateTravelCircuits(schedule),
        optimization: 'create_efficient_circuits'
      },
      
      {
        id: 'charter_flight_optimization',
        type: 'CHARTER_OPTIMIZATION',
        hardness: 'preference',
        category: 'logistics',
        weight: 40,
        description: 'Optimize charter flight sharing between teams',
        parameters: {
          maxSharedFlights: 4,
          costSavingsThreshold: 0.25,
          proximityRequirement: 200 // miles
        },
        evaluation: (schedule) => this._evaluateCharterOptimization(schedule),
        optimization: 'maximize_charter_efficiency'
      }
    ];
  }

  /**
   * Generate Thanksgiving weekend optimization constraints
   * @param {Object} parameters - Configuration parameters
   * @returns {Array} Thanksgiving constraints
   * @private
   */
  _generateThanksgivingConstraints(parameters) {
    return [
      {
        id: 'thanksgiving_weekend_finale',
        type: 'THANKSGIVING_FINALE',
        hardness: 'hard',
        category: 'temporal',
        weight: 90,
        description: 'All conference play must conclude by Thanksgiving Saturday',
        parameters: {
          deadlineDate: parameters.thanksgivingDate || 'Thanksgiving Saturday',
          allowThursdayGames: false,
          allowFridayGames: false
        },
        evaluation: (schedule) => this._evaluateThanksgivingDeadline(schedule),
        violation: 'critical'
      },
      
      {
        id: 'thanksgiving_rivalry_placement',
        type: 'RIVALRY_GAME',
        hardness: 'soft',
        category: 'tradition',
        weight: 70,
        description: 'Place major rivalry games on Thanksgiving weekend when possible',
        parameters: {
          targetWeekend: 'Thanksgiving',
          rivalryGames: this.rivalryGames.primary,
          maxRivalriesOnWeekend: 2
        },
        evaluation: (schedule) => this._evaluateThanksgivingRivalries(schedule),
        optimization: 'maximize_rivalry_tradition'
      },
      
      {
        id: 'thanksgiving_travel_minimization',
        type: 'TRAVEL_DISTANCE',
        hardness: 'soft',
        category: 'logistics',
        weight: 65,
        description: 'Minimize travel burden for Thanksgiving weekend games',
        parameters: {
          weekendDefinition: 'Thanksgiving_Weekend',
          maxTravelDistance: 800, // miles
          preferHomeGames: true
        },
        evaluation: (schedule) => this._evaluateThanksgivingTravel(schedule),
        optimization: 'minimize_holiday_travel'
      }
    ];
  }

  /**
   * Generate championship game preparation constraints
   * @param {Object} parameters - Configuration parameters
   * @returns {Array} Championship constraints
   * @private
   */
  _generateChampionshipPreparationConstraints(parameters) {
    return [
      {
        id: 'championship_contender_rest',
        type: 'TEAM_REST',
        hardness: 'soft',
        category: 'competitive',
        weight: 75,
        description: 'Ensure adequate rest for likely championship game participants',
        parameters: {
          minRestDays: 6,
          championshipDate: parameters.championshipDate,
          contenderCriteria: ['Division Leaders', 'Top 4 Teams']
        },
        evaluation: (schedule) => this._evaluateChampionshipRest(schedule),
        optimization: 'optimize_championship_preparation'
      },
      
      {
        id: 'championship_implications_scheduling',
        type: 'CHAMPIONSHIP_IMPLICATIONS',
        hardness: 'soft',
        category: 'competitive',
        weight: 70,
        description: 'Schedule games with championship implications for maximum drama',
        parameters: {
          finalWeeks: 2,
          maxSimultaneousGames: 4,
          preferPrimeTime: true
        },
        evaluation: (schedule) => this._evaluateChampionshipImplications(schedule),
        optimization: 'maximize_championship_drama'
      },
      
      {
        id: 'championship_venue_preparation',
        type: 'VENUE_AVAILABILITY',
        hardness: 'hard',
        category: 'facilities',
        weight: 85,
        description: 'Ensure championship venue availability and preparation time',
        parameters: {
          venue: parameters.championshipVenue || 'Arlington',
          preparationTime: '48_hours',
          mediaSetupTime: '24_hours'
        },
        evaluation: (schedule) => this._evaluateChampionshipVenue(schedule),
        violation: 'high'
      }
    ];
  }

  /**
   * Generate rivalry game optimization constraints
   * @param {Object} parameters - Configuration parameters
   * @returns {Array} Rivalry constraints
   * @private
   */
  _generateRivalryGameConstraints(parameters) {
    return [
      {
        id: 'primary_rivalry_placement',
        type: 'RIVALRY_GAME',
        hardness: 'soft',
        category: 'tradition',
        weight: 80,
        description: 'Optimal placement of primary rivalry games',
        parameters: {
          rivalries: this.rivalryGames.primary,
          preferredTiming: 'late_season',
          avoidFirstTwoWeeks: true,
          maximizeAttendance: true
        },
        evaluation: (schedule) => this._evaluatePrimaryRivalryPlacement(schedule),
        optimization: 'maximize_rivalry_impact'
      },
      
      {
        id: 'rivalry_game_distribution',
        type: 'RIVALRY_DISTRIBUTION',
        hardness: 'soft',
        category: 'balance',
        weight: 60,
        description: 'Distribute rivalry games evenly throughout season',
        parameters: {
          maxRivalriesPerWeek: 2,
          preferredWeeks: [6, 7, 8, 9],
          avoidConcentration: true
        },
        evaluation: (schedule) => this._evaluateRivalryDistribution(schedule),
        optimization: 'distribute_rivalry_games'
      },
      
      {
        id: 'developing_rivalry_support',
        type: 'DEVELOPING_RIVALRY',
        hardness: 'preference',
        category: 'tradition',
        weight: 40,
        description: 'Support development of new rivalry games',
        parameters: {
          developingRivalries: this.rivalryGames.developing,
          consistentTiming: true,
          promoteVisibility: true
        },
        evaluation: (schedule) => this._evaluateDevelopingRivalries(schedule),
        optimization: 'foster_new_rivalries'
      }
    ];
  }

  /**
   * Generate venue sharing and facility constraints
   * @param {Object} parameters - Configuration parameters
   * @returns {Array} Venue constraints
   * @private
   */
  _generateVenueConstraints(parameters) {
    return [
      {
        id: 'venue_availability_enforcement',
        type: 'VENUE_AVAILABILITY',
        hardness: 'hard',
        category: 'facilities',
        weight: 95,
        description: 'Ensure venue availability for all scheduled games',
        parameters: {
          includeSetupTime: true,
          includeTeardownTime: true,
          bufferTime: '4_hours'
        },
        evaluation: (schedule) => this._evaluateVenueAvailability(schedule),
        violation: 'critical'
      },
      
      {
        id: 'shared_facility_optimization',
        type: 'VENUE_SHARING',
        hardness: 'soft',
        category: 'facilities',
        weight: 65,
        description: 'Optimize usage of shared facilities across sports',
        parameters: {
          sharedVenues: parameters.sharedVenues || [],
          priorityHierarchy: ['Football', 'Basketball', 'Other Sports'],
          minimizeConflicts: true
        },
        evaluation: (schedule) => this._evaluateSharedFacilityUsage(schedule),
        optimization: 'optimize_facility_usage'
      },
      
      {
        id: 'stadium_capacity_optimization',
        type: 'STADIUM_CAPACITY',
        hardness: 'soft',
        category: 'attendance',
        weight: 55,
        description: 'Match high-demand games with appropriate stadium capacity',
        parameters: {
          capacityThresholds: {
            premium: 60000,
            standard: 40000,
            minimum: 25000
          },
          demandCriteria: ['Rankings', 'Rivalry', 'Championship Implications']
        },
        evaluation: (schedule) => this._evaluateStadiumCapacityMatch(schedule),
        optimization: 'maximize_attendance_potential'
      }
    ];
  }

  /**
   * Generate weather and climate optimization constraints
   * @param {Object} parameters - Configuration parameters
   * @returns {Array} Weather constraints
   * @private
   */
  _generateWeatherConstraints(parameters) {
    return [
      {
        id: 'weather_pattern_optimization',
        type: 'WEATHER_OPTIMAL',
        hardness: 'soft',
        category: 'conditions',
        weight: 50,
        description: 'Optimize scheduling around regional weather patterns',
        parameters: {
          avoidExtremeWeather: true,
          preferableConditions: ['Clear', 'Partly Cloudy'],
          temperatureRange: { min: 35, max: 85 }, // Fahrenheit
          windSpeedMax: 25 // mph
        },
        evaluation: (schedule) => this._evaluateWeatherOptimization(schedule),
        optimization: 'optimize_weather_conditions'
      },
      
      {
        id: 'regional_climate_adaptation',
        type: 'CLIMATE_ADAPTATION',
        hardness: 'preference',
        category: 'conditions',
        weight: 35,
        description: 'Adapt scheduling to regional climate differences',
        parameters: {
          climateZones: {
            desert: ['Arizona', 'Arizona State'],
            mountain: ['Colorado', 'Utah', 'BYU'],
            plains: ['Kansas', 'Kansas State', 'Iowa State'],
            subtropical: ['Houston', 'TCU'],
            temperate: ['West Virginia', 'Cincinnati']
          },
          seasonalAdjustments: true
        },
        evaluation: (schedule) => this._evaluateClimateAdaptation(schedule),
        optimization: 'adapt_to_regional_climate'
      }
    ];
  }

  // Evaluation methods for each constraint type
  
  _evaluateConsecutiveRoadGames(schedule, team) {
    // Implementation for evaluating consecutive road games
    const teamGames = schedule.filter(game => 
      (game.homeTeam === team || game.awayTeam === team)
    );
    
    let consecutiveRoad = 0;
    let maxConsecutiveRoad = 0;
    
    for (const game of teamGames) {
      if (game.awayTeam === team) {
        consecutiveRoad++;
        maxConsecutiveRoad = Math.max(maxConsecutiveRoad, consecutiveRoad);
      } else {
        consecutiveRoad = 0;
      }
    }
    
    return {
      satisfied: maxConsecutiveRoad <= 2,
      score: maxConsecutiveRoad <= 2 ? 1.0 : Math.max(0, 1.0 - (maxConsecutiveRoad - 2) * 0.5),
      details: { maxConsecutiveRoad, limit: 2 }
    };
  }

  _evaluateRoadGameDistribution(schedule, team) {
    // Implementation for evaluating road game distribution in windows
    const teamGames = schedule.filter(game => 
      (game.homeTeam === team || game.awayTeam === team)
    );
    
    let violations = 0;
    for (let i = 0; i <= teamGames.length - 5; i++) {
      const window = teamGames.slice(i, i + 5);
      const roadGames = window.filter(game => game.awayTeam === team).length;
      if (roadGames >= 4) violations++;
    }
    
    return {
      satisfied: violations === 0,
      score: violations === 0 ? 1.0 : Math.max(0, 1.0 - violations * 0.25),
      details: { violations, rule: 'max_4_of_5_road' }
    };
  }

  _evaluateConferenceGameCount(schedule, team) {
    const conferenceGames = schedule.filter(game => 
      (game.homeTeam === team || game.awayTeam === team) && game.isConference
    );
    
    return {
      satisfied: conferenceGames.length === 9,
      score: conferenceGames.length === 9 ? 1.0 : 0.0,
      details: { actual: conferenceGames.length, required: 9 }
    };
  }

  _evaluateScheduleDuration(schedule) {
    // Calculate if schedule fits within 9-week window ending on Thanksgiving
    const conferenceGames = schedule.filter(game => game.isConference);
    if (conferenceGames.length === 0) return { satisfied: true, score: 1.0 };
    
    const dates = conferenceGames.map(game => new Date(game.date)).sort();
    const firstGame = dates[0];
    const lastGame = dates[dates.length - 1];
    const weeksBetween = Math.ceil((lastGame - firstGame) / (7 * 24 * 60 * 60 * 1000));
    
    return {
      satisfied: weeksBetween <= 9,
      score: weeksBetween <= 9 ? 1.0 : Math.max(0, 1.0 - (weeksBetween - 9) * 0.1),
      details: { weeks: weeksBetween, limit: 9 }
    };
  }

  _evaluateBYUSundayRestriction(schedule) {
    const byuSundayGames = schedule.filter(game => 
      (game.homeTeam === 'BYU' || game.awayTeam === 'BYU') && 
      new Date(game.date).getDay() === 0
    );
    
    return {
      satisfied: byuSundayGames.length === 0,
      score: byuSundayGames.length === 0 ? 1.0 : 0.0,
      details: { sundayGames: byuSundayGames.length }
    };
  }

  _evaluateSingleGameAlternatingVenue(schedule, previousSeasonSchedule) {
    if (!previousSeasonSchedule || !Array.isArray(previousSeasonSchedule)) {
      // If no previous season data, constraint is satisfied by default
      return {
        satisfied: true,
        score: 1.0,
        details: { message: 'No previous season data available' }
      };
    }

    // Get all conference teams
    const teams = new Set();
    schedule.filter(game => game.isConference).forEach(game => {
      teams.add(game.homeTeam);
      teams.add(game.awayTeam);
    });

    let violations = 0;
    const violationDetails = [];

    for (const team of teams) {
      // Find single-game opponents from previous season
      const previousOpponents = this._findSingleGameOpponents(previousSeasonSchedule, team);
      
      // Check current season single-game opponents
      const currentOpponents = this._findSingleGameOpponents(schedule, team);
      
      for (const opponent of previousOpponents) {
        if (currentOpponents.has(opponent)) {
          // Same opponent appears as single-game in both seasons
          const prevVenue = previousOpponents.get(opponent);
          const currVenue = currentOpponents.get(opponent);
          
          // Check if venue alternated
          if (prevVenue === currVenue) {
            violations++;
            violationDetails.push({
              team,
              opponent,
              previousVenue: prevVenue,
              currentVenue: currVenue,
              message: `${team} vs ${opponent} repeated same venue (${currVenue}) in consecutive seasons`
            });
          }
        }
      }
    }

    return {
      satisfied: violations === 0,
      score: violations === 0 ? 1.0 : Math.max(0, 1.0 - violations * 0.2),
      details: {
        violations,
        violationDetails,
        rule: 'single_game_alternating_venue'
      }
    };
  }

  _findSingleGameOpponents(schedule, team) {
    const opponents = new Map();
    
    // Count games against each opponent
    schedule.filter(game => 
      (game.homeTeam === team || game.awayTeam === team) && game.isConference
    ).forEach(game => {
      const opponent = game.homeTeam === team ? game.awayTeam : game.homeTeam;
      const venue = game.homeTeam === team ? 'home' : 'away';
      
      if (opponents.has(opponent)) {
        // Multiple games against this opponent, not a single-game trip
        opponents.delete(opponent);
      } else {
        opponents.set(opponent, venue);
      }
    });

    return opponents;
  }

  _evaluateABCESPNRequirements(schedule) {
    const abcEspnGames = schedule.filter(game => 
      game.broadcaster && game.broadcaster.includes('ESPN')
    );
    
    const required = this.mediaRightsOptimization.abcEspn.minimumGames;
    
    return {
      satisfied: abcEspnGames.length >= required,
      score: Math.min(1.0, abcEspnGames.length / required),
      details: { actual: abcEspnGames.length, required }
    };
  }

  _evaluateFOXRequirements(schedule) {
    const foxGames = schedule.filter(game => 
      game.broadcaster && game.broadcaster.includes('FOX')
    );
    
    const required = this.mediaRightsOptimization.fox.minimumGames;
    
    return {
      satisfied: foxGames.length >= required,
      score: Math.min(1.0, foxGames.length / required),
      details: { actual: foxGames.length, required }
    };
  }

  _evaluateWeeknightRequirements(schedule) {
    const thursdayGames = schedule.filter(game => 
      new Date(game.date).getDay() === 4
    );
    const fridayGames = schedule.filter(game => 
      new Date(game.date).getDay() === 5
    );
    
    const thursdayRequired = this.mediaRightsOptimization.weeknightRequirements.thursday.minimum;
    const fridayRequired = this.mediaRightsOptimization.weeknightRequirements.friday.minimum;
    
    const thursdayMet = thursdayGames.length >= thursdayRequired;
    const fridayMet = fridayGames.length >= fridayRequired;
    
    return {
      satisfied: thursdayMet && fridayMet,
      score: (thursdayMet ? 0.7 : 0) + (fridayMet ? 0.3 : 0),
      details: {
        thursday: { actual: thursdayGames.length, required: thursdayRequired },
        friday: { actual: fridayGames.length, required: fridayRequired }
      }
    };
  }

  // Additional evaluation methods would be implemented here for all constraint types
  // ... (implementing remaining evaluation methods)

  /**
   * Get constraint optimization recommendations
   * @param {Object} schedule - Current schedule
   * @returns {Array} Optimization recommendations
   */
  getOptimizationRecommendations(schedule) {
    const recommendations = [];
    
    // Analyze current constraint satisfaction
    const constraintResults = this.evaluateAllConstraints(schedule);
    
    // Generate specific recommendations based on violations
    for (const violation of constraintResults.violations) {
      recommendations.push(this._generateRecommendation(violation, schedule));
    }
    
    return recommendations;
  }

  /**
   * Evaluate all constraints against a schedule
   * @param {Object} schedule - Schedule to evaluate
   * @returns {Object} Comprehensive evaluation results
   */
  evaluateAllConstraints(schedule) {
    const constraints = this.generateConstraints();
    const results = {
      totalScore: 0,
      violations: [],
      satisfiedConstraints: [],
      partiallyMet: []
    };
    
    for (const constraint of constraints) {
      const evaluation = constraint.evaluation(schedule);
      
      if (!evaluation.satisfied) {
        results.violations.push({
          constraint: constraint.id,
          type: constraint.type,
          severity: constraint.violation || 'medium',
          details: evaluation.details
        });
      } else if (evaluation.score >= 0.8) {
        results.satisfiedConstraints.push(constraint.id);
      } else {
        results.partiallyMet.push({
          constraint: constraint.id,
          score: evaluation.score
        });
      }
      
      results.totalScore += evaluation.score * constraint.weight;
    }
    
    return results;
  }
}

module.exports = EnhancedFootballConstraints;