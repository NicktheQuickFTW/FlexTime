/**
 * FlexTime Connector for the FlexTime multi-agent system.
 * 
 * This module implements the integration with multiple AI model providers
 * to enable AI-enhanced capabilities across the agent system.
 */

const axios = require('axios');
const logger = require('../scripts/logger");
// Use a basic configuration or load from a separate file
const flexTimeConfig = {
  enabled: true,
  defaultServer: 'anthropic',
  servers: {
    anthropic: {
      enabled: true,
      baseUrl: 'https://api.anthropic.com',
      models: {
        default: 'claude-3-sonnet-20240229',
        available: [
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307'
        ]
      }
    },
    openai: {
      enabled: true,
      baseUrl: 'https://api.openai.com/v1',
      models: {
        default: 'gpt-4-turbo',
        available: [
          'gpt-4-turbo',
          'gpt-4o',
          'gpt-3.5-turbo'
        ]
      }
    }
  },
  agentModels: {}
};

/**
 * FlexTime connector for interacting with multiple AI model providers.
 */
class FlexTimeConnector {
  /**
   * Initialize a new FlexTime Connector.
   * 
   * @param {object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = { ...flexTimeConfig, ...config };
    this.enabled = this.config.enabled;
    this.defaultServer = this.config.defaultServer;
    
    // Initialize HTTP clients for each server
    this.clients = {};
    this.initializeClients();
    
    // Initialize response cache
    this.responseCache = {};
    
    logger.info('FlexTime Connector initialized');
    logger.info(`AI integration enabled: ${this.enabled}`);
    logger.info(`Default AI server: ${this.defaultServer}`);
  }
  
  /**
   * Initialize HTTP clients for all enabled AI servers.
   * 
   * @private
   */
  initializeClients() {
    for (const [serverName, serverConfig] of Object.entries(this.config.servers)) {
      if (serverConfig.enabled) {
        this.initializeClient(serverName, serverConfig);
      }
    }
  }
  
  /**
   * Initialize an HTTP client for a specific AI server.
   * 
   * @param {string} serverName - Name of the server
   * @param {object} serverConfig - Server configuration
   * @private
   */
  initializeClient(serverName, serverConfig) {
    try {
      // Create axios client with server-specific configuration
      const client = axios.create({
        baseURL: serverConfig.baseUrl,
        timeout: 60000, // 60 second timeout
        headers: {
          'Content-Type': 'application/json',
          'Authorization': serverConfig.apiKey ? `Bearer ${serverConfig.apiKey}` : undefined
        }
      });
      
      this.clients[serverName] = client;
      logger.info(`Initialized client for AI server: ${serverName}`);
    } catch (error) {
      logger.error(`Failed to initialize client for AI server ${serverName}: ${error.message}`);
    }
  }
  
  /**
   * Get the appropriate AI server for a specific agent or task.
   * 
   * @param {object} options - Options for server selection
   * @param {string} options.agentId - ID of the agent making the request
   * @param {string} options.taskType - Type of task being performed
   * @returns {string} Name of the selected server
   * @private
   */
  getServer(options = {}) {
    const { agentId, taskType } = options;
    
    // Check if there's a specific server assigned to this agent
    if (agentId && this.config.agentModels[agentId]) {
      const serverName = this.config.agentModels[agentId].server;
      if (this.clients[serverName]) {
        return serverName;
      }
    }
    
    // Check if there's a specific server for this task type
    if (taskType) {
      for (const [serverName, serverConfig] of Object.entries(this.config.servers)) {
        if (serverConfig.enabled && 
            serverConfig.taskModels && 
            serverConfig.taskModels[taskType]) {
          return serverName;
        }
      }
    }
    
    // Fall back to default server
    return this.defaultServer;
  }
  
  /**
   * Get the appropriate model for a specific agent or task.
   * 
   * @param {string} serverName - Name of the AI server
   * @param {object} options - Options for model selection
   * @param {string} options.agentId - ID of the agent making the request
   * @param {string} options.taskType - Type of task being performed
   * @returns {string} Name of the selected model
   * @private
   */
  getModel(serverName, options = {}) {
    const { agentId, taskType } = options;
    const serverConfig = this.config.servers[serverName];
    
    if (!serverConfig) {
      logger.error(`Unknown AI server: ${serverName}`);
      return null;
    }
    
    // Check if there's a specific model assigned to this agent
    if (agentId && this.config.agentModels[agentId]) {
      return this.config.agentModels[agentId].model;
    }
    
    // Check if there's a specific model for this task type
    if (taskType && serverConfig.taskModels && serverConfig.taskModels[taskType]) {
      return serverConfig.taskModels[taskType];
    }
    
    // Fall back to server's default model
    return serverConfig.models.default;
  }
  
  /**
   * Send a request to the appropriate AI server.
   * 
   * @param {object} options - Request options
   * @param {string} options.agentId - ID of the agent making the request
   * @param {string} options.taskType - Type of task being performed
   * @param {string} options.prompt - Prompt text
   * @param {object} options.context - Context data
   * @param {string} options.cacheKey - Key for caching (null to disable caching)
   * @param {object} options.parameters - Model-specific parameters
   * @returns {Promise<object>} Model response
   */
  async sendRequest(options = {}) {
    if (!this.enabled) {
      logger.warn('AI integration is disabled. Using fallback response.');
      return this.getFallbackResponse();
    }
    
    const { 
      agentId, 
      taskType, 
      prompt, 
      context = {}, 
      cacheKey = null,
      parameters = {}
    } = options;
    
    // Check cache if enabled and key provided
    if (cacheKey && this.responseCache[cacheKey]) {
      logger.info(`Using cached response for key: ${cacheKey}`);
      return this.responseCache[cacheKey];
    }
    
    // Get appropriate server and model
    const serverName = this.getServer({ agentId, taskType });
    const model = this.getModel(serverName, { agentId, taskType });
    
    if (!this.clients[serverName]) {
      logger.error(`No client available for server: ${serverName}`);
      return this.getFallbackResponse();
    }
    
    try {
      logger.info(`Sending request to ${serverName} AI server (model: ${model})`);
      
      // Format request based on server type
      const response = await this.formatAndSendRequest(
        serverName, 
        model, 
        prompt, 
        context, 
        parameters
      );
      
      // Cache response if key provided
      if (cacheKey) {
        this.responseCache[cacheKey] = response;
      }
      
      return response;
    } catch (error) {
      logger.error(`AI server request failed: ${error.message}`);
      return this.getFallbackResponse();
    }
  }
  
  /**
   * Format and send a request to the specified AI server.
   * 
   * @param {string} serverName - Name of the AI server
   * @param {string} model - Model to use
   * @param {string} prompt - Prompt text
   * @param {object} context - Context data
   * @param {object} parameters - Model-specific parameters
   * @returns {Promise<object>} Model response
   * @private
   */
  async formatAndSendRequest(serverName, model, prompt, context, parameters) {
    switch (serverName) {
      case 'anthropic':
        return this.sendAnthropicRequest(model, prompt, context, parameters);
      case 'openai':
        return this.sendOpenAIRequest(model, prompt, context, parameters);
      case 'vertex':
        return this.sendVertexRequest(model, prompt, context, parameters);
      case 'huggingface':
        return this.sendHuggingFaceRequest(model, prompt, context, parameters);
      case 'azure':
        return this.sendAzureRequest(model, prompt, context, parameters);
      default:
        throw new Error(`Unsupported AI server: ${serverName}`);
    }
  }
  
  /**
   * Send a request to the Anthropic Claude API.
   * 
   * @param {string} model - Model to use
   * @param {string} prompt - Prompt text
   * @param {object} context - Context data
   * @param {object} parameters - Model-specific parameters
   * @returns {Promise<object>} Model response
   * @private
   */
  async sendAnthropicRequest(model, prompt, context, parameters) {
    const client = this.clients.anthropic;
    
    // Format system and user messages
    const systemPrompt = context.systemPrompt || '';
    const userPrompt = prompt;
    
    // Build messages array
    const messages = [
      { role: 'user', content: userPrompt }
    ];
    
    // Add system prompt if provided
    if (systemPrompt) {
      messages.unshift({ role: 'system', content: systemPrompt });
    }
    
    // Add context messages if provided
    if (context.messages && Array.isArray(context.messages)) {
      // Insert context messages before the user prompt
      messages.unshift(...context.messages);
    }
    
    // Prepare request payload
    const payload = {
      model,
      messages,
      max_tokens: parameters.max_tokens || 1024,
      temperature: parameters.temperature || 0.7
    };
    
    // Send request to Anthropic API
    const response = await client.post('/v1/messages', payload);
    
    // Format response
    return {
      status: 'success',
      content: response.data.content[0].text,
      model: response.data.model,
      usage: response.data.usage,
      raw: response.data
    };
  }
  
  /**
   * Send a request to the OpenAI API.
   * 
   * @param {string} model - Model to use
   * @param {string} prompt - Prompt text
   * @param {object} context - Context data
   * @param {object} parameters - Model-specific parameters
   * @returns {Promise<object>} Model response
   * @private
   */
  async sendOpenAIRequest(model, prompt, context, parameters) {
    const client = this.clients.openai;
    
    // Format system and user messages
    const systemPrompt = context.systemPrompt || 'You are a helpful assistant.';
    const userPrompt = prompt;
    
    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    // Add context messages if provided
    if (context.messages && Array.isArray(context.messages)) {
      // Insert context messages between system and user messages
      messages.splice(1, 0, ...context.messages);
    }
    
    // Handle function calling if provided
    const functionConfig = {};
    if (parameters.functions) {
      functionConfig.functions = parameters.functions;
      
      if (parameters.function_call) {
        functionConfig.function_call = parameters.function_call;
      }
    }
    
    // Prepare request payload
    const payload = {
      model,
      messages,
      max_tokens: parameters.max_tokens || 1024,
      temperature: parameters.temperature || 0.7,
      ...functionConfig
    };
    
    // Send request to OpenAI API
    const response = await client.post('/chat/completions', payload);
    
    // Format response
    return {
      status: 'success',
      content: response.data.choices[0].message.content,
      function_call: response.data.choices[0].message.function_call,
      model: response.data.model,
      usage: response.data.usage,
      raw: response.data
    };
  }
  
  /**
   * Send a request to the Google Vertex AI API.
   * 
   * @param {string} model - Model to use
   * @param {string} prompt - Prompt text
   * @param {object} context - Context data
   * @param {object} parameters - Model-specific parameters
   * @returns {Promise<object>} Model response
   * @private
   */
  async sendVertexRequest(model, prompt, context, parameters) {
    // Vertex AI implementation would go here
    // This is a placeholder for the actual implementation
    logger.warn('Vertex AI integration not fully implemented');
    
    return {
      status: 'error',
      error: 'Vertex AI integration not fully implemented',
      content: null
    };
  }
  
  /**
   * Send a request to the Hugging Face Inference API.
   * 
   * @param {string} model - Model to use
   * @param {string} prompt - Prompt text
   * @param {object} context - Context data
   * @param {object} parameters - Model-specific parameters
   * @returns {Promise<object>} Model response
   * @private
   */
  async sendHuggingFaceRequest(model, prompt, context, parameters) {
    // Hugging Face implementation would go here
    // This is a placeholder for the actual implementation
    logger.warn('Hugging Face integration not fully implemented');
    
    return {
      status: 'error',
      error: 'Hugging Face integration not fully implemented',
      content: null
    };
  }
  
  /**
   * Send a request to the Azure OpenAI Service.
   * 
   * @param {string} model - Model to use
   * @param {string} prompt - Prompt text
   * @param {object} context - Context data
   * @param {object} parameters - Model-specific parameters
   * @returns {Promise<object>} Model response
   * @private
   */
  async sendAzureRequest(model, prompt, context, parameters) {
    // Azure OpenAI implementation would go here
    // This is a placeholder for the actual implementation
    logger.warn('Azure OpenAI integration not fully implemented');
    
    return {
      status: 'error',
      error: 'Azure OpenAI integration not fully implemented',
      content: null
    };
  }
  
  /**
   * Get a fallback response when AI integration is disabled or errors occur.
   * 
   * @returns {object} Fallback response
   * @private
   */
  getFallbackResponse() {
    return {
      status: 'fallback',
      content: 'This response was generated using fallback logic because AI integration is disabled or unavailable.',
      model: 'fallback'
    };
  }
  
  /**
   * Check if any AI server is available.
   * 
   * @returns {Promise<boolean>} Whether any server is available
   */
  async checkAvailability() {
    if (!this.enabled) {
      logger.info('AI integration is disabled');
      return false;
    }
    
    for (const [serverName, client] of Object.entries(this.clients)) {
      try {
        logger.info(`Checking availability of AI server: ${serverName}`);
        
        // Different endpoints for different servers
        let endpoint = '/status';
        if (serverName === 'anthropic') {
          endpoint = '/v1/models';
        } else if (serverName === 'openai') {
          endpoint = '/models';
        }
        
        const response = await client.get(endpoint);
        
        if (response.status === 200) {
          logger.info(`AI server ${serverName} is available`);
          return true;
        }
      } catch (error) {
        logger.error(`AI server ${serverName} availability check failed: ${error.message}`);
      }
    }
    
    logger.error('No AI servers are available');
    return false;
  }
  
  /**
   * Clear the response cache.
   * 
   * @param {string} cacheKey - Specific key to clear (null to clear all)
   */
  clearCache(cacheKey = null) {
    if (cacheKey) {
      delete this.responseCache[cacheKey];
      logger.info(`Cleared cache for key: ${cacheKey}`);
    } else {
      this.responseCache = {};
      logger.info('Cleared entire response cache');
    }
  }
  
  /**
   * Get available AI models from all enabled AI servers.
   * 
   * @returns {Promise<object>} Map of servers to their available models
   */
  async getAvailableModels() {
    if (!this.enabled) {
      logger.info('AI integration is disabled');
      return {};
    }
    
    const results = {};
    
    for (const [serverName, serverConfig] of Object.entries(this.config.servers)) {
      if (serverConfig.enabled) {
        results[serverName] = serverConfig.models.available;
      }
    }
    
    return results;
  }
  
  /**
   * Get embedding for a text input.
   * 
   * @param {string} text - Text to embed
   * @param {string} model - Embedding model to use (default: OpenAI's text-embedding-3-large)
   * @returns {Promise<object>} Embedding response
   */
  async getEmbedding(text, model = 'text-embedding-3-large') {
    if (!this.enabled) {
      logger.warn('AI integration is disabled. Cannot generate embeddings.');
      return {
        status: 'error',
        error: 'AI integration is disabled',
        embedding: null
      };
    }
    
    // Currently only supporting OpenAI embeddings
    if (!this.clients.openai) {
      logger.error('OpenAI client not available for embeddings');
      return {
        status: 'error',
        error: 'OpenAI client not available',
        embedding: null
      };
    }
    
    try {
      const payload = {
        model,
        input: text
      };
      
      logger.info(`Getting embedding from OpenAI (model: ${model})`);
      
      const response = await this.clients.openai.post('/embeddings', payload);
      
      return {
        status: 'success',
        embedding: response.data.data[0].embedding,
        usage: response.data.usage,
        model: response.data.model
      };
    } catch (error) {
      logger.error(`Embedding request failed: ${error.message}`);
      
      return {
        status: 'error',
        error: error.message,
        embedding: null
      };
    }
  }
  
  /**
   * Configure the FlexTime connector.
   * 
   * @param {object} config - Configuration options
   */
  configure(config = {}) {
    // Update configuration
    this.config = { ...this.config, ...config };
    this.enabled = this.config.enabled;
    this.defaultServer = this.config.defaultServer;
    
    // Re-initialize clients
    this.initializeClients();
    
    logger.info('FlexTime Connector reconfigured');
    logger.info(`AI integration enabled: ${this.enabled}`);
    logger.info(`Default AI server: ${this.defaultServer}`);
  }
}

module.exports = FlexTimeConnector;