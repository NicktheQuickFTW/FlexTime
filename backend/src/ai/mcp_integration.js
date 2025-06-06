/**
 * MCP Integration for the FlexTime multi-agent system.
 * 
 * This module integrates the Claude MCP connector with the agent system
 * and provides a unified interface for AI-enhanced capabilities.
 * Uses Claude as the primary MCP for improved reasoning and consistency.
 */

const logger = require('../scripts/logger");
const MCPConnectorV2 = require('./mcp_connector_v2');
const AnthropicMCPConnector = require('./anthropic_mcp_connector');
const AgentMemoryManager = require('./memory/agent_memory_manager');
const LearningSystem = require('./ml/learning_system');
const mcpConfig = require('../../config/mcp_config');

/**
 * MCP Integration for the FlexTime agent system.
 */
class MCPIntegration {
  /**
   * Initialize a new MCP Integration.
   * 
   * @param {object} config - Configuration options (overrides defaults from mcp_config.js)
   */
  constructor(config = {}) {
    this.config = { ...mcpConfig, ...config };
    this.enabled = this.config.enabled;
    
    // Initialize components
    this.anthropicConnector = new AnthropicMCPConnector(this.config);
    this.mcpConnector = new MCPConnectorV2(this.config);
    this.memoryManager = new AgentMemoryManager(this.config.memory);
    this.learningSystem = new LearningSystem({
      mongoUri: this.config.memory.neon.connectionString,
      modelsPath: './models'
    });
    
    // Set Claude as the primary connector
    this.primaryConnector = this.anthropicConnector;
    
    logger.info('MCP Integration initialized');
    logger.info(`MCP integration enabled: ${this.enabled}`);
    logger.info(`Primary MCP connector: ${this.config.defaultServer}`);
  }
  
  /**
   * Initialize the MCP integration.
   * 
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (!this.enabled) {
      logger.info('MCP integration is disabled. Skipping initialization.');
      return true;
    }
    
    try {
      logger.info('Initializing MCP integration');
      
      // Check Claude MCP server availability first
      const anthropicAvailable = await this.anthropicConnector.checkAvailability();
      
      if (anthropicAvailable) {
        logger.info('Claude MCP server is available');
        this.primaryConnector = this.anthropicConnector;
      } else {
        logger.warn('Claude MCP server is not available. Checking fallback servers...');
        
        // Check fallback MCP server availability
        const mcpAvailable = await this.mcpConnector.checkAvailability();
        
        if (!mcpAvailable) {
          logger.warn('No MCP servers are available. Using fallback mode.');
        } else {
          logger.info('Fallback MCP servers are available');
          this.primaryConnector = this.mcpConnector;
        }
      }
      
      // Connect to memory storage
      const memoryConnected = await this.memoryManager.connect();
      
      if (!memoryConnected) {
        logger.warn('Failed to connect to memory storage. Some features will be limited.');
      } else {
        logger.info('Connected to memory storage');
      }
      
      // Initialize learning system
      const learningInitialized = await this.learningSystem.initialize();
      
      if (!learningInitialized.success) {
        logger.warn(`Failed to initialize learning system: ${learningInitialized.error}`);
      } else {
        logger.info('Learning system initialized');
      }
      
      logger.info('MCP integration initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize MCP integration: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Send a request to the appropriate MCP server.
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
  async sendRequest(options) {
    if (!this.enabled) {
      logger.warn('MCP integration is disabled. Using fallback response.');
      return this.getFallbackResponse();
    }
    
    try {
      // Enhance context with agent memories if available
      if (options.agentId && this.memoryManager) {
        const memories = await this.getRelevantMemories(options.agentId, options.taskType);
        
        if (memories && memories.length > 0) {
          options.context = {
            ...options.context,
            memories
          };
        }
      }
      
      // Enhance context with sport sponsorship data if relevant
      if (options.context && options.context.sportType) {
        options.context.sportSponsorship = await this.getSportSponsorshipData(options.context.sportType);
      }
      
      // Send request to primary MCP connector (Claude)
      return await this.primaryConnector.sendRequest(options);
    } catch (error) {
      logger.error(`Primary MCP request failed: ${error.message}. Attempting fallback...`);
      
      try {
        // If primary connector fails, try the fallback
        const fallbackConnector = this.primaryConnector === this.anthropicConnector ? 
          this.mcpConnector : this.anthropicConnector;
        
        return await fallbackConnector.sendRequest(options);
      } catch (fallbackError) {
        logger.error(`Fallback MCP request also failed: ${fallbackError.message}`);
        return this.getFallbackResponse();
      }
    }
  }
  
  /**
   * Get sport sponsorship data for a specific sport type.
   * 
   * @param {string} sportType - Type of sport
   * @returns {Promise<object>} Sport sponsorship data
   * @private
   */
  async getSportSponsorshipData(sportType) {
    try {
      // In a production environment, this would fetch from the database
      // For now, we'll use a placeholder that the actual implementation
      // will replace with data from sportConfig.ts
      return {
        sportType,
        message: `Using sport sponsorship data for ${sportType}`,
        // This is a placeholder - the actual data will be populated
        // by the FlexTime system using the sportConfig data
        sponsoringSchools: []
      };
    } catch (error) {
      logger.error(`Failed to get sport sponsorship data: ${error.message}`);
      return {};
    }
  }
  
  /**
   * Get relevant memories for an agent and task.
   * 
   * @param {string} agentId - ID of the agent
   * @param {string} taskType - Type of task
   * @returns {Promise<Array<object>>} Relevant memories
   * @private
   */
  async getRelevantMemories(agentId, taskType) {
    if (!this.memoryManager) {
      return [];
    }
    
    try {
      // Get domain for this task type
      const domain = this.taskTypeToDomain(taskType);
      
      // Query memories
      const memories = await this.memoryManager.queryMemories({
        agentId,
        tags: [domain, taskType],
        limit: 5
      });
      
      return memories.map(memory => ({
        id: memory.id,
        content: memory.content,
        tags: memory.tags,
        createdAt: memory.createdAt
      }));
    } catch (error) {
      logger.error(`Failed to get relevant memories: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Convert task type to knowledge domain.
   * 
   * @param {string} taskType - Task type
   * @returns {string} Knowledge domain
   * @private
   */
  taskTypeToDomain(taskType) {
    const domainMap = {
      'algorithm_selection': 'scheduling',
      'constraint_analysis': 'scheduling',
      'resource_allocation': 'resources',
      'travel_optimization': 'travel',
      'venue_management': 'venues',
      'schedule_optimization': 'scheduling',
      'sport_sponsorship': 'sports'
    };
    
    return domainMap[taskType] || 'general';
  }
  
  /**
   * Get scheduling recommendations based on parameters.
   * 
   * @param {object} parameters - Scheduling parameters
   * @param {object} context - Context information
   * @returns {Promise<object>} Recommendations
   */
  async getRecommendations(parameters, context = {}) {
    if (!this.enabled) {
      logger.warn('MCP integration is disabled. Using fallback recommendations.');
      return this.getFallbackRecommendations(parameters);
    }
    
    try {
      // Enhance context with sport sponsorship data if relevant
      if (parameters.sportType) {
        context.sportSponsorship = await this.getSportSponsorshipData(parameters.sportType);
      }
      
      // Send request to primary connector (Claude)
      const response = await this.primaryConnector.sendRequest({
        taskType: 'algorithm_selection',
        prompt: `Generate scheduling recommendations for ${parameters.sportType} with the following parameters: ${JSON.stringify(parameters)}`,
        context: {
          parameters,
          ...context
        }
      });
      
      // Parse recommendations from response
      return {
        success: true,
        recommendations: JSON.parse(response.content),
        source: response.model
      };
    } catch (error) {
      logger.error(`Failed to get recommendations: ${error.message}`);
      return this.getFallbackRecommendations(parameters);
    }
  }
  
  /**
   * Get embeddings for a text input.
   * 
   * @param {string} text - Text to embed
   * @param {string} model - Embedding model to use
   * @returns {Promise<object>} Embedding response
   */
  async getEmbedding(text, model) {
    if (!this.enabled) {
      logger.warn('MCP integration is disabled. Cannot generate embeddings.');
      return {
        status: 'error',
        error: 'MCP integration is disabled',
        embedding: null
      };
    }
    
    try {
      // Try primary connector first (Claude)
      return await this.primaryConnector.getEmbedding(text, model);
    } catch (error) {
      logger.error(`Primary embedding request failed: ${error.message}. Attempting fallback...`);
      
      try {
        // If primary connector fails, try the fallback
        const fallbackConnector = this.primaryConnector === this.anthropicConnector ? 
          this.mcpConnector : this.anthropicConnector;
        
        return await fallbackConnector.getEmbedding(text, model);
      } catch (fallbackError) {
        logger.error(`Fallback embedding request also failed: ${fallbackError.message}`);
        return {
          status: 'error',
          error: fallbackError.message,
          embedding: null
        };
      }
    }
  }
  
  /**
   * Store agent experience in memory.
   * 
   * @param {object} experience - Experience to store
   * @returns {Promise<string>} ID of the stored experience
   */
  async storeExperience(experience) {
    if (!this.memoryManager) {
      return null;
    }
    
    try {
      return await this.memoryManager.storeExperience(experience);
    } catch (error) {
      logger.error(`Failed to store experience: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Store learning outcome from agent's experiences.
   * 
   * @param {object} learning - Learning to store
   * @returns {Promise<string>} ID of the stored learning
   */
  async storeLearning(learning) {
    if (!this.memoryManager) {
      return null;
    }
    
    try {
      return await this.memoryManager.storeLearning(learning);
    } catch (error) {
      logger.error(`Failed to store learning: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Retrieve agent experiences from memory.
   * 
   * @param {object} query - Query parameters
   * @param {string} query.agentId - ID of the agent
   * @param {string|Array<string>} query.tags - Tags to filter by
   * @param {number} query.limit - Maximum number of experiences to retrieve
   * @returns {Promise<Array<object>>} Retrieved experiences
   */
  async retrieveExperiences(query) {
    if (!this.memoryManager) {
      return [];
    }
    
    try {
      // Add sport sponsorship tag if querying for that domain
      if (query.tags && query.tags.includes('sports')) {
        query.tags = Array.isArray(query.tags) ? 
          [...query.tags, 'sport_sponsorship'] : 
          [query.tags, 'sport_sponsorship'];
      }
      
      return await this.memoryManager.queryExperiences(query);
    } catch (error) {
      logger.error(`Failed to retrieve experiences: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Submit feedback for a schedule.
   * 
   * @param {object} feedbackData - Feedback data
   * @returns {Promise<object>} Submission result
   */
  async submitFeedback(feedbackData) {
    if (!this.enabled) {
      logger.warn('MCP integration is disabled. Cannot submit feedback.');
      return {
        success: false,
        error: 'MCP integration is disabled'
      };
    }
    
    try {
      // Store feedback in memory manager
      await this.memoryManager.storeFeedback(feedbackData);
      
      // Submit to learning system
      return await this.learningSystem.submitFeedback(feedbackData);
    } catch (error) {
      logger.error(`Failed to submit feedback: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Run a complete learning cycle.
   * 
   * @param {Array<object>} recentSchedules - Recent schedules
   * @returns {Promise<object>} Learning cycle result
   */
  async runLearningCycle(recentSchedules) {
    if (!this.enabled) {
      logger.warn('MCP integration is disabled. Cannot run learning cycle.');
      return {
        success: false,
        error: 'MCP integration is disabled'
      };
    }
    
    try {
      return await this.learningSystem.runLearningCycle(recentSchedules);
    } catch (error) {
      logger.error(`Learning cycle failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get a fallback response when MCP is disabled or errors occur.
   * 
   * @returns {object} Fallback response
   * @private
   */
  getFallbackResponse() {
    return {
      status: 'fallback',
      content: 'This response was generated using fallback logic because MCP integration is disabled or unavailable.',
      model: 'fallback'
    };
  }
  
  /**
   * Get fallback recommendations when MCP is disabled or errors occur.
   * 
   * @param {object} parameters - Scheduling parameters
   * @returns {object} Fallback recommendations
   * @private
   */
  getFallbackRecommendations(parameters) {
    // Default recommendations based on sport type
    const sportType = parameters.sportType || 'basketball';
    
    const recommendations = {
      algorithm: 'round_robin',
      constraintWeights: {
        'travel_distance': 0.3,
        'rest_periods': 0.2,
        'home_away_balance': 0.3,
        'venue_availability': 0.2
      },
      optimizationStrategy: 'simulated_annealing',
      parameters: {
        'max_iterations': 1000,
        'cooling_rate': 0.95,
        'initial_temperature': 100
      }
    };
    
    // Sport-specific adjustments
    switch (sportType.toLowerCase()) {
      case 'basketball':
        recommendations.constraintWeights.rest_periods = 0.25;
        recommendations.constraintWeights.home_away_balance = 0.25;
        break;
      case 'football':
        recommendations.constraintWeights.rest_periods = 0.3;
        recommendations.constraintWeights.travel_distance = 0.2;
        break;
      case 'baseball':
        recommendations.algorithm = 'partial_round_robin';
        recommendations.constraintWeights.venue_availability = 0.3;
        recommendations.constraintWeights.travel_distance = 0.2;
        break;
      case 'soccer':
        recommendations.constraintWeights.home_away_balance = 0.4;
        recommendations.constraintWeights.travel_distance = 0.2;
        break;
      case 'volleyball':
        recommendations.constraintWeights.venue_availability = 0.3;
        recommendations.constraintWeights.home_away_balance = 0.3;
        break;
      case 'tennis':
        recommendations.algorithm = 'swiss_system';
        recommendations.constraintWeights.rest_periods = 0.3;
        recommendations.constraintWeights.venue_availability = 0.3;
        break;
      case 'gymnastics':
        recommendations.algorithm = 'round_robin';
        recommendations.constraintWeights.venue_availability = 0.4;
        recommendations.constraintWeights.travel_distance = 0.2;
        break;
      case 'wrestling':
        recommendations.algorithm = 'bracket_elimination';
        recommendations.constraintWeights.rest_periods = 0.4;
        recommendations.constraintWeights.venue_availability = 0.3;
        break;
    }
    
    return {
      success: true,
      recommendations,
      source: 'fallback'
    };
  }
  
  /**
   * Close connections and shut down the integration.
   * 
   * @returns {Promise<boolean>} Whether shutdown was successful
   */
  async shutdown() {
    try {
      logger.info('Shutting down MCP integration');
      
      // Close memory manager connections
      if (this.memoryManager) {
        await this.memoryManager.close();
      }
      
      // Shutdown learning system
      if (this.learningSystem) {
        await this.learningSystem.shutdown();
      }
      
      logger.info('MCP integration shut down successfully');
      return true;
    } catch (error) {
      logger.error(`Failed to shut down MCP integration: ${error.message}`);
      return false;
    }
  }
}

module.exports = MCPIntegration;