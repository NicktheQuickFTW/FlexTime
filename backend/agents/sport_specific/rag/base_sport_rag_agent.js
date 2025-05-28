/**
 * Base Sport-Specific RAG Agent
 * 
 * This class extends the School Data RAG Agent with sport-specific capabilities.
 * It provides the foundation for sport-specific RAG agents.
 */

const Agent = require('../../agent');
const SchoolDataAgent = require('../../rag/school_data_agent');
const path = require('path');
const logger = require('../../../utils/logger');
const AIAdapter = require('../../../adapters/ai-adapter');

class BaseSportRagAgent extends Agent {
  /**
   * Create a new sport-specific RAG agent
   * 
   * @param {Object} config - Configuration options
   * @param {Object} mcpConnector - MCP connector for model interactions
   */
  constructor(sportCode, sportName, config, mcpConnector) {
    super(`${sportCode.toLowerCase()}_rag`, 'rag', mcpConnector);
    
    this.sportCode = sportCode;
    this.sportName = sportName;
    this.config = config;
    
    // Initialize the base RAG engine
    this.ragEngine = new SchoolDataAgent({
      dataDirectory: config.dataDirectory || path.join(__dirname, `../../../data/${sportCode.toLowerCase()}`),
      cacheExpiration: config.cacheExpiration || 24 * 60 * 60 * 1000,
      modelName: config.modelName || 'claude-3-sonnet-20240229',
      embeddingModel: config.embeddingModel || 'text-embedding-ada-002',
      searchResultLimit: config.searchResultLimit || 15,
    });
    
    this.ai = new AIAdapter();
    
    // Sport-specific data sources
    this.dataSources = config.dataSources || [
      {
        name: `${sportName} Statistics`,
        type: 'statistics',
        url: null
      },
      {
        name: `${sportName} Rankings`,
        type: 'rankings',
        url: null
      },
      {
        name: `${sportName} Schedules`,
        type: 'schedules',
        url: null
      },
      {
        name: `${sportName} Teams`,
        type: 'teams',
        url: null
      }
    ];
    
    // Sport-specific knowledge schema
    this.knowledgeSchema = {
      rules: {
        description: `Official rules of ${sportName}`,
        source: null
      },
      constraints: {
        description: `Standard scheduling constraints for ${sportName}`,
        source: null
      },
      bestPractices: {
        description: `Best practices for ${sportName} scheduling`,
        source: null
      },
      seasonStructure: {
        description: `Typical season structure for ${sportName}`,
        source: null
      }
    };
    
    logger.info(`${sportName} RAG Agent (${sportCode}) initialized`);
  }
  
  /**
   * Initialize the agent with sport-specific data
   * 
   * @param {Array<Object>} schools - List of schools to initialize
   * @returns {Promise<boolean>} Success indicator
   */
  async initialize(schools) {
    try {
      // Initialize the base RAG engine
      await this.ragEngine.initialize(schools);
      
      // Load sport-specific knowledge
      await this.loadSportKnowledge();
      
      // Start the agent
      await super.start();
      
      logger.info(`${this.sportName} RAG Agent initialized with ${schools.length} schools`);
      return true;
    } catch (error) {
      logger.error(`Error initializing ${this.sportName} RAG Agent: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Load sport-specific knowledge
   * 
   * @returns {Promise<void>}
   */
  async loadSportKnowledge() {
    // To be implemented by sport-specific subclasses
    logger.info(`Base sport knowledge loader called for ${this.sportName}`);
  }
  
  /**
   * Query the RAG agent
   * 
   * @param {string} query - Natural language query
   * @param {Array<string>} schoolIds - School IDs to query (optional)
   * @param {string} dataType - Data type to query (optional)
   * @returns {Promise<Object>} Query results
   */
  async query(query, schoolIds = [], dataType = null) {
    try {
      // Enhance the query with sport-specific context
      const enhancedQuery = await this.enhanceQuery(query);
      
      // Process the query using the RAG engine
      const result = await this.ragEngine.query(enhancedQuery, schoolIds, dataType);
      
      // Post-process the result with sport-specific insights
      const enhancedResult = await this.enhanceResult(result, query);
      
      return enhancedResult;
    } catch (error) {
      logger.error(`Error querying ${this.sportName} RAG Agent: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Enhance a query with sport-specific context
   * 
   * @param {string} query - Original query
   * @returns {Promise<string>} Enhanced query
   */
  async enhanceQuery(query) {
    try {
      // Apply sport-specific query enhancement to ensure we get the most relevant results
      const systemPrompt = `You are a specialized assistant for ${this.sportName}. You'll receive a question about ${this.sportName} that needs to be enhanced for a RAG system.
      
      Rewrite the question to:
      1. Include any implied ${this.sportName}-specific terminology
      2. Expand abbreviations common in ${this.sportName}
      3. Add context about ${this.sportName} rules, structure, or season if relevant
      4. Clarify ambiguous terms in the context of ${this.sportName}
      
      Important: Your task is just to rewrite the question in a way that will help a RAG system find the most relevant information. Don't answer the question itself.
      Return only the enhanced query without explanations or additional text.`;
      
      const userPrompt = `Original query: "${query}"
      
      Enhance this query for a ${this.sportName} RAG system, making it more specific to ${this.sportName} and adding relevant context.`;
      
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];
      
      const enhancedQuery = await this.ai.generateText(messages, {
        temperature: 0.3,
        max_tokens: 200
      });
      
      // Clean up and return the enhanced query
      return enhancedQuery.trim();
    } catch (error) {
      logger.error(`Error enhancing query: ${error.message}`);
      // Fall back to the original query in case of error
      return query;
    }
  }
  
  /**
   * Enhance a RAG result with sport-specific insights
   * 
   * @param {Object} result - Original RAG result
   * @param {string} originalQuery - Original user query
   * @returns {Promise<Object>} Enhanced result
   */
  async enhanceResult(result, originalQuery) {
    try {
      // Apply sport-specific post-processing to the RAG response
      const systemPrompt = `You are a specialized assistant for ${this.sportName}. You'll receive a RAG response about ${this.sportName} and need to enhance it with sport-specific insights.
      
      Enhance the response by:
      1. Adding any relevant ${this.sportName}-specific context that's missing
      2. Correcting any information that doesn't align with ${this.sportName} rules or norms
      3. Adding sport-specific insights when helpful
      4. Ensuring the terminology is accurate for ${this.sportName}
      
      Important: Your task is to enhance the response while staying factual. Don't completely rewrite it if it's already accurate.
      Maintain the original format and structure, but enrich the content.`;
      
      const userPrompt = `Original query: "${originalQuery}"
      
      RAG Response: "${result.response}"
      
      Enhance this response with ${this.sportName}-specific insights and accuracy checks.`;
      
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];
      
      const enhancedResponse = await this.ai.generateText(messages, {
        temperature: 0.4,
        max_tokens: 1500
      });
      
      // Return the enhanced result
      return {
        ...result,
        response: enhancedResponse.trim(),
        enhanced: true
      };
    } catch (error) {
      logger.error(`Error enhancing result: ${error.message}`);
      // Fall back to the original result in case of error
      return result;
    }
  }
  
  /**
   * Update sport-specific data
   * 
   * @param {string} dataType - Type of data to update
   * @param {string} source - Data source URL or identifier
   * @returns {Promise<boolean>} Success indicator
   */
  async updateSportData(dataType, source) {
    try {
      logger.info(`Updating ${this.sportName} ${dataType} data from ${source}`);
      
      // Specific implementation would be provided by child classes
      // This base implementation just logs the request
      
      logger.info(`Placeholder: ${this.sportName} ${dataType} data updated`);
      return true;
    } catch (error) {
      logger.error(`Error updating ${this.sportName} data: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Process a task (Agent base class implementation).
   * 
   * @param {object} task - The task to process
   * @returns {Promise<any>} Task result
   * @private
   */
  async _processTask(task) {
    logger.info(`Processing task ${task.taskId}: ${task.description}`);
    
    switch (task.taskType) {
      case 'query':
        return await this.query(
          task.parameters.query,
          task.parameters.schoolIds,
          task.parameters.dataType
        );
      
      case 'update_data':
        return await this.updateSportData(
          task.parameters.dataType,
          task.parameters.source
        );
      
      case 'initialize':
        return await this.initialize(task.parameters.schools);
      
      default:
        throw new Error(`Unknown task type: ${task.taskType}`);
    }
  }
  
  /**
   * Process a message.
   * 
   * @param {object} message - The message to process
   * @private
   */
  _processMessage(message) {
    if (message.messageType === 'query') {
      const task = this.createTask(
        'query',
        `Query ${this.sportName} data: ${message.content.query}`,
        {
          query: message.content.query,
          schoolIds: message.content.schoolIds,
          dataType: message.content.dataType
        }
      );
      
      this.submitTask(task);
      
      // Log the query for debugging
      logger.info(`Received query for ${this.sportName}: ${message.content.query}`);
    } else {
      super._processMessage(message);
    }
  }
  
  /**
   * Stop the agent and clean up resources
   */
  async stop() {
    logger.info(`Stopping ${this.sportName} RAG Agent`);
    
    // Any cleanup needed
    
    await super.stop();
  }
}

module.exports = BaseSportRagAgent;