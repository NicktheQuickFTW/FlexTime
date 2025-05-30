// Baseball and Softball Series-Based Constraints with Weather Intelligence
// Version 2.0 - ML-enhanced with weather prediction and series optimization

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

// ML-enhanced utilities for baseball/softball
class BaseballSoftballMLUtilities {
  // Predict weather impact on game scheduling
  static async predictWeatherImpact(
    venue: string,
    date: Date,
    sport: 'Baseball' | 'Softball'
  ): Promise<{ 
    rainProbability: number; 
    temperatureF: number; 
    windSpeedMph: number;
    playability: number; // 0-1 score
  }> {
    // Simulated ML weather prediction - in production would use weather API + ML model
    const month = date.getMonth() + 1;
    const isNorthern = ['Kansas', 'Kansas State', 'Iowa State', 'Colorado', 'West Virginia'].includes(venue);
    
    let baseRainProb = 0.15;
    let baseTemp = 75;
    
    // Seasonal adjustments
    if (month <= 3 || month >= 11) { // Early spring or late fall
      baseTemp = isNorthern ? 45 : 65;
      baseRainProb = 0.25;
    } else if (month >= 6 && month <= 8) { // Summer
      baseTemp = isNorthern ? 85 : 95;
      baseRainProb = 0.1;
    }
    
    // Add some randomness for simulation
    const rainProbability = Math.min(baseRainProb + (Math.random() * 0.2 - 0.1), 0.9);
    const temperatureF = baseTemp + (Math.random() * 20 - 10);
    const windSpeedMph = Math.random() * 25;
    
    // Calculate playability score
    let playability = 1.0;
    if (rainProbability > 0.5) playability *= 0.3;
    else if (rainProbability > 0.3) playability *= 0.7;
    
    if (temperatureF < 40 || temperatureF > 100) playability *= 0.5;
    else if (temperatureF < 50 || temperatureF > 95) playability *= 0.8;
    
    if (windSpeedMph > 30) playability *= 0.6;
    else if (windSpeedMph > 20) playability *= 0.85;
    
    return {
      rainProbability,
      temperatureF,
      windSpeedMph,
      playability: Math.max(playability, 0.1)
    };
  }

  static calculateSeriesPattern(games: Game[]): {
    isValidSeries: boolean;
    pattern: string;
    issues: string[];
  } {
    if (games.length === 0) return { isValidSeries: false, pattern: 'empty', issues: ['No games in series'] };
    
    // Sort games by date
    const sortedGames = [...games].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Check if all games are at same venue
    const venues = new Set(sortedGames.map(g => g.venueId));
    if (venues.size > 1) {
      return {
        isValidSeries: false,
        pattern: 'split-venue',
        issues: ['Series games at different venues']
      };
    }
    
    // Check consecutive days
    const issues: string[] = [];
    let pattern = `${sortedGames.length}-game`;
    
    for (let i = 1; i < sortedGames.length; i++) {
      const daysBetween = Math.floor(
        (sortedGames[i].date.getTime() - sortedGames[i-1].date.getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      
      if (daysBetween > 1) {
        issues.push(`${daysBetween} days between games ${i} and ${i+1}`);
      }
    }
    
    // Typical patterns: Fri-Sat-Sun for 3-game, Thu-Fri-Sat for weekday start
    const firstDay = sortedGames[0].date.getDay();
    const lastDay = sortedGames[sortedGames.length - 1].date.getDay();
    
    if (sortedGames.length === 3) {
      if (firstDay === 5 && lastDay === 0) pattern += ' (Fri-Sun)';
      else if (firstDay === 4 && lastDay === 6) pattern += ' (Thu-Sat)';
      else pattern += ' (non-standard)';
    } else if (sortedGames.length === 4) {
      if (firstDay === 4 && lastDay === 0) pattern += ' (Thu-Sun)';
      else pattern += ' (non-standard)';
    }
    
    return {
      isValidSeries: issues.length === 0,
      pattern,
      issues
    };
  }

  static analyzeDoubleHeaders(games: Game[]): {
    count: number;
    dates: Date[];
    recommendations: string[];
  } {
    const gamesByDate = new Map<string, Game[]>();
    
    for (const game of games) {
      const dateKey = game.date.toISOString().split('T')[0];
      if (!gamesByDate.has(dateKey)) {
        gamesByDate.set(dateKey, []);
      }
      gamesByDate.get(dateKey)!.push(game);
    }
    
    const doubleHeaderDates: Date[] = [];
    const recommendations: string[] = [];
    
    for (const [dateKey, dayGames] of gamesByDate.entries()) {
      if (dayGames.length >= 2) {
        doubleHeaderDates.push(new Date(dateKey));
        
        // Check if games have appropriate spacing
        const times = dayGames.map(g => {
          const [hours, minutes] = g.time.split(':').map(Number);
          return hours * 60 + minutes;
        }).sort((a, b) => a - b);
        
        for (let i = 1; i < times.length; i++) {
          const gap = times[i] - times[i-1];
          if (gap < 180) { // Less than 3 hours
            recommendations.push(`Games on ${dateKey} too close together (${gap} minutes apart)`);
          }
        }
      }
    }
    
    return {
      count: doubleHeaderDates.length,
      dates: doubleHeaderDates,
      recommendations
    };
  }
}

// Baseball and Softball Constraints
export const baseballSoftballConstraints: UnifiedConstraint[] = [
  {
    id: 'bs-series-integrity',
    name: 'Series Scheduling Integrity',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.HARD,
    weight: 95,
    scope: {
      sports: ['Baseball', 'Softball'],
      conferences: ['Big 12']
    },
    parameters: {
      typicalSeriesLength: 3, // 3-game weekend series
      allowedSeriesLengths: [3, 4], // Some 4-game series allowed
      maxDaysBetweenGames: 1, // Consecutive days preferred
      conferenceSeriesOnly: true
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      // Group games by series (same teams, close dates)
      const seriesMap = new Map<string, Game[]>();
      
      for (const game of schedule.games.filter(g => 
        (g.sport === 'Baseball' || g.sport === 'Softball') &&
        g.type === 'conference'
      )) {
        // Create series key from teams (sorted) and week
        const weekNumber = Math.floor(game.date.getTime() / (7 * 24 * 60 * 60 * 1000));
        const seriesKey = `${[game.homeTeamId, game.awayTeamId].sort().join('-')}_week${weekNumber}`;
        
        if (!seriesMap.has(seriesKey)) {
          seriesMap.set(seriesKey, []);
        }
        seriesMap.get(seriesKey)!.push(game);
      }
      
      // Analyze each series
      for (const [seriesKey, games] of seriesMap.entries()) {
        const analysis = BaseballSoftballMLUtilities.calculateSeriesPattern(games);
        
        if (!analysis.isValidSeries) {
          score *= 0.7;
          violations.push({
            type: 'invalid_series_pattern',
            severity: 'critical',
            affectedEntities: games.map(g => g.id),
            description: `Invalid series: ${analysis.pattern} - ${analysis.issues.join(', ')}`,
            possibleResolutions: [
              'Schedule games on consecutive days',
              'Ensure all games at same venue'
            ]
          });
        }
        
        // Check series length
        if (!params.allowedSeriesLengths.includes(games.length)) {
          score *= 0.8;
          violations.push({
            type: 'non_standard_series_length',
            severity: 'major',
            affectedEntities: games.map(g => g.id),
            description: `Series has ${games.length} games (standard: ${params.typicalSeriesLength})`,
            possibleResolutions: [
              `Adjust to ${params.typicalSeriesLength}-game series`,
              'Add or remove games as needed'
            ]
          });
        }
        
        // Check for split venues (home/away within same series)
        const homeTeams = new Set(games.map(g => g.homeTeamId));
        if (homeTeams.size > 1) {
          score = 0; // Hard violation
          violations.push({
            type: 'split_series_venue',
            severity: 'critical',
            affectedEntities: games.map(g => g.id),
            description: 'Series split between venues (not allowed)',
            possibleResolutions: ['All games must be at same venue']
          });
        }
      }
      
      // Check for incomplete matchups
      const teamMatchups = new Map<string, number>();
      for (const [_, games] of seriesMap.entries()) {
        const matchupKey = [games[0].homeTeamId, games[0].awayTeamId].sort().join('-');
        teamMatchups.set(matchupKey, (teamMatchups.get(matchupKey) || 0) + 1);
      }
      
      for (const [matchup, seriesCount] of teamMatchups.entries()) {
        if (seriesCount !== 2) { // Should have home and away series
          suggestions.push({
            type: 'incomplete_season_series',
            priority: 'high',
            description: `${matchup} has ${seriesCount} series (should have 2)`,
            implementation: seriesCount < 2 ? 'Add missing series' : 'Remove extra series',
            expectedImprovement: 10
          });
        }
      }
      
      return {
        constraintId: 'bs-series-integrity',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : 
          score === 0 ? ConstraintStatus.VIOLATED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: violations.length === 0,
        score,
        message: violations.length === 0 
          ? 'All series properly structured'
          : `Found ${violations.length} series structure violations`,
        violations,
        suggestions,
        confidence: 0.95,
        details: {
          totalSeries: seriesMap.size,
          averageSeriesLength: Array.from(seriesMap.values()).reduce((sum, games) => sum + games.length, 0) / seriesMap.size
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Ensures baseball/softball games are properly organized into series',
      tags: ['baseball', 'softball', 'series', 'structure']
    },
    cacheable: true,
    priority: 95
  },

  {
    id: 'bs-weather-intelligence',
    name: 'Weather-Aware Series Scheduling',
    type: ConstraintType.PERFORMANCE,
    hardness: ConstraintHardness.SOFT,
    weight: 80,
    scope: {
      sports: ['Baseball', 'Softball'],
      conferences: ['Big 12']
    },
    parameters: {
      minPlayabilityScore: 0.6,
      earlySeasonCutoff: '2026-03-15', // Avoid northern venues before this date
      coldWeatherThreshold: 45, // Fahrenheit
      northernVenues: ['Kansas', 'Kansas State', 'Iowa State', 'Colorado', 'West Virginia'],
      makeupGameBuffer: 2 // Days to keep open for potential makeups
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      const startTime = Date.now();
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      const earlySeasonDate = new Date(params.earlySeasonCutoff);
      
      // Analyze early season northern venue games
      const earlyNorthernGames = schedule.games.filter(g => 
        (g.sport === 'Baseball' || g.sport === 'Softball') &&
        g.date < earlySeasonDate &&
        params.northernVenues.some(nv => g.venueId.includes(nv))
      );
      
      if (earlyNorthernGames.length > 0) {
        score *= 0.8;
        violations.push({
          type: 'early_season_cold_venue',
          severity: 'major',
          affectedEntities: earlyNorthernGames.map(g => g.id),
          description: `${earlyNorthernGames.length} games at northern venues before ${params.earlySeasonCutoff}`,
          possibleResolutions: [
            'Move games to warmer venues',
            'Reschedule after March 15'
          ]
        });
      }
      
      // Analyze weather impact for all series
      const seriesMap = new Map<string, Game[]>();
      for (const game of schedule.games.filter(g => 
        g.sport === 'Baseball' || g.sport === 'Softball'
      )) {
        const weekNumber = Math.floor(game.date.getTime() / (7 * 24 * 60 * 60 * 1000));
        const seriesKey = `${game.venueId}_week${weekNumber}`;
        
        if (!seriesMap.has(seriesKey)) {
          seriesMap.set(seriesKey, []);
        }
        seriesMap.get(seriesKey)!.push(game);
      }
      
      // Check weather predictions for each series
      for (const [seriesKey, games] of seriesMap.entries()) {
        const venue = games[0].venueId;
        let seriesPlayability = 0;
        
        for (const game of games) {
          const weather = await BaseballSoftballMLUtilities.predictWeatherImpact(
            venue,
            game.date,
            game.sport as 'Baseball' | 'Softball'
          );
          
          seriesPlayability += weather.playability;
          
          if (weather.playability < params.minPlayabilityScore) {
            score *= 0.9;
            suggestions.push({
              type: 'poor_weather_forecast',
              priority: 'medium',
              description: `${venue} on ${game.date.toDateString()} has low playability (${(weather.playability * 100).toFixed(0)}%)`,
              implementation: 'Consider dome venue or date change',
              expectedImprovement: 15
            });
          }
        }
        
        // Check if series has high rain risk
        const avgPlayability = seriesPlayability / games.length;
        if (avgPlayability < 0.7) {
          suggestions.push({
            type: 'series_weather_risk',
            priority: 'high',
            description: `Series at ${venue} has high weather risk (${(avgPlayability * 100).toFixed(0)}% avg playability)`,
            implementation: 'Build in makeup dates or relocate series',
            expectedImprovement: 20
          });
        }
      }
      
      // Check for makeup game buffers
      const weekendSeries = Array.from(seriesMap.values()).filter(games => 
        games.some(g => g.date.getDay() === 5) // Friday start
      );
      
      for (const series of weekendSeries) {
        const lastGameDate = new Date(Math.max(...series.map(g => g.date.getTime())));
        const nextMonday = new Date(lastGameDate);
        nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()) % 7);
        
        const hasBufferDay = !schedule.games.some(g => 
          (g.sport === 'Baseball' || g.sport === 'Softball') &&
          g.date.toDateString() === nextMonday.toDateString() &&
          series.some(sg => sg.homeTeamId === g.homeTeamId || sg.awayTeamId === g.awayTeamId)
        );
        
        if (!hasBufferDay) {
          score *= 0.95;
          suggestions.push({
            type: 'no_makeup_buffer',
            priority: 'low',
            description: `No Monday buffer after weekend series at ${series[0].venueId}`,
            implementation: 'Keep Monday open for potential makeup games',
            expectedImprovement: 5
          });
        }
      }
      
      const executionTime = Date.now() - startTime;
      
      return {
        constraintId: 'bs-weather-intelligence',
        status: score > 0.8 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.8,
        score,
        message: `Weather optimization score: ${(score * 100).toFixed(1)}%`,
        violations,
        suggestions,
        executionTime,
        confidence: 0.7, // Weather predictions have uncertainty
        details: {
          earlyNorthernGames: earlyNorthernGames.length,
          totalSeries: seriesMap.size,
          averageSeriesSize: Array.from(seriesMap.values()).reduce((sum, games) => sum + games.length, 0) / seriesMap.size
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Optimizes scheduling based on weather patterns and venue locations',
      tags: ['baseball', 'softball', 'weather', 'ml-enhanced']
    },
    cacheable: false, // Weather data changes
    parallelizable: true,
    priority: 80
  },

  {
    id: 'bs-travel-optimization',
    name: 'Series Travel and Rest Optimization',
    type: ConstraintType.PERFORMANCE,
    hardness: ConstraintHardness.SOFT,
    weight: 75,
    scope: {
      sports: ['Baseball', 'Softball'],
      conferences: ['Big 12']
    },
    parameters: {
      minDaysBetweenSeries: 2, // Travel day + rest day
      maxConsecutiveWeekendSeries: 4, // Before requiring a bye
      idealHomeAwayRatio: 0.5,
      maxBusDistance: 400 // Miles for bus travel
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      // Analyze each team's travel schedule
      for (const team of schedule.teams.filter(t => t.conference === 'Big 12')) {
        const teamGames = schedule.games
          .filter(g => 
            (g.sport === 'Baseball' || g.sport === 'Softball') &&
            (g.homeTeamId === team.id || g.awayTeamId === team.id))
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        // Group into series
        const teamSeries: Game[][] = [];
        let currentSeries: Game[] = [];
        
        for (const game of teamGames) {
          if (currentSeries.length === 0) {
            currentSeries.push(game);
          } else {
            const daysSinceLast = (game.date.getTime() - currentSeries[currentSeries.length - 1].date.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceLast <= 2 && 
                game.homeTeamId === currentSeries[0].homeTeamId &&
                game.awayTeamId === currentSeries[0].awayTeamId) {
              currentSeries.push(game);
            } else {
              teamSeries.push(currentSeries);
              currentSeries = [game];
            }
          }
        }
        if (currentSeries.length > 0) teamSeries.push(currentSeries);
        
        // Check rest between series
        for (let i = 1; i < teamSeries.length; i++) {
          const prevSeriesEnd = teamSeries[i-1][teamSeries[i-1].length - 1].date;
          const nextSeriesStart = teamSeries[i][0].date;
          const daysBetween = (nextSeriesStart.getTime() - prevSeriesEnd.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysBetween < params.minDaysBetweenSeries) {
            violations.push({
              type: 'insufficient_rest_between_series',
              severity: 'major',
              affectedEntities: [team.id, ...teamSeries[i].map(g => g.id)],
              description: `${team.name} has only ${daysBetween.toFixed(0)} days between series`,
              possibleResolutions: ['Add travel/rest days between series']
            });
            score *= 0.85;
          }
        }
        
        // Check consecutive weekend series
        let consecutiveWeekends = 0;
        for (const series of teamSeries) {
          if (series.some(g => g.date.getDay() === 5)) { // Friday start = weekend series
            consecutiveWeekends++;
            if (consecutiveWeekends > params.maxConsecutiveWeekendSeries) {
              suggestions.push({
                type: 'excessive_consecutive_weekends',
                priority: 'medium',
                description: `${team.name} has ${consecutiveWeekends} consecutive weekend series`,
                implementation: 'Insert bye weekend or midweek series',
                expectedImprovement: 10
              });
              score *= 0.9;
            }
          } else {
            consecutiveWeekends = 0; // Reset counter
          }
        }
        
        // Check home/away balance
        const homeSeries = teamSeries.filter(s => s[0].homeTeamId === team.id);
        const awaySeries = teamSeries.filter(s => s[0].awayTeamId === team.id);
        const homeRatio = homeSeries.length / teamSeries.length;
        
        if (Math.abs(homeRatio - params.idealHomeAwayRatio) > 0.15) {
          score *= 0.9;
          suggestions.push({
            type: 'imbalanced_home_away_series',
            priority: 'medium',
            description: `${team.name} has ${(homeRatio * 100).toFixed(0)}% home series (ideal: 50%)`,
            implementation: 'Balance home and away series assignments',
            expectedImprovement: 10
          });
        }
      }
      
      // Analyze doubleheaders
      for (const team of schedule.teams.filter(t => t.conference === 'Big 12')) {
        const teamGames = schedule.games.filter(g => 
          (g.sport === 'Baseball' || g.sport === 'Softball') &&
          (g.homeTeamId === team.id || g.awayTeamId === team.id)
        );
        
        const doubleHeaderAnalysis = BaseballSoftballMLUtilities.analyzeDoubleHeaders(teamGames);
        
        if (doubleHeaderAnalysis.recommendations.length > 0) {
          score *= 0.95;
          suggestions.push({
            type: 'doubleheader_issues',
            priority: 'low',
            description: `${team.name} has ${doubleHeaderAnalysis.count} doubleheaders with issues`,
            implementation: doubleHeaderAnalysis.recommendations.join('; '),
            expectedImprovement: 5
          });
        }
      }
      
      return {
        constraintId: 'bs-travel-optimization',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: violations.length === 0,
        score,
        message: `Travel optimization score: ${(score * 100).toFixed(1)}%`,
        violations,
        suggestions,
        confidence: 0.88
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Optimizes travel patterns and rest between series',
      tags: ['baseball', 'softball', 'travel', 'rest']
    },
    cacheable: true,
    parallelizable: true,
    priority: 75
  },

  {
    id: 'bs-tournament-qualification',
    name: 'Tournament Qualification Window',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.HARD,
    weight: 90,
    scope: {
      sports: ['Baseball', 'Softball'],
      conferences: ['Big 12']
    },
    parameters: {
      baseballTournamentDate: '2026-05-20', // Approximate
      softballTournamentDate: '2026-05-07', // Earlier than baseball
      regularSeasonBuffer: 7, // Days before tournament
      minimumConferenceGames: 24 // Per team
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      
      // Check Baseball tournament timing
      const baseballTournament = new Date(params.baseballTournamentDate);
      const baseballCutoff = new Date(baseballTournament);
      baseballCutoff.setDate(baseballCutoff.getDate() - params.regularSeasonBuffer);
      
      const lateBaseballGames = schedule.games.filter(g => 
        g.sport === 'Baseball' &&
        g.type === 'conference' &&
        g.date > baseballCutoff
      );
      
      if (lateBaseballGames.length > 0) {
        violations.push({
          type: 'late_baseball_games',
          severity: 'critical',
          affectedEntities: lateBaseballGames.map(g => g.id),
          description: `${lateBaseballGames.length} baseball games after tournament cutoff`,
          possibleResolutions: ['Move games before tournament buffer period']
        });
      }
      
      // Check Softball tournament timing
      const softballTournament = new Date(params.softballTournamentDate);
      const softballCutoff = new Date(softballTournament);
      softballCutoff.setDate(softballCutoff.getDate() - params.regularSeasonBuffer);
      
      const lateSoftballGames = schedule.games.filter(g => 
        g.sport === 'Softball' &&
        g.type === 'conference' &&
        g.date > softballCutoff
      );
      
      if (lateSoftballGames.length > 0) {
        violations.push({
          type: 'late_softball_games',
          severity: 'critical',
          affectedEntities: lateSoftballGames.map(g => g.id),
          description: `${lateSoftballGames.length} softball games after tournament cutoff`,
          possibleResolutions: ['Move games before tournament buffer period']
        });
      }
      
      // Verify minimum conference games
      const teamConferenceGames = new Map<string, number>();
      
      for (const game of schedule.games.filter(g => 
        (g.sport === 'Baseball' || g.sport === 'Softball') &&
        g.type === 'conference'
      )) {
        const sport = game.sport;
        teamConferenceGames.set(
          `${game.homeTeamId}_${sport}`,
          (teamConferenceGames.get(`${game.homeTeamId}_${sport}`) || 0) + 1
        );
        teamConferenceGames.set(
          `${game.awayTeamId}_${sport}`,
          (teamConferenceGames.get(`${game.awayTeamId}_${sport}`) || 0) + 1
        );
      }
      
      for (const [teamSport, gameCount] of teamConferenceGames.entries()) {
        if (gameCount < params.minimumConferenceGames) {
          const [teamId, sport] = teamSport.split('_');
          violations.push({
            type: 'insufficient_conference_games',
            severity: 'critical',
            affectedEntities: [teamId],
            description: `${teamId} has only ${gameCount} ${sport} conference games (minimum: ${params.minimumConferenceGames})`,
            possibleResolutions: ['Add more conference games']
          });
        }
      }
      
      return {
        constraintId: 'bs-tournament-qualification',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'Tournament qualification requirements met'
          : `Found ${violations.length} tournament qualification violations`,
        violations,
        confidence: 1.0
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Ensures proper scheduling for tournament qualification',
      tags: ['baseball', 'softball', 'tournament', 'temporal']
    },
    cacheable: true,
    priority: 90
  }
];

// Export helper function
export function getBaseballSoftballConstraints(): UnifiedConstraint[] {
  return baseballSoftballConstraints;
}

// Export ML utilities
export { BaseballSoftballMLUtilities };