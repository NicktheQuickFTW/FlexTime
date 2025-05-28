/**
 * Enhanced Intelligence Engine Client for FlexTime
 * 
 * This module provides an enhanced client for connecting to the HELiiX
 * Intelligence Engine with improved MCP coordination based on the
 * architecture where Claude is the primary MCP for FlexTime and
 * MongoDB is the secondary MCP.
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const UnifiedMCPRouter = require('./unified_mcp_router');
const { CentralizedMemoryManager } = require('./centralized_memory_manager');
const FeedbackLoopSystem = require('./feedback_loop_system');

/**
 * Enhanced client for connecting FlexTime to the HELiiX Intelligence Engine
 */
class EnhancedIntelligenceEngineClient {
  /**
   * Create a new Enhanced Intelligence Engine Client
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = config;
    this.serviceUrl = config.serviceUrl || process.env.INTELLIGENCE_ENGINE_URL || 'http://localhost:4001/api';
    this.apiKey = config.apiKey || process.env.INTELLIGENCE_ENGINE_API_KEY;
    this.enabled = config.enabled !== false && (process.env.ENABLE_INTELLIGENCE_ENGINE !== 'false');
    
    // HTTP client for Intelligence Engine
    this.client = axios.create({
      baseURL: this.serviceUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-Service-Name': 'flextime'
      },
      timeout: 30000
    });
    
    // Initialize enhanced components
    this.mcpRouter = new UnifiedMCPRouter(config.mcpRouter || {}, { 
      intelligenceEngine: this 
    });
    
    this.memoryManager = new CentralizedMemoryManager(config.memory || {}, {
      intelligenceEngine: this,
      mcpRouter: this.mcpRouter
    });
    
    this.feedbackSystem = new FeedbackLoopSystem(config.feedback || {}, {
      intelligenceEngine: this,
      mcpRouter: this.mcpRouter,
      memoryManager: this.memoryManager
    });
    
    // Track available endpoints
    this.availableEndpoints = {
      scheduling: false,
      mcp: false,
      memory: false,
      learning: false,
      feedback: false
    };
    
    logger.info('Enhanced Intelligence Engine Client created', { 
      enabled: this.enabled,
      serviceUrl: this.serviceUrl
    });
  }
  
  /**
   * Initialize the client
   * 
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      if (!this.enabled) {
        logger.info('Intelligence Engine integration is disabled');
        return false;
      }
      
      // Check connection to Intelligence Engine
      try {
        const response = await this.client.get('/status');
        
        if (response.status === 200 && response.data.status === 'ok') {
          logger.info('Connected to Intelligence Engine successfully', {
            version: response.data.version,
            timestamp: response.data.timestamp
          });
          
          // Check available endpoints
          await this._checkAvailableEndpoints();
          
          // Initialize enhanced components
          await this.mcpRouter.initialize?.();
          
          return true;
        } else {
          throw new Error(`Unexpected status: ${response.data.status}`);
        }
      } catch (error) {
        logger.error(`Failed to connect to Intelligence Engine: ${error.message}`);
        return false;
      }
    } catch (error) {
      logger.error(`Failed to initialize Enhanced Intelligence Engine Client: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Check which endpoints are available in the Intelligence Engine
   * 
   * @returns {Promise<Object>} Available endpoints
   * @private
   */
  async _checkAvailableEndpoints() {
    const endpoints = [
      { path: '/mcp/status', key: 'mcp' },
      { path: '/scheduling/status', key: 'scheduling' },
      { path: '/memory/status', key: 'memory' },
      { path: '/learning/status', key: 'learning' },
      { path: '/feedback/status', key: 'feedback' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await this.client.get(endpoint.path);
        if (response.status === 200) {
          this.availableEndpoints[endpoint.key] = true;
          logger.info(`${endpoint.key} endpoints available in Intelligence Engine`);
        }
      } catch (error) {
        this.availableEndpoints[endpoint.key] = false;
        logger.warn(`${endpoint.key} endpoints not available in Intelligence Engine`, {
          error: error.message
        });
      }
    }
    
    return this.availableEndpoints;
  }
  
  /**
   * Send a request to an MCP server via the Intelligence Engine
   * 
   * @param {string} serverName - Name of the server to use
   * @param {Object} request - Request parameters
   * @returns {Promise<Object>} Response from the server
   */
  async sendMCPRequest(serverName, request) {
    if (!this.enabled) {
      logger.info('Intelligence Engine integration is disabled');
      return { success: false, error: 'Intelligence Engine is disabled' };
    }
    
    // Check if MCP endpoints are available
    if (!this.availableEndpoints.mcp) {
      logger.warn('MCP endpoints not available in Intelligence Engine');
      throw new Error('MCP endpoints not available');
    }
    
    try {
      logger.info(`Sending MCP request to ${serverName} via Intelligence Engine`);
      
      const response = await this.client.post('/mcp/request', {
        server: serverName,
        request
      });
      
      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      logger.error(`Failed to send MCP request: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Store an experience in memory
   * 
   * @param {Object} experience - Experience to store
   * @returns {Promise<Object>} Storage result
   */
  async storeExperience(experience) {
    if (!this.enabled) {
      logger.info('Intelligence Engine integration is disabled');
      return { success: false, error: 'Intelligence Engine is disabled' };
    }
    
    // Check if memory endpoints are available
    if (!this.availableEndpoints.memory) {
      logger.warn('Memory endpoints not available in Intelligence Engine');
      return this.memoryManager.storeMemory(experience);
    }
    
    try {
      logger.info('Storing experience in Intelligence Engine');
      
      const experienceDoc = {
        id: experience.id || uuidv4(),
        timestamp: experience.timestamp || new Date().toISOString(),
        ...experience
      };
      
      const response = await this.client.post('/memory/experiences', experienceDoc);
      
      if (response.status === 200 || response.status === 201) {
        return { success: true, id: response.data.id };
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      logger.error(`Failed to store experience: ${error.message}`);
      
      // Fall back to memory manager
      logger.info('Falling back to centralized memory manager');
      return this.memoryManager.storeMemory(experience);
    }
  }
  
  /**
   * Store feedback in memory
   * 
   * @param {Object} feedback - Feedback to store
   * @returns {Promise<Object>} Storage result
   */
  async storeFeedback(feedback) {
    if (!this.enabled) {
      logger.info('Intelligence Engine integration is disabled');
      return { success: false, error: 'Intelligence Engine is disabled' };
    }
    
    // Check if feedback endpoints are available
    if (!this.availableEndpoints.feedback) {
      logger.warn('Feedback endpoints not available in Intelligence Engine');
      return this.feedbackSystem.submitFeedback(feedback);
    }
    
    try {
      logger.info('Storing feedback in Intelligence Engine');
      
      const feedbackDoc = {
        id: feedback.id || uuidv4(),
        timestamp: feedback.timestamp || new Date().toISOString(),
        ...feedback
      };
      
      const response = await this.client.post('/feedback', feedbackDoc);
      
      if (response.status === 200 || response.status === 201) {
        return { success: true, id: response.data.id };
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      logger.error(`Failed to store feedback: ${error.message}`);
      
      // Fall back to feedback system
      logger.info('Falling back to feedback system');
      return this.feedbackSystem.submitFeedback(feedback);
    }
  }
  
  /**
   * Retrieve experiences from memory
   * 
   * @param {Object} query - Query to filter experiences
   * @returns {Promise<Object>} Retrieved experiences
   */
  async retrieveExperiences(query = {}) {
    if (!this.enabled) {
      logger.info('Intelligence Engine integration is disabled');
      return { success: false, error: 'Intelligence Engine is disabled', experiences: [] };
    }
    
    // Check if memory endpoints are available
    if (!this.availableEndpoints.memory) {
      logger.warn('Memory endpoints not available in Intelligence Engine');
      return this.memoryManager.retrieveMemories(query);
    }
    
    try {
      logger.info('Retrieving experiences from Intelligence Engine');
      
      const response = await this.client.get('/memory/experiences', { params: query });
      
      if (response.status === 200) {
        return { 
          success: true, 
          experiences: response.data.experiences || []
        };
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      logger.error(`Failed to retrieve experiences: ${error.message}`);
      
      // Fall back to memory manager
      logger.info('Falling back to centralized memory manager');
      return this.memoryManager.retrieveMemories(query);
    }
  }
  
  /**
   * Submit a task to an agent
   * 
   * @param {Object} task - Task to submit
   * @returns {Promise<Object>} Task result or task ID if async
   */
  async submitAgentTask(task) {
    if (!this.enabled) {
      logger.info('Intelligence Engine integration is disabled');
      return { success: false, error: 'Intelligence Engine is disabled' };
    }
    
    try {
      logger.info(`Submitting ${task.type} task to Intelligence Engine`);
      
      const taskDoc = {
        id: task.id || uuidv4(),
        timestamp: task.timestamp || new Date().toISOString(),
        ...task
      };
      
      const response = await this.client.post('/agents/tasks', taskDoc);
      
      if (response.status === 200 || response.status === 202) {
        return response.data;
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      logger.error(`Failed to submit agent task: ${error.message}`);
      
      // For specific task types, try to handle locally
      if (task.type === 'scheduling_recommendation') {
        return this._getLocalRecommendations(task.data);
      } else {
        return { success: false, error: error.message };
      }
    }
  }
  
  /**
   * Get scheduling recommendations
   * 
   * @param {Object} parameters - Scheduling parameters
   * @returns {Promise<Object>} Recommendations
   */
  async getSchedulingRecommendations(parameters) {
    if (!this.enabled) {
      logger.info('Intelligence Engine integration is disabled');
      return this._getLocalRecommendations(parameters);
    }
    
    // Check if scheduling endpoints are available
    if (!this.availableEndpoints.scheduling) {
      logger.warn('Scheduling endpoints not available in Intelligence Engine');
      return this._getLocalRecommendations(parameters);
    }
    
    try {
      logger.info('Getting scheduling recommendations from Intelligence Engine');
      
      const response = await this.client.post('/scheduling/recommendations', parameters);
      
      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      logger.error(`Failed to get scheduling recommendations: ${error.message}`);
      
      // Fall back to local recommendations
      logger.info('Falling back to local recommendations');
      return this._getLocalRecommendations(parameters);
    }
  }
  
  /**
   * Get local scheduling recommendations
   * 
   * @param {Object} parameters - Scheduling parameters
   * @returns {Promise<Object>} Recommendations
   * @private
   */
  async _getLocalRecommendations(parameters) {
    try {
      logger.info('Generating local scheduling recommendations');
      
      // Use Claude MCP for generating recommendations
      const response = await this.mcpRouter.routeRequest({
        taskType: 'scheduling',
        request: {
          prompt: `Generate scheduling recommendations for the following parameters:
          
${JSON.stringify(parameters, null, 2)}

Provide recommendations for:
1. Optimal algorithm selection
2. Key constraints to prioritize
3. Travel optimization strategies
4. Venue allocation approach

Format your response as a JSON object with these keys: algorithms, constraints, travel, venues`,
          model: 'claude-3-opus-20240229',
          temperature: 0.2,
          max_tokens: 1000
        }
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to generate recommendations');
      }
      
      // Parse recommendations from the response
      let recommendations;
      try {
        recommendations = JSON.parse(response.content);
      } catch (error) {
        logger.warn(`Failed to parse recommendations JSON: ${error.message}`);
        recommendations = {
          algorithms: [response.content],
          constraints: [],
          travel: [],
          venues: []
        };
      }
      
      return {
        success: true,
        recommendations,
        source: 'local_mcp'
      };
    } catch (error) {
      logger.error(`Failed to generate local recommendations: ${error.message}`);
      
      // Return minimal fallback recommendations
      return {
        success: false,
        error: error.message,
        recommendations: {
          algorithms: ['round_robin'],
          constraints: ['respect_travel_limits', 'balance_home_away'],
          travel: ['minimize_total_distance'],
          venues: ['prioritize_availability']
        },
        source: 'fallback'
      };
    }
  }
  
  /**
   * Get the status of the Intelligence Engine
   * 
   * @returns {Promise<Object>} Status information
   */
  async getStatus() {
    if (!this.enabled) {
      logger.info('Intelligence Engine disabled, returning mock status');
      return {
        success: true,
        status: 'disabled',
        version: '1.0.0',
        uptime: 0,
        connections: {
          mongodb: false,
          redis: false
        },
        endpoints: this.availableEndpoints,
        mcps: {
          claude: false,
          openai: false,
          context7: false,
          mongodb: false,
          neon: false
        }
      };
    }
    
    try {
      logger.info('Getting Intelligence Engine status');
      
      const response = await this.client.get('/status');
      
      if (response.status === 200) {
        logger.info('Received Intelligence Engine status');
        
        // Get MCP status if available
        let mcpStatus = {};
        if (this.availableEndpoints.mcp) {
          try {
            const mcpResponse = await this.client.get('/mcp/status');
            if (mcpResponse.status === 200) {
              mcpStatus = mcpResponse.data.status || {};
            }
          } catch (error) {
            logger.warn(`Failed to get MCP status: ${error.message}`);
          }
        }
        
        return {
          success: true,
          ...response.data,
          endpoints: this.availableEndpoints,
          mcps: mcpStatus
        };
      } else {
        logger.warn(`Failed to get Intelligence Engine status: ${response.statusText}`);
        throw new Error(response.statusText || 'Unknown error');
      }
    } catch (error) {
      logger.error(`Error getting Intelligence Engine status: ${error.message}`);
      
      // Return a fallback status with connection error
      return {
        success: false,
        status: 'connection_error',
        error: error.message,
        endpoints: this.availableEndpoints,
        connections: {
          mongodb: false,
          redis: false
        }
      };
    }
  }
  
  /**
   * Shutdown the client
   * 
   * @returns {Promise<boolean>} Success status
   */
  async shutdown() {
    try {
      logger.info('Shutting down Enhanced Intelligence Engine Client');
      
      // Shutdown enhanced components
      await this.mcpRouter.shutdown?.();
      
      return true;
    } catch (error) {
      logger.error('Failed to shutdown Enhanced Intelligence Engine Client', { error: error.message });
      return false;
    }
  }
  
  /**
   * Get the memory manager
   * 
   * @returns {CentralizedMemoryManager} Memory manager instance
   */
  getMemoryManager() {
    return this.memoryManager;
  }
  
  /**
   * Get the feedback system
   * 
   * @returns {FeedbackLoopSystem} Feedback system instance
   */
  getFeedbackSystem() {
    return this.feedbackSystem;
  }
  
  /**
   * Get the MCP router
   * 
   * @returns {UnifiedMCPRouter} MCP router instance
   */
  getMCPRouter() {
    return this.mcpRouter;
  }
}

module.exports = EnhancedIntelligenceEngineClient;
