/**
 * Optimization System
 * 
 * This module provides a system for optimizing agent parameters and strategies
 * based on evaluation results, continuously improving agent performance.
 */

const path = require('path');
const fs = require('fs').promises;
const { EventEmitter } = require('events');
const logger = require('../scripts/logger");

class OptimizationSystem extends EventEmitter {
  /**
   * Initialize a new Optimization System
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    super();
    
    this.config = {
      // Optimization targets
      targets: config.targets || ['parameters', 'strategies', 'schemas'],
      
      // Optimization strategy
      strategy: config.strategy || 'incremental',
      
      // Learning configuration
      learningRate: config.learningRate || 0.1,
      explorationRate: config.explorationRate || 0.2,
      
      // Improvement thresholds
      minImprovement: config.minImprovement || 0.5, // Minimum % improvement to apply changes
      significantImprovement: config.significantImprovement || 5.0, // % improvement considered significant
      
      // Data storage
      dataDirectory: config.dataDirectory || path.join(__dirname, '../../../data/training/optimizations'),
      
      // History settings
      historyLength: config.historyLength || 10,
      
      ...config
    };
    
    // Optimization system state
    this.initialized = false;
    this.registeredAgents = new Map();
    this.optimizationHistory = new Map();
    
    // Optimization strategies
    this.optimizationStrategies = {
      incremental: this._incrementalOptimization.bind(this),
      bayesian: this._bayesianOptimization.bind(this),
      genetic: this._geneticOptimization.bind(this),
      reinforcement: this._reinforcementOptimization.bind(this)
    };
    
    logger.info('Optimization System initialized');
  }
  
  /**
   * Initialize the optimization system
   * 
   * @returns {Promise<boolean>} Success indicator
   */
  async initialize() {
    try {
      logger.info('Initializing Optimization System');
      
      // Create data directory if it doesn't exist
      await fs.mkdir(this.config.dataDirectory, { recursive: true });
      
      // Load optimization strategies and schemas
      await this._loadOptimizationSchemas();
      
      this.initialized = true;
      logger.info('Optimization System initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Error initializing Optimization System: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Load optimization schemas
   * 
   * @returns {Promise<void>}
   * @private
   */
  async _loadOptimizationSchemas() {
    try {
      // Initialize optimization schemas
      this.optimizationSchemas = {
        // Default parameter schemas for different agent types
        parameters: {
          // Generic agent parameters
          generic: {
            responseTimeout: {
              type: 'numeric',
              min: 1000,
              max: 60000,
              default: 30000,
              impact: 'efficiency'
            },
            cacheLifetime: {
              type: 'numeric',
              min: 0,
              max: 86400000, // 24 hours
              default: 3600000, // 1 hour
              impact: 'efficiency'
            },
            logLevel: {
              type: 'categorical',
              values: ['debug', 'info', 'warn', 'error'],
              default: 'info',
              impact: 'diagnostics'
            },
            retryCount: {
              type: 'numeric',
              min: 0,
              max: 10,
              default: 3,
              impact: 'robustness'
            },
            retryDelay: {
              type: 'numeric',
              min: 100,
              max: 10000,
              default: 1000,
              impact: 'robustness'
            }
          },
          
          // Specialized agent parameters
          specialized: {
            specializationLevel: {
              type: 'numeric',
              min: 1,
              max: 10,
              default: 5,
              impact: 'accuracy'
            },
            contextWindow: {
              type: 'numeric',
              min: 1,
              max: 50,
              default: 10,
              impact: 'accuracy'
            }
          },
          
          // Director agent parameters
          director: {
            delegationThreshold: {
              type: 'numeric',
              min: 0.1,
              max: 0.9,
              default: 0.5,
              impact: 'efficiency'
            },
            coordinationInterval: {
              type: 'numeric',
              min: 1000,
              max: 60000,
              default: 10000,
              impact: 'coordination'
            }
          },
          
          // Scheduling agent parameters
          scheduling: {
            optimizationLevel: {
              type: 'numeric',
              min: 1,
              max: 10,
              default: 5,
              impact: 'quality'
            },
            constraintWeight: {
              type: 'numeric',
              min: 0.1,
              max: 10.0,
              default: 1.0,
              impact: 'compliance'
            }
          },
          
          // RAG agent parameters
          rag: {
            retrievalCount: {
              type: 'numeric',
              min: 1,
              max: 50,
              default: 10,
              impact: 'accuracy'
            },
            similarityThreshold: {
              type: 'numeric',
              min: 0.1,
              max: 0.9,
              default: 0.7,
              impact: 'relevance'
            }
          }
        },
        
        // Strategy schemas for different agent types
        strategies: {
          // Generic agent strategies
          generic: {
            cacheStrategy: {
              type: 'categorical',
              values: ['none', 'memory', 'persistent'],
              default: 'memory',
              impact: 'efficiency'
            },
            errorHandlingStrategy: {
              type: 'categorical',
              values: ['failFast', 'retryWithBackoff', 'fallback'],
              default: 'retryWithBackoff',
              impact: 'robustness'
            },
            loggingStrategy: {
              type: 'categorical',
              values: ['minimal', 'normal', 'verbose'],
              default: 'normal',
              impact: 'diagnostics'
            }
          },
          
          // Scheduling agent strategies
          scheduling: {
            schedulingStrategy: {
              type: 'categorical',
              values: ['greedy', 'constraintSatisfaction', 'geneticOptimization'],
              default: 'constraintSatisfaction',
              impact: 'quality'
            },
            conflictResolutionStrategy: {
              type: 'categorical',
              values: ['firstComeFirstServed', 'priorityBased', 'negotiation'],
              default: 'priorityBased',
              impact: 'fairness'
            }
          },
          
          // Director agent strategies
          director: {
            delegationStrategy: {
              type: 'categorical',
              values: ['roundRobin', 'loadBalanced', 'capabilityMatched'],
              default: 'capabilityMatched',
              impact: 'efficiency'
            },
            coordinationStrategy: {
              type: 'categorical',
              values: ['centralized', 'hierarchical', 'distributed'],
              default: 'hierarchical',
              impact: 'coordination'
            }
          },
          
          // RAG agent strategies
          rag: {
            retrievalStrategy: {
              type: 'categorical',
              values: ['bm25', 'embedding', 'hybrid'],
              default: 'hybrid',
              impact: 'accuracy'
            },
            reRankingStrategy: {
              type: 'categorical',
              values: ['none', 'simple', 'semantic'],
              default: 'semantic',
              impact: 'relevance'
            }
          }
        }
      };
      
      logger.info('Loaded optimization schemas');
    } catch (error) {
      logger.error(`Error loading optimization schemas: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Register an agent with the optimization system
   * 
   * @param {Object} agent - Agent to register
   * @returns {Promise<boolean>} Success indicator
   */
  async registerAgent(agent) {
    try {
      if (!agent || !agent.agentId) {
        throw new Error('Agent must have an agentId property');
      }
      
      // Initialize agent data
      const agentData = {
        agentId: agent.agentId,
        agentType: agent.agentType || 'generic',
        parameters: {},
        strategies: {},
        registeredAt: new Date().toISOString(),
        agent: agent // Keep reference to the agent object
      };
      
      // Get current parameter values from agent
      if (agent.getParameters) {
        try {
          agentData.parameters = await agent.getParameters();
        } catch (error) {
          logger.warn(`Could not get parameters for agent ${agent.agentId}: ${error.message}`);
        }
      }
      
      // Get current strategy values from agent
      if (agent.getStrategies) {
        try {
          agentData.strategies = await agent.getStrategies();
        } catch (error) {
          logger.warn(`Could not get strategies for agent ${agent.agentId}: ${error.message}`);
        }
      }
      
      // Store agent data
      this.registeredAgents.set(agent.agentId, agentData);
      
      // Initialize optimization history
      this.optimizationHistory.set(agent.agentId, []);
      
      logger.info(`Registered agent ${agent.agentId} with Optimization System`);
      
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
   * Optimize an agent based on evaluation results
   * 
   * @param {Object} agent - Agent to optimize
   * @param {Object} evaluationResults - Evaluation results
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Optimization results
   */
  async optimizeAgent(agent, evaluationResults, options = {}) {
    try {
      // Ensure the system is initialized
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Get agent ID
      const agentId = agent.agentId;
      
      if (!agentId) {
        throw new Error('Agent must have an agentId property');
      }
      
      // Register agent if not already registered
      if (!this.registeredAgents.has(agentId)) {
        await this.registerAgent(agent);
      }
      
      // Get agent data
      const agentData = this.registeredAgents.get(agentId);
      
      // Optimization options
      const targets = options.targets || this.config.targets;
      const strategy = options.strategy || this.config.strategy;
      const applyChanges = options.applyChanges !== false;
      
      logger.info(`Optimizing agent ${agentId} using ${strategy} strategy for targets: ${targets.join(', ')}`);
      
      // Check if we have appropriate strategy
      if (!this.optimizationStrategies[strategy]) {
        logger.warn(`Unknown optimization strategy: ${strategy}, falling back to incremental`);
        strategy = 'incremental';
      }
      
      // Apply the selected optimization strategy
      const optimizationResult = await this.optimizationStrategies[strategy](
        agentData,
        evaluationResults,
        targets,
        options
      );
      
      // Check if we should apply changes
      if (applyChanges && optimizationResult && optimizationResult.changes) {
        await this._applyOptimizationChanges(
          agentData,
          optimizationResult.changes,
          evaluationResults
        );
      }
      
      // Store optimization in history
      await this._storeOptimizationResult(
        agentId,
        optimizationResult,
        evaluationResults
      );
      
      // Emit optimization completed event
      this.emit('optimizationCompleted', {
        agentId,
        strategy,
        improvement: optimizationResult.improvement,
        changesApplied: applyChanges && optimizationResult.changes.length > 0
      });
      
      logger.info(`Completed optimization for agent ${agentId} with improvement: ${optimizationResult.improvement.toFixed(2)}%`);
      
      return optimizationResult;
    } catch (error) {
      logger.error(`Error optimizing agent: ${error.message}`);
      
      // Return default result with error
      return {
        changes: [],
        improvement: 0,
        error: error.message,
        summary: {
          parametersAdjusted: 0,
          strategiesChanged: 0,
          totalChanges: 0
        }
      };
    }
  }
  
  /**
   * Incremental optimization strategy
   * 
   * @param {Object} agentData - Agent data
   * @param {Object} evaluationResults - Evaluation results
   * @param {Array<string>} targets - Optimization targets
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Optimization results
   * @private
   */
  async _incrementalOptimization(agentData, evaluationResults, targets, options = {}) {
    try {
      const { agentId, agentType } = agentData;
      
      logger.info(`Running incremental optimization for agent ${agentId}`);
      
      // Get the recommended changes based on the evaluation results
      const changes = await this._calculateRecommendedChanges(
        agentData,
        evaluationResults,
        targets,
        options
      );
      
      // Calculate the expected improvement from these changes
      const improvement = this._estimateImprovement(changes, evaluationResults);
      
      // Filter changes based on minimum improvement threshold
      const filteredChanges = changes.filter(change => {
        return change.estimatedImprovement >= this.config.minImprovement;
      });
      
      // Summarize changes
      const summary = this._summarizeChanges(filteredChanges);
      
      return {
        changes: filteredChanges,
        improvement,
        strategy: 'incremental',
        summary
      };
    } catch (error) {
      logger.error(`Error in incremental optimization: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Bayesian optimization strategy
   * 
   * @param {Object} agentData - Agent data
   * @param {Object} evaluationResults - Evaluation results
   * @param {Array<string>} targets - Optimization targets
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Optimization results
   * @private
   */
  async _bayesianOptimization(agentData, evaluationResults, targets, options = {}) {
    // Bayesian optimization is more complex and would typically use a library
    // For now, we'll just use the incremental strategy as a fallback
    logger.warn(`Bayesian optimization not fully implemented, falling back to incremental`);
    return this._incrementalOptimization(agentData, evaluationResults, targets, options);
  }
  
  /**
   * Genetic optimization strategy
   * 
   * @param {Object} agentData - Agent data
   * @param {Object} evaluationResults - Evaluation results
   * @param {Array<string>} targets - Optimization targets
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Optimization results
   * @private
   */
  async _geneticOptimization(agentData, evaluationResults, targets, options = {}) {
    // Genetic optimization is more complex and would typically involve
    // generating a population of candidate configurations
    // For now, we'll just use the incremental strategy as a fallback
    logger.warn(`Genetic optimization not fully implemented, falling back to incremental`);
    return this._incrementalOptimization(agentData, evaluationResults, targets, options);
  }
  
  /**
   * Reinforcement learning optimization strategy
   * 
   * @param {Object} agentData - Agent data
   * @param {Object} evaluationResults - Evaluation results
   * @param {Array<string>} targets - Optimization targets
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Optimization results
   * @private
   */
  async _reinforcementOptimization(agentData, evaluationResults, targets, options = {}) {
    // Reinforcement learning would typically involve a more complex approach
    // with states, actions, rewards, and a policy
    // For now, we'll just use the incremental strategy as a fallback
    logger.warn(`Reinforcement optimization not fully implemented, falling back to incremental`);
    return this._incrementalOptimization(agentData, evaluationResults, targets, options);
  }
  
  /**
   * Calculate recommended changes based on evaluation results
   * 
   * @param {Object} agentData - Agent data
   * @param {Object} evaluationResults - Evaluation results
   * @param {Array<string>} targets - Optimization targets
   * @param {Object} options - Optimization options
   * @returns {Promise<Array<Object>>} Recommended changes
   * @private
   */
  async _calculateRecommendedChanges(agentData, evaluationResults, targets, options = {}) {
    try {
      const { agentId, agentType } = agentData;
      const changes = [];
      
      // Get the metrics from the evaluation results
      const metrics = evaluationResults.metrics || {};
      
      // Process each optimization target
      for (const target of targets) {
        switch (target) {
          case 'parameters':
            // Get parameter changes
            const paramChanges = await this._getParameterChanges(
              agentData,
              metrics,
              options
            );
            changes.push(...paramChanges);
            break;
            
          case 'strategies':
            // Get strategy changes
            const strategyChanges = await this._getStrategyChanges(
              agentData,
              metrics,
              options
            );
            changes.push(...strategyChanges);
            break;
            
          case 'schemas':
            // Get schema changes (not implemented yet)
            logger.warn(`Schema optimization not fully implemented`);
            break;
            
          default:
            logger.warn(`Unknown optimization target: ${target}`);
        }
      }
      
      return changes;
    } catch (error) {
      logger.error(`Error calculating recommended changes: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get recommended parameter changes
   * 
   * @param {Object} agentData - Agent data
   * @param {Object} metrics - Evaluation metrics
   * @param {Object} options - Optimization options
   * @returns {Promise<Array<Object>>} Parameter changes
   * @private
   */
  async _getParameterChanges(agentData, metrics, options = {}) {
    try {
      const { agentId, agentType, parameters } = agentData;
      const changes = [];
      
      // Get parameter schema for this agent type
      const baseSchema = this.optimizationSchemas.parameters.generic || {};
      const typeSchema = this.optimizationSchemas.parameters[agentType] || {};
      
      // Combine schemas
      const parameterSchema = { ...baseSchema, ...typeSchema };
      
      // Loop through each parameter in the schema
      for (const [paramName, schema] of Object.entries(parameterSchema)) {
        // Get current value
        const currentValue = parameters[paramName] !== undefined ? 
          parameters[paramName] : schema.default;
        
        // Skip if parameter is locked
        if (options.lockedParameters && 
            options.lockedParameters.includes(paramName)) {
          continue;
        }
        
        // Check if we should adjust this parameter based on metrics
        const impactMetric = schema.impact;
        let metricValue = null;
        
        // Find the relevant metric
        for (const [metricName, metric] of Object.entries(metrics)) {
          if (metricName.toLowerCase() === impactMetric.toLowerCase()) {
            metricValue = typeof metric === 'object' ? metric.score : metric;
            break;
          }
        }
        
        // Skip if we don't have a metric value
        if (metricValue === null) {
          continue;
        }
        
        // Determine if we should adjust this parameter
        // If the metric is good (>80), make small adjustments
        // If the metric is poor (<60), make larger adjustments
        let adjustmentNeeded = false;
        let adjustmentDirection = 0;
        let adjustmentMagnitude = 0;
        
        if (metricValue < 60) {
          adjustmentNeeded = true;
          adjustmentMagnitude = this.config.learningRate * 2;
        } else if (metricValue < 80) {
          adjustmentNeeded = true;
          adjustmentMagnitude = this.config.learningRate;
        } else if (metricValue < 90) {
          // Only adjust sometimes for fine-tuning
          adjustmentNeeded = Math.random() < this.config.explorationRate;
          adjustmentMagnitude = this.config.learningRate * 0.5;
        } else {
          // Rarely adjust parameters that are already good
          adjustmentNeeded = Math.random() < this.config.explorationRate * 0.3;
          adjustmentMagnitude = this.config.learningRate * 0.2;
        }
        
        // Skip if no adjustment needed
        if (!adjustmentNeeded) {
          continue;
        }
        
        // Calculate new value based on parameter type
        let newValue = currentValue;
        let estimatedImprovement = 0;
        
        switch (schema.type) {
          case 'numeric':
            // Determine direction based on exploration vs exploitation
            if (Math.random() < this.config.explorationRate) {
              // Exploration: try random direction
              adjustmentDirection = Math.random() > 0.5 ? 1 : -1;
            } else {
              // Exploitation: If metric is poor, move toward the default
              if (metricValue < 70) {
                adjustmentDirection = currentValue < schema.default ? 1 : -1;
              } else {
                // If metric is decent, keep moving in same direction as previous changes
                // (This would require tracking previous changes, simplified here)
                adjustmentDirection = Math.random() > 0.5 ? 1 : -1;
              }
            }
            
            // Calculate adjustment amount
            const range = schema.max - schema.min;
            const adjustmentAmount = range * adjustmentMagnitude * adjustmentDirection;
            
            // Calculate new value with bounds checking
            newValue = Math.max(schema.min, Math.min(schema.max, currentValue + adjustmentAmount));
            
            // Round to integer if it makes sense
            if (range > 10 && schema.min >= 1) {
              newValue = Math.round(newValue);
            }
            
            // Estimate improvement
            estimatedImprovement = (100 - metricValue) * adjustmentMagnitude * 
              (1 - Math.abs(currentValue - schema.default) / range);
            break;
            
          case 'categorical':
            // Only change categorical parameters occasionally
            if (Math.random() < this.config.explorationRate * 1.5) {
              // Exclude current value from options
              const options = schema.values.filter(v => v !== currentValue);
              
              if (options.length > 0) {
                // Select a random value
                newValue = options[Math.floor(Math.random() * options.length)];
                
                // Estimate improvement (more speculative for categorical)
                estimatedImprovement = (100 - metricValue) * 0.3;
              }
            }
            break;
            
          default:
            // Skip unknown parameter types
            continue;
        }
        
        // Skip if no change
        if (newValue === currentValue) {
          continue;
        }
        
        // Add change to the list
        changes.push({
          type: 'parameter',
          name: paramName,
          currentValue,
          newValue,
          estimatedImprovement,
          impact: schema.impact,
          confidence: metricValue < 70 ? 'high' : 
            (metricValue < 85 ? 'medium' : 'low')
        });
      }
      
      return changes;
    } catch (error) {
      logger.error(`Error getting parameter changes: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get recommended strategy changes
   * 
   * @param {Object} agentData - Agent data
   * @param {Object} metrics - Evaluation metrics
   * @param {Object} options - Optimization options
   * @returns {Promise<Array<Object>>} Strategy changes
   * @private
   */
  async _getStrategyChanges(agentData, metrics, options = {}) {
    try {
      const { agentId, agentType, strategies } = agentData;
      const changes = [];
      
      // Get strategy schema for this agent type
      const baseSchema = this.optimizationSchemas.strategies.generic || {};
      const typeSchema = this.optimizationSchemas.strategies[agentType] || {};
      
      // Combine schemas
      const strategySchema = { ...baseSchema, ...typeSchema };
      
      // Loop through each strategy in the schema
      for (const [strategyName, schema] of Object.entries(strategySchema)) {
        // Get current value
        const currentValue = strategies[strategyName] !== undefined ? 
          strategies[strategyName] : schema.default;
        
        // Skip if strategy is locked
        if (options.lockedStrategies && 
            options.lockedStrategies.includes(strategyName)) {
          continue;
        }
        
        // Check if we should adjust this strategy based on metrics
        const impactMetric = schema.impact;
        let metricValue = null;
        
        // Find the relevant metric
        for (const [metricName, metric] of Object.entries(metrics)) {
          if (metricName.toLowerCase() === impactMetric.toLowerCase()) {
            metricValue = typeof metric === 'object' ? metric.score : metric;
            break;
          }
        }
        
        // Skip if we don't have a metric value
        if (metricValue === null) {
          continue;
        }
        
        // For strategies, we're more conservative about changes
        // Only change if the metric is poor or randomly for exploration
        let shouldChange = false;
        
        if (metricValue < 70) {
          // Metric is poor, likely need a strategy change
          shouldChange = true;
        } else if (metricValue < 85) {
          // Metric is OK, occasionally try a different strategy
          shouldChange = Math.random() < this.config.explorationRate;
        } else {
          // Metric is good, rarely try a different strategy
          shouldChange = Math.random() < this.config.explorationRate * 0.3;
        }
        
        // Skip if no change needed
        if (!shouldChange) {
          continue;
        }
        
        // For categorical strategies, select a new value
        if (schema.type === 'categorical' && schema.values.length > 1) {
          // Exclude current value from options
          const options = schema.values.filter(v => v !== currentValue);
          
          if (options.length > 0) {
            // Select a new value:
            // - If metric is poor, prefer the default
            // - Otherwise select randomly
            let newValue;
            
            if (metricValue < 60 && schema.default !== currentValue) {
              newValue = schema.default;
            } else {
              newValue = options[Math.floor(Math.random() * options.length)];
            }
            
            // Estimate improvement (speculative for strategy changes)
            const estimatedImprovement = metricValue < 70 ? 
              (100 - metricValue) * 0.4 : // Likely significant improvement
              (100 - metricValue) * 0.2;  // Moderate improvement
            
            // Add change to the list
            changes.push({
              type: 'strategy',
              name: strategyName,
              currentValue,
              newValue,
              estimatedImprovement,
              impact: schema.impact,
              confidence: metricValue < 60 ? 'high' : 
                (metricValue < 80 ? 'medium' : 'low')
            });
          }
        }
      }
      
      return changes;
    } catch (error) {
      logger.error(`Error getting strategy changes: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Estimate the overall improvement from a set of changes
   * 
   * @param {Array<Object>} changes - Recommended changes
   * @param {Object} evaluationResults - Evaluation results
   * @returns {number} Estimated improvement percentage
   * @private
   */
  _estimateImprovement(changes, evaluationResults) {
    try {
      if (changes.length === 0) {
        return 0;
      }
      
      // Start with the current overall score
      const currentScore = evaluationResults.score || 50;
      
      // Track improvements by impact area to avoid double-counting
      const impactAreas = {};
      
      // Calculate estimated improvement for each area
      for (const change of changes) {
        const area = change.impact;
        
        if (!impactAreas[area]) {
          impactAreas[area] = {
            improvements: [],
            maxImprovement: 0
          };
        }
        
        impactAreas[area].improvements.push(change.estimatedImprovement);
        impactAreas[area].maxImprovement = Math.max(
          impactAreas[area].maxImprovement,
          change.estimatedImprovement
        );
      }
      
      // Calculate total improvement across areas
      // Use 100% of the max improvement in each area
      // plus 20% of additional improvements (diminishing returns)
      let totalImprovement = 0;
      
      for (const area in impactAreas) {
        const { improvements, maxImprovement } = impactAreas[area];
        
        // Calculate additional improvements
        const additionalImprovements = improvements
          .filter(imp => imp < maxImprovement)
          .reduce((sum, imp) => sum + imp, 0);
        
        // Add to total
        totalImprovement += maxImprovement + (additionalImprovements * 0.2);
      }
      
      // Scale based on how close we are to 100
      // Changes have less effect when score is already high
      const scaleFactor = (100 - currentScore) / 50;
      
      // Calculate final improvement
      return totalImprovement * scaleFactor;
    } catch (error) {
      logger.error(`Error estimating improvement: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Summarize changes
   * 
   * @param {Array<Object>} changes - Optimization changes
   * @returns {Object} Change summary
   * @private
   */
  _summarizeChanges(changes) {
    try {
      // Count different types of changes
      let parametersAdjusted = 0;
      let strategiesChanged = 0;
      let schemasModified = 0;
      
      for (const change of changes) {
        switch (change.type) {
          case 'parameter':
            parametersAdjusted++;
            break;
            
          case 'strategy':
            strategiesChanged++;
            break;
            
          case 'schema':
            schemasModified++;
            break;
        }
      }
      
      return {
        parametersAdjusted,
        strategiesChanged,
        schemasModified,
        totalChanges: changes.length
      };
    } catch (error) {
      logger.error(`Error summarizing changes: ${error.message}`);
      
      return {
        parametersAdjusted: 0,
        strategiesChanged: 0,
        schemasModified: 0,
        totalChanges: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Apply optimization changes to an agent
   * 
   * @param {Object} agentData - Agent data
   * @param {Array<Object>} changes - Changes to apply
   * @param {Object} evaluationResults - Evaluation results
   * @returns {Promise<boolean>} Success indicator
   * @private
   */
  async _applyOptimizationChanges(agentData, changes, evaluationResults) {
    try {
      const { agentId, agent } = agentData;
      
      logger.info(`Applying ${changes.length} optimization changes to agent ${agentId}`);
      
      // Group changes by type
      const parameterChanges = {};
      const strategyChanges = {};
      
      for (const change of changes) {
        switch (change.type) {
          case 'parameter':
            parameterChanges[change.name] = change.newValue;
            break;
            
          case 'strategy':
            strategyChanges[change.name] = change.newValue;
            break;
        }
      }
      
      // Apply parameter changes
      if (Object.keys(parameterChanges).length > 0) {
        try {
          if (agent.updateParameters) {
            await agent.updateParameters(parameterChanges);
            
            // Update stored parameters
            agentData.parameters = {
              ...agentData.parameters,
              ...parameterChanges
            };
            
            logger.info(`Updated ${Object.keys(parameterChanges).length} parameters for agent ${agentId}`);
          } else {
            logger.warn(`Agent ${agentId} does not support parameter updates`);
          }
        } catch (error) {
          logger.error(`Error updating parameters for agent ${agentId}: ${error.message}`);
        }
      }
      
      // Apply strategy changes
      if (Object.keys(strategyChanges).length > 0) {
        try {
          if (agent.updateStrategies) {
            await agent.updateStrategies(strategyChanges);
            
            // Update stored strategies
            agentData.strategies = {
              ...agentData.strategies,
              ...strategyChanges
            };
            
            logger.info(`Updated ${Object.keys(strategyChanges).length} strategies for agent ${agentId}`);
          } else {
            logger.warn(`Agent ${agentId} does not support strategy updates`);
          }
        } catch (error) {
          logger.error(`Error updating strategies for agent ${agentId}: ${error.message}`);
        }
      }
      
      return true;
    } catch (error) {
      logger.error(`Error applying optimization changes: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Store optimization result in history
   * 
   * @param {string} agentId - Agent ID
   * @param {Object} optimizationResult - Optimization result
   * @param {Object} evaluationResults - Evaluation results
   * @returns {Promise<void>}
   * @private
   */
  async _storeOptimizationResult(agentId, optimizationResult, evaluationResults) {
    try {
      // Create result with timestamp
      const resultWithTimestamp = {
        ...optimizationResult,
        timestamp: new Date().toISOString(),
        evaluationScore: evaluationResults.score
      };
      
      // Get history for this agent
      if (!this.optimizationHistory.has(agentId)) {
        this.optimizationHistory.set(agentId, []);
      }
      
      const history = this.optimizationHistory.get(agentId);
      
      // Add to history
      history.push(resultWithTimestamp);
      
      // Limit history length
      if (history.length > this.config.historyLength) {
        history.shift(); // Remove oldest
      }
      
      // Save to disk
      await this._saveOptimizationResult(agentId, resultWithTimestamp);
    } catch (error) {
      logger.error(`Error storing optimization result: ${error.message}`);
    }
  }
  
  /**
   * Save optimization result to disk
   * 
   * @param {string} agentId - Agent ID
   * @param {Object} result - Optimization result
   * @returns {Promise<void>}
   * @private
   */
  async _saveOptimizationResult(agentId, result) {
    try {
      // Create agent directory if it doesn't exist
      const agentDir = path.join(this.config.dataDirectory, agentId);
      await fs.mkdir(agentDir, { recursive: true });
      
      // Generate file name based on timestamp
      const timestamp = new Date(result.timestamp)
        .toISOString()
        .replace(/:/g, '-')
        .replace(/\..+/, '');
      
      const fileName = `optimization-${timestamp}.json`;
      const filePath = path.join(agentDir, fileName);
      
      // Write result to file
      await fs.writeFile(
        filePath,
        JSON.stringify(result, null, 2),
        'utf8'
      );
      
      logger.info(`Saved optimization result to ${filePath}`);
    } catch (error) {
      logger.error(`Error saving optimization result: ${error.message}`);
    }
  }
  
  /**
   * Get optimization history for an agent
   * 
   * @param {string} agentId - Agent ID
   * @param {Object} options - Query options
   * @returns {Promise<Array<Object>>} Optimization history
   */
  async getOptimizationHistory(agentId, options = {}) {
    try {
      const limit = options.limit || 10;
      const skip = options.skip || 0;
      
      // Get history from memory
      if (this.optimizationHistory.has(agentId)) {
        const history = this.optimizationHistory.get(agentId);
        
        // Sort by timestamp (newest first)
        const sortedHistory = [...history]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Apply skip and limit
        return sortedHistory.slice(skip, skip + limit);
      }
      
      // If not in memory, try to load from disk
      const agentDir = path.join(this.config.dataDirectory, agentId);
      
      try {
        await fs.access(agentDir);
        
        // Get all optimization files
        const files = await fs.readdir(agentDir);
        
        // Filter for optimization files
        const optimizationFiles = files
          .filter(file => file.startsWith('optimization-') && file.endsWith('.json'))
          .sort((a, b) => b.localeCompare(a)); // Sort by name (newest first)
        
        // Apply skip and limit
        const selectedFiles = optimizationFiles.slice(skip, skip + limit);
        
        // Load optimization results
        const history = [];
        
        for (const file of selectedFiles) {
          try {
            const filePath = path.join(agentDir, file);
            const fileData = await fs.readFile(filePath, 'utf8');
            history.push(JSON.parse(fileData));
          } catch (error) {
            logger.error(`Error loading optimization result ${file}: ${error.message}`);
          }
        }
        
        return history;
      } catch (error) {
        logger.warn(`Agent directory not found: ${agentDir}`);
        return [];
      }
    } catch (error) {
      logger.error(`Error getting optimization history: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get the latest optimization result for an agent
   * 
   * @param {string} agentId - Agent ID
   * @returns {Promise<Object|null>} Latest optimization result or null if none found
   */
  async getLatestOptimization(agentId) {
    try {
      // Get optimization history (limited to 1)
      const history = await this.getOptimizationHistory(agentId, { limit: 1 });
      
      return history.length > 0 ? history[0] : null;
    } catch (error) {
      logger.error(`Error getting latest optimization: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Get recommended optimization settings for a new agent
   * 
   * @param {string} agentType - Agent type
   * @returns {Promise<Object>} Recommended settings
   */
  async getRecommendedSettings(agentType) {
    try {
      // Get parameter schemas
      const baseParams = this.optimizationSchemas.parameters.generic || {};
      const typeParams = this.optimizationSchemas.parameters[agentType] || {};
      
      // Get strategy schemas
      const baseStrategies = this.optimizationSchemas.strategies.generic || {};
      const typeStrategies = this.optimizationSchemas.strategies[agentType] || {};
      
      // Combine schemas
      const parameterSchema = { ...baseParams, ...typeParams };
      const strategySchema = { ...baseStrategies, ...typeStrategies };
      
      // Extract default values
      const parameters = {};
      const strategies = {};
      
      for (const [name, schema] of Object.entries(parameterSchema)) {
        parameters[name] = schema.default;
      }
      
      for (const [name, schema] of Object.entries(strategySchema)) {
        strategies[name] = schema.default;
      }
      
      return {
        parameters,
        strategies
      };
    } catch (error) {
      logger.error(`Error getting recommended settings: ${error.message}`);
      return {
        parameters: {},
        strategies: {}
      };
    }
  }
  
  /**
   * Stop the optimization system
   * 
   * @returns {Promise<boolean>} Success indicator
   */
  async stop() {
    try {
      logger.info('Stopping Optimization System');
      
      // No active resources to clean up
      
      logger.info('Optimization System stopped');
      return true;
    } catch (error) {
      logger.error(`Error stopping Optimization System: ${error.message}`);
      return false;
    }
  }
}

module.exports = OptimizationSystem;