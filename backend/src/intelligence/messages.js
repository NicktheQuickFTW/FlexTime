/**
 * Message handling for the FlexTime agent system.
 * 
 * This module provides message representation for agent communication.
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Represents a message in the agent system
 */
class AgentMessage {
  /**
   * Initialize a new message
   * 
   * @param {string} senderId - ID of the sender agent
   * @param {string} recipientId - ID of the recipient agent
   * @param {string} messageType - Type of message
   * @param {object} content - Message content
   * @param {object} metadata - Additional metadata
   */
  constructor(senderId, recipientId, messageType, content, metadata = {}) {
    this.messageId = uuidv4();
    this.senderId = senderId;
    this.recipientId = recipientId;
    this.messageType = messageType;
    this.content = content;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
  }
  
  /**
   * Convert to JSON
   * 
   * @returns {object} JSON representation
   */
  toJSON() {
    return {
      messageId: this.messageId,
      senderId: this.senderId,
      recipientId: this.recipientId,
      messageType: this.messageType,
      content: this.content,
      metadata: this.metadata,
      timestamp: this.timestamp
    };
  }
  
  /**
   * Create from JSON
   * 
   * @param {object} json - JSON representation
   * @returns {AgentMessage} Message instance
   */
  static fromJSON(json) {
    const message = new AgentMessage(
      json.senderId,
      json.recipientId,
      json.messageType,
      json.content,
      json.metadata
    );
    
    message.messageId = json.messageId;
    message.timestamp = json.timestamp;
    
    return message;
  }
}

module.exports = { AgentMessage };
