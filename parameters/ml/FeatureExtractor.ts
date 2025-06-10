/**
 * FeatureExtractor.ts
 * Extract features from schedules for ML models
 * 
 * This component extracts meaningful features from schedules, constraints,
 * and games to feed into various ML models for optimization and prediction.
 */

import {
  UnifiedConstraint,
  ConstraintType,
  ConstraintHardness,
  ConstraintStatus,
  EvaluationResult
} from '../types';
import {
  ConstraintFeatures,
  ScheduleFeatures,
  GameFeatures,
  FeatureExtractor as IFeatureExtractor
} from '../types/ml-types';
import { Schedule, Game, Team, Venue, Location } from '../types/schedule-types';

export class FeatureExtractor implements IFeatureExtractor {
  private readonly distanceCache: Map<string, number>;
  private readonly featureCache: Map<string, any>;
  private readonly cacheExpiry: number = 600000; // 10 minutes
  private readonly earthRadiusKm = 6371;

  constructor() {
    this.distanceCache = new Map();
    this.featureCache = new Map();
  }

  /**
   * Extract features from a constraint
   */
  extractConstraintFeatures(
    constraint: UnifiedConstraint,
    schedule: Schedule
  ): ConstraintFeatures {
    const cacheKey = `constraint-${constraint.id}-${schedule.id}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Extract scope size
    const scopeSize = this.calculateScopeSize(constraint, schedule);
    
    // Extract historical performance (would come from database)
    const historicalPerformance = this.getHistoricalPerformance(constraint.id);
    
    // Calculate derived features
    const complexity = this.calculateConstraintComplexity(constraint, schedule);
    const flexibility = this.calculateConstraintFlexibility(constraint);
    const criticalityScore = this.calculateCriticalityScore(constraint, schedule);
    const conflictPotential = this.calculateConflictPotential(constraint, schedule);

    const features: ConstraintFeatures = {
      // Basic properties
      type: constraint.type,
      hardness: constraint.hardness,
      weight: constraint.weight,
      scopeSize,
      
      // Historical performance
      historicalSatisfactionRate: historicalPerformance.satisfactionRate,
      averageEvaluationTime: historicalPerformance.avgEvaluationTime,
      violationFrequency: historicalPerformance.violationFrequency,
      
      // Context features
      sportSpecific: this.isSportSpecific(constraint, schedule),
      seasonPhase: this.getSeasonPhase(schedule),
      dependencyCount: constraint.dependencies?.length || 0,
      conflictPotential,
      
      // Derived features
      complexity,
      flexibility,
      criticalityScore
    };

    this.saveToCache(cacheKey, features);
    return features;
  }

  /**
   * Extract features from a schedule
   */
  extractScheduleFeatures(schedule: Schedule): ScheduleFeatures {
    const cacheKey = `schedule-${schedule.id}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Basic counts
    const gameCount = schedule.games.length;
    const teamCount = schedule.teams.length;
    const venueCount = schedule.venues.length;
    const duration = this.calculateScheduleDuration(schedule);

    // Density metrics
    const gamesPerWeek = duration > 0 ? (gameCount / (duration / 7)) : 0;
    const averageGamesPerTeam = teamCount > 0 ? 
      this.calculateAverageGamesPerTeam(schedule) : 0;
    const venueUtilization = this.calculateVenueUtilization(schedule);

    // Balance metrics
    const homeAwayBalance = this.calculateHomeAwayBalance(schedule);
    const travelBalance = this.calculateTravelBalance(schedule);
    const competitiveBalance = this.calculateCompetitiveBalance(schedule);

    // Complexity metrics
    const constraintCount = schedule.constraints?.length || 0;
    const hardConstraintRatio = this.calculateHardConstraintRatio(schedule);
    const interdependencyScore = this.calculateInterdependencyScore(schedule);

    const features: ScheduleFeatures = {
      gameCount,
      teamCount,
      venueCount,
      duration,
      gamesPerWeek,
      averageGamesPerTeam,
      venueUtilization,
      homeAwayBalance,
      travelBalance,
      competitiveBalance,
      constraintCount,
      hardConstraintRatio,
      interdependencyScore
    };

    this.saveToCache(cacheKey, features);
    return features;
  }

  /**
   * Extract features from a game
   */
  extractGameFeatures(game: Game, schedule: Schedule): GameFeatures {
    const cacheKey = `game-${game.id}-${schedule.id}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Find teams and venue
    const homeTeam = schedule.teams.find(t => t.id === game.homeTeamId);
    const awayTeam = schedule.teams.find(t => t.id === game.awayTeamId);
    const venue = schedule.venues.find(v => v.id === game.venueId);

    if (!homeTeam || !awayTeam || !venue) {
      throw new Error(`Missing data for game ${game.id}`);
    }

    // Basic properties
    const gameType = game.type;
    const dayOfWeek = new Date(game.date).getDay();
    const timeSlot = this.categorizeTimeSlot(game.time);

    // Team features
    const teamRivalry = this.isRivalryGame(homeTeam, awayTeam);
    const teamDistance = this.calculateDistance(
      this.getTeamLocation(homeTeam, schedule),
      this.getTeamLocation(awayTeam, schedule)
    );
    const teamStrengthDifferential = this.calculateTeamStrengthDifferential(
      homeTeam,
      awayTeam
    );

    // Context features
    const conflictingGames = this.countConflictingGames(game, schedule);
    const venueAvailability = this.calculateVenueAvailability(venue, game.date);
    const weatherRisk = this.calculateWeatherRisk(venue.location, game.date);

    // Historical features (would come from database)
    const historicalData = this.getHistoricalGameData(
      homeTeam.id,
      awayTeam.id,
      venue.id
    );

    const features: GameFeatures = {
      gameType,
      dayOfWeek,
      timeSlot,
      teamRivalry,
      teamDistance,
      teamStrengthDifferential,
      conflictingGames,
      venueAvailability,
      weatherRisk,
      historicalAttendance: historicalData.avgAttendance,
      historicalViewership: historicalData.avgViewership,
      reschedulingFrequency: historicalData.reschedulingFrequency
    };

    this.saveToCache(cacheKey, features);
    return features;
  }

  /**
   * Calculate scope size for a constraint
   */
  private calculateScopeSize(
    constraint: UnifiedConstraint,
    schedule: Schedule
  ): number {
    let size = 0;

    if (constraint.scope.sports.length > 0) {
      size += constraint.scope.sports.length;
    }

    if (constraint.scope.teams) {
      size += constraint.scope.teams.length;
    }

    if (constraint.scope.venues) {
      size += constraint.scope.venues.length;
    }

    if (constraint.scope.timeframes) {
      size += constraint.scope.timeframes.length * 2; // Weight time constraints higher
    }

    return size;
  }

  /**
   * Get historical performance data for a constraint
   */
  private getHistoricalPerformance(constraintId: string): {
    satisfactionRate: number;
    avgEvaluationTime: number;
    violationFrequency: number;
  } {
    // In production, this would query the database
    // For now, return mock data
    return {
      satisfactionRate: 0.85 + Math.random() * 0.15,
      avgEvaluationTime: 50 + Math.random() * 100,
      violationFrequency: Math.random() * 0.3
    };
  }

  /**
   * Calculate constraint complexity
   */
  private calculateConstraintComplexity(
    constraint: UnifiedConstraint,
    schedule: Schedule
  ): number {
    const factors = [
      // Scope complexity
      this.calculateScopeSize(constraint, schedule) / 100,
      
      // Dependency complexity
      (constraint.dependencies?.length || 0) / 10,
      
      // Conflict complexity
      (constraint.conflictsWith?.length || 0) / 10,
      
      // Parameter complexity
      Object.keys(constraint.parameters).length / 20,
      
      // Type complexity
      this.getTypeComplexity(constraint.type)
    ];

    return Math.min(factors.reduce((sum, f) => sum + f) / factors.length, 1);
  }

  /**
   * Calculate constraint flexibility
   */
  private calculateConstraintFlexibility(constraint: UnifiedConstraint): number {
    if (constraint.hardness === ConstraintHardness.HARD) return 0;
    if (constraint.hardness === ConstraintHardness.PREFERENCE) return 1;
    
    // Soft constraints have flexibility based on weight
    return 1 - (constraint.weight / 100);
  }

  /**
   * Calculate criticality score
   */
  private calculateCriticalityScore(
    constraint: UnifiedConstraint,
    schedule: Schedule
  ): number {
    const hardnessFactor = constraint.hardness === ConstraintHardness.HARD ? 1 : 0.5;
    const weightFactor = constraint.weight / 100;
    const typeFactor = this.getTypeCriticality(constraint.type);
    const scopeFactor = Math.min(this.calculateScopeSize(constraint, schedule) / 50, 1);

    return (hardnessFactor * 0.4 + weightFactor * 0.3 + 
            typeFactor * 0.2 + scopeFactor * 0.1);
  }

  /**
   * Calculate conflict potential
   */
  private calculateConflictPotential(
    constraint: UnifiedConstraint,
    schedule: Schedule
  ): number {
    const conflictCount = constraint.conflictsWith?.length || 0;
    const dependencyCount = constraint.dependencies?.length || 0;
    const scopeOverlap = this.calculateScopeOverlap(constraint, schedule);
    
    return Math.min(
      (conflictCount * 0.4 + dependencyCount * 0.3 + scopeOverlap * 0.3),
      1
    );
  }

  /**
   * Check if constraint is sport-specific
   */
  private isSportSpecific(
    constraint: UnifiedConstraint,
    schedule: Schedule
  ): boolean {
    return constraint.scope.sports.length === 1 &&
           constraint.scope.sports[0] === schedule.sport;
  }

  /**
   * Get current season phase
   */
  private getSeasonPhase(schedule: Schedule): string {
    const now = Date.now();
    const dates = schedule.games.map(g => new Date(g.date).getTime());
    
    if (dates.length === 0) return 'preseason';
    
    const seasonStart = Math.min(...dates);
    const seasonEnd = Math.max(...dates);
    const seasonDuration = seasonEnd - seasonStart;
    
    if (now < seasonStart) return 'preseason';
    if (now > seasonEnd) return 'postseason';
    
    const progress = (now - seasonStart) / seasonDuration;
    
    if (progress < 0.25) return 'early';
    if (progress < 0.75) return 'mid';
    return 'late';
  }

  /**
   * Calculate schedule duration in days
   */
  private calculateScheduleDuration(schedule: Schedule): number {
    if (schedule.games.length === 0) return 0;
    
    const dates = schedule.games.map(g => new Date(g.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    
    return (maxDate - minDate) / (1000 * 60 * 60 * 24);
  }

  /**
   * Calculate average games per team
   */
  private calculateAverageGamesPerTeam(schedule: Schedule): number {
    const teamGameCounts = new Map<string, number>();
    
    schedule.games.forEach(game => {
      teamGameCounts.set(
        game.homeTeamId,
        (teamGameCounts.get(game.homeTeamId) || 0) + 1
      );
      teamGameCounts.set(
        game.awayTeamId,
        (teamGameCounts.get(game.awayTeamId) || 0) + 1
      );
    });
    
    const counts = Array.from(teamGameCounts.values());
    return counts.length > 0 ? 
      counts.reduce((sum, count) => sum + count) / counts.length : 0;
  }

  /**
   * Calculate venue utilization
   */
  private calculateVenueUtilization(schedule: Schedule): number {
    const venueUsage = new Map<string, Set<string>>();
    
    schedule.games.forEach(game => {
      const dateKey = new Date(game.date).toDateString();
      if (!venueUsage.has(game.venueId)) {
        venueUsage.set(game.venueId, new Set());
      }
      venueUsage.get(game.venueId)!.add(dateKey);
    });
    
    const duration = this.calculateScheduleDuration(schedule);
    if (duration === 0) return 0;
    
    let totalUtilization = 0;
    venueUsage.forEach((dates, venueId) => {
      totalUtilization += dates.size / duration;
    });
    
    return venueUsage.size > 0 ? 
      Math.min(totalUtilization / venueUsage.size, 1) : 0;
  }

  /**
   * Calculate home/away balance
   */
  private calculateHomeAwayBalance(schedule: Schedule): number {
    const teamBalance = new Map<string, { home: number; away: number }>();
    
    schedule.games.forEach(game => {
      // Update home team
      if (!teamBalance.has(game.homeTeamId)) {
        teamBalance.set(game.homeTeamId, { home: 0, away: 0 });
      }
      teamBalance.get(game.homeTeamId)!.home++;
      
      // Update away team
      if (!teamBalance.has(game.awayTeamId)) {
        teamBalance.set(game.awayTeamId, { home: 0, away: 0 });
      }
      teamBalance.get(game.awayTeamId)!.away++;
    });
    
    // Calculate balance score (1 = perfect balance)
    let totalBalance = 0;
    teamBalance.forEach(({ home, away }) => {
      const total = home + away;
      if (total > 0) {
        const balance = 1 - Math.abs(home - away) / total;
        totalBalance += balance;
      }
    });
    
    return teamBalance.size > 0 ? totalBalance / teamBalance.size : 0;
  }

  /**
   * Calculate travel balance
   */
  private calculateTravelBalance(schedule: Schedule): number {
    const teamTravelDistances = new Map<string, number>();
    
    // Group games by team and sort by date
    const teamGames = new Map<string, Game[]>();
    schedule.games.forEach(game => {
      // Add to home team's games
      if (!teamGames.has(game.homeTeamId)) {
        teamGames.set(game.homeTeamId, []);
      }
      teamGames.get(game.homeTeamId)!.push(game);
      
      // Add to away team's games
      if (!teamGames.has(game.awayTeamId)) {
        teamGames.set(game.awayTeamId, []);
      }
      teamGames.get(game.awayTeamId)!.push(game);
    });
    
    // Calculate travel for each team
    teamGames.forEach((games, teamId) => {
      const sortedGames = games.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      let totalDistance = 0;
      for (let i = 1; i < sortedGames.length; i++) {
        const prevVenue = schedule.venues.find(v => v.id === sortedGames[i-1].venueId);
        const currVenue = schedule.venues.find(v => v.id === sortedGames[i].venueId);
        
        if (prevVenue && currVenue) {
          totalDistance += this.calculateDistance(
            prevVenue.location,
            currVenue.location
          );
        }
      }
      
      teamTravelDistances.set(teamId, totalDistance);
    });
    
    // Calculate balance (lower variance = better balance)
    const distances = Array.from(teamTravelDistances.values());
    if (distances.length === 0) return 1;
    
    const avgDistance = distances.reduce((sum, d) => sum + d) / distances.length;
    const variance = distances.reduce((sum, d) => 
      sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to 0-1 scale (lower std dev = higher balance)
    return Math.max(0, 1 - (stdDev / avgDistance));
  }

  /**
   * Calculate competitive balance
   */
  private calculateCompetitiveBalance(schedule: Schedule): number {
    // Count games between teams
    const teamMatchups = new Map<string, Map<string, number>>();
    
    schedule.games.forEach(game => {
      if (!teamMatchups.has(game.homeTeamId)) {
        teamMatchups.set(game.homeTeamId, new Map());
      }
      const homeMatchups = teamMatchups.get(game.homeTeamId)!;
      homeMatchups.set(
        game.awayTeamId,
        (homeMatchups.get(game.awayTeamId) || 0) + 1
      );
    });
    
    // Calculate variance in matchup frequency
    let totalVariance = 0;
    let matchupCount = 0;
    
    teamMatchups.forEach(matchups => {
      const frequencies = Array.from(matchups.values());
      if (frequencies.length > 0) {
        const avg = frequencies.reduce((sum, f) => sum + f) / frequencies.length;
        const variance = frequencies.reduce((sum, f) => 
          sum + Math.pow(f - avg, 2), 0) / frequencies.length;
        totalVariance += variance;
        matchupCount++;
      }
    });
    
    if (matchupCount === 0) return 1;
    
    const avgVariance = totalVariance / matchupCount;
    // Lower variance = better balance
    return Math.max(0, 1 - Math.min(avgVariance / 2, 1));
  }

  /**
   * Calculate hard constraint ratio
   */
  private calculateHardConstraintRatio(schedule: Schedule): number {
    // This would need access to actual constraint objects
    // For now, return a reasonable estimate
    return 0.3; // 30% hard constraints is typical
  }

  /**
   * Calculate interdependency score
   */
  private calculateInterdependencyScore(schedule: Schedule): number {
    // This would analyze constraint dependencies
    // For now, return a moderate score
    return 0.5;
  }

  /**
   * Get type complexity score
   */
  private getTypeComplexity(type: ConstraintType): number {
    const complexityMap: Record<ConstraintType, number> = {
      [ConstraintType.TEMPORAL]: 0.6,
      [ConstraintType.SPATIAL]: 0.7,
      [ConstraintType.LOGICAL]: 0.8,
      [ConstraintType.PERFORMANCE]: 0.5,
      [ConstraintType.COMPLIANCE]: 0.9
    };
    return complexityMap[type] || 0.5;
  }

  /**
   * Get type criticality score
   */
  private getTypeCriticality(type: ConstraintType): number {
    const criticalityMap: Record<ConstraintType, number> = {
      [ConstraintType.TEMPORAL]: 0.7,
      [ConstraintType.SPATIAL]: 0.6,
      [ConstraintType.LOGICAL]: 0.8,
      [ConstraintType.PERFORMANCE]: 0.4,
      [ConstraintType.COMPLIANCE]: 1.0
    };
    return criticalityMap[type] || 0.5;
  }

  /**
   * Calculate scope overlap with other constraints
   */
  private calculateScopeOverlap(
    constraint: UnifiedConstraint,
    schedule: Schedule
  ): number {
    // This would analyze overlap with other constraints
    // For now, return a moderate overlap
    return 0.4;
  }

  /**
   * Categorize time slot
   */
  private categorizeTimeSlot(time: string): string {
    const hour = parseInt(time.split(':')[0]);
    
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 20) return 'evening';
    return 'night';
  }

  /**
   * Check if teams are rivals
   */
  private isRivalryGame(homeTeam: Team, awayTeam: Team): boolean {
    // Define known rivalries (simplified)
    const rivalries: Array<[string, string]> = [
      ['Kansas', 'Kansas State'],
      ['Oklahoma State', 'Oklahoma'],
      ['Texas', 'Texas Tech'],
      ['Baylor', 'TCU']
    ];
    
    return rivalries.some(([team1, team2]) => 
      (homeTeam.name.includes(team1) && awayTeam.name.includes(team2)) ||
      (homeTeam.name.includes(team2) && awayTeam.name.includes(team1))
    );
  }

  /**
   * Get team location
   */
  private getTeamLocation(team: Team, schedule: Schedule): Location {
    const homeVenue = schedule.venues.find(v => v.id === team.homeVenue);
    if (!homeVenue) {
      throw new Error(`Home venue not found for team ${team.name}`);
    }
    return homeVenue.location;
  }

  /**
   * Calculate distance between two locations
   */
  private calculateDistance(loc1: Location, loc2: Location): number {
    const cacheKey = `${loc1.latitude},${loc1.longitude}-${loc2.latitude},${loc2.longitude}`;
    
    const cached = this.distanceCache.get(cacheKey);
    if (cached) return cached;
    
    // Haversine formula
    const lat1Rad = this.toRadians(loc1.latitude);
    const lat2Rad = this.toRadians(loc2.latitude);
    const deltaLat = this.toRadians(loc2.latitude - loc1.latitude);
    const deltaLon = this.toRadians(loc2.longitude - loc1.longitude);
    
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = this.earthRadiusKm * c;
    
    // Convert to miles
    const distanceMiles = distance * 0.621371;
    
    this.distanceCache.set(cacheKey, distanceMiles);
    return distanceMiles;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate team strength differential
   */
  private calculateTeamStrengthDifferential(
    homeTeam: Team,
    awayTeam: Team
  ): number {
    // This would use actual team rankings/ratings
    // For now, return a random differential
    return Math.random();
  }

  /**
   * Count conflicting games
   */
  private countConflictingGames(game: Game, schedule: Schedule): number {
    const gameDate = new Date(game.date).toDateString();
    const gameHour = parseInt(game.time.split(':')[0]);
    
    return schedule.games.filter(g => {
      if (g.id === game.id) return false;
      
      const otherDate = new Date(g.date).toDateString();
      const otherHour = parseInt(g.time.split(':')[0]);
      
      // Same date and similar time
      if (gameDate === otherDate && Math.abs(gameHour - otherHour) < 3) {
        // Check if teams or venues conflict
        return g.homeTeamId === game.homeTeamId ||
               g.homeTeamId === game.awayTeamId ||
               g.awayTeamId === game.homeTeamId ||
               g.awayTeamId === game.awayTeamId ||
               g.venueId === game.venueId;
      }
      
      return false;
    }).length;
  }

  /**
   * Calculate venue availability
   */
  private calculateVenueAvailability(venue: Venue, gameDate: Date): number {
    if (!venue.availability || venue.availability.length === 0) {
      return 1; // Assume fully available if no restrictions
    }
    
    const unavailablePeriods = venue.availability.filter(a => 
      !a.available &&
      gameDate >= a.startDate &&
      gameDate <= a.endDate
    );
    
    return unavailablePeriods.length > 0 ? 0 : 1;
  }

  /**
   * Calculate weather risk
   */
  private calculateWeatherRisk(location: Location, gameDate: Date): number {
    const month = gameDate.getMonth();
    const isNorthern = location.latitude > 35; // Simplified
    
    // Higher risk in winter months for northern locations
    if (isNorthern && (month >= 10 || month <= 2)) {
      return 0.8;
    }
    
    // Hurricane season for southern locations
    if (!isNorthern && month >= 7 && month <= 10) {
      return 0.6;
    }
    
    // Spring weather concerns
    if (month >= 2 && month <= 4) {
      return 0.4;
    }
    
    return 0.2;
  }

  /**
   * Get historical game data
   */
  private getHistoricalGameData(
    homeTeamId: string,
    awayTeamId: string,
    venueId: string
  ): {
    avgAttendance: number;
    avgViewership: number;
    reschedulingFrequency: number;
  } {
    // In production, this would query the database
    // For now, return mock data
    return {
      avgAttendance: 15000 + Math.random() * 50000,
      avgViewership: 100000 + Math.random() * 2000000,
      reschedulingFrequency: Math.random() * 0.2
    };
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any {
    const cached = this.featureCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  private saveToCache(key: string, data: any): void {
    this.featureCache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Clean old cache entries
    if (this.featureCache.size > 1000) {
      const entries = Array.from(this.featureCache.entries());
      const cutoff = Date.now() - this.cacheExpiry;
      
      entries.forEach(([k, v]) => {
        if (v.timestamp < cutoff) {
          this.featureCache.delete(k);
        }
      });
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.featureCache.clear();
    this.distanceCache.clear();
  }
}

export default FeatureExtractor;