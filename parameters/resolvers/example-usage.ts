// Example usage of the Smart Conflict Resolution System
// Demonstrates how to detect and resolve scheduling conflicts

import { 
  SmartConflictResolver, 
  ConflictAnalyzer,
  ResolutionHistory,
  ConflictType,
  ResolutionStrategy
} from './index';
import { Schedule, Game, Team, Venue } from '../types/schedule-types';

// Example: Initialize the conflict resolution system
async function initializeConflictResolution() {
  // Configure the resolver
  const resolver = new SmartConflictResolver({
    maxResolutionAttempts: 5,
    enableLearning: true,
    parallelResolution: true,
    confidenceThreshold: 0.7,
    historicalDataPath: './data/resolution-history.json'
  });

  return resolver;
}

// Example: Detect and resolve conflicts in a schedule
async function resolveScheduleConflicts(schedule: Schedule) {
  const resolver = await initializeConflictResolution();
  const analyzer = new ConflictAnalyzer();

  console.log('🔍 Detecting conflicts in schedule...');
  
  // Step 1: Detect all conflicts
  const conflicts = await analyzer.detectConflicts(schedule);
  console.log(`Found ${conflicts.length} conflicts`);

  // Step 2: Display conflict summary
  conflicts.forEach(conflict => {
    console.log(`
Conflict: ${conflict.type}
Severity: ${conflict.severity}
Description: ${conflict.description}
Affected Games: ${conflict.affectedGames.length}
Affected Teams: ${conflict.affectedTeams.map(t => t.name).join(', ')}
    `);
  });

  // Step 3: Resolve conflicts
  console.log('\n🔧 Resolving conflicts...');
  const resolutions = await resolver.resolveConflicts(schedule, conflicts);

  // Step 4: Display resolution summary
  resolutions.forEach((resolution, conflictId) => {
    const conflict = conflicts.find(c => c.id === conflictId);
    console.log(`
Resolution for: ${conflict?.type}
Strategy: ${resolution.strategy}
Description: ${resolution.description}
Feasibility: ${(resolution.feasibility * 100).toFixed(0)}%
Recommendation Score: ${(resolution.recommendationScore * 100).toFixed(0)}%
Games Modified: ${resolution.modifications.length}
Impact: ${resolution.impact.fanImpact} fan impact
    `);
  });

  return resolutions;
}

// Example: Handle specific conflict types
async function handleBYUSundayConflict(schedule: Schedule) {
  const analyzer = new ConflictAnalyzer();
  const resolver = new SmartConflictResolver();

  // Detect only Sunday restriction conflicts
  const allConflicts = await analyzer.detectConflicts(schedule);
  const sundayConflicts = allConflicts.filter(
    c => c.type === ConflictType.SUNDAY_RESTRICTION
  );

  if (sundayConflicts.length > 0) {
    console.log(`⛪ Found ${sundayConflicts.length} BYU Sunday conflicts`);
    
    // Resolve with specific strategies
    const resolutions = await resolver.resolveConflicts(schedule, sundayConflicts);
    
    // Apply approved resolutions
    resolutions.forEach((resolution, conflictId) => {
      if (resolution.strategy === ResolutionStrategy.DATE_SWAP) {
        console.log('✅ Swapping game to Saturday evening');
      } else if (resolution.strategy === ResolutionStrategy.WAIVER_REQUEST) {
        console.log('📋 Requesting waiver for Sunday game');
      }
    });
  }
}

// Example: Generate learning report
async function generateLearningReport() {
  const history = new ResolutionHistory('./data/resolution-history.json');
  
  console.log('📊 Generating learning report...\n');
  const report = history.generateLearningReport();
  console.log(report);

  // Get insights for specific conflict type
  const venueInsights = history.getLearningInsights(ConflictType.VENUE_DOUBLE_BOOKING);
  
  console.log('\n💡 Venue Conflict Insights:');
  venueInsights.forEach(insight => {
    console.log(`- ${insight.recommendation} (${(insight.confidence * 100).toFixed(0)}% confidence)`);
  });
}

// Example: Track resolution feedback
async function trackResolutionFeedback(
  resolutionId: string,
  success: boolean,
  satisfaction: number,
  comments?: string
) {
  const history = new ResolutionHistory();
  
  // Record the resolution outcome
  await history.recordResolution(
    {
      id: resolutionId,
      conflictId: 'conflict-123',
      strategy: ResolutionStrategy.TIME_SHIFT,
      description: 'Shifted game time to avoid venue conflict',
      modifications: [],
      impact: {
        teamsAffected: ['team-1', 'team-2'],
        venuesAffected: ['venue-1'],
        gamesModified: 1,
        travelDistanceChange: 0,
        fanImpact: 'minimal'
      },
      feasibility: 0.85,
      recommendationScore: 0.9,
      status: 'implemented'
    },
    success,
    {
      satisfaction,
      comments,
      issues: success ? [] : ['Failed to resolve conflict'],
      wouldRecommend: satisfaction >= 3
    }
  );

  console.log('✅ Feedback recorded for future learning');
}

// Example: Analyze conflict patterns
async function analyzeConflictPatterns(schedule: Schedule) {
  const analyzer = new ConflictAnalyzer();
  const history = new ResolutionHistory();

  // Detect current conflicts
  const conflicts = await analyzer.detectConflicts(schedule);

  // Group by type
  const conflictsByType = new Map<ConflictType, number>();
  conflicts.forEach(conflict => {
    const count = conflictsByType.get(conflict.type) || 0;
    conflictsByType.set(conflict.type, count + 1);
  });

  console.log('📈 Conflict Pattern Analysis:');
  conflictsByType.forEach((count, type) => {
    // Get historical success rates
    history.getSuccessRate(type, ResolutionStrategy.DATE_SWAP).then(rate => {
      console.log(`
${type}:
  Current Count: ${count}
  Historical Success with Date Swap: ${(rate * 100).toFixed(0)}%
  Recommended Strategies: ${history.getRecommendedStrategies(type).join(', ')}
      `);
    });
  });
}

// Example: Batch conflict resolution with priorities
async function batchResolveWithPriorities(schedule: Schedule) {
  const resolver = new SmartConflictResolver({
    enableLearning: true,
    confidenceThreshold: 0.8
  });
  const analyzer = new ConflictAnalyzer();

  // Detect all conflicts
  const allConflicts = await analyzer.detectConflicts(schedule);

  // Separate by priority
  const criticalConflicts = allConflicts.filter(c => c.severity === 'critical');
  const majorConflicts = allConflicts.filter(c => c.severity === 'major');
  const minorConflicts = allConflicts.filter(c => c.severity === 'minor');

  console.log('🎯 Resolving conflicts by priority...');

  // Resolve critical conflicts first
  if (criticalConflicts.length > 0) {
    console.log(`\n🚨 Resolving ${criticalConflicts.length} critical conflicts...`);
    const criticalResolutions = await resolver.resolveConflicts(schedule, criticalConflicts);
    
    // Apply critical resolutions immediately
    criticalResolutions.forEach(resolution => {
      resolution.status = 'accepted';
    });
  }

  // Then major conflicts
  if (majorConflicts.length > 0) {
    console.log(`\n⚠️  Resolving ${majorConflicts.length} major conflicts...`);
    await resolver.resolveConflicts(schedule, majorConflicts);
  }

  // Finally minor conflicts
  if (minorConflicts.length > 0) {
    console.log(`\n📌 Resolving ${minorConflicts.length} minor conflicts...`);
    await resolver.resolveConflicts(schedule, minorConflicts);
  }
}

// Example: Export data for ML training
async function exportMLTrainingData() {
  const history = new ResolutionHistory();
  
  console.log('🤖 Exporting data for ML training...');
  const trainingData = history.exportForMLTraining();
  
  // Save to file or send to ML pipeline
  console.log(`Exported ${trainingData.length} resolution records`);
  console.log('Sample record:', JSON.stringify(trainingData[0], null, 2));
}

// Main example execution
async function main() {
  // Create a sample schedule
  const sampleSchedule: Schedule = {
    id: 'schedule-2024',
    sport: 'basketball',
    season: '2024-2025',
    year: 2024,
    games: [], // Would be populated with actual games
    teams: [], // Would be populated with actual teams
    venues: [], // Would be populated with actual venues
    constraints: [],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      status: 'draft',
      author: 'System'
    }
  };

  try {
    // Run various examples
    await resolveScheduleConflicts(sampleSchedule);
    await generateLearningReport();
    await analyzeConflictPatterns(sampleSchedule);
    
    console.log('\n✅ Conflict resolution examples completed successfully');
  } catch (error) {
    console.error('❌ Error during conflict resolution:', error);
  }
}

// Export example functions for use in other modules
export {
  initializeConflictResolution,
  resolveScheduleConflicts,
  handleBYUSundayConflict,
  generateLearningReport,
  trackResolutionFeedback,
  analyzeConflictPatterns,
  batchResolveWithPriorities,
  exportMLTrainingData
};

// Run examples if this file is executed directly
if (require.main === module) {
  main();
}