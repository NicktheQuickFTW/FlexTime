/**
 * Overnight Training Job
 * 
 * This job schedules and manages the overnight training of neural network
 * models for the COMPASS system.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../../utils/logger');

class OvernightTrainingJob {
  /**
   * Create a new overnight training job
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      scheduledTime: '02:00', // 2:00 AM
      timeZone: 'America/Chicago', // Central Time
      maxRuntime: 4 * 60 * 60 * 1000, // 4 hours
      endTime: null, // Optional time to stop (e.g., '09:00')
      models: ['game', 'team', 'player', 'sos'],
      epochs: 100,
      batchSize: 64,
      outputDirectory: path.join(__dirname, '../../data/compass/training_results'),
      notifyOnCompletion: true,
      notifyOnError: true,
      ...options
    };
    
    this.isRunning = false;
    this.lastRunTime = null;
    this.nextRunTime = null;
    this.currentProcess = null;
    this.currentTimeout = null;
    this.endTimeTimeout = null;
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.options.outputDirectory)) {
      fs.mkdirSync(this.options.outputDirectory, { recursive: true });
    }
    
    logger.info('Overnight Training Job initialized');
  }
  
  /**
   * Start the job scheduler
   */
  start() {
    logger.info('Starting Overnight Training Job scheduler');
    
    // Calculate next run time
    this.scheduleNextRun();
    
    logger.info(`Next training scheduled for: ${this.nextRunTime.toLocaleString('en-US', { timeZone: this.options.timeZone })}`);
    
    return this;
  }
  
  /**
   * Stop the job scheduler
   */
  stop() {
    logger.info('Stopping Overnight Training Job scheduler');
    
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    
    if (this.isRunning && this.currentProcess) {
      logger.warn('Terminating running training process');
      this.currentProcess.kill();
      this.isRunning = false;
      this.currentProcess = null;
    }
    
    return this;
  }
  
  /**
   * Schedule the next run
   */
  scheduleNextRun() {
    // Clear any existing timeout
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    
    // Calculate next run time
    const now = new Date();
    const [hours, minutes] = this.options.scheduledTime.split(':').map(Number);
    
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    // If scheduled time is in the past, add one day
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    this.nextRunTime = scheduledTime;
    
    // Calculate delay in milliseconds
    const delay = scheduledTime - now;
    
    // Schedule the run
    this.currentTimeout = setTimeout(() => this.run(), delay);
    
    logger.info(`Next run scheduled for ${scheduledTime.toLocaleString()}`);
  }
  
  /**
   * Run the job now
   * @returns {Promise<Object>} Job result
   */
  async runNow() {
    if (this.isRunning) {
      logger.warn('Training job is already running');
      return { success: false, error: 'Job already running' };
    }
    
    return this.run();
  }
  
  /**
   * Run the job
   * @returns {Promise<Object>} Job result
   * @private
   */
  run() {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        logger.warn('Training job is already running');
        reject(new Error('Job already running'));
        return;
      }
      
      logger.info('Starting overnight model training');
      
      this.isRunning = true;
      this.lastRunTime = new Date();
      
      // Build command arguments
      const scriptPath = path.join(__dirname, '../../scripts/run-overnight-training.js');
      
      const args = [
        scriptPath,
        '--models', this.options.models.join(','),
        '--epochs', this.options.epochs.toString(),
        '--batch-size', this.options.batchSize.toString(),
        '--output', this.options.outputDirectory
      ];
      
      // Add verbose flag if needed
      if (logger.level === 'debug') {
        args.push('--verbose');
      }
      
      // Spawn process
      this.currentProcess = spawn('node', args, {
        stdio: 'pipe',
        detached: false
      });
      
      let stdout = '';
      let stderr = '';
      
      // Collect output
      this.currentProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        logger.debug(`Training output: ${output.trim()}`);
      });
      
      this.currentProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        logger.error(`Training error: ${output.trim()}`);
      });
      
      // Set timeout for maximum runtime
      const runtimeTimeout = setTimeout(() => {
        if (this.isRunning && this.currentProcess) {
          logger.error('Training job exceeded maximum runtime, terminating');
          this.currentProcess.kill();
          
          this.isRunning = false;
          this.currentProcess = null;
          
          // Schedule next run
          this.scheduleNextRun();
          
          reject(new Error('Job exceeded maximum runtime'));
        }
      }, this.options.maxRuntime);
      
      // Handle completion
      this.currentProcess.on('close', (code) => {
        clearTimeout(runtimeTimeout);
        
        this.isRunning = false;
        this.currentProcess = null;
        
        // Log completion
        if (code === 0) {
          logger.info('Overnight training completed successfully');
          
          if (this.options.notifyOnCompletion) {
            this._sendNotification('Training completed successfully');
          }
          
          // Schedule next run
          this.scheduleNextRun();
          
          resolve({
            success: true,
            startTime: this.lastRunTime,
            endTime: new Date(),
            stdout,
            stderr
          });
        } else {
          logger.error(`Overnight training failed with code ${code}`);
          
          if (this.options.notifyOnError) {
            this._sendNotification(`Training failed with code ${code}`);
          }
          
          // Schedule next run
          this.scheduleNextRun();
          
          reject(new Error(`Job failed with code ${code}`));
        }
      });
      
      // Handle errors
      this.currentProcess.on('error', (error) => {
        clearTimeout(runtimeTimeout);
        
        this.isRunning = false;
        this.currentProcess = null;
        
        logger.error(`Overnight training error: ${error.message}`);
        
        if (this.options.notifyOnError) {
          this._sendNotification(`Training error: ${error.message}`);
        }
        
        // Schedule next run
        this.scheduleNextRun();
        
        reject(error);
      });
    });
  }
  
  /**
   * Get the job status
   * @returns {Object} Job status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      nextRunTime: this.nextRunTime,
      scheduledTime: this.options.scheduledTime,
      timeZone: this.options.timeZone,
      models: this.options.models,
      epochs: this.options.epochs,
      batchSize: this.options.batchSize
    };
  }
  
  /**
   * Send a notification
   * @param {string} message - Notification message
   * @private
   */
  _sendNotification(message) {
    // In a real implementation, this would send an email, Slack message, etc.
    logger.info(`Notification: ${message}`);
  }
}

module.exports = OvernightTrainingJob;