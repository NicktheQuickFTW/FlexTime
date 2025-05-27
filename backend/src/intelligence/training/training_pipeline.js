/**
 * Agent Training Pipeline
 * 
 * This module implements a comprehensive training pipeline for FlexTime agents.
 * It coordinates test harness, simulation, evaluation, and optimization components
 * to systematically improve agent performance over time.
 */

const path = require('path');
const fs = require('fs').promises;
const { EventEmitter } = require('events');
const logger = require('../../utils/logger');

// Import training system components
const TestHarness = require('./test_harness/test_harness');
const SimulationEngine = require('./simulation/simulation_engine');
const EvaluationFramework = require('./evaluation/evaluation_framework');
const OptimizationSystem = require('./optimization/optimization_system');

class TrainingPipeline extends EventEmitter {
  /**
   * Create a new Training Pipeline
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    super();
    
    this.config = {
      // Agent configuration
      agents: config.agents || [],
      agentFactoryFunction: config.agentFactoryFunction,
      
      // Test configuration
      testSets: config.testSets || ['basic'],
      testCasesPerSet: config.testCasesPerSet || 50,
      maxParallelTests: config.maxParallelTests || 4,
      
      // Evaluation configuration
      evaluationMetrics: config.evaluationMetrics || ['accuracy', 'efficiency', 'robustness'],
      baselineComparison: config.baselineComparison !== false,
      
      // Optimization configuration
      optimizationTargets: config.optimizationTargets || ['parameters'],
      optimizationStrategy: config.optimizationStrategy || 'incremental',
      
      // Data storage
      dataDirectory: config.dataDirectory || path.join(__dirname, '../../data/training'),
      resultsRetention: config.resultsRetention || 90, // days
      
      // General pipeline settings
      continuousMode: config.continuousMode || false,
      notificationTargets: config.notificationTargets || [],
      
      ...config
    };
    
    // Initialize components
    this.testHarness = new TestHarness({
      maxParallelTests: this.config.maxParallelTests,
      dataDirectory: path.join(this.config.dataDirectory, 'test_results')
    });
    
    this.simulationEngine = new SimulationEngine({
      dataDirectory: path.join(this.config.dataDirectory, 'simulations')
    });
    
    this.evaluationFramework = new EvaluationFramework({
      metrics: this.config.evaluationMetrics,
      baselineComparison: this.config.baselineComparison,
      dataDirectory: path.join(this.config.dataDirectory, 'evaluations')
    });
    
    this.optimizationSystem = new OptimizationSystem({
      targets: this.config.optimizationTargets,
      strategy: this.config.optimizationStrategy,
      dataDirectory: path.join(this.config.dataDirectory, 'optimizations')
    });
    
    // Pipeline state
    this.running = false;
    this.currentCycle = 0;
    this.results = {
      cycles: [],
      overallImprovement: null
    };
    
    logger.info('Training Pipeline initialized');
  }
  
  /**
   * Initialize the training pipeline
   * 
   * @returns {Promise<boolean>} Success indicator
   */
  async initialize() {
    try {
      logger.info('Initializing Training Pipeline');
      
      // Create data directories
      await this._createDataDirectories();
      
      // Initialize components
      await this.testHarness.initialize();
      await this.simulationEngine.initialize();
      await this.evaluationFramework.initialize();
      await this.optimizationSystem.initialize();
      
      // Register agents
      if (this.config.agents.length > 0) {
        for (const agent of this.config.agents) {
          this.registerAgent(agent);
        }
      }
      
      logger.info('Training Pipeline initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Error initializing Training Pipeline: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Create necessary data directories
   * 
   * @returns {Promise<void>}
   * @private
   */
  async _createDataDirectories() {
    try {
      const directories = [
        this.config.dataDirectory,
        path.join(this.config.dataDirectory, 'test_results'),
        path.join(this.config.dataDirectory, 'simulations'),
        path.join(this.config.dataDirectory, 'evaluations'),
        path.join(this.config.dataDirectory, 'optimizations'),
        path.join(this.config.dataDirectory, 'baselines'),
        path.join(this.config.dataDirectory, 'reports')
      ];
      
      for (const dir of directories) {
        await fs.mkdir(dir, { recursive: true });
      }
    } catch (error) {
      logger.error(`Error creating data directories: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Register an agent with the training pipeline
   * 
   * @param {Object} agent - Agent to register
   * @returns {Promise<boolean>} Success indicator
   */
  async registerAgent(agent) {
    try {
      // Register with test harness
      await this.testHarness.registerAgent(agent);
      
      // Register with evaluation framework
      await this.evaluationFramework.registerAgent(agent);
      
      // Register with optimization system
      await this.optimizationSystem.registerAgent(agent);
      
      logger.info(`Registered agent ${agent.agentId} with training pipeline`);
      return true;
    } catch (error) {
      logger.error(`Error registering agent ${agent?.agentId || 'unknown'}: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Run a single training cycle
   * 
   * @param {Object} options - Cycle options
   * @returns {Promise<Object>} Cycle results
   */
  async runCycle(options = {}) {
    try {
      const cycleNumber = options.cycleNumber || this.currentCycle + 1;
      const agentIds = options.agentIds || this.testHarness.getRegisteredAgentIds();
      const testSets = options.testSets || this.config.testSets;
      
      logger.info(`Starting training cycle ${cycleNumber} for ${agentIds.length} agents`);
      
      const cycleStart = Date.now();
      const cycleResults = {
        cycleNumber,
        timestamp: new Date().toISOString(),
        duration: null,
        agentResults: {},
        overallImprovement: null
      };
      
      // Run cycle for each agent
      for (const agentId of agentIds) {
        logger.info(`Training agent ${agentId} (cycle ${cycleNumber})`);
        
        try {
          // Get agent from test harness
          const agent = this.testHarness.getAgent(agentId);
          
          if (!agent) {
            logger.warn(`Agent ${agentId} not found, skipping`);
            continue;
          }
          
          // 1. Generate simulations based on agent type
          const simulations = await this.simulationEngine.generateSimulations(
            agent.agentType,
            {
              testSets,
              casesPerSet: options.testCasesPerSet || this.config.testCasesPerSet,
              difficulty: options.difficulty || 'adaptive'
            }
          );
          
          // 2. Run test harness with simulations
          const testResults = await this.testHarness.runTests(
            agentId,
            simulations,
            {
              parallelTests: options.parallelTests || this.config.maxParallelTests,
              timeout: options.timeout || 60000,
              captureMetrics: true
            }
          );
          
          // 3. Evaluate test results
          const evaluationResults = await this.evaluationFramework.evaluateResults(
            agentId,
            testResults,
            {
              metrics: options.metrics || this.config.evaluationMetrics,
              compareToBaseline: options.compareToBaseline !== false && this.config.baselineComparison
            }
          );
          
          // 4. Optimize agent based on evaluation
          const optimizationResults = await this.optimizationSystem.optimizeAgent(
            agent,
            evaluationResults,
            {
              targets: options.optimizationTargets || this.config.optimizationTargets,
              strategy: options.optimizationStrategy || this.config.optimizationStrategy,
              applyChanges: options.applyChanges !== false
            }
          );
          
          // 5. Store agent cycle results
          cycleResults.agentResults[agentId] = {
            testResults: this._summarizeTestResults(testResults),
            evaluationResults: evaluationResults.summary,
            optimizationResults: optimizationResults.summary,
            improvement: optimizationResults.improvement
          };
          
          // Emit agent cycle completion event
          this.emit('agentCycleCompleted', {
            agentId,
            cycleNumber,
            improvement: optimizationResults.improvement
          });
          
          logger.info(`Completed training cycle ${cycleNumber} for agent ${agentId}`);
        } catch (error) {
          logger.error(`Error in training cycle ${cycleNumber} for agent ${agentId}: ${error.message}`);
          
          // Store error in results
          cycleResults.agentResults[agentId] = {
            error: true,
            errorMessage: error.message
          };
        }
      }
      
      // Calculate overall cycle improvement
      let totalImprovement = 0;
      let agentCount = 0;
      
      for (const agentId of Object.keys(cycleResults.agentResults)) {
        const result = cycleResults.agentResults[agentId];
        
        if (result.improvement && !result.error) {
          totalImprovement += result.improvement;
          agentCount++;
        }
      }
      
      cycleResults.overallImprovement = agentCount > 0 ? totalImprovement / agentCount : 0;
      cycleResults.duration = Date.now() - cycleStart;
      
      // Store cycle results
      this.results.cycles.push(cycleResults);
      this.currentCycle = cycleNumber;
      
      // Save results to disk
      await this._saveCycleResults(cycleResults);
      
      // Calculate and update overall training improvement
      this._updateOverallImprovement();
      
      // Emit cycle completion event
      this.emit('cycleCompleted', {
        cycleNumber,
        duration: cycleResults.duration,
        improvement: cycleResults.overallImprovement
      });
      
      logger.info(`Completed training cycle ${cycleNumber} with overall improvement: ${cycleResults.overallImprovement.toFixed(2)}%`);
      
      return cycleResults;
    } catch (error) {
      logger.error(`Error running training cycle: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Summarize test results to reduce data size
   * 
   * @param {Object} testResults - Raw test results
   * @returns {Object} Summarized results
   * @private
   */
  _summarizeTestResults(testResults) {
    // Extract summary information from raw test results
    return {
      totalTests: testResults.totalTests,
      passedTests: testResults.passedTests,
      failedTests: testResults.failedTests,
      successRate: testResults.successRate,
      averageDuration: testResults.averageDuration,
      resourceUsage: testResults.resourceUsage
    };
  }
  
  /**
   * Save cycle results to disk
   * 
   * @param {Object} cycleResults - Results from a training cycle
   * @returns {Promise<void>}
   * @private
   */
  async _saveCycleResults(cycleResults) {
    try {
      const resultsFile = path.join(
        this.config.dataDirectory,
        'reports',
        `cycle-${cycleResults.cycleNumber}.json`
      );
      
      await fs.writeFile(
        resultsFile,
        JSON.stringify(cycleResults, null, 2),
        'utf8'
      );
      
      logger.info(`Saved cycle ${cycleResults.cycleNumber} results to ${resultsFile}`);
    } catch (error) {
      logger.error(`Error saving cycle results: ${error.message}`);
    }
  }
  
  /**
   * Update overall improvement metric
   * 
   * @private
   */
  _updateOverallImprovement() {
    try {
      // Calculate exponentially weighted average of cycle improvements
      const decay = 0.7;
      let weightedSum = 0;
      let weightSum = 0;
      
      for (let i = this.results.cycles.length - 1; i >= 0; i--) {
        const cycle = this.results.cycles[i];
        const weight = Math.pow(decay, this.results.cycles.length - 1 - i);
        
        weightedSum += cycle.overallImprovement * weight;
        weightSum += weight;
      }
      
      this.results.overallImprovement = weightSum > 0 ? weightedSum / weightSum : 0;
    } catch (error) {
      logger.error(`Error updating overall improvement: ${error.message}`);
    }
  }
  
  /**
   * Run continuous improvement cycles
   * 
   * @param {Object} options - Continuous improvement options
   * @returns {Promise<Object>} Final results
   */
  async runContinuousImprovement(options = {}) {
    try {
      const cycles = options.cycles || 5;
      const stopOnThreshold = options.stopOnThreshold !== undefined ? 
        options.stopOnThreshold : 0.5; // % improvement
      const reportFrequency = options.reportFrequency || 'cycle';
      const agentIds = options.agentIds || this.testHarness.getRegisteredAgentIds();
      
      logger.info(`Starting continuous improvement with ${cycles} cycles for ${agentIds.length} agents`);
      
      // Mark as running
      this.running = true;
      
      // Reset current cycle if requested
      if (options.resetCycle) {
        this.currentCycle = 0;
      }
      
      // Run improvement cycles
      const startingCycle = this.currentCycle;
      let continueCycles = true;
      
      for (let i = 1; i <= cycles && continueCycles && this.running; i++) {
        const cycleNumber = startingCycle + i;
        
        // Run a single cycle
        const cycleResults = await this.runCycle({
          cycleNumber,
          agentIds,
          testSets: options.testSets || this.config.testSets,
          testCasesPerSet: options.testCasesPerSet || this.config.testCasesPerSet,
          parallelTests: options.parallelTests || this.config.maxParallelTests,
          metrics: options.metrics || this.config.evaluationMetrics,
          optimizationTargets: options.optimizationTargets || this.config.optimizationTargets,
          applyChanges: options.applyChanges !== false
        });
        
        // Generate report if needed
        if (reportFrequency === 'cycle') {
          await this.generateReport({
            cycleNumbers: [cycleNumber],
            format: options.reportFormat || 'json',
            includeDetails: options.reportDetails !== false
          });
        }
        
        // Check if we should stop based on improvement threshold
        if (
          stopOnThreshold !== null && 
          stopOnThreshold !== false &&
          cycleResults.overallImprovement < stopOnThreshold
        ) {
          logger.info(`Stopping continuous improvement - improvement below threshold (${cycleResults.overallImprovement.toFixed(2)}% < ${stopOnThreshold}%)`);
          continueCycles = false;
        }
      }
      
      // Generate final report
      if (reportFrequency === 'end' || (reportFrequency === 'cycle' && cycles > 1)) {
        await this.generateReport({
          cycleNumbers: Array.from(
            { length: cycles }, 
            (_, i) => startingCycle + i + 1
          ).filter(n => n <= this.currentCycle),
          format: options.reportFormat || 'json',
          includeDetails: true
        });
      }
      
      // Mark as not running
      this.running = false;
      
      // Return overall results
      return {
        cyclesCompleted: this.currentCycle - startingCycle,
        overallImprovement: this.results.overallImprovement,
        agentImprovements: this._calculateAgentImprovements(
          startingCycle + 1,
          this.currentCycle
        )
      };
    } catch (error) {
      logger.error(`Error running continuous improvement: ${error.message}`);
      this.running = false;
      throw error;
    }
  }
  
  /**
   * Calculate improvements for each agent across multiple cycles
   * 
   * @param {number} startCycle - Starting cycle number
   * @param {number} endCycle - Ending cycle number
   * @returns {Object} Agent improvements
   * @private
   */
  _calculateAgentImprovements(startCycle, endCycle) {
    try {
      const agentImprovements = {};
      
      // Get all unique agent IDs from cycle results
      const agentIds = new Set();
      
      for (const cycle of this.results.cycles) {
        if (cycle.cycleNumber >= startCycle && cycle.cycleNumber <= endCycle) {
          Object.keys(cycle.agentResults).forEach(agentId => agentIds.add(agentId));
        }
      }
      
      // Calculate improvement for each agent
      for (const agentId of agentIds) {
        let initialMetrics = null;
        let finalMetrics = null;
        
        // Find initial and final metrics
        for (const cycle of this.results.cycles) {
          if (
            cycle.cycleNumber >= startCycle && 
            cycle.cycleNumber <= endCycle &&
            cycle.agentResults[agentId] &&
            !cycle.agentResults[agentId].error
          ) {
            if (initialMetrics === null && cycle.cycleNumber === startCycle) {
              initialMetrics = cycle.agentResults[agentId].evaluationResults;
            }
            
            if (cycle.cycleNumber === endCycle) {
              finalMetrics = cycle.agentResults[agentId].evaluationResults;
            }
          }
        }
        
        // Calculate improvement if we have both metrics
        if (initialMetrics && finalMetrics) {
          const improvement = this._calculateMetricImprovement(initialMetrics, finalMetrics);
          agentImprovements[agentId] = improvement;
        } else {
          agentImprovements[agentId] = { available: false };
        }
      }
      
      return agentImprovements;
    } catch (error) {
      logger.error(`Error calculating agent improvements: ${error.message}`);
      return {};
    }
  }
  
  /**
   * Calculate improvement between initial and final metrics
   * 
   * @param {Object} initialMetrics - Initial evaluation metrics
   * @param {Object} finalMetrics - Final evaluation metrics
   * @returns {Object} Improvement metrics
   * @private
   */
  _calculateMetricImprovement(initialMetrics, finalMetrics) {
    try {
      const improvement = {
        overall: 0,
        metrics: {}
      };
      
      // Calculate improvement for each metric
      for (const metric of this.config.evaluationMetrics) {
        if (
          initialMetrics[metric] !== undefined && 
          finalMetrics[metric] !== undefined
        ) {
          let metricImprovement;
          
          // Handle different metric types
          if (typeof initialMetrics[metric] === 'number') {
            // For score-type metrics (higher is better)
            metricImprovement = ((finalMetrics[metric] - initialMetrics[metric]) / initialMetrics[metric]) * 100;
          } else if (typeof initialMetrics[metric] === 'object' && initialMetrics[metric].score !== undefined) {
            // For complex metrics with a score property
            metricImprovement = ((finalMetrics[metric].score - initialMetrics[metric].score) / initialMetrics[metric].score) * 100;
          } else {
            // Unknown metric format
            metricImprovement = 0;
          }
          
          improvement.metrics[metric] = metricImprovement;
        }
      }
      
      // Calculate overall improvement as average
      const metricValues = Object.values(improvement.metrics);
      improvement.overall = metricValues.length > 0 ? 
        metricValues.reduce((sum, val) => sum + val, 0) / metricValues.length : 
        0;
      
      return improvement;
    } catch (error) {
      logger.error(`Error calculating metric improvement: ${error.message}`);
      return { overall: 0, metrics: {} };
    }
  }
  
  /**
   * Generate a report on training results
   * 
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Report data
   */
  async generateReport(options = {}) {
    try {
      const cycleNumbers = options.cycleNumbers || 
        this.results.cycles.map(c => c.cycleNumber);
      
      const format = options.format || 'json';
      const includeDetails = options.includeDetails !== false;
      
      logger.info(`Generating ${format} report for cycles: ${cycleNumbers.join(', ')}`);
      
      // Collect cycle data
      const cycles = this.results.cycles.filter(
        c => cycleNumbers.includes(c.cycleNumber)
      );
      
      if (cycles.length === 0) {
        throw new Error('No cycles found for report');
      }
      
      // Generate report data
      const reportData = {
        generatedAt: new Date().toISOString(),
        cycles: cycleNumbers,
        agentCount: this.testHarness.getRegisteredAgentIds().length,
        duration: {
          total: cycles.reduce((sum, c) => sum + c.duration, 0),
          average: cycles.reduce((sum, c) => sum + c.duration, 0) / cycles.length
        },
        improvement: {
          overall: this._calculateAverageImprovement(cycles),
          byAgent: this._calculateAgentImprovements(
            Math.min(...cycleNumbers),
            Math.max(...cycleNumbers)
          )
        },
        summary: this._generateCycleSummary(cycles)
      };
      
      // Add details if requested
      if (includeDetails) {
        reportData.details = {
          cycleResults: cycles.map(c => ({
            cycleNumber: c.cycleNumber,
            timestamp: c.timestamp,
            duration: c.duration,
            overallImprovement: c.overallImprovement,
            agentResults: c.agentResults
          }))
        };
      }
      
      // Generate formatted report
      let formattedReport;
      let reportFile;
      
      switch (format.toLowerCase()) {
        case 'json':
          formattedReport = JSON.stringify(reportData, null, 2);
          reportFile = path.join(
            this.config.dataDirectory,
            'reports',
            `training-report-${new Date().getTime()}.json`
          );
          break;
          
        case 'markdown':
        case 'md':
          formattedReport = this._formatMarkdownReport(reportData);
          reportFile = path.join(
            this.config.dataDirectory,
            'reports',
            `training-report-${new Date().getTime()}.md`
          );
          break;
          
        default:
          throw new Error(`Unsupported report format: ${format}`);
      }
      
      // Save report to file
      await fs.writeFile(reportFile, formattedReport, 'utf8');
      
      logger.info(`Generated report saved to ${reportFile}`);
      
      return {
        data: reportData,
        file: reportFile
      };
    } catch (error) {
      logger.error(`Error generating report: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Calculate average improvement across cycles
   * 
   * @param {Array<Object>} cycles - Cycle results
   * @returns {number} Average improvement
   * @private
   */
  _calculateAverageImprovement(cycles) {
    try {
      return cycles.length > 0 ?
        cycles.reduce((sum, c) => sum + c.overallImprovement, 0) / cycles.length :
        0;
    } catch (error) {
      logger.error(`Error calculating average improvement: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Generate a summary of cycle results
   * 
   * @param {Array<Object>} cycles - Cycle results
   * @returns {Object} Cycle summary
   * @private
   */
  _generateCycleSummary(cycles) {
    try {
      // Summary data structure
      const summary = {
        testSummary: {
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          averageSuccessRate: 0
        },
        metricSummary: {},
        optimizationSummary: {
          parametersAdjusted: 0,
          strategiesChanged: 0,
          totalChanges: 0
        }
      };
      
      // Initialize metric summary for each evaluation metric
      for (const metric of this.config.evaluationMetrics) {
        summary.metricSummary[metric] = {
          initialAverage: 0,
          finalAverage: 0,
          improvement: 0
        };
      }
      
      // Process cycle data
      let totalSuccessRates = 0;
      const initialMetrics = {};
      const finalMetrics = {};
      let agentCount = 0;
      
      // Get initial and final cycle
      const initialCycle = cycles.reduce(
        (min, c) => c.cycleNumber < min.cycleNumber ? c : min,
        cycles[0]
      );
      
      const finalCycle = cycles.reduce(
        (max, c) => c.cycleNumber > max.cycleNumber ? c : max,
        cycles[0]
      );
      
      // Process all cycles for test summary
      for (const cycle of cycles) {
        for (const agentId in cycle.agentResults) {
          const result = cycle.agentResults[agentId];
          
          if (!result.error && result.testResults) {
            summary.testSummary.totalTests += result.testResults.totalTests || 0;
            summary.testSummary.passedTests += result.testResults.passedTests || 0;
            summary.testSummary.failedTests += result.testResults.failedTests || 0;
            totalSuccessRates += result.testResults.successRate || 0;
            
            // Count optimization changes
            if (result.optimizationResults) {
              summary.optimizationSummary.parametersAdjusted += 
                result.optimizationResults.parametersAdjusted || 0;
              summary.optimizationSummary.strategiesChanged += 
                result.optimizationResults.strategiesChanged || 0;
              summary.optimizationSummary.totalChanges += 
                result.optimizationResults.totalChanges || 0;
            }
          }
        }
      }
      
      // Calculate average success rate
      const totalResults = Object.values(cycles)
        .flatMap(c => Object.values(c.agentResults))
        .filter(r => !r.error && r.testResults)
        .length;
      
      summary.testSummary.averageSuccessRate = totalResults > 0 ?
        totalSuccessRates / totalResults : 0;
      
      // Process initial and final cycles for metric summary
      // Collect initial metrics
      for (const agentId in initialCycle.agentResults) {
        const result = initialCycle.agentResults[agentId];
        
        if (!result.error && result.evaluationResults) {
          initialMetrics[agentId] = result.evaluationResults;
          agentCount++;
        }
      }
      
      // Collect final metrics
      for (const agentId in finalCycle.agentResults) {
        const result = finalCycle.agentResults[agentId];
        
        if (!result.error && result.evaluationResults) {
          finalMetrics[agentId] = result.evaluationResults;
        }
      }
      
      // Calculate metric summaries
      if (agentCount > 0) {
        for (const metric of this.config.evaluationMetrics) {
          let initialSum = 0;
          let finalSum = 0;
          let metricAgentCount = 0;
          
          for (const agentId in initialMetrics) {
            if (
              initialMetrics[agentId][metric] !== undefined &&
              finalMetrics[agentId] &&
              finalMetrics[agentId][metric] !== undefined
            ) {
              // Handle different metric formats
              const initialValue = typeof initialMetrics[agentId][metric] === 'object' ? 
                initialMetrics[agentId][metric].score : 
                initialMetrics[agentId][metric];
              
              const finalValue = typeof finalMetrics[agentId][metric] === 'object' ? 
                finalMetrics[agentId][metric].score : 
                finalMetrics[agentId][metric];
              
              initialSum += initialValue;
              finalSum += finalValue;
              metricAgentCount++;
            }
          }
          
          if (metricAgentCount > 0) {
            summary.metricSummary[metric].initialAverage = initialSum / metricAgentCount;
            summary.metricSummary[metric].finalAverage = finalSum / metricAgentCount;
            summary.metricSummary[metric].improvement = 
              ((finalSum / metricAgentCount) - (initialSum / metricAgentCount)) / 
              (initialSum / metricAgentCount) * 100;
          }
        }
      }
      
      return summary;
    } catch (error) {
      logger.error(`Error generating cycle summary: ${error.message}`);
      return {
        testSummary: { error: error.message },
        metricSummary: { error: error.message },
        optimizationSummary: { error: error.message }
      };
    }
  }
  
  /**
   * Format report data as markdown
   * 
   * @param {Object} reportData - Report data
   * @returns {string} Markdown formatted report
   * @private
   */
  _formatMarkdownReport(reportData) {
    try {
      let markdown = `# Agent Training Report\n\n`;
      markdown += `Generated: ${new Date(reportData.generatedAt).toLocaleString()}\n\n`;
      
      // Overview section
      markdown += `## Overview\n\n`;
      markdown += `- **Cycles**: ${reportData.cycles.join(', ')}\n`;
      markdown += `- **Agents Trained**: ${reportData.agentCount}\n`;
      markdown += `- **Total Duration**: ${(reportData.duration.total / 1000).toFixed(2)} seconds\n`;
      markdown += `- **Overall Improvement**: ${reportData.improvement.overall.toFixed(2)}%\n\n`;
      
      // Test summary section
      const testSummary = reportData.summary.testSummary;
      markdown += `## Test Summary\n\n`;
      markdown += `- **Total Tests Run**: ${testSummary.totalTests}\n`;
      markdown += `- **Passed Tests**: ${testSummary.passedTests} (${((testSummary.passedTests / testSummary.totalTests) * 100).toFixed(2)}%)\n`;
      markdown += `- **Failed Tests**: ${testSummary.failedTests} (${((testSummary.failedTests / testSummary.totalTests) * 100).toFixed(2)}%)\n`;
      markdown += `- **Average Success Rate**: ${(testSummary.averageSuccessRate).toFixed(2)}%\n\n`;
      
      // Metric summary section
      markdown += `## Metric Improvements\n\n`;
      markdown += `| Metric | Initial | Final | Improvement |\n`;
      markdown += `| ------ | ------- | ----- | ----------- |\n`;
      
      for (const [metric, data] of Object.entries(reportData.summary.metricSummary)) {
        markdown += `| ${metric} | ${data.initialAverage.toFixed(2)} | ${data.finalAverage.toFixed(2)} | ${data.improvement.toFixed(2)}% |\n`;
      }
      
      markdown += `\n`;
      
      // Agent improvements section
      markdown += `## Agent Improvements\n\n`;
      markdown += `| Agent | Overall Improvement | Top Improved Metric |\n`;
      markdown += `| ----- | ------------------ | ------------------- |\n`;
      
      for (const [agentId, improvement] of Object.entries(reportData.improvement.byAgent)) {
        if (improvement.available === false) {
          markdown += `| ${agentId} | N/A | N/A |\n`;
        } else {
          // Find top improved metric
          let topMetric = '';
          let topImprovement = 0;
          
          for (const [metric, value] of Object.entries(improvement.metrics)) {
            if (value > topImprovement) {
              topImprovement = value;
              topMetric = metric;
            }
          }
          
          markdown += `| ${agentId} | ${improvement.overall.toFixed(2)}% | ${topMetric}: ${topImprovement.toFixed(2)}% |\n`;
        }
      }
      
      markdown += `\n`;
      
      // Optimization summary section
      const optSummary = reportData.summary.optimizationSummary;
      markdown += `## Optimization Summary\n\n`;
      markdown += `- **Total Changes Applied**: ${optSummary.totalChanges}\n`;
      markdown += `- **Parameters Adjusted**: ${optSummary.parametersAdjusted}\n`;
      markdown += `- **Strategies Changed**: ${optSummary.strategiesChanged}\n\n`;
      
      // Cycle details if available
      if (reportData.details && reportData.details.cycleResults) {
        markdown += `## Cycle Details\n\n`;
        
        for (const cycle of reportData.details.cycleResults) {
          markdown += `### Cycle ${cycle.cycleNumber}\n\n`;
          markdown += `- **Timestamp**: ${new Date(cycle.timestamp).toLocaleString()}\n`;
          markdown += `- **Duration**: ${(cycle.duration / 1000).toFixed(2)} seconds\n`;
          markdown += `- **Improvement**: ${cycle.overallImprovement.toFixed(2)}%\n\n`;
          
          // Agent results for this cycle
          markdown += `#### Agent Results\n\n`;
          
          for (const [agentId, result] of Object.entries(cycle.agentResults)) {
            markdown += `##### ${agentId}\n\n`;
            
            if (result.error) {
              markdown += `- **Error**: ${result.errorMessage}\n\n`;
            } else {
              if (result.testResults) {
                markdown += `- **Tests**: ${result.testResults.passedTests}/${result.testResults.totalTests} passed (${result.testResults.successRate.toFixed(2)}%)\n`;
              }
              
              if (result.evaluationResults) {
                markdown += `- **Evaluation**:\n`;
                
                for (const [metric, value] of Object.entries(result.evaluationResults)) {
                  if (typeof value === 'object' && value.score !== undefined) {
                    markdown += `  - ${metric}: ${value.score.toFixed(2)}\n`;
                  } else if (typeof value === 'number') {
                    markdown += `  - ${metric}: ${value.toFixed(2)}\n`;
                  }
                }
              }
              
              if (result.optimizationResults) {
                markdown += `- **Optimization**: ${result.optimizationResults.totalChanges} changes applied\n`;
                markdown += `- **Improvement**: ${result.improvement.toFixed(2)}%\n`;
              }
              
              markdown += `\n`;
            }
          }
        }
      }
      
      return markdown;
    } catch (error) {
      logger.error(`Error formatting markdown report: ${error.message}`);
      return `# Error Generating Report\n\n${error.message}`;
    }
  }
  
  /**
   * Create a baseline from current agent performance
   * 
   * @param {Object} options - Baseline options
   * @returns {Promise<Object>} Baseline data
   */
  async createBaseline(options = {}) {
    try {
      const agentIds = options.agentIds || this.testHarness.getRegisteredAgentIds();
      const baselineName = options.name || `baseline-${new Date().getTime()}`;
      const testSets = options.testSets || this.config.testSets;
      
      logger.info(`Creating baseline "${baselineName}" for ${agentIds.length} agents`);
      
      const baselineData = {
        name: baselineName,
        timestamp: new Date().toISOString(),
        description: options.description || 'Automatic baseline',
        agentBaselines: {}
      };
      
      // Run tests and evaluations for each agent
      for (const agentId of agentIds) {
        logger.info(`Creating baseline for agent ${agentId}`);
        
        try {
          // Get agent from test harness
          const agent = this.testHarness.getAgent(agentId);
          
          if (!agent) {
            logger.warn(`Agent ${agentId} not found, skipping`);
            continue;
          }
          
          // 1. Generate simulations based on agent type
          const simulations = await this.simulationEngine.generateSimulations(
            agent.agentType,
            {
              testSets,
              casesPerSet: options.testCasesPerSet || 
                this.config.testCasesPerSet,
              difficulty: 'standard'
            }
          );
          
          // 2. Run test harness with simulations
          const testResults = await this.testHarness.runTests(
            agentId,
            simulations,
            {
              parallelTests: options.parallelTests || 
                this.config.maxParallelTests,
              timeout: options.timeout || 60000,
              captureMetrics: true
            }
          );
          
          // 3. Evaluate test results
          const evaluationResults = await this.evaluationFramework.evaluateResults(
            agentId,
            testResults,
            {
              metrics: options.metrics || this.config.evaluationMetrics,
              compareToBaseline: false
            }
          );
          
          // 4. Store agent baseline
          baselineData.agentBaselines[agentId] = {
            agentType: agent.agentType,
            metrics: evaluationResults.metrics,
            summary: evaluationResults.summary,
            testCases: simulations.map(sim => ({
              id: sim.id,
              type: sim.type,
              difficulty: sim.difficulty
            }))
          };
          
          logger.info(`Created baseline for agent ${agentId}`);
        } catch (error) {
          logger.error(`Error creating baseline for agent ${agentId}: ${error.message}`);
          
          baselineData.agentBaselines[agentId] = {
            error: true,
            errorMessage: error.message
          };
        }
      }
      
      // Save baseline to disk
      const baselineFile = path.join(
        this.config.dataDirectory,
        'baselines',
        `${baselineName}.json`
      );
      
      await fs.writeFile(
        baselineFile,
        JSON.stringify(baselineData, null, 2),
        'utf8'
      );
      
      // Register baseline with evaluation framework
      await this.evaluationFramework.registerBaseline(baselineName, baselineData);
      
      logger.info(`Baseline "${baselineName}" created and saved to ${baselineFile}`);
      
      return {
        name: baselineName,
        file: baselineFile,
        data: baselineData
      };
    } catch (error) {
      logger.error(`Error creating baseline: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Stop the training pipeline
   * 
   * @returns {Promise<boolean>} Success indicator
   */
  async stop() {
    try {
      logger.info('Stopping Training Pipeline');
      
      // Mark as not running
      this.running = false;
      
      // Stop components
      await this.testHarness.stop();
      await this.simulationEngine.stop();
      await this.evaluationFramework.stop();
      await this.optimizationSystem.stop();
      
      logger.info('Training Pipeline stopped');
      return true;
    } catch (error) {
      logger.error(`Error stopping Training Pipeline: ${error.message}`);
      return false;
    }
  }
}

module.exports = TrainingPipeline;