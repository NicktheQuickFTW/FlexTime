/**
 * AI Services Configuration
 * 
 * This file contains configuration for OpenAI, Anthropic, and other AI services
 * used by the FlexTime backend. Values are loaded from environment variables.
 */

const modelConfig = {
  // OpenAI Models
  openai: {
    embedding: {
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
      dimensions: 1536,
      apiKey: process.env.OPENAI_API_KEY,
      maxInputTokens: 8191,
    },
    chat: {
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY,
      maxOutputTokens: 4096,
      temperature: 0.7,
    }
  },
  
  // Anthropic Models
  anthropic: {
    chat: {
      model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxOutputTokens: 4096,
      temperature: 0.7,
    }
  },
  
  // Local (mock) Models
  local: {
    embedding: {
      dimensions: 1536,
      maxInputTokens: 8191,
    },
    chat: {
      maxOutputTokens: 4096,
      temperature: 0.7,
    }
  },
  
  // Active model provider configuration - set based on environment variables
  active: {
    embedding: process.env.ACTIVE_EMBEDDING_PROVIDER || 'openai',
    chat: process.env.ACTIVE_CHAT_PROVIDER || 'anthropic',
  }
};

module.exports = modelConfig;