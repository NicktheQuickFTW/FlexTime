/**
 * AI Adapter
 * 
 * Provides a unified interface for interacting with different AI services
 * including OpenAI, Anthropic, and local/mock providers.
 */

// Mock imports - real providers commented out
// const { OpenAI } = require('openai');
// const { Anthropic } = require('anthropic');

// Mock provider objects
const OpenAI = function() {
  return {
    embeddings: {
      create: async () => ({ data: [{ embedding: [0.1, 0.2, 0.3] }] })
    },
    chat: {
      completions: {
        create: async () => ({ choices: [{ message: { content: "This is a mock response" } }] })
      }
    }
  };
};

const Anthropic = function() {
  return {
    messages: {
      create: async () => ({ content: [{ text: "This is a mock Claude response" }] })
    }
  };
};
const modelConfig = require('../../config/ai-services');
const logger = require('../scripts/logger");

class AIAdapter {
  constructor(options = {}) {
    this.options = {
      // Default to configured providers
      embeddingProvider: modelConfig.active.embedding,
      chatProvider: modelConfig.active.chat,
      ...options
    };
    
    // Initialize providers
    this.initializeProviders();
    
    logger.info(`AI Adapter initialized with embedding: ${this.options.embeddingProvider}, chat: ${this.options.chatProvider}`);
  }
  
  /**
   * Initialize AI providers based on configuration
   */
  initializeProviders() {
    // Initialize OpenAI if needed
    if (this.options.embeddingProvider === 'openai' || this.options.chatProvider === 'openai') {
      if (!modelConfig.openai.chat.apiKey) {
        logger.warn('OpenAI API key not found. Using fallback provider.');
        this.options.embeddingProvider = this.options.embeddingProvider === 'openai' ? 'local' : this.options.embeddingProvider;
        this.options.chatProvider = this.options.chatProvider === 'openai' ? 'local' : this.options.chatProvider;
      } else {
        this.openai = new OpenAI({
          apiKey: modelConfig.openai.chat.apiKey
        });
      }
    }
    
    // Initialize Anthropic if needed
    if (this.options.chatProvider === 'anthropic') {
      if (!modelConfig.anthropic.chat.apiKey) {
        logger.warn('Anthropic API key not found. Using fallback provider.');
        this.options.chatProvider = 'local';
      } else {
        this.anthropic = new Anthropic({
          apiKey: modelConfig.anthropic.chat.apiKey
        });
      }
    }
    
    // Always initialize local provider as fallback
    this.local = {
      ready: true
    };
  }
  
  /**
   * Get text embedding vector
   * @param {string} text - Text to embed
   * @returns {Promise<Array<number>>} Embedding vector
   */
  async getEmbedding(text) {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
      }
      
      // Truncate text if needed
      const provider = this.options.embeddingProvider;
      const config = modelConfig[provider]?.embedding;
      
      if (!config) {
        throw new Error(`Invalid embedding provider: ${provider}`);
      }
      
      // Truncate if longer than max tokens
      const truncatedText = text.substring(0, Math.min(text.length, config.maxInputTokens * 4));
      
      switch (provider) {
        case 'openai':
          const response = await this.openai.embeddings.create({
            model: config.model,
            input: truncatedText
          });
          return response.data[0].embedding;
          
        case 'local':
        default:
          return this._mockEmbedding(truncatedText, config.dimensions);
      }
    } catch (error) {
      logger.error(`Error getting embedding: ${error.message}`);
      
      // Fallback to local if API error
      if (this.options.embeddingProvider !== 'local') {
        logger.info('Falling back to local embedding provider');
        const localConfig = modelConfig.local.embedding;
        return this._mockEmbedding(text.substring(0, Math.min(text.length, localConfig.maxInputTokens * 4)), localConfig.dimensions);
      }
      
      throw error;
    }
  }
  
  /**
   * Generate text response from prompt
   * @param {string|Array} messages - Prompt messages
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Generated text
   */
  async generateText(messages, options = {}) {
    try {
      if (!messages) {
        throw new Error('Invalid input: messages must be provided');
      }
      
      // Format messages if string
      let formattedMessages;
      if (typeof messages === 'string') {
        formattedMessages = [{ role: 'user', content: messages }];
      } else {
        formattedMessages = messages;
      }
      
      const provider = this.options.chatProvider;
      const config = modelConfig[provider]?.chat;
      
      if (!config) {
        throw new Error(`Invalid chat provider: ${provider}`);
      }
      
      // Merge with defaults
      const genOptions = {
        temperature: config.temperature,
        max_tokens: config.maxOutputTokens,
        ...options
      };
      
      switch (provider) {
        case 'openai':
          const openaiResponse = await this.openai.chat.completions.create({
            model: config.model,
            messages: formattedMessages,
            temperature: genOptions.temperature,
            max_tokens: genOptions.max_tokens
          });
          return openaiResponse.choices[0].message.content;
          
        case 'anthropic':
          // Convert messages to Anthropic format
          const anthropicMessages = formattedMessages.map(msg => {
            if (msg.role === 'system') {
              return { role: 'user', content: `<system>${msg.content}</system>` };
            }
            return msg;
          });
          
          const anthropicResponse = await this.anthropic.messages.create({
            model: config.model,
            messages: anthropicMessages,
            temperature: genOptions.temperature,
            max_tokens: genOptions.max_tokens
          });
          return anthropicResponse.content[0].text;
          
        case 'local':
        default:
          return this._mockGenerateText(formattedMessages);
      }
    } catch (error) {
      logger.error(`Error generating text: ${error.message}`);
      
      // Fallback to local if API error
      if (this.options.chatProvider !== 'local') {
        logger.info('Falling back to local chat provider');
        return this._mockGenerateText(
          typeof messages === 'string' ? [{ role: 'user', content: messages }] : messages
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Generate a deterministic mock embedding
   * @param {string} text - Input text
   * @param {number} dimensions - Embedding dimensions
   * @returns {Array<number>} Embedding vector
   * @private
   */
  _mockEmbedding(text, dimensions = 1536) {
    // Create a deterministic but reasonably varied vector
    const vector = [];
    let hash = 0;
    
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }
    
    // Generate embedding vector
    for (let i = 0; i < dimensions; i++) {
      // Generate a somewhat random but deterministic value between -1 and 1
      const value = Math.sin(hash + i) / 2;
      vector.push(value);
    }
    
    // Normalize the vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    const normalized = vector.map(val => val / magnitude);
    
    return normalized;
  }
  
  /**
   * Generate mock text response
   * @param {Array} messages - Input messages
   * @returns {string} Generated text
   * @private
   */
  _mockGenerateText(messages) {
    // Extract the last message content for simple response generation
    const lastMessage = messages[messages.length - 1];
    const query = lastMessage.content;
    
    // Simple mock responses based on query content
    if (query.toLowerCase().includes('schedule')) {
      return 'The schedule includes 20 games starting in November and ending in March. There are 10 home games and 10 away games, with conference play beginning in December.';
    } else if (query.toLowerCase().includes('constraint')) {
      return 'There are several constraints including: no games during final exams (Dec 10-20), venue unavailability on specific dates, and a preference for no more than 2 consecutive away games.';
    } else if (query.toLowerCase().includes('venue') || query.toLowerCase().includes('arena')) {
      return 'The primary venue is Memorial Arena with a capacity of 15,000. It has a hardwood surface and is occasionally unavailable for other events, primarily on weekends.';
    } else if (query.toLowerCase().includes('prefer')) {
      return 'Scheduling preferences include: Friday and Saturday game days, evening start times (7:00pm or 8:00pm), avoiding Sunday and Monday games, and evenly distributed home games throughout the season.';
    } else {
      return `I've analyzed the available data related to your query "${query}" and found limited information. Please try a more specific question about schedules, venues, constraints, or preferences.`;
    }
  }
}

module.exports = AIAdapter;