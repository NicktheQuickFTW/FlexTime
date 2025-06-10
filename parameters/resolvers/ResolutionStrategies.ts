// Collection of resolution strategies for different conflict types
// Each strategy implements specific logic to resolve conflicts

import {
  Conflict,
  ConflictType,
  Resolution,
  ResolutionStrategy,
  ResolutionModification,
  ResolutionImpact,
  ConflictAnalysis
} from '../types/conflict-types';
import { Schedule, Game, Venue, Team } from '../types/schedule-types';
import { v4 as uuidv4 } from 'uuid';

export class ResolutionStrategies {
  private strategies: Map<ResolutionStrategy, StrategyHandler>;

  constructor() {
    this.strategies = new Map();
    this.initializeStrategies();
  }

  /**
   * Generates a resolution using the specified strategy
   */
  async generateResolution(
    strategy: ResolutionStrategy,
    conflict: Conflict,
    schedule: Schedule,
    analysis: ConflictAnalysis
  ): Promise<Resolution | null> {
    const handler = this.strategies.get(strategy);
    if (!handler) {
      console.warn(`No handler found for strategy: ${strategy}`);
      return null;
    }

    try {
      return await handler(conflict, schedule, analysis);
    } catch (error) {
      console.error(`Error executing strategy ${strategy}:`, error);
      return null;
    }
  }

  /**
   * Initializes all resolution strategy handlers
   */
  private initializeStrategies(): void {
    this.strategies.set(ResolutionStrategy.TIME_SHIFT, this.timeShiftStrategy.bind(this));
    this.strategies.set(ResolutionStrategy.VENUE_SWAP, this.venueSwapStrategy.bind(this));
    this.strategies.set(ResolutionStrategy.DATE_SWAP, this.dateSwapStrategy.bind(this));
    this.strategies.set(ResolutionStrategy.GAME_SWAP, this.gameSwapStrategy.bind(this));
    this.strategies.set(ResolutionStrategy.RESCHEDULE, this.rescheduleStrategy.bind(this));
    this.strategies.set(ResolutionStrategy.SPLIT_DOUBLEHEADER, this.splitDoubleheaderStrategy.bind(this));
    this.strategies.set(ResolutionStrategy.ALTERNATIVE_VENUE, this.alternativeVenueStrategy.bind(this));
    this.strategies.set(ResolutionStrategy.WAIVER_REQUEST, this.waiverRequestStrategy.bind(this));
    this.strategies.set(ResolutionStrategy.MANUAL_OVERRIDE, this.manualOverrideStrategy.bind(this));
  }

  /**
   * Time Shift Strategy - Adjusts game times to resolve conflicts
   */
  private async timeShiftStrategy(
    conflict: Conflict,
    schedule: Schedule,
    analysis: ConflictAnalysis
  ): Promise<Resolution | null> {
    const modifications: ResolutionModification[] = [];
    
    // Handle venue double-booking with time shifts
    if (conflict.type === ConflictType.VENUE_DOUBLE_BOOKING) {
      const conflictingGames = conflict.affectedGames;
      
      // Try to find non-overlapping time slots
      const timeSlots = this.findAvailableTimeSlots(conflictingGames[0].date, schedule);
      
      if (timeSlots.length >= conflictingGames.length) {
        conflictingGames.forEach((game, index) => {
          modifications.push({
            type: 'modify',
            targetGameId: game.id,
            originalValue: game.time,
            newValue: timeSlots[index],
            field: 'time'
          });
        });
      } else {
        return null; // Cannot resolve with time shifts alone
      }
    }

    // Handle Sunday restrictions for BYU
    if (conflict.type === ConflictType.SUNDAY_RESTRICTION) {
      const sundayGame = conflict.affectedGames[0];
      const saturdayTime = this.findSaturdayEvening(sundayGame.date);
      
      modifications.push({
        type: 'modify',
        targetGameId: sundayGame.id,
        originalValue: sundayGame.time,
        newValue: saturdayTime,
        field: 'time'
      });
    }

    return this.createResolution(
      conflict.id,
      ResolutionStrategy.TIME_SHIFT,
      modifications,
      schedule,
      'Adjust game times to resolve scheduling conflict'
    );
  }

  /**
   * Venue Swap Strategy - Swaps venues between games
   */
  private async venueSwapStrategy(
    conflict: Conflict,
    schedule: Schedule,
    analysis: ConflictAnalysis
  ): Promise<Resolution | null> {
    const modifications: ResolutionModification[] = [];

    if (conflict.type === ConflictType.VENUE_DOUBLE_BOOKING) {
      const [game1, game2] = conflict.affectedGames;
      
      // Check if teams can swap home/away
      if (this.canSwapHomeAway(game1, game2, schedule)) {
        modifications.push(
          {
            type: 'swap',
            targetGameId: game1.id,
            originalValue: game1.venueId,
            newValue: game2.venueId,
            field: 'venueId'
          },
          {
            type: 'swap',
            targetGameId: game2.id,
            originalValue: game2.venueId,
            newValue: game1.venueId,
            field: 'venueId'
          }
        );
      }
    }

    if (modifications.length === 0) return null;

    return this.createResolution(
      conflict.id,
      ResolutionStrategy.VENUE_SWAP,
      modifications,
      schedule,
      'Swap venues between conflicting games'
    );
  }

  /**
   * Date Swap Strategy - Swaps dates between games
   */
  private async dateSwapStrategy(
    conflict: Conflict,
    schedule: Schedule,
    analysis: ConflictAnalysis
  ): Promise<Resolution | null> {
    const modifications: ResolutionModification[] = [];

    // Find suitable games to swap dates with
    const swapCandidates = this.findDateSwapCandidates(
      conflict.affectedGames[0],
      schedule,
      conflict.type
    );

    if (swapCandidates.length > 0) {
      const targetGame = conflict.affectedGames[0];
      const swapGame = swapCandidates[0];

      modifications.push(
        {
          type: 'swap',
          targetGameId: targetGame.id,
          originalValue: targetGame.date,
          newValue: swapGame.date,
          field: 'date'
        },
        {
          type: 'swap',
          targetGameId: swapGame.id,
          originalValue: swapGame.date,
          newValue: targetGame.date,
          field: 'date'
        }
      );
    }

    if (modifications.length === 0) return null;

    return this.createResolution(
      conflict.id,
      ResolutionStrategy.DATE_SWAP,
      modifications,
      schedule,
      'Swap game dates to resolve conflict'
    );
  }

  /**
   * Game Swap Strategy - Swaps entire games in the schedule
   */
  private async gameSwapStrategy(
    conflict: Conflict,
    schedule: Schedule,
    analysis: ConflictAnalysis
  ): Promise<Resolution | null> {
    const modifications: ResolutionModification[] = [];

    if (conflict.type === ConflictType.TRAVEL_BURDEN) {
      // Find games that can be swapped to reduce travel
      const travelOptimizedSwaps = this.findTravelOptimizedSwaps(
        conflict.affectedTeams[0],
        schedule
      );

      for (const swap of travelOptimizedSwaps) {
        modifications.push(
          {
            type: 'swap',
            targetGameId: swap.game1.id,
            originalValue: swap.game1.date,
            newValue: swap.game2.date,
            field: 'date'
          },
          {
            type: 'swap',
            targetGameId: swap.game2.id,
            originalValue: swap.game2.date,
            newValue: swap.game1.date,
            field: 'date'
          }
        );
      }
    }

    if (modifications.length === 0) return null;

    return this.createResolution(
      conflict.id,
      ResolutionStrategy.GAME_SWAP,
      modifications,
      schedule,
      'Swap games to optimize schedule'
    );
  }

  /**
   * Reschedule Strategy - Completely reschedules affected games
   */
  private async rescheduleStrategy(
    conflict: Conflict,
    schedule: Schedule,
    analysis: ConflictAnalysis
  ): Promise<Resolution | null> {
    const modifications: ResolutionModification[] = [];

    if (conflict.type === ConflictType.CHAMPIONSHIP_DATE) {
      // Find new dates for championship games
      const championshipGames = conflict.affectedGames;
      const availableDates = this.findChampionshipDates(schedule);

      if (availableDates.length >= championshipGames.length) {
        championshipGames.forEach((game, index) => {
          modifications.push({
            type: 'reschedule',
            targetGameId: game.id,
            originalValue: game.date,
            newValue: availableDates[index],
            field: 'date'
          });
        });
      }
    }

    if (modifications.length === 0) return null;

    return this.createResolution(
      conflict.id,
      ResolutionStrategy.RESCHEDULE,
      modifications,
      schedule,
      'Reschedule games to available dates'
    );
  }

  /**
   * Split Doubleheader Strategy - Splits back-to-back games
   */
  private async splitDoubleheaderStrategy(
    conflict: Conflict,
    schedule: Schedule,
    analysis: ConflictAnalysis
  ): Promise<Resolution | null> {
    const modifications: ResolutionModification[] = [];

    if (conflict.type === ConflictType.BACK_TO_BACK_GAMES) {
      const games = conflict.affectedGames;
      const availableDates = this.findNearbyAvailableDates(games[0].date, schedule);

      if (availableDates.length > 0) {
        modifications.push({
          type: 'reschedule',
          targetGameId: games[1].id,
          originalValue: games[1].date,
          newValue: availableDates[0],
          field: 'date'
        });
      }
    }

    if (modifications.length === 0) return null;

    return this.createResolution(
      conflict.id,
      ResolutionStrategy.SPLIT_DOUBLEHEADER,
      modifications,
      schedule,
      'Split doubleheader games across different dates'
    );
  }

  /**
   * Alternative Venue Strategy - Finds alternative venues
   */
  private async alternativeVenueStrategy(
    conflict: Conflict,
    schedule: Schedule,
    analysis: ConflictAnalysis
  ): Promise<Resolution | null> {
    const modifications: ResolutionModification[] = [];

    const game = conflict.affectedGames[0];
    const alternativeVenues = this.findAlternativeVenues(
      game,
      schedule,
      conflict.type === ConflictType.WEATHER_RESTRICTION
    );

    if (alternativeVenues.length > 0) {
      modifications.push({
        type: 'relocate',
        targetGameId: game.id,
        originalValue: game.venueId,
        newValue: alternativeVenues[0].id,
        field: 'venueId'
      });
    }

    if (modifications.length === 0) return null;

    return this.createResolution(
      conflict.id,
      ResolutionStrategy.ALTERNATIVE_VENUE,
      modifications,
      schedule,
      'Move game to alternative venue'
    );
  }

  /**
   * Waiver Request Strategy - Requests exception to constraints
   */
  private async waiverRequestStrategy(
    conflict: Conflict,
    schedule: Schedule,
    analysis: ConflictAnalysis
  ): Promise<Resolution | null> {
    // This strategy doesn't modify the schedule but requests an exception
    const resolution: Resolution = {
      id: uuidv4(),
      conflictId: conflict.id,
      strategy: ResolutionStrategy.WAIVER_REQUEST,
      description: `Request waiver for ${conflict.type} constraint`,
      modifications: [],
      impact: {
        teamsAffected: conflict.affectedTeams.map(t => t.id),
        venuesAffected: [],
        gamesModified: 0,
        travelDistanceChange: 0,
        fanImpact: 'minimal'
      },
      feasibility: 0.6, // Waivers are moderately feasible
      recommendationScore: 0,
      status: 'proposed',
      metadata: {
        generatedBy: 'rule-based',
        confidence: 0.7,
        reasoning: `Waiver requested due to ${analysis.rootCause}`
      }
    };

    return resolution;
  }

  /**
   * Manual Override Strategy - Requires human intervention
   */
  private async manualOverrideStrategy(
    conflict: Conflict,
    schedule: Schedule,
    analysis: ConflictAnalysis
  ): Promise<Resolution | null> {
    const resolution: Resolution = {
      id: uuidv4(),
      conflictId: conflict.id,
      strategy: ResolutionStrategy.MANUAL_OVERRIDE,
      description: 'Manual intervention required',
      modifications: [],
      impact: {
        teamsAffected: conflict.affectedTeams.map(t => t.id),
        venuesAffected: conflict.affectedVenues?.map(v => v.id) || [],
        gamesModified: conflict.affectedGames.length,
        travelDistanceChange: 0,
        fanImpact: 'moderate'
      },
      feasibility: 0.3, // Manual overrides are least preferred
      recommendationScore: 0,
      status: 'proposed',
      metadata: {
        generatedBy: 'manual',
        confidence: 0.5,
        reasoning: 'Complex conflict requires human judgment'
      }
    };

    return resolution;
  }

  /**
   * Helper method to create a resolution object
   */
  private createResolution(
    conflictId: string,
    strategy: ResolutionStrategy,
    modifications: ResolutionModification[],
    schedule: Schedule,
    description: string
  ): Resolution {
    const impact = this.calculateImpact(modifications, schedule);
    const feasibility = this.calculateFeasibility(modifications, schedule);

    return {
      id: uuidv4(),
      conflictId,
      strategy,
      description,
      modifications,
      impact,
      feasibility,
      recommendationScore: 0, // Will be set by SmartConflictResolver
      status: 'proposed',
      metadata: {
        generatedBy: 'rule-based',
        confidence: feasibility,
        reasoning: description
      }
    };
  }

  /**
   * Helper methods for finding alternatives
   */
  private findAvailableTimeSlots(date: Date, schedule: Schedule): string[] {
    const slots = ['09:00', '12:00', '15:00', '18:00', '20:00'];
    const usedSlots = schedule.games
      .filter(g => g.date.toDateString() === date.toDateString())
      .map(g => g.time);
    
    return slots.filter(slot => !usedSlots.includes(slot));
  }

  private findSaturdayEvening(sundayDate: Date): string {
    // Move to Saturday evening (day before)
    const saturday = new Date(sundayDate);
    saturday.setDate(saturday.getDate() - 1);
    return '18:00'; // 6 PM Saturday
  }

  private canSwapHomeAway(game1: Game, game2: Game, schedule: Schedule): boolean {
    // Check if the teams involved can swap their home/away status
    // This involves checking travel constraints, venue availability, etc.
    return true; // Simplified implementation
  }

  private findDateSwapCandidates(
    game: Game,
    schedule: Schedule,
    conflictType: ConflictType
  ): Game[] {
    return schedule.games.filter(g => {
      // Don't swap with self
      if (g.id === game.id) return false;
      
      // Must involve at least one of the same teams
      const sameTeams = g.homeTeamId === game.homeTeamId || 
                       g.homeTeamId === game.awayTeamId ||
                       g.awayTeamId === game.homeTeamId ||
                       g.awayTeamId === game.awayTeamId;
      
      if (!sameTeams) return false;

      // Special handling for Sunday restrictions
      if (conflictType === ConflictType.SUNDAY_RESTRICTION) {
        return g.date.getDay() !== 0; // Not a Sunday
      }

      return true;
    });
  }

  private findTravelOptimizedSwaps(
    team: Team,
    schedule: Schedule
  ): Array<{ game1: Game; game2: Game }> {
    // Find game pairs that can be swapped to reduce travel
    // Simplified implementation
    return [];
  }

  private findChampionshipDates(schedule: Schedule): Date[] {
    // Find suitable dates for championship games
    // Typically at the end of the season with no conflicts
    const seasonEnd = new Date(Math.max(...schedule.games.map(g => g.date.getTime())));
    const dates: Date[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(seasonEnd);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }

  private findNearbyAvailableDates(
    originalDate: Date,
    schedule: Schedule
  ): Date[] {
    const dates: Date[] = [];
    const maxDaysToCheck = 7;
    
    for (let i = 1; i <= maxDaysToCheck; i++) {
      const before = new Date(originalDate);
      before.setDate(before.getDate() - i);
      
      const after = new Date(originalDate);
      after.setDate(after.getDate() + i);
      
      dates.push(before, after);
    }
    
    return dates.filter(date => this.isDateAvailable(date, schedule));
  }

  private findAlternativeVenues(
    game: Game,
    schedule: Schedule,
    weatherSafe: boolean = false
  ): Venue[] {
    return schedule.venues.filter(venue => {
      // Must support the sport
      if (!venue.sports.includes(game.sport)) return false;
      
      // Must be available on the date
      if (!this.isVenueAvailable(venue, game.date)) return false;
      
      // For weather restrictions, prefer indoor venues
      if (weatherSafe && !venue.name.toLowerCase().includes('indoor')) {
        return false;
      }
      
      // Prefer venues in the same region
      const homeTeam = schedule.teams.find(t => t.id === game.homeTeamId);
      if (homeTeam && venue.location.state !== schedule.venues
        .find(v => v.id === homeTeam.homeVenue)?.location.state) {
        return false;
      }
      
      return true;
    });
  }

  private isDateAvailable(date: Date, schedule: Schedule): boolean {
    // Check if date has too many games already
    const gamesOnDate = schedule.games.filter(
      g => g.date.toDateString() === date.toDateString()
    );
    return gamesOnDate.length < 10; // Arbitrary limit
  }

  private isVenueAvailable(venue: Venue, date: Date): boolean {
    if (!venue.availability) return true;
    
    return venue.availability.some(avail => 
      date >= avail.startDate && 
      date <= avail.endDate && 
      avail.available
    );
  }

  private calculateImpact(
    modifications: ResolutionModification[],
    schedule: Schedule
  ): ResolutionImpact {
    const affectedGameIds = new Set(modifications.map(m => m.targetGameId));
    const affectedGames = schedule.games.filter(g => affectedGameIds.has(g.id));
    
    const teamsAffected = new Set<string>();
    const venuesAffected = new Set<string>();
    
    affectedGames.forEach(game => {
      teamsAffected.add(game.homeTeamId);
      teamsAffected.add(game.awayTeamId);
      venuesAffected.add(game.venueId);
    });

    return {
      teamsAffected: Array.from(teamsAffected),
      venuesAffected: Array.from(venuesAffected),
      gamesModified: affectedGames.length,
      travelDistanceChange: 0, // Would calculate actual distance change
      fanImpact: this.assessFanImpact(modifications),
      tvImpact: modifications.some(m => m.field === 'time' || m.field === 'date'),
      competitiveBalance: 0 // Neutral by default
    };
  }

  private calculateFeasibility(
    modifications: ResolutionModification[],
    schedule: Schedule
  ): number {
    // Base feasibility
    let feasibility = 0.8;
    
    // Reduce for each modification (more changes = less feasible)
    feasibility -= modifications.length * 0.05;
    
    // Reduce for date changes (harder than time changes)
    const dateChanges = modifications.filter(m => m.field === 'date').length;
    feasibility -= dateChanges * 0.1;
    
    // Reduce for venue changes (logistically complex)
    const venueChanges = modifications.filter(m => m.field === 'venueId').length;
    feasibility -= venueChanges * 0.15;
    
    return Math.max(0.1, Math.min(1.0, feasibility));
  }

  private assessFanImpact(modifications: ResolutionModification[]): 'minimal' | 'moderate' | 'significant' {
    const significantChanges = modifications.filter(
      m => m.field === 'date' || m.field === 'venueId'
    ).length;
    
    if (significantChanges === 0) return 'minimal';
    if (significantChanges <= 2) return 'moderate';
    return 'significant';
  }
}

type StrategyHandler = (
  conflict: Conflict,
  schedule: Schedule,
  analysis: ConflictAnalysis
) => Promise<Resolution | null>;