// Basketball Conference Play Constraints - Big 12 Conference
// Manages conference schedule structure and balance

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

export const conferencePlayConstraints: UnifiedConstraint[] = [
  {
    id: 'bb-conference-structure',
    name: 'Conference Schedule Structure',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.HARD,
    weight: 95,
    scope: {
      sports: ['Men\'s Basketball', 'Women\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      totalConferenceGames: 18,
      homeGames: 9,
      awayGames: 9,
      doubleRoundRobinTeams: 2, // Play 2 teams twice
      singleRoundRobinTeams: 13, // Play 13 teams once with 16 total teams
      conferenceStartDate: '2025-12-31',
      conferenceEndDate: '2026-03-08'
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      
      // Track games per team
      const teamStats = new Map<string, {
        totalGames: number;
        homeGames: number;
        awayGames: number;
        opponents: Map<string, number>;
      }>();
      
      // Initialize team stats
      const basketballGames = schedule.games.filter(g => 
        (g.sport === 'Men\'s Basketball' || g.sport === 'Women\'s Basketball') && 
        g.type === 'conference'
      );
      
      basketballGames.forEach(game => {
        // Update home team stats
        if (!teamStats.has(game.homeTeamId)) {
          teamStats.set(game.homeTeamId, {
            totalGames: 0,
            homeGames: 0,
            awayGames: 0,
            opponents: new Map()
          });
        }
        const homeStats = teamStats.get(game.homeTeamId)!;
        homeStats.totalGames++;
        homeStats.homeGames++;
        homeStats.opponents.set(
          game.awayTeamId, 
          (homeStats.opponents.get(game.awayTeamId) || 0) + 1
        );
        
        // Update away team stats
        if (!teamStats.has(game.awayTeamId)) {
          teamStats.set(game.awayTeamId, {
            totalGames: 0,
            homeGames: 0,
            awayGames: 0,
            opponents: new Map()
          });
        }
        const awayStats = teamStats.get(game.awayTeamId)!;
        awayStats.totalGames++;
        awayStats.awayGames++;
        awayStats.opponents.set(
          game.homeTeamId, 
          (awayStats.opponents.get(game.homeTeamId) || 0) + 1
        );
      });
      
      // Check each team's schedule
      teamStats.forEach((stats, teamId) => {
        // Check total games
        if (stats.totalGames !== params.totalConferenceGames) {
          violations.push({
            type: 'incorrect_game_count',
            severity: 'critical',
            affectedEntities: [teamId],
            description: `${teamId} has ${stats.totalGames} conference games (should be ${params.totalConferenceGames})`,
            possibleResolutions: ['Adjust conference game assignments']
          });
        }
        
        // Check home/away balance
        if (stats.homeGames !== params.homeGames) {
          violations.push({
            type: 'home_game_imbalance',
            severity: 'major',
            affectedEntities: [teamId],
            description: `${teamId} has ${stats.homeGames} home games (should be ${params.homeGames})`,
            possibleResolutions: ['Rebalance home/away assignments']
          });
        }
        
        if (stats.awayGames !== params.awayGames) {
          violations.push({
            type: 'away_game_imbalance',
            severity: 'major',
            affectedEntities: [teamId],
            description: `${teamId} has ${stats.awayGames} away games (should be ${params.awayGames})`,
            possibleResolutions: ['Rebalance home/away assignments']
          });
        }
        
        // Check opponent frequency
        let doubleOpponents = 0;
        let totalOpponents = 0;
        
        stats.opponents.forEach((games, opponent) => {
          totalOpponents++;
          if (games > 2) {
            violations.push({
              type: 'excessive_matchups',
              severity: 'critical',
              affectedEntities: [teamId, opponent],
              description: `${teamId} plays ${opponent} ${games} times`,
              possibleResolutions: ['Limit matchups to maximum 2 games']
            });
          } else if (games === 2) {
            doubleOpponents++;
          }
        });
        
        if (doubleOpponents !== params.doubleRoundRobinTeams) {
          violations.push({
            type: 'incorrect_double_opponents',
            severity: 'major',
            affectedEntities: [teamId],
            description: `${teamId} plays ${doubleOpponents} teams twice (should be ${params.doubleRoundRobinTeams})`,
            possibleResolutions: ['Adjust opponent assignments']
          });
        }
      });
      
      // Check conference dates
      const earlyGames = basketballGames.filter(g => 
        g.date < new Date(params.conferenceStartDate)
      );
      
      const lateGames = basketballGames.filter(g => 
        g.date > new Date(params.conferenceEndDate)
      );
      
      if (earlyGames.length > 0) {
        violations.push({
          type: 'early_conference_games',
          severity: 'major',
          affectedEntities: earlyGames.map(g => g.id),
          description: `${earlyGames.length} conference games before ${params.conferenceStartDate}`,
          possibleResolutions: ['Move games after conference start date']
        });
      }
      
      if (lateGames.length > 0) {
        violations.push({
          type: 'late_conference_games',
          severity: 'major',
          affectedEntities: lateGames.map(g => g.id),
          description: `${lateGames.length} conference games after ${params.conferenceEndDate}`,
          possibleResolutions: ['Move games before conference end date']
        });
      }
      
      return {
        constraintId: 'bb-conference-structure',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'Conference structure requirements satisfied'
          : `Found ${violations.length} structure violations`,
        violations,
        details: {
          totalTeams: teamStats.size,
          averageGamesPerTeam: Array.from(teamStats.values())
            .reduce((sum, stats) => sum + stats.totalGames, 0) / teamStats.size
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Ensures proper conference schedule structure and balance',
      tags: ['basketball', 'conference', 'structure', 'balance']
    },
    cacheable: true,
    priority: 95
  },

  {
    id: 'bb-home-away-patterns',
    name: 'Home/Away Pattern Balance',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.SOFT,
    weight: 80,
    scope: {
      sports: ['Men\'s Basketball', 'Women\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      maxConsecutiveHome: 3,
      maxConsecutiveAway: 2,
      maxConsecutiveConferenceGames: 4,
      preferredHomeAwayAlternation: 0.6 // 60% of games should alternate
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      // Analyze each team's schedule
      const teams = [...new Set(schedule.games
        .filter(g => (g.sport === 'Men\'s Basketball' || g.sport === 'Women\'s Basketball'))
        .flatMap(g => [g.homeTeamId, g.awayTeamId]))];
      
      teams.forEach(teamId => {
        const teamGames = schedule.games
          .filter(g => 
            (g.sport === 'Men\'s Basketball' || g.sport === 'Women\'s Basketball') &&
            (g.homeTeamId === teamId || g.awayTeamId === teamId))
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        let consecutiveHome = 0;
        let consecutiveAway = 0;
        let consecutiveConference = 0;
        let maxConsHome = 0;
        let maxConsAway = 0;
        let maxConsConf = 0;
        let alternations = 0;
        let lastLocation = '';
        
        teamGames.forEach((game, index) => {
          const isHome = game.homeTeamId === teamId;
          const currentLocation = isHome ? 'home' : 'away';
          
          // Track alternations
          if (index > 0 && currentLocation !== lastLocation) {
            alternations++;
          }
          lastLocation = currentLocation;
          
          // Track consecutive patterns
          if (isHome) {
            consecutiveHome++;
            consecutiveAway = 0;
            maxConsHome = Math.max(maxConsHome, consecutiveHome);
          } else {
            consecutiveAway++;
            consecutiveHome = 0;
            maxConsAway = Math.max(maxConsAway, consecutiveAway);
          }
          
          if (game.type === 'conference') {
            consecutiveConference++;
            maxConsConf = Math.max(maxConsConf, consecutiveConference);
          } else {
            consecutiveConference = 0;
          }
        });
        
        // Check violations
        if (maxConsHome > params.maxConsecutiveHome) {
          score *= 0.9;
          violations.push({
            type: 'excessive_consecutive_home',
            severity: 'major',
            affectedEntities: [teamId],
            description: `${teamId} has ${maxConsHome} consecutive home games`,
            possibleResolutions: ['Insert away games to break home streak']
          });
        }
        
        if (maxConsAway > params.maxConsecutiveAway) {
          score *= 0.9;
          violations.push({
            type: 'excessive_consecutive_away',
            severity: 'major',
            affectedEntities: [teamId],
            description: `${teamId} has ${maxConsAway} consecutive away games`,
            possibleResolutions: ['Insert home games to break away streak']
          });
        }
        
        if (maxConsConf > params.maxConsecutiveConferenceGames) {
          score *= 0.95;
          suggestions.push({
            type: 'long_conference_stretch',
            priority: 'medium',
            description: `${teamId} has ${maxConsConf} consecutive conference games`,
            implementation: 'Insert non-conference games for variety',
            expectedImprovement: 5
          });
        }
        
        // Check alternation pattern
        const alternationRate = teamGames.length > 1 
          ? alternations / (teamGames.length - 1) 
          : 0;
        
        if (alternationRate < params.preferredHomeAwayAlternation) {
          score *= 0.95;
          suggestions.push({
            type: 'poor_home_away_alternation',
            priority: 'low',
            description: `${teamId} has ${(alternationRate * 100).toFixed(0)}% home/away alternation`,
            implementation: 'Improve home/away alternation pattern',
            expectedImprovement: 5
          });
        }
      });
      
      return {
        constraintId: 'bb-home-away-patterns',
        status: violations.length === 0 && score > 0.85 ? ConstraintStatus.SATISFIED : 
                violations.length > 0 ? ConstraintStatus.VIOLATED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: violations.length === 0 && score > 0.85,
        score,
        message: `Home/away pattern score: ${(score * 100).toFixed(1)}%`,
        violations,
        suggestions
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Ensures balanced home/away patterns for team travel and fan experience',
      tags: ['basketball', 'balance', 'travel', 'pattern']
    },
    cacheable: true,
    priority: 80
  },

  {
    id: 'bb-rival-protection',
    name: 'Protected Rivalry Games',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.SOFT,
    weight: 85,
    scope: {
      sports: ['Men\'s Basketball', 'Women\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      protectedRivalries: [
        ['Kansas', 'Kansas State'],
        ['Arizona', 'Arizona State'],
        ['Utah', 'BYU'],
        ['Texas Tech', 'TCU'],
        ['Cincinnati', 'West Virginia'],
        ['Oklahoma State', 'Iowa State']
      ],
      requiredHomeAndAway: true,
      rivalryWeekPreferences: {
        'Kansas-Kansas State': [10, 18], // Mid and late season
        'Arizona-Arizona State': [8, 16],
        'Utah-BYU': [9, 17]
      }
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      const conferenceGames = schedule.games.filter(g => 
        (g.sport === 'Men\'s Basketball' || g.sport === 'Women\'s Basketball') && 
        g.type === 'conference'
      );
      
      params.protectedRivalries.forEach(([team1, team2]) => {
        const rivalryGames = conferenceGames.filter(g => 
          (g.homeTeamId === team1 && g.awayTeamId === team2) ||
          (g.homeTeamId === team2 && g.awayTeamId === team1)
        );
        
        if (rivalryGames.length === 0) {
          score *= 0.8;
          suggestions.push({
            type: 'missing_rivalry',
            priority: 'high',
            description: `No games scheduled between ${team1} and ${team2}`,
            implementation: 'Add rivalry games to schedule',
            expectedImprovement: 20
          });
        } else if (params.requiredHomeAndAway && rivalryGames.length < 2) {
          score *= 0.9;
          suggestions.push({
            type: 'incomplete_rivalry_series',
            priority: 'medium',
            description: `Only ${rivalryGames.length} game between ${team1} and ${team2}`,
            implementation: 'Add return game for home-and-away series',
            expectedImprovement: 10
          });
        } else if (params.requiredHomeAndAway) {
          // Check for proper home/away split
          const team1Home = rivalryGames.filter(g => g.homeTeamId === team1).length;
          const team2Home = rivalryGames.filter(g => g.homeTeamId === team2).length;
          
          if (team1Home !== 1 || team2Home !== 1) {
            score *= 0.95;
            suggestions.push({
              type: 'unbalanced_rivalry_venues',
              priority: 'low',
              description: `${team1}-${team2} series not properly split home/away`,
              implementation: 'Ensure each team hosts one game',
              expectedImprovement: 5
            });
          }
        }
        
        // Check preferred weeks
        const rivalryKey = [team1, team2].sort().join('-');
        const preferredWeeks = params.rivalryWeekPreferences[rivalryKey];
        
        if (preferredWeeks && rivalryGames.length > 0) {
          const gameWeeks = rivalryGames.map(g => getConferenceWeek(g.date));
          const hasPreferredWeek = gameWeeks.some(week => preferredWeeks.includes(week));
          
          if (!hasPreferredWeek) {
            score *= 0.98;
            suggestions.push({
              type: 'rivalry_timing',
              priority: 'low',
              description: `${rivalryKey} games not in preferred weeks`,
              implementation: 'Schedule rivalry games in traditional weeks',
              expectedImprovement: 2
            });
          }
        }
      });
      
      return {
        constraintId: 'bb-rival-protection',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `Rivalry protection score: ${(score * 100).toFixed(1)}%`,
        suggestions
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Protects traditional rivalries with home-and-away series',
      tags: ['basketball', 'rivalry', 'tradition', 'fan-interest']
    },
    cacheable: true,
    priority: 85
  }
];

// Helper function
function getConferenceWeek(date: Date): number {
  const conferenceStart = new Date('2025-12-31');
  const weeksDiff = Math.floor((date.getTime() - conferenceStart.getTime()) / (1000 * 60 * 60 * 24 * 7));
  return weeksDiff + 1;
}

export function getConferencePlayConstraints(): UnifiedConstraint[] {
  return conferencePlayConstraints;
}