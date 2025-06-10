// Softball Constraints - Big 12 Conference
// Comprehensive softball scheduling constraints

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

export const softballConstraints: UnifiedConstraint[] = [
  {
    id: 'softball-series-format',
    name: 'Softball Series Format',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.HARD,
    weight: 95,
    scope: {
      sports: ['Softball'],
      conferences: ['Big 12']
    },
    parameters: {
      seriesLength: 3,
      seriesDays: ['Friday', 'Saturday', 'Sunday'],
      doublehaderDays: ['Saturday'], // Common for softball
      gameTimesPattern: {
        friday: ['18:00', '18:30'],
        saturday: ['13:00', '16:00'], // Doubleheader
        sunday: ['12:00', '13:00']
      },
      conferenceGames: 24, // 8 series of 3 games
      midweekAllowed: true, // More common in softball
      teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Houston', 'Iowa State', 
              'Kansas', 'Oklahoma State', 'Texas Tech', 'UCF', 'Utah']
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      
      const softballGames = schedule.games.filter(g => g.sport === 'Softball');
      const conferenceGames = softballGames.filter(g => g.type === 'conference');
      
      // Group into series
      const seriesMap = new Map<string, Game[]>();
      conferenceGames.forEach(game => {
        const weekStart = getWeekStart(game.date);
        const seriesKey = `${[game.homeTeamId, game.awayTeamId].sort().join('-')}_${weekStart}`;
        
        if (!seriesMap.has(seriesKey)) {
          seriesMap.set(seriesKey, []);
        }
        seriesMap.get(seriesKey)!.push(game);
      });
      
      // Validate series structure
      seriesMap.forEach((games, seriesKey) => {
        const sortedGames = games.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        if (games.length !== params.seriesLength) {
          violations.push({
            type: 'incorrect_series_length',
            severity: 'critical',
            affectedEntities: games.map(g => g.id),
            description: `Series has ${games.length} games instead of ${params.seriesLength}`,
            possibleResolutions: ['Adjust to standard 3-game series']
          });
        }
        
        // Check for Saturday doubleheader pattern
        const saturdayGames = games.filter(g => g.date.getDay() === 6);
        if (saturdayGames.length === 2) {
          // Verify proper doubleheader timing
          const times = saturdayGames.map(g => parseInt(g.time.replace(':', '')));
          const timeDiff = Math.abs(times[1] - times[0]);
          
          if (timeDiff < 230 || timeDiff > 400) { // 2.5-4 hours apart
            violations.push({
              type: 'improper_doubleheader_spacing',
              severity: 'major',
              affectedEntities: saturdayGames.map(g => g.id),
              description: 'Doubleheader games not properly spaced',
              possibleResolutions: ['Space games 3 hours apart']
            });
          }
        }
      });
      
      // Check team game counts
      const teamGameCounts = new Map<string, number>();
      conferenceGames.forEach(game => {
        teamGameCounts.set(game.homeTeamId, (teamGameCounts.get(game.homeTeamId) || 0) + 1);
        teamGameCounts.set(game.awayTeamId, (teamGameCounts.get(game.awayTeamId) || 0) + 1);
      });
      
      teamGameCounts.forEach((count, team) => {
        if (params.teams.includes(team) && count !== params.conferenceGames) {
          violations.push({
            type: 'incorrect_game_count',
            severity: 'critical',
            affectedEntities: [team],
            description: `${team} has ${count} conference games (should be ${params.conferenceGames})`,
            possibleResolutions: ['Adjust conference schedule']
          });
        }
      });
      
      return {
        constraintId: 'softball-series-format',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'Softball series format satisfied'
          : `Found ${violations.length} format violations`,
        violations
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Ensures proper softball series format with doubleheaders',
      tags: ['softball', 'series', 'format', 'doubleheader']
    },
    cacheable: true,
    priority: 95
  },

  {
    id: 'softball-weather-considerations',
    name: 'Softball Weather and Field Conditions',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.SOFT,
    weight: 85,
    scope: {
      sports: ['Softball'],
      conferences: ['Big 12']
    },
    parameters: {
      seasonStart: '2026-02-06', // Earlier than baseball
      conferenceStart: '2026-03-13',
      coldWeatherMinTemp: 40, // Slightly lower than baseball
      turfFields: ['Oklahoma State', 'Houston'], // All-weather surfaces
      earlySeasonWarmVenues: ['Arizona', 'Arizona State', 'Houston', 'Texas Tech', 'Baylor'],
      rainoutConcerns: {
        highRisk: ['Houston', 'Cincinnati', 'UCF'],
        moderate: ['Kansas', 'Iowa State', 'Baylor']
      }
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      const softballGames = schedule.games.filter(g => g.sport === 'Softball');
      
      // Check early season scheduling
      const februaryGames = softballGames.filter(g => g.date.getMonth() === 1);
      const warmVenueFebruaryGames = februaryGames.filter(g => 
        params.earlySeasonWarmVenues.includes(g.homeTeamId) ||
        params.turfFields.includes(g.homeTeamId)
      );
      
      const warmRatio = februaryGames.length > 0 
        ? warmVenueFebruaryGames.length / februaryGames.length 
        : 1;
      
      if (warmRatio < 0.75) {
        score *= 0.85;
        suggestions.push({
          type: 'cold_weather_risk',
          priority: 'high',
          description: `Only ${(warmRatio * 100).toFixed(0)}% of February games at warm/turf venues`,
          implementation: 'Schedule more early games at suitable venues',
          expectedImprovement: 15
        });
      }
      
      // Check high rain-risk scheduling
      const aprilGames = softballGames.filter(g => g.date.getMonth() === 3);
      const highRainRiskGames = aprilGames.filter(g => 
        params.rainoutConcerns.highRisk.includes(g.homeTeamId)
      );
      
      if (highRainRiskGames.length > aprilGames.length * 0.3) {
        score *= 0.9;
        suggestions.push({
          type: 'excessive_rainout_risk',
          priority: 'medium',
          description: 'Too many April games in high rain-risk locations',
          implementation: 'Balance schedule to reduce weather delays',
          expectedImprovement: 10
        });
      }
      
      // Check turf field utilization for flexibility
      const turfUtilization = softballGames.filter(g => 
        params.turfFields.includes(g.homeTeamId)
      ).length / softballGames.length;
      
      if (turfUtilization < 0.15) {
        score *= 0.95;
        suggestions.push({
          type: 'underutilized_turf_fields',
          priority: 'low',
          description: 'Turf fields underutilized for weather flexibility',
          implementation: 'Schedule more games at all-weather facilities',
          expectedImprovement: 5
        });
      }
      
      return {
        constraintId: 'softball-weather-considerations',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `Weather consideration score: ${(score * 100).toFixed(1)}%`,
        suggestions,
        details: {
          warmVenueRatio: (warmRatio * 100).toFixed(1) + '%',
          turfFieldUtilization: (turfUtilization * 100).toFixed(1) + '%'
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Manages weather-related scheduling for softball',
      tags: ['softball', 'weather', 'field-conditions']
    },
    cacheable: true,
    priority: 85
  },

  {
    id: 'softball-tournament-prep',
    name: 'Big 12 Softball Championship Preparation',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.SOFT,
    weight: 80,
    scope: {
      sports: ['Softball'],
      conferences: ['Big 12']
    },
    parameters: {
      regularSeasonEnd: '2026-05-10',
      championshipDates: {
        start: '2026-05-14',
        end: '2026-05-16'
      },
      championshipVenue: 'USA Softball Hall of Fame Stadium',
      minRestDays: 3,
      lastWeekGameLimit: 3 // Limit games in final week
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      const softballGames = schedule.games.filter(g => g.sport === 'Softball');
      
      // Check regular season end
      const lateGames = softballGames.filter(g => 
        g.type === 'conference' &&
        g.date > new Date(params.regularSeasonEnd)
      );
      
      if (lateGames.length > 0) {
        score *= 0.8;
        suggestions.push({
          type: 'late_regular_season',
          priority: 'high',
          description: `${lateGames.length} games after regular season deadline`,
          implementation: 'Complete regular season by May 10',
          expectedImprovement: 20
        });
      }
      
      // Check final week load
      const finalWeekStart = new Date(params.regularSeasonEnd);
      finalWeekStart.setDate(finalWeekStart.getDate() - 7);
      
      const teamFinalWeekGames = new Map<string, number>();
      softballGames
        .filter(g => g.date >= finalWeekStart && g.date <= new Date(params.regularSeasonEnd))
        .forEach(game => {
          [game.homeTeamId, game.awayTeamId].forEach(team => {
            teamFinalWeekGames.set(team, (teamFinalWeekGames.get(team) || 0) + 1);
          });
        });
      
      let overloadedTeams = 0;
      teamFinalWeekGames.forEach((games, team) => {
        if (games > params.lastWeekGameLimit) {
          overloadedTeams++;
        }
      });
      
      if (overloadedTeams > 2) {
        score *= 0.9;
        suggestions.push({
          type: 'final_week_overload',
          priority: 'medium',
          description: `${overloadedTeams} teams have too many final week games`,
          implementation: 'Reduce final week game load for rest',
          expectedImprovement: 10
        });
      }
      
      // Check rest before championship
      const restDays = Math.floor(
        (new Date(params.championshipDates.start).getTime() - 
         new Date(params.regularSeasonEnd).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (restDays < params.minRestDays) {
        score *= 0.85;
        suggestions.push({
          type: 'insufficient_championship_rest',
          priority: 'high',
          description: `Only ${restDays} days rest before championship`,
          implementation: 'Ensure adequate rest before tournament',
          expectedImprovement: 15
        });
      }
      
      return {
        constraintId: 'softball-tournament-prep',
        status: score > 0.8 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.8,
        score,
        message: `Tournament preparation score: ${(score * 100).toFixed(1)}%`,
        suggestions
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Ensures proper preparation for Big 12 Championship',
      tags: ['softball', 'tournament', 'championship', 'preparation']
    },
    cacheable: true,
    priority: 80
  }
];

// Helper function
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export function getSoftballConstraints(): UnifiedConstraint[] {
  return softballConstraints;
}