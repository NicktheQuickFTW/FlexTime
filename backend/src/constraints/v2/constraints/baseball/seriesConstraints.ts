// Baseball Series Constraints - Big 12 Conference
// Manages series-based scheduling for baseball

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

export const seriesConstraints: UnifiedConstraint[] = [
  {
    id: 'baseball-series-structure',
    name: 'Baseball Series Structure',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.HARD,
    weight: 95,
    scope: {
      sports: ['Baseball'],
      conferences: ['Big 12']
    },
    parameters: {
      seriesLength: 3, // Standard 3-game weekend series
      seriesDays: ['Friday', 'Saturday', 'Sunday'],
      seriesTimes: {
        friday: ['18:30', '19:00'],
        saturday: ['13:00', '14:00', '18:00'],
        sunday: ['13:00', '14:00']
      },
      conferenceSeriesCount: 10, // 30 conference games = 10 series
      allowMidweekConference: false,
      minDaysBetweenSeries: 3
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      
      // Group games into series
      const seriesMap = new Map<string, Game[]>();
      
      const baseballGames = schedule.games
        .filter(g => g.sport === 'Baseball' && g.type === 'conference')
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      baseballGames.forEach(game => {
        // Create series key based on teams and week
        const weekStart = getWeekStart(game.date);
        const seriesKey = `${[game.homeTeamId, game.awayTeamId].sort().join('-')}_${weekStart}`;
        
        if (!seriesMap.has(seriesKey)) {
          seriesMap.set(seriesKey, []);
        }
        seriesMap.get(seriesKey)!.push(game);
      });
      
      // Validate each series
      seriesMap.forEach((games, seriesKey) => {
        const [teams, weekStr] = seriesKey.split('_');
        const [team1, team2] = teams.split('-');
        
        // Check series length
        if (games.length !== params.seriesLength) {
          violations.push({
            type: 'incorrect_series_length',
            severity: 'critical',
            affectedEntities: games.map(g => g.id),
            description: `${team1} vs ${team2} series has ${games.length} games (should be ${params.seriesLength})`,
            possibleResolutions: ['Adjust series to standard 3-game format']
          });
        }
        
        // Check consecutive days
        const sortedGames = games.sort((a, b) => a.date.getTime() - b.date.getTime());
        for (let i = 1; i < sortedGames.length; i++) {
          const daysBetween = Math.floor(
            (sortedGames[i].date.getTime() - sortedGames[i-1].date.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysBetween !== 1) {
            violations.push({
              type: 'non_consecutive_series_games',
              severity: 'critical',
              affectedEntities: [sortedGames[i-1].id, sortedGames[i].id],
              description: `${daysBetween} days between series games`,
              possibleResolutions: ['Schedule series games on consecutive days']
            });
          }
        }
        
        // Check proper days of week
        games.forEach(game => {
          const dayName = getDayName(game.date.getDay());
          if (!params.seriesDays.includes(dayName)) {
            violations.push({
              type: 'invalid_series_day',
              severity: 'major',
              affectedEntities: [game.id],
              description: `Conference game scheduled on ${dayName}`,
              possibleResolutions: ['Move to Friday-Sunday weekend series']
            });
          }
          
          // Check game times
          const dayKey = dayName.toLowerCase() as keyof typeof params.seriesTimes;
          const validTimes = params.seriesTimes[dayKey];
          if (validTimes && !validTimes.includes(game.time)) {
            violations.push({
              type: 'non_standard_game_time',
              severity: 'minor',
              affectedEntities: [game.id],
              description: `Game at ${game.time} not in standard times for ${dayName}`,
              possibleResolutions: ['Use standard conference game times']
            });
          }
        });
        
        // Check all games at same venue
        const venues = new Set(games.map(g => g.venueId));
        if (venues.size > 1) {
          violations.push({
            type: 'split_venue_series',
            severity: 'critical',
            affectedEntities: games.map(g => g.id),
            description: 'Series games at different venues',
            possibleResolutions: ['Host entire series at single venue']
          });
        }
      });
      
      // Check team series counts
      const teamSeriesCount = new Map<string, number>();
      seriesMap.forEach((games, seriesKey) => {
        const homeTeam = games[0].homeTeamId;
        const awayTeam = games[0].awayTeamId;
        
        teamSeriesCount.set(homeTeam, (teamSeriesCount.get(homeTeam) || 0) + 0.5);
        teamSeriesCount.set(awayTeam, (teamSeriesCount.get(awayTeam) || 0) + 0.5);
      });
      
      teamSeriesCount.forEach((count, team) => {
        if (Math.abs(count - params.conferenceSeriesCount) > 0.1) {
          violations.push({
            type: 'incorrect_series_count',
            severity: 'critical',
            affectedEntities: [team],
            description: `${team} has ${count} conference series (should be ${params.conferenceSeriesCount})`,
            possibleResolutions: ['Adjust conference series assignments']
          });
        }
      });
      
      return {
        constraintId: 'baseball-series-structure',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'Series structure requirements satisfied'
          : `Found ${violations.length} series violations`,
        violations,
        details: {
          totalSeries: seriesMap.size,
          averageGamesPerSeries: baseballGames.length / (seriesMap.size || 1)
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Ensures proper 3-game weekend series structure',
      tags: ['baseball', 'series', 'structure', 'conference']
    },
    cacheable: true,
    priority: 95
  },

  {
    id: 'baseball-series-spacing',
    name: 'Series Spacing and Balance',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.SOFT,
    weight: 80,
    scope: {
      sports: ['Baseball'],
      conferences: ['Big 12']
    },
    parameters: {
      minWeeksBetweenSameOpponent: 4,
      maxConsecutiveHomeSeries: 2,
      maxConsecutiveAwaySeries: 2,
      idealHomeAwayBalance: 0.5,
      midweekGameLimit: 6, // Non-conference midweek games
      examWeekBlackout: ['2026-05-04', '2026-05-10'] // Finals week
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      // Track team patterns
      const teamPatterns = new Map<string, {
        homeSeries: number;
        awaySeries: number;
        consecutiveHome: number;
        consecutiveAway: number;
        maxConsecHome: number;
        maxConsecAway: number;
        opponentLastPlayed: Map<string, Date>;
      }>();
      
      // Group games into series
      const seriesList = groupIntoSeries(schedule.games.filter(g => g.sport === 'Baseball'));
      
      // Analyze each team's series pattern
      seriesList.forEach(series => {
        const homeTeam = series.games[0].homeTeamId;
        const awayTeam = series.games[0].awayTeamId;
        const seriesDate = series.games[0].date;
        
        // Initialize team data
        [homeTeam, awayTeam].forEach(team => {
          if (!teamPatterns.has(team)) {
            teamPatterns.set(team, {
              homeSeries: 0,
              awaySeries: 0,
              consecutiveHome: 0,
              consecutiveAway: 0,
              maxConsecHome: 0,
              maxConsecAway: 0,
              opponentLastPlayed: new Map()
            });
          }
        });
        
        const homeData = teamPatterns.get(homeTeam)!;
        const awayData = teamPatterns.get(awayTeam)!;
        
        // Update series counts
        homeData.homeSeries++;
        homeData.consecutiveHome++;
        homeData.consecutiveAway = 0;
        homeData.maxConsecHome = Math.max(homeData.maxConsecHome, homeData.consecutiveHome);
        
        awayData.awaySeries++;
        awayData.consecutiveAway++;
        awayData.consecutiveHome = 0;
        awayData.maxConsecAway = Math.max(awayData.maxConsecAway, awayData.consecutiveAway);
        
        // Check opponent spacing
        if (homeData.opponentLastPlayed.has(awayTeam)) {
          const lastPlayed = homeData.opponentLastPlayed.get(awayTeam)!;
          const weeksBetween = Math.floor(
            (seriesDate.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24 * 7)
          );
          
          if (weeksBetween < params.minWeeksBetweenSameOpponent) {
            score *= 0.9;
            violations.push({
              type: 'insufficient_opponent_spacing',
              severity: 'major',
              affectedEntities: series.games.map(g => g.id),
              description: `${homeTeam} plays ${awayTeam} again after only ${weeksBetween} weeks`,
              possibleResolutions: ['Increase spacing between repeat matchups']
            });
          }
        }
        
        homeData.opponentLastPlayed.set(awayTeam, seriesDate);
        awayData.opponentLastPlayed.set(homeTeam, seriesDate);
      });
      
      // Check patterns for each team
      teamPatterns.forEach((data, team) => {
        // Check consecutive home/away limits
        if (data.maxConsecHome > params.maxConsecutiveHomeSeries) {
          score *= 0.9;
          violations.push({
            type: 'excessive_consecutive_home',
            severity: 'major',
            affectedEntities: [team],
            description: `${team} has ${data.maxConsecHome} consecutive home series`,
            possibleResolutions: ['Insert away series to break streak']
          });
        }
        
        if (data.maxConsecAway > params.maxConsecutiveAwaySeries) {
          score *= 0.9;
          violations.push({
            type: 'excessive_consecutive_away',
            severity: 'major',
            affectedEntities: [team],
            description: `${team} has ${data.maxConsecAway} consecutive away series`,
            possibleResolutions: ['Insert home series to break streak']
          });
        }
        
        // Check home/away balance
        const totalSeries = data.homeSeries + data.awaySeries;
        const homeRatio = totalSeries > 0 ? data.homeSeries / totalSeries : 0;
        
        if (Math.abs(homeRatio - params.idealHomeAwayBalance) > 0.1) {
          score *= 0.95;
          suggestions.push({
            type: 'home_away_imbalance',
            priority: 'medium',
            description: `${team} has ${(homeRatio * 100).toFixed(0)}% home series`,
            implementation: 'Balance home and away series assignments',
            expectedImprovement: 5
          });
        }
      });
      
      // Check exam week conflicts
      const examWeekGames = schedule.games.filter(g => 
        g.sport === 'Baseball' &&
        params.examWeekBlackout.some(date => 
          g.date.toISOString().split('T')[0] === date
        )
      );
      
      if (examWeekGames.length > 0) {
        score *= 0.85;
        violations.push({
          type: 'exam_week_conflict',
          severity: 'major',
          affectedEntities: examWeekGames.map(g => g.id),
          description: `${examWeekGames.length} games scheduled during finals week`,
          possibleResolutions: ['Move games outside exam period']
        });
      }
      
      // Check midweek game distribution
      const midweekGames = schedule.games.filter(g => 
        g.sport === 'Baseball' &&
        g.type === 'non-conference' &&
        [2, 3, 4].includes(g.date.getDay()) // Tuesday, Wednesday, Thursday
      );
      
      if (midweekGames.length > params.midweekGameLimit * 14) { // 14 teams
        score *= 0.95;
        suggestions.push({
          type: 'excessive_midweek_games',
          priority: 'low',
          description: 'Too many midweek non-conference games',
          implementation: 'Reduce midweek game load for player rest',
          expectedImprovement: 5
        });
      }
      
      return {
        constraintId: 'baseball-series-spacing',
        status: violations.length === 0 && score > 0.85 ? ConstraintStatus.SATISFIED : 
                violations.length > 0 ? ConstraintStatus.VIOLATED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: violations.length === 0 && score > 0.85,
        score,
        message: `Series spacing score: ${(score * 100).toFixed(1)}%`,
        violations,
        suggestions
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Ensures proper spacing and balance of baseball series',
      tags: ['baseball', 'series', 'spacing', 'balance']
    },
    cacheable: true,
    priority: 80
  },

  {
    id: 'baseball-travel-optimization',
    name: 'Baseball Travel Optimization',
    type: ConstraintType.SPATIAL,
    hardness: ConstraintHardness.SOFT,
    weight: 75,
    scope: {
      sports: ['Baseball'],
      conferences: ['Big 12']
    },
    parameters: {
      maxTravelMilesPerSeries: 1500,
      regionalPods: {
        'Southwest': ['Texas Tech', 'TCU', 'Baylor', 'Houston'],
        'Central': ['Kansas', 'Kansas State', 'Oklahoma State'],
        'Mountain': ['Arizona', 'Arizona State', 'Utah', 'BYU'],
        'East': ['Cincinnati', 'West Virginia', 'UCF']
      },
      travelPartners: {
        'Arizona': 'Arizona State',
        'Arizona State': 'Arizona',
        'Kansas': 'Kansas State',
        'Kansas State': 'Kansas'
      },
      preferredTravelDays: ['Thursday'], // For Friday series starts
      busDistanceThreshold: 400 // Miles for bus travel
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      // Group games into series
      const seriesList = groupIntoSeries(
        schedule.games.filter(g => g.sport === 'Baseball' && g.type === 'conference')
      );
      
      // Analyze travel for each series
      let totalTravelMiles = 0;
      let longTrips = 0;
      let busTrips = 0;
      let flightTrips = 0;
      
      seriesList.forEach(series => {
        const awayTeam = series.games[0].awayTeamId;
        const homeTeam = series.games[0].homeTeamId;
        const distance = calculateTeamDistance(awayTeam, homeTeam);
        
        totalTravelMiles += distance * 2; // Round trip
        
        if (distance > params.maxTravelMilesPerSeries) {
          longTrips++;
          score *= 0.95;
          suggestions.push({
            type: 'excessive_series_travel',
            priority: 'medium',
            description: `${awayTeam} travels ${distance} miles to ${homeTeam}`,
            implementation: 'Consider regional scheduling or neutral sites',
            expectedImprovement: 5
          });
        }
        
        if (distance <= params.busDistanceThreshold) {
          busTrips++;
        } else {
          flightTrips++;
        }
      });
      
      // Check regional pod utilization
      let intraRegionalSeries = 0;
      let interRegionalSeries = 0;
      
      seriesList.forEach(series => {
        const homeTeam = series.games[0].homeTeamId;
        const awayTeam = series.games[0].awayTeamId;
        let sameRegion = false;
        
        for (const [region, teams] of Object.entries(params.regionalPods)) {
          if (teams.includes(homeTeam) && teams.includes(awayTeam)) {
            sameRegion = true;
            break;
          }
        }
        
        if (sameRegion) {
          intraRegionalSeries++;
        } else {
          interRegionalSeries++;
        }
      });
      
      const regionalRatio = intraRegionalSeries / (seriesList.length || 1);
      if (regionalRatio < 0.4) {
        score *= 0.9;
        suggestions.push({
          type: 'poor_regional_scheduling',
          priority: 'medium',
          description: `Only ${(regionalRatio * 100).toFixed(0)}% of series are intra-regional`,
          implementation: 'Increase regional matchups to reduce travel',
          expectedImprovement: 10
        });
      }
      
      // Check travel partner utilization
      let travelPartnerSeries = 0;
      
      Object.entries(params.travelPartners).forEach(([team1, team2]) => {
        const hasSeries = seriesList.some(series => 
          (series.games[0].homeTeamId === team1 && series.games[0].awayTeamId === team2) ||
          (series.games[0].homeTeamId === team2 && series.games[0].awayTeamId === team1)
        );
        if (hasSeries) travelPartnerSeries++;
      });
      
      if (travelPartnerSeries < Object.keys(params.travelPartners).length / 2) {
        score *= 0.95;
        suggestions.push({
          type: 'underutilized_travel_partners',
          priority: 'low',
          description: 'Not all travel partners play each other',
          implementation: 'Schedule travel partner matchups',
          expectedImprovement: 5
        });
      }
      
      // Travel efficiency score
      const avgTravelPerSeries = totalTravelMiles / (seriesList.length || 1) / 2;
      if (avgTravelPerSeries > 800) {
        score *= 0.9;
        suggestions.push({
          type: 'high_average_travel',
          priority: 'medium',
          description: `Average ${avgTravelPerSeries.toFixed(0)} miles per series`,
          implementation: 'Optimize schedule for travel reduction',
          expectedImprovement: 10
        });
      }
      
      return {
        constraintId: 'baseball-travel-optimization',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `Travel optimization score: ${(score * 100).toFixed(1)}%`,
        suggestions,
        details: {
          totalSeries: seriesList.length,
          avgMilesPerSeries: avgTravelPerSeries.toFixed(0),
          busTrips,
          flightTrips,
          longTrips,
          intraRegionalPercentage: (regionalRatio * 100).toFixed(1) + '%'
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Optimizes travel patterns for baseball series',
      tags: ['baseball', 'travel', 'optimization', 'cost-savings']
    },
    cacheable: true,
    priority: 75
  }
];

// Helper functions
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function getDayName(dayNumber: number): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayNumber];
}

function groupIntoSeries(games: Game[]): Array<{ games: Game[]; startDate: Date }> {
  const seriesMap = new Map<string, Game[]>();
  
  games.forEach(game => {
    const weekStart = getWeekStart(game.date);
    const seriesKey = `${[game.homeTeamId, game.awayTeamId].sort().join('-')}_${weekStart}`;
    
    if (!seriesMap.has(seriesKey)) {
      seriesMap.set(seriesKey, []);
    }
    seriesMap.get(seriesKey)!.push(game);
  });
  
  return Array.from(seriesMap.values()).map(games => ({
    games: games.sort((a, b) => a.date.getTime() - b.date.getTime()),
    startDate: games[0].date
  }));
}

function calculateTeamDistance(team1: string, team2: string): number {
  // Placeholder distance calculation
  const distances: Record<string, number> = {
    'Arizona-Arizona State': 120,
    'Kansas-Kansas State': 85,
    'Texas Tech-TCU': 260,
    'Cincinnati-West Virginia': 380,
    'Arizona-UCF': 1900,
    'West Virginia-Arizona State': 2000,
    // Add more distances
  };
  
  const key = [team1, team2].sort().join('-');
  return distances[key] || 500;
}

export function getSeriesConstraints(): UnifiedConstraint[] {
  return seriesConstraints;
}