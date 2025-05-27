/**
 * Run Overnight Model Training
 * 
 * This script runs the overnight training of neural network models for
 * predictive analytics in the COMPASS system.
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { program } = require('commander');
const PredictiveModelTrainer = require('../compass/models/predictive_model_trainer');
const logger = require('../utils/logger');

// Parse command line arguments
program
  .option('-m, --models <models>', 'Comma-separated list of models to train (all, game, team, player, sos)', 'all')
  .option('-e, --epochs <epochs>', 'Number of epochs to train', '50')
  .option('-b, --batch-size <batchSize>', 'Batch size for training', '32')
  .option('-o, --output <output>', 'Output directory for results')
  .option('-v, --verbose', 'Enable verbose logging')
  .parse(process.argv);

const options = program.opts();

// Convert comma-separated models to array
const modelsToTrain = options.models === 'all' 
  ? ['game', 'team', 'player', 'sos']
  : options.models.split(',');

// Configure trainer options
const trainerOptions = {
  epochs: parseInt(options.epochs, 10),
  batchSize: parseInt(options.batchSize, 10),
  validationSplit: 0.2
};

// Set up output directory
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputDir = options.output || path.join(__dirname, '../results/training');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Configure log level
if (options.verbose) {
  logger.level = 'debug';
}

/**
 * Run the overnight model training
 */
async function runOvernightTraining() {
  console.log('=== COMPASS Overnight Model Training ===\n');
  console.log(`Models to train: ${modelsToTrain.join(', ')}`);
  console.log(`Epochs: ${trainerOptions.epochs}`);
  console.log(`Batch size: ${trainerOptions.batchSize}`);
  console.log(`Output directory: ${outputDir}\n`);
  
  const startTime = Date.now();
  
  try {
    // Create trainer
    // In a real implementation, this would use a database connection
    const trainer = new PredictiveModelTrainer(null, trainerOptions);
    
    // Train models
    const results = {
      timestamp: new Date().toISOString(),
      models: {},
      trainingTime: 0
    };
    
    // Train each model
    for (const model of modelsToTrain) {
      console.log(`\nTraining ${model} model...`);
      
      let modelResult;
      
      switch (model) {
        case 'game':
          modelResult = await trainer.trainGamePredictionModel();
          break;
          
        case 'team':
          modelResult = await trainer.trainTeamRatingModel();
          break;
          
        case 'player':
          modelResult = await trainer.trainPlayerImpactModel();
          break;
          
        case 'sos':
          modelResult = await trainer.trainStrengthOfScheduleModel();
          break;
          
        default:
          console.warn(`Unknown model type: ${model}`);
          continue;
      }
      
      results.models[model] = modelResult;
      
      if (modelResult.success) {
        console.log(`✓ ${model} model training completed successfully`);
        console.log(`  - Model ID: ${modelResult.modelId}`);
        console.log(`  - Epochs: ${modelResult.epochs}`);
        console.log(`  - Final loss: ${modelResult.finalLoss.toFixed(4)}`);
        if (modelResult.finalAccuracy) {
          console.log(`  - Final accuracy: ${modelResult.finalAccuracy.toFixed(4)}`);
        }
      } else {
        console.error(`✗ ${model} model training failed: ${modelResult.error || modelResult.reason}`);
      }
    }
    
    // Calculate total training time
    results.trainingTime = (Date.now() - startTime) / 1000;
    
    // Save results
    const resultsFile = path.join(outputDir, `training-results-${timestamp}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    
    console.log(`\nTraining completed in ${results.trainingTime.toFixed(2)} seconds`);
    console.log(`Results saved to: ${resultsFile}`);
    console.log('\n=== Training Complete ===');
    
    return results;
  } catch (error) {
    console.error(`Error in overnight training: ${error.message}`);
    process.exit(1);
  }
}

// Run the training
runOvernightTraining().catch(error => {
  console.error('Overnight training failed:', error);
  process.exit(1);
});