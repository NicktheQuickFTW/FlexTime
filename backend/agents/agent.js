/**
 * Base Agent class for the FlexTime multi-agent system.
 * 
 * This module provides the foundation for all agents in the system,
 * including both director agents and specialized agents.
 */

const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');
const logger = require('../utils/logger');

/**
 * Base class for all agents in the FlexTime multi-agent system.
 * 
 * This class provides common functionality for agent communication,
 * task processing, and lifecycle management.
 */
class Agent {
  /**
   * Initialize a new agent.
   * 
   * @param {string} agentId - Unique identifier for this agent
   * @param {string} agentType - Type of agent (director, specialized)
   * @param {object} mcpConnector - Connector for MCP server communication (optional)
   */
  constructor(agentId, agentType, mcpConnector = null) {
    this.agentId = agentId;
    this.agentType = agentType;
    this.mcpConnector = mcpConnector;
    this.communicationManager = null;
    this.taskQueue = [];
    this.activeTasks = new Map();
    this.running = false;
    this.eventEmitter = new EventEmitter();
    this.metrics = {
      tasksReceived: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      totalCompletionTime: 0,
      averageCompletionTime: 0
    };
    
    logger.info(`Agent ${agentId} (${agentType}) initialized`);
  }
  
  /**
   * Register this agent with a communication manager.
   * 
   * @param {object} communicationManager - The communication manager to register with
   */
  register(communicationManager) {
    this.communicationManager = communicationManager;
    communicationManager.subscribe(this.agentId, this._handleMessage.bind(this));
    logger.info(`Agent ${this.agentId} registered with communication manager`);
  }
  
  /**
   * Start the agent's task processing.
   */
  start() {
    if (this.running) {
      logger.warning(`Agent ${this.agentId} is already running`);
      return;
    }
    
    this.running = true;
    this._processNextTask();
    logger.info(`Agent ${this.agentId} started`);
    
    // Set up event listeners
    this.eventEmitter.on('taskAdded', () => {
      if (this.running) {
        this._processNextTask();
      }
    });
  }
  
  /**
   * Stop the agent's task processing.
   */
  stop() {
    if (!this.running) {
      logger.warning(`Agent ${this.agentId} is not running`);
      return;
    }
    
    this.running = false;
    this.eventEmitter.removeAllListeners();
    logger.info(`Agent ${this.agentId} stopped`);
  }
  
  /**
   * Send a message to another agent.
   * 
   * @param {string} recipientId - ID of the recipient agent
   * @param {string} messageType - Type of message (task, response, query, notification)
   * @param {object} content - Message content
   * @param {object} metadata - Additional metadata (optional)
   */
  sendMessage(recipientId, messageType, content, metadata = {}) {
    if (!this.communicationManager) {
      throw new Error(`Agent ${this.agentId} not registered with a communication manager`);
    }
    
    const message = {
      messageId: uuidv4(),
      senderId: this.agentId,
      recipientId: recipientId,
      messageType: messageType,
      content: content,
      metadata: metadata,
      timestamp: new Date().toISOString()
    };
    
    this.communicationManager.sendMessage(message);
    logger.debug(`Agent ${this.agentId} sent ${messageType} message to ${recipientId}`);
  }
  
  /**
   * Create a new task.
   * 
   * @param {string} taskType - Type of task
   * @param {string} description - Human-readable description
   * @param {object} parameters - Task parameters
   * @param {number} priority - Task priority (higher values = higher priority)
   * @returns {object} The created task
   */
  createTask(taskType, description, parameters, priority = 1) {
    const taskId = uuidv4();
    const task = {
      taskId: taskId,
      taskType: taskType,
      description: description,
      parameters: parameters,
      priority: priority,
      status: 'created',
      assignedTo: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      result: null,
      parentTaskId: null,
      subtasks: []
    };
    
    logger.info(`Agent ${this.agentId} created task ${taskId}: ${description}`);
    return task;
  }
  
  /**
   * Submit a task to this agent's queue.
   * 
   * @param {object} task - The task to submit
   */
  submitTask(task) {
    this.taskQueue.push(task);
    this.metrics.tasksReceived += 1;
    logger.info(`Agent ${this.agentId} received task ${task.taskId}: ${task.description}`);
    
    // Sort the queue by priority (higher values first)
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    
    // Emit event to trigger processing
    this.eventEmitter.emit('taskAdded');
  }
  
  /**
   * Delegate a task to another agent.
   * 
   * @param {string} agentId - ID of the agent to delegate to
   * @param {object} task - The task to delegate
   */
  delegateTask(agentId, task) {
    task.assignedTo = agentId;
    task.status = 'assigned';
    task.updatedAt = new Date().toISOString();
    
    this.sendMessage(
      agentId,
      'task',
      task
    );
    
    logger.info(`Agent ${this.agentId} delegated task ${task.taskId} to ${agentId}`);
  }
  
  /**
   * Get performance metrics for this agent.
   * 
   * @returns {object} Dictionary of performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * Handle an incoming message.
   * 
   * @param {object} message - The message to handle
   * @private
   */
  _handleMessage(message) {
    logger.debug(`Agent ${this.agentId} received ${message.messageType} message from ${message.senderId}`);
    
    if (message.messageType === 'task') {
      // Convert task dict to task object if needed
      const task = message.content;
      this.submitTask(task);
    } else if (message.messageType === 'subtask_completed') {
      this._handleSubtaskCompleted(message.content);
    } else if (message.messageType === 'subtask_failed') {
      this._handleSubtaskFailed(message.content);
    } else {
      this._processMessage(message);
    }
  }
  
  /**
   * Handle a completed subtask.
   * 
   * @param {object} content - Message content with subtask information
   * @private
   */
  _handleSubtaskCompleted(content) {
    const taskId = content.parentTaskId;
    const subtaskId = content.taskId;
    const result = content.result;
    
    if (this.activeTasks.has(taskId)) {
      logger.info(`Agent ${this.agentId} received completed subtask ${subtaskId} for task ${taskId}`);
      // Process the subtask result
      this._processSubtaskResult(taskId, subtaskId, result);
    } else {
      logger.warning(`Agent ${this.agentId} received completed subtask for unknown task ${taskId}`);
    }
  }
  
  /**
   * Handle a failed subtask.
   * 
   * @param {object} content - Message content with subtask information
   * @private
   */
  _handleSubtaskFailed(content) {
    const taskId = content.parentTaskId;
    const subtaskId = content.taskId;
    const error = content.error;
    
    if (this.activeTasks.has(taskId)) {
      logger.warning(`Agent ${this.agentId} received failed subtask ${subtaskId} for task ${taskId}: ${error}`);
      // Process the subtask failure
      this._processSubtaskFailure(taskId, subtaskId, error);
    } else {
      logger.warning(`Agent ${this.agentId} received failed subtask for unknown task ${taskId}`);
    }
  }
  
  /**
   * Process the next task in the queue.
   * 
   * @private
   */
  _processNextTask() {
    if (!this.running || this.taskQueue.length === 0) {
      return;
    }
    
    const task = this.taskQueue.shift();
    this._executeTask(task)
      .then(() => {
        // Process next task if available
        if (this.taskQueue.length > 0 && this.running) {
          setImmediate(() => this._processNextTask());
        }
      })
      .catch(error => {
        logger.error(`Agent ${this.agentId} encountered error processing task: ${error.message}`);
        // Continue with next task
        if (this.taskQueue.length > 0 && this.running) {
          setImmediate(() => this._processNextTask());
        }
      });
  }
  
  /**
   * Execute a task.
   * 
   * @param {object} task - The task to execute
   * @private
   */
  async _executeTask(task) {
    const taskId = task.taskId;
    this.activeTasks.set(taskId, task);
    
    const startTime = Date.now();
    task.status = 'in_progress';
    task.updatedAt = new Date().toISOString();
    
    try {
      logger.info(`Agent ${this.agentId} executing task ${taskId}: ${task.description}`);
      const result = await this._processTask(task);
      
      // Record task completion
      const endTime = Date.now();
      const completionTime = (endTime - startTime) / 1000; // in seconds
      
      task.status = 'completed';
      task.result = result;
      task.updatedAt = new Date().toISOString();
      
      this.metrics.tasksCompleted += 1;
      this.metrics.totalCompletionTime += completionTime;
      this.metrics.averageCompletionTime = 
        this.metrics.totalCompletionTime / this.metrics.tasksCompleted;
      
      logger.info(`Agent ${this.agentId} completed task ${taskId} in ${completionTime.toFixed(2)}s`);
      
      // Notify the parent if this is a subtask
      if (task.parentTaskId) {
        const parentAgentId = task.parentTaskId.split('.')[0];
        this.sendMessage(
          parentAgentId,
          'subtask_completed',
          {
            taskId: taskId,
            parentTaskId: task.parentTaskId,
            result: result
          }
        );
      }
    } catch (error) {
      logger.error(`Agent ${this.agentId} failed to execute task ${taskId}: ${error.message}`);
      
      task.status = 'failed';
      task.result = { error: error.message };
      task.updatedAt = new Date().toISOString();
      
      this.metrics.tasksFailed += 1;
      
      // Notify the parent if this is a subtask
      if (task.parentTaskId) {
        const parentAgentId = task.parentTaskId.split('.')[0];
        this.sendMessage(
          parentAgentId,
          'subtask_failed',
          {
            taskId: taskId,
            parentTaskId: task.parentTaskId,
            error: error.message
          }
        );
      }
    } finally {
      // Remove from active tasks
      this.activeTasks.delete(taskId);
    }
  }
  
  /**
   * Process a task. To be implemented by subclasses.
   * 
   * @param {object} task - The task to process
   * @returns {Promise<any>} Task result
   * @private
   */
  async _processTask(task) {
    throw new Error(`Agent ${this.agentId} does not implement _processTask`);
  }
  
  /**
   * Process a non-task message. To be implemented by subclasses.
   * 
   * @param {object} message - The message to process
   * @private
   */
  _processMessage(message) {
    logger.warning(`Agent ${this.agentId} received unhandled message type: ${message.messageType}`);
  }
  
  /**
   * Process a subtask result. To be implemented by subclasses.
   * 
   * @param {string} taskId - ID of the parent task
   * @param {string} subtaskId - ID of the subtask
   * @param {any} result - Subtask result
   * @private
   */
  _processSubtaskResult(taskId, subtaskId, result) {
    logger.warning(`Agent ${this.agentId} does not implement _processSubtaskResult`);
  }
  
  /**
   * Process a subtask failure. To be implemented by subclasses.
   * 
   * @param {string} taskId - ID of the parent task
   * @param {string} subtaskId - ID of the subtask
   * @param {string} error - Error message
   * @private
   */
  _processSubtaskFailure(taskId, subtaskId, error) {
    logger.warning(`Agent ${this.agentId} does not implement _processSubtaskFailure`);
  }
}

module.exports = Agent;
