// Dynamic Venue Sharing System with ML-enhanced conflict resolution
// Version 2.0 - Handles multi-sport venues and complex sharing scenarios

import {
  UnifiedConstraint,
  ConstraintType,
  ConstraintHardness,
  ConstraintResult,
  ConstraintStatus,
  Schedule,
  Game,
  Venue,
  ConstraintParameters,
  ConstraintViolation,
  ConstraintSuggestion
} from '../types';

// ML-enhanced venue management utilities
class VenueSharingMLUtilities {
  // Predict venue changeover time requirements
  static predictChangeoverTime(
    fromSport: string,
    toSport: string,
    venueType: string
  ): { minHours: number; idealHours: number; complexity: number } {
    // Simulated ML model - in production would use historical data
    const changeoverMatrix: Record<string, Record<string, { min: number; ideal: number; complexity: number }>> = {
      'Football': {
        'Football': { min: 0, ideal: 0, complexity: 0 },
        'Soccer': { min: 48, ideal: 72, complexity: 0.8 }, // Field conversion
        'Track': { min: 72, ideal: 96, complexity: 0.9 }, // Major setup
      },
      'Basketball': {
        'Basketball': { min: 0, ideal: 0, complexity: 0 },
        'Volleyball': { min: 2, ideal: 4, complexity: 0.3 }, // Floor change
        'Wrestling': { min: 4, ideal: 8, complexity: 0.5 }, // Mat installation
        'Gymnastics': { min: 8, ideal: 12, complexity: 0.7 }, // Equipment setup
      },
      'Volleyball': {
        'Basketball': { min: 2, ideal: 4, complexity: 0.3 },
        'Volleyball': { min: 0, ideal: 0, complexity: 0 },
      },
      'Baseball': {
        'Baseball': { min: 0, ideal: 0, complexity: 0 },
        'Softball': { min: 2, ideal: 4, complexity: 0.2 }, // Minor adjustments
      },
      'Track': {
        'Track': { min: 0, ideal: 0, complexity: 0 },
        'Soccer': { min: 1, ideal: 2, complexity: 0.1 }, // Shared field
      }
    };
    
    const config = changeoverMatrix[fromSport]?.[toSport] || 
                   { min: 4, ideal: 8, complexity: 0.5 }; // Default
    
    // Adjust for venue type
    let multiplier = 1.0;
    if (venueType === 'outdoor') multiplier *= 1.2; // Weather considerations
    if (venueType === 'shared') multiplier *= 0.8; // Designed for multiple sports
    
    return {
      minHours: Math.ceil(config.min * multiplier),
      idealHours: Math.ceil(config.ideal * multiplier),
      complexity: Math.min(config.complexity * multiplier, 1.0)
    };
  }

  static calculateVenueUtilization(
    games: Game[],
    venueName: string,
    capacity: number
  ): {
    utilizationRate: number;
    peakDays: string[];
    recommendations: string[];
  } {
    // Group games by date
    const gamesByDate = new Map<string, Game[]>();
    
    for (const game of games) {
      const dateKey = game.date.toISOString().split('T')[0];
      if (!gamesByDate.has(dateKey)) {
        gamesByDate.set(dateKey, []);
      }
      gamesByDate.get(dateKey)!.push(game);
    }
    
    // Calculate utilization
    const totalDays = 365; // Assuming annual schedule
    const daysUsed = gamesByDate.size;
    const utilizationRate = daysUsed / totalDays;
    
    // Find peak usage days
    const peakDays: string[] = [];
    const recommendations: string[] = [];
    
    for (const [date, dayGames] of gamesByDate.entries()) {
      if (dayGames.length >= 3) {
        peakDays.push(date);
        recommendations.push(`High usage on ${date}: ${dayGames.length} events`);
      }
      
      // Check for quick turnarounds
      const sortedGames = dayGames.sort((a, b) => {
        const timeA = parseInt(a.time.replace(':', ''));
        const timeB = parseInt(b.time.replace(':', ''));
        return timeA - timeB;
      });
      
      for (let i = 1; i < sortedGames.length; i++) {
        const prevEndTime = this.estimateGameEndTime(sortedGames[i-1]);
        const nextStartTime = parseInt(sortedGames[i].time.replace(':', ''));
        const gap = nextStartTime - prevEndTime;
        
        if (gap < 200) { // Less than 2 hours
          recommendations.push(
            `Tight turnaround on ${date}: ${sortedGames[i-1].sport} to ${sortedGames[i].sport}`
          );
        }
      }
    }
    
    // Overall recommendations
    if (utilizationRate > 0.7) {
      recommendations.push('Consider adding auxiliary venues for overflow');
    } else if (utilizationRate < 0.3) {
      recommendations.push('Venue underutilized - consider hosting more events');
    }
    
    return {
      utilizationRate,
      peakDays,
      recommendations
    };
  }

  private static estimateGameEndTime(game: Game): number {
    const startTime = parseInt(game.time.replace(':', ''));
    const durations: Record<string, number> = {
      'Football': 330, // 3.5 hours
      'Basketball': 200, // 2 hours
      'Baseball': 300, // 3 hours
      'Softball': 230, // 2.5 hours
      'Volleyball': 200, // 2 hours
      'Soccer': 200, // 2 hours
      'Wrestling': 300, // 3 hours (dual meet)
      'Track': 400, // 4 hours (meet)
      'Gymnastics': 230, // 2.5 hours
    };
    
    return startTime + (durations[game.sport] || 200);
  }

  static detectSharedVenueConflicts(
    games: Game[],
    venues: Venue[]
  ): {
    conflicts: Array<{gameIds: string[]; reason: string; severity: 'critical' | 'major' | 'minor'}>;
    utilizationStats: Map<string, number>;
  } {
    const conflicts: Array<{gameIds: string[]; reason: string; severity: 'critical' | 'major' | 'minor'}> = [];
    const utilizationStats = new Map<string, number>();
    
    // Group games by venue and date
    const venueSchedule = new Map<string, Map<string, Game[]>>();
    
    for (const game of games) {
      if (!venueSchedule.has(game.venueId)) {
        venueSchedule.set(game.venueId, new Map());
      }
      const dateKey = game.date.toISOString().split('T')[0];
      if (!venueSchedule.get(game.venueId)!.has(dateKey)) {
        venueSchedule.get(game.venueId)!.set(dateKey, []);
      }
      venueSchedule.get(game.venueId)!.get(dateKey)!.push(game);
    }
    
    // Check each venue's daily schedule
    for (const [venueId, dailySchedules] of venueSchedule.entries()) {
      const venue = venues.find(v => v.id === venueId);
      if (!venue) continue;
      
      let totalEvents = 0;
      
      for (const [date, dayGames] of dailySchedules.entries()) {
        totalEvents += dayGames.length;
        
        if (dayGames.length === 1) continue; // No conflicts possible
        
        // Sort games by time
        const sortedGames = dayGames.sort((a, b) => {
          const timeA = parseInt(a.time.replace(':', ''));
          const timeB = parseInt(b.time.replace(':', ''));
          return timeA - timeB;
        });
        
        // Check for overlaps and insufficient changeover time
        for (let i = 1; i < sortedGames.length; i++) {
          const prevGame = sortedGames[i-1];
          const currGame = sortedGames[i];
          
          const prevEndTime = this.estimateGameEndTime(prevGame);
          const currStartTime = parseInt(currGame.time.replace(':', ''));
          
          const gapHours = (currStartTime - prevEndTime) / 100; // Rough hours
          
          if (gapHours < 0) {
            // Direct overlap
            conflicts.push({
              gameIds: [prevGame.id, currGame.id],
              reason: `Games overlap at ${venue.name} on ${date}`,
              severity: 'critical'
            });
          } else if (prevGame.sport !== currGame.sport) {
            // Different sports need changeover
            const changeover = this.predictChangeoverTime(
              prevGame.sport,
              currGame.sport,
              venue.sports.length > 2 ? 'shared' : 'dedicated'
            );
            
            if (gapHours < changeover.minHours) {
              conflicts.push({
                gameIds: [prevGame.id, currGame.id],
                reason: `Insufficient changeover time at ${venue.name}: ${prevGame.sport} to ${currGame.sport} (${gapHours.toFixed(1)}h < ${changeover.minHours}h required)`,
                severity: 'critical'
              });
            } else if (gapHours < changeover.idealHours) {
              conflicts.push({
                gameIds: [prevGame.id, currGame.id],
                reason: `Tight changeover at ${venue.name}: ${prevGame.sport} to ${currGame.sport} (${gapHours.toFixed(1)}h < ${changeover.idealHours}h ideal)`,
                severity: 'minor'
              });
            }
          }
        }
      }
      
      utilizationStats.set(venueId, totalEvents);
    }
    
    return { conflicts, utilizationStats };
  }
}

// Venue Sharing Constraints
export const venueSharingConstraints: UnifiedConstraint[] = [
  {
    id: 'vs-conflict-prevention',
    name: 'Venue Conflict Prevention',
    type: ConstraintType.SPATIAL,
    hardness: ConstraintHardness.HARD,
    weight: 100,
    scope: {
      sports: ['All'],
      conferences: ['Big 12']
    },
    parameters: {
      minimumChangeoverHours: 2,
      criticalVenues: ['shared', 'multi-purpose'],
      sportPriority: {
        'Football': 1,
        'Basketball': 2,
        'Baseball': 3,
        'Softball': 3,
        'Volleyball': 4,
        'Soccer': 4,
        'Wrestling': 5,
        'Gymnastics': 5,
        'Track': 6
      }
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      const startTime = Date.now();
      const violations: ConstraintViolation[] = [];
      
      // Detect all venue conflicts
      const conflictAnalysis = VenueSharingMLUtilities.detectSharedVenueConflicts(
        schedule.games,
        schedule.venues
      );
      
      // Convert conflicts to violations
      for (const conflict of conflictAnalysis.conflicts) {
        if (conflict.severity === 'critical') {
          violations.push({
            type: 'venue_conflict',
            severity: 'critical',
            affectedEntities: conflict.gameIds,
            description: conflict.reason,
            possibleResolutions: [
              'Reschedule one of the games',
              'Move to alternate venue',
              'Adjust game times'
            ]
          });
        }
      }
      
      // Check shared venue teams don't have home conflicts
      const sharedVenueTeams = new Map<string, string[]>();
      for (const venue of schedule.venues) {
        if (venue.sharedBy && venue.sharedBy.length > 1) {
          sharedVenueTeams.set(venue.id, venue.sharedBy);
        }
      }
      
      for (const [venueId, teams] of sharedVenueTeams.entries()) {
        const venueGames = schedule.games.filter(g => g.venueId === venueId);
        
        // Check for same-day home games
        const gamesByDate = new Map<string, Game[]>();
        for (const game of venueGames) {
          const dateKey = game.date.toISOString().split('T')[0];
          if (!gamesByDate.has(dateKey)) {
            gamesByDate.set(dateKey, []);
          }
          gamesByDate.get(dateKey)!.push(game);
        }
        
        for (const [date, dayGames] of gamesByDate.entries()) {
          const homeTeams = dayGames.map(g => g.homeTeamId);
          const sharedHomeTeams = homeTeams.filter(t => teams.includes(t));
          
          if (sharedHomeTeams.length > 1) {
            violations.push({
              type: 'shared_venue_home_conflict',
              severity: 'critical',
              affectedEntities: dayGames.filter(g => sharedHomeTeams.includes(g.homeTeamId)).map(g => g.id),
              description: `Multiple teams sharing ${venueId} have home games on ${date}`,
              possibleResolutions: ['Move one team\'s game to different date']
            });
          }
        }
      }
      
      const executionTime = Date.now() - startTime;
      const hasViolations = violations.length > 0;
      
      return {
        constraintId: 'vs-conflict-prevention',
        status: hasViolations ? ConstraintStatus.VIOLATED : ConstraintStatus.SATISFIED,
        satisfied: !hasViolations,
        score: hasViolations ? 0.0 : 1.0,
        message: hasViolations 
          ? `Found ${violations.length} venue conflicts`
          : 'No venue conflicts detected',
        violations,
        executionTime,
        confidence: 0.98,
        details: {
          totalConflicts: conflictAnalysis.conflicts.length,
          criticalConflicts: conflictAnalysis.conflicts.filter(c => c.severity === 'critical').length,
          venueUtilization: Object.fromEntries(conflictAnalysis.utilizationStats)
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Prevents scheduling conflicts at shared venues',
      tags: ['venue', 'conflict', 'spatial', 'critical']
    },
    cacheable: false, // Venue availability may change
    parallelizable: false, // Needs full schedule context
    priority: 100
  },

  {
    id: 'vs-changeover-optimization',
    name: 'Smart Venue Changeover Management',
    type: ConstraintType.PERFORMANCE,
    hardness: ConstraintHardness.SOFT,
    weight: 80,
    scope: {
      sports: ['All'],
      conferences: ['Big 12']
    },
    parameters: {
      targetUtilization: 0.6, // 60% utilization is ideal
      maxDailyEvents: 3,
      preferredChangeoverBuffer: 1.5, // Multiplier for ideal time
      complexChangeoverPenalty: 0.2
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      let score = 1.0;
      const suggestions: ConstraintSuggestion[] = [];
      const violations: ConstraintViolation[] = [];
      
      // Analyze each venue's utilization
      for (const venue of schedule.venues) {
        const venueGames = schedule.games.filter(g => g.venueId === venue.id);
        
        if (venueGames.length === 0) continue;
        
        const utilizationAnalysis = VenueSharingMLUtilities.calculateVenueUtilization(
          venueGames,
          venue.name,
          venue.capacity
        );
        
        // Check utilization rate
        if (utilizationAnalysis.utilizationRate > params.targetUtilization * 1.3) {
          score *= 0.85;
          suggestions.push({
            type: 'venue_overutilized',
            priority: 'high',
            description: `${venue.name} is overutilized (${(utilizationAnalysis.utilizationRate * 100).toFixed(1)}%)`,
            implementation: 'Distribute events to other venues or add dates',
            expectedImprovement: 15
          });
        }
        
        // Check for complex changeovers
        const conflictAnalysis = VenueSharingMLUtilities.detectSharedVenueConflicts(
          venueGames,
          [venue]
        );
        
        let complexChangeovers = 0;
        for (const conflict of conflictAnalysis.conflicts) {
          if (conflict.severity === 'minor' && conflict.reason.includes('Tight changeover')) {
            complexChangeovers++;
          }
        }
        
        if (complexChangeovers > 5) {
          score *= (1 - params.complexChangeoverPenalty);
          suggestions.push({
            type: 'excessive_complex_changeovers',
            priority: 'medium',
            description: `${venue.name} has ${complexChangeovers} tight changeovers`,
            implementation: 'Space out events or group similar sports together',
            expectedImprovement: 10
          });
        }
        
        // Add specific recommendations
        for (const recommendation of utilizationAnalysis.recommendations) {
          if (recommendation.includes('High usage')) {
            violations.push({
              type: 'excessive_daily_events',
              severity: 'minor',
              affectedEntities: [venue.id],
              description: recommendation,
              possibleResolutions: ['Spread events across more days', 'Use alternate venues']
            });
            score *= 0.9;
          }
        }
      }
      
      // Analyze multi-sport venue efficiency
      const multiSportVenues = schedule.venues.filter(v => v.sports.length > 1);
      for (const venue of multiSportVenues) {
        const venueGames = schedule.games.filter(g => g.venueId === venue.id);
        const sportCounts = new Map<string, number>();
        
        for (const game of venueGames) {
          sportCounts.set(game.sport, (sportCounts.get(game.sport) || 0) + 1);
        }
        
        // Check for sport clustering opportunities
        if (sportCounts.size > 2) {
          const dates = new Set(venueGames.map(g => g.date.toISOString().split('T')[0]));
          const sportsPerDay = venueGames.length / dates.size;
          
          if (sportsPerDay > 2.5) {
            suggestions.push({
              type: 'sport_clustering_opportunity',
              priority: 'low',
              description: `${venue.name} averages ${sportsPerDay.toFixed(1)} different sports per day`,
              implementation: 'Group similar sports on same days to reduce changeovers',
              expectedImprovement: 8
            });
          }
        }
      }
      
      return {
        constraintId: 'vs-changeover-optimization',
        status: score > 0.75 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.75,
        score,
        message: `Venue changeover optimization score: ${(score * 100).toFixed(1)}%`,
        violations,
        suggestions,
        confidence: 0.82
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Optimizes venue changeover times and utilization patterns',
      tags: ['venue', 'changeover', 'optimization', 'ml-enhanced']
    },
    cacheable: true,
    parallelizable: true,
    priority: 80
  },

  {
    id: 'vs-geographic-clustering',
    name: 'Geographic Venue Clustering',
    type: ConstraintType.SPATIAL,
    hardness: ConstraintHardness.SOFT,
    weight: 70,
    scope: {
      sports: ['All'],
      conferences: ['Big 12']
    },
    parameters: {
      clusterRadiusMiles: 5, // Venues within 5 miles considered clustered
      minTimeBetweenClusteredEvents: 4, // Hours
      trafficMultiplier: 1.5 // Account for traffic between nearby venues
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      let score = 1.0;
      const suggestions: ConstraintSuggestion[] = [];
      
      // Identify venue clusters
      const venueClusters: Venue[][] = [];
      const processedVenues = new Set<string>();
      
      for (const venue1 of schedule.venues) {
        if (processedVenues.has(venue1.id)) continue;
        
        const cluster = [venue1];
        processedVenues.add(venue1.id);
        
        for (const venue2 of schedule.venues) {
          if (processedVenues.has(venue2.id)) continue;
          
          // Simple distance calculation (in production, use proper geodesic distance)
          const distance = Math.sqrt(
            Math.pow((venue1.location.latitude - venue2.location.latitude) * 69, 2) +
            Math.pow((venue1.location.longitude - venue2.location.longitude) * 69, 2)
          );
          
          if (distance <= params.clusterRadiusMiles) {
            cluster.push(venue2);
            processedVenues.add(venue2.id);
          }
        }
        
        if (cluster.length > 1) {
          venueClusters.push(cluster);
        }
      }
      
      // Analyze clustered venue scheduling
      for (const cluster of venueClusters) {
        const clusterGames = schedule.games.filter(g => 
          cluster.some(v => v.id === g.venueId)
        );
        
        // Group by date
        const gamesByDate = new Map<string, Game[]>();
        for (const game of clusterGames) {
          const dateKey = game.date.toISOString().split('T')[0];
          if (!gamesByDate.has(dateKey)) {
            gamesByDate.set(dateKey, []);
          }
          gamesByDate.get(dateKey)!.push(game);
        }
        
        // Check for traffic conflicts
        for (const [date, dayGames] of gamesByDate.entries()) {
          if (dayGames.length < 2) continue;
          
          // Sort by time
          const sortedGames = dayGames.sort((a, b) => {
            const timeA = parseInt(a.time.replace(':', ''));
            const timeB = parseInt(b.time.replace(':', ''));
            return timeA - timeB;
          });
          
          for (let i = 1; i < sortedGames.length; i++) {
            const game1 = sortedGames[i-1];
            const game2 = sortedGames[i];
            
            if (game1.venueId !== game2.venueId) {
              const time1 = parseInt(game1.time.replace(':', ''));
              const time2 = parseInt(game2.time.replace(':', ''));
              const hoursDiff = (time2 - time1) / 100;
              
              if (hoursDiff < params.minTimeBetweenClusteredEvents) {
                score *= 0.9;
                const venue1 = cluster.find(v => v.id === game1.venueId);
                const venue2 = cluster.find(v => v.id === game2.venueId);
                
                suggestions.push({
                  type: 'clustered_venue_traffic',
                  priority: 'medium',
                  description: `Events at ${venue1?.name} and ${venue2?.name} only ${hoursDiff.toFixed(1)}h apart on ${date}`,
                  implementation: 'Increase time gap to avoid traffic congestion',
                  expectedImprovement: 10
                });
              }
            }
          }
        }
      }
      
      // Check for parking/infrastructure stress
      for (const cluster of venueClusters) {
        const clusterCapacity = cluster.reduce((sum, v) => sum + v.capacity, 0);
        
        if (clusterCapacity > 50000) {
          // Large venue cluster - needs special attention
          const clusterGames = schedule.games.filter(g => 
            cluster.some(v => v.id === g.venueId)
          );
          
          const highAttendanceDays = new Set<string>();
          for (const game of clusterGames) {
            if (game.sport === 'Football' || 
                (game.sport === 'Basketball' && game.metadata?.rivalryGame)) {
              highAttendanceDays.add(game.date.toISOString().split('T')[0]);
            }
          }
          
          if (highAttendanceDays.size > 10) {
            suggestions.push({
              type: 'infrastructure_stress',
              priority: 'low',
              description: `${cluster.length} clustered venues have ${highAttendanceDays.size} high-attendance days`,
              implementation: 'Coordinate with city for traffic management on peak days',
              expectedImprovement: 5
            });
          }
        }
      }
      
      return {
        constraintId: 'vs-geographic-clustering',
        status: score > 0.8 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.8,
        score,
        message: `Geographic clustering optimization score: ${(score * 100).toFixed(1)}%`,
        suggestions,
        confidence: 0.75,
        details: {
          identifiedClusters: venueClusters.length,
          clusteredVenues: venueClusters.flat().length
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Manages scheduling for geographically clustered venues',
      tags: ['venue', 'geographic', 'traffic', 'infrastructure']
    },
    cacheable: true,
    parallelizable: true,
    priority: 70
  },

  {
    id: 'vs-availability-windows',
    name: 'Venue Availability Window Compliance',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.HARD,
    weight: 95,
    scope: {
      sports: ['All'],
      conferences: ['Big 12']
    },
    parameters: {
      respectBlackoutDates: true,
      maintenanceWindowDays: 7, // Days needed for major maintenance
      emergencyBufferHours: 24
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      
      // Check each venue's availability
      for (const venue of schedule.venues) {
        if (!venue.availability || venue.availability.length === 0) continue;
        
        const venueGames = schedule.games.filter(g => g.venueId === venue.id);
        
        for (const game of venueGames) {
          // Check if game falls within any unavailability window
          for (const unavailable of venue.availability.filter(a => !a.available)) {
            if (game.date >= unavailable.startDate && game.date <= unavailable.endDate) {
              violations.push({
                type: 'venue_unavailable',
                severity: 'critical',
                affectedEntities: [game.id, venue.id],
                description: `Game scheduled at ${venue.name} during unavailability: ${unavailable.reason || 'Maintenance'}`,
                possibleResolutions: [
                  'Move to different date',
                  'Find alternate venue',
                  'Negotiate venue availability'
                ]
              });
            }
          }
        }
        
        // Check for maintenance windows between seasons
        const sportSeasons = new Map<string, { start: Date; end: Date }>();
        for (const game of venueGames) {
          if (!sportSeasons.has(game.sport)) {
            sportSeasons.set(game.sport, { start: game.date, end: game.date });
          } else {
            const season = sportSeasons.get(game.sport)!;
            if (game.date < season.start) season.start = game.date;
            if (game.date > season.end) season.end = game.date;
          }
        }
        
        // Verify maintenance windows between different sport seasons
        const seasons = Array.from(sportSeasons.entries()).sort((a, b) => 
          a[1].end.getTime() - b[1].end.getTime()
        );
        
        for (let i = 1; i < seasons.length; i++) {
          const gap = (seasons[i][1].start.getTime() - seasons[i-1][1].end.getTime()) / 
                     (1000 * 60 * 60 * 24);
          
          if (gap < params.maintenanceWindowDays && seasons[i][0] !== seasons[i-1][0]) {
            violations.push({
              type: 'insufficient_maintenance_window',
              severity: 'minor',
              affectedEntities: [venue.id],
              description: `Only ${gap.toFixed(0)} days between ${seasons[i-1][0]} and ${seasons[i][0]} seasons at ${venue.name}`,
              possibleResolutions: ['Extend gap between seasons', 'Schedule maintenance differently']
            });
          }
        }
      }
      
      return {
        constraintId: 'vs-availability-windows',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'All venue availability windows respected'
          : `Found ${violations.length} venue availability violations`,
        violations,
        confidence: 1.0
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Ensures games are scheduled only when venues are available',
      tags: ['venue', 'availability', 'temporal', 'maintenance']
    },
    cacheable: false, // Availability may change
    priority: 95
  }
];

// Export helper function
export function getVenueSharingConstraints(): UnifiedConstraint[] {
  return venueSharingConstraints;
}

// Export ML utilities
export { VenueSharingMLUtilities };