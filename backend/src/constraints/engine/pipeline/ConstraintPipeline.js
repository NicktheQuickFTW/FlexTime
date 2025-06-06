/**
 * ConstraintPipeline - Parallel Processing Pipeline for Constraint Evaluation
 * 
 * High-performance parallel processing with:
 * - Worker thread pool management
 * - Intelligent load balancing
 * - Batch processing optimization
 * - Fault tolerance and recovery
 * - Adaptive batch sizing
 */

const { Worker } = require('worker_threads');
const EventEmitter = require('events');
const path = require('path');
const logger = require("../../lib/logger");;

class ConstraintPipeline extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxWorkers: options.maxWorkers || Math.max(2, Math.floor(require('os').cpus().length / 2)),
      batchSize: options.batchSize || 10,
      timeout: options.timeout || 30000,
      enableAdaptiveBatching: options.enableAdaptiveBatching !== false,
      enableLoadBalancing: options.enableLoadBalancing !== false,
      maxRetries: options.maxRetries || 3,
      healthCheckInterval: options.healthCheckInterval || 60000,
      ...options
    };
    
    // Worker management
    this.workers = [];
    this.busyWorkers = new Set();
    this.workerStats = new Map();
    this.taskQueue = [];
    this.activeTasks = new Map();
    
    // Performance tracking
    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      avgProcessingTime: 0,
      throughputPerSecond: 0,
      workerUtilization: 0,
      adaptiveBatchSizes: []
    };
    
    // Adaptive batching
    this.batchMetrics = {
      recent: [],
      optimalSize: this.options.batchSize,
      lastAdjustment: Date.now()
    };
    
    // Health monitoring
    this.healthCheckTimer = null;
    this.isShutdown = false;
    
    // Initialize
    this._initialize();
  }
  
  /**
   * Initialize the pipeline
   */
  async _initialize() {
    try {
      await this._createWorkerPool();
      this._startHealthMonitoring();
      
      logger.info(`ConstraintPipeline initialized with ${this.workers.length} workers`);
      this.emit('initialized');
      
    } catch (error) {
      logger.error('Failed to initialize ConstraintPipeline:', error);
      throw error;
    }
  }
  
  /**
   * Process a batch of constraints
   */
  async processBatch(constraints, schedule, options = {}) {
    if (this.isShutdown) {
      throw new Error('Pipeline is shutdown');
    }
    
    const batchId = options.batchId || `batch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const startTime = Date.now();
    
    try {
      // Optimize batch size if adaptive batching is enabled
      if (this.options.enableAdaptiveBatching) {
        constraints = this._optimizeBatchSize(constraints);
      }
      
      // Create task
      const task = {
        id: batchId,
        constraints,
        schedule,
        options,
        startTime,
        retries: 0
      };
      
      this.stats.totalTasks++;
      
      // Process task
      const result = await this._processTask(task);
      
      // Update statistics
      const processingTime = Date.now() - startTime;
      this._updateStats(processingTime, true);
      
      logger.debug(`Batch ${batchId} completed in ${processingTime}ms with ${constraints.length} constraints`);
      
      this.emit('batchCompleted', {
        batchId,
        constraintCount: constraints.length,
        processingTime,
        result
      });
      
      return result;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this._updateStats(processingTime, false);
      
      logger.error(`Batch ${batchId} failed after ${processingTime}ms:`, error);
      
      this.emit('batchFailed', {
        batchId,
        constraintCount: constraints.length,
        processingTime,
        error
      });
      
      throw error;
    }
  }
  
  /**
   * Process a single task with worker allocation
   */
  async _processTask(task) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.activeTasks.delete(task.id);
        reject(new Error(`Task ${task.id} timed out after ${this.options.timeout}ms`));
      }, this.options.timeout);
      
      // Store task for tracking
      this.activeTasks.set(task.id, {
        ...task,
        resolve,
        reject,
        timeoutId
      });
      
      // Try to assign to available worker
      this._assignTaskToWorker(task);
    });
  }
  
  /**
   * Assign task to an available worker
   */
  _assignTaskToWorker(task) {
    const availableWorker = this._getAvailableWorker();
    
    if (availableWorker) {
      this._executeTaskOnWorker(task, availableWorker);
    } else {
      // Queue task if no workers available
      this.taskQueue.push(task);
      logger.debug(`Task ${task.id} queued - no available workers`);
    }
  }
  
  /**
   * Execute task on a specific worker
   */
  _executeTaskOnWorker(task, worker) {
    this.busyWorkers.add(worker.id);
    
    const workerData = {
      taskId: task.id,
      constraints: task.constraints,
      schedule: task.schedule,
      options: task.options
    };
    
    // Send task to worker
    worker.postMessage({
      type: 'evaluateConstraints',
      data: workerData
    });
    
    // Update worker stats
    const workerStat = this.workerStats.get(worker.id);
    workerStat.activeTasks++;
    workerStat.totalTasks++;
    
    logger.debug(`Task ${task.id} assigned to worker ${worker.id}`);
  }
  
  /**
   * Get available worker using load balancing
   */
  _getAvailableWorker() {
    const availableWorkers = this.workers.filter(worker => 
      !this.busyWorkers.has(worker.id) && worker.ready
    );
    
    if (availableWorkers.length === 0) {
      return null;
    }
    
    if (!this.options.enableLoadBalancing) {
      return availableWorkers[0];
    }
    
    // Select worker with least load
    return availableWorkers.reduce((best, current) => {
      const bestStats = this.workerStats.get(best.id);
      const currentStats = this.workerStats.get(current.id);
      
      // Consider both active tasks and average processing time
      const bestLoad = bestStats.activeTasks + (bestStats.avgProcessingTime / 1000);
      const currentLoad = currentStats.activeTasks + (currentStats.avgProcessingTime / 1000);
      
      return currentLoad < bestLoad ? current : best;
    });
  }
  
  /**
   * Handle worker message
   */
  _handleWorkerMessage(workerId, message) {
    const worker = this.workers.find(w => w.id === workerId);
    if (!worker) return;
    
    switch (message.type) {
      case 'ready':
        worker.ready = true;
        this._processQueuedTasks();
        break;
        
      case 'taskResult':
        this._handleTaskResult(workerId, message.data);
        break;
        
      case 'taskError':
        this._handleTaskError(workerId, message.data);
        break;
        
      case 'progress':
        this._handleTaskProgress(workerId, message.data);
        break;
        
      default:
        logger.warn(`Unknown message type from worker ${workerId}: ${message.type}`);
    }
  }
  
  /**
   * Handle successful task completion
   */
  _handleTaskResult(workerId, data) {
    const { taskId, result, processingTime } = data;
    const task = this.activeTasks.get(taskId);
    
    if (!task) {
      logger.warn(`Received result for unknown task: ${taskId}`);
      return;
    }
    
    // Update worker stats
    const workerStat = this.workerStats.get(workerId);
    workerStat.activeTasks--;
    workerStat.completedTasks++;
    workerStat.avgProcessingTime = (
      (workerStat.avgProcessingTime * (workerStat.completedTasks - 1) + processingTime) / 
      workerStat.completedTasks
    );
    
    // Clean up and resolve
    clearTimeout(task.timeoutId);
    this.activeTasks.delete(taskId);
    this.busyWorkers.delete(workerId);
    
    task.resolve(result);
    
    // Process next queued task
    this._processQueuedTasks();
    
    logger.debug(`Task ${taskId} completed by worker ${workerId} in ${processingTime}ms`);
  }
  
  /**
   * Handle task failure
   */
  _handleTaskError(workerId, data) {
    const { taskId, error } = data;
    const task = this.activeTasks.get(taskId);
    
    if (!task) {
      logger.warn(`Received error for unknown task: ${taskId}`);
      return;
    }
    
    // Update worker stats
    const workerStat = this.workerStats.get(workerId);
    workerStat.activeTasks--;
    workerStat.failedTasks++;
    
    // Clean up
    clearTimeout(task.timeoutId);
    this.activeTasks.delete(taskId);
    this.busyWorkers.delete(workerId);
    
    // Retry logic
    if (task.retries < this.options.maxRetries) {
      task.retries++;
      logger.warn(`Retrying task ${taskId} (attempt ${task.retries}/${this.options.maxRetries})`);
      this._assignTaskToWorker(task);
    } else {
      task.reject(new Error(`Task ${taskId} failed: ${error}`));
    }
    
    // Process next queued task
    this._processQueuedTasks();
  }
  
  /**
   * Handle task progress updates
   */
  _handleTaskProgress(workerId, data) {
    const { taskId, progress } = data;
    
    this.emit('taskProgress', {
      workerId,
      taskId,
      progress
    });
  }
  
  /**
   * Process queued tasks when workers become available
   */
  _processQueuedTasks() {
    while (this.taskQueue.length > 0) {
      const availableWorker = this._getAvailableWorker();
      
      if (!availableWorker) {
        break;
      }
      
      const task = this.taskQueue.shift();
      this._executeTaskOnWorker(task, availableWorker);
    }
  }
  
  /**
   * Optimize batch size based on performance metrics
   */
  _optimizeBatchSize(constraints) {
    const currentTime = Date.now();
    
    // Only adjust batch size every 30 seconds
    if (currentTime - this.batchMetrics.lastAdjustment < 30000) {
      return this._splitIntoBatches(constraints, this.batchMetrics.optimalSize);
    }
    
    // Analyze recent performance
    if (this.batchMetrics.recent.length >= 5) {
      const avgThroughput = this.batchMetrics.recent.reduce((sum, metric) => 
        sum + metric.throughput, 0) / this.batchMetrics.recent.length;
      
      const currentThroughput = this.stats.throughputPerSecond;
      
      // Adjust batch size based on performance
      if (currentThroughput > avgThroughput * 1.1) {
        // Performance is good, try larger batches
        this.batchMetrics.optimalSize = Math.min(
          this.batchMetrics.optimalSize * 1.2,
          this.options.batchSize * 2
        );
      } else if (currentThroughput < avgThroughput * 0.9) {
        // Performance is poor, try smaller batches
        this.batchMetrics.optimalSize = Math.max(
          this.batchMetrics.optimalSize * 0.8,
          Math.ceil(this.options.batchSize / 2)
        );
      }
      
      this.batchMetrics.lastAdjustment = currentTime;
      
      // Keep only recent metrics
      this.batchMetrics.recent = this.batchMetrics.recent.slice(-10);
    }
    
    return this._splitIntoBatches(constraints, Math.round(this.batchMetrics.optimalSize));
  }
  
  /**
   * Split constraints into optimal batch sizes
   */
  _splitIntoBatches(constraints, batchSize) {
    if (constraints.length <= batchSize) {
      return constraints;
    }
    
    // For now, return first batch - in full implementation, 
    // this would create multiple batches and process them
    return constraints.slice(0, batchSize);
  }
  
  /**
   * Create worker pool
   */
  async _createWorkerPool() {
    const workerPath = path.join(__dirname, '../workers/ConstraintWorker.js');
    
    for (let i = 0; i < this.options.maxWorkers; i++) {
      try {
        const worker = new Worker(workerPath);
        worker.id = i;
        worker.ready = false;
        
        // Initialize worker stats
        this.workerStats.set(i, {
          activeTasks: 0,
          totalTasks: 0,
          completedTasks: 0,
          failedTasks: 0,
          avgProcessingTime: 0,
          lastHealthCheck: Date.now()
        });
        
        // Setup event handlers
        worker.on('message', (message) => {
          this._handleWorkerMessage(i, message);
        });
        
        worker.on('error', (error) => {
          logger.error(`Worker ${i} error:`, error);
          this._handleWorkerError(i, error);
        });
        
        worker.on('exit', (code) => {
          if (code !== 0 && !this.isShutdown) {
            logger.warn(`Worker ${i} exited with code ${code}`);
            this._replaceWorker(i);
          }
        });
        
        this.workers.push(worker);
        
      } catch (error) {
        logger.error(`Failed to create worker ${i}:`, error);
      }
    }
    
    // Wait for workers to be ready
    await this._waitForWorkers();
  }
  
  /**
   * Wait for workers to be ready
   */
  async _waitForWorkers() {
    const timeout = 10000; // 10 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const readyWorkers = this.workers.filter(w => w.ready).length;
      
      if (readyWorkers === this.workers.length) {
        logger.info(`All ${this.workers.length} workers are ready`);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const readyWorkers = this.workers.filter(w => w.ready).length;
    logger.warn(`Only ${readyWorkers}/${this.workers.length} workers ready after ${timeout}ms`);
  }
  
  /**
   * Replace a failed worker
   */
  async _replaceWorker(workerId) {
    try {
      const workerIndex = this.workers.findIndex(w => w.id === workerId);
      if (workerIndex === -1) return;
      
      // Remove old worker
      const oldWorker = this.workers[workerIndex];
      await oldWorker.terminate();
      
      // Create new worker
      const workerPath = path.join(__dirname, '../workers/ConstraintWorker.js');
      const newWorker = new Worker(workerPath);
      newWorker.id = workerId;
      newWorker.ready = false;
      
      // Setup event handlers
      newWorker.on('message', (message) => {
        this._handleWorkerMessage(workerId, message);
      });
      
      newWorker.on('error', (error) => {
        logger.error(`Replacement worker ${workerId} error:`, error);
        this._handleWorkerError(workerId, error);
      });
      
      newWorker.on('exit', (code) => {
        if (code !== 0 && !this.isShutdown) {
          logger.warn(`Replacement worker ${workerId} exited with code ${code}`);
          this._replaceWorker(workerId);
        }
      });
      
      // Replace in array
      this.workers[workerIndex] = newWorker;
      
      // Reset stats
      this.workerStats.set(workerId, {
        activeTasks: 0,
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        avgProcessingTime: 0,
        lastHealthCheck: Date.now()
      });
      
      logger.info(`Replaced failed worker ${workerId}`);
      
    } catch (error) {
      logger.error(`Failed to replace worker ${workerId}:`, error);
    }
  }
  
  /**
   * Start health monitoring
   */
  _startHealthMonitoring() {
    if (this.options.healthCheckInterval <= 0) return;
    
    this.healthCheckTimer = setInterval(() => {
      this._performHealthCheck();
    }, this.options.healthCheckInterval);
  }
  
  /**
   * Perform health check on workers
   */
  _performHealthCheck() {
    const currentTime = Date.now();
    
    for (const worker of this.workers) {
      const stats = this.workerStats.get(worker.id);
      
      // Send health check ping
      worker.postMessage({
        type: 'healthCheck',
        data: { timestamp: currentTime }
      });
      
      stats.lastHealthCheck = currentTime;
    }
    
    // Update utilization stats
    this.stats.workerUtilization = this.busyWorkers.size / this.workers.length;
    
    this.emit('healthCheck', {
      activeWorkers: this.workers.filter(w => w.ready).length,
      busyWorkers: this.busyWorkers.size,
      utilization: this.stats.workerUtilization
    });
  }
  
  /**
   * Update pipeline statistics
   */
  _updateStats(processingTime, success) {
    if (success) {
      this.stats.completedTasks++;
    } else {
      this.stats.failedTasks++;
    }
    
    // Update average processing time
    const totalCompleted = this.stats.completedTasks;
    if (totalCompleted > 0) {
      this.stats.avgProcessingTime = (
        (this.stats.avgProcessingTime * (totalCompleted - 1) + processingTime) / totalCompleted
      );
    }
    
    // Calculate throughput (tasks per second)
    const completedInLastMinute = this.batchMetrics.recent.length;
    this.stats.throughputPerSecond = completedInLastMinute / 60;
    
    // Store recent metrics for adaptive batching
    this.batchMetrics.recent.push({
      timestamp: Date.now(),
      processingTime,
      success,
      throughput: 1000 / processingTime // tasks per second for this task
    });
    
    // Keep only last 60 entries (about 1 minute of data)
    if (this.batchMetrics.recent.length > 60) {
      this.batchMetrics.recent.shift();
    }
  }
  
  /**
   * Get pipeline statistics
   */
  getStats() {
    return {
      ...this.stats,
      workers: {
        total: this.workers.length,
        ready: this.workers.filter(w => w.ready).length,
        busy: this.busyWorkers.size,
        stats: Array.from(this.workerStats.entries()).map(([id, stats]) => ({
          id,
          ...stats
        }))
      },
      queue: {
        pending: this.taskQueue.length,
        active: this.activeTasks.size
      },
      adaptive: {
        optimalBatchSize: this.batchMetrics.optimalSize,
        recentMetrics: this.batchMetrics.recent.length
      }
    };
  }
  
  /**
   * Shutdown pipeline and terminate workers
   */
  async shutdown() {
    this.isShutdown = true;
    
    // Stop health monitoring
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    // Cancel pending tasks
    for (const [taskId, task] of this.activeTasks.entries()) {
      clearTimeout(task.timeoutId);
      task.reject(new Error('Pipeline shutdown'));
    }
    this.activeTasks.clear();
    this.taskQueue.length = 0;
    
    // Terminate workers
    const terminationPromises = this.workers.map(async (worker) => {
      try {
        await worker.terminate();
      } catch (error) {
        logger.warn(`Error terminating worker ${worker.id}:`, error);
      }
    });
    
    await Promise.all(terminationPromises);
    
    logger.info('ConstraintPipeline shutdown completed');
    this.emit('shutdown');
  }
}

module.exports = ConstraintPipeline;