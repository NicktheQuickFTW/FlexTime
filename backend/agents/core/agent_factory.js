/**
 * FlexTime Agent Factory
 * 
 * This module provides a factory for creating and managing agents
 * in the FlexTime system, ensuring consistent initialization and
 * configuration of various agent types.
 */

const MasterDirectorAgent = require('../master_director_agent');
const { SchedulingDirectorAgent } = require('../director/scheduling_director');
const { OperationsDirectorAgent } = require('../director/operations_director');
const { AnalysisDirectorAgent } = require('../director/analysis_director');
const AgentCommunicationManager = require('../communication_manager');
const MCPIntegration = require('../mcp_integration');
// MCP config removed, using default config instead
const mcpConfig = { agents: { knowledge_graph: {} } }; // Empty config with structure
const LearningSystem = require('../learning/learning_system');
const EnhancedMemoryManager = require('../memory/enhanced_memory_manager');
const logger = require('../../utils/logger');
const KnowledgeGraphAgent = require('../enhanced/knowledge_graph/knowledge_graph_agent');
const ConflictExplanation = require('../enhanced/conflict_explanation');
const { HELiiXIntelligenceConnectorAgent } = require('../heliix_connector');
// C7 components removed
// const C7RecommendationEngine = require('../enhanced/c7_recommendation_engine');
// const C7NaturalLanguageInterface = require('../enhanced/c7_natural_language_interface');

/**
 * Factory for creating and managing FlexTime agents
 */
class AgentFactory {
  /**
   * Create a new Agent Factory instance
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      enableMCP: process.env.ENABLE_MCP === 'true',
      enableLearning: process.env.ENABLE_LEARNING !== 'false',
      enableMemory: process.env.ENABLE_AGENT_MEMORY !== 'false',
      enableKnowledgeGraph: process.env.ENABLE_KNOWLEDGE_GRAPH !== 'false',
      enableIntelligenceEngine: process.env.ENABLE_INTELLIGENCE_ENGINE !== 'false',
      // C7 features removed
      // enableC7Recommendations: process.env.ENABLE_C7_RECOMMENDATIONS !== 'false',
      // enableNaturalLanguage: process.env.ENABLE_NL_INTERFACE !== 'false',
      ...config
    };
    
    // Track created agents
    this.agents = new Map();

    // Initialize support systems
    this.communicationManager = null;
    this.mcpIntegration = null;
    this.learningSystem = null;
    this.memoryManager = null;
    this.knowledgeGraphAgent = null;
    this.conflictExplanation = null;
    this.intelligenceConnector = null;
    this.recommendationEngine = null;
    this.naturalLanguageInterface = null;
    
    logger.info('Agent Factory initialized');
  }
  
  /**
   * Initialize support systems for agents
   * 
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initializeSupportSystems() {
    try {
      // Initialize communication manager
      this.communicationManager = new AgentCommunicationManager();
      
      // Initialize MCP integration if enabled
      if (this.config.enableMCP) {
        logger.info('Initializing MCP integration');
        this.mcpIntegration = new MCPIntegration({
          endpoint: this.config.mcpEndpoint,
          config: mcpConfig
        });
        await this.mcpIntegration.initialize();
        logger.info('MCP integration initialized successfully');
      }
      
      // Initialize learning system if enabled
      if (this.config.enableLearning) {
        logger.info('Initializing Learning System');
        this.learningSystem = new LearningSystem({
          enabled: true
        });
        await this.learningSystem.initialize();
        logger.info('Learning System initialized successfully');
      }
      
      // Initialize memory manager if enabled
      if (this.config.enableMemory) {
        logger.info('Initializing Agent Memory Manager');
        this.memoryManager = new EnhancedMemoryManager({
          enabled: true,
          neonConnection: this.config.neonConnection || process.env.NEON_DB_CONNECTION_STRING
        });
        await this.memoryManager.connect();
        logger.info('Agent Memory Manager initialized successfully');
      }
      
      // Initialize knowledge graph agent if enabled
      if (this.config.enableKnowledgeGraph) {
        logger.info('Initializing Knowledge Graph Agent');
        this.knowledgeGraphAgent = new KnowledgeGraphAgent({
          enabled: true
        });
        await this.knowledgeGraphAgent.initialize();

        // Initialize conflict explanation module with knowledge graph agent
        logger.info('Initializing Conflict Explanation module');
        this.conflictExplanation = ConflictExplanation;
        await this.conflictExplanation.initialize({
          knowledgeGraphAgent: this.knowledgeGraphAgent
        });

        logger.info('Knowledge Graph and Conflict Explanation initialized successfully');
      }

      // Initialize Intelligence Engine Connector if enabled
      if (this.config.enableIntelligenceEngine) {
        logger.info('Initializing HELiiX Intelligence Connector Agent');
        this.intelligenceConnector = new HELiiXIntelligenceConnectorAgent({
          enabled: true,
          intelligence: {
            serviceUrl: this.config.intelligenceEngineUrl || process.env.INTELLIGENCE_ENGINE_URL,
            apiKey: this.config.intelligenceEngineApiKey || process.env.INTELLIGENCE_ENGINE_API_KEY,
            enabled: true
          }
        });
        await this.intelligenceConnector.initialize();
        logger.info('HELiiX Intelligence Connector Agent initialized successfully');
      }

      // Context7 recommendation engine removed
      this.recommendationEngine = null;

      // Natural language interface removed
      this.naturalLanguageInterface = null;
      
      return true;
    } catch (error) {
      logger.error(`Failed to initialize agent support systems: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Create a new agent instance
   * 
   * @param {string} agentType - Type of agent to create
   * @param {Object} config - Agent-specific configuration
   * @returns {Object} Created agent instance
   */
  createAgent(agentType, config = {}) {
    // Check if agent already exists
    if (this.agents.has(agentType)) {
      logger.warn(`Agent of type ${agentType} already exists, returning existing instance`);
      return this.agents.get(agentType);
    }
    
    logger.info(`Creating agent of type: ${agentType}`);
    
    // Common agent configuration
    const agentConfig = {
      ...this.config,
      communicationManager: this.communicationManager,
      mcpIntegration: this.mcpIntegration,
      learningSystem: this.learningSystem,
      memoryManager: this.memoryManager,
      knowledgeGraphAgent: this.knowledgeGraphAgent,
      conflictExplanation: this.conflictExplanation,
      intelligenceConnector: this.intelligenceConnector,
      recommendationEngine: this.recommendationEngine,
      naturalLanguageInterface: this.naturalLanguageInterface,
      ...config
    };
    
    // Create agent based on type
    let agent;
    
    switch (agentType) {
      case 'master_director':
        agent = new MasterDirectorAgent(agentConfig);
        break;
        
      case 'scheduling_director':
        agent = new SchedulingDirectorAgent(agentConfig);
        break;
        
      case 'operations_director':
        agent = new OperationsDirectorAgent(agentConfig);
        break;
        
      case 'analysis_director':
        agent = new AnalysisDirectorAgent(agentConfig);
        break;
        
      case 'knowledge_graph':
        // Return the existing instance if already initialized
        if (this.knowledgeGraphAgent) {
          agent = this.knowledgeGraphAgent;
        } else {
          agent = new KnowledgeGraphAgent(agentConfig);
          this.knowledgeGraphAgent = agent; // Store for future use
        }
        break;

      case 'intelligence_connector':
        // Return the existing instance if already initialized
        if (this.intelligenceConnector) {
          agent = this.intelligenceConnector;
        } else {
          agent = new HELiiXIntelligenceConnectorAgent(agentConfig);
          this.intelligenceConnector = agent; // Store for future use
        }
        break;

      case 'recommendation_engine':
        // Return the existing instance if already initialized
        if (this.recommendationEngine) {
          agent = this.recommendationEngine;
        } else {
          agent = new C7RecommendationEngine(agentConfig);
          this.recommendationEngine = agent; // Store for future use
        }
        break;

      case 'natural_language_interface':
        // Return the existing instance if already initialized
        if (this.naturalLanguageInterface) {
          agent = this.naturalLanguageInterface;
        } else {
          agent = new C7NaturalLanguageInterface(agentConfig);
          this.naturalLanguageInterface = agent; // Store for future use
        }
        break;
        
      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }
    
    // Store the created agent
    this.agents.set(agentType, agent);
    
    return agent;
  }
  
  /**
   * Get an existing agent by type
   * 
   * @param {string} agentType - Type of agent to retrieve
   * @returns {Object|null} Agent instance or null if not found
   */
  getAgent(agentType) {
    return this.agents.get(agentType) || null;
  }
  
  /**
   * Create all core agent types
   * 
   * @returns {Object} Map of created agents
   */
  createCoreAgents() {
    // Create the core agent types
    this.createAgent('master_director');
    this.createAgent('scheduling_director');
    this.createAgent('operations_director');
    this.createAgent('analysis_director');
    
    // Create enhanced agents if enabled
    if (this.config.enableKnowledgeGraph) {
      this.createAgent('knowledge_graph');
    }

    if (this.config.enableIntelligenceEngine) {
      this.createAgent('intelligence_connector');
    }

    if (this.config.enableC7Recommendations) {
      this.createAgent('recommendation_engine');
    }

    if (this.config.enableNaturalLanguage) {
      this.createAgent('natural_language_interface');
    }
    
    return this.agents;
  }
  
  /**
   * Get all enhanced components for API integration
   * 
   * @returns {Object} Enhanced components
   */
  getEnhancedComponents() {
    return {
      knowledgeGraphAgent: this.knowledgeGraphAgent,
      conflictExplanation: this.conflictExplanation,
      intelligenceConnector: this.intelligenceConnector,
      recommendationEngine: this.recommendationEngine,
      naturalLanguageInterface: this.naturalLanguageInterface
    };
  }
  
  /**
   * Shutdown agent factory and all created agents
   * 
   * @returns {Promise<boolean>} Whether shutdown was successful
   */
  async shutdown() {
    try {
      logger.info('Shutting down Agent Factory');
      
      // Shutdown all agents in reverse creation order
      const agentEntries = [...this.agents.entries()].reverse();
      
      for (const [agentType, agent] of agentEntries) {
        try {
          if (typeof agent.shutdown === 'function') {
            logger.info(`Shutting down agent: ${agentType}`);
            await agent.shutdown();
            logger.info(`Agent ${agentType} shutdown successfully`);
          }
        } catch (error) {
          logger.error(`Failed to shutdown agent ${agentType}: ${error.message}`);
        }
      }
      
      // Shutdown enhanced components not registered as agents

      // Natural Language Interface
      if (this.naturalLanguageInterface && !this.agents.has('natural_language_interface')) {
        await this.naturalLanguageInterface.shutdown();
        logger.info('Natural Language Interface shut down successfully');
      }

      // Recommendation Engine
      if (this.recommendationEngine && !this.agents.has('recommendation_engine')) {
        await this.recommendationEngine.shutdown();
        logger.info('Recommendation Engine shut down successfully');
      }

      // Intelligence Connector
      if (this.intelligenceConnector && !this.agents.has('intelligence_connector')) {
        await this.intelligenceConnector.stop();
        logger.info('HELiiX Intelligence Connector Agent shut down successfully');
      }

      // Conflict Explanation
      if (this.conflictExplanation) {
        await this.conflictExplanation.shutdown();
        logger.info('Conflict Explanation module shut down successfully');
      }

      // Knowledge Graph Agent
      if (this.knowledgeGraphAgent && !this.agents.has('knowledge_graph')) {
        await this.knowledgeGraphAgent.shutdown();
        logger.info('Knowledge Graph Agent shut down successfully');
      }
      
      // Shutdown support systems
      if (this.communicationManager) {
        this.communicationManager.stop();
        logger.info('Communication Manager stopped');
      }
      
      if (this.mcpIntegration) {
        await this.mcpIntegration.shutdown();
        logger.info('MCP integration shut down successfully');
      }
      
      if (this.learningSystem) {
        await this.learningSystem.shutdown();
        logger.info('Learning System shut down successfully');
      }
      
      if (this.memoryManager) {
        await this.memoryManager.disconnect();
        logger.info('Memory Manager disconnected successfully');
      }
      
      this.agents.clear();
      
      logger.info('Agent Factory shutdown complete');
      return true;
    } catch (error) {
      logger.error(`Failed to shutdown Agent Factory: ${error.message}`);
      return false;
    }
  }
}

module.exports = AgentFactory;
