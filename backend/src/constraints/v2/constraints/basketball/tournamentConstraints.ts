// Basketball Tournament Constraints - Big 12 Conference
// Manages conference and NCAA tournament scheduling requirements

import {
  UnifiedConstraint,
  ConstraintType,
  ConstraintHardness,
  ConstraintResult,
  ConstraintStatus,
  Schedule,
  Game,
  ConstraintParameters,
  ConstraintViolation,
  ConstraintSuggestion
} from '../../types';

export const tournamentConstraints: UnifiedConstraint[] = [
  {
    id: 'bb-conference-tournament',
    name: 'Big 12 Tournament Schedule',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.HARD,
    weight: 100,
    scope: {
      sports: ['Men\'s Basketball', 'Women\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      mensTournamentDates: {
        start: '2026-03-11',
        end: '2026-03-14',
        venue: 'T-Mobile Center'
      },
      womensTournamentDates: {
        start: '2026-03-11',
        end: '2026-03-14',
        venue: 'T-Mobile Center'
      },
      regularSeasonEndDate: '2026-03-08',
      minDaysBetweenRegularAndTournament: 2,
      allTeamsQualify: true, // All 16 teams make tournament
      gamesPerDay: {
        day1: 4, // First round
        day2: 4, // Quarterfinals
        day3: 2, // Semifinals
        day4: 1  // Championship
      }
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      
      // Check regular season ends on time
      const lateRegularGames = schedule.games.filter(game => 
        (game.sport === 'Men\'s Basketball' || game.sport === 'Women\'s Basketball') &&
        game.type === 'conference' &&
        game.date > new Date(params.regularSeasonEndDate)
      );
      
      if (lateRegularGames.length > 0) {
        violations.push({
          type: 'late_regular_season',
          severity: 'critical',
          affectedEntities: lateRegularGames.map(g => g.id),
          description: `${lateRegularGames.length} regular season games after ${params.regularSeasonEndDate}`,
          possibleResolutions: ['Move games before tournament cutoff']
        });
      }
      
      // Check tournament games exist for each sport
      ['Men\'s Basketball', 'Women\'s Basketball'].forEach(sport => {
        const tournamentParams = sport === 'Men\'s Basketball' 
          ? params.mensTournamentDates 
          : params.womensTournamentDates;
        
        const tournamentGames = schedule.games.filter(game => 
          game.sport === sport && 
          game.type === 'tournament' &&
          game.date >= new Date(tournamentParams.start) &&
          game.date <= new Date(tournamentParams.end)
        );
        
        // Calculate expected games (single elimination with 16 teams)
        const expectedGames = 15; // 8 + 4 + 2 + 1
        
        if (tournamentGames.length < expectedGames) {
          violations.push({
            type: 'incomplete_tournament',
            severity: 'critical',
            affectedEntities: [],
            description: `${sport} tournament has only ${tournamentGames.length} games (need ${expectedGames})`,
            possibleResolutions: ['Add missing tournament games']
          });
        }
        
        // Check venue
        const wrongVenueGames = tournamentGames.filter(g => 
          g.venueId !== tournamentParams.venue
        );
        
        if (wrongVenueGames.length > 0) {
          violations.push({
            type: 'wrong_tournament_venue',
            severity: 'major',
            affectedEntities: wrongVenueGames.map(g => g.id),
            description: `${wrongVenueGames.length} ${sport} tournament games not at ${tournamentParams.venue}`,
            possibleResolutions: ['Move all tournament games to correct venue']
          });
        }
        
        // Check game distribution by day
        const gamesByDate = new Map<string, number>();
        tournamentGames.forEach(game => {
          const dateStr = game.date.toISOString().split('T')[0];
          gamesByDate.set(dateStr, (gamesByDate.get(dateStr) || 0) + 1);
        });
        
        // Verify proper daily distribution
        const tournamentStart = new Date(tournamentParams.start);
        Object.entries(params.gamesPerDay).forEach(([day, expectedCount], index) => {
          const checkDate = new Date(tournamentStart);
          checkDate.setDate(checkDate.getDate() + index);
          const dateStr = checkDate.toISOString().split('T')[0];
          const actualCount = gamesByDate.get(dateStr) || 0;
          
          if (actualCount !== expectedCount) {
            violations.push({
              type: 'incorrect_daily_games',
              severity: 'major',
              affectedEntities: [],
              description: `${sport} has ${actualCount} games on ${dateStr} (expected ${expectedCount})`,
              possibleResolutions: ['Adjust tournament game schedule']
            });
          }
        });
      });
      
      // Check gap between regular season and tournament
      const lastRegularGame = schedule.games
        .filter(g => 
          (g.sport === 'Men\'s Basketball' || g.sport === 'Women\'s Basketball') &&
          g.type === 'conference')
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      
      if (lastRegularGame) {
        const mensStart = new Date(params.mensTournamentDates.start);
        const daysBetween = Math.floor(
          (mensStart.getTime() - lastRegularGame.date.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysBetween < params.minDaysBetweenRegularAndTournament) {
          violations.push({
            type: 'insufficient_tournament_prep',
            severity: 'major',
            affectedEntities: [],
            description: `Only ${daysBetween} days between regular season and tournament`,
            possibleResolutions: ['Increase gap between seasons']
          });
        }
      }
      
      return {
        constraintId: 'bb-conference-tournament',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'Conference tournament requirements satisfied'
          : `Found ${violations.length} tournament violations`,
        violations
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Ensures proper conference tournament structure and timing',
      tags: ['basketball', 'tournament', 'postseason', 'temporal']
    },
    cacheable: false,
    priority: 100
  },

  {
    id: 'bb-ncaa-tournament-prep',
    name: 'NCAA Tournament Preparation',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.SOFT,
    weight: 90,
    scope: {
      sports: ['Men\'s Basketball', 'Women\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      mensSelectionSunday: '2026-03-15',
      womensSelectionSunday: '2026-03-15',
      mensFirstFour: '2026-03-17',
      womensFirstRound: '2026-03-19',
      minDaysAfterConferenceTournament: 1,
      maxDaysBeforeNCAAStart: 6
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      // Find conference championship games
      const mensChampionship = schedule.games.find(g => 
        g.sport === 'Men\'s Basketball' && 
        g.type === 'tournament' &&
        g.round === 'championship'
      );
      
      const womensChampionship = schedule.games.find(g => 
        g.sport === 'Women\'s Basketball' && 
        g.type === 'tournament' &&
        g.round === 'championship'
      );
      
      // Check men's timing
      if (mensChampionship) {
        const selectionDate = new Date(params.mensSelectionSunday);
        const daysBetween = Math.floor(
          (selectionDate.getTime() - mensChampionship.date.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysBetween < params.minDaysAfterConferenceTournament) {
          score *= 0.8;
          suggestions.push({
            type: 'insufficient_selection_prep',
            priority: 'high',
            description: 'Men\'s championship too close to Selection Sunday',
            implementation: 'Move championship game earlier',
            expectedImprovement: 20
          });
        }
        
        // Check NCAA tournament start timing
        const ncaaStart = new Date(params.mensFirstFour);
        const daysToNCAA = Math.floor(
          (ncaaStart.getTime() - mensChampionship.date.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysToNCAA > params.maxDaysBeforeNCAAStart) {
          score *= 0.95;
          suggestions.push({
            type: 'excessive_ncaa_gap',
            priority: 'medium',
            description: `${daysToNCAA} days between conference and NCAA tournaments`,
            implementation: 'Consider later conference tournament dates',
            expectedImprovement: 5
          });
        }
      }
      
      // Check women's timing
      if (womensChampionship) {
        const selectionDate = new Date(params.womensSelectionSunday);
        const daysBetween = Math.floor(
          (selectionDate.getTime() - womensChampionship.date.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysBetween < params.minDaysAfterConferenceTournament) {
          score *= 0.8;
          suggestions.push({
            type: 'insufficient_selection_prep',
            priority: 'high',
            description: 'Women\'s championship too close to Selection Sunday',
            implementation: 'Move championship game earlier',
            expectedImprovement: 20
          });
        }
      }
      
      // Check for potential conflicts with early season tournaments
      const novemberTournaments = schedule.games.filter(g => 
        (g.sport === 'Men\'s Basketball' || g.sport === 'Women\'s Basketball') &&
        g.type === 'mte' && // Multi-team event
        g.date.getMonth() === 10 // November
      );
      
      if (novemberTournaments.length > 20) {
        score *= 0.95;
        suggestions.push({
          type: 'excessive_early_tournaments',
          priority: 'low',
          description: 'Many teams in early season tournaments may affect late season',
          implementation: 'Balance tournament participation',
          expectedImprovement: 5
        });
      }
      
      return {
        constraintId: 'bb-ncaa-tournament-prep',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `NCAA tournament preparation score: ${(score * 100).toFixed(1)}%`,
        suggestions
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Optimizes schedule for NCAA tournament preparation',
      tags: ['basketball', 'tournament', 'ncaa', 'preparation']
    },
    cacheable: true,
    priority: 90
  },

  {
    id: 'bb-tournament-seeding',
    name: 'Tournament Seeding Considerations',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.SOFT,
    weight: 75,
    scope: {
      sports: ['Men\'s Basketball', 'Women\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      balancedScheduleWeight: 0.8,
      commonOpponentsMinimum: 5,
      headToHeadGamesRequired: 1,
      lastWeekImpact: 1.2 // Games in last week have 20% more impact
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      // Analyze schedule balance for fair seeding
      const teamOpponents = new Map<string, Set<string>>();
      const teamScheduleStrength = new Map<string, number>();
      
      const conferenceGames = schedule.games.filter(g => 
        (g.sport === 'Men\'s Basketball' || g.sport === 'Women\'s Basketball') &&
        g.type === 'conference'
      );
      
      // Build opponent lists
      conferenceGames.forEach(game => {
        if (!teamOpponents.has(game.homeTeamId)) {
          teamOpponents.set(game.homeTeamId, new Set());
        }
        if (!teamOpponents.has(game.awayTeamId)) {
          teamOpponents.set(game.awayTeamId, new Set());
        }
        
        teamOpponents.get(game.homeTeamId)!.add(game.awayTeamId);
        teamOpponents.get(game.awayTeamId)!.add(game.homeTeamId);
      });
      
      // Check common opponents for potential tiebreakers
      const teams = Array.from(teamOpponents.keys());
      let insufficientCommonOpponents = 0;
      
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const team1Opponents = teamOpponents.get(teams[i])!;
          const team2Opponents = teamOpponents.get(teams[j])!;
          
          const commonOpponents = new Set(
            [...team1Opponents].filter(x => team2Opponents.has(x))
          );
          
          if (commonOpponents.size < params.commonOpponentsMinimum) {
            insufficientCommonOpponents++;
          }
        }
      }
      
      if (insufficientCommonOpponents > teams.length) {
        score *= 0.95;
        suggestions.push({
          type: 'insufficient_common_opponents',
          priority: 'medium',
          description: 'Many team pairs lack sufficient common opponents for tiebreakers',
          implementation: 'Adjust schedule to increase common opponents',
          expectedImprovement: 5
        });
      }
      
      // Check last week balance
      const lastWeekStart = new Date('2026-03-02');
      const lastWeekGames = conferenceGames.filter(g => 
        g.date >= lastWeekStart
      );
      
      const teamLastWeekCounts = new Map<string, number>();
      lastWeekGames.forEach(game => {
        teamLastWeekCounts.set(
          game.homeTeamId,
          (teamLastWeekCounts.get(game.homeTeamId) || 0) + 1
        );
        teamLastWeekCounts.set(
          game.awayTeamId,
          (teamLastWeekCounts.get(game.awayTeamId) || 0) + 1
        );
      });
      
      // Check for imbalanced last week
      const lastWeekVariance = calculateVariance(Array.from(teamLastWeekCounts.values()));
      if (lastWeekVariance > 0.5) {
        score *= 0.9;
        suggestions.push({
          type: 'imbalanced_last_week',
          priority: 'high',
          description: 'Uneven distribution of games in final week affects seeding',
          implementation: 'Balance final week games across all teams',
          expectedImprovement: 10
        });
      }
      
      return {
        constraintId: 'bb-tournament-seeding',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `Tournament seeding fairness score: ${(score * 100).toFixed(1)}%`,
        suggestions,
        details: {
          insufficientCommonOpponents,
          lastWeekVariance: lastWeekVariance.toFixed(3)
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Ensures schedule supports fair tournament seeding',
      tags: ['basketball', 'tournament', 'seeding', 'fairness']
    },
    cacheable: true,
    priority: 75
  }
];

// Helper function
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

export function getTournamentConstraints(): UnifiedConstraint[] {
  return tournamentConstraints;
}