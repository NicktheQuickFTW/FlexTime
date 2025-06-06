class CacheManager {
  constructor(config, workerConfig = {}) {
    this.cache = new Map();
    this.config = config;
    this.workers = new Map(); // Track workers per task
    this.maxWorkersPerTask = workerConfig.maxWorkersPerTask || 10; // Configurable workers per task
    
    // Start cleanup interval if enabled
    if (config.enabled && config.checkPeriod) {
      this.startCleanupInterval();
    }
  }

  get(key) {
    if (!this.config.enabled) return null;
    
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.config.ttl) {
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  set(key, data) {
    if (!this.config.enabled) return;
    
    // Prevent cache from growing too large
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Worker management for tasks
  allocateWorkers(taskId, workerCount = this.maxWorkersPerTask) {
    const actualWorkerCount = Math.min(workerCount, this.maxWorkersPerTask);
    
    if (!this.workers.has(taskId)) {
      this.workers.set(taskId, {
        count: actualWorkerCount,
        allocated: Date.now(),
        active: true
      });
    }
    
    return actualWorkerCount;
  }

  getWorkerInfo(taskId) {
    return this.workers.get(taskId) || null;
  }

  releaseWorkers(taskId) {
    if (this.workers.has(taskId)) {
      const workerInfo = this.workers.get(taskId);
      workerInfo.active = false;
      workerInfo.released = Date.now();
      
      // Clean up after 5 minutes
      setTimeout(() => {
        this.workers.delete(taskId);
      }, 5 * 60 * 1000);
    }
  }

  getActiveWorkers() {
    let totalActive = 0;
    for (const [taskId, info] of this.workers.entries()) {
      if (info.active) {
        totalActive += info.count;
      }
    }
    return totalActive;
  }

  getStats() {
    return {
      cache: {
        size: this.cache.size,
        maxSize: this.config.maxSize,
        enabled: this.config.enabled,
        utilization: ((this.cache.size / this.config.maxSize) * 100).toFixed(2) + '%'
      },
      workers: {
        maxPerTask: this.maxWorkersPerTask,
        activeTasks: Array.from(this.workers.entries()).filter(([_, info]) => info.active).length,
        totalActive: this.getActiveWorkers(),
        taskDetails: Object.fromEntries(
          Array.from(this.workers.entries()).map(([taskId, info]) => [
            taskId, 
            {
              count: info.count,
              active: info.active,
              duration: Date.now() - info.allocated
            }
          ])
        )
      }
    };
  }

  startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.config.ttl) {
          this.cache.delete(key);
        }
      }
    }, this.config.checkPeriod);
  }

  clear() {
    this.cache.clear();
    this.workers.clear();
  }
}

module.exports = CacheManager;