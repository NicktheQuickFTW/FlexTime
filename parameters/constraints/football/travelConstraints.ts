// Football Travel Constraints - Big 12 Conference
// Manages travel distance, time zones, and rest requirements

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
} from '../../types';

export const travelConstraints: UnifiedConstraint[] = [
  {
    id: 'fb-travel-distance',
    name: 'Maximum Travel Distance',
    type: ConstraintType.SPATIAL,
    hardness: ConstraintHardness.SOFT,
    weight: 75,
    scope: {
      sports: ['Football'],
      conferences: ['Big 12']
    },
    parameters: {
      maxSingleTripMiles: 2000,
      maxSeasonTravelMiles: 12000,
      consecutiveTravelGameLimit: 2,
      crossCountryThreshold: 1500, // Miles for cross-country designation
      regionalPairs: {
        'Texas': ['Texas Tech', 'TCU', 'Baylor', 'Houston'],
        'Midwest': ['Kansas', 'Kansas State', 'Iowa State'],
        'Mountain': ['Colorado', 'Utah', 'BYU', 'Arizona', 'Arizona State'],
        'East': ['Cincinnati', 'West Virginia', 'UCF']
      }
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      const teamTravelStats = new Map<string, {
        totalMiles: number;
        trips: Array<{ opponent: string; miles: number; date: Date }>;
        consecutiveAway: number;
        maxConsecutiveAway: number;
      }>();
      
      // Initialize team stats
      const teams = [...new Set(schedule.games
        .filter(g => g.sport === 'Football')
        .flatMap(g => [g.homeTeamId, g.awayTeamId]))];
      
      teams.forEach(team => {
        teamTravelStats.set(team, {
          totalMiles: 0,
          trips: [],
          consecutiveAway: 0,
          maxConsecutiveAway: 0
        });
      });
      
      // Calculate travel for each game
      const sortedGames = schedule.games
        .filter(g => g.sport === 'Football')
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      sortedGames.forEach(game => {
        // For away team, calculate travel distance
        const awayStats = teamTravelStats.get(game.awayTeamId)!;
        const distance = calculateDistance(game.awayTeamId, game.homeTeamId); // Placeholder
        
        awayStats.totalMiles += distance * 2; // Round trip
        awayStats.trips.push({
          opponent: game.homeTeamId,
          miles: distance,
          date: game.date
        });
        
        // Track consecutive away games
        awayStats.consecutiveAway++;
        awayStats.maxConsecutiveAway = Math.max(
          awayStats.maxConsecutiveAway,
          awayStats.consecutiveAway
        );
        
        // Reset home team's consecutive away counter
        const homeStats = teamTravelStats.get(game.homeTeamId)!;
        homeStats.consecutiveAway = 0;
        
        // Check single trip distance
        if (distance > params.maxSingleTripMiles) {
          score *= 0.9;
          violations.push({
            type: 'excessive_single_trip',
            severity: 'major',
            affectedEntities: [game.id, game.awayTeamId],
            description: `${game.awayTeamId} travels ${distance} miles to ${game.homeTeamId}`,
            possibleResolutions: ['Consider neutral site or schedule adjustment']
          });
        }
      });
      
      // Check season totals and patterns
      teamTravelStats.forEach((stats, teamId) => {
        // Check total season travel
        if (stats.totalMiles > params.maxSeasonTravelMiles) {
          score *= 0.85;
          violations.push({
            type: 'excessive_season_travel',
            severity: 'major',
            affectedEntities: [teamId],
            description: `${teamId} travels ${stats.totalMiles} miles (limit: ${params.maxSeasonTravelMiles})`,
            possibleResolutions: ['Rebalance home/away assignments']
          });
        }
        
        // Check consecutive away games
        if (stats.maxConsecutiveAway > params.consecutiveTravelGameLimit) {
          score *= 0.9;
          violations.push({
            type: 'excessive_consecutive_travel',
            severity: 'major',
            affectedEntities: [teamId],
            description: `${teamId} has ${stats.maxConsecutiveAway} consecutive away games`,
            possibleResolutions: ['Insert home game to break travel streak']
          });
        }
        
        // Check for cross-country trips
        const crossCountryTrips = stats.trips.filter(t => t.miles > params.crossCountryThreshold);
        if (crossCountryTrips.length > 2) {
          score *= 0.95;
          suggestions.push({
            type: 'multiple_cross_country',
            priority: 'medium',
            description: `${teamId} has ${crossCountryTrips.length} cross-country trips`,
            implementation: 'Cluster distant games or use neutral sites',
            expectedImprovement: 5
          });
        }
      });
      
      // Analyze regional balance
      const regionalGames = analyzeRegionalBalance(schedule, params.regionalPairs);
      if (regionalGames.interRegionalPercentage > 0.6) {
        score *= 0.95;
        suggestions.push({
          type: 'poor_regional_balance',
          priority: 'low',
          description: `${(regionalGames.interRegionalPercentage * 100).toFixed(0)}% of games are inter-regional`,
          implementation: 'Increase intra-regional matchups to reduce travel',
          expectedImprovement: 5
        });
      }
      
      return {
        constraintId: 'fb-travel-distance',
        status: violations.length === 0 && score > 0.85 ? ConstraintStatus.SATISFIED : 
                violations.length > 0 ? ConstraintStatus.VIOLATED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: violations.length === 0 && score > 0.85,
        score,
        message: `Travel constraint score: ${(score * 100).toFixed(1)}%`,
        violations,
        suggestions,
        details: {
          teamTravelStats: Object.fromEntries(
            Array.from(teamTravelStats.entries()).map(([team, stats]) => [
              team,
              {
                totalMiles: stats.totalMiles,
                avgMilesPerTrip: stats.trips.length > 0 
                  ? Math.round(stats.totalMiles / stats.trips.length / 2)
                  : 0,
                longestTrip: Math.max(...stats.trips.map(t => t.miles), 0),
                crossCountryTrips: stats.trips.filter(t => t.miles > params.crossCountryThreshold).length
              }
            ])
          )
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Manages travel distances and patterns for team welfare',
      tags: ['football', 'travel', 'spatial', 'player-welfare']
    },
    cacheable: true,
    priority: 75
  },

  {
    id: 'fb-timezone-management',
    name: 'Time Zone Management',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.SOFT,
    weight: 70,
    scope: {
      sports: ['Football'],
      conferences: ['Big 12']
    },
    parameters: {
      maxTimezoneJumps: 2, // Maximum time zones crossed in one trip
      multipleTimezoneLimit: 2, // Max games with 2+ timezone difference per season
      timezones: {
        'Eastern': ['Cincinnati', 'West Virginia', 'UCF'],
        'Central': ['Houston', 'Baylor', 'TCU', 'Texas Tech', 'Kansas', 'Kansas State', 'Iowa State', 'Oklahoma State'],
        'Mountain': ['Colorado', 'Utah', 'BYU', 'Arizona', 'Arizona State']
      }
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      const teamTimezoneGames = new Map<string, number>();
      
      schedule.games
        .filter(g => g.sport === 'Football' && g.type === 'conference')
        .forEach(game => {
          const homeZone = getTeamTimezone(game.homeTeamId, params.timezones);
          const awayZone = getTeamTimezone(game.awayTeamId, params.timezones);
          const zoneDifference = Math.abs(getZoneOffset(homeZone) - getZoneOffset(awayZone));
          
          if (zoneDifference >= 2) {
            teamTimezoneGames.set(
              game.awayTeamId,
              (teamTimezoneGames.get(game.awayTeamId) || 0) + 1
            );
            
            if (zoneDifference > params.maxTimezoneJumps) {
              score *= 0.95;
              suggestions.push({
                type: 'excessive_timezone_jump',
                priority: 'medium',
                description: `${game.awayTeamId} crosses ${zoneDifference} time zones to play ${game.homeTeamId}`,
                implementation: 'Consider neutral site in intermediate timezone',
                expectedImprovement: 5
              });
            }
          }
        });
      
      // Check teams with multiple long timezone trips
      teamTimezoneGames.forEach((count, teamId) => {
        if (count > params.multipleTimezoneLimit) {
          score *= 0.9;
          suggestions.push({
            type: 'multiple_timezone_games',
            priority: 'medium',
            description: `${teamId} has ${count} games with 2+ timezone difference`,
            implementation: 'Balance schedule to reduce timezone travel',
            expectedImprovement: 10
          });
        }
      });
      
      return {
        constraintId: 'fb-timezone-management',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `Timezone management score: ${(score * 100).toFixed(1)}%`,
        suggestions,
        details: {
          teamsWithMultipleTimezoneGames: Object.fromEntries(teamTimezoneGames)
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Minimizes circadian disruption from timezone changes',
      tags: ['football', 'travel', 'timezone', 'player-welfare']
    },
    cacheable: true,
    priority: 70
  },

  {
    id: 'fb-travel-partners',
    name: 'Travel Partner Optimization',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.PREFERENCE,
    weight: 65,
    scope: {
      sports: ['Football'],
      conferences: ['Big 12']
    },
    parameters: {
      travelPartners: {
        'Kansas': 'Kansas State',
        'Kansas State': 'Kansas',
        'Arizona': 'Arizona State',
        'Arizona State': 'Arizona',
        'Utah': 'BYU',
        'BYU': 'Utah'
      },
      preferredRivals: {
        'Texas Tech': ['TCU', 'Baylor'],
        'Oklahoma State': ['Kansas State', 'Kansas'],
        'Iowa State': ['Kansas State', 'Kansas'],
        'Cincinnati': ['West Virginia'],
        'West Virginia': ['Cincinnati']
      }
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      // Check travel partner games
      let partnerGamesScheduled = 0;
      let totalPartnerPairs = Object.keys(params.travelPartners).length / 2;
      
      schedule.games
        .filter(g => g.sport === 'Football' && g.type === 'conference')
        .forEach(game => {
          if (params.travelPartners[game.homeTeamId] === game.awayTeamId) {
            partnerGamesScheduled++;
          }
        });
      
      const partnerRatio = partnerGamesScheduled / totalPartnerPairs;
      if (partnerRatio < 0.8) {
        score *= 0.9;
        suggestions.push({
          type: 'missing_travel_partner_games',
          priority: 'low',
          description: `Only ${partnerGamesScheduled} of ${totalPartnerPairs} travel partner games scheduled`,
          implementation: 'Prioritize travel partner matchups',
          expectedImprovement: 10
        });
      }
      
      // Check rival games
      let rivalGamesCount = 0;
      let expectedRivalGames = 0;
      
      Object.entries(params.preferredRivals).forEach(([team, rivals]) => {
        expectedRivalGames += rivals.length;
        rivals.forEach(rival => {
          const hasGame = schedule.games.some(g => 
            g.sport === 'Football' && g.type === 'conference' &&
            ((g.homeTeamId === team && g.awayTeamId === rival) ||
             (g.awayTeamId === team && g.homeTeamId === rival))
          );
          if (hasGame) rivalGamesCount++;
        });
      });
      
      const rivalRatio = rivalGamesCount / expectedRivalGames;
      if (rivalRatio < 0.7) {
        score *= 0.95;
        suggestions.push({
          type: 'insufficient_rival_games',
          priority: 'medium',
          description: `Only ${rivalGamesCount} of ${expectedRivalGames} preferred rival games scheduled`,
          implementation: 'Increase rival matchups for fan interest',
          expectedImprovement: 5
        });
      }
      
      return {
        constraintId: 'fb-travel-partners',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `Travel partner optimization score: ${(score * 100).toFixed(1)}%`,
        suggestions,
        details: {
          partnerGamesScheduled,
          totalPartnerPairs,
          rivalGamesCount,
          expectedRivalGames
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Optimizes scheduling for travel partners and regional rivals',
      tags: ['football', 'travel', 'rivals', 'optimization']
    },
    cacheable: true,
    priority: 65
  }
];

// Helper functions
function calculateDistance(team1: string, team2: string): number {
  // This would use actual venue coordinates
  // Placeholder implementation
  const distances: Record<string, number> = {
    'Cincinnati-UCF': 950,
    'West Virginia-Arizona': 2100,
    'Colorado-UCF': 1700,
    // Add more distance calculations
  };
  
  const key = [team1, team2].sort().join('-');
  return distances[key] || 500; // Default distance
}

function getTeamTimezone(teamId: string, timezones: Record<string, string[]>): string {
  for (const [zone, teams] of Object.entries(timezones)) {
    if (teams.includes(teamId)) return zone;
  }
  return 'Central'; // Default
}

function getZoneOffset(timezone: string): number {
  const offsets: Record<string, number> = {
    'Eastern': -5,
    'Central': -6,
    'Mountain': -7,
    'Pacific': -8
  };
  return offsets[timezone] || -6;
}

function analyzeRegionalBalance(schedule: Schedule, regionalPairs: Record<string, string[]>): any {
  let intraRegional = 0;
  let interRegional = 0;
  
  schedule.games
    .filter(g => g.sport === 'Football' && g.type === 'conference')
    .forEach(game => {
      let sameRegion = false;
      
      for (const teams of Object.values(regionalPairs)) {
        if (teams.includes(game.homeTeamId) && teams.includes(game.awayTeamId)) {
          sameRegion = true;
          break;
        }
      }
      
      if (sameRegion) {
        intraRegional++;
      } else {
        interRegional++;
      }
    });
  
  const total = intraRegional + interRegional;
  return {
    intraRegional,
    interRegional,
    interRegionalPercentage: total > 0 ? interRegional / total : 0
  };
}

export function getTravelConstraints(): UnifiedConstraint[] {
  return travelConstraints;
}