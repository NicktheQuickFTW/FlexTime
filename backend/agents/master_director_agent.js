/**
 * Master Director Agent for the FlexTime multi-agent system.
 * 
 * This module implements the Master Director Agent that coordinates
 * all domain-specific director agents.
 */

const Agent = require('./agent');
const logger = require('../utils/logger');
const { SchedulingDirectorAgent } = require('./director/scheduling_director');
const { OperationsDirectorAgent } = require('./director/operations_director');
const { AnalysisDirectorAgent } = require('./director/analysis_director');

/**
 * Master Director Agent that coordinates all domain-specific director agents.
 */
class MasterDirectorAgent extends Agent {
  /**
   * Initialize a new Master Director Agent.
   * 
   * @param {object} config - Configuration object
   * @param {object} mcpConnector - MCP server connector
   */
  constructor(config, mcpConnector) {
    super('master_director', 'director', mcpConnector);
    this.config = config;
    this.directorAgents = {};
    
    logger.info('Master Director Agent initialized');
  }
  
  /**
   * Initialize and register all director agents.
   * 
   * @param {object} communicationManager - Communication manager to register with
   */
  initializeDirectors(communicationManager) {
    // Create director agents
    this.directorAgents.scheduling = new SchedulingDirectorAgent(this.config, this.mcpConnector);
    this.directorAgents.operations = new OperationsDirectorAgent(this.config, this.mcpConnector);
    this.directorAgents.analysis = new AnalysisDirectorAgent(this.config, this.mcpConnector);
    
    // Register with communication manager
    for (const [key, agent] of Object.entries(this.directorAgents)) {
      agent.register(communicationManager);
      agent.start();
    }
    
    logger.info('All director agents initialized and started');
  }
  
  /**
   * Process a task by delegating to the appropriate director agent.
   * 
   * @param {object} task - The task to process
   * @returns {Promise<any>} Task result
   * @private
   */
  async _processTask(task) {
    logger.info(`Master Director processing task: ${task.taskType}`);
    
    // Determine which director should handle this task
    const responsibleDirector = this._determineResponsibleDirector(task);
    
    if (!responsibleDirector) {
      throw new Error(`No responsible director found for task type: ${task.taskType}`);
    }
    
    // Create a subtask for the responsible director
    const subtask = this._createSubtask(task, responsibleDirector);
    
    // Delegate to the responsible director
    this.delegateTask(responsibleDirector, subtask);
    
    // Wait for the result
    return new Promise((resolve, reject) => {
      const taskId = subtask.taskId;
      
      // Set up one-time handlers for this specific subtask
      const completedHandler = (message) => {
        if (message.content.taskId === taskId) {
          this.eventEmitter.removeListener('subtask_completed', completedHandler);
          this.eventEmitter.removeListener('subtask_failed', failedHandler);
          resolve(message.content.result);
        }
      };
      
      const failedHandler = (message) => {
        if (message.content.taskId === taskId) {
          this.eventEmitter.removeListener('subtask_completed', completedHandler);
          this.eventEmitter.removeListener('subtask_failed', failedHandler);
          reject(new Error(message.content.error));
        }
      };
      
      // Register handlers
      this.eventEmitter.on('subtask_completed', completedHandler);
      this.eventEmitter.on('subtask_failed', failedHandler);
    });
  }
  
  /**
   * Determine which director agent should handle a task.
   * 
   * @param {object} task - The task to process
   * @returns {string} ID of the responsible director agent
   * @private
   */
  _determineResponsibleDirector(task) {
    // Map task types to responsible directors
    const taskTypeMapping = {
      // Scheduling tasks
      'generate_schedule': 'scheduling',
      'optimize_schedule': 'scheduling',
      'analyze_constraints': 'scheduling',
      'select_algorithm': 'scheduling',
      
      // Operations tasks
      'optimize_travel': 'operations',
      'manage_venues': 'operations',
      'allocate_resources': 'operations',
      
      // Analysis tasks
      'analyze_schedule': 'analysis',
      'generate_report': 'analysis',
      'visualize_data': 'analysis'
    };
    
    // Check if task type is directly mapped
    if (taskTypeMapping[task.taskType]) {
      return this.directorAgents[taskTypeMapping[task.taskType]].agentId;
    }
    
    // If not directly mapped, use keywords to determine
    const taskDescription = task.description.toLowerCase();
    
    if (taskDescription.includes('schedule') || 
        taskDescription.includes('algorithm') || 
        taskDescription.includes('constraint')) {
      return this.directorAgents.scheduling.agentId;
    }
    
    if (taskDescription.includes('travel') || 
        taskDescription.includes('venue') || 
        taskDescription.includes('resource')) {
      return this.directorAgents.operations.agentId;
    }
    
    if (taskDescription.includes('analyze') || 
        taskDescription.includes('report') || 
        taskDescription.includes('visualization')) {
      return this.directorAgents.analysis.agentId;
    }
    
    // Default to scheduling if no match found
    return this.directorAgents.scheduling.agentId;
  }
  
  /**
   * Create a subtask from a parent task.
   * 
   * @param {object} parentTask - The parent task
   * @param {string} assignedAgentId - ID of the agent to assign the subtask to
   * @returns {object} The created subtask
   * @private
   */
  _createSubtask(parentTask, assignedAgentId) {
    const subtask = this.createTask(
      parentTask.taskType,
      `Subtask for: ${parentTask.description}`,
      parentTask.parameters,
      parentTask.priority
    );
    
    subtask.parentTaskId = parentTask.taskId;
    
    return subtask;
  }
  
  /**
   * Process a message.
   * 
   * @param {object} message - The message to process
   * @private
   */
  _processMessage(message) {
    if (message.messageType === 'status_update') {
      logger.info(`Status update from ${message.senderId}: ${message.content.status}`);
    } else if (message.messageType === 'error_report') {
      logger.error(`Error report from ${message.senderId}: ${message.content.error}`);
    } else {
      super._processMessage(message);
    }
  }
  
  /**
   * Process a subtask result.
   * 
   * @param {string} taskId - ID of the parent task
   * @param {string} subtaskId - ID of the subtask
   * @param {any} result - Subtask result
   * @private
   */
  _processSubtaskResult(taskId, subtaskId, result) {
    logger.info(`Master Director received result for subtask ${subtaskId}`);
    
    // Emit event for the promise in _processTask
    this.eventEmitter.emit('subtask_completed', {
      content: {
        taskId: subtaskId,
        result: result
      }
    });
  }
  
  /**
   * Process a subtask failure.
   * 
   * @param {string} taskId - ID of the parent task
   * @param {string} subtaskId - ID of the subtask
   * @param {string} error - Error message
   * @private
   */
  _processSubtaskFailure(taskId, subtaskId, error) {
    logger.error(`Master Director received failure for subtask ${subtaskId}: ${error}`);
    
    // Emit event for the promise in _processTask
    this.eventEmitter.emit('subtask_failed', {
      content: {
        taskId: subtaskId,
        error: error
      }
    });
  }
}

module.exports = MasterDirectorAgent;
