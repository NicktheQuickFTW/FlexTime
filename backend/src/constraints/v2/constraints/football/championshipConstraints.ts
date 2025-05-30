// Football Championship Constraints - Big 12 Conference
// Manages championship game requirements and qualification rules

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

export const championshipConstraints: UnifiedConstraint[] = [
  {
    id: 'fb-championship-game',
    name: 'Big 12 Championship Game',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.HARD,
    weight: 100,
    scope: {
      sports: ['Football'],
      conferences: ['Big 12']
    },
    parameters: {
      championshipDate: '2025-12-06',
      championshipVenue: 'AT&T Stadium',
      regularSeasonEndDate: '2025-11-29',
      qualificationFormat: 'top2', // Top 2 teams by conference record
      tiebreakers: [
        'head-to-head',
        'record-vs-common-opponents',
        'overall-record',
        'scoring-differential'
      ]
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      
      // Check all regular season games end before deadline
      const lateRegularGames = schedule.games.filter(game => 
        game.sport === 'Football' && 
        game.type === 'conference' &&
        game.date > new Date(params.regularSeasonEndDate)
      );
      
      if (lateRegularGames.length > 0) {
        violations.push({
          type: 'late_regular_season_games',
          severity: 'critical',
          affectedEntities: lateRegularGames.map(g => g.id),
          description: `${lateRegularGames.length} regular season games after ${params.regularSeasonEndDate}`,
          possibleResolutions: ['Move games before regular season deadline']
        });
      }
      
      // Check championship game exists
      const championshipGame = schedule.games.find(game => 
        game.sport === 'Football' && 
        game.type === 'championship' &&
        game.date.toISOString().split('T')[0] === params.championshipDate
      );
      
      if (!championshipGame) {
        violations.push({
          type: 'missing_championship_game',
          severity: 'critical',
          affectedEntities: [],
          description: 'No championship game scheduled for December 6, 2025',
          possibleResolutions: ['Add championship game on specified date']
        });
      } else if (championshipGame.venueId !== params.championshipVenue) {
        violations.push({
          type: 'wrong_championship_venue',
          severity: 'major',
          affectedEntities: [championshipGame.id],
          description: `Championship game not at ${params.championshipVenue}`,
          possibleResolutions: ['Move championship game to correct venue']
        });
      }
      
      // Verify conference schedule completeness for qualification
      const conferenceGamesPerTeam = calculateConferenceGamesPerTeam(schedule);
      const incompleteTeams = Array.from(conferenceGamesPerTeam.entries())
        .filter(([_, games]) => games < 8); // Assuming 8 conference games
      
      if (incompleteTeams.length > 0) {
        violations.push({
          type: 'incomplete_conference_schedule',
          severity: 'critical',
          affectedEntities: incompleteTeams.map(([team, _]) => team),
          description: `${incompleteTeams.length} teams with incomplete conference schedules`,
          possibleResolutions: ['Complete conference game assignments']
        });
      }
      
      return {
        constraintId: 'fb-championship-game',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'Championship game requirements satisfied'
          : `Found ${violations.length} championship violations`,
        violations,
        details: {
          championshipGameScheduled: !!championshipGame,
          regularSeasonComplete: lateRegularGames.length === 0,
          teamsWithIncompleteSchedules: incompleteTeams.length
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Ensures championship game and qualification requirements are met',
      tags: ['football', 'championship', 'temporal', 'compliance']
    },
    cacheable: false,
    priority: 100
  },

  {
    id: 'fb-championship-qualification',
    name: 'Championship Qualification Rules',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.HARD,
    weight: 95,
    scope: {
      sports: ['Football'],
      conferences: ['Big 12']
    },
    parameters: {
      minConferenceGames: 8,
      divisionFormat: false, // No divisions in current Big 12
      rematchAllowed: true,
      championshipWeek: 14
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      
      // Ensure all teams play minimum conference games
      const teamConferenceGames = new Map<string, number>();
      
      schedule.games
        .filter(g => g.sport === 'Football' && g.type === 'conference')
        .forEach(game => {
          teamConferenceGames.set(
            game.homeTeamId,
            (teamConferenceGames.get(game.homeTeamId) || 0) + 1
          );
          teamConferenceGames.set(
            game.awayTeamId,
            (teamConferenceGames.get(game.awayTeamId) || 0) + 1
          );
        });
      
      // Check each team meets minimum
      teamConferenceGames.forEach((games, teamId) => {
        if (games < params.minConferenceGames) {
          violations.push({
            type: 'insufficient_conference_games',
            severity: 'critical',
            affectedEntities: [teamId],
            description: `${teamId} has only ${games} conference games (minimum: ${params.minConferenceGames})`,
            possibleResolutions: ['Add conference games to meet minimum']
          });
        }
      });
      
      // Check for round-robin feasibility
      const totalTeams = teamConferenceGames.size;
      if (totalTeams === 16 && params.minConferenceGames < 9) {
        suggestions.push({
          type: 'partial_round_robin',
          priority: 'medium',
          description: 'With 16 teams, not all teams play each other',
          implementation: 'Consider rotation system for fairness',
          expectedImprovement: 10
        });
      }
      
      // Verify no team plays another more than once in regular season
      const matchupCounts = new Map<string, number>();
      
      schedule.games
        .filter(g => g.sport === 'Football' && g.type === 'conference')
        .forEach(game => {
          const matchupKey = [game.homeTeamId, game.awayTeamId].sort().join('-');
          matchupCounts.set(matchupKey, (matchupCounts.get(matchupKey) || 0) + 1);
        });
      
      matchupCounts.forEach((count, matchup) => {
        if (count > 1) {
          violations.push({
            type: 'duplicate_matchup',
            severity: 'critical',
            affectedEntities: matchup.split('-'),
            description: `Teams play each other ${count} times in regular season`,
            possibleResolutions: ['Remove duplicate matchup']
          });
        }
      });
      
      return {
        constraintId: 'fb-championship-qualification',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'Qualification rules satisfied'
          : `Found ${violations.length} qualification violations`,
        violations,
        suggestions,
        details: {
          totalTeams: teamConferenceGames.size,
          teamsWithSufficientGames: Array.from(teamConferenceGames.entries())
            .filter(([_, games]) => games >= params.minConferenceGames).length
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Enforces championship qualification and tiebreaker rules',
      tags: ['football', 'championship', 'qualification', 'logical']
    },
    cacheable: true,
    priority: 95
  },

  {
    id: 'fb-championship-preparation',
    name: 'Championship Preparation Time',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.SOFT,
    weight: 85,
    scope: {
      sports: ['Football'],
      conferences: ['Big 12']
    },
    parameters: {
      minDaysBetweenRegularAndChampionship: 6,
      idealDaysBetween: 7,
      maxRegularSeasonWeek: 13
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      // Find championship game
      const championshipGame = schedule.games.find(g => 
        g.sport === 'Football' && g.type === 'championship'
      );
      
      if (!championshipGame) {
        return {
          constraintId: 'fb-championship-preparation',
          status: ConstraintStatus.NOT_APPLICABLE,
          satisfied: true,
          score: 1.0,
          message: 'No championship game to evaluate'
        };
      }
      
      // Find latest regular season game
      const regularSeasonGames = schedule.games
        .filter(g => g.sport === 'Football' && g.type === 'conference')
        .sort((a, b) => b.date.getTime() - a.date.getTime());
      
      if (regularSeasonGames.length > 0) {
        const latestRegularGame = regularSeasonGames[0];
        const daysBetween = Math.floor(
          (championshipGame.date.getTime() - latestRegularGame.date.getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        
        if (daysBetween < params.minDaysBetweenRegularAndChampionship) {
          score *= 0.8;
          suggestions.push({
            type: 'insufficient_preparation_time',
            priority: 'high',
            description: `Only ${daysBetween} days between regular season and championship`,
            implementation: 'Move championship game or end regular season earlier',
            expectedImprovement: 20
          });
        } else if (daysBetween < params.idealDaysBetween) {
          score *= 0.95;
          suggestions.push({
            type: 'suboptimal_preparation_time',
            priority: 'low',
            description: `${daysBetween} days preparation time (ideal: ${params.idealDaysBetween})`,
            implementation: 'Adjust schedule for optimal preparation time',
            expectedImprovement: 5
          });
        }
      }
      
      // Check for late regular season games that might affect preparation
      const week13Games = regularSeasonGames.filter(game => {
        const weekNumber = getWeekNumber(game.date);
        return weekNumber > params.maxRegularSeasonWeek;
      });
      
      if (week13Games.length > 0) {
        score *= 0.9;
        suggestions.push({
          type: 'late_season_congestion',
          priority: 'medium',
          description: `${week13Games.length} games in week ${params.maxRegularSeasonWeek + 1} or later`,
          implementation: 'Move games earlier to allow championship preparation',
          expectedImprovement: 10
        });
      }
      
      return {
        constraintId: 'fb-championship-preparation',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `Championship preparation score: ${(score * 100).toFixed(1)}%`,
        suggestions
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Ensures adequate preparation time for championship game',
      tags: ['football', 'championship', 'temporal', 'preparation']
    },
    cacheable: true,
    priority: 85
  }
];

// Helper functions
function calculateConferenceGamesPerTeam(schedule: Schedule): Map<string, number> {
  const teamGames = new Map<string, number>();
  
  schedule.games
    .filter(g => g.sport === 'Football' && g.type === 'conference')
    .forEach(game => {
      teamGames.set(game.homeTeamId, (teamGames.get(game.homeTeamId) || 0) + 1);
      teamGames.set(game.awayTeamId, (teamGames.get(game.awayTeamId) || 0) + 1);
    });
  
  return teamGames;
}

function getWeekNumber(date: Date): number {
  // Calculate week number in the season
  // This would be based on the season start date
  const seasonStart = new Date('2025-08-30'); // Example season start
  const daysDiff = Math.floor((date.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(daysDiff / 7) + 1;
}

export function getChampionshipConstraints(): UnifiedConstraint[] {
  return championshipConstraints;
}