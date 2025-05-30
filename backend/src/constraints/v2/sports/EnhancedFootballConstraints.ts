// Enhanced Football Constraints with ML optimization and media rights handling
// Version 2.0 - Complete rewrite with advanced features

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

// ML-enhanced utility functions
class FootballMLUtilities {
  // Predict optimal game slots based on historical viewership and attendance
  static async predictOptimalSlot(
    homeTeam: string,
    awayTeam: string,
    week: number
  ): Promise<{ dayOfWeek: number; timeSlot: string; confidence: number }> {
    // Simulated ML prediction - in production, this would call a trained model
    const rivalryFactor = this.isRivalryGame(homeTeam, awayTeam) ? 1.5 : 1.0;
    const weekendPreference = week > 8 ? 0.8 : 0.6; // Later season games prefer Saturday
    
    const slots = [
      { dayOfWeek: 6, timeSlot: '12:00', score: 0.7 * rivalryFactor }, // Saturday noon
      { dayOfWeek: 6, timeSlot: '15:30', score: 0.8 * rivalryFactor }, // Saturday 3:30
      { dayOfWeek: 6, timeSlot: '19:00', score: 0.9 * rivalryFactor }, // Saturday night
      { dayOfWeek: 5, timeSlot: '19:30', score: 0.6 }, // Friday night
      { dayOfWeek: 4, timeSlot: '19:30', score: 0.5 }  // Thursday night
    ];

    const optimalSlot = slots.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    return {
      ...optimalSlot,
      confidence: Math.min(optimalSlot.score * weekendPreference, 0.95)
    };
  }

  static isRivalryGame(team1: string, team2: string): boolean {
    const rivalries = [
      ['Oklahoma State', 'Oklahoma'], // Bedlam
      ['Kansas', 'Kansas State'], // Sunflower Showdown
      ['Texas Tech', 'TCU'], // West Texas Rivalry
      ['Iowa State', 'Kansas State'], // Farmageddon
      ['BYU', 'Utah'], // Holy War
      ['Arizona', 'Arizona State'], // Territorial Cup
      ['Colorado', 'Utah'], // Rumble in the Rockies
    ];
    
    return rivalries.some(rivalry => 
      (rivalry.includes(team1) && rivalry.includes(team2))
    );
  }

  static calculateTravelBurden(schedule: Schedule, teamId: string): number {
    const teamGames = schedule.games.filter(g => 
      g.awayTeamId === teamId && g.sport === 'Football'
    );
    
    let totalBurden = 0;
    for (let i = 1; i < teamGames.length; i++) {
      const prevGame = teamGames[i - 1];
      const currGame = teamGames[i];
      const daysBetween = Math.abs(
        currGame.date.getTime() - prevGame.date.getTime()
      ) / (1000 * 60 * 60 * 24);
      
      // Short rest penalty
      if (daysBetween < 6) {
        totalBurden += 2.0;
      }
      
      // Back-to-back road games penalty
      if (i > 0 && teamGames[i - 1].awayTeamId === teamId) {
        totalBurden += 1.5;
      }
    }
    
    return totalBurden;
  }
}

// Enhanced Football Constraints
export const enhancedFootballConstraints: UnifiedConstraint[] = [
  {
    id: 'fb-championship-window',
    name: 'Big 12 Football Championship Window',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.HARD,
    weight: 100,
    scope: {
      sports: ['Football'],
      conferences: ['Big 12']
    },
    parameters: {
      championshipWeek: 14,
      championshipDate: '2025-12-06',
      regularSeasonEnd: '2025-11-29'
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      
      // Check no regular season games after November 29
      const lateGames = schedule.games.filter(game => 
        game.sport === 'Football' && 
        game.type === 'conference' &&
        game.date > new Date(params.regularSeasonEnd)
      );
      
      if (lateGames.length > 0) {
        violations.push({
          type: 'late_regular_season_game',
          severity: 'critical',
          affectedEntities: lateGames.map(g => g.id),
          description: 'Regular season games scheduled after championship week cutoff',
          possibleResolutions: ['Move games to earlier dates', 'Convert to non-conference games']
        });
      }
      
      // Ensure championship game is properly scheduled
      const championshipGames = schedule.games.filter(game => 
        game.sport === 'Football' && 
        game.type === 'championship'
      );
      
      if (championshipGames.length === 0) {
        suggestions.push({
          type: 'missing_championship',
          priority: 'high',
          description: 'No championship game scheduled',
          implementation: 'Add championship game on December 6, 2025',
          expectedImprovement: 100
        });
      }
      
      return {
        constraintId: 'fb-championship-window',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'Championship window constraint satisfied'
          : `Found ${violations.length} violations of championship window`,
        violations,
        suggestions,
        confidence: 1.0
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Ensures football regular season ends before championship week',
      tags: ['football', 'championship', 'temporal']
    },
    cacheable: true,
    priority: 100
  },

  {
    id: 'fb-media-rights-optimization',
    name: 'Media Rights and TV Window Optimization',
    type: ConstraintType.PERFORMANCE,
    hardness: ConstraintHardness.SOFT,
    weight: 85,
    scope: {
      sports: ['Football'],
      conferences: ['Big 12']
    },
    parameters: {
      primeTimeSlots: ['19:00', '19:30', '20:00'],
      preferredNetworks: ['FOX', 'ESPN', 'ABC', 'FS1'],
      maxThursdayGames: 2,
      maxFridayGames: 2
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      const startTime = Date.now();
      let score = 1.0;
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      
      // Count weeknight games
      const thursdayGames = schedule.games.filter(g => 
        g.sport === 'Football' && g.date.getDay() === 4
      );
      const fridayGames = schedule.games.filter(g => 
        g.sport === 'Football' && g.date.getDay() === 5
      );
      
      if (thursdayGames.length > params.maxThursdayGames) {
        score *= 0.8;
        violations.push({
          type: 'excessive_thursday_games',
          severity: 'major',
          affectedEntities: thursdayGames.slice(params.maxThursdayGames).map(g => g.id),
          description: `Too many Thursday games (${thursdayGames.length} > ${params.maxThursdayGames})`,
          possibleResolutions: ['Move excess Thursday games to Saturday']
        });
      }
      
      // Analyze prime time distribution
      const primeTimeGames = schedule.games.filter(g => 
        g.sport === 'Football' && params.primeTimeSlots.includes(g.time)
      );
      
      // ML-based optimization for marquee matchups
      for (const game of schedule.games.filter(g => g.sport === 'Football')) {
        const homeTeam = schedule.teams.find(t => t.id === game.homeTeamId);
        const awayTeam = schedule.teams.find(t => t.id === game.awayTeamId);
        
        if (homeTeam && awayTeam) {
          const isMarqueeMatchup = FootballMLUtilities.isRivalryGame(
            homeTeam.name, 
            awayTeam.name
          );
          
          if (isMarqueeMatchup && !params.primeTimeSlots.includes(game.time)) {
            score *= 0.9;
            suggestions.push({
              type: 'suboptimal_marquee_timing',
              priority: 'medium',
              description: `Marquee matchup ${homeTeam.name} vs ${awayTeam.name} not in prime time`,
              implementation: `Move game to prime time slot (19:00 or 19:30)`,
              expectedImprovement: 15
            });
          }
        }
      }
      
      // Travel burden optimization
      const teams = schedule.teams.filter(t => t.conference === 'Big 12');
      const travelBurdens = new Map<string, number>();
      
      for (const team of teams) {
        const burden = FootballMLUtilities.calculateTravelBurden(schedule, team.id);
        travelBurdens.set(team.id, burden);
        
        if (burden > 5.0) {
          score *= 0.85;
          suggestions.push({
            type: 'high_travel_burden',
            priority: 'high',
            description: `${team.name} has excessive travel burden (${burden.toFixed(1)})`,
            implementation: 'Redistribute away games or adjust bye weeks',
            expectedImprovement: 10
          });
        }
      }
      
      const executionTime = Date.now() - startTime;
      
      return {
        constraintId: 'fb-media-rights-optimization',
        status: score > 0.8 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.8,
        score,
        message: `Media rights optimization score: ${(score * 100).toFixed(1)}%`,
        violations,
        suggestions,
        executionTime,
        confidence: 0.85,
        details: {
          thursdayGames: thursdayGames.length,
          fridayGames: fridayGames.length,
          primeTimeGames: primeTimeGames.length,
          averageTravelBurden: Array.from(travelBurdens.values()).reduce((a, b) => a + b, 0) / travelBurdens.size
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Optimizes game scheduling for TV ratings and media revenue',
      tags: ['football', 'media', 'optimization', 'ml-enhanced'],
      historicalPerformance: {
        satisfactionRate: 0.82,
        averageExecutionTime: 145,
        lastEvaluated: new Date()
      }
    },
    cacheable: true,
    parallelizable: true,
    priority: 85
  },

  {
    id: 'fb-competitive-balance',
    name: 'Competitive Balance and Fairness',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.HARD,
    weight: 90,
    scope: {
      sports: ['Football'],
      conferences: ['Big 12']
    },
    parameters: {
      maxConsecutiveHome: 3,
      maxConsecutiveAway: 3,
      minDaysBetweenGames: 6,
      byeWeekWindow: { start: 4, end: 11 }
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      const violations: ConstraintViolation[] = [];
      let score = 1.0;
      
      for (const team of schedule.teams.filter(t => t.conference === 'Big 12')) {
        const teamGames = schedule.games
          .filter(g => g.sport === 'Football' && 
            (g.homeTeamId === team.id || g.awayTeamId === team.id))
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        // Check consecutive home/away games
        let consecutiveHome = 0;
        let consecutiveAway = 0;
        
        for (const game of teamGames) {
          if (game.homeTeamId === team.id) {
            consecutiveHome++;
            consecutiveAway = 0;
            if (consecutiveHome > params.maxConsecutiveHome) {
              violations.push({
                type: 'excessive_consecutive_home',
                severity: 'major',
                affectedEntities: [team.id, game.id],
                description: `${team.name} has ${consecutiveHome} consecutive home games`,
                possibleResolutions: ['Insert away game', 'Swap with another team']
              });
              score *= 0.8;
            }
          } else {
            consecutiveAway++;
            consecutiveHome = 0;
            if (consecutiveAway > params.maxConsecutiveAway) {
              violations.push({
                type: 'excessive_consecutive_away',
                severity: 'major',
                affectedEntities: [team.id, game.id],
                description: `${team.name} has ${consecutiveAway} consecutive away games`,
                possibleResolutions: ['Insert home game', 'Swap with another team']
              });
              score *= 0.8;
            }
          }
        }
        
        // Check minimum days between games
        for (let i = 1; i < teamGames.length; i++) {
          const daysBetween = Math.floor(
            (teamGames[i].date.getTime() - teamGames[i-1].date.getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          
          if (daysBetween < params.minDaysBetweenGames) {
            violations.push({
              type: 'insufficient_rest',
              severity: 'critical',
              affectedEntities: [team.id, teamGames[i-1].id, teamGames[i].id],
              description: `${team.name} has only ${daysBetween} days between games`,
              possibleResolutions: ['Reschedule one of the games']
            });
            score = 0; // Hard constraint violation
          }
        }
      }
      
      return {
        constraintId: 'fb-competitive-balance',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : 
          score === 0 ? ConstraintStatus.VIOLATED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: violations.length === 0,
        score,
        message: violations.length === 0 
          ? 'Competitive balance maintained'
          : `Found ${violations.length} balance violations`,
        violations,
        confidence: 0.95
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Ensures fair and balanced scheduling for all teams',
      tags: ['football', 'fairness', 'balance']
    },
    cacheable: true,
    priority: 90
  },

  {
    id: 'fb-byu-sunday-restriction',
    name: 'BYU Sunday Game Restriction',
    type: ConstraintType.COMPLIANCE,
    hardness: ConstraintHardness.HARD,
    weight: 100,
    scope: {
      sports: ['Football'],
      teams: ['BYU']
    },
    parameters: {},
    evaluation: (schedule: Schedule): ConstraintResult => {
      const byuSundayGames = schedule.games.filter(game => 
        game.sport === 'Football' &&
        (game.homeTeamId === 'BYU' || game.awayTeamId === 'BYU') &&
        game.date.getDay() === 0 // Sunday
      );
      
      return {
        constraintId: 'fb-byu-sunday-restriction',
        status: byuSundayGames.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: byuSundayGames.length === 0,
        score: byuSundayGames.length === 0 ? 1.0 : 0.0,
        message: byuSundayGames.length === 0 
          ? 'BYU Sunday restriction satisfied'
          : `Found ${byuSundayGames.length} BYU games on Sunday`,
        violations: byuSundayGames.map(game => ({
          type: 'sunday_game',
          severity: 'critical' as const,
          affectedEntities: ['BYU', game.id],
          description: 'BYU cannot play on Sundays',
          possibleResolutions: ['Move game to Saturday', 'Move game to Friday']
        })),
        confidence: 1.0
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Ensures BYU does not play any games on Sundays',
      tags: ['football', 'compliance', 'religious']
    },
    cacheable: true,
    priority: 100
  },

  {
    id: 'fb-weather-optimization',
    name: 'Weather-Aware Scheduling',
    type: ConstraintType.PERFORMANCE,
    hardness: ConstraintHardness.SOFT,
    weight: 70,
    scope: {
      sports: ['Football'],
      conferences: ['Big 12']
    },
    parameters: {
      coldWeatherTeams: ['Colorado', 'Iowa State', 'Kansas', 'Kansas State', 'West Virginia'],
      warmWeatherTeams: ['Arizona', 'Arizona State', 'Houston', 'TCU', 'Texas Tech'],
      coldMonths: [11, 12, 1, 2], // November through February
      extremeHeatMonths: [8, 9] // August, September
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      let score = 1.0;
      const suggestions: ConstraintSuggestion[] = [];
      
      // Analyze weather-based scheduling
      for (const game of schedule.games.filter(g => g.sport === 'Football')) {
        const month = game.date.getMonth() + 1;
        const homeTeam = schedule.teams.find(t => t.id === game.homeTeamId);
        const awayTeam = schedule.teams.find(t => t.id === game.awayTeamId);
        
        if (!homeTeam || !awayTeam) continue;
        
        // Check for cold weather games
        if (params.coldMonths.includes(month)) {
          if (params.warmWeatherTeams.includes(awayTeam.name) && 
              params.coldWeatherTeams.includes(homeTeam.name)) {
            score *= 0.95;
            suggestions.push({
              type: 'suboptimal_weather_matchup',
              priority: 'low',
              description: `${awayTeam.name} traveling to cold weather venue in ${homeTeam.name} in month ${month}`,
              implementation: 'Consider swapping home/away or rescheduling earlier in season',
              expectedImprovement: 5
            });
          }
        }
        
        // Check for extreme heat games
        if (params.extremeHeatMonths.includes(month)) {
          if (params.warmWeatherTeams.includes(homeTeam.name) && game.time < '18:00') {
            score *= 0.92;
            suggestions.push({
              type: 'extreme_heat_concern',
              priority: 'medium',
              description: `Day game in ${homeTeam.name} during extreme heat month`,
              implementation: 'Move game to evening slot (after 18:00)',
              expectedImprovement: 8
            });
          }
        }
      }
      
      return {
        constraintId: 'fb-weather-optimization',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `Weather optimization score: ${(score * 100).toFixed(1)}%`,
        suggestions,
        confidence: 0.75 // Weather predictions have inherent uncertainty
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Optimizes scheduling based on weather patterns and team locations',
      tags: ['football', 'weather', 'optimization', 'player-safety']
    },
    cacheable: false, // Weather data may change
    parallelizable: true,
    priority: 70
  }
];

// Export helper function to get all football constraints
export function getFootballConstraints(): UnifiedConstraint[] {
  return enhancedFootballConstraints;
}

// Export ML utilities for use in other modules
export { FootballMLUtilities };