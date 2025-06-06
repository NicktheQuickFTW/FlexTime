/**
 * Setup Agent Dependencies
 * 
 * This script installs all the necessary dependencies for the Big 12 agents.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../scripts/logger');

// Dependencies to install
const dependencies = [
  'cheerio',          // For web scraping
  'axios',            // For HTTP requests
  'node-cron',        // For scheduling
  '@anthropic-ai/sdk' // For Claude API
];

// Check if .env file has the necessary API keys
function checkEnvironmentVariables() {
  const envPath = path.join(__dirname, '../.env');
  
  if (!fs.existsSync(envPath)) {
    logger.error('.env file not found. Please create one in the FlexTime directory.');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check for Anthropic API key
  if (!envContent.includes('ANTHROPIC_API_KEY=')) {
    logger.error('ANTHROPIC_API_KEY not found in .env file. Please add it.');
    logger.info('You can get an API key from https://console.anthropic.com/');
    return false;
  }
  
  return true;
}

// Install dependencies
function installDependencies() {
  try {
    logger.info('Installing dependencies...');
    
    // Install each dependency
    for (const dep of dependencies) {
      logger.info(`Installing ${dep}...`);
      execSync(`npm install ${dep} --save`, { stdio: 'inherit' });
    }
    
    logger.info('All dependencies installed successfully!');
    return true;
  } catch (error) {
    logger.error(`Error installing dependencies: ${error.message}`);
    return false;
  }
}

// Create reports directory
function createReportsDirectory() {
  try {
    const reportsDir = path.join(__dirname, '../reports');
    
    if (!fs.existsSync(reportsDir)) {
      logger.info('Creating reports directory...');
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    logger.info('Reports directory is ready.');
    return true;
  } catch (error) {
    logger.error(`Error creating reports directory: ${error.message}`);
    return false;
  }
}

// Main function
async function setup() {
  logger.info('Setting up Big 12 agents...');
  
  // Check environment variables
  if (!checkEnvironmentVariables()) {
    return false;
  }
  
  // Install dependencies
  if (!installDependencies()) {
    return false;
  }
  
  // Create reports directory
  if (!createReportsDirectory()) {
    return false;
  }
  
  logger.info('Setup completed successfully!');
  logger.info('You can now run the agents with:');
  logger.info('  npm run rag-agent            # Run the RAG agent once');
  logger.info('  npm run validate-data        # Run the validation agent once');
  logger.info('  npm run director-agent       # Run the director agent once');
  logger.info('  npm run director-agent-schedule # Schedule the director agent to run daily');
  
  return true;
}

// Run the setup if executed directly
if (require.main === module) {
  setup()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  setup
};
