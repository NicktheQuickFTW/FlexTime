// Venue Sharing Constraints - Big 12 Conference
// Manages facilities shared between multiple sports

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

export const venueSharingConstraints: UnifiedConstraint[] = [
  {
    id: 'shared-venue-conflicts',
    name: 'Shared Venue Conflict Prevention',
    type: ConstraintType.SPATIAL,
    hardness: ConstraintHardness.HARD,
    weight: 100,
    scope: {
      sports: ['All'],
      conferences: ['Big 12']
    },
    parameters: {
      sharedVenues: {
        'basketball_arena': {
          sports: ['Men\'s Basketball', 'Women\'s Basketball', 'Volleyball', 'Wrestling'],
          flipTime: 60, // Minutes needed between events
          teams: ['All']
        },
        'baseball_softball_complex': {
          sports: ['Baseball', 'Softball'],
          flipTime: 30,
          teams: ['Teams with shared complexes']
        },
        'multi_purpose_stadium': {
          sports: ['Football', 'Soccer'],
          flipTime: 240, // 4 hours for major conversions
          teams: ['Teams with multi-purpose facilities']
        }
      },
      minimumBufferTime: 30, // Minutes
      preferredBufferTime: 60
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      
      // Group games by venue and date
      const venueSchedule = new Map<string, Map<string, Game[]>>();
      
      schedule.games.forEach(game => {
        if (!venueSchedule.has(game.venueId)) {
          venueSchedule.set(game.venueId, new Map());
        }
        
        const dateStr = game.date.toISOString().split('T')[0];
        if (!venueSchedule.get(game.venueId)!.has(dateStr)) {
          venueSchedule.get(game.venueId)!.set(dateStr, []);
        }
        
        venueSchedule.get(game.venueId)!.get(dateStr)!.push(game);
      });
      
      // Check each venue's daily schedule
      venueSchedule.forEach((dailySchedules, venueId) => {
        dailySchedules.forEach((games, date) => {
          if (games.length > 1) {
            // Sort games by time
            const sortedGames = games.sort((a, b) => {
              const timeA = parseInt(a.time.replace(':', ''));
              const timeB = parseInt(b.time.replace(':', ''));
              return timeA - timeB;
            });
            
            // Check time conflicts
            for (let i = 0; i < sortedGames.length - 1; i++) {
              const game1 = sortedGames[i];
              const game2 = sortedGames[i + 1];
              
              // Calculate time between games
              const endTime1 = calculateEndTime(game1);
              const startTime2 = parseInt(game2.time.replace(':', ''));
              const bufferMinutes = calculateBufferMinutes(endTime1, startTime2);
              
              // Determine required flip time
              let requiredFlipTime = params.minimumBufferTime;
              
              // Check if sports require special flip time
              for (const [venueType, config] of Object.entries(params.sharedVenues)) {
                if (config.sports.includes(game1.sport) && config.sports.includes(game2.sport)) {
                  requiredFlipTime = Math.max(requiredFlipTime, config.flipTime);
                  break;
                }
              }
              
              if (bufferMinutes < requiredFlipTime) {
                violations.push({
                  type: 'venue_time_conflict',
                  severity: 'critical',
                  affectedEntities: [game1.id, game2.id],
                  description: `Only ${bufferMinutes} minutes between ${game1.sport} and ${game2.sport} at ${venueId}`,
                  possibleResolutions: [`Need ${requiredFlipTime} minutes minimum`]
                });
              }
            }
          }
        });
      });
      
      return {
        constraintId: 'shared-venue-conflicts',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'No venue conflicts detected'
          : `Found ${violations.length} venue conflicts`,
        violations
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Prevents scheduling conflicts at shared venues',
      tags: ['venue', 'shared', 'conflict', 'spatial']
    },
    cacheable: false,
    priority: 100
  },

  {
    id: 'venue-utilization-balance',
    name: 'Venue Utilization Balance',
    type: ConstraintType.PERFORMANCE,
    hardness: ConstraintHardness.SOFT,
    weight: 70,
    scope: {
      sports: ['All'],
      conferences: ['Big 12']
    },
    parameters: {
      maxDailyEvents: 3,
      preferredDailyEvents: 2,
      maintenanceWindowDays: ['Monday'], // Preferred maintenance days
      utilizationTargets: {
        basketball: 0.7, // 70% utilization during season
        football: 0.9, // 90% for limited home games
        baseball: 0.6 // 60% to allow weather flexibility
      }
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      // Analyze venue utilization
      const venueUsage = new Map<string, {
        totalEvents: number;
        peakDayEvents: number;
        maintenanceConflicts: number;
        dailyDistribution: Map<string, number>;
      }>();
      
      // Group by venue and date
      schedule.games.forEach(game => {
        if (!venueUsage.has(game.venueId)) {
          venueUsage.set(game.venueId, {
            totalEvents: 0,
            peakDayEvents: 0,
            maintenanceConflicts: 0,
            dailyDistribution: new Map()
          });
        }
        
        const usage = venueUsage.get(game.venueId)!;
        usage.totalEvents++;
        
        const dateStr = game.date.toISOString().split('T')[0];
        const dayCount = (usage.dailyDistribution.get(dateStr) || 0) + 1;
        usage.dailyDistribution.set(dateStr, dayCount);
        
        if (dayCount > usage.peakDayEvents) {
          usage.peakDayEvents = dayCount;
        }
        
        // Check maintenance day conflicts
        if (params.maintenanceWindowDays.includes(getDayName(game.date.getDay()))) {
          usage.maintenanceConflicts++;
        }
      });
      
      // Evaluate usage patterns
      venueUsage.forEach((usage, venueId) => {
        // Check peak usage
        if (usage.peakDayEvents > params.maxDailyEvents) {
          score *= 0.8;
          suggestions.push({
            type: 'excessive_daily_usage',
            priority: 'high',
            description: `${venueId} has ${usage.peakDayEvents} events in one day`,
            implementation: 'Distribute events more evenly',
            expectedImprovement: 20
          });
        } else if (usage.peakDayEvents > params.preferredDailyEvents) {
          score *= 0.95;
          suggestions.push({
            type: 'high_daily_usage',
            priority: 'medium',
            description: `${venueId} frequently exceeds preferred daily limit`,
            implementation: 'Optimize daily event distribution',
            expectedImprovement: 5
          });
        }
        
        // Check maintenance conflicts
        if (usage.maintenanceConflicts > usage.totalEvents * 0.15) {
          score *= 0.95;
          suggestions.push({
            type: 'maintenance_window_conflicts',
            priority: 'low',
            description: `${venueId} has many Monday events`,
            implementation: 'Reserve Mondays for maintenance when possible',
            expectedImprovement: 5
          });
        }
      });
      
      return {
        constraintId: 'venue-utilization-balance',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `Venue utilization score: ${(score * 100).toFixed(1)}%`,
        suggestions
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Optimizes venue utilization and maintenance windows',
      tags: ['venue', 'utilization', 'maintenance', 'optimization']
    },
    cacheable: true,
    priority: 70
  },

  {
    id: 'venue-sport-priority',
    name: 'Sport Priority at Shared Venues',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.SOFT,
    weight: 75,
    scope: {
      sports: ['All'],
      conferences: ['Big 12']
    },
    parameters: {
      sportPriority: {
        'arena': ['Men\'s Basketball', 'Women\'s Basketball', 'Volleyball', 'Wrestling', 'Gymnastics'],
        'stadium': ['Football', 'Soccer', 'Lacrosse'],
        'complex': ['Baseball', 'Softball']
      },
      primeSlotsAllocation: {
        'Men\'s Basketball': 0.4,
        'Women\'s Basketball': 0.3,
        'Volleyball': 0.2,
        'Other': 0.1
      },
      weekendPriority: ['Football', 'Men\'s Basketball', 'Baseball', 'Women\'s Basketball']
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      // Analyze prime slot allocation
      const primeSlots = new Map<string, number>();
      const totalPrimeSlots = new Map<string, number>();
      
      schedule.games.forEach(game => {
        const isPrimeSlot = isPrimeTimeSlot(game);
        const sport = game.sport;
        
        if (isPrimeSlot) {
          totalPrimeSlots.set('total', (totalPrimeSlots.get('total') || 0) + 1);
          primeSlots.set(sport, (primeSlots.get(sport) || 0) + 1);
        }
      });
      
      // Check prime slot distribution
      const totalPrime = totalPrimeSlots.get('total') || 1;
      
      Object.entries(params.primeSlotsAllocation).forEach(([sport, targetRatio]) => {
        if (sport !== 'Other') {
          const actualRatio = (primeSlots.get(sport) || 0) / totalPrime;
          const deviation = Math.abs(actualRatio - targetRatio);
          
          if (deviation > 0.1) {
            score *= 0.95;
            suggestions.push({
              type: 'prime_slot_imbalance',
              priority: 'medium',
              description: `${sport} has ${(actualRatio * 100).toFixed(0)}% of prime slots (target: ${(targetRatio * 100).toFixed(0)}%)`,
              implementation: 'Adjust prime time slot allocation',
              expectedImprovement: 5
            });
          }
        }
      });
      
      // Check weekend priority
      const weekendGames = schedule.games.filter(g => 
        [0, 5, 6].includes(g.date.getDay()) // Friday, Saturday, Sunday
      );
      
      const weekendSportCounts = new Map<string, number>();
      weekendGames.forEach(game => {
        weekendSportCounts.set(game.sport, (weekendSportCounts.get(game.sport) || 0) + 1);
      });
      
      // Verify high-priority sports get weekend slots
      params.weekendPriority.slice(0, 3).forEach(sport => {
        const weekendCount = weekendSportCounts.get(sport) || 0;
        const totalSportGames = schedule.games.filter(g => g.sport === sport).length;
        
        if (totalSportGames > 0) {
          const weekendRatio = weekendCount / totalSportGames;
          
          if (weekendRatio < 0.6) {
            score *= 0.95;
            suggestions.push({
              type: 'insufficient_weekend_allocation',
              priority: 'medium',
              description: `${sport} has only ${(weekendRatio * 100).toFixed(0)}% weekend games`,
              implementation: 'Prioritize weekend slots for major sports',
              expectedImprovement: 5
            });
          }
        }
      });
      
      return {
        constraintId: 'venue-sport-priority',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `Sport priority score: ${(score * 100).toFixed(1)}%`,
        suggestions
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Manages sport priorities at shared venues',
      tags: ['venue', 'priority', 'shared', 'allocation']
    },
    cacheable: true,
    priority: 75
  }
];

// Helper functions
function calculateEndTime(game: Game): number {
  const startTime = parseInt(game.time.replace(':', ''));
  const duration = getGameDuration(game.sport); // In minutes
  
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  
  return startTime + (hours * 100) + minutes;
}

function calculateBufferMinutes(endTime: number, startTime: number): number {
  const endHour = Math.floor(endTime / 100);
  const endMinute = endTime % 100;
  const startHour = Math.floor(startTime / 100);
  const startMinute = startTime % 100;
  
  return (startHour * 60 + startMinute) - (endHour * 60 + endMinute);
}

function getGameDuration(sport: string): number {
  const durations: Record<string, number> = {
    'Football': 210, // 3.5 hours
    'Men\'s Basketball': 120,
    'Women\'s Basketball': 120,
    'Baseball': 180,
    'Softball': 150,
    'Volleyball': 120,
    'Soccer': 120,
    'Wrestling': 180
  };
  
  return durations[sport] || 120;
}

function getDayName(dayNumber: number): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayNumber];
}

function isPrimeTimeSlot(game: Game): boolean {
  const hour = parseInt(game.time.split(':')[0]);
  const dayOfWeek = game.date.getDay();
  
  // Weekend prime time
  if ([5, 6].includes(dayOfWeek)) {
    return hour >= 18 && hour <= 21;
  }
  
  // Weekday prime time
  return hour >= 19 && hour <= 21;
}

export function getVenueSharingConstraints(): UnifiedConstraint[] {
  return venueSharingConstraints;
}