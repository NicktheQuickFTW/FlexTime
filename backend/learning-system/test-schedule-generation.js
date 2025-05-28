/**
 * Test Schedule Generation
 * 
 * This script tests the schedule generation capabilities using the hybrid
 * Neon + Supabase architecture. It retrieves actual data from the Neon DB
 * and uses the ML workflow to generate and analyze schedules.
 */

require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Import Intelligence Engine Client for MCP communication
const IntelligenceEngineClient = require('../src/api/intelligence-engine-client');
const MLWorkflowManager = require('./MLWorkflowManager');

// Create output directory for test results
const resultsDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir);
}

// Configure database connection with hardcoded Neon connection string
const dbConfig = {
  database: {
    connectionString: 'postgres://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech:5432/HELiiX?sslmode=require'
  },
  // Intelligence Engine (Supabase MCP) configuration
  intelligenceEngine: {
    baseUrl: process.env.INTELLIGENCE_ENGINE_URL || 'http://localhost:4001',
    apiKey: process.env.INTELLIGENCE_ENGINE_API_KEY
  },
  // Claude configuration
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || '',
    baseUrl: process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1'
  }
};

// Function to log test activity
function logTestActivity(activity, status, details = {}) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      activity_type: 'schedule_test',
      activity: activity,
      status: status,
      details: details,
      created_at: timestamp
    };
    
    console.log(`[${timestamp}] ${activity} - ${status}`);
    fs.appendFileSync(
      path.join(resultsDir, `schedule-test-${new Date().toISOString().split('T')[0]}.log`),
      `${JSON.stringify(logEntry)}\n`,
      'utf8'
    );
  } catch (err) {
    console.error('Failed to log test activity:', err);
  }
}

// Function to save test results
function saveTestResults(testName, results) {
  try {
    const filePath = path.join(resultsDir, `${testName}-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`Test results saved to ${filePath}`);
    return filePath;
  } catch (err) {
    console.error('Failed to save test results:', err);
    return null;
  }
}

// Main test function
async function runScheduleTest() {
  console.log('=== Running Schedule Generation Test ===');
  logTestActivity('test_start', 'in_progress');
  
  let mlWorkflow = null;
  const pool = new Pool(dbConfig.database);
  
  try {
    // Initialize ML Workflow Manager
    mlWorkflow = new MLWorkflowManager(dbConfig);
    await mlWorkflow.initialize();
    logTestActivity('init_ml_workflow', 'success');
    
    // Fetch football teams (sport_id = 8) from Neon DB
    const sportId = 8; // Football is sport_id 8
    // First get the sport name for better logging
    const sportResult = await pool.query('SELECT * FROM sports WHERE sport_id = $1', [sportId]);
    const sportName = sportResult.rows.length > 0 ? sportResult.rows[0].name : 'Football';
    
    console.log(`Fetching teams for ${sportName} (ID: ${sportId})...`);
    const teamsResult = await pool.query('SELECT * FROM teams WHERE sport_id = $1', [sportId]);
    const teams = teamsResult.rows;
    console.log(`Found ${teams.length} teams for ${sportName}`);
    
    if (teams.length < 2) {
      throw new Error(`Not enough teams found for ${sportName}. Need at least 2 teams.`);
    }
    
    logTestActivity('fetch_teams', 'success', { count: teams.length, sport: sportName });
    
    // Fetch venues from Neon DB - venues are associated with teams via team_id
    console.log('Fetching venues...');
    // Get team_ids for our teams
    const teamIds = teams.map(team => team.team_id);
    
    // Construct a query to get venues for these teams
    const venuesResult = await pool.query(
      'SELECT * FROM venues WHERE team_id = ANY($1)',
      [teamIds]
    );
    let venues = venuesResult.rows;
    console.log(`Found ${venues.length} venues in database for ${teamIds.length} teams`);
    
    // If we don't have venues in the database, create dummy ones for testing
    if (venues.length === 0) {
      console.log('Creating dummy venues for testing');
      venues = teams.map((team, index) => ({
        venue_id: index + 1,
        name: `${team.name} Stadium`,
        city: 'Test City',
        state: 'TS',
        capacity: 50000,
        team_id: team.team_id
      }));
      console.log(`Created ${venues.length} dummy venues for testing`);
    }
    
    logTestActivity('fetch_venues', 'success', { count: venues.length, sport: sportName });
    
    // Check if the learned_patterns table exists
    let patterns = [];
    try {
      console.log('Checking for learned patterns...');
      // Use a more resilient approach - check if table exists first
      const tableCheck = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'learned_patterns')");
      
      if (tableCheck.rows[0].exists) {
        const patternsResult = await pool.query(
          'SELECT * FROM learned_patterns WHERE sport_id = $1 ORDER BY confidence DESC',
          [sportId]
        );
        patterns = patternsResult.rows;
        console.log(`Found ${patterns.length} learned patterns for ${sportName}`);
      } else {
        console.log('No learned_patterns table exists yet - normal for first run');
      }
    } catch (error) {
      console.log('Could not retrieve patterns - table may not exist yet:', error.message);
      // Continue execution - patterns are optional
    }
    
    logTestActivity('retrieve_patterns', 'success', { count: patterns.length, sport: sportName });
    
    // Retrieve agent memories (learned knowledge)
    console.log('Retrieving agent memories...');
    // Use a more resilient approach - check if table exists first
    let memories = [];
    try {
      const tableCheck = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agent_memories')");
      
      if (tableCheck.rows[0].exists) {
        const memoriesResult = await pool.query('SELECT * FROM agent_memories WHERE sport_id = $1', [sportId]);
        memories = memoriesResult.rows;
        console.log(`Found ${memories.length} agent memories`);
      } else {
        console.log('No agent_memories table exists yet - normal for first run');
      }
    } catch (error) {
      console.log('Could not retrieve agent memories - table may not exist yet:', error.message);
      // Continue execution - agent memories are optional
    }
    
    logTestActivity('retrieve_memories', 'success', { count: memories.length, sport: sportName });
    
    // Log the insights from the memories
    if (memories.length > 0) {
      const insights = memories.map(memory => ({
        type: memory.memory_type,
        relevance: memory.relevance_score,
        content: typeof memory.content === 'string' ? JSON.parse(memory.content) : memory.content
      }));
      
      saveTestResults(`agent-memories-${sportName}`, insights);
    } else {
      console.log('No agent memories found - this will use default parameters');
      logTestActivity('retrieve_memories', 'warning', { message: 'No memories found' });
    }
    
    // Generate base schedule using the learned patterns
    console.log('Generating schedule...');
    
    // Simple round-robin algorithm to demonstrate
    const games = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        games.push({
          homeTeam: teams[i].team_id,
          awayTeam: teams[j].team_id,
          venue: venues[Math.floor(Math.random() * venues.length)].venue_id,
          date: new Date(2025, 8, Math.floor(Math.random() * 30) + 1).toISOString().split('T')[0]
        });
      }
    }
    
    // Apply learned patterns if available
    if (patterns.length > 0) {
      console.log('Applying learned patterns to schedule...');
      
      // In a real implementation, this would use the patterns to optimize the schedule
      // For this test, we'll just simulate it by adjusting some games
      
      // Example: If there's a pattern about optimal rest periods, adjust dates
      const restPattern = patterns.find(p => p.pattern_type === 'optimal_rest_period');
      if (restPattern) {
        const restDays = restPattern.pattern_data.avg_rest_days || 3;
        console.log(`Applying optimal rest period of ${restDays} days`);
        
        // Simple simulation of applying this pattern
        let currentTeamDates = {};
        games.forEach((game, index) => {
          const homeTeam = game.homeTeam;
          const awayTeam = game.awayTeam;
          
          // Initialize if not exists
          if (!currentTeamDates[homeTeam]) currentTeamDates[homeTeam] = [];
          if (!currentTeamDates[awayTeam]) currentTeamDates[awayTeam] = [];
          
          // Get proposed date
          let gameDate = new Date(game.date);
          
          // Check if teams have recently played
          const homeLastGame = currentTeamDates[homeTeam].length > 0 ? 
            new Date(currentTeamDates[homeTeam][currentTeamDates[homeTeam].length - 1]) : null;
          
          const awayLastGame = currentTeamDates[awayTeam].length > 0 ? 
            new Date(currentTeamDates[awayTeam][currentTeamDates[awayTeam].length - 1]) : null;
          
          // Enforce rest period
          if (homeLastGame) {
            const daysSinceLastHomeGame = Math.floor((gameDate - homeLastGame) / (1000 * 60 * 60 * 24));
            if (daysSinceLastHomeGame < restDays) {
              // Adjust date to ensure proper rest
              gameDate.setDate(gameDate.getDate() + (restDays - daysSinceLastHomeGame));
            }
          }
          
          if (awayLastGame) {
            const daysSinceLastAwayGame = Math.floor((gameDate - awayLastGame) / (1000 * 60 * 60 * 24));
            if (daysSinceLastAwayGame < restDays) {
              // Adjust date to ensure proper rest
              gameDate.setDate(gameDate.getDate() + (restDays - daysSinceLastAwayGame));
            }
          }
          
          // Update the game date
          games[index].date = gameDate.toISOString().split('T')[0];
          
          // Record this game for both teams
          currentTeamDates[homeTeam].push(games[index].date);
          currentTeamDates[awayTeam].push(games[index].date);
        });
      }
    }
    
    // Calculate schedule quality metrics
    const scheduleMetrics = {
      totalGames: games.length,
      gamesPerTeam: {},
      homeAwayBalance: {},
      venueUsage: {}
    };
    
    // Calculate games per team and home/away balance
    teams.forEach(team => {
      const teamId = team.team_id;
      const homeGames = games.filter(game => game.homeTeam === teamId).length;
      const awayGames = games.filter(game => game.awayTeam === teamId).length;
      const totalGames = homeGames + awayGames;
      
      scheduleMetrics.gamesPerTeam[teamId] = totalGames;
      scheduleMetrics.homeAwayBalance[teamId] = homeGames / totalGames;
    });
    
    // Calculate venue usage
    venues.forEach(venue => {
      const venueId = venue.venue_id;
      scheduleMetrics.venueUsage[venueId] = games.filter(game => game.venue === venueId).length;
    });
    
    // Final schedule object
    const schedule = {
      sportName,
      season: '2025-2026',
      generatedAt: new Date().toISOString(),
      games,
      metrics: scheduleMetrics,
      teamsCount: teams.length,
      venuesCount: venues.length,
      patternsApplied: patterns.length,
      memoriesUsed: memories.length
    };
    
    // Save the generated schedule
    const resultPath = saveTestResults(`schedule-${sportName}`, schedule);
    
    logTestActivity('generate_schedule', 'success', { 
      gamesCount: games.length,
      sport: sportName,
      resultPath 
    });
    
    console.log('=== Schedule Generation Test Complete ===');
    
    return { success: true, schedule };
  } catch (error) {
    console.error('Error in schedule test:', error);
    logTestActivity('test_error', 'failed', { error: error.message, stack: error.stack });
    return { success: false, error: error.message };
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the test
runScheduleTest()
  .then(result => {
    if (result.success) {
      console.log('Test completed successfully!');
      process.exit(0);
    } else {
      console.error('Test failed:', result.error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Fatal error in test:', err);
    process.exit(1);
  });
