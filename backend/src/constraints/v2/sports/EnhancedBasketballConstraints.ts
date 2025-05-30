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

// Enhanced Basketball Constraints
export const enhancedBasketballConstraints: UnifiedConstraint[] = [
  {
    id: 'bb-big-monday-optimization',
    name: 'Big Monday Premium Game Selection',
    type: ConstraintType.PERFORMANCE,
    hardness: ConstraintHardness.SOFT,
    weight: 85,
    scope: {
      sports: ['Men\'s Basketball', 'Women\'s Basketball'],
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
        (g.sport === 'Men\'s Basketball' || g.sport === 'Women\'s Basketball') &&
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
      sports: ['Men\'s Basketball', 'Women\'s Basketball'],
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
        (g.sport === 'Men\'s Basketball' || g.sport === 'Women\'s Basketball') &&
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
      sports: ['Men\'s Basketball', 'Women\'s Basketball'],
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
            (g.sport === 'Men\'s Basketball' || g.sport === 'Women\'s Basketball') &&
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
      sports: ['Men\'s Basketball', 'Women\'s Basketball'],
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
        (g.sport === 'Men\'s Basketball' || g.sport === 'Women\'s Basketball') &&
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
          (g.sport === 'Men\'s Basketball' || g.sport === 'Women\'s Basketball') &&
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
      sports: ['Men\'s Basketball', 'Women\'s Basketball'],
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
        (g.sport === 'Men\'s Basketball' || g.sport === 'Women\'s Basketball') &&
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
  }
];

// Export helper function to get all basketball constraints
export function getBasketballConstraints(): UnifiedConstraint[] {
  return enhancedBasketballConstraints;
}

// Export ML utilities for use in other modules
export { BasketballMLUtilities };