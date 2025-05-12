/**
 * Register Overnight Training Job
 * 
 * This script registers and optionally runs the overnight training job
 * for model training in the COMPASS system.
 */

require('dotenv').config();
const { program } = require('commander');
const logger = require('../utils/logger');
const OvernightTrainingJob = require('../compass/jobs/overnight_training_job');

// Parse command line arguments
program
  .option('-r, --run', 'Run the job immediately after registration')
  .option('-m, --models <models>', 'Comma-separated list of models to train (all, game, team, player, sos)', 'all')
  .option('-e, --epochs <epochs>', 'Number of epochs to train for test run', '5')
  .option('-b, --batch-size <batchSize>', 'Batch size for test run', '32')
  .option('-t, --time <time>', 'Scheduled time for job (HH:MM)', '02:00')
  .option('-v, --verbose', 'Enable verbose logging')
  .parse(process.argv);

const options = program.opts();

// Configure log level
if (options.verbose) {
  logger.level = 'debug';
}

// Convert "all" to array of models
const models = options.models === 'all' 
  ? ['game', 'team', 'player', 'sos']
  : options.models.split(',');

// Configure job options
const jobOptions = {
  scheduledTime: options.time,
  timeZone: process.env.TIMEZONE || 'America/Chicago',
  models,
  epochs: parseInt(options.epochs, 10),
  batchSize: parseInt(options.batchSize, 10),
  // Set runtime to finish by 9am
  maxRuntime: 7 * 60 * 60 * 1000, // 7 hours (allowing for job to start at 2 AM and end by 9 AM)
  endTime: '09:00', // Stop job by 9 AM regardless of completion status
  notifyOnCompletion: true,
  notifyOnError: true
};

// Job registration function
async function registerJob() {
  console.log('=== Registering Overnight Training Job ===\n');
  
  console.log(`Scheduled time: ${jobOptions.scheduledTime} (${jobOptions.timeZone})`);
  console.log(`Models: ${jobOptions.models.join(', ')}`);
  console.log(`Epochs: ${jobOptions.epochs}`);
  console.log(`Batch size: ${jobOptions.batchSize}`);
  console.log(`Max runtime: ${jobOptions.maxRuntime / 1000 / 60} minutes`);
  
  // Create and register job
  const job = new OvernightTrainingJob(jobOptions);
  
  // Start job scheduler
  job.start();
  
  // Store job in global registry for access in other parts of the application
  // In a real implementation, this would be stored in a persistent way
  global.overnightTrainingJob = job;
  
  console.log(`\nJob registered and scheduled for ${job.nextRunTime.toLocaleString()}`);
  
  // Run job immediately if requested
  if (options.run) {
    console.log('\nRunning job now...\n');
    
    try {
      await job.runNow();
      console.log('\nJob completed successfully');
    } catch (error) {
      console.error(`\nJob failed: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log('\nJob will run at the scheduled time');
    console.log('To run the job manually, use: node scripts/run-overnight-training.js');
  }
  
  return job;
}

// Register job
if (require.main === module) {
  // Running as script, register job
  registerJob()
    .then(job => {
      // Keep the process running if not running the job immediately
      if (!options.run) {
        console.log('\nPress Ctrl+C to exit');
      } else {
        process.exit(0);
      }
    })
    .catch(error => {
      console.error(`Error registering job: ${error.message}`);
      process.exit(1);
    });
} else {
  // Exported as module
  module.exports = registerJob;
}