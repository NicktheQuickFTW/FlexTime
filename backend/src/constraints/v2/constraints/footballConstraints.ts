// Football Scheduling Constraints - Essential Big 12 Conference Rules
// Focused on practical, maintainable implementations

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

// Core Football Constraints
export const footballConstraints: UnifiedConstraint[] = [
  {
    id: 'fb-championship-date',
    name: 'Big 12 Championship Game Date',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.HARD,
    weight: 100,
    scope: {
      sports: ['Football'],
      conferences: ['Big 12']
    },
    parameters: {
      championshipDate: '2025-12-06',
      regularSeasonEndDate: '2025-11-29'
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      
      // Check for regular season games after end date
      const lateGames = schedule.games.filter(game => 
        game.sport === 'Football' && 
        game.type === 'conference' &&
        game.date > new Date(params.regularSeasonEndDate)
      );
      
      if (lateGames.length > 0) {
        violations.push({
          type: 'late_regular_season',
          severity: 'critical',
          affectedEntities: lateGames.map(g => g.id),
          description: `${lateGames.length} regular season games scheduled after November 29`,
          possibleResolutions: ['Move games before November 29']
        });
      }
      
      // Verify championship game exists on correct date
      const championshipGame = schedule.games.find(game => 
        game.sport === 'Football' && 
        game.type === 'championship' &&
        game.date.toISOString().split('T')[0] === params.championshipDate
      );
      
      if (!championshipGame) {
        violations.push({
          type: 'missing_championship',
          severity: 'critical',
          affectedEntities: [],
          description: 'No championship game scheduled for December 6, 2025',
          possibleResolutions: ['Add championship game on December 6']
        });
      }
      
      return {
        constraintId: 'fb-championship-date',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'Championship date constraint satisfied'
          : `Found ${violations.length} championship date violations`,
        violations
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Ensures regular season ends by Nov 29 and championship on Dec 6',
      tags: ['football', 'championship', 'temporal']
    },
    cacheable: true,
    priority: 100
  },

  {
    id: 'fb-game-spacing',
    name: 'Minimum Days Between Games',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.HARD,
    weight: 95,
    scope: {
      sports: ['Football'],
      conferences: ['Big 12']
    },
    parameters: {
      minDaysBetween: 6
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      
      // Check each team's game spacing
      const teams = [...new Set(schedule.games
        .filter(g => g.sport === 'Football')
        .flatMap(g => [g.homeTeamId, g.awayTeamId])
      )];
      
      for (const teamId of teams) {
        const teamGames = schedule.games
          .filter(g => g.sport === 'Football' && 
            (g.homeTeamId === teamId || g.awayTeamId === teamId))
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        for (let i = 1; i < teamGames.length; i++) {
          const daysBetween = Math.floor(
            (teamGames[i].date.getTime() - teamGames[i-1].date.getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          
          if (daysBetween < params.minDaysBetween) {
            violations.push({
              type: 'insufficient_rest',
              severity: 'critical',
              affectedEntities: [teamId, teamGames[i-1].id, teamGames[i].id],
              description: `Team ${teamId} has only ${daysBetween} days between games`,
              possibleResolutions: ['Reschedule one of the games']
            });
          }
        }
      }
      
      return {
        constraintId: 'fb-game-spacing',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'All teams have adequate rest between games'
          : `Found ${violations.length} game spacing violations`,
        violations
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Ensures minimum 6 days between football games',
      tags: ['football', 'temporal', 'player-safety']
    },
    cacheable: true,
    priority: 95
  },

  {
    id: 'fb-home-away-balance',
    name: 'Home/Away Game Balance',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.SOFT,
    weight: 80,
    scope: {
      sports: ['Football'],
      conferences: ['Big 12']
    },
    parameters: {
      maxConsecutiveHome: 3,
      maxConsecutiveAway: 2,
      targetHomeGames: 4  // In 8-game conference schedule
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      const teamStats = new Map<string, {
        homeGames: number;
        awayGames: number;
        maxConsecHome: number;
        maxConsecAway: number;
      }>();
      
      // Analyze each team
      const teams = [...new Set(schedule.games
        .filter(g => g.sport === 'Football' && g.type === 'conference')
        .flatMap(g => [g.homeTeamId, g.awayTeamId])
      )];
      
      for (const teamId of teams) {
        const teamGames = schedule.games
          .filter(g => g.sport === 'Football' && 
            g.type === 'conference' &&
            (g.homeTeamId === teamId || g.awayTeamId === teamId))
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        let homeGames = 0;
        let awayGames = 0;
        let currentConsecHome = 0;
        let currentConsecAway = 0;
        let maxConsecHome = 0;
        let maxConsecAway = 0;
        
        for (const game of teamGames) {
          if (game.homeTeamId === teamId) {
            homeGames++;
            currentConsecHome++;
            currentConsecAway = 0;
            maxConsecHome = Math.max(maxConsecHome, currentConsecHome);
          } else {
            awayGames++;
            currentConsecAway++;
            currentConsecHome = 0;
            maxConsecAway = Math.max(maxConsecAway, currentConsecAway);
          }
        }
        
        teamStats.set(teamId, { homeGames, awayGames, maxConsecHome, maxConsecAway });
        
        // Check violations
        if (maxConsecHome > params.maxConsecutiveHome) {
          score *= 0.9;
          violations.push({
            type: 'excessive_consecutive_home',
            severity: 'major',
            affectedEntities: [teamId],
            description: `${teamId} has ${maxConsecHome} consecutive home games`,
            possibleResolutions: ['Break up home game streak with away game']
          });
        }
        
        if (maxConsecAway > params.maxConsecutiveAway) {
          score *= 0.9;
          violations.push({
            type: 'excessive_consecutive_away',
            severity: 'major',
            affectedEntities: [teamId],
            description: `${teamId} has ${maxConsecAway} consecutive away games`,
            possibleResolutions: ['Break up away game streak with home game']
          });
        }
        
        // Check overall balance
        const imbalance = Math.abs(homeGames - params.targetHomeGames);
        if (imbalance > 1) {
          score *= 0.95;
          suggestions.push({
            type: 'home_away_imbalance',
            priority: 'medium',
            description: `${teamId} has ${homeGames} home and ${awayGames} away games`,
            implementation: 'Adjust home/away assignments for better balance',
            expectedImprovement: 5
          });
        }
      }
      
      return {
        constraintId: 'fb-home-away-balance',
        status: violations.length === 0 && score > 0.85 ? ConstraintStatus.SATISFIED : 
                violations.length > 0 ? ConstraintStatus.VIOLATED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: violations.length === 0 && score > 0.85,
        score,
        message: `Home/away balance score: ${(score * 100).toFixed(1)}%`,
        violations,
        suggestions,
        details: Object.fromEntries(teamStats)
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Ensures fair distribution of home and away games',
      tags: ['football', 'balance', 'fairness']
    },
    cacheable: true,
    priority: 80
  },

  {
    id: 'fb-tv-windows',
    name: 'TV Broadcast Windows',
    type: ConstraintType.PERFORMANCE,
    hardness: ConstraintHardness.SOFT,
    weight: 75,
    scope: {
      sports: ['Football'],
      conferences: ['Big 12']
    },
    parameters: {
      saturdaySlots: ['12:00', '15:30', '19:00', '19:30', '22:30'],
      maxThursdayGames: 2,
      maxFridayGames: 2,
      preferredSaturdayPercentage: 0.8
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      const footballGames = schedule.games.filter(g => 
        g.sport === 'Football' && g.type === 'conference'
      );
      
      // Count games by day of week
      const gamesByDay = {
        thursday: 0,
        friday: 0,
        saturday: 0,
        other: 0
      };
      
      footballGames.forEach(game => {
        const dayOfWeek = game.date.getDay();
        switch(dayOfWeek) {
          case 4: gamesByDay.thursday++; break;
          case 5: gamesByDay.friday++; break;
          case 6: gamesByDay.saturday++; break;
          default: gamesByDay.other++; break;
        }
      });
      
      // Check Thursday/Friday limits
      if (gamesByDay.thursday > params.maxThursdayGames) {
        score *= 0.85;
        suggestions.push({
          type: 'excessive_thursday_games',
          priority: 'high',
          description: `${gamesByDay.thursday} Thursday games exceeds limit of ${params.maxThursdayGames}`,
          implementation: 'Move excess Thursday games to Saturday',
          expectedImprovement: 15
        });
      }
      
      if (gamesByDay.friday > params.maxFridayGames) {
        score *= 0.85;
        suggestions.push({
          type: 'excessive_friday_games',
          priority: 'high',
          description: `${gamesByDay.friday} Friday games exceeds limit of ${params.maxFridayGames}`,
          implementation: 'Move excess Friday games to Saturday',
          expectedImprovement: 15
        });
      }
      
      // Check Saturday percentage
      const saturdayPercentage = gamesByDay.saturday / footballGames.length;
      if (saturdayPercentage < params.preferredSaturdayPercentage) {
        score *= 0.9;
        suggestions.push({
          type: 'low_saturday_percentage',
          priority: 'medium',
          description: `Only ${(saturdayPercentage * 100).toFixed(0)}% of games on Saturday`,
          implementation: 'Move weeknight games to Saturday slots',
          expectedImprovement: 10
        });
      }
      
      // Check for games in non-standard time slots
      const saturdayGames = footballGames.filter(g => g.date.getDay() === 6);
      const nonStandardSlots = saturdayGames.filter(g => 
        !params.saturdaySlots.includes(g.time)
      );
      
      if (nonStandardSlots.length > 0) {
        score *= 0.95;
        suggestions.push({
          type: 'non_standard_time_slots',
          priority: 'low',
          description: `${nonStandardSlots.length} Saturday games in non-standard time slots`,
          implementation: 'Adjust game times to standard TV windows',
          expectedImprovement: 5
        });
      }
      
      return {
        constraintId: 'fb-tv-windows',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `TV window optimization score: ${(score * 100).toFixed(1)}%`,
        suggestions,
        details: {
          gamesByDay,
          saturdayPercentage: (saturdayPercentage * 100).toFixed(1) + '%'
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Optimizes game scheduling for TV broadcast windows',
      tags: ['football', 'media', 'optimization']
    },
    cacheable: true,
    priority: 75
  }
];

// Export helper function
export function getFootballConstraints(): UnifiedConstraint[] {
  return footballConstraints;
}