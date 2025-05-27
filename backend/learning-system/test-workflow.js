/**
 * Test ML Workflow Script
 * 
 * Tests the machine learning workflow for scheduling agents
 * with synthetic data for a quick verification.
 */

require('dotenv').config();
const { Pool } = require('pg');
const MLWorkflowManager = require('./MLWorkflowManager');

// Configure database connection
const dbConfig = {
  database: {
    host: process.env.NEON_HOST || 'localhost',
    port: process.env.NEON_PORT || 5432,
    user: process.env.NEON_USER || 'postgres',
    password: process.env.NEON_PASSWORD || '',
    database: process.env.NEON_DATABASE || 'HELiiX',
    ssl: { rejectUnauthorized: false }
  },
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || '',
    baseUrl: process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1'
  }
};

// Generate synthetic schedule data for testing
async function generateSyntheticData(pool, sport) {
  console.log(`Generating synthetic data for ${sport}...`);
  
  // Generate a few sample schedules
  const schedules = [];
  
  for (let i = 0; i < 5; i++) {
    // Insert historical schedule
    const scheduleResult = await pool.query(
      `INSERT INTO historical_schedules(
        sport_type, season, algorithm, schedule_data
      ) VALUES($1, $2, $3, $4) RETURNING id`,
      [
        sport,
        2023 + i, // Different seasons
        ['round-robin', 'swiss-system', 'genetic-algorithm'][i % 3],
        {
          sport_type: sport,
          season: 2023 + i,
          games: generateSampleGames(sport, 10 + i),
          teams: generateSampleTeams(sport),
          metadata: {
            generated: new Date().toISOString(),
            version: '1.0.0',
            test: true
          }
        }
      ]
    );
    
    const scheduleId = scheduleResult.rows[0].id;
    schedules.push(scheduleId);
    
    // Insert metrics for this schedule
    await pool.query(
      `INSERT INTO schedule_metrics(
        schedule_id, quality_score, travel_efficiency, 
        home_away_balance, rivalry_satisfaction, constraint_compliance
      ) VALUES($1, $2, $3, $4, $5, $6)`,
      [
        scheduleId,
        0.7 + (Math.random() * 0.3), // Random quality score between 0.7 and 1.0
        0.6 + (Math.random() * 0.4),
        0.8 + (Math.random() * 0.2),
        0.7 + (Math.random() * 0.3),
        0.9 + (Math.random() * 0.1)
      ]
    );
  }
  
  console.log(`Generated ${schedules.length} synthetic schedules for ${sport}`);
  return schedules;
}

// Generate sample games for a schedule
function generateSampleGames(sport, count) {
  const games = [];
  const teams = generateSampleTeams(sport);
  
  for (let i = 0; i < count; i++) {
    const homeIdx = i % teams.length;
    const awayIdx = (i + 1 + Math.floor(i / 3)) % teams.length;
    
    if (homeIdx === awayIdx) continue;
    
    const startDate = new Date(2023, 0, 1);
    startDate.setDate(startDate.getDate() + (i * 7));
    
    games.push({
      id: `game-${i + 1}`,
      home_team: teams[homeIdx].id,
      away_team: teams[awayIdx].id,
      date: startDate.toISOString().split('T')[0],
      venue: `${teams[homeIdx].name} Stadium`,
      location: teams[homeIdx].location
    });
  }
  
  return games;
}

// Generate sample teams for a sport
function generateSampleTeams(sport) {
  const teamNames = [
    'Texas', 'Oklahoma', 'Kansas', 'Iowa State', 
    'TCU', 'Baylor', 'Texas Tech', 'Kansas State',
    'Colorado', 'Utah', 'Arizona', 'Arizona State',
    'Cincinnati', 'West Virginia', 'UCF', 'Houston'
  ];
  
  return teamNames.map((name, idx) => ({
    id: `team-${idx + 1}`,
    name,
    location: `${name}, USA`,
    conference: 'Big 12'
  }));
}

// Main test function
async function testMlWorkflow() {
  console.log('=== Testing ML Workflow ===');
  const pool = new Pool(dbConfig.database);
  
  try {
    // Generate synthetic data for a sport
    const sport = 'mens_basketball';
    const schedules = await generateSyntheticData(pool, sport);
    
    // Initialize the ML workflow manager
    console.log('Initializing ML Workflow Manager...');
    const mlWorkflow = new MLWorkflowManager(dbConfig);
    await mlWorkflow.initialize();
    
    // Run a simulated learning cycle
    console.log('Running simulated learning cycle...');
    await mlWorkflow.runDataCollectionPhase();
    console.log('Data collection completed');
    
    await mlWorkflow.runPatternExtractionPhase();
    console.log('Pattern extraction completed');
    
    await mlWorkflow.runKnowledgeBuildingPhase();
    console.log('Knowledge building completed');
    
    await mlWorkflow.runValidationPhase();
    console.log('Validation completed');
    
    // Get final stats
    const stats = await mlWorkflow.getLearningStats();
    console.log('Learning stats:', stats);
    
    console.log('=== ML Workflow Test Complete ===');
  } catch (error) {
    console.error('Error testing ML workflow:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testMlWorkflow()
  .then(() => {
    console.log('ML Workflow test completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error in ML Workflow test:', err);
    process.exit(1);
  });
