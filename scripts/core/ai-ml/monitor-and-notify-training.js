/**
 * Monitor and Notify Training
 * 
 * This script monitors the sequential training process and sends notifications
 * when models reach sufficient quality, or when training completes.
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const logger = require('/Users/nickw/Documents/GitHub/Flextime/FlexTime/utils/logger.js');

// Configuration
const config = {
  notifyEmail: process.env.TRAINING_NOTIFICATION_EMAIL,
  notifyThresholds: {
    team: 0.85,   // Loss below 0.15
    game: 0.85,   // Accuracy above 0.85
    player: 0.88, // Loss below 0.12
    sos: 0.90     // Loss below 0.10
  },
  resultsDirectory: path.join(__dirname, '../results/sequential-training'),
  checkInterval: 5 * 60 * 1000 // Check every 5 minutes
};

// Create directories if they don't exist
if (!fs.existsSync(config.resultsDirectory)) {
  fs.mkdirSync(config.resultsDirectory, { recursive: true });
}

/**
 * Start the training process
 * @returns {Promise<Object>} Child process
 */
function startTraining() {
  return new Promise((resolve, reject) => {
    logger.info('Starting sequential model training...');
    
    // Build command line arguments
    const args = [
      path.join(__dirname, 'sequential-model-training.js'),
      '--start-model', 'team',
      '--time-limit', '7',
      '--accuracy-threshold', '0.85',
      '--patience', '15',
      '--verbose'
    ];
    
    // Spawn the process
    const child = spawn('node', args, {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    // Track process completion
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output);
    });
    
    child.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(output);
    });
    
    // Handle process exit
    child.on('close', (code) => {
      if (code === 0) {
        logger.info('Training process completed successfully');
        resolve({ child, code, stdout, stderr });
      } else {
        logger.error(`Training process exited with code ${code}`);
        reject(new Error(`Process exited with code ${code}`));
      }
    });
    
    // Handle process error
    child.on('error', (error) => {
      logger.error(`Failed to start training process: ${error.message}`);
      reject(error);
    });
    
    resolve({ child, stdout, stderr });
  });
}

/**
 * Check training results
 * @returns {Promise<Object>} Results
 */
async function checkTrainingResults() {
  try {
    // Get all result files
    const files = fs.readdirSync(config.resultsDirectory);
    
    // Sort by modification time (newest first)
    const sortedFiles = files
      .filter(file => file.startsWith('sequential-training-'))
      .map(file => ({
        path: path.join(config.resultsDirectory, file),
        stat: fs.statSync(path.join(config.resultsDirectory, file))
      }))
      .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());
    
    if (sortedFiles.length === 0) {
      return null;
    }
    
    // Read latest results
    const latestFile = sortedFiles[0];
    const results = JSON.parse(fs.readFileSync(latestFile.path, 'utf8'));
    
    return {
      file: latestFile.path,
      lastModified: latestFile.stat.mtime,
      results
    };
  } catch (error) {
    logger.error(`Error checking training results: ${error.message}`);
    return null;
  }
}

/**
 * Check if models are ready
 * @param {Object} results - Training results
 * @returns {Object} Ready status
 */
function checkModelsReady(results) {
  if (!results || !results.results || !results.results.models) {
    return {
      ready: false,
      models: {}
    };
  }
  
  const modelsReady = {};
  let allComplete = true;
  
  // Check each model
  for (const [modelName, threshold] of Object.entries(config.notifyThresholds)) {
    const modelResult = results.results.models[modelName];
    
    if (!modelResult) {
      modelsReady[modelName] = false;
      allComplete = false;
      continue;
    }
    
    // Check if model is ready
    if (modelResult.status === 'success') {
      if (modelName === 'game' && modelResult.finalAccuracy) {
        // For game model, check accuracy
        modelsReady[modelName] = modelResult.finalAccuracy >= threshold;
      } else if (modelResult.finalLoss) {
        // For other models, check loss
        modelsReady[modelName] = modelResult.finalLoss <= (1 - threshold);
      } else {
        modelsReady[modelName] = false;
      }
    } else {
      modelsReady[modelName] = false;
      
      // If model failed or errored, we consider it complete but not ready
      if (modelResult.status === 'failed' || modelResult.status === 'error') {
        // Don't set allComplete to false for failed/error models
      } else {
        allComplete = false;
      }
    }
  }
  
  return {
    ready: Object.values(modelsReady).every(ready => ready),
    allComplete,
    models: modelsReady
  };
}

/**
 * Send notification
 * @param {string} subject - Notification subject
 * @param {string} message - Notification message
 */
function sendNotification(subject, message) {
  // In a real implementation, this would send an email, Slack message, etc.
  logger.info(`NOTIFICATION: ${subject}`);
  logger.info(message);
  
  // Write to notification log
  const notificationFile = path.join(config.resultsDirectory, 'notifications.log');
  
  const notificationEntry = `
[${new Date().toISOString()}] ${subject}
${message}
-----------------------------------------
`;
  
  fs.appendFileSync(notificationFile, notificationEntry);
}

/**
 * Format model results for notification
 * @param {Object} results - Training results
 * @returns {string} Formatted message
 */
function formatModelResults(results) {
  if (!results || !results.results || !results.results.models) {
    return 'No results available';
  }
  
  let message = `Training started: ${results.results.startTime}\n`;
  
  if (results.results.endTime) {
    message += `Training completed: ${results.results.endTime}\n`;
  }
  
  message += `Total training time: ${(results.results.totalTrainingTime / 60).toFixed(2)} minutes\n\n`;
  
  // Format individual model results
  for (const [modelName, modelResult] of Object.entries(results.results.models)) {
    const modelNameFormatted = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    
    message += `${modelNameFormatted} Model: `;
    
    if (modelResult.status === 'success') {
      message += `SUCCESS\n`;
      message += `  Training time: ${(modelResult.trainingTime / 60).toFixed(2)} minutes\n`;
      message += `  Epochs: ${modelResult.epochs}\n`;
      message += `  Final loss: ${modelResult.finalLoss.toFixed(4)}\n`;
      
      if (modelResult.finalAccuracy) {
        message += `  Final accuracy: ${modelResult.finalAccuracy.toFixed(4)}\n`;
      }
      
      message += `  Model ID: ${modelResult.modelId}\n`;
    } else if (modelResult.status === 'failed') {
      message += `FAILED: ${modelResult.reason}\n`;
    } else if (modelResult.status === 'error') {
      message += `ERROR: ${modelResult.error}\n`;
    } else if (modelResult.status === 'skipped') {
      message += `SKIPPED: ${modelResult.reason}\n`;
    } else {
      message += `UNKNOWN STATUS\n`;
    }
    
    message += '\n';
  }
  
  return message;
}

/**
 * Monitor training process
 * @returns {Promise<void>}
 */
async function monitorTraining() {
  let lastNotifiedReady = {
    team: false,
    game: false,
    player: false,
    sos: false
  };
  
  let allReadyNotified = false;
  let completionNotified = false;
  
  try {
    // Start training
    const { child } = await startTraining();
    
    // Monitor until completion
    const monitorInterval = setInterval(async () => {
      // Check if training is still running
      try {
        process.kill(child.pid, 0);
        // Process is still running
      } catch (e) {
        // Process has exited
        logger.info('Training process has completed');
        
        clearInterval(monitorInterval);
        
        // Check final results
        const finalResults = await checkTrainingResults();
        
        if (finalResults && !completionNotified) {
          const readyStatus = checkModelsReady(finalResults);
          
          // Send completion notification
          sendNotification(
            'COMPASS Training Completed',
            `Training has completed with ${readyStatus.ready ? 'all' : 'some'} models ready.\n\n` +
            formatModelResults(finalResults)
          );
          
          completionNotified = true;
        }
        
        return;
      }
      
      // Check current results
      const results = await checkTrainingResults();
      
      if (!results) {
        logger.debug('No training results available yet');
        return;
      }
      
      // Check if models are ready
      const readyStatus = checkModelsReady(results);
      
      // Send individual model notifications
      for (const [modelName, ready] of Object.entries(readyStatus.models)) {
        if (ready && !lastNotifiedReady[modelName]) {
          const modelNameFormatted = modelName.charAt(0).toUpperCase() + modelName.slice(1);
          const modelResult = results.results.models[modelName];
          
          sendNotification(
            `${modelNameFormatted} Model Ready`,
            `The ${modelNameFormatted} model has achieved sufficient quality and is ready for use.\n\n` +
            `Training time: ${(modelResult.trainingTime / 60).toFixed(2)} minutes\n` +
            `Epochs: ${modelResult.epochs}\n` +
            `Final loss: ${modelResult.finalLoss.toFixed(4)}\n` +
            (modelResult.finalAccuracy ? `Final accuracy: ${modelResult.finalAccuracy.toFixed(4)}\n` : '') +
            `Model ID: ${modelResult.modelId}\n`
          );
          
          lastNotifiedReady[modelName] = true;
        }
      }
      
      // Send all models ready notification
      if (readyStatus.ready && !allReadyNotified) {
        sendNotification(
          'All COMPASS Models Ready',
          `All models have achieved sufficient quality and are ready for use.\n\n` +
          formatModelResults(results)
        );
        
        allReadyNotified = true;
      }
      
      // If all models are complete, stop monitoring
      if (readyStatus.allComplete) {
        logger.info('All models are complete, stopping monitoring');
        
        clearInterval(monitorInterval);
        
        // Send completion notification if not already sent
        if (!completionNotified) {
          sendNotification(
            'COMPASS Training Completed',
            `Training has completed with ${readyStatus.ready ? 'all' : 'some'} models ready.\n\n` +
            formatModelResults(results)
          );
          
          completionNotified = true;
        }
      }
    }, config.checkInterval);
  } catch (error) {
    logger.error(`Error monitoring training: ${error.message}`);
    
    // Send error notification
    sendNotification(
      'COMPASS Training Error',
      `An error occurred during training: ${error.message}\n\n` +
      'Please check the logs for more details.'
    );
  }
}

// Start monitoring
if (require.main === module) {
  monitorTraining()
    .then(() => {
      logger.info('Monitoring started');
    })
    .catch(error => {
      logger.error(`Failed to start monitoring: ${error.message}`);
      process.exit(1);
    });
} else {
  module.exports = {
    startTraining,
    monitorTraining,
    checkTrainingResults,
    checkModelsReady,
    sendNotification
  };
}