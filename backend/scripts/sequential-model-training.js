/**
 * Sequential Model Training
 * 
 * This script runs all COMPASS models in sequence with adaptive early stopping
 * based on convergence metrics.
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { program } = require('commander');
const PredictiveModelTrainer = require('../compass/models/predictive_model_trainer');
const logger = require('../utils/logger');

// Parse command line arguments
program
  .option('-s, --start-model <model>', 'Start with this model (team, game, player, sos)', 'team')
  .option('-t, --time-limit <hours>', 'Time limit in hours', '7')
  .option('-a, --accuracy-threshold <threshold>', 'Early stopping accuracy threshold', '0.85')
  .option('-p, --patience <epochs>', 'Early stopping patience (epochs without improvement)', '10')
  .option('-v, --verbose', 'Enable verbose logging')
  .parse(process.argv);

const options = program.opts();

// Set up output directory
const outputDir = path.join(__dirname, '../results/sequential-training');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Configure log level
if (options.verbose) {
  logger.level = 'debug';
}

// Model training order and parameters
const modelSequence = [
  {
    name: 'team',
    fullName: 'Team Rating',
    method: 'trainTeamRatingModel',
    maxEpochs: 150,
    minEpochs: 50,
    batchSize: 64,
    earlyStopMetric: 'loss',
    earlyStopGoal: 'min',
    earlyStopPatience: parseInt(options.patience, 10),
    earlyStopThreshold: 0.001,
    maxRuntime: 2 * 60 * 60 * 1000 // 2 hours max
  },
  {
    name: 'game',
    fullName: 'Game Prediction',
    method: 'trainGamePredictionModel',
    maxEpochs: 200,
    minEpochs: 75,
    batchSize: 64,
    earlyStopMetric: 'accuracy',
    earlyStopGoal: 'max',
    earlyStopPatience: parseInt(options.patience, 10),
    earlyStopThreshold: parseFloat(options.accuracyThreshold),
    maxRuntime: 2.5 * 60 * 60 * 1000 // 2.5 hours max
  },
  {
    name: 'sos',
    fullName: 'Strength of Schedule',
    method: 'trainStrengthOfScheduleModel',
    maxEpochs: 100,
    minEpochs: 30,
    batchSize: 64,
    earlyStopMetric: 'loss',
    earlyStopGoal: 'min',
    earlyStopPatience: parseInt(options.patience, 10),
    earlyStopThreshold: 0.002,
    maxRuntime: 1 * 60 * 60 * 1000 // 1 hour max
  },
  {
    name: 'player',
    fullName: 'Player Impact',
    method: 'trainPlayerImpactModel',
    maxEpochs: 100,
    minEpochs: 30,
    batchSize: 64,
    earlyStopMetric: 'loss',
    earlyStopGoal: 'min',
    earlyStopPatience: parseInt(options.patience, 10),
    earlyStopThreshold: 0.002,
    maxRuntime: 1.5 * 60 * 60 * 1000 // 1.5 hours max
  }
];

// Reorder the sequence to start with the specified model
const startModelIndex = modelSequence.findIndex(model => model.name === options.startModel);
if (startModelIndex > 0) {
  const reorderedSequence = [
    ...modelSequence.slice(startModelIndex),
    ...modelSequence.slice(0, startModelIndex)
  ];
  modelSequence.splice(0, modelSequence.length, ...reorderedSequence);
}

// Set overall time limit
const timeLimit = parseInt(options.timeLimit, 10) * 60 * 60 * 1000; // Convert hours to ms
const trainEndTime = Date.now() + timeLimit;

/**
 * Add early stopping to the trainer
 * @param {PredictiveModelTrainer} trainer - The trainer instance
 * @param {Object} modelConfig - The model configuration
 */
function addEarlyStopping(trainer, modelConfig) {
  // Create a proxy around the trainer's train method
  const originalMethod = trainer[modelConfig.method];
  
  trainer[modelConfig.method] = async function() {
    // Override the configuration for this run
    const originalOptions = { ...this.options };
    
    this.options = {
      ...this.options,
      epochs: modelConfig.maxEpochs,
      batchSize: modelConfig.batchSize,
      
      // Add callbacks for early stopping
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          // Track best metric value
          const metricValue = logs[modelConfig.earlyStopMetric];
          const bestValueSoFar = this._bestMetricValue;
          
          // For first epoch, initialize best value
          if (epoch === 0 || bestValueSoFar === undefined) {
            this._bestMetricValue = metricValue;
            this._bestEpoch = epoch;
            this._earlyStopCounter = 0;
            return;
          }
          
          // Check if current value is better
          let isImproved = false;
          if (modelConfig.earlyStopGoal === 'min') {
            isImproved = metricValue < bestValueSoFar;
          } else {
            isImproved = metricValue > bestValueSoFar;
          }
          
          if (isImproved) {
            this._bestMetricValue = metricValue;
            this._bestEpoch = epoch;
            this._earlyStopCounter = 0;
            
            // Log improvement
            logger.info(`${modelConfig.fullName} model improved: ${modelConfig.earlyStopMetric}=${metricValue.toFixed(4)} at epoch ${epoch}`);
            
            // Check if we've reached threshold for early stopping
            if (modelConfig.earlyStopGoal === 'min' && metricValue <= modelConfig.earlyStopThreshold) {
              logger.info(`${modelConfig.fullName} model reached target threshold of ${modelConfig.earlyStopThreshold}`);
              this._shouldEarlyStop = true;
            } else if (modelConfig.earlyStopGoal === 'max' && metricValue >= modelConfig.earlyStopThreshold) {
              logger.info(`${modelConfig.fullName} model reached target threshold of ${modelConfig.earlyStopThreshold}`);
              this._shouldEarlyStop = true;
            }
          } else {
            this._earlyStopCounter++;
            
            // Log lack of improvement
            if (this._earlyStopCounter % 5 === 0) {
              logger.info(`${modelConfig.fullName} model stalled for ${this._earlyStopCounter} epochs. Best: ${this._bestMetricValue.toFixed(4)} at epoch ${this._bestEpoch}`);
            }
            
            // Check for early stopping
            if (this._earlyStopCounter >= modelConfig.earlyStopPatience && epoch >= modelConfig.minEpochs) {
              logger.info(`${modelConfig.fullName} model triggered early stopping after ${epoch} epochs`);
              this._shouldEarlyStop = true;
            }
          }
          
          // Check runtime limit
          const elapsedTime = Date.now() - this._trainingStartTime;
          if (elapsedTime > modelConfig.maxRuntime) {
            logger.info(`${modelConfig.fullName} model reached max runtime of ${modelConfig.maxRuntime/1000/60} minutes`);
            this._shouldEarlyStop = true;
          }
          
          // Check global time limit
          if (Date.now() > trainEndTime) {
            logger.info(`${modelConfig.fullName} model stopped due to overall time limit`);
            this._shouldEarlyStop = true;
          }
          
          // Original callback behavior
          if (originalOptions.callbacks?.onEpochEnd) {
            originalOptions.callbacks.onEpochEnd(epoch, logs);
          }
          
          // Signal early stopping if needed
          return this._shouldEarlyStop ? false : null;
        }
      }
    };
    
    // Reset early stopping state
    this._bestMetricValue = undefined;
    this._bestEpoch = 0;
    this._earlyStopCounter = 0;
    this._shouldEarlyStop = false;
    this._trainingStartTime = Date.now();
    
    // Call original method
    try {
      const result = await originalMethod.call(this);
      
      // Restore original options
      this.options = originalOptions;
      
      return result;
    } catch (error) {
      // Restore original options
      this.options = originalOptions;
      throw error;
    }
  };
}

/**
 * Run sequential training
 */
async function runSequentialTraining() {
  console.log('=== COMPASS Sequential Model Training ===\n');
  console.log(`Starting with: ${modelSequence[0].fullName} model`);
  console.log(`Time limit: ${options.timeLimit} hours`);
  console.log(`Early stopping patience: ${options.patience} epochs`);
  console.log(`Accuracy threshold: ${options.accuracyThreshold}\n`);
  
  const startTime = Date.now();
  
  try {
    // Create trainer
    const trainer = new PredictiveModelTrainer(null);
    
    // Results object
    const results = {
      startTime: new Date().toISOString(),
      endTime: null,
      models: {},
      totalTrainingTime: 0
    };
    
    // Train each model in sequence
    for (const modelConfig of modelSequence) {
      console.log(`\n=== Training ${modelConfig.fullName} Model ===`);
      console.log(`Max epochs: ${modelConfig.maxEpochs}`);
      console.log(`Batch size: ${modelConfig.batchSize}`);
      console.log(`Early stopping: ${modelConfig.earlyStopMetric} (${modelConfig.earlyStopGoal}) with patience ${modelConfig.earlyStopPatience}`);
      
      // Check if we're out of time
      if (Date.now() > trainEndTime) {
        console.log(`Time limit reached. Skipping ${modelConfig.fullName} model.`);
        results.models[modelConfig.name] = {
          status: 'skipped',
          reason: 'time_limit_reached'
        };
        continue;
      }
      
      // Add early stopping behavior
      addEarlyStopping(trainer, modelConfig);
      
      // Train the model
      const modelStartTime = Date.now();
      
      try {
        const modelResult = await trainer[modelConfig.method]();
        
        const modelTrainingTime = (Date.now() - modelStartTime) / 1000;
        
        if (modelResult.success) {
          console.log(`✓ ${modelConfig.fullName} model training completed successfully in ${modelTrainingTime.toFixed(2)} seconds`);
          console.log(`  - Model ID: ${modelResult.modelId}`);
          console.log(`  - Epochs: ${modelResult.epochs}`);
          console.log(`  - Final loss: ${modelResult.finalLoss.toFixed(4)}`);
          
          if (modelResult.finalAccuracy) {
            console.log(`  - Final accuracy: ${modelResult.finalAccuracy.toFixed(4)}`);
          }
          
          results.models[modelConfig.name] = {
            status: 'success',
            modelId: modelResult.modelId,
            epochs: modelResult.epochs,
            trainingTime: modelTrainingTime,
            finalLoss: modelResult.finalLoss,
            finalAccuracy: modelResult.finalAccuracy
          };
        } else {
          console.error(`✗ ${modelConfig.fullName} model training failed: ${modelResult.error || modelResult.reason}`);
          
          results.models[modelConfig.name] = {
            status: 'failed',
            reason: modelResult.error || modelResult.reason
          };
        }
      } catch (error) {
        console.error(`Error training ${modelConfig.fullName} model: ${error.message}`);
        
        results.models[modelConfig.name] = {
          status: 'error',
          error: error.message
        };
      }
    }
    
    // Calculate total training time
    results.totalTrainingTime = (Date.now() - startTime) / 1000;
    results.endTime = new Date().toISOString();
    
    // Save results
    const resultsFile = path.join(outputDir, `sequential-training-${new Date().toISOString().replace(/:/g, '-')}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    
    console.log(`\nTraining completed in ${results.totalTrainingTime.toFixed(2)} seconds`);
    console.log(`Results saved to: ${resultsFile}`);
    console.log('\n=== Sequential Training Complete ===');
    
    return results;
  } catch (error) {
    console.error(`Error in sequential training: ${error.message}`);
    throw error;
  }
}

// Run the sequential training
runSequentialTraining().catch(error => {
  console.error('Sequential training failed:', error);
  process.exit(1);
});