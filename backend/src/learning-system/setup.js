/**
 * ML Workflow Setup Script
 * 
 * Initializes the ML database tables and prepares the learning system
 * for the FlexTime scheduling platform.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
// Initialize database connection
const dbConfig = {
  connectionString: process.env.NEON_CONNECTION_STRING
  // Don't set SSL manually as it's already in the connection string
};

// Set up logging directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}
const setupLogFile = path.join(logsDir, `setup-${new Date().toISOString().split('T')[0]}.log`);

// Log setup activity to file instead of Supabase
function logSetup(step, status, details = {}) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      activity_type: 'ml_setup',
      activity: step,
      status: status,
      details: details,
      created_at: timestamp
    };
    
    // Log to console
    console.log(`[${timestamp}] ${step} - ${status}`);
    
    // Log to file
    fs.appendFileSync(
      setupLogFile, 
      `${JSON.stringify(logEntry)}\n`, 
      'utf8'
    );
  } catch (err) {
    console.error('Failed to log setup:', err);
  }
}

// Main setup function
async function setupMlWorkflow() {
  console.log('=== Setting up ML Workflow System ===');
  const pool = new Pool(dbConfig);
  
  try {
    // Apply database migrations
    console.log('Applying database migrations...');
    const migrationsSql = fs.readFileSync(
      path.join(__dirname, 'migrations.sql'), 
      'utf8'
    );
    
    await pool.query(migrationsSql);
    console.log('Migrations applied successfully');
    await logSetup('migrations', 'success');
    
    // Create initial patterns for each sport
    console.log('Creating initial patterns...');
    await createInitialPatterns(pool);
    console.log('Initial patterns created');
    await logSetup('initial_patterns', 'success');
    
    // Register all sports for ML learning
    console.log('Registering sports for ML learning...');
    await registerSportsForLearning(pool);
    console.log('Sports registered successfully');
    await logSetup('register_sports', 'success');
    
    console.log('=== ML Workflow Setup Complete ===');
  } catch (error) {
    console.error('Error setting up ML workflow:', error);
    await logSetup('setup', 'failed', { error: error.message });
  } finally {
    await pool.end();
  }
}

// Create initial pattern templates for each sport
async function createInitialPatterns(pool) {
  // Get a list of all sport types from your frameworks
  const sportTypes = [
    'football', 'mens_basketball', 'womens_basketball', 
    'soccer', 'volleyball', 'baseball', 'softball',
    'wrestling', 'gymnastics', 'mens_tennis', 'womens_tennis',
    'womens_lacrosse'
  ];
  
  for (const sport of sportTypes) {
    try {
      // Check if patterns already exist for this sport
      const existingResult = await pool.query(
        'SELECT COUNT(*) FROM learned_patterns WHERE sport_type = $1',
        [sport]
      );
      
      if (parseInt(existingResult.rows[0].count, 10) > 0) {
        console.log(`Patterns already exist for ${sport}, skipping...`);
        continue;
      }
      
      // Create a sample rest period pattern
      await pool.query(
        `INSERT INTO learned_patterns(
          sport_type, pattern_type, pattern_data, confidence
        ) VALUES($1, $2, $3, $4)`,
        [
          sport,
          'optimal_rest_period',
          {
            avg_rest_days: getDefaultRestPeriod(sport),
            sport_type: sport,
            description: `Default optimal rest period for ${sport}`
          },
          0.6 // Initial confidence is moderate
        ]
      );
      
      // Create a sample venue utilization pattern
      await pool.query(
        `INSERT INTO learned_patterns(
          sport_type, pattern_type, pattern_data, confidence
        ) VALUES($1, $2, $3, $4)`,
        [
          sport,
          'venue_utilization',
          {
            preferred_day: getPreferredGameDay(sport),
            venue_pattern: 'balanced',
            sport_type: sport,
            description: `Default venue utilization pattern for ${sport}`
          },
          0.5 // Initial confidence is moderate
        ]
      );
      
      console.log(`Created initial patterns for ${sport}`);
    } catch (error) {
      console.error(`Error creating patterns for ${sport}:`, error);
    }
  }
}

// Register all sports for overnight learning
async function registerSportsForLearning(pool) {
  const sportTypes = [
    'football', 'mens_basketball', 'womens_basketball', 
    'soccer', 'volleyball', 'baseball', 'softball',
    'wrestling', 'gymnastics', 'mens_tennis', 'womens_tennis',
    'womens_lacrosse'
  ];
  
  for (const sport of sportTypes) {
    try {
      // Add entry in learning_history to track initial setup
      await pool.query(
        `INSERT INTO learning_history(
          sport_type, agent_id, learning_phase, parameters, status
        ) VALUES($1, $2, $3, $4, $5)`,
        [
          sport,
          `${sport}:Agent`,
          'initialization',
          { initialized: true, date: new Date().toISOString() },
          'ready'
        ]
      );
      
      console.log(`Registered ${sport} for learning`);
    } catch (error) {
      console.error(`Error registering ${sport} for learning:`, error);
    }
  }
}

// Helper function to get default rest periods by sport
function getDefaultRestPeriod(sport) {
  const restPeriods = {
    'football': 6, // Days between games
    'mens_basketball': 3,
    'womens_basketball': 3,
    'soccer': 2,
    'volleyball': 2,
    'baseball': 1,
    'softball': 1,
    'wrestling': 4,
    'gymnastics': 5,
    'mens_tennis': 2,
    'womens_tennis': 2,
    'womens_lacrosse': 3
  };
  
  return restPeriods[sport] || 3; // Default to 3 days if sport not listed
}

// Helper function to get preferred game days by sport
function getPreferredGameDay(sport) {
  const preferredDays = {
    'football': 'Saturday',
    'mens_basketball': 'Saturday',
    'womens_basketball': 'Sunday',
    'soccer': 'Friday',
    'volleyball': 'Saturday',
    'baseball': 'Saturday',
    'softball': 'Saturday',
    'wrestling': 'Saturday',
    'gymnastics': 'Saturday',
    'mens_tennis': 'Saturday',
    'womens_tennis': 'Saturday',
    'womens_lacrosse': 'Saturday'
  };
  
  return preferredDays[sport] || 'Saturday'; // Default to Saturday if not listed
}

// Run the setup
setupMlWorkflow()
  .then(() => {
    console.log('ML Workflow setup completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error in ML Workflow setup:', err);
    process.exit(1);
  });
