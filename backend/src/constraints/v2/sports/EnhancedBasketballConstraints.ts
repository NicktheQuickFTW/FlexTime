// Enhanced Basketball Constraints with Big Monday optimization and smart rematch separation
// Version 2.0 - ML-enhanced with performance optimizations

import {
  UnifiedConstraint,
  ConstraintType,
  ConstraintHardness,
  ConstraintResult,
  ConstraintStatus,
  Schedule,
  Game,
  Team,
  ConstraintParameters,
  ConstraintViolation,
  ConstraintSuggestion
} from '../types';

// ML-enhanced basketball utilities
class BasketballMLUtilities {
  // Predict optimal game timing based on historical attendance and viewership
  static predictOptimalGameTime(
    homeTeam: string,
    awayTeam: string,
    dayOfWeek: number,
    isConferenceGame: boolean
  ): { time: string; expectedAttendance: number; tvRating: number } {
    // Simulated ML model - in production would use trained model
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isRivalry = this.isRivalryGame(homeTeam, awayTeam);
    
    let baseAttendance = 0.75;
    let baseTvRating = 0.6;
    
    // Adjust for factors
    if (isWeekend) {
      baseAttendance += 0.15;
      baseTvRating += 0.1;
    }
    if (isRivalry) {
      baseAttendance += 0.2;
      baseTvRating += 0.3;
    }
    if (isConferenceGame) {
      baseAttendance += 0.1;
      baseTvRating += 0.15;
    }
    
    // Determine optimal time based on day
    let optimalTime = '19:00'; // Default 7 PM
    if (dayOfWeek === 6) { // Saturday
      optimalTime = isRivalry ? '20:00' : '14:00';
    } else if (dayOfWeek === 1) { // Monday (Big Monday)
      optimalTime = '20:00'; // Prime time for ESPN
      baseTvRating += 0.2; // Big Monday boost
    }
    
    return {
      time: optimalTime,
      expectedAttendance: Math.min(baseAttendance, 0.95),
      tvRating: Math.min(baseTvRating, 0.9)
    };
  }

  static isRivalryGame(team1: string, team2: string): boolean {
    const rivalries = [
      ['Kansas', 'Kansas State'], // Sunflower Showdown
      ['Cincinnati', 'West Virginia'], // River City Rivalry  
      ['Colorado', 'Utah'], // Regional rivalry
      ['Arizona', 'Arizona State'], // State rivalry
      ['TCU', 'Baylor'], // Texas rivalry
      ['Houston', 'Cincinnati'], // AAC carryover
    ];
    
    return rivalries.some(rivalry => 
      (rivalry.includes(team1) && rivalry.includes(team2))
    );
  }

  static calculateRematchSeparation(game1: Game, game2: Game): number {
    return Math.abs(game2.date.getTime() - game1.date.getTime()) / (1000 * 60 * 60 * 24);
  }

  static analyzeBackToBackPattern(games: Game[]): { 
    hasIssues: boolean; 
    problematicStretch?: { start: number; end: number; issue: string } 
  } {
    for (let i = 0; i < games.length - 2; i++) {
      const stretch = games.slice(i, i + 3);
      const daySpan = (stretch[2].date.getTime() - stretch[0].date.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daySpan <= 5) { // 3 games in 5 days
        return {
          hasIssues: true,
          problematicStretch: {
            start: i,
            end: i + 2,
            issue: '3 games in 5 days'
          }
        };
      }
    }
    return { hasIssues: false };
  }
}

// Enhanced Men's Basketball Constraints
export const enhancedMensBasketballConstraints: UnifiedConstraint[] = [
  {
    id: 'bb-big-monday-optimization',
    name: 'Big Monday Premium Game Selection',
    type: ConstraintType.PERFORMANCE,
    hardness: ConstraintHardness.SOFT,
    weight: 85,
    scope: {
      sports: ['Men\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      bigMondaySlots: 6, // ESPN typically wants 6-8 Big Monday games per season
      preferredMatchups: ['ranked', 'rivalry', 'championship-implications'],
      timeSlot: '20:00', // 8 PM CT for ESPN
      minimumSeparation: 14 // Days between Big Monday appearances for same team
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      const startTime = Date.now();
      let score = 1.0;
      const suggestions: ConstraintSuggestion[] = [];
      
      // Find all Monday games
      const mondayGames = schedule.games.filter(g => 
        g.sport === 'Men\'s Basketball' &&
        g.date.getDay() === 1 &&
        g.type === 'conference'
      );
      
      // Analyze Big Monday slot optimization
      const bigMondayGames = mondayGames.filter(g => g.time === params.timeSlot);
      
      if (bigMondayGames.length < params.bigMondaySlots) {
        score *= 0.8;
        suggestions.push({
          type: 'insufficient_big_monday_games',
          priority: 'high',
          description: `Only ${bigMondayGames.length} Big Monday games scheduled (target: ${params.bigMondaySlots})`,
          implementation: 'Identify marquee matchups and move to Monday 8 PM slots',
          expectedImprovement: 20
        });
      }
      
      // Check for marquee matchup optimization
      const marqueeMatchups: Game[] = [];
      for (const game of schedule.games.filter(g => 
        g.sport === 'Men\'s Basketball' && g.type === 'conference'
      )) {
        const homeTeam = schedule.teams.find(t => t.id === game.homeTeamId);
        const awayTeam = schedule.teams.find(t => t.id === game.awayTeamId);
        
        if (homeTeam && awayTeam) {
          const isMarquee = BasketballMLUtilities.isRivalryGame(
            homeTeam.name, 
            awayTeam.name
          );
          
          if (isMarquee) {
            marqueeMatchups.push(game);
            // Check if marquee game is on Big Monday
            if (game.date.getDay() !== 1 || game.time !== params.timeSlot) {
              score *= 0.9;
              suggestions.push({
                type: 'marquee_not_on_big_monday',
                priority: 'medium',
                description: `Marquee matchup ${homeTeam.name} vs ${awayTeam.name} not on Big Monday`,
                implementation: 'Move to next available Monday 8 PM slot',
                expectedImprovement: 15
              });
            }
          }
        }
      }
      
      // Check team separation on Big Monday
      const teamBigMondayAppearances = new Map<string, Date[]>();
      for (const game of bigMondayGames) {
        if (!teamBigMondayAppearances.has(game.homeTeamId)) {
          teamBigMondayAppearances.set(game.homeTeamId, []);
        }
        if (!teamBigMondayAppearances.has(game.awayTeamId)) {
          teamBigMondayAppearances.set(game.awayTeamId, []);
        }
        teamBigMondayAppearances.get(game.homeTeamId)!.push(game.date);
        teamBigMondayAppearances.get(game.awayTeamId)!.push(game.date);
      }
      
      for (const [teamId, dates] of teamBigMondayAppearances.entries()) {
        if (dates.length > 1) {
          dates.sort((a, b) => a.getTime() - b.getTime());
          for (let i = 1; i < dates.length; i++) {
            const daysBetween = (dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24);
            if (daysBetween < params.minimumSeparation) {
              score *= 0.85;
              const team = schedule.teams.find(t => t.id === teamId);
              suggestions.push({
                type: 'insufficient_big_monday_separation',
                priority: 'medium',
                description: `${team?.name} has Big Monday games only ${Math.round(daysBetween)} days apart`,
                implementation: 'Spread Big Monday appearances throughout the season',
                expectedImprovement: 10
              });
            }
          }
        }
      }
      
      const executionTime = Date.now() - startTime;
      
      return {
        constraintId: 'bb-big-monday-optimization',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `Big Monday optimization score: ${(score * 100).toFixed(1)}%`,
        suggestions,
        executionTime,
        confidence: 0.88,
        details: {
          totalMondayGames: mondayGames.length,
          bigMondayGames: bigMondayGames.length,
          marqueeMatchups: marqueeMatchups.length,
          teamAppearances: Object.fromEntries(teamBigMondayAppearances)
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Optimizes Big Monday game selection for maximum TV viewership',
      tags: ['basketball', 'media', 'big-monday', 'optimization']
    },
    cacheable: true,
    parallelizable: true,
    priority: 85
  },

  {
    id: 'bb-smart-rematch-separation',
    name: 'Intelligent Conference Rematch Separation',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.HARD,
    weight: 90,
    scope: {
      sports: ['Men\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      minimumSeparationDays: 21, // 3 weeks minimum
      idealSeparationDays: 35, // 5 weeks ideal
      rivalryMinimumDays: 28, // 4 weeks for rivalries
      maxEarlySeason: 45 // Days from season start considered "early"
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      const violations: ConstraintViolation[] = [];
      let score = 1.0;
      
      // Group games by matchup
      const matchups = new Map<string, Game[]>();
      
      for (const game of schedule.games.filter(g => 
        g.sport === 'Men\'s Basketball' &&
        g.type === 'conference'
      )) {
        const matchupKey = [game.homeTeamId, game.awayTeamId].sort().join('-');
        if (!matchups.has(matchupKey)) {
          matchups.set(matchupKey, []);
        }
        matchups.get(matchupKey)!.push(game);
      }
      
      // Check rematch separation
      for (const [matchupKey, games] of matchups.entries()) {
        if (games.length !== 2) continue; // Should be exactly 2 for home-and-home
        
        games.sort((a, b) => a.date.getTime() - b.date.getTime());
        const separationDays = BasketballMLUtilities.calculateRematchSeparation(games[0], games[1]);
        
        const [team1Id, team2Id] = matchupKey.split('-');
        const team1 = schedule.teams.find(t => t.id === team1Id);
        const team2 = schedule.teams.find(t => t.id === team2Id);
        
        const isRivalry = team1 && team2 && 
          BasketballMLUtilities.isRivalryGame(team1.name, team2.name);
        
        const minDays = isRivalry ? params.rivalryMinimumDays : params.minimumSeparationDays;
        
        if (separationDays < minDays) {
          violations.push({
            type: 'insufficient_rematch_separation',
            severity: 'critical',
            affectedEntities: games.map(g => g.id),
            description: `${team1?.name} vs ${team2?.name} rematch only ${Math.round(separationDays)} days apart`,
            possibleResolutions: [
              'Move second game later in season',
              'Move first game earlier in season'
            ]
          });
          score = 0; // Hard constraint violation
        } else if (separationDays < params.idealSeparationDays) {
          score *= 0.95;
        }
        
        // Check for both games being too early in season
        const seasonStart = new Date(Math.min(...schedule.games.map(g => g.date.getTime())));
        const firstGameDaysFromStart = (games[0].date.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24);
        const secondGameDaysFromStart = (games[1].date.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24);
        
        if (secondGameDaysFromStart < params.maxEarlySeason) {
          score *= 0.9;
          violations.push({
            type: 'early_season_rematch',
            severity: 'minor',
            affectedEntities: games.map(g => g.id),
            description: `Both ${team1?.name} vs ${team2?.name} games in first ${params.maxEarlySeason} days`,
            possibleResolutions: ['Move rematch to mid or late season']
          });
        }
      }
      
      return {
        constraintId: 'bb-smart-rematch-separation',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : 
          score === 0 ? ConstraintStatus.VIOLATED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0,
        score,
        message: violations.length === 0 
          ? 'All rematches properly separated'
          : `Found ${violations.length} rematch separation issues`,
        violations,
        confidence: 0.95
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Ensures proper separation between conference rematches',
      tags: ['basketball', 'rematch', 'separation', 'fairness']
    },
    cacheable: true,
    priority: 90
  },

  {
    id: 'bb-rest-and-travel-optimization',
    name: 'Rest Days and Travel Load Balancing',
    type: ConstraintType.PERFORMANCE,
    hardness: ConstraintHardness.SOFT,
    weight: 80,
    scope: {
      sports: ['Men\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      minimumRestDays: 1, // At least 1 day between games
      idealRestDays: 2, // 2-3 days ideal
      maxConsecutiveRoadGames: 2,
      maxGamesPerWeek: 3,
      penaltyFor3GamesIn5Days: 0.2
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      for (const team of schedule.teams.filter(t => t.conference === 'Big 12')) {
        const teamGames = schedule.games
          .filter(g => 
            g.sport === 'Men\'s Basketball' &&
            (g.homeTeamId === team.id || g.awayTeamId === team.id))
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        // Check rest days between games
        for (let i = 1; i < teamGames.length; i++) {
          const daysBetween = Math.floor(
            (teamGames[i].date.getTime() - teamGames[i-1].date.getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          
          if (daysBetween < params.minimumRestDays) {
            violations.push({
              type: 'insufficient_rest',
              severity: 'critical',
              affectedEntities: [team.id, teamGames[i-1].id, teamGames[i].id],
              description: `${team.name} has back-to-back games with no rest`,
              possibleResolutions: ['Add rest day between games']
            });
            score *= 0.7;
          } else if (daysBetween < params.idealRestDays) {
            score *= 0.95;
          }
        }
        
        // Check for 3 games in 5 days
        const backToBackAnalysis = BasketballMLUtilities.analyzeBackToBackPattern(teamGames);
        if (backToBackAnalysis.hasIssues) {
          score *= (1 - params.penaltyFor3GamesIn5Days);
          violations.push({
            type: 'excessive_game_density',
            severity: 'major',
            affectedEntities: [team.id],
            description: `${team.name} has ${backToBackAnalysis.problematicStretch?.issue}`,
            possibleResolutions: ['Spread games out more evenly']
          });
        }
        
        // Check consecutive road games
        let consecutiveRoad = 0;
        for (const game of teamGames) {
          if (game.awayTeamId === team.id) {
            consecutiveRoad++;
            if (consecutiveRoad > params.maxConsecutiveRoadGames) {
              violations.push({
                type: 'excessive_consecutive_road',
                severity: 'major',
                affectedEntities: [team.id, game.id],
                description: `${team.name} has ${consecutiveRoad} consecutive road games`,
                possibleResolutions: ['Insert home game in road stretch']
              });
              score *= 0.85;
            }
          } else {
            consecutiveRoad = 0;
          }
        }
        
        // ML-based travel burden analysis
        const roadGames = teamGames.filter(g => g.awayTeamId === team.id);
        if (roadGames.length > teamGames.length * 0.55) {
          score *= 0.9;
          suggestions.push({
            type: 'imbalanced_home_road',
            priority: 'medium',
            description: `${team.name} has ${roadGames.length}/${teamGames.length} road games (${(roadGames.length/teamGames.length*100).toFixed(1)}%)`,
            implementation: 'Balance home/road split closer to 50/50',
            expectedImprovement: 10
          });
        }
      }
      
      return {
        constraintId: 'bb-rest-and-travel-optimization',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : 
          score < 0.7 ? ConstraintStatus.VIOLATED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: violations.length === 0,
        score,
        message: `Rest and travel optimization score: ${(score * 100).toFixed(1)}%`,
        violations,
        suggestions,
        confidence: 0.92
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Optimizes rest days and travel patterns for player health',
      tags: ['basketball', 'rest', 'travel', 'player-health']
    },
    cacheable: true,
    parallelizable: true,
    priority: 80
  },

  {
    id: 'bb-tournament-preparation',
    name: 'Tournament Week Preparation',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.HARD,
    weight: 95,
    scope: {
      sports: ['Men\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      tournamentStartDate: '2026-03-10', // Big 12 Tournament typical start
      regularSeasonEndDate: '2026-03-07',
      minimumRestBeforeTournament: 2, // Days
      lastWeekMaxGames: 2
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      const tournamentStart = new Date(params.tournamentStartDate);
      const seasonEnd = new Date(params.regularSeasonEndDate);
      
      // Check for games after regular season end
      const lateGames = schedule.games.filter(g => 
        g.sport === 'Men\'s Basketball' &&
        g.type === 'conference' &&
        g.date > seasonEnd &&
        g.date < tournamentStart
      );
      
      if (lateGames.length > 0) {
        violations.push({
          type: 'games_after_season_end',
          severity: 'critical',
          affectedEntities: lateGames.map(g => g.id),
          description: 'Regular season games scheduled after season end date',
          possibleResolutions: ['Move games before March 7']
        });
      }
      
      // Check last week game density
      const lastWeekStart = new Date(seasonEnd);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      
      for (const team of schedule.teams.filter(t => t.conference === 'Big 12')) {
        const lastWeekGames = schedule.games.filter(g => 
          g.sport === 'Men\'s Basketball' &&
          (g.homeTeamId === team.id || g.awayTeamId === team.id) &&
          g.date >= lastWeekStart &&
          g.date <= seasonEnd
        );
        
        if (lastWeekGames.length > params.lastWeekMaxGames) {
          violations.push({
            type: 'excessive_last_week_games',
            severity: 'major',
            affectedEntities: [team.id, ...lastWeekGames.map(g => g.id)],
            description: `${team.name} has ${lastWeekGames.length} games in final week`,
            possibleResolutions: ['Reduce to maximum 2 games in final week']
          });
        }
      }
      
      return {
        constraintId: 'bb-tournament-preparation',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'Tournament preparation requirements met'
          : `Found ${violations.length} tournament prep violations`,
        violations,
        confidence: 1.0
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Ensures proper rest and preparation for conference tournament',
      tags: ['basketball', 'tournament', 'temporal']
    },
    cacheable: true,
    priority: 95
  },

  {
    id: 'bb-weekend-optimization',
    name: 'Weekend Game Distribution',
    type: ConstraintType.PERFORMANCE,
    hardness: ConstraintHardness.SOFT,
    weight: 75,
    scope: {
      sports: ['Men\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      targetWeekendPercentage: 0.65, // 65% of games on weekends
      saturdayPremiumSlots: ['14:00', '16:00', '18:00', '20:00'],
      fridayNightSlot: '19:00',
      sundayAfternoonSlots: ['14:00', '16:00']
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      let score = 1.0;
      const suggestions: ConstraintSuggestion[] = [];
      
      const conferenceGames = schedule.games.filter(g => 
        g.sport === 'Men\'s Basketball' &&
        g.type === 'conference'
      );
      
      const weekendGames = conferenceGames.filter(g => {
        const day = g.date.getDay();
        return day === 0 || day === 5 || day === 6; // Friday, Saturday, Sunday
      });
      
      const weekendPercentage = weekendGames.length / conferenceGames.length;
      
      if (weekendPercentage < params.targetWeekendPercentage) {
        score *= 0.85;
        suggestions.push({
          type: 'insufficient_weekend_games',
          priority: 'medium',
          description: `Only ${(weekendPercentage * 100).toFixed(1)}% of games on weekends (target: ${params.targetWeekendPercentage * 100}%)`,
          implementation: 'Move midweek games to weekends where possible',
          expectedImprovement: 15
        });
      }
      
      // Analyze Saturday premium slot usage
      const saturdayGames = weekendGames.filter(g => g.date.getDay() === 6);
      const premiumSaturdayGames = saturdayGames.filter(g => 
        params.saturdayPremiumSlots.includes(g.time)
      );
      
      if (premiumSaturdayGames.length < saturdayGames.length * 0.8) {
        score *= 0.9;
        suggestions.push({
          type: 'suboptimal_saturday_slots',
          priority: 'low',
          description: 'Not maximizing Saturday premium time slots',
          implementation: 'Schedule more games in 2 PM, 4 PM, 6 PM, and 8 PM Saturday slots',
          expectedImprovement: 10
        });
      }
      
      return {
        constraintId: 'bb-weekend-optimization',
        status: score > 0.8 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.8,
        score,
        message: `Weekend optimization score: ${(score * 100).toFixed(1)}%`,
        suggestions,
        confidence: 0.85,
        details: {
          totalGames: conferenceGames.length,
          weekendGames: weekendGames.length,
          weekendPercentage: (weekendPercentage * 100).toFixed(1) + '%',
          saturdayGames: saturdayGames.length,
          premiumSaturdayGames: premiumSaturdayGames.length
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Optimizes weekend game distribution for attendance and viewership',
      tags: ['basketball', 'weekend', 'attendance', 'optimization']
    },
    cacheable: true,
    parallelizable: true,
    priority: 75
  },

  {
    id: 'mbb-weekend-home-games-hard',
    name: 'Men\'s Basketball Weekend Home Games Requirement (CORE)',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.HARD,
    weight: 100,
    scope: {
      sports: ['Men\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      minimumWeekendHomeGames: 4,
      weekendDays: [5, 6, 0], // Friday, Saturday, Sunday
      requireSimilarDistribution: true
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      const violations: ConstraintViolation[] = [];
      let score = 1.0;
      
      const teamWeekendHomeGames = new Map<string, number>();
      
      for (const team of schedule.teams.filter(t => t.conference === 'Big 12')) {
        const homeGames = schedule.games.filter(g => 
          g.sport === 'Men\'s Basketball' &&
          g.homeTeamId === team.id &&
          g.type === 'conference'
        );
        
        const weekendHomeGames = homeGames.filter(g => 
          params.weekendDays.includes(g.date.getDay())
        );
        
        teamWeekendHomeGames.set(team.id, weekendHomeGames.length);
        
        if (weekendHomeGames.length < params.minimumWeekendHomeGames) {
          violations.push({
            type: 'insufficient_weekend_home_games',
            severity: 'critical',
            affectedEntities: [team.id],
            description: `${team.name} has only ${weekendHomeGames.length} weekend home games (minimum: ${params.minimumWeekendHomeGames})`,
            possibleResolutions: ['Move weekday home games to weekends']
          });
          score = 0; // Hard constraint violation
        }
      }
      
      return {
        constraintId: 'mbb-weekend-home-games-hard',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: score > 0,
        score,
        message: violations.length === 0 
          ? 'All teams meet weekend home game requirements'
          : `Found ${violations.length} weekend home game violations`,
        violations,
        confidence: 1.0,
        details: {
          teamWeekendHomeGames: Object.fromEntries(teamWeekendHomeGames)
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'CORE requirement: Each team must have minimum 4 weekend home games with similar distribution',
      tags: ['mens-basketball', 'weekend', 'core', 'hard-constraint']
    },
    cacheable: true,
    priority: 100
  },

  {
    id: 'mbb-bye-placement',
    name: 'Men\'s Basketball Bye Date Placement',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.SOFT,
    weight: 70,
    scope: {
      sports: ['Men\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      preferredByeDays: [2, 3], // Tuesday, Wednesday (mid-week)
      avoidWeekendByes: true,
      idealByePlacement: 'middle-third' // prefer byes in middle third of season
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      for (const team of schedule.teams.filter(t => t.conference === 'Big 12')) {
        const teamGames = schedule.games
          .filter(g => 
            g.sport === 'Men\'s Basketball' &&
            g.type === 'conference' &&
            (g.homeTeamId === team.id || g.awayTeamId === team.id))
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        // Find bye weeks (gaps of 7+ days between consecutive games)
        for (let i = 1; i < teamGames.length; i++) {
          const daysBetween = Math.floor(
            (teamGames[i].date.getTime() - teamGames[i-1].date.getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          
          if (daysBetween >= 7) { // This is a bye week
            const byeStartDate = new Date(teamGames[i-1].date);
            byeStartDate.setDate(byeStartDate.getDate() + 1);
            
            // Check if bye falls on preferred days (mid-week)
            const byeDay = byeStartDate.getDay();
            const isWeekend = byeDay === 0 || byeDay === 6; // Sunday or Saturday
            
            if (isWeekend && params.avoidWeekendByes) {
              score *= 0.8;
              suggestions.push({
                type: 'weekend_bye',
                priority: 'low',
                description: `${team.name} has bye during weekend`,
                implementation: 'Schedule bye during mid-week when possible',
                expectedImprovement: 5
              });
            }
            
            if (!params.preferredByeDays.includes(byeDay)) {
              score *= 0.9;
              suggestions.push({
                type: 'non_optimal_bye_day',
                priority: 'low',
                description: `${team.name} bye not on preferred mid-week days`,
                implementation: 'Move bye to Tuesday or Wednesday when possible',
                expectedImprovement: 3
              });
            }
          }
        }
      }
      
      return {
        constraintId: 'mbb-bye-placement',
        status: score > 0.8 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.8,
        score,
        message: `Bye placement optimization score: ${(score * 100).toFixed(1)}%`,
        suggestions,
        confidence: 0.8
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Optimizes bye date placement for mid-week timing',
      tags: ['mens-basketball', 'bye-dates', 'temporal', 'mid-week']
    },
    cacheable: true,
    parallelizable: true,
    priority: 70
  },

  {
    id: 'mbb-pab-balancing',
    name: 'Plays After Byes (PAB) Balancing',
    type: ConstraintType.FAIRNESS,
    hardness: ConstraintHardness.SOFT,
    weight: 65,
    scope: {
      sports: ['Men\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      maxPabImbalance: 1, // Max difference in PAB games between teams
      penaltyPerImbalance: 0.1
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      const teamPabCounts = new Map<string, number>();
      
      for (const team of schedule.teams.filter(t => t.conference === 'Big 12')) {
        let pabCount = 0;
        
        const teamGames = schedule.games
          .filter(g => 
            g.sport === 'Men\'s Basketball' &&
            g.type === 'conference' &&
            (g.homeTeamId === team.id || g.awayTeamId === team.id))
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        for (const game of teamGames) {
          const opponentId = game.homeTeamId === team.id ? game.awayTeamId : game.homeTeamId;
          
          // Check if opponent had a bye before this game
          const opponentGames = schedule.games
            .filter(g => 
              g.sport === 'Men\'s Basketball' &&
              g.type === 'conference' &&
              (g.homeTeamId === opponentId || g.awayTeamId === opponentId) &&
              g.date < game.date)
            .sort((a, b) => a.date.getTime() - b.date.getTime());
          
          if (opponentGames.length > 0) {
            const lastOpponentGame = opponentGames[opponentGames.length - 1];
            const daysSinceLastGame = Math.floor(
              (game.date.getTime() - lastOpponentGame.date.getTime()) / 
              (1000 * 60 * 60 * 24)
            );
            
            if (daysSinceLastGame >= 7) { // Opponent had a bye
              pabCount++;
            }
          }
        }
        
        teamPabCounts.set(team.id, pabCount);
      }
      
      // Check for imbalance in PAB games
      const pabValues = Array.from(teamPabCounts.values());
      const maxPab = Math.max(...pabValues);
      const minPab = Math.min(...pabValues);
      const imbalance = maxPab - minPab;
      
      if (imbalance > params.maxPabImbalance) {
        score *= Math.pow(0.9, imbalance - params.maxPabImbalance);
        
        suggestions.push({
          type: 'pab_imbalance',
          priority: 'medium',
          description: `PAB games vary by ${imbalance} (range: ${minPab}-${maxPab})`,
          implementation: 'Balance teams playing opponents coming off byes',
          expectedImprovement: 15
        });
      }
      
      return {
        constraintId: 'mbb-pab-balancing',
        status: imbalance <= params.maxPabImbalance ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: imbalance <= params.maxPabImbalance,
        score,
        message: `PAB balance: ${minPab}-${maxPab} range (imbalance: ${imbalance})`,
        suggestions,
        confidence: 0.85,
        details: {
          teamPabCounts: Object.fromEntries(teamPabCounts),
          imbalance,
          maxAllowedImbalance: params.maxPabImbalance
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Balances teams playing opponents coming off bye dates',
      tags: ['mens-basketball', 'pab', 'fairness', 'bye-advantage']
    },
    cacheable: true,
    parallelizable: true,
    priority: 65
  },

  {
    id: 'mbb-big-monday-home-preceded-by-road',
    name: 'Big Monday Home Game Preceded by Road Game',
    type: ConstraintType.PERFORMANCE,
    hardness: ConstraintHardness.SOFT,
    weight: 60,
    scope: {
      sports: ['Men\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      bigMondayTimeSlot: '20:00', // 8 PM CT
      requirePrecedingRoadGame: true,
      maxDaysBetween: 5 // Must be within 5 days
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      const bigMondayHomeGames = schedule.games.filter(g => 
        g.sport === 'Men\'s Basketball' &&
        g.type === 'conference' &&
        g.date.getDay() === 1 && // Monday
        g.time === params.bigMondayTimeSlot
      );
      
      for (const mondayGame of bigMondayHomeGames) {
        const homeTeam = schedule.teams.find(t => t.id === mondayGame.homeTeamId);
        if (!homeTeam) continue;
        
        // Find the preceding game for the home team
        const teamGames = schedule.games
          .filter(g => 
            g.sport === 'Men\'s Basketball' &&
            g.type === 'conference' &&
            (g.homeTeamId === homeTeam.id || g.awayTeamId === homeTeam.id) &&
            g.date < mondayGame.date)
          .sort((a, b) => b.date.getTime() - a.date.getTime()); // Most recent first
        
        if (teamGames.length > 0) {
          const precedingGame = teamGames[0];
          const daysBetween = Math.floor(
            (mondayGame.date.getTime() - precedingGame.date.getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          
          const wasRoadGame = precedingGame.awayTeamId === homeTeam.id;
          
          if (daysBetween <= params.maxDaysBetween) {
            if (!wasRoadGame) {
              score *= 0.9;
              suggestions.push({
                type: 'big_monday_not_preceded_by_road',
                priority: 'low',
                description: `${homeTeam.name} Big Monday home game not preceded by road game`,
                implementation: 'Schedule preceding road game when possible',
                expectedImprovement: 5
              });
            }
          }
        }
      }
      
      return {
        constraintId: 'mbb-big-monday-home-preceded-by-road',
        status: score > 0.9 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.9,
        score,
        message: `Big Monday road precedence score: ${(score * 100).toFixed(1)}%`,
        suggestions,
        confidence: 0.8,
        details: {
          bigMondayHomeGames: bigMondayHomeGames.length
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Prefers Big Monday home games to be preceded by road games',
      tags: ['mens-basketball', 'big-monday', 'road-home-pattern']
    },
    cacheable: true,
    parallelizable: true,
    priority: 60
  },

  {
    id: 'mbb-conference-game-count',
    name: 'Men\'s Basketball Conference Game Count',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.HARD,
    weight: 100,
    scope: {
      sports: ['Men\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      requiredGames: 18,
      playTwice: 3, // teams played twice
      playOnce: 12, // teams played once
      totalWindows: 19, // includes one bye
      requiresBye: true
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      
      for (const team of schedule.teams.filter(t => t.conference === 'Big 12')) {
        const teamGames = schedule.games.filter(g => 
          g.sport === 'Men\'s Basketball' &&
          g.type === 'conference' &&
          (g.homeTeamId === team.id || g.awayTeamId === team.id)
        );
        
        if (teamGames.length !== params.requiredGames) {
          violations.push({
            type: 'incorrect_game_count',
            severity: 'critical',
            affectedEntities: [team.id],
            description: `${team.name} has ${teamGames.length} games (required: ${params.requiredGames})`,
            possibleResolutions: ['Adjust schedule to exactly 18 conference games']
          });
        }
        
        // Check play distribution
        const opponents = new Map<string, number>();
        for (const game of teamGames) {
          const opponentId = game.homeTeamId === team.id ? game.awayTeamId : game.homeTeamId;
          opponents.set(opponentId, (opponents.get(opponentId) || 0) + 1);
        }
        
        const playTwiceCount = Array.from(opponents.values()).filter(count => count === 2).length;
        const playOnceCount = Array.from(opponents.values()).filter(count => count === 1).length;
        
        if (playTwiceCount !== params.playTwice || playOnceCount !== params.playOnce) {
          violations.push({
            type: 'incorrect_play_distribution',
            severity: 'critical',
            affectedEntities: [team.id],
            description: `${team.name} plays ${playTwiceCount} teams twice and ${playOnceCount} once (required: ${params.playTwice} twice, ${params.playOnce} once)`,
            possibleResolutions: ['Adjust opponent distribution to 3 twice, 12 once']
          });
        }
        
        // Check for bye week (should have 19 windows for 18 games)
        if (params.requiresBye) {
          const sortedGames = teamGames.sort((a, b) => a.date.getTime() - b.date.getTime());
          let hasBye = false;
          
          for (let i = 1; i < sortedGames.length; i++) {
            const daysBetween = Math.floor(
              (sortedGames[i].date.getTime() - sortedGames[i-1].date.getTime()) / 
              (1000 * 60 * 60 * 24)
            );
            if (daysBetween >= 7) {
              hasBye = true;
              break;
            }
          }
          
          if (!hasBye) {
            violations.push({
              type: 'missing_bye_week',
              severity: 'major',
              affectedEntities: [team.id],
              description: `${team.name} appears to be missing required bye week`,
              possibleResolutions: ['Ensure 19 windows provide one bye week']
            });
          }
        }
      }
      
      return {
        constraintId: 'mbb-conference-game-count',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'All teams have correct game count, distribution, and bye weeks'
          : `Found ${violations.length} game count/distribution violations`,
        violations,
        confidence: 1.0
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Ensures each team plays exactly 18 conference games with proper distribution and bye',
      tags: ['mens-basketball', 'game-count', 'distribution', 'core', 'bye-week']
    },
    cacheable: true,
    priority: 100
  }
];

// Enhanced Women's Basketball Constraints
export const enhancedWomensBasketballConstraints: UnifiedConstraint[] = [
  {
    id: 'wbb-weekend-home-games-hard',
    name: 'Weekend Home Games Requirement (CORE)',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.HARD,
    weight: 100,
    scope: {
      sports: ['Women\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      minimumWeekendHomeGames: 4,
      weekendDays: [5, 6, 0], // Friday, Saturday, Sunday
      requireSimilarDistribution: true
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      const violations: ConstraintViolation[] = [];
      let score = 1.0;
      
      const teamWeekendHomeGames = new Map<string, number>();
      
      for (const team of schedule.teams.filter(t => t.conference === 'Big 12')) {
        const homeGames = schedule.games.filter(g => 
          g.sport === 'Women\'s Basketball' &&
          g.homeTeamId === team.id &&
          g.type === 'conference'
        );
        
        const weekendHomeGames = homeGames.filter(g => 
          params.weekendDays.includes(g.date.getDay())
        );
        
        teamWeekendHomeGames.set(team.id, weekendHomeGames.length);
        
        if (weekendHomeGames.length < params.minimumWeekendHomeGames) {
          violations.push({
            type: 'insufficient_weekend_home_games',
            severity: 'critical',
            affectedEntities: [team.id],
            description: `${team.name} has only ${weekendHomeGames.length} weekend home games (minimum: ${params.minimumWeekendHomeGames})`,
            possibleResolutions: ['Move weekday home games to weekends']
          });
          score = 0; // Hard constraint violation
        }
      }
      
      // Check for similar distribution
      if (params.requireSimilarDistribution && teamWeekendHomeGames.size > 0) {
        const counts = Array.from(teamWeekendHomeGames.values());
        const maxCount = Math.max(...counts);
        const minCount = Math.min(...counts);
        
        if (maxCount - minCount > 2) {
          violations.push({
            type: 'uneven_weekend_distribution',
            severity: 'major',
            affectedEntities: Array.from(teamWeekendHomeGames.keys()),
            description: `Weekend home game distribution varies by ${maxCount - minCount} games (max variance should be 2)`,
            possibleResolutions: ['Redistribute weekend home games more evenly']
          });
          score *= 0.8;
        }
      }
      
      return {
        constraintId: 'wbb-weekend-home-games-hard',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: score > 0,
        score,
        message: violations.length === 0 
          ? 'All teams meet weekend home game requirements'
          : `Found ${violations.length} weekend home game violations`,
        violations,
        confidence: 1.0,
        details: {
          teamWeekendHomeGames: Object.fromEntries(teamWeekendHomeGames)
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'CORE requirement: Each team must have minimum 4 weekend home games with similar distribution',
      tags: ['womens-basketball', 'weekend', 'core', 'hard-constraint']
    },
    cacheable: true,
    priority: 100
  },

  {
    id: 'wbb-conference-game-count',
    name: 'Women\'s Basketball Conference Game Count',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.HARD,
    weight: 100,
    scope: {
      sports: ['Women\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      requiredGames: 20,
      playTwice: 5, // teams played twice
      playOnce: 10 // teams played once
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      
      for (const team of schedule.teams.filter(t => t.conference === 'Big 12')) {
        const teamGames = schedule.games.filter(g => 
          g.sport === 'Women\'s Basketball' &&
          g.type === 'conference' &&
          (g.homeTeamId === team.id || g.awayTeamId === team.id)
        );
        
        if (teamGames.length !== params.requiredGames) {
          violations.push({
            type: 'incorrect_game_count',
            severity: 'critical',
            affectedEntities: [team.id],
            description: `${team.name} has ${teamGames.length} games (required: ${params.requiredGames})`,
            possibleResolutions: ['Adjust schedule to exactly 20 conference games']
          });
        }
        
        // Check play distribution
        const opponents = new Map<string, number>();
        for (const game of teamGames) {
          const opponentId = game.homeTeamId === team.id ? game.awayTeamId : game.homeTeamId;
          opponents.set(opponentId, (opponents.get(opponentId) || 0) + 1);
        }
        
        const playTwiceCount = Array.from(opponents.values()).filter(count => count === 2).length;
        const playOnceCount = Array.from(opponents.values()).filter(count => count === 1).length;
        
        if (playTwiceCount !== params.playTwice || playOnceCount !== params.playOnce) {
          violations.push({
            type: 'incorrect_play_distribution',
            severity: 'critical',
            affectedEntities: [team.id],
            description: `${team.name} plays ${playTwiceCount} teams twice and ${playOnceCount} once (required: ${params.playTwice} twice, ${params.playOnce} once)`,
            possibleResolutions: ['Adjust opponent distribution to 5 twice, 10 once']
          });
        }
      }
      
      return {
        constraintId: 'wbb-conference-game-count',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'All teams have correct game count and distribution'
          : `Found ${violations.length} game count/distribution violations`,
        violations,
        confidence: 1.0
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Ensures each team plays exactly 20 conference games with proper distribution',
      tags: ['womens-basketball', 'game-count', 'distribution', 'core']
    },
    cacheable: true,
    priority: 100
  },

  {
    id: 'wbb-minimize-same-day-games',
    name: 'Minimize Same-Day Men\'s/Women\'s Games',
    type: ConstraintType.VENUE,
    hardness: ConstraintHardness.SOFT,
    weight: 85,
    scope: {
      sports: ['Women\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      maxSameDayGames: 2, // Allow some but minimize
      penaltyPerConflict: 0.1
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      let sameDayConflicts = 0;
      
      for (const team of schedule.teams.filter(t => t.conference === 'Big 12')) {
        const teamDates = new Set<string>();
        
        // Get all dates when team has home games
        const womensHomeGames = schedule.games.filter(g => 
          g.sport === 'Women\'s Basketball' &&
          g.homeTeamId === team.id
        );
        
        const mensHomeGames = schedule.games.filter(g => 
          g.sport === 'Men\'s Basketball' &&
          g.homeTeamId === team.id
        );
        
        // Check for same-day conflicts
        for (const wGame of womensHomeGames) {
          const dateKey = wGame.date.toDateString();
          
          const sameDayMensGames = mensHomeGames.filter(mGame => 
            mGame.date.toDateString() === dateKey
          );
          
          if (sameDayMensGames.length > 0) {
            sameDayConflicts++;
            score *= (1 - params.penaltyPerConflict);
            
            suggestions.push({
              type: 'same_day_game_conflict',
              priority: 'medium',
              description: `${team.name} has both men's and women's home games on ${dateKey}`,
              implementation: 'Move one game to different date',
              expectedImprovement: 10
            });
          }
        }
      }
      
      return {
        constraintId: 'wbb-minimize-same-day-games',
        status: sameDayConflicts <= params.maxSameDayGames ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: sameDayConflicts <= params.maxSameDayGames,
        score,
        message: `Found ${sameDayConflicts} same-day game conflicts`,
        suggestions,
        confidence: 0.9,
        details: {
          sameDayConflicts,
          maxAllowed: params.maxSameDayGames
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Minimizes scheduling men\'s and women\'s games on same day at home',
      tags: ['womens-basketball', 'venue-sharing', 'same-day-games']
    },
    cacheable: true,
    parallelizable: true,
    priority: 85
  },

  {
    id: 'wbb-consecutive-road-with-travel-efficiency',
    name: 'Women\'s Basketball Consecutive Road Games with Travel Exception',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.HARD,
    weight: 95,
    scope: {
      sports: ['Women\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      maxConsecutiveRoad: 2,
      travelEfficiencyThreshold: 300, // miles - if both opponents within this distance, allow consecutive
      minimizationWeight: 0.8
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      for (const team of schedule.teams.filter(t => t.conference === 'Big 12')) {
        const teamGames = schedule.games
          .filter(g => 
            g.sport === 'Women\'s Basketball' &&
            g.type === 'conference' &&
            (g.homeTeamId === team.id || g.awayTeamId === team.id))
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        let consecutiveRoadCount = 0;
        const roadStretch: any[] = [];
        
        for (let i = 0; i < teamGames.length; i++) {
          const game = teamGames[i];
          const isRoadGame = game.awayTeamId === team.id;
          
          if (isRoadGame) {
            consecutiveRoadCount++;
            roadStretch.push(game);
            
            if (consecutiveRoadCount > params.maxConsecutiveRoad) {
              // Check for travel efficiency exception
              const hasTravelException = this.checkTravelEfficiencyException(
                roadStretch, 
                team, 
                schedule.teams, 
                params.travelEfficiencyThreshold
              );
              
              if (!hasTravelException) {
                violations.push({
                  type: 'excessive_consecutive_road',
                  severity: 'critical',
                  affectedEntities: [team.id, ...roadStretch.map(g => g.id)],
                  description: `${team.name} has ${consecutiveRoadCount} consecutive road games without travel efficiency justification`,
                  possibleResolutions: ['Insert home game in road stretch', 'Verify travel efficiency exception']
                });
                score = 0; // Hard constraint violation
              } else {
                suggestions.push({
                  type: 'consecutive_road_with_travel_exception',
                  priority: 'low',
                  description: `${team.name} has ${consecutiveRoadCount} consecutive road games but qualifies for travel efficiency exception`,
                  implementation: 'Continue monitoring for optimal travel patterns',
                  expectedImprovement: 5
                });
                score *= params.minimizationWeight; // Soft penalty even with exception
              }
            }
          } else {
            consecutiveRoadCount = 0;
            roadStretch.length = 0;
          }
        }
      }
      
      return {
        constraintId: 'wbb-consecutive-road-with-travel-efficiency',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: score > 0,
        score,
        message: violations.length === 0 
          ? 'Consecutive road games within limits or justified by travel efficiency'
          : `Found ${violations.length} consecutive road violations`,
        violations,
        suggestions,
        confidence: 0.95
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Limits consecutive road games with exception for travel efficiency',
      tags: ['womens-basketball', 'consecutive-road', 'travel-efficiency']
    },
    cacheable: true,
    priority: 95
  }
];

// Travel efficiency check helper
function checkTravelEfficiencyException(
  roadStretch: any[], 
  team: any, 
  allTeams: any[], 
  threshold: number
): boolean {
  if (roadStretch.length < 2) return false;
  
  // Get opponent locations
  const opponents = roadStretch.map(game => {
    const opponentId = game.homeTeamId;
    return allTeams.find(t => t.id === opponentId);
  }).filter(Boolean);
  
  if (opponents.length < 2) return false;
  
  // Check if opponents are geographically close (travel efficient)
  for (let i = 0; i < opponents.length - 1; i++) {
    const distance = calculateDistance(
      opponents[i].location?.lat || 0,
      opponents[i].location?.lng || 0,
      opponents[i + 1].location?.lat || 0,
      opponents[i + 1].location?.lng || 0
    );
    
    if (distance <= threshold) {
      return true; // Travel efficient consecutive road trip
    }
  }
  
  return false;
}

// Simple distance calculation (haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Export helper functions to get constraints
export function getMensBasketballConstraints(): UnifiedConstraint[] {
  return enhancedMensBasketballConstraints;
}

export function getWomensBasketballConstraints(): UnifiedConstraint[] {
  return enhancedWomensBasketballConstraints;
}

export function getAllBasketballConstraints(): UnifiedConstraint[] {
  return [...enhancedMensBasketballConstraints, ...enhancedWomensBasketballConstraints];
}

// Export ML utilities for use in other modules
export { BasketballMLUtilities };