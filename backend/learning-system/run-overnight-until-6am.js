/**
 * Overnight Learning Run Until 6am CT
 * 
 * Runs the ML workflow system repeatedly throughout the night
 * until 6am Central Time, allowing agents to continuously practice
 * and improve their scheduling knowledge.
 */

require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create a log directory if it doesn't exist
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Set up logging
const logFile = path.join(logDir, `overnight-run-${new Date().toISOString().split('T')[0]}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Log function with timestamps
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // Write to log file and console
  logStream.write(logMessage);
  console.log(message);
}

// Run the learning task once
function runLearningTask() {
  return new Promise((resolve, reject) => {
    const taskScript = path.join(__dirname, 'OvernightLearningTask.js');
    
    log('Starting learning task run...');
    
    exec(`node ${taskScript}`, (error, stdout, stderr) => {
      if (error) {
        log(`Error executing learning task: ${error.message}`);
        log(stderr);
        reject(error);
        return;
      }
      
      log('Learning task completed successfully');
      log('Output: ' + stdout.substring(0, 500) + (stdout.length > 500 ? '...' : ''));
      
      resolve();
    });
  });
}

// Check if we should continue running based on time
function shouldContinueRunning() {
  const now = new Date();
  
  // Get time in Central Time (CT)
  const options = { timeZone: 'America/Chicago' };
  const ctTime = new Date(now.toLocaleString('en-US', options));
  const ctHour = ctTime.getHours();
  
  // Continue if hour is less than 6 (before 6am)
  return ctHour < 6;
}

// Main function to run learning tasks until 6am
async function runUntil6am() {
  log('=== Starting overnight learning run until 6am CT ===');
  log(`Current time: ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}`);
  
  let runCount = 0;
  
  while (shouldContinueRunning()) {
    runCount++;
    log(`Starting run #${runCount}`);
    
    try {
      // Run the learning task
      await runLearningTask();
      
      // Get current time in CT
      const now = new Date();
      const ctTimeStr = now.toLocaleString('en-US', { timeZone: 'America/Chicago' });
      log(`Completed run #${runCount} at ${ctTimeStr}`);
      
      // Check if we should continue
      if (!shouldContinueRunning()) {
        log('Reached 6am CT, ending overnight run');
        break;
      }
      
      // Wait 5 minutes between runs to give the system a break
      log('Waiting 5 minutes before next run...');
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    } catch (error) {
      log(`Error in run #${runCount}: ${error.message}`);
      
      // Wait a bit longer (15 minutes) after an error before retrying
      log('Waiting 15 minutes before retrying...');
      await new Promise(resolve => setTimeout(resolve, 15 * 60 * 1000));
    }
  }
  
  log(`=== Overnight learning completed with ${runCount} runs ===`);
}

// Start the overnight run
runUntil6am()
  .then(() => {
    log('Overnight learning script completed');
    process.exit(0);
  })
  .catch(error => {
    log(`Fatal error in overnight learning: ${error.message}`);
    process.exit(1);
  });
