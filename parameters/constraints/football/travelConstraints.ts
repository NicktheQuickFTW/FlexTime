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
      // Big 12 Tier 2 travel budget constraints
      maxSingleTripMiles: 1200, // Tier 2: Strategic charter flight threshold
      maxSeasonTravelMiles: 10000, // Reduced from 12000 for budget management
      consecutiveTravelGameLimit: 2,
      crossCountryThreshold: 1000, // Reduced threshold for Tier 2 cost management
      
      // Transportation mode thresholds based on travel budget tiers
      busOnlyThreshold: 300, // Under 300 miles = bus required (Tier 2)
      charterOptionalThreshold: 600, // 300-600 miles = charter or bus
      charterRequiredThreshold: 1200, // Over 1200 miles = charter required
      
      // Cost constraints for Big 12 Tier 2
      charterFlightCostRange: { min: 24000, max: 50000 },
      busCostPerMile: 2.8,
      annualBudgetRange: { min: 3000000, max: 5000000 },
      
      regionalPairs: {
        'Texas': ['Texas Tech', 'TCU', 'Baylor', 'Houston'],
        'Midwest': ['Kansas', 'Kansas State', 'Iowa State', 'Oklahoma State'],
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
  // Enhanced distance calculation with travel budget tier considerations
  const distances: Record<string, number> = {
    // Tier 2 Big 12 Conference distances (miles)
    'Arizona-Arizona State': 120,
    'Arizona-Colorado': 430,
    'Arizona-Utah': 520,
    'Arizona-BYU': 560,
    'Arizona-Texas Tech': 650,
    'Arizona-TCU': 850,
    'Arizona-Baylor': 880,
    'Arizona-Houston': 950,
    'Arizona-Oklahoma State': 780,
    'Arizona-Kansas State': 980,
    'Arizona-Kansas': 1020,
    'Arizona-Iowa State': 1100,
    'Arizona-Cincinnati': 1650,
    'Arizona-West Virginia': 1850,
    'Arizona-UCF': 1750,
    
    'Arizona State-Colorado': 380,
    'Arizona State-Utah': 470,
    'Arizona State-BYU': 510,
    'Arizona State-Texas Tech': 600,
    'Arizona State-TCU': 800,
    'Arizona State-Baylor': 830,
    'Arizona State-Houston': 900,
    'Arizona State-Oklahoma State': 730,
    'Arizona State-Kansas State': 930,
    'Arizona State-Kansas': 970,
    'Arizona State-Iowa State': 1050,
    'Arizona State-Cincinnati': 1600,
    'Arizona State-West Virginia': 1800,
    'Arizona State-UCF': 1700,
    
    'BYU-Utah': 45,
    'BYU-Colorado': 340,
    'BYU-Texas Tech': 650,
    'BYU-TCU': 850,
    'BYU-Baylor': 880,
    'BYU-Houston': 950,
    'BYU-Oklahoma State': 780,
    'BYU-Kansas State': 680,
    'BYU-Kansas': 720,
    'BYU-Iowa State': 800,
    'BYU-Cincinnati': 1400,
    'BYU-West Virginia': 1600,
    'BYU-UCF': 1500,
    
    'Utah-Colorado': 340,
    'Utah-Texas Tech': 650,
    'Utah-TCU': 850,
    'Utah-Baylor': 880,
    'Utah-Houston': 950,
    'Utah-Oklahoma State': 780,
    'Utah-Kansas State': 680,
    'Utah-Kansas': 720,
    'Utah-Iowa State': 800,
    'Utah-Cincinnati': 1400,
    'Utah-West Virginia': 1600,
    'Utah-UCF': 1500,
    
    'Colorado-Texas Tech': 320,
    'Colorado-TCU': 520,
    'Colorado-Baylor': 550,
    'Colorado-Houston': 620,
    'Colorado-Oklahoma State': 450,
    'Colorado-Kansas State': 350,
    'Colorado-Kansas': 390,
    'Colorado-Iowa State': 470,
    'Colorado-Cincinnati': 1070,
    'Colorado-West Virginia': 1270,
    'Colorado-UCF': 1170,
    
    'Texas Tech-TCU': 200,
    'Texas Tech-Baylor': 230,
    'Texas Tech-Houston': 300,
    'Texas Tech-Oklahoma State': 250,
    'Texas Tech-Kansas State': 350,
    'Texas Tech-Kansas': 390,
    'Texas Tech-Iowa State': 470,
    'Texas Tech-Cincinnati': 780,
    'Texas Tech-West Virginia': 980,
    'Texas Tech-UCF': 880,
    
    'TCU-Baylor': 100,
    'TCU-Houston': 180,
    'TCU-Oklahoma State': 120,
    'TCU-Kansas State': 320,
    'TCU-Kansas': 360,
    'TCU-Iowa State': 440,
    'TCU-Cincinnati': 650,
    'TCU-West Virginia': 850,
    'TCU-UCF': 750,
    
    'Baylor-Houston': 180,
    'Baylor-Oklahoma State': 150,
    'Baylor-Kansas State': 350,
    'Baylor-Kansas': 390,
    'Baylor-Iowa State': 470,
    'Baylor-Cincinnati': 680,
    'Baylor-West Virginia': 880,
    'Baylor-UCF': 780,
    
    'Houston-Oklahoma State': 280,
    'Houston-Kansas State': 480,
    'Houston-Kansas': 520,
    'Houston-Iowa State': 600,
    'Houston-Cincinnati': 800,
    'Houston-West Virginia': 1000,
    'Houston-UCF': 900,
    
    'Oklahoma State-Kansas State': 200,
    'Oklahoma State-Kansas': 240,
    'Oklahoma State-Iowa State': 320,
    'Oklahoma State-Cincinnati': 520,
    'Oklahoma State-West Virginia': 720,
    'Oklahoma State-UCF': 620,
    
    'Kansas State-Kansas': 80,
    'Kansas State-Iowa State': 200,
    'Kansas State-Cincinnati': 450,
    'Kansas State-West Virginia': 650,
    'Kansas State-UCF': 550,
    
    'Kansas-Iowa State': 200,
    'Kansas-Cincinnati': 450,
    'Kansas-West Virginia': 650,
    'Kansas-UCF': 550,
    
    'Iowa State-Cincinnati': 450,
    'Iowa State-West Virginia': 650,
    'Iowa State-UCF': 550,
    
    'Cincinnati-West Virginia': 280,
    'Cincinnati-UCF': 950,
    
    'West Virginia-UCF': 850
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