/**
 * HELiiX Intelligence Connector Agent
 * 
 * This specialized agent serves as a bridge between the FlexTime JavaScript agent system
 * and the HELiiX Intelligence Engine Python backend. It delegates complex computational
 * tasks to the Python backend while maintaining the agent-based architecture.
 * 
 * The connector implements the recommendations from the executive briefing to shift
 * primary scheduling intelligence and heavy computational tasks to the Python backend.
 */

const Agent = require('../agent');
const logger = require('../../utils/logger');
const IntelligenceEngineClient = require('../intelligence_engine_client');
const { v4: uuidv4 } = require('uuid');

class HELiiXIntelligenceConnectorAgent extends Agent {
  /**
   * Initialize a new HELiiX Intelligence Connector Agent
   * 
   * @param {Object} config - Configuration options
   * @param {Object} mcpConnector - MCP connector for model interactions
   */
  constructor(config = {}, mcpConnector = null) {
    super('heliix_intelligence_connector', 'connector', mcpConnector);
    
    // Store configuration
    this.config = config;
    
    // Initialize the Intelligence Engine client
    this.engineClient = new IntelligenceEngineClient(config.intelligence || {});
    
    // Track active backend tasks
    this.activeTasks = new Map();
    
    // Define task types that can be delegated to the backend
    this.backendCapabilities = {
      scheduling: [
        'generate_schedule',
        'optimize_schedule',
        'validate_schedule',
        'select_algorithm',
        'analyze_conflicts',
        'resolve_conflicts'
      ],
      analysis: [
        'analyze_constraints',
        'evaluate_metrics',
        'predict_outcomes',
        'generate_insights'
      ],
      learning: [
        'process_feedback',
        'extract_patterns',
        'update_models',
        'recommend_parameters'
      ]
    };
    
    // Define supported response formats
    this.responseFormats = [
      'json',       // Raw JSON response from backend
      'summarized', // Simplified summary of results
      'agent'       // Formatted for agent-to-agent communication
    ];
    
    logger.info('HELiiX Intelligence Connector Agent initialized');
  }
  
  /**
   * Initialize the agent
   * 
   * @returns {Promise<boolean>} Success indicator
   */
  async initialize() {
    try {
      logger.info('Initializing HELiiX Intelligence Connector Agent');
      
      // Initialize the Intelligence Engine client
      const success = await this.engineClient.initialize();
      
      if (!success) {
        logger.warn('Failed to initialize Intelligence Engine client, some functionality may be limited');
      }
      
      // Get status to verify connection and available endpoints
      const status = await this.engineClient.getStatus();
      logger.info('Intelligence Engine status:', status);
      
      // Start the agent
      await super.start();
      
      logger.info('HELiiX Intelligence Connector Agent initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Error initializing HELiiX Intelligence Connector Agent: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Check if a task can be delegated to the backend
   * 
   * @param {string} taskType - Type of task
   * @returns {boolean} Whether the task can be delegated
   */
  canDelegateTask(taskType) {
    return Object.values(this.backendCapabilities).some(capabilities => 
      capabilities.includes(taskType)
    );
  }
  
  /**
   * Get the category for a task type
   * 
   * @param {string} taskType - Type of task
   * @returns {string|null} Category or null if not found
   */
  getTaskCategory(taskType) {
    for (const [category, capabilities] of Object.entries(this.backendCapabilities)) {
      if (capabilities.includes(taskType)) {
        return category;
      }
    }
    return null;
  }
  
  /**
   * Delegate a task to the HELiiX Intelligence Engine
   * 
   * @param {Object} task - Task to delegate
   * @param {Object} options - Delegation options
   * @returns {Promise<Object>} Task result
   */
  async delegateToIntelligenceEngine(task, options = {}) {
    try {
      const taskType = task.taskType;
      const category = this.getTaskCategory(taskType);
      
      if (!category) {
        throw new Error(`Unsupported task type for delegation: ${taskType}`);
      }
      
      // Prepare the task for the backend
      const backendTask = {
        taskId: task.taskId || uuidv4(),
        type: taskType,
        category,
        parameters: task.parameters || {},
        wait: options.wait !== false, // Wait for result by default
        responseFormat: options.responseFormat || 'json'
      };
      
      logger.info(`Delegating ${taskType} task to Intelligence Engine`);
      
      // Submit the task to the Intelligence Engine
      const response = await this.engineClient.submitAgentTask({
        agentId: `python_${category}_agent`, // Backend agent ID
        taskType: backendTask.type,
        parameters: backendTask.parameters,
        wait: backendTask.wait
      });
      
      if (!response.success) {
        throw new Error(`Failed to submit task to Intelligence Engine: ${response.error}`);
      }
      
      // Handle async task
      if (response.async) {
        // Store the task ID for later retrieval
        this.activeTasks.set(backendTask.taskId, {
          backendTaskId: response.taskId,
          status: 'pending',
          submitted: new Date().toISOString()
        });
        
        // If wait is false, return the task ID immediately
        if (!backendTask.wait) {
          return {
            success: true,
            status: 'pending',
            taskId: backendTask.taskId,
            message: `Task submitted to Intelligence Engine, task ID: ${response.taskId}`
          };
        }
        
        // Otherwise, wait for the result
        return this._waitForTaskCompletion(backendTask.taskId, response.taskId, options.timeout);
      }
      
      // Handle synchronous task with immediate result
      const result = this._formatResponse(response.result, backendTask.responseFormat);
      
      return {
        success: true,
        status: 'completed',
        taskId: backendTask.taskId,
        result
      };
    } catch (error) {
      logger.error(`Error delegating task to Intelligence Engine: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Wait for a task to complete
   * 
   * @param {string} taskId - Local task ID
   * @param {string} backendTaskId - Backend task ID
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Object>} Task result
   * @private
   */
  async _waitForTaskCompletion(taskId, backendTaskId, timeout = 60000) {
    try {
      const startTime = Date.now();
      const pollInterval = 1000; // 1 second
      
      // Poll for task completion
      while (Date.now() - startTime < timeout) {
        // Check if task has completed
        const response = await this.engineClient.client.get(`/agents/tasks/${backendTaskId}`);
        
        if (response.data.status === 'completed') {
          // Task completed successfully
          const result = this._formatResponse(response.data.result, response.data.responseFormat || 'json');
          
          // Update active task
          this.activeTasks.set(taskId, {
            backendTaskId,
            status: 'completed',
            submitted: this.activeTasks.get(taskId)?.submitted,
            completed: new Date().toISOString()
          });
          
          return {
            success: true,
            status: 'completed',
            taskId,
            result
          };
        } else if (response.data.status === 'failed') {
          // Task failed
          this.activeTasks.set(taskId, {
            backendTaskId,
            status: 'failed',
            submitted: this.activeTasks.get(taskId)?.submitted,
            completed: new Date().toISOString(),
            error: response.data.error
          });
          
          throw new Error(`Task failed: ${response.data.error}`);
        }
        
        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      
      // Timeout reached
      this.activeTasks.set(taskId, {
        backendTaskId,
        status: 'timeout',
        submitted: this.activeTasks.get(taskId)?.submitted,
        completed: new Date().toISOString()
      });
      
      throw new Error(`Task timed out after ${timeout}ms`);
    } catch (error) {
      logger.error(`Error waiting for task completion: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Format the response based on the requested format
   * 
   * @param {Object} result - Raw result from the backend
   * @param {string} format - Requested format
   * @returns {Object} Formatted result
   * @private
   */
  _formatResponse(result, format = 'json') {
    if (!this.responseFormats.includes(format)) {
      logger.warn(`Unknown response format: ${format}, using 'json'`);
      format = 'json';
    }
    
    switch (format) {
      case 'json':
        // Return the raw JSON response
        return result;
        
      case 'summarized':
        // Create a simplified summary
        return this._createSummary(result);
        
      case 'agent':
        // Format for agent-to-agent communication
        return {
          type: result.type || 'result',
          content: result,
          metadata: {
            source: 'intelligence_engine',
            timestamp: new Date().toISOString()
          }
        };
        
      default:
        return result;
    }
  }
  
  /**
   * Create a summary of the result
   * 
   * @param {Object} result - Raw result from the backend
   * @returns {Object} Summarized result
   * @private
   */
  _createSummary(result) {
    try {
      // Default summary structure
      const summary = {
        success: result.success !== false,
        type: result.type || 'unknown'
      };
      
      // Add key metrics based on result type
      if (result.type === 'schedule') {
        summary.metrics = {
          gameCount: result.games?.length || 0,
          conflictCount: result.conflicts?.length || 0,
          quality: result.metrics?.quality || 0
        };
      } else if (result.type === 'optimization') {
        summary.metrics = {
          initialScore: result.metrics?.initialScore,
          finalScore: result.metrics?.finalScore,
          improvement: result.metrics?.improvement,
          iterations: result.metrics?.iterations
        };
      } else if (result.type === 'analysis') {
        summary.metrics = {
          insightCount: result.insights?.length || 0,
          recommendationCount: result.recommendations?.length || 0
        };
      }
      
      // Add key information based on the result structure
      if (result.message) {
        summary.message = result.message;
      }
      
      if (result.warnings && result.warnings.length > 0) {
        summary.warningCount = result.warnings.length;
      }
      
      return summary;
    } catch (error) {
      logger.warn(`Error creating summary: ${error.message}`);
      return { success: true, note: 'Summary generation failed, see raw result' };
    }
  }
  
  /**
   * Get task status
   * 
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Task status
   */
  async getTaskStatus(taskId) {
    try {
      // Check if we have the task locally
      const task = this.activeTasks.get(taskId);
      
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }
      
      // If task is already completed or failed, return the status
      if (['completed', 'failed', 'timeout'].includes(task.status)) {
        return {
          success: true,
          taskId,
          status: task.status,
          submitted: task.submitted,
          completed: task.completed,
          ...(task.error && { error: task.error })
        };
      }
      
      // Otherwise, check the status from the backend
      const response = await this.engineClient.client.get(`/agents/tasks/${task.backendTaskId}`);
      
      // Update local task status
      this.activeTasks.set(taskId, {
        ...task,
        status: response.data.status,
        ...(response.data.status === 'completed' && { completed: new Date().toISOString() }),
        ...(response.data.error && { error: response.data.error })
      });
      
      return {
        success: true,
        taskId,
        status: response.data.status,
        submitted: task.submitted,
        ...(response.data.status === 'completed' && { completed: new Date().toISOString() }),
        ...(response.data.error && { error: response.data.error })
      };
    } catch (error) {
      logger.error(`Error getting task status: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get task result
   * 
   * @param {string} taskId - Task ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Task result
   */
  async getTaskResult(taskId, options = {}) {
    try {
      // Check if we have the task locally
      const task = this.activeTasks.get(taskId);
      
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }
      
      // If task is not completed, check status
      if (task.status !== 'completed') {
        const status = await this.getTaskStatus(taskId);
        
        if (status.status !== 'completed') {
          throw new Error(`Task is not completed: ${status.status}`);
        }
      }
      
      // Get result from backend
      const response = await this.engineClient.client.get(`/agents/tasks/${task.backendTaskId}/result`);
      
      // Format the result
      const format = options.responseFormat || 'json';
      const result = this._formatResponse(response.data.result, format);
      
      return {
        success: true,
        taskId,
        result
      };
    } catch (error) {
      logger.error(`Error getting task result: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Store feedback in the Intelligence Engine
   * 
   * @param {Object} feedback - Feedback data
   * @returns {Promise<Object>} Storage result
   */
  async storeFeedback(feedback) {
    try {
      logger.info('Storing feedback in Intelligence Engine');
      
      // Ensure feedback has required fields
      if (!feedback.scheduleId) {
        throw new Error('Feedback must have a scheduleId');
      }
      
      // Add timestamp if not present
      if (!feedback.timestamp) {
        feedback.timestamp = new Date().toISOString();
      }
      
      // Store feedback in the Intelligence Engine
      const result = await this.engineClient.storeFeedback({
        ...feedback,
        agentId: this.agentId,
        source: 'heliix_intelligence_connector'
      });
      
      return {
        success: true,
        id: result
      };
    } catch (error) {
      logger.error(`Error storing feedback: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Store an experience in the Intelligence Engine
   * 
   * @param {Object} experience - Experience data
   * @returns {Promise<Object>} Storage result
   */
  async storeExperience(experience) {
    try {
      logger.info('Storing experience in Intelligence Engine');
      
      // Ensure experience has required fields
      if (!experience.type || !experience.content) {
        throw new Error('Experience must have type and content');
      }
      
      // Add timestamp if not present
      if (!experience.timestamp) {
        experience.timestamp = new Date().toISOString();
      }
      
      // Store experience in the Intelligence Engine
      const result = await this.engineClient.storeExperience({
        ...experience,
        agentId: experience.agentId || this.agentId,
        source: 'heliix_intelligence_connector'
      });
      
      return {
        success: true,
        id: result
      };
    } catch (error) {
      logger.error(`Error storing experience: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get scheduling recommendations
   * 
   * @param {Object} parameters - Scheduling parameters
   * @returns {Promise<Object>} Recommendations
   */
  async getSchedulingRecommendations(parameters) {
    try {
      logger.info('Getting scheduling recommendations from Intelligence Engine');
      
      // Get recommendations from the Intelligence Engine
      const result = await this.engineClient.getSchedulingRecommendations(parameters);
      
      return result;
    } catch (error) {
      logger.error(`Error getting scheduling recommendations: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get advanced learning recommendations
   * 
   * @param {Object} parameters - Learning parameters
   * @returns {Promise<Object>} Recommendations
   */
  async getAdvancedLearningRecommendations(parameters) {
    try {
      logger.info('Getting advanced learning recommendations from Intelligence Engine');
      
      // Get recommendations from the Intelligence Engine
      const result = await this.engineClient.getAdvancedLearningRecommendations(parameters);
      
      return result;
    } catch (error) {
      logger.error(`Error getting advanced learning recommendations: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Process a task (Agent base class implementation)
   * 
   * @param {object} task - The task to process
   * @returns {Promise<any>} Task result
   * @private
   */
  async _processTask(task) {
    logger.info(`Processing HELiiX Intelligence Connector task ${task.taskId}: ${task.description}`);
    
    switch (task.taskType) {
      case 'delegate':
        // Task specifically for delegation to the Intelligence Engine
        return await this.delegateToIntelligenceEngine(task.parameters.task, task.parameters.options);
        
      case 'get_task_status':
        return await this.getTaskStatus(task.parameters.taskId);
        
      case 'get_task_result':
        return await this.getTaskResult(task.parameters.taskId, task.parameters.options);
        
      case 'store_feedback':
        return await this.storeFeedback(task.parameters.feedback);
        
      case 'store_experience':
        return await this.storeExperience(task.parameters.experience);
        
      case 'get_scheduling_recommendations':
        return await this.getSchedulingRecommendations(task.parameters);
        
      case 'get_advanced_learning_recommendations':
        return await this.getAdvancedLearningRecommendations(task.parameters);
        
      default:
        // Check if this task can be delegated to the Intelligence Engine
        if (this.canDelegateTask(task.taskType)) {
          return await this.delegateToIntelligenceEngine(task);
        }
        
        throw new Error(`Unknown task type: ${task.taskType}`);
    }
  }
  
  /**
   * Process a message
   * 
   * @param {object} message - The message to process
   * @private
   */
  _processMessage(message) {
    if (message.messageType === 'delegate') {
      const task = this.createTask(
        'delegate',
        message.content.description || 'Delegate task to Intelligence Engine',
        {
          task: message.content.task,
          options: message.content.options
        }
      );
      
      this.submitTask(task);
      
      logger.info('Received delegation request');
    } else if (message.messageType === 'feedback') {
      const task = this.createTask(
        'store_feedback',
        'Store feedback in Intelligence Engine',
        {
          feedback: message.content
        }
      );
      
      this.submitTask(task);
      
      logger.info('Received feedback storage request');
    } else if (message.messageType === 'experience') {
      const task = this.createTask(
        'store_experience',
        'Store experience in Intelligence Engine',
        {
          experience: message.content
        }
      );
      
      this.submitTask(task);
      
      logger.info('Received experience storage request');
    } else {
      super._processMessage(message);
    }
  }
  
  /**
   * Stop the agent and clean up resources
   */
  async stop() {
    logger.info('Stopping HELiiX Intelligence Connector Agent');
    
    // Shutdown the Intelligence Engine client
    await this.engineClient.shutdown();
    
    await super.stop();
  }
}

module.exports = HELiiXIntelligenceConnectorAgent;