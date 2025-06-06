/**
 * COMPASS Training API Routes - DISABLED (Future Enhancement Q1 2026)
 * 
 * These routes provide access to the COMPASS model training functionality
 * Currently disabled as COMPASS ratings are planned for future implementation
 */

const express = require('express');
const router = express.Router();
const logger = require('../scripts/logger');
const OvernightTrainingJob = require('../compass/jobs/overnight_training_job');
const PredictiveModelTrainer = require('../compass/models/predictive_model_trainer');
const fs = require('fs');
const path = require('path');

// Directory for model files
const modelsDir = path.join(__dirname, '../data/compass/models');
const historyDir = path.join(__dirname, '../data/compass/training_history');

// Create directories if they don't exist
for (const dir of [modelsDir, historyDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Global job instance
let trainingJob = null;

/**
 * @api {get} /api/compass/training/status Get training status
 * @apiName GetTrainingStatus
 * @apiGroup COMPASS
 * @apiDescription Get the status of the overnight training job
 */
router.get('/status', (req, res) => {
  try {
    // Return status if job exists
    if (trainingJob) {
      return res.json({
        success: true,
        registered: true,
        status: trainingJob.getStatus()
      });
    }
    
    // No job exists
    res.json({
      success: true,
      registered: false,
      status: null
    });
  } catch (error) {
    logger.error(`Error getting training status: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @api {post} /api/compass/training/register Register training job
 * @apiName RegisterTrainingJob
 * @apiGroup COMPASS
 * @apiDescription Register the overnight training job
 * @apiBody {String} [scheduledTime] Time to run job (HH:MM)
 * @apiBody {String} [timeZone] Time zone for scheduled time
 * @apiBody {Array} [models] Models to train
 * @apiBody {Number} [epochs] Number of epochs for training
 * @apiBody {Number} [batchSize] Batch size for training
 */
router.post('/register', (req, res) => {
  try {
    // Check if job already exists
    if (trainingJob) {
      // Stop existing job
      trainingJob.stop();
    }
    
    // Configure job options
    const jobOptions = {
      scheduledTime: req.body.scheduledTime || '02:00',
      timeZone: req.body.timeZone || process.env.TIMEZONE || 'America/Chicago',
      models: req.body.models || ['game', 'team', 'player', 'sos'],
      epochs: req.body.epochs || 100,
      batchSize: req.body.batchSize || 64,
      notifyOnCompletion: true,
      notifyOnError: true
    };
    
    // Create and start job
    trainingJob = new OvernightTrainingJob(jobOptions);
    trainingJob.start();
    
    res.json({
      success: true,
      message: 'Training job registered',
      status: trainingJob.getStatus()
    });
  } catch (error) {
    logger.error(`Error registering training job: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @api {post} /api/compass/training/start Start training job
 * @apiName StartTrainingJob
 * @apiGroup COMPASS
 * @apiDescription Start the training job immediately
 */
router.post('/start', async (req, res) => {
  try {
    // Check if job exists
    if (!trainingJob) {
      // Create default job
      trainingJob = new OvernightTrainingJob();
      trainingJob.start();
    }
    
    // Run job now
    trainingJob.runNow()
      .then(result => {
        logger.info('Training job completed successfully');
      })
      .catch(error => {
        logger.error(`Training job failed: ${error.message}`);
      });
    
    res.json({
      success: true,
      message: 'Training job started',
      status: trainingJob.getStatus()
    });
  } catch (error) {
    logger.error(`Error starting training job: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @api {post} /api/compass/training/stop Stop training job
 * @apiName StopTrainingJob
 * @apiGroup COMPASS
 * @apiDescription Stop the training job
 */
router.post('/stop', (req, res) => {
  try {
    // Check if job exists
    if (!trainingJob) {
      return res.status(404).json({
        success: false,
        error: 'No training job registered'
      });
    }
    
    // Stop job
    trainingJob.stop();
    
    res.json({
      success: true,
      message: 'Training job stopped',
      status: trainingJob.getStatus()
    });
  } catch (error) {
    logger.error(`Error stopping training job: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @api {get} /api/compass/training/models Get available models
 * @apiName GetModels
 * @apiGroup COMPASS
 * @apiDescription Get available trained models
 */
router.get('/models', (req, res) => {
  try {
    // Read model directories
    const modelTypes = ['game_prediction', 'team_rating', 'player_impact', 'strength_of_schedule'];
    const models = {};
    
    // Check if directory exists
    if (!fs.existsSync(modelsDir)) {
      return res.json({
        success: true,
        models: {}
      });
    }
    
    // Get model files
    const files = fs.readdirSync(modelsDir);
    
    // Group by model type
    for (const type of modelTypes) {
      models[type] = files
        .filter(file => file.startsWith(type))
        .map(file => {
          const modelPath = path.join(modelsDir, file);
          const stats = fs.statSync(modelPath);
          
          // Check for history file
          const historyFile = path.join(historyDir, `${file}_history.json`);
          let history = null;
          
          if (fs.existsSync(historyFile)) {
            try {
              history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
            } catch (e) {
              logger.warn(`Error reading history file: ${e.message}`);
            }
          }
          
          return {
            id: file,
            created: stats.ctime,
            size: stats.size,
            hasHistory: !!history
          };
        })
        .sort((a, b) => new Date(b.created) - new Date(a.created));
    }
    
    res.json({
      success: true,
      models
    });
  } catch (error) {
    logger.error(`Error getting models: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @api {get} /api/compass/training/history/:modelId Get model training history
 * @apiName GetModelHistory
 * @apiGroup COMPASS
 * @apiDescription Get training history for a specific model
 */
router.get('/history/:modelId', (req, res) => {
  try {
    const { modelId } = req.params;
    
    // Check for history file
    const historyFile = path.join(historyDir, `${modelId}_history.json`);
    
    if (!fs.existsSync(historyFile)) {
      return res.status(404).json({
        success: false,
        error: 'History file not found'
      });
    }
    
    // Read history file
    const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    
    res.json({
      success: true,
      modelId,
      history
    });
  } catch (error) {
    logger.error(`Error getting model history: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @api {post} /api/compass/training/train/:modelType Train specific model
 * @apiName TrainModel
 * @apiGroup COMPASS
 * @apiDescription Train a specific model type
 * @apiBody {Number} [epochs] Number of epochs for training
 * @apiBody {Number} [batchSize] Batch size for training
 */
router.post('/train/:modelType', async (req, res) => {
  try {
    const { modelType } = req.params;
    const { epochs = 50, batchSize = 32 } = req.body;
    
    // Validate model type
    const validTypes = ['game', 'team', 'player', 'sos'];
    
    if (!validTypes.includes(modelType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid model type. Must be one of: ${validTypes.join(', ')}`
      });
    }
    
    // Create trainer
    const trainer = new PredictiveModelTrainer(null, {
      epochs: parseInt(epochs, 10),
      batchSize: parseInt(batchSize, 10)
    });
    
    // Start training in background
    let trainingPromise;
    
    switch (modelType) {
      case 'game':
        trainingPromise = trainer.trainGamePredictionModel();
        break;
        
      case 'team':
        trainingPromise = trainer.trainTeamRatingModel();
        break;
        
      case 'player':
        trainingPromise = trainer.trainPlayerImpactModel();
        break;
        
      case 'sos':
        trainingPromise = trainer.trainStrengthOfScheduleModel();
        break;
    }
    
    // Return immediate response
    res.json({
      success: true,
      message: `Training started for ${modelType} model`,
      params: {
        epochs: parseInt(epochs, 10),
        batchSize: parseInt(batchSize, 10)
      }
    });
    
    // Handle training result in background
    trainingPromise
      .then(result => {
        logger.info(`Training completed for ${modelType} model: ${result.success ? 'success' : 'failed'}`);
      })
      .catch(error => {
        logger.error(`Training error for ${modelType} model: ${error.message}`);
      });
  } catch (error) {
    logger.error(`Error training model: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;