import { Worker } from 'worker_threads';
import { cpus } from 'os';
import {
  UnifiedConstraint,
  ConstraintResult,
  Schedule,
  ConstraintStatus
} from '../types';

export interface WorkerTask {
  id: string;
  constraint: UnifiedConstraint;
  schedule: Schedule;
}

export interface WorkerResult {
  taskId: string;
  result: ConstraintResult;
  error?: Error;
}

export interface ParallelEvaluatorConfig {
  maxWorkers: number;
  timeout: number;
  workerScript?: string;
  retryAttempts?: number;
  queueSize?: number;
}

export interface WorkerPoolStats {
  activeWorkers: number;
  idleWorkers: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskTime: number;
  queueLength: number;
}

class WorkerPool {
  private workers: Worker[] = [];
  private idleWorkers: Worker[] = [];
  private taskQueue: Array<{
    task: WorkerTask;
    resolve: (result: ConstraintResult) => void;
    reject: (error: Error) => void;
  }> = [];
  private activeTaskCount = 0;
  private completedTaskCount = 0;
  private failedTaskCount = 0;
  private totalTaskTime = 0;
  private config: ParallelEvaluatorConfig;

  constructor(config: ParallelEvaluatorConfig) {
    this.config = config;
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    const workerScript = this.config.workerScript || this.getDefaultWorkerScript();
    
    for (let i = 0; i < this.config.maxWorkers; i++) {
      const worker = new Worker(workerScript, {
        eval: !this.config.workerScript
      });

      worker.on('message', (result: WorkerResult) => {
        this.handleWorkerResult(worker, result);
      });

      worker.on('error', (error) => {
        this.handleWorkerError(worker, error);
      });

      worker.on('exit', (code) => {
        this.handleWorkerExit(worker, code);
      });

      this.workers.push(worker);
      this.idleWorkers.push(worker);
    }
  }

  async execute(task: WorkerTask): Promise<ConstraintResult> {
    return new Promise((resolve, reject) => {
      // Check queue size limit
      if (this.config.queueSize && this.taskQueue.length >= this.config.queueSize) {
        reject(new Error('Task queue is full'));
        return;
      }

      // Add to queue
      this.taskQueue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  private processQueue(): void {
    while (this.idleWorkers.length > 0 && this.taskQueue.length > 0) {
      const worker = this.idleWorkers.pop()!;
      const { task, resolve, reject } = this.taskQueue.shift()!;

      this.activeTaskCount++;
      const startTime = Date.now();

      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.handleTaskTimeout(worker, task, reject);
      }, this.config.timeout);

      // Store task metadata on worker
      (worker as any).currentTask = {
        task,
        resolve,
        reject,
        timeoutId,
        startTime
      };

      // Send task to worker
      worker.postMessage(task);
    }
  }

  private handleWorkerResult(worker: Worker, result: WorkerResult): void {
    const taskData = (worker as any).currentTask;
    if (!taskData) return;

    clearTimeout(taskData.timeoutId);
    
    const duration = Date.now() - taskData.startTime;
    this.totalTaskTime += duration;
    this.completedTaskCount++;
    this.activeTaskCount--;

    // Clean up worker
    delete (worker as any).currentTask;
    this.idleWorkers.push(worker);

    // Resolve promise
    if (result.error) {
      this.failedTaskCount++;
      taskData.reject(result.error);
    } else {
      taskData.resolve(result.result);
    }

    // Process next task
    this.processQueue();
  }

  private handleWorkerError(worker: Worker, error: Error): void {
    const taskData = (worker as any).currentTask;
    if (taskData) {
      clearTimeout(taskData.timeoutId);
      this.failedTaskCount++;
      this.activeTaskCount--;
      taskData.reject(error);
      delete (worker as any).currentTask;
    }

    // Replace worker
    this.replaceWorker(worker);
  }

  private handleWorkerExit(worker: Worker, code: number): void {
    if (code !== 0) {
      console.error(`Worker exited with code ${code}`);
    }

    const taskData = (worker as any).currentTask;
    if (taskData) {
      clearTimeout(taskData.timeoutId);
      this.failedTaskCount++;
      this.activeTaskCount--;
      taskData.reject(new Error(`Worker exited with code ${code}`));
    }

    // Replace worker
    this.replaceWorker(worker);
  }

  private handleTaskTimeout(worker: Worker, task: WorkerTask, reject: (error: Error) => void): void {
    this.failedTaskCount++;
    this.activeTaskCount--;
    
    reject(new Error(`Task ${task.id} timed out after ${this.config.timeout}ms`));
    
    // Terminate and replace worker
    worker.terminate();
    this.replaceWorker(worker);
  }

  private replaceWorker(oldWorker: Worker): void {
    // Remove old worker
    const workerIndex = this.workers.indexOf(oldWorker);
    if (workerIndex !== -1) {
      this.workers.splice(workerIndex, 1);
    }

    const idleIndex = this.idleWorkers.indexOf(oldWorker);
    if (idleIndex !== -1) {
      this.idleWorkers.splice(idleIndex, 1);
    }

    // Create new worker
    const workerScript = this.config.workerScript || this.getDefaultWorkerScript();
    const newWorker = new Worker(workerScript, {
      eval: !this.config.workerScript
    });

    newWorker.on('message', (result: WorkerResult) => {
      this.handleWorkerResult(newWorker, result);
    });

    newWorker.on('error', (error) => {
      this.handleWorkerError(newWorker, error);
    });

    newWorker.on('exit', (code) => {
      this.handleWorkerExit(newWorker, code);
    });

    this.workers.push(newWorker);
    this.idleWorkers.push(newWorker);

    // Process queue with new worker
    this.processQueue();
  }

  private getDefaultWorkerScript(): string {
    return `
      const { parentPort } = require('worker_threads');

      parentPort.on('message', async (task) => {
        try {
          // Evaluate constraint
          const result = await task.constraint.evaluation(
            task.schedule,
            task.constraint.parameters
          );

          parentPort.postMessage({
            taskId: task.id,
            result: {
              ...result,
              constraintId: task.constraint.id
            }
          });
        } catch (error) {
          parentPort.postMessage({
            taskId: task.id,
            error: {
              message: error.message,
              stack: error.stack
            }
          });
        }
      });
    `;
  }

  getStats(): WorkerPoolStats {
    return {
      activeWorkers: this.config.maxWorkers - this.idleWorkers.length,
      idleWorkers: this.idleWorkers.length,
      totalTasks: this.completedTaskCount + this.failedTaskCount,
      completedTasks: this.completedTaskCount,
      failedTasks: this.failedTaskCount,
      averageTaskTime: this.completedTaskCount > 0 
        ? this.totalTaskTime / this.completedTaskCount 
        : 0,
      queueLength: this.taskQueue.length
    };
  }

  async shutdown(): Promise<void> {
    // Clear queue
    for (const { reject } of this.taskQueue) {
      reject(new Error('Worker pool is shutting down'));
    }
    this.taskQueue = [];

    // Terminate all workers
    await Promise.all(this.workers.map(worker => worker.terminate()));
    
    this.workers = [];
    this.idleWorkers = [];
  }
}

export class ParallelEvaluator {
  private workerPool: WorkerPool;
  private config: ParallelEvaluatorConfig;

  constructor(config: Partial<ParallelEvaluatorConfig> = {}) {
    this.config = {
      maxWorkers: Math.min(cpus().length, 8),
      timeout: 30000,
      retryAttempts: 2,
      queueSize: 1000,
      ...config
    };

    this.workerPool = new WorkerPool(this.config);
  }

  async evaluateSingle(
    constraint: UnifiedConstraint,
    schedule: Schedule
  ): Promise<ConstraintResult> {
    // Check if constraint can be parallelized
    if (constraint.parallelizable === false) {
      return this.evaluateInMainThread(constraint, schedule);
    }

    const task: WorkerTask = {
      id: `${constraint.id}_${Date.now()}`,
      constraint,
      schedule
    };

    let lastError: Error | undefined;
    
    // Retry logic
    for (let attempt = 1; attempt <= this.config.retryAttempts!; attempt++) {
      try {
        return await this.workerPool.execute(task);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.retryAttempts!) {
          // Exponential backoff
          await this.delay(Math.pow(2, attempt - 1) * 1000);
        }
      }
    }

    // If all retries failed, return error result
    return {
      constraintId: constraint.id,
      status: ConstraintStatus.NOT_EVALUATED,
      satisfied: false,
      score: 0,
      message: `Evaluation failed after ${this.config.retryAttempts} attempts: ${lastError?.message}`,
      executionTime: 0
    };
  }

  async evaluateBatch(
    constraints: UnifiedConstraint[],
    schedule: Schedule
  ): Promise<ConstraintResult[]> {
    const evaluationPromises = constraints.map(constraint =>
      this.evaluateSingle(constraint, schedule)
    );

    return Promise.all(evaluationPromises);
  }

  async evaluateBatchWithProgress(
    constraints: UnifiedConstraint[],
    schedule: Schedule,
    onProgress?: (completed: number, total: number) => void
  ): Promise<ConstraintResult[]> {
    const results: ConstraintResult[] = [];
    let completed = 0;

    const evaluationPromises = constraints.map(async (constraint) => {
      const result = await this.evaluateSingle(constraint, schedule);
      completed++;
      
      if (onProgress) {
        onProgress(completed, constraints.length);
      }

      return result;
    });

    return Promise.all(evaluationPromises);
  }

  private async evaluateInMainThread(
    constraint: UnifiedConstraint,
    schedule: Schedule
  ): Promise<ConstraintResult> {
    const startTime = Date.now();

    try {
      const result = await constraint.evaluation(schedule, constraint.parameters);
      
      return {
        ...result,
        constraintId: constraint.id,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        constraintId: constraint.id,
        status: ConstraintStatus.NOT_EVALUATED,
        satisfied: false,
        score: 0,
        message: `Evaluation failed: ${error}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats(): WorkerPoolStats {
    return this.workerPool.getStats();
  }

  async shutdown(): Promise<void> {
    await this.workerPool.shutdown();
  }

  // Advanced features
  async evaluateWithDependencies(
    constraints: UnifiedConstraint[],
    schedule: Schedule,
    dependencies: Map<string, string[]>
  ): Promise<Map<string, ConstraintResult>> {
    const results = new Map<string, ConstraintResult>();
    const evaluated = new Set<string>();

    const evaluateConstraint = async (constraintId: string): Promise<void> => {
      if (evaluated.has(constraintId)) {
        return;
      }

      const constraint = constraints.find(c => c.id === constraintId);
      if (!constraint) {
        throw new Error(`Constraint ${constraintId} not found`);
      }

      // Evaluate dependencies first
      const deps = dependencies.get(constraintId) || [];
      await Promise.all(deps.map(depId => evaluateConstraint(depId)));

      // Now evaluate this constraint
      const result = await this.evaluateSingle(constraint, schedule);
      results.set(constraintId, result);
      evaluated.add(constraintId);
    };

    // Start evaluation from constraints with no dependents
    const rootConstraints = constraints.filter(c => {
      // Find constraints that no other constraint depends on
      for (const [, deps] of dependencies) {
        if (deps.includes(c.id)) {
          return false;
        }
      }
      return true;
    });

    await Promise.all(rootConstraints.map(c => evaluateConstraint(c.id)));

    return results;
  }
}