/**
 * Task management for the FlexTime agent system.
 * 
 * This module provides task representation and management for the agent framework.
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Represents a task in the agent system
 */
class AgentTask {
  /**
   * Initialize a new task
   * 
   * @param {string} taskId - Unique identifier for this task
   * @param {string} taskType - Type of task
   * @param {string} description - Human-readable description
   * @param {object} parameters - Task parameters
   * @param {number} priority - Task priority (higher values = higher priority)
   */
  constructor(taskId, taskType, description, parameters = {}, priority = 1) {
    this.taskId = taskId || uuidv4();
    this.taskType = taskType;
    this.description = description;
    this.parameters = parameters;
    this.priority = priority;
    this.status = 'created';
    this.assignedTo = null;
    this.parentTaskId = null;
    this.subtasks = [];
    this.result = null;
    this.error = null;
    this.createdAt = new Date().toISOString();
    this.updatedAt = this.createdAt;
  }
  
  /**
   * Start the task
   */
  start() {
    this.status = 'in_progress';
    this.updatedAt = new Date().toISOString();
  }
  
  /**
   * Complete the task
   * 
   * @param {any} result - Task result
   */
  complete(result) {
    this.status = 'completed';
    this.result = result;
    this.updatedAt = new Date().toISOString();
  }
  
  /**
   * Mark the task as failed
   * 
   * @param {string} error - Error message
   */
  fail(error) {
    this.status = 'failed';
    this.error = error;
    this.updatedAt = new Date().toISOString();
  }
  
  /**
   * Add a subtask
   * 
   * @param {AgentTask} subtask - The subtask to add
   */
  addSubtask(subtask) {
    subtask.parentTaskId = this.taskId;
    this.subtasks.push(subtask);
  }
  
  /**
   * Convert to JSON
   * 
   * @returns {object} JSON representation
   */
  toJSON() {
    return {
      taskId: this.taskId,
      taskType: this.taskType,
      description: this.description,
      parameters: this.parameters,
      priority: this.priority,
      status: this.status,
      assignedTo: this.assignedTo,
      parentTaskId: this.parentTaskId,
      subtasks: this.subtasks.map(subtask => subtask.taskId),
      result: this.result,
      error: this.error,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  
  /**
   * Create from JSON
   * 
   * @param {object} json - JSON representation
   * @returns {AgentTask} Task instance
   */
  static fromJSON(json) {
    const task = new AgentTask(
      json.taskId,
      json.taskType,
      json.description,
      json.parameters,
      json.priority
    );
    
    task.status = json.status;
    task.assignedTo = json.assignedTo;
    task.parentTaskId = json.parentTaskId;
    task.result = json.result;
    task.error = json.error;
    task.createdAt = json.createdAt;
    task.updatedAt = json.updatedAt;
    
    return task;
  }
}

module.exports = { AgentTask };
