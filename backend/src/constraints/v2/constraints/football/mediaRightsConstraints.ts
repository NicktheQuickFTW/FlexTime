// Football Media Rights Constraints - Big 12 Conference
// Handles TV windows, broadcast requirements, and media partner needs

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

export const mediaRightsConstraints: UnifiedConstraint[] = [
  {
    id: 'fb-tv-windows',
    name: 'TV Broadcast Windows',
    type: ConstraintType.PERFORMANCE,
    hardness: ConstraintHardness.SOFT,
    weight: 85,
    scope: {
      sports: ['Football'],
      conferences: ['Big 12']
    },
    parameters: {
      saturdaySlots: {
        noon: { time: '12:00', network: ['FOX', 'FS1'], capacity: 2 },
        afternoon: { time: '15:30', network: ['ABC', 'ESPN'], capacity: 2 },
        primetime: { time: '19:00', network: ['FOX', 'ABC'], capacity: 1 },
        late: { time: '19:30', network: ['ESPN', 'ESPN2'], capacity: 1 },
        lateNight: { time: '22:30', network: ['ESPN', 'FS1'], capacity: 1 }
      },
      thursdaySlots: {
        primetime: { time: '19:30', network: ['ESPN'], capacity: 1 }
      },
      fridaySlots: {
        primetime: { time: '19:00', network: ['FOX', 'FS1'], capacity: 1 },
        late: { time: '21:00', network: ['ESPN2'], capacity: 1 }
      },
      maxThursdayGames: 6, // Per season
      maxFridayGames: 8,   // Per season
      maxNightGamesPerTeam: 4
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      const conferenceGames = schedule.games.filter(g => 
        g.sport === 'Football' && g.type === 'conference'
      );
      
      // Track games by day and time slot
      const gamesByDaySlot = new Map<string, Game[]>();
      const teamNightGames = new Map<string, number>();
      let thursdayGames = 0;
      let fridayGames = 0;
      
      conferenceGames.forEach(game => {
        const dayOfWeek = game.date.getDay();
        const key = `${dayOfWeek}-${game.time}`;
        
        if (!gamesByDaySlot.has(key)) {
          gamesByDaySlot.set(key, []);
        }
        gamesByDaySlot.get(key)!.push(game);
        
        // Count Thursday/Friday games
        if (dayOfWeek === 4) thursdayGames++;
        if (dayOfWeek === 5) fridayGames++;
        
        // Track night games (after 18:00)
        const hour = parseInt(game.time.split(':')[0]);
        if (hour >= 18) {
          [game.homeTeamId, game.awayTeamId].forEach(teamId => {
            teamNightGames.set(teamId, (teamNightGames.get(teamId) || 0) + 1);
          });
        }
      });
      
      // Check Thursday/Friday limits
      if (thursdayGames > params.maxThursdayGames) {
        score *= 0.8;
        violations.push({
          type: 'excessive_thursday_games',
          severity: 'major',
          affectedEntities: [],
          description: `${thursdayGames} Thursday games exceeds limit of ${params.maxThursdayGames}`,
          possibleResolutions: ['Move excess Thursday games to Saturday']
        });
      }
      
      if (fridayGames > params.maxFridayGames) {
        score *= 0.8;
        violations.push({
          type: 'excessive_friday_games',
          severity: 'major',
          affectedEntities: [],
          description: `${fridayGames} Friday games exceeds limit of ${params.maxFridayGames}`,
          possibleResolutions: ['Move excess Friday games to Saturday']
        });
      }
      
      // Check TV slot capacity
      gamesByDaySlot.forEach((games, key) => {
        const [day, time] = key.split('-');
        let maxCapacity = 0;
        
        if (day === '6') { // Saturday
          const slot = Object.values(params.saturdaySlots).find(s => s.time === time);
          if (slot) maxCapacity = slot.capacity;
        } else if (day === '4') { // Thursday
          const slot = Object.values(params.thursdaySlots).find(s => s.time === time);
          if (slot) maxCapacity = slot.capacity;
        } else if (day === '5') { // Friday
          const slot = Object.values(params.fridaySlots).find(s => s.time === time);
          if (slot) maxCapacity = slot.capacity;
        }
        
        if (games.length > maxCapacity && maxCapacity > 0) {
          score *= 0.9;
          violations.push({
            type: 'tv_slot_overflow',
            severity: 'major',
            affectedEntities: games.map(g => g.id),
            description: `${games.length} games in same TV slot exceeds capacity of ${maxCapacity}`,
            possibleResolutions: ['Redistribute games to other time slots']
          });
        }
      });
      
      // Check team night game limits
      teamNightGames.forEach((count, teamId) => {
        if (count > params.maxNightGamesPerTeam) {
          score *= 0.95;
          suggestions.push({
            type: 'excessive_night_games',
            priority: 'medium',
            description: `Team ${teamId} has ${count} night games (limit: ${params.maxNightGamesPerTeam})`,
            implementation: 'Move some games to afternoon slots',
            expectedImprovement: 5
          });
        }
      });
      
      // Analyze Saturday distribution
      const saturdayGames = conferenceGames.filter(g => g.date.getDay() === 6);
      const saturdayPercentage = saturdayGames.length / conferenceGames.length;
      
      if (saturdayPercentage < 0.75) {
        score *= 0.9;
        suggestions.push({
          type: 'low_saturday_concentration',
          priority: 'high',
          description: `Only ${(saturdayPercentage * 100).toFixed(0)}% of games on Saturday`,
          implementation: 'Prioritize Saturday scheduling for better TV ratings',
          expectedImprovement: 10
        });
      }
      
      return {
        constraintId: 'fb-tv-windows',
        status: violations.length === 0 && score > 0.85 ? ConstraintStatus.SATISFIED : 
                violations.length > 0 ? ConstraintStatus.VIOLATED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: violations.length === 0 && score > 0.85,
        score,
        message: `Media rights optimization score: ${(score * 100).toFixed(1)}%`,
        violations,
        suggestions,
        details: {
          thursdayGames,
          fridayGames,
          saturdayPercentage: (saturdayPercentage * 100).toFixed(1) + '%',
          teamNightGames: Object.fromEntries(teamNightGames)
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Manages TV broadcast windows and media partner requirements',
      tags: ['football', 'media', 'tv', 'broadcast']
    },
    cacheable: true,
    priority: 85
  },

  {
    id: 'fb-primetime-distribution',
    name: 'Primetime Game Distribution',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.SOFT,
    weight: 80,
    scope: {
      sports: ['Football'],
      conferences: ['Big 12']
    },
    parameters: {
      minPrimetimeGames: 2,
      maxPrimetimeGames: 5,
      primetimeStart: '18:00',
      marqueeTeams: ['Texas Tech', 'Oklahoma State', 'Kansas', 'Kansas State', 'TCU', 'Cincinnati']
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      const teamPrimetimeCount = new Map<string, number>();
      const primetimeGames = schedule.games.filter(g => {
        if (g.sport !== 'Football' || g.type !== 'conference') return false;
        const hour = parseInt(g.time.split(':')[0]);
        return hour >= parseInt(params.primetimeStart.split(':')[0]);
      });
      
      // Count primetime games per team
      primetimeGames.forEach(game => {
        [game.homeTeamId, game.awayTeamId].forEach(teamId => {
          teamPrimetimeCount.set(teamId, (teamPrimetimeCount.get(teamId) || 0) + 1);
        });
      });
      
      // Check distribution
      teamPrimetimeCount.forEach((count, teamId) => {
        if (count < params.minPrimetimeGames) {
          score *= 0.95;
          suggestions.push({
            type: 'insufficient_primetime',
            priority: 'medium',
            description: `${teamId} has only ${count} primetime games`,
            implementation: 'Schedule more primetime games for TV exposure',
            expectedImprovement: 5
          });
        } else if (count > params.maxPrimetimeGames) {
          score *= 0.95;
          suggestions.push({
            type: 'excessive_primetime',
            priority: 'low',
            description: `${teamId} has ${count} primetime games`,
            implementation: 'Balance primetime exposure across teams',
            expectedImprovement: 5
          });
        }
      });
      
      // Check marquee teams have adequate primetime
      params.marqueeTeams.forEach(teamId => {
        const count = teamPrimetimeCount.get(teamId) || 0;
        if (count < 3) {
          score *= 0.9;
          suggestions.push({
            type: 'marquee_team_underexposed',
            priority: 'high',
            description: `Marquee team ${teamId} has only ${count} primetime games`,
            implementation: 'Prioritize marquee teams for primetime slots',
            expectedImprovement: 10
          });
        }
      });
      
      return {
        constraintId: 'fb-primetime-distribution',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `Primetime distribution score: ${(score * 100).toFixed(1)}%`,
        suggestions,
        details: {
          teamPrimetimeCount: Object.fromEntries(teamPrimetimeCount),
          totalPrimetimeGames: primetimeGames.length
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Ensures fair and strategic distribution of primetime TV slots',
      tags: ['football', 'media', 'primetime', 'fairness']
    },
    cacheable: true,
    priority: 80
  },

  {
    id: 'fb-network-requirements',
    name: 'Network Broadcast Requirements',
    type: ConstraintType.COMPLIANCE,
    hardness: ConstraintHardness.HARD,
    weight: 90,
    scope: {
      sports: ['Football'],
      conferences: ['Big 12']
    },
    parameters: {
      foxMinGames: 20,
      espnMinGames: 20,
      exclusiveWindows: {
        'FOX': ['12:00', '19:00'],
        'ESPN': ['15:30', '19:30', '22:30']
      },
      blackoutDates: ['2025-11-27', '2025-11-28'] // Thanksgiving
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      let score = 1.0;
      
      const conferenceGames = schedule.games.filter(g => 
        g.sport === 'Football' && g.type === 'conference'
      );
      
      // Check blackout dates
      const blackoutViolations = conferenceGames.filter(game => 
        params.blackoutDates.includes(game.date.toISOString().split('T')[0])
      );
      
      if (blackoutViolations.length > 0) {
        violations.push({
          type: 'blackout_date_violation',
          severity: 'critical',
          affectedEntities: blackoutViolations.map(g => g.id),
          description: `${blackoutViolations.length} games scheduled on blackout dates`,
          possibleResolutions: ['Reschedule games to non-blackout dates']
        });
      }
      
      // Network game count would be tracked with actual network assignments
      // This is a placeholder for the constraint structure
      
      return {
        constraintId: 'fb-network-requirements',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'Network requirements satisfied'
          : `Found ${violations.length} network requirement violations`,
        violations
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Ensures compliance with network broadcast agreements',
      tags: ['football', 'media', 'compliance', 'network']
    },
    cacheable: false,
    priority: 90
  }
];

export function getMediaRightsConstraints(): UnifiedConstraint[] {
  return mediaRightsConstraints;
}