/**
 * test-schedule-with-championship-constraints.js
 * 
 * Test script for generating schedules with championship date constraints.
 * This demonstrates how the ML workflow integrates championship dates into schedule generation.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const MLWorkflowManager = require('./MLWorkflowManager');
const ChampionshipDateManager = require('./ChampionshipDateManager');

// Create test results directory if it doesn't exist
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
    apiKey: process.env.INTELLIGENCE_ENGINE_API_KEY,
    fallbackEnabled: true
  }
};

// Helper function to save test results
function saveTestResults(filename, data) {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filepath = path.join(resultsDir, `${filename}-${timestamp}.json`);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`Test results saved to ${filepath}`);
  return filepath;
}

// Helper function to log test activities
function logTestActivity(action, status, details = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${action} - ${status}`);
  
  // Log to file
  const logEntry = {
    timestamp,
    action,
    status,
    ...details
  };
  
  const logPath = path.join(resultsDir, 'test-log.jsonl');
  fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
}

/**
 * Generate schedule with championship constraints
 */
async function generateScheduleWithConstraints(sportId, season, championshipDateManager) {
  try {
    console.log(`Generating schedule for sport ID ${sportId}, season ${season} with championship constraints`);
    
    // Get championship date constraints
    const constraints = await championshipDateManager.getChampionshipConstraints(sportId, season);
    console.log('Championship constraints:', JSON.stringify(constraints, null, 2));
    
    // Apply constraints to schedule generation
    const regularSeasonEndDate = constraints.regularSeasonEndDate || '2025-11-01'; // Default if not provided
    console.log(`Regular season must end by: ${regularSeasonEndDate}`);
    
    // Return championship constraints with schedule parameters
    return {
      sportId,
      season,
      championshipConstraints: constraints,
      schedulingParameters: {
        seasonStartDate: '2025-09-01', // Example start date for football season
        seasonEndDate: regularSeasonEndDate,
        requiredHomeGames: 6,
        requiredAwayGames: 6,
        minDaysBetweenGames: 5,
        preferredGameDays: ['Saturday']
      }
    };
  } catch (error) {
    console.error('Error generating schedule with constraints:', error);
    throw error;
  }
}

// Main test function
async function runTest() {
  console.log('=== Testing Schedule Generation with Championship Constraints ===');
  logTestActivity('test_start', 'in_progress');
  
  let mlWorkflow = null;
  const pool = new Pool(dbConfig.database);
  
  try {
    // Initialize ML Workflow Manager
    mlWorkflow = new MLWorkflowManager(dbConfig);
    await mlWorkflow.initialize();
    logTestActivity('init_ml_workflow', 'success');
    
    // Get championship date constraints for Football (ID 8)
    const sportId = 8; // Football
    const season = '2025-2026';
    
    // Get sport name for better logging
    const sportResult = await pool.query('SELECT * FROM sports WHERE sport_id = $1', [sportId]);
    const sportName = sportResult.rows.length > 0 ? sportResult.rows[0].name : 'Football';
    
    console.log(`Testing championship dates for ${sportName} (ID: ${sportId})`);
    
    // Generate a schedule with championship date constraints
    const scheduleWithConstraints = await generateScheduleWithConstraints(
      sportId, 
      season,
      mlWorkflow.championshipDateManager
    );
    
    // Save the generated schedule parameters
    const resultPath = saveTestResults(`schedule-params-${sportName}`, scheduleWithConstraints);
    
    logTestActivity('generate_schedule_params', 'success', { 
      sport: sportName,
      hasChampionshipConstraints: scheduleWithConstraints.championshipConstraints.hasChampionship,
      resultPath 
    });
    
    // Output for a sample date to check if it would conflict with championship
    const sampleDate = '2025-12-06'; // First Saturday in December (typical championship date)
    const conflictCheck = await mlWorkflow.championshipDateManager.checkChampionshipConflict(
      sportId, 
      sampleDate,
      season
    );
    
    console.log(`Championship conflict check for ${sampleDate}: ${JSON.stringify(conflictCheck, null, 2)}`);
    
    // Save all championship dates for all sports in this season
    const allChampionshipDates = await mlWorkflow.championshipDateManager.getAllChampionshipDates(season);
    saveTestResults(`all-championship-dates-${season}`, allChampionshipDates);
    
    console.log('=== Schedule Generation with Championship Constraints Test Complete ===');
    logTestActivity('test_complete', 'success');
    
    await pool.end();
    console.log('Test completed successfully!');
    
  } catch (error) {
    logTestActivity('test_error', 'failed', { error: error.message });
    console.error('Error in test:', error);
    console.log(`Test failed: ${error.message}`);
    
    if (pool) {
      await pool.end();
    }
  }
}

// Run the test
runTest();
