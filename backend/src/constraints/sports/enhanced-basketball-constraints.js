/**
 * Enhanced Basketball Constraint System for Big 12 Conference
 * 
 * Advanced optimization capabilities for:
 * - Intelligent Big Monday optimization with ranking and TV rating integration
 * - Advanced rematch separation with contextual adjustments
 * - Tournament preparation scheduling
 * - Venue sharing optimization for men's/women's programs
 * - Conference tournament seeding considerations
 */

const logger = require("../../lib/logger");;
const { ConstraintTypes } = require('../constraint-management-system');

/**
 * Enhanced Basketball Constraints with Advanced Optimization
 */
class EnhancedBasketballConstraints {
  constructor() {
    this.name = 'Enhanced Basketball Constraints';
    this.version = '3.0';
    this.sport = 'basketball';
    
    // Big Monday optimization parameters
    this.bigMondayOptimization = {
      optimalMatchups: {
        criteria: ['Top 25 vs Top 25', 'Conference Leaders', 'Rivalry Games'],
        rankingWeight: 0.4,
        tvRatingWeight: 0.3,
        competitiveBalanceWeight: 0.3
      },
      timeSlots: {
        primary: '21:00', // 9 PM ET
        secondary: '19:00', // 7 PM ET
        tertiary: '23:00'  // 11 PM ET
      },
      networkPreferences: {
        espn: { priority: 1, preferredSlot: '21:00' },
        fox: { priority: 2, preferredSlot: '19:00' }
      }
    };
    
    // Tournament preparation parameters
    this.tournamentPreparation = {
      conferenceChampionship: {
        dates: { start: 'March 10', end: 'March 14' },
        venue: 'Kansas City',
        preparationWeeks: 2
      },
      ncaaTournament: {
        selectionSunday: 'March 15',
        firstRound: 'March 19',
        optimalPreparation: '7_days'
      },
      bubbleTeamConsiderations: {
        strengthOfSchedule: 0.4,
        qualityWins: 0.3,
        avoidBadLosses: 0.3
      }
    };
    
    // Venue sharing optimization
    this.venueSharing = {
      facilities: {
        'Allen Fieldhouse': { capacity: 16300, sports: ['Men\'s Basketball'] },
        'Fertitta Center': { capacity: 7100, sports: ['Men\'s Basketball', 'Women\'s Basketball'] },
        'Moody Center': { capacity: 15000, sports: ['Men\'s Basketball', 'Women\'s Basketball'] },
        'Gallagher-Iba Arena': { capacity: 13611, sports: ['Men\'s Basketball', 'Women\'s Basketball'] }
      },
      sharingPriorities: {
        'Men\'s Basketball': 1,
        'Women\'s Basketball': 2,
        'Volleyball': 3,
        'Wrestling': 4
      },
      setupTimes: {
        'basketball_to_basketball': 2, // hours
        'basketball_to_volleyball': 4,
        'basketball_to_wrestling': 6
      }
    };
    
    // Rematch separation optimization
    this.rematchOptimization = {
      minimumSeparation: {
        games: 3,
        days: 10,
        preferredGames: 4,
        preferredDays: 15
      },
      contextualAdjustments: {
        conferenceLeaders: { additionalSeparation: 2 },
        rivalryRematches: { additionalSeparation: 1 },
        tournamentImplications: { reducedSeparation: -1 }
      }
    };
  }

  /**
   * Generate comprehensive basketball constraints for both men's and women's programs
   * @param {Object} parameters - Configuration parameters
   * @returns {Array} Enhanced constraint set
   */
  generateConstraints(parameters = {}) {
    const constraints = [];
    const gender = parameters.gender || 'mens'; // 'mens' or 'womens'
    
    // Core hard constraints
    constraints.push(...this._generateHardConstraints(parameters, gender));
    
    // Big Monday optimization constraints
    constraints.push(...this._generateBigMondayConstraints(parameters, gender));
    
    // Rematch separation constraints
    constraints.push(...this._generateRematchConstraints(parameters, gender));
    
    // Tournament preparation constraints
    constraints.push(...this._generateTournamentPreparationConstraints(parameters, gender));
    
    // Venue sharing constraints
    constraints.push(...this._generateVenueSharingConstraints(parameters, gender));
    
    // Conference tournament seeding constraints
    constraints.push(...this._generateSeedingOptimizationConstraints(parameters, gender));
    
    // Academic calendar integration
    constraints.push(...this._generateAcademicCalendarConstraints(parameters, gender));
    
    // TV rating optimization
    constraints.push(...this._generateTVRatingConstraints(parameters, gender));
    
    logger.info(`Generated ${constraints.length} enhanced ${gender} basketball constraints`, {
      sport: this.sport,
      gender,
      version: this.version
    });
    
    return constraints;
  }

  /**
   * Generate hard constraints that must be satisfied
   * @param {Object} parameters - Configuration parameters
   * @param {string} gender - 'mens' or 'womens'
   * @returns {Array} Hard constraints
   * @private
   */
  _generateHardConstraints(parameters, gender) {
    const gameCount = gender === 'mens' ? 18 : 20;
    const playTwiceCount = gender === 'mens' ? 3 : 5;
    const playOnceCount = gender === 'mens' ? 12 : 10;
    
    return [
      {
        id: `${gender}_basketball_conference_game_count`,
        type: 'CONFERENCE_GAME_COUNT',
        hardness: 'hard',
        category: 'scheduling',
        weight: 100,
        description: `Each team must play exactly ${gameCount} conference games`,
        parameters: {
          requiredGames: gameCount,
          conferenceOnly: true,
          gender
        },
        evaluation: (schedule, team) => this._evaluateConferenceGameCount(schedule, team, gameCount),
        violation: 'critical'
      },
      
      {
        id: `${gender}_basketball_play_distribution`,
        type: 'PLAY_DISTRIBUTION',
        hardness: 'hard',
        category: 'fairness',
        weight: 95,
        description: `Each team plays ${playTwiceCount} opponents twice and ${playOnceCount} opponents once`,
        parameters: {
          playTwiceCount,
          playOnceCount,
          totalOpponents: 15,
          gender
        },
        evaluation: (schedule, team) => this._evaluatePlayDistribution(schedule, team, playTwiceCount, playOnceCount),
        violation: 'critical'
      },
      
      {
        id: `${gender}_basketball_first_four_balance`,
        type: 'HOME_AWAY_BALANCE',
        hardness: 'hard',
        category: 'fairness',
        weight: 90,
        description: 'Among the first four games, at least two home and two away',
        parameters: {
          windowSize: 4,
          windowPosition: 'start',
          minHome: 2,
          minAway: 2,
          gender
        },
        evaluation: (schedule, team) => this._evaluateFirstFourBalance(schedule, team),
        violation: 'high'
      },
      
      {
        id: `${gender}_basketball_last_four_balance`,
        type: 'HOME_AWAY_BALANCE',
        hardness: 'hard',
        category: 'fairness',
        weight: 90,
        description: 'Among the last four games, at least two home and two away',
        parameters: {
          windowSize: 4,
          windowPosition: 'end',
          minHome: 2,
          minAway: 2,
          gender
        },
        evaluation: (schedule, team) => this._evaluateLastFourBalance(schedule, team),
        violation: 'high'
      },
      
      {
        id: `${gender}_basketball_max_consecutive_road`,
        type: 'CONSECUTIVE_ROAD_GAMES',
        hardness: 'hard',
        category: 'balance',
        weight: 95,
        description: 'No team plays more than two consecutive road games',
        parameters: {
          maxConsecutive: 2,
          scope: 'conference_only',
          gender
        },
        evaluation: (schedule, team) => this._evaluateConsecutiveRoadGames(schedule, team, 2),
        violation: 'high'
      },
      
      {
        id: `${gender}_basketball_avoid_compressed_schedule`,
        type: 'COMPRESSED_SCHEDULE',
        hardness: 'hard',
        category: 'player_welfare',
        weight: 85,
        description: 'No Saturday-Monday-Wednesday scheduling',
        parameters: {
          forbiddenPattern: ['Saturday', 'Monday', 'Wednesday'],
          scope: 'conference_only',
          gender
        },
        evaluation: (schedule, team) => this._evaluateCompressedSchedule(schedule, team),
        violation: 'high'
      },
      
      {
        id: `${gender}_single_game_alternating_venue`,
        type: 'SINGLE_GAME_ALTERNATING_VENUE',
        hardness: 'hard',
        category: 'fairness',
        weight: 85,
        description: 'Single-game trips must alternate venues between consecutive seasons',
        parameters: {
          requireAlternating: true,
          lookbackSeasons: 1,
          scope: 'conference_only',
          gender
        },
        evaluation: (schedule, previousSeasonSchedule) => this._evaluateSingleGameAlternatingVenue(schedule, previousSeasonSchedule, gender),
        violation: 'high'
      }
    ];
  }

  /**
   * Generate Big Monday optimization constraints
   * @param {Object} parameters - Configuration parameters
   * @param {string} gender - 'mens' or 'womens'
   * @returns {Array} Big Monday constraints
   * @private
   */
  _generateBigMondayConstraints(parameters, gender) {
    return [
      {
        id: `${gender}_big_monday_prerequisite`,
        type: 'BIG_MONDAY_PREREQUISITE',
        hardness: 'hard',
        category: 'scheduling',
        weight: 85,
        description: 'Road Big Monday game preceded by home game on Saturday',
        parameters: {
          precedingDay: 'Saturday',
          precedingVenue: 'home',
          exceptions: ['nearby_opponents'],
          gender
        },
        evaluation: (schedule) => this._evaluateBigMondayPrerequisite(schedule, gender),
        violation: 'high'
      },
      
      {
        id: `${gender}_big_monday_matchup_optimization`,
        type: 'TV_BROADCAST_PREFERRED',
        hardness: 'soft',
        category: 'media',
        weight: 80,
        description: 'Optimize Big Monday matchups for maximum TV value',
        parameters: {
          criteria: this.bigMondayOptimization.optimalMatchups.criteria,
          rankingWeight: this.bigMondayOptimization.optimalMatchups.rankingWeight,
          tvRatingWeight: this.bigMondayOptimization.optimalMatchups.tvRatingWeight,
          competitiveBalanceWeight: this.bigMondayOptimization.optimalMatchups.competitiveBalanceWeight,
          gender
        },
        evaluation: (schedule) => this._evaluateBigMondayMatchups(schedule, gender),
        optimization: 'maximize_tv_value'
      },
      
      {
        id: `${gender}_big_monday_distribution`,
        type: 'BIG_MONDAY_DISTRIBUTION',
        hardness: 'soft',
        category: 'fairness',
        weight: 70,
        description: 'Distribute Big Monday appearances fairly across teams',
        parameters: {
          targetAppearances: 2, // per team per season
          maxVariance: 1,
          considerStrength: true,
          gender
        },
        evaluation: (schedule) => this._evaluateBigMondayDistribution(schedule, gender),
        optimization: 'fair_distribution'
      },
      
      {
        id: `${gender}_big_monday_home_preceded_by_road`,
        type: 'BIG_MONDAY_HOME',
        hardness: 'soft',
        category: 'balance',
        weight: 60,
        description: 'Big Monday home game preceded by road game when possible',
        parameters: {
          precedingDay: 'Saturday',
          precedingVenue: 'away',
          weight: 0.3,
          gender
        },
        evaluation: (schedule) => this._evaluateBigMondayHomePreference(schedule, gender),
        optimization: 'optimize_balance'
      }
    ];
  }

  /**
   * Generate rematch separation constraints
   * @param {Object} parameters - Configuration parameters
   * @param {string} gender - 'mens' or 'womens'
   * @returns {Array} Rematch constraints
   * @private
   */
  _generateRematchConstraints(parameters, gender) {
    return [
      {
        id: `${gender}_rematch_separation`,
        type: 'REMATCH_SEPARATION',
        hardness: 'hard',
        category: 'fairness',
        weight: 90,
        description: 'At least three games and/or 10 days between rematches',
        parameters: {
          minGames: this.rematchOptimization.minimumSeparation.games,
          minDays: this.rematchOptimization.minimumSeparation.days,
          preferredGames: this.rematchOptimization.minimumSeparation.preferredGames,
          preferredDays: this.rematchOptimization.minimumSeparation.preferredDays,
          gender
        },
        evaluation: (schedule) => this._evaluateRematchSeparation(schedule, gender),
        violation: 'high'
      },
      
      {
        id: `${gender}_contextual_rematch_adjustment`,
        type: 'CONTEXTUAL_REMATCH',
        hardness: 'soft',
        category: 'competitive',
        weight: 75,
        description: 'Adjust rematch separation based on team standings and implications',
        parameters: {
          contextualAdjustments: this.rematchOptimization.contextualAdjustments,
          considerStandings: true,
          considerTournamentImplications: true,
          gender
        },
        evaluation: (schedule) => this._evaluateContextualRematch(schedule, gender),
        optimization: 'adaptive_separation'
      },
      
      {
        id: `${gender}_rivalry_rematch_optimization`,
        type: 'RIVALRY_REMATCH',
        hardness: 'soft',
        category: 'tradition',
        weight: 70,
        description: 'Optimize timing of rivalry game rematches',
        parameters: {
          rivalryGames: parameters.rivalryGames || [],
          preferLateSeason: true,
          maximizeDrama: true,
          gender
        },
        evaluation: (schedule) => this._evaluateRivalryRematches(schedule, gender),
        optimization: 'maximize_drama'
      }
    ];
  }

  /**
   * Generate tournament preparation constraints
   * @param {Object} parameters - Configuration parameters
   * @param {string} gender - 'mens' or 'womens'
   * @returns {Array} Tournament constraints
   * @private
   */
  _generateTournamentPreparationConstraints(parameters, gender) {
    return [
      {
        id: `${gender}_conference_tournament_preparation`,
        type: 'TOURNAMENT_PREPARATION',
        hardness: 'soft',
        category: 'competitive',
        weight: 75,
        description: 'Optimize schedule for conference tournament preparation',
        parameters: {
          tournamentStart: this.tournamentPreparation.conferenceChampionship.dates.start,
          preparationWeeks: this.tournamentPreparation.conferenceChampionship.preparationWeeks,
          optimalRest: '2_days',
          gender
        },
        evaluation: (schedule) => this._evaluateConferenceTournamentPrep(schedule, gender),
        optimization: 'optimize_tournament_readiness'
      },
      
      {
        id: `${gender}_ncaa_tournament_positioning`,
        type: 'NCAA_TOURNAMENT_POSITIONING',
        hardness: 'soft',
        category: 'competitive',
        weight: 70,
        description: 'Schedule strength and quality wins for NCAA tournament positioning',
        parameters: {
          selectionSunday: this.tournamentPreparation.ncaaTournament.selectionSunday,
          bubbleConsiderations: this.tournamentPreparation.bubbleTeamConsiderations,
          strengthOfSchedule: true,
          gender
        },
        evaluation: (schedule) => this._evaluateNCAAPositioning(schedule, gender),
        optimization: 'maximize_tournament_chances'
      },
      
      {
        id: `${gender}_late_season_strength`,
        type: 'LATE_SEASON_STRENGTH',
        hardness: 'soft',
        category: 'competitive',
        weight: 65,
        description: 'Front-load difficult games while maintaining late-season quality',
        parameters: {
          lateSeasonWeeks: 4,
          qualityOpponentRatio: 0.4,
          avoidExhaustion: true,
          gender
        },
        evaluation: (schedule) => this._evaluateLateSeasonStrength(schedule, gender),
        optimization: 'balance_schedule_strength'
      }
    ];
  }

  /**
   * Generate venue sharing optimization constraints
   * @param {Object} parameters - Configuration parameters
   * @param {string} gender - 'mens' or 'womens'
   * @returns {Array} Venue constraints
   * @private
   */
  _generateVenueSharingConstraints(parameters, gender) {
    return [
      {
        id: `${gender}_venue_availability`,
        type: 'VENUE_AVAILABILITY',
        hardness: 'hard',
        category: 'facilities',
        weight: 95,
        description: 'Ensure venue availability with proper setup times',
        parameters: {
          facilities: this.venueSharing.facilities,
          setupTimes: this.venueSharing.setupTimes,
          bufferTime: '2_hours',
          gender
        },
        evaluation: (schedule) => this._evaluateVenueAvailability(schedule, gender),
        violation: 'critical'
      },
      
      {
        id: `${gender}_cross_gender_coordination`,
        type: 'CROSS_GENDER_COORDINATION',
        hardness: 'soft',
        category: 'facilities',
        weight: 75,
        description: 'Coordinate men\'s and women\'s basketball schedules for optimal venue usage',
        parameters: {
          sharingPriorities: this.venueSharing.sharingPriorities,
          preferBackToBack: true,
          minimizeConflicts: true,
          doubleHeaderOpportunities: true
        },
        evaluation: (schedule, otherGenderSchedule) => this._evaluateCrossGenderCoordination(schedule, otherGenderSchedule, gender),
        optimization: 'optimize_venue_sharing'
      },
      
      {
        id: `${gender}_facility_capacity_matching`,
        type: 'FACILITY_CAPACITY',
        hardness: 'soft',
        category: 'attendance',
        weight: 60,
        description: 'Match high-demand games with appropriate facility capacity',
        parameters: {
          capacityThresholds: {
            premium: 15000,
            standard: 10000,
            minimum: 5000
          },
          demandCriteria: ['Rankings', 'Rivalry', 'Tournament Implications'],
          gender
        },
        evaluation: (schedule) => this._evaluateFacilityCapacityMatch(schedule, gender),
        optimization: 'maximize_attendance'
      },
      
      {
        id: `${gender}_multi_sport_facility_coordination`,
        type: 'MULTI_SPORT_COORDINATION',
        hardness: 'soft',
        category: 'facilities',
        weight: 65,
        description: 'Coordinate with other sports using shared facilities',
        parameters: {
          otherSports: ['Volleyball', 'Wrestling', 'Gymnastics'],
          prioritySystem: this.venueSharing.sharingPriorities,
          setupRequirements: this.venueSharing.setupTimes,
          gender
        },
        evaluation: (schedule) => this._evaluateMultiSportCoordination(schedule, gender),
        optimization: 'minimize_facility_conflicts'
      }
    ];
  }

  /**
   * Generate conference tournament seeding optimization constraints
   * @param {Object} parameters - Configuration parameters
   * @param {string} gender - 'mens' or 'womens'
   * @returns {Array} Seeding constraints
   * @private
   */
  _generateSeedingOptimizationConstraints(parameters, gender) {
    return [
      {
        id: `${gender}_seeding_fairness`,
        type: 'SEEDING_FAIRNESS',
        hardness: 'soft',
        category: 'competitive',
        weight: 70,
        description: 'Ensure fair seeding opportunities through balanced scheduling',
        parameters: {
          strengthOfScheduleBalance: 0.3,
          homeAwayBalance: 0.3,
          opponentQualityBalance: 0.4,
          gender
        },
        evaluation: (schedule) => this._evaluateSeedingFairness(schedule, gender),
        optimization: 'balance_seeding_opportunities'
      },
      
      {
        id: `${gender}_division_representation`,
        type: 'DIVISION_REPRESENTATION',
        hardness: 'soft',
        category: 'competitive',
        weight: 65,
        description: 'Ensure balanced representation from all conference divisions',
        parameters: {
          divisions: parameters.divisions || [],
          balanceRepresentation: true,
          avoidDivisionBias: true,
          gender
        },
        evaluation: (schedule) => this._evaluateDivisionRepresentation(schedule, gender),
        optimization: 'balance_division_strength'
      },
      
      {
        id: `${gender}_tournament_momentum`,
        type: 'TOURNAMENT_MOMENTUM',
        hardness: 'soft',
        category: 'competitive',
        weight: 60,
        description: 'Build tournament momentum through strategic late-season scheduling',
        parameters: {
          momentumWeeks: 3,
          winStreakValue: 0.4,
          qualityWinValue: 0.6,
          gender
        },
        evaluation: (schedule) => this._evaluateTournamentMomentum(schedule, gender),
        optimization: 'build_tournament_momentum'
      }
    ];
  }

  /**
   * Generate academic calendar integration constraints
   * @param {Object} parameters - Configuration parameters
   * @param {string} gender - 'mens' or 'womens'
   * @returns {Array} Academic constraints
   * @private
   */
  _generateAcademicCalendarConstraints(parameters, gender) {
    return [
      {
        id: `${gender}_finals_week_avoidance`,
        type: 'FINALS_WEEK_AVOIDANCE',
        hardness: 'hard',
        category: 'academic',
        weight: 90,
        description: 'Avoid scheduling games during finals weeks',
        parameters: {
          finalsWeeks: parameters.finalsWeeks || [],
          bufferDays: 2,
          allowChampionshipException: true,
          gender
        },
        evaluation: (schedule) => this._evaluateFinalsWeekAvoidance(schedule, gender),
        violation: 'high'
      },
      
      {
        id: `${gender}_spring_break_coordination`,
        type: 'SPRING_BREAK_COORDINATION',
        hardness: 'soft',
        category: 'academic',
        weight: 60,
        description: 'Coordinate scheduling around varying spring break dates',
        parameters: {
          springBreakWeeks: parameters.springBreakWeeks || [],
          allowTournamentOverride: true,
          minimizeImpact: true,
          gender
        },
        evaluation: (schedule) => this._evaluateSpringBreakCoordination(schedule, gender),
        optimization: 'minimize_academic_disruption'
      },
      
      {
        id: `${gender}_class_schedule_optimization`,
        type: 'CLASS_SCHEDULE_OPTIMIZATION',
        hardness: 'soft',
        category: 'academic',
        weight: 55,
        description: 'Optimize around typical class schedules',
        parameters: {
          avoidClassTimes: ['10:00-12:00', '14:00-16:00'],
          preferEveningGames: true,
          weekendPreference: 0.8,
          gender
        },
        evaluation: (schedule) => this._evaluateClassScheduleOptimization(schedule, gender),
        optimization: 'minimize_class_conflicts'
      }
    ];
  }

  /**
   * Generate TV rating optimization constraints
   * @param {Object} parameters - Configuration parameters
   * @param {string} gender - 'mens' or 'womens'
   * @returns {Array} TV rating constraints
   * @private
   */
  _generateTVRatingConstraints(parameters, gender) {
    return [
      {
        id: `${gender}_prime_time_optimization`,
        type: 'PRIME_TIME_OPTIMIZATION',
        hardness: 'soft',
        category: 'media',
        weight: 70,
        description: 'Optimize prime time slot usage for maximum viewership',
        parameters: {
          primeTimeSlots: ['19:00', '21:00'],
          matchupCriteria: ['Top 25', 'Rivalry', 'Conference Leaders'],
          networkPreferences: this.bigMondayOptimization.networkPreferences,
          gender
        },
        evaluation: (schedule) => this._evaluatePrimeTimeOptimization(schedule, gender),
        optimization: 'maximize_viewership'
      },
      
      {
        id: `${gender}_weekend_viewership`,
        type: 'WEEKEND_VIEWERSHIP',
        hardness: 'soft',
        category: 'media',
        weight: 65,
        description: 'Optimize weekend game scheduling for viewership',
        parameters: {
          weekendSlots: ['Saturday_afternoon', 'Sunday_afternoon'],
          avoidNFLConflicts: true,
          considerRegionalPreferences: true,
          gender
        },
        evaluation: (schedule) => this._evaluateWeekendViewership(schedule, gender),
        optimization: 'maximize_weekend_audience'
      },
      
      {
        id: `${gender}_streaming_optimization`,
        type: 'STREAMING_OPTIMIZATION',
        hardness: 'preference',
        category: 'media',
        weight: 40,
        description: 'Optimize for streaming platforms and digital audience',
        parameters: {
          streamingPlatforms: ['ESPN+', 'Fox Sports App'],
          digitalAudienceMetrics: true,
          socialMediaIntegration: true,
          gender
        },
        evaluation: (schedule) => this._evaluateStreamingOptimization(schedule, gender),
        optimization: 'maximize_digital_engagement'
      }
    ];
  }

  // Evaluation methods for basketball-specific constraints

  _evaluateConferenceGameCount(schedule, team, requiredGames) {
    const conferenceGames = schedule.filter(game => 
      (game.homeTeam === team || game.awayTeam === team) && game.isConference
    );
    
    return {
      satisfied: conferenceGames.length === requiredGames,
      score: conferenceGames.length === requiredGames ? 1.0 : 0.0,
      details: { actual: conferenceGames.length, required: requiredGames }
    };
  }

  _evaluatePlayDistribution(schedule, team, playTwiceCount, playOnceCount) {
    const opponents = new Map();
    
    schedule.filter(game => 
      (game.homeTeam === team || game.awayTeam === team) && game.isConference
    ).forEach(game => {
      const opponent = game.homeTeam === team ? game.awayTeam : game.homeTeam;
      opponents.set(opponent, (opponents.get(opponent) || 0) + 1);
    });
    
    const playTwice = Array.from(opponents.values()).filter(count => count === 2).length;
    const playOnce = Array.from(opponents.values()).filter(count => count === 1).length;
    
    return {
      satisfied: playTwice === playTwiceCount && playOnce === playOnceCount,
      score: (playTwice === playTwiceCount ? 0.5 : 0) + (playOnce === playOnceCount ? 0.5 : 0),
      details: { 
        playTwice: { actual: playTwice, required: playTwiceCount },
        playOnce: { actual: playOnce, required: playOnceCount }
      }
    };
  }

  _evaluateFirstFourBalance(schedule, team) {
    const teamGames = schedule.filter(game => 
      (game.homeTeam === team || game.awayTeam === team) && game.isConference
    ).slice(0, 4);
    
    const homeGames = teamGames.filter(game => game.homeTeam === team).length;
    const awayGames = teamGames.filter(game => game.awayTeam === team).length;
    
    return {
      satisfied: homeGames >= 2 && awayGames >= 2,
      score: (homeGames >= 2 && awayGames >= 2) ? 1.0 : 0.5,
      details: { homeGames, awayGames, required: '2 each' }
    };
  }

  _evaluateLastFourBalance(schedule, team) {
    const teamGames = schedule.filter(game => 
      (game.homeTeam === team || game.awayTeam === team) && game.isConference
    ).slice(-4);
    
    const homeGames = teamGames.filter(game => game.homeTeam === team).length;
    const awayGames = teamGames.filter(game => game.awayTeam === team).length;
    
    return {
      satisfied: homeGames >= 2 && awayGames >= 2,
      score: (homeGames >= 2 && awayGames >= 2) ? 1.0 : 0.5,
      details: { homeGames, awayGames, required: '2 each' }
    };
  }

  _evaluateConsecutiveRoadGames(schedule, team, maxConsecutive) {
    const teamGames = schedule.filter(game => 
      (game.homeTeam === team || game.awayTeam === team) && game.isConference
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
      satisfied: maxConsecutiveRoad <= maxConsecutive,
      score: maxConsecutiveRoad <= maxConsecutive ? 1.0 : Math.max(0, 1.0 - (maxConsecutiveRoad - maxConsecutive) * 0.3),
      details: { maxConsecutiveRoad, limit: maxConsecutive }
    };
  }

  _evaluateCompressedSchedule(schedule, team) {
    const teamGames = schedule.filter(game => 
      (game.homeTeam === team || game.awayTeam === team) && game.isConference
    );
    
    let violations = 0;
    for (let i = 0; i < teamGames.length - 2; i++) {
      const game1 = new Date(teamGames[i].date);
      const game2 = new Date(teamGames[i + 1].date);
      const game3 = new Date(teamGames[i + 2].date);
      
      // Check for Saturday-Monday-Wednesday pattern
      if (game1.getDay() === 6 && game2.getDay() === 1 && game3.getDay() === 3) {
        const days1to2 = (game2 - game1) / (24 * 60 * 60 * 1000);
        const days2to3 = (game3 - game2) / (24 * 60 * 60 * 1000);
        
        if (days1to2 <= 2 && days2to3 <= 2) {
          violations++;
        }
      }
    }
    
    return {
      satisfied: violations === 0,
      score: violations === 0 ? 1.0 : Math.max(0, 1.0 - violations * 0.5),
      details: { violations, pattern: 'Saturday-Monday-Wednesday' }
    };
  }

  _evaluateBigMondayPrerequisite(schedule, gender) {
    const mondayGames = schedule.filter(game => 
      new Date(game.date).getDay() === 1 && game.isBigMonday
    );
    
    let violations = 0;
    
    for (const mondayGame of mondayGames) {
      const awayTeam = mondayGame.awayTeam;
      
      // Find the Saturday game before this Monday game
      const saturdayBefore = schedule.filter(game => {
        const gameDate = new Date(game.date);
        const mondayDate = new Date(mondayGame.date);
        return gameDate.getDay() === 6 && 
               gameDate < mondayDate && 
               (mondayDate - gameDate) <= (3 * 24 * 60 * 60 * 1000) &&
               (game.homeTeam === awayTeam || game.awayTeam === awayTeam);
      })[0];
      
      if (!saturdayBefore || saturdayBefore.awayTeam === awayTeam) {
        violations++;
      }
    }
    
    return {
      satisfied: violations === 0,
      score: violations === 0 ? 1.0 : Math.max(0, 1.0 - violations * 0.3),
      details: { violations, rule: 'road_big_monday_preceded_by_home_saturday' }
    };
  }

  _evaluateRematchSeparation(schedule, gender) {
    const rematches = this._findRematches(schedule);
    let violations = 0;
    
    for (const rematch of rematches) {
      const game1Date = new Date(rematch.firstGame.date);
      const game2Date = new Date(rematch.secondGame.date);
      const daysBetween = (game2Date - game1Date) / (24 * 60 * 60 * 1000);
      const gamesBetween = this._countGamesBetween(schedule, rematch.firstGame, rematch.secondGame, rematch.teams);
      
      if (daysBetween < this.rematchOptimization.minimumSeparation.days || 
          gamesBetween < this.rematchOptimization.minimumSeparation.games) {
        violations++;
      }
    }
    
    return {
      satisfied: violations === 0,
      score: violations === 0 ? 1.0 : Math.max(0, 1.0 - violations * 0.2),
      details: { 
        violations, 
        rematches: rematches.length,
        minimumSeparation: this.rematchOptimization.minimumSeparation
      }
    };
  }

  // Helper methods

  _findRematches(schedule) {
    const matchups = new Map();
    const rematches = [];
    
    schedule.filter(game => game.isConference).forEach(game => {
      const key = [game.homeTeam, game.awayTeam].sort().join('-');
      
      if (matchups.has(key)) {
        rematches.push({
          teams: [game.homeTeam, game.awayTeam],
          firstGame: matchups.get(key),
          secondGame: game
        });
      } else {
        matchups.set(key, game);
      }
    });
    
    return rematches;
  }

  _countGamesBetween(schedule, game1, game2, teams) {
    const game1Date = new Date(game1.date);
    const game2Date = new Date(game2.date);
    
    return schedule.filter(game => {
      const gameDate = new Date(game.date);
      return gameDate > game1Date && 
             gameDate < game2Date && 
             (teams.includes(game.homeTeam) || teams.includes(game.awayTeam));
    }).length;
  }

  _evaluateSingleGameAlternatingVenue(schedule, previousSeasonSchedule, gender) {
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
              gender,
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
        gender,
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

  /**
   * Get optimization recommendations specific to basketball
   * @param {Object} schedule - Current schedule
   * @param {string} gender - 'mens' or 'womens'
   * @returns {Array} Basketball-specific recommendations
   */
  getOptimizationRecommendations(schedule, gender = 'mens') {
    const recommendations = [];
    const constraints = this.generateConstraints({ gender });
    
    // Evaluate all constraints
    for (const constraint of constraints) {
      const evaluation = constraint.evaluation(schedule);
      
      if (!evaluation.satisfied) {
        recommendations.push({
          constraint: constraint.id,
          type: constraint.type,
          priority: constraint.weight,
          recommendation: this._generateBasketballRecommendation(constraint, evaluation, gender)
        });
      }
    }
    
    return recommendations;
  }

  _generateBasketballRecommendation(constraint, evaluation, gender) {
    switch (constraint.type) {
      case 'BIG_MONDAY_PREREQUISITE':
        return 'Schedule home games on Saturday before road Big Monday games';
      
      case 'REMATCH_SEPARATION':
        return `Increase separation between rematches to at least ${this.rematchOptimization.minimumSeparation.games} games or ${this.rematchOptimization.minimumSeparation.days} days`;
      
      case 'VENUE_AVAILABILITY':
        return 'Resolve venue conflicts by adjusting game times or finding alternative venues';
      
      case 'CONSECUTIVE_ROAD_GAMES':
        return 'Reduce consecutive road games to maximum of 2 per team';
      
      default:
        return `Address ${constraint.description.toLowerCase()}`;
    }
  }
}

module.exports = EnhancedBasketballConstraints;