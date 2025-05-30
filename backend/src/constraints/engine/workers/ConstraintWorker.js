/**
 * ConstraintWorker - Worker Thread for Parallel Constraint Evaluation
 * 
 * High-performance worker for:
 * - Parallel constraint processing
 * - Isolated evaluation environment
 * - Memory-efficient operations
 * - Progress reporting
 * - Error isolation
 */

const { parentPort, workerData } = require('worker_threads');
const ConstraintEvaluator = require('../../../ai/improvements/constraint_evaluator');

class ConstraintWorker {
  constructor() {
    this.evaluator = null;
    this.isReady = false;
    this.currentTask = null;
    this.stats = {
      tasksCompleted: 0,
      totalProcessingTime: 0,
      errorsEncountered: 0
    };
    
    this._initialize();
  }
  
  /**
   * Initialize the worker
   */
  async _initialize() {
    try {
      // Create constraint evaluator
      this.evaluator = new ConstraintEvaluator();
      
      this.isReady = true;
      
      // Notify parent that worker is ready
      this._sendMessage('ready', {
        workerId: workerData?.workerId || 'unknown',
        timestamp: Date.now()
      });
      
    } catch (error) {
      this._sendMessage('error', {
        error: error.message,
        stack: error.stack
      });
    }
  }
  
  /**
   * Process a batch of constraints
   */
  async _processBatch(data) {
    const { taskId, constraints, schedule, options } = data;
    const startTime = process.hrtime.bigint();
    
    try {
      this.currentTask = taskId;
      
      // Set up evaluator with constraints
      this.evaluator.setConstraints(constraints);
      
      // Send progress update
      this._sendMessage('progress', {
        taskId,
        progress: {
          stage: 'initialization',
          completed: 0,
          total: constraints.length
        }
      });
      
      let totalScore = 0;
      let hardConstraintViolations = 0;
      const violations = [];
      const constraintResults = {};
      
      // Process constraints with progress tracking
      for (let i = 0; i < constraints.length; i++) {
        const constraint = constraints[i];
        
        // Early termination check
        if (options.enableEarlyTermination && 
            totalScore > options.earlyTerminationThreshold) {
          this._sendMessage('progress', {
            taskId,
            progress: {
              stage: 'early_termination',
              completed: i,
              total: constraints.length,
              reason: 'threshold_exceeded'
            }
          });
          break;
        }
        
        // Evaluate constraint
        const result = this.evaluator.evaluateConstraint(constraint, schedule);
        
        // Apply weight
        const weight = this.evaluator.getConstraintWeight(constraint);
        const weightedScore = result.score * weight;
        
        // Store result
        constraintResults[constraint.id] = {
          type: constraint.type,
          score: result.score,
          weightedScore,
          violations: result.violations
        };
        
        // Accumulate
        totalScore += weightedScore;
        violations.push(...result.violations.map(v => ({
          ...v,
          constraintId: constraint.id,
          constraintType: constraint.type
        })));
        
        // Count hard violations
        if (constraint.category === 'hard' && result.violations.length > 0) {
          hardConstraintViolations += result.violations.length;
        }
        
        // Send progress update every 5 constraints
        if ((i + 1) % 5 === 0 || i === constraints.length - 1) {
          this._sendMessage('progress', {
            taskId,
            progress: {
              stage: 'evaluation',
              completed: i + 1,
              total: constraints.length,
              currentScore: totalScore,
              violations: violations.length
            }
          });
        }
      }
      
      const processingTime = Number(process.hrtime.bigint() - startTime) / 1000000;
      
      // Update stats
      this.stats.tasksCompleted++;
      this.stats.totalProcessingTime += processingTime;
      
      // Build result
      const result = {
        score: totalScore,
        hardConstraintViolations,
        violations,
        valid: hardConstraintViolations === 0,
        constraintResults,
        metadata: {
          evaluationType: 'worker_parallel',
          constraintCount: constraints.length,
          processingTime,
          workerId: workerData?.workerId || 'unknown'
        }
      };
      
      // Send final result
      this._sendMessage('taskResult', {
        taskId,
        result,
        processingTime,
        stats: { ...this.stats }
      });
      
    } catch (error) {
      const processingTime = Number(process.hrtime.bigint() - startTime) / 1000000;
      
      this.stats.errorsEncountered++;
      
      this._sendMessage('taskError', {
        taskId,
        error: error.message,
        processingTime,
        stats: { ...this.stats }
      });
      
    } finally {
      this.currentTask = null;
    }
  }
  
  /**
   * Handle health check
   */
  _handleHealthCheck(data) {
    this._sendMessage('healthResponse', {
      timestamp: data.timestamp,
      responseTime: Date.now(),
      isReady: this.isReady,
      currentTask: this.currentTask,
      stats: { ...this.stats },
      memoryUsage: process.memoryUsage()
    });
  }
  
  /**
   * Send message to parent thread
   */
  _sendMessage(type, data) {
    if (parentPort) {
      parentPort.postMessage({
        type,
        data,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Handle incoming messages from parent
   */
  _handleMessage(message) {
    const { type, data } = message;
    
    switch (type) {
      case 'evaluateConstraints':
        this._processBatch(data);
        break;
        
      case 'healthCheck':
        this._handleHealthCheck(data);
        break;
        
      case 'shutdown':
        this._shutdown();
        break;
        
      default:
        this._sendMessage('error', {
          error: `Unknown message type: ${type}`
        });
    }
  }
  
  /**
   * Shutdown worker gracefully
   */
  _shutdown() {
    this._sendMessage('shutdown', {
      stats: { ...this.stats }
    });
    
    process.exit(0);
  }
}

// Create worker instance and set up message handling
const worker = new ConstraintWorker();

if (parentPort) {
  parentPort.on('message', (message) => {
    worker._handleMessage(message);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    worker._sendMessage('error', {
      error: error.message,
      stack: error.stack,
      type: 'uncaughtException'
    });
    
    process.exit(1);
  });
  
  // Handle unhandled rejections
  process.on('unhandledRejection', (reason, promise) => {
    worker._sendMessage('error', {
      error: reason?.message || 'Unhandled promise rejection',
      stack: reason?.stack,
      type: 'unhandledRejection'
    });
  });
}

module.exports = ConstraintWorker;