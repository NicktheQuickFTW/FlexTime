/**
 * Intelligence Engine Client for FlexTime 2.1
 * 
 * This module provides a client for the FlexTime scheduling service to connect
 * to the HELiiX Intelligence Engine and use its agent capabilities.
 */

const axios = require('axios');
const logger = require('./utils/logger');
const MCPConnectorV2 = require('./mcp_connector_v2');
const AgentMemoryManager = require('./memory/agent_memory_manager');

/**
 * Client for connecting FlexTime to the HELiiX Intelligence Engine
 */
class IntelligenceEngineClient {
  /**
   * Create a new Intelligence Engine Client
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = config;
    this.serviceUrl = config.serviceUrl || process.env.INTELLIGENCE_ENGINE_URL || 'http://localhost:4001/api';
    this.apiKey = config.apiKey || process.env.INTELLIGENCE_ENGINE_API_KEY;
    this.enabled = config.enabled !== false && (process.env.ENABLE_INTELLIGENCE_ENGINE !== 'false');
    
    // Local components (for backward compatibility)
    this.mcpConnector = new MCPConnectorV2(config.mcp);
    this.memoryManager = new AgentMemoryManager(config.memory);
    
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
    
    // Track available endpoints
    this.availableEndpoints = {
      scheduling: false,
      mcp: false,
      memory: false
    };
    
    logger.info('Intelligence Engine Client created', { 
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
      // Initialize local components for backward compatibility
      await this.mcpConnector.initialize();
      await this.memoryManager.connect();
      
      if (!this.enabled) {
        logger.info('Intelligence Engine integration is disabled, using local components only');
        return true;
      }
      
      // Check connection to Intelligence Engine
      try {
        const response = await this.client.get('/status');
        
        if (response.status === 200 && response.data.status === 'ok') {
          logger.info('Connected to Intelligence Engine successfully', {
            version: response.data.version,
            timestamp: response.data.timestamp
          });
          
          // Get MCP status to verify API keys and check available endpoints
          try {
            const mcpStatus = await this.client.get('/mcp/status');
            if (mcpStatus.data.success) {
              logger.info('MCP integration verified', {
                servers: Object.keys(mcpStatus.data.status)
              });
              this.availableEndpoints.mcp = true;
            }
          } catch (mcpError) {
            logger.warn('MCP integration status check failed, API keys may be invalid or endpoint not available', {
              error: mcpError.message
            });
          }
          
          // Check if scheduling endpoints are available
          try {
            await this.client.get('/scheduling/status');
            this.availableEndpoints.scheduling = true;
            logger.info('Scheduling endpoints available in Intelligence Engine');
          } catch (schedulingError) {
            logger.warn('Scheduling endpoints not available in Intelligence Engine, will use local fallbacks', {
              error: schedulingError.message
            });
          }
          
          // Check if memory endpoints are available
          try {
            await this.client.get('/memory/status');
            this.availableEndpoints.memory = true;
            logger.info('Memory endpoints available in Intelligence Engine');
          } catch (memoryError) {
            logger.warn('Memory endpoints not available in Intelligence Engine, will use local memory manager', {
              error: memoryError.message
            });
          }
          
          return true;
        } else {
          logger.warn('Intelligence Engine returned unexpected status', { 
            status: response.status, 
            data: response.data 
          });
          return false;
        }
      } catch (error) {
        logger.warn('Failed to connect to Intelligence Engine, falling back to local components', { 
          error: error.message,
          url: this.serviceUrl
        });
        return true; // Still return true since we can use local components
      }
    } catch (error) {
      logger.error('Failed to initialize Intelligence Engine Client', { error: error.message });
      return false;
    }
  }
  
  /**
   * Send a request to an MCP server
   * 
   * @param {string} serverName - Name of the server to use
   * @param {Object} request - Request parameters
   * @returns {Promise<Object>} Response from the server
   */
  async sendMCPRequest(serverName, request) {
    try {
      if (!this.enabled || !this.availableEndpoints.mcp) {
        // Use local MCP connector
        return this.mcpConnector.sendRequest(serverName, request);
      }
      
      // Try to use Intelligence Engine
      try {
        const response = await this.client.post('/mcp/request', {
          server: serverName,
          request
        });
        
        if (response.data.success) {
          return response.data.response;
        } else {
          throw new Error(response.data.error || 'Unknown error');
        }
      } catch (ieError) {
        logger.warn(`Intelligence Engine MCP request failed, falling back to local: ${ieError.message}`);
        return this.mcpConnector.sendRequest(serverName, request);
      }
    } catch (error) {
      logger.error(`MCP request failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Store an experience in memory
   * 
   * @param {Object} experience - Experience to store
   * @returns {Promise<string>} ID of the stored experience
   */
  async storeExperience(experience) {
    try {
      if (!this.enabled || !this.availableEndpoints.memory) {
        // Use local memory manager
        return this.memoryManager.storeMemory({
          type: 'episodic',
          content: experience.content,
          metadata: {
            agentId: experience.agentId,
            experienceType: experience.type,
            tags: experience.tags || []
          }
        });
      }
      
      // Try to use Intelligence Engine
      try {
        const response = await this.client.post('/memory/experiences', experience);
        
        if (response.data.success) {
          return response.data.id;
        } else {
          throw new Error(response.data.error || 'Unknown error');
        }
      } catch (ieError) {
        logger.warn(`Intelligence Engine memory storage failed, falling back to local: ${ieError.message}`);
        
        // Map to local memory manager format
        return this.memoryManager.storeMemory({
          type: 'episodic',
          content: experience.content,
          metadata: {
            agentId: experience.agentId,
            experienceType: experience.type,
            tags: experience.tags || []
          }
        });
      }
    } catch (error) {
      logger.error(`Failed to store experience: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Store feedback in memory
   * 
   * @param {Object} feedback - Feedback to store
   * @returns {Promise<string>} ID of the stored feedback
   */
  async storeFeedback(feedback) {
    try {
      if (!this.enabled || !this.availableEndpoints.memory) {
        // Use local memory manager to store as episodic memory
        return this.memoryManager.storeMemory({
          type: 'episodic',
          content: feedback,
          metadata: {
            agentId: feedback.agentId,
            experienceType: 'feedback',
            tags: ['feedback', feedback.scheduleId]
          }
        });
      }
      
      // Try to use Intelligence Engine
      try {
        const response = await this.client.post('/memory/feedback', feedback);
        
        if (response.data.success) {
          return response.data.id;
        } else {
          throw new Error(response.data.error || 'Unknown error');
        }
      } catch (ieError) {
        logger.warn(`Intelligence Engine feedback storage failed, falling back to local: ${ieError.message}`);
        
        // Map to local memory manager format
        return this.memoryManager.storeMemory({
          type: 'episodic',
          content: feedback,
          metadata: {
            agentId: feedback.agentId,
            experienceType: 'feedback',
            tags: ['feedback', feedback.scheduleId]
          }
        });
      }
    } catch (error) {
      logger.error(`Failed to store feedback: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Retrieve experiences from memory
   * 
   * @param {Object} query - Query to filter experiences
   * @returns {Promise<Array>} Retrieved experiences
   */
  async retrieveExperiences(query = {}) {
    try {
      if (!this.enabled || !this.availableEndpoints.memory) {
        // Use local memory manager
        const localQuery = {
          type: 'episodic',
          metadata: {}
        };
        
        if (query.agentId) {
          localQuery.metadata.agentId = query.agentId;
        }
        
        if (query.type) {
          localQuery.metadata.experienceType = query.type;
        }
        
        if (query.tags && query.tags.length > 0) {
          localQuery.metadata.tags = { $in: query.tags };
        }
        
        const memories = await this.memoryManager.retrieveMemories(localQuery);
        
        // Map to Intelligence Engine format
        return memories.map(memory => ({
          id: memory.id,
          agentId: memory.metadata.agentId,
          type: memory.metadata.experienceType,
          content: memory.content,
          tags: memory.metadata.tags || [],
          timestamp: memory.timestamp
        }));
      }
      
      // Try to use Intelligence Engine
      try {
        const response = await this.client.get('/memory/experiences', { params: query });
        
        if (response.data.success) {
          return response.data.experiences;
        } else {
          throw new Error(response.data.error || 'Unknown error');
        }
      } catch (ieError) {
        logger.warn(`Intelligence Engine memory retrieval failed, falling back to local: ${ieError.message}`);
        
        // Map to local memory manager format
        const localQuery = {
          type: 'episodic',
          metadata: {}
        };
        
        if (query.agentId) {
          localQuery.metadata.agentId = query.agentId;
        }
        
        if (query.type) {
          localQuery.metadata.experienceType = query.type;
        }
        
        if (query.tags && query.tags.length > 0) {
          localQuery.metadata.tags = { $in: query.tags };
        }
        
        const memories = await this.memoryManager.retrieveMemories(localQuery);
        
        // Map to Intelligence Engine format
        return memories.map(memory => ({
          id: memory.id,
          agentId: memory.metadata.agentId,
          type: memory.metadata.experienceType,
          content: memory.content,
          tags: memory.metadata.tags || [],
          timestamp: memory.timestamp
        }));
      }
    } catch (error) {
      logger.error(`Failed to retrieve experiences: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Submit a task to an agent
   * 
   * @param {Object} task - Task to submit
   * @returns {Promise<Object>} Task result or task ID if async
   */
  async submitAgentTask(task) {
    try {
      if (!this.enabled) {
        logger.warn('Intelligence Engine disabled, cannot submit agent task');
        return {
          success: false,
          error: 'Intelligence Engine is disabled'
        };
      }
      
      logger.info(`Submitting task to agent ${task.agentId}`);
      
      try {
        const response = await this.client.post('/agents/tasks', task);
        
        if (response.data.success) {
          if (response.data.taskId && !response.data.result) {
            // Async task
            logger.info(`Task submitted asynchronously, taskId: ${response.data.taskId}`);
            return {
              success: true,
              taskId: response.data.taskId,
              async: true
            };
          } else {
            // Sync task with immediate result
            logger.info(`Task completed synchronously`);
            return {
              success: true,
              result: response.data.result,
              async: false
            };
          }
        } else {
          throw new Error(response.data.error || 'Unknown error');
        }
      } catch (error) {
        logger.error(`Failed to submit task: ${error.message}`);
        return {
          success: false,
          error: error.message
        };
      }
    } catch (error) {
      logger.error(`Error in submitAgentTask: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get scheduling recommendations
   * 
   * @param {Object} parameters - Scheduling parameters
   * @returns {Promise<Object>} Recommendations
   */
  async getSchedulingRecommendations(parameters) {
    try {
      if (!this.enabled) {
        logger.info('Intelligence Engine disabled, using local recommendations');
        return this._getLocalRecommendations(parameters);
      }
      
      // Check if scheduling endpoints are available
      if (!this.availableEndpoints.scheduling) {
        logger.info('Scheduling endpoints not available, using local recommendations');
        return this._getLocalRecommendations(parameters);
      }
      
      // Try to use Intelligence Engine
      try {
        logger.info('Getting scheduling recommendations from Intelligence Engine');
        
        const response = await this.client.post('/scheduling/recommendations', parameters);
        
        if (response.data.success) {
          logger.info('Received recommendations from Intelligence Engine');
          return response.data;
        } else {
          logger.warn(`Failed to get recommendations: ${response.data.error}`);
          throw new Error(response.data.error || 'Unknown error');
        }
      } catch (ieError) {
        logger.warn(`Intelligence Engine recommendations failed, falling back to local: ${ieError.message}`);
        return this._getLocalRecommendations(parameters);
      }
    } catch (error) {
      logger.error(`Error getting recommendations: ${error.message}`);
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
    const sportType = parameters.sportType || 'unknown';
    
    // Default recommendations
    const recommendations = {
      success: true,
      sportType,
      algorithms: {
        generator: 'RoundRobinGenerator',
        optimizer: 'SimulatedAnnealingOptimizer'
      },
      constraints: [
        {
          type: 'HomeAwayBalance',
          weight: 1.0,
          parameters: {}
        },
        {
          type: 'MinimumRestDays',
          weight: 0.8,
          parameters: { minDays: 1 }
        }
      ],
      parameters: {
        optimizationIterations: 1000,
        coolingRate: 0.95,
        initialTemperature: 100
      },
      source: 'local'
    };
    
    // Sport-specific recommendations
    if (sportType === 'basketball') {
      recommendations.constraints.push({
        type: 'AvoidBackToBack',
        weight: 0.7,
        parameters: {}
      });
    } else if (sportType === 'football') {
      recommendations.constraints.push({
        type: 'WeekendGamesPreference',
        weight: 0.9,
        parameters: {}
      });
    }
    
    // Try to get recommendations from local memory
    try {
      const experiences = await this.memoryManager.retrieveMemories({
        type: 'episodic',
        metadata: {
          experienceType: 'schedule_generation',
          tags: sportType
        },
        sort: { timestamp: -1 },
        limit: 5
      });
      
      if (experiences.length > 0) {
        // Use the most successful past experience
        const bestExperience = experiences.reduce((best, exp) => {
          const rating = exp.content.metrics?.rating || 0;
          return rating > (best.content.metrics?.rating || 0) ? exp : best;
        }, experiences[0]);
        
        if (bestExperience.content.algorithms) {
          recommendations.algorithms = bestExperience.content.algorithms;
        }
        
        if (bestExperience.content.constraints) {
          recommendations.constraints = bestExperience.content.constraints;
        }
        
        if (bestExperience.content.parameters) {
          recommendations.parameters = bestExperience.content.parameters;
        }
        
        recommendations.source = 'local_memory';
      }
    } catch (memoryError) {
      logger.warn(`Failed to get recommendations from memory: ${memoryError.message}`);
    }
    
    return recommendations;
  }
  
  /**
   * Get advanced learning recommendations for scheduling
   * 
   * @param {Object} parameters - Parameters for the learning request
   * @returns {Promise<Object>} Learning recommendations
   */
  async getAdvancedLearningRecommendations(parameters) {
    if (!this.enabled) {
      logger.info('Intelligence Engine disabled, cannot get advanced learning recommendations');
      return {
        success: false,
        error: 'Intelligence Engine is required for advanced learning recommendations'
      };
    }
    
    // Check if scheduling endpoints are available
    if (!this.availableEndpoints.scheduling) {
      logger.info('Scheduling endpoints not available, cannot get advanced learning recommendations');
      return {
        success: false,
        error: 'Scheduling endpoints not available in Intelligence Engine'
      };
    }
    
    try {
      logger.info('Getting advanced learning recommendations from Intelligence Engine');
      
      const response = await this.client.post('/scheduling/learning', parameters);
      
      if (response.data.success) {
        logger.info('Received advanced learning recommendations from Intelligence Engine');
        return response.data;
      } else {
        logger.warn(`Failed to get advanced learning recommendations: ${response.data.error}`);
        throw new Error(response.data.error || 'Unknown error');
      }
    } catch (error) {
      logger.error(`Error getting advanced learning recommendations: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get sport-specific scheduling templates
   * 
   * @param {string} sportType - Type of sport
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Sport-specific templates
   */
  async getSportTemplates(sportType, options = {}) {
    if (!this.enabled) {
      logger.info('Intelligence Engine disabled, using local sport templates');
      return this._getLocalSportTemplates(sportType);
    }
    
    // Check if scheduling endpoints are available
    if (!this.availableEndpoints.scheduling) {
      logger.info('Scheduling endpoints not available, using local sport templates');
      return this._getLocalSportTemplates(sportType);
    }
    
    try {
      logger.info(`Getting ${sportType} templates from Intelligence Engine`);
      
      const response = await this.client.get(`/sports/${sportType}/templates`, { params: options });
      
      if (response.data.success) {
        logger.info(`Received ${sportType} templates from Intelligence Engine`);
        return response.data;
      } else {
        logger.warn(`Failed to get ${sportType} templates: ${response.data.error}`);
        throw new Error(response.data.error || 'Unknown error');
      }
    } catch (error) {
      logger.error(`Error getting ${sportType} templates: ${error.message}`);
      return this._getLocalSportTemplates(sportType);
    }
  }
  
  /**
   * Get local sport-specific scheduling templates
   * 
   * @param {string} sportType - Type of sport
   * @returns {Object} Sport-specific templates
   * @private
   */
  _getLocalSportTemplates(sportType) {
    // Default templates
    return {
      success: true,
      sportType,
      templates: [
        {
          name: 'Standard Season',
          description: `Standard ${sportType} season template`,
          parameters: {
            gameCount: sportType === 'football' ? 12 : 30,
            homeAwayBalance: true,
            weekendPreference: sportType === 'football'
          }
        },
        {
          name: 'Conference Play',
          description: `${sportType} conference play template`,
          parameters: {
            gameCount: sportType === 'football' ? 9 : 18,
            homeAwayBalance: true,
            divisionalPlay: true
          }
        }
      ],
      source: 'local'
    };
  }
  
  /**
   * Get multi-sport scheduling recommendations
   * 
   * @param {Array<Object>} sportParameters - Parameters for each sport
   * @returns {Promise<Object>} Multi-sport recommendations
   */
  async getMultiSportRecommendations(sportParameters) {
    if (!this.enabled) {
      logger.info('Intelligence Engine disabled, cannot get multi-sport recommendations');
      return {
        success: false,
        error: 'Intelligence Engine is required for multi-sport recommendations'
      };
    }
    
    // Check if scheduling endpoints are available
    if (!this.availableEndpoints.scheduling) {
      logger.info('Scheduling endpoints not available, cannot get multi-sport recommendations');
      return {
        success: false,
        error: 'Scheduling endpoints not available in Intelligence Engine'
      };
    }
    
    try {
      logger.info('Getting multi-sport recommendations from Intelligence Engine');
      
      const response = await this.client.post('/scheduling/multi-sport', { sports: sportParameters });
      
      if (response.data.success) {
        logger.info('Received multi-sport recommendations from Intelligence Engine');
        return response.data;
      } else {
        logger.warn(`Failed to get multi-sport recommendations: ${response.data.error}`);
        throw new Error(response.data.error || 'Unknown error');
      }
    } catch (error) {
      logger.error(`Error getting multi-sport recommendations: ${error.message}`);
      return {
        success: false,
        error: error.message
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
        stats: {
          requestsToday: 0,
          totalRequests: 0,
          experienceCount: 0,
          experiencesByType: {},
          memoryUsed: 0,
          memoryTotal: 0,
          avgResponseTime: 0,
          activeConnections: 0
        }
      };
    }
    
    try {
      logger.info('Getting Intelligence Engine status');
      
      const response = await this.client.get('/status');
      
      if (response.status === 200) {
        logger.info('Received Intelligence Engine status');
        return {
          success: true,
          ...response.data,
          endpoints: this.availableEndpoints
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
      logger.info('Shutting down Intelligence Engine Client');
      
      // Shutdown local components
      await this.mcpConnector.shutdown();
      await this.memoryManager.disconnect();
      
      return true;
    } catch (error) {
      logger.error('Failed to shutdown Intelligence Engine Client', { error: error.message });
      return false;
    }
  }
}

module.exports = IntelligenceEngineClient;
