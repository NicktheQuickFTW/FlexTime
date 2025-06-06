/**
 * Agent Communication Protocol for the FlexTime multi-agent system.
 * 
 * This module implements the communication protocol that enables
 * message passing and task delegation between agents.
 */

const EventEmitter = require('events');
const logger = require('../scripts/logger");

/**
 * Communication protocol for agent interaction.
 */
class AgentCommunicationProtocol {
  /**
   * Initialize a new Agent Communication Protocol.
   */
  constructor() {
    this.eventEmitter = new EventEmitter();
    this.messageQueue = {};
    this.registeredAgents = {};
    this.taskRegistry = {};
    this.messageCounter = 0;
    
    logger.info('Agent Communication Protocol initialized');
  }
  
  /**
   * Register an agent with the communication protocol.
   * 
   * @param {object} agent - Agent to register
   * @param {string} agentId - Unique identifier for the agent
   * @param {string} agentType - Type of agent (director or specialized)
   * @param {Array<string>} capabilities - List of agent capabilities
   * @returns {boolean} Success status
   */
  registerAgent(agent, agentId, agentType, capabilities) {
    if (this.registeredAgents[agentId]) {
      logger.warning(`Agent with ID ${agentId} is already registered`);
      return false;
    }
    
    this.registeredAgents[agentId] = {
      agent,
      type: agentType,
      capabilities,
      status: 'idle',
      lastActivity: new Date().toISOString()
    };
    
    // Initialize message queue for this agent
    this.messageQueue[agentId] = [];
    
    logger.info(`Agent ${agentId} registered as ${agentType} with capabilities: ${capabilities.join(', ')}`);
    return true;
  }
  
  /**
   * Unregister an agent from the communication protocol.
   * 
   * @param {string} agentId - Unique identifier for the agent
   * @returns {boolean} Success status
   */
  unregisterAgent(agentId) {
    if (!this.registeredAgents[agentId]) {
      logger.warning(`Agent with ID ${agentId} is not registered`);
      return false;
    }
    
    delete this.registeredAgents[agentId];
    delete this.messageQueue[agentId];
    
    logger.info(`Agent ${agentId} unregistered`);
    return true;
  }
  
  /**
   * Send a message from one agent to another.
   * 
   * @param {string} fromAgentId - Sender agent ID
   * @param {string} toAgentId - Recipient agent ID
   * @param {string} messageType - Type of message
   * @param {object} content - Message content
   * @param {object} metadata - Additional message metadata
   * @returns {string} Message ID
   */
  sendMessage(fromAgentId, toAgentId, messageType, content, metadata = {}) {
    // Validate sender and recipient
    if (!this.registeredAgents[fromAgentId]) {
      throw new Error(`Sender agent ${fromAgentId} is not registered`);
    }
    
    if (!this.registeredAgents[toAgentId]) {
      throw new Error(`Recipient agent ${toAgentId} is not registered`);
    }
    
    // Generate message ID
    const messageId = `msg_${Date.now()}_${this.messageCounter++}`;
    
    // Create message object
    const message = {
      id: messageId,
      from: fromAgentId,
      to: toAgentId,
      type: messageType,
      content,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        conversationId: metadata.conversationId || messageId
      }
    };
    
    // Add to recipient's message queue
    this.messageQueue[toAgentId].push(message);
    
    // Emit message event
    this.eventEmitter.emit('message', message);
    this.eventEmitter.emit(`message:${toAgentId}`, message);
    
    logger.info(`Message ${messageId} sent from ${fromAgentId} to ${toAgentId} (type: ${messageType})`);
    return messageId;
  }
  
  /**
   * Broadcast a message to multiple agents.
   * 
   * @param {string} fromAgentId - Sender agent ID
   * @param {Array<string>} toAgentIds - List of recipient agent IDs
   * @param {string} messageType - Type of message
   * @param {object} content - Message content
   * @param {object} metadata - Additional message metadata
   * @returns {Array<string>} List of message IDs
   */
  broadcastMessage(fromAgentId, toAgentIds, messageType, content, metadata = {}) {
    return toAgentIds.map(toAgentId => 
      this.sendMessage(fromAgentId, toAgentId, messageType, content, metadata)
    );
  }
  
  /**
   * Get messages for a specific agent.
   * 
   * @param {string} agentId - Agent ID
   * @param {boolean} remove - Whether to remove messages from queue after retrieval
   * @returns {Array<object>} List of messages
   */
  getMessages(agentId, remove = false) {
    if (!this.registeredAgents[agentId]) {
      throw new Error(`Agent ${agentId} is not registered`);
    }
    
    const messages = [...this.messageQueue[agentId]];
    
    if (remove) {
      this.messageQueue[agentId] = [];
    }
    
    return messages;
  }
  
  /**
   * Register a task in the task registry.
   * 
   * @param {string} taskId - Unique identifier for the task
   * @param {string} taskType - Type of task
   * @param {string} assignedTo - Agent ID the task is assigned to
   * @param {string} requestedBy - Agent ID that requested the task
   * @param {object} parameters - Task parameters
   * @returns {object} Registered task
   */
  registerTask(taskId, taskType, assignedTo, requestedBy, parameters) {
    const task = {
      id: taskId,
      type: taskType,
      assignedTo,
      requestedBy,
      parameters,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.taskRegistry[taskId] = task;
    logger.info(`Task ${taskId} registered: ${taskType} (${assignedTo})`);
    
    return task;
  }
  
  /**
   * Update a task's status in the registry.
   * 
   * @param {string} taskId - Task ID
   * @param {string} status - New status
   * @param {object} result - Task result (for completed tasks)
   * @returns {object} Updated task
   */
  updateTaskStatus(taskId, status, result = null) {
    if (!this.taskRegistry[taskId]) {
      throw new Error(`Task ${taskId} is not registered`);
    }
    
    this.taskRegistry[taskId].status = status;
    this.taskRegistry[taskId].updatedAt = new Date().toISOString();
    
    if (result !== null) {
      this.taskRegistry[taskId].result = result;
    }
    
    // Emit task update event
    this.eventEmitter.emit('task:update', this.taskRegistry[taskId]);
    
    logger.info(`Task ${taskId} updated: ${status}`);
    return this.taskRegistry[taskId];
  }
  
  /**
   * Get a task from the registry.
   * 
   * @param {string} taskId - Task ID
   * @returns {object} Task
   */
  getTask(taskId) {
    if (!this.taskRegistry[taskId]) {
      throw new Error(`Task ${taskId} is not registered`);
    }
    
    return this.taskRegistry[taskId];
  }
  
  /**
   * Get all tasks for a specific agent.
   * 
   * @param {string} agentId - Agent ID
   * @returns {Array<object>} List of tasks
   */
  getAgentTasks(agentId) {
    return Object.values(this.taskRegistry).filter(task => 
      task.assignedTo === agentId
    );
  }
  
  /**
   * Delegate a task from one agent to another.
   * 
   * @param {string} fromAgentId - Delegating agent ID
   * @param {string} toAgentId - Agent ID to delegate to
   * @param {string} taskType - Type of task
   * @param {object} parameters - Task parameters
   * @param {object} metadata - Additional task metadata
   * @returns {string} Task ID
   */
  delegateTask(fromAgentId, toAgentId, taskType, parameters, metadata = {}) {
    // Validate sender and recipient
    if (!this.registeredAgents[fromAgentId]) {
      throw new Error(`Delegating agent ${fromAgentId} is not registered`);
    }
    
    if (!this.registeredAgents[toAgentId]) {
      throw new Error(`Target agent ${toAgentId} is not registered`);
    }
    
    // Check if recipient has the capability for this task
    const recipientCapabilities = this.registeredAgents[toAgentId].capabilities;
    if (!recipientCapabilities.includes(taskType) && !recipientCapabilities.includes('*')) {
      logger.warning(`Agent ${toAgentId} does not have capability for task type ${taskType}`);
    }
    
    // Generate task ID
    const taskId = `task_${Date.now()}_${this.messageCounter++}`;
    
    // Register the task
    this.registerTask(taskId, taskType, toAgentId, fromAgentId, parameters);
    
    // Send task message
    this.sendMessage(
      fromAgentId,
      toAgentId,
      'task_request',
      {
        taskId,
        taskType,
        parameters
      },
      {
        ...metadata,
        conversationId: metadata.conversationId || taskId
      }
    );
    
    logger.info(`Task ${taskId} delegated from ${fromAgentId} to ${toAgentId} (type: ${taskType})`);
    return taskId;
  }
  
  /**
   * Submit a task result.
   * 
   * @param {string} agentId - Agent ID submitting the result
   * @param {string} taskId - Task ID
   * @param {object} result - Task result
   * @param {string} status - Task status
   * @returns {boolean} Success status
   */
  submitTaskResult(agentId, taskId, result, status = 'completed') {
    if (!this.taskRegistry[taskId]) {
      throw new Error(`Task ${taskId} is not registered`);
    }
    
    const task = this.taskRegistry[taskId];
    
    if (task.assignedTo !== agentId) {
      throw new Error(`Task ${taskId} is not assigned to agent ${agentId}`);
    }
    
    // Update task status
    this.updateTaskStatus(taskId, status, result);
    
    // Send result message to requesting agent
    this.sendMessage(
      agentId,
      task.requestedBy,
      'task_result',
      {
        taskId,
        result,
        status
      },
      {
        conversationId: task.id
      }
    );
    
    logger.info(`Task ${taskId} result submitted by ${agentId} (status: ${status})`);
    return true;
  }
  
  /**
   * Subscribe to communication events.
   * 
   * @param {string} event - Event name
   * @param {function} callback - Event callback
   */
  subscribe(event, callback) {
    this.eventEmitter.on(event, callback);
  }
  
  /**
   * Unsubscribe from communication events.
   * 
   * @param {string} event - Event name
   * @param {function} callback - Event callback
   */
  unsubscribe(event, callback) {
    this.eventEmitter.off(event, callback);
  }
  
  /**
   * Get all registered agents.
   * 
   * @returns {object} Map of agent IDs to agent info
   */
  getRegisteredAgents() {
    return { ...this.registeredAgents };
  }
  
  /**
   * Find agents with specific capabilities.
   * 
   * @param {string} capability - Capability to search for
   * @returns {Array<string>} List of agent IDs with the capability
   */
  findAgentsWithCapability(capability) {
    return Object.entries(this.registeredAgents)
      .filter(([_, info]) => 
        info.capabilities.includes(capability) || info.capabilities.includes('*')
      )
      .map(([agentId]) => agentId);
  }
  
  /**
   * Update agent status.
   * 
   * @param {string} agentId - Agent ID
   * @param {string} status - New status
   * @returns {boolean} Success status
   */
  updateAgentStatus(agentId, status) {
    if (!this.registeredAgents[agentId]) {
      throw new Error(`Agent ${agentId} is not registered`);
    }
    
    this.registeredAgents[agentId].status = status;
    this.registeredAgents[agentId].lastActivity = new Date().toISOString();
    
    logger.info(`Agent ${agentId} status updated: ${status}`);
    return true;
  }
}

module.exports = AgentCommunicationProtocol;
