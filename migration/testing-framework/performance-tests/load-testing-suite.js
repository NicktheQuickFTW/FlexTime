/**
 * Load Testing Suite
 * 
 * Comprehensive performance testing for migration validation
 */

const axios = require('axios');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const logger = require('../utilities/logger');
const config = require('../config/test.config');

class LoadTestingSuite {
  constructor() {
    this.config = config.performance.loadTesting;
    this.results = {
      tests: [],
      summary: {},
      startTime: null,
      endTime: null
    };
  }

  /**
   * Run complete load testing suite
   */
  async runLoadTests() {
    logger.info('Starting load testing suite');
    this.results.startTime = new Date();
    
    try {
      // Test legacy system
      const legacyResults = await this.testLegacySystem();
      
      // Test microservices
      const microserviceResults = await this.testMicroservices();
      
      // Generate comparison report
      await this.generateComparisonReport(legacyResults, microserviceResults);
      
      this.results.endTime = new Date();
      logger.info('Load testing suite completed', {
        duration: this.results.endTime - this.results.startTime,
        totalTests: this.results.tests.length
      });
      
      return this.results;
      
    } catch (error) {
      logger.error('Load testing suite failed:', error.message);
      throw error;
    }
  }

  /**
   * Test legacy system performance
   */
  async testLegacySystem() {
    logger.info('Starting legacy system load tests');
    
    const tests = [
      {
        name: 'Legacy Schedule Generation Load Test',
        endpoint: `${config.legacy.baseUrl}/api/schedules/generate`,
        method: 'POST',
        payload: this.generateSchedulePayload('legacy'),
        expectedResponseTime: config.performance.benchmarks.scheduleGeneration.maxTime
      },
      {
        name: 'Legacy Team Retrieval Load Test',
        endpoint: `${config.legacy.baseUrl}/api/teams`,
        method: 'GET',
        expectedResponseTime: config.performance.benchmarks.apiResponse.maxTime
      },
      {
        name: 'Legacy Schedule Listing Load Test',
        endpoint: `${config.legacy.baseUrl}/api/schedules`,
        method: 'GET',
        expectedResponseTime: config.performance.benchmarks.apiResponse.maxTime
      }
    ];

    const results = [];
    
    for (const test of tests) {
      logger.info(`Running ${test.name}`);
      const result = await this.runLoadTest(test);
      results.push(result);
      this.results.tests.push(result);
    }
    
    return results;
  }

  /**
   * Test microservices performance
   */
  async testMicroservices() {
    logger.info('Starting microservices load tests');
    
    const tests = [
      {
        name: 'Microservice Schedule Generation Load Test',
        endpoint: `${config.microservices.apiGateway.baseUrl}/api/scheduler/schedules/generate`,
        method: 'POST',
        payload: this.generateSchedulePayload('microservice'),
        expectedResponseTime: config.performance.benchmarks.scheduleGeneration.maxTime
      },
      {
        name: 'Microservice Team Retrieval Load Test',
        endpoint: `${config.microservices.apiGateway.baseUrl}/api/teams`,
        method: 'GET',
        expectedResponseTime: config.performance.benchmarks.apiResponse.maxTime
      },
      {
        name: 'Microservice Schedule Listing Load Test',
        endpoint: `${config.microservices.apiGateway.baseUrl}/api/scheduler/schedules`,
        method: 'GET',
        expectedResponseTime: config.performance.benchmarks.apiResponse.maxTime
      }
    ];

    const results = [];
    
    for (const test of tests) {
      logger.info(`Running ${test.name}`);
      const result = await this.runLoadTest(test);
      results.push(result);
      this.results.tests.push(result);
    }
    
    return results;
  }

  /**
   * Run individual load test
   * @param {Object} testConfig - Test configuration
   * @returns {Object} Test results
   */
  async runLoadTest(testConfig) {
    const timer = logger.startTimer(testConfig.name);
    
    try {
      const results = {
        name: testConfig.name,
        config: testConfig,
        startTime: new Date(),
        endTime: null,
        stats: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          responseTimes: [],
          errors: [],
          throughput: 0
        },
        metrics: {}
      };

      // Create worker pool for concurrent requests
      const workers = [];
      const workerCount = this.config.concurrent;
      const requestsPerWorker = Math.ceil(this.config.duration / 1000); // Requests per second per worker

      logger.info(`Starting ${workerCount} workers for ${testConfig.name}`);

      // Start workers
      for (let i = 0; i < workerCount; i++) {
        const worker = new Worker(__filename, {
          workerData: {
            testConfig,
            requestsPerWorker,
            duration: this.config.duration,
            workerId: i
          }
        });

        workers.push(worker);
      }

      // Collect results from workers
      const workerResults = await Promise.all(
        workers.map(worker => this.collectWorkerResults(worker))
      );

      // Aggregate results
      workerResults.forEach(workerResult => {
        results.stats.totalRequests += workerResult.totalRequests;
        results.stats.successfulRequests += workerResult.successfulRequests;
        results.stats.failedRequests += workerResult.failedRequests;
        results.stats.responseTimes.push(...workerResult.responseTimes);
        results.stats.errors.push(...workerResult.errors);
      });

      results.endTime = new Date();
      const testDuration = (results.endTime - results.startTime) / 1000; // seconds

      // Calculate metrics
      results.metrics = this.calculateMetrics(results.stats, testDuration);

      // Validate performance
      results.passed = this.validatePerformance(results.metrics, testConfig);

      logger.performance(testConfig.name, results.metrics);
      
      return results;

    } catch (error) {
      logger.error(`Load test failed: ${testConfig.name}`, error);
      throw error;
    } finally {
      timer();
    }
  }

  /**
   * Collect results from worker thread
   * @param {Worker} worker - Worker thread
   * @returns {Promise<Object>} Worker results
   */
  async collectWorkerResults(worker) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker timeout'));
      }, this.config.duration + 10000); // Extra 10 seconds

      worker.on('message', (result) => {
        clearTimeout(timeout);
        resolve(result);
      });

      worker.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          clearTimeout(timeout);
          reject(new Error(`Worker exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Calculate performance metrics
   * @param {Object} stats - Raw statistics
   * @param {number} duration - Test duration in seconds
   * @returns {Object} Calculated metrics
   */
  calculateMetrics(stats, duration) {
    const responseTimes = stats.responseTimes.sort((a, b) => a - b);
    
    return {
      totalRequests: stats.totalRequests,
      successfulRequests: stats.successfulRequests,
      failedRequests: stats.failedRequests,
      successRate: (stats.successfulRequests / stats.totalRequests * 100).toFixed(2),
      errorRate: (stats.failedRequests / stats.totalRequests * 100).toFixed(2),
      throughput: (stats.totalRequests / duration).toFixed(2),
      responseTime: {
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        avg: (responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length).toFixed(2),
        p50: this.percentile(responseTimes, 0.5),
        p95: this.percentile(responseTimes, 0.95),
        p99: this.percentile(responseTimes, 0.99)
      },
      duration: duration
    };
  }

  /**
   * Calculate percentile
   * @param {Array} sortedArray - Sorted array of values
   * @param {number} percentile - Percentile (0-1)
   * @returns {number} Percentile value
   */
  percentile(sortedArray, percentile) {
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[index];
  }

  /**
   * Validate performance against benchmarks
   * @param {Object} metrics - Performance metrics
   * @param {Object} testConfig - Test configuration
   * @returns {boolean} Whether performance meets expectations
   */
  validatePerformance(metrics, testConfig) {
    const errorRateThreshold = this.config.errorThreshold * 100; // Convert to percentage
    const maxResponseTime = testConfig.expectedResponseTime;

    const passed = 
      parseFloat(metrics.errorRate) <= errorRateThreshold &&
      parseFloat(metrics.responseTime.p95) <= maxResponseTime;

    if (!passed) {
      logger.warn(`Performance validation failed for ${testConfig.name}`, {
        errorRate: metrics.errorRate,
        errorRateThreshold,
        p95ResponseTime: metrics.responseTime.p95,
        maxResponseTime
      });
    }

    return passed;
  }

  /**
   * Generate schedule payload for testing
   * @param {string} systemType - 'legacy' or 'microservice'
   * @returns {Object} Schedule generation payload
   */
  generateSchedulePayload(systemType) {
    return {
      sport: 'football',
      teams: [
        { id: 'team1', name: 'Team 1' },
        { id: 'team2', name: 'Team 2' },
        { id: 'team3', name: 'Team 3' },
        { id: 'team4', name: 'Team 4' }
      ],
      constraints: [
        {
          id: 'basic_rest',
          type: 'temporal',
          description: 'Minimum rest between games',
          rule: 'minimum_rest_days >= 1'
        }
      ],
      parameters: {
        algorithm: 'round_robin',
        season: '2025-26',
        systemType
      }
    };
  }

  /**
   * Generate comparison report
   * @param {Array} legacyResults - Legacy system results
   * @param {Array} microserviceResults - Microservice results
   */
  async generateComparisonReport(legacyResults, microserviceResults) {
    logger.info('Generating load test comparison report');

    const comparison = {
      timestamp: new Date().toISOString(),
      summary: {
        legacy: this.summarizeResults(legacyResults),
        microservices: this.summarizeResults(microserviceResults)
      },
      detailed: {
        legacy: legacyResults,
        microservices: microserviceResults
      }
    };

    // Calculate improvement metrics
    comparison.improvement = this.calculateImprovements(
      comparison.summary.legacy,
      comparison.summary.microservices
    );

    // Save report
    const reportPath = path.join(__dirname, '../reports', 'load-test-comparison.json');
    fs.writeFileSync(reportPath, JSON.stringify(comparison, null, 2));

    logger.info('Load test comparison report generated', {
      reportPath,
      improvements: comparison.improvement
    });

    this.results.comparison = comparison;
  }

  /**
   * Summarize test results
   * @param {Array} results - Test results
   * @returns {Object} Summary statistics
   */
  summarizeResults(results) {
    const totalRequests = results.reduce((sum, r) => sum + r.stats.totalRequests, 0);
    const totalSuccessful = results.reduce((sum, r) => sum + r.stats.successfulRequests, 0);
    const allResponseTimes = results.flatMap(r => r.stats.responseTimes);
    const avgThroughput = results.reduce((sum, r) => sum + parseFloat(r.metrics.throughput), 0) / results.length;

    return {
      testCount: results.length,
      totalRequests,
      successRate: (totalSuccessful / totalRequests * 100).toFixed(2),
      avgThroughput: avgThroughput.toFixed(2),
      avgResponseTime: (allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length).toFixed(2),
      p95ResponseTime: this.percentile(allResponseTimes.sort((a, b) => a - b), 0.95),
      testsPassedValidation: results.filter(r => r.passed).length
    };
  }

  /**
   * Calculate performance improvements
   * @param {Object} legacySummary - Legacy system summary
   * @param {Object} microserviceSummary - Microservice summary
   * @returns {Object} Improvement metrics
   */
  calculateImprovements(legacySummary, microserviceSummary) {
    const improvements = {};

    // Throughput improvement
    const legacyThroughput = parseFloat(legacySummary.avgThroughput);
    const microserviceThroughput = parseFloat(microserviceSummary.avgThroughput);
    improvements.throughput = ((microserviceThroughput - legacyThroughput) / legacyThroughput * 100).toFixed(2);

    // Response time improvement (negative is better)
    const legacyResponseTime = parseFloat(legacySummary.avgResponseTime);
    const microserviceResponseTime = parseFloat(microserviceSummary.avgResponseTime);
    improvements.responseTime = ((legacyResponseTime - microserviceResponseTime) / legacyResponseTime * 100).toFixed(2);

    // Success rate comparison
    improvements.successRate = (parseFloat(microserviceSummary.successRate) - parseFloat(legacySummary.successRate)).toFixed(2);

    return improvements;
  }
}

// Worker thread implementation
if (!isMainThread) {
  const { testConfig, requestsPerWorker, duration, workerId } = workerData;
  
  async function workerLoadTest() {
    const results = {
      workerId,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: []
    };

    const client = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': `LoadTest-Worker-${workerId}`
      }
    });

    const startTime = Date.now();
    const endTime = startTime + duration;

    while (Date.now() < endTime) {
      try {
        const requestStart = Date.now();
        
        let response;
        if (testConfig.method === 'POST') {
          response = await client.post(testConfig.endpoint, testConfig.payload);
        } else {
          response = await client.get(testConfig.endpoint);
        }

        const responseTime = Date.now() - requestStart;
        
        results.totalRequests++;
        results.responseTimes.push(responseTime);
        
        if (response.status >= 200 && response.status < 300) {
          results.successfulRequests++;
        } else {
          results.failedRequests++;
          results.errors.push({
            status: response.status,
            timestamp: Date.now()
          });
        }

      } catch (error) {
        results.totalRequests++;
        results.failedRequests++;
        results.errors.push({
          message: error.message,
          timestamp: Date.now()
        });
      }

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    parentPort.postMessage(results);
  }

  workerLoadTest().catch(error => {
    parentPort.postMessage({
      error: error.message,
      workerId
    });
  });
}

// CLI interface
if (require.main === module) {
  async function main() {
    const loadTester = new LoadTestingSuite();
    
    try {
      const results = await loadTester.runLoadTests();
      console.log('✅ Load testing completed successfully');
      console.log(`📊 Results: ${results.tests.length} tests completed`);
      console.log(`⏱️  Duration: ${results.endTime - results.startTime}ms`);
    } catch (error) {
      console.error('❌ Load testing failed:', error);
      process.exit(1);
    }
  }
  
  main();
}

module.exports = LoadTestingSuite;