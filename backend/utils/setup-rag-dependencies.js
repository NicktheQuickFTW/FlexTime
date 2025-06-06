/**
 * Setup RAG Dependencies
 * 
 * This script installs dependencies required for the RAG agent.
 */

require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../scripts/logger');

// Ensure necessary directories exist
const directories = [
  path.join(__dirname, '../data/school_data'),
  path.join(__dirname, '../tests/data/school_data'),
  path.join(__dirname, '../test-results'),
  path.join(__dirname, '../results'),
  path.join(__dirname, '../temp')
];

// Create directories
for (const dir of directories) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created directory: ${dir}`);
  }
}

// Check for necessary environment variables
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.warn(`Missing environment variables: ${missingEnvVars.join(', ')}`);
  logger.info('Creating .env.example with required variables');
  
  // Create .env.example if it doesn't exist
  const envExamplePath = path.join(__dirname, '../.env.example');
  let envExample = '';
  
  if (fs.existsSync(envExamplePath)) {
    envExample = fs.readFileSync(envExamplePath, 'utf8');
  }
  
  // Add missing variables to .env.example
  for (const envVar of missingEnvVars) {
    if (!envExample.includes(envVar)) {
      envExample += `\n# Required for RAG agent\n${envVar}=your-api-key-here\n`;
    }
  }
  
  fs.writeFileSync(envExamplePath, envExample);
}

// Install dependencies if needed
logger.info('Checking for dependencies...');

const dependencies = [
  'openai@^4.35.0',
  'anthropic@^0.24.0',
  'langchain@^0.1.14',
  'commander@^11.0.0'
];

// Check package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = require(packageJsonPath);

const missingDependencies = dependencies.filter(dep => {
  const [name, version] = dep.split('@');
  return !packageJson.dependencies[name];
});

if (missingDependencies.length > 0) {
  logger.info(`Installing missing dependencies: ${missingDependencies.join(', ')}`);
  
  // Install dependencies
  const installCommand = `npm install ${missingDependencies.join(' ')} --save`;
  
  exec(installCommand, (error, stdout, stderr) => {
    if (error) {
      logger.error(`Error installing dependencies: ${error.message}`);
      return;
    }
    
    if (stderr) {
      logger.warn(`Dependency installation warnings: ${stderr}`);
    }
    
    logger.info('Dependencies installed successfully');
    logger.info(stdout);
  });
} else {
  logger.info('All dependencies already installed');
}

logger.info('RAG agent setup complete!');
logger.info('You can now run the RAG agent with:');
logger.info('- npm run test-school-data-agent     # Test with mock data');
logger.info('- npm run run-school-data-agent      # Run with default schools');
logger.info('- npm run query-school-data "query"  # Run a specific query');