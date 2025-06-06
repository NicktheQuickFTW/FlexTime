/**
 * Claude MCP Connector for the FlexTime multi-agent system.
 * 
 * This module provides integration with Claude MCP for enhanced
 * AI capabilities in the FlexTime scheduling system.
 */

const axios = require('axios');
const logger = require("../../lib/logger");;
const { v4: uuidv4 } = require('uuid');

/**
 * Claude MCP Connector for the FlexTime agent system
 */
class AnthropicMCPConnector {
  /**
   * Initialize a new Claude MCP connector.
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    // Extract configuration
    this.apiUrl = config.servers?.anthropic?.apiUrl || process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com';
    this.apiKey = config.servers?.anthropic?.apiKey || process.env.ANTHROPIC_API_KEY;
    this.timeout = config.servers?.anthropic?.timeout || parseInt(process.env.ANTHROPIC_TIMEOUT || '60000', 10);
    this.enabled = (config.servers?.anthropic?.enabled !== false) && (process.env.ENABLE_ANTHROPIC !== 'false');
    
    // Initialize axios instance with default configuration
    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: this.timeout,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });
    
    // Default model selection based on task requirements
    this.modelMap = {
      default: 'claude-3-opus-20240229',
      fast: 'claude-3-sonnet-20240229',
      efficient: 'claude-3-haiku-20240307'
    };
    
    // Task-specific model mapping (from config)
    this.taskModelMap = {};
    if (config.tasks) {
      Object.entries(config.tasks).forEach(([task, taskConfig]) => {
        if (taskConfig.server === 'anthropic' && taskConfig.model) {
          this.taskModelMap[task] = taskConfig.model;
        }
      });
    }
    
    logger.info(`Claude MCP connector initialized. Enabled: ${this.enabled}`);
  }
  
  /**
   * Check availability of Claude MCP service.
   * 
   * @returns {Promise<boolean>} Whether the service is available
   */
  async checkAvailability() {
    if (!this.enabled || !this.apiKey) {
      logger.warn('Claude MCP integration is disabled or missing API key.');
      return false;
    }
    
    try {
      // Try to validate API key by making a lightweight request
      const response = await this.client.get('/v1/models', {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        }
      });
      
      return response.status === 200;
    } catch (error) {
      logger.error(`Claude MCP availability check failed: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Send a request to Claude MCP.
   * 
   * @param {Object} options - Request options
   * @param {string} options.taskType - Type of task being performed
   * @param {string} options.prompt - Prompt text
   * @param {Object} options.context - Context data
   * @param {string} options.cacheKey - Key for caching (null to disable caching)
   * @param {Object} options.parameters - Model-specific parameters
   * @returns {Promise<Object>} Model response
   */
  async sendRequest(options) {
    if (!this.enabled) {
      logger.warn('Claude MCP integration is disabled. Cannot send request.');
      return {
        status: 'error',
        error: 'Claude MCP integration is disabled',
        content: 'Claude MCP integration is disabled. This is a fallback response.',
        model: 'fallback'
      };
    }
    
    try {
      // Determine model to use based on task type
      const model = this.getModelForTask(options.taskType);
      
      // Prepare context as system message
      let systemMessage = 'You are a helpful assistant for the FlexTime scheduling system.';
      
      if (options.context) {
        systemMessage += `\n\nContextual information: ${JSON.stringify(options.context, null, 2)}`;
      }
      
      // Prepare request data
      const requestData = {
        model,
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: options.prompt
          }
        ],
        temperature: options.parameters?.temperature || 0.7,
        max_tokens: options.parameters?.max_tokens || 4000,
        stream: false
      };
      
      // Generate random request ID for tracking
      const requestId = uuidv4();
      logger.info(`Sending request to Claude MCP (ID: ${requestId}, Task: ${options.taskType})`);
      
      // Send request to Claude MCP
      const response = await this.client.post('/v1/messages', requestData);
      
      // Extract and format response
      return {
        status: 'success',
        content: response.data.content[0].text,
        model: model,
        usage: {
          prompt_tokens: response.data.usage.input_tokens,
          completion_tokens: response.data.usage.output_tokens,
          total_tokens: response.data.usage.input_tokens + response.data.usage.output_tokens
        }
      };
    } catch (error) {
      logger.error(`Claude MCP request failed: ${error.message}`);
      
      if (error.response) {
        logger.error(`Response error: ${JSON.stringify(error.response.data)}`);
      }
      
      return {
        status: 'error',
        error: error.message,
        content: 'The request to Claude MCP failed. This is a fallback response.',
        model: 'fallback'
      };
    }
  }
  
  /**
   * Get embeddings for a text input.
   * 
   * @param {string} text - Text to embed
   * @param {string} model - Embedding model to use
   * @returns {Promise<Object>} Embedding response
   */
  async getEmbedding(text, model = 'claude-3-opus-20240229') {
    if (!this.enabled) {
      logger.warn('Claude MCP integration is disabled. Cannot generate embeddings.');
      return {
        status: 'error',
        error: 'Claude MCP integration is disabled',
        embedding: null
      };
    }
    
    try {
      // Claude doesn't have a dedicated embedding API, so we'll use the messages API
      // with a specific prompt to generate a vector representation
      const response = await this.client.post('/v1/messages', {
        model,
        messages: [
          {
            role: 'system',
            content: 'Generate a numerical vector representation of the user\'s text.'
          },
          {
            role: 'user',
            content: `Create a vector representation for the following text: "${text}"`
          }
        ],
        temperature: 0.0,
        max_tokens: 500,
      });
      
      // Extract embedding attempt from response
      return {
        status: 'success',
        embedding: response.data.content[0].text, // This would need parsing in a real implementation
        model
      };
    } catch (error) {
      logger.error(`Claude embedding request failed: ${error.message}`);
      return {
        status: 'error',
        error: error.message,
        embedding: null
      };
    }
  }
  
  /**
   * Get the appropriate model for a given task type.
   * 
   * @param {string} taskType - Type of task
   * @returns {string} Model to use
   * @private
   */
  getModelForTask(taskType) {
    // Check task-specific model mapping first
    if (this.taskModelMap[taskType]) {
      return this.taskModelMap[taskType];
    }
    
    // Use appropriate model based on task characteristics
    if (taskType.includes('generation') || 
        taskType.includes('planning') || 
        taskType.includes('analysis') ||
        taskType.includes('explanation')) {
      return this.modelMap.default; // Use high-capability model
    } else if (taskType.includes('detection') || 
               taskType.includes('classification') || 
               taskType.includes('summary')) {
      return this.modelMap.efficient; // Use efficient model
    } else {
      return this.modelMap.fast; // Use balanced model
    }
  }
}

module.exports = AnthropicMCPConnector;