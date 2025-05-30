// Conflict Analyzer - Analyzes conflicts and suggests resolutions
// Detects patterns, assesses risks, and provides detailed conflict analysis

import {
  Conflict,
  ConflictType,
  ConflictAnalysis,
  ConflictPattern,
  RiskAssessment,
  Resolution,
  ResolutionStrategy
} from '../types/conflict-types';
import { Schedule, Game, Team, Venue } from '../types/schedule-types';
import { ConstraintViolation } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ConflictAnalyzer {
  private patternDatabase: Map<ConflictType, ConflictPattern[]>;
  private riskThresholds: Map<string, number>;

  constructor() {
    this.patternDatabase = this.initializePatternDatabase();
    this.riskThresholds = this.initializeRiskThresholds();
  }

  /**
   * Analyzes a conflict and provides detailed insights
   */
  async analyzeConflict(
    conflict: Conflict,
    schedule: Schedule
  ): Promise<ConflictAnalysis> {
    const rootCause = this.identifyRootCause(conflict, schedule);
    const patterns = this.matchPatterns(conflict);
    const riskAssessment = this.assessRisk(conflict, schedule);
    const suggestedResolutions = await this.suggestResolutions(
      conflict,
      patterns,
      schedule
    );

    return {
      conflict,
      rootCause,
      patterns,
      suggestedResolutions,
      riskAssessment
    };
  }

  /**
   * Detects all conflicts in a schedule
   */
  async detectConflicts(schedule: Schedule): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Check for venue double-bookings
    conflicts.push(...this.detectVenueConflicts(schedule));

    // Check for Sunday restrictions (BYU)
    conflicts.push(...this.detectSundayRestrictions(schedule));

    // Check for travel burden
    conflicts.push(...this.detectTravelBurden(schedule));

    // Check for championship date conflicts
    conflicts.push(...this.detectChampionshipConflicts(schedule));

    // Check for back-to-back games
    conflicts.push(...this.detectBackToBackGames(schedule));

    // Check for home/away imbalances
    conflicts.push(...this.detectHomeAwayImbalance(schedule));

    // Check for TV slot conflicts
    conflicts.push(...this.detectTVSlotConflicts(schedule));

    // Check for weather restrictions
    conflicts.push(...this.detectWeatherConflicts(schedule));

    // Check for academic calendar conflicts
    conflicts.push(...this.detectAcademicConflicts(schedule));

    return conflicts;
  }

  /**
   * Identifies the root cause of a conflict
   */
  private identifyRootCause(conflict: Conflict, schedule: Schedule): string {
    switch (conflict.type) {
      case ConflictType.VENUE_DOUBLE_BOOKING:
        return this.analyzeVenueBookingCause(conflict, schedule);
      
      case ConflictType.SUNDAY_RESTRICTION:
        return 'BYU religious observance policy prohibits Sunday competitions';
      
      case ConflictType.TRAVEL_BURDEN:
        return this.analyzeTravelBurdenCause(conflict, schedule);
      
      case ConflictType.CHAMPIONSHIP_DATE:
        return 'Championship date conflicts with other major events or constraints';
      
      case ConflictType.BACK_TO_BACK_GAMES:
        return 'Insufficient rest period between consecutive games';
      
      case ConflictType.HOME_AWAY_IMBALANCE:
        return 'Uneven distribution of home and away games';
      
      case ConflictType.TV_SLOT_CONFLICT:
        return 'Multiple games scheduled for the same TV broadcast window';
      
      case ConflictType.WEATHER_RESTRICTION:
        return 'Weather conditions unsuitable for outdoor competition';
      
      case ConflictType.ACADEMIC_CALENDAR:
        return 'Game scheduled during academic priority period (finals, etc.)';
      
      default:
        return 'Unknown conflict cause';
    }
  }

  /**
   * Matches conflict patterns from historical data
   */
  private matchPatterns(conflict: Conflict): ConflictPattern[] {
    const patterns = this.patternDatabase.get(conflict.type) || [];
    
    // Filter patterns based on relevance
    return patterns.filter(pattern => {
      // Check if sport matches
      if (pattern.sportSpecific && 
          !pattern.sportSpecific.includes(conflict.affectedGames[0]?.sport)) {
        return false;
      }
      
      // Check seasonal trend
      if (pattern.seasonalTrend) {
        const gameDate = conflict.affectedGames[0]?.date;
        if (!this.matchesSeasonalTrend(gameDate, pattern.seasonalTrend)) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Assesses risk associated with the conflict
   */
  private assessRisk(conflict: Conflict, schedule: Schedule): RiskAssessment {
    let cascadeRisk: 'low' | 'medium' | 'high' = 'low';
    let complianceRisk = false;
    let reputationalRisk = false;
    let financialRisk = 0;

    // Assess cascade risk
    const potentialCascades = this.identifyPotentialCascades(conflict, schedule);
    if (potentialCascades.length > 5) cascadeRisk = 'high';
    else if (potentialCascades.length > 2) cascadeRisk = 'medium';

    // Assess compliance risk
    if (conflict.type === ConflictType.SUNDAY_RESTRICTION ||
        conflict.type === ConflictType.CHAMPIONSHIP_DATE) {
      complianceRisk = true;
    }

    // Assess reputational risk
    if (conflict.severity === 'critical' ||
        conflict.affectedGames.some(g => g.metadata?.rivalryGame) ||
        conflict.affectedGames.some(g => g.metadata?.tvNetwork)) {
      reputationalRisk = true;
    }

    // Assess financial risk
    if (conflict.type === ConflictType.TV_SLOT_CONFLICT) {
      financialRisk = 50000; // Estimated TV revenue loss
    }
    if (conflict.type === ConflictType.VENUE_DOUBLE_BOOKING) {
      financialRisk += 20000; // Venue change costs
    }

    const description = this.generateRiskDescription(
      cascadeRisk,
      complianceRisk,
      reputationalRisk,
      financialRisk
    );

    return {
      cascadeRisk,
      complianceRisk,
      reputationalRisk,
      financialRisk,
      description
    };
  }

  /**
   * Suggests potential resolutions based on analysis
   */
  private async suggestResolutions(
    conflict: Conflict,
    patterns: ConflictPattern[],
    schedule: Schedule
  ): Promise<Resolution[]> {
    const resolutions: Resolution[] = [];

    // Get successful strategies from patterns
    const successfulStrategies = new Set<ResolutionStrategy>();
    patterns.forEach(pattern => {
      pattern.successfulStrategies.forEach(strategy => {
        successfulStrategies.add(strategy);
      });
    });

    // Generate resolution for each successful strategy
    for (const strategy of successfulStrategies) {
      const resolution = this.generateResolutionSuggestion(
        conflict,
        strategy,
        schedule
      );
      if (resolution) {
        resolutions.push(resolution);
      }
    }

    // Add default resolutions if none from patterns
    if (resolutions.length === 0) {
      resolutions.push(...this.generateDefaultResolutions(conflict, schedule));
    }

    return resolutions;
  }

  /**
   * Detect venue double-booking conflicts
   */
  private detectVenueConflicts(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];
    const venueSchedule = new Map<string, Game[]>();

    // Group games by venue and date/time
    schedule.games.forEach(game => {
      const key = `${game.venueId}-${game.date.toDateString()}-${game.time}`;
      if (!venueSchedule.has(key)) {
        venueSchedule.set(key, []);
      }
      venueSchedule.get(key)!.push(game);
    });

    // Find double-bookings
    for (const [key, games] of venueSchedule) {
      if (games.length > 1) {
        const venue = schedule.venues.find(v => v.id === games[0].venueId);
        conflicts.push({
          id: uuidv4(),
          type: ConflictType.VENUE_DOUBLE_BOOKING,
          severity: 'critical',
          affectedGames: games,
          affectedTeams: this.getAffectedTeams(games, schedule),
          affectedVenues: venue ? [venue] : [],
          violations: [{
            type: 'venue_availability',
            severity: 'critical',
            affectedEntities: games.map(g => g.id),
            description: `Venue ${venue?.name} is double-booked`,
            possibleResolutions: ['Time shift', 'Venue change', 'Date change']
          }],
          description: `Multiple games scheduled at ${venue?.name} at the same time`,
          detectedAt: new Date(),
          metadata: {
            constraintType: 'spatial' as any,
            constraintId: 'venue-availability',
            conflictScore: 1.0,
            cascadeRisk: 0.7
          }
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect Sunday restriction violations (BYU)
   */
  private detectSundayRestrictions(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];
    const byuTeam = schedule.teams.find(t => t.name === 'BYU');
    
    if (!byuTeam) return conflicts;

    const sundayGames = schedule.games.filter(game => {
      const isSunday = game.date.getDay() === 0;
      const involvesBYU = game.homeTeamId === byuTeam.id || 
                         game.awayTeamId === byuTeam.id;
      return isSunday && involvesBYU;
    });

    sundayGames.forEach(game => {
      conflicts.push({
        id: uuidv4(),
        type: ConflictType.SUNDAY_RESTRICTION,
        severity: 'critical',
        affectedGames: [game],
        affectedTeams: [byuTeam],
        violations: [{
          type: 'religious_observance',
          severity: 'critical',
          affectedEntities: [game.id, byuTeam.id],
          description: 'BYU cannot play on Sundays due to religious observance',
          possibleResolutions: ['Reschedule to Saturday', 'Date swap with another game']
        }],
        description: 'BYU game scheduled on Sunday violates religious observance policy',
        detectedAt: new Date(),
        metadata: {
          constraintType: 'compliance' as any,
          constraintId: 'byu-sunday-restriction',
          conflictScore: 1.0,
          cascadeRisk: 0.3
        }
      });
    });

    return conflicts;
  }

  /**
   * Detect excessive travel burden
   */
  private detectTravelBurden(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];
    const travelThreshold = 3000; // miles in a week

    schedule.teams.forEach(team => {
      const teamGames = schedule.games
        .filter(g => g.homeTeamId === team.id || g.awayTeamId === team.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      for (let i = 0; i < teamGames.length - 2; i++) {
        const weekGames = [];
        let totalTravel = 0;
        
        // Get games within a week
        for (let j = i; j < teamGames.length; j++) {
          const daysDiff = (teamGames[j].date.getTime() - teamGames[i].date.getTime()) 
                          / (1000 * 60 * 60 * 24);
          if (daysDiff <= 7) {
            weekGames.push(teamGames[j]);
            if (j > i) {
              totalTravel += this.calculateTravelDistance(
                teamGames[j-1],
                teamGames[j],
                team,
                schedule
              );
            }
          } else {
            break;
          }
        }

        if (totalTravel > travelThreshold && weekGames.length > 2) {
          conflicts.push({
            id: uuidv4(),
            type: ConflictType.TRAVEL_BURDEN,
            severity: 'major',
            affectedGames: weekGames,
            affectedTeams: [team],
            violations: [{
              type: 'excessive_travel',
              severity: 'major',
              affectedEntities: [team.id],
              description: `${team.name} travels ${totalTravel} miles in one week`,
              possibleResolutions: ['Reschedule games', 'Swap home/away']
            }],
            description: `Excessive travel burden for ${team.name}`,
            detectedAt: new Date(),
            metadata: {
              constraintType: 'performance' as any,
              constraintId: 'travel-burden',
              conflictScore: 0.8,
              cascadeRisk: 0.5
            }
          });
        }
      }
    });

    return conflicts;
  }

  /**
   * Detect championship date conflicts
   */
  private detectChampionshipConflicts(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];
    
    const championshipGames = schedule.games.filter(g => g.type === 'championship');
    const regularSeasonEnd = new Date(
      Math.max(...schedule.games
        .filter(g => g.type !== 'championship')
        .map(g => g.date.getTime())
      )
    );

    championshipGames.forEach(game => {
      // Championship should be after regular season
      if (game.date <= regularSeasonEnd) {
        conflicts.push({
          id: uuidv4(),
          type: ConflictType.CHAMPIONSHIP_DATE,
          severity: 'critical',
          affectedGames: [game],
          affectedTeams: this.getAffectedTeams([game], schedule),
          violations: [{
            type: 'scheduling_logic',
            severity: 'critical',
            affectedEntities: [game.id],
            description: 'Championship game scheduled before regular season ends',
            possibleResolutions: ['Reschedule championship after regular season']
          }],
          description: 'Championship game date conflicts with regular season',
          detectedAt: new Date(),
          metadata: {
            constraintType: 'logical' as any,
            constraintId: 'championship-timing',
            conflictScore: 1.0,
            cascadeRisk: 0.8
          }
        });
      }
    });

    return conflicts;
  }

  /**
   * Detect back-to-back games
   */
  private detectBackToBackGames(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];
    const minRestDays = 2; // Minimum days between games

    schedule.teams.forEach(team => {
      const teamGames = schedule.games
        .filter(g => g.homeTeamId === team.id || g.awayTeamId === team.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      for (let i = 0; i < teamGames.length - 1; i++) {
        const daysBetween = (teamGames[i + 1].date.getTime() - teamGames[i].date.getTime()) 
                           / (1000 * 60 * 60 * 24);
        
        if (daysBetween < minRestDays) {
          conflicts.push({
            id: uuidv4(),
            type: ConflictType.BACK_TO_BACK_GAMES,
            severity: 'major',
            affectedGames: [teamGames[i], teamGames[i + 1]],
            affectedTeams: [team],
            violations: [{
              type: 'rest_period',
              severity: 'major',
              affectedEntities: [teamGames[i].id, teamGames[i + 1].id],
              description: `Insufficient rest period for ${team.name}`,
              possibleResolutions: ['Reschedule one game', 'Add rest day between']
            }],
            description: `Back-to-back games for ${team.name} without adequate rest`,
            detectedAt: new Date(),
            metadata: {
              constraintType: 'performance' as any,
              constraintId: 'rest-period',
              conflictScore: 0.7,
              cascadeRisk: 0.4
            }
          });
        }
      }
    });

    return conflicts;
  }

  /**
   * Detect home/away imbalances
   */
  private detectHomeAwayImbalance(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];
    const maxConsecutive = 4; // Max consecutive home or away games

    schedule.teams.forEach(team => {
      const teamGames = schedule.games
        .filter(g => g.homeTeamId === team.id || g.awayTeamId === team.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      let consecutiveHome = 0;
      let consecutiveAway = 0;
      let imbalanceStart = 0;

      for (let i = 0; i < teamGames.length; i++) {
        const isHome = teamGames[i].homeTeamId === team.id;
        
        if (isHome) {
          consecutiveHome++;
          consecutiveAway = 0;
        } else {
          consecutiveAway++;
          consecutiveHome = 0;
        }

        if (consecutiveHome > maxConsecutive || consecutiveAway > maxConsecutive) {
          const imbalancedGames = teamGames.slice(
            i - Math.max(consecutiveHome, consecutiveAway) + 1,
            i + 1
          );
          
          conflicts.push({
            id: uuidv4(),
            type: ConflictType.HOME_AWAY_IMBALANCE,
            severity: 'minor',
            affectedGames: imbalancedGames,
            affectedTeams: [team],
            violations: [{
              type: 'competitive_balance',
              severity: 'minor',
              affectedEntities: imbalancedGames.map(g => g.id),
              description: `${team.name} has too many consecutive ${isHome ? 'home' : 'away'} games`,
              possibleResolutions: ['Swap home/away with opponent', 'Reschedule games']
            }],
            description: `Home/away imbalance for ${team.name}`,
            detectedAt: new Date(),
            metadata: {
              constraintType: 'logical' as any,
              constraintId: 'home-away-balance',
              conflictScore: 0.5,
              cascadeRisk: 0.2
            }
          });
          
          // Reset counters after detecting imbalance
          consecutiveHome = 0;
          consecutiveAway = 0;
        }
      }
    });

    return conflicts;
  }

  /**
   * Detect TV slot conflicts
   */
  private detectTVSlotConflicts(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];
    const tvGames = schedule.games.filter(g => g.metadata?.tvNetwork);
    
    // Group by TV network and time slot
    const tvSlots = new Map<string, Game[]>();
    
    tvGames.forEach(game => {
      const key = `${game.metadata!.tvNetwork}-${game.date.toDateString()}-${game.time}`;
      if (!tvSlots.has(key)) {
        tvSlots.set(key, []);
      }
      tvSlots.get(key)!.push(game);
    });

    // Find conflicts
    for (const [key, games] of tvSlots) {
      if (games.length > 1) {
        const network = games[0].metadata!.tvNetwork;
        conflicts.push({
          id: uuidv4(),
          type: ConflictType.TV_SLOT_CONFLICT,
          severity: 'major',
          affectedGames: games,
          affectedTeams: this.getAffectedTeams(games, schedule),
          violations: [{
            type: 'broadcast_conflict',
            severity: 'major',
            affectedEntities: games.map(g => g.id),
            description: `Multiple games scheduled for ${network} at the same time`,
            possibleResolutions: ['Change broadcast time', 'Move to different network']
          }],
          description: `TV broadcast conflict on ${network}`,
          detectedAt: new Date(),
          metadata: {
            constraintType: 'logical' as any,
            constraintId: 'tv-broadcast',
            conflictScore: 0.9,
            cascadeRisk: 0.6
          }
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect weather-related conflicts
   */
  private detectWeatherConflicts(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];
    
    // Check for outdoor games in winter months in cold climates
    const winterMonths = [11, 0, 1, 2]; // Nov, Dec, Jan, Feb
    const coldStates = ['MN', 'WI', 'MI', 'ND', 'SD', 'MT', 'WY', 'CO', 'UT'];
    
    schedule.games.forEach(game => {
      const venue = schedule.venues.find(v => v.id === game.venueId);
      if (!venue) return;
      
      const isWinter = winterMonths.includes(game.date.getMonth());
      const isColdState = coldStates.includes(venue.location.state);
      const isOutdoor = !venue.name.toLowerCase().includes('indoor') &&
                       !venue.name.toLowerCase().includes('dome');
      
      if (isWinter && isColdState && isOutdoor && game.sport === 'football') {
        conflicts.push({
          id: uuidv4(),
          type: ConflictType.WEATHER_RESTRICTION,
          severity: 'minor',
          affectedGames: [game],
          affectedTeams: this.getAffectedTeams([game], schedule),
          affectedVenues: [venue],
          violations: [{
            type: 'weather_concern',
            severity: 'minor',
            affectedEntities: [game.id, venue.id],
            description: `Potential severe weather conditions at ${venue.name}`,
            possibleResolutions: ['Monitor weather', 'Have contingency plan', 'Consider indoor venue']
          }],
          description: `Weather concern for outdoor game in ${venue.location.city}`,
          detectedAt: new Date(),
          metadata: {
            constraintType: 'spatial' as any,
            constraintId: 'weather-safety',
            conflictScore: 0.4,
            cascadeRisk: 0.3
          }
        });
      }
    });

    return conflicts;
  }

  /**
   * Detect academic calendar conflicts
   */
  private detectAcademicConflicts(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];
    
    // Define typical finals weeks (simplified)
    const isFinalsWeek = (date: Date): boolean => {
      const month = date.getMonth();
      const day = date.getDate();
      
      // December finals (typically 2nd-3rd week)
      if (month === 11 && day >= 8 && day <= 20) return true;
      
      // May finals (typically 1st-2nd week)
      if (month === 4 && day >= 1 && day <= 14) return true;
      
      return false;
    };
    
    schedule.games.forEach(game => {
      if (isFinalsWeek(game.date)) {
        conflicts.push({
          id: uuidv4(),
          type: ConflictType.ACADEMIC_CALENDAR,
          severity: 'minor',
          affectedGames: [game],
          affectedTeams: this.getAffectedTeams([game], schedule),
          violations: [{
            type: 'academic_priority',
            severity: 'minor',
            affectedEntities: [game.id],
            description: 'Game scheduled during finals week',
            possibleResolutions: ['Reschedule before/after finals', 'Request academic accommodation']
          }],
          description: 'Game conflicts with academic finals period',
          detectedAt: new Date(),
          metadata: {
            constraintType: 'compliance' as any,
            constraintId: 'academic-calendar',
            conflictScore: 0.3,
            cascadeRisk: 0.1
          }
        });
      }
    });

    return conflicts;
  }

  /**
   * Helper methods
   */
  private getAffectedTeams(games: Game[], schedule: Schedule): Team[] {
    const teamIds = new Set<string>();
    games.forEach(game => {
      teamIds.add(game.homeTeamId);
      teamIds.add(game.awayTeamId);
    });
    
    return schedule.teams.filter(t => teamIds.has(t.id));
  }

  private analyzeVenueBookingCause(conflict: Conflict, schedule: Schedule): string {
    const games = conflict.affectedGames;
    if (games.some(g => g.metadata?.requiredDate)) {
      return 'Fixed date requirements caused venue scheduling conflict';
    }
    
    const venue = conflict.affectedVenues?.[0];
    if (venue?.sharedBy && venue.sharedBy.length > 1) {
      return 'Multiple teams sharing venue led to booking conflict';
    }
    
    return 'Scheduling algorithm failed to detect venue availability';
  }

  private analyzeTravelBurdenCause(conflict: Conflict, schedule: Schedule): string {
    const team = conflict.affectedTeams[0];
    const games = conflict.affectedGames;
    
    const awayGames = games.filter(g => g.awayTeamId === team.id).length;
    if (awayGames > games.length * 0.7) {
      return 'Too many consecutive away games creating travel burden';
    }
    
    return 'Suboptimal game sequencing resulted in excessive travel';
  }

  private matchesSeasonalTrend(
    date: Date | undefined,
    trend: 'early' | 'mid' | 'late' | 'throughout'
  ): boolean {
    if (!date || trend === 'throughout') return true;
    
    const month = date.getMonth();
    
    switch (trend) {
      case 'early':
        return month >= 7 && month <= 9; // Aug-Oct
      case 'mid':
        return month >= 10 || month <= 0; // Nov-Jan
      case 'late':
        return month >= 1 && month <= 4; // Feb-May
      default:
        return true;
    }
  }

  private identifyPotentialCascades(
    conflict: Conflict,
    schedule: Schedule
  ): Game[] {
    const cascadeGames: Game[] = [];
    
    // Games that might be affected if we modify the conflicted games
    conflict.affectedGames.forEach(game => {
      // Find games with same teams within 7 days
      const nearbyGames = schedule.games.filter(g => {
        if (g.id === game.id) return false;
        
        const sameTeams = g.homeTeamId === game.homeTeamId ||
                         g.homeTeamId === game.awayTeamId ||
                         g.awayTeamId === game.homeTeamId ||
                         g.awayTeamId === game.awayTeamId;
        
        const daysDiff = Math.abs(g.date.getTime() - game.date.getTime()) 
                        / (1000 * 60 * 60 * 24);
        
        return sameTeams && daysDiff <= 7;
      });
      
      cascadeGames.push(...nearbyGames);
    });
    
    return [...new Set(cascadeGames)]; // Remove duplicates
  }

  private generateRiskDescription(
    cascadeRisk: 'low' | 'medium' | 'high',
    complianceRisk: boolean,
    reputationalRisk: boolean,
    financialRisk: number
  ): string {
    const risks: string[] = [];
    
    if (cascadeRisk !== 'low') {
      risks.push(`${cascadeRisk} risk of cascading schedule changes`);
    }
    
    if (complianceRisk) {
      risks.push('regulatory compliance at risk');
    }
    
    if (reputationalRisk) {
      risks.push('potential reputational impact');
    }
    
    if (financialRisk > 0) {
      risks.push(`estimated financial impact: $${financialRisk.toLocaleString()}`);
    }
    
    return risks.length > 0 
      ? `Risk factors: ${risks.join(', ')}` 
      : 'Minimal risk identified';
  }

  private generateResolutionSuggestion(
    conflict: Conflict,
    strategy: ResolutionStrategy,
    schedule: Schedule
  ): Resolution | null {
    // This is a placeholder - actual implementation would generate
    // specific resolution details based on the strategy
    return {
      id: uuidv4(),
      conflictId: conflict.id,
      strategy,
      description: `Apply ${strategy} strategy to resolve conflict`,
      modifications: [],
      impact: {
        teamsAffected: conflict.affectedTeams.map(t => t.id),
        venuesAffected: conflict.affectedVenues?.map(v => v.id) || [],
        gamesModified: conflict.affectedGames.length,
        travelDistanceChange: 0,
        fanImpact: 'moderate'
      },
      feasibility: 0.7,
      recommendationScore: 0.8,
      status: 'proposed',
      metadata: {
        generatedBy: 'rule-based',
        confidence: 0.7,
        reasoning: 'Based on historical pattern matching'
      }
    };
  }

  private generateDefaultResolutions(
    conflict: Conflict,
    schedule: Schedule
  ): Resolution[] {
    // Generate basic resolutions when no patterns match
    const resolutions: Resolution[] = [];
    
    // Always suggest manual override as last resort
    resolutions.push({
      id: uuidv4(),
      conflictId: conflict.id,
      strategy: ResolutionStrategy.MANUAL_OVERRIDE,
      description: 'Require manual intervention to resolve',
      modifications: [],
      impact: {
        teamsAffected: conflict.affectedTeams.map(t => t.id),
        venuesAffected: [],
        gamesModified: conflict.affectedGames.length,
        travelDistanceChange: 0,
        fanImpact: 'minimal'
      },
      feasibility: 0.5,
      recommendationScore: 0.3,
      status: 'proposed',
      metadata: {
        generatedBy: 'rule-based',
        confidence: 0.5,
        reasoning: 'Default fallback resolution'
      }
    });
    
    return resolutions;
  }

  private calculateTravelDistance(
    game1: Game,
    game2: Game,
    team: Team,
    schedule: Schedule
  ): number {
    // Simplified distance calculation
    // In production, would use actual geographic coordinates
    const venue1 = schedule.venues.find(v => v.id === game1.venueId);
    const venue2 = schedule.venues.find(v => v.id === game2.venueId);
    
    if (!venue1 || !venue2) return 0;
    
    // Haversine formula simplified
    const lat1 = venue1.location.latitude;
    const lon1 = venue1.location.longitude;
    const lat2 = venue2.location.latitude;
    const lon2 = venue2.location.longitude;
    
    const R = 3959; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance);
  }

  private initializePatternDatabase(): Map<ConflictType, ConflictPattern[]> {
    const patterns = new Map<ConflictType, ConflictPattern[]>();
    
    // Venue double-booking patterns
    patterns.set(ConflictType.VENUE_DOUBLE_BOOKING, [
      {
        id: 'vdb-1',
        type: ConflictType.VENUE_DOUBLE_BOOKING,
        frequency: 0.15,
        commonCauses: ['Shared venues', 'Last-minute changes', 'Communication gaps'],
        successfulStrategies: [
          ResolutionStrategy.TIME_SHIFT,
          ResolutionStrategy.ALTERNATIVE_VENUE
        ],
        seasonalTrend: 'throughout',
        sportSpecific: ['basketball', 'volleyball']
      }
    ]);
    
    // Sunday restriction patterns
    patterns.set(ConflictType.SUNDAY_RESTRICTION, [
      {
        id: 'sr-1',
        type: ConflictType.SUNDAY_RESTRICTION,
        frequency: 0.05,
        commonCauses: ['Tournament scheduling', 'TV requirements'],
        successfulStrategies: [
          ResolutionStrategy.DATE_SWAP,
          ResolutionStrategy.WAIVER_REQUEST
        ],
        seasonalTrend: 'throughout',
        sportSpecific: ['football', 'basketball']
      }
    ]);
    
    // Travel burden patterns
    patterns.set(ConflictType.TRAVEL_BURDEN, [
      {
        id: 'tb-1',
        type: ConflictType.TRAVEL_BURDEN,
        frequency: 0.20,
        commonCauses: ['Conference expansion', 'Unbalanced scheduling'],
        successfulStrategies: [
          ResolutionStrategy.GAME_SWAP,
          ResolutionStrategy.DATE_SWAP
        ],
        seasonalTrend: 'mid',
        sportSpecific: ['basketball', 'volleyball']
      }
    ]);
    
    return patterns;
  }

  private initializeRiskThresholds(): Map<string, number> {
    return new Map([
      ['cascade_threshold', 0.6],
      ['compliance_threshold', 0.9],
      ['reputation_threshold', 0.7],
      ['financial_threshold', 25000]
    ]);
  }
}