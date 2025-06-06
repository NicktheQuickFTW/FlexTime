/**
 * Evaluation Framework
 * 
 * This module provides a framework for evaluating agent performance across
 * multiple dimensions including accuracy, efficiency, and robustness.
 */

const path = require('path');
const fs = require('fs').promises;
const { EventEmitter } = require('events');
const logger = require("../../lib/logger");;

class EvaluationFramework extends EventEmitter {
  /**
   * Initialize a new Evaluation Framework
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    super();
    
    this.config = {
      // Evaluation metrics
      metrics: config.metrics || ['accuracy', 'efficiency', 'robustness'],
      
      // Baseline comparison
      baselineComparison: config.baselineComparison !== false,
      defaultBaseline: config.defaultBaseline || 'latest',
      
      // Scoring
      scoringMethod: config.scoringMethod || 'weighted',
      weights: config.weights || {
        accuracy: 0.5,
        efficiency: 0.3,
        robustness: 0.2
      },
      
      // Data storage
      dataDirectory: config.dataDirectory || path.join(__dirname, '../../../data/training/evaluations'),
      
      // Grading scale
      gradeScale: config.gradeScale || [
        { grade: 'A+', min: 95 },
        { grade: 'A', min: 90 },
        { grade: 'A-', min: 87 },
        { grade: 'B+', min: 83 },
        { grade: 'B', min: 80 },
        { grade: 'B-', min: 77 },
        { grade: 'C+', min: 73 },
        { grade: 'C', min: 70 },
        { grade: 'C-', min: 67 },
        { grade: 'D+', min: 63 },
        { grade: 'D', min: 60 },
        { grade: 'D-', min: 57 },
        { grade: 'F', min: 0 }
      ],
      
      ...config
    };
    
    // Framework state
    this.initialized = false;
    this.baselines = new Map();
    this.agentEvaluations = new Map();
    this.registeredAgents = new Map();
    
    logger.info('Evaluation Framework initialized');
  }
  
  /**
   * Initialize the evaluation framework
   * 
   * @returns {Promise<boolean>} Success indicator
   */
  async initialize() {
    try {
      logger.info('Initializing Evaluation Framework');
      
      // Create data directory if it doesn't exist
      await fs.mkdir(this.config.dataDirectory, { recursive: true });
      
      // Load existing baselines
      await this._loadBaselines();
      
      this.initialized = true;
      logger.info('Evaluation Framework initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Error initializing Evaluation Framework: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Load existing baselines
   * 
   * @returns {Promise<void>}
   * @private
   */
  async _loadBaselines() {
    try {
      logger.info('Loading baselines');
      
      // Get baseline directory
      const baselineDir = path.join(this.config.dataDirectory, '../baselines');
      
      try {
        // Check if directory exists
        await fs.access(baselineDir);
        
        // Get all baseline files
        const files = await fs.readdir(baselineDir);
        
        // Load each baseline file
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const filePath = path.join(baselineDir, file);
              const fileData = await fs.readFile(filePath, 'utf8');
              const baseline = JSON.parse(fileData);
              
              // Store baseline
              const baselineName = path.basename(file, '.json');
              this.baselines.set(baselineName, baseline);
              
              logger.info(`Loaded baseline: ${baselineName}`);
            } catch (error) {
              logger.error(`Error loading baseline ${file}: ${error.message}`);
            }
          }
        }
        
        logger.info(`Loaded ${this.baselines.size} baselines`);
      } catch (error) {
        logger.warn(`Baseline directory not found: ${baselineDir}`);
        // Not a critical error, just continue without baselines
      }
    } catch (error) {
      logger.error(`Error loading baselines: ${error.message}`);
      // Not a critical error, just continue without baselines
    }
  }
  
  /**
   * Register an agent with the evaluation framework
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
      this.registeredAgents.set(agent.agentId, {
        agentId: agent.agentId,
        agentType: agent.agentType,
        registeredAt: new Date().toISOString()
      });
      
      // Initialize agent evaluations map if needed
      if (!this.agentEvaluations.has(agent.agentId)) {
        this.agentEvaluations.set(agent.agentId, []);
      }
      
      logger.info(`Registered agent ${agent.agentId} with Evaluation Framework`);
      
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
   * Register a baseline with the evaluation framework
   * 
   * @param {string} baselineName - Name of the baseline
   * @param {Object} baselineData - Baseline data
   * @returns {Promise<boolean>} Success indicator
   */
  async registerBaseline(baselineName, baselineData) {
    try {
      // Store baseline
      this.baselines.set(baselineName, baselineData);
      
      logger.info(`Registered baseline: ${baselineName}`);
      
      // Emit baseline registered event
      this.emit('baselineRegistered', {
        baselineName,
        timestamp: baselineData.timestamp
      });
      
      return true;
    } catch (error) {
      logger.error(`Error registering baseline: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Evaluate test results for an agent
   * 
   * @param {string} agentId - ID of the agent to evaluate
   * @param {Object} testResults - Results from test runs
   * @param {Object} options - Evaluation options
   * @returns {Promise<Object>} Evaluation results
   */
  async evaluateResults(agentId, testResults, options = {}) {
    try {
      // Ensure the framework is initialized
      if (!this.initialized) {
        await this.initialize();
      }
      
      logger.info(`Evaluating results for agent ${agentId}`);
      
      // Get evaluation options
      const metrics = options.metrics || this.config.metrics;
      const compareToBaseline = options.compareToBaseline !== undefined ? 
        options.compareToBaseline : this.config.baselineComparison;
      const baselineName = options.baselineName || this.config.defaultBaseline;
      
      // Evaluation data structure
      const evaluation = {
        agentId,
        timestamp: new Date().toISOString(),
        metrics: {},
        summary: {},
        improvement: null,
        grade: null,
        issues: []
      };
      
      // Calculate metrics
      for (const metric of metrics) {
        try {
          // Calculate specific metric based on metric type
          const metricResult = await this._calculateMetric(
            metric,
            testResults,
            agentId,
            options
          );
          
          evaluation.metrics[metric] = metricResult;
          
          // Store summary data
          if (metricResult) {
            if (typeof metricResult === 'number') {
              evaluation.summary[metric] = metricResult;
            } else if (typeof metricResult === 'object' && metricResult.score !== undefined) {
              evaluation.summary[metric] = metricResult.score;
            }
          }
        } catch (error) {
          logger.error(`Error calculating ${metric} metric: ${error.message}`);
          evaluation.issues.push(`Error calculating ${metric} metric: ${error.message}`);
        }
      }
      
      // Compare to baseline if requested
      if (compareToBaseline) {
        try {
          const comparisonResult = await this._compareToBaseline(
            agentId,
            evaluation.metrics,
            baselineName
          );
          
          evaluation.baselineComparison = comparisonResult.comparison;
          evaluation.improvement = comparisonResult.improvement;
        } catch (error) {
          logger.error(`Error comparing to baseline: ${error.message}`);
          evaluation.issues.push(`Error comparing to baseline: ${error.message}`);
        }
      }
      
      // Calculate overall score
      try {
        const overallScore = this._calculateOverallScore(
          evaluation.metrics,
          options.weights || this.config.weights,
          options.scoringMethod || this.config.scoringMethod
        );
        
        evaluation.score = overallScore;
        
        // Assign grade
        evaluation.grade = this._assignGrade(overallScore);
      } catch (error) {
        logger.error(`Error calculating overall score: ${error.message}`);
        evaluation.issues.push(`Error calculating overall score: ${error.message}`);
      }
      
      // Store evaluation
      this._storeEvaluation(agentId, evaluation);
      
      // Save evaluation to disk
      await this._saveEvaluation(agentId, evaluation);
      
      logger.info(`Completed evaluation for agent ${agentId} with score: ${evaluation.score?.toFixed(2) || 'N/A'}`);
      
      return evaluation;
    } catch (error) {
      logger.error(`Error evaluating results for agent ${agentId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Calculate a specific metric
   * 
   * @param {string} metric - Metric to calculate
   * @param {Object} testResults - Test results
   * @param {string} agentId - Agent ID
   * @param {Object} options - Calculation options
   * @returns {Promise<any>} Metric result
   * @private
   */
  async _calculateMetric(metric, testResults, agentId, options = {}) {
    // Calculate different metrics based on metric type
    switch (metric.toLowerCase()) {
      case 'accuracy':
        return this._calculateAccuracy(testResults, options);
        
      case 'efficiency':
        return this._calculateEfficiency(testResults, options);
        
      case 'robustness':
        return this._calculateRobustness(testResults, options);
        
      case 'responsiveness':
        return this._calculateResponsiveness(testResults, options);
        
      case 'resourceusage':
      case 'resource_usage':
        return this._calculateResourceUsage(testResults, options);
        
      case 'reliability':
        return this._calculateReliability(testResults, options);
        
      case 'complexity':
        return this._calculateComplexity(testResults, options);
        
      default:
        logger.warn(`Unknown metric: ${metric}`);
        return null;
    }
  }
  
  /**
   * Calculate accuracy metric
   * 
   * @param {Object} testResults - Test results
   * @param {Object} options - Calculation options
   * @returns {Object} Accuracy metric
   * @private
   */
  _calculateAccuracy(testResults, options = {}) {
    // Extract relevant data from test results
    const { passedTests = 0, totalTests = 0 } = testResults;
    
    // Calculate basic accuracy as percentage of passed tests
    const basicAccuracy = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    
    // Calculate accuracy score
    let accuracyScore = basicAccuracy;
    
    // Adjust score based on test difficulty if available
    if (testResults.results && Array.isArray(testResults.results)) {
      let difficultyAdjustment = 0;
      let difficultyTestCount = 0;
      
      // Calculate adjustment based on passed difficult tests
      for (const result of testResults.results) {
        if (result.testCase && result.testCase.difficulty) {
          difficultyTestCount++;
          
          if (result.status === 'passed') {
            switch (result.testCase.difficulty) {
              case 'basic':
                // No additional points for basic tests
                break;
                
              case 'standard':
                difficultyAdjustment += 0.5;
                break;
                
              case 'challenging':
                difficultyAdjustment += 1.0;
                break;
                
              case 'extreme':
                difficultyAdjustment += 2.0;
                break;
            }
          }
        }
      }
      
      // Apply difficulty adjustment (max 10 points)
      if (difficultyTestCount > 0) {
        const maxAdjustment = 10;
        const adjustment = Math.min(
          (difficultyAdjustment / difficultyTestCount) * maxAdjustment,
          maxAdjustment
        );
        
        // Only add adjustment if base accuracy is good
        if (basicAccuracy >= 70) {
          accuracyScore = Math.min(100, basicAccuracy + adjustment);
        }
      }
    }
    
    return {
      score: accuracyScore,
      basicAccuracy,
      details: {
        passedTests,
        totalTests,
        successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0
      }
    };
  }
  
  /**
   * Calculate efficiency metric
   * 
   * @param {Object} testResults - Test results
   * @param {Object} options - Calculation options
   * @returns {Object} Efficiency metric
   * @private
   */
  _calculateEfficiency(testResults, options = {}) {
    // Extract relevant data from test results
    const { averageDuration = 0 } = testResults;
    
    // Base efficiency is calculated as response time efficiency
    // Lower durations are better, we'll use a scale where:
    // - Under 100ms is excellent (90-100 points)
    // - 100-500ms is good (70-90 points)
    // - 500-1000ms is acceptable (50-70 points)
    // - 1000-5000ms is slow (30-50 points)
    // - Over 5000ms is poor (0-30 points)
    
    let timeScore;
    
    if (averageDuration < 100) {
      timeScore = 90 + (100 - averageDuration) / 10; // 90-100
    } else if (averageDuration < 500) {
      timeScore = 70 + (500 - averageDuration) / 20; // 70-90
    } else if (averageDuration < 1000) {
      timeScore = 50 + (1000 - averageDuration) / 25; // 50-70
    } else if (averageDuration < 5000) {
      timeScore = 30 + (5000 - averageDuration) / 200; // 30-50
    } else {
      timeScore = Math.max(0, 30 - (averageDuration - 5000) / 1000); // 0-30
    }
    
    // Cap the score at 100
    timeScore = Math.min(100, timeScore);
    
    // If resource usage data is available, factor it into the efficiency score
    let resourceScore = 100;
    
    if (testResults.resourceUsage) {
      const { averageMemory = 0, averageCpu = 0 } = testResults.resourceUsage;
      
      // Memory score (lower is better)
      // Scale: 0-500MB excellent, 500-1000MB good, 1000-2000MB fair, 2000MB+ poor
      let memoryScore;
      
      if (averageMemory < 100) {
        memoryScore = 90 + (100 - averageMemory) / 10; // 90-100
      } else if (averageMemory < 500) {
        memoryScore = 75 + (500 - averageMemory) / 20; // 75-90
      } else if (averageMemory < 1000) {
        memoryScore = 60 + (1000 - averageMemory) / 25; // 60-75
      } else if (averageMemory < 2000) {
        memoryScore = 40 + (2000 - averageMemory) / 50; // 40-60
      } else {
        memoryScore = Math.max(0, 40 - (averageMemory - 2000) / 200); // 0-40
      }
      
      // CPU score is harder to standardize, we'll use a relative approach
      // where lower CPU usage is better
      let cpuScore = 100;
      
      if (averageCpu) {
        // Simple scoring: higher CPU usage = lower score
        // This is very simplified and should be adjusted for your specific environment
        cpuScore = Math.max(0, 100 - (averageCpu / 10000) * 100);
      }
      
      // Combine memory and CPU scores
      resourceScore = memoryScore * 0.7 + cpuScore * 0.3;
    }
    
    // Final efficiency score combines time and resource scores
    const efficiencyScore = timeScore * 0.6 + resourceScore * 0.4;
    
    return {
      score: efficiencyScore,
      details: {
        timeScore,
        resourceScore,
        averageDuration,
        resourceUsage: testResults.resourceUsage
      }
    };
  }
  
  /**
   * Calculate robustness metric
   * 
   * @param {Object} testResults - Test results
   * @param {Object} options - Calculation options
   * @returns {Object} Robustness metric
   * @private
   */
  _calculateRobustness(testResults, options = {}) {
    // Extract relevant data from test results
    const { passedTests = 0, totalTests = 0, results = [] } = testResults;
    
    // Base robustness is calculated as the success rate for error handling tests
    let errorHandlingTests = 0;
    let passedErrorTests = 0;
    let edgeCaseTests = 0;
    let passedEdgeCaseTests = 0;
    
    // Calculate error handling performance
    for (const result of Array.isArray(results) ? results : []) {
      // Check for error handling tests
      if (result.testCase && 
          result.testCase.type === 'error_handling') {
        errorHandlingTests++;
        
        if (result.status === 'passed') {
          passedErrorTests++;
        }
      }
      
      // Check for edge case tests
      if (result.testCase && 
          result.testCase.testSet === 'edge_cases') {
        edgeCaseTests++;
        
        if (result.status === 'passed') {
          passedEdgeCaseTests++;
        }
      }
    }
    
    // Calculate scores for different aspects of robustness
    const errorHandlingScore = errorHandlingTests > 0 ? 
      (passedErrorTests / errorHandlingTests) * 100 : 0;
    
    const edgeCaseScore = edgeCaseTests > 0 ? 
      (passedEdgeCaseTests / edgeCaseTests) * 100 : 0;
    
    // Check retry success
    let retrySuccessScore = 0;
    let retryTests = 0;
    
    for (const result of Array.isArray(results) ? results : []) {
      if (result.retries && result.retries > 0 && result.status === 'passed') {
        retryTests++;
        retrySuccessScore += 100;
      } else if (result.retries && result.retries > 0) {
        retryTests++;
      }
    }
    
    // Calculate retry success rate
    retrySuccessScore = retryTests > 0 ? retrySuccessScore / retryTests : 0;
    
    // Calculate overall robustness score
    // If we don't have specific tests, fall back to overall success rate with a penalty
    let robustnessScore;
    
    if (errorHandlingTests > 0 || edgeCaseTests > 0) {
      // Weight the scores based on test counts
      const totalSpecificTests = errorHandlingTests + edgeCaseTests;
      
      if (totalSpecificTests > 0) {
        robustnessScore = 
          (errorHandlingScore * errorHandlingTests + edgeCaseScore * edgeCaseTests) / 
          totalSpecificTests;
      } else {
        // Fall back to overall success rate with 20% penalty
        robustnessScore = Math.max(0, (passedTests / totalTests) * 100 - 20);
      }
      
      // Factor in retry success if available
      if (retryTests > 0) {
        robustnessScore = robustnessScore * 0.8 + retrySuccessScore * 0.2;
      }
    } else {
      // No specific robustness tests found
      // Fall back to overall success rate with 20% penalty
      robustnessScore = Math.max(0, (passedTests / totalTests) * 100 - 20);
    }
    
    return {
      score: robustnessScore,
      details: {
        errorHandling: {
          tests: errorHandlingTests,
          passed: passedErrorTests,
          score: errorHandlingScore
        },
        edgeCases: {
          tests: edgeCaseTests,
          passed: passedEdgeCaseTests,
          score: edgeCaseScore
        },
        retries: {
          tests: retryTests,
          score: retrySuccessScore
        }
      }
    };
  }
  
  /**
   * Calculate responsiveness metric
   * 
   * @param {Object} testResults - Test results
   * @param {Object} options - Calculation options
   * @returns {Object} Responsiveness metric
   * @private
   */
  _calculateResponsiveness(testResults, options = {}) {
    // Extract relevant data from test results
    const { results = [] } = testResults;
    
    // Responsiveness is measured by how quickly the agent responds to requests
    let totalResponseTime = 0;
    let fastResponses = 0;
    let mediumResponses = 0;
    let slowResponses = 0;
    let timeoutResponses = 0;
    let responseCount = 0;
    
    // Calculate response times
    for (const result of Array.isArray(results) ? results : []) {
      if (result.duration !== undefined) {
        totalResponseTime += result.duration;
        responseCount++;
        
        // Categorize responses
        if (result.status === 'timeout') {
          timeoutResponses++;
        } else if (result.duration < 200) {
          fastResponses++;
        } else if (result.duration < 1000) {
          mediumResponses++;
        } else {
          slowResponses++;
        }
      }
    }
    
    // Calculate average response time
    const averageResponseTime = responseCount > 0 ? 
      totalResponseTime / responseCount : 0;
    
    // Calculate responsiveness score
    // Base score on average response time
    let responsivenessScore;
    
    if (averageResponseTime < 100) {
      responsivenessScore = 95; // Excellent
    } else if (averageResponseTime < 200) {
      responsivenessScore = 90; // Very good
    } else if (averageResponseTime < 500) {
      responsivenessScore = 80; // Good
    } else if (averageResponseTime < 1000) {
      responsivenessScore = 60; // Acceptable
    } else if (averageResponseTime < 2000) {
      responsivenessScore = 40; // Slow
    } else {
      responsivenessScore = 20; // Very slow
    }
    
    // Penalize for timeouts
    if (timeoutResponses > 0) {
      const timeoutPenalty = (timeoutResponses / responseCount) * 100;
      responsivenessScore = Math.max(0, responsivenessScore - timeoutPenalty);
    }
    
    // Boost score if most responses are fast
    if (responseCount > 0 && fastResponses / responseCount > 0.8) {
      responsivenessScore = Math.min(100, responsivenessScore + 5);
    }
    
    return {
      score: responsivenessScore,
      details: {
        averageResponseTime,
        responseCount,
        fastResponses,
        mediumResponses,
        slowResponses,
        timeoutResponses
      }
    };
  }
  
  /**
   * Calculate resource usage metric
   * 
   * @param {Object} testResults - Test results
   * @param {Object} options - Calculation options
   * @returns {Object} Resource usage metric
   * @private
   */
  _calculateResourceUsage(testResults, options = {}) {
    // Extract relevant data from test results
    const resourceUsage = testResults.resourceUsage || {};
    
    // Resource usage is measured by memory and CPU consumption
    const { totalMemory = 0, peakMemory = 0, averageMemory = 0, 
      totalCpu = 0, averageCpu = 0 } = resourceUsage;
    
    // Calculate memory score (lower is better)
    // Scale: 0-500MB excellent, 500-1000MB good, 1000-2000MB fair, 2000MB+ poor
    let memoryScore;
    
    if (averageMemory < 100) {
      memoryScore = 95; // Excellent
    } else if (averageMemory < 500) {
      memoryScore = 85; // Very good
    } else if (averageMemory < 1000) {
      memoryScore = 70; // Good
    } else if (averageMemory < 2000) {
      memoryScore = 50; // Fair
    } else {
      memoryScore = Math.max(20, 50 - (averageMemory - 2000) / 100); // Poor
    }
    
    // CPU score is harder to standardize, we'll use a relative approach
    let cpuScore = 80; // Default to good
    
    if (averageCpu) {
      // Simple scoring: higher CPU usage = lower score
      // This is simplified and should be adjusted for your specific environment
      cpuScore = Math.max(20, 100 - (averageCpu / 10000) * 100);
    }
    
    // Calculate peak usage penalty
    // Penalize if peak memory is much higher than average (spikes)
    let peakPenalty = 0;
    
    if (peakMemory > averageMemory * 2) {
      peakPenalty = 10; // Significant peak
    } else if (peakMemory > averageMemory * 1.5) {
      peakPenalty = 5; // Moderate peak
    }
    
    // Overall resource usage score
    const resourceUsageScore = 
      (memoryScore * 0.6 + cpuScore * 0.4) - peakPenalty;
    
    return {
      score: resourceUsageScore,
      details: {
        memoryScore,
        cpuScore,
        peakPenalty,
        averageMemory,
        peakMemory,
        averageCpu
      }
    };
  }
  
  /**
   * Calculate reliability metric
   * 
   * @param {Object} testResults - Test results
   * @param {Object} options - Calculation options
   * @returns {Object} Reliability metric
   * @private
   */
  _calculateReliability(testResults, options = {}) {
    // Extract relevant data from test results
    const { passedTests = 0, totalTests = 0, results = [] } = testResults;
    
    // Base reliability on success rate
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    
    // Count errors by type
    let criticalErrors = 0;
    let majorErrors = 0;
    let minorErrors = 0;
    
    for (const result of Array.isArray(results) ? results : []) {
      if (result.status === 'failed') {
        // Check error severity if available
        if (result.testCase && result.testCase.errorScenario && 
            result.testCase.errorScenario.severity) {
          switch (result.testCase.errorScenario.severity) {
            case 'critical':
              criticalErrors++;
              break;
              
            case 'major':
              majorErrors++;
              break;
              
            case 'minor':
              minorErrors++;
              break;
              
            default:
              // Default to major if unknown
              majorErrors++;
          }
        } else {
          // Default to major if severity not specified
          majorErrors++;
        }
      }
    }
    
    // Calculate error penalty
    // Critical errors have higher impact than minor ones
    const errorPenalty = 
      (criticalErrors * 10 + majorErrors * 5 + minorErrors * 2) / 
      Math.max(1, totalTests) * 10;
    
    // Calculate reliability score with error penalty
    const reliabilityScore = Math.max(0, successRate - errorPenalty);
    
    return {
      score: reliabilityScore,
      details: {
        successRate,
        errorPenalty,
        criticalErrors,
        majorErrors,
        minorErrors
      }
    };
  }
  
  /**
   * Calculate complexity handling metric
   * 
   * @param {Object} testResults - Test results
   * @param {Object} options - Calculation options
   * @returns {Object} Complexity metric
   * @private
   */
  _calculateComplexity(testResults, options = {}) {
    // Extract relevant data from test results
    const { results = [] } = testResults;
    
    // Evaluate how well the agent handles tests of different complexity
    let basicTests = 0;
    let standardTests = 0;
    let challengingTests = 0;
    let extremeTests = 0;
    
    let passedBasic = 0;
    let passedStandard = 0;
    let passedChallenging = 0;
    let passedExtreme = 0;
    
    // Count tests and passes by difficulty
    for (const result of Array.isArray(results) ? results : []) {
      if (result.testCase && result.testCase.difficulty) {
        switch (result.testCase.difficulty) {
          case 'basic':
            basicTests++;
            if (result.status === 'passed') passedBasic++;
            break;
            
          case 'standard':
            standardTests++;
            if (result.status === 'passed') passedStandard++;
            break;
            
          case 'challenging':
            challengingTests++;
            if (result.status === 'passed') passedChallenging++;
            break;
            
          case 'extreme':
            extremeTests++;
            if (result.status === 'passed') passedExtreme++;
            break;
        }
      }
    }
    
    // Calculate success rates for each difficulty level
    const basicRate = basicTests > 0 ? (passedBasic / basicTests) * 100 : 0;
    const standardRate = standardTests > 0 ? (passedStandard / standardTests) * 100 : 0;
    const challengingRate = challengingTests > 0 ? (passedChallenging / challengingTests) * 100 : 0;
    const extremeRate = extremeTests > 0 ? (passedExtreme / extremeTests) * 100 : 0;
    
    // Higher weights for more difficult tests to reward handling complexity
    const weights = {
      basic: 0.1,
      standard: 0.2,
      challenging: 0.3,
      extreme: 0.4
    };
    
    // Calculate weighted success rate based on test difficulty
    let weightSum = 0;
    let weightedScore = 0;
    
    if (basicTests > 0) {
      weightSum += weights.basic;
      weightedScore += basicRate * weights.basic;
    }
    
    if (standardTests > 0) {
      weightSum += weights.standard;
      weightedScore += standardRate * weights.standard;
    }
    
    if (challengingTests > 0) {
      weightSum += weights.challenging;
      weightedScore += challengingRate * weights.challenging;
    }
    
    if (extremeTests > 0) {
      weightSum += weights.extreme;
      weightedScore += extremeRate * weights.extreme;
    }
    
    // Calculate final complexity score
    const complexityScore = weightSum > 0 ? weightedScore / weightSum : 0;
    
    return {
      score: complexityScore,
      details: {
        basic: {
          tests: basicTests,
          passed: passedBasic,
          rate: basicRate
        },
        standard: {
          tests: standardTests,
          passed: passedStandard,
          rate: standardRate
        },
        challenging: {
          tests: challengingTests,
          passed: passedChallenging,
          rate: challengingRate
        },
        extreme: {
          tests: extremeTests,
          passed: passedExtreme,
          rate: extremeRate
        }
      }
    };
  }
  
  /**
   * Compare evaluation to a baseline
   * 
   * @param {string} agentId - Agent ID
   * @param {Object} metrics - Current evaluation metrics
   * @param {string} baselineName - Name of baseline to compare against
   * @returns {Promise<Object>} Comparison results
   * @private
   */
  async _compareToBaseline(agentId, metrics, baselineName) {
    try {
      // Get baseline
      let baseline;
      
      if (baselineName === 'latest') {
        // Find the most recent baseline
        const sortedBaselines = Array.from(this.baselines.entries())
          .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp));
        
        if (sortedBaselines.length > 0) {
          baselineName = sortedBaselines[0][0];
          baseline = sortedBaselines[0][1];
        } else {
          throw new Error('No baselines available');
        }
      } else {
        // Get specific baseline
        baseline = this.baselines.get(baselineName);
        
        if (!baseline) {
          throw new Error(`Baseline ${baselineName} not found`);
        }
      }
      
      // Get agent baseline
      const agentBaseline = baseline.agentBaselines[agentId];
      
      if (!agentBaseline) {
        throw new Error(`No baseline data for agent ${agentId}`);
      }
      
      // Compare each metric
      const comparison = {};
      const improvements = {};
      
      for (const metricName in metrics) {
        // Skip if the metric doesn't exist in the baseline
        if (!agentBaseline.metrics[metricName]) {
          continue;
        }
        
        const currentMetric = metrics[metricName];
        const baselineMetric = agentBaseline.metrics[metricName];
        
        // Skip if missing score
        if (!currentMetric || !baselineMetric) {
          continue;
        }
        
        // Get scores
        const currentScore = typeof currentMetric === 'object' ? 
          currentMetric.score : currentMetric;
        
        const baselineScore = typeof baselineMetric === 'object' ? 
          baselineMetric.score : baselineMetric;
        
        // Calculate difference
        const difference = currentScore - baselineScore;
        
        // Calculate percentage improvement
        const percentImprovement = baselineScore !== 0 ? 
          (difference / baselineScore) * 100 : difference > 0 ? 100 : 0;
        
        comparison[metricName] = {
          current: currentScore,
          baseline: baselineScore,
          difference,
          percentImprovement
        };
        
        improvements[metricName] = percentImprovement;
      }
      
      // Calculate overall improvement
      const metricCount = Object.keys(improvements).length;
      let overallImprovement = 0;
      
      if (metricCount > 0) {
        overallImprovement = Object.values(improvements)
          .reduce((sum, value) => sum + value, 0) / metricCount;
      }
      
      return {
        comparison,
        baseline: {
          name: baselineName,
          timestamp: baseline.timestamp
        },
        improvement: overallImprovement
      };
    } catch (error) {
      logger.error(`Error comparing to baseline: ${error.message}`);
      
      // Return a default result
      return {
        comparison: {},
        baseline: {
          name: baselineName,
          error: error.message
        },
        improvement: 0
      };
    }
  }
  
  /**
   * Calculate overall score from metrics
   * 
   * @param {Object} metrics - Evaluation metrics
   * @param {Object} weights - Metric weights
   * @param {string} method - Scoring method
   * @returns {number} Overall score
   * @private
   */
  _calculateOverallScore(metrics, weights, method = 'weighted') {
    try {
      switch (method) {
        case 'weighted':
          // Weighted average of metrics
          let totalWeight = 0;
          let weightedSum = 0;
          
          for (const [metric, value] of Object.entries(metrics)) {
            // Skip metrics without a score
            if (!value) continue;
            
            // Get the weight for this metric
            const weight = weights[metric] || 1;
            totalWeight += weight;
            
            // Get the score
            const score = typeof value === 'object' ? value.score : value;
            
            // Add to weighted sum
            weightedSum += score * weight;
          }
          
          return totalWeight > 0 ? weightedSum / totalWeight : 0;
          
        case 'average':
          // Simple average of all metrics
          const scores = Object.values(metrics)
            .filter(value => value !== null && value !== undefined)
            .map(value => typeof value === 'object' ? value.score : value);
          
          return scores.length > 0 ? 
            scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
          
        case 'minimum':
          // Minimum score across all metrics
          const minScores = Object.values(metrics)
            .filter(value => value !== null && value !== undefined)
            .map(value => typeof value === 'object' ? value.score : value);
          
          return minScores.length > 0 ? Math.min(...minScores) : 0;
          
        default:
          // Default to weighted
          return this._calculateOverallScore(metrics, weights, 'weighted');
      }
    } catch (error) {
      logger.error(`Error calculating overall score: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Assign a grade based on score
   * 
   * @param {number} score - Numeric score
   * @returns {string} Letter grade
   * @private
   */
  _assignGrade(score) {
    // Find the appropriate grade based on the score
    for (const grade of this.config.gradeScale) {
      if (score >= grade.min) {
        return grade.grade;
      }
    }
    
    // Default to F if no grade matched
    return 'F';
  }
  
  /**
   * Store an evaluation result
   * 
   * @param {string} agentId - Agent ID
   * @param {Object} evaluation - Evaluation result
   * @private
   */
  _storeEvaluation(agentId, evaluation) {
    try {
      // Initialize agent evaluations map if needed
      if (!this.agentEvaluations.has(agentId)) {
        this.agentEvaluations.set(agentId, []);
      }
      
      // Add evaluation to the agent's history
      const evaluations = this.agentEvaluations.get(agentId);
      evaluations.push(evaluation);
      
      // Limit history size if needed
      if (evaluations.length > 100) {
        evaluations.shift(); // Remove oldest evaluation
      }
      
      // Emit evaluation stored event
      this.emit('evaluationStored', {
        agentId,
        timestamp: evaluation.timestamp,
        score: evaluation.score
      });
    } catch (error) {
      logger.error(`Error storing evaluation: ${error.message}`);
    }
  }
  
  /**
   * Save evaluation to disk
   * 
   * @param {string} agentId - Agent ID
   * @param {Object} evaluation - Evaluation result
   * @returns {Promise<void>}
   * @private
   */
  async _saveEvaluation(agentId, evaluation) {
    try {
      // Create agent directory if it doesn't exist
      const agentDir = path.join(this.config.dataDirectory, agentId);
      await fs.mkdir(agentDir, { recursive: true });
      
      // Generate file name based on timestamp
      const timestamp = new Date(evaluation.timestamp)
        .toISOString()
        .replace(/:/g, '-')
        .replace(/\..+/, '');
      
      const fileName = `evaluation-${timestamp}.json`;
      const filePath = path.join(agentDir, fileName);
      
      // Write evaluation to file
      await fs.writeFile(
        filePath,
        JSON.stringify(evaluation, null, 2),
        'utf8'
      );
      
      logger.info(`Saved evaluation to ${filePath}`);
    } catch (error) {
      logger.error(`Error saving evaluation: ${error.message}`);
    }
  }
  
  /**
   * Get evaluations for an agent
   * 
   * @param {string} agentId - Agent ID
   * @param {Object} options - Query options
   * @returns {Promise<Array<Object>>} Evaluation results
   */
  async getAgentEvaluations(agentId, options = {}) {
    try {
      const limit = options.limit || 10;
      const skip = options.skip || 0;
      
      // Get evaluations from memory
      if (this.agentEvaluations.has(agentId)) {
        const evaluations = this.agentEvaluations.get(agentId);
        
        // Sort by timestamp (newest first)
        const sortedEvaluations = [...evaluations]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Apply skip and limit
        return sortedEvaluations.slice(skip, skip + limit);
      }
      
      // If not in memory, try to load from disk
      const agentDir = path.join(this.config.dataDirectory, agentId);
      
      try {
        await fs.access(agentDir);
        
        // Get all evaluation files
        const files = await fs.readdir(agentDir);
        
        // Filter for evaluation files
        const evaluationFiles = files
          .filter(file => file.startsWith('evaluation-') && file.endsWith('.json'))
          .sort((a, b) => b.localeCompare(a)); // Sort by name (newest first)
        
        // Apply skip and limit
        const selectedFiles = evaluationFiles.slice(skip, skip + limit);
        
        // Load evaluations
        const evaluations = [];
        
        for (const file of selectedFiles) {
          try {
            const filePath = path.join(agentDir, file);
            const fileData = await fs.readFile(filePath, 'utf8');
            evaluations.push(JSON.parse(fileData));
          } catch (error) {
            logger.error(`Error loading evaluation ${file}: ${error.message}`);
          }
        }
        
        return evaluations;
      } catch (error) {
        logger.warn(`Agent directory not found: ${agentDir}`);
        return [];
      }
    } catch (error) {
      logger.error(`Error getting agent evaluations: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get the latest evaluation for an agent
   * 
   * @param {string} agentId - Agent ID
   * @returns {Promise<Object|null>} Latest evaluation or null if none found
   */
  async getLatestEvaluation(agentId) {
    try {
      // Get evaluations (limited to 1)
      const evaluations = await this.getAgentEvaluations(agentId, { limit: 1 });
      
      return evaluations.length > 0 ? evaluations[0] : null;
    } catch (error) {
      logger.error(`Error getting latest evaluation: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Stop the evaluation framework
   * 
   * @returns {Promise<boolean>} Success indicator
   */
  async stop() {
    try {
      logger.info('Stopping Evaluation Framework');
      
      // No active resources to clean up
      
      logger.info('Evaluation Framework stopped');
      return true;
    } catch (error) {
      logger.error(`Error stopping Evaluation Framework: ${error.message}`);
      return false;
    }
  }
}

module.exports = EvaluationFramework;