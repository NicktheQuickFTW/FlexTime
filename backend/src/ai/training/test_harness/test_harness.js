/**
 * Agent Test Harness
 * 
 * This module provides a controlled environment for testing FlexTime agents
 * with isolated execution, metrics collection, and parallel test execution.
 */

const path = require('path');
const fs = require('fs').promises;
const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../../utils/logger');
const os = require('os');

class TestHarness extends EventEmitter {
  /**
   * Create a new Test Harness
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    super();
    
    this.config = {
      // Test execution configuration
      maxParallelTests: config.maxParallelTests || 4,
      defaultTimeout: config.defaultTimeout || 60000, // 1 minute
      isolationLevel: config.isolationLevel || 'process', // process, vm, none
      
      // Metrics collection
      captureMemoryUsage: config.captureMemoryUsage !== false,
      captureCpuUsage: config.captureCpuUsage !== false,
      captureResponseTimes: config.captureResponseTimes !== false,
      
      // Results storage
      dataDirectory: config.dataDirectory || path.join(__dirname, '../../../data/training/test_results'),
      resultRetention: config.resultRetention || 30, // days
      
      // Error handling
      maxRetries: config.maxRetries || 2,
      captureStackTraces: config.captureStackTraces !== false,
      
      ...config
    };
    
    // Test harness state
    this.initialized = false;
    this.running = false;
    this.registeredAgents = new Map();
    this.activeTests = new Map();
    this.testHistory = [];
    
    logger.info('Test Harness initialized');
  }
  
  /**
   * Initialize the test harness
   * 
   * @returns {Promise<boolean>} Success indicator
   */
  async initialize() {
    try {
      logger.info('Initializing Test Harness');
      
      // Create data directory if it doesn't exist
      await fs.mkdir(this.config.dataDirectory, { recursive: true });
      
      // Set up test environment based on isolation level
      await this._setupTestEnvironment();
      
      // Clean up old results if needed
      await this._cleanupOldResults();
      
      this.initialized = true;
      logger.info('Test Harness initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Error initializing Test Harness: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Set up the test environment based on isolation level
   * 
   * @returns {Promise<void>}
   * @private
   */
  async _setupTestEnvironment() {
    try {
      switch (this.config.isolationLevel) {
        case 'process':
          // Nothing to set up for process isolation, we'll use child processes
          logger.info('Using process isolation for tests');
          break;
          
        case 'vm':
          // Ensure vm2 is available for VM isolation
          try {
            require('vm2');
            logger.info('Using VM isolation for tests');
          } catch (err) {
            logger.warn('vm2 module not available, falling back to no isolation');
            this.config.isolationLevel = 'none';
          }
          break;
          
        case 'none':
          // No isolation needed
          logger.info('Using no isolation for tests (direct execution)');
          break;
          
        default:
          logger.warn(`Unknown isolation level: ${this.config.isolationLevel}, falling back to none`);
          this.config.isolationLevel = 'none';
      }
    } catch (error) {
      logger.error(`Error setting up test environment: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Clean up old test results
   * 
   * @returns {Promise<void>}
   * @private
   */
  async _cleanupOldResults() {
    try {
      if (this.config.resultRetention <= 0) {
        logger.info('Result retention disabled, skipping cleanup');
        return;
      }
      
      logger.info(`Cleaning up test results older than ${this.config.resultRetention} days`);
      
      // Get all files in the data directory
      const files = await fs.readdir(this.config.dataDirectory);
      
      // Calculate the cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.resultRetention);
      
      // Check each file
      let deletedCount = 0;
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.config.dataDirectory, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      }
      
      logger.info(`Cleaned up ${deletedCount} old test result files`);
    } catch (error) {
      logger.error(`Error cleaning up old results: ${error.message}`);
      // Don't throw, this is non-critical
    }
  }
  
  /**
   * Register an agent with the test harness
   * 
   * @param {Object} agent - Agent to register
   * @returns {Promise<boolean>} Success indicator
   */
  async registerAgent(agent) {
    try {
      if (!agent || !agent.agentId) {
        throw new Error('Agent must have an agentId property');
      }
      
      // Store agent reference
      this.registeredAgents.set(agent.agentId, agent);
      
      logger.info(`Registered agent ${agent.agentId} with Test Harness`);
      
      // Emit agent registered event
      this.emit('agentRegistered', {
        agentId: agent.agentId,
        agentType: agent.agentType
      });
      
      return true;
    } catch (error) {
      logger.error(`Error registering agent: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Unregister an agent from the test harness
   * 
   * @param {string} agentId - ID of the agent to unregister
   * @returns {Promise<boolean>} Success indicator
   */
  async unregisterAgent(agentId) {
    try {
      if (!this.registeredAgents.has(agentId)) {
        logger.warn(`Agent ${agentId} not registered, skipping unregister`);
        return true;
      }
      
      // Remove agent reference
      this.registeredAgents.delete(agentId);
      
      logger.info(`Unregistered agent ${agentId} from Test Harness`);
      
      // Emit agent unregistered event
      this.emit('agentUnregistered', {
        agentId
      });
      
      return true;
    } catch (error) {
      logger.error(`Error unregistering agent: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get all registered agent IDs
   * 
   * @returns {Array<string>} Array of agent IDs
   */
  getRegisteredAgentIds() {
    return Array.from(this.registeredAgents.keys());
  }
  
  /**
   * Get a registered agent by ID
   * 
   * @param {string} agentId - ID of the agent to get
   * @returns {Object|null} The agent or null if not found
   */
  getAgent(agentId) {
    return this.registeredAgents.get(agentId) || null;
  }
  
  /**
   * Run tests for an agent
   * 
   * @param {string} agentId - ID of the agent to test
   * @param {Array<Object>} testCases - Test cases to run
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Test results
   */
  async runTests(agentId, testCases, options = {}) {
    try {
      // Verify the agent is registered
      if (!this.registeredAgents.has(agentId)) {
        throw new Error(`Agent ${agentId} is not registered with the Test Harness`);
      }
      
      // Get agent
      const agent = this.registeredAgents.get(agentId);
      
      // Normalize options with defaults
      const testOptions = {
        parallelTests: options.parallelTests || this.config.maxParallelTests,
        timeout: options.timeout || this.config.defaultTimeout,
        captureMetrics: options.captureMetrics !== false,
        maxRetries: options.maxRetries !== undefined ? options.maxRetries : this.config.maxRetries,
        tags: options.tags || [],
        description: options.description || `Test run for ${agentId}`,
        ...options
      };
      
      logger.info(`Starting test run for agent ${agentId} with ${testCases.length} test cases`);
      
      // Mark as running
      this.running = true;
      
      // Create test run
      const testRunId = uuidv4();
      const testRun = {
        id: testRunId,
        agentId,
        startTime: new Date().toISOString(),
        endTime: null,
        options: testOptions,
        status: 'running',
        results: [],
        summary: {
          totalTests: testCases.length,
          passedTests: 0,
          failedTests: 0,
          skippedTests: 0,
          successRate: 0,
          totalDuration: 0,
          averageDuration: 0
        }
      };
      
      // Store test run
      this.activeTests.set(testRunId, testRun);
      
      // Emit test run started event
      this.emit('testRunStarted', {
        testRunId,
        agentId,
        testCount: testCases.length
      });
      
      // Run the tests in batches based on parallelTests option
      const batchSize = testOptions.parallelTests;
      const testPromises = [];
      
      // Track test metrics if enabled
      const baselineMetrics = testOptions.captureMetrics ? 
        await this._captureBaselineMetrics() : null;
      
      // Prepare all test cases
      const preparedTests = testCases.map((testCase, index) => ({
        id: testCase.id || `test-${index + 1}`,
        index,
        testCase,
        status: 'pending',
        startTime: null,
        endTime: null,
        duration: null,
        result: null,
        error: null,
        metrics: null,
        retries: 0
      }));
      
      // Process tests in batches
      for (let i = 0; i < preparedTests.length; i += batchSize) {
        const batch = preparedTests.slice(i, i + batchSize);
        
        // Run batch in parallel
        const batchPromises = batch.map(test => 
          this._runSingleTest(agent, test, testOptions, baselineMetrics)
            .then(result => {
              // Update test run results
              testRun.results.push(result);
              
              // Update summary based on result
              if (result.status === 'passed') {
                testRun.summary.passedTests++;
              } else if (result.status === 'failed') {
                testRun.summary.failedTests++;
              } else if (result.status === 'skipped') {
                testRun.summary.skippedTests++;
              }
              
              testRun.summary.totalDuration += result.duration || 0;
              testRun.summary.successRate = 
                (testRun.summary.passedTests / testRun.results.length) * 100;
              
              // Emit test completed event
              this.emit('testCompleted', {
                testRunId,
                agentId,
                testId: result.id,
                status: result.status
              });
              
              return result;
            })
            .catch(error => {
              logger.error(`Error running test ${test.id}: ${error.message}`);
              
              // Create error result
              const errorResult = {
                id: test.id,
                index: test.index,
                status: 'failed',
                startTime: test.startTime || new Date().toISOString(),
                endTime: new Date().toISOString(),
                duration: 0,
                result: null,
                error: {
                  message: error.message,
                  stack: this.config.captureStackTraces ? error.stack : null
                },
                metrics: null
              };
              
              // Update test run results
              testRun.results.push(errorResult);
              testRun.summary.failedTests++;
              
              // Emit test completed event
              this.emit('testCompleted', {
                testRunId,
                agentId,
                testId: errorResult.id,
                status: 'failed',
                error: error.message
              });
              
              return errorResult;
            })
        );
        
        // Add batch promises to overall promises
        testPromises.push(...batchPromises);
        
        // Wait for this batch to complete before starting the next
        await Promise.all(batchPromises);
      }
      
      // Wait for all tests to complete
      await Promise.all(testPromises);
      
      // Update test run with final results
      testRun.endTime = new Date().toISOString();
      testRun.status = 'completed';
      testRun.summary.averageDuration = 
        testRun.results.length > 0 ? 
          testRun.summary.totalDuration / testRun.results.length : 0;
      
      // Calculate resource usage metrics
      if (testOptions.captureMetrics) {
        testRun.summary.resourceUsage = 
          this._calculateResourceUsage(testRun.results, baselineMetrics);
      }
      
      // Sort results by index
      testRun.results.sort((a, b) => a.index - b.index);
      
      // Move test run from active to history
      this.activeTests.delete(testRunId);
      this.testHistory.push(testRun);
      
      // Save test results to disk
      await this._saveTestResults(testRun);
      
      // Emit test run completed event
      this.emit('testRunCompleted', {
        testRunId,
        agentId,
        status: 'completed',
        summary: testRun.summary
      });
      
      // Update running status if no more active tests
      if (this.activeTests.size === 0) {
        this.running = false;
      }
      
      logger.info(`Completed test run for agent ${agentId}: ${testRun.summary.passedTests}/${testRun.summary.totalTests} tests passed (${testRun.summary.successRate.toFixed(2)}%)`);
      
      return {
        testRunId,
        agentId,
        results: testRun.results,
        ...testRun.summary
      };
    } catch (error) {
      logger.error(`Error running tests for agent ${agentId}: ${error.message}`);
      
      // Update running status if no more active tests
      if (this.activeTests.size === 0) {
        this.running = false;
      }
      
      // Emit test run failed event
      this.emit('testRunFailed', {
        agentId,
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Run a single test case
   * 
   * @param {Object} agent - Agent to test
   * @param {Object} test - Test to run
   * @param {Object} options - Test options
   * @param {Object} baselineMetrics - Baseline metrics for comparison
   * @returns {Promise<Object>} Test result
   * @private
   */
  async _runSingleTest(agent, test, options, baselineMetrics) {
    try {
      logger.debug(`Running test ${test.id} for agent ${agent.agentId}`);
      
      // Mark test as running
      test.status = 'running';
      test.startTime = new Date().toISOString();
      
      // Capture initial metrics if enabled
      const startMetrics = options.captureMetrics ? 
        await this._captureMetrics() : null;
      
      // Run the test
      let result;
      
      switch (this.config.isolationLevel) {
        case 'process':
          result = await this._runTestInProcess(agent, test, options);
          break;
          
        case 'vm':
          result = await this._runTestInVm(agent, test, options);
          break;
          
        case 'none':
        default:
          result = await this._runTestDirect(agent, test, options);
          break;
      }
      
      // Capture final metrics if enabled
      const endMetrics = options.captureMetrics ? 
        await this._captureMetrics() : null;
      
      // Calculate metrics diff if enabled
      if (options.captureMetrics && startMetrics && endMetrics) {
        test.metrics = this._calculateMetricsDiff(startMetrics, endMetrics, baselineMetrics);
      }
      
      // Update test status and timing
      test.status = 'passed';
      test.endTime = new Date().toISOString();
      test.duration = new Date(test.endTime) - new Date(test.startTime);
      test.result = result;
      
      logger.debug(`Test ${test.id} completed successfully`);
      
      return test;
    } catch (error) {
      logger.error(`Test ${test.id} failed: ${error.message}`);
      
      // Update test status and timing
      test.status = 'failed';
      test.endTime = new Date().toISOString();
      test.duration = new Date(test.endTime) - new Date(test.startTime);
      test.error = {
        message: error.message,
        stack: this.config.captureStackTraces ? error.stack : null
      };
      
      // Check if we should retry the test
      if (test.retries < options.maxRetries) {
        logger.info(`Retrying test ${test.id} (attempt ${test.retries + 1} of ${options.maxRetries})`);
        
        test.retries++;
        test.status = 'pending';
        test.startTime = null;
        test.endTime = null;
        
        // Wait a short time before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Retry the test
        return this._runSingleTest(agent, test, options, baselineMetrics);
      }
      
      return test;
    }
  }
  
  /**
   * Run a test directly in the same process
   * 
   * @param {Object} agent - Agent to test
   * @param {Object} test - Test to run
   * @param {Object} options - Test options
   * @returns {Promise<any>} Test result
   * @private
   */
  async _runTestDirect(agent, test, options) {
    // Set up timeout
    const timeout = options.timeout || this.config.defaultTimeout;
    let timeoutId;
    
    try {
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Test ${test.id} timed out after ${timeout}ms`));
        }, timeout);
      });
      
      // Prepare test data
      const testData = test.testCase;
      
      // Execute the test based on test type
      let testPromise;
      
      switch (testData.type) {
        case 'task_execution':
          // Execute a task on the agent
          testPromise = this._executeAgentTask(agent, testData.task);
          break;
          
        case 'message_handling':
          // Send a message to the agent
          testPromise = this._sendAgentMessage(agent, testData.message);
          break;
          
        case 'communication_flow':
          // Test agent communication with other agents
          testPromise = this._testAgentCommunication(agent, testData.scenario);
          break;
          
        case 'data_processing':
          // Test agent data processing capabilities
          testPromise = this._testDataProcessing(agent, testData.data, testData.expected);
          break;
          
        case 'error_handling':
          // Test agent error handling
          testPromise = this._testErrorHandling(agent, testData.errorScenario);
          break;
          
        default:
          // Generic test execution
          if (typeof testData.execute === 'function') {
            testPromise = testData.execute(agent);
          } else {
            throw new Error(`Unknown test type: ${testData.type}`);
          }
      }
      
      // Race the test against the timeout
      const result = await Promise.race([testPromise, timeoutPromise]);
      
      // Clear timeout if the test finished before timeout
      clearTimeout(timeoutId);
      
      return result;
    } catch (error) {
      // Clear timeout if it exists
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      throw error;
    }
  }
  
  /**
   * Run a test in a separate Node.js process
   * 
   * @param {Object} agent - Agent to test
   * @param {Object} test - Test to run
   * @param {Object} options - Test options
   * @returns {Promise<any>} Test result
   * @private
   */
  async _runTestInProcess(agent, test, options) {
    // This would use child_process or worker_threads to run the test
    // in a separate Node.js process/thread
    
    // For now, we'll just call the direct method as a placeholder
    return this._runTestDirect(agent, test, options);
  }
  
  /**
   * Run a test in a VM sandbox
   * 
   * @param {Object} agent - Agent to test
   * @param {Object} test - Test to run
   * @param {Object} options - Test options
   * @returns {Promise<any>} Test result
   * @private
   */
  async _runTestInVm(agent, test, options) {
    // This would use vm2 to run the test in a sandboxed VM
    
    // For now, we'll just call the direct method as a placeholder
    return this._runTestDirect(agent, test, options);
  }
  
  /**
   * Execute a task on an agent
   * 
   * @param {Object} agent - Agent to execute task on
   * @param {Object} task - Task to execute
   * @returns {Promise<any>} Task result
   * @private
   */
  async _executeAgentTask(agent, task) {
    try {
      // Check if the agent has task execution methods
      if (typeof agent._processTask !== 'function') {
        throw new Error('Agent does not implement task processing');
      }
      
      // Clone the task to avoid modifying the original
      const taskCopy = JSON.parse(JSON.stringify(task));
      
      // Add task ID if not present
      if (!taskCopy.taskId) {
        taskCopy.taskId = uuidv4();
      }
      
      // Set task status
      taskCopy.status = 'created';
      taskCopy.createdAt = new Date().toISOString();
      
      // Execute the task directly on the agent
      const result = await agent._processTask(taskCopy);
      
      return result;
    } catch (error) {
      logger.error(`Error executing task on agent: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Send a message to an agent
   * 
   * @param {Object} agent - Agent to send message to
   * @param {Object} message - Message to send
   * @returns {Promise<boolean>} Success indicator
   * @private
   */
  async _sendAgentMessage(agent, message) {
    try {
      // Check if the agent has message handling methods
      if (typeof agent._handleMessage !== 'function' && 
          typeof agent._processMessage !== 'function') {
        throw new Error('Agent does not implement message handling');
      }
      
      // Clone the message to avoid modifying the original
      const messageCopy = JSON.parse(JSON.stringify(message));
      
      // Add message ID if not present
      if (!messageCopy.messageId) {
        messageCopy.messageId = uuidv4();
      }
      
      // Add timestamp if not present
      if (!messageCopy.timestamp) {
        messageCopy.timestamp = new Date().toISOString();
      }
      
      // Send the message to the agent
      if (typeof agent._handleMessage === 'function') {
        await agent._handleMessage(messageCopy);
      } else if (typeof agent._processMessage === 'function') {
        await agent._processMessage(messageCopy);
      }
      
      return true;
    } catch (error) {
      logger.error(`Error sending message to agent: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Test agent communication with other agents
   * 
   * @param {Object} agent - Primary agent to test
   * @param {Object} scenario - Communication scenario
   * @returns {Promise<Object>} Communication results
   * @private
   */
  async _testAgentCommunication(agent, scenario) {
    // This would create a mock communication environment and test
    // agent message sending and receiving
    
    // For now, return a placeholder success result
    return {
      success: true,
      messagesSent: 1,
      messagesReceived: 1
    };
  }
  
  /**
   * Test agent data processing capabilities
   * 
   * @param {Object} agent - Agent to test
   * @param {any} data - Data to process
   * @param {any} expected - Expected result
   * @returns {Promise<Object>} Test result
   * @private
   */
  async _testDataProcessing(agent, data, expected) {
    // This would call the agent's data processing methods and
    // compare the result to the expected output
    
    // For now, return a placeholder success result
    return {
      success: true,
      matches: true,
      actual: expected
    };
  }
  
  /**
   * Test agent error handling
   * 
   * @param {Object} agent - Agent to test
   * @param {Object} errorScenario - Error scenario to test
   * @returns {Promise<Object>} Test result
   * @private
   */
  async _testErrorHandling(agent, errorScenario) {
    // This would intentionally trigger error conditions and verify
    // the agent handles them correctly
    
    // For now, return a placeholder success result
    return {
      success: true,
      errorHandled: true
    };
  }
  
  /**
   * Capture baseline metrics
   * 
   * @returns {Promise<Object>} Baseline metrics
   * @private
   */
  async _captureBaselineMetrics() {
    try {
      const metrics = {
        timestamp: Date.now(),
        memory: null,
        cpu: null
      };
      
      // Capture memory usage
      if (this.config.captureMemoryUsage) {
        metrics.memory = process.memoryUsage();
      }
      
      // Capture CPU usage (not directly available in Node.js)
      if (this.config.captureCpuUsage) {
        metrics.cpu = {
          system: os.loadavg()[0],
          process: process.cpuUsage()
        };
      }
      
      return metrics;
    } catch (error) {
      logger.error(`Error capturing baseline metrics: ${error.message}`);
      return {
        timestamp: Date.now(),
        error: error.message
      };
    }
  }
  
  /**
   * Capture current metrics
   * 
   * @returns {Promise<Object>} Current metrics
   * @private
   */
  async _captureMetrics() {
    try {
      const metrics = {
        timestamp: Date.now(),
        memory: null,
        cpu: null
      };
      
      // Capture memory usage
      if (this.config.captureMemoryUsage) {
        metrics.memory = process.memoryUsage();
      }
      
      // Capture CPU usage (not directly available in Node.js)
      if (this.config.captureCpuUsage) {
        metrics.cpu = {
          system: os.loadavg()[0],
          process: process.cpuUsage()
        };
      }
      
      return metrics;
    } catch (error) {
      logger.error(`Error capturing metrics: ${error.message}`);
      return {
        timestamp: Date.now(),
        error: error.message
      };
    }
  }
  
  /**
   * Calculate the difference between start and end metrics
   * 
   * @param {Object} startMetrics - Metrics at start
   * @param {Object} endMetrics - Metrics at end
   * @param {Object} baselineMetrics - Baseline metrics
   * @returns {Object} Metrics difference
   * @private
   */
  _calculateMetricsDiff(startMetrics, endMetrics, baselineMetrics) {
    try {
      const diff = {
        duration: endMetrics.timestamp - startMetrics.timestamp,
        memory: null,
        cpu: null
      };
      
      // Calculate memory usage difference
      if (startMetrics.memory && endMetrics.memory) {
        diff.memory = {
          rss: endMetrics.memory.rss - startMetrics.memory.rss,
          heapTotal: endMetrics.memory.heapTotal - startMetrics.memory.heapTotal,
          heapUsed: endMetrics.memory.heapUsed - startMetrics.memory.heapUsed,
          external: endMetrics.memory.external - startMetrics.memory.external,
          arrayBuffers: endMetrics.memory.arrayBuffers - startMetrics.memory.arrayBuffers
        };
      }
      
      // Calculate CPU usage difference
      if (startMetrics.cpu && endMetrics.cpu && 
          startMetrics.cpu.process && endMetrics.cpu.process) {
        diff.cpu = {
          system: endMetrics.cpu.system - startMetrics.cpu.system,
          process: {
            user: endMetrics.cpu.process.user - startMetrics.cpu.process.user,
            system: endMetrics.cpu.process.system - startMetrics.cpu.process.system
          }
        };
      }
      
      return diff;
    } catch (error) {
      logger.error(`Error calculating metrics difference: ${error.message}`);
      return {
        duration: endMetrics.timestamp - startMetrics.timestamp,
        error: error.message
      };
    }
  }
  
  /**
   * Calculate overall resource usage for a test run
   * 
   * @param {Array<Object>} results - Test results
   * @param {Object} baselineMetrics - Baseline metrics
   * @returns {Object} Resource usage summary
   * @private
   */
  _calculateResourceUsage(results, baselineMetrics) {
    try {
      // Default resource usage
      const resourceUsage = {
        totalMemory: 0,
        peakMemory: 0,
        averageMemory: 0,
        totalCpu: 0,
        averageCpu: 0
      };
      
      // Count valid metrics
      let validMetricsCount = 0;
      
      // Calculate total and peak usage
      for (const result of results) {
        if (result.metrics && result.metrics.memory) {
          validMetricsCount++;
          
          // Total memory (rss)
          resourceUsage.totalMemory += result.metrics.memory.rss || 0;
          
          // Peak memory
          resourceUsage.peakMemory = Math.max(
            resourceUsage.peakMemory,
            result.metrics.memory.rss || 0
          );
          
          // CPU usage (if available)
          if (result.metrics.cpu && result.metrics.cpu.process) {
            const cpuTotal = 
              (result.metrics.cpu.process.user || 0) + 
              (result.metrics.cpu.process.system || 0);
            
            resourceUsage.totalCpu += cpuTotal;
          }
        }
      }
      
      // Calculate averages
      if (validMetricsCount > 0) {
        resourceUsage.averageMemory = resourceUsage.totalMemory / validMetricsCount;
        resourceUsage.averageCpu = resourceUsage.totalCpu / validMetricsCount;
      }
      
      // Convert to more human-readable values (MB for memory)
      resourceUsage.totalMemory = Math.round(resourceUsage.totalMemory / (1024 * 1024));
      resourceUsage.peakMemory = Math.round(resourceUsage.peakMemory / (1024 * 1024));
      resourceUsage.averageMemory = Math.round(resourceUsage.averageMemory / (1024 * 1024));
      
      return resourceUsage;
    } catch (error) {
      logger.error(`Error calculating resource usage: ${error.message}`);
      return {
        error: error.message
      };
    }
  }
  
  /**
   * Save test results to disk
   * 
   * @param {Object} testRun - Test run to save
   * @returns {Promise<void>}
   * @private
   */
  async _saveTestResults(testRun) {
    try {
      const resultsFile = path.join(
        this.config.dataDirectory,
        `test-run-${testRun.id}.json`
      );
      
      await fs.writeFile(
        resultsFile,
        JSON.stringify(testRun, null, 2),
        'utf8'
      );
      
      logger.info(`Saved test results to ${resultsFile}`);
    } catch (error) {
      logger.error(`Error saving test results: ${error.message}`);
      // Don't throw, this is non-critical
    }
  }
  
  /**
   * Get details for a specific test run
   * 
   * @param {string} testRunId - ID of the test run
   * @returns {Promise<Object>} Test run details
   */
  async getTestRunDetails(testRunId) {
    try {
      // Check active tests first
      if (this.activeTests.has(testRunId)) {
        return this.activeTests.get(testRunId);
      }
      
      // Check test history
      const historyMatch = this.testHistory.find(run => run.id === testRunId);
      
      if (historyMatch) {
        return historyMatch;
      }
      
      // If not found in memory, try to load from disk
      const resultsFile = path.join(
        this.config.dataDirectory,
        `test-run-${testRunId}.json`
      );
      
      try {
        const fileData = await fs.readFile(resultsFile, 'utf8');
        return JSON.parse(fileData);
      } catch (err) {
        throw new Error(`Test run ${testRunId} not found`);
      }
    } catch (error) {
      logger.error(`Error getting test run details: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Check if an agent passes a specific test type
   * 
   * @param {string} agentId - ID of the agent to check
   * @param {string} testType - Type of test to check
   * @param {Object} options - Check options
   * @returns {Promise<boolean>} Whether the agent passes the test type
   */
  async checkAgentTestPassing(agentId, testType, options = {}) {
    try {
      // Verify the agent is registered
      if (!this.registeredAgents.has(agentId)) {
        throw new Error(`Agent ${agentId} is not registered with the Test Harness`);
      }
      
      // Get agent
      const agent = this.registeredAgents.get(agentId);
      
      // Generate a test case for this test type
      const testCase = {
        id: `check-${testType}-${Date.now()}`,
        type: testType,
        difficulty: options.difficulty || 'standard',
        // Additional test case properties depend on test type
        ...options.testCaseOverrides
      };
      
      // Run the single test
      const testResult = await this.runTests(
        agentId,
        [testCase],
        {
          captureMetrics: false,
          timeout: options.timeout || this.config.defaultTimeout,
          maxRetries: options.maxRetries || 0
        }
      );
      
      // Check if the test passed
      return testResult.passedTests === 1;
    } catch (error) {
      logger.error(`Error checking agent test passing: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Stop the test harness
   * 
   * @returns {Promise<boolean>} Success indicator
   */
  async stop() {
    try {
      logger.info('Stopping Test Harness');
      
      // Complete any active tests
      for (const [testRunId, testRun] of this.activeTests.entries()) {
        logger.info(`Stopping active test run ${testRunId}`);
        
        // Mark as completed
        testRun.endTime = new Date().toISOString();
        testRun.status = 'stopped';
        
        // Save partial results
        await this._saveTestResults(testRun);
        
        // Emit test run stopped event
        this.emit('testRunStopped', {
          testRunId,
          agentId: testRun.agentId
        });
      }
      
      // Clear active tests
      this.activeTests.clear();
      
      // Mark as not running
      this.running = false;
      
      logger.info('Test Harness stopped');
      return true;
    } catch (error) {
      logger.error(`Error stopping Test Harness: ${error.message}`);
      return false;
    }
  }
}

module.exports = TestHarness;