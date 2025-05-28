/**
 * ML Workflow Cron Scheduler
 * 
 * Sets up a cron job to run the overnight learning process automatically.
 * This should be run once during system initialization.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { CronJob } = require('cron');
const { exec } = require('child_process');
// Use file system for logging - no Supabase dependency
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}
const activityLogFile = path.join(logsDir, `cron-activity-${new Date().toISOString().split('T')[0]}.log`);

// Log cron activity to file instead of Supabase
function logCronActivity(activity, status, details = {}) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      activity_type: 'ml_cron',
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
    console.error('Failed to log cron activity:', err);
  }
}

// Execute overnight learning process
function runOvernightLearning() {
  console.log('Starting overnight learning process...');
  logCronActivity('start', 'in_progress');
  
  const scriptPath = path.join(__dirname, 'OvernightLearningTask.js');
  
  exec(`node ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing overnight learning: ${error.message}`);
      logCronActivity('failed', 'error', { 
        error: error.message,
        stderr
      });
      return;
    }
    
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    
    console.log(`stdout: ${stdout}`);
    logCronActivity('complete', 'success', {
      timestamp: new Date().toISOString(),
      output: stdout.substring(0, 500) // Limit output size
    });
  });
}

// Create a log file for the cron output
const logFile = path.join(__dirname, 'cron-ml.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Redirect console output to log file
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function() {
  const args = Array.from(arguments);
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${args.join(' ')}\n`;
  
  logStream.write(logMessage);
  originalConsoleLog.apply(console, arguments);
};

console.error = function() {
  const args = Array.from(arguments);
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ERROR: ${args.join(' ')}\n`;
  
  logStream.write(logMessage);
  originalConsoleError.apply(console, arguments);
};

// Schedule the cron job - run at 2:00 AM every day
const job = new CronJob('0 2 * * *', runOvernightLearning, null, false, 'America/Chicago');

// Start the cron job
job.start();
console.log('Cron job scheduled to run overnight learning at 2:00 AM Central Time');
logCronActivity('scheduled', 'active', {
  schedule: '0 2 * * *',
  timezone: 'America/Chicago'
});

// Add a manual trigger for testing
if (process.argv.includes('--run-now')) {
  console.log('Manual trigger detected, running learning process now...');
  runOvernightLearning();
}
