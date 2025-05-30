// Standard Constraint Templates - Pre-built templates for common scheduling patterns
// Version 2.0 - Comprehensive template library

import {
  ConstraintTemplate,
  TemplateCategory,
  ParameterDefinition,
  ScopeOptions,
  TemplateExample
} from './ConstraintTemplateSystem';
import { ConstraintType, ConstraintHardness } from '../types';

export class StandardTemplates {
  /**
   * Get all standard templates
   */
  static getAllTemplates(): ConstraintTemplate[] {
    return [
      this.consecutiveGamesTemplate(),
      this.consecutiveHomeGamesTemplate(),
      this.consecutiveAwayGamesTemplate(),
      this.minimumDaysBetweenGamesTemplate(),
      this.maximumGamesPerWeekTemplate(),
      this.homeAwayBalanceTemplate(),
      this.conferenceGameDistributionTemplate(),
      this.travelDistanceLimitTemplate(),
      this.venueAvailabilityTemplate(),
      this.rivalryGameTimingTemplate(),
      this.byeWeekDistributionTemplate(),
      this.primTimeGameLimitTemplate(),
      this.weekdayGameLimitTemplate(),
      this.fairnessBalanceTemplate(),
      this.weatherWindowTemplate(),
      this.broadcastWindowTemplate(),
      this.backToBackRoadGamesTemplate(),
      this.holidayBlackoutTemplate(),
      this.crossDivisionBalanceTemplate(),
      this.venueShareConflictTemplate()
    ];
  }

  /**
   * Consecutive Games Template - Limit consecutive games of any type
   */
  static consecutiveGamesTemplate(): ConstraintTemplate {
    return {
      id: 'consecutive_games_limit',
      name: 'Consecutive Games Limit',
      description: 'Limits the maximum number of consecutive games a team can play',
      category: TemplateCategory.CONSECUTIVE,
      type: ConstraintType.TEMPORAL,
      defaultHardness: ConstraintHardness.SOFT,
      parameterDefinitions: [
        {
          name: 'maxConsecutive',
          type: 'number',
          required: true,
          defaultValue: 3,
          validation: { min: 1, max: 10 },
          description: 'Maximum number of consecutive games allowed',
          displayName: 'Max Consecutive Games'
        },
        {
          name: 'daysBetween',
          type: 'number',
          required: false,
          defaultValue: 7,
          validation: { min: 1, max: 14 },
          description: 'Days between games to be considered consecutive',
          displayName: 'Days Between'
        }
      ],
      scopeOptions: {
        requiresSports: true,
        requiresTeams: false,
        requiresVenues: false,
        requiresTimeframes: false,
        requiresConferences: false,
        requiresDivisions: false
      },
      evaluatorTemplate: `
        const maxConsecutive = {{maxConsecutive}};
        const daysBetween = {{daysBetween}};
        const violations = [];
        let maxFound = 0;
        
        const teams = parameters.scope?.teams || schedule.teams.map(t => t.id);
        
        for (const teamId of teams) {
          const teamGames = utils.getTeamGames(schedule, teamId);
          const sortedGames = teamGames.sort((a, b) => a.date.getTime() - b.date.getTime());
          
          let consecutiveCount = 1;
          for (let i = 1; i < sortedGames.length; i++) {
            const daysDiff = utils.daysBetween(sortedGames[i-1].date, sortedGames[i].date);
            
            if (daysDiff <= daysBetween) {
              consecutiveCount++;
              maxFound = Math.max(maxFound, consecutiveCount);
              
              if (consecutiveCount > maxConsecutive) {
                violations.push({
                  type: 'consecutive_games_exceeded',
                  severity: 'major',
                  affectedEntities: [teamId],
                  description: \`Team has \${consecutiveCount} consecutive games (max: \${maxConsecutive})\`,
                  possibleResolutions: ['Reschedule games to add rest days', 'Move games to different weeks']
                });
              }
            } else {
              consecutiveCount = 1;
            }
          }
        }
        
        const satisfied = violations.length === 0;
        const score = satisfied ? 1.0 : Math.max(0, 1 - (maxFound - maxConsecutive) * 0.2);
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: satisfied 
            ? 'All teams within consecutive game limits' 
            : \`Found \${violations.length} teams exceeding consecutive game limits\`,
          violations,
          details: { maxConsecutiveFound: maxFound }
        };
      `,
      examples: [
        {
          name: 'Basketball 3-Game Limit',
          description: 'Limit basketball teams to 3 consecutive games within a week',
          parameters: { maxConsecutive: 3, daysBetween: 7 },
          scope: { sports: ['basketball'] }
        }
      ],
      tags: ['consecutive', 'fatigue', 'player-welfare'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Consecutive Home Games Template
   */
  static consecutiveHomeGamesTemplate(): ConstraintTemplate {
    return {
      id: 'consecutive_home_games_limit',
      name: 'Consecutive Home Games Limit',
      description: 'Limits the maximum number of consecutive home games',
      category: TemplateCategory.CONSECUTIVE,
      type: ConstraintType.SPATIAL,
      defaultHardness: ConstraintHardness.SOFT,
      parameterDefinitions: [
        {
          name: 'maxConsecutiveHome',
          type: 'number',
          required: true,
          defaultValue: 4,
          validation: { min: 1, max: 10 },
          description: 'Maximum consecutive home games allowed',
          displayName: 'Max Consecutive Home'
        }
      ],
      scopeOptions: {
        requiresSports: true,
        requiresTeams: false,
        requiresVenues: false,
        requiresTimeframes: false,
        requiresConferences: false,
        requiresDivisions: false
      },
      evaluatorTemplate: `
        const maxConsecutiveHome = {{maxConsecutiveHome}};
        const violations = [];
        
        const teams = parameters.scope?.teams || schedule.teams.map(t => t.id);
        
        for (const teamId of teams) {
          const teamGames = utils.getTeamGames(schedule, teamId);
          const homeGroups = utils.getConsecutiveGames(teamGames, 'home');
          
          for (const group of homeGroups) {
            if (group.length > maxConsecutiveHome) {
              violations.push({
                type: 'consecutive_home_exceeded',
                severity: 'minor',
                affectedEntities: [teamId],
                description: \`\${group.length} consecutive home games (max: \${maxConsecutiveHome})\`,
                possibleResolutions: ['Insert away game in home stand', 'Split home games across multiple weeks']
              });
            }
          }
        }
        
        const satisfied = violations.length === 0;
        const score = satisfied ? 1.0 : Math.max(0.3, 1 - violations.length * 0.1);
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: satisfied 
            ? 'Home game distribution within limits' 
            : \`\${violations.length} teams with excessive consecutive home games\`,
          violations
        };
      `,
      examples: [
        {
          name: 'Football Home Stand Limit',
          description: 'Limit football teams to 4 consecutive home games',
          parameters: { maxConsecutiveHome: 4 },
          scope: { sports: ['football'] }
        }
      ],
      tags: ['consecutive', 'home-games', 'fan-experience'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Consecutive Away Games Template
   */
  static consecutiveAwayGamesTemplate(): ConstraintTemplate {
    return {
      id: 'consecutive_away_games_limit',
      name: 'Consecutive Away Games Limit',
      description: 'Limits the maximum number of consecutive away games',
      category: TemplateCategory.CONSECUTIVE,
      type: ConstraintType.SPATIAL,
      defaultHardness: ConstraintHardness.HARD,
      parameterDefinitions: [
        {
          name: 'maxConsecutiveAway',
          type: 'number',
          required: true,
          defaultValue: 3,
          validation: { min: 1, max: 8 },
          description: 'Maximum consecutive away games allowed',
          displayName: 'Max Consecutive Away'
        },
        {
          name: 'exceptionForTournaments',
          type: 'boolean',
          required: false,
          defaultValue: true,
          description: 'Allow exceptions for tournament play',
          displayName: 'Tournament Exception'
        }
      ],
      scopeOptions: {
        requiresSports: true,
        requiresTeams: false,
        requiresVenues: false,
        requiresTimeframes: false,
        requiresConferences: false,
        requiresDivisions: false
      },
      evaluatorTemplate: `
        const maxConsecutiveAway = {{maxConsecutiveAway}};
        const exceptionForTournaments = {{exceptionForTournaments}};
        const violations = [];
        
        const teams = parameters.scope?.teams || schedule.teams.map(t => t.id);
        
        for (const teamId of teams) {
          const teamGames = utils.getTeamGames(schedule, teamId);
          const awayGroups = utils.getConsecutiveGames(teamGames, 'away');
          
          for (const group of awayGroups) {
            const isTournament = exceptionForTournaments && 
              group.every(g => g.type === 'tournament');
            
            if (!isTournament && group.length > maxConsecutiveAway) {
              violations.push({
                type: 'consecutive_away_exceeded',
                severity: 'major',
                affectedEntities: [teamId],
                description: \`\${group.length} consecutive away games (max: \${maxConsecutiveAway})\`,
                possibleResolutions: ['Insert home game in road trip', 'Reduce length of road trip']
              });
            }
          }
        }
        
        const satisfied = violations.length === 0;
        const score = satisfied ? 1.0 : Math.max(0.2, 1 - violations.length * 0.15);
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: satisfied 
            ? 'Away game distribution within limits' 
            : \`\${violations.length} teams with excessive consecutive away games\`,
          violations
        };
      `,
      examples: [
        {
          name: 'Basketball Road Trip Limit',
          description: 'Limit basketball teams to 3 consecutive away games',
          parameters: { maxConsecutiveAway: 3, exceptionForTournaments: true },
          scope: { sports: ['basketball'] }
        }
      ],
      tags: ['consecutive', 'away-games', 'travel', 'player-welfare'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Minimum Days Between Games Template
   */
  static minimumDaysBetweenGamesTemplate(): ConstraintTemplate {
    return {
      id: 'minimum_days_between_games',
      name: 'Minimum Days Between Games',
      description: 'Ensures minimum rest days between games',
      category: TemplateCategory.SEPARATION,
      type: ConstraintType.TEMPORAL,
      defaultHardness: ConstraintHardness.HARD,
      parameterDefinitions: [
        {
          name: 'minimumDays',
          type: 'number',
          required: true,
          defaultValue: 2,
          validation: { min: 1, max: 7 },
          description: 'Minimum days required between games',
          displayName: 'Minimum Days'
        },
        {
          name: 'applyToAwayGamesOnly',
          type: 'boolean',
          required: false,
          defaultValue: false,
          description: 'Apply restriction only to away games',
          displayName: 'Away Games Only'
        }
      ],
      scopeOptions: {
        requiresSports: true,
        requiresTeams: false,
        requiresVenues: false,
        requiresTimeframes: false,
        requiresConferences: false,
        requiresDivisions: false
      },
      evaluatorTemplate: `
        const minimumDays = {{minimumDays}};
        const applyToAwayGamesOnly = {{applyToAwayGamesOnly}};
        const violations = [];
        
        const teams = parameters.scope?.teams || schedule.teams.map(t => t.id);
        
        for (const teamId of teams) {
          const teamGames = utils.getTeamGames(schedule, teamId);
          const sortedGames = teamGames.sort((a, b) => a.date.getTime() - b.date.getTime());
          
          for (let i = 1; i < sortedGames.length; i++) {
            const prevGame = sortedGames[i-1];
            const currentGame = sortedGames[i];
            const daysDiff = utils.daysBetween(prevGame.date, currentGame.date);
            
            const checkGame = !applyToAwayGamesOnly || 
              (prevGame.awayTeamId === teamId || currentGame.awayTeamId === teamId);
            
            if (checkGame && daysDiff < minimumDays) {
              violations.push({
                type: 'insufficient_rest',
                severity: 'critical',
                affectedEntities: [teamId, prevGame.id, currentGame.id],
                description: \`Only \${daysDiff} days between games (min: \${minimumDays})\`,
                possibleResolutions: ['Reschedule one of the games', 'Add additional rest days']
              });
            }
          }
        }
        
        const satisfied = violations.length === 0;
        const score = satisfied ? 1.0 : 0;
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: satisfied 
            ? 'All teams have adequate rest between games' 
            : \`\${violations.length} instances of insufficient rest between games\`,
          violations
        };
      `,
      examples: [
        {
          name: 'Football Minimum Rest',
          description: 'Ensure at least 6 days between football games',
          parameters: { minimumDays: 6, applyToAwayGamesOnly: false },
          scope: { sports: ['football'] }
        }
      ],
      tags: ['separation', 'rest', 'player-welfare', 'safety'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Maximum Games Per Week Template
   */
  static maximumGamesPerWeekTemplate(): ConstraintTemplate {
    return {
      id: 'maximum_games_per_week',
      name: 'Maximum Games Per Week',
      description: 'Limits the number of games a team can play in a week',
      category: TemplateCategory.BALANCE,
      type: ConstraintType.TEMPORAL,
      defaultHardness: ConstraintHardness.HARD,
      parameterDefinitions: [
        {
          name: 'maxGamesPerWeek',
          type: 'number',
          required: true,
          defaultValue: 3,
          validation: { min: 1, max: 7 },
          description: 'Maximum games allowed per week',
          displayName: 'Max Games/Week'
        },
        {
          name: 'weekStartDay',
          type: 'enum',
          required: false,
          defaultValue: 'monday',
          enumValues: ['sunday', 'monday'],
          description: 'First day of the week',
          displayName: 'Week Starts'
        }
      ],
      scopeOptions: {
        requiresSports: true,
        requiresTeams: false,
        requiresVenues: false,
        requiresTimeframes: false,
        requiresConferences: false,
        requiresDivisions: false
      },
      evaluatorTemplate: `
        const maxGamesPerWeek = {{maxGamesPerWeek}};
        const weekStartDay = {{weekStartDay}};
        const violations = [];
        
        const teams = parameters.scope?.teams || schedule.teams.map(t => t.id);
        
        // Helper to get week number
        const getWeekNumber = (date) => {
          const startOfYear = new Date(date.getFullYear(), 0, 1);
          const dayOffset = weekStartDay === 'sunday' ? 0 : 1;
          const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
          return Math.ceil((days + startOfYear.getDay() - dayOffset) / 7);
        };
        
        for (const teamId of teams) {
          const teamGames = utils.getTeamGames(schedule, teamId);
          const gamesByWeek = {};
          
          teamGames.forEach(game => {
            const week = getWeekNumber(game.date);
            gamesByWeek[week] = (gamesByWeek[week] || 0) + 1;
          });
          
          Object.entries(gamesByWeek).forEach(([week, count]) => {
            if (count > maxGamesPerWeek) {
              violations.push({
                type: 'excessive_weekly_games',
                severity: 'critical',
                affectedEntities: [teamId],
                description: \`\${count} games in week \${week} (max: \${maxGamesPerWeek})\`,
                possibleResolutions: ['Move games to adjacent weeks', 'Reduce game frequency']
              });
            }
          });
        }
        
        const satisfied = violations.length === 0;
        const score = satisfied ? 1.0 : 0;
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: satisfied 
            ? 'All teams within weekly game limits' 
            : \`\${violations.length} instances of excessive weekly games\`,
          violations
        };
      `,
      examples: [
        {
          name: 'Basketball Weekly Limit',
          description: 'Limit basketball teams to 3 games per week',
          parameters: { maxGamesPerWeek: 3, weekStartDay: 'monday' },
          scope: { sports: ['basketball'] }
        }
      ],
      tags: ['balance', 'weekly-limit', 'player-welfare'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Home/Away Balance Template
   */
  static homeAwayBalanceTemplate(): ConstraintTemplate {
    return {
      id: 'home_away_balance',
      name: 'Home/Away Game Balance',
      description: 'Ensures balanced distribution of home and away games',
      category: TemplateCategory.BALANCE,
      type: ConstraintType.LOGICAL,
      defaultHardness: ConstraintHardness.SOFT,
      parameterDefinitions: [
        {
          name: 'maxImbalance',
          type: 'number',
          required: true,
          defaultValue: 2,
          validation: { min: 0, max: 5 },
          description: 'Maximum allowed difference between home and away games',
          displayName: 'Max Imbalance'
        },
        {
          name: 'checkPeriod',
          type: 'enum',
          required: false,
          defaultValue: 'season',
          enumValues: ['season', 'half-season', 'monthly'],
          description: 'Period to check balance over',
          displayName: 'Check Period'
        }
      ],
      scopeOptions: {
        requiresSports: true,
        requiresTeams: false,
        requiresVenues: false,
        requiresTimeframes: false,
        requiresConferences: false,
        requiresDivisions: false
      },
      evaluatorTemplate: `
        const maxImbalance = {{maxImbalance}};
        const checkPeriod = {{checkPeriod}};
        const violations = [];
        const suggestions = [];
        
        const teams = parameters.scope?.teams || schedule.teams.map(t => t.id);
        
        for (const teamId of teams) {
          const teamGames = utils.getTeamGames(schedule, teamId);
          const homeGames = utils.getHomeGames(teamGames, teamId);
          const awayGames = utils.getAwayGames(teamGames, teamId);
          
          const imbalance = Math.abs(homeGames.length - awayGames.length);
          
          if (imbalance > maxImbalance) {
            violations.push({
              type: 'home_away_imbalance',
              severity: 'minor',
              affectedEntities: [teamId],
              description: \`Imbalance of \${imbalance} games (home: \${homeGames.length}, away: \${awayGames.length})\`,
              possibleResolutions: ['Swap home/away designations', 'Adjust future scheduling']
            });
            
            suggestions.push({
              type: 'balance_adjustment',
              priority: 'medium',
              description: \`Consider swapping \${Math.ceil(imbalance/2)} games for better balance\`,
              expectedImprovement: 50
            });
          }
        }
        
        const satisfied = violations.length === 0;
        const avgImbalance = violations.length > 0 
          ? violations.reduce((sum, v) => sum + parseFloat(v.description.match(/\\d+/)[0]), 0) / violations.length
          : 0;
        const score = Math.max(0, 1 - (avgImbalance / (maxImbalance * 2)));
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: satisfied 
            ? 'Home/away games are well balanced' 
            : \`\${violations.length} teams have imbalanced home/away games\`,
          violations,
          suggestions
        };
      `,
      examples: [
        {
          name: 'Season-long Balance',
          description: 'Ensure home/away games differ by no more than 2',
          parameters: { maxImbalance: 2, checkPeriod: 'season' },
          scope: { sports: ['basketball', 'football'] }
        }
      ],
      tags: ['balance', 'fairness', 'home-away'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Conference Game Distribution Template
   */
  static conferenceGameDistributionTemplate(): ConstraintTemplate {
    return {
      id: 'conference_game_distribution',
      name: 'Conference Game Distribution',
      description: 'Ensures conference games are distributed throughout the season',
      category: TemplateCategory.BALANCE,
      type: ConstraintType.LOGICAL,
      defaultHardness: ConstraintHardness.SOFT,
      parameterDefinitions: [
        {
          name: 'minSpacing',
          type: 'number',
          required: true,
          defaultValue: 2,
          validation: { min: 1, max: 4 },
          description: 'Minimum weeks between conference game clusters',
          displayName: 'Min Spacing (weeks)'
        },
        {
          name: 'maxConsecutiveConference',
          type: 'number',
          required: true,
          defaultValue: 3,
          validation: { min: 1, max: 6 },
          description: 'Maximum consecutive conference games',
          displayName: 'Max Consecutive'
        }
      ],
      scopeOptions: {
        requiresSports: true,
        requiresTeams: false,
        requiresVenues: false,
        requiresTimeframes: false,
        requiresConferences: true,
        requiresDivisions: false
      },
      evaluatorTemplate: `
        const minSpacing = {{minSpacing}};
        const maxConsecutiveConference = {{maxConsecutiveConference}};
        const violations = [];
        
        const teams = parameters.scope?.teams || schedule.teams.map(t => t.id);
        const conferenceTeams = new Set(
          schedule.teams
            .filter(t => parameters.scope?.conferences?.includes(t.conference))
            .map(t => t.id)
        );
        
        for (const teamId of teams) {
          const teamGames = utils.getTeamGames(schedule, teamId)
            .sort((a, b) => a.date.getTime() - b.date.getTime());
          
          let consecutiveConf = 0;
          let lastConfGameWeek = -999;
          
          teamGames.forEach((game, idx) => {
            const opponent = game.homeTeamId === teamId ? game.awayTeamId : game.homeTeamId;
            const isConferenceGame = conferenceTeams.has(opponent);
            const currentWeek = game.week || Math.floor(idx / 7);
            
            if (isConferenceGame) {
              consecutiveConf++;
              
              if (consecutiveConf > maxConsecutiveConference) {
                violations.push({
                  type: 'excessive_consecutive_conference',
                  severity: 'minor',
                  affectedEntities: [teamId],
                  description: \`\${consecutiveConf} consecutive conference games\`,
                  possibleResolutions: ['Insert non-conference game', 'Redistribute conference games']
                });
              }
              
              if (lastConfGameWeek > 0 && currentWeek - lastConfGameWeek < minSpacing) {
                violations.push({
                  type: 'insufficient_conference_spacing',
                  severity: 'minor',
                  affectedEntities: [teamId],
                  description: \`Only \${currentWeek - lastConfGameWeek} weeks between conference games\`,
                  possibleResolutions: ['Spread conference games more evenly']
                });
              }
              
              lastConfGameWeek = currentWeek;
            } else {
              consecutiveConf = 0;
            }
          });
        }
        
        const satisfied = violations.length === 0;
        const score = satisfied ? 1.0 : Math.max(0.4, 1 - violations.length * 0.05);
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: satisfied 
            ? 'Conference games well distributed' 
            : \`\${violations.length} distribution issues found\`,
          violations
        };
      `,
      examples: [
        {
          name: 'Big 12 Distribution',
          description: 'Distribute Big 12 conference games throughout season',
          parameters: { minSpacing: 2, maxConsecutiveConference: 3 },
          scope: { sports: ['football'], conferences: ['Big 12'] }
        }
      ],
      tags: ['balance', 'conference', 'distribution'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Travel Distance Limit Template
   */
  static travelDistanceLimitTemplate(): ConstraintTemplate {
    return {
      id: 'travel_distance_limit',
      name: 'Travel Distance Limit',
      description: 'Limits travel distance between consecutive away games',
      category: TemplateCategory.TRAVEL,
      type: ConstraintType.SPATIAL,
      defaultHardness: ConstraintHardness.SOFT,
      parameterDefinitions: [
        {
          name: 'maxDistanceMiles',
          type: 'number',
          required: true,
          defaultValue: 500,
          validation: { min: 100, max: 3000 },
          description: 'Maximum travel distance in miles',
          displayName: 'Max Distance (miles)'
        },
        {
          name: 'considerReturnTrips',
          type: 'boolean',
          required: false,
          defaultValue: true,
          description: 'Include return trips in distance calculation',
          displayName: 'Consider Return Trips'
        }
      ],
      scopeOptions: {
        requiresSports: true,
        requiresTeams: false,
        requiresVenues: true,
        requiresTimeframes: false,
        requiresConferences: false,
        requiresDivisions: false
      },
      evaluatorTemplate: `
        const maxDistanceMiles = {{maxDistanceMiles}};
        const considerReturnTrips = {{considerReturnTrips}};
        const violations = [];
        
        // Helper to calculate distance between venues
        const calculateDistance = (venue1, venue2) => {
          const R = 3959; // Earth radius in miles
          const lat1 = venue1.location.latitude * Math.PI / 180;
          const lat2 = venue2.location.latitude * Math.PI / 180;
          const deltaLat = (venue2.location.latitude - venue1.location.latitude) * Math.PI / 180;
          const deltaLon = (venue2.location.longitude - venue1.location.longitude) * Math.PI / 180;
          
          const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                    Math.cos(lat1) * Math.cos(lat2) *
                    Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          
          return R * c;
        };
        
        const teams = parameters.scope?.teams || schedule.teams.map(t => t.id);
        const venueMap = new Map(schedule.venues.map(v => [v.id, v]));
        
        for (const teamId of teams) {
          const team = schedule.teams.find(t => t.id === teamId);
          const homeVenue = venueMap.get(team.homeVenue);
          const awayGames = utils.getAwayGames(
            utils.getTeamGames(schedule, teamId), 
            teamId
          ).sort((a, b) => a.date.getTime() - b.date.getTime());
          
          for (let i = 1; i < awayGames.length; i++) {
            const venue1 = venueMap.get(awayGames[i-1].venueId);
            const venue2 = venueMap.get(awayGames[i].venueId);
            
            if (venue1 && venue2) {
              let distance = calculateDistance(venue1, venue2);
              
              if (considerReturnTrips && i > 0) {
                // Add distance from home to first venue
                distance += calculateDistance(homeVenue, venue1);
              }
              
              if (distance > maxDistanceMiles) {
                violations.push({
                  type: 'excessive_travel',
                  severity: 'major',
                  affectedEntities: [teamId, awayGames[i-1].id, awayGames[i].id],
                  description: \`\${Math.round(distance)} miles between consecutive away games\`,
                  possibleResolutions: ['Group geographically close games', 'Add home game between distant trips']
                });
              }
            }
          }
        }
        
        const satisfied = violations.length === 0;
        const score = satisfied ? 1.0 : Math.max(0.3, 1 - violations.length * 0.1);
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: satisfied 
            ? 'Travel distances within acceptable limits' 
            : \`\${violations.length} instances of excessive travel\`,
          violations
        };
      `,
      examples: [
        {
          name: 'Regional Travel Limit',
          description: 'Limit travel to 500 miles between games',
          parameters: { maxDistanceMiles: 500, considerReturnTrips: true },
          scope: { sports: ['basketball'] }
        }
      ],
      tags: ['travel', 'distance', 'cost-reduction', 'player-welfare'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Venue Availability Template
   */
  static venueAvailabilityTemplate(): ConstraintTemplate {
    return {
      id: 'venue_availability',
      name: 'Venue Availability',
      description: 'Ensures games are scheduled when venues are available',
      category: TemplateCategory.VENUE,
      type: ConstraintType.SPATIAL,
      defaultHardness: ConstraintHardness.HARD,
      parameterDefinitions: [
        {
          name: 'checkAvailability',
          type: 'boolean',
          required: true,
          defaultValue: true,
          description: 'Check venue availability periods',
          displayName: 'Check Availability'
        }
      ],
      scopeOptions: {
        requiresSports: true,
        requiresTeams: false,
        requiresVenues: true,
        requiresTimeframes: false,
        requiresConferences: false,
        requiresDivisions: false
      },
      evaluatorTemplate: `
        const checkAvailability = {{checkAvailability}};
        const violations = [];
        
        if (!checkAvailability) {
          return {
            constraintId: parameters.constraintId,
            status: 'satisfied',
            satisfied: true,
            score: 1.0,
            message: 'Venue availability check disabled'
          };
        }
        
        const venueMap = new Map(schedule.venues.map(v => [v.id, v]));
        
        schedule.games.forEach(game => {
          const venue = venueMap.get(game.venueId);
          if (!venue || !venue.availability) return;
          
          const gameDate = game.date;
          const isAvailable = venue.availability.some(period => {
            return period.available && 
                   gameDate >= period.startDate && 
                   gameDate <= period.endDate;
          });
          
          if (!isAvailable) {
            violations.push({
              type: 'venue_unavailable',
              severity: 'critical',
              affectedEntities: [game.id, venue.id],
              description: \`Venue \${venue.name} not available on \${gameDate.toDateString()}\`,
              possibleResolutions: ['Change game date', 'Use alternate venue']
            });
          }
        });
        
        const satisfied = violations.length === 0;
        const score = satisfied ? 1.0 : 0;
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: satisfied 
            ? 'All games scheduled when venues available' 
            : \`\${violations.length} games scheduled at unavailable venues\`,
          violations
        };
      `,
      examples: [
        {
          name: 'Venue Availability Check',
          description: 'Ensure all games are scheduled when venues are available',
          parameters: { checkAvailability: true },
          scope: { sports: ['basketball', 'football'] }
        }
      ],
      tags: ['venue', 'availability', 'scheduling'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Rivalry Game Timing Template
   */
  static rivalryGameTimingTemplate(): ConstraintTemplate {
    return {
      id: 'rivalry_game_timing',
      name: 'Rivalry Game Timing',
      description: 'Ensures rivalry games are scheduled at optimal times',
      category: TemplateCategory.TIMING,
      type: ConstraintType.TEMPORAL,
      defaultHardness: ConstraintHardness.PREFERENCE,
      parameterDefinitions: [
        {
          name: 'preferredWeeks',
          type: 'array',
          arrayType: 'number',
          required: true,
          defaultValue: [10, 11, 12],
          description: 'Preferred weeks for rivalry games',
          displayName: 'Preferred Weeks'
        },
        {
          name: 'avoidEarlyWeeks',
          type: 'number',
          required: false,
          defaultValue: 3,
          validation: { min: 0, max: 5 },
          description: 'Avoid rivalry games in first N weeks',
          displayName: 'Avoid Early Weeks'
        }
      ],
      scopeOptions: {
        requiresSports: true,
        requiresTeams: false,
        requiresVenues: false,
        requiresTimeframes: false,
        requiresConferences: false,
        requiresDivisions: false
      },
      evaluatorTemplate: `
        const preferredWeeks = {{preferredWeeks}};
        const avoidEarlyWeeks = {{avoidEarlyWeeks}};
        const violations = [];
        const suggestions = [];
        
        const rivalryGames = schedule.games.filter(g => g.metadata?.rivalryGame);
        
        rivalryGames.forEach(game => {
          const week = game.week;
          
          if (week && week <= avoidEarlyWeeks) {
            violations.push({
              type: 'rivalry_too_early',
              severity: 'minor',
              affectedEntities: [game.id],
              description: \`Rivalry game scheduled in week \${week} (avoid first \${avoidEarlyWeeks} weeks)\`,
              possibleResolutions: ['Move to later in season']
            });
          }
          
          if (week && !preferredWeeks.includes(week)) {
            suggestions.push({
              type: 'rivalry_timing',
              priority: 'low',
              description: \`Consider moving rivalry game to week \${preferredWeeks[0]} or \${preferredWeeks[1]}\`,
              expectedImprovement: 20
            });
          }
        });
        
        const satisfied = violations.length === 0;
        const preferredCount = rivalryGames.filter(g => 
          g.week && preferredWeeks.includes(g.week)
        ).length;
        const score = rivalryGames.length > 0 
          ? (preferredCount / rivalryGames.length) * 0.8 + (satisfied ? 0.2 : 0)
          : 1.0;
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: satisfied 
            ? \`\${preferredCount} of \${rivalryGames.length} rivalry games in preferred weeks\`
            : \`Some rivalry games scheduled too early in season\`,
          violations,
          suggestions
        };
      `,
      examples: [
        {
          name: 'Late Season Rivalries',
          description: 'Schedule rivalry games in weeks 10-12',
          parameters: { preferredWeeks: [10, 11, 12], avoidEarlyWeeks: 3 },
          scope: { sports: ['football'] }
        }
      ],
      tags: ['rivalry', 'timing', 'fan-experience'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Bye Week Distribution Template
   */
  static byeWeekDistributionTemplate(): ConstraintTemplate {
    return {
      id: 'bye_week_distribution',
      name: 'Bye Week Distribution',
      description: 'Ensures bye weeks are distributed fairly across teams',
      category: TemplateCategory.FAIRNESS,
      type: ConstraintType.TEMPORAL,
      defaultHardness: ConstraintHardness.SOFT,
      parameterDefinitions: [
        {
          name: 'earliestByeWeek',
          type: 'number',
          required: true,
          defaultValue: 4,
          validation: { min: 1, max: 8 },
          description: 'Earliest allowed bye week',
          displayName: 'Earliest Bye Week'
        },
        {
          name: 'latestByeWeek',
          type: 'number',
          required: true,
          defaultValue: 11,
          validation: { min: 8, max: 15 },
          description: 'Latest allowed bye week',
          displayName: 'Latest Bye Week'
        },
        {
          name: 'maxTeamsPerByeWeek',
          type: 'number',
          required: false,
          defaultValue: 4,
          validation: { min: 2, max: 6 },
          description: 'Maximum teams on bye in same week',
          displayName: 'Max Teams/Week'
        }
      ],
      scopeOptions: {
        requiresSports: true,
        requiresTeams: false,
        requiresVenues: false,
        requiresTimeframes: false,
        requiresConferences: false,
        requiresDivisions: false
      },
      evaluatorTemplate: `
        const earliestByeWeek = {{earliestByeWeek}};
        const latestByeWeek = {{latestByeWeek}};
        const maxTeamsPerByeWeek = {{maxTeamsPerByeWeek}};
        const violations = [];
        
        // Identify bye weeks for each team
        const teamByeWeeks = new Map();
        const byeWeekCounts = new Map();
        
        schedule.teams.forEach(team => {
          const teamGames = utils.getTeamGames(schedule, team.id);
          const gameWeeks = new Set(teamGames.map(g => g.week).filter(w => w));
          
          // Find missing weeks (bye weeks)
          for (let week = 1; week <= 15; week++) {
            if (!gameWeeks.has(week)) {
              teamByeWeeks.set(team.id, week);
              byeWeekCounts.set(week, (byeWeekCounts.get(week) || 0) + 1);
              
              if (week < earliestByeWeek || week > latestByeWeek) {
                violations.push({
                  type: 'bye_week_out_of_range',
                  severity: 'major',
                  affectedEntities: [team.id],
                  description: \`Bye week in week \${week} (allowed: \${earliestByeWeek}-\${latestByeWeek})\`,
                  possibleResolutions: ['Adjust schedule to move bye week']
                });
              }
              break; // Assume only one bye week per team
            }
          }
        });
        
        // Check bye week distribution
        byeWeekCounts.forEach((count, week) => {
          if (count > maxTeamsPerByeWeek) {
            violations.push({
              type: 'bye_week_overload',
              severity: 'minor',
              affectedEntities: [],
              description: \`\${count} teams on bye in week \${week} (max: \${maxTeamsPerByeWeek})\`,
              possibleResolutions: ['Redistribute bye weeks more evenly']
            });
          }
        });
        
        const satisfied = violations.length === 0;
        const distribution = Array.from(byeWeekCounts.values());
        const balance = utils.calculateBalance(distribution);
        const score = satisfied ? (1.0 - balance * 0.1) : Math.max(0.3, 0.8 - violations.length * 0.1);
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: satisfied 
            ? 'Bye weeks well distributed' 
            : \`\${violations.length} bye week issues found\`,
          violations,
          details: { byeWeekDistribution: Object.fromEntries(byeWeekCounts) }
        };
      `,
      examples: [
        {
          name: 'Football Bye Weeks',
          description: 'Distribute bye weeks between weeks 4-11',
          parameters: { earliestByeWeek: 4, latestByeWeek: 11, maxTeamsPerByeWeek: 4 },
          scope: { sports: ['football'] }
        }
      ],
      tags: ['bye-week', 'fairness', 'distribution'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Prime Time Game Limit Template
   */
  static primTimeGameLimitTemplate(): ConstraintTemplate {
    return {
      id: 'prime_time_game_limit',
      name: 'Prime Time Game Limit',
      description: 'Limits the number of prime time games per team',
      category: TemplateCategory.TIMING,
      type: ConstraintType.TEMPORAL,
      defaultHardness: ConstraintHardness.SOFT,
      parameterDefinitions: [
        {
          name: 'maxPrimeTimeGames',
          type: 'number',
          required: true,
          defaultValue: 3,
          validation: { min: 0, max: 6 },
          description: 'Maximum prime time games per team',
          displayName: 'Max Prime Time Games'
        },
        {
          name: 'primeTimeStart',
          type: 'string',
          required: false,
          defaultValue: '19:00',
          description: 'Start of prime time window (HH:MM)',
          displayName: 'Prime Time Start'
        },
        {
          name: 'primeTimeEnd',
          type: 'string',
          required: false,
          defaultValue: '22:00',
          description: 'End of prime time window (HH:MM)',
          displayName: 'Prime Time End'
        }
      ],
      scopeOptions: {
        requiresSports: true,
        requiresTeams: false,
        requiresVenues: false,
        requiresTimeframes: false,
        requiresConferences: false,
        requiresDivisions: false
      },
      evaluatorTemplate: `
        const maxPrimeTimeGames = {{maxPrimeTimeGames}};
        const primeTimeStart = {{primeTimeStart}};
        const primeTimeEnd = {{primeTimeEnd}};
        const violations = [];
        
        const isPrimeTime = (gameTime) => {
          return gameTime >= primeTimeStart && gameTime <= primeTimeEnd;
        };
        
        const teams = parameters.scope?.teams || schedule.teams.map(t => t.id);
        
        teams.forEach(teamId => {
          const teamGames = utils.getTeamGames(schedule, teamId);
          const primeTimeCount = teamGames.filter(g => isPrimeTime(g.time)).length;
          
          if (primeTimeCount > maxPrimeTimeGames) {
            violations.push({
              type: 'excessive_prime_time',
              severity: 'minor',
              affectedEntities: [teamId],
              description: \`\${primeTimeCount} prime time games (max: \${maxPrimeTimeGames})\`,
              possibleResolutions: ['Move some games to afternoon slots', 'Balance prime time exposure']
            });
          }
        });
        
        const satisfied = violations.length === 0;
        const score = satisfied ? 1.0 : Math.max(0.5, 1 - violations.length * 0.05);
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: satisfied 
            ? 'Prime time games within limits' 
            : \`\${violations.length} teams exceed prime time limits\`,
          violations
        };
      `,
      examples: [
        {
          name: 'TV Exposure Balance',
          description: 'Limit teams to 3 prime time games',
          parameters: { maxPrimeTimeGames: 3, primeTimeStart: '19:00', primeTimeEnd: '22:00' },
          scope: { sports: ['football', 'basketball'] }
        }
      ],
      tags: ['prime-time', 'tv', 'fairness'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Weekday Game Limit Template
   */
  static weekdayGameLimitTemplate(): ConstraintTemplate {
    return {
      id: 'weekday_game_limit',
      name: 'Weekday Game Limit',
      description: 'Limits games on weekdays (Monday-Thursday)',
      category: TemplateCategory.TIMING,
      type: ConstraintType.TEMPORAL,
      defaultHardness: ConstraintHardness.SOFT,
      parameterDefinitions: [
        {
          name: 'maxWeekdayGames',
          type: 'number',
          required: true,
          defaultValue: 2,
          validation: { min: 0, max: 10 },
          description: 'Maximum weekday games per team',
          displayName: 'Max Weekday Games'
        },
        {
          name: 'excludeFriday',
          type: 'boolean',
          required: false,
          defaultValue: true,
          description: 'Exclude Friday from weekday restriction',
          displayName: 'Exclude Friday'
        }
      ],
      scopeOptions: {
        requiresSports: true,
        requiresTeams: false,
        requiresVenues: false,
        requiresTimeframes: false,
        requiresConferences: false,
        requiresDivisions: false
      },
      evaluatorTemplate: `
        const maxWeekdayGames = {{maxWeekdayGames}};
        const excludeFriday = {{excludeFriday}};
        const violations = [];
        
        const isWeekday = (date) => {
          const day = date.getDay();
          return day >= 1 && day <= (excludeFriday ? 4 : 5);
        };
        
        const teams = parameters.scope?.teams || schedule.teams.map(t => t.id);
        
        teams.forEach(teamId => {
          const teamGames = utils.getTeamGames(schedule, teamId);
          const weekdayCount = teamGames.filter(g => isWeekday(g.date)).length;
          
          if (weekdayCount > maxWeekdayGames) {
            violations.push({
              type: 'excessive_weekday_games',
              severity: 'minor',
              affectedEntities: [teamId],
              description: \`\${weekdayCount} weekday games (max: \${maxWeekdayGames})\`,
              possibleResolutions: ['Move games to weekends', 'Reduce weekday scheduling']
            });
          }
        });
        
        const satisfied = violations.length === 0;
        const score = satisfied ? 1.0 : Math.max(0.6, 1 - violations.length * 0.05);
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: satisfied 
            ? 'Weekday games within limits' 
            : \`\${violations.length} teams exceed weekday game limits\`,
          violations
        };
      `,
      examples: [
        {
          name: 'Student Attendance Priority',
          description: 'Limit weekday games to support student attendance',
          parameters: { maxWeekdayGames: 2, excludeFriday: true },
          scope: { sports: ['basketball'] }
        }
      ],
      tags: ['weekday', 'attendance', 'fan-experience'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Fairness Balance Template
   */
  static fairnessBalanceTemplate(): ConstraintTemplate {
    return {
      id: 'fairness_balance',
      name: 'Schedule Fairness Balance',
      description: 'Ensures overall schedule fairness across multiple dimensions',
      category: TemplateCategory.FAIRNESS,
      type: ConstraintType.LOGICAL,
      defaultHardness: ConstraintHardness.SOFT,
      parameterDefinitions: [
        {
          name: 'dimensions',
          type: 'array',
          arrayType: 'string',
          required: true,
          defaultValue: ['home-away', 'rest-days', 'travel-distance'],
          description: 'Dimensions to consider for fairness',
          displayName: 'Fairness Dimensions'
        },
        {
          name: 'maxDeviation',
          type: 'number',
          required: true,
          defaultValue: 0.2,
          validation: { min: 0, max: 0.5 },
          description: 'Maximum allowed deviation from average',
          displayName: 'Max Deviation'
        }
      ],
      scopeOptions: {
        requiresSports: true,
        requiresTeams: false,
        requiresVenues: false,
        requiresTimeframes: false,
        requiresConferences: false,
        requiresDivisions: false
      },
      evaluatorTemplate: `
        const dimensions = {{dimensions}};
        const maxDeviation = {{maxDeviation}};
        const violations = [];
        const suggestions = [];
        
        const teams = parameters.scope?.teams || schedule.teams.map(t => t.id);
        const teamMetrics = new Map();
        
        // Calculate metrics for each team
        teams.forEach(teamId => {
          const teamGames = utils.getTeamGames(schedule, teamId);
          const metrics = {};
          
          if (dimensions.includes('home-away')) {
            const homeGames = utils.getHomeGames(teamGames, teamId);
            metrics['home-away'] = homeGames.length / teamGames.length;
          }
          
          if (dimensions.includes('rest-days')) {
            const sortedGames = teamGames.sort((a, b) => a.date.getTime() - b.date.getTime());
            const restDays = [];
            for (let i = 1; i < sortedGames.length; i++) {
              restDays.push(utils.daysBetween(sortedGames[i-1].date, sortedGames[i].date));
            }
            metrics['rest-days'] = restDays.length > 0 
              ? restDays.reduce((a, b) => a + b, 0) / restDays.length 
              : 0;
          }
          
          teamMetrics.set(teamId, metrics);
        });
        
        // Check fairness for each dimension
        dimensions.forEach(dimension => {
          const values = Array.from(teamMetrics.values()).map(m => m[dimension] || 0);
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          
          teamMetrics.forEach((metrics, teamId) => {
            const value = metrics[dimension] || 0;
            const deviation = Math.abs(value - avg) / avg;
            
            if (deviation > maxDeviation) {
              violations.push({
                type: 'fairness_imbalance',
                severity: 'minor',
                affectedEntities: [teamId],
                description: \`\${dimension} deviation of \${(deviation * 100).toFixed(1)}% from average\`,
                possibleResolutions: ['Adjust schedule to improve balance']
              });
            }
          });
          
          const variance = utils.calculateBalance(values);
          if (variance > 0.1) {
            suggestions.push({
              type: 'improve_fairness',
              priority: 'medium',
              description: \`Consider rebalancing \${dimension} across teams\`,
              expectedImprovement: 30
            });
          }
        });
        
        const satisfied = violations.length === 0;
        const score = satisfied ? 1.0 : Math.max(0.5, 1 - violations.length * 0.02);
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: satisfied 
            ? 'Schedule fairness maintained across all dimensions' 
            : \`\${violations.length} fairness imbalances detected\`,
          violations,
          suggestions
        };
      `,
      examples: [
        {
          name: 'Multi-Dimensional Fairness',
          description: 'Ensure fairness across home/away, rest, and travel',
          parameters: { 
            dimensions: ['home-away', 'rest-days', 'travel-distance'],
            maxDeviation: 0.2 
          },
          scope: { sports: ['basketball', 'football'] }
        }
      ],
      tags: ['fairness', 'balance', 'equity'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Weather Window Template
   */
  static weatherWindowTemplate(): ConstraintTemplate {
    return {
      id: 'weather_window',
      name: 'Weather Window Constraint',
      description: 'Schedules outdoor games within appropriate weather windows',
      category: TemplateCategory.TIMING,
      type: ConstraintType.TEMPORAL,
      defaultHardness: ConstraintHardness.SOFT,
      parameterDefinitions: [
        {
          name: 'coldWeatherThreshold',
          type: 'number',
          required: true,
          defaultValue: 32,
          validation: { min: 0, max: 50 },
          description: 'Minimum temperature (F) for games',
          displayName: 'Min Temperature (F)'
        },
        {
          name: 'avoidMonths',
          type: 'array',
          arrayType: 'number',
          required: false,
          defaultValue: [12, 1, 2],
          description: 'Months to avoid for outdoor games',
          displayName: 'Avoid Months'
        }
      ],
      scopeOptions: {
        requiresSports: true,
        requiresTeams: false,
        requiresVenues: true,
        requiresTimeframes: false,
        requiresConferences: false,
        requiresDivisions: false
      },
      evaluatorTemplate: `
        const coldWeatherThreshold = {{coldWeatherThreshold}};
        const avoidMonths = {{avoidMonths}};
        const violations = [];
        
        // Identify outdoor venues (simplified - would use venue metadata in production)
        const outdoorSports = ['football', 'baseball', 'soccer'];
        const isOutdoorGame = (game) => outdoorSports.includes(game.sport);
        
        schedule.games.filter(isOutdoorGame).forEach(game => {
          const month = game.date.getMonth() + 1;
          
          if (avoidMonths.includes(month)) {
            violations.push({
              type: 'poor_weather_window',
              severity: 'minor',
              affectedEntities: [game.id],
              description: \`Outdoor game scheduled in month \${month}\`,
              possibleResolutions: ['Move to warmer month', 'Consider indoor venue']
            });
          }
        });
        
        const satisfied = violations.length === 0;
        const score = satisfied ? 1.0 : Math.max(0.6, 1 - violations.length * 0.05);
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: satisfied 
            ? 'All outdoor games in appropriate weather windows' 
            : \`\${violations.length} games in poor weather windows\`,
          violations
        };
      `,
      examples: [
        {
          name: 'Winter Weather Avoidance',
          description: 'Avoid outdoor games in winter months',
          parameters: { coldWeatherThreshold: 32, avoidMonths: [12, 1, 2] },
          scope: { sports: ['football', 'baseball'] }
        }
      ],
      tags: ['weather', 'outdoor', 'safety'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Broadcast Window Template
   */
  static broadcastWindowTemplate(): ConstraintTemplate {
    return {
      id: 'broadcast_window',
      name: 'Broadcast Window Optimization',
      description: 'Optimizes game scheduling for TV broadcast windows',
      category: TemplateCategory.TIMING,
      type: ConstraintType.PERFORMANCE,
      defaultHardness: ConstraintHardness.PREFERENCE,
      parameterDefinitions: [
        {
          name: 'preferredWindows',
          type: 'array',
          arrayType: 'string',
          required: true,
          defaultValue: ['12:00-15:00', '15:30-18:30', '19:00-22:00'],
          description: 'Preferred broadcast time windows',
          displayName: 'Preferred Windows'
        },
        {
          name: 'requireSeparation',
          type: 'number',
          required: false,
          defaultValue: 30,
          validation: { min: 0, max: 60 },
          description: 'Minutes between conference games',
          displayName: 'Game Separation (min)'
        }
      ],
      scopeOptions: {
        requiresSports: true,
        requiresTeams: false,
        requiresVenues: false,
        requiresTimeframes: false,
        requiresConferences: true,
        requiresDivisions: false
      },
      evaluatorTemplate: `
        const preferredWindows = {{preferredWindows}};
        const requireSeparation = {{requireSeparation}};
        const violations = [];
        const suggestions = [];
        
        // Parse time windows
        const windows = preferredWindows.map(w => {
          const [start, end] = w.split('-');
          return { start, end };
        });
        
        const inPreferredWindow = (gameTime) => {
          return windows.some(w => gameTime >= w.start && gameTime <= w.end);
        };
        
        // Check games for broadcast optimization
        let gamesInWindows = 0;
        let totalGames = 0;
        
        schedule.games.forEach(game => {
          if (game.metadata?.tvNetwork) {
            totalGames++;
            if (inPreferredWindow(game.time)) {
              gamesInWindows++;
            } else {
              suggestions.push({
                type: 'broadcast_optimization',
                priority: 'low',
                description: \`Move game at \${game.time} to preferred broadcast window\`,
                expectedImprovement: 10
              });
            }
          }
        });
        
        const satisfied = violations.length === 0;
        const score = totalGames > 0 ? gamesInWindows / totalGames : 1.0;
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: \`\${gamesInWindows} of \${totalGames} TV games in preferred windows\`,
          violations,
          suggestions,
          details: { broadcastOptimization: score }
        };
      `,
      examples: [
        {
          name: 'TV Broadcast Optimization',
          description: 'Optimize games for standard TV windows',
          parameters: { 
            preferredWindows: ['12:00-15:00', '15:30-18:30', '19:00-22:00'],
            requireSeparation: 30 
          },
          scope: { sports: ['football', 'basketball'], conferences: ['Big 12'] }
        }
      ],
      tags: ['broadcast', 'tv', 'optimization'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Back-to-Back Road Games Template
   */
  static backToBackRoadGamesTemplate(): ConstraintTemplate {
    return {
      id: 'back_to_back_road_games',
      name: 'Back-to-Back Road Games',
      description: 'Limits consecutive road games in different locations',
      category: TemplateCategory.TRAVEL,
      type: ConstraintType.SPATIAL,
      defaultHardness: ConstraintHardness.SOFT,
      parameterDefinitions: [
        {
          name: 'maxBackToBackDifferentCities',
          type: 'number',
          required: true,
          defaultValue: 2,
          validation: { min: 0, max: 4 },
          description: 'Max consecutive road games in different cities',
          displayName: 'Max Different Cities'
        },
        {
          name: 'sameStateException',
          type: 'boolean',
          required: false,
          defaultValue: true,
          description: 'Allow exception for games in same state',
          displayName: 'Same State Exception'
        }
      ],
      scopeOptions: {
        requiresSports: true,
        requiresTeams: false,
        requiresVenues: true,
        requiresTimeframes: false,
        requiresConferences: false,
        requiresDivisions: false
      },
      evaluatorTemplate: `
        const maxBackToBackDifferentCities = {{maxBackToBackDifferentCities}};
        const sameStateException = {{sameStateException}};
        const violations = [];
        
        const teams = parameters.scope?.teams || schedule.teams.map(t => t.id);
        const venueMap = new Map(schedule.venues.map(v => [v.id, v]));
        
        teams.forEach(teamId => {
          const awayGames = utils.getAwayGames(
            utils.getTeamGames(schedule, teamId), 
            teamId
          ).sort((a, b) => a.date.getTime() - b.date.getTime());
          
          let consecutiveDifferentCities = 0;
          let lastCity = null;
          let lastState = null;
          
          awayGames.forEach((game, idx) => {
            const venue = venueMap.get(game.venueId);
            if (!venue) return;
            
            const currentCity = venue.location.city;
            const currentState = venue.location.state;
            
            if (lastCity && currentCity !== lastCity) {
              if (!sameStateException || currentState !== lastState) {
                consecutiveDifferentCities++;
                
                if (consecutiveDifferentCities >= maxBackToBackDifferentCities) {
                  violations.push({
                    type: 'excessive_city_changes',
                    severity: 'major',
                    affectedEntities: [teamId],
                    description: \`\${consecutiveDifferentCities + 1} consecutive road games in different cities\`,
                    possibleResolutions: ['Group games by region', 'Add home game between road trips']
                  });
                }
              }
            } else {
              consecutiveDifferentCities = 0;
            }
            
            lastCity = currentCity;
            lastState = currentState;
          });
        });
        
        const satisfied = violations.length === 0;
        const score = satisfied ? 1.0 : Math.max(0.4, 1 - violations.length * 0.1);
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: satisfied 
            ? 'Road game sequencing optimized' 
            : \`\${violations.length} instances of excessive city changes\`,
          violations
        };
      `,
      examples: [
        {
          name: 'Regional Road Trip Planning',
          description: 'Limit back-to-back games in different cities',
          parameters: { maxBackToBackDifferentCities: 2, sameStateException: true },
          scope: { sports: ['basketball'] }
        }
      ],
      tags: ['travel', 'road-games', 'efficiency'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Holiday Blackout Template
   */
  static holidayBlackoutTemplate(): ConstraintTemplate {
    return {
      id: 'holiday_blackout',
      name: 'Holiday Blackout Dates',
      description: 'Prevents games on specific holiday dates',
      category: TemplateCategory.TIMING,
      type: ConstraintType.TEMPORAL,
      defaultHardness: ConstraintHardness.HARD,
      parameterDefinitions: [
        {
          name: 'blackoutDates',
          type: 'array',
          arrayType: 'string',
          required: true,
          defaultValue: ['12-25', '01-01'],
          description: 'Dates to block (MM-DD format)',
          displayName: 'Blackout Dates'
        },
        {
          name: 'allowExceptions',
          type: 'boolean',
          required: false,
          defaultValue: false,
          description: 'Allow exceptions for special events',
          displayName: 'Allow Exceptions'
        }
      ],
      scopeOptions: {
        requiresSports: true,
        requiresTeams: false,
        requiresVenues: false,
        requiresTimeframes: false,
        requiresConferences: false,
        requiresDivisions: false
      },
      evaluatorTemplate: `
        const blackoutDates = {{blackoutDates}};
        const allowExceptions = {{allowExceptions}};
        const violations = [];
        
        const isBlackoutDate = (date) => {
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const day = date.getDate().toString().padStart(2, '0');
          const dateStr = \`\${month}-\${day}\`;
          return blackoutDates.includes(dateStr);
        };
        
        schedule.games.forEach(game => {
          if (isBlackoutDate(game.date)) {
            const isException = allowExceptions && game.metadata?.specialEvent;
            
            if (!isException) {
              violations.push({
                type: 'holiday_blackout_violation',
                severity: 'critical',
                affectedEntities: [game.id],
                description: \`Game scheduled on blackout date \${game.date.toDateString()}\`,
                possibleResolutions: ['Move game to different date', 'Request exception approval']
              });
            }
          }
        });
        
        const satisfied = violations.length === 0;
        const score = satisfied ? 1.0 : 0;
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: satisfied 
            ? 'No games scheduled on blackout dates' 
            : \`\${violations.length} games on blackout dates\`,
          violations
        };
      `,
      examples: [
        {
          name: 'Major Holiday Blackouts',
          description: 'Block games on Christmas and New Year',
          parameters: { blackoutDates: ['12-25', '01-01'], allowExceptions: false },
          scope: { sports: ['basketball', 'football'] }
        }
      ],
      tags: ['holiday', 'blackout', 'scheduling'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Cross-Division Balance Template
   */
  static crossDivisionBalanceTemplate(): ConstraintTemplate {
    return {
      id: 'cross_division_balance',
      name: 'Cross-Division Game Balance',
      description: 'Ensures balanced cross-division matchups',
      category: TemplateCategory.BALANCE,
      type: ConstraintType.LOGICAL,
      defaultHardness: ConstraintHardness.SOFT,
      parameterDefinitions: [
        {
          name: 'targetCrossDivisionGames',
          type: 'number',
          required: true,
          defaultValue: 4,
          validation: { min: 0, max: 10 },
          description: 'Target cross-division games per team',
          displayName: 'Target Cross-Division'
        },
        {
          name: 'allowedVariance',
          type: 'number',
          required: false,
          defaultValue: 1,
          validation: { min: 0, max: 3 },
          description: 'Allowed variance from target',
          displayName: 'Allowed Variance'
        }
      ],
      scopeOptions: {
        requiresSports: true,
        requiresTeams: false,
        requiresVenues: false,
        requiresTimeframes: false,
        requiresConferences: false,
        requiresDivisions: true
      },
      evaluatorTemplate: `
        const targetCrossDivisionGames = {{targetCrossDivisionGames}};
        const allowedVariance = {{allowedVariance}};
        const violations = [];
        
        const teamDivisions = new Map(
          schedule.teams.map(t => [t.id, t.division])
        );
        
        const teams = parameters.scope?.teams || schedule.teams.map(t => t.id);
        
        teams.forEach(teamId => {
          const teamDivision = teamDivisions.get(teamId);
          if (!teamDivision) return;
          
          const teamGames = utils.getTeamGames(schedule, teamId);
          const crossDivisionCount = teamGames.filter(game => {
            const opponentId = game.homeTeamId === teamId ? game.awayTeamId : game.homeTeamId;
            const opponentDivision = teamDivisions.get(opponentId);
            return opponentDivision && opponentDivision !== teamDivision;
          }).length;
          
          const variance = Math.abs(crossDivisionCount - targetCrossDivisionGames);
          
          if (variance > allowedVariance) {
            violations.push({
              type: 'cross_division_imbalance',
              severity: 'minor',
              affectedEntities: [teamId],
              description: \`\${crossDivisionCount} cross-division games (target: \${targetCrossDivisionGames})\`,
              possibleResolutions: ['Adjust opponent selection', 'Rebalance division matchups']
            });
          }
        });
        
        const satisfied = violations.length === 0;
        const score = satisfied ? 1.0 : Math.max(0.6, 1 - violations.length * 0.05);
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: satisfied 
            ? 'Cross-division games well balanced' 
            : \`\${violations.length} teams with imbalanced cross-division games\`,
          violations
        };
      `,
      examples: [
        {
          name: 'Division Play Balance',
          description: 'Ensure 4 cross-division games per team',
          parameters: { targetCrossDivisionGames: 4, allowedVariance: 1 },
          scope: { sports: ['football'], divisions: ['East', 'West'] }
        }
      ],
      tags: ['division', 'balance', 'competition'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Venue Share Conflict Template
   */
  static venueShareConflictTemplate(): ConstraintTemplate {
    return {
      id: 'venue_share_conflict',
      name: 'Venue Sharing Conflicts',
      description: 'Prevents scheduling conflicts for teams sharing venues',
      category: TemplateCategory.VENUE,
      type: ConstraintType.SPATIAL,
      defaultHardness: ConstraintHardness.HARD,
      parameterDefinitions: [
        {
          name: 'minimumHoursBetween',
          type: 'number',
          required: true,
          defaultValue: 4,
          validation: { min: 2, max: 24 },
          description: 'Minimum hours between games at same venue',
          displayName: 'Min Hours Between'
        },
        {
          name: 'checkDifferentSports',
          type: 'boolean',
          required: false,
          defaultValue: true,
          description: 'Check conflicts across different sports',
          displayName: 'Cross-Sport Check'
        }
      ],
      scopeOptions: {
        requiresSports: false,
        requiresTeams: false,
        requiresVenues: true,
        requiresTimeframes: false,
        requiresConferences: false,
        requiresDivisions: false
      },
      evaluatorTemplate: `
        const minimumHoursBetween = {{minimumHoursBetween}};
        const checkDifferentSports = {{checkDifferentSports}};
        const violations = [];
        
        // Group games by venue and date
        const gamesByVenueDate = new Map();
        
        schedule.games.forEach(game => {
          const dateKey = game.date.toDateString();
          const key = \`\${game.venueId}_\${dateKey}\`;
          
          if (!gamesByVenueDate.has(key)) {
            gamesByVenueDate.set(key, []);
          }
          gamesByVenueDate.get(key).push(game);
        });
        
        // Check for conflicts
        gamesByVenueDate.forEach((games, key) => {
          if (games.length < 2) return;
          
          // Sort by time
          games.sort((a, b) => {
            const timeA = parseInt(a.time.replace(':', ''));
            const timeB = parseInt(b.time.replace(':', ''));
            return timeA - timeB;
          });
          
          for (let i = 1; i < games.length; i++) {
            const game1 = games[i-1];
            const game2 = games[i];
            
            if (!checkDifferentSports && game1.sport !== game2.sport) {
              continue;
            }
            
            // Calculate hours between games (simplified)
            const time1 = parseInt(game1.time.replace(':', ''));
            const time2 = parseInt(game2.time.replace(':', ''));
            const hoursDiff = (time2 - time1) / 100; // Rough approximation
            
            if (hoursDiff < minimumHoursBetween) {
              violations.push({
                type: 'venue_conflict',
                severity: 'critical',
                affectedEntities: [game1.id, game2.id, game1.venueId],
                description: \`Only \${hoursDiff} hours between games at same venue\`,
                possibleResolutions: ['Adjust game times', 'Move one game to different date']
              });
            }
          }
        });
        
        const satisfied = violations.length === 0;
        const score = satisfied ? 1.0 : 0;
        
        return {
          constraintId: parameters.constraintId,
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score,
          message: satisfied 
            ? 'No venue sharing conflicts' 
            : \`\${violations.length} venue conflicts found\`,
          violations
        };
      `,
      examples: [
        {
          name: 'Shared Venue Management',
          description: 'Ensure 4 hours between games at same venue',
          parameters: { minimumHoursBetween: 4, checkDifferentSports: true },
          scope: { venues: ['venue1', 'venue2'] }
        }
      ],
      tags: ['venue', 'conflict', 'sharing'],
      version: '2.0.0',
      author: 'Flextime System',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}