/**
 * OvernightLearningTask.js
 * 
 * Script to run overnight learning tasks for the FlexTime scheduling platform.
 * This is designed to be run as a scheduled job to continuously improve agent knowledge.
 */

require('dotenv').config();
const MLWorkflowManager = require('./MLWorkflowManager');
// For Claude MCP integration
const fs = require('fs');
const path = require('path');

// Set up logging directory
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
const activityLogFile = path.join(logDir, `activity-${new Date().toISOString().split('T')[0]}.log`);

// Configure database and intelligence engine connections
const dbConfig = {
  database: {
    connectionString: process.env.NEON_DB_CONNECTION_STRING || process.env.NEON_CONNECTION_STRING
  },
  // Claude MCP configuration
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || '',
    baseUrl: process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1'
  },
  // OpenAI configuration for multi-model approach
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1'
  },
  // Intelligence Engine (Supabase MCP) configuration
  intelligenceEngine: {
    baseUrl: process.env.INTELLIGENCE_ENGINE_URL || 'http://localhost:4001',
    apiKey: process.env.INTELLIGENCE_ENGINE_API_KEY
  },
  // Memory configuration
  memory: {
    useNeonDB: true,
    enableRedis: false
  }
};

// Function to log activity to file instead of Supabase
function logActivity(activity, status, details = {}) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      activity_type: 'overnight_learning',
      activity: activity,
      status: status,
      details: details,
      created_at: timestamp
    };
    
    // Log to console
    console.log(`[${timestamp}] ${activity} - ${status}`);
    
    // Log to file
    fs.appendFileSync(
      activityLogFile, 
      `${JSON.stringify(logEntry)}\n`, 
      'utf8'
    );
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

// Main execution function
async function runOvernightLearning() {
  console.log('=== Starting Overnight Learning Process ===');
  console.log('Time:', new Date().toISOString());
  
  try {
    // Log the start of the learning process
    await logActivity('start', 'in_progress', { timestamp: new Date().toISOString() });
    
    // Initialize the ML workflow manager
    const mlWorkflow = new MLWorkflowManager(dbConfig);
    await mlWorkflow.initialize();
    
    // Start the learning process
    console.log('Starting overnight learning workflow');
    const result = await mlWorkflow.startOvernightLearning();
    
    // Log completion
    if (result.success) {
      await logActivity('complete', 'success', { 
        stats: result.stats,
        duration_minutes: Math.round((Date.now() - new Date().getTime()) / 60000)
      });
      console.log('=== Overnight Learning Completed Successfully ===');
      console.log('Stats:', result.stats);
    } else {
      await logActivity('error', 'failed', { 
        error: result.error,
        phase: mlWorkflow.currentPhase
      });
      console.error('=== Overnight Learning Failed ===');
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Unexpected error in overnight learning process:', error);
    await logActivity('error', 'failed', { 
      error: error.message,
      stack: error.stack
    });
  }
}

// Run the process
runOvernightLearning()
  .then(() => {
    console.log('Overnight learning process execution complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error in overnight learning process:', err);
    process.exit(1);
  });
