// Constraint Template System - Example Usage
// Demonstrates how to use the template system for creating and managing constraints

import {
  templateSystem,
  templateBuilder,
  templateValidator,
  TemplateCategory,
  ParameterBuilder,
  StandardTemplates
} from './index';
import { 
  ConstraintType, 
  ConstraintHardness,
  Schedule,
  Team,
  Game,
  Venue
} from '../types';

// Example 1: Using a standard template
async function useStandardTemplate() {
  console.log('=== Example 1: Using Standard Templates ===\n');

  // Get all available templates
  const allTemplates = templateSystem.getAllTemplates();
  console.log(`Available templates: ${allTemplates.length}`);

  // Find templates by category
  const travelTemplates = templateSystem.getTemplatesByCategory(TemplateCategory.TRAVEL);
  console.log(`Travel templates: ${travelTemplates.map(t => t.name).join(', ')}`);

  // Search for specific templates
  const consecutiveTemplates = templateSystem.searchTemplates('consecutive');
  console.log(`Consecutive templates: ${consecutiveTemplates.map(t => t.name).join(', ')}`);

  // Create a constraint from a template
  const constraint = templateSystem.createConstraintFromTemplate({
    templateId: 'consecutive_games_limit',
    name: 'Basketball Consecutive Game Limit',
    parameters: {
      maxConsecutive: 3,
      daysBetween: 7
    },
    scope: {
      sports: ['basketball'],
      teams: [], // All teams
      venues: [],
      timeframes: [],
      conferences: ['Big 12'],
      divisions: []
    },
    hardness: ConstraintHardness.SOFT,
    weight: 80
  });

  console.log('\nCreated constraint:');
  console.log(`- ID: ${constraint.id}`);
  console.log(`- Name: ${constraint.name}`);
  console.log(`- Type: ${constraint.type}`);
  console.log(`- Weight: ${constraint.weight}`);

  // Create variations of the same template
  const variations = templateSystem.createConstraintVariations(
    'minimum_days_between_games',
    {
      name: 'Rest Days',
      parameters: { minimumDays: 2, applyToAwayGamesOnly: false },
      scope: { sports: ['football'], teams: [], venues: [], timeframes: [], conferences: [], divisions: [] },
      hardness: ConstraintHardness.HARD,
      weight: 100
    },
    [
      {
        parameterOverrides: { minimumDays: 6 },
        nameSuffix: 'Football Standard'
      },
      {
        parameterOverrides: { minimumDays: 4, applyToAwayGamesOnly: true },
        nameSuffix: 'Away Games Only'
      }
    ]
  );

  console.log(`\nCreated ${variations.length} variations`);
}

// Example 2: Building a custom template
async function buildCustomTemplate() {
  console.log('\n=== Example 2: Building Custom Template ===\n');

  // Reset the builder
  templateBuilder.reset();

  // Step 1: Basic information
  templateBuilder.setBasicInfo(
    'Weekend Game Preference',
    'Prefers scheduling games on weekends for better attendance',
    TemplateCategory.TIMING
  );

  // Step 2: Constraint type
  templateBuilder.setConstraintType(
    ConstraintType.TEMPORAL,
    ConstraintHardness.PREFERENCE
  );

  // Step 3: Add parameters
  templateBuilder.addParameter(
    ParameterBuilder.number('weekendGamePercentage', 'Weekend Game %', 
      'Target percentage of games on weekends', {
        required: true,
        defaultValue: 70,
        min: 0,
        max: 100
      })
  );

  templateBuilder.addParameter(
    ParameterBuilder.boolean('includeFriday', 'Include Friday',
      'Consider Friday as part of weekend', {
        required: false,
        defaultValue: true
      })
  );

  templateBuilder.addParameter(
    ParameterBuilder.enum('priorityLevel', 'Priority Level',
      'How strongly to prefer weekends', 
      ['low', 'medium', 'high'], {
        required: false,
        defaultValue: 'medium'
      })
  );

  // Step 4: Scope options
  templateBuilder.setScopeOptions({
    requiresSports: true,
    requiresTeams: false,
    requiresVenues: false,
    requiresTimeframes: false,
    requiresConferences: false,
    requiresDivisions: false
  });

  // Step 5: Build evaluator
  templateBuilder.buildEvaluator([
    {
      type: 'custom',
      order: 1,
      customCode: `
const weekendGamePercentage = {{weekendGamePercentage}};
const includeFriday = {{includeFriday}};
const priorityLevel = {{priorityLevel}};

const teams = parameters.scope?.teams || schedule.teams.map(t => t.id);
const teamScores = new Map();

teams.forEach(teamId => {
  const teamGames = utils.getTeamGames(schedule, teamId);
  const weekendGames = teamGames.filter(game => {
    const dayOfWeek = game.date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6 || 
           (includeFriday && dayOfWeek === 5);
  });
  
  const actualPercentage = teamGames.length > 0 
    ? (weekendGames.length / teamGames.length) * 100 
    : 0;
  
  const deviation = Math.abs(actualPercentage - weekendGamePercentage);
  const score = Math.max(0, 1 - deviation / 100);
  
  teamScores.set(teamId, {
    actualPercentage,
    score,
    weekendGames: weekendGames.length,
    totalGames: teamGames.length
  });
  
  if (deviation > 20) {
    suggestions.push({
      type: 'weekend_scheduling',
      priority: priorityLevel === 'high' ? 'high' : 'medium',
      description: \`Team \${teamId}: \${actualPercentage.toFixed(1)}% weekend games (target: \${weekendGamePercentage}%)\`,
      expectedImprovement: deviation
    });
  }
});

const averageScore = Array.from(teamScores.values())
  .reduce((sum, data) => sum + data.score, 0) / teamScores.size;`
    }
  ]);

  // Step 6: Add examples
  templateBuilder.addExample({
    name: 'High Weekend Preference',
    description: 'Strong preference for weekend games',
    parameters: {
      weekendGamePercentage: 80,
      includeFriday: true,
      priorityLevel: 'high'
    },
    scope: { sports: ['football'] }
  });

  // Step 7: Set metadata
  templateBuilder.setMetadata(
    ['weekend', 'attendance', 'scheduling', 'preference'],
    { customField: 'value' }
  );

  // Check progress
  const progress = templateBuilder.getProgress();
  console.log(`Build progress: ${progress.percentComplete}%`);
  console.log(`Can build: ${progress.canBuild}`);
  console.log('Steps:');
  progress.steps.forEach(step => {
    console.log(`  - ${step.name}: ${step.completed ? '✓' : '✗'}`);
  });

  // Build the template
  try {
    const customTemplate = templateBuilder.build();
    console.log('\nCustom template built successfully!');
    console.log(`Template ID: ${customTemplate.id}`);

    // Register the template
    templateSystem.registerTemplate(customTemplate);
    console.log('Template registered in system');

    // Export template
    const exported = templateSystem.exportTemplate(customTemplate.id);
    console.log('\nExported template JSON:');
    console.log(exported.substring(0, 200) + '...');

  } catch (error) {
    console.error('Failed to build template:', error.message);
  }
}

// Example 3: Validating templates
async function validateTemplates() {
  console.log('\n=== Example 3: Template Validation ===\n');

  // Get a standard template
  const template = StandardTemplates.consecutiveGamesTemplate();

  // Validate the template
  const validation = templateValidator.validateTemplate(template);
  console.log('Validation result for standard template:');
  console.log(templateValidator.getValidationSummary(validation));

  if (!validation.valid) {
    console.log('\nErrors:');
    validation.errors.forEach(e => console.log(`  - ${e}`));
  }

  if (validation.warnings.length > 0) {
    console.log('\nWarnings:');
    validation.warnings.forEach(w => console.log(`  - ${w}`));
  }

  if (validation.suggestions.length > 0) {
    console.log('\nSuggestions:');
    validation.suggestions.forEach(s => console.log(`  - ${s}`));
  }

  // Validate a template instance
  console.log('\n\nValidating template instance:');
  const instanceValidation = templateValidator.validateTemplateInstance(
    template,
    {
      templateId: template.id,
      name: 'Test Instance',
      parameters: {
        maxConsecutive: 5,
        daysBetween: 7
      },
      scope: {
        sports: ['basketball'],
        teams: [],
        venues: [],
        timeframes: [],
        conferences: [],
        divisions: []
      },
      hardness: ConstraintHardness.SOFT,
      weight: 75
    }
  );

  console.log(templateValidator.getValidationSummary(instanceValidation));
}

// Example 4: Using the template system in practice
async function practicalExample() {
  console.log('\n=== Example 4: Practical Usage ===\n');

  // Create a mock schedule
  const schedule: Schedule = {
    id: 'schedule-1',
    sport: 'basketball',
    season: 'regular',
    year: 2024,
    games: [
      {
        id: 'game-1',
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        venueId: 'venue-1',
        date: new Date('2024-01-10'),
        time: '19:00',
        sport: 'basketball',
        type: 'conference',
        week: 1
      },
      {
        id: 'game-2',
        homeTeamId: 'team-1',
        awayTeamId: 'team-3',
        venueId: 'venue-1',
        date: new Date('2024-01-12'),
        time: '19:00',
        sport: 'basketball',
        type: 'conference',
        week: 1
      },
      {
        id: 'game-3',
        homeTeamId: 'team-1',
        awayTeamId: 'team-4',
        venueId: 'venue-1',
        date: new Date('2024-01-14'),
        time: '14:00',
        sport: 'basketball',
        type: 'conference',
        week: 2
      }
    ],
    teams: [
      {
        id: 'team-1',
        name: 'Team 1',
        conference: 'Big 12',
        homeVenue: 'venue-1'
      },
      {
        id: 'team-2',
        name: 'Team 2',
        conference: 'Big 12',
        homeVenue: 'venue-2'
      },
      {
        id: 'team-3',
        name: 'Team 3',
        conference: 'Big 12',
        homeVenue: 'venue-3'
      },
      {
        id: 'team-4',
        name: 'Team 4',
        conference: 'Big 12',
        homeVenue: 'venue-4'
      }
    ] as Team[],
    venues: [
      {
        id: 'venue-1',
        name: 'Arena 1',
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          city: 'New York',
          state: 'NY',
          timezone: 'America/New_York'
        },
        capacity: 20000,
        sports: ['basketball']
      }
    ] as Venue[],
    constraints: []
  };

  // Create and evaluate a constraint
  const constraint = templateSystem.createConstraintFromTemplate({
    templateId: 'consecutive_home_games_limit',
    name: 'Home Game Clustering Check',
    parameters: {
      maxConsecutiveHome: 2
    },
    scope: {
      sports: ['basketball'],
      teams: ['team-1'],
      venues: [],
      timeframes: [],
      conferences: [],
      divisions: []
    },
    hardness: ConstraintHardness.SOFT,
    weight: 70
  });

  console.log('Evaluating constraint against schedule...');
  const result = await constraint.evaluation(schedule, constraint.parameters);

  console.log('\nEvaluation Result:');
  console.log(`- Status: ${result.status}`);
  console.log(`- Satisfied: ${result.satisfied}`);
  console.log(`- Score: ${result.score}`);
  console.log(`- Message: ${result.message}`);

  if (result.violations && result.violations.length > 0) {
    console.log('\nViolations:');
    result.violations.forEach(v => {
      console.log(`  - ${v.description}`);
      console.log(`    Severity: ${v.severity}`);
      console.log(`    Resolutions: ${v.possibleResolutions?.join(', ')}`);
    });
  }
}

// Example 5: Advanced template features
async function advancedFeatures() {
  console.log('\n=== Example 5: Advanced Features ===\n');

  // Clone and modify an existing template
  const originalTemplate = templateSystem.getTemplate('travel_distance_limit');
  if (originalTemplate) {
    const clonedTemplate = templateSystem.cloneTemplate(
      'travel_distance_limit',
      {
        name: 'Regional Travel Restriction',
        description: 'Strict regional travel limits for cost reduction',
        parameterDefinitions: [
          ...originalTemplate.parameterDefinitions,
          ParameterBuilder.boolean('allowExceptions', 'Allow Exceptions',
            'Allow exceptions for rivalry games', {
              required: false,
              defaultValue: false
            })
        ]
      }
    );

    console.log(`Cloned template: ${clonedTemplate.name}`);
    console.log(`New ID: ${clonedTemplate.id}`);
  }

  // Get evaluator snippets
  const snippets = templateBuilder.getSnippets('temporal');
  console.log('\nAvailable temporal snippets:');
  snippets.forEach(s => {
    console.log(`  - ${s.name}: ${s.description}`);
  });

  // Create a custom snippet
  templateBuilder.createSnippet({
    id: 'rivalry-check',
    name: 'Rivalry Game Check',
    description: 'Identifies rivalry games',
    code: `
const rivalryGames = schedule.games.filter(g => 
  g.metadata?.rivalryGame === true
);`,
    parameters: [],
    category: 'game-filtering'
  });

  console.log('\nCustom snippet created');
}

// Run all examples
async function runExamples() {
  await useStandardTemplate();
  await buildCustomTemplate();
  await validateTemplates();
  await practicalExample();
  await advancedFeatures();
}

// Execute if running directly
if (require.main === module) {
  runExamples().catch(console.error);
}

export {
  useStandardTemplate,
  buildCustomTemplate,
  validateTemplates,
  practicalExample,
  advancedFeatures
};