/**
 * Operations Director Agent for the FlexTime multi-agent system.
 * 
 * This module implements the Operations Director Agent that coordinates
 * all operations-related specialized agents.
 */

const Agent = require('../agent');
const logger = require("../../lib/logger");;

/**
 * Operations Director Agent that coordinates operations-related specialized agents.
 */
class OperationsDirectorAgent extends Agent {
  /**
   * Initialize a new Operations Director Agent.
   * 
   * @param {object} config - Configuration object
   * @param {object} mcpConnector - MCP server connector
   */
  constructor(config, mcpConnector) {
    super('operations_director', 'director', mcpConnector);
    this.config = config;
    this.specializedAgents = {};
    
    logger.info('Operations Director Agent initialized');
  }
  
  /**
   * Initialize and register all specialized agents.
   * 
   * @param {object} communicationManager - Communication manager to register with
   */
  initializeAgents(communicationManager) {
    // Import specialized agents
    const TravelOptimizationAgent = require('../specialized/travel_optimization_agent');
    const VenueManagementAgent = require('../specialized/venue_management_agent');
    const ResourceAllocationAgent = require('../specialized/resource_allocation_agent');
    
    // Create specialized agents
    this.specializedAgents.travel = new TravelOptimizationAgent(this.mcpConnector);
    this.specializedAgents.venue = new VenueManagementAgent(this.mcpConnector);
    this.specializedAgents.resource = new ResourceAllocationAgent(this.mcpConnector);
    
    // Register with communication manager
    for (const [key, agent] of Object.entries(this.specializedAgents)) {
      // Set full agent ID with prefix
      agent.agentId = `operations.${key}`;
      agent.register(communicationManager);
      agent.start();
    }
    
    logger.info('All operations specialized agents initialized and started');
  }
  
  /**
   * Process a task by delegating to the appropriate specialized agent.
   * 
   * @param {object} task - The task to process
   * @returns {Promise<any>} Task result
   * @private
   */
  async _processTask(task) {
    logger.info(`Operations Director processing task: ${task.taskType}`);
    
    // Determine which specialized agent should handle this task
    const responsibleAgent = this._determineResponsibleAgent(task);
    
    if (!responsibleAgent) {
      throw new Error(`No responsible agent found for task type: ${task.taskType}`);
    }
    
    // Create a subtask for the responsible agent
    const subtask = this._createSubtask(task, responsibleAgent);
    
    // Delegate to the responsible agent
    this.delegateTask(responsibleAgent, subtask);
    
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
   * Determine which specialized agent should handle a task.
   * 
   * @param {object} task - The task to process
   * @returns {string} ID of the responsible specialized agent
   * @private
   */
  _determineResponsibleAgent(task) {
    // Map task types to responsible agents
    const taskTypeMapping = {
      'optimize_travel': 'operations.travel',
      'manage_venues': 'operations.venue',
      'allocate_resources': 'operations.resource'
    };
    
    // Check if task type is directly mapped
    if (taskTypeMapping[task.taskType]) {
      return taskTypeMapping[task.taskType];
    }
    
    // If not directly mapped, use keywords to determine
    const taskDescription = task.description.toLowerCase();
    
    if (taskDescription.includes('travel') || 
        taskDescription.includes('distance') || 
        taskDescription.includes('trip')) {
      return 'operations.travel';
    }
    
    if (taskDescription.includes('venue') || 
        taskDescription.includes('facility') || 
        taskDescription.includes('location')) {
      return 'operations.venue';
    }
    
    if (taskDescription.includes('resource') || 
        taskDescription.includes('allocate') || 
        taskDescription.includes('assign')) {
      return 'operations.resource';
    }
    
    // Default to travel if no match found
    return 'operations.travel';
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
   * Process a subtask result.
   * 
   * @param {string} taskId - ID of the parent task
   * @param {string} subtaskId - ID of the subtask
   * @param {any} result - Subtask result
   * @private
   */
  _processSubtaskResult(taskId, subtaskId, result) {
    logger.info(`Operations Director received result for subtask ${subtaskId}`);
    
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
    logger.error(`Operations Director received failure for subtask ${subtaskId}: ${error}`);
    
    // Emit event for the promise in _processTask
    this.eventEmitter.emit('subtask_failed', {
      content: {
        taskId: subtaskId,
        error: error
      }
    });
  }
}

module.exports = { OperationsDirectorAgent };
