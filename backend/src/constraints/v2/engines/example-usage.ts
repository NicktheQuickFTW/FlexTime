import {
  OptimizedConstraintEngine,
  createOptimizedEngine,
  EvaluationContext
} from './OptimizedConstraintEngine';
import {
  UnifiedConstraint,
  ConstraintType,
  ConstraintHardness,
  Schedule,
  Team,
  Venue,
  Game
} from '../types';

// Example: Creating and using the optimized constraint engine

async function exampleUsage() {
  // 1. Create an optimized engine with a specific profile
  const engine = createOptimizedEngine('balanced');

  // Or create with custom configuration
  const customEngine = new OptimizedConstraintEngine({
    enableCaching: true,
    cacheSize: 20000,
    cacheTTL: 7200000, // 2 hours
    enableParallelization: true,
    maxWorkers: 6,
    enableIncrementalEvaluation: true,
    enablePerformanceMonitoring: true,
    groupingStrategy: 'smart',
    batchSize: 100,
    timeoutMs: 45000
  });

  // 2. Define constraints
  const constraints: UnifiedConstraint[] = [
    {
      id: 'max_games_per_week',
      name: 'Maximum Games Per Week',
      type: ConstraintType.TEMPORAL,
      hardness: ConstraintHardness.HARD,
      weight: 100,
      scope: {
        sports: ['basketball', 'football'],
        teams: [],
        venues: []
      },
      parameters: {
        maxGamesPerWeek: 3,
        minDaysBetweenGames: 2
      },
      evaluation: async (schedule, params) => {
        // Constraint evaluation logic
        const violations = [];
        let satisfied = true;

        for (const team of schedule.teams) {
          const teamGames = schedule.games.filter(
            g => g.homeTeamId === team.id || g.awayTeamId === team.id
          );

          // Group games by week
          const gamesByWeek = new Map<number, Game[]>();
          teamGames.forEach(game => {
            if (!gamesByWeek.has(game.week!)) {
              gamesByWeek.set(game.week!, []);
            }
            gamesByWeek.get(game.week!)!.push(game);
          });

          // Check each week
          for (const [week, games] of gamesByWeek) {
            if (games.length > params.maxGamesPerWeek) {
              satisfied = false;
              violations.push({
                type: 'too_many_games',
                severity: 'critical' as const,
                affectedEntities: [team.id],
                description: `Team ${team.name} has ${games.length} games in week ${week}`,
                possibleResolutions: [
                  `Move ${games.length - params.maxGamesPerWeek} games to adjacent weeks`
                ]
              });
            }
          }
        }

        return {
          constraintId: 'max_games_per_week',
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score: satisfied ? 1.0 : 0.0,
          message: satisfied 
            ? 'All teams within game limits' 
            : `${violations.length} teams exceed weekly game limit`,
          violations
        };
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0',
        author: 'system',
        description: 'Ensures teams do not play too many games per week',
        tags: ['scheduling', 'player-safety']
      },
      cacheable: true,
      parallelizable: true,
      priority: 10
    },
    {
      id: 'venue_availability',
      name: 'Venue Availability',
      type: ConstraintType.SPATIAL,
      hardness: ConstraintHardness.HARD,
      weight: 100,
      scope: {
        sports: ['all'],
        teams: [],
        venues: []
      },
      parameters: {
        checkMaintenanceWindows: true,
        allowDoubleHeaders: false
      },
      evaluation: async (schedule, params) => {
        // Check venue conflicts
        const venueUsage = new Map<string, Map<string, Game[]>>();
        
        for (const game of schedule.games) {
          const dateKey = game.date.toISOString().split('T')[0];
          
          if (!venueUsage.has(game.venueId)) {
            venueUsage.set(game.venueId, new Map());
          }
          
          if (!venueUsage.get(game.venueId)!.has(dateKey)) {
            venueUsage.get(game.venueId)!.set(dateKey, []);
          }
          
          venueUsage.get(game.venueId)!.get(dateKey)!.push(game);
        }

        const violations = [];
        for (const [venueId, dateMap] of venueUsage) {
          for (const [date, games] of dateMap) {
            if (games.length > 1 && !params.allowDoubleHeaders) {
              violations.push({
                type: 'venue_conflict',
                severity: 'critical' as const,
                affectedEntities: games.map(g => g.id),
                description: `Venue ${venueId} has ${games.length} games on ${date}`,
                possibleResolutions: [
                  'Move one game to a different venue',
                  'Reschedule one game to a different date'
                ]
              });
            }
          }
        }

        const satisfied = violations.length === 0;
        return {
          constraintId: 'venue_availability',
          status: satisfied ? 'satisfied' : 'violated',
          satisfied,
          score: satisfied ? 1.0 : 0.0,
          message: satisfied 
            ? 'All venues available for scheduled games' 
            : `${violations.length} venue conflicts found`,
          violations
        };
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0',
        author: 'system',
        description: 'Ensures venues are available for scheduled games',
        tags: ['venue', 'scheduling']
      },
      cacheable: true,
      parallelizable: true,
      priority: 10
    },
    {
      id: 'travel_fairness',
      name: 'Travel Fairness',
      type: ConstraintType.LOGICAL,
      hardness: ConstraintHardness.SOFT,
      weight: 70,
      scope: {
        sports: ['basketball', 'football'],
        teams: [],
        venues: []
      },
      parameters: {
        maxConsecutiveAwayGames: 3,
        maxTravelDistance: 2000, // miles
        preferredHomeAwayRatio: 0.5
      },
      evaluation: async (schedule, params) => {
        // Evaluate travel fairness
        let totalScore = 0;
        let teamCount = 0;
        const suggestions = [];

        for (const team of schedule.teams) {
          const teamGames = schedule.games
            .filter(g => g.homeTeamId === team.id || g.awayTeamId === team.id)
            .sort((a, b) => a.date.getTime() - b.date.getTime());

          let consecutiveAway = 0;
          let maxConsecutiveAway = 0;
          let homeGames = 0;
          let awayGames = 0;

          for (const game of teamGames) {
            if (game.homeTeamId === team.id) {
              homeGames++;
              consecutiveAway = 0;
            } else {
              awayGames++;
              consecutiveAway++;
              maxConsecutiveAway = Math.max(maxConsecutiveAway, consecutiveAway);
            }
          }

          const homeAwayRatio = homeGames / (homeGames + awayGames);
          const ratioScore = 1 - Math.abs(homeAwayRatio - params.preferredHomeAwayRatio) * 2;
          const travelScore = maxConsecutiveAway <= params.maxConsecutiveAwayGames ? 1 : 0.5;
          
          const teamScore = (ratioScore + travelScore) / 2;
          totalScore += teamScore;
          teamCount++;

          if (maxConsecutiveAway > params.maxConsecutiveAwayGames) {
            suggestions.push({
              type: 'travel_optimization',
              priority: 'medium' as const,
              description: `${team.name} has ${maxConsecutiveAway} consecutive away games`,
              implementation: 'Consider swapping home/away designations with opponents'
            });
          }
        }

        const overallScore = teamCount > 0 ? totalScore / teamCount : 1;

        return {
          constraintId: 'travel_fairness',
          status: overallScore > 0.8 ? 'satisfied' : 'partially_satisfied',
          satisfied: overallScore > 0.8,
          score: overallScore,
          message: `Travel fairness score: ${(overallScore * 100).toFixed(1)}%`,
          suggestions
        };
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0',
        author: 'system',
        description: 'Ensures fair travel distribution for teams',
        tags: ['travel', 'fairness', 'optimization']
      },
      dependencies: ['venue_availability'], // Depends on venues being assigned
      cacheable: true,
      parallelizable: true,
      priority: 5
    }
  ];

  // 3. Create a sample schedule
  const schedule: Schedule = {
    id: 'schedule_2024_basketball',
    sport: 'basketball',
    season: 'regular',
    year: 2024,
    teams: [
      {
        id: 'team_1',
        name: 'Kansas',
        conference: 'Big 12',
        homeVenue: 'venue_1'
      },
      {
        id: 'team_2',
        name: 'Kansas State',
        conference: 'Big 12',
        homeVenue: 'venue_2'
      }
    ] as Team[],
    venues: [
      {
        id: 'venue_1',
        name: 'Allen Fieldhouse',
        location: {
          latitude: 38.9543,
          longitude: -95.2558,
          city: 'Lawrence',
          state: 'KS',
          timezone: 'America/Chicago'
        },
        capacity: 16300,
        sports: ['basketball']
      },
      {
        id: 'venue_2',
        name: 'Bramlage Coliseum',
        location: {
          latitude: 39.1974,
          longitude: -96.5847,
          city: 'Manhattan',
          state: 'KS',
          timezone: 'America/Chicago'
        },
        capacity: 11000,
        sports: ['basketball']
      }
    ] as Venue[],
    games: [
      {
        id: 'game_1',
        homeTeamId: 'team_1',
        awayTeamId: 'team_2',
        venueId: 'venue_1',
        date: new Date('2024-01-15'),
        time: '19:00',
        sport: 'basketball',
        type: 'conference',
        week: 1
      },
      {
        id: 'game_2',
        homeTeamId: 'team_2',
        awayTeamId: 'team_1',
        venueId: 'venue_2',
        date: new Date('2024-02-20'),
        time: '19:00',
        sport: 'basketball',
        type: 'conference',
        week: 6
      }
    ] as Game[],
    constraints: constraints.map(c => c.id),
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      status: 'draft',
      author: 'scheduler'
    }
  };

  // 4. Warm the cache (optional but recommended)
  await engine.warmCache(schedule, constraints);

  // 5. Create evaluation context
  const context: EvaluationContext = {
    schedule,
    constraints,
    // Optional: provide previous results for incremental evaluation
    previousResults: undefined,
    // Optional: specify which entities were modified
    modifiedEntities: new Set(['team_1', 'venue_1'])
  };

  // 6. Evaluate the schedule
  console.log('Starting constraint evaluation...');
  const result = await engine.evaluate(context);

  // 7. Process results
  console.log('\n=== Evaluation Results ===');
  console.log(`Overall Score: ${(result.overallScore * 100).toFixed(1)}%`);
  console.log(`Hard Constraints Satisfied: ${result.hardConstraintsSatisfied}`);
  console.log(`Soft Constraints Score: ${(result.softConstraintsScore * 100).toFixed(1)}%`);
  console.log(`Preference Score: ${(result.preferenceScore * 100).toFixed(1)}%`);
  console.log(`Execution Time: ${result.executionTime}ms`);

  // 8. Check individual constraint results
  console.log('\n=== Constraint Results ===');
  for (const constraintResult of result.results) {
    const constraint = constraints.find(c => c.id === constraintResult.constraintId);
    console.log(`\n${constraint?.name} (${constraint?.hardness}):`);
    console.log(`  Status: ${constraintResult.status}`);
    console.log(`  Score: ${(constraintResult.score * 100).toFixed(1)}%`);
    console.log(`  Message: ${constraintResult.message}`);
    
    if (constraintResult.violations && constraintResult.violations.length > 0) {
      console.log('  Violations:');
      constraintResult.violations.forEach(v => {
        console.log(`    - ${v.description}`);
      });
    }
  }

  // 9. Display suggestions
  if (result.suggestions.length > 0) {
    console.log('\n=== Suggestions ===');
    result.suggestions.forEach(suggestion => {
      console.log(`\n[${suggestion.priority.toUpperCase()}] ${suggestion.description}`);
      if (suggestion.implementation) {
        console.log(`  Implementation: ${suggestion.implementation}`);
      }
    });
  }

  // 10. Get performance statistics
  const perfStats = engine.getPerformanceStats();
  console.log('\n=== Performance Statistics ===');
  console.log(`Total Evaluations: ${perfStats.totalEvaluations}`);
  console.log(`Average Evaluation Time: ${perfStats.averageEvaluationTime.toFixed(2)}ms`);
  console.log(`P90 Constraint Time: ${perfStats.p90ConstraintTime.toFixed(2)}ms`);
  console.log(`Cache Hit Rate: ${(perfStats.cacheHitRate * 100).toFixed(1)}%`);

  // 11. Clean up
  await engine.shutdown();
}

// Advanced example: Using incremental evaluation
async function incrementalEvaluationExample() {
  const engine = createOptimizedEngine('performance');
  
  // Initial evaluation
  const initialContext: EvaluationContext = {
    schedule: createSampleSchedule(),
    constraints: createSampleConstraints()
  };
  
  const initialResult = await engine.evaluate(initialContext);
  
  // Make a small change to the schedule
  const modifiedSchedule = { ...initialContext.schedule };
  modifiedSchedule.games[0].date = new Date('2024-01-16');
  
  // Incremental evaluation - only re-evaluate affected constraints
  const incrementalContext: EvaluationContext = {
    schedule: modifiedSchedule,
    constraints: initialContext.constraints,
    previousResults: new Map(initialResult.results.map(r => [r.constraintId, r])),
    modifiedEntities: new Set(['game_1', 'team_1', 'team_2'])
  };
  
  const incrementalResult = await engine.evaluate(incrementalContext);
  
  console.log(`Initial evaluation time: ${initialResult.executionTime}ms`);
  console.log(`Incremental evaluation time: ${incrementalResult.executionTime}ms`);
  console.log(`Speed improvement: ${(
    (1 - incrementalResult.executionTime / initialResult.executionTime) * 100
  ).toFixed(1)}%`);
  
  await engine.shutdown();
}

// Helper functions
function createSampleSchedule(): Schedule {
  // Implementation details...
  return {} as Schedule;
}

function createSampleConstraints(): UnifiedConstraint[] {
  // Implementation details...
  return [];
}

// Run the examples
if (require.main === module) {
  exampleUsage()
    .then(() => incrementalEvaluationExample())
    .catch(console.error);
}