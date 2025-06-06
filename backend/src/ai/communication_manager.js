/**
 * Communication Manager for the FlexTime multi-agent system.
 * 
 * This module provides the communication infrastructure for agents
 * to exchange messages.
 */

const EventEmitter = require('events');
const logger = require('../scripts/logger");

/**
 * Manages communication between agents in the FlexTime multi-agent system.
 */
class AgentCommunicationManager {
  /**
   * Initialize a new communication manager.
   */
  constructor() {
    this.subscribers = new Map();
    this.messageQueue = [];
    this.eventEmitter = new EventEmitter();
    this.running = false;
    
    // Set up event listeners
    this.eventEmitter.on('messageAdded', () => {
      if (this.running) {
        this._processNextMessage();
      }
    });
    
    logger.info('Agent Communication Manager initialized');
  }
  
  /**
   * Start the communication manager.
   */
  start() {
    if (this.running) {
      logger.warning('Communication Manager is already running');
      return;
    }
    
    this.running = true;
    this._processNextMessage();
    logger.info('Communication Manager started');
  }
  
  /**
   * Stop the communication manager.
   */
  stop() {
    if (!this.running) {
      logger.warning('Communication Manager is not running');
      return;
    }
    
    this.running = false;
    logger.info('Communication Manager stopped');
  }
  
  /**
   * Subscribe an agent to receive messages.
   * 
   * @param {string} agentId - ID of the agent to subscribe
   * @param {function} callback - Function to call when a message is received
   */
  subscribe(agentId, callback) {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, []);
    }
    
    this.subscribers.get(agentId).push(callback);
    logger.info(`Agent ${agentId} subscribed to Communication Manager`);
  }
  
  /**
   * Unsubscribe an agent from receiving messages.
   * 
   * @param {string} agentId - ID of the agent to unsubscribe
   * @param {function} callback - Callback function to remove (optional)
   */
  unsubscribe(agentId, callback = null) {
    if (!this.subscribers.has(agentId)) {
      return;
    }
    
    if (callback) {
      // Remove specific callback
      const callbacks = this.subscribers.get(agentId);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
      
      if (callbacks.length === 0) {
        this.subscribers.delete(agentId);
      }
    } else {
      // Remove all callbacks for this agent
      this.subscribers.delete(agentId);
    }
    
    logger.info(`Agent ${agentId} unsubscribed from Communication Manager`);
  }
  
  /**
   * Send a message to another agent.
   * 
   * @param {object} message - The message to send
   */
  sendMessage(message) {
    this.messageQueue.push(message);
    this.eventEmitter.emit('messageAdded');
    logger.debug(`Message queued from ${message.senderId} to ${message.recipientId}`);
  }
  
  /**
   * Process the next message in the queue.
   * 
   * @private
   */
  _processNextMessage() {
    if (!this.running || this.messageQueue.length === 0) {
      return;
    }
    
    const message = this.messageQueue.shift();
    this._deliverMessage(message)
      .then(() => {
        // Process next message if available
        if (this.messageQueue.length > 0 && this.running) {
          setImmediate(() => this._processNextMessage());
        }
      })
      .catch(error => {
        logger.error(`Error delivering message: ${error.message}`);
        // Continue with next message
        if (this.messageQueue.length > 0 && this.running) {
          setImmediate(() => this._processNextMessage());
        }
      });
  }
  
  /**
   * Deliver a message to its recipient(s).
   * 
   * @param {object} message - The message to deliver
   * @private
   */
  async _deliverMessage(message) {
    // Broadcast message
    if (message.recipientId === 'broadcast') {
      logger.debug(`Broadcasting message from ${message.senderId}`);
      
      const deliveryPromises = [];
      
      for (const [agentId, callbacks] of this.subscribers.entries()) {
        // Don't send broadcast back to sender
        if (agentId === message.senderId) {
          continue;
        }
        
        for (const callback of callbacks) {
          deliveryPromises.push(this._safeCallback(callback, message));
        }
      }
      
      await Promise.all(deliveryPromises);
    } 
    // Direct message
    else {
      const callbacks = this.subscribers.get(message.recipientId);
      
      if (!callbacks || callbacks.length === 0) {
        logger.warning(`No subscribers found for recipient ${message.recipientId}`);
        return;
      }
      
      logger.debug(`Delivering message from ${message.senderId} to ${message.recipientId}`);
      
      const deliveryPromises = callbacks.map(callback => 
        this._safeCallback(callback, message)
      );
      
      await Promise.all(deliveryPromises);
    }
  }
  
  /**
   * Safely execute a callback function.
   * 
   * @param {function} callback - The callback function
   * @param {object} message - The message to pass to the callback
   * @returns {Promise<void>} A promise that resolves when the callback completes
   * @private
   */
  async _safeCallback(callback, message) {
    try {
      await Promise.resolve(callback(message));
    } catch (error) {
      logger.error(`Error in message callback: ${error.message}`);
    }
  }
}

module.exports = AgentCommunicationManager;
